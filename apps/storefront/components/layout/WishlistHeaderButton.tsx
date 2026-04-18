"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useWishlist } from "@/hooks/useWishlist";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

export default function WishlistHeaderButton() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { items, isHydrated } = useWishlist();
  const count = items.length;

  return (
    <Link
      href={`/${locale}/wishlist`}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
      aria-label={t("wishlistAria", { count })}
      title={t("wishlist")}
    >
      <HeartIcon filled={false} />
      {isHydrated && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-0.5 text-[10px] font-bold text-text-inverse"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
