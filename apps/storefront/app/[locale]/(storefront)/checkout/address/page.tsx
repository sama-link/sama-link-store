import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AddressForm from "@/components/checkout/AddressForm";

interface AddressPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AddressPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.address" });
  return { title: t("title") };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { locale } = await params;
  return <AddressForm locale={locale} />;
}
