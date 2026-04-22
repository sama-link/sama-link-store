"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import AccountHeaderLink from "./AccountHeaderLink";

/* Mobile slide-over — full-height sheet opening from the start edge (RTL-mirrored).
   Sections:
     1. Search bar (same submit target as the desktop search pill)
     2. Primary nav (home / products / collections / about)
     3. Account link (sign-in / account page)
     4. Preferences row (theme toggle) */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [headerBottom, setHeaderBottom] = useState(0);
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("nav");

  const NAV_LINKS = [
    { key: "home" as const, href: `/${locale}` },
    { key: "products" as const, href: `/${locale}/products` },
    { key: "collections" as const, href: `/${locale}/collections` },
    { key: "about" as const, href: `/${locale}/pages/about` },
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

      {/* Scrim — starts below the sticky header; blurred so the page reads as paused */}
      <div
        style={{ top: `${headerBottom}px` }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 bg-[color:rgba(10,19,36,0.28)] backdrop-blur-sm transition-opacity duration-300 ease-out sm:hidden",
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
        {/* Search — first thing in the panel, with a trailing close button */}
        <form onSubmit={onSubmit} role="search" className="relative flex items-center gap-2 border-b border-border px-4 pt-4 pb-3">
          <label htmlFor="mobile-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <div className="relative flex-1">
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
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </form>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Primary nav */}
          <ul className="flex flex-col px-2">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center rounded-lg px-3 text-[15px] font-medium text-text-primary transition-colors hover:bg-surface-subtle hover:text-brand"
                >
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>

          {/* Account link — mobile variant (shows sign-in or account page) */}
          <div className="border-t border-border px-2 pt-1">
            <AccountHeaderLink variant="mobile" onNavigate={() => setOpen(false)} />
          </div>

          <div className="pb-6" />
        </div>
      </aside>
    </>
  );
}
