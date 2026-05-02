import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listSpecialOfferProducts } from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import { cn } from "@/lib/cn";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "products.specialOffers",
  });
  const path = "/products/special-offers";
  const canonical = buildCanonical(locale, path);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      type: "website",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function SpecialOffersPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.specialOffers" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });
  const { products } = await listSpecialOfferProducts();

  return (
    <Container>
      <div className="flex flex-col gap-8 py-10">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: tb("products"), href: `/${locale}/products` },
            { label: tb("specialOffers") },
          ]}
        />

        <section
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border",
            "bg-gradient-to-br from-[#1a0f08] via-[#2d1810] to-brand",
            "px-6 py-10 sm:px-10 sm:py-12 text-white shadow-lg",
          )}
        >
          <div
            className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full bg-error/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -start-10 size-72 rounded-full bg-amber-400/15 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
              {t("bannerEyebrow")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("bannerTitle")}
            </h1>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              {t("bannerBody")}
            </p>
          </div>
        </section>

        <div>
          <h2 className="sr-only">{t("listHeading")}</h2>
          {products.length === 0 ? (
            <p className="text-text-secondary">{t("empty")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 24) * 40}ms` }}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
