"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
  /** Borderless style — used when nested inside a shared border group (e.g. Header prefs pill). */
  bare?: boolean;
}

/* Theme toggle — sun/moon with brand-calibrated fiery / silver luminescence (slow, eye-easy pulses). */
export default function ThemeToggle({ bare = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const t = useTranslations("nav");
  const isDark = theme === "dark";

  return (
    <motion.button
      whileHover={{
        scale: 1.06,
        transition: { type: "spring", stiffness: 420, damping: 22 },
      }}
      whileTap={{ scale: 0.92 }}
      type="button"
      onClick={toggle}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      aria-pressed={isDark}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden transition-[box-shadow,background-color,color] duration-200",
        "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
        bare
          ? "h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/55"
          : "h-10 w-10 rounded-full border border-border bg-surface hover:border-brand/35 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              className="h-5 w-5 sm:h-[1.375rem] sm:w-[1.375rem] animate-pulse"
              aria-hidden="true"
            >
              <path fill="currentColor" stroke="none" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              className="h-5 w-5 sm:h-[1.375rem] sm:w-[1.375rem] animate-pulse"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
              <path
                stroke="currentColor"
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
              />
            </svg>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
