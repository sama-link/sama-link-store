"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCompare, type CompareItem } from "@/hooks/useCompare";
import { formatPrice } from "@/lib/format-price";
import HeaderActionPopover from "@/components/layout/HeaderActionPopover";
import { cn } from "@/lib/cn";

function CompareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 7h12a4 4 0 0 1 4 4v2" />
      <polyline points="7 3 3 7 7 11" />
      <path d="M21 17H9a4 4 0 0 1-4-4v-2" />
      <polyline points="17 21 21 17 17 13" />
    </svg>
  );
}

export default function CompareHeaderButton() {
  const locale = useLocale();
  const t = useTranslations("compare");
  const tnav = useTranslations("nav");
  const { items, isHydrated, remove } = useCompare();
  const count = isHydrated ? items.length : 0;

  /* Show all compare items (max 4 by design). */
  const preview = items;

  return (
    <HeaderActionPopover
      triggerLabel={tnav("compareAria", { count })}
      triggerContent={<CompareIcon />}
      badgeCount={count}
      title={t("pageTitle")}
      viewAllHref={`/${locale}/compare`}
      viewAllLabel={t("viewFullPage")}
    >
      {({ close }) => (
        <div className={cn("p-3", preview.length === 0 && "py-10")}>
          {preview.length === 0 ? (
            <EmptyState
              label={t("empty")}
              cta={t("emptyCta")}
              href={`/${locale}/products`}
              onNavigate={close}
            />
          ) : (
            <ul className="space-y-2">
              {preview.map((item: any) => (
                <CompareRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  onOpen={close}
                  onRemove={() => remove(item.id)}
                  removeLabel={t("remove")}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </HeaderActionPopover>
  );
}

function CompareRow({
  item,
  locale,
  onOpen,
  onRemove,
  removeLabel,
}: {
  item: CompareItem;
  locale: string;
  onOpen: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  const href = item.handle ? `/${locale}/products/${item.handle}` : null;
  const priceLabel =
    item.amount != null && item.currencyCode
      ? formatPrice(Number(item.amount), item.currencyCode, locale)
      : null;

  const body = (
    <>
      <span className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-subtle border border-border/50">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title ?? ""}
            width={56}
            height={56}
            unoptimized
            className="size-full object-cover"
          />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="block w-full overflow-hidden whitespace-nowrap text-sm font-semibold text-text-primary [mask-image:linear-gradient(to_right,black_70%,transparent)] [-webkit-mask-image:linear-gradient(to_right,black_70%,transparent)] rtl:[mask-image:linear-gradient(to_left,black_70%,transparent)] rtl:[-webkit-mask-image:linear-gradient(to_left,black_70%,transparent)]">
          {item.title}
        </span>
        {priceLabel ? (
          <span className="mt-0.5 text-xs font-bold text-brand">{priceLabel}</span>
        ) : null}
      </span>
    </>
  );

  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-surface-subtle w-full max-w-full">
      {href ? (
        <Link
          href={href}
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          {body}
        </Link>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-muted/50 hover:text-error"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </li>
  );
}

function EmptyState({
  label,
  cta,
  href,
  onNavigate,
}: {
  label: string;
  cta: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
        <CompareIcon />
      </span>
      <p className="text-sm text-text-secondary">{label}</p>
      <Link
        href={href}
        onClick={onNavigate}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
      >
        {cta}
      </Link>
    </div>
  );
}
