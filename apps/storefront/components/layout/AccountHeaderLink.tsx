"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCustomer } from "@/hooks/useCustomer";
import { motion } from "framer-motion";

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
    <Link href={href} className="inline-flex shrink-0">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:bg-brand/5 hover:text-brand border border-transparent hover:border-border hover:shadow-sm"
        aria-label={label}
        title={label}
      >
        <AccountIcon />
      </motion.div>
    </Link>
  );
}
