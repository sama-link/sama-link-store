"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useLocale, useTranslations } from "next-intl";
import { Building2, Info, Phone } from "lucide-react";

export default function CompanyNavDropdown() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");

  const companyLabel = tFooter("company") || "Company";
  const items = [
    { label: t("about"), href: `/${locale}/pages/about`, icon: Info },
    { label: t("contact"), href: `/${locale}/pages/contact`, icon: Phone },
  ];

  const isActive = items.some(item => pathname === item.href);

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          isActive
            ? "bg-brand/10 text-brand"
            : "text-text-secondary group-hover:bg-surface-subtle group-hover:text-brand"
        )}
        aria-label={companyLabel}
      >
        <Building2 className="size-[18px] transition-transform duration-200 group-hover:scale-110" />
      </button>
      
      {/* Dropdown Menu (Hover Triggered) */}
      <div className="invisible absolute top-full pt-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 z-[100] end-0">
        <div className="min-w-[160px] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg">
          {items.map((item) => {
            const isChildActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors",
                  isChildActive
                    ? "bg-brand/10 text-brand font-semibold"
                    : "text-text-primary hover:bg-surface-subtle hover:text-brand"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
