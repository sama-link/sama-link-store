import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  listBrandProductIds,
  listBrands,
  listCollections,
  listProductCategories,
  listProducts,
  type ListProductsParams,
} from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import FilterSidebar, {
  type FilterBrandOption,
  type FilterCategoryOption,
  type FilterCollectionOption,
} from "@/components/products/FilterSidebar";
import CatalogToolbar from "@/components/products/CatalogToolbar";
import {
  parseCols,
  parseSort,
  parseView,
  parsePageSize,
  sortKeyToOrderParam,
} from "@/components/products/catalog-toolbar-utils";
import LoadMoreProducts from "@/components/products/LoadMoreProducts";
import MobileCatalogFab from "@/components/products/MobileCatalogFab";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

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
  return collections.map((c: any) => ({
    id: c.id,
    title: (c.title && c.title.trim() !== "" ? c.title : c.handle) ?? c.id,
  }));
}

/* Build a hierarchical category tree from the flat Medusa response. When the
   underlying client doesn't fetch `parent_category_id` (the current state on
   this branch), every row simply becomes a root and the sidebar renders flat —
   no behavior change vs. the previous flat mapping. When `parent_category_id`
   becomes available later, the tree fills in automatically. */
function mapCategoriesForFilters(
  categories: Awaited<
    ReturnType<typeof listProductCategories>
  >["product_categories"],
): FilterCategoryOption[] {
  const map = new Map<string, FilterCategoryOption>();
  const roots: FilterCategoryOption[] = [];

  for (const c of categories as any[]) {
    map.set(c.id, {
      id: c.id,
      title: (c.name && c.name.trim() !== "" ? c.name : c.handle) ?? c.id,
      children: [],
    });
  }

  for (const c of categories as any[]) {
    const node = map.get(c.id)!;
    if (c.parent_category_id && map.has(c.parent_category_id)) {
      map.get(c.parent_category_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    collection?: string;
    brand?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
    inStock?: string;
    rating?: string;
    sort?: string;
    cols?: string;
    view?: string;
    pageSize?: string;
  }>;
}

function parsePageParam(raw: string | undefined): number {
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
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
    brand,
    category,
    minPrice,
    maxPrice,
    q,
    inStock,
    rating,
    sort: sortRaw,
    cols: colsRaw,
    view: viewRaw,
    pageSize: pageSizeRaw,
    page: pageRaw,
  } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products.listing" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const activeSort = parseSort(sortRaw);
  const activeCols = parseCols(colsRaw);
  const activeView = parseView(viewRaw);
  const activePageSize = parsePageSize(pageSizeRaw);
  const currentPage = parsePageParam(pageRaw);
  const offset = (currentPage - 1) * activePageSize;

  const filterParams: ListProductsParams = {};
  if (collection) filterParams.collection_id = [collection];
  if (category) filterParams.category_id = [category];
  if (q && q.trim().length > 0) filterParams.q = q.trim();
  const order = sortKeyToOrderParam(activeSort);
  if (order) (filterParams as Record<string, unknown>).order = order;
  // TODO CAT-6: wire price + in-stock + rating filters to Medusa when params confirmed

  // Brand filter — Medusa's /store/products doesn't accept a metadata.brand_id
  // filter, so resolve the brand's product IDs server-side first and pass them
  // through the native `id` filter. Empty brand → short-circuit to no results
  // instead of dispatching listProducts with an empty id constraint.
  const [brandIdsResult, collectionsResult, categoriesResult, brandsResult] =
    await Promise.all([
      brand ? listBrandProductIds(brand) : Promise.resolve(null),
      listCollections(),
      listProductCategories(),
      listBrands(),
    ]);
  const brandIds = brandIdsResult?.ids ?? null;
  const brandActive = Boolean(brand);
  const brandHasZeroMatches = brandActive && brandIds !== null && brandIds.length === 0;
  if (brandIds && brandIds.length > 0) {
    (filterParams as Record<string, unknown>).id = brandIds;
  }

  type Product = CatalogProduct;
  const listResult: { products: Product[]; count?: number | null } =
    brandHasZeroMatches
      ? { products: [], count: 0 }
      : await listProducts({
          limit: activePageSize,
          offset,
          ...filterParams,
        });

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
  const filterBrands: FilterBrandOption[] = (brandsResult.brands || []).map(
    (b) => ({ id: b.id, title: b.name || b.handle }),
  );

  return (
    <Container>
      <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-start">
        {/* Desktop filter sidebar — mobile opens the same filters via MobileCatalogFab */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <FilterSidebar
            collections={filterCollections}
            brands={filterBrands}
            categories={filterCategories}
            activeCollection={collection ?? null}
            activeBrand={brand ?? null}
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
            activeSort={activeSort}
            activeCols={activeCols}
            activeView={activeView}
            activePageSize={activePageSize}
          />

          <LoadMoreProducts
            initialProducts={products}
            totalCount={count}
            pageSize={activePageSize}
            cols={activeCols}
            sort={activeSort}
            view={activeView}
            currentPage={currentPage}
          />
        </div>
      </div>

      {/* Mobile-only floating Filter/View controls */}
      <MobileCatalogFab
        collections={filterCollections}
        brands={filterBrands}
        categories={filterCategories}
        activeCollection={collection ?? null}
        activeBrand={brand ?? null}
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
