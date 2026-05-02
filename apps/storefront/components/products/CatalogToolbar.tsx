"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  SORT_KEYS,
  COL_OPTIONS,
  VIEW_MODES,
  PAGE_SIZE_OPTIONS,
  type ColumnCount,
  type SortKey,
  type ViewMode,
  type PageSize,
} from "@/components/products/catalog-toolbar-utils";

import DropdownSelect from "@/components/ui/DropdownSelect";

interface Props {
  totalCount: number | null;
  activeSort: SortKey;
  activeCols: ColumnCount;
  activeView: ViewMode;
  activePageSize: PageSize;
}

export default function CatalogToolbar({
  totalCount,
  activeSort,
  activeCols,
  activeView,
  activePageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const t = useTranslations("products.toolbar");

  const buildHref = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.delete("page");
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(buildHref({ sort: val === "newest" ? null : val }), {
      scroll: false,
    });
  };

  const onColsClick = (c: ColumnCount) => {
    router.push(buildHref({ cols: c === 3 ? null : String(c) }), {
      scroll: false,
    });
  };

  const onPageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(buildHref({ pageSize: val === "12" ? null : val }), {
      scroll: false,
    });
  };

  const onViewClick = (v: ViewMode) => {
    router.push(buildHref({ view: v === "grid" ? null : v }), {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      {/* Start cluster — page size + total count. Logical-side `flex` so RTL mirrors. */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{t("show")}</span>
          <div className="relative z-20 min-w-[70px]">
            <DropdownSelect
              value={String(activePageSize)}
              onChange={(val) => {
                router.push(buildHref({ pageSize: val === "12" ? null : val }), {
                  scroll: false,
                });
              }}
              options={PAGE_SIZE_OPTIONS.map((size) => ({
                value: String(size),
                label: size,
              }))}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:border-border-strong"
            />
          </div>
        </label>
        {totalCount != null ? (
          <span className="text-sm font-medium text-text-secondary">
            {t("ofTotal", { total: totalCount })}
          </span>
        ) : null}
      </div>

      {/* End cluster — view / density / sort */}
      <div className="flex items-center gap-3">
      {/* Grid / List view toggle — always visible */}
      <div
        role="radiogroup"
        aria-label={t("viewMode")}
        className="inline-flex h-9 items-center rounded-lg border border-border bg-surface p-0.5"
      >
        {VIEW_MODES.map((v) => {
          const active = activeView === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onViewClick(v)}
              aria-label={t(`viewModes.${v}`)}
              title={t(`viewModes.${v}`)}
              className={cn(
                "inline-flex h-8 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-primary",
                active && "bg-accent-muted text-brand",
              )}
            >
              <ViewIcon mode={v} />
            </button>
          );
        })}
      </div>

      {/* Density — desktop only, and only when in grid view */}
      {activeView === "grid" ? (
        <div
          role="radiogroup"
          aria-label={t("density")}
          className="hidden items-center rounded-lg border border-border bg-surface p-0.5 md:flex"
        >
          {COL_OPTIONS.map((c) => {
            const active = activeCols === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onColsClick(c)}
                aria-label={t("density")}
                title={t("densityCols", { count: c })}
                className={cn(
                  "inline-flex h-7 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-primary",
                  active && "bg-accent-muted text-brand",
                )}
              >
                <DensityIcon count={c} />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Sort — desktop only (mobile uses the FAB's View tab) */}
      <label className="hidden items-center gap-2 text-sm text-text-secondary sm:flex">
        <span className="hidden sm:inline">{t("sortBy")}</span>
        <div className="relative z-20 min-w-[140px]">
          <DropdownSelect
            value={activeSort}
            onChange={(val) => {
              router.push(buildHref({ sort: val === "newest" ? null : val }), {
                scroll: false,
              });
            }}
            options={SORT_KEYS.map((k) => ({
              value: k,
              label: t(`sort.${k}`),
            }))}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:border-border-strong"
          />
        </div>
      </label>
      </div>
    </div>
  );
}

function ViewIcon({ mode }: { mode: ViewMode }) {
  const stroke = 1.75;
  if (mode === "grid") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function DensityIcon({ count }: { count: ColumnCount }) {
  const stroke = 1.75;
  if (count === 2) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="3" y="4" width="8" height="16" rx="1" />
        <rect x="13" y="4" width="8" height="16" rx="1" />
      </svg>
    );
  }
  if (count === 3) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="3" y="4" width="5.5" height="16" rx="1" />
        <rect x="9.25" y="4" width="5.5" height="16" rx="1" />
        <rect x="15.5" y="4" width="5.5" height="16" rx="1" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="3" y="4" width="4" height="16" rx="1" />
      <rect x="7.5" y="4" width="4" height="16" rx="1" />
      <rect x="12" y="4" width="4" height="16" rx="1" />
      <rect x="16.5" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
