// Sama Link · Customer-list module registration — ADR-053.
//
// Registered in `medusa-config.ts` under the `CUSTOMER_LIST_MODULE` key.
// Future store API routes (ACCT-6B) will resolve the service via
// `req.scope.resolve(CUSTOMER_LIST_MODULE)`.

import { Module } from "@medusajs/utils"
import CustomerListModuleService from "./service"

export const CUSTOMER_LIST_MODULE = "customer_list"

export default Module(CUSTOMER_LIST_MODULE, {
  service: CustomerListModuleService,
})

export {
  COMPARE_LIST_MAX_ITEMS,
  CompareCapReachedError,
  CUSTOMER_LIST_TYPES,
  CustomerListCapReachedError,
  WISHLIST_LIST_MAX_ITEMS,
  WishlistCapReachedError,
  isCustomerListType,
  maxItemsForListType,
} from "./caps"
export type { CustomerListType } from "./caps"
export type {
  AddItemPayload,
  AddItemResult,
  CustomerListItemRow,
  CustomerListRow,
} from "./service"
