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
  const unit = finiteNumber(line.unit_price);
  const itemSubtotal = finiteNumber(line.item_subtotal);
  const subtotal = finiteNumber(line.subtotal);
  const itemTotal = finiteNumber(line.item_total);
  const total = finiteNumber(line.total);
  const computed = unit != null ? unit * qty : null;

  // Prefer the first positive candidate. Falls back to whichever value
  // was explicitly set (allows legitimate 0 for free items).
  if (itemSubtotal != null && itemSubtotal > 0) return itemSubtotal;
  if (subtotal != null && subtotal > 0) return subtotal;
  if (itemTotal != null && itemTotal > 0) return itemTotal;
  if (total != null && total > 0) return total;
  if (computed != null && computed > 0) return computed;
  return itemSubtotal ?? subtotal ?? itemTotal ?? total ?? computed ?? 0;
}

/**
 * Merchandise subtotal: sum of line items, excluding shipping. Prefers
 * `cart.item_subtotal` ONLY when positive; otherwise sums line items.
 * Never reads `cart.subtotal` (which is `item_subtotal + shipping_subtotal`
 * in v2 and would leak shipping into the displayed Subtotal).
 */
export function getCartItemsSubtotal(
  cart: CartLike | null | undefined,
): number {
  if (!cart) return 0;
  const aggregate = finiteNumber(cart.item_subtotal);
  if (aggregate != null && aggregate > 0) return aggregate;
  return (cart.items ?? []).reduce<number>(
    (sum, item) => sum + lineSubtotalFromFields(item),
    aggregate ?? 0,
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

/**
 * Cart grand total — what the customer will pay. Computes from the
 * displayed parts (subtotal + shipping + tax - discount) and uses
 * `cart.total` only if it matches or exceeds that sum. This guarantees
 * the displayed Total always equals the sum of the displayed line
 * breakdown — protects against any cart-side analogue of the order #18
 * mismatch bug.
 */
export function getCartGrandTotal(cart: CartLike | null | undefined): number {
  if (!cart) return 0;
  const subtotal = getCartItemsSubtotal(cart);
  const shipping = getCartShippingTotal(cart);
  const tax = getCartTaxTotal(cart);
  const discount = getCartDiscountTotal(cart);
  const computed = subtotal + shipping + tax - discount;
  const reported = num(cart.total);
  return reported >= computed ? reported : computed;
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
