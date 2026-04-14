"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { completeCart } from "@/lib/medusa-client";
import { clearCartId } from "@/lib/cart-cookie";
import { formatPrice } from "@/lib/format-price";

export interface ReviewLineItem {
  id: string;
  title: string;
  thumbnail: string | null;
  unit_price: number;
  quantity: number;
  variantTitle: string;
}

export interface ReviewAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  country_code: string;
  province: string;
}

export interface ReviewShippingMethod {
  name: string;
  amount: number;
}

interface OrderReviewProps {
  locale: string;
  cartId: string;
  currencyCode: string;
  items: ReviewLineItem[];
  shippingAddress: ReviewAddress;
  shippingMethod: ReviewShippingMethod;
  subtotal: number;
  total: number;
}

export default function OrderReview({
  locale,
  cartId,
  currencyCode,
  items,
  shippingAddress,
  shippingMethod,
  subtotal,
  total,
}: OrderReviewProps) {
  const t = useTranslations("checkout.review");
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [apiError, setApiError] = useState("");

  async function handlePlaceOrder() {
    setPlacing(true);
    setApiError("");

    try {
      const result = await completeCart(cartId);

      if (result.type === "order") {
        clearCartId();
        const displayId = result.order.display_id ?? "";
        router.push(`/${locale}/order-confirmed?display_id=${displayId}`);
      } else {
        setApiError(result.error?.message ?? t("error"));
        setPlacing(false);
      }
    } catch {
      setApiError(t("error"));
      setPlacing(false);
    }
  }

  const fmt = (amount: number) => formatPrice(amount, currencyCode);

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            {t("items")}
          </h2>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface-subtle">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      width={56}
                      height={56}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {item.title}
                  </p>
                  {item.variantTitle ? (
                    <p className="text-xs text-text-secondary">
                      {item.variantTitle}
                    </p>
                  ) : null}
                  <p className="text-xs text-text-secondary">
                    {fmt(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {fmt(item.unit_price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            {t("deliverTo")}
          </h2>
          <address className="not-italic text-sm text-text-secondary space-y-0.5">
            <p className="font-medium text-text-primary">
              {shippingAddress.first_name} {shippingAddress.last_name}
            </p>
            <p>{shippingAddress.address_1}</p>
            {shippingAddress.address_2 ? (
              <p>{shippingAddress.address_2}</p>
            ) : null}
            <p>
              {shippingAddress.city}
              {shippingAddress.province
                ? `, ${shippingAddress.province}`
                : ""}
            </p>
            <p className="uppercase">{shippingAddress.country_code}</p>
          </address>
        </div>
      </div>

      <div className="mt-8 lg:col-span-1 lg:mt-0">
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-base font-semibold text-text-primary">
            {t("orderSummary")}
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("subtotal")}</span>
              <span className="font-medium text-text-primary">
                {fmt(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">
                {shippingMethod.name}
              </span>
              <span className="font-medium text-text-primary">
                {fmt(shippingMethod.amount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-text-primary">
                {t("total")}
              </span>
              <span className="font-bold text-text-primary">{fmt(total)}</span>
            </div>
          </div>

          {apiError ? (
            <p className="text-sm text-red-500" role="alert">
              {apiError}
            </p>
          ) : null}

          <button
            type="button"
            disabled={placing}
            onClick={() => void handlePlaceOrder()}
            className="w-full rounded-md bg-brand py-2.5 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover disabled:opacity-50"
          >
            {placing ? t("placing") : t("placeOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
