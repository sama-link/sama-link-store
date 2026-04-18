/**
 * Server-rendered product summary for catalog grids.
 * Presentation only — data is supplied by the parent page (no API calls here).
 *
 * Click model (MVP-2a):
 *   - Single Next.js <Link> wraps the title; its ::before pseudo stretches to
 *     cover the whole card, so any non-button click navigates to the PDP.
 *   - CardActions provides two action surfaces:
 *       · Top-end icons over the image (Wishlist/Compare/QuickView).
 *       · Fixed bottom purchase row (Buy Now + Add-to-Cart icon) inside the
 *         text block at z-[2], sitting above the stretched link.
 */

import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { listProducts } from "@/lib/medusa-client";
import { formatCatalogPrice } from "@/lib/format-price";
import CardTopActions from "@/components/products/CardTopActions";
import CardPurchaseRow from "@/components/products/CardPurchaseRow";

export type Product = Awaited<ReturnType<typeof listProducts>>["products"][number];

export interface ProductCardProps {
  product: Product;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const locale = await getLocale();
  const description = product.description ?? "";

  const firstVariant = product.variants?.[0];
  const calcPrice = firstVariant?.calculated_price;
  const priceLabel =
    formatCatalogPrice(
      calcPrice?.calculated_amount != null
        ? Number(calcPrice.calculated_amount)
        : null,
      calcPrice?.currency_code,
      locale,
    ) || null;

  const imageInner = product.thumbnail ? (
    <Image
      src={product.thumbnail}
      alt={product.title ?? ""}
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className="object-cover"
    />
  ) : null;

  if (product.handle) {
    const href = `/${locale}/products/${product.handle}`;
    return (
      <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow duration-150 hover:shadow-md focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface-subtle">
          {imageInner}
          <CardTopActions product={product} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-text-primary">
            <Link
              href={href}
              className="outline-none before:absolute before:inset-0 before:z-[1] before:content-[''] focus-visible:text-brand"
            >
              {product.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
          <div className="flex-1" />
          {priceLabel ? (
            <p className="text-xl font-bold text-brand">{priceLabel}</p>
          ) : null}
          <CardPurchaseRow product={product} />
        </div>
      </div>
    );
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface-subtle">
        {imageInner}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-text-primary">
          {product.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
        <div className="flex-1" />
        {priceLabel ? (
          <p className="text-xl font-bold text-brand">{priceLabel}</p>
        ) : null}
      </div>
    </article>
  );
}
