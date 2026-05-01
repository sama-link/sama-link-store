// Sama Link · CustomerList caps unit tests — ACCT-6A / ADR-053.
//
// Pure-logic unit tests for the cap constants, type guards, and the
// typed cap-reached errors. Run via `npm run test:unit` — no Postgres
// required. The integration coverage of dedupe + cap behavior against
// the real schema lives next door in `service.spec.ts`.

import {
  COMPARE_LIST_MAX_ITEMS,
  CompareCapReachedError,
  CUSTOMER_LIST_TYPES,
  CustomerListCapReachedError,
  WISHLIST_LIST_MAX_ITEMS,
  WishlistCapReachedError,
  isCustomerListType,
  maxItemsForListType,
} from "../caps"

describe("customer_list / caps", () => {
  describe("constants", () => {
    it("compare cap is 4 (preserves storefront COMPARE_MAX_ITEMS)", () => {
      expect(COMPARE_LIST_MAX_ITEMS).toBe(4)
    })

    it("wishlist cap is 200 (safety ceiling, not UX-visible by default)", () => {
      expect(WISHLIST_LIST_MAX_ITEMS).toBe(200)
    })

    it("CUSTOMER_LIST_TYPES enumerates exactly wishlist + compare", () => {
      expect(CUSTOMER_LIST_TYPES).toEqual(["wishlist", "compare"])
    })
  })

  describe("isCustomerListType", () => {
    it.each([
      ["wishlist", true],
      ["compare", true],
      ["favorites", false],
      ["", false],
      [null, false],
      [undefined, false],
      [123, false],
      [{}, false],
    ])("isCustomerListType(%p) → %p", (value, expected) => {
      expect(isCustomerListType(value)).toBe(expected)
    })
  })

  describe("maxItemsForListType", () => {
    it("returns the compare cap for compare", () => {
      expect(maxItemsForListType("compare")).toBe(COMPARE_LIST_MAX_ITEMS)
    })
    it("returns the wishlist cap for wishlist", () => {
      expect(maxItemsForListType("wishlist")).toBe(WISHLIST_LIST_MAX_ITEMS)
    })
  })

  describe("typed cap-reached errors", () => {
    it("CompareCapReachedError carries code=compare_full and listType=compare", () => {
      const error = new CompareCapReachedError()
      expect(error).toBeInstanceOf(CustomerListCapReachedError)
      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe("compare_full")
      expect(error.listType).toBe("compare")
      expect(error.cap).toBe(COMPARE_LIST_MAX_ITEMS)
      expect(error.name).toBe("CompareCapReachedError")
      expect(error.message).toMatch(/Compare list is full/)
    })

    it("WishlistCapReachedError carries code=wishlist_full and listType=wishlist", () => {
      const error = new WishlistCapReachedError()
      expect(error).toBeInstanceOf(CustomerListCapReachedError)
      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe("wishlist_full")
      expect(error.listType).toBe("wishlist")
      expect(error.cap).toBe(WISHLIST_LIST_MAX_ITEMS)
      expect(error.name).toBe("WishlistCapReachedError")
      expect(error.message).toMatch(/Wishlist is full/)
    })
  })
})
