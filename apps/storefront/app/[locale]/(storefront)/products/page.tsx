import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  listCollections,
  listProductCategories,
  listProducts,
  type ListProductsParams,
} from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import FilterSidebar, {
  type FilterCategoryOption,
  type FilterCollectionOption,
} from "@/components/products/FilterSidebar";
import CatalogToolbar from "@/components/products/CatalogToolbar";
import {
  parseCols,
  parseSort,
  parseView,
  sortKeyToOrderParam,
} from "@/components/products/catalog-toolbar-utils";
import LoadMoreProducts from "@/components/products/LoadMoreProducts";
import MobileCatalogFab from "@/components/products/MobileCatalogFab";
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
    q?: string;
    inStock?: string;
    rating?: string;
    sort?: string;
    cols?: string;
    view?: string;
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
  const {
    collection,
    category,
    minPrice,
    maxPrice,
    q,
    inStock,
    rating,
    sort: sortRaw,
    cols: colsRaw,
    view: viewRaw,
  } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products.listing" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const activeSort = parseSort(sortRaw);
  const activeCols = parseCols(colsRaw);
  const activeView = parseView(viewRaw);

  const filterParams: ListProductsParams = {};
  if (collection) filterParams.collection_id = [collection];
  if (category) filterParams.category_id = [category];
  if (q && q.trim().length > 0) filterParams.q = q.trim();
  const order = sortKeyToOrderParam(activeSort);
  if (order) (filterParams as Record<string, unknown>).order = order;
  // TODO CAT-6: wire price + in-stock + rating filters to Medusa when params confirmed

  const [listResult, collectionsResult, categoriesResult] = await Promise.all([
    listProducts({
      limit: PRODUCTS_PER_PAGE,
      offset: 0,
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
      : null;

  const filterCollections = mapCollectionsForFilters(
    collectionsResult.collections,
  );
  const filterCategories = mapCategoriesForFilters(
    categoriesResult.product_categories,
  );

  const filtersForClient = {
    collection,
    category,
    q: q && q.trim().length > 0 ? q.trim() : undefined,
    minPrice,
    maxPrice,
    rating,
    inStock,
  };

  return (
    <Container>
      <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-start">
        {/* Desktop filter sidebar — mobile opens the same filters via MobileCatalogFab */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <FilterSidebar
            collections={filterCollections}
            categories={filterCategories}
            activeCollection={collection ?? null}
            activeCategory={category ?? null}
            activeMinPrice={minPrice ?? null}
            activeMaxPrice={maxPrice ?? null}
            activeQuery={q && q.trim().length > 0 ? q.trim() : null}
            activeInStock={inStock === "1"}
            activeRating={rating ?? null}
            locale={locale}
          />
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
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

          <CatalogToolbar
            totalCount={count}
            shownCount={products.length}
            activeSort={activeSort}
            activeCols={activeCols}
            activeView={activeView}
          />

          <LoadMoreProducts
            initialProducts={products}
            totalCount={count}
            pageSize={PRODUCTS_PER_PAGE}
            cols={activeCols}
            sort={activeSort}
            view={activeView}
            filters={filtersForClient}
          />
        </div>
      </div>

      {/* Mobile-only floating Filter/View controls */}
      <MobileCatalogFab
        collections={filterCollections}
        categories={filterCategories}
        activeCollection={collection ?? null}
        activeCategory={category ?? null}
        activeMinPrice={minPrice ?? null}
        activeMaxPrice={maxPrice ?? null}
        activeQuery={q && q.trim().length > 0 ? q.trim() : null}
        activeInStock={inStock === "1"}
        activeRating={rating ?? null}
        activeSort={activeSort}
        activeCols={activeCols}
        activeView={activeView}
        locale={locale}
      />
    </Container>
  );
}
