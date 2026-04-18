"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

interface RecommendationsCarouselProps {
  title: string;
  subtitle?: string;
  /** Pre-rendered cards (server-rendered ProductCards). */
  children: ReactNode[];
}

export default function RecommendationsCarousel({
  title,
  subtitle,
  children,
}: RecommendationsCarouselProps) {
  const locale = useLocale();
  const t = useTranslations("products.detail");
  const isRtl = locale === "ar";
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateAffordances = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // For RTL, scrollLeft is negative or reversed depending on engine.
    // We use a tolerant check: prev/next based on absolute scroll vs end.
    const max = el.scrollWidth - el.clientWidth;
    const x = Math.abs(el.scrollLeft);
    setCanPrev(x > 4);
    setCanNext(x < max - 4);
  }, []);

  useEffect(() => {
    updateAffordances();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateAffordances, { passive: true });
    window.addEventListener("resize", updateAffordances);
    return () => {
      el.removeEventListener("scroll", updateAffordances);
      window.removeEventListener("resize", updateAffordances);
    };
  }, [updateAffordances]);

  function scrollByCards(direction: "prev" | "next") {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll roughly one viewport width worth of cards
    const delta = el.clientWidth * 0.85;
    const sign = direction === "next" ? 1 : -1;
    // In RTL, negative deltaX scrolls toward the right (visually "next" is leftward).
    const dx = isRtl ? -sign * delta : sign * delta;
    el.scrollBy({ left: dx, behavior: "smooth" });
  }

  if (children.length === 0) return null;

  return (
    <section className="border-t border-border pt-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          ) : null}
        </div>

        {/* Arrow controls (desktop) */}
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByCards("prev")}
            disabled={!canPrev}
            aria-label={t("carouselPrev")}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text-primary shadow-sm transition-all hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByCards("next")}
            disabled={!canNext}
            aria-label={t("carouselNext")}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text-primary shadow-sm transition-all hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children.map((card, idx) => (
          <div
            key={idx}
            className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[32%] lg:w-[24%]"
          >
            {card}
          </div>
        ))}
      </div>
    </section>
  );
}
