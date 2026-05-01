import { describe, expect, it, vi } from "vitest";

const orderReviewMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const retrieveCartMock = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/cart-cookie", () => ({
  CART_COOKIE_NAME: "medusa_cart_id",
}));

vi.mock("@/lib/medusa-client", () => ({
  retrieveCart: retrieveCartMock,
}));

vi.mock("@/lib/seo", () => ({
  buildCanonical: vi.fn(),
}));

vi.mock("@/components/checkout/OrderReview", () => ({
  default: (props: unknown) => {
    orderReviewMock(props);
    return null;
  },
}));

import ReviewPage from "./page";

describe("checkout review page", () => {
  it("uses item subtotal while preserving shipping-inclusive total", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "cart_1" })),
    });
    retrieveCartMock.mockResolvedValue({
      cart: {
        id: "cart_1",
        currency_code: "egp",
        subtotal: 23850,
        item_subtotal: 23800,
        shipping_total: 50,
        tax_total: 0,
        discount_total: 0,
        total: 23850,
        shipping_address: {
          first_name: "Ali",
          last_name: "Saleh",
          address_1: "123 Street",
          city: "Cairo",
          country_code: "eg",
        },
        shipping_methods: [
          {
            id: "sm_1",
            name: "Fast Delivery",
            amount: 50,
          },
        ],
        items: [
          {
            id: "item_1",
            title: "Camera",
            unit_price: 23800,
            quantity: 1,
          },
        ],
      },
    });

    const element = await ReviewPage({ params: Promise.resolve({ locale: "en" }) });

    expect((element as { props: unknown }).props).toEqual(
      expect.objectContaining({
        subtotal: 23800,
        shippingMethod: expect.objectContaining({ amount: 50 }),
        total: 23850,
      }),
    );
  });

  it("derives item subtotal from line items when aggregate item subtotal is absent", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "cart_1" })),
    });
    retrieveCartMock.mockResolvedValue({
      cart: {
        id: "cart_1",
        currency_code: "egp",
        subtotal: 23850,
        shipping_total: 50,
        tax_total: 0,
        discount_total: 0,
        total: 23850,
        shipping_address: {
          first_name: "Ali",
          last_name: "Saleh",
          address_1: "123 Street",
          city: "Cairo",
          country_code: "eg",
        },
        shipping_methods: [
          {
            id: "sm_1",
            name: "Fast Delivery",
            amount: 50,
          },
        ],
        items: [
          {
            id: "item_1",
            title: "Camera",
            unit_price: 23800,
            quantity: 1,
          },
        ],
      },
    });

    const element = await ReviewPage({ params: Promise.resolve({ locale: "en" }) });

    expect((element as { props: unknown }).props).toEqual(
      expect.objectContaining({
        subtotal: 23800,
        shippingMethod: expect.objectContaining({ amount: 50 }),
        total: 23850,
      }),
    );
  });
});
