// Sama Link lightweight reports route — ADR-046.
//
// Generates simple, operator-friendly views on top of Medusa's admin
// endpoints WITHOUT replacing Medusa's own native reports (which live at
// /app/settings etc). Two reports today:
//
//   1. Sales by day   — bucket the last N days of orders by created date
//   2. Inventory health — count variants at / under threshold
//
// All computation happens client-side over the last ~200 orders / products.
// This keeps the surface dependency-free and avoids writing custom API
// handlers (which would need their own auth + rate-limit story). For
// heavier reporting we'll wire a proper workflow in Phase 7 (BACK-9).
//
// Export: a CSV download that mirrors what's visible in the table so the
// operator can hand-off to finance / ops without screenshots.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BrandShell,
  PageHeader,
  BrandSection,
  MetricTile,
  StatusChip,
  EmptyState,
  BrandButton,
} from "../../components"
import {
  listOrders,
  listProducts,
  type AdminOrderLite,
  type AdminProductLite,
} from "../../lib/admin-api"
import { formatInt, formatMoney, formatDate } from "../../lib/format"

const DAY_RANGE_OPTIONS = [7, 14, 30] as const
type DayRange = (typeof DAY_RANGE_OPTIONS)[number]

type ReportsState = {
  loading: boolean
  error: string | null
  orders: AdminOrderLite[]
  products: AdminProductLite[]
}

const INITIAL_STATE: ReportsState = {
  loading: true,
  error: null,
  orders: [],
  products: [],
}

/** Returns the start-of-day (local) date for `daysAgo` days ago. */
function startOfDayNDaysAgo(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d
}

