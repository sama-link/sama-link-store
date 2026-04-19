"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";

/* Floating cart button — mobile only.
   Always visible; when the drawer is open the FAB scales down in place so
   it reads as "pressed" while the cart popup sits just above it.
   Tapping it toggles the drawer. */
export default function CartFab() {
  const t = useTranslations("nav");
  const { itemCount, openCart, closeCart, isCartOpen } = useCart();

  const toggle = () => {
    if (isCartOpen) closeCart();
    else openCart();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("openCart", { count: itemCount })}
      aria-pressed={isCartOpen}
      aria-expanded={isCartOpen}
      className={cn(
        "fixed bottom-5 end-5 z-40 inline-flex items-center justify-center rounded-full bg-brand text-text-inverse transition-[transform,background-color,height,width] duration-250 hover:bg-brand-hover motion-safe:active:scale-90 sm:hidden",
        isCartOpen ? "h-10 w-10 scale-90 bg-brand-hover" : "h-12 w-12 scale-100",
      )}
      style={{
        boxShadow: isCartOpen
          ? "0 1px 2px rgba(15,43,79,0.20)"
          : "0 1px 2px rgba(15,43,79,0.28), 0 10px 22px -6px rgba(15,43,79,0.42)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2.5l2.1 10.5a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6.2" />
      </svg>
      {itemCount > 0 ? (
        <span
          aria-hidden="true"
          key={itemCount}
          className="absolute -end-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-error px-1 text-[10px] font-bold text-text-inverse animate-pop-in"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}
