import { getLocale, getTranslations } from "next-intl/server";
import HeroSlideshow, { type HeroSlide, type IconName } from "./HeroSlideshow";

/* Inline trust-bar icons — kept in this file so the hero is self-contained. */
function TrustIcon({
  name,
  size = 18,
}: {
  name: "shield" | "truck" | "wallet" | "rotate";
  size?: number;
}) {
  switch (name) {
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case "truck":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="7" width="14" height="10" rx="1" />
          <path d="M15 10h4l3 3v4h-7" />
          <circle cx="6" cy="18" r="1.8" />
          <circle cx="18" cy="18" r="1.8" />
        </svg>
      );
    case "wallet":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <circle cx="17" cy="14" r="1.2" fill="currentColor" />
        </svg>
      );
    case "rotate":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <polyline points="3 4 3 10 9 10" />
        </svg>
      );
  }
}

/* Slide content stays inline as { en, ar } pairs — mirrors the design prototype
   and keeps copy adjacent to the visual definition (gradient, image, accent).
   Trust-bar copy comes from messages/*.json so it tracks the rest of the i18n
   surface. Per-slide aria copy is built in <HeroSlideshow /> from the carousel keys. */

interface RawSlide {
  id: string;
  bgLight: string;
  accentLight: string;
  bgDark: string;
  accentDark: string;
  image: string;
  imageAlt: string;
  eyebrow: { en: string; ar: string };
  title: { en: string; ar: string };
  sub: { en: string; ar: string };
  cta: { en: string; ar: string };
  chips: ReadonlyArray<{ en: string; ar: string; ic: IconName }>;
  floats: ReadonlyArray<{ en: string; ar: string; ic: IconName }>;
}

