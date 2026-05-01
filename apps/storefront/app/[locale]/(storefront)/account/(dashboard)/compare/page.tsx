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
import { COMPARE_MAX_ITEMS } from "@/hooks/useCompare";
import { clearCompareFormAction } from "../../actions";
import CompareItemActions from "./CompareItemActions";

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
    // Tombstones render gracefully when the catalog call fails.
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
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("compare.heading")}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("compare.subheading", { max: COMPARE_MAX_ITEMS })}
          </p>
        </div>
        {entries.length > 0 ? (
          <form action={clearCompareFormAction}>
            <button
              type="submit"
              className="rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error"
            >
              {t("compare.clearAll")}
            </button>
          </form>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface-subtle p-8 text-center">
          <p className="text-base text-text-primary">
            {t("compare.empty.heading")}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("compare.empty.body")}
          </p>
          <Link
            href={`/${locale}/products`}
            className="mt-4 inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand hover:text-brand"
          >
            {t("compare.empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky start-0 z-20 min-w-[8rem] border border-border bg-surface p-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
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
                      className="min-w-[10rem] border border-border bg-surface-subtle p-3 text-center align-bottom"
                    >
                      <Link
                        href={href}
                        className="relative mx-auto mb-2 block aspect-square w-24 overflow-hidden rounded-md border border-border bg-surface"
                      >
                        {entry.thumbnail ? (
                          <Image
                            src={entry.thumbnail}
                            alt={entry.title ?? ""}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-text-muted">
                            {EM_DASH}
                          </span>
                        )}
                      </Link>
                      <Link
                        href={href}
                        className="line-clamp-2 text-xs font-semibold text-text-primary hover:text-brand"
                      >
                        {entry.title ?? t("compare.unnamedItem")}
                      </Link>
                      <div className="mt-2">
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
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 border border-border bg-surface p-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {row.label}
                  </th>
                  {entries.map((entry) => {
                    const val = row.cell(entry);
                    return (
                      <td
                        key={`${entry.backendItemId}-${row.key}`}
                        className="border border-border bg-surface p-3 align-middle text-text-primary"
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
