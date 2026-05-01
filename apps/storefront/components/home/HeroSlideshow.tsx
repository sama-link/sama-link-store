"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* Slide payload — already localized server-side. */
export interface HeroChip {
  label: string;
  ic: IconName;
}
export interface HeroFloat {
  label: string;
  ic: IconName;
}
export interface HeroSlide {
  id: string;
  /** Primary CTA — category-aware when passed from the home page. */
  primaryHref: string;
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  image: string;
  imageAlt: string;
  bgLight: string;
  accentLight: string;
  bgDark: string;
  accentDark: string;
  chips: HeroChip[];
  floats: HeroFloat[];
}

export interface HeroSlideshowProps {
  slides: HeroSlide[];
  isAr: boolean;
  collectionsHref: string;
  collectionsLabel: string;
  prevLabel: string;
  nextLabel: string;
  /** Pre-computed accessible labels for each rail tab (server-rendered for serialization). */
  slideLabels: string[];
}

const ROTATE_MS = 6000;

/* ─────────────────────────────────────────────────────────────
   Icons — Lucide-style inline SVGs (only the set the hero uses).
   Single shared wrapper, just supply the inner geometry per icon.
   ───────────────────────────────────────────────────────────── */
export type IconName =
  | "zap"
  | "activity"
  | "shield-check"
  | "video"
  | "moon"
  | "cloud"
  | "box"
  | "wrench"
  | "truck"
  | "wifi"
  | "package"
  | "palette"
  | "check-circle-2"
  | "cpu"
  | "eye"
  | "plug"
  | "battery-charging"
  | "thermometer"
  | "lock"
  | "signal"
  | "users"
  | "monitor"
  | "battery";

