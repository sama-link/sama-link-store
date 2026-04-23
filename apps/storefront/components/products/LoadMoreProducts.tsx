"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { listProducts } from "@/lib/medusa-client";
import ProductCard, { type Product } from "@/components/products/ProductCard";
import Spinner from "@/components/ui/Spinner";
import {
  sortProductsClientSide,
  type ColumnCount,
  type SortKey,
  type ViewMode,
} from "@/components/products/catalog-toolbar-utils";
import { cn } from "@/lib/cn";

interface FilterParams {
  collection?: string;
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  inStock?: string;
}

interface Props {
  initialProducts: Product[];
  totalCount: number | null;
  pageSize: number;
  cols: ColumnCount;
  sort: SortKey;
  view: ViewMode;
  filters: FilterParams;
}

const colsClassMap: Record<ColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2 md:grid-cols-2 lg:grid-cols-2",
  3: "grid-cols-2 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

export default function LoadMoreProducts({
  initialProducts,
  totalCount,
  pageSize,
  cols,
  sort,
  view,
  filters,
}: Props) {
  const t = useTranslations("products.listing");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);

  /* Resync state when the server hands us a new initial batch — happens on
     every URL change (filter apply, sort, view, search). Without this,
     LoadMoreProducts would keep displaying the previously-accumulated list
     regardless of the new filter set. */
  useEffect(() => {
    setProducts(initialProducts);
    setExhausted(false);
    setError(null);
    setLoading(false);
  }, [initialProducts]);

  const hasMore =
    !exhausted &&
    (totalCount == null || products.length < totalCount);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        limit: pageSize,
        offset: products.length,
      };
      if (filters.collection) params.collection_id = [filters.collection];
      if (filters.category) params.category_id = [filters.category];
      if (filters.q && filters.q.trim().length > 0) params.q = filters.q.trim();

      const result = await listProducts(
        params as Parameters<typeof listProducts>[0],
      );
      const next = result.products;
      if (!next || next.length === 0) {
        setExhausted(true);
      } else {
        setProducts((prev) => {
          const seen = new Set(prev.map((p: any) => p.id));
          const merged = [...prev];
          for (const p of next) {
            if (!seen.has(p.id)) {
              merged.push(p);
              seen.add(p.id);
            }
          }
          return merged;
        });
        if (next.length < pageSize) setExhausted(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadMoreError"));
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, products.length, t]);

  const sorted = sortProductsClientSide(products, sort);

  if (sorted.length === 0) {
    return <p className="text-text-secondary">{t("empty")}</p>;
  }

  const isList = view === "list";
  const gridClass = isList
    ? "flex flex-col gap-3"
    : cn("grid gap-5", colsClassMap[cols]);

  return (
    <div className="space-y-6">
      <div className={gridClass}>
        {sorted.map((p, i) => (
          /* Stagger fade-up on mount. Cap at 24 so late items don't feel laggy. */
          <div
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 24) * 40}ms` }}
          >
            <ProductCard product={p} layout={view} />
          </div>
        ))}
      </div>

      {error ? (
        <p className="text-center text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner size="xs" />
                <span>{t("loading")}</span>
              </>
            ) : (
              <>
                <span>{t("loadMore")}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </>
            )}
          </button>
        </div>
      ) : products.length > 0 ? (
        <p className="text-center text-xs text-text-muted">{t("loadMoreEnd")}</p>
      ) : null}
    </div>
  );
}
