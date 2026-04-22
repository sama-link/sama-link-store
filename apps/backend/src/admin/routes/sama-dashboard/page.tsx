// Sama Link operational dashboard — ADR-046.
//
// A branded, at-a-glance overview of the storefront's current state for the
// operator. All data is READ-ONLY; every mutation still goes through the
// native Medusa pages. The dashboard is the merchant's landing surface when
// they open the admin — deep links on each card take them to the native
// Medusa route that owns the underlying entity.
//
// Endpoints consumed (via lib/admin-api.ts):
//   - GET /admin/orders   (latest, with totals + addresses)
//   - GET /admin/products (stock health slice)
//   - GET /admin/customers (new-signups count)
//
// Failure modes: any endpoint can return 401/5xx — we surface the specific
// error per card rather than blocking the page. Empty datasets render an
// EmptyState instead of silent zeros.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useCallback, useEffect, useState } from "react"
import {
  BrandShell,
  PageHeader,
  BrandSection,
  BrandCard,
  MetricTile,
  StatusChip,
  EmptyState,
  BrandButton,
  toneForStatus,
} from "../../components"
import {
  listCustomers,
  listOrders,
  listProducts,
  sumRevenue,
  type AdminOrderLite,
  type AdminProductLite,
} from "../../lib/admin-api"
import { formatInt, formatMoney, relativeTime, truncate } from "../../lib/format"

/** Tile showing a count + subtle description. */
type DashboardState = {
  loading: boolean
  error: string | null
  orders: AdminOrderLite[]
  lowStock: AdminProductLite[]
  newCustomersCount: number
  todayOrdersCount: number
  todayRevenue: { total: number; currency: string | null }
}

const INITIAL_STATE: DashboardState = {
  loading: true,
  error: null,
  orders: [],
  lowStock: [],
  newCustomersCount: 0,
  todayOrdersCount: 0,
  todayRevenue: { total: 0, currency: null },
}