const RAW_SLIDES: ReadonlyArray<RawSlide> = [
  {
    id: "surveillance",
    bgLight: "linear-gradient(135deg, #f0f8ff 0%, #e0f2fe 50%, #bae6fd 100%)",
    accentLight: "#0284c7",
    bgDark: "linear-gradient(135deg, #1a1a1a 0%, #2c3e50 50%, #0091d6 100%)",
    accentDark: "#0091d6",
    image: "/hero/surveillance.png",
    imageAlt: "IP cameras and NVR",
    eyebrow: { en: "Surveillance · Featured", ar: "المراقبة · مميز" },
    title:   { en: "See every angle,\nday or night.", ar: "شاهد كل زاوية\nليل أو نهار." },
    sub:     { en: "4K IP cameras, NVRs, and complete kits — installed by certified pros.", ar: "كاميرات IP بدقة 4K، NVR، وأنظمة كاملة — تركيب من مهندسين معتمدين." },
    cta:     { en: "Shop cameras", ar: "تسوق الكاميرات" },
    chips: [
      { ic: "video", en: "4K · 30fps", ar: "4K · 30 إطار" },
      { ic: "moon",  en: "Night vision 30m", ar: "رؤية ليلية 30م" },
      { ic: "cloud", en: "24/7 cloud", ar: "سحابة 24/7" },
    ],
    floats: [
      { ic: "eye",   en: "Live view", ar: "عرض مباشر" },
      { ic: "video", en: "Recording", ar: "بيسجّل" },
      { ic: "moon",  en: "Night mode", ar: "وضع ليلي" },
    ],
  },
  {
    id: "ups",
    bgLight: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
    accentLight: "#16a34a",
    bgDark: "linear-gradient(135deg, #0a2818 0%, #14532d 50%, #16a34a 100%)",
    accentDark: "#86efac",
    image: "/hero/ups.png",
    imageAlt: "UPS power unit",
    eyebrow: { en: "Power · Always-on", ar: "الطاقة · دائمًا" },
    title:   { en: "Power that\nnever blinks.", ar: "طاقة لا تنقطع\nأبدًا." },
    sub:     { en: "UPS units & online double-conversion systems for offices, racks, and data rooms.", ar: "وحدات UPS وأنظمة Online double-conversion للمكاتب والراكات وغرف الخوادم." },
    cta:     { en: "Shop UPS", ar: "تسوق UPS" },
    chips: [
      { ic: "zap",          en: "Up to 10 kVA", ar: "حتى 10 ك.ف.أ" },
      { ic: "activity",     en: "Pure sine wave", ar: "موجة جيبية نقية" },
      { ic: "shield-check", en: "3-yr warranty", ar: "ضمان 3 سنين" },
    ],
    floats: [
      { ic: "plug",             en: "Online", ar: "متّصل" },
      { ic: "activity",         en: "99.9% uptime", ar: "تشغيل 99.9%" },
      { ic: "battery-charging", en: "Charged", ar: "مشحون" },
    ],
  },
  {
    id: "racks",
    bgLight: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
    accentLight: "#475569",
    bgDark: "linear-gradient(135deg, #0d1117 0%, #1f2937 60%, #4b5563 100%)",
    accentDark: "#9ca3af",
    image: "/hero/racks.png",
    imageAlt: "Server rack cabinet",
    eyebrow: { en: "Racks · Pro install", ar: "الراكات · تركيب احترافي" },
    title:   { en: "Racked, stacked,\nand ready.", ar: "منظم ومجهز\nللتشغيل." },
    sub:     { en: "Server cabinets, wall-mount racks, and PDU bars — sized for any deployment.", ar: "كبائن سيرفر، راكات حائط، ومنظمات كهرباء — لكل أحجام النشر." },
    cta:     { en: "Shop racks", ar: "تسوق الراكات" },
    chips: [
      { ic: "box",    en: "6U – 42U options", ar: "من 6U إلى 42U" },
      { ic: "wrench", en: "Pro installation", ar: "تركيب احترافي" },
      { ic: "truck",  en: "White-glove delivery", ar: "توصيل وتركيب" },
    ],
    floats: [
      { ic: "thermometer", en: "Cooled", ar: "مبرّد" },
      { ic: "wrench",      en: "Tool-free", ar: "بدون عدد" },
      { ic: "lock",        en: "Locked", ar: "مقفول" },
    ],
  },
  {
    id: "networking",
    bgLight: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
    accentLight: "#ea580c",
    bgDark: "linear-gradient(135deg, #2d1810 0%, #5c2e1f 50%, #c2410c 100%)",
    accentDark: "#fb923c",
    image: "/hero/networking.png",
    imageAlt: "Switches, routers & access points",
    eyebrow: { en: "Networking · Featured", ar: "الشبكات · مميز" },
    title:   { en: "Wi-Fi that\njust works.", ar: "شبكة Wi-Fi\nبدون توقف." },
    sub:     { en: "Mesh systems, switches, routers, and access points from Cisco, MikroTik & Ubiquiti.", ar: "أنظمة Mesh، سويتشات، راوترات، وأكسس بوينت من Cisco و MikroTik و Ubiquiti." },
    cta:     { en: "Shop networking", ar: "تسوق الشبكات" },
    chips: [
      { ic: "wifi",         en: "Wi-Fi 6 · 3 Gbps", ar: "Wi-Fi 6 · 3 جيجا" },
      { ic: "shield-check", en: "2-yr warranty", ar: "ضمان سنتين" },
      { ic: "truck",        en: "Free shipping", ar: "شحن مجاني" },
    ],
    floats: [
      { ic: "wifi",   en: "Wi-Fi 6", ar: "Wi-Fi 6" },
      { ic: "signal", en: "Strong signal", ar: "إشارة قوية" },
      { ic: "users",  en: "500+ devices", ar: "+500 جهاز" },
    ],
  },
  {
    id: "cables",
    bgLight: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)",
    accentLight: "#9333ea",
    bgDark: "linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #6b3fa0 100%)",
    accentDark: "#a78bfa",
    image: "/hero/cables.png",
    imageAlt: "Network cables and patch cords",
    eyebrow: { en: "Cabling · Infrastructure", ar: "الكابلات · البنية التحتية" },
    title:   { en: "Every link,\ncertified.", ar: "كل وصلة،\nمعتمدة." },
    sub:     { en: "Cat6/Cat6A, fiber, patch cords, and bulk reels — TIA-tested and labeled.", ar: "كابلات Cat6/Cat6A، فايبر، باتش كوردز، ورولات — مختبرة TIA ومُعرّفة." },
    cta:     { en: "Shop cabling", ar: "تسوق الكابلات" },
    chips: [
      { ic: "check-circle-2", en: "TIA-certified", ar: "معتمد TIA" },
      { ic: "package",        en: "305m bulk reels", ar: "رولات 305م" },
      { ic: "palette",        en: "8 color options", ar: "8 ألوان" },
    ],
    floats: [
      { ic: "check-circle-2", en: "Certified", ar: "معتمد" },
      { ic: "zap",            en: "10 Gbps", ar: "10 جيجا" },
      { ic: "palette",        en: "8 colors", ar: "8 ألوان" },
    ],
  },
  {
    id: "laptops",
    bgLight: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)",
    accentLight: "#2563eb",
    bgDark: "linear-gradient(135deg, #0f2b4f 0%, #1c3d6b 60%, #2d6cdf 100%)",
    accentDark: "#6eb0e0",
    image: "/hero/laptops.png",
    imageAlt: "Business laptops and workstations",
    eyebrow: { en: "Laptops · Workstations", ar: "لابتوبات · محطات عمل" },
    title:   { en: "Built for the work\nthat matters.", ar: "مصمّم للشغل\nالجاد." },
    sub:     { en: "Business laptops, workstations, and gaming rigs — Dell, Lenovo, HP & Apple.", ar: "لابتوبات أعمال، محطات عمل، وجيمنج — Dell و Lenovo و HP & Apple." },
    cta:     { en: "Shop laptops", ar: "تسوق اللابتوبات" },
    chips: [
      { ic: "cpu",          en: "Intel & AMD", ar: "Intel و AMD" },
      { ic: "shield-check", en: "On-site warranty", ar: "ضمان في الموقع" },
      { ic: "truck",        en: "Same-day in Cairo", ar: "نفس اليوم بالقاهرة" },
    ],
    floats: [
      { ic: "cpu",     en: "Intel Core i7", ar: "معالج i7" },
      { ic: "monitor", en: "14\" OLED", ar: "OLED 14بوصة" },
      { ic: "battery", en: "12h battery", ar: "بطارية 12س" },
    ],
  },
];

