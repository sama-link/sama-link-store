// Sama Link · CustomerListItem entity — ADR-053.
//
// One row per product/variant pinned to a customer's wishlist or compare
// list. Stores Medusa product / variant ids — not full snapshots. The
// `*_snapshot` fields are tombstones used only when the live product is
// later deleted; the storefront otherwise renders against fresh catalog
// data via `listProducts({ id: [ids] })`.
//
// Dedupe contract: at most one non-deleted row per
// `(customer_list_id, product_id, variant_id_or_empty)`. Postgres treats
// NULL ≠ NULL in a vanilla unique index, so the migration uses an
// expression-based partial index on
// `(customer_list_id, product_id, COALESCE(variant_id, ''))` to give the
// expected tuple-equality semantics — i.e. two wishlist rows for the same
// product without a pinned variant are still rejected as duplicates.

import { model } from "@medusajs/utils"

export const CustomerListItem = model.define("customer_list_item", {
  id: model.id().primaryKey(),
  customer_list_id: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  title_snapshot: model.text().nullable(),
  thumbnail_snapshot: model.text().nullable(),
})
