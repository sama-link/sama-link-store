"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AuthProviderUnavailableError,
  createCustomerAddress,
  createCustomer,
  deleteCustomerAddress,
  emailpassLogin,
  emailpassRegister,
  logoutSession,
  refreshAuthToken,
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
  } catch (error) {
    if (error instanceof AuthProviderUnavailableError) throw error;
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
  } catch (error) {
    if (error instanceof AuthProviderUnavailableError) throw error;
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
