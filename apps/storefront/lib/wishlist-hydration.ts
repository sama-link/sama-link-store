// Sama Link · Wishlist hydration helpers — ACCT-6D.
//
// Pure mappers used by the storefront layout to convert ACCT-6B backend
// `customer_list_item` rows into the in-memory `WishlistItem` shape the
// provider holds. Lifted out of the layout so the mapping is testable
// without a Next/React render.

import type { CustomerListItem } from "./medusa-client";
import type { WishlistItem } from "@/hooks/useWishlist";

export function wishlistItemFromBackendRow(row: CustomerListItem): WishlistItem {
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

export function wishlistItemsFromBackendList(
  rows: CustomerListItem[],
): WishlistItem[] {
  return rows.map(wishlistItemFromBackendRow);
}
