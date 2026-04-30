import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface OrdersStubPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersStubPage({ params }: OrdersStubPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h1 className="text-2xl font-semibold text-text-primary">{t("ordersStub.heading")}</h1>
      <p className="mt-3 text-sm text-text-secondary">{t("ordersStub.body")}</p>
      <Link href={`/${locale}/account`} className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
        {t("ordersStub.backToAccount")}
      </Link>
    </div>
  );
}
