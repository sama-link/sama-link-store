"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";

/* Floating cart button — mobile only.
   Always visible; when the drawer is open the FAB scales down in place so
   it reads as "pressed" while the cart popup sits just above it.
   Tapping it toggles the drawer. */
export default function CartFab() {
  const t = useTranslations("nav");
  const { itemCount, openCart, closeCart, isCartOpen } = useCart();
  const [displayCount, setDisplayCount] = useState(itemCount);

  useEffect(() => {
    if (itemCount > displayCount) {
      const timer = setTimeout(() => setDisplayCount(itemCount), 1000);
      return () => clearTimeout(timer);
    } else {
      setDisplayCount(itemCount);
    }
  }, [itemCount, displayCount]);

  const toggle = () => {
    if (isCartOpen) closeCart();
    else openCart();
  };

  return (
    <motion.button
      id="mobile-cart-fab"
      type="button"
      onClick={toggle}
      aria-label={t("openCart", { count: itemCount })}
      aria-pressed={isCartOpen}
      aria-expanded={isCartOpen}
      whileHover={{ scale: isCartOpen ? 0 : 1.05 }}
      whileTap={{ scale: isCartOpen ? 0 : 0.9 }}
      className={cn(
        "fixed bottom-5 end-5 z-40 inline-flex items-center justify-center rounded-full text-white transition-colors duration-250 lg:hidden bg-brand shadow-[0_4px_14px_rgba(15,43,79,0.4)]",
        isCartOpen && "pointer-events-none"
      )}
      initial={false}
      animate={{
        height: 56,
        width: 56,
        scale: isCartOpen ? 0 : 1,
        opacity: isCartOpen ? 0 : 1,
      }}
    >
      <ShoppingCart className="h-6 w-6 transition-transform duration-300" />
      
      <AnimatePresence>
        {displayCount > 0 && !isCartOpen && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            className="absolute -end-1 -top-1 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-surface bg-error px-1 text-[11px] font-bold text-white shadow-sm"
          >
            {displayCount > 99 ? "99+" : displayCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
