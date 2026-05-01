/** Minimal category shape for PDP breadcrumb trail (Medusa store product categories). */
export type PdpCategoryCrumb = {
  id: string;
  name: string | null;
  handle: string | null;
  parent_category_id?: string | null;
};

/**
 * Pick primary + optional subcategory for breadcrumbs:
 * - If some category's parent is also in the product's category list, parent → primary, child → sub.
 * - Else if a category has a parent id not in the list, that category alone is primary (no sub label).
 * - Else first category is primary.
 */
export function pickCategoryBreadcrumbTrail(
  categories: PdpCategoryCrumb[],
): { primary: PdpCategoryCrumb | null; sub: PdpCategoryCrumb | null } {
  const cats = categories.filter((c) => c?.id);
  if (cats.length === 0) return { primary: null, sub: null };

  const byId = new Map(cats.map((c) => [c.id, c]));

  for (const c of cats) {
    const pid = c.parent_category_id ?? null;
    if (pid && byId.has(pid)) {
      return { primary: byId.get(pid)!, sub: c };
    }
  }

  const withParentOutside = cats.find((c) => c.parent_category_id);
  if (withParentOutside) {
    return { primary: withParentOutside, sub: null };
  }

  return { primary: cats[0] ?? null, sub: null };
}

export function categoryLabel(c: PdpCategoryCrumb): string {
  return (c.name ?? c.handle ?? c.id).trim() || c.id;
}
