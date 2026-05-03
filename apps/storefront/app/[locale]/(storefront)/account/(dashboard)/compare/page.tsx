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
import { COMPARE_MAX_ITEMS } from "@/lib/compare-cap";
import { clearCompareFormAction } from "../../actions";
import CompareItemActions from "./CompareItemActions";
import { ArrowRightLeft, Trash2, PackageSearch } from "lucide-react";
import { cn } from "@/lib/cn";

interface ComparePageProps {
  params: Promise<{ locale: string }>;
}

const EM_DASH = "—";

type CompareEntry = {
  backendItemId: string;
  productId: string;
  variantId: string | null;
  title: string | null;
  thumbnail: string | null;
  handle: string | null;
  amount: number | null;
  currencyCode: string | null;
  subtitle: string | null;
  material: string | null;
  weight: number | null;
  originCountry: string | null;
};

function tombstoneEntry(row: CustomerListItem): CompareEntry {
  return {
    backendItemId: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    title: row.title_snapshot,
    thumbnail: row.thumbnail_snapshot,
    handle: null,
    amount: null,
    currencyCode: null,
    subtitle: null,
    material: null,
    weight: null,
    originCountry: null,
  };
}

function readString(rec: unknown, key: string): string | null {
  if (!rec || typeof rec !== "object") return null;
  const v = (rec as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function readNumber(rec: unknown, key: string): number | null {
  if (!rec || typeof rec !== "object") return null;
  const v = (rec as Record<string, unknown>)[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

async function enrich(
  rows: CustomerListItem[],
  locale: string,
): Promise<CompareEntry[]> {
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
    if (!product) return tombstoneEntry(row);
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
      subtitle: localized.subtitle ?? readString(product, "subtitle"),
      material: readString(product, "material"),
      weight: readNumber(product, "weight"),
      originCountry: readString(product, "origin_country"),
    };
  });
}

export default async function AccountComparePage({ params }: ComparePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const tCompare = await getTranslations({ locale, namespace: "compare" });
  const token = await getAuthToken();

  if (!token) {
    notFound();
  }

  let entries: CompareEntry[] = [];
  try {
    const list = await getCustomerList(token, "compare");
    entries = await enrich(
      list.items.slice(0, COMPARE_MAX_ITEMS),
      locale,
    );
  } catch {
    entries = [];
  }

  const rows: { key: string; label: string; cell: (e: CompareEntry) => string | null }[] = [
    {
      key: "price",
      label: tCompare("headers.price"),
      cell: (e) =>
        formatCatalogPrice(e.amount, e.currencyCode, locale) || null,
    },
    { key: "subtitle", label: tCompare("headers.subtitle"), cell: (e) => e.subtitle },
    { key: "material", label: tCompare("headers.material"), cell: (e) => e.material },
    {
      key: "weight",
      label: tCompare("headers.weight"),
      cell: (e) => (e.weight != null ? `${e.weight}g` : null),
    },
    { key: "origin", label: tCompare("headers.origin"), cell: (e) => e.originCountry },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            {t("compare.heading")}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t("compare.subheading", { max: String(COMPARE_MAX_ITEMS) })}
          </p>
        </div>
        {entries.length > 0 && (
          <form action={clearCompareFormAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-muted/30 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-muted hover:border-error/30"
            >
              <Trash2 className="h-4 w-4" />
              {t("compare.clearAll")}
            </button>
          </form>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted shadow-sm">
            <ArrowRightLeft className="h-8 w-8" />
          </div>
          <p className="mb-2 text-xl font-semibold text-text-primary">
            {t("compare.empty.heading")}
          </p>
          <p className="mb-6 text-sm text-text-secondary max-w-sm">
            {t("compare.empty.body")}
          </p>
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow"
          >
            {t("compare.empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="-mx-4 sm:mx-0 overflow-x-auto sm:rounded-2xl sm:border border-border sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:sm:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
          <table className="w-max border-collapse text-left text-sm bg-surface min-w-full">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky start-0 z-20 w-24 sm:w-36 border-b border-r border-border bg-surface p-4 sm:p-5 text-xs font-semibold uppercase tracking-wide text-text-muted align-bottom"
                >
                  {tCompare("headers.image")}
                </th>
                {entries.map((entry) => {
                  const href =
                    entry.handle != null && entry.handle !== ""
                      ? `/${locale}/products/${entry.handle}`
                      : `/${locale}/products`;
                  return (
                    <th
                      key={entry.backendItemId}
                      scope="col"
                      className="w-48 sm:w-64 border-b border-border bg-surface p-4 sm:p-5 text-center align-bottom"
                    >
                      <Link
                        href={href}
                        className="group relative mx-auto mb-4 block aspect-square w-32 overflow-hidden rounded-xl border border-border bg-surface-subtle"
                      >
                        {entry.thumbnail ? (
                          <Image
                            src={entry.thumbnail}
                            alt={entry.title ?? ""}
                            fill
                            sizes="128px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-text-muted">
                            <PackageSearch className="h-8 w-8 opacity-20" />
                          </span>
                        )}
                      </Link>
                      <Link
                        href={href}
                        className="line-clamp-2 text-sm font-semibold text-text-primary hover:text-brand transition-colors h-10"
                      >
                        {entry.title ?? t("compare.unnamedItem")}
                      </Link>
                      <div className="mt-4">
                        <CompareItemActions
                          backendItemId={entry.backendItemId}
                          removeLabel={t("compare.removeItem")}
                          removingLabel={t("compare.removing")}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.key} className="transition-colors hover:bg-surface-subtle/50">
                  <th
                    scope="row"
                    className="sticky start-0 z-10 w-24 sm:w-36 border-r border-border bg-surface p-3 sm:p-4 text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {row.label}
                  </th>
                  {entries.map((entry) => {
                    const val = row.cell(entry);
                    const isPrice = row.key === 'price';
                    return (
                      <td
                        key={`${entry.backendItemId}-${row.key}`}
                        className={cn(
                          "w-48 sm:w-64 p-3 sm:p-4 align-middle",
                          isPrice ? "font-bold text-brand text-center text-base" : "text-text-secondary text-center"
                        )}
                      >
                        {val != null && val !== "" ? val : EM_DASH}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
