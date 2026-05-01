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
