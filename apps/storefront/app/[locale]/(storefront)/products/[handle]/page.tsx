import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { getProductByHandle } from "@/lib/medusa-client";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

const getCachedProductByHandle = cache(getProductByHandle);

interface ProductPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

function formatVariantPrice(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
): string | null {
  if (amount == null || currencyCode == null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const product = await getCachedProductByHandle(handle);
  if (!product) {
    notFound();
  }

  const canonical = `/${locale}/products/${handle}`;
  const description = product.description ?? undefined;

  return {
    title: product.title,
    description,
    alternates: { canonical },
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
  const product = await getCachedProductByHandle(handle);
  if (!product) {
    notFound();
  }

  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const description = product.description?.trim() ?? null;
  const variants = product.variants ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs
        ariaLabel={tb("aria")}
        items={[
          { label: tb("home"), href: `/${locale}` },
          { label: tb("products"), href: `/${locale}/products` },
          { label: product.title ?? handle },
        ]}
      />
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {product.title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-base leading-relaxed text-text-secondary sm:text-lg">
            {description}
          </p>
        ) : null}
      </header>

      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg bg-surface-subtle">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title ?? ""}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
            priority
          />
        ) : null}
      </div>

      {variants.length > 0 ? (
        <section aria-labelledby="product-variants-heading" className="space-y-4">
          <h2
            id="product-variants-heading"
            className="text-xl font-semibold text-text-primary"
          >
            Variants
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {variants.map((variant) => {
              const priceLabel = formatVariantPrice(
                variant.calculated_price?.calculated_amount,
                variant.calculated_price?.currency_code,
              );
              const optionSummary =
                variant.options
                  ?.map((o) => o.value ?? "")
                  .filter(Boolean)
                  .join(" · ") ?? null;

              return (
                <li
                  key={variant.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-text-primary">
                      {variant.title ?? "Variant"}
                    </p>
                    {optionSummary ? (
                      <p className="text-sm text-text-secondary">{optionSummary}</p>
                    ) : null}
                    {variant.sku ? (
                      <p className="text-xs text-text-muted">SKU: {variant.sku}</p>
                    ) : null}
                  </div>
                  {priceLabel ? (
                    <p className="text-base font-semibold text-text-primary sm:text-end">
                      {priceLabel}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
