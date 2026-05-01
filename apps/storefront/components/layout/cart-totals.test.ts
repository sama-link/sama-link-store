import { describe, expect, it } from "vitest";
import { getCartItemsSubtotal } from "./cart-totals";

describe("getCartItemsSubtotal", () => {
  it("uses item subtotal instead of cart subtotal when shipping is present", () => {
    expect(
      getCartItemsSubtotal({
        item_subtotal: 23800,
        item_total: 23800,
        items: [
          {
            unit_price: 23800,
            quantity: 1,
          },
        ],
      }),
    ).toBe(23800);
  });

  it("derives item subtotal from lines when aggregate item totals are unavailable", () => {
    expect(
      getCartItemsSubtotal({
        items: [
          {
            unit_price: 23800,
            quantity: 1,
          },
        ],
      }),
    ).toBe(23800);
  });
});
