"use client";

import { useTranslations } from "next-intl";
import Logo from "@/components/ui/Logo";
import { motion } from "framer-motion";

/* Next.js App Router streaming loading state.
   Shown automatically between route segments while the server streams.
   Design is intentionally calm: centred logo with a soft pulse + a
   hairline brand progress bar underneath. Honours reduced-motion. */
export default function Loading() {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      aria-label={tCommon("loading")}
      className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6 py-20"
    >
      {/* Logo pulse */}
      <div className="page-loader-logo relative">
        <div className="absolute inset-0 bg-brand/10 blur-2xl rounded-full scale-150 animate-pulse" />
        <Logo
          variant="icon"
          alt={tCommon("storeName")}
          className="h-16 w-auto relative z-10"
          priority
        />
      </div>

      {/* Hairline progress bar */}
      <div className="page-loader-rail w-48" aria-hidden="true">
        <span className="page-loader-rail-fill" />
      </div>

      <span className="sr-only">{tNav("mobileNavigation")}</span>
    </motion.div>
  );
}
