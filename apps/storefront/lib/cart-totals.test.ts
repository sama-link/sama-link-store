import { describe, expect, it } from "vitest";
import {
  getCartDiscountTotal,
  getCartGrandTotal,
  getCartItemsSubtotal,
  getCartLineDisplayTotal,
  getCartLineUnitPrice,
  getCartShippingTotal,
  getCartTaxTotal,
} from "@/lib/cart-totals";

describe("getCartItemsSubtotal (merchandise-only; excludes shipping)", () => {
  it("prefers cart.item_subtotal even when cart.subtotal includes shipping (v2 quirk)", () => {
    const cart = {
      // Medusa v2: cart.subtotal = item_subtotal + shipping_subtotal.
      // Cart drawer / cart page / checkout review must NOT use cart.subtotal.
      subtotal: 23_850,
      item_subtotal: 23_800,
      shipping_subtotal: 50,
      items: [{ unit_price: 999, quantity: 99 }],
    } as never;
    expect(getCartItemsSubtotal(cart)).toBe(23_800);
  });

  it("sums line items when cart.item_subtotal is missing", () => {
    const cart = {
      items: [
        { unit_price: 10_000, quantity: 2 },
        { unit_price: 3_800, quantity: 1 },
      ],
    } as never;
    expect(getCartItemsSubtotal(cart)).toBe(23_800);
  });

  it("regression: cart drawer with item subtotal 2,900 + shipping 50 -> Subtotal 2,900", () => {
    const cart = {
      subtotal: 2_950,
      item_subtotal: 2_900,
      shipping_subtotal: 50,
      shipping_total: 50,
      total: 2_950,
      items: [{ unit_price: 2_900, quantity: 1 }],
    } as never;
    expect(getCartItemsSubtotal(cart)).toBe(2_900);
    expect(getCartShippingTotal(cart)).toBe(50);
    expect(getCartGrandTotal(cart)).toBe(2_950);
  });

  it("regression: multi-item checkout with subtotal 23,800 + shipping 50 -> Subtotal 23,800, Total 23,850", () => {
    const cart = {
      item_subtotal: 23_800,
      subtotal: 23_850,
      shipping_total: 50,
      total: 23_850,
      items: [
        { unit_price: 10_000, quantity: 2 },
        { unit_price: 3_800, quantity: 1 },
      ],
    } as never;
    expect(getCartItemsSubtotal(cart)).toBe(23_800);
    expect(getCartShippingTotal(cart)).toBe(50);
    expect(getCartGrandTotal(cart)).toBe(23_850);
  });

  it("returns 0 for null / undefined / empty cart", () => {
    expect(getCartItemsSubtotal(null)).toBe(0);
    expect(getCartItemsSubtotal(undefined)).toBe(0);
    expect(getCartItemsSubtotal({} as never)).toBe(0);
  });
});

describe("getCartShippingTotal", () => {
  it("prefers shipping_total over shipping_subtotal", () => {
    expect(
      getCartShippingTotal({ shipping_total: 60, shipping_subtotal: 50 } as never),
    ).toBe(60);
  });

  it("falls back to shipping_subtotal when shipping_total is missing", () => {
    expect(
      getCartShippingTotal({ shipping_subtotal: 50 } as never),
    ).toBe(50);
  });

  it("returns 0 when neither field is set", () => {
    expect(getCartShippingTotal({} as never)).toBe(0);
  });
});

describe("getCartTaxTotal / getCartDiscountTotal / getCartGrandTotal", () => {
  it("returns the corresponding field, defaulting to 0", () => {
    const cart = {
      tax_total: 290,
      discount_total: 100,
      total: 3_140,
    } as never;
    expect(getCartTaxTotal(cart)).toBe(290);
    expect(getCartDiscountTotal(cart)).toBe(100);
    expect(getCartGrandTotal(cart)).toBe(3_140);
    expect(getCartTaxTotal(null)).toBe(0);
    expect(getCartDiscountTotal(undefined)).toBe(0);
    expect(getCartGrandTotal({} as never)).toBe(0);
  });
});

describe("getCartLineDisplayTotal / getCartLineUnitPrice", () => {
  it("prefers line.item_subtotal then subtotal then item_total then total", () => {
    expect(
      getCartLineDisplayTotal({
        item_subtotal: 100,
        subtotal: 200,
        item_total: 300,
        total: 400,
        unit_price: 10,
        quantity: 2,
      }),
    ).toBe(100);
    expect(
      getCartLineDisplayTotal({
        subtotal: 200,
        item_total: 300,
        total: 400,
        unit_price: 10,
        quantity: 2,
      }),
    ).toBe(200);
  });

  it("falls back to unit_price * quantity when no totals are set", () => {
    expect(
      getCartLineDisplayTotal({ unit_price: 25, quantity: 4 }),
    ).toBe(100);
  });

  it("getCartLineUnitPrice uses unit_price when present", () => {
    expect(
      getCartLineUnitPrice({ unit_price: 50, quantity: 2, total: 100 }),
    ).toBe(50);
  });

  it("getCartLineUnitPrice derives unit price from total/quantity when unit_price is 0 or missing", () => {
    expect(
      getCartLineUnitPrice({ unit_price: 0, quantity: 4, total: 200 }),
    ).toBe(50);
    expect(
      getCartLineUnitPrice({ quantity: 2, subtotal: 600 }),
    ).toBe(300);
  });
});
