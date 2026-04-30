"use server";

import { updateTag } from "next/cache";
import { cartRegionId, cartSelect, sdk } from "../medusa-client";
import { getAuthHeaders, getCartId, setCartId } from "./cookies";

type StoreCartResponse = Awaited<ReturnType<typeof sdk.store.cart.retrieve>>;
export type StoreCart = NonNullable<StoreCartResponse["cart"]>;

// CART-PERSIST-1A: customer-active-cart adoption uses a single string key on
// `customer.metadata`. The Medusa v2 store SDK exposes no
// `list customer carts` primitive and the customer module has no `carts`
// reverse relation, so we keep the lookup index on the customer object
// itself. The key is intentionally namespaced to avoid colliding with any
// future operator metadata.
const LAST_CART_METADATA_KEY = "last_cart_id";
const CUSTOMER_METADATA_FIELDS = "id,metadata";

function isAuthed(headers: Record<string, string>): boolean {
  return Boolean(headers.Authorization);
}

function isCartUsable(
  cart: StoreCart,
  expectedRegionId: string | undefined,
): boolean {
  // Completed carts have become orders; never adopt them.
  const completedAt = (cart as { completed_at?: string | null }).completed_at;
  if (completedAt) return false;
  // If a region is pinned at storefront boot, only adopt same-region carts.
  // Cross-region adoption would change pricing semantics — out of scope for
  // CART-PERSIST-1A; falls through to a fresh cart instead.
  if (expectedRegionId) {
    const cartRegion = (cart as { region_id?: string | null }).region_id;
    if (cartRegion && cartRegion !== expectedRegionId) return false;
  }
  return true;
}

async function readCustomerMetadata(
  headers: Record<string, string>,
): Promise<{ lastCartId: string | null; metadata: Record<string, unknown> } | null> {
  try {
    const { customer } = await sdk.store.customer.retrieve(
      { fields: CUSTOMER_METADATA_FIELDS },
      headers,
    );
    if (!customer) return null;
    const metadata = ((customer as { metadata?: unknown }).metadata ?? {}) as Record<
      string,
      unknown
    >;
    const raw = metadata[LAST_CART_METADATA_KEY];
    const lastCartId = typeof raw === "string" && raw.length > 0 ? raw : null;
    return { lastCartId, metadata };
  } catch {
    return null;
  }
}

async function persistLastCartId(
  cartId: string,
  existingMetadata: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<void> {
  try {
    await sdk.store.customer.update(
      {
        metadata: {
          ...existingMetadata,
          [LAST_CART_METADATA_KEY]: cartId,
        },
      },
      {},
      headers,
    );
  } catch {
    // Best-effort. The cart still works for this session; only the
    // next-session adoption lookup is at risk if this write fails.
  }
}

// CHECKOUT-RESET-1: server-side, auth-aware cart bootstrap.
// CART-PERSIST-1A: extends the resolution order so a logged-in customer's
// existing active cart is adopted on a fresh browser/cookie state.
//
// Resolution order:
//   1. Cookie cart exists and is usable → return it.
//   2. Logged in AND customer has a `last_cart_id` on their metadata → try
//      to retrieve that cart; if usable, adopt it (overwrite cookie).
//   3. Otherwise create a fresh cart. If logged in, persist the new cart's
//      id on `customer.metadata.last_cart_id` so a future fresh-browser
//      session can adopt it.
//
// Guest-only behavior is preserved exactly: no auth header → step 2 is
// skipped, step 4 does not write metadata, and the path is byte-identical
// to RESET-1's.
//
// Guest → customer cart MERGE is intentionally NOT implemented here.
// That is CART-PERSIST-1B's scope. If the cookie cart is a guest cart and
// the customer is logged in but has a non-cookie last cart of their own,
// step 1 still wins (cookie cart is reachable with auth headers, so we
// keep using the cart that already has line items the user just added).
// 1B will revisit this at the auth boundary.
export async function getOrSetCart(): Promise<{ cart: StoreCart }> {
  const headers = await getAuthHeaders();
  const cookieCartId = await getCartId();

  // Step 1: cookie cart.
  if (cookieCartId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(
        cookieCartId,
        cartSelect,
        headers,
      );
      if (cart && isCartUsable(cart as StoreCart, cartRegionId)) {
        return { cart: cart as StoreCart };
      }
    } catch {
      // Cookie cart points to an unreachable cart (deleted, expired,
      // wrong env). Fall through.
    }
  }

  // Step 2: customer-active-cart adoption (CART-PERSIST-1A).
  let customerMetadata: Record<string, unknown> | null = null;
  if (isAuthed(headers)) {
    const lookup = await readCustomerMetadata(headers);
    if (lookup) {
      customerMetadata = lookup.metadata;
      const { lastCartId } = lookup;
      if (lastCartId && lastCartId !== cookieCartId) {
        try {
          const { cart } = await sdk.store.cart.retrieve(
            lastCartId,
            cartSelect,
            headers,
          );
          if (cart && isCartUsable(cart as StoreCart, cartRegionId)) {
            await setCartId(cart.id);
            updateTag("cart");
            return { cart: cart as StoreCart };
          }
        } catch {
          // Last-known cart unreachable; fall through to create fresh.
        }
      }
    }
  }

  // Step 3: create a fresh cart.
  const { cart } = await sdk.store.cart.create(
    cartRegionId ? { region_id: cartRegionId } : {},
    cartSelect,
    headers,
  );
  await setCartId(cart.id);
  // Anticipates CHECKOUT-RESET-2 (full cache-tag invalidation).
  updateTag("cart");

  // Step 4: persist last_cart_id on the customer for future-session adoption.
  if (isAuthed(headers)) {
    const meta =
      customerMetadata ?? (await readCustomerMetadata(headers))?.metadata ?? {};
    await persistLastCartId(cart.id, meta, headers);
  }

  return { cart: cart as StoreCart };
}

