"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import CartLineItem from "@/components/layout/CartLineItem";
import { getCartItemsSubtotal } from "@/lib/cart-totals";
import { formatPrice } from "@/lib/format-price";
import { motion } from "framer-motion";
import { ShoppingCart, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface CartPageContentProps {
  locale: string;
}

export default function CartPageContent({ locale }: CartPageContentProps) {
  const t = useTranslations("cart");
  const { cart, loading, updateItem, removeItem } = useCart();
  const isArabic = locale === "ar";

  const currencyCode = cart?.currency_code ?? "USD";
  const hasItems = Boolean(cart?.items?.length);
  const itemsSubtotal = getCartItemsSubtotal(cart);

  if (loading && !hasItems) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand mb-4" />
        <p className="text-text-secondary font-medium">{t("loading")}</p>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface p-12 sm:p-24 text-center shadow-sm animate-fade-in">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
          <ShoppingCart className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t("empty")}
        </h2>
        <p className="text-text-secondary mb-8 max-w-md">
          {isArabic 
            ? "عربة التسوق الخاصة بك فارغة حالياً. تصفح منتجاتنا واضف ما يعجبك هنا." 
            : "Your shopping cart is currently empty. Browse our products and add what you like here."}
        </p>
        <Link href={`/${locale}/products`} passHref>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md"
          >
            <ShoppingBag className="h-5 w-5" />
            {t("continueShopping")}
          </motion.div>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] pb-32 lg:pb-0 animate-fade-in">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <div className="border-b border-border bg-surface-subtle p-5">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-brand" />
              {isArabic ? "محتويات العربة" : "Cart Items"}
              <span className="ml-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {cart?.items?.length}
              </span>
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {cart!.items!.map((item: any) => (
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
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 lg:static lg:z-auto lg:sticky lg:top-24 lg:h-max">
        <div className="overflow-hidden border-t lg:border border-border bg-surface shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:rounded-2xl lg:dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <div className="hidden lg:block border-b border-border bg-surface-subtle p-5">
            <h2 className="text-lg font-bold text-text-primary">
              {t("orderSummary")}
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:space-y-4">
              <div className="hidden lg:flex items-center justify-between text-sm">
                <span className="text-text-secondary">{t("subtotal")}</span>
                <span className="font-semibold text-text-primary">
                  {formatPrice(itemsSubtotal, currencyCode, locale)}
                </span>
              </div>
              <div className="lg:border-t lg:border-border lg:pt-4 lg:mt-2">
                <div className="flex items-end justify-between">
                  <span className="text-base font-bold text-text-primary">{isArabic ? "الإجمالي" : "Total"}</span>
                  <span className="text-xl font-bold text-brand">
                    {formatPrice(itemsSubtotal, currencyCode, locale)}
                  </span>
                </div>
                <p className="mt-1 hidden lg:block text-xs text-text-muted">
                  {isArabic ? "الشحن والضرائب تحسب عند إتمام الطلب" : "Shipping & taxes calculated at checkout"}
                </p>
              </div>
            </div>

            <Link href={`/${locale}/checkout/address`} passHref>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "mt-4 lg:mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 lg:py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md",
                  loading && "pointer-events-none opacity-70"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {t("proceedToCheckout")}
                    <ArrowRight className={cn("h-5 w-5", isArabic && "rotate-180")} />
                  </>
                )}
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
