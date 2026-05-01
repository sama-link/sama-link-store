import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import {
  getProductByHandle,
  listRelatedProducts,
  listBrands,
} from "@/lib/medusa-client";
import { localizeProduct } from "@/lib/product-i18n";
import {
  buildCanonical,
  buildLanguageAlternates,
  buildProductJsonLd,
} from "@/lib/seo";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import ProductGallery, {
  type ProductImage,
} from "@/components/products/ProductGallery";
import ProductDescription from "@/components/products/ProductDescription";
import ProductSpecsTable, {
  type SpecRow,
} from "@/components/products/ProductSpecsTable";
import ProductReviews from "@/components/products/ProductReviews";
import PurchasePanel, {
  type PanelProductOption,
  type PanelVariant,
} from "@/components/products/PurchasePanel";
import type { WishlistItem } from "@/hooks/useWishlist";
import PdpTabs from "@/components/products/PdpTabs";
import StickyPurchaseBar from "@/components/products/StickyPurchaseBar";
import RecommendationsCarousel from "@/components/products/RecommendationsCarousel";
import {
  pickCategoryBreadcrumbTrail,
  categoryLabel,
  type PdpCategoryCrumb,
} from "@/lib/pdp-category-trail";

export const revalidate = 3600; // ISR — ADR-017

const getCachedProductByHandle = cache(getProductByHandle);

interface ProductPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

const CTA_SENTINEL_ID = "pdp-primary-cta";


