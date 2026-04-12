/**
 * Singleton Medusa Store API client for the storefront.
 *
 * All Store API access must go through this module (see architecture boundaries).
 * Call sites use named helpers and/or the shared `sdk` instance — never instantiate
 * ad-hoc clients from components, pages, or hooks.
 */

import Medusa from "@medusajs/js-sdk";

const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_MEDUSA_BACKEND_URL is not set");
}

const publishableKey =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || undefined;

export const sdk = new Medusa({
  baseUrl,
  publishableKey,
});

type ListProductsParams = NonNullable<
  Parameters<(typeof sdk)["store"]["product"]["list"]>[0]
>;

export async function listProducts(params?: ListProductsParams) {
  return sdk.store.product.list(params ?? {});
}

export async function getProductByHandle(handle: string) {
  const { products } = await sdk.store.product.list({ handle });
  const first = products[0];
  return first ?? null;
}
