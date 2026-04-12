/**
 * Server-rendered product summary for catalog grids.
 * Presentation only — data is supplied by the parent page (no API calls here).
 */

import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { listProducts } from "@/lib/medusa-client";

export type Product = Awaited<ReturnType<typeof listProducts>>["products"][number];

export interface ProductCardProps {
  product: Product;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const locale = await getLocale();
  const description = product.description ?? "";

  const articleClassName = [
    "flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
    product.handle ? "transition-shadow duration-150 group-hover:shadow-md" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const article = (
    <article className={articleClassName}>
      <div
        className="aspect-video w-full shrink-0 bg-surface-subtle"
        aria-hidden
      />
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold text-text-primary">{product.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
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
