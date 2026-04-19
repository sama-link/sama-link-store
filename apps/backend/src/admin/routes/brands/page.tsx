// Sama Link · Brands list — ADR-047.
//
// Route: /app/brands. Shows every brand in the catalog with a search
// input and a "Create brand" button. Each row links to the edit page.

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BrandShell,
  PageHeader,
  BrandSection,
  EmptyState,
  BrandButton,
} from "../../components"
import { adminFetch } from "../../lib/admin-api"
import { formatInt, truncate } from "../../lib/format"
import { Link } from "../../lib/router-link"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  image_url: string | null
  created_at?: string
  updated_at?: string
}

type ListResponse = {
  brands: Brand[]
  count: number
  limit: number
  offset: number
}

const BrandsListPage = () => {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(
    async (signal: AbortSignal, q: string) => {
      setLoading(true)
      setError(null)
      try {
        const resp = await adminFetch<ListResponse>("/brands", {
          params: q ? { q } : undefined,
          signal,
        })
        setData(resp)
      } catch (e) {
        if (signal.aborted) return
        setError(e instanceof Error ? e.message : "Failed to load brands")
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    },
    []
  )

  // Debounced search: re-run list fetch 250ms after the last keystroke.
  useEffect(() => {
    const ac = new AbortController()
    const h = window.setTimeout(() => {
      void load(ac.signal, query.trim())
    }, query ? 250 : 0)
    return () => {
      window.clearTimeout(h)
      ac.abort()
    }
  }, [load, query, refreshKey])

  const brands = useMemo(() => data?.brands ?? [], [data])

  return (
    <BrandShell as="page">
      <PageHeader
        eyebrow="Sama Link · Catalog"
        title="Brands"
        subtitle="Your brand catalog. Create brands here, then assign them to products from each product's Organization panel."
        actions={
          <>
            <BrandButton
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </BrandButton>
            <Link to="/brands/create" style={{ textDecoration: "none" }}>
              <BrandButton variant="primary" size="sm">
                + Create brand
              </BrandButton>
            </Link>
          </>
        }
      />

      {error ? (
        <div className="sl-note sl-note-error" style={{ marginBottom: 16 }}>
          <strong style={{ color: "var(--sl-error)" }}>Failed:</strong>{" "}
          {error}
        </div>
      ) : null}

      <BrandSection
        title="All brands"
        subtitle={
          data
            ? `${formatInt(data.count)} brand${data.count === 1 ? "" : "s"} in the catalog.`
            : "Loading…"
        }
      >
        <div className="sl-row" style={{ marginBottom: 12 }}>
          <input
            type="search"
            className="sl-input"
            style={{ flex: 1, minWidth: 240 }}
            placeholder="Search by name or handle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="sl-stack-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="sl-skeleton"
                style={{ height: 52, borderRadius: 8 }}
              />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            title={query ? "No brands match" : "No brands yet"}
            description={
              query
                ? "Try clearing the search to see every brand."
                : "Create your first brand to start linking products."
            }
            action={
              query ? (
                <BrandButton
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </BrandButton>
              ) : (
                <Link to="/brands/create" style={{ textDecoration: "none" }}>
                  <BrandButton variant="primary" size="sm">
                    + Create the first brand
                  </BrandButton>
                </Link>
              )
            }
          />
        ) : (
          <div className="sl-table-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}></th>
                  <th>Name</th>
                  <th>Handle</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <BrandThumb
                        name={b.name}
                        url={b.image_url}
                        size={36}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/brands/${b.id}`}
                        style={{
                          fontWeight: 600,
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {b.name}
                      </Link>
                    </td>
                    <td>
                      <span className="sl-mono" style={{ fontSize: 12 }}>
                        {b.handle}
                      </span>
                    </td>
                    <td>
                      <span
                        className="sl-sub"
                        style={{ fontSize: 12 }}
                      >
                        {b.description ? truncate(b.description, 120) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BrandSection>
    </BrandShell>
  )
}

/* ── Thumbnail with letter fallback ─────────────────────────────── */

const BrandThumb = ({
  name,
  url,
  size,
}: {
  name: string
  url: string | null
  size: number
}) => {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          objectFit: "cover",
          background: "var(--sl-surface-soft, rgba(15,43,79,0.04))",
          border: "1px solid var(--sl-border, #e2e8f0)",
        }}
      />
    )
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "var(--sl-brand, #0f2b4f)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: size / 2.4,
      }}
    >
      {initial}
    </div>
  )
}

/* ── Route config — shows in sidebar ────────────────────────────── */

const BrandsIcon = () => (
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
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

export const config = defineRouteConfig({
  label: "Brands",
  icon: BrandsIcon,
  // Nest under the native Products menu so the sidebar reads
  //   Products
  //     └─ Brands
  //     └─ Bulk Manage (already nested here via product-bulk)
  nested: "/products",
})

export default BrandsListPage
