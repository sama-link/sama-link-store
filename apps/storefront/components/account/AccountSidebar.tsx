"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Variant = "desktop" | "mobile";

const accountPaths = {
  dashboard: "/account",
  profile: "/account/profile",
  addresses: "/account/addresses",
  orders: "/account/orders",
  wishlist: "/account/wishlist",
} as const;

export default function AccountSidebar({ variant }: { variant: Variant }) {
  const locale = useLocale();
  const t = useTranslations("account");
  const pathname = usePathname();

  const navItems = [
    { key: "dashboard", href: `/${locale}${accountPaths.dashboard}` },
    { key: "profile", href: `/${locale}${accountPaths.profile}` },
    { key: "addresses", href: `/${locale}${accountPaths.addresses}` },
    { key: "orders", href: `/${locale}${accountPaths.orders}` },
    { key: "wishlist", href: `/${locale}${accountPaths.wishlist}` },
  ] as const;

  if (variant === "mobile") {
    return (
      <nav aria-label={t("nav.mobileLabel")} className="-mx-4 border-b border-border px-4 pb-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-brand bg-brand-muted text-brand"
                    : "border-border bg-surface text-text-secondary hover:text-text-primary",
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={t("nav.desktopLabel")} className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "block rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-brand bg-brand-muted text-brand"
                : "border-transparent text-text-secondary hover:border-border hover:bg-surface-subtle hover:text-text-primary",
            )}
          >
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
