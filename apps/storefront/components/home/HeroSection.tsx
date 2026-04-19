import { getLocale, getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";

/* Inline icons — matches project convention (no icon package). */
function Icon({ name, size = 20 }: { name: "shield" | "truck" | "wallet" | "router" | "cctv" | "battery" | "plug"; size?: number }) {
  const s = `h-[${size}px] w-[${size}px]`;
  switch (name) {
    case "shield":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case "truck":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="7" width="14" height="10" rx="1" />
          <path d="M15 10h4l3 3v4h-7" />
          <circle cx="6" cy="18" r="1.8" />
          <circle cx="18" cy="18" r="1.8" />
        </svg>
      );
    case "wallet":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <circle cx="17" cy="14" r="1.2" fill="currentColor" />
        </svg>
      );
    case "router":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M7 18h.01M11 18h.01M15 18h.01" />
          <path d="M12 9v3" />
          <path d="M8 7c1-1 2.5-1.5 4-1.5S15 6 16 7" />
          <path d="M5 4c2-2 4-3 7-3s5 1 7 3" />
        </svg>
      );
    case "cctv":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h14l2 4h-5l-2 4H5z" />
          <line x1="5" y1="14" x2="5" y2="20" />
          <line x1="7" y1="20" x2="3" y2="20" />
        </svg>
      );
    case "battery":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="8" width="16" height="8" rx="1.5" />
          <line x1="21" y1="11" x2="21" y2="13" />
          <polyline points="9 10 7 12 11 12 9 14" />
        </svg>
      );
    case "plug":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={s} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 4v4M15 4v4" />
          <path d="M7 8h10v4a5 5 0 0 1-10 0z" />
          <path d="M12 17v4" />
        </svg>
      );
  }
}

/* ADR-045 flat refresh — Hero:
   Two-column layout on sm+ : copy + 4-card stack.
   RTL mirrors automatically because layout uses grid (not directional flex). */
export default async function HeroSection() {
  const locale = await getLocale();
  const t = await getTranslations("home.hero");
  const productsHref = `/${locale}/products`;
  const collectionsHref = `/${locale}/collections`;

  const trust = [
    { icon: "shield" as const, title: t("trust.authentic.title"), body: t("trust.authentic.body") },
    { icon: "truck" as const, title: t("trust.delivery.title"), body: t("trust.delivery.body") },
    { icon: "wallet" as const, title: t("trust.cod.title"), body: t("trust.cod.body") },
  ];

  const cards = [
    { eyebrow: t("cards.networking.eyebrow"), title: "Wi-Fi 6 Mesh", sub: t("cards.networking.sub"), icon: "router" as const, tone: "soft" as const },
    { eyebrow: t("cards.surveillance.eyebrow"), title: "4K IP Dome", sub: t("cards.surveillance.sub"), icon: "cctv" as const, tone: "brand" as const },
    { eyebrow: t("cards.power.eyebrow"), title: "UPS 1500VA", sub: t("cards.power.sub"), icon: "battery" as const, tone: "charcoal" as const },
    { eyebrow: t("cards.smart.eyebrow"), title: "Smart Plug", sub: t("cards.smart.sub"), icon: "plug" as const, tone: "muted" as const },
  ];

  const toneClass = {
    soft: "bg-brand-muted text-brand border-brand-muted",
    brand: "bg-brand text-text-inverse border-brand",
    // Charcoal card stays "dark surface + white text" in BOTH themes. Dark mode
    // lifts `--color-charcoal` to a brand-tinted slate (see globals.css) so it
    // sits visibly above the navy page; text is `text-white` rather than
    // `text-text-inverse` because inverse-text flips to dark in dark mode.
    charcoal: "bg-charcoal text-white border-charcoal",
    muted: "bg-surface-subtle text-text-primary border-border",
  } as const;

  const offsets = ["-6px", "10px", "4px", "-8px"];
  const delays = ["0s", "1.2s", "2s", "3s"];

  return (
    <section className="border-b border-border bg-surface">
      <Container className="py-14 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Copy */}
          <div className="flex flex-col gap-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <span className="inline-block h-px w-6 bg-accent" aria-hidden="true" />
              {t("eyebrow")}
            </span>
            <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-text-primary">
              {t("titleLead")}
              <span className="text-brand"> {t("titleAccent")}</span>
              <br />
              <span className="font-light italic">{t("titleCoda")}</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-text-secondary">
              {t("sub")}
            </p>

            <div className="mt-1 flex flex-wrap gap-3">
              <a
                href={productsHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-text-inverse transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {t("ctaBrowse")}
                <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
              </a>
              <a
                href={collectionsHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-text-primary transition-colors duration-150 hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {t("ctaCollections")}
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-5 sm:gap-8">
              {trust.map((item) => (
                <div key={item.title} className="flex items-start gap-3 text-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-brand">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <div className="text-text-secondary">
                    <div className="font-semibold text-text-primary">{item.title}</div>
                    <div>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4-card stack — mirrors the online-store reference.
             Uses CSS variables for per-card offset + animation delay. */}
          <div className="relative mx-auto aspect-square w-full max-w-[480px]">
            <div className="grid h-full grid-cols-2 grid-rows-2 gap-3 p-3">
              {cards.map((card, idx) => (
                <div
                  key={card.title}
                  className={`hero-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 sm:p-5 ${toneClass[card.tone]}`}
                  style={
                    {
                      ["--off" as string]: offsets[idx],
                      animation: `hero-float 6s ease-in-out ${delays[idx]} infinite`,
                      transform: `translateY(${offsets[idx]})`,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.1em] opacity-80">
                    <span>{card.eyebrow}</span>
                    <Icon name={card.icon} size={14} />
                  </div>
                  <div className="flex justify-center py-2 sm:py-4">
                    <Icon name={card.icon} size={48} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">{card.title}</div>
                    <div className="mt-0.5 text-[11px] opacity-70">{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
