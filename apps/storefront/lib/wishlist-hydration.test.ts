// Sama Link · Wishlist hydration helpers — unit tests (ACCT-6D).

import { describe, expect, it } from "vitest";
import {
  wishlistItemFromBackendRow,
  wishlistItemsFromBackendList,
} from "./wishlist-hydration";
import type { CustomerListItem } from "./medusa-client";

function row(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
  return {
    id: "i_1",
    customer_list_id: "cl_1",
    product_id: "prod_a",
    variant_id: "var_x",
    title_snapshot: "Sample title",
    thumbnail_snapshot: "https://example/img.jpg",
    ...overrides,
  };
}

describe("wishlistItemFromBackendRow", () => {
  it("maps product_id → id and snapshot fields onto the WishlistItem shape", () => {
    const out = wishlistItemFromBackendRow(row());
    expect(out.id).toBe("prod_a");
    expect(out.title).toBe("Sample title");
    expect(out.thumbnail).toBe("https://example/img.jpg");
    expect(out.variantId).toBe("var_x");
    expect(out.backendItemId).toBe("i_1");
  });

  it("nulls out the catalog-only fields the backend does not store", () => {
    const out = wishlistItemFromBackendRow(row());
    expect(out.handle).toBeNull();
    expect(out.subtitle).toBeNull();
    expect(out.material).toBeNull();
    expect(out.weight).toBeNull();
    expect(out.originCountry).toBeNull();
    expect(out.amount).toBeNull();
    expect(out.currencyCode).toBeNull();
  });

  it("preserves null variant_id (product-level, no pinned variant)", () => {
    const out = wishlistItemFromBackendRow(row({ variant_id: null }));
    expect(out.variantId).toBeNull();
  });

  it("preserves null tombstone fields when the backend has none", () => {
    const out = wishlistItemFromBackendRow(
      row({ title_snapshot: null, thumbnail_snapshot: null }),
    );
    expect(out.title).toBeNull();
    expect(out.thumbnail).toBeNull();
  });
});

describe("wishlistItemsFromBackendList", () => {
  it("returns an empty array for an empty input", () => {
    expect(wishlistItemsFromBackendList([])).toEqual([]);
  });

  it("preserves order across the mapped list", () => {
    const out = wishlistItemsFromBackendList([
      row({ id: "i_1", product_id: "p_1" }),
      row({ id: "i_2", product_id: "p_2" }),
      row({ id: "i_3", product_id: "p_3" }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["p_1", "p_2", "p_3"]);
    expect(out.map((i) => i.backendItemId)).toEqual(["i_1", "i_2", "i_3"]);
  });
});
