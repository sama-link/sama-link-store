"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";
import CartLineItem from "@/components/layout/CartLineItem";
import { getCartItemsSubtotal } from "@/lib/cart-totals";
import { formatPrice } from "@/lib/format-price";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

function collectFocusable(panel: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.from(panel.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
  );
}

/* Cart panel.

   Desktop (≥ sm): side drawer — full-height, starts below the sticky header,
   420 px wide, slides in from the end edge. Classic e-commerce pattern.

   Mobile (< sm): floating popup anchored to the cart FAB (bottom-end), compact
   (≈ 320 px × 70vh max), rounded, with a dim scrim. Built so the user can
   dismiss and keep scrolling the catalog behind it. */
export default function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const {
    cart,
    loading,
    isCartOpen,
    closeCart,
    updateItem,
    removeItem,
  } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  /* Lock body scroll when drawer is open. */
  useEffect(() => {
    if (!isCartOpen) return;
    if (typeof window === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isCartOpen]);

  /* Measure header bottom so both mobile popup and desktop drawer clear it.
     Re-measures on scroll too — the new StickyHeader hides on scroll-down /
     reveals on scroll-up by toggling its inline `top` style, and on mobile
     (body scroll is NOT locked, see effect above) the drawer must follow
     the header's vertical position. Desktop has body-scroll-lock so scroll
     events don't fire there; the listener is harmless there. */
  useEffect(() => {
    if (!isCartOpen) return;
    const measure = () => {
      const header = document.querySelector("header");
      if (!header) return;
      const rect = header.getBoundingClientRect();
      setHeaderBottom(Math.max(0, Math.round(rect.bottom)));
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;
    const panelEl = panelRef.current;
    if (!panelEl) return;
    const trapRoot: HTMLElement = panelEl;

    const focusFirst = () => {
      const focusable = collectFocusable(trapRoot);
      focusable[0]?.focus();
    };
    focusFirst();

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        closeCart();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = collectFocusable(trapRoot);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isCartOpen, closeCart, cart?.items, loading]);

  /* Close the drawer on route navigation so the user sees the new page cleanly. */
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    if (!isCartOpen) return;
    if (typeof window === "undefined") return;
    closeCart();
  }, [pathname, isCartOpen, closeCart]);

  const currencyCode = cart?.currency_code ?? "EGP";
  const hasItems = Boolean(cart?.items?.length);
  const itemCount =
    cart?.items?.reduce((sum: number, it: any) => sum + (it.quantity ?? 0), 0) ?? 0;
  const itemsSubtotal = getCartItemsSubtotal(cart);
  const isArabic = locale === "ar";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="pointer-events-none fixed inset-0 z-40"
    >
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Scrim — dim only (no backdrop blur) so the page reads as paused. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ top: `${headerBottom}px` }}
              className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 bg-[color:rgba(10,19,36,0.45)] sm:bg-[color:rgba(10,19,36,0.55)]"
              onClick={closeCart}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: isArabic ? "-100%" : "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isArabic ? "-100%" : "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              style={{ top: `${headerBottom}px` }}
              className={cn(
                "pointer-events-auto fixed bottom-0 end-0 z-[45] flex w-[90vw] max-w-[420px] sm:w-full flex-col border-s border-border bg-surface shadow-[0_0_40px_rgb(0,0,0,0.12)]",
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface-subtle/50 px-5 py-4">
                <h2
                  id="cart-drawer-title"
                  className="flex items-center gap-2.5 text-base font-bold text-text-primary"
                >
                  <ShoppingCart className="h-5 w-5 text-brand" />
                  <span>{t("title")}</span>
                  {itemCount > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                      {itemCount}
                    </span>
                  ) : null}
                </h2>
                {/* Mobile-only X — desktop closes via header icon toggle or Esc. */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={closeCart}
                  aria-label={t("close")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary sm:hidden"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {loading && !hasItems ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand mb-4" />
                    <p className="text-sm font-medium text-text-secondary">{t("loading")}</p>
                  </div>
                ) : !hasItems ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10 animate-fade-in">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-subtle text-text-muted shadow-sm">
                      <ShoppingBag className="h-8 w-8" />
                    </span>
                    <p className="text-base font-semibold text-text-primary">
                      {t("empty")}
                    </p>
                    <Link
                      href={`/${locale}/products`}
                      onClick={closeCart}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow motion-safe:hover:scale-[1.05] motion-safe:active:scale-[0.95]"
                    >
                      {t("continueShopping")}
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2 animate-fade-in">
                    {cart?.items?.map((item: any) => (
                      <CartLineItem
                        key={item.id}
                        item={item}
                        currencyCode={currencyCode}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                        removeLabel={t("remove")}
                        variant="drawer"
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {!loading && hasItems ? (
                <div className="space-y-4 border-t border-border bg-surface-subtle/50 px-5 py-5 animate-fade-in">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-medium text-text-secondary">{t("subtotal")}</span>
                    <span className="text-xl font-bold text-brand">
                      {formatPrice(itemsSubtotal, currencyCode, locale)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/${locale}/checkout/address`}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
                    >
                      {t("checkout")}
                      <ArrowRight className={cn("h-4 w-4", isArabic && "rotate-180")} />
                    </Link>
                    <Link
                      href={`/${locale}/cart`}
                      onClick={closeCart}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-text-primary transition-all hover:border-border-strong hover:bg-surface-subtle motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
                    >
                      {t("viewCart")}
                    </Link>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
