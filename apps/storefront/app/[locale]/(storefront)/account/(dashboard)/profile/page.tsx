import { getTranslations } from "next-intl/server";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import ProfileForm from "./ProfileForm";
import { UserCircle } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const customer = await getCurrentCustomerFromCookie();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {t("profile.heading")}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {locale === "ar" 
            ? "قم بتحديث بياناتك الشخصية وطرق التواصل الخاصة بك" 
            : "Update your personal information and contact details"}
        </p>
      </div>

      <div className="overflow-hidden sm:rounded-2xl sm:border border-border bg-surface sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
        <div className="border-b border-border sm:bg-surface-subtle pb-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
              <UserCircle className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                {t("profile.emailLabel")}
              </p>
              <p className="text-sm text-text-secondary">{customer?.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="py-6 sm:p-8">
          <ProfileForm
            firstName={customer?.first_name || ""}
            lastName={customer?.last_name || ""}
            phone={customer?.phone || ""}
            firstNameLabel={t("profile.firstNameLabel")}
            lastNameLabel={t("profile.lastNameLabel")}
            phoneLabel={t("profile.phoneLabel")}
            phoneOptionalLabel={t("profile.phoneOptional")}
            saveLabel={t("profile.saveCta")}
            cancelLabel={t("profile.cancelCta")}
            successLabel={t("profile.updateSuccess")}
          />
        </div>
      </div>
    </div>
  );
}
