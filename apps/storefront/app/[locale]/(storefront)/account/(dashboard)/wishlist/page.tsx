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
    // Live-product fetch is best-effort. Tombstone snapshots render
    // gracefully when the catalog call fails.
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
    // The (dashboard) layout already redirects unauthenticated visitors
    // to /account/login; this is a defensive guard for the rare case
    // where the cookie disappears between layout and page render.
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
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("wishlist.heading")}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("wishlist.subheading")}
          </p>
        </div>
        {items.length > 0 ? (
          <form action={clearWishlistFormAction}>
            <button
              type="submit"
              className="rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error"
            >
              {t("wishlist.clearAll")}
            </button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface-subtle p-8 text-center">
          <p className="text-base text-text-primary">
            {t("wishlist.empty.heading")}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("wishlist.empty.body")}
          </p>
          <Link
            href={`/${locale}/products`}
            className="mt-4 inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand hover:text-brand"
          >
            {t("wishlist.empty.cta")}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface-subtle"
              >
                <Link
                  href={href}
                  className="relative block aspect-square w-full shrink-0 overflow-hidden bg-surface"
                >
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title ?? ""}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link
                    href={href}
                    className="line-clamp-2 text-sm font-semibold text-text-primary hover:text-brand"
                  >
                    {item.title ?? t("wishlist.unnamedItem")}
                  </Link>
                  {priceLabel ? (
                    <p className="text-sm font-semibold text-text-primary">
                      {priceLabel}
                    </p>
                  ) : null}
                  <div className="flex-1" />
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
