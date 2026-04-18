import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LoginForm from "./LoginForm";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <div className="space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          {t("loginHeading")}
        </h1>
        <LoginForm
          emailLabel={t("emailLabel")}
          passwordLabel={t("passwordLabel")}
          submitLabel={t("loginCta")}
        />
        <p className="text-sm text-text-secondary">
          {t("noAccountPrompt")}{" "}
          <Link
            href={`/${locale}/account/register`}
            className="font-medium text-brand hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