function Ic({ name, size = 14 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "zap":
      return (
        <svg {...common}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "shield-check":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 14.9" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "wifi":
      return (
        <svg {...common}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      );
    case "package":
      return (
        <svg {...common}>
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "palette":
      return (
        <svg {...common}>
          <circle cx="13.5" cy="6.5" r=".5" />
          <circle cx="17.5" cy="10.5" r=".5" />
          <circle cx="8.5" cy="7.5" r=".5" />
          <circle cx="6.5" cy="12.5" r=".5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    case "check-circle-2":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "cpu":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3" />
          <path d="M15 1v3" />
          <path d="M9 20v3" />
          <path d="M15 20v3" />
          <path d="M20 9h3" />
          <path d="M20 14h3" />
          <path d="M1 9h3" />
          <path d="M1 14h3" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "plug":
      return (
        <svg {...common}>
          <path d="M12 22v-5" />
          <path d="M9 8V2" />
          <path d="M15 8V2" />
          <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" />
        </svg>
      );
    case "battery-charging":
      return (
        <svg {...common}>
          <path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
          <path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h7" />
          <path d="m11 7-3 5h4l-3 5" />
          <line x1="22" y1="11" x2="22" y2="13" />
        </svg>
      );
    case "thermometer":
      return (
        <svg {...common}>
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "signal":
      return (
        <svg {...common}>
          <path d="M2 20h.01" />
          <path d="M7 20v-4" />
          <path d="M12 20v-8" />
          <path d="M17 20V8" />
          <path d="M22 4v16" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...common}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "battery":
      return (
        <svg {...common}>
          <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
          <line x1="23" y1="13" x2="23" y2="11" />
        </svg>
      );
  }
}

export default function HeroSlideshow({
  slides,
  isAr,
  collectionsHref,
  collectionsLabel,
  prevLabel,
  nextLabel,
  slideLabels,
}: HeroSlideshowProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const go = (i: number) =>
    setActive(((i % slides.length) + slides.length) % slides.length);

  useEffect(() => {
    const emitRingSnapshot = (trigger: string) => {
      const root = document.documentElement;
      const activeSlide = document.querySelector<HTMLElement>(".hero-pro-slide.is-active");
      const rings = Array.from(
        activeSlide?.querySelectorAll<HTMLElement>(".hero-pro-rings .ring") ?? [],
      );
      const ring = rings[0] ?? null;
      const slideStyle = activeSlide ? window.getComputedStyle(activeSlide) : null;
      const ringStyle = ring ? window.getComputedStyle(ring) : null;

      // #region agent log
      fetch("http://127.0.0.1:7416/ingest/257a44d6-ca25-426f-8206-e2a734edec52", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "776254",
        },
        body: JSON.stringify({
          sessionId: "776254",
          runId: "initial",
          hypothesisId: "H1,H2,H3,H4,H5",
          location: "apps/storefront/components/home/HeroSlideshow.tsx:ring-snapshot",
          message: "Hero ring computed style snapshot",
          data: {
            trigger,
            active,
            activeSlideId: activeSlide?.dataset.slide ?? null,
            htmlClassName: root.className,
            htmlHasDarkClass: root.classList.contains("dark"),
            ringCount: rings.length,
            slideRingVariable: slideStyle?.getPropertyValue("--slide-ring-color").trim() ?? null,
            ringBorderTopColor: ringStyle?.borderTopColor ?? null,
            ringBorderTopWidth: ringStyle?.borderTopWidth ?? null,
            ringOpacity: ringStyle?.opacity ?? null,
            ringDisplay: ringStyle?.display ?? null,
            ringZIndex: ringStyle?.zIndex ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      // #region agent log
      console.info("agent-debug-776254-hero-rings", {
        sessionId: "776254",
        runId: "browser-console-fallback",
        hypothesisId: "H1,H2,H3,H4,H5,H6,H7",
        location: "apps/storefront/components/home/HeroSlideshow.tsx:ring-snapshot",
        message: "Hero ring computed style snapshot",
        data: {
          trigger,
          active,
          activeSlideId: activeSlide?.dataset.slide ?? null,
          htmlClassName: root.className,
          htmlHasDarkClass: root.classList.contains("dark"),
          ringCount: rings.length,
          slideRingVariable: slideStyle?.getPropertyValue("--slide-ring-color").trim() ?? null,
          ringBorderTopColor: ringStyle?.borderTopColor ?? null,
          ringBorderTopWidth: ringStyle?.borderTopWidth ?? null,
          ringOpacity: ringStyle?.opacity ?? null,
          ringDisplay: ringStyle?.display ?? null,
          ringZIndex: ringStyle?.zIndex ?? null,
        },
        timestamp: Date.now(),
      });
      // #endregion
    };

    emitRingSnapshot("mount-or-active-change");

    const observer = new MutationObserver(() => {
      emitRingSnapshot("html-class-change");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [active]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      go(active + (isAr ? -1 : 1));
    } else if (isRightSwipe) {
      go(active + (isAr ? 1 : -1));
    }
  };

  /* Inline arrows — minimal chevron, no border/background. */
  const Chevron = ({ dir }: { dir: "prev" | "next" }) => {
    const pointsLeft = dir === (isAr ? "next" : "prev");
    return (
      <svg
        width={28}
        height={28}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {pointsLeft ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    );
  };

  return (
    <section
      className="hero-pro"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      <div className="hero-pro-track">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`hero-pro-slide${i === active ? " is-active" : ""}`}
            data-slide={s.id}
            style={
              {
                "--slide-bg-light": s.bgLight,
                "--slide-accent-light": s.accentLight,
                "--slide-bg-dark": s.bgDark,
                "--slide-accent-dark": s.accentDark,
              } as React.CSSProperties
            }
            aria-hidden={i !== active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
          >
            <div className="hero-pro-bg" />
            <div className="hero-pro-grid" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <span
                  key={k}
                  className="hero-pro-orb"
                  style={{ ["--orb-i" as string]: k } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="hero-pro-inner">
              <div className="hero-pro-text">
                <div className="hero-pro-eyebrow">
                  <span className="dot" aria-hidden="true" />
                  {s.eyebrow}
                </div>
                <h1 className="hero-pro-title">
                  <span className="hero-pro-title-inner">{s.title}</span>
                </h1>
                <p className="hero-pro-sub">{s.sub}</p>
                <div className="hero-pro-cta">
                  <Link className="hero-pro-btn hero-pro-btn-primary" href={s.primaryHref}>
                    {s.cta}
                    <span aria-hidden="true" className="hero-pro-btn-arrow">
                      {isAr ? "←" : "→"}
                    </span>
                  </Link>
                  <Link className="hero-pro-btn hero-pro-btn-ghost" href={collectionsHref}>
                    {collectionsLabel}
                  </Link>
                </div>
                <div className="hero-pro-chips">
                  {s.chips.map((c, k) => (
                    <span key={k} className="hero-pro-chip">
                      <Ic name={c.ic} size={13} />
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hero-pro-visual" aria-hidden="true">
                <div className="hero-pro-product">
                  <div className="hero-pro-product-glow" />
                  <div className="hero-pro-rings">
                    <span className="ring r1" />
                    <span className="ring r2" />
                    <span className="ring r3" />
                  </div>
                  <div className="hero-pro-product-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt={s.imageAlt} loading="eager" />
                    {/* Shine sweep — masked to the product PNG so it only paints
                        on the product, never on the gradient background. */}
                    <span
                      className="hero-pro-product-shine"
                      style={{ ["--shine-mask" as string]: `url(${s.image})` } as React.CSSProperties}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="hero-pro-floating">
                    {s.floats.map((f, k) => (
                      <span key={k} className={`float-card f${k + 1}`}>
                        <Ic name={f.ic} size={14} />
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          className="hero-pro-side hero-pro-side-prev"
          onClick={() => go(active - 1)}
          aria-label={prevLabel}
          type="button"
        >
          <Chevron dir="prev" />
        </button>
        <button
          className="hero-pro-side hero-pro-side-next"
          onClick={() => go(active + 1)}
          aria-label={nextLabel}
          type="button"
        >
          <Chevron dir="next" />
        </button>
      </div>

      {/* Progress rail — full-width strip BELOW the hero track (sibling, not
          inside the slide), so it sits between the hero and whatever follows. */}
      <div className="hero-pro-rail" role="tablist">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={slideLabels[i]}
            className={`hero-pro-rail-seg${i === active ? " is-active" : ""}${
              i < active ? " is-past" : ""
            }`}
            onClick={() => go(i)}
          >
            <span
              className="rail-fill"
              style={{
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
