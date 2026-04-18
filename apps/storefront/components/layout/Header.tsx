import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { listCollections, listProductCategories } from "@/lib/medusa-client";
import Container from "./Container";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileMenu from "./MobileMenu";
import MegaMenu from "./MegaMenu";
import CartButton from "./CartButton";
import WishlistHeaderButton from "./WishlistHeaderButton";
import CompareHeaderButton from "./CompareHeaderButton";
import AccountHeaderLink from "./AccountHeaderLink";

/*
  Responsive layout:

  Mobile  (< 640px)
    [Logo]                    [Cart] [☰]
    ↕ MobileMenu panel (toggle)

  Desktop (≥ 640px)
    [Logo]   [MegaMenu: Home  Products▼  Collections▼  About]   [locale  theme  wishlist  compare  cart]

  Header is a Server Component.
  ThemeToggle + LocaleSwitcher + MobileMenu are client boundaries.
*/

export default async function Header() {
  const locale = await getLocale();

  const [{ product_categories }, { collections }] = await Promise.all([
    listProductCategories(),
    listCollections(),
  ]);

  const megaCategories = product_categories.map((c) => ({
    id: c.id,
    name: c.name ?? c.handle ?? c.id,
  }));

  const megaCollections = collections
    .filter((c) => typeof c.handle === "string" && c.handle.length > 0)
    .map((c) => ({
      id: c.id,
      title: c.title ?? c.handle ?? c.id,
      handle: c.handle as string,
    }));

  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <header className="relative sticky top-0 z-50 border-b border-border bg-surface">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <a
            href={`/${locale}`}
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
            aria-label={t("logoHomeAria")}
          >
            <Logo
              variant="horizontal-no-tagline"
              alt={tCommon("storeName")}
              className="h-10 w-auto"
              priority
            />
          </a>

          {/* ── Desktop nav (mega menu); mobile uses MobileMenu unchanged ── */}
          <div className="hidden sm:flex sm:flex-1 sm:justify-center">
            <MegaMenu categories={megaCategories} collections={megaCollections} />
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-1 sm:gap-3">

            <LocaleSwitcher />

            <ThemeToggle />

            <AccountHeaderLink />

            <WishlistHeaderButton />

            <CompareHeaderButton />

            <CartButton />

            {/* Hamburger (mobile only) — rendered by MobileMenu */}
            <MobileMenu />
          </div>

        </div>
      </Container>
    </header>
  );
}
