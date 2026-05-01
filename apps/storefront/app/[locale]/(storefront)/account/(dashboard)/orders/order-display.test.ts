import { describe, expect, it } from "vitest";
import { primaryOrderStatus } from "./order-display";

describe("primaryOrderStatus", () => {
  it("returns delivered when fulfillment is delivered even if order is pending and payment captured", () => {
    expect(
      primaryOrderStatus("pending", "captured", "delivered"),
    ).toBe("delivered");
    expect(primaryOrderStatus("pending", "captured", "partially_delivered")).toBe(
      "delivered",
    );
  });

  it("returns preparing when payment is captured/authorized and fulfillment is not shipped or delivered", () => {
    expect(primaryOrderStatus("pending", "captured", "not_fulfilled")).toBe(
      "preparing",
    );
    expect(primaryOrderStatus("pending", "authorized", null)).toBe("preparing");
    expect(primaryOrderStatus("pending", "captured", "fulfilled")).toBe("preparing");
  });

  it("returns shipped when fulfillment is shipped or partially_shipped", () => {
    expect(primaryOrderStatus("pending", "captured", "shipped")).toBe("shipped");
    expect(primaryOrderStatus("pending", "awaiting", "partially_shipped")).toBe(
      "shipped",
    );
  });

  it("returns cancelled when any layer is canceled", () => {
    expect(primaryOrderStatus("canceled", "captured", "not_fulfilled")).toBe(
      "cancelled",
    );
    expect(primaryOrderStatus("pending", "canceled", "not_fulfilled")).toBe(
      "cancelled",
    );
    expect(primaryOrderStatus("pending", "captured", "canceled")).toBe("cancelled");
  });

  it("returns paymentPending when payment awaits action before preparing", () => {
    expect(primaryOrderStatus("pending", "not_paid", "not_fulfilled")).toBe(
      "paymentPending",
    );
    expect(primaryOrderStatus("pending", "awaiting", null)).toBe("paymentPending");
  });
});
