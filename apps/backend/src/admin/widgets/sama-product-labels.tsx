import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useCallback, useEffect, useMemo, useState } from "react"
import { adminFetch } from "../lib/admin-api"
import {
  parseSamaLabels,
  PRODUCT_LABEL_OPTIONS,
  SAMA_LABELS_METADATA_KEY,
  serializeSamaLabels,
} from "../../lib/sama-product-labels"

type PatchResponse = { product?: AdminProduct & { metadata?: Record<string, unknown> | null } }

type AdminProductWithMeta = AdminProduct & {
  metadata?: Record<string, unknown> | null
}

const SamaProductLabels = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data as AdminProductWithMeta | undefined
  const productId = product?.id

  const initialSet = useMemo(() => {
    const m = product?.metadata
    return new Set(parseSamaLabels(m))
  }, [product?.metadata])

  const [selected, setSelected] = useState<Set<string>>(initialSet)
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: number } | { kind: "error"; message: string }
  >({ kind: "idle" })

  useEffect(() => {
    setSelected(new Set(parseSamaLabels(product?.metadata)))
  }, [product?.metadata, productId])

  useEffect(() => {
    if (status.kind !== "saved") return
    const h = window.setTimeout(() => {
      setStatus((s) => (s.kind === "saved" ? { kind: "idle" } : s))
    }, 2400)
    return () => window.clearTimeout(h)
  }, [status.kind])

  const persist = useCallback(
    async (next: Set<string>) => {
      if (!productId) return
      setStatus({ kind: "saving" })
      try {
        const existingMetadata =
          (product?.metadata as Record<string, unknown> | null | undefined) ?? {}
        const nextMetadata: Record<string, unknown> = { ...existingMetadata }
        const serialized = serializeSamaLabels([...next])
        if (!serialized) {
          delete nextMetadata[SAMA_LABELS_METADATA_KEY]
        } else {
          nextMetadata[SAMA_LABELS_METADATA_KEY] = serialized
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
            err instanceof Error ? err.message : "Failed to save labels.",
        })
      }
    },
    [product?.metadata, productId]
  )

  const toggle = (slug: string) => {
    const next = new Set(selected)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setSelected(next)
    void persist(next)
  }

  if (!productId) return null

  return (
    <div className="shadow-elevation-card bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-ui-fg-base txt-compact-small font-medium">
          Catalog labels
        </h3>
        {status.kind === "saving" ? (
          <span className="text-ui-fg-muted txt-compact-xsmall">Saving…</span>
        ) : status.kind === "saved" ? (
          <span className="text-ui-tag-green-text txt-compact-xsmall">Saved</span>
        ) : status.kind === "error" ? (
          <span className="text-ui-fg-error txt-compact-xsmall truncate max-w-[180px]" title={status.message}>
            Error
          </span>
        ) : null}
      </div>
      <p className="text-ui-fg-muted txt-compact-xsmall mt-1 mb-3">
        Shown on marketing surfaces (e.g. Today&apos;s Deals uses &quot;Special offer&quot;).
      </p>
      <ul className="flex flex-col gap-2">
        {PRODUCT_LABEL_OPTIONS.map((opt) => {
          const on = selected.has(opt.slug)
          return (
            <li key={opt.slug}>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-ui-border-base"
                  checked={on}
                  onChange={() => toggle(opt.slug)}
                />
                <span className="text-ui-fg-base txt-compact-small">
                  {opt.labelEn}
                  <span className="text-ui-fg-muted"> — {opt.labelAr}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default SamaProductLabels
