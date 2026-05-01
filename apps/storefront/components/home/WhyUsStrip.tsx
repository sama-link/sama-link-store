import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";

function Icon({ name }: { name: "truck" | "shield" | "headphones" | "wallet" }) {
  const common = "h-5 w-5";
  switch (name) {
    case "truck":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="7" width="14" height="10" rx="1" />
          <path d="M15 10h4l3 3v4h-7" />
          <circle cx="6" cy="18" r="1.8" />
          <circle cx="18" cy="18" r="1.8" />
        </svg>
      );
    case "shield":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case "headphones":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
          <rect x="3" y="14" width="5" height="7" rx="1.5" />
          <rect x="16" y="14" width="5" height="7" rx="1.5" />
        </svg>
      );
    case "wallet":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <circle cx="17" cy="14" r="1.2" fill="currentColor" />
        </svg>
      );
  }
}

/* ADR-045 flat refresh — 4-up value props */
export default async function WhyUsStrip() {
  const t = await getTranslations("home.why");
  const tSection = await getTranslations("home.sections.why");

  const items = [
    { icon: "truck" as const, title: t("delivery.title"), body: t("delivery.body") },
    { icon: "shield" as const, title: t("authentic.title"), body: t("authentic.body") },
    { icon: "headphones" as const, title: t("support.title"), body: t("support.body") },
    { icon: "wallet" as const, title: t("payment.title"), body: t("payment.body") },
  ];

  return (
    <section className="bg-surface-subtle">
      <Container className="py-14">
        <div className="mb-8">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {tSection("eyebrow")}
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
            {tSection("title")}
          </h2>
        </div>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-brand">
                <Icon name={item.icon} />
              </span>
              <h3 className="mt-1 text-sm font-semibold text-text-primary">
                {item.title}
              </h3>
              <p className="text-xs text-text-secondary">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
