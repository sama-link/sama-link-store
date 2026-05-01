type CartLine = {
  unit_price?: number | null;
  quantity?: number | null;
  item_subtotal?: number | null;
  subtotal?: number | null;
  item_total?: number | null;
  total?: number | null;
};

type CartLike = {
  /** Sum of line item subtotals (excludes shipping subtotal). */
  item_subtotal?: number | null;
  items?: CartLine[] | null;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function lineItemsSubtotal(line: CartLine): number {
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

/** Merchandise subtotal for cart UI — excludes shipping (unlike `cart.subtotal` in Medusa). */
export function getCartItemsSubtotal(cart: CartLike | null | undefined): number {
  if (!cart) return 0;

  const aggregate = finiteNumber(cart.item_subtotal);
  if (aggregate != null) return aggregate;

  return (cart.items ?? []).reduce<number>(
    (sum, item) => sum + lineItemsSubtotal(item),
    0,
  );
}
