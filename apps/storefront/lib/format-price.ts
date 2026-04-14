/**
 * Format any Medusa v2 price value.
 *
 * Medusa v2 returns all price fields (unit_price, subtotal, total,
 * calculated_price.calculated_amount) as direct major-unit amounts —
 * e.g. 1070 means EGP 1,070.00. No minor-unit conversion is applied.
 */
export function formatPrice(
  amount: number | null | undefined,
  currencyCode: string,
): string {
  if (amount == null) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  } catch {
    return String(amount);
  }
}

/**
 * Same behaviour as formatPrice — kept as a named alias so call sites
 * on product/catalog pages remain readable without churn.
 */
export function formatCatalogPrice(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
): string {
  if (amount == null || currencyCode == null) return "";
  return formatPrice(amount, currencyCode);
}
