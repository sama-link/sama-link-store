/** Max units per cart / PDP line item (store policy + UI cap). */
export const MAX_LINE_ITEM_QTY = 99;

export function clampLineItemQty(n: number): number {
  return Math.min(
    MAX_LINE_ITEM_QTY,
    Math.max(1, Math.round(Number.isFinite(n) ? n : 1)),
  );
}
