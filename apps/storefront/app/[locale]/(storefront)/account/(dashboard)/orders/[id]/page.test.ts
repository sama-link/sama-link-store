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
    // New structured Status card: 3 labeled rows; primary status reads
    // "Complete" because payment is captured + fulfillment is delivered.
    expect(html).toContain("orders.detail.orderStatusLabel");
    expect(html).toContain("orders.detail.paymentStatusLabel");
    expect(html).toContain("orders.detail.deliveryStatusLabel");
    expect(html).toContain("orders.status.complete");
    expect(html).not.toContain("orders.status.pending");
    expect(html).toContain("orders.paymentStatus.captured");
    expect(html).toContain("orders.fulfillmentStatus.delivered");
    // Old multi-badge primary (customerStatus.delivered) is no longer rendered.
    expect(html).not.toContain("orders.customerStatus.delivered");
    expect(html).toContain("Router");
    expect(html).toContain("123 Street");
    expect(html).toContain("egp:1000");
  });

  it("regression: order #18 shape (line item.total = 0 next to a real unit_price) renders 610.5, never 0.00", async () => {
    // Real-world bug from PR #46: SDK returned `item.total = 0` next to a
    // positive `unit_price`, and `order.subtotal = 50` / `order.total = 50`
    // (the shipping amount leaked into both fields). The canonical helpers
    // must render the line as 610.5 (not 0), Subtotal as 610.5 (sum of
    // items, ignoring order.subtotal), and Total as 660.5 (computed from
    // parts, not the broken 50). Status structure must not regress this.
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_18",
      display_id: 18,
      created_at: "2026-04-30T12:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      subtotal: 50,
      shipping_subtotal: 50,
      shipping_total: 50,
      tax_total: 0,
      discount_total: 0,
      total: 50,
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
          total: 0,
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

    // Line top + Subtotal → 2 places render 610.5. The unit-price line
    // below the line total is suppressed because quantity === 1
    // (item-row cleanup; previously rendered a duplicate 610.5).
    expect(occurs("egp:610.5")).toBeGreaterThanOrEqual(2);
    // Total derived from parts (610.5 + 50 + 0 - 0).
    expect(html).toContain("egp:660.5");
    // Shipping renders.
    expect(html).toContain("egp:50");
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
      subtotal: 50,
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
          unit_price: 0,
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

  it("regression: order #20 shape (item 2,900 + shipping 50) -> Subtotal 2,900, Shipping 50, Total 2,950, no 0.00 line", async () => {
    // Owner-reported regression on the PR #49 branch (status restructure
    // pre-rebase): a healthy-priced item rendered as `0.00 EGP / 2,900 EGP`
    // because the page logic predated PR #46's canonical helpers. This
    // test locks in the post-rebase behavior so the status PR can never
    // re-introduce the totals bug:
    //   - line top must be 2,900 (NOT 0)
    //   - subtotal = 2,900
    //   - shipping = 50
    //   - total = 2,950
    //   - status structure remains correct (Pending — fulfillment not
    //     delivered)
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_20",
      display_id: 20,
      created_at: "2026-05-01T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "authorized",
      fulfillment_status: "not_fulfilled",
      // SDK quirks consistent with the user's screenshot:
      // order.subtotal/order.total leak the shipping value;
      // item.total comes back as 0 next to a positive unit_price.
      subtotal: 50,
      shipping_subtotal: 50,
      shipping_total: 50,
      tax_total: 0,
      discount_total: 0,
      total: 50,
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
          title: "Premium Item",
          quantity: 1,
          unit_price: 2_900,
          total: 0,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_20" }),
    });
    const html = renderToString(jsx);

    const occurs = (s: string) =>
      (html.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ||
        [])
        .length;

    // Line top + Subtotal must render 2,900. The duplicate unit-price
    // line below the line total is suppressed by the item-row cleanup
    // because quantity === 1.
    expect(occurs("egp:2900")).toBeGreaterThanOrEqual(2);
    // Computed total = 2,900 + 50 + 0 - 0 = 2,950 (the broken reported
    // order.total = 50 is overridden by the parts-sum guard).
    expect(html).toContain("egp:2950");
    // Shipping renders.
    expect(html).toContain("egp:50");
    expect(html).toContain("Premium Item");

    // Status structure unchanged: Pending + Authorized + Not fulfilled.
    expect(html).toContain("orders.status.pending");
    expect(html).not.toContain("orders.status.complete");
    expect(html).toContain("orders.paymentStatus.authorized");
    expect(html).toContain("orders.fulfillmentStatus.notFulfilled");
  });

  it("item-row cleanup: subtitle equal to title is hidden; price renders once for qty=1", async () => {
    // Owner-reported regression: order rows showed
    //   Dual-Band Router SL-ROU-103
    //   Dual-Band Router SL-ROU-103   <- duplicate
    //   Qty 1
    //   731.50 EGP
    //   731.50 EGP                    <- duplicate
    // With the cleanup: title renders once (subtitle suppressed when it
    // equals title), and the unit-price line is suppressed for qty=1.
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_dup",
      display_id: 21,
      created_at: "2026-05-01T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      item_subtotal: 731.5,
      shipping_subtotal: 0,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      total: 731.5,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "1 Street",
        city: "Cairo",
        country_code: "eg",
      },
      items: [
        {
          id: "item_dup",
          title: "Dual-Band Router SL-ROU-103",
          subtitle: "Dual-Band Router SL-ROU-103", // duplicates the title
          quantity: 1,
          unit_price: 731.5,
          total: 731.5,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_dup" }),
    });
    const html = renderToString(jsx);

    const occurs = (s: string) =>
      (html.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ||
        [])
        .length;

    // Title appears only once in the row (the page header repeats it via
    // `orders.detail.heading`, so we look for the literal product string
    // appearing exactly once — it's not the heading copy).
    expect(occurs("Dual-Band Router SL-ROU-103")).toBe(1);
    // Price 731.5 appears: line top + Subtotal + Total = 3. NOT a 4th
    // duplicate unit-price line.
    expect(occurs("egp:731.5")).toBe(3);
    // The unit-price-times-quantity breakdown text is absent for qty=1.
    expect(html).not.toContain("× 1");
  });

  it("item-row cleanup: meaningful variant subtitle (e.g. 'One Size') renders under the product title", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_var",
      display_id: 22,
      created_at: "2026-05-01T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      item_subtotal: 200,
      shipping_subtotal: 0,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      total: 200,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "1 Street",
        city: "Cairo",
        country_code: "eg",
      },
      items: [
        {
          id: "item_var",
          title: "Cotton T-Shirt",
          subtitle: "One Size",
          quantity: 1,
          unit_price: 200,
          total: 200,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_var" }),
    });
    const html = renderToString(jsx);

    expect(html).toContain("Cotton T-Shirt");
    // Variant subtitle is shown because it differs from the title.
    expect(html).toContain("One Size");
  });

  it("item-row cleanup: quantity > 1 surfaces the unit-price × quantity breakdown", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_qty",
      display_id: 23,
      created_at: "2026-05-01T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      item_subtotal: 1463,
      shipping_subtotal: 0,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      total: 1463,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "1 Street",
        city: "Cairo",
        country_code: "eg",
      },
      items: [
        {
          id: "item_qty",
          title: "Router",
          quantity: 2,
          unit_price: 731.5,
          total: 1463,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_qty" }),
    });
    const html = renderToString(jsx);

    // Line top = 1463 (the line total).
    expect(html).toContain("egp:1463");
    // Useful breakdown for qty>1: "[unit] × 2".
    expect(html).toContain("egp:731.5");
    expect(html).toContain("× 2");
  });

  it("item-row cleanup: empty subtitle is not rendered", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_nosub",
      display_id: 24,
      created_at: "2026-05-01T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "delivered",
      item_subtotal: 100,
      shipping_subtotal: 0,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      total: 100,
      shipping_address: {
        first_name: "Ali",
        last_name: "Saleh",
        address_1: "1 Street",
        city: "Cairo",
        country_code: "eg",
      },
      items: [
        {
          id: "item_nosub",
          title: "Bare Item",
          subtitle: "",
          quantity: 1,
          unit_price: 100,
          total: 100,
        },
      ],
    } as never);

    const jsx = await OrderDetailPage({
      params: Promise.resolve({ locale: "en", id: "order_nosub" }),
    });
    const html = renderToString(jsx);

    expect(html).toContain("Bare Item");
    // No empty `<p>` from the subtitle slot — easiest sanity check is no
    // `× 1` and no duplicate price line.
    expect(html).not.toContain("× 1");
  });

  it("regression: paid + not-delivered orders show Pending in the Order status row", async () => {
    const { getCustomerOrder } = await import("@/lib/medusa-client");
    vi.mocked(getCustomerOrder).mockResolvedValueOnce({
      id: "order_2",
      display_id: 1025,
      created_at: "2026-04-29T10:00:00.000Z",
      currency_code: "egp",
      status: "pending",
      payment_status: "authorized",
      fulfillment_status: "not_fulfilled",
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

    // Order status row: Pending (override does NOT fire — fulfillment is
    // not delivered).
    expect(html).toContain("orders.status.pending");
    expect(html).not.toContain("orders.status.complete");
    // Payment row: Authorized.
    expect(html).toContain("orders.paymentStatus.authorized");
    // Delivery row: Not fulfilled.
    expect(html).toContain("orders.fulfillmentStatus.notFulfilled");
  });
});
