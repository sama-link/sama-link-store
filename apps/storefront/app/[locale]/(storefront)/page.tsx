import { getTranslations } from "next-intl/server";
import Button from "@/components/ui/Button";

/**
 * Phase 1 placeholder home — no product data.
 * Replaced by catalog experience in Phase 3+.
 */
export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-lg text-text-secondary">
          {t("subheadline")}
        </p>
        <Button type="button" variant="primary" size="lg" disabled>
          {t("ctaLabel")}
        </Button>
      </section>

      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-text-muted">
        {t("comingSoon")}
      </p>
    </div>
  );
}
