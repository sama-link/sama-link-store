// Sama Link · product brand picker — ADR-047.
//
// Portals into the native Medusa "Edit Organization" drawer — the one
// opened from the sidebar Organize card — so the brand selector sits
// right next to Type / Collection / Categories / Tags as just another
// organizational field. Same pattern as `sama-product-translation`: the
// widget is REGISTERED on `product.details.before` for React mount +
// admin-SDK `data`, but returns null on the page itself.
//
// Why in the drawer and not a standalone card:
//   - Brand IS organizational metadata. Tags, Categories, Collections,
//     Types are already in one drawer — adding a seventh "Brand card"
//     floating on the product page was redundant + cluttered.
//   - The sidebar glance-view lives in `sama-product-brand-badge` on
//     `product.details.side.after`, so the read-path is still obvious.
//
// Save semantics: auto-save on selection change. A separate "Save" button
// inside the drawer was confusing next to Medusa's native Save at the
// bottom; auto-save keeps the UX to one click (pick → done) and the
// inline status pill signals what happened.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { adminFetch } from "../lib/admin-api"

const MOUNT_ATTR = "data-sama-brand-mount"
const EDIT_ORG_DRAWER_TITLE = "Edit Organization"
const NO_BRAND = "__none__"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  image_url: string | null
}

type ListResponse = { brands: Brand[]; count: number }
type PatchResponse = { product?: AdminProductWithMeta }

type AdminProductWithMeta = AdminProduct & {
  metadata?: Record<string, unknown> | null
}

function readBrandId(p: AdminProductWithMeta): string | null {
  const m = p.metadata
  if (!m || typeof m !== "object") return null
  const id = (m as Record<string, unknown>)["brand_id"]
  return typeof id === "string" && id ? id : null
}

/* ── Portal target detection ─────────────────────────────────────── */

function findEditOrganizationDialog(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>(
    '[role="dialog"][data-state="open"]'
  )
  for (const dlg of Array.from(dialogs)) {
    const title = dlg.querySelector<HTMLHeadingElement>("h1")
    if (title?.textContent?.trim() === EDIT_ORG_DRAWER_TITLE) return dlg
  }
  return null
}

function ensureMountInside(dialog: HTMLElement): HTMLElement | null {
  /* The Edit Organization drawer's form scroll column uses
   *   form > .flex-1.px-6.py-4 > .flex.h-full.flex-col.gap-y-4
   * We match loosely: the inner gap-y-4 wrapper first, then fall back
   * to the first div under the form. */
  const column =
    dialog.querySelector<HTMLElement>(
      "form > div > div.gap-y-4"
    ) ??
    dialog.querySelector<HTMLElement>(
      "form > div.flex-1 > div"
    ) ??
    dialog.querySelector<HTMLElement>("form > div > div")
  if (!column) return null

  let mount = column.querySelector<HTMLElement>(`[${MOUNT_ATTR}]`)
  if (!mount) {
    mount = document.createElement("div")
    mount.setAttribute(MOUNT_ATTR, "")
    mount.className = "flex flex-col space-y-2"
    column.appendChild(mount)
  }
  return mount
}

/* ── Widget ──────────────────────────────────────────────────────── */

const SamaProductBrandPicker = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const product = data as AdminProductWithMeta | undefined
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document === "undefined") return

    const sync = () => {
      const dlg = findEditOrganizationDialog()
      if (!dlg) {
        setTarget(null)
        return
      }
      const mount = ensureMountInside(dlg)
      setTarget(mount ?? null)
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    })
    return () => {
      observer.disconnect()
      document
        .querySelectorAll(`[${MOUNT_ATTR}]`)
        .forEach((n) => n.remove())
    }
  }, [])

  if (!product || !target) return null
  return createPortal(<BrandField product={product} />, target)
}

/* ── Brand field (rendered inside the drawer) ──────────────────── */

type BrandFieldProps = {
  product: AdminProductWithMeta
}

