// Sama Link · Compare hydration helpers — ACCT-6E.
//
// Pure mappers used by the storefront layout to convert ACCT-6B backend
// `customer_list_item` rows (list_type === "compare") into the
// in-memory `CompareItem` shape the provider holds. Mirrors
// `wishlist-hydration.ts` from ACCT-6D — kept as a separate file so a
// future divergence between the two list types is a one-file change,
// not a conditional inside a shared mapper.

import type { CustomerListItem } from "./medusa-client";
import { COMPARE_MAX_ITEMS } from "./compare-cap";
import type { CompareItem } from "@/hooks/useCompare";

export function compareItemFromBackendRow(row: CustomerListItem): CompareItem {
  return {
    id: row.product_id,
    handle: null,
    title: row.title_snapshot,
    thumbnail: row.thumbnail_snapshot,
    subtitle: null,
    material: null,
    weight: null,
    originCountry: null,
    variantId: row.variant_id,
    amount: null,
    currencyCode: null,
    backendItemId: row.id,
  };
}

/** Maps backend rows to compare items, capped at COMPARE_MAX_ITEMS so
 *  the provider's first paint never exceeds the UI cap (the backend
 *  enforces the same cap on the write path). */
export function compareItemsFromBackendList(
  rows: CustomerListItem[],
): CompareItem[] {
  return rows.slice(0, COMPARE_MAX_ITEMS).map(compareItemFromBackendRow);
}
