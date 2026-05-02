// Sama Link · /store/brands/[id]/product-ids — list product IDs for a brand.
//
// Backs the storefront catalog brand filter. The Medusa Store product list
// API does not support a `metadata.brand_id` filter natively, so the
// storefront calls this endpoint to resolve the IDs for the active brand
// and then passes `id: [...]` to /store/products. With server-side IDs +
// native `id` filter, count/pagination/sort all behave correctly.
//
// Returns the FULL ID list for a brand (not paginated). For our catalog
// (≈ 200 products with brand_id, 29 brands), no single brand approaches
// the 500-row cap. If a brand ever exceeds the cap, callers see only
// the first 500 IDs — pagination caveat noted in the response shape.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"

const PRODUCT_FETCH_CAP = 500

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandId = String(req.params.id ?? "").trim()
  if (!brandId) {
    res.status(400).json({ message: "Brand id is required." })
    return
  }

  const productService = req.scope.resolve<IProductModuleService>("product")

  // Fetch published products with metadata; brand_id is stored on
  // metadata.brand_id by the admin brand-picker widget. We can't filter
  // on metadata server-side, so we fetch with a select-only projection
  // and trim in-memory. Cap at PRODUCT_FETCH_CAP to bound work.
  const rows = (await productService.listProducts(
    {},
    { take: PRODUCT_FETCH_CAP, select: ["id", "metadata", "status"] }
  )) as Array<{
    id: string
    metadata: Record<string, unknown> | null
    status?: string
  }>

  const ids = rows
    .filter(
      (r) =>
        r.status === "published" &&
        (r.metadata as Record<string, unknown> | null)?.brand_id === brandId
    )
    .map((r) => r.id)

  res.json({ brand_id: brandId, ids, count: ids.length })
}