function isSameDay(iso: string | null | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const LOW_STOCK_THRESHOLD = 5

const SamaDashboardPage = () => {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async (signal: AbortSignal) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        listOrders(20, 0, signal),
        listProducts(50, 0, signal),
        listCustomers(1, 0, signal),
      ])

      const orders = ordersRes.orders
      const today = orders.filter((o) => isSameDay(o.created_at))
      const revenue = sumRevenue(today)

      const lowStock = productsRes.products.filter((p) => {
        const v = p.variants ?? []
        return v.some(
          (x) =>
            x.manage_inventory === true &&
            typeof x.inventory_quantity === "number" &&
            x.inventory_quantity <= LOW_STOCK_THRESHOLD
        )
      })

      setState({
        loading: false,
        error: null,
        orders: orders.slice(0, 10),
        lowStock: lowStock.slice(0, 6),
        newCustomersCount: customersRes.count,
        todayOrdersCount: today.length,
        todayRevenue: revenue,
      })
    } catch (e) {
      if (signal.aborted) return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load dashboard data.",
      }))
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    void load(ac.signal)
    return () => ac.abort()
  }, [load, refreshKey])

  const refresh = () => setRefreshKey((k) => k + 1)

  const showLoadingSkeleton = state.loading && state.orders.length === 0

  return (
    <BrandShell as="page">
      <PageHeader
        eyebrow="Sama Link · Operations"
        title="Storefront dashboard"
        subtitle="A live snapshot of the storefront. All numbers are derived from the native admin endpoints — the dashboard never writes back."
        actions={
          <>
            <BrandButton
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={state.loading}
              leading={<RefreshIcon spinning={state.loading} />}
            >
              {state.loading ? "Refreshing…" : "Refresh"}
            </BrandButton>
            <BrandButton variant="primary" size="sm" as="a" href="/app/orders">
              Open orders
            </BrandButton>
          </>
        }
      />

      {state.error ? (
        <div className="sl-note sl-note-error" style={{ marginBottom: 16 }}>
          <strong style={{ color: "var(--sl-error)" }}>Failed to load dashboard:</strong>{" "}
          {state.error}
        </div>
      ) : null}

      {/* ── KPIs ────────────────────────────────────────────────── */}
      <BrandSection
        title="Today at a glance"
        subtitle="Orders and revenue are filtered to today's calendar date (server time). Low-stock and customers are global."
      >
        <div className="sl-grid sl-grid-4">
          <MetricTile
            label="Orders today"
            value={showLoadingSkeleton ? "—" : formatInt(state.todayOrdersCount)}
            foot={showLoadingSkeleton ? "Loading…" : "From the last 20 orders"}
          />
          <MetricTile
            label="Revenue today"
            value={
              showLoadingSkeleton
                ? "—"
                : formatMoney(state.todayRevenue.total, state.todayRevenue.currency)
            }
            foot={showLoadingSkeleton ? "Loading…" : "Sum of today's order totals"}
          />
          <MetricTile
            label="Low-stock variants"
            value={showLoadingSkeleton ? "—" : formatInt(state.lowStock.length)}
            foot={`≤ ${LOW_STOCK_THRESHOLD} units across managed variants`}
          />
          <MetricTile
            label="Customers total"
            value={showLoadingSkeleton ? "—" : formatInt(state.newCustomersCount)}
            foot="Count reported by /admin/customers"
            muted
          />
        </div>
      </BrandSection>

      <div className="sl-grid sl-grid-2">
        {/* ── Latest orders ───────────────────────────────────── */}
        <BrandSection
          title="Latest orders"
          subtitle="Newest first. Click any row to open it in the native Medusa page."
          actions={
            <BrandButton variant="ghost" size="sm" as="a" href="/app/orders">
              View all
            </BrandButton>
          }
        >
          {showLoadingSkeleton ? (
            <SkeletonRows rows={5} />
          ) : state.orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Once customers start ordering, the 10 most-recent rows appear here."
            />
          ) : (
            <div className="sl-table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {state.orders.map((o) => {
                    const name = [
                      o.customer?.first_name,
                      o.customer?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ")
                    return (
                      <tr
                        key={o.id}
                        onClick={() => {
                          window.location.href = `/app/orders/${o.id}`
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span className="sl-mono">#{o.display_id}</span>
                        </td>
                        <td>{truncate(name || o.email || "—", 28)}</td>
                        <td>{formatMoney(o.total, o.currency_code)}</td>
                        <td>
                          <StatusChip
                            tone={toneForStatus(
                              o.payment_status ?? o.status ?? "pending"
                            )}
                          >
                            {(o.payment_status ?? o.status ?? "—").replace(/_/g, " ")}
                          </StatusChip>
                        </td>
                        <td>
                          <span className="sl-mono sl-muted">
                            {relativeTime(o.created_at)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BrandSection>

        {/* ── Low-stock alerts ────────────────────────────────── */}
        <BrandSection
          title="Low stock"
          subtitle={`Products with at least one variant ≤ ${LOW_STOCK_THRESHOLD} units (managed inventory only).`}
          actions={
            <BrandButton variant="ghost" size="sm" as="a" href="/app/inventory">
              Open inventory
            </BrandButton>
          }
        >
          {showLoadingSkeleton ? (
            <SkeletonRows rows={4} />
          ) : state.lowStock.length === 0 ? (
            <EmptyState
              title="All stocked"
              description={`No product has a variant ≤ ${LOW_STOCK_THRESHOLD} units.`}
            />
          ) : (
            <div className="sl-stack-sm">
              {state.lowStock.map((p) => {
                const min = (p.variants ?? [])
                  .filter(
                    (v) =>
                      v.manage_inventory === true &&
                      typeof v.inventory_quantity === "number"
                  )
                  .reduce<number | null>(
                    (acc, v) =>
                      acc == null
                        ? (v.inventory_quantity as number)
                        : Math.min(acc, v.inventory_quantity as number),
                    null
                  )
                return (
                  <BrandCard
                    key={p.id}
                    compact
                    className="sl-low-stock-row"
                  >
                    <div className="sl-between">
                      <div className="sl-stack-sm" style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {truncate(p.title, 40)}
                        </div>
                        <div className="sl-mono sl-muted" style={{ fontSize: 11 }}>
                          /{p.handle ?? "—"}
                        </div>
                      </div>
                      <div className="sl-row" style={{ gap: 8 }}>
                        <StatusChip
                          tone={min != null && min <= 1 ? "error" : "warning"}
                        >
                          {min == null ? "0" : `${min} left`}
                        </StatusChip>
                        <BrandButton
                          variant="ghost"
                          size="sm"
                          as="a"
                          href={`/app/products/${p.id}`}
                        >
                          Open
                        </BrandButton>
                      </div>
                    </div>
                  </BrandCard>
                )
              })}
            </div>
          )}
        </BrandSection>
      </div>

      {/* ── Quick shortcuts ─────────────────────────────────────── */}
      <BrandSection
        title="Quick actions"
        subtitle="Shortcuts into the native Medusa routes operators use daily."
      >
        <div className="sl-grid sl-grid-3">
          <ShortcutCard
            href="/app/products"
            title="Products"
            description="Catalog, variants, inventory."
          />
          <ShortcutCard
            href="/app/orders"
            title="Orders"
            description="Payments, fulfilment, returns."
          />
          <ShortcutCard
            href="/app/customers"
            title="Customers"
            description="Accounts, groups, contacts."
          />
          <ShortcutCard
            href="/app/product-bulk"
            title="Bulk products"
            description="Delete or audit many at once."
          />
          <ShortcutCard
            href="/app/sama-reports"
            title="Reports"
            description="Sales & catalog snapshots."
          />
          <ShortcutCard
            href="/app/sama-content"
            title="Content library"
            description="Translations + CSV sync status."
          />
        </div>
      </BrandSection>
    </BrandShell>
  )
}

/* ── Helpers ─────────────────────────────────────────────────── */

const SkeletonRows = ({ rows }: { rows: number }) => (
  <div className="sl-stack-sm">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="sl-skeleton"
        style={{ height: 44, borderRadius: 10 }}
      />
    ))}
  </div>
)

const ShortcutCard = ({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) => (
  <a
    href={href}
    style={{
      textDecoration: "none",
      color: "inherit",
      display: "block",
    }}
  >
    <BrandCard
      compact
      className="sl-shortcut-card"
      title={title}
      subtitle={description}
    >
      <div
        className="sl-row sl-muted"
        style={{ fontSize: 11, justifyContent: "flex-end" }}
      >
        <span>Open</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </BrandCard>
  </a>
)

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{
      animation: spinning ? "sl-spin 0.8s linear infinite" : "none",
    }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

// Spin keyframe is declared inline once — cheap and co-located with the only
// caller. If we grow more spinners, move this into brand-tokens.ts.
const spinKeyframes = `@keyframes sl-spin { to { transform: rotate(360deg); } }`
if (typeof document !== "undefined" && !document.getElementById("sl-spin-kf")) {
  const s = document.createElement("style")
  s.id = "sl-spin-kf"
  s.textContent = spinKeyframes
  document.head.appendChild(s)
}

const DashboardIcon = () => (
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
    <rect x="3" y="3" width="8" height="10" rx="1.5" />
    <rect x="13" y="3" width="8" height="6" rx="1.5" />
    <rect x="13" y="11" width="8" height="10" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Sama Dashboard",
  icon: DashboardIcon,
})

export default SamaDashboardPage