// CART-PERSIST-1A: called from `loginAction` / `registerAction` after the
// auth + transferCart sequence. When a guest cart was just promoted to a
// customer cart by `transferCartToCustomer`, the cookie cart id is now the
// customer's active cart but `customer.metadata.last_cart_id` does not yet
// know about it — `getOrSetCart` Step 1 short-circuits before the metadata
// write would fire, so a future fresh-browser login would not adopt this
// cart. This action closes that gap by syncing metadata at the auth
// boundary. No-op when the user is unauthed or no cart cookie is set, and
// a no-op when metadata is already correct (idempotent).
export async function rememberCustomerCartIdAfterAuth(): Promise<void> {
  const headers = await getAuthHeaders();
  if (!isAuthed(headers)) return;
  const cartId = await getCartId();
  if (!cartId) return;
  const lookup = await readCustomerMetadata(headers);
  if (!lookup) return;
  if (lookup.metadata[LAST_CART_METADATA_KEY] === cartId) return;
  await persistLastCartId(cartId, lookup.metadata, headers);
}

type IncomingLineItem = {
  variant_id?: string | null;
  quantity?: number | null;
};

type ExistingLineItem = IncomingLineItem & { id: string };

// CART-PERSIST-1B: called from `loginAction` / `registerAction` after the
// auth + transferCart sequence and before `rememberCustomerCartIdAfterAuth`.
//
// When a customer with a previously-active cart logs in on a new device or
// browser where they had built a guest cart, both carts now belong to the
// customer (`transferCartToCustomer` promoted the cookie one). This action
// merges the just-promoted cart's items into the customer's previously-
// active cart and switches the cookie to the previously-active cart so
// subsequent requests operate on the merged result. The orphaned guest
// cart row is left in the DB; cleanup is an operations concern.
//
// Merge rules (this PR):
//   - Same `variant_id` in both carts → sum quantities.
//   - Different variants → append.
//
// Out of scope (not in this PR): stock caps, region/currency reconciliation,
// promotion re-validation, in-progress checkout preservation. The function
// is a no-op when there is nothing to merge (no cookie cart, no
// previously-active cart, or both ids are the same), keeping the
// pre-1B behavior byte-identical for those paths.
export async function mergeGuestCartIntoCustomerCart(): Promise<void> {
  const headers = await getAuthHeaders();
  if (!isAuthed(headers)) return;
  const cookieCartId = await getCartId();
  if (!cookieCartId) return;
  const lookup = await readCustomerMetadata(headers);
  if (!lookup) return;
  const previousCartId = lookup.lastCartId;
  if (!previousCartId || previousCartId === cookieCartId) return;

  let previousCart: StoreCart;
  let incomingCart: StoreCart;
  try {
    const [previous, incoming] = await Promise.all([
      sdk.store.cart.retrieve(previousCartId, cartSelect, headers),
      sdk.store.cart.retrieve(cookieCartId, cartSelect, headers),
    ]);
    if (!previous.cart || !incoming.cart) return;
    if (!isCartUsable(previous.cart as StoreCart, cartRegionId)) return;
    previousCart = previous.cart as StoreCart;
    incomingCart = incoming.cart as StoreCart;
  } catch {
    // Either cart unreachable; skip merge — 1A's metadata sync still keeps
    // the existing cookie cart attached to the customer.
    return;
  }

  const existingItems = (previousCart.items ?? []) as ExistingLineItem[];
  const incomingItems = (incomingCart.items ?? []) as IncomingLineItem[];

  for (const item of incomingItems) {
    const variantId = item.variant_id;
    const qty = item.quantity ?? 0;
    if (!variantId || qty <= 0) continue;
    const match = existingItems.find((it) => it.variant_id === variantId);
    try {
      if (match) {
        const summed = (match.quantity ?? 0) + qty;
        await sdk.store.cart.updateLineItem(
          previousCart.id,
          match.id,
          { quantity: summed },
          cartSelect,
        );
      } else {
        await sdk.store.cart.createLineItem(
          previousCart.id,
          { variant_id: variantId, quantity: qty },
          cartSelect,
        );
      }
    } catch {
      // Per-line best-effort: out-of-stock, deleted variant, region
      // pricing gap. Skip silently and continue with the remaining items.
    }
  }

  await setCartId(previousCart.id);
  updateTag("cart");
}
