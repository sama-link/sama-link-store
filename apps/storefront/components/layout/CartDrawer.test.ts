import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CartDrawer from "./CartDrawer";

const useCartMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useCart", () => ({
  useCart: useCartMock,
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/en/products"),
}));

vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "en"),
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/lib/format-price", () => ({
  formatPrice: vi.fn((amount: number) => `formatted:${amount}`),
}));

vi.mock("@/components/layout/CartLineItem", () => ({
  default: ({ item }: { item: { title?: string } }) =>
    createElement("li", null, item.title ?? "line item"),
}));

describe("CartDrawer", () => {
  it("labels item subtotal without including shipping", () => {
    useCartMock.mockReturnValue({
      cart: {
        currency_code: "EGP",
        subtotal: 23850,
        total: 23850,
        item_subtotal: 23800,
        item_total: 23800,
        shipping_total: 50,
        items: [
          {
            id: "item_1",
            title: "Camera",
            quantity: 1,
            unit_price: 23800,
          },
        ],
      },
      loading: false,
      isCartOpen: true,
      closeCart: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const html = renderToString(createElement(CartDrawer));

    expect(html).toContain("subtotal");
    expect(html).toContain("formatted:23800");
    expect(html).not.toContain("formatted:23850");
  });
});
