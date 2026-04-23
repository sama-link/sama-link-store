"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { WishlistItem } from "@/hooks/useWishlist";
import { cn } from "@/lib/cn";

export interface ProductImage {
  id: string;
  url: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
  alt: string;
  /** When set, wishlist + compare controls render on the active slide (PDP). */
  galleryWishlistItem?: WishlistItem | null;
}

function PlaceholderIcon() {
  return (
    <svg
      className="h-20 w-20 text-text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
      />
    </svg>
  );
}

export default function ProductGallery({
  images,
  alt,
  galleryWishlistItem,
}: ProductGalleryProps) {
  const locale = useLocale();
  const t = useTranslations("products.detail");
  const isRtl = locale === "ar";
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Sync active index from scroll position (handles swipe + native scroll)
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    if (slideWidth === 0) return;
    const idx = Math.round(Math.abs(el.scrollLeft) / slideWidth);
    setActiveIdx(Math.min(Math.max(idx, 0), images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const goTo = useCallback(
    (idx: number) => {
      const el = trackRef.current;
      if (!el) return;
      const clamped = Math.min(Math.max(idx, 0), images.length - 1);
      const target = clamped * el.clientWidth;
      // RTL scrollers: scrollLeft is negative in some engines, positive in others.
      // Using scrollTo with sign-flipped target works for the common (positive) case;
      // for RTL we negate to be safe.
      el.scrollTo({
        left: isRtl ? -target : target,
        behavior: "smooth",
      });
    },
    [images.length, isRtl],
  );

  const next = useCallback(
    () => goTo(activeIdx + 1),
    [activeIdx, goTo],
  );
  const prev = useCallback(
    () => goTo(activeIdx - 1),
    [activeIdx, goTo],
  );

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
        <div className="flex h-full items-center justify-center">
          <PlaceholderIcon />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Slider track */}
      <div className="group relative">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl scroll-smooth"
          aria-roledescription="carousel"
          aria-label={alt}
        >
          {images.map((image: any) => (
            <div
              key={image.id}
              className="relative aspect-square w-full shrink-0 snap-center"
            >
              <Image
                src={image.url}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-contain"
                priority={image.id === images[0]?.id}
              />
            </div>
          ))}
        </div>

        {/* Arrow controls — visible on hover (desktop) */}
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={t("galleryPrev")}
              disabled={activeIdx === 0}
              className="absolute start-3 top-1/2 z-40 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-text-primary shadow-md backdrop-blur transition-all hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-0 group-hover:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("galleryNext")}
              disabled={activeIdx === images.length - 1}
              className="absolute end-3 top-1/2 z-40 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-text-primary shadow-md backdrop-blur transition-all hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-0 group-hover:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Dot indicators (mobile) */}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
              {images.map((image: any, idx: number) => (
                <span
                  key={image.id}
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === activeIdx
                      ? "w-6 bg-brand"
                      : "w-1.5 bg-text-muted/50",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        {/* Wishlist / Compare overlay removed per product direction —
            both actions remain accessible via the header popovers and the
            PurchasePanel (heart beside Add-to-Cart). */}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((image: any, idx: number) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`View image ${idx + 1}`}
              aria-pressed={idx === activeIdx}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                idx === activeIdx
                  ? "border-brand ring-2 ring-brand/20"
                  : "border-border opacity-60 hover:border-border-strong hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="120px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
