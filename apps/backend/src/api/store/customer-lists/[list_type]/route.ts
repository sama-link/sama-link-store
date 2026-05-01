// Sama Link · GET /store/customer-lists/:list_type — ACCT-6B.
//
// Returns the authenticated customer's list of the given type and its
// items. Read-only — does NOT lazily create the list row when none
// exists; an empty-shape response is returned instead so the storefront
// can render an empty state without persisting a header row before the
// customer has acted.

import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CUSTOMER_LIST_MODULE } from "../../../../modules/customer_list"
import type CustomerListModuleService from "../../../../modules/customer_list/service"
import type {
  CustomerListItemRow,
  CustomerListRow,
} from "../../../../modules/customer_list/service"
import {
  emptyListResponse,
  listResponse,
  readCustomerId,
  readListTypeParam,
} from "../helpers"

export async function GET(
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
    res.json(emptyListResponse(customer_id, list_type))
    return
  }
  const items = (await service.listCustomerListItems({
    customer_list_id: lists[0].id,
  })) as CustomerListItemRow[]
  res.json(listResponse(lists[0], list_type, items))
}
