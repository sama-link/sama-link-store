import { getLocale, getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";

/* A small curated icon map for common Sama Link categories.
   Unknown handles fall back to a generic "box" glyph — never a broken state. */
type IconName =
  | "router"
  | "cctv"
  | "video"
  | "battery"
  | "battery-charging"
  | "plug"
  | "cable"
  | "shield"
  | "server"
  | "laptop"
  | "volume"
  | "wrench"
  | "wifi"
  | "box";

const HANDLE_ICONS: Record<string, IconName> = {
  networking: "wifi",
  "wi-fi": "wifi",
  wifi: "wifi",
  surveillance: "cctv",
  cameras: "cctv",
  cctv: "cctv",
  power: "battery-charging",
  ups: "battery-charging",
  "power-solutions": "battery-charging",
  "smart-home": "plug",
  smart: "plug",
  accessories: "wrench",
  "network-accessories": "wrench",
  "net-acc": "wrench",
  cables: "cable",
  cabling: "cable",
  kits: "shield",
  racks: "server",
  rack: "server",
  laptop: "laptop",
  laptops: "laptop",
  "laptops-workstations": "laptop",
  sound: "volume",
  audio: "volume",
};

function guessIcon(handle: string | null | undefined, title: string): IconName {
  if (handle && HANDLE_ICONS[handle]) return HANDLE_ICONS[handle];
  const lower = (title ?? "").toLowerCase();
  for (const key in HANDLE_ICONS) {
    if (lower.includes(key)) return HANDLE_ICONS[key];
  }
  return "box";
}

function TileIcon({ name }: { name: IconName }) {
  const common = "h-5 w-5";
  switch (name) {
    case "router":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M7 18h.01M11 18h.01M15 18h.01" />
          <path d="M12 9v3" />
          <path d="M8 7c1-1 2.5-1.5 4-1.5S15 6 16 7" />
          <path d="M5 4c2-2 4-3 7-3s5 1 7 3" />
        </svg>
      );
    case "cctv":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h14l2 4h-5l-2 4H5z" />
          <line x1="5" y1="14" x2="5" y2="20" />
          <line x1="7" y1="20" x2="3" y2="20" />
        </svg>
      );
    case "video":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case "battery":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="8" width="16" height="8" rx="1.5" />
          <line x1="21" y1="11" x2="21" y2="13" />
        </svg>
      );
    case "battery-charging":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
          <path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h7" />
          <path d="m11 7-3 5h4l-3 5" />
          <line x1="22" y1="11" x2="22" y2="13" />
        </svg>
      );
    case "plug":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 4v4M15 4v4" />
          <path d="M7 8h10v4a5 5 0 0 1-10 0z" />
          <path d="M12 17v4" />
        </svg>
      );
    case "cable":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20c4 0 8-4 8-8V4" />
          <path d="M12 4h4v4h-4z" />
          <path d="M20 4v8c0 4-4 8-8 8" />
        </svg>
      );
    case "shield":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
        </svg>
      );
    case "server":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="7" rx="1.5" />
          <rect x="3" y="14" width="18" height="7" rx="1.5" />
          <line x1="7" y1="6.5" x2="7.01" y2="6.5" />
          <line x1="7" y1="17.5" x2="7.01" y2="17.5" />
        </svg>
      );
    case "laptop":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4h18v12H3z" />
          <path d="M2 20h20" />
        </svg>
      );
    case "volume":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    case "wrench":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "wifi":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      );
    case "box":
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l9 5v8l-9 5-9-5V8z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      );
  }
}

export interface CategoryTile {
  id: string;
  title: string;
  href: string;
  handle: string | null;
  count?: number;
}

interface Props {
  tiles: CategoryTile[];
}

/* Static fallback set — used when the backend hasn't been seeded with
   collections yet. Mirrors the design prototype's 8-up category strip
   (cameras, networking, cables, racks, UPS, laptops, sound, accessories)
   so the section never renders empty. Localised inline like the hero
   slides — keeps the i18n surface lean for content tied to the visual. */
const FALLBACK_CATEGORIES: ReadonlyArray<{
  id: string;
  en: string;
  ar: string;
  icon: IconName;
  count: number;
}> = [
  { id: "cameras",    en: "Cameras",             ar: "كاميرات",          icon: "video",            count: 142 },
  { id: "networking", en: "Networking",          ar: "شبكات",            icon: "wifi",             count: 168 },
  { id: "cables",     en: "Cables",              ar: "كابلات",           icon: "cable",            count: 96  },
  { id: "racks",      en: "Racks",               ar: "راكات",            icon: "server",           count: 38  },
  { id: "ups",        en: "UPS",                 ar: "UPS",              icon: "battery-charging", count: 47  },
  { id: "laptops",    en: "Laptops",             ar: "لاب توب",          icon: "laptop",           count: 84  },
  { id: "sound",      en: "Sound Systems",       ar: "ساوند سيستم",      icon: "volume",           count: 54  },
  { id: "net-acc",    en: "Network Accessories", ar: "إكسسوارات شبكات", icon: "wrench",           count: 124 },
];

interface DisplayTile extends CategoryTile {
  iconOverride?: IconName;
}

/* ADR-045 flat refresh — Category tiles:
   8-up grid on desktop (matches the design prototype), 4-up on tablet,
   3-up on mobile. Renders backend collections when present; otherwise
   falls back to a static prototype-aligned set so the section never
   disappears. */
export default async function CategoryTiles({ tiles }: Props) {
  const t = await getTranslations("home");
  const tItems = await getTranslations("home.sections.categories");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const display: DisplayTile[] =
    tiles.length > 0
      ? tiles
      : FALLBACK_CATEGORIES.map((c) => ({
          id: c.id,
          title: isAr ? c.ar : c.en,
          handle: c.id,
          /* `id` here is the prototype handle (e.g. cameras) — link to collection when DB is empty. */
          href: `/${locale}/collections/${encodeURIComponent(c.id)}`,
          count: c.count,
          iconOverride: c.icon,
        }));

  return (
    <section className="border-b border-border bg-surface">
      <Container className="flex w-full flex-col py-14">
        {/* Title row: logical start (يسار في LTR / يمين في RTL). صف البلاطات تحته يبقى في المنتصف. */}
        <div className="mb-8 flex w-full flex-col gap-3 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-x-8">
          <div className="min-w-0 max-w-3xl text-start">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {tItems("eyebrow")}
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
              {tItems("title")}
            </h2>
          </div>
          <a
            href={`/${locale}/collections`}
            className="inline-flex shrink-0 self-start text-sm font-semibold text-brand transition-colors hover:text-brand-hover sm:pt-1"
          >
            {t("viewAll")} <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
          </a>
        </div>

        <ul className="flex w-full flex-wrap justify-center gap-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:pb-4 sm:justify-center sm:overflow-visible sm:pb-0">
          {display.map((tile) => (
            <li key={tile.id} className="w-[130px] shrink-0 snap-start max-sm:snap-start">
              <a
                href={tile.href}
                className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-[18px] text-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand hover:shadow-md motion-safe:active:scale-[0.96] active:translate-y-0 active:shadow-sm"
              >
                <span className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-accent-muted text-brand transition-colors group-hover:bg-brand group-hover:text-text-inverse">
                  <TileIcon name={tile.iconOverride ?? guessIcon(tile.handle, tile.title)} />
                </span>
                <span className="text-sm font-semibold leading-tight text-text-primary">
                  {tile.title}
                </span>
                {typeof tile.count === "number" && tile.count > 0 ? (
                  <span className="text-xs text-text-secondary mt-0.5">
                    {tItems("items", { count: tile.count })}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
