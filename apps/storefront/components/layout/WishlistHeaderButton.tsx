"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useWishlist, type WishlistItem } from "@/hooks/useWishlist";
import { formatPrice } from "@/lib/format-price";
import HeaderActionPopover from "@/components/layout/HeaderActionPopover";
import { cn } from "@/lib/cn";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function WishlistHeaderButton() {
  const locale = useLocale();
  const t = useTranslations("wishlist");
  const tnav = useTranslations("nav");
  const { items, isHydrated, remove } = useWishlist();
  const count = isHydrated ? items.length : 0;

  /* Show the 4 most-recent wishlist items in the popover. */
  const preview = items.slice(-4).reverse();

  return (
    <HeaderActionPopover
      triggerLabel={tnav("wishlistAria", { count })}
      triggerContent={<HeartIcon filled={count > 0} />}
      badgeCount={count}
      badgeTone="error"
      title={t("pageTitle")}
      viewAllHref={`/${locale}/wishlist`}
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
              {preview.map((item) => (
                <WishlistRow
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

function WishlistRow({
  item,
  locale,
  onOpen,
  onRemove,
  removeLabel,
}: {
  item: WishlistItem;
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
      <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface-subtle">
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
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-text-primary">
          {item.title}
        </span>
        {priceLabel ? (
          <span className="text-sm font-semibold text-brand">{priceLabel}</span>
        ) : null}
      </span>
    </>
  );

  return (
    <li className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 hover:border-border hover:bg-surface-subtle">
      {href ? (
        <Link
          href={href}
          onClick={onOpen}
          className="flex flex-1 items-center gap-3 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          {body}
        </Link>
      ) : (
        <span className="flex flex-1 items-center gap-3">{body}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-error"
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
        <HeartIcon filled={false} />
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
