import { getTranslations } from "next-intl/server";
import { getAuthToken } from "@/lib/auth-cookie";
import { listCustomerAddresses } from "@/lib/medusa-client";
import AddressBook from "./AddressBook";

interface AddressesStubPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AddressesStubPage({ params }: AddressesStubPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();
  const result = token ? await listCustomerAddresses(token) : null;
  const addresses = result?.addresses ?? [];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <h1 className="text-2xl font-semibold text-text-primary">{t("addresses.heading")}</h1>
      <p className="text-sm text-text-secondary">{t("addresses.subheading")}</p>
      <AddressBook addresses={addresses} />
    </div>
  );
}
