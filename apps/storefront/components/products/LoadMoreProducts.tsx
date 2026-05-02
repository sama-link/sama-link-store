"use client";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCard, { type Product } from "@/components/products/ProductCard";
import {
  sortProductsClientSide,
  type ColumnCount,
  type SortKey,
  type ViewMode,
} from "@/components/products/catalog-toolbar-utils";
import { cn } from "@/lib/cn";

interface Props {
  initialProducts: Product[];
  totalCount: number | null;
  pageSize: number;
  cols: ColumnCount;
  sort: SortKey;
  view: ViewMode;
  currentPage: number;
}

const colsClassMap: Record<ColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2 md:grid-cols-2 lg:grid-cols-2",
  3: "grid-cols-2 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

/* Numbered pagination — server-rendered each page from products/page.tsx.
   Preserves filter / sort / view / cols / pageSize / q searchParams via
   URLSearchParams; only the `page` key is mutated. */
export default function LoadMoreProducts({
  initialProducts,
  totalCount,
  pageSize,
  cols,
  sort,
  view,
  currentPage,
}: Props) {
  const t = useTranslations("products.listing");
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const sorted = sortProductsClientSide(initialProducts, sort);

  if (sorted.length === 0) {
    return <p className="text-text-secondary">{t("empty")}</p>;
  }

  const isList = view === "list";
  const gridClass = isList
    ? "flex flex-col gap-3"
    : cn("grid gap-5", colsClassMap[cols]);

  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const showPagination = totalCount != null && totalPages > 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const buildPageHref = (page: number) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (page === 1) {
      next.delete("page");
    } else {
      next.set("page", String(page));
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="space-y-6">
      <div className={gridClass}>
        {sorted.map((p: any, i: number) => (
          <div
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 24) * 40}ms` }}
          >
            <ProductCard product={p} layout={view} />
          </div>
        ))}
      </div>

      {showPagination ? (
        <nav
          aria-label={t("paginationLabel")}
          className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-8"
        >
          <div className="flex flex-1 justify-start">
            {hasPrev ? (
              <Link
                href={buildPageHref(currentPage - 1)}
                scroll={false}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span>{t("previous")}</span>
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-muted opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span>{t("previous")}</span>
              </span>
            )}
          </div>

          <div className="hidden items-center justify-center gap-1 sm:flex">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isEdge = page === 1 || page === totalPages;
              const isNear = page >= currentPage - 1 && page <= currentPage + 1;
              if (isEdge || isNear) {
                const isActive = page === currentPage;
                return (
                  <Link
                    key={page}
                    href={buildPageHref(page)}
                    scroll={false}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-brand text-text-inverse"
                        : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
                    )}
                  >
                    {page}
                  </Link>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span
                    key={page}
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 items-center justify-center text-text-muted"
                  >
                    …
                  </span>
                );
              }
              return null;
            })}
          </div>

          <div className="flex flex-1 justify-end">
            {hasNext ? (
              <Link
                href={buildPageHref(currentPage + 1)}
                scroll={false}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
              >
                <span>{t("next")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-muted opacity-50"
              >
                <span>{t("next")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
