"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={t("openCart", { count: itemCount })}
      aria-pressed={isCartOpen}
      aria-expanded={isCartOpen}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-all duration-200",
        isCartOpen 
          ? "bg-brand-muted/10 text-brand border border-brand/20 shadow-sm" 
          : "hover:bg-brand/5 hover:text-brand border border-transparent hover:border-border hover:shadow-sm"
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

      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            key={itemCount}
            aria-hidden="true"
            className="absolute -end-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface bg-brand px-1 text-[10px] font-bold text-text-inverse"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
