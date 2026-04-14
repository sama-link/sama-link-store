import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Container from "./Container";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileMenu from "./MobileMenu";
import CartButton from "./CartButton";

/*
  Responsive layout:

  Mobile  (< 640px)
    [Logo]                    [Cart] [☰]
    ↕ MobileMenu panel (toggle)

  Desktop (≥ 640px)
    [Logo]   [Products  Collections  About]   [locale  theme  🛒]

  Header is a Server Component.
  ThemeToggle + LocaleSwitcher + MobileMenu are client boundaries.
*/

export default async function Header() {
  const locale = await getLocale();
  const NAV_LINKS = [
    { key: "products" as const, href: `/${locale}/products` },
    { key: "collections" as const, href: "#" },
    { key: "about" as const, href: "#" },
  ];

  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <header className="relative sticky top-0 z-50 border-b border-border bg-surface">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <a
            href="/"
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
            aria-label={t("logoHomeAria")}
          >
            <Logo
              variant="horizontal-no-tagline"
              alt={tCommon("storeName")}
              className="h-8 w-auto"
              priority
            />
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

            <LocaleSwitcher />

            <ThemeToggle />

            <CartButton />

            {/* Hamburger (mobile only) — rendered by MobileMenu */}
            <MobileMenu />
          </div>

        </div>
      </Container>
    </header>
  );
}
