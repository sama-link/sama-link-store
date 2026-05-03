import Link from "next/link";
import { getTranslations } from "next-intl/server";
import RegisterForm from "./RegisterForm";
import { ArrowLeft } from "lucide-react";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });

  const isArabic = locale === "ar";
  const comingSoonText = isArabic ? "سيتوفر قريباً" : "Coming soon";
  const orContinueWith = isArabic ? "أو تواصل باستخدام" : "Or continue with";

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative w-full max-w-lg space-y-6">
        
        <div className="absolute -top-12 left-0">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            {isArabic ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <div className="px-6 pb-8 pt-10 sm:px-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
                {t("registerHeading")}
              </h1>
              <p className="text-sm text-text-secondary">
                {isArabic ? "أنشئ حسابك الجديد وانضم إلينا" : "Create an account to join us"}
              </p>
            </div>

            <RegisterForm
              emailLabel={t("emailLabel")}
              passwordLabel={t("passwordLabel")}
              firstNameLabel={t("firstNameLabel")}
              lastNameLabel={t("lastNameLabel")}
              submitLabel={t("registerCta")}
              comingSoonLabel={comingSoonText}
              orContinueWithLabel={orContinueWith}
            />

            <div className="mt-8 text-center text-sm text-text-secondary">
              {t("hasAccountPrompt")}{" "}
              <Link
                href={`/${locale}/account/login`}
                className="font-semibold text-brand transition-colors hover:text-brand-hover hover:underline"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
