import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/seo";
import AddressForm from "@/components/checkout/AddressForm";

interface AddressPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AddressPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.address" });
  const tMeta = await getTranslations({
    locale,
    namespace: "meta.checkout.address",
  });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/checkout/address") },
    robots: { index: false, follow: false },
  };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { locale } = await params;
  return <AddressForm locale={locale} />;
}
