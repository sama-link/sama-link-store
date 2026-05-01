// Sama Link · CustomerList entity — ADR-053.
//
// Header row: one per (customer_id, list_type) pair, lazily created on the
// first add. Stores no items directly — see customer-list-item.ts.
//
// Fields:
//   - customer_id → Medusa customer id (text snapshot — ownership boundary)
//   - list_type   → "wishlist" | "compare" (enforced at the service / API
//                   layer; column is plain text so a future divergence
//                   does not require a migration)
//
// The unique `(customer_id, list_type)` constraint is enforced via a
// partial unique index in the migration (see migrations/), scoped on
// `deleted_at IS NULL` so soft-deleted rows do not block re-creation.

import { model } from "@medusajs/utils"

export const CustomerList = model.define("customer_list", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  list_type: model.text(),
})
