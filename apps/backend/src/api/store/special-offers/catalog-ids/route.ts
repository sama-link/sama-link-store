// Sama Link · /store/special-offers/catalog-ids — published product IDs that
// carry the `special_offer` catalog label (`metadata.sama_labels`).
//
// Storefront calls this then passes the IDs to /store/products via the native
// `id` filter so variant pricing matches the main catalog. Same architectural
// shape as /store/brands/{id}/product-ids — both work around Medusa not
// supporting metadata filters on the public store products list.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import {
  PRODUCT_LABEL_SLUGS,
  productHasLabel,
} from "../../../../lib/sama-product-labels"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productModuleService =
    req.scope.resolve<IProductModuleService>("product")

  const ids: string[] = []
  let offset = 0
  const take = 200

  for (;;) {
    const page = (await productModuleService.listProducts(
      {},
      {
        take,
        skip: offset,
        select: ["id", "metadata", "status"],
      }
    )) as Array<{
      id: string
      metadata: Record<string, unknown> | null
      status?: string
    }>

    for (const p of page) {
      if (p.status !== "published") continue
      if (productHasLabel(p.metadata, PRODUCT_LABEL_SLUGS.SPECIAL_OFFER)) {
        ids.push(p.id)
      }
    }

    if (page.length < take) break
    offset += page.length
  }

  res.json({ ids, count: ids.length })
}