/** yyyy-mm-dd key for bucketing. */
function dayKey(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function downloadCsv(filename: string, rows: string[][]) {
  // RFC 4180-ish — quote cells containing comma / quote / newline.
  const escape = (v: string): string => {
    if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
    return v
  }
  const csv = rows.map((r) => r.map(escape).join(",")).join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const SamaReportsPage = () => {
  const [state, setState] = useState<ReportsState>(INITIAL_STATE)
  const [days, setDays] = useState<DayRange>(14)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async (signal: AbortSignal) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const [ordersRes, productsRes] = await Promise.all([
        listOrders(200, 0, signal),
        listProducts(200, 0, signal),
      ])
      setState({
        loading: false,
        error: null,
        orders: ordersRes.orders,
        products: productsRes.products,
      })
    } catch (e) {
      if (signal.aborted) return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load reports.",
      }))
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    void load(ac.signal)
    return () => ac.abort()
  }, [load, refreshKey])

  /* ── Sales by day ──────────────────────────────────────────── */
  const salesByDay = useMemo(() => {
    const cutoff = startOfDayNDaysAgo(days - 1).getTime()
    const buckets = new Map<string, { count: number; total: number; currency: string | null }>()

    // Pre-fill bucket keys for every day in range so zero-days render too.
    for (let i = 0; i < days; i++) {
      const d = startOfDayNDaysAgo(days - 1 - i)
      const k = dayKey(d.toISOString())
      if (k) buckets.set(k, { count: 0, total: 0, currency: null })
    }

    for (const o of state.orders) {
      const created = o.created_at
      if (!created) continue
      const t = new Date(created).getTime()
      if (!Number.isFinite(t) || t < cutoff) continue
      const k = dayKey(created)
      if (!k) continue
      const b = buckets.get(k) ?? { count: 0, total: 0, currency: null }
      b.count += 1
      b.total += typeof o.total === "number" ? o.total : 0
      if (!b.currency && o.currency_code) b.currency = o.currency_code
      buckets.set(k, b)
    }

    return Array.from(buckets.entries()).map(([day, v]) => ({ day, ...v }))
  }, [state.orders, days])

  const salesTotals = useMemo(() => {
    let count = 0
    let total = 0
    let currency: string | null = null
    for (const row of salesByDay) {
      count += row.count
      total += row.total
      if (!currency && row.currency) currency = row.currency
    }
    const peak = salesByDay.reduce<{ day: string; count: number } | null>(
      (acc, row) => (acc == null || row.count > acc.count ? row : acc),
      null
    )
    return { count, total, currency, peak }
  }, [salesByDay])

  /* ── Inventory health ──────────────────────────────────────── */
  const inventoryHealth = useMemo(() => {
    let managed = 0
    let out = 0
    let low = 0
    let ok = 0
    const rows: Array<{ id: string; title: string; min: number | null }> = []

    for (const p of state.products) {
      const vs = p.variants ?? []
      let productMin: number | null = null
      for (const v of vs) {
        if (v.manage_inventory !== true) continue
        if (typeof v.inventory_quantity !== "number") continue
        managed++
        const q = v.inventory_quantity
        if (q === 0) out++
        else if (q <= 5) low++
        else ok++
        productMin = productMin == null ? q : Math.min(productMin, q)
      }
      if (productMin !== null) {
        rows.push({ id: p.id, title: p.title, min: productMin })
      }
    }

    rows.sort((a, b) => {
      const am = a.min ?? Infinity
      const bm = b.min ?? Infinity
      return am - bm
    })

    return { managed, out, low, ok, rows: rows.slice(0, 10) }
  }, [state.products])

  const exportSalesCsv = () => {
    const rows: string[][] = [
      ["date", "orders", "total", "currency"],
      ...salesByDay.map((r) => [
        r.day,
        String(r.count),
        r.total.toFixed(2),
        r.currency ?? "",
      ]),
    ]
    downloadCsv(`sama-sales-last-${days}-days.csv`, rows)
  }

  const exportInventoryCsv = () => {
    const rows: string[][] = [
      ["product_id", "title", "minimum_variant_stock"],
      ...inventoryHealth.rows.map((r) => [
        r.id,
        r.title,
        r.min == null ? "" : String(r.min),
      ]),
    ]
    downloadCsv("sama-inventory-low-stock.csv", rows)
  }

  const showSalesSkeleton = state.loading && salesByDay.every((r) => r.count === 0 && r.total === 0)
  const showInventorySkeleton = state.loading && inventoryHealth.rows.length === 0

  return (
    <BrandShell as="page">
      <PageHeader
        eyebrow="Sama Link · Reports"
        title="Lightweight reports"
        subtitle="Client-side summaries on top of the last 200 orders / products. For heavy analytics, wire a dedicated workflow (Phase 7 · BACK-9)."
        actions={
          <>
            <select
              className="sl-select"
              style={{ width: 140 }}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) as DayRange)}
              aria-label="Date range"
            >
              {DAY_RANGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  Last {n} days
                </option>
              ))}
            </select>
            <BrandButton
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={state.loading}
            >
              {state.loading ? "Refreshing…" : "Refresh"}
            </BrandButton>
          </>
        }
      />

      {state.error ? (
        <div className="sl-note sl-note-error" style={{ marginBottom: 16 }}>
          <strong style={{ color: "var(--sl-error)" }}>Failed:</strong> {state.error}
        </div>
      ) : null}

      {/* ── Sales by day ─────────────────────────────────────── */}
      <BrandSection
        title={`Sales · last ${days} days`}
        subtitle="Orders are bucketed by their created_at timestamp (server time). Currency shown matches the first non-empty currency across the range."
        actions={
          <BrandButton
            variant="ghost"
            size="sm"
            onClick={exportSalesCsv}
            disabled={state.loading}
          >
            Export CSV
          </BrandButton>
        }
      >
        <div className="sl-grid sl-grid-3" style={{ marginBottom: 14 }}>
          <MetricTile
            label="Orders"
            value={showSalesSkeleton ? "—" : formatInt(salesTotals.count)}
            foot={`Across ${days} days`}
          />
          <MetricTile
            label="Revenue"
            value={
              showSalesSkeleton
                ? "—"
                : formatMoney(salesTotals.total, salesTotals.currency)
            }
            foot="Sum of order totals"
          />
          <MetricTile
            label="Peak day"
            value={salesTotals.peak?.day ?? "—"}
            foot={
              salesTotals.peak
                ? `${salesTotals.peak.count} order${salesTotals.peak.count === 1 ? "" : "s"}`
                : "No orders in range"
            }
            muted
          />
        </div>

        {showSalesSkeleton ? (
          <div
            className="sl-skeleton"
            style={{ height: 180, borderRadius: 10 }}
          />
        ) : (
          <div className="sl-table-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th style={{ textAlign: "end" }}>Orders</th>
                  <th style={{ textAlign: "end" }}>Revenue</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {salesByDay.map((row) => {
                  const pct =
                    salesTotals.peak && salesTotals.peak.count > 0
                      ? Math.round((row.count / salesTotals.peak.count) * 100)
                      : 0
                  return (
                    <tr key={row.day}>
                      <td>
                        <span className="sl-mono">{row.day}</span>{" "}
                        <span className="sl-muted" style={{ fontSize: 11 }}>
                          {formatDate(new Date(row.day).toISOString())}
                        </span>
                      </td>
                      <td style={{ textAlign: "end" }}>{formatInt(row.count)}</td>
                      <td style={{ textAlign: "end" }}>
                        {formatMoney(row.total, row.currency)}
                      </td>
                      <td>
                        <div
                          aria-hidden
                          style={{
                            height: 8,
                            borderRadius: 9999,
                            background: "var(--sl-surface-subtle)",
                            border: "1px solid var(--sl-border)",
                            overflow: "hidden",
                            width: 160,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: "var(--sl-brand)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </BrandSection>

      {/* ── Inventory health ─────────────────────────────────── */}
      <BrandSection
        title="Inventory health"
        subtitle="Counts across the 200 most-recent products. Only variants with manage_inventory=true are considered."
        actions={
          <BrandButton
            variant="ghost"
            size="sm"
            onClick={exportInventoryCsv}
            disabled={state.loading || inventoryHealth.rows.length === 0}
          >
            Export CSV
          </BrandButton>
        }
      >
        <div className="sl-grid sl-grid-4" style={{ marginBottom: 14 }}>
          <MetricTile
            label="Managed variants"
            value={showInventorySkeleton ? "—" : formatInt(inventoryHealth.managed)}
            foot="Inventory tracked"
          />
          <MetricTile
            label="Out of stock"
            value={showInventorySkeleton ? "—" : formatInt(inventoryHealth.out)}
            foot="0 units on hand"
          />
          <MetricTile
            label="Low (≤ 5)"
            value={showInventorySkeleton ? "—" : formatInt(inventoryHealth.low)}
            foot="Needs restocking soon"
          />
          <MetricTile
            label="Healthy"
            value={showInventorySkeleton ? "—" : formatInt(inventoryHealth.ok)}
            foot="> 5 units on hand"
            muted
          />
        </div>

        {showInventorySkeleton ? (
          <div
            className="sl-skeleton"
            style={{ height: 180, borderRadius: 10 }}
          />
        ) : inventoryHealth.rows.length === 0 ? (
          <EmptyState
            title="No managed inventory"
            description="No product variant in the current window has managed inventory enabled."
          />
        ) : (
          <div className="sl-table-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "end" }}>Min stock</th>
                  <th>Status</th>
                  <th style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {inventoryHealth.rows.map((r) => {
                  const tone =
                    r.min == null
                      ? "neutral"
                      : r.min === 0
                        ? "error"
                        : r.min <= 5
                          ? "warning"
                          : "success"
                  const label =
                    r.min == null
                      ? "unknown"
                      : r.min === 0
                        ? "out of stock"
                        : r.min <= 5
                          ? "low"
                          : "ok"
                  return (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td style={{ textAlign: "end" }} className="sl-mono">
                        {r.min ?? "—"}
                      </td>
                      <td>
                        <StatusChip tone={tone}>{label}</StatusChip>
                      </td>
                      <td>
                        <BrandButton
                          variant="ghost"
                          size="sm"
                          as="a"
                          href={`/app/products/${r.id}`}
                        >
                          Open
                        </BrandButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </BrandSection>

      <div className="sl-note" style={{ marginTop: 8 }}>
        <strong>Scope:</strong> a quick snapshot based on the 200 most
        recent orders / products / customers when this page loaded. Useful
        for merchant-level checks — not a substitute for finance reporting.
      </div>
    </BrandShell>
  )
}

const ReportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="7" y1="15" x2="7" y2="18" />
    <line x1="12" y1="11" x2="12" y2="18" />
    <line x1="17" y1="7" x2="17" y2="18" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Sama Reports",
  icon: ReportIcon,
  // Nest under the Sama Dashboard so the sidebar reads
  //   Sama Dashboard
  //     └─ Sama Reports
  // keeping all operator analytics under one top-level entry.
  nested: "/sama-dashboard",
})

export default SamaReportsPage
