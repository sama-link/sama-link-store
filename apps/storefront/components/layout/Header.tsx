import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { listProductCategories } from "@/lib/medusa-client";
import Container from "./Container";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileMenu from "./MobileMenu";
import MegaMenuButton from "./MegaMenuButton";
import PrimaryNav from "./PrimaryNav";
import HeaderSearch from "./HeaderSearch";
import CartButton from "./CartButton";
import WishlistHeaderButton from "./WishlistHeaderButton";
import CompareHeaderButton from "./CompareHeaderButton";
import AccountHeaderLink from "./AccountHeaderLink";
import StickyHeader from "./StickyHeader";

/*
  Layout (ADR-045 flat refresh — header redesign):

  Announcement strip (always-on)

  Desktop (≥ lg)
    [☰ All Categories] [Logo] [Home · Products · Collections · Deals · About · Contact] [🔍] [🌐|☀︎] 👤 ❤︎ ⇄ 🛒
    ─────────────────────────────────────────────────────────────────────────────────────────────────
    LTR — RTL mirrors automatically via logical properties.

  Tablet (sm – lg) — same layout, primary nav hidden (mega menu still surfaces categories,
  collections + deals + about + contact reachable via collections/products/pages routes).

  Mobile (< sm)
    [☰] [Logo]                                    [🌐 EN | ☀︎]
    Cart lives as a floating FAB; wishlist/compare inside the menu.
*/

export default async function Header() {
  const locale = await getLocale();

  const categoriesResult = await Promise.allSettled([listProductCategories()]).then(
    (r) => r[0],
  );

  const product_categories =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.product_categories
      : [];

  const megaCategories = product_categories.map((c: any) => ({
    id: c.id,
    name: c.name ?? c.handle ?? c.id,
  }));

  const t = await getTranslations("nav");
  const tTop = await getTranslations("topbar");
  const tCommon = await getTranslations("common");

  const productsHref = `/${locale}/products`;

  return (
    <StickyHeader>
      {/* ── Topbar — full viewport width, unchanged. ── */}
      <div className="topbar-shimmer relative overflow-hidden bg-brand text-text-inverse">
        <Container>
          <div className="relative z-10 flex h-9 items-center justify-center gap-2 text-xs font-medium">
            <span className="truncate">{tTop("announcement")}</span>
            <a
              href={productsHref}
              className="shrink-0 font-semibold text-text-inverse underline-offset-4 hover:underline"
            >
              {tTop("announcementCta")}
              <span className="ms-1">→</span>
            </a>
          </div>
        </Container>
      </div>

      {/* ── Main row — Generous breathing room, logo on the start, big
            persistent search bar at the centre, refined action cluster at
            the end. Single dominant element per visual zone — keeps the
            hierarchy clean (logo / search / actions). ── */}
      <div className="border-b border-border bg-surface">
        <Container>
          <div className="relative flex h-[72px] items-center gap-3 sm:gap-5 lg:gap-6">
          <div className="sm:hidden">
            <MobileMenu categories={megaCategories} />
          </div>

          {/* Logo — taller for stronger brand presence. */}
          <a
            href={`/${locale}`}
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
            aria-label={t("logoHomeAria")}
          >
            <Logo
              variant="horizontal-no-tagline"
              alt={tCommon("storeName")}
              className="h-10 w-auto lg:h-12"
              priority
            />
          </a>

          {/* Persistent search bar — takes the central spotlight. */}
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <HeaderSearch />
          </div>

          {/* Spacer for mobile (no central search visible) */}
          <div className="flex-1 md:hidden" />

          {/* Action cluster — calm, evenly-spaced, divided into utility
              (locale/theme) and account actions for legibility. */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <LocaleSwitcher bare showLabel={false} />
            <ThemeToggle bare />
            <div className="flex items-center lg:hidden gap-0.5 sm:gap-1">
              <WishlistHeaderButton />
              <CompareHeaderButton />
            </div>
          </div>
        </div>
        </Container>
      </div>

      {/* ── Sub-nav row — Mega menu button on the start edge (full row
          height, navy tab) + primary nav links centered. Subtle border-bottom
          gives it definition without competing with the main row. Hidden on
          mobile (links live in MobileMenu). ── */}
      <div className="hidden bg-surface lg:block">
        <Container>
          <div className="flex h-11 items-stretch">
            <div className="flex h-full shrink-0">
              <MegaMenuButton categories={megaCategories} />
            </div>
            <div className="flex flex-1 items-center justify-center px-4">
              <PrimaryNav />
            </div>
            <div className="flex h-full shrink-0 items-center gap-0.5 border-s border-border ps-2">
              <AccountHeaderLink />
              <WishlistHeaderButton />
              <CompareHeaderButton />
              <CartButton />
            </div>
          </div>
        </Container>
      </div>
    </StickyHeader>
  );
}
