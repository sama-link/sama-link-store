/**
 * Product catalog localisation helpers — ADR-047 read-through layer.
 *
 * The Medusa product table stores one row per product with English as the
 * canonical source of truth for `title`, `subtitle`, and `description`. The
 * Arabic overlay lives on `metadata.translations.ar` and is edited from the
 * admin `sama-product-translation` widget (PROD-TRANS).
 *
 * This module is the single read-through point for the storefront: any
 * component or page that renders a product's title / subtitle / description
 * should go through `localizeProduct` (or the individual field helpers) so
 * the AR overlay is applied consistently and the fallback rule
 * (non-empty-AR wins; otherwise EN) stays in one place.
 *
 * Non-goals: this module does NOT translate tags, categories, collections,
 * option values, or metadata itself. Those surfaces are out of scope for
 * PROD-TRANS and may land in a later workstream.
 */
/**
 * Structural type — accepts any product-shaped object with optional text
 * fields plus a `metadata` bag. We define it structurally (rather than
 * importing `HttpTypes.StoreProduct` from `@medusajs/types`) because the
 * storefront depends on `@medusajs/js-sdk`, not on `@medusajs/types`
 * directly, and the SDK's product type differs subtly across sub-resources
 * (store.product.list vs cart line items). The structural definition here
 * matches every variant we hit in practice.
 */
export type LocalizableProduct = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ArBranch = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
};

/** Safely pull `metadata.translations.ar` off a product without caring about
 *  its concrete type. Returns an empty object when the branch is missing. */
function readArBranch(product: LocalizableProduct): ArBranch {
  const md = product.metadata;
  if (!md || typeof md !== "object") return {};
  const translations = (md as Record<string, unknown>)["translations"];
  if (!translations || typeof translations !== "object") return {};
  const ar = (translations as Record<string, unknown>)["ar"];
  if (!ar || typeof ar !== "object") return {};
  return ar as ArBranch;
}

/** AR wins when non-empty; EN is the fallback. Whitespace-only AR is treated
 *  as missing so the storefront never renders empty product cards/pages. */
function pick(ar: string | null | undefined, en: string | null | undefined): string | null {
  if (typeof ar === "string" && ar.trim()) return ar;
  return en ?? null;
}

export function localizeTitle<T extends LocalizableProduct>(product: T, locale: string): string {
  if (locale !== "ar") return product.title ?? "";
  const ar = readArBranch(product);
  return pick(ar.title, product.title) ?? "";
}

export function localizeSubtitle<T extends LocalizableProduct>(product: T, locale: string): string | null {
  if (locale !== "ar") return product.subtitle ?? null;
  const ar = readArBranch(product);
  return pick(ar.subtitle, product.subtitle);
}

export function localizeDescription<T extends LocalizableProduct>(product: T, locale: string): string | null {
  if (locale !== "ar") return product.description ?? null;
  const ar = readArBranch(product);
  return pick(ar.description, product.description);
}

/**
 * Return a shallow-cloned product with `title`, `subtitle`, and
 * `description` resolved for the given locale. The rest of the product
 * (variants, images, prices, metadata) is preserved by reference so downstream
 * code that reads variant pricing etc. keeps working unchanged.
 */
export function localizeProduct<T extends LocalizableProduct>(
  product: T,
  locale: string,
): T {
  if (locale !== "ar") return product;
  const ar = readArBranch(product);
  const title = pick(ar.title, product.title);
  const subtitle = pick(ar.subtitle, product.subtitle);
  const description = pick(ar.description, product.description);
  return {
    ...product,
    title: title ?? product.title,
    subtitle,
    description,
  };
}

/** Batch helper for product list pages + carousels. */
export function localizeProducts<T extends LocalizableProduct>(
  products: readonly T[],
  locale: string,
): T[] {
  if (locale !== "ar") return [...products];
  return products.map((p) => localizeProduct(p, locale));
}
