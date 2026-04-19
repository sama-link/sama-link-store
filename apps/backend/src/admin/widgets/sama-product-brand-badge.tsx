// Sama Link · product brand sidebar badge — ADR-047.
//
// Small read-only card on `product.details.side.after` — the confirmed-
// valid sidebar zone that sits alongside / under Medusa's native
// Organize + Sales channels cards. Purpose: one-glance visibility of
// which brand the product is linked to, styled to match the neighbouring
// native cards (rounded, subtle border, compact type).
//
// Not an editor. The edit path is the Brand field we portal INTO the
// native "Edit Organization" drawer (see `sama-product-brand-picker`).
// Clicking the "..." menu on the native Organize card opens that
// drawer — the brand field is waiting there.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { adminFetch } from "../lib/admin-api"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  image_url: string | null
}

type BrandResponse = { brand: Brand }

type AdminProductWithMeta = AdminProduct & {
  metadata?: Record<string, unknown> | null
}

function readBrandId(p: AdminProductWithMeta): string | null {
  const m = p.metadata
  if (!m || typeof m !== "object") return null
  const id = (m as Record<string, unknown>)["brand_id"]
  return typeof id === "string" && id ? id : null
}

const SamaProductBrandBadge = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const product = data as AdminProductWithMeta | undefined
  const brandId = useMemo(
    () => (product ? readBrandId(product) : null),
    [product]
  )

  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState<boolean>(!!brandId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!brandId) {
      setBrand(null)
      setLoading(false)
      setError(null)
      return
    }
    const ac = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const resp = await adminFetch<BrandResponse>(`/brands/${brandId}`, {
          signal: ac.signal,
        })
        setBrand(resp.brand)
      } catch (e) {
        if (ac.signal.aborted) return
        // 404 after a brand delete is a recoverable soft-state — render
        // "unknown brand" rather than an angry error.
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
          setBrand(null)
          setError("Brand was removed from the catalog.")
        } else {
          setError(msg)
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => ac.abort()
  }, [brandId])

  if (!product) return null

  return (
    <div className="bg-ui-bg-base shadow-elevation-card-rest rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-medium h2-core">Brand</h3>
        {brand ? (
          <Link
            to={`/brands/${brand.id}`}
            className="txt-compact-xsmall text-ui-fg-subtle hover:text-ui-fg-base transition-fg"
            style={{ textDecoration: "none" }}
          >
            Edit brand →
          </Link>
        ) : null}
      </div>

      <div className="mt-3">
        {loading ? (
          <span className="txt-compact-small text-ui-fg-muted">Loading…</span>
        ) : error && !brand ? (
          <span className="txt-compact-small text-ui-fg-subtle">
            {error}
          </span>
        ) : brand ? (
          <div className="flex items-center gap-x-3">
            <BrandLogo
              url={brand.image_url}
              name={brand.name}
              size={40}
            />
            <div className="flex flex-col gap-y-0.5 min-w-0">
              <span className="txt-compact-small font-medium text-ui-fg-base truncate">
                {brand.name}
              </span>
              <span className="txt-compact-xsmall text-ui-fg-subtle truncate">
                /{brand.handle}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="txt-compact-small text-ui-fg-muted">
              Not set
            </span>
            <Link
              to="/brands"
              className="txt-compact-xsmall text-ui-fg-subtle hover:text-ui-fg-base transition-fg"
              style={{ textDecoration: "none" }}
            >
              Catalog →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Logo helper ────────────────────────────────────────────────── */

const BrandLogo = ({
  url,
  name,
  size,
}: {
  url: string | null
  name: string
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
          borderRadius: 6,
          objectFit: "cover",
          flexShrink: 0,
          background: "#fff",
          border: "1px solid var(--border-base, #e4e4e7)",
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
        borderRadius: 6,
        background: "var(--sl-brand, #0f2b4f)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: size / 2.4,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default SamaProductBrandBadge
