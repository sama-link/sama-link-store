"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import PriceRangeSlider from "@/components/products/PriceRangeSlider";

export interface FilterCollectionOption {
  id: string;
  title: string;
}

export interface FilterCategoryOption {
  id: string;
  title: string;
}

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 50;

const RATING_OPTIONS = [4, 3, 2] as const;

type StagedFilters = {
  collection: string | null;
  category: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  q: string | null;
  inStock: boolean;
  rating: string | null;
};

function sameStage(a: StagedFilters, b: StagedFilters): boolean {
  return (
    a.collection === b.collection &&
    a.category === b.category &&
    a.minPrice === b.minPrice &&
    a.maxPrice === b.maxPrice &&
    a.q === b.q &&
    a.inStock === b.inStock &&
    a.rating === b.rating
  );
}

export interface FilterSidebarProps {
  collections: FilterCollectionOption[];
  categories: FilterCategoryOption[];
  activeCollection: string | null;
  activeCategory: string | null;
  activeMinPrice: string | null;
  activeMaxPrice: string | null;
  activeQuery: string | null;
  activeInStock: boolean;
  activeRating: string | null;
  locale: string;
  /** Fired after a successful Apply / Clear All — mobile bottom sheets use
     this to auto-close themselves so the user sees the filtered results. */
  onApply?: () => void;
}

/* Filter sidebar with STAGED updates.

   Every interaction updates a local "staged" state but doesn't touch the URL.
   A single `Apply filters` button commits the full staged set in one navigate,
   guaranteeing multi-change flows land a consistent URL. Single-change flows
   just click Apply once — predictable, no lost clicks from rapid sequences. */
