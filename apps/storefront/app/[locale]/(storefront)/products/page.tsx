import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  listCollections,
  listProductCategories,
  listProducts,
  type ListProductsParams,
} from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import ProductGrid from "@/components/products/ProductGrid";
import FilterSidebar, {
  type FilterCategoryOption,
  type FilterCollectionOption,
} from "@/components/products/FilterSidebar";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

const PRODUCTS_PER_PAGE = 12;

type CatalogProduct = Awaited<ReturnType<typeof listProducts>>["products"][number];

function getCalculatedPriceAmount(product: CatalogProduct): number | null {
  const firstVariant = product.variants?.[0];
  const calcPrice = firstVariant?.calculated_price;
  const rawAmount = calcPrice?.calculated_amount;
  if (rawAmount == null) return null;
  const n = Number(rawAmount);
  return Number.isFinite(n) ? n : null;
}

/** Client-side trim of the current page when Medusa store product list has no confirmed price filter param. */
function filterProductsByPriceSearchParams(
  products: CatalogProduct[],
  minPriceStr?: string,
  maxPriceStr?: string,
): CatalogProduct[] {
  const hasMin = minPriceStr != null && minPriceStr !== "";
  const hasMax = maxPriceStr != null && maxPriceStr !== "";
  if (!hasMin && !hasMax) return products;

  // TODO CAT-6: wire price filter to Medusa when param confirmed
  const min = hasMin ? Number(minPriceStr) : null;
  const max = hasMax ? Number(maxPriceStr) : null;
  if (hasMin && (min == null || Number.isNaN(min))) return products;
  if (hasMax && (max == null || Number.isNaN(max))) return products;

  return products.filter((product) => {
    const amount = getCalculatedPriceAmount(product);
    if (amount == null) return false;
    if (min != null && amount < min) return false;
    if (max != null && amount > max) return false;
    return true;
  });
}

function buildProductsListHref(
  locale: string,
  pageNum: number,
  opts: {
    collection?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
  },
): string {
  const params = new URLSearchParams();
  if (opts.collection) params.set("collection", opts.collection);
  if (opts.category) params.set("category", opts.category);
  if (opts.minPrice) params.set("minPrice", opts.minPrice);
  if (opts.maxPrice) params.set("maxPrice", opts.maxPrice);
  if (pageNum > 1) params.set("page", String(pageNum));
  const qs = params.toString();
  return qs ? `/${locale}/products?${qs}` : `/${locale}/products`;
}

function mapCollectionsForFilters(
  collections: Awaited<ReturnType<typeof listCollections>>["collections"],
): FilterCollectionOption[] {
  return collections.map((c) => ({
    id: c.id,
    title: (c.title && c.title.trim() !== "" ? c.title : c.handle) ?? c.id,
  }));
}

function mapCategoriesForFilters(
  categories: Awaited<
    ReturnType<typeof listProductCategories>
  >["product_categories"],
): FilterCategoryOption[] {
  return categories.map((c) => ({
    id: c.id,
    title: (c.name && c.name.trim() !== "" ? c.name : c.handle) ?? c.id,
  }));
}

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    collection?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.listing" });
  const canonical = buildCanonical(locale, "/products");
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: buildLanguageAlternates("/products"),
    },
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("description"),
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale } = await params;
  const { page, collection, category, minPrice, maxPrice } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products.listing" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const currentPage = Math.max(1, Number(page ?? 1));
  const offset = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const filterParams: ListProductsParams = {};
  if (collection) {
    filterParams.collection_id = [collection];
  }
  if (category) {
    filterParams.category_id = [category];
  }
  // TODO CAT-6: wire price filter to Medusa store product list (e.g. price_list) when param confirmed

  const [listResult, collectionsResult, categoriesResult] = await Promise.all([
    listProducts({
      limit: PRODUCTS_PER_PAGE,
      offset,
      ...filterParams,
    }),
    listCollections(),
    listProductCategories(),
  ]);

  let { products } = listResult;
  products = filterProductsByPriceSearchParams(products, minPrice, maxPrice);

  const count =
    "count" in listResult && typeof listResult.count === "number"
      ? listResult.count
      : undefined;

  const totalPages =
    count != null ? Math.ceil(count / PRODUCTS_PER_PAGE) : 1;
  const showPagination = count != null && totalPages > 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const paginationBase = {
    collection,
    category,
    minPrice,
    maxPrice,
  };

  const filterCollections = mapCollectionsForFilters(
    collectionsResult.collections,
  );
  const filterCategories = mapCategoriesForFilters(
    categoriesResult.product_categories,
  );

  return (
    <Container>
      <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-64">
          <FilterSidebar
            collections={filterCollections}
            categories={filterCategories}
            activeCollection={collection ?? null}
            activeCategory={category ?? null}
            activeMinPrice={minPrice ?? null}
            activeMaxPrice={maxPrice ?? null}
            locale={locale}
          />
        </aside>
        <div className="min-w-0 flex-1 space-y-8">
          <Breadcrumbs
            ariaLabel={tb("aria")}
            items={[
              { label: tb("home"), href: `/${locale}` },
              { label: tb("products") },
            ]}
          />
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            {t("title")}
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
                  href={buildProductsListHref(
                    locale,
                    currentPage - 1,
                    paginationBase,
                  )}
                  className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
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
                  href={buildProductsListHref(
                    locale,
                    currentPage + 1,
                    paginationBase,
                  )}
                  className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  {t("next")}
                </a>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
