"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatCatalogPrice } from "@/lib/format-price";
import { useCompare, type CompareItem } from "@/hooks/useCompare";
import { cn } from "@/lib/cn";

const EM_DASH = "\u2014";

interface CompareClientProps {
  /** Server-fetched list when the customer is authenticated. When this
   *  prop is non-null the client renders out of it (the source of
   *  truth is the backend, not the provider's optimistic state).
   *  Guest visitors get `null` and fall through to the existing
   *  localStorage-backed provider read. */
  initialAuthedItems?: CompareItem[] | null;
}

export default function CompareClient({
  initialAuthedItems = null,
}: CompareClientProps) {
  const t = useTranslations("compare");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const provider = useCompare();
  const isAuthed = initialAuthedItems !== null;
  const items = isAuthed ? initialAuthedItems! : provider.items;
  const isHydrated = isAuthed ? true : provider.isHydrated;
  const remove = provider.remove;

  const heading = (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{t("pageDescription")}</p>
    </div>
  );

  if (!isHydrated) {
    return (
      <>
        {heading}
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-text-muted">
          {tCommon("loading")}
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {heading}
        <div className="mx-auto max-w-lg px-4 py-20 text-center animate-fade-in">
        <p className="text-lg text-text-primary">{t("empty")}</p>
        <Link
          href={`/${locale}/products`}
          className={cn(
            "mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface-subtle px-6 py-3 text-sm font-medium text-text-primary transition-colors",
            "hover:border-brand hover:bg-surface-raised hover:text-brand",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          )}
        >
          {t("emptyCta")}
        </Link>
        </div>
      </>
    );
  }

  const rows: { key: string; label: string; cell: (item: (typeof items)[0]) => string | null }[] = [
    {
      key: "image",
      label: t("headers.image"),
      cell: () => null,
    },
    {
      key: "title",
      label: t("headers.title"),
      cell: (item) => item.title,
    },
    {
      key: "price",
      label: t("headers.price"),
      cell: (item) =>
        formatCatalogPrice(item.amount, item.currencyCode, locale) || null,
    },
    {
      key: "subtitle",
      label: t("headers.subtitle"),
      cell: (item) => item.subtitle,
    },
    {
      key: "material",
      label: t("headers.material"),
      cell: (item) => item.material,
    },
    {
      key: "weight",
      label: t("headers.weight"),
      cell: (item) =>
        item.weight != null ? `${item.weight}g` : null,
    },
    {
      key: "origin",
      label: t("headers.origin"),
      cell: (item) => item.originCountry,
    },
  ];

  return (
    <>
      {heading}
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-8 animate-fade-in">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 min-w-[8rem] border border-border bg-surface p-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
            />
            {items.map((item: any) => (
              <th
                key={item.id}
                scope="col"
                className="min-w-[10rem] border border-border bg-surface-subtle p-3 text-center align-bottom"
              >
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs font-medium text-brand underline-offset-2 hover:underline"
                >
                  {t("removeColumn")}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={row.key}>
              <th
                scope="row"
                className="sticky left-0 z-10 border border-border bg-surface p-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {row.label}
              </th>
              {items.map((item: any) => {
                if (row.key === "image") {
                  const href =
                    item.handle != null && item.handle !== ""
                      ? `/${locale}/products/${item.handle}`
                      : `/${locale}/products`;
                  return (
                    <td
                      key={`${item.id}-img`}
                      className="border border-border bg-surface p-3 text-center align-middle"
                    >
                      <Link
                        href={href}
                        className="relative mx-auto block aspect-square w-24 overflow-hidden rounded-lg border border-border bg-surface-subtle"
                      >
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title ?? ""}
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
                    </td>
                  );
                }
                const val = row.cell(item);
                return (
                  <td
                    key={`${item.id}-${row.key}`}
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
    </>
  );
}
