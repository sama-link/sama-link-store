import { describe, expect, it } from "vitest";
import {
  getOrderDiscountTotal,
  getOrderGrandTotal,
  getOrderItemsSubtotal,
  getOrderLineDisplayTotal,
  getOrderLineUnitPrice,
  getOrderShippingTotal,
  getOrderTaxTotal,
} from "@/lib/order-totals";

describe("getOrderItemsSubtotal", () => {
  it("regression for order #19: items 2,013 + shipping 50 -> Subtotal 2,013, Shipping 50, Total 2,063", () => {
    // Reproduces the bug where the v2 store API returned `order.subtotal = 50`
    // (shipping amount) for a real-world order whose item_subtotal was 2,013.
    // The helper sidesteps `order.subtotal` and derives from `item_subtotal`
    // with a line-item fallback.
    const order = {
      subtotal: 50,
      item_subtotal: 2_013,
      shipping_subtotal: 50,
      shipping_total: 50,
      tax_total: 0,
      discount_total: 0,
      total: 2_063,
      items: [{ unit_price: 0, quantity: 1, total: 2_013 }],
    } as never;
    expect(getOrderItemsSubtotal(order)).toBe(2_013);
    expect(getOrderShippingTotal(order)).toBe(50);
    expect(getOrderTaxTotal(order)).toBe(0);
    expect(getOrderDiscountTotal(order)).toBe(0);
    expect(getOrderGrandTotal(order)).toBe(2_063);
  });

  it("sums line items when order.item_subtotal is missing (defensive)", () => {
    const order = {
      items: [
        { quantity: 2, total: 1_000 },
        { quantity: 1, total: 500 },
      ],
    } as never;
    expect(getOrderItemsSubtotal(order)).toBe(1_500);
  });

  it("returns 0 for null / undefined / empty order", () => {
    expect(getOrderItemsSubtotal(null)).toBe(0);
    expect(getOrderItemsSubtotal(undefined)).toBe(0);
    expect(getOrderItemsSubtotal({} as never)).toBe(0);
  });
});

describe("getOrderShippingTotal", () => {
  it("prefers shipping_subtotal (matches Medusa Admin label)", () => {
    expect(
      getOrderShippingTotal({
        shipping_subtotal: 50,
        shipping_total: 60,
      } as never),
    ).toBe(50);
  });

  it("falls back to shipping_total when shipping_subtotal is missing", () => {
    expect(
      getOrderShippingTotal({ shipping_total: 60 } as never),
    ).toBe(60);
  });

  it("returns 0 when both are missing", () => {
    expect(getOrderShippingTotal({} as never)).toBe(0);
  });
});

describe("getOrderLineDisplayTotal / getOrderLineUnitPrice", () => {
  it("getOrderLineDisplayTotal prefers subtotal then total then unit*qty", () => {
    expect(
      getOrderLineDisplayTotal({
        subtotal: 1_000,
        total: 2_000,
        unit_price: 10,
        quantity: 1,
      }),
    ).toBe(1_000);
    expect(
      getOrderLineDisplayTotal({
        total: 2_000,
        unit_price: 10,
        quantity: 1,
      }),
    ).toBe(2_000);
    expect(
      getOrderLineDisplayTotal({ unit_price: 100, quantity: 3 }),
    ).toBe(300);
  });

  it("regression: unit_price = 0 with real line total -> derived unit price (no 0.00 display)", () => {
    // Storefront previously rendered '0.00' beneath the real line total when
    // the v2 order API returned unit_price = 0. The helper now derives unit
    // price from total / quantity so the row never shows a misleading 0.00.
    expect(
      getOrderLineUnitPrice({ unit_price: 0, quantity: 2, total: 2_000 }),
    ).toBe(1_000);
    expect(
      getOrderLineUnitPrice({ quantity: 4, subtotal: 800 }),
    ).toBe(200);
  });

  it("getOrderLineUnitPrice keeps unit_price when it is non-zero and finite", () => {
    expect(
      getOrderLineUnitPrice({ unit_price: 450, quantity: 2, total: 900 }),
    ).toBe(450);
  });
});
