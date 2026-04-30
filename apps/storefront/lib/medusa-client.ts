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
  auth: { type: "jwt" },
});

export class AuthProviderUnavailableError extends Error {
  constructor(message = "Customer email/password auth provider is unavailable.") {
    super(message);
    this.name = "AuthProviderUnavailableError";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  const response = record.response;
  if (response && typeof response === "object") {
    const responseRecord = response as Record<string, unknown>;
    if (typeof responseRecord.message === "string") return responseRecord.message;
    const data = responseRecord.data;
    if (data && typeof data === "object") {
      const dataRecord = data as Record<string, unknown>;
      if (typeof dataRecord.message === "string") return dataRecord.message;
    }
  }
  return "";
}

export function getErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  const status = record.status;
  if (typeof status === "number") return status;
  const statusCode = record.statusCode;
  if (typeof statusCode === "number") return statusCode;
  const response = record.response;
  if (response && typeof response === "object") {
    const responseRecord = response as Record<string, unknown>;
    if (typeof responseRecord.status === "number") return responseRecord.status;
    if (typeof responseRecord.statusCode === "number") {
      return responseRecord.statusCode;
    }
  }
  return null;
}

function isEmailpassProviderUnavailable(error: unknown): boolean {
  const status = getErrorStatusCode(error);
  const message = getErrorMessage(error).toLowerCase();
  const mentionsProvider =
    message.includes("emailpass") || message.includes("provider");
  return (
    mentionsProvider &&
    (status === null || status === 400 || status === 404 || status === 422)
  );
}

function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

type StoreCustomerResponse = Awaited<
  ReturnType<(typeof sdk.store.customer)["retrieve"]>
>;
export type StoreCustomer = StoreCustomerResponse extends {
  customer: infer Customer;
}
  ? Customer
  : never;

export type CreateCustomerPayload = Parameters<
  (typeof sdk.store.customer)["create"]
>[0];

export type UpdateCustomerPayload = Parameters<
  (typeof sdk.store.customer)["update"]
>[0];

type StoreCustomerAddressResponse = Awaited<
  ReturnType<(typeof sdk.store.customer)["retrieveAddress"]>
>;
export type StoreCustomerAddress = StoreCustomerAddressResponse extends {
  address: infer A;
}
  ? A
  : never;

export type ListCustomerAddressesParams = NonNullable<
  Parameters<(typeof sdk.store.customer)["listAddress"]>[0]
>;

export type ListCustomerAddressesResult = Awaited<
  ReturnType<(typeof sdk.store.customer)["listAddress"]>
>;

export type CreateCustomerAddressPayload = Parameters<
  (typeof sdk.store.customer)["createAddress"]
>[0];

export type UpdateCustomerAddressPayload = Parameters<
  (typeof sdk.store.customer)["updateAddress"]
>[1];

export type ListCustomerOrdersParams = NonNullable<
  Parameters<(typeof sdk.store.order)["list"]>[0]
>;

export type ListCustomerOrdersResult = Awaited<
  ReturnType<(typeof sdk.store.order)["list"]>
>;

export type GetCustomerOrderParams = NonNullable<
  Parameters<(typeof sdk.store.order)["retrieve"]>[1]
>;

type StoreOrderRetrieveResponse = Awaited<
  ReturnType<(typeof sdk.store.order)["retrieve"]>
>;
export type StoreOrder = StoreOrderRetrieveResponse extends { order: infer O }
  ? O
  : never;

function pickNewlyCreatedAddress(customer: StoreCustomer): StoreCustomerAddress | null {
  const list = customer.addresses;
  if (!list?.length) return null;
  const sorted = [...list].sort((a, b) => {
    const ta = Date.parse(String((a as { created_at?: string }).created_at ?? ""));
    const tb = Date.parse(String((b as { created_at?: string }).created_at ?? ""));
    if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
    return (b.id ?? "").localeCompare(a.id ?? "");
  });
  return sorted[0] ?? null;
}

function addressFromCustomerOrThrow(
  customer: StoreCustomer,
  addressId: string,
): StoreCustomerAddress {
  const found = customer.addresses?.find((a) => a.id === addressId);
  if (!found) {
    throw new Error("Expected address on customer response.");
  }
  return found;
}

export async function emailpassLogin(email: string, password: string) {
  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });
    if (typeof token !== "string" || token.length === 0) {
      throw new Error("Medusa login did not return a JWT token.");
    }
    return { token };
  } catch (error) {
    if (isEmailpassProviderUnavailable(error)) {
      throw new AuthProviderUnavailableError();
    }
    throw error;
  }
}

