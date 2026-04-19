// Sama Link · Brand entity — ADR-047.
//
// First-class brand catalog, modelled after Medusa's Category / Tag domain
// entities rather than stored as free-text metadata. Drives the brand
// eyebrow on product cards + PDP, and is selected (not typed) from the
// product details drawer via `sama-product-brand-picker`.
//
// Fields:
//   - name        → display label (e.g. "Sama Link")
//   - handle      → URL-safe identifier (e.g. "sama-link") — UNIQUE
//   - description → optional long-form blurb (shown on any future /brands page)
//   - image_url   → optional logo URL (hosted externally for now; file-
//                   module upload is a follow-up workstream)

import { model } from "@medusajs/utils"

export const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  handle: model.text().unique(),
  description: model.text().nullable(),
  image_url: model.text().nullable(),
})
