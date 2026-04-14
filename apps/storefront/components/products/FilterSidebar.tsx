"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

export interface FilterCollectionOption {
  id: string;
  title: string;
}

const PRICE_BUCKETS = [
  { key: "under100" as const, min: "0", max: "100" },
  { key: "100to500" as const, min: "100", max: "500" },
  { key: "over500" as const, min: "500", max: "" },
];

function buildUrl(
  pathname: string,
  current: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current.toString());
  next.delete("page");
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === "") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function isBucketActive(
  bucket: (typeof PRICE_BUCKETS)[number],
  min: string | null,
  max: string | null,
): boolean {
  if (bucket.max === "") {
    return min === bucket.min && (max === null || max === "");
  }
  return min === bucket.min && max === bucket.max;
}

export interface FilterSidebarProps {
  collections: FilterCollectionOption[];
  activeCollection: string | null;
  activeMinPrice: string | null;
  activeMaxPrice: string | null;
  locale: string;
}

export default function FilterSidebar({
  collections,
  activeCollection,
  activeMinPrice,
  activeMaxPrice,
  locale,
}: FilterSidebarProps) {
  const t = useTranslations("products.filters");
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const href = buildUrl(pathname, searchParams, updates);
      router.push(href);
    },
    [pathname, router, searchParams],
  );

  const hasActiveFilters =
    activeCollection != null ||
    activeMinPrice != null ||
    activeMaxPrice != null;

  return (
    <div className="space-y-8 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">
          {t("heading")}
        </h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() =>
              navigate({
                collection: null,
                minPrice: null,
                maxPrice: null,
              })
            }
            className="text-xs font-medium text-text-secondary underline decoration-transparent underline-offset-2 transition-colors hover:text-text-primary hover:decoration-current"
          >
            {t("clearAll")}
          </button>
        ) : null}
      </div>

      <section className="space-y-3" aria-labelledby="filter-collections-heading">
        <h3
          id="filter-collections-heading"
          className="text-xs font-medium uppercase tracking-wide text-text-secondary"
        >
          {t("collections")}
        </h3>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => navigate({ collection: null })}
              className={
                activeCollection == null
                  ? "text-left text-sm font-semibold text-text-primary"
                  : "text-left text-sm text-text-secondary transition-colors hover:text-text-primary"
              }
            >
              {t("allCollections")}
            </button>
          </li>
          {collections.map((c) => {
            const isActive = activeCollection === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      collection: isActive ? null : c.id,
                    })
                  }
                  className={
                    isActive
                      ? "text-left text-sm font-semibold text-text-primary"
                      : "text-left text-sm text-text-secondary transition-colors hover:text-text-primary"
                  }
                >
                  {c.title}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="filter-price-heading">
        <h3
          id="filter-price-heading"
          className="text-xs font-medium uppercase tracking-wide text-text-secondary"
        >
          {t("priceRange")}
        </h3>
        <ul className="flex flex-col gap-1">
          {PRICE_BUCKETS.map((bucket) => {
            const active = isBucketActive(
              bucket,
              activeMinPrice,
              activeMaxPrice,
            );
            return (
              <li key={bucket.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (active) {
                      navigate({ minPrice: null, maxPrice: null });
                    } else if (bucket.max === "") {
                      navigate({
                        minPrice: bucket.min,
                        maxPrice: null,
                      });
                    } else {
                      navigate({
                        minPrice: bucket.min,
                        maxPrice: bucket.max,
                      });
                    }
                  }}
                  className={
                    active
                      ? "text-left text-sm font-semibold text-text-primary"
                      : "text-left text-sm text-text-secondary transition-colors hover:text-text-primary"
                  }
                >
                  {t(`priceBuckets.${bucket.key}`)}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
