import { describe, expect, it, vi } from "vitest";
import {
  customerStatusLabel,
  displayOrderStatus,
  displayOrderStatusVariant,
} from "./order-display";

type Translator = (key: string) => string;
const t = vi.fn<Translator>((key: string) => key) as unknown as Parameters<
  typeof displayOrderStatus
>[3];

describe("displayOrderStatus (ACCT-5 derived 'Complete' rule)", () => {
  it("returns 'orders.status.complete' when paid + delivered (override of admin pending)", () => {
    expect(displayOrderStatus("pending", "captured", "delivered", t)).toBe(
      "orders.status.complete",
    );
    expect(displayOrderStatus("pending", "paid", "delivered", t)).toBe(
      "orders.status.complete",
    );
  });

  it("returns the raw localized order.status when payment is not paid/captured", () => {
    expect(displayOrderStatus("pending", "awaiting", "delivered", t)).toBe(
      "orders.status.pending",
    );
    expect(displayOrderStatus("pending", "not_paid", "delivered", t)).toBe(
      "orders.status.pending",
    );
  });

  it("returns the raw localized order.status when fulfillment is not delivered", () => {
    expect(displayOrderStatus("pending", "captured", "shipped", t)).toBe(
      "orders.status.pending",
    );
    expect(displayOrderStatus("pending", "captured", "fulfilled", t)).toBe(
      "orders.status.pending",
    );
    expect(displayOrderStatus("pending", "captured", null, t)).toBe(
      "orders.status.pending",
    );
  });

  it("does not override when order.status is canceled (cancellation wins)", () => {
    expect(displayOrderStatus("canceled", "captured", "delivered", t)).toBe(
      "orders.status.canceled",
    );
  });

  it("returns null when order.status is null/undefined and rule does not fire", () => {
    expect(displayOrderStatus(null, null, null, t)).toBeNull();
    expect(displayOrderStatus(undefined, "awaiting", "shipped", t)).toBeNull();
  });

  it("falls back to the helper key for unknown raw statuses", () => {
    // Falls through localizeStatus → fallbackStatusLabel for unknown values.
    expect(
      displayOrderStatus("some_new_status", "awaiting", "shipped", t),
    ).toBe("Some New Status");
  });
});

describe("displayOrderStatusVariant", () => {
  it("returns 'success' when paid + delivered", () => {
    expect(displayOrderStatusVariant("pending", "captured", "delivered")).toBe(
      "success",
    );
    expect(displayOrderStatusVariant("pending", "paid", "delivered")).toBe(
      "success",
    );
  });

  it("falls back to statusVariant(order.status) otherwise", () => {
    // pending → warning
    expect(displayOrderStatusVariant("pending", "awaiting", "shipped")).toBe(
      "warning",
    );
    // canceled → error (and the override does not fire)
    expect(displayOrderStatusVariant("canceled", "captured", "delivered")).toBe(
      "error",
    );
  });
});

describe("customerStatusLabel — preserved (regression guard)", () => {
  // The customer-friendly headline badge is unchanged by this PR.
  // Asserting we did not accidentally regress the existing rules.
  const tt = vi.fn<Translator>((key: string) => key) as unknown as Parameters<
    typeof customerStatusLabel
  >[3];
  it("delivered fulfillment renders the delivered customer label", () => {
    expect(customerStatusLabel("pending", "captured", "delivered", tt)).toBe(
      "orders.customerStatus.delivered",
    );
  });
  it("canceled wins over everything", () => {
    expect(customerStatusLabel("canceled", "captured", "delivered", tt)).toBe(
      "orders.customerStatus.canceled",
    );
  });
});
