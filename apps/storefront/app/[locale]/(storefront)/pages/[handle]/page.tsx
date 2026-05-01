import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCmsPageByHandle } from "@/lib/medusa-client";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export const revalidate = 3600; // ISR — ADR-017

// Handle → i18n key mapping (hyphens not valid in next-intl key paths)
const HANDLE_KEY_MAP: Record<string, string> = {
  about: "about",
  faq: "faq",
  contact: "contact",
  "shipping-returns": "shippingReturns",
  privacy: "privacy",
  terms: "terms",
};

interface PageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const keyName = HANDLE_KEY_MAP[handle];
  if (!keyName) return {};

  const t = await getTranslations({ locale, namespace: "pages" });
  const tMeta = await getTranslations({ locale, namespace: "meta.pages" });
  const title = t(`${keyName}.title`);
  const description = tMeta(`${keyName}.description`);
  const canonical = buildCanonical(locale, `/pages/${handle}`);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(`/pages/${handle}`),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function CmsPage({ params }: PageProps) {
  const { locale, handle } = await params;

  const keyName = HANDLE_KEY_MAP[handle];
  if (!keyName) notFound();

  const t = await getTranslations({ locale, namespace: "pages" });
  const tb = await getTranslations({ locale, namespace: "breadcrumbs" });

  const title = t(`${keyName}.title`);
  const cmsPage = await getCmsPageByHandle(handle);
  const isAboutPage = handle === "about";
  const isContactPage = handle === "contact";
  const isFaqPage = handle === "faq";
  const isShippingReturnsPage = handle === "shipping-returns";
  const isPrivacyPage = handle === "privacy";
  const isTermsPage = handle === "terms";

  return (
    <Container>
      <div className="space-y-8 py-12">
        <Breadcrumbs
          ariaLabel={tb("aria")}
          items={[
            { label: tb("home"), href: `/${locale}` },
            { label: title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        {isAboutPage ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {t("about.intro.kicker")}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
                {t("about.intro.heading")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                {t("about.intro.body")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/collections`}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-95"
                >
                  {t("about.intro.primaryCta")}
                </Link>
                <Link
                  href={`/${locale}/pages/contact`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
                >
                  {t("about.intro.secondaryCta")}
                </Link>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="text-2xl font-bold text-text-primary">{t("about.stats.years.value")}</p>
                <p className="mt-1 text-sm text-text-secondary">{t("about.stats.years.label")}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="text-2xl font-bold text-text-primary">{t("about.stats.clients.value")}</p>
                <p className="mt-1 text-sm text-text-secondary">{t("about.stats.clients.label")}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="text-2xl font-bold text-text-primary">{t("about.stats.categories.value")}</p>
                <p className="mt-1 text-sm text-text-secondary">{t("about.stats.categories.label")}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-text-primary">{t("about.values.heading")}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">{t("about.values.one.title")}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{t("about.values.one.body")}</p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">{t("about.values.two.title")}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{t("about.values.two.body")}</p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">{t("about.values.three.title")}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{t("about.values.three.body")}</p>
                </article>
              </div>
            </section>
          </div>
        ) : isContactPage ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {t("contact.design.kicker")}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
                {t("contact.design.heading")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                {t("contact.design.body")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/collections`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
                >
                  {t("contact.design.secondaryCta")}
                </Link>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("contact.design.cards.phone.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("contact.design.cards.phone.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("contact.design.cards.email.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("contact.design.cards.email.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("contact.design.cards.hours.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("contact.design.cards.hours.body")}
                </p>
              </article>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-text-primary">{t("contact.design.process.heading")}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("contact.design.process.one.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("contact.design.process.one.body")}
                  </p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("contact.design.process.two.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("contact.design.process.two.body")}
                  </p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("contact.design.process.three.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("contact.design.process.three.body")}
                  </p>
                </article>
              </div>
            </section>
          </div>
        ) : isFaqPage ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {t("faq.design.kicker")}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
                {t("faq.design.heading")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                {t("faq.design.body")}
              </p>
            </section>

            <section className="space-y-3">
              <article className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-base font-semibold text-text-primary">
                  {t("faq.design.items.one.question")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {t("faq.design.items.one.answer")}
                </p>
              </article>

              <article className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-base font-semibold text-text-primary">
                  {t("faq.design.items.two.question")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {t("faq.design.items.two.answer")}
                </p>
              </article>

              <article className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-base font-semibold text-text-primary">
                  {t("faq.design.items.three.question")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {t("faq.design.items.three.answer")}
                </p>
              </article>

              <article className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-base font-semibold text-text-primary">
                  {t("faq.design.items.four.question")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {t("faq.design.items.four.answer")}
                </p>
              </article>
            </section>
          </div>
        ) : isShippingReturnsPage ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {t("shippingReturns.design.kicker")}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
                {t("shippingReturns.design.heading")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                {t("shippingReturns.design.body")}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("shippingReturns.design.cards.processing.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("shippingReturns.design.cards.processing.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("shippingReturns.design.cards.delivery.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("shippingReturns.design.cards.delivery.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("shippingReturns.design.cards.tracking.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("shippingReturns.design.cards.tracking.body")}
                </p>
              </article>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-text-primary">
                {t("shippingReturns.design.returns.heading")}
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("shippingReturns.design.returns.policy.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("shippingReturns.design.returns.policy.body")}
                  </p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("shippingReturns.design.returns.process.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("shippingReturns.design.returns.process.body")}
                  </p>
                </article>
              </div>
            </section>
          </div>
        ) : isPrivacyPage ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {t("privacy.design.kicker")}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
                {t("privacy.design.heading")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                {t("privacy.design.body")}
              </p>
              <p className="mt-3 max-w-3xl text-xs leading-6 text-text-muted">
                {t("privacy.design.lastUpdated")}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("privacy.design.cards.collect.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("privacy.design.cards.collect.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("privacy.design.cards.use.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("privacy.design.cards.use.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("privacy.design.cards.security.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("privacy.design.cards.security.body")}
                </p>
              </article>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-text-primary">
                {t("privacy.design.details.heading")}
              </h3>
              <div className="mt-4 space-y-4">
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("privacy.design.details.cookies.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("privacy.design.details.cookies.body")}
                  </p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("privacy.design.details.thirdParties.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("privacy.design.details.thirdParties.body")}
                  </p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("privacy.design.details.rights.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("privacy.design.details.rights.body")}
                  </p>
                </article>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold text-text-primary">
                {t("privacy.design.contact.heading")}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                {t("privacy.design.contact.body")}
              </p>
              <Link
                href={`/${locale}/pages/contact`}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-95"
              >
                {t("privacy.design.contact.cta")}
              </Link>
            </section>
          </div>
        ) : isTermsPage ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                {t("terms.design.kicker")}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
                {t("terms.design.heading")}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                {t("terms.design.body")}
              </p>
              <p className="mt-3 max-w-3xl text-xs leading-6 text-text-muted">
                {t("terms.design.lastUpdated")}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("terms.design.cards.acceptance.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("terms.design.cards.acceptance.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("terms.design.cards.orders.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("terms.design.cards.orders.body")}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-text-primary">
                  {t("terms.design.cards.liability.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {t("terms.design.cards.liability.body")}
                </p>
              </article>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-text-primary">
                {t("terms.design.details.heading")}
              </h3>
              <div className="mt-4 space-y-4">
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("terms.design.details.shipping.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("terms.design.details.shipping.body")}
                  </p>
                  <Link
                    href={`/${locale}/pages/shipping-returns`}
                    className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    {t("terms.design.details.shipping.link")}
                  </Link>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("terms.design.details.conduct.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("terms.design.details.conduct.body")}
                  </p>
                </article>
                <article className="rounded-lg bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t("terms.design.details.changes.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t("terms.design.details.changes.body")}
                  </p>
                </article>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {t("terms.design.footer.heading")}
                </p>
                <p className="mt-1 max-w-xl text-sm text-text-secondary">
                  {t("terms.design.footer.body")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/pages/privacy`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
                >
                  {t("terms.design.footer.privacyCta")}
                </Link>
                <Link
                  href={`/${locale}/pages/contact`}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-95"
                >
                  {t("terms.design.footer.contactCta")}
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <div className="prose prose-sm max-w-3xl text-text-secondary">
            {cmsPage?.body ? <p>{cmsPage.body}</p> : <p>{t("fallbackBody")}</p>}
          </div>
        )}
      </div>
    </Container>
  );
}
