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
  item_total?: number | null;
  items?: CartLine[] | null;
};

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function lineSubtotal(line: CartLine): number {
  return (
    positiveNumber(line.item_subtotal) ??
    positiveNumber(line.subtotal) ??
    positiveNumber(line.item_total) ??
    positiveNumber(line.total) ??
    (line.unit_price ?? 0) * (line.quantity ?? 1)
  );
}

export function getCartItemsSubtotal(cart: CartLike | null | undefined): number {
  if (!cart) return 0;

  const aggregate = positiveNumber(cart.item_subtotal) ?? positiveNumber(cart.item_total);
  if (aggregate != null) return aggregate;

  return (cart.items ?? []).reduce((sum, item) => sum + lineSubtotal(item), 0);
}
