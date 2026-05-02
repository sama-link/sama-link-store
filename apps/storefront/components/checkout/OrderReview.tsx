"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { completeCart } from "@/lib/medusa-client";
import { clearCartId } from "@/lib/cart-cookie";
import { formatPrice } from "@/lib/format-price";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Truck, AlertCircle, Loader2, Receipt, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

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
  const isArabic = locale === "ar";

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

  const fmt = (amount: number) => formatPrice(amount, currencyCode, locale);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] pb-40 lg:pb-0">
      <div className="space-y-6">
        {/* Items Section */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <div className="border-b border-border bg-surface-subtle p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Package className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              {t("items")}
            </h2>
          </div>
          
          <ul className="divide-y divide-border">
            {items.map((item: any) => (
              <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-subtle/50">
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        width={80}
                        height={80}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-subtle text-text-muted">
                        <Package className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="font-semibold text-text-primary line-clamp-2">
                      {item.title}
                    </p>
                    {item.variantTitle && (
                      <p className="text-sm text-text-secondary mt-1">
                        {item.variantTitle}
                      </p>
                    )}
                    <p className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-1 text-xs font-medium text-text-secondary mt-2 w-max">
                      {fmt(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-center border-t border-border sm:border-0 pt-4 sm:pt-0">
                  <p className="text-base font-bold text-text-primary">
                    {fmt(item.unit_price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Shipping Information */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <div className="border-b border-border bg-surface-subtle p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              {t("deliverTo")}
            </h2>
          </div>
          <div className="p-5">
            <address className="not-italic text-sm text-text-secondary space-y-1.5">
              <p className="font-semibold text-text-primary text-base">
                {shippingAddress.first_name} {shippingAddress.last_name}
              </p>
              <p className="flex items-start gap-2 mt-2">
                <MapPin className="h-4 w-4 shrink-0 text-text-muted mt-0.5" />
                <span>
                  {shippingAddress.address_1}
                  {shippingAddress.address_2 ? <><br/>{shippingAddress.address_2}</> : null}
                  <br/>
                  {shippingAddress.city}
                  {shippingAddress.province ? `, ${shippingAddress.province}` : ""}
                  <br/>
                  <span className="uppercase font-medium">{shippingAddress.country_code}</span>
                </span>
              </p>
            </address>
          </div>
        </section>
      </div>

      {/* Order Summary */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:static lg:z-auto lg:sticky lg:top-24 lg:h-max">
        <section className="overflow-hidden border-t lg:border border-border bg-surface shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:rounded-2xl lg:dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <div className="hidden lg:flex border-b border-border bg-surface-subtle p-5 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Receipt className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              {t("orderSummary")}
            </h2>
          </div>
          
          <div className="p-4 sm:p-5">
            <div className="hidden lg:block space-y-4 text-sm">
              <div className="flex justify-between items-center gap-4">
                <span className="text-text-secondary">{t("subtotal")}</span>
                <span className="font-medium text-text-primary">
                  {fmt(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-text-secondary flex items-center gap-2">
                  <Truck className="h-4 w-4 text-text-muted" />
                  {shippingMethod.name}
                </span>
                <span className="font-medium text-text-primary">
                  {fmt(shippingMethod.amount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-end lg:border-t lg:border-border lg:pt-4 lg:mt-2">
              <span className="font-bold text-text-primary text-base">
                {t("total")}
              </span>
              <span className="text-xl font-bold text-brand">
                {fmt(total)}
              </span>
            </div>

            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 lg:mt-6 flex items-center gap-2 rounded-xl bg-error-muted p-4 text-sm text-error">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p role="alert">{apiError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={placing}
              onClick={() => void handlePlaceOrder()}
              className="mt-4 lg:mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md disabled:opacity-70 disabled:hover:scale-100"
            >
              {placing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("placing")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {t("placeOrder")}
                </>
              )}
            </motion.button>
          </div>
        </section>
      </div>
    </div>
  );
}
