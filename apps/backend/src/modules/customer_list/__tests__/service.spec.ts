// Sama Link · CustomerList module service tests — ACCT-6A / ADR-053.
//
// Run via: `npm run test:integration:modules` (requires a Postgres test DB
// — see apps/backend/jest.config.js TEST_TYPE=integration:modules wiring).
// `moduleIntegrationTestRunner` boots the module against an isolated
// Mikro-ORM instance, runs the migration, exposes the resolved service.

import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { CUSTOMER_LIST_MODULE } from ".."
import {
  COMPARE_LIST_MAX_ITEMS,
  CompareCapReachedError,
  WISHLIST_LIST_MAX_ITEMS,
  WishlistCapReachedError,
} from "../caps"
import type CustomerListModuleService from "../service"

jest.setTimeout(60 * 1000)

const CUSTOMER_A = "cus_test_alpha"
const CUSTOMER_B = "cus_test_beta"
const PRODUCT_A = "prod_test_a"
const PRODUCT_B = "prod_test_b"
const PRODUCT_C = "prod_test_c"
const PRODUCT_D = "prod_test_d"
const PRODUCT_E = "prod_test_e"
const VARIANT_X = "variant_test_x"
const VARIANT_Y = "variant_test_y"

moduleIntegrationTestRunner<CustomerListModuleService>({
  moduleName: CUSTOMER_LIST_MODULE,
  resolve: "./src/modules/customer_list",
  testSuite: ({ service }) => {
    describe("CustomerListModuleService", () => {
      describe("getOrCreateList", () => {
        it("creates a list on first call and returns the same row on the second", async () => {
          const first = await service.getOrCreateList(CUSTOMER_A, "wishlist")
          const second = await service.getOrCreateList(CUSTOMER_A, "wishlist")
          expect(second.id).toEqual(first.id)
          expect(second.customer_id).toEqual(CUSTOMER_A)
          expect(second.list_type).toEqual("wishlist")
        })

        it("creates separate rows for wishlist and compare under the same customer", async () => {
          const wishlist = await service.getOrCreateList(CUSTOMER_A, "wishlist")
          const compare = await service.getOrCreateList(CUSTOMER_A, "compare")
          expect(compare.id).not.toEqual(wishlist.id)
          expect(compare.list_type).toEqual("compare")
        })

        it("rejects an unknown list_type", async () => {
          await expect(
            service.getOrCreateList(CUSTOMER_A, "favorites"),
          ).rejects.toThrow(/Unknown customer list type/)
        })
      })

      describe("addItem — dedupe", () => {
        it("returns created: true on first add and created: false on a repeat add of the same (product, variant)", async () => {
          const first = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_A,
            variant_id: VARIANT_X,
          })
          expect(first.created).toBe(true)
          const second = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_A,
            variant_id: VARIANT_X,
          })
          expect(second.created).toBe(false)
          expect(second.item.id).toEqual(first.item.id)
        })

        it("treats a null variant_id as a distinct row from a non-null variant_id for the same product", async () => {
          const withVariant = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_B,
            variant_id: VARIANT_X,
          })
          const withoutVariant = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_B,
          })
          expect(withoutVariant.created).toBe(true)
          expect(withoutVariant.item.id).not.toEqual(withVariant.item.id)
          expect(withoutVariant.item.variant_id).toBeNull()
        })

        it("dedupes two adds of the same product when variant_id is null on both", async () => {
          const first = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_C,
          })
          const second = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_C,
            variant_id: null,
          })
          expect(second.created).toBe(false)
          expect(second.item.id).toEqual(first.item.id)
        })
      })

      describe("addItem — cap enforcement", () => {
        it("rejects the (cap+1)-th distinct compare item with CompareCapReachedError", async () => {
          // Fresh customer to avoid bleed across tests.
          const customer = "cus_test_compare_cap"
          for (let i = 0; i < COMPARE_LIST_MAX_ITEMS; i += 1) {
            await service.addItem(customer, "compare", {
              product_id: `${PRODUCT_A}_cap_${i}`,
            })
          }
          await expect(
            service.addItem(customer, "compare", {
              product_id: `${PRODUCT_A}_cap_overflow`,
            }),
          ).rejects.toBeInstanceOf(CompareCapReachedError)
        })

        it("does not block a duplicate add even when the compare list is full (idempotent)", async () => {
          const customer = "cus_test_compare_idem"
          const ids: string[] = []
          for (let i = 0; i < COMPARE_LIST_MAX_ITEMS; i += 1) {
            const r = await service.addItem(customer, "compare", {
              product_id: `${PRODUCT_A}_idem_${i}`,
            })
            ids.push(r.item.id)
          }
          // Re-adding an item already on the (full) list must succeed
          // because dedupe wins before the cap check.
          const repeat = await service.addItem(customer, "compare", {
            product_id: `${PRODUCT_A}_idem_0`,
          })
          expect(repeat.created).toBe(false)
          expect(repeat.item.id).toEqual(ids[0])
        })

        it("exposes the matching cap value on the wishlist error type", async () => {
          // Sanity-check the typed error without filling a 200-row table —
          // we instantiate the error directly to assert its shape, since
          // exhausting the wishlist cap in a unit test is wasteful.
          const error = new WishlistCapReachedError()
          expect(error.cap).toEqual(WISHLIST_LIST_MAX_ITEMS)
          expect(error.code).toEqual("wishlist_full")
        })
      })

      describe("removeItem — ownership", () => {
        it("removes an item that belongs to the caller", async () => {
          const added = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_D,
          })
          await service.removeItem(CUSTOMER_A, "wishlist", added.item.id)
          const after = await service.listCustomerListItems({
            id: added.item.id,
          })
          expect(after).toHaveLength(0)
        })

        it("refuses to remove an item belonging to a different customer (NOT_FOUND, no delete)", async () => {
          const added = await service.addItem(CUSTOMER_A, "wishlist", {
            product_id: PRODUCT_E,
          })
          await expect(
            service.removeItem(CUSTOMER_B, "wishlist", added.item.id),
          ).rejects.toThrow(/not found/i)
          const stillThere = await service.listCustomerListItems({
            id: added.item.id,
          })
          expect(stillThere).toHaveLength(1)
        })

        it("refuses to remove an item from the wrong list_type (NOT_FOUND)", async () => {
          const added = await service.addItem(CUSTOMER_A, "compare", {
            product_id: `${PRODUCT_A}_wrong_type`,
          })
          await expect(
            service.removeItem(CUSTOMER_A, "wishlist", added.item.id),
          ).rejects.toThrow(/not found/i)
          const stillThere = await service.listCustomerListItems({
            id: added.item.id,
          })
          expect(stillThere).toHaveLength(1)
        })
      })
    })
  },
})
