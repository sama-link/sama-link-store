"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AuthProviderUnavailableError,
  CUSTOMER_LIST_TYPES,
  CustomerListCapReachedError,
  CustomerListType,
  addItemToCustomerList,
  clearCustomerList,
  createCustomerAddress,
  createCustomer,
  deleteCustomerAddress,
  emailpassLogin,
  emailpassRegister,
  isEmailAlreadyRegistered,
  isInvalidCredentials,
  logoutSession,
  refreshAuthToken,
  removeItemFromCustomerList,
  transferCartToCustomer,
  updateCustomerAddress,
  updateCustomer,
  getErrorStatusCode,
} from "@/lib/medusa-client";
import { clearAuthCookie, getAuthToken, setAuthCookie } from "@/lib/auth-cookie";
import {
  clearCartIdCookie,
  getCartIdFromCookie,
} from "@/lib/cart-cookie-server";
import {
  mergeGuestCartIntoCustomerCart,
  rememberCustomerCartIdAfterAuth,
} from "@/lib/data/cart";

type ActionState = { error?: string; success?: boolean };

function getRequiredString(
  formData: FormData,
  key: string,
): { ok: true; value: string } | { ok: false } {
  const raw = formData.get(key);
  if (typeof raw !== "string") return { ok: false };
  const value = raw.trim();
  if (!value) return { ok: false };
  return { ok: true, value };
}

function getOptionalString(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });

  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");
  if (!email.ok || !password.ok) {
    return { error: t("genericError") };
  }

  try {
    const { token } = await emailpassLogin(email.value, password.value);
    await setAuthCookie(token);
    const guestCartId = await getCartIdFromCookie();
    if (guestCartId) {
      try {
        await transferCartToCustomer(guestCartId, token);
      } catch (transferError) {
        // TEMPORARY operational compromise — see brief § Operational
        // Note on Logging. No project logger utility exists yet and
        // .agents/00-core.mdc §2 forbids console output in committed
        // code. Revisit when LOG-* lands.
        void transferError;
      }
    }
    // CART-PERSIST-1B: if the customer also has a previously-active cart,
    // merge the just-promoted cart's items into it and switch the cookie.
    await mergeGuestCartIntoCustomerCart();
    // CART-PERSIST-1A: sync the customer's last_cart_id so a future
    // fresh-browser session can adopt the (possibly merged) cart.
    await rememberCustomerCartIdAfterAuth();
  } catch (error) {
    if (error instanceof AuthProviderUnavailableError) throw error;
    if (isInvalidCredentials(error)) {
      return { error: t("invalidCredentials") };
    }
    return { error: t("genericError") };
  }

  redirect(`/${locale}/account`);
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });

  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");
  const firstName = getRequiredString(formData, "first_name");
  const lastName = getRequiredString(formData, "last_name");
  if (!email.ok || !password.ok || !firstName.ok || !lastName.ok) {
    return { error: t("registerError") };
  }

  try {
    const { token: regToken } = await emailpassRegister(
      email.value,
      password.value,
    );
    await createCustomer(
      {
        email: email.value,
        first_name: firstName.value,
        last_name: lastName.value,
      },
      regToken,
    );
    const sessionToken = await refreshAuthToken(regToken);
    await setAuthCookie(sessionToken);
    const guestCartId = await getCartIdFromCookie();
    if (guestCartId) {
      try {
        await transferCartToCustomer(guestCartId, sessionToken);
      } catch (transferError) {
        // TEMPORARY operational compromise — see brief § Operational
        // Note on Logging.
        void transferError;
      }
    }
    // CART-PERSIST-1B: if the customer also has a previously-active cart,
    // merge the just-promoted cart's items into it and switch the cookie.
    await mergeGuestCartIntoCustomerCart();
    // CART-PERSIST-1A: sync the customer's last_cart_id so a future
    // fresh-browser session can adopt the (possibly merged) cart.
    await rememberCustomerCartIdAfterAuth();
  } catch (error) {
    if (error instanceof AuthProviderUnavailableError) throw error;
    if (isEmailAlreadyRegistered(error)) {
      return { error: t("emailAlreadyExists") };
    }
    return { error: t("registerError") };
  }

  redirect(`/${locale}/account`);
}

