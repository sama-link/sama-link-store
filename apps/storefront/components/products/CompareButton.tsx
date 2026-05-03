"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { CompareItem } from "@/hooks/useCompare";
import { COMPARE_MAX_ITEMS, useCompare } from "@/hooks/useCompare";
import { motion, AnimatePresence } from "framer-motion";

function CompareIcon({ pressed }: { pressed: boolean }) {
  /* Two opposing arrows — reads as "compare side-by-side" cleaner than a 2-rect glyph. */
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 sm:h-4.5 sm:w-4.5"
      animate={{
        rotate: pressed ? 180 : 0,
        scale: pressed ? [1, 1.2, 1] : 1,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <path d="M3 7h12a4 4 0 0 1 4 4v2" />
      <polyline points="7 3 3 7 7 11" />
      <path d="M21 17H9a4 4 0 0 1-4-4v-2" />
      <polyline points="17 21 21 17 17 13" />
    </motion.svg>
  );
}

export interface CompareButtonProps {
  item: CompareItem;
  className?: string;
  /** Button size — default "md" (40px), "sm" (32px) for dense card contexts. */
  size?: "sm" | "md";
}

export default function CompareButton({ item, className, size = "md" }: CompareButtonProps) {
  const t = useTranslations("compare");
  const { has, toggle, isHydrated } = useCompare();
  const [liveMsg, setLiveMsg] = useState("");
  const [fullHint, setFullHint] = useState(false);

  const pressed = has(item.id);

  const announce = useCallback((msg: string) => {
    setLiveMsg("");
    requestAnimationFrame(() => setLiveMsg(msg));
  }, []);

  useEffect(() => {
    if (!fullHint) return;
    const id = window.setTimeout(() => setFullHint(false), 4000);
    return () => window.clearTimeout(id);
  }, [fullHint]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const result = toggle(item);
      if (!result.ok && result.reason === "full") {
        setFullHint(true);
        return;
      }
      announce(pressed ? t("removedAria") : t("addedAria"));
    },
    [announce, item, pressed, t, toggle],
  );

  return (
    <span className={cn("relative inline-flex flex-col items-center", className)}>
      <span className="sr-only" aria-live="polite">
        {liveMsg}
      </span>
      <AnimatePresence>
        {fullHint && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            role="status"
            className="absolute -top-2 left-1/2 z-20 w-max max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface px-3 py-1.5 text-center text-xs font-medium text-text-primary shadow-lg"
          >
            {t("full", { max: COMPARE_MAX_ITEMS })}
          </motion.span>
        )}
      </AnimatePresence>
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
          "hover:bg-brand-muted/30 hover:text-brand hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/20",
          pressed && "text-brand bg-brand-muted/10 border-brand/20 border",
        )}
      >
        <AnimatePresence>
          {pressed && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full bg-brand/20"
            />
          )}
        </AnimatePresence>
        <div className="relative z-10 flex items-center justify-center">
          <CompareIcon pressed={pressed} />
        </div>
      </motion.button>
    </span>
  );
}
