"use client";

/**
 * Product summary card — simplified per product direction.
 * Two layouts:
 *   - "grid" (default): vertical card — image → title → price + add-to-cart icon
 *   - "list": horizontal row — image → title + price → add-to-cart
 * Always client-rendered so it composes cleanly inside LoadMoreProducts.
 *
 * Desktop: overlay actions (Wishlist, Compare, Quick View) on hover/focus.
 * Mobile: Quick View overlay only (Wishlist + Compare live on the PDP).
 */

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { listProducts } from "@/lib/medusa-client";
import type { ListProduct } from "@/hooks/useWishlist";
import { localizeTitle } from "@/lib/product-i18n";
import AddToCartButton from "@/components/products/AddToCartButton";
import CardTopActions from "@/components/products/CardTopActions";
import Price from "@/components/ui/Price";
import { cn } from "@/lib/cn";

export type Product = Awaited<
  ReturnType<typeof listProducts>
>["products"][number];

export interface ProductCardProps {
  product: Product;
  /** Card layout: grid (default) or list (horizontal row). */
  layout?: "grid" | "list";
}

export default function ProductCard({
  product,
  layout = "grid",
}: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations("products.card");

  /* ADR-047 · Catalog title overlay — prefer metadata.translations.ar.title
   * when locale === "ar"; fall back to English. Memoised to avoid recomputing
   * on every re-render (wishlist / cart state changes shouldn't retrigger
   * the metadata walk). */
  const displayTitle = useMemo(
    () => localizeTitle(product, locale),
    [product, locale],
  );

  const firstVariant = product.variants?.[0];
  const calcPrice = firstVariant?.calculated_price;
  const priceAmount =
    calcPrice?.calculated_amount != null
      ? Number(calcPrice.calculated_amount)
      : null;
  const priceCurrency = calcPrice?.currency_code ?? null;

  const firstVariantId = firstVariant?.id ?? null;

  const imageInner = product.thumbnail ? (
    <Image
      src={product.thumbnail}
      alt={displayTitle}
      fill
      sizes={
        layout === "list"
          ? "(min-width: 640px) 20vw, 40vw"
          : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
      }
      className="object-cover"
    />
  ) : null;

  const href = product.handle
    ? `/${locale}/products/${product.handle}`
    : null;

  /* ─── List layout (horizontal row) ─── */
  if (layout === "list") {
    return (
      <div className="group relative flex overflow-hidden rounded-2xl bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border dark:border-border dark:shadow-none dark:hover:border-brand-muted">
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden bg-surface-subtle sm:w-40">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            {imageInner}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 p-3 sm:p-4">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold text-text-primary sm:text-base">
              {href ? (
                <Link
                  href={href}
                  className="outline-none before:absolute before:inset-0 before:z-[1] before:content-[''] focus-visible:text-brand"
                >
                  {displayTitle}
                </Link>
              ) : (
                displayTitle
              )}
            </h3>
            {priceAmount != null ? (
              <Price
                amount={priceAmount}
                currencyCode={priceCurrency}
                size="lg"
                className="mt-1.5 text-brand font-bold"
              />
            ) : null}
          </div>
          {firstVariantId ? (
            <div className="relative z-[2] shrink-0">
              <AddToCartButton
                variantId={firstVariantId}
                variant="primary"
                size="md"
                fullWidth={false}
                iconOnly
                iconAriaLabel={t("addToCartAria")}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  /* ─── Grid layout (default vertical card) ─── */
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border dark:border-border dark:shadow-none dark:hover:border-brand-muted animate-fade-in",
      )}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface-subtle">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          {imageInner}
        </div>
        <CardTopActions product={product as unknown as ListProduct} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <h3 className="line-clamp-2 min-h-[2.4em] text-sm font-semibold text-text-primary sm:text-base">
          {href ? (
            <Link
              href={href}
              className="outline-none before:absolute before:inset-0 before:z-[1] before:content-[''] focus-visible:text-brand"
            >
              {displayTitle}
            </Link>
          ) : (
            displayTitle
          )}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {priceAmount != null ? (
            <Price
              amount={priceAmount}
              currencyCode={priceCurrency}
              size="lg"
              className="text-brand font-bold"
            />
          ) : (
            <span />
          )}
          {firstVariantId ? (
            <div className="relative z-[2]">
              <AddToCartButton
                variantId={firstVariantId}
                variant="primary"
                size="md"
                fullWidth={false}
                iconOnly
                iconAriaLabel={t("addToCartAria")}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