/* ADR-045 flat refresh — Hero (Phase 2):
   Six-slide carousel. Primary CTA targets the matching product category when
   the home page passes `heroPrimaryHrefs` (from Medusa category handles). */
export default async function HeroSection({
  heroPrimaryHrefs = {},
}: {
  heroPrimaryHrefs?: Record<string, string>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("home.hero");
  const isAr = locale === "ar";
  const productsHref = `/${locale}/products`;
  const collectionsHref = `/${locale}/collections`;

  const slides: HeroSlide[] = RAW_SLIDES.map((s) => ({
    id: s.id,
    primaryHref: heroPrimaryHrefs[s.id] ?? productsHref,
    bgLight: s.bgLight,
    accentLight: s.accentLight,
    bgDark: s.bgDark,
    accentDark: s.accentDark,
    image: s.image,
    imageAlt: s.imageAlt,
    eyebrow: isAr ? s.eyebrow.ar : s.eyebrow.en,
    title: isAr ? s.title.ar : s.title.en,
    sub: isAr ? s.sub.ar : s.sub.en,
    cta: isAr ? s.cta.ar : s.cta.en,
    chips: s.chips.map((c) => ({ ic: c.ic, label: isAr ? c.ar : c.en })),
    floats: s.floats.map((f) => ({ ic: f.ic, label: isAr ? f.ar : f.en })),
  }));

  const trust = [
    { icon: "shield" as const, title: t("trust.authentic.title"), body: t("trust.authentic.body") },
    { icon: "truck" as const,  title: t("trust.delivery.title"),  body: t("trust.delivery.body") },
    { icon: "wallet" as const, title: t("trust.cod.title"),       body: t("trust.cod.body") },
    { icon: "rotate" as const, title: t("trust.returns.title"),   body: t("trust.returns.body") },
  ];

  return (
    <div className="hero-pro-wrap">
      <HeroSlideshow
        slides={slides}
        isAr={isAr}
        collectionsHref={collectionsHref}
        collectionsLabel={t("ctaCollections")}
        prevLabel={t("carousel.previous")}
        nextLabel={t("carousel.next")}
        slideLabels={slides.map((_, i) => t("carousel.goToSlide", { n: i + 1 }))}
      />
      <div className="hero-pro-trustbar">
        {trust.map((item) => (
          <div key={item.title} className="hero-pro-trust">
            <span className="ic">
              <TrustIcon name={item.icon} size={18} />
            </span>
            <div>
              <b>{item.title}</b>
              <span>{item.body}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
