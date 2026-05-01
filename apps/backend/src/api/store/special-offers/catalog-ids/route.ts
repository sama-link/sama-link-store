import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  PRODUCT_LABEL_SLUGS,
  productHasLabel,
} from "../../../../lib/sama-product-labels"

/**
 * Returns published product IDs that carry the `special_offer` catalog label
 * (`metadata.sama_labels`). Storefront uses this with `GET /store/products?id[]=…`
 * so variant pricing matches the main catalog.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const productModuleService = req.scope.resolve<IProductModuleService>(
    Modules.PRODUCT
  )

  const ids: string[] = []
  let offset = 0
  const take = 200

  for (;;) {
    const page = await productModuleService.listProducts(
      {},
      {
        take,
        skip: offset,
        select: ["id", "metadata", "status"],
      }
    )

    for (const p of page) {
      if (p.status !== "published") continue
      const meta = p.metadata as Record<string, unknown> | null
      if (productHasLabel(meta, PRODUCT_LABEL_SLUGS.SPECIAL_OFFER)) {
        ids.push(p.id)
      }
    }

    if (page.length < take) break
    offset += page.length
  }

  res.json({ ids })
}
