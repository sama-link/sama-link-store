/**
 * Format any Medusa v2 price value.
 *
 * Medusa v2 returns all price fields (unit_price, subtotal, total,
 * calculated_price.calculated_amount) as direct major-unit amounts —
 * e.g. 1070 means EGP 1,070 (displayed as whole units). No minor-unit conversion is applied.
 *
 * Centralized currency rules (storefront-wide — do NOT patch in components):
 *   • English  → Latin digits, currency CODE on the RIGHT  → "1,000 EGP"
 *   • Arabic   → Arabic-Indic digits, currency SYMBOL on the LEFT  → "ج.م ١٬٠٠٠"
 *
 * Symbol map covers MENA + common currencies; falls back to ISO code if unknown.
 */

export type PriceLocale = "en" | "ar" | (string & {});

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

function formatNumeric(amount: number, locale: PriceLocale | undefined): string {
  // For Arabic we want Arabic-Indic digits; Intl handles this with `ar-EG`.
  const intlLocale =
    locale === "ar" ? "ar-EG" : locale === "en" ? "en-US" : undefined;
  try {
    return new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function getCurrencyMarker(
  currencyCode: string,
  locale: PriceLocale | undefined,
): string {
  const code = currencyCode.toUpperCase();
  if (locale === "ar") {
    return ARABIC_CURRENCY_SYMBOLS[code] ?? code;
  }
  return code;
}

// Unicode isolation marks — force visual ordering regardless of paragraph direction.
// Without these, in an RTL document the bidi algorithm reorders mixed RTL+digit runs
// and the ج.م symbol drifts to the wrong side of the number.
const LRI = "\u2066"; // LEFT-TO-RIGHT ISOLATE
const PDI = "\u2069"; // POP DIRECTIONAL ISOLATE

function compose(
  numeric: string,
  marker: string,
  locale: PriceLocale | undefined,
): string {
  // EN → "1,000 EGP"  (amount left, code right)
  // AR → "ج.م ١٬٠٠٠"  (symbol left, amount right). LRI..PDI forces the visual
  //       order to match the string order even inside an RTL paragraph.
  if (locale === "ar") return `${LRI}${marker}\u00A0${numeric}${PDI}`;
  return `${numeric}\u00A0${marker}`;
}

export function formatPrice(
  amount: number | null | undefined,
  currencyCode: string,
  locale?: PriceLocale,
): string {
  if (amount == null) return "";
  const numeric = formatNumeric(amount, locale);
  const marker = getCurrencyMarker(currencyCode, locale);
  return compose(numeric, marker, locale);
}

/**
 * Same behaviour as formatPrice — kept as a named alias so call sites
 * on product/catalog pages remain readable without churn.
 */
export function formatCatalogPrice(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
  locale?: PriceLocale,
): string {
  if (amount == null || currencyCode == null) return "";
  return formatPrice(amount, currencyCode, locale);
}

/**
 * Format a signed price *delta* (e.g. variant price difference).
 * Returns "" for zero delta. Used for variant-pill price hints.
 */
export function formatPriceDelta(
  delta: number,
  currencyCode: string | null | undefined,
  locale?: PriceLocale,
): string {
  if (!currencyCode || delta === 0) return "";
  const sign = delta > 0 ? "+" : "−";
  const abs = Math.abs(delta);
  const numeric = formatNumeric(abs, locale);
  const marker = getCurrencyMarker(currencyCode, locale);
  // Sign always leads, regardless of locale. Wrap with LRI/PDI under AR so
  // the symbol stays visually-left even inside an RTL paragraph.
  if (locale === "ar") return `${LRI}${sign}${marker}\u00A0${numeric}${PDI}`;
  return `${sign}${numeric}\u00A0${marker}`;
}
