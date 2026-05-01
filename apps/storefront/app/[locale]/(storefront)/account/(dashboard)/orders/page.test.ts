import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import OrdersPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    return (key: string, values?: Record<string, unknown>) => {
      if (!values) return key;
      return `${key}:${JSON.stringify(values)}`;
    };
  }),
}));

vi.mock("@/lib/auth-cookie", () => ({
  getAuthToken: vi.fn(async () => "tok"),
}));

vi.mock("@/lib/medusa-client", () => ({
  listCustomerOrders: vi.fn(),
}));

vi.mock("@/lib/format-price", () => ({
  formatPrice: vi.fn((amount: number) => `formatted:${amount}`),
}));

describe("orders page", () => {
  it("renders empty state when no orders", async () => {
    const { listCustomerOrders } = await import("@/lib/medusa-client");
    vi.mocked(listCustomerOrders).mockResolvedValueOnce({
      orders: [],
      count: 0,
      offset: 0,
      limit: 50,
    } as never);

    const jsx = await OrdersPage({ params: Promise.resolve({ locale: "en" }) });
    const html = renderToString(jsx);

    expect(html).toContain("orders.empty.heading");
    expect(html).toContain("orders.empty.startCta");
  });

  it("renders rows and showing hint when count exceeds loaded orders", async () => {
    const { listCustomerOrders } = await import("@/lib/medusa-client");
    vi.mocked(listCustomerOrders).mockResolvedValueOnce({
      orders: [
        {
          id: "order_1",
          display_id: 1024,
          created_at: "2026-04-29T10:00:00.000Z",
          total: 1000,
          currency_code: "egp",
          status: "pending",
          payment_status: "captured",
          fulfillment_status: "fulfilled",
          items: [{ id: "item_1" }],
        },
      ],
      count: 5,
      offset: 0,
      limit: 50,
    } as never);

    const jsx = await OrdersPage({ params: Promise.resolve({ locale: "en" }) });
    const html = renderToString(jsx);

    expect(html).toContain("1024");
    // New structured layout: one primary badge (the derived order status)
    // + Payment / Delivery labeled secondary text. fulfillment=fulfilled
    // (not delivered) so the override does NOT fire and the primary
    // status reads "Pending".
    expect(html).toContain("orders.status.pending");
    expect(html).not.toContain("orders.status.complete");
    // Payment label + value.
    expect(html).toContain("orders.paymentLabel");
    expect(html).toContain("orders.paymentStatus.captured");
    // Delivery label + value.
    expect(html).toContain("orders.deliveryLabel");
    expect(html).toContain("orders.fulfillmentStatus.fulfilled");
    // No old customerStatus badge.
    expect(html).not.toContain("orders.customerStatus.processing");
    expect(html).toContain("/en/account/orders/order_1");
    expect(html).toContain("orders.viewDetails");
    expect(html).toContain("orders.showingHint");
  });

  it("regression: paid + delivered order shows Complete primary + Paid + Delivered labels (no duplicate badges)", async () => {
    const { listCustomerOrders } = await import("@/lib/medusa-client");
    vi.mocked(listCustomerOrders).mockResolvedValueOnce({
      orders: [
        {
          id: "order_3",
          display_id: 18,
          created_at: "2026-04-30T10:00:00.000Z",
          total: 660,
          currency_code: "egp",
          status: "pending",
          payment_status: "captured",
          fulfillment_status: "delivered",
          items: [{ id: "item_a" }],
        },
      ],
      count: 1,
      offset: 0,
      limit: 50,
    } as never);

    const jsx = await OrdersPage({ params: Promise.resolve({ locale: "en" }) });
    const html = renderToString(jsx);

    expect(html).toContain("18");
    // Primary badge reads "Complete".
    expect(html).toContain("orders.status.complete");
    expect(html).not.toContain("orders.status.pending");
    // Payment + Delivery rows (no duplicate Delivered badge).
    expect(html).toContain("orders.paymentStatus.captured");
    expect(html).toContain("orders.fulfillmentStatus.delivered");
    // No `customerStatus.delivered` competing badge — that was the old
    // multi-badge layout.
    expect(html).not.toContain("orders.customerStatus.delivered");
    // Sanity: only ONE rendering of the localized primary value.
    const completeOccurrences = html.split("orders.status.complete").length - 1;
    expect(completeOccurrences).toBe(1);
  });

  it("renders error state when fetch throws", async () => {
    const { listCustomerOrders } = await import("@/lib/medusa-client");
    vi.mocked(listCustomerOrders).mockRejectedValueOnce(new Error("boom"));

    const jsx = await OrdersPage({ params: Promise.resolve({ locale: "en" }) });
    const html = renderToString(jsx);

    expect(html).toContain("orders.errorHeading");
    expect(html).toContain("orders.errorBody");
  });

  it("falls back to capitalized raw unknown status", async () => {
    const { listCustomerOrders } = await import("@/lib/medusa-client");
    vi.mocked(listCustomerOrders).mockResolvedValueOnce({
      orders: [
        {
          id: "order_2",
          created_at: "2026-04-29T10:00:00.000Z",
          total: 500,
          currency_code: "egp",
          status: "mystery_state",
        },
      ],
      count: 1,
      offset: 0,
      limit: 50,
    } as never);

    const jsx = await OrdersPage({ params: Promise.resolve({ locale: "en" }) });
    const html = renderToString(jsx);
    expect(html).toContain("order_2");
    expect(html).toContain("Mystery State");
  });
});
