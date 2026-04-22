"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCustomer } from "@/hooks/useCustomer";

function AccountIcon() {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

interface AccountHeaderLinkProps {
  variant?: "icon" | "mobile";
  onNavigate?: () => void;
}

export default function AccountHeaderLink({
  variant = "icon",
  onNavigate,
}: AccountHeaderLinkProps) {
  const locale = useLocale();
  const t = useTranslations("account");
  const { isAuthenticated } = useCustomer();

  const href = isAuthenticated
    ? `/${locale}/account`
    : `/${locale}/account/login`;
  const label = isAuthenticated ? t("title") : t("signIn");

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="flex h-12 items-center justify-between gap-3 px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
        aria-label={label}
        title={label}
      >
        <span>{label}</span>
        <AccountIcon />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
      aria-label={label}
      title={label}
    >
      <AccountIcon />
    </Link>
  );
}
