// Sama Link · DELETE /store/customer-lists/:list_type/items/:item_id — ACCT-6B.
//
// Removes a single item the authenticated customer owns. The service's
// `removeItem` performs the ownership check and throws NOT_FOUND when
// the item belongs to a different customer or to a different list_type;
// the framework error handler maps NOT_FOUND → HTTP 404.

import { MedusaError } from "@medusajs/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CUSTOMER_LIST_MODULE } from "../../../../../../modules/customer_list"
import type CustomerListModuleService from "../../../../../../modules/customer_list/service"
import {
  readCustomerId,
  readListTypeParam,
} from "../../../helpers"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const customer_id = readCustomerId(req)
  const list_type = readListTypeParam(req)

  const item_id = (req.params as Record<string, unknown>).item_id
  if (typeof item_id !== "string" || item_id.trim().length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "item_id is required.",
    )
  }

  const service = req.scope.resolve<CustomerListModuleService>(
    CUSTOMER_LIST_MODULE,
  )
  await service.removeItem(customer_id, list_type, item_id)
  res.json({ deleted: true, id: item_id })
}
