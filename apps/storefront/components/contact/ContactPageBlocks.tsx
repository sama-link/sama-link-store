import { getTranslations } from "next-intl/server";

const BRANCH_KEYS = [
  "b1",
  "b2",
  "b3",
  "b4",
  "b5",
  "b6",
  "b7",
  "b8",
  "b9",
] as const;

const DEPARTMENT_KEYS = [
  "sales",
  "support",
  "technical",
  "b2b",
  "procurement",
] as const;

/** Default: Greater Cairo on OpenStreetMap (replace via env with Google embed if preferred). */
const DEFAULT_MAP_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=31.15%2C29.95%2C31.55%2C30.15&layer=mapnik";

export default async function ContactPageBlocks({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "pages" });
  const mapSrc =
    process.env.NEXT_PUBLIC_CONTACT_MAP_EMBED_URL?.trim() || DEFAULT_MAP_EMBED;

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-text-primary">
          {t("contact.design.map.heading")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          {t("contact.design.map.hint")}
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <iframe
            title={t("contact.design.map.iframeTitle")}
            src={mapSrc}
            className="aspect-[21/9] min-h-[280px] w-full bg-surface-subtle max-sm:aspect-video"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-text-primary">
          {t("contact.design.branches.heading")}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {t("contact.design.branches.subtitle")}
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BRANCH_KEYS.map((key) => (
            <li key={key}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-surface-subtle p-4 transition-colors hover:border-brand">
                <p className="text-sm font-semibold text-text-primary">
                  {t(`contact.design.branches.items.${key}.title`)}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {t(`contact.design.branches.items.${key}.area`)}
                </p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {t("contact.design.branches.cardPlaceholder")}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-text-primary">
          {t("contact.design.departments.heading")}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {t("contact.design.departments.subtitle")}
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENT_KEYS.map((key) => {
            const email = t(`contact.design.departments.items.${key}.email`);
            const href = `mailto:${email}`;
            return (
              <li key={key}>
                <article className="flex h-full flex-col rounded-xl border border-border bg-surface-subtle p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {t(`contact.design.departments.items.${key}.title`)}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">
                    {t(`contact.design.departments.items.${key}.body`)}
                  </p>
                  <a
                    href={href}
                    className="mt-3 inline-flex text-sm font-semibold text-brand hover:underline"
                  >
                    {t("contact.design.departments.emailCta")}
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
