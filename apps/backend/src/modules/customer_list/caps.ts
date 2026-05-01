// Sama Link · Customer-list module caps + typed errors — ADR-053.
//
// Single source of truth for the wishlist + compare per-list caps. Both the
// service and the (later) HTTP routes import from here so the storefront
// and backend agree on a single number per list type.

export const WISHLIST_LIST_MAX_ITEMS = 200
export const COMPARE_LIST_MAX_ITEMS = 4

export type CustomerListType = "wishlist" | "compare"

export const CUSTOMER_LIST_TYPES: readonly CustomerListType[] = [
  "wishlist",
  "compare",
] as const

export function isCustomerListType(value: unknown): value is CustomerListType {
  return value === "wishlist" || value === "compare"
}

export function maxItemsForListType(listType: CustomerListType): number {
  return listType === "compare"
    ? COMPARE_LIST_MAX_ITEMS
    : WISHLIST_LIST_MAX_ITEMS
}

// Typed cap-reached errors. The `code` field is what the future ACCT-6B
// route handler will map to an HTTP 409 body. Subclasses share a base so
// callers can `instanceof CustomerListCapReachedError` for the generic
// case.
export class CustomerListCapReachedError extends Error {
  readonly code: string
  readonly listType: CustomerListType
  readonly cap: number

  constructor(listType: CustomerListType, cap: number, message: string) {
    super(message)
    this.name = "CustomerListCapReachedError"
    this.code = listType === "compare" ? "compare_full" : "wishlist_full"
    this.listType = listType
    this.cap = cap
  }
}

export class CompareCapReachedError extends CustomerListCapReachedError {
  constructor() {
    super(
      "compare",
      COMPARE_LIST_MAX_ITEMS,
      `Compare list is full (max ${COMPARE_LIST_MAX_ITEMS} items).`,
    )
    this.name = "CompareCapReachedError"
  }
}

export class WishlistCapReachedError extends CustomerListCapReachedError {
  constructor() {
    super(
      "wishlist",
      WISHLIST_LIST_MAX_ITEMS,
      `Wishlist is full (max ${WISHLIST_LIST_MAX_ITEMS} items).`,
    )
    this.name = "WishlistCapReachedError"
  }
}
