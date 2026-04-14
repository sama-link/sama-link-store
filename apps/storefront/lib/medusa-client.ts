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

export type ListProductsParams = NonNullable<
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

export async function listCollections() {
  return sdk.store.collection.list({} as ListCollectionsParams);
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

// ── Cart ──────────────────────────────────────────────────────────────────

const CART_FIELDS =
  "id,currency_code,items,items.id,items.variant_id,items.quantity,items.unit_price," +
  "items.title,items.thumbnail,items.variant.title," +
  "items.variant.product.handle,total,subtotal,item_total," +
  "shipping_address.first_name,shipping_address.last_name," +
  "shipping_address.address_1,shipping_address.address_2," +
  "shipping_address.city,shipping_address.country_code," +
  "shipping_address.province,shipping_address.postal_code,shipping_address.phone," +
  "shipping_methods.id,shipping_methods.name,shipping_methods.amount";

const cartSelect = { fields: CART_FIELDS };

export async function createCart() {
  return sdk.store.cart.create(
    regionId ? { region_id: regionId } : {},
    cartSelect,
  );
}

export async function retrieveCart(cartId: string) {
  return sdk.store.cart.retrieve(cartId, cartSelect);
}

export async function addCartLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
) {
  return sdk.store.cart.createLineItem(
    cartId,
    {
      variant_id: variantId,
      quantity,
    },
    cartSelect,
  );
}

export async function updateCartLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
) {
  return sdk.store.cart.updateLineItem(
    cartId,
    lineItemId,
    { quantity },
    cartSelect,
  );
}

export async function deleteCartLineItem(cartId: string, lineItemId: string) {
  const result = await sdk.store.cart.deleteLineItem(
    cartId,
    lineItemId,
    cartSelect,
  );
  if (result.parent) {
    return { cart: result.parent };
  }
  return retrieveCart(cartId);
}

export interface ShippingAddressPayload {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  province?: string;
  postal_code?: string;
  phone?: string;
}

export async function updateCartShippingAddress(
  cartId: string,
  address: ShippingAddressPayload,
) {
  return sdk.store.cart.update(
    cartId,
    { shipping_address: address },
    cartSelect,
  );
}

export async function listCartShippingOptions(cartId: string) {
  return sdk.store.fulfillment.listCartOptions({ cart_id: cartId });
}

export async function addShippingMethodToCart(
  cartId: string,
  optionId: string,
) {
  return sdk.store.cart.addShippingMethod(
    cartId,
    { option_id: optionId },
    cartSelect,
  );
}
