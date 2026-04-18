/**
 * Shared SEO helpers — single source of truth for canonicals, hreflang
 * alternates, and JSON-LD structured data emitted by storefront routes.
 *
 * Pure — no React, no Node-only APIs beyond `URL`. Safe to import from
 * server components, metadata exports, and `sitemap.ts`.
 *
 * Schema types: schema.org Organization, Product, Offer, BreadcrumbList.
 */

const DEFAULT_BASE_URL = "http://localhost:3000";

const SUPPORTED_LOCALES = ["en", "ar"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Theme-aware logo is a pair of WebPs (ADR-020); for Organization JSON-LD
// Google prefers a single stable URL, so we publish the light horizontal
// lockup (ADR-015: default brand lockup).
const ORGANIZATION_LOGO_PATH =
  "/brand/logo/sama-link_logo_horizontal-no-tagline_light.webp";

const ORGANIZATION_NAME = "Sama Link Store";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_BASE_URL;
}

/**
 * Returns an absolute canonical URL for the given locale + path. The path
 * MUST be the portion after `/<locale>` (i.e. omit the locale segment).
 * Pass `"/"` for locale roots.
 */
export function buildCanonical(
  locale: string,
  pathWithoutLocale: string,
): string {
  const base = getBaseUrl().replace(/\/$/, "");
  const normalisedPath =
    pathWithoutLocale === "/" || pathWithoutLocale === ""
      ? ""
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;
  return `${base}/${locale}${normalisedPath}`;
}

/**
 * Returns an hreflang alternates map covering every supported locale plus
 * `x-default` (points to the English variant — ADR-008 primary locale).
 */
export function buildLanguageAlternates(
  pathWithoutLocale: string,
): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    entries[loc] = buildCanonical(loc, pathWithoutLocale);
  }
  entries["x-default"] = buildCanonical("en", pathWithoutLocale);
  return entries;
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const base = getBaseUrl().replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    url: base,
    logo: `${base}${ORGANIZATION_LOGO_PATH}`,
  };
}

// ── Product JSON-LD ────────────────────────────────────────────────────

interface ProductImageLike {
  url?: string | null;
}

interface VariantLike {
  sku?: string | null;
  manage_inventory?: boolean | null;
  inventory_quantity?: number | null;
  allow_backorder?: boolean | null;
  calculated_price?: {
    calculated_amount?: number | string | null;
    currency_code?: string | null;
  } | null;
}

interface ProductLike {
  title?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: ProductImageLike[] | null;
  variants?: readonly VariantLike[] | null;
}

/**
 * Build schema.org Product JSON-LD from a Medusa store product.
 * Fields whose source data is missing are omitted entirely — never
 * serialised as null/undefined. Callers should pass an absolute canonical
 * URL (e.g. from `buildCanonical`).
 */
export function buildProductJsonLd(
  product: ProductLike,
  _locale: string,
  canonicalUrl: string,
): Record<string, unknown> {
  const variants: VariantLike[] = [...(product.variants ?? [])];
  const images = collectProductImageUrls(product);

  const priceInfo = derivePriceInfo(variants);
  const availability = deriveAvailability(variants);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    url: canonicalUrl,
  };

  if (product.title) {
    jsonLd.name = product.title;
  }

  const description = product.description?.trim();
  if (description) {
    jsonLd.description = description;
  }

  if (images.length > 0) {
    jsonLd.image = images;
  }

  const firstSku = variants.find((v) => v.sku)?.sku;
  if (firstSku) {
    jsonLd.sku = firstSku;
  }

  const offers = buildOffers(priceInfo, availability, canonicalUrl, variants);
  if (offers) {
    jsonLd.offers = offers;
  }

  return jsonLd;
}

function collectProductImageUrls(product: ProductLike): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  if (product.thumbnail && !seen.has(product.thumbnail)) {
    urls.push(product.thumbnail);
    seen.add(product.thumbnail);
  }
  for (const img of product.images ?? []) {
    const u = img?.url;
    if (u && !seen.has(u)) {
      urls.push(u);
      seen.add(u);
    }
  }
  return urls;
}

interface PriceInfo {
  min: number;
  max: number;
  currency: string;
}

function derivePriceInfo(variants: VariantLike[]): PriceInfo | null {
  const points: Array<{ amount: number; currency: string }> = [];
  for (const v of variants) {
    const cp = v.calculated_price;
    if (!cp) continue;
    const raw = cp.calculated_amount;
    const amount = raw == null ? NaN : Number(raw);
    const currency = cp.currency_code;
    if (!Number.isFinite(amount) || !currency) continue;
    points.push({ amount, currency: currency.toUpperCase() });
  }
  if (points.length === 0) return null;
  // Use the first variant's currency as the canonical currency
  const currency = points[0]!.currency;
  const sameCurrency = points.filter((p) => p.currency === currency);
  if (sameCurrency.length === 0) return null;
  const amounts = sameCurrency.map((p) => p.amount);
  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    currency,
  };
}

type Availability = "https://schema.org/InStock" | "https://schema.org/OutOfStock";

function deriveAvailability(variants: VariantLike[]): Availability {
  if (variants.length === 0) return "https://schema.org/OutOfStock";
  // In stock if any variant: manage_inventory=false, backorder allowed, or inventory_quantity > 0
  for (const v of variants) {
    if (v.manage_inventory === false) return "https://schema.org/InStock";
    if (v.allow_backorder === true) return "https://schema.org/InStock";
    if (typeof v.inventory_quantity === "number" && v.inventory_quantity > 0) {
      return "https://schema.org/InStock";
    }
  }
  // Fallback: if no inventory metadata at all, assume in stock so listings
  // don't get penalised as OOS when backend hasn't populated inventory.
  const anyInventoryField = variants.some(
    (v) =>
      v.manage_inventory != null ||
      v.allow_backorder != null ||
      typeof v.inventory_quantity === "number",
  );
  return anyInventoryField
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";
}

function buildOffers(
  price: PriceInfo | null,
  availability: Availability,
  canonicalUrl: string,
  variants: VariantLike[],
): Record<string, unknown> | null {
  if (!price) return null;
  // Multiple variants with a price spread → AggregateOffer
  if (variants.length > 1 && price.min !== price.max) {
    return {
      "@type": "AggregateOffer",
      priceCurrency: price.currency,
      lowPrice: price.min,
      highPrice: price.max,
      offerCount: variants.filter(
        (v) =>
          v.calculated_price?.calculated_amount != null &&
          Number.isFinite(Number(v.calculated_price.calculated_amount)),
      ).length,
      availability,
      url: canonicalUrl,
    };
  }
  return {
    "@type": "Offer",
    priceCurrency: price.currency,
    price: price.min,
    availability,
    url: canonicalUrl,
  };
}

// ── BreadcrumbList JSON-LD ─────────────────────────────────────────────

export interface BreadcrumbJsonLdItem {
  name: string;
  url: string;
}

/**
 * Build schema.org BreadcrumbList from an ordered trail. Each `url` is
 * emitted as a fully-qualified absolute URL — if a relative path is
 * provided it will be prefixed with the result of `getBaseUrl()`.
 */
export function buildBreadcrumbListJsonLd(
  items: BreadcrumbJsonLdItem[],
  baseUrl?: string,
): Record<string, unknown> {
  const base = (baseUrl ?? getBaseUrl()).replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${base}${item.url}`,
    })),
  };
}

export { SUPPORTED_LOCALES };
export type { SupportedLocale };
