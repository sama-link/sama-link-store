import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import {
  getCollectionByHandle,
  listProductsByCollection,
} from "@/lib/medusa-client";
import ProductGrid from "@/components/products/ProductGrid";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

const PRODUCTS_PER_PAGE = 12;

const getCachedCollection = cache(getCollectionByHandle);

interface CollectionPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const collection = await getCachedCollection(handle);
  if (!collection) notFound();

  const canonical = `/${locale}/collections/${handle}`;
  const description =
    "description" in collection && typeof collection.description === "string"
      ? collection.description
      : undefined;

  return {
    title: collection.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: collection.title ?? undefined,
      description,
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { locale, handle } = await params;
  const { page } = await searchParams;
  const t = await getTranslations({ locale, namespace: "collections" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const collection = await getCachedCollection(handle);
  if (!collection) notFound();

  const currentPage = Math.max(1, Number(page ?? 1));
  const offset = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const listResult = await listProductsByCollection(collection.id, {
    limit: PRODUCTS_PER_PAGE,
    offset,
  });

  const { products } = listResult;
  const count =
    "count" in listResult && typeof listResult.count === "number"
      ? listResult.count
      : undefined;

  const totalPages = count != null ? Math.ceil(count / PRODUCTS_PER_PAGE) : 1;
  const showPagination = count != null && totalPages > 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Container>
      <div className="space-y-8 py-12">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: tb("collections"), href: `/${locale}/collections` },
            { label: collection.title ?? handle },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {collection.title}
        </h1>

        {products.length === 0 ? (
          <p className="text-text-secondary">{t("empty")}</p>
        ) : (
          <ProductGrid products={products} />
        )}

        {showPagination ? (
          <nav
            aria-label={t("paginationLabel")}
            className="flex items-center justify-between pt-4"
          >
            {hasPrev ? (
              <a
                href={`/${locale}/collections/${handle}?page=${currentPage - 1}`}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("previous")}
              </a>
            ) : (
              <span />
            )}
            <span className="text-sm text-text-secondary">
              {t("pageOf", { current: currentPage, total: totalPages })}
            </span>
            {hasNext ? (
              <a
                href={`/${locale}/collections/${handle}?page=${currentPage + 1}`}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("next")}
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </Container>
  );
}
