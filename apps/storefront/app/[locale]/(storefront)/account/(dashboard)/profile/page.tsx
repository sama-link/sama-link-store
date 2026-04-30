import { getTranslations } from "next-intl/server";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import ProfileForm from "./ProfileForm";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const customer = await getCurrentCustomerFromCookie();

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h1 className="text-2xl font-semibold text-text-primary">{t("profile.heading")}</h1>
      <p className="mt-2 text-sm text-text-secondary">
        {t("profile.emailLabel")}: {customer?.email || "—"}
      </p>
      <p className="text-xs text-text-muted">{t("profile.emailHelp")}</p>

      <div className="mt-5">
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
  );
}
