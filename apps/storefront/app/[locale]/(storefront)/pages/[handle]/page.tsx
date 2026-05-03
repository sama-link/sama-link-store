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
          <div className="space-y-8 pb-8 sm:space-y-12 sm:pb-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-2xl bg-brand text-white shadow-xl sm:rounded-3xl sm:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-brand to-[#004a8e] opacity-90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50"></div>
              
              <div className="relative z-10 px-6 py-12 text-center sm:px-16 sm:py-24">
                <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md sm:text-xs">
                  {t("about.design.hero.kicker")}
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl">
                  {t("about.design.hero.heading")}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/90 sm:mt-6 sm:text-lg sm:leading-8">
                  {t("about.design.hero.body")}
                </p>
              </div>
            </section>

            {/* Our Story */}
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:rounded-3xl sm:p-10">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-2xl font-bold text-text-primary sm:text-3xl">{t("about.design.story.heading")}</h3>
                <div className="mt-3 h-1 w-12 rounded-full bg-brand sm:mt-4 sm:w-16"></div>
              </div>
              <div className="space-y-4 text-base leading-relaxed text-text-secondary sm:text-lg sm:leading-8">
                <p>{t("about.design.story.body1")}</p>
                <p>{t("about.design.story.body2")}</p>
              </div>
            </section>

            {/* Vision & Mission */}
            <section className="grid gap-6 sm:gap-8 md:grid-cols-2">
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-surface-subtle transition-transform duration-500 group-hover:scale-150 group-hover:bg-brand/5 rtl:-left-6 rtl:-right-auto"></div>
                <div className="relative z-10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-subtle text-2xl shadow-inner transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                    👁️
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-text-primary">{t("about.design.visionMission.vision.title")}</h3>
                  <p className="mt-3 text-base leading-relaxed text-text-secondary">
                    {t("about.design.visionMission.vision.body")}
                  </p>
                </div>
              </article>
              
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-surface-subtle transition-transform duration-500 group-hover:scale-150 group-hover:bg-brand/5 rtl:-left-6 rtl:-right-auto"></div>
                <div className="relative z-10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-subtle text-2xl shadow-inner transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                    🎯
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-text-primary">{t("about.design.visionMission.mission.title")}</h3>
                  <p className="mt-3 text-base leading-relaxed text-text-secondary">
                    {t("about.design.visionMission.mission.body")}
                  </p>
                </div>
              </article>
            </section>

            {/* Our Expertise */}
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:rounded-3xl sm:p-10">
              <div className="mb-8 text-center sm:mb-12">
                <h3 className="text-2xl font-bold text-text-primary sm:text-3xl lg:text-4xl">{t("about.design.expertise.heading")}</h3>
                <p className="mt-3 text-sm text-text-secondary sm:text-base">{t("about.design.expertise.subheading")}</p>
                <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand"></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["networking", "surveillance", "smartHome", "power"].map((key) => (
                  <div key={key} className="group flex flex-col rounded-xl border border-border bg-surface-subtle p-5 transition-all hover:border-brand/30 hover:bg-surface hover:shadow-md sm:rounded-2xl sm:p-6">
                    <h4 className="text-lg font-bold text-text-primary transition-colors group-hover:text-brand">
                      {t(`about.design.expertise.cards.${key}.title`)}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {t(`about.design.expertise.cards.${key}.body`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="relative overflow-hidden rounded-2xl bg-surface-subtle p-8 text-center shadow-sm sm:rounded-3xl sm:p-16">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand/5 blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand/5 blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-text-primary sm:text-3xl">{t("about.design.cta.heading")}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary">
                  {t("about.design.cta.body")}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href={`/${locale}/collections`}
                    className="inline-flex items-center justify-center rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {t("about.design.cta.primaryBtn")}
                  </Link>
                  <Link
                    href={`/${locale}/pages/contact`}
                    className="inline-flex items-center justify-center rounded-xl border-2 border-brand px-8 py-3.5 text-sm font-bold text-brand transition-all hover:bg-brand hover:text-white"
                  >
                    {t("about.design.cta.secondaryBtn")}
                  </Link>
                </div>
              </div>
            </section>
          </div>
        ) : isContactPage ? (
          <div className="space-y-8 pb-8 sm:space-y-12 sm:pb-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-2xl bg-brand text-white shadow-xl sm:rounded-3xl sm:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-brand to-[#004a8e] opacity-90"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50"></div>
              
              <div className="relative z-10 px-6 py-12 text-center sm:px-16 sm:py-24">
                <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md sm:text-xs">
                  {t("contact.design.kicker")}
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl">
                  {t("contact.design.heading")}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/90 sm:mt-6 sm:text-lg sm:leading-8">
                  {t("contact.design.body")}
                </p>
                <div className="mt-6 flex justify-center gap-4 sm:mt-8">
                  <Link
                    href={`/${locale}/collections`}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-sm transition-all hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-8 sm:py-3.5"
                  >
                    {t("contact.design.secondaryCta")}
                  </Link>
                </div>
              </div>
            </section>

            {/* Quick Contact Cards */}
            <section className="grid gap-4 sm:gap-6 md:grid-cols-3">
              {[
                { key: "phone", icon: "📞" },
                { key: "email", icon: "✉️" },
                { key: "hours", icon: "⏱️" }
              ].map((card) => (
                <article key={card.key} className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-surface-subtle transition-transform duration-500 group-hover:scale-150 group-hover:bg-brand/5 rtl:-left-6 rtl:-right-auto"></div>
                  <div className="relative z-10">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-xl shadow-inner transition-colors duration-300 group-hover:bg-brand group-hover:text-white sm:h-12 sm:w-12 sm:text-2xl">
                      {card.icon}
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-text-primary sm:mt-6 sm:text-lg">
                      {t(`contact.design.cards.${card.key}.title`)}
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                      {t(`contact.design.cards.${card.key}.body`)}
                    </p>
                  </div>
                </article>
              ))}
            </section>

            {/* Two-Column Section: Form & Map */}
            <section className="grid gap-6 sm:gap-8 lg:grid-cols-2">
              {/* Contact Form */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:rounded-3xl sm:p-10">
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xl font-bold text-text-primary sm:text-2xl">{t("contact.design.form.heading")}</h3>
                </div>
                <form className="space-y-5 sm:space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium text-text-primary">
                        {t("contact.design.form.name")}
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="block w-full rounded-xl border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand focus:ring-0 sm:py-3"
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                        {t("contact.design.form.email")}
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="block w-full rounded-xl border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand focus:ring-0 sm:py-3"
                        placeholder="@"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-text-primary">
                      {t("contact.design.form.subject")}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="block w-full rounded-xl border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand focus:ring-0 sm:py-3"
                      placeholder="..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary">
                      {t("contact.design.form.message")}
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="block w-full resize-none rounded-xl border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand focus:ring-0 sm:py-3 lg:min-h-[120px]"
                      placeholder="..."
                    ></textarea>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:py-3.5"
                  >
                    {t("contact.design.form.submit")}
                  </button>
                </form>
              </div>

              {/* HQ Map */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:rounded-3xl">
                <div className="p-6 pb-5 sm:p-10 sm:pb-6">
                  <h3 className="text-xl font-bold text-text-primary sm:text-2xl">{t("contact.design.map.heading")}</h3>
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-surface-subtle p-3 sm:gap-4 sm:p-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm text-brand sm:h-10 sm:w-10 sm:text-base">
                      📍
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary sm:text-base">{t("contact.design.map.hqLabel")}</p>
                      <p className="mt-0.5 text-xs text-text-secondary sm:mt-1 sm:text-sm">{t("contact.design.map.hqAddress")}</p>
                    </div>
                  </div>
                </div>
                <div className="relative h-full min-h-[250px] w-full bg-surface-subtle sm:min-h-[300px]">
                  <iframe
                    title="Headquarters Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110502.60389552702!2d31.1763155!3d30.0596185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fa60b21beeb%3A0x79dfb296e8423bba!2sCairo%2C%20Cairo%20Governorate%2C%20Egypt!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                    className="absolute inset-0 h-full w-full border-0 grayscale filter transition-all duration-500 hover:grayscale-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </section>

            {/* Branches Section */}
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:rounded-3xl sm:p-10">
              <div className="mb-8 text-center sm:mb-10">
                <h3 className="text-xl font-bold text-text-primary sm:text-2xl md:text-3xl">{t("contact.design.branches.heading")}</h3>
                <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-brand sm:mt-4 sm:w-16"></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div key={num} className="group flex flex-col justify-between rounded-xl border border-border bg-surface-subtle p-5 transition-all hover:border-brand/30 hover:bg-surface hover:shadow-md sm:rounded-2xl sm:p-6">
                    <div>
                      <h4 className="text-base font-bold text-text-primary transition-colors group-hover:text-brand sm:text-lg">
                        {t(`contact.design.branches.b${num}.name`)}
                      </h4>
                      <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-text-secondary sm:mt-3">
                        <span className="mt-0.5 opacity-70">📌</span>
                        <span>{t(`contact.design.branches.b${num}.address`)}</span>
                      </p>
                    </div>
                    <div className="mt-4 border-t border-border/50 pt-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                        <span className="opacity-70">📞</span>
                        <a href={`tel:${t(`contact.design.branches.b${num}.phone`)}`} className="transition-colors hover:text-brand" dir="ltr">
                          {t(`contact.design.branches.b${num}.phone`)}
                        </a>
                      </p>
                    </div>
                  </div>
                ))}
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
