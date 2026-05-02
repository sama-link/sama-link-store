"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

function getAlternateLocaleHref(
  pathname: string
): { href: string; other: Locale } | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (!routing.locales.includes(first as Locale)) return null;

  const current = first as Locale;
  const other: Locale = current === "ar" ? "en" : "ar";
  const rest = segments.slice(1).join("/");
  const href = rest ? `/${other}/${rest}` : `/${other}`;

  return { href, other };
}

/* Simplified, polished locale toggle. Globe icon + 2-letter target code.
   Rounded pill, neutral by default, brand border on hover/focus. */
function GlobeIcon() {
  return (
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
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z" />
    </svg>
  );
}

interface LocaleSwitcherProps {
  /** Legacy `mobile` variant — rendered as a full-width list row (kept for older layouts). */
  variant?: "desktop" | "mobile";
  /** Borderless style — used when nested inside a shared border group (e.g. Header prefs pill). */
  bare?: boolean;
  /** Hide the "EN" / "ع" label and render just the globe icon. Saves header width on mobile. */
  showLabel?: boolean;
  onNavigate?: () => void;
}

export default function LocaleSwitcher({
  variant = "desktop",
  bare = false,
  showLabel = true,
  onNavigate,
}: LocaleSwitcherProps) {
  const t = useTranslations("nav");
  const current = useLocale();
  const pathname = usePathname() ?? "/";
  const alternate = getAlternateLocaleHref(pathname);

  if (!alternate) return null;

  /* Short label = the target locale code, never the current one. */
  const shortLabel = alternate.other === "en" ? "EN" : "ع";
  const fullLabel =
    alternate.other === "en" ? t("switchToEnglish") : t("switchToArabic");

  if (variant === "mobile") {
    return (
      <Link
        href={alternate.href}
        aria-label={t("switchLanguage")}
        onClick={onNavigate}
        className="flex h-12 items-center gap-2 px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
      >
        <GlobeIcon />
        <span>{fullLabel}</span>
      </Link>
    );
  }

  if (bare) {
    return (
      <Link href={alternate.href} passHref>
        <motion.div
          aria-label={t("switchLanguage")}
          onClick={onNavigate}
          data-locale-target={alternate.other}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "group inline-flex h-9 items-center rounded-full text-xs font-semibold uppercase tracking-wider text-text-secondary transition-all hover:bg-brand/10 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            showLabel ? "gap-1.5 px-3" : "w-9 justify-center",
          )}
        >
          <motion.div
            initial={false}
            animate={{ rotate: 0 }}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <GlobeIcon />
          </motion.div>
          {showLabel ? (
            <span className="text-[11px]">{shortLabel}</span>
          ) : null}
          <span className="sr-only">
            ({current === "ar" ? "العربية" : "English"} → {fullLabel})
          </span>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={alternate.href} passHref>
      <motion.div
        aria-label={t("switchLanguage")}
        onClick={onNavigate}
        data-locale-target={alternate.other}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary",
          "transition-all duration-200 hover:border-brand hover:bg-brand/5 hover:text-brand hover:shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15",
        )}
      >
        <motion.div
          initial={false}
          animate={{ rotate: 0 }}
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <GlobeIcon />
        </motion.div>
        <span className="text-[11px]">{shortLabel}</span>
        <span className="sr-only">
          ({current === "ar" ? "العربية" : "English"} → {fullLabel})
        </span>
      </motion.div>
    </Link>
  );
}
