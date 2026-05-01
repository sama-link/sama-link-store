"use client";

import {
  createContext,
  createElement,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  addCartLineItem,
  updateCartLineItem,
  deleteCartLineItem,
  retrieveCart,
} from "@/lib/medusa-client";
import { getOrSetCart, type StoreCart } from "@/lib/data/cart";
import { clampLineItemQty } from "@/lib/line-item-quantity";

// CHECKOUT-RESET-1: cart bootstrap (create/retrieve) is now a server action
// (`getOrSetCart`) that passes auth headers per-request. Line-item operations
// remain on the existing browser-SDK path; migrating them is RESET-2-adjacent.
type Cart = StoreCart;

export interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
}

export type StoreCartLineItem = NonNullable<
  NonNullable<CartContextValue["cart"]>["items"]
>[number];

/** Narrow line fields used for optimistic merchandise math. */
type LineQtyFields = StoreCartLineItem & {
  unit_price?: number | null;
  item_subtotal?: number | null;
  subtotal?: number | null;
  quantity?: number | null;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Optimistic line qty + merchandise subtotal so drawer totals track immediately. */
function applyOptimisticLineQuantity(
  cart: Cart,
  lineItemId: string,
  quantity: number,
): Cart {
  const q = clampLineItemQty(quantity);
  const items = (cart.items ?? []).map((it) => {
    const line = it as LineQtyFields;
    if (line.id !== lineItemId) return it;
    const unit = typeof line.unit_price === "number" ? line.unit_price : 0;
    const lineSub = unit * q;
    return {
      ...line,
      quantity: q,
      item_subtotal: lineSub,
      subtotal: lineSub,
    } as StoreCartLineItem;
  });
  const itemSubtotalSum = items.reduce((sum: number, it) => {
    const line = it as LineQtyFields;
    const u = typeof line.unit_price === "number" ? line.unit_price : 0;
    const qt = line.quantity ?? 0;
    return sum + u * qt;
  }, 0);
  return { ...cart, items, item_subtotal: itemSubtotalSum } as Cart;
}

function applyOptimisticRemoveLine(cart: Cart, lineItemId: string): Cart {
  const items = (cart.items ?? []).filter((it) => it.id !== lineItemId);
  const itemSubtotalSum = items.reduce((sum: number, it) => {
    const line = it as LineQtyFields;
    const u = typeof line.unit_price === "number" ? line.unit_price : 0;
    const qt = line.quantity ?? 0;
    return sum + u * qt;
  }, 0);
  return { ...cart, items, item_subtotal: itemSubtotalSum } as Cart;
}

function extractCartFromSdkResult(result: unknown): Cart | null {
  if (result && typeof result === "object" && "cart" in result) {
    const c = (result as { cart: Cart | null }).cart;
    return c ?? null;
  }
  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        const { cart: ready } = await getOrSetCart();
        if (!cancelled) setCart(ready);
      } catch (err) {
        console.error("[useCart] getOrSetCart failed during bootstrap", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      if (!cart) return;
      const { cart: updated } = await addCartLineItem(
        cart.id,
        variantId,
        quantity,
      );
      setCart(updated);
    },
    [cart],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      if (!cart) return;
      const targetQty = clampLineItemQty(quantity);
      const line = (cart.items ?? []).find(
        (it: { id?: string; quantity?: number | null }) => it.id === lineItemId,
      );
      const currentQty = clampLineItemQty(line?.quantity ?? 1);
      if (targetQty === currentQty) return;

      const prevCart = cart;
      setCart((c) =>
        c ? applyOptimisticLineQuantity(c, lineItemId, targetQty) : c,
      );
      try {
        const result = await updateCartLineItem(
          cart.id,
          lineItemId,
          targetQty,
        );
        const updated = extractCartFromSdkResult(result);
        if (updated) setCart(updated);
      } catch (err) {
        console.error("[useCart] updateLineItem failed", err);
        setCart(prevCart);
      }
    },
    [cart],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (!cart) return;
      const prevCart = cart;
      setCart((c) => (c ? applyOptimisticRemoveLine(c, lineItemId) : c));
      try {
        const result = await deleteCartLineItem(cart.id, lineItemId);
        const updated = extractCartFromSdkResult(result);
        if (updated) {
          setCart(updated);
        } else {
          const retrieved = await retrieveCart(cart.id);
          const recovered = extractCartFromSdkResult(retrieved);
          if (recovered) setCart(recovered);
        }
      } catch (err) {
        console.error("[useCart] deleteLineItem failed", err);
        setCart(prevCart);
      }
    },
    [cart],
  );

  const itemCount =
    cart?.items?.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0) ?? 0;

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount,
      loading,
      isCartOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
    }),
    [
      cart,
      itemCount,
      loading,
      isCartOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
    ],
  );

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
