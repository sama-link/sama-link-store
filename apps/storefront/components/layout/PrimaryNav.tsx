import { getLocale, getTranslations } from "next-intl/server";
import PrimaryNavLinks from "./PrimaryNavLinks";

/* Primary inline nav — flat horizontal links, no dropdowns.
   Sits between the logo and the search bar in the main header row.
   Each link is a plain anchor; the mega-menu button (separate component)
   carries the categories panel, so this nav stays simple and quick to scan. */
export default async function PrimaryNav() {
  const locale = await getLocale();
  const t = await getTranslations("nav");

  const items = [
    { label: t("home"),         href: `/${locale}` },
    { label: t("allProducts"),  href: `/${locale}/products` },
    { label: t("collections"),  href: `/${locale}/collections` },
    {
      label: t("hotDeals"),
      href: `/${locale}/products/special-offers`,
      isHotDeal: true,
    },
    { label: t("about"),        href: `/${locale}/pages/about` },
    { label: t("contact"),      href: `/${locale}/pages/contact` },
  ];

  return (
    <nav aria-label={t("mainNavigation")} className="flex items-center h-full">
      <PrimaryNavLinks items={items} />
    </nav>
  );
}
