"use server";

import { cookies as nextCookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "../auth-cookie";
import { CART_COOKIE_NAME } from "../cart-cookie";

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const store = await nextCookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function getCartId(): Promise<string | null> {
  const store = await nextCookies();
  return store.get(CART_COOKIE_NAME)?.value ?? null;
}

export async function setCartId(id: string): Promise<void> {
  const store = await nextCookies();
  // Mirror lib/cart-cookie.ts client-side attributes (path=/, SameSite=Lax,
  // no httpOnly, no secure) so server-set cookies stay interoperable with
  // existing client reads in CartProvider until the full RESET-2 pass lands.
  store.set(CART_COOKIE_NAME, id, {
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

export async function removeCartId(): Promise<void> {
  const store = await nextCookies();
  store.set(CART_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
}
