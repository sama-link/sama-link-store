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
    expect(html).toContain("orders.status.pending");
    expect(html).toContain("orders.paymentStatus.captured");
    expect(html).toContain("orders.fulfillmentStatus.fulfilled");
    expect(html).toContain("orders.showingHint");
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
