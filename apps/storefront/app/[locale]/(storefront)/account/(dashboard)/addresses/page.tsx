import { getTranslations } from "next-intl/server";
import { getAuthToken } from "@/lib/auth-cookie";
import { listCustomerAddresses } from "@/lib/medusa-client";
import AddressBook from "./AddressBook";
import { MapPin } from "lucide-react";

interface AddressesStubPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AddressesStubPage({ params }: AddressesStubPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();
  const result = token ? await listCustomerAddresses(token) : null;
  const addresses = result?.addresses ?? [];

  const isArabic = locale === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
            <MapPin className="h-5 w-5" />
          </div>
          {t("addresses.heading")}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {t("addresses.subheading")}
        </p>
      </div>

      <div className="sm:rounded-2xl sm:border border-border bg-surface py-4 sm:p-6 sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
        <AddressBook addresses={addresses} locale={locale} />
      </div>
    </div>
  );
}