export default function FilterSidebar({
  collections,
  categories,
  activeCollection,
  activeCategory,
  activeMinPrice,
  activeMaxPrice,
  activeQuery,
  activeInStock,
  activeRating,
  locale,
  onApply,
}: FilterSidebarProps) {
  const t = useTranslations("products.filters");
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const searchParams = useSearchParams();

  const active: StagedFilters = useMemo(
    () => ({
      collection: activeCollection,
      category: activeCategory,
      minPrice: activeMinPrice,
      maxPrice: activeMaxPrice,
      q: activeQuery,
      inStock: activeInStock,
      rating: activeRating,
    }),
    [
      activeCollection,
      activeCategory,
      activeMinPrice,
      activeMaxPrice,
      activeQuery,
      activeInStock,
      activeRating,
    ],
  );

  const [staged, setStaged] = useState<StagedFilters>(active);

  /* Resync when the URL (active) changes from outside — e.g. a header search. */
  useEffect(() => {
    setStaged(active);
  }, [active]);

  const commit = useCallback(
    (nextStaged: StagedFilters) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("page");
      const setOrDel = (key: string, v: string | null) => {
        if (v == null || v === "") params.delete(key);
        else params.set(key, v);
      };
      setOrDel("collection", nextStaged.collection);
      setOrDel("category", nextStaged.category);
      setOrDel("minPrice", nextStaged.minPrice);
      setOrDel("maxPrice", nextStaged.maxPrice);
      setOrDel("q", nextStaged.q);
      setOrDel("rating", nextStaged.rating);
      setOrDel("inStock", nextStaged.inStock ? "1" : null);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const applyStaged = () => {
    commit(staged);
    onApply?.();
  };
  const clearAll = () => {
    const cleared: StagedFilters = {
      collection: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      q: null,
      inStock: false,
      rating: null,
    };
    setStaged(cleared);
    commit(cleared);
    onApply?.();
  };

  const isDirty = !sameStage(staged, active);

  const parsedMin =
    staged.minPrice && !Number.isNaN(Number(staged.minPrice))
      ? Number(staged.minPrice)
      : null;
  const parsedMax =
    staged.maxPrice && !Number.isNaN(Number(staged.maxPrice))
      ? Number(staged.maxPrice)
      : null;

  const hasAnyFilter =
    staged.collection != null ||
    staged.category != null ||
    staged.minPrice != null ||
    staged.maxPrice != null ||
    staged.q != null ||
    staged.inStock ||
    staged.rating != null;

  const stageSet = <K extends keyof StagedFilters>(
    key: K,
    value: StagedFilters[K],
  ) => {
    setStaged((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex max-h-full flex-col rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-text-primary">
          {t("heading")}
        </h2>
        {hasAnyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-text-secondary underline decoration-transparent underline-offset-2 transition-colors hover:text-text-primary hover:decoration-current motion-safe:active:scale-95"
          >
            {t("clearAll")}
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* Active search query chip */}
        {staged.q ? (
          <div className="flex items-center gap-2 rounded-lg bg-accent-muted px-3 py-2 text-xs">
            <span className="text-text-muted">{t("searchChipLabel")}</span>
            <span className="flex-1 truncate font-medium text-brand">
              &ldquo;{staged.q}&rdquo;
            </span>
            <button
              type="button"
              onClick={() => stageSet("q", null)}
              aria-label={t("clearSearch")}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-brand transition-transform hover:bg-surface motion-safe:active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
                <path d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}

        {/* Categories */}
        <section className="space-y-3" aria-labelledby="filter-categories-heading">
          <h3 id="filter-categories-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t("categories")}
          </h3>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => stageSet("category", null)}
                className={rowClass(staged.category == null)}
              >
                {t("allCategories")}
              </button>
            </li>
            {categories.map((c) => {
              const isActive = staged.category === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => stageSet("category", isActive ? null : c.id)}
                    className={rowClass(isActive)}
                  >
                    {c.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Collections */}
        <section className="space-y-3" aria-labelledby="filter-collections-heading">
          <h3 id="filter-collections-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t("collections")}
          </h3>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => stageSet("collection", null)}
                className={rowClass(staged.collection == null)}
              >
                {t("allCollections")}
              </button>
            </li>
            {collections.map((c) => {
              const isActive = staged.collection === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() =>
                      stageSet("collection", isActive ? null : c.id)
                    }
                    className={rowClass(isActive)}
                  >
                    {c.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Price range — dual-handle slider */}
        <section className="space-y-3" aria-labelledby="filter-price-heading">
          <h3 id="filter-price-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t("priceRange")}
          </h3>
          <PriceRangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            valueMin={parsedMin}
            valueMax={parsedMax}
            onCommit={(lo, hi) => {
              stageSet("minPrice", lo == null ? null : String(lo));
              stageSet("maxPrice", hi == null ? null : String(hi));
            }}
          />
        </section>

        {/* Rating */}
        <section className="space-y-3" aria-labelledby="filter-rating-heading">
          <h3 id="filter-rating-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t("rating")}
          </h3>
          <ul className="flex flex-col gap-1">
            {RATING_OPTIONS.map((r) => {
              const val = String(r);
              const isActive = staged.rating === val;
              return (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() =>
                      stageSet("rating", isActive ? null : val)
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-all motion-safe:active:scale-[0.98]",
                      isActive
                        ? "bg-accent-muted text-brand"
                        : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
                    )}
                  >
                    <span className="inline-flex items-center text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={i < r ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            "h-3.5 w-3.5",
                            i >= r && "text-border-strong",
                          )}
                          aria-hidden="true"
                        >
                          <path d="M12 2 14.6 8.4 21.4 9 16.4 13.6 17.9 20.4 12 16.9 6.1 20.4 7.6 13.6 2.6 9 9.4 8.4 12 2z" />
                        </svg>
                      ))}
                    </span>
                    <span className="text-xs">{t("ratingAndUp")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Availability */}
        <section className="space-y-2" aria-labelledby="filter-availability-heading">
          <h3 id="filter-availability-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t("availability")}
          </h3>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={staged.inStock}
              onChange={(e) => stageSet("inStock", e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
            <span>{t("inStock")}</span>
          </label>
        </section>
      </div>

      {/* Apply button — pinned below the scroll area as a flex sibling */}
      <div className="shrink-0 border-t border-border bg-surface-subtle p-3">
        <button
          type="button"
          onClick={applyStaged}
          disabled={!isDirty}
          className={cn(
            "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-[background-color,color,transform] duration-200 motion-safe:active:scale-[0.98]",
            isDirty
              ? "bg-brand text-text-inverse hover:bg-brand-hover"
              : "cursor-not-allowed bg-surface text-text-muted",
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t("apply")}</span>
        </button>
      </div>
    </div>
  );
}

function rowClass(active: boolean): string {
  return cn(
    "w-full rounded-md px-2 py-1.5 text-start text-sm transition-all duration-150 motion-safe:active:scale-[0.98]",
    active
      ? "bg-accent-muted font-semibold text-brand"
      : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
  );
}
