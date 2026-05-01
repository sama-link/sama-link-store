// Sama Link · Compare hydration helpers — unit tests (ACCT-6E).

import { describe, expect, it } from "vitest";
import {
  compareItemFromBackendRow,
  compareItemsFromBackendList,
} from "./compare-hydration";
import { COMPARE_MAX_ITEMS } from "./compare-cap";
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

describe("compareItemFromBackendRow", () => {
  it("maps product_id → id and snapshot fields onto the CompareItem shape", () => {
    const out = compareItemFromBackendRow(row());
    expect(out.id).toBe("prod_a");
    expect(out.title).toBe("Sample title");
    expect(out.thumbnail).toBe("https://example/img.jpg");
    expect(out.variantId).toBe("var_x");
    expect(out.backendItemId).toBe("i_1");
  });

  it("nulls out the catalog-only fields the backend does not store", () => {
    const out = compareItemFromBackendRow(row());
    expect(out.handle).toBeNull();
    expect(out.subtitle).toBeNull();
    expect(out.material).toBeNull();
    expect(out.weight).toBeNull();
    expect(out.originCountry).toBeNull();
    expect(out.amount).toBeNull();
    expect(out.currencyCode).toBeNull();
  });

  it("preserves null variant_id and null tombstone fields", () => {
    const out = compareItemFromBackendRow(
      row({ variant_id: null, title_snapshot: null, thumbnail_snapshot: null }),
    );
    expect(out.variantId).toBeNull();
    expect(out.title).toBeNull();
    expect(out.thumbnail).toBeNull();
  });
});

describe("compareItemsFromBackendList", () => {
  it("returns an empty array for an empty input", () => {
    expect(compareItemsFromBackendList([])).toEqual([]);
  });

  it("preserves order across the mapped list", () => {
    const out = compareItemsFromBackendList([
      row({ id: "i_1", product_id: "p_1" }),
      row({ id: "i_2", product_id: "p_2" }),
      row({ id: "i_3", product_id: "p_3" }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["p_1", "p_2", "p_3"]);
    expect(out.map((i) => i.backendItemId)).toEqual(["i_1", "i_2", "i_3"]);
  });

  it("caps at COMPARE_MAX_ITEMS even if the backend somehow returns more", () => {
    // Defensive against future server-side changes — the UI cap is the
    // contract this layer guarantees regardless of what the backend
    // sends.
    const tooMany = Array.from({ length: COMPARE_MAX_ITEMS + 3 }, (_, n) =>
      row({ id: `i_${n}`, product_id: `p_${n}` }),
    );
    const out = compareItemsFromBackendList(tooMany);
    expect(out).toHaveLength(COMPARE_MAX_ITEMS);
    expect(out.map((i) => i.id)).toEqual(
      tooMany.slice(0, COMPARE_MAX_ITEMS).map((r) => r.product_id),
    );
  });
});
