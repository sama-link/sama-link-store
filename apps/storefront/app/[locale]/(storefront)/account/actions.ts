"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AuthProviderUnavailableError,
  createCustomer,
  emailpassLogin,
  emailpassRegister,
  logoutSession,
  refreshAuthToken,
  transferCartToCustomer,
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
