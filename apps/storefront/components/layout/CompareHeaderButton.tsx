"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCompare } from "@/hooks/useCompare";

function CompareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="6" height="16" rx="1" />
      <rect x="14" y="4" width="6" height="16" rx="1" />
    </svg>
  );
}

export default function CompareHeaderButton() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { items, isHydrated } = useCompare();
  const count = items.length;

  return (
    <Link
      href={`/${locale}/compare`}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
      aria-label={t("compareAria", { count })}
      title={t("compare")}
    >
      <CompareIcon />
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
