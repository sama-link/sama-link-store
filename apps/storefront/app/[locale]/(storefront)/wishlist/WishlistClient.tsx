"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatCatalogPrice } from "@/lib/format-price";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/cn";

export default function WishlistClient() {
  const t = useTranslations("wishlist");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { items, remove, isHydrated } = useWishlist();

  const heading = (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("pageDescription")}</p>
    </div>
  );

  if (!isHydrated) {
    return (
      <>
        {heading}
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-text-muted">
          {tCommon("loading")}
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {heading}
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg text-text-primary">{t("empty")}</p>
        <Link
          href={`/${locale}/products`}
          className={cn(
            "mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface-subtle px-6 py-3 text-sm font-medium text-text-primary transition-colors",
            "hover:border-brand hover:bg-surface-raised hover:text-brand",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          )}
        >
          {t("emptyCta")}
        </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {heading}
      <ul className="mx-auto grid max-w-7xl list-none grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item: any) => {
        const priceLabel =
          formatCatalogPrice(item.amount, item.currencyCode, locale) || null;
        const href =
          item.handle != null && item.handle !== ""
            ? `/${locale}/products/${item.handle}`
            : `/${locale}/products`;
        return (
          <li key={item.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <Link href={href} className="relative block aspect-square w-full shrink-0 overflow-hidden bg-surface-subtle">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title ?? ""}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <Link
                  href={href}
                  className="line-clamp-2 text-lg font-semibold text-text-primary hover:text-brand"
                >
                  {item.title}
                </Link>
                {priceLabel ? (
                  <p className="text-sm font-semibold text-text-primary">
                    {priceLabel}
                  </p>
                ) : null}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error"
                >
                  {t("removeItem")}
                </button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
    </>
  );
}
