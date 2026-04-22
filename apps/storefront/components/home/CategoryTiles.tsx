import { getLocale, getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";

/* A small curated icon map for common Sama Link categories.
   Unknown handles fall back to a generic "box" glyph — never a broken state. */
type IconName =
  | "router"
  | "cctv"
  | "battery"
  | "plug"
  | "cable"
  | "shield"
  | "box";

const HANDLE_ICONS: Record<string, IconName> = {
  networking: "router",
  "wi-fi": "router",
  wifi: "router",
  surveillance: "cctv",
  cameras: "cctv",
  cctv: "cctv",
  power: "battery",
  ups: "battery",
  "smart-home": "plug",
  smart: "plug",
  accessories: "cable",
  cables: "cable",
  kits: "shield",
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
    case "battery":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="8" width="16" height="8" rx="1.5" />
          <line x1="21" y1="11" x2="21" y2="13" />
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

/* ADR-045 flat refresh — Category tiles:
   6-up grid on desktop, 3-up on tablet, 2-up on mobile.
   Always shows a real icon + count-if-present so the row never looks empty. */
export default async function CategoryTiles({ tiles }: Props) {
  const t = await getTranslations("home");
  const tItems = await getTranslations("home.sections.categories");
  const locale = await getLocale();

  if (tiles.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface">
      <Container className="py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {tItems("eyebrow")}
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
              {tItems("title")}
            </h2>
          </div>
          <a
            href={`/${locale}/collections`}
            className="text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            {t("viewAll")} <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
          </a>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <a
                href={tile.href}
                className="flex h-full flex-col items-center gap-2.5 rounded-xl border border-border bg-surface p-5 text-center transition-colors hover:border-brand"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted text-brand">
                  <TileIcon name={guessIcon(tile.handle, tile.title)} />
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {tile.title}
                </span>
                {typeof tile.count === "number" && tile.count > 0 ? (
                  <span className="text-xs text-text-muted">
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
