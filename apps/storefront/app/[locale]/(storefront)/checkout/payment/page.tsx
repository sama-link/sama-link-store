import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listPaymentProviders } from "@/lib/medusa-client";
import { buildCanonical } from "@/lib/seo";
import PaymentMethodSelector, {
  type PaymentProvider,
} from "@/components/checkout/PaymentMethodSelector";

interface PaymentPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PaymentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.payment" });
  const tMeta = await getTranslations({
    locale,
    namespace: "meta.checkout.payment",
  });
  return {
    title: t("title"),
    description: tMeta("description"),
    alternates: { canonical: buildCanonical(locale, "/checkout/payment") },
    robots: { index: false, follow: false },
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { locale } = await params;
  const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? "";

  let providers: PaymentProvider[] = [];
  if (regionId) {
    try {
      const { payment_providers } = await listPaymentProviders(regionId);
      providers = payment_providers.map((p: unknown) => {
        const row = p as { id: string; is_enabled?: boolean };
        return {
          id: row.id,
          is_enabled: row.is_enabled ?? true,
        };
      });
    } catch {
      // Empty — PaymentMethodSelector handles no-options state
    }
  }

  return <PaymentMethodSelector locale={locale} providers={providers} />;
}
