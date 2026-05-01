/**
 * Canonical order totals helpers.
 *
 * The Medusa v2 store API has been observed returning inconsistent values
 * for several order fields:
 *   - `order.subtotal` may equal the shipping amount (not items).
 *   - `order.total` may be lower than the sum of the displayed parts.
 *   - `item.unit_price` may be 0 even when a real line total exists.
 *   - `item.total` may be 0 even when `unit_price * quantity` is positive.
 *
 * The helpers below resolve these by:
 *   1. Always preferring POSITIVE candidates over zero/null when picking
 *      the "real" line total (zero is finite but rarely the intended
 *      display value when another candidate is positive).
 *   2. Computing the grand total from the displayed parts and using
 *      `order.total` only if it matches or exceeds that sum — so the
 *      numbers on screen always add up to the displayed total.
 *
 * Cart drawer / cart page must NEVER call any of these. Use
 * `lib/cart-totals.ts` for cart-stage UX. The two domains are kept
 * deliberately separate so a fix on one side cannot regress the other.
 */

type OrderLine = {
  unit_price?: number | null;
  quantity?: number | null;
  subtotal?: number | null;
  total?: number | null;
};

type OrderLike = {
  item_subtotal?: number | null;
  subtotal?: number | null;
  shipping_total?: number | null;
  shipping_subtotal?: number | null;
  tax_total?: number | null;
  discount_total?: number | null;
  total?: number | null;
  items?: OrderLine[] | null;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function num(value: unknown): number {
  return finiteNumber(value) ?? 0;
}

/**
 * Pick the "real" display value for a single order line. Prefers any
 * positive candidate (subtotal > total > unit*qty). Returns 0 only when
 * every candidate is 0 or missing — preserves legitimate zero-priced
 * items while ignoring the v2 quirk where `total = 0` next to a positive
 * `unit_price * quantity`.
 */
function orderLineDisplayFromFields(line: OrderLine): number {
  const qty = line.quantity ?? 1;
  const unit = finiteNumber(line.unit_price);
  const subtotal = finiteNumber(line.subtotal);
  const total = finiteNumber(line.total);
  const computed = unit != null ? unit * qty : null;

  if (subtotal != null && subtotal > 0) return subtotal;
  if (total != null && total > 0) return total;
  if (computed != null && computed > 0) return computed;
  return subtotal ?? total ?? computed ?? 0;
}

/**
 * Merchandise subtotal: prefers `order.item_subtotal` ONLY when it is
 * positive; otherwise sums line items so a v2 quirk that puts the
 * shipping amount into `order.subtotal` cannot leak into the displayed
 * Subtotal. (We intentionally do not read `order.subtotal` here at all.)
 */
export function getOrderItemsSubtotal(
  order: OrderLike | null | undefined,
): number {
  if (!order) return 0;
  const aggregate = finiteNumber(order.item_subtotal);
  if (aggregate != null && aggregate > 0) return aggregate;
  return (order.items ?? []).reduce<number>(
    (sum, item) => sum + orderLineDisplayFromFields(item),
    aggregate ?? 0,
  );
}

/**
 * Shipping subtotal for the order — matches Medusa Admin's
 * "Shipping subtotal" label. Prefers `shipping_subtotal`, falls back to
 * `shipping_total` (post-tax) when only that is populated.
 */
export function getOrderShippingTotal(
  order: OrderLike | null | undefined,
): number {
  if (!order) return 0;
  return (
    finiteNumber(order.shipping_subtotal) ??
    finiteNumber(order.shipping_total) ??
    0
  );
}

export function getOrderTaxTotal(order: OrderLike | null | undefined): number {
  return num(order?.tax_total);
}

export function getOrderDiscountTotal(
  order: OrderLike | null | undefined,
): number {
  return num(order?.discount_total);
}

/**
 * Order grand total — what the customer paid. Computes from the
 * displayed parts (subtotal + shipping + tax - discount) and uses
 * `order.total` only if it matches or exceeds that sum. This guarantees
 * the displayed Total always equals the sum of the displayed line
 * breakdown, so the storefront never shows a Total that's lower than
 * Subtotal + Shipping (the bug behind order #18).
 */
export function getOrderGrandTotal(
  order: OrderLike | null | undefined,
): number {
  if (!order) return 0;
  const subtotal = getOrderItemsSubtotal(order);
  const shipping = getOrderShippingTotal(order);
  const tax = getOrderTaxTotal(order);
  const discount = getOrderDiscountTotal(order);
  const computed = subtotal + shipping + tax - discount;
  const reported = num(order.total);
  return reported >= computed ? reported : computed;
}

export function getOrderLineDisplayTotal(
  line: OrderLine | null | undefined,
): number {
  if (!line) return 0;
  return orderLineDisplayFromFields(line);
}

/**
 * Per-line unit price for orders. Order line items frequently come back
 * with `unit_price = 0` even when a real `total` is set; in that case
 * derive unit price from `total / quantity` so the storefront never
 * displays a misleading "0.00" beneath a real line total. Inverse case
 * (positive `unit_price` next to `total = 0`) is handled by the line
 * display helper.
 */
export function getOrderLineUnitPrice(
  line: OrderLine | null | undefined,
): number {
  if (!line) return 0;
  const unit = finiteNumber(line.unit_price);
  if (unit != null && unit > 0) return unit;
  const qty = line.quantity ?? 0;
  if (qty > 0) {
    const lineTotal = orderLineDisplayFromFields(line);
    if (lineTotal > 0) return lineTotal / qty;
  }
  return unit ?? 0;
}
