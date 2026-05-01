/**
 * Canonical order totals helpers.
 *
 * Medusa v2's `order.subtotal` is unreliable across SDK versions and
 * field-selection paths — observed cases where it returns the shipping
 * amount instead of the merchandise subtotal. Prefer `order.item_subtotal`,
 * fall back to summing line items, mirroring the cart-totals discipline.
 *
 * Order line items frequently have `unit_price = 0` even when a real
 * `total` is present, so unit-price rendering must derive from
 * `total / quantity` when `unit_price` is missing or zero.
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

function orderLineDisplayFromFields(line: OrderLine): number {
  const qty = line.quantity ?? 1;
  const unit = finiteNumber(line.unit_price) ?? 0;
  return (
    finiteNumber(line.subtotal) ??
    finiteNumber(line.total) ??
    unit * qty
  );
}

/**
 * Merchandise subtotal of an order: sum of line items excluding
 * shipping/tax. Prefers `order.item_subtotal`; falls back to summing line
 * items. Never returns `order.subtotal` directly because v2 has
 * inconsistent semantics for that field across releases.
 */
export function getOrderItemsSubtotal(
  order: OrderLike | null | undefined,
): number {
  if (!order) return 0;
  const aggregate = finiteNumber(order.item_subtotal);
  if (aggregate != null) return aggregate;
  return (order.items ?? []).reduce<number>(
    (sum, item) => sum + orderLineDisplayFromFields(item),
    0,
  );
}

/**
 * Shipping total for the order — what the customer paid for delivery.
 * Prefers `shipping_subtotal` (matches Medusa Admin's "Shipping subtotal"
 * label) and falls back to `shipping_total` when only the post-tax field
 * is populated.
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

export function getOrderGrandTotal(
  order: OrderLike | null | undefined,
): number {
  return num(order?.total);
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
 * displays a misleading "0.00" beneath a real line total.
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
