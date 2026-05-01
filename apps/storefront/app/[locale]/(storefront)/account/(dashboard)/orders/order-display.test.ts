import { describe, expect, it, vi } from "vitest";
import {
  displayOrderStatus,
  displayOrderStatusVariant,
} from "./order-display";

type Translator = (key: string) => string;
const t = vi.fn<Translator>((key: string) => key) as unknown as Parameters<
  typeof displayOrderStatus
>[3];

describe("displayOrderStatus (ACCT-5 derived primary status)", () => {
  it("paid + delivered -> 'orders.status.complete'", () => {
    expect(displayOrderStatus("pending", "captured", "delivered", t)).toBe(
      "orders.status.complete",
    );
    expect(displayOrderStatus("pending", "paid", "delivered", t)).toBe(
      "orders.status.complete",
    );
  });

  it("not paid OR not delivered -> raw order.status (typically 'pending')", () => {
    expect(displayOrderStatus("pending", "authorized", "not_fulfilled", t)).toBe(
      "orders.status.pending",
    );
    expect(displayOrderStatus("pending", "captured", "shipped", t)).toBe(
      "orders.status.pending",
    );
    expect(displayOrderStatus("pending", "awaiting", "delivered", t)).toBe(
      "orders.status.pending",
    );
    expect(displayOrderStatus("pending", "captured", null, t)).toBe(
      "orders.status.pending",
    );
  });

  it("any cancellation flag -> 'orders.status.canceled' (cancellation always wins)", () => {
    expect(displayOrderStatus("canceled", "captured", "delivered", t)).toBe(
      "orders.status.canceled",
    );
    expect(displayOrderStatus("pending", "canceled", "delivered", t)).toBe(
      "orders.status.canceled",
    );
    expect(displayOrderStatus("pending", "captured", "canceled", t)).toBe(
      "orders.status.canceled",
    );
  });

  it("returns null when order.status is null/undefined and no rule fires", () => {
    expect(displayOrderStatus(null, null, null, t)).toBeNull();
    expect(displayOrderStatus(undefined, "awaiting", "shipped", t)).toBeNull();
  });

  it("falls back to capitalized raw value for unknown statuses", () => {
    expect(
      displayOrderStatus("some_new_status", "awaiting", "shipped", t),
    ).toBe("Some New Status");
  });
});

describe("displayOrderStatusVariant", () => {
  it("paid + delivered -> 'success'", () => {
    expect(displayOrderStatusVariant("pending", "captured", "delivered")).toBe(
      "success",
    );
  });

  it("any cancellation -> 'error'", () => {
    expect(displayOrderStatusVariant("canceled", "captured", "delivered")).toBe(
      "error",
    );
    expect(displayOrderStatusVariant("pending", "canceled", "delivered")).toBe(
      "error",
    );
    expect(displayOrderStatusVariant("pending", "captured", "canceled")).toBe(
      "error",
    );
  });

  it("falls back to statusVariant(order.status) otherwise (pending -> warning)", () => {
    expect(displayOrderStatusVariant("pending", "authorized", "shipped")).toBe(
      "warning",
    );
  });
});
