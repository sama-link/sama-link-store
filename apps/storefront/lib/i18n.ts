/*
  i18n configuration placeholder.

  This file will be expanded when next-intl is installed (Phase 1 i18n tasks).
  For now it exports the locale constants and types used across the app.
*/

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeLabels: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

/** Returns true when the locale reads right-to-left. */
export function isRTL(locale: Locale): boolean {
  return localeDirection[locale] === "rtl";
}
