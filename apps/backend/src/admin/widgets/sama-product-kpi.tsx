// Sama Link product KPI widget — ADR-046 + ADR-047.
// Injected into `product.details.before` (confirmed zone per Medusa v2 docs).
//
// Renders a trio of at-a-glance cards so merchants see the same visual
// vocabulary the storefront uses. Uses the shared brand-tokens bundle
// (see lib/brand-tokens.ts) + the shared components library. Under ADR-047
// the native admin shell also inherits the Sama palette via sama-global-theme,
// so this widget's visuals now match the rest of the page instead of standing
// out as the only branded island.
//
// Reads product data from the admin page context (props passed by Medusa).
// Pricing range is derived from variants already loaded on the page — no
// extra fetch. Missing fields degrade gracefully.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { BrandShell, BrandDot, MetricTile, StatusChip, toneForStatus } from "../components"
import { formatInt, formatMoneyRange } from "../lib/format"

type AdminProductLike = AdminProduct & {
  variants?: Array<{
    id?: string
    manage_inventory?: boolean | null
    inventory_quantity?: number | null
    prices?: Array<{
      amount?: number | null
      currency_code?: string | null
    }> | null
  }> | null
}

const SamaProductKpiWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = (data ?? {}) as AdminProductLike
  const variants = Array.isArray(product.variants) ? product.variants : []
  const variantCount = variants.length

  let inStockUnits: number | null = null
  let knownInventory = false
  for (const v of variants) {
    if (v.manage_inventory && typeof v.inventory_quantity === "number") {
      knownInventory = true
      inStockUnits = (inStockUnits ?? 0) + v.inventory_quantity
    }
  }

  let min: number | null = null
  let max: number | null = null
  let currency: string | null = null
  for (const v of variants) {
    const prices = Array.isArray(v.prices) ? v.prices : []
    for (const p of prices) {
      if (typeof p.amount === "number") {
        min = min == null ? p.amount : Math.min(min, p.amount)
        max = max == null ? p.amount : Math.max(max, p.amount)
        if (!currency && p.currency_code) currency = p.currency_code
      }
    }
  }

  const status = product.status ?? "—"

  return (
    <BrandShell as="widget">
      <div className="sl-card">
        <div className="sl-between" style={{ marginBottom: 10 }}>
          <div className="sl-row" style={{ alignItems: "center", gap: 10 }}>
            <BrandDot />
            <div className="sl-stack-sm">
              <span className="sl-eyebrow">Sama Link · Brand snapshot</span>
              <h3 className="sl-title-sm">Storefront-facing status</h3>
            </div>
          </div>
          <StatusChip tone={toneForStatus(status)}>{status}</StatusChip>
        </div>

        <p className="sl-sub" style={{ marginBottom: 12 }}>
          A one-glance view of how this product appears on the storefront.
          Price shows the range across variants; in-stock units only count
          variants that track inventory.
        </p>

        <div className="sl-grid sl-grid-auto">
          <MetricTile
            label="Variants"
            value={variantCount}
            foot={
              variantCount === 0
                ? "No variants — storefront shows single-option card."
                : `${variantCount} published option${variantCount === 1 ? "" : "s"}`
            }
          />
          <MetricTile
            label="Price range"
            value={formatMoneyRange(min, max, currency)}
            foot={
              min != null && max != null
                ? "Shown on storefront as the leading card price."
                : "No variant prices recorded yet."
            }
          />
          <MetricTile
            label="In-stock units"
            value={knownInventory ? formatInt(inStockUnits ?? 0) : "—"}
            foot={
              knownInventory
                ? "Sum across variants that manage inventory."
                : "Inventory tracking is off for all variants."
            }
          />
        </div>
      </div>
    </BrandShell>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default SamaProductKpiWidget
