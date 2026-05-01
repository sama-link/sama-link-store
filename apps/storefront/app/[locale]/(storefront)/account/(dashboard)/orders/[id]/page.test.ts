import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import OrderDetailPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    return (key: string, values?: Record<string, unknown>) => {
      if (!values) return key;
      return `${key}:${JSON.stringify(values)}`;
    };
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("@/lib/auth-cookie", () => ({
  getAuthToken: vi.fn(async () => "tok"),
}));

vi.mock("@/lib/medusa-client", () => ({
  getCustomerOrder: vi.fn(),
}));

vi.mock("@/lib/format-price", () => ({
  formatPrice: vi.fn((amount: number, currency: string) => `${currency}:${amount}`),
}));

describe("order detail page", () => {
  it("renders order details, totals, address, and customer-friendly status", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_1",
      display_id: 1024,
      created_at: "2026-04-29T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      subtotal: 900,
      shipping_total: 50,
      tax_total: 100,
      discount_total: 50,
      total: 1000,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "123 Street",
        city: "Cairo",
        country_code: "eg",
        phone: "01000000000",
      },
      items: [
        {
          id: "item_1",
          title: "Router",
          subtitle: "AX",
          quantity: 2,
          unit_price: 450,
          total: 900,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_1" }),
    });
    const html = renderToString(jsx);

    expect(getCustomerOrder).toHaveBeenCalledWith("order_1", "tok", {
      fields: expect.stringContaining("items.title"),
    });
    expect(html).toContain("orders.detail.heading");
    expect(html).toContain("orders.customerStatus.delivered");
    // Display-only override: when payment is captured/paid AND fulfillment
    // is delivered, the order's primary badge reads "Complete" instead of
    // the raw "pending" admin lifecycle marker. order.status itself is
    // unchanged on the server.
    expect(html).toContain("orders.status.complete");
    expect(html).not.toContain("orders.status.pending");
    expect(html).toContain("orders.paymentStatus.captured");
    expect(html).toContain("orders.fulfillmentStatus.delivered");
    expect(html).toContain("Router");
    expect(html).toContain("123 Street");
    expect(html).toContain("egp:1000");
  });

  it("keeps the raw order.status label when payment or fulfillment is not yet final", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_2",
      display_id: 1025,
      created_at: "2026-04-29T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "shipped", // not delivered yet
      subtotal: 900,
      shipping_total: 50,
      tax_total: 0,
      discount_total: 0,
      total: 950,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "1 Street",
        city: "Cairo",
        country_code: "eg",
      },
      items: [{ id: "i1", title: "X", quantity: 1, unit_price: 900, total: 900 }],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_2" }),
    });
    const html = renderToString(jsx);

    // Not paid+delivered → order status badge stays as the raw "pending".
    expect(html).toContain("orders.status.pending");
    expect(html).not.toContain("orders.status.complete");
  });
});
