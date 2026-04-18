"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  AuthProviderUnavailableError,
  createCustomer,
  emailpassLogin,
  emailpassRegister,
  logoutSession,
  refreshAuthToken,
} from "@/lib/medusa-client";
import { clearAuthCookie, getAuthToken, setAuthCookie } from "@/lib/auth-cookie";

type ActionState = { error?: string };

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
  redirect(`/${locale}`);
}
