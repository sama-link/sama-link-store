"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import FilterSidebar, {
  type FilterBrandOption,
  type FilterCategoryOption,
  type FilterCollectionOption,
} from "@/components/products/FilterSidebar";
import { useCart } from "@/hooks/useCart";
import {
  SORT_KEYS,
  MOBILE_COL_OPTIONS,
  VIEW_MODES,
  type ColumnCount,
  type SortKey,
  type ViewMode,
} from "@/components/products/catalog-toolbar-utils";
import { cn } from "@/lib/cn";

/* Mobile catalog controls — floating FAB that opens a *floating* panel
   above itself (not a full-screen sheet). The FAB stays in place and
   visibly shrinks when the panel is open so the user always knows where
   the anchor is.

   Structure when open:
     ┌─ content card (filter OR view) ─┐
     └──────────────────────────────────┘
     [ Filter | View ] tabs pill       ← outside/below the panel
     (▥) FAB (scaled down) */

interface Props {
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
  activeSort: SortKey;
  activeCols: ColumnCount;
  activeView: ViewMode;
  locale: string;
}

export default function MobileCatalogFab(props: Props) {
  const t = useTranslations("products");
  const tToolbar = useTranslations("products.toolbar");
  const tFilters = useTranslations("products.filters");
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"filter" | "view">("filter");
  const { isCartOpen, closeCart } = useCart();

  /* Dismiss on Escape */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Mutual exclusion: if the cart opens, close the filter panel. */
  useEffect(() => {
    if (isCartOpen) setOpen(false);
  }, [isCartOpen]);

  const toggleOpen = () => {
    /* Compute the next state from the current value and call setState once.
       `closeCart()` must be called OUTSIDE the state updater — React 19 flags
       cross-component setState calls inside render/updater functions. */
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && isCartOpen) closeCart();
  };

  /* View tab — stage locally, commit only on Apply View. */
  const [stagedSort, setStagedSort] = useState<SortKey>(props.activeSort);
  const [stagedCols, setStagedCols] = useState<ColumnCount>(props.activeCols);
  const [stagedView, setStagedView] = useState<ViewMode>(props.activeView);

  useEffect(() => {
    setStagedSort(props.activeSort);
  }, [props.activeSort]);
  useEffect(() => {
    setStagedCols(props.activeCols);
  }, [props.activeCols]);
  useEffect(() => {
    setStagedView(props.activeView);
  }, [props.activeView]);

  const viewDirty =
    stagedSort !== props.activeSort ||
    stagedCols !== props.activeCols ||
    stagedView !== props.activeView;

  function buildHref(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete("page");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const applyView = () => {
    router.push(
      buildHref({
        sort: stagedSort === "newest" ? null : stagedSort,
        cols: stagedCols === 3 ? null : String(stagedCols),
        view: stagedView === "grid" ? null : stagedView,
      }),
      { scroll: false },
    );
    setOpen(false);
  };

  const activeFilterCount =
    (props.activeCollection ? 1 : 0) +
    (props.activeBrand ? 1 : 0) +
    (props.activeCategory ? 1 : 0) +
    (props.activeMinPrice || props.activeMaxPrice ? 1 : 0) +
    (props.activeQuery ? 1 : 0) +
    (props.activeInStock ? 1 : 0) +
    (props.activeRating ? 1 : 0);

  return (
    <>
      {/* Floating FAB — warm amber. Stays visible when its own panel is open
          (shrunken to show "pressed"). Fully hides while the cart drawer is
          open so the cart popup owns the bottom-end corner cleanly. */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={t("filtersAndViewAria")}
        aria-pressed={open}
        aria-expanded={open}
        aria-hidden={isCartOpen}
        tabIndex={isCartOpen ? -1 : 0}
        className={cn(
          "fixed bottom-[88px] end-5 z-[41] inline-flex items-center justify-center rounded-full bg-[#c2680a] text-white transition-[transform,background-color,height,width,opacity] duration-250 hover:bg-[#a85808] motion-safe:active:scale-90 sm:hidden",
          open ? "h-10 w-10 scale-90 bg-[#a85808]" : "h-12 w-12 scale-100",
          isCartOpen && "pointer-events-none scale-75 opacity-0",
        )}
        style={{
          boxShadow: open
            ? "0 1px 2px rgba(194,104,10,0.22)"
            : "0 1px 2px rgba(194,104,10,0.28), 0 10px 22px -6px rgba(194,104,10,0.42)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="9" y1="18" x2="15" y2="18" />
          <circle cx="8" cy="6" r="2" fill="currentColor" />
          <circle cx="16" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="18" r="2" fill="currentColor" />
        </svg>
        {activeFilterCount > 0 ? (
          <span
            key={activeFilterCount}
            aria-hidden="true"
            className="absolute -end-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-text-primary px-1 text-[10px] font-bold text-surface animate-pop-in"
          >
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[color:rgba(10,19,36,0.4)] transition-opacity duration-300 sm:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Floating panel / Bottom Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] h-[85vh] flex-col rounded-t-3xl border-t border-border bg-surface transition-transform duration-300 ease-out sm:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-border-strong" />
        </div>

        {/* Tab pill */}
        <div
          role="tablist"
          aria-label={t("filtersAndViewAria")}
          className="flex shrink-0 justify-center pb-2 pt-2 border-b border-border"
        >
          <div
            className="inline-flex h-10 items-center gap-1 rounded-full bg-surface-subtle p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "filter"}
              onClick={() => setTab("filter")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors motion-safe:active:scale-95",
                tab === "filter"
                  ? "bg-surface text-brand shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tFilters("heading")}
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-text-inverse">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "view"}
              onClick={() => setTab("view")}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-4 text-sm font-semibold transition-colors motion-safe:active:scale-95",
                tab === "view"
                  ? "bg-surface text-brand shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tToolbar("view")}
            </button>
          </div>
        </div>

        {/* Content card */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("filtersAndViewAria")}
          className="flex flex-1 flex-col overflow-hidden bg-surface"
        >
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {tab === "filter" ? (
              <FilterSidebar
                collections={props.collections}
                brands={props.brands}
                categories={props.categories}
                activeCollection={props.activeCollection}
                activeBrand={props.activeBrand}
                activeCategory={props.activeCategory}
                activeMinPrice={props.activeMinPrice}
                activeMaxPrice={props.activeMaxPrice}
                activeQuery={props.activeQuery}
                activeInStock={props.activeInStock}
                activeRating={props.activeRating}
                locale={props.locale}
                onApply={() => setOpen(false)}
              />
            ) : (
              <div className="flex max-h-full flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto">
                  {/* View mode */}
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      {tToolbar("viewMode")}
                    </h3>
                    <div className="flex items-center gap-2">
                      {VIEW_MODES.map((v) => {
                        const active = stagedView === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setStagedView(v)}
                            className={cn(
                              "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors motion-safe:active:scale-[0.98]",
                              active
                                ? "border-brand bg-accent-muted text-brand"
                                : "border-border bg-surface text-text-primary hover:border-border-strong",
                            )}
                          >
                            {v === "grid" ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="18" x2="20" y2="18" />
                              </svg>
                            )}
                            <span>{tToolbar(`viewModes.${v}`)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Sort */}
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      {tToolbar("sortBy")}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {SORT_KEYS.map((k) => {
                        const active = stagedSort === k;
                        return (
                          <li key={k}>
                            <button
                              type="button"
                              onClick={() => setStagedSort(k)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors motion-safe:active:scale-[0.98]",
                                active
                                  ? "border-brand bg-accent-muted text-brand"
                                  : "border-border bg-surface text-text-primary hover:border-border-strong hover:bg-surface-subtle",
                              )}
                            >
                              <span>{tToolbar(`sort.${k}`)}</span>
                              {active ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  {/* Density — 1 or 2 cols on mobile */}
                  {stagedView === "grid" ? (
                    <section className="space-y-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                        {tToolbar("density")}
                      </h3>
                      <div className="flex items-center gap-2">
                        {MOBILE_COL_OPTIONS.map((c) => {
                          const active = stagedCols === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setStagedCols(c)}
                              className={cn(
                                "flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors motion-safe:active:scale-[0.98]",
                                active
                                  ? "border-brand bg-accent-muted text-brand"
                                  : "border-border bg-surface text-text-primary hover:border-border-strong",
                              )}
                            >
                              {tToolbar("densityCols", { count: c })}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
                </div>

                {/* Apply View — stages in-tab; commits only here. */}
                <div className="shrink-0 border-t border-border bg-surface-subtle p-3">
                  <button
                    type="button"
                    onClick={applyView}
                    disabled={!viewDirty}
                    className={cn(
                      "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-[background-color,color,transform] duration-200 motion-safe:active:scale-[0.98]",
                      viewDirty
                        ? "bg-brand text-text-inverse hover:bg-brand-hover"
                        : "cursor-not-allowed bg-surface text-text-muted",
                    )}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{tToolbar("applyView")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
