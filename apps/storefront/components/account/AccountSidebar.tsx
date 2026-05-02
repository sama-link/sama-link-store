"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  User, 
  MapPin, 
  Package, 
  Heart, 
  ArrowRightLeft 
} from "lucide-react";

type Variant = "desktop" | "mobile";

const accountPaths = {
  dashboard: "/account",
  profile: "/account/profile",
  addresses: "/account/addresses",
  orders: "/account/orders",
  wishlist: "/account/wishlist",
  compare: "/account/compare",
} as const;

const icons = {
  dashboard: LayoutDashboard,
  profile: User,
  addresses: MapPin,
  orders: Package,
  wishlist: Heart,
  compare: ArrowRightLeft,
};

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
    { key: "compare", href: `/${locale}${accountPaths.compare}` },
  ] as const;

  if (variant === "mobile") {
    return (
      <nav aria-label={t("nav.mobileLabel")} className="-mx-4 px-4 pb-2">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.key === 'dashboard' && pathname === `/${locale}${accountPaths.dashboard}/`);
            const Icon = icons[item.key];
            
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-brand"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-nav"
                    className="absolute inset-0 rounded-full border border-brand bg-brand-muted"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {t(`nav.${item.key}`)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={t("nav.desktopLabel")} className="space-y-1.5 relative">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.key === 'dashboard' && pathname === `/${locale}${accountPaths.dashboard}/`);
        const Icon = icons[item.key];
        
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "text-brand"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="desktop-active-nav"
                className="absolute inset-0 rounded-xl bg-brand-muted"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3 w-full">
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-brand" : "text-text-muted")} />
              {t(`nav.${item.key}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
