import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { listProductCategories } from "@/lib/medusa-client";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileMenu from "./MobileMenu";
import PrimaryNav from "./PrimaryNav";
import CategoryNav from "./CategoryNav";
import HeaderSearch from "./HeaderSearch";
import CartButton from "./CartButton";
import WishlistHeaderButton from "./WishlistHeaderButton";
import CompareHeaderButton from "./CompareHeaderButton";
import AccountHeaderLink from "./AccountHeaderLink";
import StickyHeader from "./StickyHeader";
import CompanyNavDropdown from "./CompanyNavDropdown";

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
  const tCommon = await getTranslations("common");

  return (
    <StickyHeader>
      <div className="w-full relative">
        <div className="mx-auto w-max max-w-full flex flex-col">
          
          {/* ── Row 1: Logo, Search, Actions ── */}
          <div className="relative flex h-[72px] w-full items-center gap-4 px-5 xl:px-0 z-[80]">
            
            {/* Logo and Mobile Menu */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="xl:hidden flex items-center">
                <MobileMenu categories={megaCategories} />
              </div>
              <a
                href={`/${locale}`}
                className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
                aria-label={t("logoHomeAria")}
              >
                <Logo
                  variant="horizontal-no-tagline"
                  alt={tCommon("storeName")}
                  className="h-11 w-auto xl:h-[52px]"
                  priority
                />
              </a>
            </div>

            {/* Search — fills space between logo & icons; centered so gaps match */}
            <div className="hidden xl:flex flex-1 min-w-0 justify-center px-2">
              <div className="w-full max-w-3xl">
                <HeaderSearch />
              </div>
            </div>

            {/* Spacer for mobile */}
            <div className="flex-1 xl:hidden" />

            {/* Action cluster */}
            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              
              {/* 1. Locale & Theme */}
              <div className="flex items-center gap-0.5">
                <LocaleSwitcher bare showLabel={false} />
                <ThemeToggle bare />
              </div>

              {/* Visual Separator */}
              <div className="h-4 w-px bg-border hidden xl:block"></div>

              {/* 2. Compare & Wishlist */}
              <div className="hidden xl:flex items-center gap-0.5">
                <CompareHeaderButton />
                <WishlistHeaderButton />
              </div>
              
              {/* Visual Separator */}
              <div className="h-4 w-px bg-border hidden xl:block"></div>

              {/* 3. Account */}
              <div className="hidden xl:flex items-center gap-0.5">
                <AccountHeaderLink />
              </div>

              {/* Visual Separator */}
              <div className="h-4 w-px bg-border hidden xl:block"></div>

              {/* 4. Company & Hotline */}
              <div className="flex items-center gap-0.5">
                <div className="hidden xl:block">
                  <CompanyNavDropdown />
                </div>
                <a 
                  href="tel:+201270511113" 
                  className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Call Hotline +2012 70511113"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
              </div>

            </div>
          </div>

          {/* Fade Border separating rows removed to make it one cohesive piece */}
          

          {/* ── Row 2: Nav Links & CategoryNav ── */}
          <div className="hidden xl:flex min-h-[52px] items-center justify-between w-full gap-4 px-5 xl:px-0 relative z-[40]">
            
            {/* All Products (Flex 1 - Start) */}
            <div className="flex flex-1 shrink-0 h-full items-center justify-start">
              <PrimaryNav segment="start" />
            </div>

            {/* Categories inline (Center) */}
            <div className="flex shrink-0 h-full items-center justify-center min-w-0">
              <CategoryNav />
            </div>

            {/* Deals & Cart (Flex 1 - End) */}
            <div className="flex flex-1 shrink-0 h-full items-center justify-end gap-3">
              <PrimaryNav segment="end" />
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center">
                <CartButton />
              </div>
            </div>

          </div>

        </div>
      </div>
    </StickyHeader>
  );
}