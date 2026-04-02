import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Button from "@/components/ui/Button";

export const revalidate = 3600; // ISR — ADR-017

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const canonical = `${baseUrl}/${locale}`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
    },
  };
}

/**
 * Phase 1 placeholder home — no product data.
 * Replaced by catalog experience in Phase 3+.
 */
export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-lg text-text-secondary">
          {t("subheadline")}
        </p>
        <Button type="button" variant="primary" size="lg" disabled>
          {t("ctaLabel")}
        </Button>
      </section>

      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-text-muted">
        {t("comingSoon")}
      </p>
    </div>
  );
}
