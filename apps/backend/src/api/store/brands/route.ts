// Sama Link · /store/brands — public brand catalog list — ADR-047.
//
// Used by the storefront to populate the catalog brand filter and the PDP
// brand eyebrow. List-only; CRUD lives at /admin/brands. Sorted by name
// ascending so the storefront UI doesn't need to sort. Pagination via
// `limit`/`offset` query params (1–200 / ≥0).

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"
import type BrandModuleService from "../../../modules/brand/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1),
    200
  )
  const offset = Math.max(
    parseInt(String(req.query.offset ?? "0"), 10) || 0,
    0
  )

  const [brands, count] = await service.listAndCountBrands({}, {
    skip: offset,
    take: limit,
    order: { name: "ASC" },
  })

  res.json({ brands, count, limit, offset })
}
