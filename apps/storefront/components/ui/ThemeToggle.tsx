"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
  /** Borderless style — used when nested inside a shared border group (e.g. Header prefs pill). */
  bare?: boolean;
}

/* Theme toggle — rounded-full icon button with a smooth sun/moon crossfade + rotate. */
export default function ThemeToggle({ bare = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const t = useTranslations("nav");
  const isDark = theme === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={toggle}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      aria-pressed={isDark}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden text-text-secondary transition-all hover:text-brand",
        bare
          ? "h-9 w-9 rounded-full hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          : "h-10 w-10 rounded-full border border-border bg-surface hover:border-brand hover:bg-brand/5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            /* Moon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            /* Sun */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
