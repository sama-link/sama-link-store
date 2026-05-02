import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthToken } from "@/lib/auth-cookie";
import { formatCatalogPrice } from "@/lib/format-price";
import {
  getCustomerList,
  listProducts,
  type CustomerListItem,
} from "@/lib/medusa-client";
import { localizeProduct } from "@/lib/product-i18n";
import { clearWishlistFormAction } from "../../actions";
import WishlistItemActions from "./WishlistItemActions";
import { Heart, Trash2, PackageSearch } from "lucide-react";

interface WishlistPageProps {
  params: Promise<{ locale: string }>;
}

type EnrichedItem = {
  backendItemId: string;
  productId: string;
  variantId: string | null;
  title: string | null;
  thumbnail: string | null;
  handle: string | null;
  amount: number | null;
  currencyCode: string | null;
};

function tombstoneItem(row: CustomerListItem): EnrichedItem {
  return {
    backendItemId: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    title: row.title_snapshot,
    thumbnail: row.thumbnail_snapshot,
    handle: null,
    amount: null,
    currencyCode: null,
  };
}

async function enrichItems(
  rows: CustomerListItem[],
  locale: string,
): Promise<EnrichedItem[]> {
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.product_id)));
  let products: Awaited<ReturnType<typeof listProducts>>["products"] = [];
  try {
    const result = await listProducts({ id: ids, limit: ids.length });
    products = result.products ?? [];
  } catch {
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.map((row) => {
    const product = byId.get(row.product_id);
    if (!product) return tombstoneItem(row);
    const localized = localizeProduct(product, locale);
    const variants = product.variants ?? [];
    const variant = row.variant_id
      ? variants.find((v: { id: string }) => v.id === row.variant_id) ??
        variants[0]
      : variants[0];
    const calc = variant?.calculated_price;
    return {
      backendItemId: row.id,
      productId: row.product_id,
      variantId: variant?.id ?? row.variant_id,
      title: localized.title ?? row.title_snapshot,
      thumbnail: product.thumbnail ?? row.thumbnail_snapshot,
      handle: product.handle ?? null,
      amount:
        calc?.calculated_amount != null ? Number(calc.calculated_amount) : null,
      currencyCode: calc?.currency_code ?? null,
    };
  });
}

export default async function AccountWishlistPage({ params }: WishlistPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const token = await getAuthToken();

  if (!token) {
    notFound();
  }

  let items: EnrichedItem[] = [];
  try {
    const list = await getCustomerList(token, "wishlist");
    items = await enrichItems(list.items, locale);
  } catch {
    items = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Heart className="h-5 w-5" />
            </div>
            {t("wishlist.heading")}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t("wishlist.subheading")}
          </p>
        </div>
        {items.length > 0 && (
          <form action={clearWishlistFormAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-muted/30 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-muted hover:border-error/30"
            >
              <Trash2 className="h-4 w-4" />
              {t("wishlist.clearAll")}
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted shadow-sm">
            <Heart className="h-8 w-8" />
          </div>
          <p className="mb-2 text-xl font-semibold text-text-primary">
            {t("wishlist.empty.heading")}
          </p>
          <p className="mb-6 text-sm text-text-secondary max-w-sm">
            {t("wishlist.empty.body")}
          </p>
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow"
          >
            {t("wishlist.empty.cta")}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const href =
              item.handle != null && item.handle !== ""
                ? `/${locale}/products/${item.handle}`
                : `/${locale}/products`;
            const priceLabel =
              formatCatalogPrice(item.amount, item.currencyCode, locale) ||
              null;
            return (
              <li
                key={item.backendItemId}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-brand-muted hover:shadow-md"
              >
                <Link
                  href={href}
                  className="relative block aspect-square w-full shrink-0 overflow-hidden bg-surface-subtle"
                >
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title ?? ""}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                      <PackageSearch className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                  <div>
                    <Link
                      href={href}
                      className="line-clamp-2 text-base font-semibold text-text-primary hover:text-brand transition-colors"
                    >
                      {item.title ?? t("wishlist.unnamedItem")}
                    </Link>
                    {priceLabel && (
                      <p className="mt-1 text-sm font-bold text-brand">
                        {priceLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex-1" />
                  <div className="mt-2 pt-4 border-t border-border">
                    <WishlistItemActions
                      backendItemId={item.backendItemId}
                      variantId={item.variantId}
                      moveLabel={t("wishlist.moveToCart")}
                      removeLabel={t("wishlist.removeItem")}
                      movingLabel={t("wishlist.moving")}
                      removingLabel={t("wishlist.removing")}
                      moveErrorLabel={t("wishlist.moveError")}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
