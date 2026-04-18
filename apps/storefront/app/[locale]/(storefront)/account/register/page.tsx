import Link from "next/link";
import { getTranslations } from "next-intl/server";
import RegisterForm from "./RegisterForm";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <div className="space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          {t("registerHeading")}
        </h1>
        <RegisterForm
          emailLabel={t("emailLabel")}
          passwordLabel={t("passwordLabel")}
          firstNameLabel={t("firstNameLabel")}
          lastNameLabel={t("lastNameLabel")}
          submitLabel={t("registerCta")}
        />
        <p className="text-sm text-text-secondary">
          {t("hasAccountPrompt")}{" "}
          <Link
            href={`/${locale}/account/login`}
            className="font-medium text-brand hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
