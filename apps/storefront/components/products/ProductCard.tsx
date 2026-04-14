/**
 * Server-rendered product summary for catalog grids.
 * Presentation only — data is supplied by the parent page (no API calls here).
 */

import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { listProducts } from "@/lib/medusa-client";
import { formatCatalogPrice } from "@/lib/format-price";

export type Product = Awaited<ReturnType<typeof listProducts>>["products"][number];

export interface ProductCardProps {
  product: Product;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const locale = await getLocale();
  const description = product.description ?? "";

  const firstVariant = product.variants?.[0];
  const calcPrice = firstVariant?.calculated_price;
  const priceLabel = formatCatalogPrice(
    calcPrice?.calculated_amount != null ? Number(calcPrice.calculated_amount) : null,
    calcPrice?.currency_code,
  ) || null;

  const articleClassName = [
    "flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
    product.handle ? "transition-shadow duration-150 group-hover:shadow-md" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const article = (
    <article className={articleClassName}>
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-subtle">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title ?? ""}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold text-text-primary">{product.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
        {priceLabel ? (
          <p className="text-sm font-semibold text-text-primary">{priceLabel}</p>
        ) : null}
      </div>
    </article>
  );

  if (product.handle) {
    return (
      <Link
        href={`/${locale}/products/${product.handle}`}
        className="group block"
      >
        {article}
      </Link>
    );
  }

  return article;
}
