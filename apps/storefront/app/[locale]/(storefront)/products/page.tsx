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
import CatalogLayout from "@/components/products/CatalogLayout";
import BrandFilterBar from "@/components/products/BrandFilterBar";
import { parseMultiStringParam } from "@/lib/catalog-search-params";

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
    // Use handle for URL if available, fallback to id
    const identifier = c.handle && c.handle.trim() !== "" ? c.handle : c.id;
    map.set(c.id, {
      id: identifier,
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
    collection?: string | string[];
    brand?: string | string[];
    brands?: string | string[];
    category?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    q?: string;
    inStock?: string;
    rating?: string | string[];
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
    brands: brandsRaw,
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

  const collectionList = parseMultiStringParam(collection);
  /* Two independent brand facets:
     - `brand`  : single quick-pick from the top BrandFilterBar (instant)
     - `brands` : multi-select from the sidebar (staged, applied via Apply) */
  const barBrandList = parseMultiStringParam(brand).slice(0, 1);
  const sidebarBrandList = parseMultiStringParam(brandsRaw);
  const categoryRawList = parseMultiStringParam(category);
  const ratingList = parseMultiStringParam(rating);

  const filterParams: ListProductsParams = {};
  if (collectionList.length > 0) filterParams.collection_id = collectionList;
  if (q && q.trim().length > 0) filterParams.q = q.trim();
  const order = sortKeyToOrderParam(activeSort);
  if (order) (filterParams as Record<string, unknown>).order = order;
  // TODO CAT-6: wire price + in-stock + rating filters to Medusa when params confirmed

  const [collectionsResult, categoriesResult, brandsResult] = await Promise.all([
    listCollections(),
    listProductCategories(),
    listBrands(),
  ]);

  // Resolve each category handle or ID to Medusa category_id (OR within facet).
  let resolvedCategoryIds: string[] = [];
  if (categoryRawList.length > 0) {
    resolvedCategoryIds = [
      ...new Set(
        categoryRawList.map((raw) => {
          const matchedCat = categoriesResult.product_categories.find(
            (c: any) => c.handle === raw || c.id === raw,
          );
          return (matchedCat?.id ?? raw) as string;
        }),
      ),
    ];
    filterParams.category_id = resolvedCategoryIds;
  }

  // Brands that have products in any of the selected categories (union).
  let validBrandIds: Set<string> | null = null;
  if (resolvedCategoryIds.length > 0) {
    validBrandIds = new Set();
    const perCategory = await Promise.all(
      resolvedCategoryIds.map((cid) =>
        listProducts({
          category_id: [cid],
          limit: 200,
        }),
      ),
    );
    for (const catProductsRes of perCategory) {
      catProductsRes.products.forEach((p) => {
        if (p.metadata?.brand_id) {
          validBrandIds!.add(p.metadata.brand_id as string);
        }
      });
    }
  }

  /* Brand product-ID resolution — both facets resolve independently, then
     combine with set intersection: a product passes only if it matches the
     active brand from the top bar AND any of the sidebar brand checkboxes. */
  const allBrandFacetIds = [...new Set([...barBrandList, ...sidebarBrandList])];
  const perBrandIdLists =
    allBrandFacetIds.length > 0
      ? await Promise.all(
          allBrandFacetIds.map(async (bid) => ({
            bid,
            ids: (await listBrandProductIds(bid)).ids,
          })),
        )
      : [];
  const idsByBrand = new Map(perBrandIdLists.map((x) => [x.bid, x.ids]));

  const unionForFacet = (facet: string[]): string[] | null => {
    if (facet.length === 0) return null;
    return [...new Set(facet.flatMap((bid) => idsByBrand.get(bid) ?? []))];
  };
  const barUnion = unionForFacet(barBrandList);
  const sidebarUnion = unionForFacet(sidebarBrandList);

  let combinedBrandIds: string[] | null = null;
  if (barUnion && sidebarUnion) {
    const sidebarSet = new Set(sidebarUnion);
    combinedBrandIds = barUnion.filter((id) => sidebarSet.has(id));
  } else if (barUnion) {
    combinedBrandIds = barUnion;
  } else if (sidebarUnion) {
    combinedBrandIds = sidebarUnion;
  }

  const brandActive = combinedBrandIds !== null;
  const brandHasZeroMatches = brandActive && combinedBrandIds!.length === 0;
  if (combinedBrandIds && combinedBrandIds.length > 0) {
    (filterParams as Record<string, unknown>).id = combinedBrandIds;
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
  let filterBrands: FilterBrandOption[] = (brandsResult.brands || []).map(
    (b) => ({
      id: b.id,
      title: b.name || b.handle,
      handle: b.handle,
      logoUrl: b.image_url ?? null,
    }),
  );

  // If we have calculated valid brands for the category, filter the array
  if (validBrandIds !== null) {
    filterBrands = filterBrands.filter(b => validBrandIds!.has(b.id));
  }

  return (
    <Container>
      <CatalogLayout
        categoryActive={categoryRawList.length > 0}
        sidebar={
          <FilterSidebar
            collections={filterCollections}
            brands={filterBrands}
            categories={filterCategories}
            activeCollections={collectionList}
            activeBrands={sidebarBrandList}
            activeCategories={categoryRawList}
            activeMinPrice={minPrice ?? null}
            activeMaxPrice={maxPrice ?? null}
            activeQuery={q && q.trim().length > 0 ? q.trim() : null}
            activeInStock={inStock === "1"}
            activeRatings={ratingList}
            locale={locale}
          />
        }
      >
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
          categoryActive={categoryRawList.length > 0}
        />

        <BrandFilterBar
          brands={filterBrands}
          activeBrands={barBrandList}
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
      </CatalogLayout>

      {/* Mobile-only floating Filter/View controls */}
      <MobileCatalogFab
        collections={filterCollections}
        brands={filterBrands}
        categories={filterCategories}
        activeCollections={collectionList}
        activeBrands={sidebarBrandList}
        activeCategories={categoryRawList}
        activeMinPrice={minPrice ?? null}
        activeMaxPrice={maxPrice ?? null}
        activeQuery={q && q.trim().length > 0 ? q.trim() : null}
        activeInStock={inStock === "1"}
        activeRatings={ratingList}
        activeSort={activeSort}
        activeCols={activeCols}
        activeView={activeView}
        locale={locale}
      />
    </Container>
  );
}
