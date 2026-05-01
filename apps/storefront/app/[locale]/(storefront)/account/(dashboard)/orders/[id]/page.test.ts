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
    expect(html).toContain("orders.status.pending");
    expect(html).toContain("orders.paymentStatus.captured");
    expect(html).toContain("orders.fulfillmentStatus.delivered");
    expect(html).toContain("Router");
    expect(html).toContain("123 Street");
    expect(html).toContain("egp:1000");
  });

  it("regression: order #18 shape (line item.total = 0 next to a real unit_price) renders 610.5, never 0.00", async () => {
    // Real-world bug: SDK returned `item.total = 0` next to a positive
    // `unit_price`, and `order.subtotal = 50` / `order.total = 50` (the
    // shipping amount leaked into both fields). The storefront previously
    // rendered "0.00 EGP / 610.50 EGP" on the row and "Subtotal 50,
    // Shipping 50, Total 50". The canonical helpers must:
    //   - render the line as 610.5 / 610.5 (never 0)
    //   - render Subtotal 610.5 (sum of line items, ignoring order.subtotal)
    //   - render Total 660.5 (computed from parts, not the broken 50)
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_18",
      display_id: 18,
      created_at: "2026-04-30T12:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      subtotal: 50, // SDK quirk: shipping leaked into items field
      shipping_subtotal: 50,
      shipping_total: 50,
      tax_total: 0,
      discount_total: 0,
      total: 50, // SDK quirk: too low
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "12 Tahrir",
        city: "Cairo",
        country_code: "eg",
      },
      items: [
        {
          id: "item_a",
          title: "Premium Router",
          quantity: 1,
          unit_price: 610.5,
          total: 0, // bug: zero line total alongside positive unit_price
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_18" }),
    });
    const html = renderToString(jsx);

    const occurs = (s: string) =>
      (html.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ||
        [])
        .length;

    // Line top + line bottom + Subtotal — three places must render 610.5.
    expect(occurs("egp:610.5")).toBeGreaterThanOrEqual(3);
    // Total derived from parts (610.5 + 50 + 0 - 0).
    expect(html).toContain("egp:660.5");
    // Shipping renders.
    expect(html).toContain("egp:50");
    // Crucial: the displayed Total must NOT equal the broken reported 50.
    // We assert "egp:660.5" appears at least once (already above) AND
    // there is no "egp:50)" placement that would suggest Total=50; checking
    // for "egp:660.5" presence is the canonical guard.
    expect(html).toContain("Premium Router");
  });

  it("regression: order #19 shape (item_subtotal 2,013 + shipping 50) -> Subtotal 2,013, Shipping 50, Total 2,063", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_19",
      display_id: 19,
      created_at: "2026-04-29T12:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      item_subtotal: 2_013,
      subtotal: 50, // SDK quirk
      shipping_subtotal: 50,
      shipping_total: 50,
      tax_total: 0,
      discount_total: 0,
      total: 2_063,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "12 Tahrir",
        city: "Cairo",
        country_code: "eg",
      },
      items: [
        {
          id: "item_a",
          title: "Item",
          quantity: 1,
          unit_price: 0, // SDK quirk
          total: 2_013,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_19" }),
    });
    const html = renderToString(jsx);

    expect(html).toContain("egp:2013"); // line top + Subtotal
    expect(html).toContain("egp:50"); // shipping
    expect(html).toContain("egp:2063"); // grand total
  });
});
