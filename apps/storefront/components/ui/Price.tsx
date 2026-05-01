"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

/* Centralised price renderer.

   Two-span layout so we can style the currency marker separately from the
   amount — the marker is always smaller and muted; the amount carries the
   visual weight. Order is conditional:

     EN  → [marker] [amount]   (e.g. "EGP 4,299" — whole units, no decimals)
     AR  → [amount] [marker]   (e.g. "٤٬٢٩٩ ج.م")  ← marker on the LEFT in RTL

   `inline-flex` inherits the parent `direction`, so in an AR paragraph the
   first child is auto-placed on the right and the second on the left —
   matching the user direction that the symbol sits *after* the price. */

const ARABIC_CURRENCY_SYMBOLS: Record<string, string> = {
  EGP: "ج.م",
  SAR: "ر.س",
  AED: "د.إ",
  KWD: "د.ك",
  BHD: "د.ب",
  QAR: "ر.ق",
  OMR: "ر.ع",
  JOD: "د.أ",
  IQD: "د.ع",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function formatAmount(amount: number, locale: string): string {
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  try {
    return new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function currencyMarker(code: string, locale: string): string {
  const c = code.toUpperCase();
  if (locale === "ar") return ARABIC_CURRENCY_SYMBOLS[c] ?? c;
  return c;
}

export interface PriceProps {
  amount: number | null | undefined;
  currencyCode: string | null | undefined;
  /** Visual size preset for the amount. Currency marker scales to ~65% of this. */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Render compare-at (strikethrough) styling. */
  strike?: boolean;
  /** Fallback text when amount/currency is missing. */
  fallback?: string;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Override the marker's muted colour (e.g. make it white in a brand panel). */
  markerClassName?: string;
}

const sizeClassMap = {
  xs:  "text-xs",
  sm:  "text-sm",
  md:  "text-base",
  lg:  "text-lg",
  xl:  "text-xl",
  "2xl": "text-3xl",
} as const;

export default function Price({
  amount,
  currencyCode,
  size = "md",
  strike = false,
  fallback = "",
  className,
  markerClassName,
}: PriceProps) {
  const locale = useLocale();

  if (amount == null || !currencyCode) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  const numeric = formatAmount(Number(amount), locale);
  const marker = currencyMarker(currencyCode, locale);
  const isAr = locale === "ar";

  const amountSpan = (
    <span
      key="amount"
      className="font-semibold tracking-[-0.01em]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {numeric}
    </span>
  );
  const markerSpan = (
    <span
      key="marker"
      className={cn(
        "text-[0.66em] font-medium text-text-muted",
        markerClassName,
      )}
    >
      {marker}
    </span>
  );

  /* Same source order in both locales: amount first, marker second.
     Paragraph direction handles the visual flip naturally:
        LTR (EN) → amount LEFT, marker RIGHT   →   "4,299 EGP"
        RTL (AR) → amount RIGHT, marker LEFT   →   "4,299 ج.م"
     Explicit `dir` locks this regardless of any inherited direction. */
  return (
    <span
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        "inline-flex items-baseline gap-1",
        sizeClassMap[size],
        strike && "text-text-muted line-through opacity-70",
        className,
      )}
    >
      {amountSpan}
      {markerSpan}
    </span>
  );
}
