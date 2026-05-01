/**
 * Hero primary CTA → catalog deep links.
 * Tries product category id first, then collection id, then `/collections/{slug}`.
 * Handle lists are ordered: first match wins (aligns with Medusa seed / admin naming drift).
 */

const HERO_SLIDE_HANDLE_CANDIDATES: Record<string, string[]> = {
  surveillance: ["cameras", "surveillance", "cctv"],
  ups: ["ups", "power", "power-solutions", "power_solutions", "battery-charging"],
  racks: ["racks", "rack"],
  networking: ["networking", "network", "wi-fi", "wifi"],
  cables: ["cables", "cabling", "cable", "net-acc"],
  laptops: ["laptops", "laptop", "laptops-workstations"],
};

function mapByLowerHandle<T extends { handle?: string | null; id: string }>(
  rows: T[],
): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of rows) {
    if (row.handle && typeof row.handle === "string") {
      m.set(row.handle.toLowerCase().trim(), row.id);
    }
  }
  return m;
}

/** Normalize Medusa store category.list payloads (field names differ by SDK version). */
export function normalizeStoreCategoryRows(
  result: unknown,
): Array<{ id: string; handle?: string | null }> {
  if (Array.isArray(result)) {
    return result as Array<{ id: string; handle?: string | null }>;
  }
  if (!result || typeof result !== "object") return [];
  const r = result as Record<string, unknown>;
  const raw =
    r.product_categories ??
    (r as { categories?: unknown }).categories;
  return Array.isArray(raw) ? (raw as Array<{ id: string; handle?: string | null }>) : [];
}

export function normalizeStoreCollectionRows(
  result: unknown,
): Array<{ id: string; handle?: string | null }> {
  if (Array.isArray(result)) {
    return result as Array<{ id: string; handle?: string | null }>;
  }
  if (!result || typeof result !== "object") return [];
  const r = result as Record<string, unknown>;
  const raw = r.collections;
  return Array.isArray(raw) ? (raw as Array<{ id: string; handle?: string | null }>) : [];
}

export function buildHeroPrimaryHrefs(
  locale: string,
  categories: Array<{ handle?: string | null; id: string }>,
  collections: Array<{ handle?: string | null; id: string }> = [],
): Record<string, string> {
  const categoryByHandle = mapByLowerHandle(categories);
  const collectionByHandle = mapByLowerHandle(collections);
  const productsFallback = `/${locale}/products`;
  const out: Record<string, string> = {};

  for (const [slideId, candidates] of Object.entries(HERO_SLIDE_HANDLE_CANDIDATES)) {
    let href = productsFallback;
    let matched = false;

    for (const h of candidates) {
      const key = h.toLowerCase().trim();
      const catId = categoryByHandle.get(key);
      if (catId) {
        href = `/${locale}/products?category=${encodeURIComponent(catId)}`;
        matched = true;
        break;
      }
    }

    if (!matched) {
      for (const h of candidates) {
        const key = h.toLowerCase().trim();
        const colId = collectionByHandle.get(key);
        if (colId) {
          href = `/${locale}/products?collection=${encodeURIComponent(colId)}`;
          matched = true;
          break;
        }
      }
    }

    if (!matched && candidates.length > 0) {
      href = `/${locale}/collections/${encodeURIComponent(candidates[0])}`;
    }

    out[slideId] = href;
  }

  return out;
}
