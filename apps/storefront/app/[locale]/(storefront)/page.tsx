import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProductCard from "@/components/products/ProductCard";
import { listProducts } from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";

export const revalidate = 3600; // ISR — ADR-017

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const canonical = buildCanonical(locale, "/");

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: buildLanguageAlternates("/"),
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
 * Home — hero plus featured products loaded from the Medusa Store API (BACK-5).
 */
export default async function HomePage() {
  const t = await getTranslations("home");
  const tp = await getTranslations("products");

  let products: Awaited<ReturnType<typeof listProducts>>["products"] = [];
  try {
    const result = await listProducts({ limit: 6 });
    products = result.products;
  } catch {
    /* Backend unavailable or publishable key missing — show empty state */
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-lg text-text-secondary">
          {t("subheadline")}
        </p>
        <a
          href="#featured"
          className="inline-flex h-12 items-center justify-center rounded-md bg-brand px-6 text-base font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {t("ctaLabel")}
        </a>
      </section>

      <section id="featured" aria-label={tp("featuredTitle")} className="space-y-6">
        <h2 className="text-start text-2xl font-bold tracking-tight text-text-primary">
          {tp("featuredTitle")}
        </h2>
        {products.length === 0 ? (
          <p className="text-start text-sm leading-relaxed text-text-secondary">
            {tp("noProducts")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
