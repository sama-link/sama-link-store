/**
 * Canonical cart totals helpers.
 *
 * Medusa v2's `cart.subtotal` INCLUDES `shipping_subtotal`, so it must
 * NEVER be used as the value for a UI label called "Subtotal" in any
 * cart-stage surface (cart drawer, cart page, checkout review). For all
 * merchandise-only displays, prefer `cart.item_subtotal` with a fallback
 * to summing line items. Single source of truth for cart-display math.
 */

type CartLine = {
  unit_price?: number | null;
  quantity?: number | null;
  item_subtotal?: number | null;
  subtotal?: number | null;
  item_total?: number | null;
  total?: number | null;
};

type CartLike = {
  item_subtotal?: number | null;
  shipping_total?: number | null;
  shipping_subtotal?: number | null;
  tax_total?: number | null;
  discount_total?: number | null;
  total?: number | null;
  items?: CartLine[] | null;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function num(value: unknown): number {
  return finiteNumber(value) ?? 0;
}

function lineSubtotalFromFields(line: CartLine): number {
  const qty = line.quantity ?? 1;
  const unit = finiteNumber(line.unit_price) ?? 0;
  return (
    finiteNumber(line.item_subtotal) ??
    finiteNumber(line.subtotal) ??
    finiteNumber(line.item_total) ??
    finiteNumber(line.total) ??
    unit * qty
  );
}

/**
 * Merchandise subtotal: sum of line items, excluding shipping. Prefers
 * `cart.item_subtotal`. Never returns Medusa's `cart.subtotal` (which
 * includes shipping_subtotal in v2).
 */
export function getCartItemsSubtotal(
  cart: CartLike | null | undefined,
): number {
  if (!cart) return 0;
  const aggregate = finiteNumber(cart.item_subtotal);
  if (aggregate != null) return aggregate;
  return (cart.items ?? []).reduce<number>(
    (sum, item) => sum + lineSubtotalFromFields(item),
    0,
  );
}

export function getCartShippingTotal(
  cart: CartLike | null | undefined,
): number {
  if (!cart) return 0;
  return (
    finiteNumber(cart.shipping_total) ??
    finiteNumber(cart.shipping_subtotal) ??
    0
  );
}

export function getCartTaxTotal(cart: CartLike | null | undefined): number {
  return num(cart?.tax_total);
}

export function getCartDiscountTotal(
  cart: CartLike | null | undefined,
): number {
  return num(cart?.discount_total);
}

export function getCartGrandTotal(cart: CartLike | null | undefined): number {
  return num(cart?.total);
}

/**
 * Per-line display total. Used wherever a single cart line item shows its
 * own monetary line ("Item Title — EGP 2,900"). Falls back through
 * available subtotal/total fields, then to `unit_price * quantity`.
 */
export function getCartLineDisplayTotal(
  line: CartLine | null | undefined,
): number {
  if (!line) return 0;
  return lineSubtotalFromFields(line);
}

/**
 * Per-line unit price. Prefers the line's `unit_price`. Falls back to
 * deriving from line total / quantity when `unit_price` is missing or
 * zero — matters for order line items, but kept symmetrical for cart so
 * any defensive consumer can use the same primitive.
 */
export function getCartLineUnitPrice(
  line: CartLine | null | undefined,
): number {
  if (!line) return 0;
  const unit = finiteNumber(line.unit_price);
  if (unit != null && unit > 0) return unit;
  const qty = line.quantity ?? 0;
  if (qty > 0) {
    const lineTotal = lineSubtotalFromFields(line);
    if (lineTotal > 0) return lineTotal / qty;
  }
  return unit ?? 0;
}
