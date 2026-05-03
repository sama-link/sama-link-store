"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import AccountHeaderLink from "./AccountHeaderLink";
import { CATEGORIES, Ic } from "./MegaMenuButton";

/* Mobile slide-over — full-height sheet opening from the start edge (RTL-mirrored).
   Sections:
     1. Search bar (same submit target as the desktop search pill)
     2. Primary nav (home / products / collections / about)
     3. Account link (sign-in / account page)
     4. Preferences row (theme toggle) */
export default function MobileMenu({ categories = [] }: { categories?: { id: string, name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [headerBottom, setHeaderBottom] = useState(0);
  const [activeTab, setActiveTab] = useState<"menu" | "categories">("menu");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  const NAV_LINKS = [
    { key: "home" as const, href: `/${locale}` },
    { key: "allProducts" as const, href: `/${locale}/products` },
    { key: "collections" as const, href: `/${locale}/collections` },
    {
      key: "hotDeals" as const,
      href: `/${locale}/products/special-offers`,
      isHotDeal: true,
    },
    { key: "about" as const, href: `/${locale}/pages/about` },
    { key: "contact" as const, href: `/${locale}/pages/contact` },
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Measure header bottom so the slide-over starts below the sticky header. */
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const header = document.querySelector("header");
      if (!header) return;
      const rect = header.getBoundingClientRect();
      setHeaderBottom(Math.max(0, Math.round(rect.bottom)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    if (q.length === 0) return;
    router.push(`/${locale}/products?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      {/* Hamburger (mobile only — rendered inside Header) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {/* Scrim — starts below the sticky header */}
      <div
        style={{ top: `${headerBottom}px` }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 bg-[color:rgba(10,19,36,0.4)] transition-opacity duration-300 ease-out sm:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over panel — starts below the sticky header */}
      <aside
        id="mobile-nav"
        aria-label={t("mobileNavigation")}
        style={{ top: `${headerBottom}px` }}
        className={cn(
          "fixed bottom-0 start-0 z-40 flex w-[86%] max-w-[360px] flex-col border-e border-border bg-surface sm:hidden",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
        )}
      >
        {/* Search — centered strip; sheet is closed via scrim or header hamburger */}
        <form
          onSubmit={onSubmit}
          role="search"
          className="flex justify-center border-b border-border px-4 pt-4 pb-3"
        >
          <label htmlFor="mobile-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <div className="relative w-full">
            <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              id="mobile-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-full border border-border bg-surface-subtle ps-10 pe-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-brand focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15"
            />
          </div>
        </form>

        {/* Tabs */}
        <div className="relative flex border-b border-border">
          <div
            className="absolute bottom-0 h-0.5 bg-brand transition-all duration-300 ease-out"
            style={{
              width: "50%",
              transform: `translateX(${activeTab === "menu" ? (locale === "ar" ? "0%" : "0%") : (locale === "ar" ? "-100%" : "100%")})`,
            }}
          />
          <button
            type="button"
            onClick={() => { setActiveTab("menu"); setActiveCategory(null); }}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              activeTab === "menu" ? "text-brand" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {t("menu")}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("categories"); setActiveCategory(null); }}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              activeTab === "categories" ? "text-brand" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {t("allCategories")}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pt-2">
          {activeTab === "menu" ? (
            <>
              {/* Primary nav */}
              <ul className="flex flex-col px-2">
                {NAV_LINKS.map(({ key, href, isHotDeal }) => {
                  const isActive = pathname === href;
                  return (
                    <li key={key}>
                      <a
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "relative flex h-12 items-center gap-2 rounded-lg px-3 text-[15px] transition-colors hover:bg-surface-subtle",
                          isActive ? "font-semibold" : "font-medium",
                          isHotDeal ? "text-error" : isActive ? "text-brand" : "text-text-primary hover:text-brand"
                        )}
                      >
                        <span>{t(key as any)}</span>
                        {isHotDeal && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-[18px]"
                            aria-hidden="true"
                          >
                            <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 12 2 12 2Z" />
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07 1.5-2.51 2-2.51 3.5a2.5 2.5 0 0 0 2.01 2Z" />
                          </svg>
                        )}
                        {isActive && (
                          <span
                            className={cn(
                              "absolute start-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-e-md",
                              isHotDeal ? "bg-error" : "bg-brand"
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>

              {/* Account link — mobile variant (shows sign-in or account page) */}
              <div className="mt-2 border-t border-border px-2 pt-2">
                <AccountHeaderLink variant="mobile" onNavigate={() => setOpen(false)} />
              </div>
            </>
          ) : activeCategory ? (
            <div className="flex flex-col px-2 pb-6 animate-fade-up">
              {(() => {
                const cat = CATEGORIES.find(c => c.id === activeCategory);
                if (!cat) return null;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-[14px] font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4 rtl:rotate-180" aria-hidden="true">
                        <path d="m15 18-6-6 6-6"/>
                      </svg>
                      {locale === "ar" ? "رجوع" : "Back"}
                    </button>
                    <div className="my-1 border-b border-border mx-3" />
                    <div className="flex items-center justify-between gap-4 px-3 pt-3 pb-2">
                      <h3 className="text-lg font-bold text-text-primary">
                        {locale === "ar" ? cat.ar : cat.en}
                      </h3>
                      <a
                        href={`/${locale}/products?category=${encodeURIComponent(cat.id)}`}
                        onClick={() => setOpen(false)}
                        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                      >
                        {t("megaMenu.viewAllProducts")}
                        <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
                      </a>
                    </div>
                    <ul className="flex flex-col mt-2">
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <a
                            href={`/${locale}/products?category=${encodeURIComponent(child.id)}`}
                            onClick={() => setOpen(false)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-normal text-text-secondary transition-colors hover:bg-surface-subtle hover:text-brand"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-text-muted">
                              <Ic name={child.icon} size={16} />
                            </span>
                            <span className="flex-1 text-start">{locale === "ar" ? child.ar : child.en}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                );
              })()}
            </div>
          ) : (
            <ul className="flex flex-col px-2 pb-6">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-text-primary transition-colors hover:bg-surface-subtle hover:text-brand"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center text-text-muted">
                        <Ic name={c.icon} size={20} />
                      </span>
                      <span className="text-start">{locale === "ar" ? c.ar : c.en}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-text-muted rtl:rotate-180" aria-hidden="true">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="pb-6" />
        </div>
      </aside>
    </>
  );
}
