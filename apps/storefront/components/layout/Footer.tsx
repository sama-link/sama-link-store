import { getLocale, getTranslations } from "next-intl/server";
import Logo from "@/components/ui/Logo";
import Container from "./Container";

/*
  Responsive layout (ADR-045 flat refresh):

  Mobile  (< 640px)  — stacked: Brand / Shop / Support / Company (each full-width)
  Tablet  (≥ 640px)  — 2-column grid
  Desktop (≥ 1024px) — 4-column grid: Brand + 3 link columns
  Bottom bar         — copyright left, payment-mini right, built-line centered on mobile
*/

function getFooterSections(locale: string) {
  return [
    {
      titleKey: "shop" as const,
      links: [
        { key: "allProducts" as const, href: `/${locale}/products` },
        { key: "collections" as const, href: `/${locale}/collections` },
        {
          key: "newArrivals" as const,
          href: `/${locale}/products?sort=newest`,
        },
        { key: "sale" as const, href: `/${locale}/products` }, /* temporary: special-offers route ships in a later slice */
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

/* Inline SVGs — consistent with the project's "no icon package" convention (Design System README). */
function SocialIcon({ name }: { name: "facebook" | "instagram" | "twitter" | "youtube" | "whatsapp" }) {
  const common =
    "h-4 w-4" as const;
  const stroke = 1.75;
  switch (name) {
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
        </svg>
      );
    case "twitter":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2H21.5l-7.19 8.22L23 22h-6.77l-5.3-6.93L4.84 22H1.57l7.7-8.8L1 2h6.93l4.78 6.32ZM17.1 20.1h1.86L7.01 3.82H5.04Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20l1.3-4.3A8 8 0 1 1 8.3 18.7L4 20z" />
          <path d="M9 9c.3-.8 1-1 1.5-1s1.3.3 1.6 1l.4 1c.1.4.2.8-.1 1.2l-.4.5c-.2.2-.2.5 0 .7.5.7 1.1 1.3 1.8 1.8.2.2.5.2.7 0l.5-.4c.4-.3.8-.2 1.2-.1l1 .4c.7.3 1 1.1 1 1.6s-.2 1.2-1 1.5c-2 .8-4-.8-5.8-2.6S8.2 11 9 9z" />
        </svg>
      );
  }
}

const SOCIALS = ["facebook", "instagram", "twitter", "youtube", "whatsapp"] as const;

function socialProfileUrl(
  name: (typeof SOCIALS)[number],
): string | undefined {
  const raw: Record<(typeof SOCIALS)[number], string | undefined> = {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL,
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL,
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER_URL,
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL,
    whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP_URL,
  };
  const v = raw[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}
const PAYMENTS = ["visa", "mastercard", "meeza", "valu", "cod"] as const;

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
                className="h-10 w-auto"
              />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              {t("tagline")}
            </p>

            {/* Socials */}
            <ul className="mt-1 flex items-center gap-2">
              {SOCIALS.map((name) => {
                const href = socialProfileUrl(name);
                if (!href) return null;
                return (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(`socials.${name}`)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-brand"
                    >
                      <SocialIcon name={name} />
                    </a>
                  </li>
                );
              })}
            </ul>
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
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
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
        <Container className="flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
          <p className="text-xs text-text-muted">
            {t("copyrightLine", {
              year: currentYear,
              storeName: tCommon("storeName"),
              rights: t("copyright"),
            })}
          </p>

          {/* Payment mini list */}
          <ul className="flex flex-wrap items-center gap-1.5" aria-label={t("paymentsLabel")}>
            {PAYMENTS.map((p) => (
              <li
                key={p}
                className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
              >
                {t(`payments.${p}`)}
              </li>
            ))}
          </ul>

          <p className="text-xs text-text-muted">
            {t("builtWithCare")}
          </p>
        </Container>
      </div>

    </footer>
  );
}
