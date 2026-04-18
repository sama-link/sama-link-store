import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import Container from "./Container";

/*
  Responsive layout:

  Mobile  (< 640px)  — stacked: Brand / Shop / Support (each full-width)
  Tablet  (≥ 640px)  — 2-column grid
  Desktop (≥ 1024px) — 4-column grid: Brand + 3 link columns
  Bottom bar         — copyright left, legal links right
*/

function getFooterSections(locale: string) {
  return [
    {
      titleKey: "shop" as const,
      links: [
        { key: "allProducts" as const, href: `/${locale}/products` },
        { key: "collections" as const, href: `/${locale}/collections` },
        { key: "newArrivals" as const, href: `/${locale}/products` }, /* temporary: no dedicated route */
        { key: "sale" as const, href: `/${locale}/products` }, /* temporary: no dedicated route */
      ],
    },
    {
      titleKey: "support" as const,
      links: [
        { key: "contact" as const, href: `/${locale}/pages/contact` },
        { key: "faq" as const, href: `/${locale}/pages/faq` },
        {
          key: "shippingReturns" as const,
          href: `/${locale}/pages/shipping-returns`,
        },
        { key: "trackOrder" as const, href: `/${locale}/track-order` },
      ],
    },
    {
      titleKey: "company" as const,
      links: [
        { key: "about" as const, href: `/${locale}/pages/about` },
        { key: "privacy" as const, href: `/${locale}/pages/privacy` },
        { key: "terms" as const, href: `/${locale}/pages/terms` },
      ],
    },
  ] as const;
}

export default async function Footer() {
  const locale = await getLocale();
  const footerSections = getFooterSections(locale);
  const currentYear = new Date().getFullYear();
  const t = await getTranslations("footer");
  const tCommon = await getTranslations("common");

  return (
    <footer className="border-t border-border bg-surface-subtle">

      {/* ── Main grid ── */}
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <a
              href={`/${locale}`}
              className="inline-flex max-w-full items-center transition-opacity hover:opacity-90"
            >
              <Logo
                variant="horizontal-no-tagline"
                alt={tCommon("storeName")}
                className="h-7 w-auto"
              />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              {t("tagline")}
              {/* Tagline updated during copywriting phase */}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.titleKey} className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                {t(section.titleKey)}
              </h3>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {t(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border">
        <Container className="flex h-14 flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-text-muted">
            {t("copyrightLine", {
              year: currentYear,
              storeName: tCommon("storeName"),
              rights: t("copyright"),
            })}
          </p>
          <p className="text-xs text-text-muted">
            {t("builtWithCare")}
          </p>
        </Container>
      </div>

    </footer>
  );
}
