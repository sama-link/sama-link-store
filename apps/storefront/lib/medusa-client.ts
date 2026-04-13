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

const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || undefined;

export const sdk = new Medusa({
  baseUrl,
  publishableKey,
});

type ListProductsParams = NonNullable<
  Parameters<(typeof sdk)["store"]["product"]["list"]>[0]
>;

export async function listProducts(params?: ListProductsParams) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        fields:
          "id,handle,title,description,thumbnail,variants.calculated_price.*",
      }
    : {};
  return sdk.store.product.list({ ...base, ...params });
}

export async function getProductByHandle(handle: string) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        fields:
          "id,handle,title,description,thumbnail,variants.*,variants.calculated_price.*",
      }
    : {};
  const { products } = await sdk.store.product.list({ ...base, handle });
  const first = products[0];
  return first ?? null;
}

type ListCollectionsParams = NonNullable<
  Parameters<(typeof sdk)["store"]["collection"]["list"]>[0]
>;

export async function getCollectionByHandle(handle: string) {
  const { collections } = await sdk.store.collection.list(
    { handle } as ListCollectionsParams,
  );
  return collections[0] ?? null;
}

export async function listProductsByCollection(
  collectionId: string,
  params?: Partial<ListProductsParams>,
) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        fields:
          "id,handle,title,description,thumbnail,variants.calculated_price.*",
      }
    : {};
  return sdk.store.product.list({
    ...base,
    collection_id: [collectionId],
    ...params,
  });
}
