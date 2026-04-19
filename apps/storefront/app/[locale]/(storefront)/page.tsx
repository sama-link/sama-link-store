import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HeroSection from "@/components/home/HeroSection";
import CategoryTiles, {
  type CategoryTile,
} from "@/components/home/CategoryTiles";
import BannersStrip from "@/components/home/BannersStrip";
import ProductShowcase from "@/components/home/ProductShowcase";
import WhyUsStrip from "@/components/home/WhyUsStrip";
import NewsletterSection from "@/components/home/NewsletterSection";
import Reveal from "@/components/ui/Reveal";
import { listCollections, listProducts } from "@/lib/medusa-client";
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
 * Home — ADR-045 flat refresh rebuild.
 * Sections: Hero → Category Tiles → Featured → Banners → Trending → Why Us → Newsletter
 * Data: Medusa Store API (listCollections + listProducts). Graceful-empty on backend absence.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tSections = await getTranslations({ locale, namespace: "home.sections" });

  type Product = Awaited<ReturnType<typeof listProducts>>["products"][number];
  let products: Product[] = [];
  type Collection = Awaited<ReturnType<typeof listCollections>>["collections"][number];
  let collections: Collection[] = [];

  try {
    const [prodResult, colResult] = await Promise.all([
      listProducts({ limit: 12 }),
      listCollections(),
    ]);
    products = prodResult.products;
    collections = colResult.collections;
  } catch {
    /* Backend unavailable or publishable key missing — render empty-safe sections. */
  }

  const tiles: CategoryTile[] = collections
    .filter((c) => typeof c.handle === "string" && c.handle.length > 0)
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      title: c.title ?? c.handle ?? c.id,
      handle: c.handle ?? null,
      href: `/${locale}/collections/${encodeURIComponent(c.handle as string)}`,
    }));

  const featured = products.slice(0, 8);
  /* Trending = the 4 products *after* the featured slot, falling back to the first 4 if we
     don't have enough to split. Guarantees the section renders whenever featured renders. */
  const trending =
    products.length >= 12 ? products.slice(8, 12) : products.slice(0, 4);

  const productsHref = `/${locale}/products`;

  return (
    <>
      {/* Hero is above-the-fold — disable the observer so it paints immediately. */}
      <Reveal disabled>
        <HeroSection />
      </Reveal>
      {tiles.length > 0 ? (
        <Reveal>
          <CategoryTiles tiles={tiles} />
        </Reveal>
      ) : null}
      <Reveal>
        <ProductShowcase
          eyebrow={tSections("featured.eyebrow")}
          title={tSections("featured.title")}
          viewAllHref={productsHref}
          products={featured}
          cols={4}
        />
      </Reveal>
      <Reveal>
        <BannersStrip />
      </Reveal>
      <Reveal>
        <ProductShowcase
          eyebrow={tSections("trending.eyebrow")}
          title={tSections("trending.title")}
          viewAllHref={productsHref}
          products={trending}
          cols={4}
          tone="subtle"
        />
      </Reveal>
      <Reveal>
        <WhyUsStrip />
      </Reveal>
      <Reveal>
        <NewsletterSection />
      </Reveal>

      {products.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 pb-16 text-center text-sm text-text-secondary sm:px-6 lg:px-8">
          {t("noProductsFallback")}
        </div>
      ) : null}
    </>
  );
}