export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const rawProduct = await getCachedProductByHandle(handle);
  if (!rawProduct) {
    notFound();
  }
  // ADR-047 · Prefer `metadata.translations.ar` when locale === "ar".
  const product = localizeProduct(rawProduct, locale);

  const canonical = buildCanonical(locale, `/products/${handle}`);
  const description = product.description ?? undefined;

  return {
    title: product.title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(`/products/${handle}`),
    },
    openGraph: {
      type: "website",
      title: product.title ?? undefined,
      description,
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      ...(product.thumbnail
        ? { images: [{ url: product.thumbnail }] }
        : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { locale, handle } = await params;
  const [rawProduct, brandsResult] = await Promise.all([
    getCachedProductByHandle(handle),
    listBrands()
  ]);
  if (!rawProduct) {
    notFound();
  }
  // ADR-047 · The `product` object exposed to the rest of this page already
  // has `title` / `subtitle` / `description` resolved for the active locale.
  // Variants, prices, images, options, and tags are passed through as-is.
  const product = localizeProduct(rawProduct, locale);

  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });
  const t = await getTranslations({ locale, namespace: "products.detail" });

  const description = product.description?.trim() ?? null;
  const variants = product.variants ?? [];
  const productRecord = product as unknown as Record<string, unknown>;
  const subtitle = (productRecord.subtitle as string | null) ?? null;
  const material = (productRecord.material as string | null) ?? null;
  const weight = (productRecord.weight as number | null) ?? null;
  const length = (productRecord.length as number | null) ?? null;
  const width = (productRecord.width as number | null) ?? null;
  const height = (productRecord.height as number | null) ?? null;
  const originCountry =
    (productRecord.origin_country as string | null) ?? null;

  const collection = productRecord.collection as
    | { id: string; title: string | null; handle: string | null }
    | null
    | undefined;

  const categories =
    (productRecord.categories as Array<PdpCategoryCrumb> | null | undefined) ??
    [];

  const tags =
    (productRecord.tags as
      | Array<{ id: string; value: string | null }>
      | null
      | undefined) ?? [];

  const productType = productRecord.type as
    | { id: string; value: string | null }
    | null
    | undefined;

  const productOptions =
    (productRecord.options as
      | Array<{
          id: string;
          title: string | null;
          values: Array<{ value: string | null }> | null;
        }>
      | null
      | undefined) ?? [];

  const rawImages =
    (productRecord.images as
      | Array<{ id: string; url: string | null; rank?: number | null }>
      | null
      | undefined) ?? [];

  // Build gallery: thumbnail first, then product images sorted by rank
  const galleryImages: ProductImage[] = [];
  const seen = new Set<string>();
  if (product.thumbnail) {
    galleryImages.push({ id: "thumb", url: product.thumbnail });
    seen.add(product.thumbnail);
  }
  rawImages
    .filter((img) => img.url && !seen.has(img.url))
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .forEach((img) => {
      if (img.url) {
        galleryImages.push({ id: img.id, url: img.url });
        seen.add(img.url);
      }
    });

  // Build PurchasePanel inputs (variant-driven)
  const panelOptions: PanelProductOption[] = productOptions
    .filter((opt: any) => opt.title)
    .map((opt: any) => ({
      id: opt.id,
      title: opt.title ?? "",
      values: (opt.values ?? [])
        .filter((v: any) => v.value)
        .map((v: any) => ({ value: v.value ?? "" })),
    }));

  const panelVariants: PanelVariant[] = variants.map((v: any) => {
    const variantRecord = v as unknown as Record<string, unknown>;
    const variantOptions =
      (variantRecord.options as
        | Array<{ value: string | null; option_id: string | null }>
        | null
        | undefined) ?? [];

    // Build {optionTitle: value} map by linking variant.option_id → product.option
    const optionsMap: Record<string, string> = {};
    for (const vOpt of variantOptions) {
      const matching = productOptions.find((p) => p.id === vOpt.option_id);
      if (matching?.title && vOpt.value) {
        optionsMap[matching.title] = vOpt.value;
      }
    }

    return {
      id: v.id,
      title: v.title ?? null,
      sku: v.sku ?? null,
      options: optionsMap,
      amount:
        v.calculated_price?.calculated_amount != null
          ? Number(v.calculated_price.calculated_amount)
          : null,
      currencyCode: v.calculated_price?.currency_code ?? null,
    };
  });

  // First variant (server-side fallback for sticky bar initial render)
  const firstVariant = panelVariants[0] ?? null;

  const brandId = (productRecord.metadata as Record<string, unknown> | null)?.brand_id as string | undefined;
  const productBrand = brandId ? brandsResult.brands.find(b => b.id === brandId) : null;

  /* Brand eyebrow — product.type (manufacturer/brand) first, collection title fallback.
     No hardcoded placeholder; if both are absent the eyebrow simply won't render. */
  const brandEyebrow =
    productBrand?.name?.trim() ||
    productType?.value?.trim() ||
    collection?.title?.trim() ||
    null;

  /* Pull a plain-text summary from the product description. If it's rich-text with
     <ul><li> bullets, strip them out for the short description and surface them as
     separate highlight bullets below. */
  const extractSummaryAndHighlights = (
    raw: string | null,
  ): { purchasePlain: string | null; highlights: string[] } => {
    if (!raw) return { purchasePlain: null, highlights: [] };
    /* Quick bullet extraction — matches <li>...</li> first, then falls back to "- " line items. */
    const bullets: string[] = [];
    const liMatches = raw.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (liMatches) {
      for (const m of liMatches) {
        const txt = m.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (txt) bullets.push(txt);
      }
    }
    /* Full plain text for PurchasePanel (word limit + See more lives in the client component). */
    const plain = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return { purchasePlain: plain || null, highlights: bullets.slice(0, 5) };
  };
  const { purchasePlain, highlights: productHighlights } =
    extractSummaryAndHighlights(description);

  // Build specs rows
  const dimensionsLabel =
    length || width || height
      ? [length, width, height]
          .map((d) => (d != null ? `${d}` : "—"))
          .join(" × ") + " cm"
      : null;

  const specRows: SpecRow[] = [
    categories.length > 0
      ? {
          label: "category",
          pills: categories.map((c: any) => ({
            label: c.name ?? c.handle ?? "",
            href: c.handle ? `/${locale}/products?category=${c.id}` : undefined,
          })),
        }
      : { label: "category" },
    collection
      ? {
          label: "collection",
          pills: [
            {
              label: collection.title ?? collection.handle ?? "",
              href: collection.handle
                ? `/${locale}/collections/${collection.handle}`
                : undefined,
            },
          ],
        }
      : { label: "collection" },
    tags.length > 0
      ? {
          label: "tags",
          pills: tags.map((tg: any) => ({ label: tg.value ?? "" })),
        }
      : { label: "tags" },
    productType?.value
      ? { label: "type", value: productType.value }
      : { label: "type" },
    panelOptions.length > 0
      ? {
          label: "options",
          pills: panelOptions.flatMap((opt) =>
            opt.values.map((v) => ({ label: `${opt.title}: ${v.value}` })),
          ),
        }
      : { label: "options" },
    { label: "material", value: material },
    weight != null ? { label: "weight", value: `${weight}g` } : { label: "weight" },
    dimensionsLabel
      ? { label: "dimensions", value: dimensionsLabel }
      : { label: "dimensions" },
    { label: "origin", value: originCountry },
  ];

  // Recommendations — single merged carousel (collection-first, fall back to newest)
  const recommendations = await listRelatedProducts(
    collection?.id ?? null,
    product.id,
    20,
  );

  const galleryWishlistItem: WishlistItem | null =
    firstVariant?.id != null
      ? {
          id: product.id,
          handle: product.handle ?? null,
          title: product.title ?? null,
          thumbnail: product.thumbnail ?? null,
          subtitle,
          material,
          weight,
          originCountry,
          variantId: firstVariant.id,
          amount: firstVariant.amount,
          currencyCode: firstVariant.currencyCode,
        }
      : null;

  const productCanonical = buildCanonical(locale, `/products/${handle}`);

  const { primary: breadcrumbPrimary, sub: breadcrumbSub } =
    pickCategoryBreadcrumbTrail(categories);
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: tb("storeName"), href: `/${locale}` },
  ];
  if (breadcrumbPrimary) {
    breadcrumbItems.push({
      label: categoryLabel(breadcrumbPrimary),
      href: `/${locale}/products?category=${encodeURIComponent(breadcrumbPrimary.id)}`,
    });
  }
  if (breadcrumbSub) {
    breadcrumbItems.push({
      label: categoryLabel(breadcrumbSub),
      href: `/${locale}/products?category=${encodeURIComponent(breadcrumbSub.id)}`,
    });
  }
  breadcrumbItems.push({ label: product.title ?? handle });

  const productJsonLd = buildProductJsonLd(
    {
      title: product.title,
      description: product.description,
      thumbnail: product.thumbnail,
      images: rawImages,
      variants,
    },
    locale,
    productCanonical,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <StickyPurchaseBar
        observeId={CTA_SENTINEL_ID}
        productTitle={product.title ?? ""}
        thumbnail={product.thumbnail ?? null}
        variantId={firstVariant?.id ?? null}
        amount={firstVariant?.amount ?? null}
        currencyCode={firstVariant?.currencyCode ?? null}
      />

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs ariaLabel={tb("aria")} items={breadcrumbItems} />

        {/* ── Hero: gallery + sticky purchase column ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">

          {/* Gallery column */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={galleryImages}
              alt={product.title ?? ""}
              galleryWishlistItem={galleryWishlistItem}
            />
          </div>

          {/* Purchase column — sticky on desktop. */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <PurchasePanel
                productOptions={panelOptions}
                variants={panelVariants}
                ctaSentinelId={CTA_SENTINEL_ID}
                title={product.title ?? ""}
                brand={brandEyebrow}
                description={
                  purchasePlain?.trim()
                    ? purchasePlain
                    : subtitle?.trim()
                      ? subtitle
                      : null
                }
                highlights={productHighlights}
                wishlistItem={galleryWishlistItem}
                compareItem={galleryWishlistItem}
              />
            </div>
          </div>
        </div>

        {/* ── Tabs: Description / Specifications / Reviews ── */}
        <PdpTabs
          description={
            description ? (
              <div className="max-w-4xl">
                <ProductDescription html={description} />
              </div>
            ) : null
          }
          specs={
            <div className="max-w-4xl">
              <ProductSpecsTable locale={locale} rows={specRows} />
            </div>
          }
          reviews={<ProductReviews locale={locale} />}
        />

        {/* ── Recommendations (single merged carousel) ── */}
        {recommendations.length > 0 ? (
          <RecommendationsCarousel
            title={t("relatedTitle")}
            subtitle={t("relatedSubtitle")}
          >
            {recommendations.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </RecommendationsCarousel>
        ) : null}
      </div>
    </>
  );
}
