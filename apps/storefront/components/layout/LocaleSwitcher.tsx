"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

function getAlternateLocaleHref(
  pathname: string
): { href: string; labelKey: "switchToEnglish" | "switchToArabic" } | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (!routing.locales.includes(first as Locale)) return null;

  const current = first as Locale;
  const other: Locale = current === "ar" ? "en" : "ar";
  const rest = segments.slice(1).join("/");
  const href = rest ? `/${other}/${rest}` : `/${other}`;
  const labelKey = other === "en" ? "switchToEnglish" : "switchToArabic";

  return { href, labelKey };
}

interface LocaleSwitcherProps {
  /** Style variant. `desktop` hides on <sm. `mobile` renders as a full-width row. */
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function LocaleSwitcher({
  variant = "desktop",
  onNavigate,
}: LocaleSwitcherProps) {
  const t = useTranslations("nav");
  const pathname = usePathname() ?? "/";
  const alternate = getAlternateLocaleHref(pathname);

  if (!alternate) return null;

  const className =
    variant === "mobile"
      ? "flex h-12 items-center px-4 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
      : "hidden items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors sm:inline-flex";

  return (
    <Link
      href={alternate.href}
      aria-label={t("switchLanguage")}
      onClick={onNavigate}
      className={cn(className)}
    >
      {t(alternate.labelKey)}
    </Link>
  );
}
