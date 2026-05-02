"use client";

import { useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useLocale, useTranslations } from "next-intl";

export interface MegaMenuCategory {
  id: string;
  name: string;
}

interface MegaMenuButtonProps {
  /* Backend-fetched flat categories — used as a hint for routing the
     "Browse all" links. The mega menu's structure itself comes from a
     prototype-aligned hierarchy below so the UX matches the reference
     design even before the backend is fully seeded. */
  categories: MegaMenuCategory[];
}

/* ─────────────────────────────────────────────────────────────
   Hierarchical category data — mirrors the design prototype.
   Used for the full-width mega-menu's left sidebar + right grid.
   Localised inline; routing falls back to /products?category= for
   parents and /products for sub-categories until handles are wired. */
export type IconName =
  | "video" | "wifi" | "cable" | "server" | "battery-charging"
  | "laptop" | "volume" | "wrench" | "cctv" | "hard-drive"
  | "clock" | "database" | "router" | "cpu" | "phone"
  | "zap" | "radio" | "archive" | "plug" | "battery"
  | "activity" | "monitor" | "gamepad" | "mouse" | "audio-lines"
  | "sliders" | "mic" | "megaphone" | "hammer" | "layers" | "square"
  | "box";

export interface RawCat {
  id: string;
  en: string;
  ar: string;
  icon: IconName;
  count?: number;
  children: ReadonlyArray<{ id: string; en: string; ar: string; icon: IconName }>;
}

export const CATEGORIES: ReadonlyArray<RawCat> = [
  {
    id: "cameras", en: "Cameras", ar: "كاميرات", icon: "video", count: 142,
    children: [
      { id: "ip-cam",     en: "IP Cameras",          ar: "كاميرات IP",         icon: "cctv" },
      { id: "wifi-cam",   en: "Wi-Fi Cameras",       ar: "كاميرات واي فاي",     icon: "wifi" },
      { id: "dvr",        en: "DVR Recorders",       ar: "مسجلات DVR",          icon: "hard-drive" },
      { id: "nvr",        en: "NVR Recorders",       ar: "مسجلات NVR",          icon: "hard-drive" },
      { id: "cameras",    en: "Cameras & Recorders", ar: "كاميرات ومسجلات",    icon: "video" },
      { id: "attendance", en: "Time & Attendance",   ar: "حضور وانصراف",       icon: "clock" },
      { id: "storage",    en: "Storage & Control",   ar: "تخزين وتحكم",        icon: "database" },
      { id: "cam-acc",    en: "Camera Accessories",  ar: "ملحقات كاميرات",     icon: "cable" },
    ],
  },
  {
    id: "networking", en: "Networking", ar: "شبكات", icon: "wifi", count: 168,
    children: [
      { id: "devices",    en: "Routers & Switches", ar: "راوترات وسويتشات", icon: "router" },
      { id: "sfp",        en: "SFP Modules",         ar: "وحدات SFP",         icon: "cpu" },
      { id: "networking", en: "Access Points",       ar: "نقاط وصول",         icon: "wifi" },
      { id: "pbx",        en: "PBX Systems",         ar: "سنترالات",          icon: "phone" },
    ],
  },
  {
    id: "cables", en: "Cables", ar: "كابلات", icon: "cable", count: 96,
    children: [
      { id: "copper",    en: "Copper Cables",      ar: "كابلات نحاسية", icon: "zap" },
      { id: "fiber",     en: "Fiber Optic Cables", ar: "كابلات فايبر",  icon: "radio" },
      { id: "cable-acc", en: "Patch Cords",        ar: "باتش كوردز",    icon: "cable" },
    ],
  },
  {
    id: "racks", en: "Racks", ar: "راكات", icon: "server", count: 38,
    children: [
      { id: "cabinets",    en: "Server Cabinets",     ar: "كبائن سيرفر",     icon: "server" },
      { id: "wall-rack",   en: "Wall-Mount Racks",    ar: "راكات حائط",      icon: "archive" },
      { id: "cabinet-acc", en: "Cabinet Accessories", ar: "ملحقات الكابينت", icon: "archive" },
      { id: "pdu",         en: "PDU Bars",            ar: "موزعات PDU",      icon: "plug" },
    ],
  },
  {
    id: "ups", en: "UPS", ar: "UPS", icon: "battery-charging", count: 47,
    children: [
      { id: "ups",         en: "UPS Units",           ar: "وحدات UPS",       icon: "battery" },
      { id: "batteries",   en: "Replacement Batteries", ar: "بطاريات بديلة", icon: "battery" },
      { id: "power-strip", en: "Power Strips",        ar: "موزعات طاقة",    icon: "plug" },
      { id: "avr",         en: "Voltage Regulators",  ar: "منظمات جهد",      icon: "activity" },
    ],
  },
  {
    id: "laptops", en: "Laptops", ar: "لاب توب", icon: "laptop", count: 84,
    children: [
      { id: "laptop",      en: "Business Laptops",   ar: "لاب توب أعمال",  icon: "laptop" },
      { id: "workstation", en: "Workstations",       ar: "محطات عمل",      icon: "monitor" },
      { id: "gaming",      en: "Gaming Laptops",     ar: "لاب توب جيمنج",  icon: "gamepad" },
      { id: "laptop-acc",  en: "Laptop Accessories", ar: "ملحقات لاب توب", icon: "mouse" },
    ],
  },
  {
    id: "sound", en: "Sound Systems", ar: "ساوند سيستم", icon: "volume", count: 54,
    children: [
      { id: "speakers",    en: "Speakers",     ar: "سماعات",       icon: "volume" },
      { id: "amplifiers",  en: "Amplifiers",   ar: "مكبرات صوت",   icon: "audio-lines" },
      { id: "mixers",      en: "Audio Mixers", ar: "مكسرات صوت",   icon: "sliders" },
      { id: "microphones", en: "Microphones",  ar: "ميكروفونات",   icon: "mic" },
      { id: "pa-systems",  en: "PA Systems",   ar: "أنظمة بي إيه", icon: "megaphone" },
    ],
  },
  {
    id: "net-acc", en: "Network Accessories", ar: "إكسسوارات شبكات", icon: "wrench", count: 124,
    children: [
      { id: "assembly-tools", en: "Assembly Tools",     ar: "أدوات تجميع",       icon: "wrench" },
      { id: "install-tools",  en: "Installation Tools", ar: "أدوات التركيب",     icon: "hammer" },
      { id: "connectors",     en: "Connectors & Jacks", ar: "موصلات وجاكات",     icon: "plug" },
      { id: "patch-panels",   en: "Patch Panels",       ar: "باتش بانلز",        icon: "layers" },
      { id: "face-plates",    en: "Face Plates",        ar: "وجهات حائط",        icon: "square" },
      { id: "testers",        en: "Cable Testers",      ar: "أجهزة فحص كابلات",  icon: "activity" },
    ],
  },
];

