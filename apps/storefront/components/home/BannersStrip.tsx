import { getLocale, getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";

/* ADR-045 flat refresh — Banner strip:
   One large brand banner + one small charcoal banner. No gradients. */
export default async function BannersStrip() {
  const locale = await getLocale();
  const t = await getTranslations("home.banners");
  const productsHref = `/${locale}/products`;
  const collectionsHref = `/${locale}/collections`;

  return (
    <section className="bg-surface">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Large brand banner */}
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl bg-brand p-10 text-text-inverse">
            {/* Decorative rings — animated like hero */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 top-1/2 flex -translate-y-1/2 items-center justify-center"
            >
              <span
                className="absolute h-[256px] w-[256px] rounded-full border border-text-inverse/10"
                style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "0s" }}
              />
              <span
                className="absolute h-[320px] w-[320px] rounded-full border border-text-inverse/10"
                style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "1s" }}
              />
              <span
                className="absolute h-[384px] w-[384px] rounded-full border border-text-inverse/10"
                style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "2s" }}
              />
            </div>
            <div className="relative z-10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                {t("largeEyebrow")}
              </div>
              <h3 className="mt-3 whitespace-pre-line text-3xl font-bold leading-[1.15] tracking-[-0.02em] sm:text-4xl">
                {t("largeTitle")}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-inverse/85">
                {t("largeBody")}
              </p>
            </div>
            <a
              href={collectionsHref}
              className="relative z-10 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-lg bg-surface px-6 text-sm font-semibold text-brand transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-subtle hover:shadow-md motion-safe:active:scale-[0.96] active:translate-y-0 active:shadow-sm"
            >
              {t("largeCta")}
              <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
            </a>
          </div>

          {/* Small charcoal banner — stays "dark surface + white text" in BOTH
             themes. Dark mode lifts `--color-charcoal` to a brand-tinted slate
             (see globals.css) so it reads above the navy page; text is
             `text-white` rather than `text-text-inverse` because inverse-text
             flips to dark in dark mode and would vanish on this card. */}
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl bg-charcoal p-8 text-white">
            {/* Decorative rings — animated like hero */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 top-1/2 flex -translate-y-1/2 items-center justify-center"
            >
              <span
                className="absolute h-[256px] w-[256px] rounded-full border border-white/5"
                style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "0s" }}
              />
              <span
                className="absolute h-[320px] w-[320px] rounded-full border border-white/5"
                style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "1s" }}
              />
              <span
                className="absolute h-[384px] w-[384px] rounded-full border border-white/5"
                style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "2s" }}
              />
            </div>
            <div className="relative z-10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                {t("smallEyebrow")}
              </div>
              <h3 className="mt-3 whitespace-pre-line text-2xl font-bold leading-[1.15] tracking-[-0.02em]">
                {t("smallTitle")}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">
                {t("smallBody")}
              </p>
            </div>
            <a
              href={productsHref}
              className="relative z-10 inline-flex w-fit items-center gap-1.5 border-b border-white/35 pb-1 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              {t("smallCta")}
              <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
