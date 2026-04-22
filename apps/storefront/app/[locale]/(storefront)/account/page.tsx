import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentCustomerFromCookie } from "@/lib/customer-server";
import { logoutAction } from "./actions";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const customer = await getCurrentCustomerFromCookie();

  if (!customer) {
    redirect(`/${locale}/account/login`);
  }

  const customerName = customer.first_name || customer.email;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          {t("welcomeBack", { name: customerName })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("placeholderDashboard")}
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
