"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";
import CartLineItem from "@/components/layout/CartLineItem";
import { formatPrice } from "@/lib/format-price";

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
  const [panelIn, setPanelIn] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);

  useEffect(() => {
    if (!isCartOpen) {
      setPanelIn(false);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setPanelIn(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [isCartOpen]);

  /* Lock body scroll only on desktop side-drawer mode; mobile popup is compact
     enough that users can scroll behind it (per product direction). */
  useEffect(() => {
    if (!isCartOpen) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth < 640) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isCartOpen]);

  /* Measure header bottom for the desktop side-drawer offset. */
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
    return () => window.removeEventListener("resize", measure);
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
  }, [isCartOpen, closeCart, cart?.items, loading, panelIn]);

  if (!isCartOpen) return null;

  const currencyCode = cart?.currency_code ?? "EGP";
  const hasItems = Boolean(cart?.items?.length);
  const itemCount =
    cart?.items?.reduce((sum, it) => sum + (it.quantity ?? 0), 0) ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="pointer-events-none fixed inset-0 z-40"
    >
      {/* Scrim — soft dim + blur on mobile so the page reads as "paused, still there";
          fuller dim on desktop so the side drawer gets clean focus. */}
      <div
        style={{ top: `${headerBottom}px` }}
        className={cn(
          "pointer-events-auto fixed inset-x-0 bottom-0 z-30 transition-opacity duration-300 ease-out",
          "bg-[color:rgba(10,19,36,0.28)] backdrop-blur-sm sm:bg-[color:rgba(10,19,36,0.55)] sm:backdrop-blur-0",
          panelIn ? "opacity-100" : "opacity-0",
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        /* Inline top offset only kicks in for the desktop side-drawer variant. */
        style={
          typeof window !== "undefined" && window.innerWidth >= 640
            ? { top: `${headerBottom}px` }
            : undefined
        }
        className={cn(
          /* Mobile floating popup — emerges directly above the cart FAB.
             z-[45] sits above the filter FAB (z-[41]) so the panel cleanly
             covers it while the cart is open (mutual exclusion already
             closes the filter when cart opens). */
          "pointer-events-auto fixed bottom-24 end-4 z-[45] flex max-h-[72vh] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-surface",
          "transition-[transform,opacity] duration-250 ease-out",
          panelIn
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
          /* Desktop side drawer — overrides mobile positioning on sm+.
             Full height below the header, 420 px wide, flush with end edge. */
          "sm:bottom-0 sm:end-0 sm:max-h-none sm:w-full sm:max-w-[420px] sm:rounded-none sm:border-0 sm:border-s sm:border-border sm:opacity-100",
          panelIn
            ? "sm:translate-x-0"
            : "ltr:sm:translate-x-full rtl:sm:-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2
            id="cart-drawer-title"
            className="flex items-center gap-2.5 text-base font-semibold text-text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-brand"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M3 4h2.5l2.1 10.5a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6.2" />
            </svg>
            <span>{t("title")}</span>
            {itemCount > 0 ? (
              <span className="text-sm font-normal text-text-muted">
                ({itemCount})
              </span>
            ) : null}
          </h2>
          {/* Mobile-only X — desktop closes via header icon toggle or Esc. */}
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary motion-safe:active:scale-90 sm:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-text-secondary">{t("loading")}</p>
          ) : !cart?.items?.length ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
              <p className="text-sm font-medium text-text-primary">
                {t("empty")}
              </p>
              <a
                href={`/${locale}/products`}
                onClick={closeCart}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
              >
                {t("continueShopping")}
              </a>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  currencyCode={currencyCode}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  removeLabel={t("remove")}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && hasItems ? (
          <div className="space-y-3 border-t border-border bg-surface-subtle px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{t("subtotal")}</span>
              <span className="text-lg font-bold text-brand">
                {formatPrice(cart?.subtotal, currencyCode, locale)}
              </span>
            </div>
            <a
              href={`/${locale}/checkout/address`}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            >
              {t("checkout")}
            </a>
            <a
              href={`/${locale}/cart`}
              onClick={closeCart}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-text-primary transition-colors hover:border-border-strong hover:bg-surface-subtle"
            >
              {t("viewCart")}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
