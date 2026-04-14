import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations({ locale, namespace: "checkout.address" });

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {t("title")}
      </h2>
      <p className="text-sm text-text-secondary">{t("placeholder")}</p>
    </div>
  );
}
