"use server";

import { updateTag } from "next/cache";
import { cartRegionId, cartSelect, sdk } from "../medusa-client";
import { getAuthHeaders, getCartId, setCartId } from "./cookies";

type StoreCartResponse = Awaited<ReturnType<typeof sdk.store.cart.retrieve>>;
export type StoreCart = NonNullable<StoreCartResponse["cart"]>;

// CHECKOUT-RESET-1: server-side, auth-aware cart bootstrap.
// Mirrors the canonical Medusa v2 starter `getOrSetCart` pattern in
// `src/lib/data/cart.ts`. When a customer auth cookie is present, the cart
// is created with Authorization headers, so the resulting cart is born
// attached to the customer (`customer_id` set, `email` populated) — no
// retrofit transferCart call is needed in the typical sign-in-first flow.
// Guest path is preserved: no auth header → anonymous cart, exactly as before.
export async function getOrSetCart(): Promise<{ cart: StoreCart }> {
  const headers = await getAuthHeaders();
  const cartId = await getCartId();

  if (cartId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(cartId, cartSelect, headers);
      if (cart) {
        return { cart: cart as StoreCart };
      }
    } catch {
      // Existing cart cookie points to an unreachable cart (deleted, expired,
      // wrong env). Fall through and mint a new one.
    }
  }

  const { cart } = await sdk.store.cart.create(
    cartRegionId ? { region_id: cartRegionId } : {},
    cartSelect,
    headers,
  );
  await setCartId(cart.id);
  // Anticipates CHECKOUT-RESET-2 (full cache-tag invalidation). `updateTag`
  // is the Next 16 primitive for read-your-own-writes from a Server Action;
  // the call is a no-op until consumers attach `next: { tags: ["cart"] }`.
  updateTag("cart");
  return { cart: cart as StoreCart };
}
