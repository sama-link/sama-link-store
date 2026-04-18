export const CART_COOKIE_NAME = "medusa_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getCartId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CART_COOKIE_NAME}=`));
  return match ? (match.split("=")[1] ?? null) : null;
}

export function setCartId(id: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_COOKIE_NAME}=${id}; path=/; max-age=${CART_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearCartId(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