export async function logoutAction(): Promise<void> {
  const locale = await getLocale();
  const token = await getAuthToken();
  if (token) {
    try {
      await logoutSession(token);
    } catch {
      // Token cookie is still cleared locally below.
    }
  }
  await clearAuthCookie();
  await clearCartIdCookie();
  redirect(`/${locale}`);
}

export async function profileUpdateAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const firstName = getRequiredString(formData, "first_name");
  const lastName = getRequiredString(formData, "last_name");
  if (!firstName.ok || !lastName.ok) {
    return { error: t("profile.updateError") };
  }

  const phoneRaw = formData.get("phone");
  const phone =
    typeof phoneRaw === "string" && phoneRaw.trim().length > 0
      ? phoneRaw.trim()
      : undefined;

  try {
    await updateCustomer(
      {
        first_name: firstName.value,
        last_name: lastName.value,
        ...(phone ? { phone } : {}),
      },
      token,
    );
    revalidatePath(`/${locale}/account`);
    revalidatePath(`/${locale}/account/profile`);
    return { success: true };
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    return { error: t("profile.updateError") };
  }
}

type AddressPayload = {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  country_code: string;
  company?: string;
  address_2?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  is_default_shipping?: boolean;
};

function getAddressPayload(
  formData: FormData,
): { ok: true; payload: AddressPayload } | { ok: false } {
  const firstName = getRequiredString(formData, "first_name");
  const lastName = getRequiredString(formData, "last_name");
  const address1 = getRequiredString(formData, "address_1");
  const city = getRequiredString(formData, "city");
  const countryCode = getRequiredString(formData, "country_code");
  if (!firstName.ok || !lastName.ok || !address1.ok || !city.ok || !countryCode.ok) {
    return { ok: false };
  }

  const payload: AddressPayload = {
    first_name: firstName.value,
    last_name: lastName.value,
    address_1: address1.value,
    city: city.value,
    country_code: countryCode.value.toLowerCase(),
    company: getOptionalString(formData, "company"),
    address_2: getOptionalString(formData, "address_2"),
    province: getOptionalString(formData, "province"),
    postal_code: getOptionalString(formData, "postal_code"),
    phone: getOptionalString(formData, "phone"),
    is_default_shipping: formData.get("is_default_shipping") === "on",
  };

  return { ok: true, payload };
}

export async function createAddressAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const payload = getAddressPayload(formData);
  if (!payload.ok) {
    return { error: t("addresses.createError") };
  }

  try {
    await createCustomerAddress(payload.payload, token);
    revalidatePath(`/${locale}/account/addresses`);
    revalidatePath(`/${locale}/account`);
    return { success: true };
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    return { error: t("addresses.createError") };
  }
}

export async function updateAddressAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const addressId = getRequiredString(formData, "address_id");
  const payload = getAddressPayload(formData);
  if (!addressId.ok || !payload.ok) {
    return { error: t("addresses.updateError") };
  }

  try {
    await updateCustomerAddress(addressId.value, payload.payload, token);
    revalidatePath(`/${locale}/account/addresses`);
    revalidatePath(`/${locale}/account`);
    return { success: true };
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    return { error: t("addresses.updateError") };
  }
}

export async function deleteAddressAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const addressId = getRequiredString(formData, "address_id");
  if (!addressId.ok) {
    return { error: t("addresses.deleteError") };
  }

  try {
    await deleteCustomerAddress(addressId.value, token);
    revalidatePath(`/${locale}/account/addresses`);
    revalidatePath(`/${locale}/account`);
    return { success: true };
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    return { error: t("addresses.deleteError") };
  }
}

// ── Customer-list actions (wishlist + compare) — ACCT-6C ────────────────
//
// Six form-bound server actions for the ACCT-6D / ACCT-6E UIs:
//   addToWishlistAction        addToCompareAction
//   removeFromWishlistAction   removeFromCompareAction
//   clearWishlistAction        clearCompareAction
//
// All six delegate to three internal helpers that take the list_type
// explicitly. Each surface action passes the right list_type so call
// sites stay narrow and self-documenting.
//
// State shape extends the address-action shape with a `code` field so
// the UI can branch on cap-reached errors ("compare_full" / "wishlist_full")
// without parsing a localized message.

type ListActionState = {
  error?: string;
  code?: "compare_full" | "wishlist_full" | "auth" | "validation" | "unknown";
  success?: boolean;
};

