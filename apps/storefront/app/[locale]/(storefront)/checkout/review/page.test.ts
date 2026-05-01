import { beforeEach, describe, expect, it, vi } from "vitest";

const { retrieveCartMock, cookiesMock, redirectMock } = vi.hoisted(() => ({
  retrieveCartMock: vi.fn(),
  cookiesMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("redirect");
  }),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/lib/seo", () => ({ buildCanonical: vi.fn(() => "/canonical") }));
vi.mock("@/lib/cart-cookie", () => ({ CART_COOKIE_NAME: "medusa_cart_id" }));
vi.mock("@/lib/medusa-client", () => ({ retrieveCart: retrieveCartMock }));

import ReviewPage from "./page";

type ReviewProps = {
  locale: string;
  cartId: string;
  currencyCode: string;
  items: Array<{ id: string; unit_price: number; quantity: number }>;
  subtotal: number;
  total: number;
  shippingMethod: { name: string; amount: number };
};

function getReviewProps(jsx: unknown): ReviewProps {
  const node = jsx as { props?: ReviewProps } | null;
  if (!node?.props) {
    throw new Error("ReviewPage did not return an OrderReview JSX node.");
  }
  return node.props;
}

const baseShippingAddress = {
  first_name: "X",
  last_name: "Y",
  address_1: "Street 1",
  address_2: null,
  city: "Cairo",
  country_code: "eg",
  province: null,
};

describe("checkout review page (totals integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "cart_1" })),
    });
  });

  it("regression: items 2,900 + shipping 50 -> Subtotal 2,900, Total 2,950", async () => {
    retrieveCartMock.mockResolvedValue({
      cart: {
        id: "cart_1",
        currency_code: "egp",
        // v2 quirk: cart.subtotal includes shipping_subtotal — must NOT
        // be used as the displayed Subtotal.
        subtotal: 2_950,
        item_subtotal: 2_900,
        shipping_subtotal: 50,
        shipping_total: 50,
        tax_total: 0,
        discount_total: 0,
        total: 2_950,
        shipping_address: baseShippingAddress,
        shipping_methods: [{ name: "Standard", amount: 50 }],
        items: [
          { id: "li_1", title: "Item", unit_price: 2_900, quantity: 1, variant: null },
        ],
      },
    });

    const jsx = await ReviewPage({ params: Promise.resolve({ locale: "en" }) });

    expect(redirectMock).not.toHaveBeenCalled();
    const props = getReviewProps(jsx);
    expect(props.subtotal).toBe(2_900);
    expect(props.total).toBe(2_950);
    expect(props.shippingMethod.amount).toBe(50);
  });

  it("regression: multi-item 23,800 + shipping 50 -> Subtotal 23,800, Total 23,850", async () => {
    retrieveCartMock.mockResolvedValue({
      cart: {
        id: "cart_2",
        currency_code: "egp",
        subtotal: 23_850,
        item_subtotal: 23_800,
        shipping_subtotal: 50,
        shipping_total: 50,
        tax_total: 0,
        discount_total: 0,
        total: 23_850,
        shipping_address: baseShippingAddress,
        shipping_methods: [{ name: "Standard", amount: 50 }],
        items: [
          { id: "li_1", title: "A", unit_price: 10_000, quantity: 2, variant: null },
          { id: "li_2", title: "B", unit_price: 3_800, quantity: 1, variant: null },
        ],
      },
    });

    const jsx = await ReviewPage({ params: Promise.resolve({ locale: "en" }) });

    const props = getReviewProps(jsx);
    expect(props.subtotal).toBe(23_800);
    expect(props.total).toBe(23_850);
  });

  it("derives Total from displayed parts when cart.total is lower than the sum (defensive)", async () => {
    retrieveCartMock.mockResolvedValue({
      cart: {
        id: "cart_3",
        currency_code: "egp",
        subtotal: 50,
        item_subtotal: 2_900,
        shipping_subtotal: 50,
        shipping_total: 50,
        tax_total: 0,
        discount_total: 0,
        total: 50, // stale / wrong
        shipping_address: baseShippingAddress,
        shipping_methods: [{ name: "Standard", amount: 50 }],
        items: [
          { id: "li_1", title: "Item", unit_price: 2_900, quantity: 1, variant: null },
        ],
      },
    });

    const jsx = await ReviewPage({ params: Promise.resolve({ locale: "en" }) });

    const props = getReviewProps(jsx);
    expect(props.subtotal).toBe(2_900);
    expect(props.total).toBe(2_950);
  });
});
