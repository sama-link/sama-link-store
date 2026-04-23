// Sama Link · Translation entity — DB-backed translation storage.
//
// Replaces the CSV-on-disk model (ADR-040) with a first-class database
// table so translations survive Cloud Run's ephemeral filesystem and
// concurrent writes are safe under PostgreSQL row-level locking.
//
// Fields:
//   - catalog → "storefront" or "admin" (replaces the two-file split)
//   - key     → dotted translation key (e.g. "cart.title")
//   - en      → English value
//   - ar      → Arabic value
//   - notes   → operator notes (CSV-only metadata, not user-facing)
//
// Unique constraint: (catalog, key) — one row per key per catalog.

import { model } from "@medusajs/utils"

export const Translation = model.define("translation", {
  id: model.id().primaryKey(),
  catalog: model.text(),
  key: model.text(),
  en: model.text().nullable(),
  ar: model.text().nullable(),
  notes: model.text().nullable(),
})