/* Compact icon set — Lucide-style. Unknown names fall back to "box". */
export function Ic({ name, size = 16 }: { name: IconName; size?: number }) {
  const c = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.75 as const,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "video":            return (<svg {...c}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>);
    case "wifi":             return (<svg {...c}><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>);
    case "cable":            return (<svg {...c}><path d="M4 20c4 0 8-4 8-8V4" /><path d="M12 4h4v4h-4z" /><path d="M20 4v8c0 4-4 8-8 8" /></svg>);
    case "server":           return (<svg {...c}><rect x="3" y="3" width="18" height="7" rx="1.5" /><rect x="3" y="14" width="18" height="7" rx="1.5" /><line x1="7" y1="6.5" x2="7.01" y2="6.5" /><line x1="7" y1="17.5" x2="7.01" y2="17.5" /></svg>);
    case "battery-charging": return (<svg {...c}><path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" /><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h7" /><path d="m11 7-3 5h4l-3 5" /><line x1="22" y1="11" x2="22" y2="13" /></svg>);
    case "laptop":           return (<svg {...c}><path d="M3 4h18v12H3z" /><path d="M2 20h20" /></svg>);
    case "volume":           return (<svg {...c}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>);
    case "wrench":           return (<svg {...c}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>);
    case "cctv":             return (<svg {...c}><path d="M3 6h14l2 4h-5l-2 4H5z" /><line x1="5" y1="14" x2="5" y2="20" /><line x1="7" y1="20" x2="3" y2="20" /></svg>);
    case "hard-drive":       return (<svg {...c}><line x1="22" y1="12" x2="2" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="16" x2="10.01" y2="16" /></svg>);
    case "clock":            return (<svg {...c}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
    case "database":         return (<svg {...c}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>);
    case "router":           return (<svg {...c}><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 18h.01M11 18h.01M15 18h.01" /><path d="M12 9v3" /><path d="M8 7c1-1 2.5-1.5 4-1.5S15 6 16 7" /></svg>);
    case "cpu":              return (<svg {...c}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></svg>);
    case "phone":            return (<svg {...c}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
    case "zap":              return (<svg {...c}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
    case "radio":            return (<svg {...c}><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>);
    case "archive":          return (<svg {...c}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>);
    case "plug":             return (<svg {...c}><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" /></svg>);
    case "battery":          return (<svg {...c}><rect x="1" y="6" width="18" height="12" rx="2" /><line x1="23" y1="13" x2="23" y2="11" /></svg>);
    case "activity":         return (<svg {...c}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>);
    case "monitor":          return (<svg {...c}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>);
    case "gamepad":          return (<svg {...c}><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" /><rect x="2" y="6" width="20" height="12" rx="2" /></svg>);
    case "mouse":            return (<svg {...c}><rect x="6" y="3" width="12" height="18" rx="6" /><line x1="12" y1="7" x2="12" y2="11" /></svg>);
    case "audio-lines":      return (<svg {...c}><path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" /></svg>);
    case "sliders":          return (<svg {...c}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>);
    case "mic":              return (<svg {...c}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>);
    case "megaphone":        return (<svg {...c}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>);
    case "hammer":           return (<svg {...c}><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" /></svg>);
    case "layers":           return (<svg {...c}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>);
    case "square":           return (<svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>);
    case "box":
    default:                 return (<svg {...c}><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>);
  }
}

const HamburgerIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronEnd = ({ className }: { className?: string }) => (
  /* Logical "end" chevron — points right in LTR, left in RTL via rtl:rotate-180. */
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function MegaMenuButton({ categories: _categories }: MegaMenuButtonProps) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [activeIdx, setActiveIdx] = useState(0);
  const active = CATEGORIES[activeIdx];

  const productsHref = `/${locale}/products`;
  const browseAllHref = `/${locale}/products?category=${active.id}`;

  return (
    <NavigationMenu.Root
      dir={dir}
      aria-label={t("allCategories")}
      className="flex h-full shrink-0"
    >
      <NavigationMenu.List className="m-0 flex h-full list-none items-stretch p-0">
        <NavigationMenu.Item value="mega-categories" className="flex h-full">
          <NavigationMenu.Trigger className="group flex h-full items-center gap-2 self-stretch rounded-none bg-brand px-5 text-sm font-medium text-text-inverse outline-none transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
            <HamburgerIcon className="size-4" />
            <span>{t("allCategories")}</span>
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className="absolute left-0 top-0 w-full">
            <div className="grid w-full grid-cols-[280px_1fr] bg-surface">
              {/* Left sidebar — category list */}
              <ul
                className="flex flex-col border-e border-border bg-surface-subtle py-2"
                onMouseLeave={() => {/* keep last active */}}
              >
                {CATEGORIES.map((c, i) => {
                  const isActive = i === activeIdx;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIdx(i)}
                        onFocus={() => setActiveIdx(i)}
                        className={`flex w-full items-center gap-3 px-5 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset ${
                          isActive
                            ? "border-s-2 border-brand bg-surface text-brand"
                            : "border-s-2 border-transparent text-text-secondary hover:bg-surface hover:text-brand"
                        }`}
                      >
                        <span className={`flex size-5 shrink-0 items-center justify-center ${isActive ? "text-brand" : "text-text-secondary"}`}>
                          <Ic name={c.icon} size={18} />
                        </span>
                        <span className="flex-1 text-start">{isAr ? c.ar : c.en}</span>
                        <ChevronEnd className="size-3.5 shrink-0 text-text-muted rtl:rotate-180" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Right pane — active category's children. No vertical scroll;
                  the grid auto-fills with 240px-wide cells so the columns
                  always distribute evenly across the full screen width. */}
              <div className="relative flex flex-col">
                <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-8 py-5">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {isAr ? active.ar : active.en}
                  </h3>
                  <NavigationMenu.Link
                    href={browseAllHref}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-brand outline-none transition-colors hover:border-brand hover:bg-brand hover:text-text-inverse focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    {t("megaMenu.viewAllProducts")}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100">→</span>
                  </NavigationMenu.Link>
                </div>

                <ul
                  key={active.id}
                  className="grid animate-fade-up gap-1.5 px-6 py-6"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
                >
                  {active.children.map((child) => (
                    <li key={child.id}>
                      <NavigationMenu.Link
                        href={`${productsHref}?category=${encodeURIComponent(child.id)}`}
                        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal text-text-secondary outline-none transition-[background-color,color,transform] duration-200 hover:bg-accent-muted hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-brand transition-colors group-hover:bg-surface group-hover:text-brand">
                          <Ic name={child.icon} size={18} />
                        </span>
                        <span className="flex-1">{isAr ? child.ar : child.en}</span>
                        <span aria-hidden="true" className="opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 rtl:-scale-x-100">
                          <ChevronEnd className="size-3.5 text-brand" />
                        </span>
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      {/* Viewport — full viewport width, anchored at the header's start
          edge. Width = 100% so the panel always spans the entire header,
          even though the trigger sits in a narrow region of the header. */}
      <div className="absolute left-0 top-[100%] isolate z-50 w-full">
        <NavigationMenu.Viewport className="relative h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden border-y border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-[height] duration-300" />
      </div>
    </NavigationMenu.Root>
  );
}