const BrandField = ({ product }: BrandFieldProps) => {
  const productId = product.id
  const initialBrandId = useMemo(() => readBrandId(product), [product])

  const [brands, setBrands] = useState<Brand[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string>(
    initialBrandId ?? NO_BRAND
  )
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" })

  // Load brand catalog on mount.
  useEffect(() => {
    const ac = new AbortController()
    const load = async () => {
      setLoadError(null)
      try {
        const resp = await adminFetch<ListResponse>("/brands", {
          params: { limit: 200 },
          signal: ac.signal,
        })
        setBrands(resp.brands)
      } catch (e) {
        if (ac.signal.aborted) return
        setLoadError(
          e instanceof Error ? e.message : "Failed to load brands."
        )
      }
    }
    void load()
    return () => ac.abort()
  }, [])

  // Auto-dismiss "Saved" pill after a moment.
  useEffect(() => {
    if (status.kind !== "saved") return
    const h = window.setTimeout(() => {
      setStatus((s) => (s.kind === "saved" ? { kind: "idle" } : s))
    }, 2400)
    return () => window.clearTimeout(h)
  }, [status])

  const selectedBrand = useMemo(() => {
    if (!brands || selectedId === NO_BRAND) return null
    return brands.find((b) => b.id === selectedId) ?? null
  }, [brands, selectedId])

  const persist = useCallback(
    async (nextSelection: string) => {
      setStatus({ kind: "saving" })
      try {
        const existingMetadata =
          (product.metadata as Record<string, unknown> | null | undefined) ?? {}
        const nextMetadata: Record<string, unknown> = { ...existingMetadata }
        if (nextSelection === NO_BRAND) {
          delete nextMetadata["brand_id"]
        } else {
          nextMetadata["brand_id"] = nextSelection
        }
        await adminFetch<PatchResponse>(`/products/${productId}`, {
          method: "POST",
          body: { metadata: nextMetadata },
        })
        setStatus({ kind: "saved", at: Date.now() })
      } catch (err) {
        setStatus({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Failed to save brand.",
        })
      }
    },
    [product, productId]
  )

  const onChange = (next: string) => {
    setSelectedId(next)
    void persist(next)
  }

  const selectClass =
    "relative size-full cursor-pointer bg-ui-bg-field hover:bg-ui-bg-field-hover " +
    "shadow-borders-base focus-visible:shadow-borders-interactive-with-active " +
    "transition-fg rounded-md outline-none txt-compact-small " +
    "text-ui-fg-base h-8 w-full px-2 py-1 appearance-none pe-8 " +
    "disabled:!bg-ui-bg-disabled disabled:text-ui-fg-disabled"

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-x-1 justify-between">
        <div className="flex items-center gap-x-1">
          <label
            htmlFor="sama-brand-select"
            className="font-sans txt-compact-small font-medium"
          >
            Brand
          </label>
          <p className="font-normal font-sans txt-compact-small text-ui-fg-muted">
            (Optional)
          </p>
        </div>
        {status.kind === "saving" ? (
          <span className="txt-compact-xsmall text-ui-fg-subtle">Saving…</span>
        ) : status.kind === "saved" ? (
          <span className="txt-compact-xsmall text-ui-fg-interactive">
            Saved
          </span>
        ) : status.kind === "error" ? (
          <span className="txt-compact-xsmall text-ui-fg-error">
            Save failed
          </span>
        ) : null}
      </div>

      <div className="relative">
        <select
          id="sama-brand-select"
          className={selectClass}
          value={selectedId}
          disabled={brands == null || status.kind === "saving"}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value={NO_BRAND}>— No brand —</option>
          {(brands ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {/* Dropdown chevron — matches the native Medusa combobox */}
        <span
          aria-hidden
          className="text-ui-fg-muted pointer-events-none absolute end-2 top-0 flex h-8 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            fill="none"
          >
            <path
              fill="currentColor"
              d="M4.91 5.75a.8.8 0 0 1-.462-.108.85.85 0 0 1-.334-.293A.7.7 0 0 1 4 4.952a.7.7 0 0 1 .142-.39l2.59-3.454a.9.9 0 0 1 .33-.263 1.04 1.04 0 0 1 .876 0 .9.9 0 0 1 .33.263l2.59 3.455a.7.7 0 0 1 .14.39.7.7 0 0 1-.11.396.85.85 0 0 1-.335.293c-.14.07-.3.108-.464.108zM10.09 9.25c.163 0 .323.037.463.108.14.07.256.172.335.293a.7.7 0 0 1 .111.397.7.7 0 0 1-.141.39l-2.59 3.454a.9.9 0 0 1-.33.263 1.04 1.04 0 0 1-.876 0 .9.9 0 0 1-.33-.263l-2.59-3.455a.7.7 0 0 1-.142-.39.7.7 0 0 1 .112-.396.85.85 0 0 1 .335-.293c.14-.07.3-.108.463-.108z"
            />
          </svg>
        </span>
      </div>

      {/* ── Selected preview (compact, shows only when set) ───── */}
      {selectedBrand ? (
        <div className="flex items-center gap-x-2 rounded-md bg-ui-bg-component px-2 py-1.5">
          <BrandLogo
            url={selectedBrand.image_url}
            name={selectedBrand.name}
            size={20}
          />
          <span className="txt-compact-small text-ui-fg-base truncate">
            {selectedBrand.name}
          </span>
          <span className="txt-compact-xsmall text-ui-fg-muted truncate">
            /{selectedBrand.handle}
          </span>
        </div>
      ) : null}

      {loadError ? (
        <span className="txt-compact-xsmall text-ui-fg-error">
          {loadError}
        </span>
      ) : brands && brands.length === 0 ? (
        <span className="txt-compact-xsmall text-ui-fg-muted">
          No brands yet. Open Brands from the sidebar to
          create the first one.
        </span>
      ) : status.kind === "error" ? (
        <span className="txt-compact-xsmall text-ui-fg-error">
          {status.message}
        </span>
      ) : null}
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
          borderRadius: 4,
          objectFit: "cover",
          flexShrink: 0,
          background: "#fff",
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
        borderRadius: 4,
        background: "var(--sl-brand, #0f2b4f)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: Math.max(10, size / 2.2),
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default SamaProductBrandPicker
