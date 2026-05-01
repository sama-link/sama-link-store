// Sama Link · /store/customer-lists/:list_type/items — ACCT-6B.
//
// POST  → adds a product (optionally pinned to a variant) to the
//         authenticated customer's list. Idempotent on
//         (product_id, variant_id). Returns 200 with { item, created }.
//         Returns 409 with { code: "compare_full" | "wishlist_full",
//         message } when the cap is hit (the framework's default CONFLICT
//         response is too generic — we send a typed body instead).
// DELETE → clears every item from the list (header row preserved). Idempotent
//         on an empty list (returns count: 0).

import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CUSTOMER_LIST_MODULE } from "../../../../../modules/customer_list"
import {
  CustomerListCapReachedError,
} from "../../../../../modules/customer_list/caps"
import type CustomerListModuleService from "../../../../../modules/customer_list/service"
import type {
  CustomerListItemRow,
  CustomerListRow,
} from "../../../../../modules/customer_list/service"
import {
  readCustomerId,
  readListTypeParam,
  readOptionalNullableString,
  readOptionalString,
  readRequiredString,
} from "../../helpers"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const customer_id = readCustomerId(req)
  const list_type = readListTypeParam(req)
  const service = req.scope.resolve<CustomerListModuleService>(
    CUSTOMER_LIST_MODULE,
  )

  const product_id = readRequiredString(req.body, "product_id")
  const variant_id = readOptionalNullableString(req.body, "variant_id") ?? null
  const title_snapshot = readOptionalString(req.body, "title_snapshot") ?? null
  const thumbnail_snapshot =
    readOptionalString(req.body, "thumbnail_snapshot") ?? null

  try {
    const result = await service.addItem(customer_id, list_type, {
      product_id,
      variant_id,
      title_snapshot,
      thumbnail_snapshot,
    })
    res.status(200).json(result)
  } catch (error) {
    if (error instanceof CustomerListCapReachedError) {
      res.status(409).json({
        code: error.code,
        message: error.message,
        list_type: error.listType,
        cap: error.cap,
      })
      return
    }
    throw error
  }
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const customer_id = readCustomerId(req)
  const list_type = readListTypeParam(req)
  const service = req.scope.resolve<CustomerListModuleService>(
    CUSTOMER_LIST_MODULE,
  )

  const lists = (await service.listCustomerLists({
    customer_id,
    list_type,
  })) as CustomerListRow[]
  if (lists.length === 0) {
    res.json({ deleted: true, count: 0 })
    return
  }
  const items = (await service.listCustomerListItems({
    customer_list_id: lists[0].id,
  })) as CustomerListItemRow[]
  if (items.length === 0) {
    res.json({ deleted: true, count: 0 })
    return
  }
  await service.deleteCustomerListItems(items.map((i) => i.id))
  res.json({ deleted: true, count: items.length })
}
