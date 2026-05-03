"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { WishlistItem } from "@/hooks/useWishlist";
import { useWishlist } from "@/hooks/useWishlist";
import { motion, AnimatePresence } from "framer-motion";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 sm:h-4.5 sm:w-4.5"
      animate={{
        scale: filled ? [1, 1.3, 1] : 1,
        color: filled ? "var(--color-error)" : "currentColor",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </motion.svg>
  );
}

export interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
  /** Button size — default "md" (40px), "sm" (32px) for dense card contexts. */
  size?: "sm" | "md";
}

export default function WishlistButton({ item, className, size = "md" }: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const { has, toggle, isHydrated } = useWishlist();
  const [liveMsg, setLiveMsg] = useState("");

  const pressed = has(item.id);

  const announce = useCallback(
    (msg: string) => {
      setLiveMsg("");
      requestAnimationFrame(() => setLiveMsg(msg));
    },
    [],
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(item);
      announce(pressed ? t("removedAria") : t("addedAria"));
    },
    [announce, item, pressed, t, toggle],
  );

  return (
    <span className={cn("relative inline-flex", className)}>
      <span className="sr-only" aria-live="polite">
        {liveMsg}
      </span>
      <motion.button
        type="button"
        aria-pressed={pressed}
        aria-label={pressed ? t("remove") : t("add")}
        title={pressed ? t("remove") : t("add")}
        disabled={!isHydrated}
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "group relative inline-flex shrink-0 items-center justify-center rounded-full text-text-secondary transition-all overflow-hidden bg-surface shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgb(255,255,255,0.02)]",
          size === "sm" ? "h-8 w-8" : "h-10 w-10",
          "hover:bg-error-muted/30 hover:text-error hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-error/20",
          pressed && "text-error bg-error-muted/10 border-error/20 border",
        )}
      >
        <AnimatePresence>
          {pressed && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full bg-error/20"
            />
          )}
        </AnimatePresence>
        <div className="relative z-10 flex items-center justify-center">
          <HeartIcon filled={pressed} />
        </div>
      </motion.button>
    </span>
  );
}
