import { getTranslations } from "next-intl/server";
import Container from "./Container";
import MobileMenu from "./MobileMenu";

/*
  Responsive layout:

  Mobile  (< 640px)
    [Logo]                    [Cart] [☰]
    ↕ MobileMenu panel (toggle)

  Desktop (≥ 640px)
    [Logo]   [Products  Collections  About]   [AR/EN  🛒]

  Header is a Server Component.
  MobileMenu is the only client boundary (it owns the toggle state).
*/

const NAV_LINKS = [
  { key: "products" as const, href: "#" },
  { key: "collections" as const, href: "#" },
  { key: "about" as const, href: "#" },
];

export default async function Header() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <header className="relative sticky top-0 z-50 border-b border-border bg-surface">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <a
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-text-primary hover:text-brand transition-colors"
            aria-label={t("logoHomeAria")}
          >
            {tCommon("storeName")}
          </a>

          {/* ── Desktop nav ── */}
          <nav aria-label={t("mainNavigation")} className="hidden sm:block">
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Actions ── */}
          <div className="flex items-center gap-1 sm:gap-3">

            {/* Locale switcher — enabled in i18n pass */}
            <button
              type="button"
              disabled
              aria-label={t("switchLanguage")}
              className="hidden items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors sm:flex"
            >
              {t("languageToggle")}
            </button>

            {/* Cart icon — wired in Phase 4 */}
            <button
              type="button"
              disabled
              aria-label={t("openCart", { count: 0 })}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
            </button>

            {/* Hamburger (mobile only) — rendered by MobileMenu */}
            <MobileMenu />
          </div>

        </div>
      </Container>
    </header>
  );
}
