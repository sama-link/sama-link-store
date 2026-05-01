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

export interface FilterBrandOption {
  id: string;
  title: string;
}

export interface FilterCategoryOption {
  id: string;
  title: string;
  children?: FilterCategoryOption[];
}

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 50;

const RATING_OPTIONS = [4, 3, 2] as const;

type StagedFilters = {
  collection: string | null;
  brand: string | null;
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
    a.brand === b.brand &&
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
  brands: FilterBrandOption[];
  categories: FilterCategoryOption[];
  activeCollection: string | null;
  activeBrand: string | null;
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
function CategoryTree({
  categories,
  stagedCategory,
  stageSet,
  level = 0,
}: {
  categories: FilterCategoryOption[];
  stagedCategory: string | null;
  stageSet: (key: keyof StagedFilters, value: any) => void;
  level?: number;
}) {
  if (!categories || categories.length === 0) return null;
  return (
    <div className={cn("flex flex-col", level === 0 ? "gap-2" : "mt-2 gap-2 ms-4 border-s border-border ps-4")}>
      {categories.map((c) => {
        const isActive = stagedCategory === c.id;
        const hasChildren = c.children && c.children.length > 0;
        return (
          <CategoryTreeNode
            key={c.id}
            c={c}
            isActive={isActive}
            hasChildren={hasChildren}
            stagedCategory={stagedCategory}
            stageSet={stageSet}
            level={level}
          />
        );
      })}
    </div>
  );
}

function CategoryTreeNode({
  c,
  isActive,
  hasChildren,
  stagedCategory,
  stageSet,
  level,
}: {
  c: FilterCategoryOption;
  isActive: boolean;
  hasChildren: boolean | undefined;
  stagedCategory: string | null;
  stageSet: (key: keyof StagedFilters, value: any) => void;
  level: number;
}) {
  // Always start expanded if it's the root level, otherwise collapsed
  const [isOpen, setIsOpen] = useState(level === 0);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <label className={cn(
          "flex cursor-pointer items-center gap-2.5 text-[13px] hover:text-brand transition-colors",
          level === 0 ? "font-semibold text-text-primary" : "text-text-secondary",
          isActive && "text-brand font-semibold"
        )}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => stageSet("category", e.target.checked ? c.id : null)}
            className="h-4 w-4 rounded border-border text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <span>{c.title}</span>
        </label>
        
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen ? "rotate-90" : "")}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <CategoryTree
            categories={c.children!}
            stagedCategory={stagedCategory}
            stageSet={stageSet}
            level={level + 1}
          />
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({
  collections,
  brands,
  categories,
  activeCollection,
  activeBrand,
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
      brand: activeBrand,
      category: activeCategory,
      minPrice: activeMinPrice,
      maxPrice: activeMaxPrice,
      q: activeQuery,
      inStock: activeInStock,
      rating: activeRating,
    }),
    [
      activeCollection,
      activeBrand,
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
      setOrDel("brand", nextStaged.brand);
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
      brand: null,
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
    staged.brand != null ||
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
      <div className="flex-1 overflow-y-auto p-5">
        <h4 className="mb-3 text-[14px] font-semibold text-text-primary">
          {t("heading")}
        </h4>

        <div className="flex flex-col divide-y divide-border">
          {/* Active search query chip */}
          {staged.q ? (
            <div className="py-5 first:pt-0">
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
            </div>
          ) : null}

          {/* Categories */}
          <div className="py-5 first:pt-0">
            <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text-primary">
              {t("categories")}
            </div>
            <CategoryTree
              categories={categories}
              stagedCategory={staged.category}
              stageSet={stageSet as any}
            />
          </div>

          {/* Brands */}
          <div className="py-5 first:pt-0">
            <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text-primary">
              {t("brands") || "Brands"}
            </div>
            <div className="flex flex-col gap-2">
              {brands.map((b: any) => {
                const isActive = staged.brand === b.id;
                return (
                  <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => stageSet("brand", e.target.checked ? b.id : null)}
                      className="h-4 w-4 rounded border-border text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                    <span>{b.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Collections */}
          <div className="py-5 first:pt-0">
            <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text-primary">
              {t("collections")}
            </div>
            <div className="flex flex-col gap-2">
              {collections.map((c: any) => {
                const isActive = staged.collection === c.id;
                return (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => stageSet("collection", e.target.checked ? c.id : null)}
                      className="h-4 w-4 rounded border-border text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                    <span>{c.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price range */}
          <div className="py-5 first:pt-0">
            <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text-primary">
              {t("priceRange")}
              <span className="text-xs font-normal text-text-muted">EGP</span>
            </div>
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
          </div>

          {/* Rating */}
          <div className="py-5 first:pt-0">
            <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text-primary">
              {t("rating")}
            </div>
            <div className="flex flex-col gap-2">
              {RATING_OPTIONS.map((r) => {
                const val = String(r);
                const isActive = staged.rating === val;
                return (
                  <label key={r} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => stageSet("rating", e.target.checked ? val : null)}
                      className="h-4 w-4 rounded border-border text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                    <span className="inline-flex text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r ? "text-warning" : "text-border-strong"}>
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="text-[12px] text-text-secondary">{t("ratingAndUp")}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="py-5 first:pt-0">
            <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text-primary">
              {t("availability")}
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={staged.inStock}
                  onChange={(e) => stageSet("inStock", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
                <span>{t("inStock")}</span>
              </label>
            </div>
          </div>
        </div>

        {hasAnyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 inline-flex h-8 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-transparent px-3 text-xs font-medium text-brand transition-all hover:bg-brand hover:text-white motion-safe:active:scale-[0.98]"
          >
            {t("clearAll")}
          </button>
        ) : null}
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
