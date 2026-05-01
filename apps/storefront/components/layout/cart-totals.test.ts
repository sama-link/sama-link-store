import { describe, expect, it } from "vitest";
import { getCartItemsSubtotal } from "@/components/layout/cart-totals";

describe("getCartItemsSubtotal", () => {
  it("prefers cart.item_subtotal (excludes shipping) even if cart.subtotal includes shipping", () => {
    const value = getCartItemsSubtotal({
      // Medusa: cart.subtotal = item_subtotal + shipping_subtotal
      // Cart drawer must not use cart.subtotal for "Subtotal".
      subtotal: 23_850,
      item_subtotal: 23_800,
      items: [{ unit_price: 999, quantity: 99 }],
    } as any);

    expect(value).toBe(23_800);
  });

  it("sums line items when cart.item_subtotal is missing", () => {
    const value = getCartItemsSubtotal({
      items: [
        { unit_price: 10_000, quantity: 2 },
        { unit_price: 3_800, quantity: 1 },
      ],
    } as any);

    expect(value).toBe(23_800);
  });
});
