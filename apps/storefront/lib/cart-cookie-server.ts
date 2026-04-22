import "server-only";
import { cookies } from "next/headers";
import { CART_COOKIE_NAME } from "./cart-cookie";

export async function getCartIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE_NAME)?.value ?? null;
}

export async function clearCartIdCookie(): Promise<void> {
  const store = await cookies();
  // Attributes must mirror the client-side setCartId in ./cart-cookie.ts
  // (path=/, SameSite=Lax) so strict browsers consistently match-and-clear
  // the existing cookie instead of writing a sibling one.
  store.set(CART_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
}
