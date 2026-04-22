"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";

export default function CartButton() {
  const t = useTranslations("nav");
  const { itemCount, isCartOpen, openCart, closeCart } = useCart();

  /* Toggles the drawer. When already open, the same button closes it —
     matches the menu-button convention. */
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
        "relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-[background-color,color,transform] duration-150 hover:bg-surface-subtle hover:text-text-primary motion-safe:active:scale-90",
        isCartOpen && "bg-accent-muted text-brand",
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2.5l2.1 10.5a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6.2" />
      </svg>

      {itemCount > 0 ? (
        <span
          key={itemCount}
          aria-hidden="true"
          className="absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-0.5 text-[10px] font-bold text-text-inverse animate-pop-in"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}
