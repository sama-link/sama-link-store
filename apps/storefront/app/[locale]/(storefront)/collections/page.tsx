import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listCollections } from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

interface CollectionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CollectionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections.listing" });
  const canonical = buildCanonical(locale, "/collections");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: buildLanguageAlternates("/collections"),
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

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections.listing" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const { collections } = await listCollections();

  return (
    <Container>
      <div className="space-y-8 py-12">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: tb("collections") },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {t("title")}
        </h1>

        {collections.length === 0 ? (
          <p className="text-text-secondary">{t("empty")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection: any) => (
              <li key={collection.id}>
                <Link
                  href={`/${locale}/collections/${collection.handle}`}
                  className="group block h-full rounded-lg border border-border bg-surface p-6 shadow-sm transition-shadow duration-150 hover:shadow-md"
                >
                  <h2 className="text-lg font-semibold text-text-primary group-hover:underline">
                    {collection.title}
                  </h2>
                  {collection.handle ? (
                    <p className="mt-1 text-sm text-text-secondary">
                      {collection.handle}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