function isCustomerListType(value: unknown): value is CustomerListType {
  return typeof value === "string" && (CUSTOMER_LIST_TYPES as readonly string[]).includes(value);
}

function readListType(formData: FormData): CustomerListType | null {
  const raw = formData.get("list_type");
  return isCustomerListType(raw) ? raw : null;
}

/**
 * Revalidates every cached path that renders the customer's list of
 * the given type. Both the public surface (`/wishlist`, `/compare`)
 * and the account surface (`/account/wishlist`, `/account/compare`)
 * server-fetch the same backend list when authed (see
 * `app/[locale]/(storefront)/{wishlist,compare}/page.tsx` and the
 * matching `(dashboard)` pages), so they must invalidate together.
 */
function revalidateListPaths(locale: string, list_type: CustomerListType): void {
  revalidatePath(`/${locale}/account/${list_type}`);
  revalidatePath(`/${locale}/${list_type}`);
}

async function addItemToList(
  list_type: CustomerListType,
  formData: FormData,
): Promise<ListActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const productId = getRequiredString(formData, "product_id");
  if (!productId.ok) {
    return { error: t("genericError"), code: "validation" };
  }

  const variantId = getOptionalString(formData, "variant_id") ?? null;
  const titleSnapshot = getOptionalString(formData, "title_snapshot") ?? null;
  const thumbnailSnapshot =
    getOptionalString(formData, "thumbnail_snapshot") ?? null;

  try {
    await addItemToCustomerList(token, list_type, {
      product_id: productId.value,
      variant_id: variantId,
      title_snapshot: titleSnapshot,
      thumbnail_snapshot: thumbnailSnapshot,
    });
    revalidateListPaths(locale, list_type);
    return { success: true };
  } catch (error) {
    if (error instanceof CustomerListCapReachedError) {
      return { error: error.message, code: error.code };
    }
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    return { error: t("genericError"), code: "unknown" };
  }
}

async function removeItemFromList(
  list_type: CustomerListType,
  formData: FormData,
): Promise<ListActionState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const itemId = getRequiredString(formData, "item_id");
  if (!itemId.ok) {
    return { error: t("genericError"), code: "validation" };
  }

  try {
    await removeItemFromCustomerList(token, list_type, itemId.value);
    revalidateListPaths(locale, list_type);
    return { success: true };
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    // 404 from the backend means the item is already gone (or never
    // belonged to this customer) — the desired UI state is the same as
    // success, so we don't surface an error toast.
    if (getErrorStatusCode(error) === 404) {
      revalidatePath(`/${locale}/account/${list_type}`);
      return { success: true };
    }
    return { error: t("genericError"), code: "unknown" };
  }
}

async function clearList(
  list_type: CustomerListType,
  _formData: FormData,
): Promise<ListActionState> {
  void _formData;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  try {
    await clearCustomerList(token, list_type);
    revalidateListPaths(locale, list_type);
    return { success: true };
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      redirect(`/${locale}/account/login`);
    }
    return { error: t("genericError"), code: "unknown" };
  }
}

export async function addToWishlistAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  return addItemToList("wishlist", formData);
}

export async function addToCompareAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  return addItemToList("compare", formData);
}

export async function removeFromWishlistAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  return removeItemFromList("wishlist", formData);
}

export async function removeFromCompareAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  return removeItemFromList("compare", formData);
}

export async function clearWishlistAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  return clearList("wishlist", formData);
}

export async function clearCompareAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  return clearList("compare", formData);
}

/**
 * Single-arg form-action wrappers for use with `<form action={...}>`
 * (which calls handlers with one FormData argument, not the
 * `(prev, formData)` shape useActionState consumes). These wrappers
 * delegate to the `*Action` functions above and discard their return
 * value — pages re-render via `revalidatePath` from the underlying
 * helper.
 */
export async function clearWishlistFormAction(formData: FormData): Promise<void> {
  await clearList("wishlist", formData);
}

export async function clearCompareFormAction(formData: FormData): Promise<void> {
  await clearList("compare", formData);
}

/**
 * Generic add action for callers that need to pick the list type
 * dynamically (for example a single "Save" button with a hidden
 * `list_type` field). Delegates to `addItemToList`.
 */
export async function addToCustomerListAction(
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  const listType = readListType(formData);
  if (!listType) {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "account" });
    return { error: t("genericError"), code: "validation" };
  }
  return addItemToList(listType, formData);
}
