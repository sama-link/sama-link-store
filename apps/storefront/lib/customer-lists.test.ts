// Sama Link · Customer-list typed helpers — unit tests (ACCT-6C).
//
// Vitest covers the four typed wrappers in `medusa-client.ts` that hit
// the ACCT-6B store routes. We stub `sdk.client.fetch` to assert the
// exact path/method/headers/body each helper sends, plus the cap-error
// extraction logic on the 409 path.

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerListCapReachedError,
  addItemToCustomerList,
  clearCustomerList,
  getCustomerList,
  removeItemFromCustomerList,
  sdk,
  type CustomerList,
  type CustomerListItem,
} from "./medusa-client";

const TOKEN = "tok_test";
const BEARER = { Authorization: `Bearer ${TOKEN}` };

function makeFetchError(status: number, body?: unknown): Error {
  // Mirrors the shape `sdk.client.fetch` throws on non-2xx — `status`
  // on the error itself is what `getErrorStatusCode` reads.
  const err = Object.assign(new Error("request failed"), { status }) as Error & {
    status: number;
    body?: unknown;
  };
  if (body !== undefined) err.body = body;
  return err;
}

describe("getCustomerList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls GET /store/customer-lists/wishlist with the bearer header and unwraps `list`", async () => {
    const listResponse: CustomerList = {
      id: "cl_1",
      customer_id: "cus_1",
      list_type: "wishlist",
      items: [],
    };
    const fetch = vi
      .spyOn(sdk.client, "fetch")
      .mockResolvedValue({ list: listResponse } as never);

    const out = await getCustomerList(TOKEN, "wishlist");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/store/customer-lists/wishlist", {
      method: "GET",
      headers: BEARER,
    });
    expect(out).toEqual(listResponse);
  });

  it("returns the empty-shape list when the backend returns id=null + items=[]", async () => {
    const empty: CustomerList = {
      id: null,
      customer_id: "cus_1",
      list_type: "compare",
      items: [],
    };
    vi.spyOn(sdk.client, "fetch").mockResolvedValue({ list: empty } as never);

    const out = await getCustomerList(TOKEN, "compare");

    expect(out.id).toBeNull();
    expect(out.items).toHaveLength(0);
  });
});

describe("addItemToCustomerList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs the payload with the bearer header and returns the result", async () => {
    const item: CustomerListItem = {
      id: "i_1",
      customer_list_id: "cl_1",
      product_id: "prod_a",
      variant_id: "var_x",
      title_snapshot: null,
      thumbnail_snapshot: null,
    };
    const fetch = vi
      .spyOn(sdk.client, "fetch")
      .mockResolvedValue({ item, created: true } as never);

    const out = await addItemToCustomerList(TOKEN, "wishlist", {
      product_id: "prod_a",
      variant_id: "var_x",
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/store/customer-lists/wishlist/items",
      {
        method: "POST",
        headers: BEARER,
        body: { product_id: "prod_a", variant_id: "var_x" },
      },
    );
    expect(out).toEqual({ item, created: true });
  });

  it("targets compare path when list_type is compare", async () => {
    const fetch = vi
      .spyOn(sdk.client, "fetch")
      .mockResolvedValue({ item: { id: "i_2" }, created: true } as never);

    await addItemToCustomerList(TOKEN, "compare", { product_id: "prod_b" });

    expect(fetch.mock.calls[0][0]).toBe("/store/customer-lists/compare/items");
  });

  it("translates a 409 with code=compare_full into CustomerListCapReachedError", async () => {
    vi.spyOn(sdk.client, "fetch").mockRejectedValue(
      makeFetchError(409, {
        code: "compare_full",
        message: "Compare list is full (max 4 items).",
        list_type: "compare",
        cap: 4,
      }),
    );

    await expect(
      addItemToCustomerList(TOKEN, "compare", { product_id: "prod_c" }),
    ).rejects.toBeInstanceOf(CustomerListCapReachedError);
  });

  it("CustomerListCapReachedError carries the typed body fields", async () => {
    vi.spyOn(sdk.client, "fetch").mockRejectedValue(
      makeFetchError(409, {
        code: "wishlist_full",
        message: "Wishlist is full (max 200 items).",
        list_type: "wishlist",
        cap: 200,
      }),
    );

    try {
      await addItemToCustomerList(TOKEN, "wishlist", { product_id: "prod_d" });
      throw new Error("Expected addItemToCustomerList to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(CustomerListCapReachedError);
      const e = error as CustomerListCapReachedError;
      expect(e.code).toBe("wishlist_full");
      expect(e.listType).toBe("wishlist");
      expect(e.cap).toBe(200);
      expect(e.message).toMatch(/Wishlist is full/);
    }
  });

  it("rethrows non-409 errors untouched", async () => {
    const error = makeFetchError(500);
    vi.spyOn(sdk.client, "fetch").mockRejectedValue(error);

    await expect(
      addItemToCustomerList(TOKEN, "wishlist", { product_id: "prod_e" }),
    ).rejects.toBe(error);
  });

  it("rethrows a 409 whose body is not a recognised cap-error shape (no false positive)", async () => {
    const error = makeFetchError(409, { code: "something_else" });
    vi.spyOn(sdk.client, "fetch").mockRejectedValue(error);

    await expect(
      addItemToCustomerList(TOKEN, "wishlist", { product_id: "prod_f" }),
    ).rejects.toBe(error);
  });
});

describe("removeItemFromCustomerList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("DELETEs /store/customer-lists/:list_type/items/:item_id", async () => {
    const fetch = vi
      .spyOn(sdk.client, "fetch")
      .mockResolvedValue({ deleted: true, id: "i_99" } as never);

    await removeItemFromCustomerList(TOKEN, "wishlist", "i_99");

    expect(fetch).toHaveBeenCalledWith(
      "/store/customer-lists/wishlist/items/i_99",
      { method: "DELETE", headers: BEARER },
    );
  });

  it("propagates 404 status untouched (caller handles 'already gone')", async () => {
    const error = makeFetchError(404);
    vi.spyOn(sdk.client, "fetch").mockRejectedValue(error);

    await expect(
      removeItemFromCustomerList(TOKEN, "compare", "i_missing"),
    ).rejects.toBe(error);
  });
});

describe("clearCustomerList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("DELETEs /store/customer-lists/:list_type/items and returns the count", async () => {
    const fetch = vi
      .spyOn(sdk.client, "fetch")
      .mockResolvedValue({ deleted: true, count: 7 } as never);

    const out = await clearCustomerList(TOKEN, "wishlist");

    expect(fetch).toHaveBeenCalledWith(
      "/store/customer-lists/wishlist/items",
      { method: "DELETE", headers: BEARER },
    );
    expect(out).toEqual({ deleted: true, count: 7 });
  });
});
