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
  createCart,
  retrieveCart,
  addCartLineItem,
  updateCartLineItem,
  deleteCartLineItem,
} from "@/lib/medusa-client";
import { getCartId, setCartId } from "@/lib/cart-cookie";

type Cart = NonNullable<
  Awaited<ReturnType<typeof retrieveCart>>["cart"]
>;

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

const CartContext = createContext<CartContextValue | null>(null);

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
        const cartId = getCartId();
        if (cartId) {
          try {
            const { cart: existing } = await retrieveCart(cartId);
            if (!cancelled) setCart(existing);
          } catch {
            try {
              const { cart: fresh } = await createCart();
              if (!cancelled) {
                setCartId(fresh.id);
                setCart(fresh);
              }
            } catch (err) {
              console.error("[useCart] createCart failed during bootstrap", err);
            }
          }
        } else {
          try {
            const { cart: fresh } = await createCart();
            if (!cancelled) {
              setCartId(fresh.id);
              setCart(fresh);
            }
          } catch (err) {
            console.error("[useCart] createCart failed during bootstrap", err);
          }
        }
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
      const { cart: updated } = await updateCartLineItem(
        cart.id,
        lineItemId,
        quantity,
      );
      setCart(updated);
    },
    [cart],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (!cart) return;
      const { cart: updated } = await deleteCartLineItem(cart.id, lineItemId);
      setCart(updated);
    },
    [cart],
  );

  const itemCount =
    cart?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;

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
