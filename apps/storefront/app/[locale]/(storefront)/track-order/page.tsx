import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

interface TrackOrderPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: TrackOrderPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trackOrder" });
  const canonical = `/${locale}/track-order`;
  return {
    title: t("title"),
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: t("title"),
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trackOrder" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  return (
    <Container>
      <div className="space-y-8 py-12">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: t("title") },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-text-secondary">{t("body")}</p>
      </div>
    </Container>
  );
}
