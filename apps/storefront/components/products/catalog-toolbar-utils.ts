/**
 * Pure helpers + shared types used by the catalog toolbar, load-more grid,
 * and the server page. Kept in a plain .ts (no "use client") so Server
 * Components can import the parsers and mapping functions directly.
 */

export type SortKey = "newest" | "price-asc" | "price-desc" | "title";
export type ColumnCount = 1 | 2 | 3 | 4;
export type ViewMode = "grid" | "list";

export const DEFAULT_SORT: SortKey = "newest";
export const DEFAULT_COLS: ColumnCount = 4;
export const DEFAULT_VIEW: ViewMode = "grid";

export const SORT_KEYS: SortKey[] = [
  "newest",
  "price-asc",
  "price-desc",
  "title",
];

/* Mobile phones only get 1-col and 2-col options; desktop gets 2/3/4. */
export const MOBILE_COL_OPTIONS: ColumnCount[] = [1, 2];
export const COL_OPTIONS: ColumnCount[] = [2, 3, 4];

export const VIEW_MODES: ViewMode[] = ["grid", "list"];

export function parseSort(raw: string | undefined): SortKey {
  if (raw === "price-asc" || raw === "price-desc" || raw === "title") return raw;
  return DEFAULT_SORT;
}

export function parseCols(raw: string | undefined): ColumnCount {
  const n = raw ? Number(raw) : NaN;
  if (n === 1 || n === 2 || n === 3 || n === 4) return n as ColumnCount;
  return DEFAULT_COLS;
}

export function parseView(raw: string | undefined): ViewMode {
  if (raw === "list" || raw === "grid") return raw;
  return DEFAULT_VIEW;
}

export function sortKeyToOrderParam(sort: SortKey): string | undefined {
  switch (sort) {
    case "newest":
      return "-created_at";
    case "title":
      return "title";
    /* price sorting isn't reliably exposed via the store list API without
       region-scoped price lists — client-side sort handles those cases. */
    default:
      return undefined;
  }
}

export function sortProductsClientSide<
  P extends {
    variants?: Array<{
      calculated_price?: { calculated_amount?: number | null } | null;
    }> | null;
  },
>(products: P[], sort: SortKey): P[] {
  if (sort !== "price-asc" && sort !== "price-desc") return products;
  const amountOf = (p: P): number => {
    const v = p.variants?.[0]?.calculated_price;
    const a = v?.calculated_amount;
    return a == null ? Number.MAX_SAFE_INTEGER : Number(a);
  };
  const copy = [...products];
  copy.sort((a, b) =>
    sort === "price-asc"
      ? amountOf(a) - amountOf(b)
      : amountOf(b) - amountOf(a),
  );
  return copy;
}
