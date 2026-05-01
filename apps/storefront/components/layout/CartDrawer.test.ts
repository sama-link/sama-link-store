import { describe, expect, it } from "vitest";
import { getCartItemsSubtotal } from "@/components/layout/cart-totals";

describe("CartDrawer subtotal (merchandise only)", () => {
  it("does not include shipping in the drawer subtotal when shipping exists on the cart", () => {
    // Regression: cart.subtotal can include shipping_subtotal while checkout selection UX
    // still treats shipping as a checkout step. Drawer "Subtotal" must remain items-only.
    const cart = {
      currency_code: "EGP",
      subtotal: 23_850,
      item_subtotal: 23_800,
      shipping_total: 50,
      items: [{ id: "li_1", unit_price: 23_800, quantity: 1 }],
    };

    expect(getCartItemsSubtotal(cart)).toBe(23_800);
  });
});
