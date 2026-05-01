// Sama Link · /store/customer-lists helpers — pure-logic unit tests.
//
// Covers list_type validation, body field extraction, and response
// shaping for the four ACCT-6B route handlers. Run via
// `npm run test:unit` — no Postgres / Medusa app required.

import {
  emptyListResponse,
  listResponse,
  readCustomerId,
  readListTypeParam,
  readOptionalNullableString,
  readOptionalString,
  readRequiredString,
} from "../helpers"

type FakeReq = {
  params?: Record<string, unknown>
  auth_context?: { actor_id?: string } | null
}

function reqWithParams(params: Record<string, unknown>): FakeReq {
  return { params, auth_context: { actor_id: "cus_test" } }
}

describe("/store/customer-lists / helpers", () => {
  describe("readListTypeParam", () => {
    it.each(["wishlist", "compare"])("accepts %p", (value) => {
      expect(readListTypeParam(reqWithParams({ list_type: value }) as never)).toBe(
        value,
      )
    })

    it.each([
      "favorites",
      "",
      "WISHLIST",
      undefined,
      null,
      123,
      {},
    ])("rejects %p with INVALID_DATA", (value) => {
      expect(() =>
        readListTypeParam(reqWithParams({ list_type: value as never }) as never),
      ).toThrow(/Invalid list_type/)
    })
  })

  describe("readCustomerId", () => {
    it("returns the actor_id when present", () => {
      const req = { params: {}, auth_context: { actor_id: "cus_42" } } as never
      expect(readCustomerId(req)).toBe("cus_42")
    })

    it("throws UNAUTHORIZED when auth_context is missing", () => {
      const req = { params: {}, auth_context: undefined } as never
      expect(() => readCustomerId(req)).toThrow(
        /Authenticated customer required/,
      )
    })

    it("throws UNAUTHORIZED when actor_id is missing", () => {
      const req = { params: {}, auth_context: {} } as never
      expect(() => readCustomerId(req)).toThrow(
        /Authenticated customer required/,
      )
    })
  })

  describe("readRequiredString", () => {
    it("returns the trimmed value when present", () => {
      expect(readRequiredString({ product_id: "  prod_a  " }, "product_id")).toBe(
        "prod_a",
      )
    })

    it("throws when body is null", () => {
      expect(() => readRequiredString(null, "product_id")).toThrow(
        /JSON object/,
      )
    })

    it("throws when key is missing", () => {
      expect(() => readRequiredString({}, "product_id")).toThrow(/required/)
    })

    it("throws when value is the empty string", () => {
      expect(() => readRequiredString({ product_id: "   " }, "product_id")).toThrow(
        /required/,
      )
    })

    it("throws when value is not a string", () => {
      expect(() => readRequiredString({ product_id: 123 }, "product_id")).toThrow(
        /required/,
      )
    })
  })

  describe("readOptionalString", () => {
    it("returns the trimmed value when present", () => {
      expect(readOptionalString({ x: "  hello  " }, "x")).toBe("hello")
    })

    it("returns undefined when body is not an object", () => {
      expect(readOptionalString(null, "x")).toBeUndefined()
      expect(readOptionalString("nope", "x")).toBeUndefined()
    })

    it("returns undefined when key is absent", () => {
      expect(readOptionalString({}, "x")).toBeUndefined()
    })

    it("returns undefined when value is the empty string", () => {
      expect(readOptionalString({ x: "   " }, "x")).toBeUndefined()
    })

    it("returns undefined when value is not a string", () => {
      expect(readOptionalString({ x: 7 }, "x")).toBeUndefined()
    })
  })

  describe("readOptionalNullableString", () => {
    it("returns the trimmed value when a non-empty string is provided", () => {
      expect(readOptionalNullableString({ variant_id: " v1 " }, "variant_id")).toBe(
        "v1",
      )
    })

    it("returns null when the value is the literal null", () => {
      expect(
        readOptionalNullableString({ variant_id: null }, "variant_id"),
      ).toBeNull()
    })

    it("returns null when the value is an empty / whitespace string", () => {
      expect(
        readOptionalNullableString({ variant_id: "   " }, "variant_id"),
      ).toBeNull()
    })

    it("returns undefined when the key is absent", () => {
      expect(readOptionalNullableString({}, "variant_id")).toBeUndefined()
    })

    it("returns undefined when the value is not a string and not null", () => {
      expect(
        readOptionalNullableString({ variant_id: 1 }, "variant_id"),
      ).toBeUndefined()
    })
  })

  describe("response shapes", () => {
    it("emptyListResponse returns the documented empty shape", () => {
      const r = emptyListResponse("cus_1", "wishlist")
      expect(r).toEqual({
        list: { id: null, customer_id: "cus_1", list_type: "wishlist", items: [] },
      })
    })

    it("listResponse mirrors the list row id + customer_id + items array", () => {
      const list = { id: "cl_1", customer_id: "cus_1", list_type: "compare" }
      const items = [
        {
          id: "i_1",
          customer_list_id: "cl_1",
          product_id: "p_1",
          variant_id: null,
          title_snapshot: null,
          thumbnail_snapshot: null,
        },
      ]
      const r = listResponse(list, "compare", items)
      expect(r.list.id).toBe("cl_1")
      expect(r.list.customer_id).toBe("cus_1")
      expect(r.list.list_type).toBe("compare")
      expect(r.list.items).toBe(items)
    })
  })
})
