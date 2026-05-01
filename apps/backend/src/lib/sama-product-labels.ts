/** Product catalog labels — stored on `product.metadata.sama_labels` as a comma-separated slug list. */

export const SAMA_LABELS_METADATA_KEY = "sama_labels" as const

export const PRODUCT_LABEL_SLUGS = {
  SPECIAL_OFFER: "special_offer",
  NEW_ARRIVAL: "new_arrival",
  CLEARANCE: "clearance",
} as const

export type ProductLabelSlug =
  (typeof PRODUCT_LABEL_SLUGS)[keyof typeof PRODUCT_LABEL_SLUGS]

/** Admin + API — human-readable options (EN in admin UI). */
export const PRODUCT_LABEL_OPTIONS: Array<{
  slug: ProductLabelSlug
  labelEn: string
  labelAr: string
}> = [
  {
    slug: PRODUCT_LABEL_SLUGS.SPECIAL_OFFER,
    labelEn: "Special offer",
    labelAr: "عرض خاص",
  },
  {
    slug: PRODUCT_LABEL_SLUGS.NEW_ARRIVAL,
    labelEn: "New arrival",
    labelAr: "وصل حديثاً",
  },
  {
    slug: PRODUCT_LABEL_SLUGS.CLEARANCE,
    labelEn: "Clearance",
    labelAr: "تصفية",
  },
]

export function parseSamaLabels(
  metadata: Record<string, unknown> | null | undefined
): string[] {
  if (!metadata || typeof metadata !== "object") return []
  const raw = metadata[SAMA_LABELS_METADATA_KEY]
  if (typeof raw !== "string" || !raw.trim()) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serializeSamaLabels(slugs: string[]): string {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))]
  return unique.join(",")
}

export function productHasLabel(
  metadata: Record<string, unknown> | null | undefined,
  slug: string
): boolean {
  return parseSamaLabels(metadata).includes(slug)
}
