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

  const currencyCode = cart?.currency_code ?? "USD";
  const hasItems = Boolean(cart?.items?.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-40"
    >
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={cn(
          "fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col bg-surface shadow-xl",
          "transition-transform duration-300 ease-out",
          panelIn
            ? "translate-x-0"
            : "ltr:translate-x-full rtl:-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2
            id="cart-drawer-title"
            className="text-lg font-semibold text-text-primary"
          >
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("close")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-text-secondary">{t("loading")}</p>
          ) : !cart?.items?.length ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-text-secondary">{t("empty")}</p>
              <a
                href={`/${locale}/products`}
                onClick={closeCart}
                className="text-sm font-medium text-brand transition-colors hover:text-brand-hover"
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

        {!loading && hasItems ? (
          <div className="space-y-4 border-t border-border px-4 py-4">
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
              {t("checkout")}
            </a>
            <a
              href={`/${locale}/cart`}
              onClick={closeCart}
              className="block w-full rounded-md border border-border py-2.5 text-center text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle"
            >
              {t("viewCart")}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
