"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import CartLineItem from "@/components/layout/CartLineItem";
import { formatPrice } from "@/lib/format-price";

interface CartPageContentProps {
  locale: string;
}

export default function CartPageContent({ locale }: CartPageContentProps) {
  const t = useTranslations("cart");
  const { cart, loading, updateItem, removeItem } = useCart();

  const currencyCode = cart?.currency_code ?? "USD";
  const hasItems = Boolean(cart?.items?.length);

  if (loading) {
    return <p className="text-text-secondary">{t("loading")}</p>;
  }

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-text-secondary">{t("empty")}</p>
        <a
          href={`/${locale}/products`}
          className="text-sm font-medium text-brand transition-colors hover:text-brand-hover"
        >
          {t("continueShopping")}
        </a>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {cart!.items!.map((item) => (
            <CartLineItem
              key={item.id}
              variant="page"
              item={item}
              currencyCode={currencyCode}
              onUpdate={updateItem}
              onRemove={removeItem}
              removeLabel={t("remove")}
            />
          ))}
        </ul>
      </div>

      <div className="mt-8 lg:mt-0 lg:col-span-1">
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-base font-semibold text-text-primary">
            {t("orderSummary")}
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t("subtotal")}</span>
            <span className="font-semibold text-text-primary">
              {formatPrice(cart?.subtotal, currencyCode, locale)}
            </span>
          </div>
          <a
            href={`/${locale}/checkout/address`}
            className="block w-full rounded-md bg-brand py-2.5 text-center text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover"
          >
            {t("proceedToCheckout")}
          </a>
        </div>
      </div>
    </div>
  );
}