export async function emailpassRegister(email: string, password: string) {
  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email,
      password,
    });
    if (typeof token !== "string" || token.length === 0) {
      throw new Error("Medusa register did not return a JWT token.");
    }
    return { token };
  } catch (error) {
    if (isEmailpassProviderUnavailable(error)) {
      throw new AuthProviderUnavailableError();
    }
    throw error;
  }
}

export async function refreshAuthToken(token: string): Promise<string> {
  const response = await fetch(`${baseUrl}/auth/token/refresh`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to refresh customer session token (HTTP ${response.status})`,
    );
  }
  const data = (await response.json()) as { token?: unknown };
  if (typeof data.token !== "string" || data.token.length === 0) {
    throw new Error("Refresh response did not contain a token.");
  }
  return data.token;
}

export async function createCustomer(
  payload: CreateCustomerPayload,
  token: string,
): Promise<StoreCustomer> {
  const response = await sdk.store.customer.create(payload, {}, authHeader(token));
  return response.customer;
}

export async function getCurrentCustomer(
  token: string,
): Promise<StoreCustomer | null> {
  const response = await sdk.store.customer.retrieve({}, authHeader(token));
  return response.customer ?? null;
}

export async function updateCustomer(
  payload: UpdateCustomerPayload,
  token: string,
): Promise<StoreCustomer> {
  const response = await sdk.store.customer.update(
    payload,
    {},
    authHeader(token),
  );
  return response.customer;
}

export async function listCustomerAddresses(
  token: string,
  queryParams?: ListCustomerAddressesParams,
): Promise<ListCustomerAddressesResult> {
  return sdk.store.customer.listAddress(
    queryParams ?? {},
    authHeader(token),
  );
}

/** Unwraps `{ customer }` from the SDK and returns the created address entity. */
export async function createCustomerAddress(
  payload: CreateCustomerAddressPayload,
  token: string,
): Promise<StoreCustomerAddress> {
  const response = await sdk.store.customer.createAddress(
    payload,
    {},
    authHeader(token),
  );
  const picked = pickNewlyCreatedAddress(response.customer);
  if (!picked) {
    throw new Error("Create address response did not include an address.");
  }
  return picked;
}

/** Unwraps `{ customer }` and returns the updated row for `addressId`. */
export async function updateCustomerAddress(
  addressId: string,
  payload: UpdateCustomerAddressPayload,
  token: string,
): Promise<StoreCustomerAddress> {
  const response = await sdk.store.customer.updateAddress(
    addressId,
    payload,
    {},
    authHeader(token),
  );
  return addressFromCustomerOrThrow(response.customer, addressId);
}

export async function deleteCustomerAddress(
  addressId: string,
  token: string,
): Promise<void> {
  await sdk.store.customer.deleteAddress(addressId, authHeader(token));
}

export async function listCustomerOrders(
  token: string,
  queryParams?: ListCustomerOrdersParams,
): Promise<ListCustomerOrdersResult> {
  return sdk.store.order.list(queryParams ?? {}, authHeader(token));
}

export async function getCustomerOrder(
  orderId: string,
  token: string,
  queryParams?: GetCustomerOrderParams,
): Promise<StoreOrder> {
  const response = await sdk.store.order.retrieve(
    orderId,
    queryParams ?? {},
    authHeader(token),
  );
  return response.order;
}

export async function logoutSession(token: string): Promise<void> {
  const auth = sdk.auth as typeof sdk.auth & {
    logout?: () => Promise<unknown>;
  };
  if (typeof auth.logout === "function") {
    await auth.logout();
    return;
  }

  const attemptDelete = await fetch(`${baseUrl}/auth/session`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (attemptDelete.ok) return;
  if (attemptDelete.status !== 404 && attemptDelete.status !== 405) {
    throw new Error("Failed to close customer auth session.");
  }

  const attemptPost = await fetch(`${baseUrl}/auth/session`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!attemptPost.ok && attemptPost.status !== 404 && attemptPost.status !== 405) {
    throw new Error("Failed to close customer auth session.");
  }
}

export type ListProductsParams = NonNullable<
  Parameters<(typeof sdk)["store"]["product"]["list"]>[0]
>;

export async function listProducts(params?: ListProductsParams) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        /* `metadata` carries the ADR-047 product translation overlay
         * (`metadata.translations.ar.{title,subtitle,description}`) which
         * `lib/product-i18n.ts` applies when locale === "ar". */
        fields:
          "id,handle,title,subtitle,description,thumbnail,metadata,variants.calculated_price.*",
      }
    : {};
  return sdk.store.product.list({ ...base, ...params });
}

export async function getProductByHandle(handle: string) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        /* `metadata` carries the ADR-047 product translation overlay. */
        fields:
          "id,handle,title,subtitle,description,thumbnail,metadata," +
          "material,weight,length,width,height,origin_country,hs_code,mid_code," +
          "images.id,images.url,images.rank," +
          "collection.id,collection.title,collection.handle," +
          "categories.id,categories.name,categories.handle," +
          "tags.id,tags.value," +
          "type.id,type.value," +
          "options.id,options.title,options.values.value," +
          "variants.*,variants.calculated_price.*," +
          "variants.options.value,variants.options.option_id",
      }
    : {};
  const { products } = await sdk.store.product.list({ ...base, handle });
  const first = products[0];
  return first ?? null;
}

/**
 * Related products carousel source.
 * Strategy: pull up to `limit` products from the same collection;
 * if collection yields fewer, top up with newest products globally.
 * The two recommendation sections were collapsed into one (see PDP redesign notes).
 */
export async function listRelatedProducts(
  collectionId: string | null,
  excludeProductId: string,
  limit = 20,
) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        fields:
          "id,handle,title,subtitle,description,thumbnail,metadata,variants.calculated_price.*",
      }
    : {};

  const collected: Array<
    Awaited<ReturnType<typeof sdk.store.product.list>>["products"][number]
  > = [];
  const seenIds = new Set<string>([excludeProductId]);

  // 1) Same-collection pool
  if (collectionId) {
    const { products } = await sdk.store.product.list({
      ...base,
      collection_id: [collectionId],
      limit: limit + 1,
    });
    for (const p of products) {
      if (seenIds.has(p.id)) continue;
      collected.push(p);
      seenIds.add(p.id);
      if (collected.length >= limit) break;
    }
  }

  // 2) Top up with newest if needed
  if (collected.length < limit) {
    const { products } = await sdk.store.product.list({
      ...base,
      limit: limit + collected.length + 1,
      order: "-created_at",
    });
    for (const p of products) {
      if (seenIds.has(p.id)) continue;
      collected.push(p);
      seenIds.add(p.id);
      if (collected.length >= limit) break;
    }
  }

  return collected;
}

type ListCollectionsParams = NonNullable<
  Parameters<(typeof sdk)["store"]["collection"]["list"]>[0]
>;

type ListProductCategoriesParams = NonNullable<
  Parameters<(typeof sdk)["store"]["category"]["list"]>[0]
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

export async function listProductCategories() {
  return sdk.store.category.list({
    fields: "id,name,handle",
    limit: 100,
  } as ListProductCategoriesParams);
}

export async function listProductsByCollection(
  collectionId: string,
  params?: Partial<ListProductsParams>,
) {
  const base: ListProductsParams = regionId
    ? {
        region_id: regionId,
        fields:
          "id,handle,title,subtitle,description,thumbnail,metadata,variants.calculated_price.*",
      }
    : {};
  return sdk.store.product.list({
    ...base,
    collection_id: [collectionId],
    ...params,
  });
}

export interface CmsPage {
  handle: string;
  title: string;
  body: string | null;
}

export async function getCmsPageByHandle(
  handle: string,
): Promise<CmsPage | null> {
  // GAP: Medusa CMS page API not available in sdk.store — document in task report.txt
  void handle;
  return null;
}

export async function listCmsPages(): Promise<CmsPage[]> {
  // GAP: Medusa CMS page API not available in sdk.store — document in task report.txt
  return [];
}

// ── Cart ──────────────────────────────────────────────────────────────────

export const CART_FIELDS =
  "id,currency_code,items,items.id,items.variant_id,items.quantity,items.unit_price," +
  "items.title,items.thumbnail,items.variant.title," +
  "items.variant.product.handle,total,subtotal,item_total," +
  "shipping_address.first_name,shipping_address.last_name," +
  "shipping_address.address_1,shipping_address.address_2," +
  "shipping_address.city,shipping_address.country_code," +
  "shipping_address.province,shipping_address.postal_code,shipping_address.phone," +
  "shipping_methods.id,shipping_methods.name,shipping_methods.amount," +
  "payment_collection.id";

export const cartSelect = { fields: CART_FIELDS };

export const cartRegionId = regionId;

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

export async function completeCart(cartId: string) {
  return sdk.store.cart.complete(cartId);
}

export async function transferCartToCustomer(
  cartId: string,
  token: string,
): Promise<void> {
  await sdk.store.cart.transferCart(cartId, {}, authHeader(token));
}

/**
 * Initiate a payment session for the cart's payment collection (SDK creates collection if needed).
 * Must be called before `completeCart` when the backend requires an active payment session.
 */
export async function initiatePaymentSession(
  cartId: string,
  providerId: string,
) {
  const { cart } = await retrieveCart(cartId);
  return sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: providerId,
  });
}

export async function listPaymentProviders(regionId: string) {
  return sdk.store.payment.listPaymentProviders({ region_id: regionId });
}
