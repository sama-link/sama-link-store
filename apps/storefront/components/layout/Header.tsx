import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { listCollections, listProductCategories } from "@/lib/medusa-client";
import Container from "./Container";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileMenu from "./MobileMenu";
import MegaMenu from "./MegaMenu";
import HeaderSearch from "./HeaderSearch";
import CartButton from "./CartButton";
import WishlistHeaderButton from "./WishlistHeaderButton";
import CompareHeaderButton from "./CompareHeaderButton";
import AccountHeaderLink from "./AccountHeaderLink";

/*
  Layout (ADR-045 flat refresh):

  Announcement strip (always-on)

  Desktop (≥ sm)
    [Logo]  ⋯⋯⋯ [MegaMenu ···  🔍] ⋯⋯⋯  [ 🌐 EN | ☀︎ ]  👤  ❤︎  ⇄  🛒
    ─────────────────────────────────────────────────────────────
    (LTR — RTL mirrors automatically via logical properties.)

  Mobile (< sm)
    [☰] [Logo]                                    [ 🌐 EN | ☀︎ ]
    Cart lives as a floating FAB; wishlist/compare inside the menu.

  Category strip (sm+): horizontal icon + label links.
*/

/* Inline icon bank for the category strip — currentColor + 1.75 stroke. */
function CatIcon({ name }: { name: string }) {
  const common = "h-4 w-4";
  switch (name) {
    case "router":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M7 18h.01M11 18h.01M15 18h.01" />
          <path d="M12 9v3" />
          <path d="M8 7c1-1 2.5-1.5 4-1.5S15 6 16 7" />
        </svg>
      );
    case "cctv":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h14l2 4h-5l-2 4H5z" />
          <line x1="5" y1="14" x2="5" y2="20" />
          <line x1="7" y1="20" x2="3" y2="20" />
        </svg>
      );
    case "battery":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="8" width="16" height="8" rx="1.5" />
          <line x1="21" y1="11" x2="21" y2="13" />
        </svg>
      );
    case "plug":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 4v4M15 4v4" />
          <path d="M7 8h10v4a5 5 0 0 1-10 0z" />
          <path d="M12 17v4" />
        </svg>
      );
    case "cable":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20c4 0 8-4 8-8V4" />
          <path d="M12 4h4v4h-4z" />
          <path d="M20 4v8c0 4-4 8-8 8" />
        </svg>
      );
    case "shield":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
        </svg>
      );
    case "flame":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-5" />
          <path d="M12 22a6 6 0 0 1-6-6c0-4 3-5 3-8" />
        </svg>
      );
    case "box":
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l9 5v8l-9 5-9-5V8z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      );
  }
}

function guessCatIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("network") || n.includes("wifi") || n.includes("wi-fi") || n.includes("شبك")) return "router";
  if (n.includes("surveil") || n.includes("camera") || n.includes("cctv") || n.includes("مراقب")) return "cctv";
  if (n.includes("power") || n.includes("ups") || n.includes("battery") || n.includes("طاق")) return "battery";
  if (n.includes("smart") || n.includes("iot") || n.includes("ذكي")) return "plug";
  if (n.includes("cable") || n.includes("accessor") || n.includes("كابل") || n.includes("ملحق")) return "cable";
  if (n.includes("kit") || n.includes("security") || n.includes("حزم")) return "shield";
  if (n.includes("deal") || n.includes("sale") || n.includes("عرض")) return "flame";
  return "box";
}

export default async function Header() {
  const locale = await getLocale();

  const [categoriesResult, collectionsResult] = await Promise.allSettled([
    listProductCategories(),
    listCollections(),
  ]);

  const product_categories =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.product_categories
      : [];
  const collections =
    collectionsResult.status === "fulfilled"
      ? collectionsResult.value.collections
      : [];

  const megaCategories = product_categories.map((c: any) => ({
    id: c.id,
    name: c.name ?? c.handle ?? c.id,
  }));

  const megaCollections = collections
    .filter((c: any) => typeof c.handle === "string" && c.handle.length > 0)
    .map((c: any) => ({
      id: c.id,
      title: c.title ?? c.handle ?? c.id,
      handle: c.handle as string,
    }));

  const t = await getTranslations("nav");
  const tTop = await getTranslations("topbar");
  const tCommon = await getTranslations("common");

  const productsHref = `/${locale}/products`;
  const catStripItems = megaCategories.slice(0, 6);

  return (
    <header className="relative sticky top-0 z-50 border-b border-border bg-surface">
      {/* Announcement strip — brand fill + subtle moving shimmer */}
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

      <Container>
        <div className="flex h-16 items-center gap-2 sm:gap-5">
          {/* ── Mobile hamburger ── */}
          <div className="sm:hidden">
            <MobileMenu />
          </div>

          {/* ── Logo (far start) — capped on mobile so the action rail fits. */}
          <a
            href={`/${locale}`}
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
            aria-label={t("logoHomeAria")}
          >
            <Logo
              variant="horizontal-no-tagline"
              alt={tCommon("storeName")}
              className="h-8 w-auto sm:h-12"
              priority
            />
          </a>

          {/* ── Center: Mega menu + Search (desktop) ── */}
          <div className="hidden flex-1 items-center justify-center gap-3 sm:flex">
            <MegaMenu categories={megaCategories} collections={megaCollections} />
            <HeaderSearch />
          </div>

          {/* Spacer on mobile — pushes prefs group to the end */}
          <div className="flex-1 sm:hidden" />

          {/* ── Far-end actions ──
              Mobile: icon-only, tight row, no grouped pill.
              Desktop: grouped locale+theme pill, full-size buttons. */}
          <div className="flex items-center gap-0.5 sm:gap-3">
            {/* Mobile: bare icons, no grouped border */}
            <div className="flex items-center gap-0.5 sm:hidden">
              <LocaleSwitcher bare showLabel={false} />
              <ThemeToggle bare />
            </div>

            {/* Desktop: grouped Locale + Theme pill */}
            <div className="hidden h-10 items-center divide-x divide-border rounded-full border border-border bg-surface rtl:divide-x-reverse sm:inline-flex">
              <LocaleSwitcher bare />
              <ThemeToggle bare />
            </div>

            {/* Account link — desktop icon; mobile version lives inside MobileMenu */}
            <div className="hidden sm:flex">
              <AccountHeaderLink />
            </div>

            {/* Wishlist + Compare: always visible (popover on desktop, bottom sheet on mobile) */}
            <WishlistHeaderButton />
            <CompareHeaderButton />

            {/* Cart: desktop only (FAB + floating popup on mobile) */}
            <div className="hidden sm:flex">
              <CartButton />
            </div>
          </div>
        </div>
      </Container>

      {/* Category quick-jump strip — desktop only */}
      {catStripItems.length > 0 ? (
        <div
          className="hidden border-t border-border bg-surface sm:block"
          aria-label={t("catbarLabel")}
        >
          <Container>
            <nav className="flex items-center gap-4 overflow-x-auto py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {catStripItems.map((c) => (
                <a
                  key={c.id}
                  href={`${productsHref}?${new URLSearchParams({ category: c.id }).toString()}`}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium text-text-secondary transition-colors hover:text-brand"
                >
                  <CatIcon name={guessCatIcon(c.name)} />
                  {c.name}
                </a>
              ))}
              <a
                href={productsHref}
                className="ms-auto whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-brand"
              >
                {t("megaMenu.viewAllProducts")}
              </a>
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
