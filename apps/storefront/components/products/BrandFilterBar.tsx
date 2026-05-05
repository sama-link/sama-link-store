"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";
import { FilterBrandOption } from "./FilterSidebar";
import { writeMultiParamToUrl } from "@/lib/catalog-search-params";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from "react";

interface Props {
  brands: FilterBrandOption[];
  activeBrands: string[];
}

function brandInitials(title: string): string {
  const t = title.trim();
  if (!t) return "?";
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const a = words[0]?.[0] ?? "";
    const b = words[1]?.[0] ?? "";
    return (a + b).toUpperCase().slice(0, 2);
  }
  return t.slice(0, 2).toUpperCase();
}

function isLogoPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 16) return false;
  return !(r > 245 && g > 245 && b > 245);
}

const LOGO_HEIGHT = 22;
const MAX_LOGO_WIDTH = 110;
const MIN_LOGO_WIDTH = 48;

function BrandMark({
  logoUrl,
  title,
  selected,
}: {
  logoUrl: string | null | undefined;
  title: string;
  selected: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const [displaySrc, setDisplaySrc] = useState<string | null>(logoUrl ?? null);
  const [logoWidth, setLogoWidth] = useState<number>(96);
  const showImg = Boolean(logoUrl) && !errored;

  useEffect(() => {
    setErrored(false);
    setDisplaySrc(logoUrl ?? null);
    if (!logoUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const fallbackWidth = Math.round(
        (img.naturalWidth / img.naturalHeight) * LOGO_HEIGHT,
      );
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx || canvas.width === 0 || canvas.height === 0) {
          setLogoWidth(Math.max(MIN_LOGO_WIDTH, Math.min(MAX_LOGO_WIDTH, fallbackWidth)));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (isLogoPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < minX || maxY < minY) {
          setLogoWidth(Math.max(MIN_LOGO_WIDTH, Math.min(MAX_LOGO_WIDTH, fallbackWidth)));
          return;
        }

        const cropWidth = maxX - minX + 1;
        const cropHeight = maxY - minY + 1;
        const cropped = document.createElement("canvas");
        cropped.width = cropWidth;
        cropped.height = cropHeight;
        const cctx = cropped.getContext("2d");
        if (!cctx) {
          setLogoWidth(Math.max(MIN_LOGO_WIDTH, Math.min(MAX_LOGO_WIDTH, fallbackWidth)));
          return;
        }
        cctx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        const trimmedRatio = cropWidth / cropHeight;
        const computedWidth = Math.round(trimmedRatio * LOGO_HEIGHT);
        setLogoWidth(Math.max(MIN_LOGO_WIDTH, Math.min(MAX_LOGO_WIDTH, computedWidth)));
        setDisplaySrc(cropped.toDataURL("image/png"));
      } catch {
        setLogoWidth(Math.max(MIN_LOGO_WIDTH, Math.min(MAX_LOGO_WIDTH, fallbackWidth)));
      }
    };
    img.onerror = () => setErrored(true);
    img.src = logoUrl;
  }, [logoUrl]);

  return showImg ? (
    <span
      className="flex items-center justify-center"
      style={{ height: `${LOGO_HEIGHT}px`, width: `${logoWidth}px` }}
    >
      <img
        src={displaySrc ?? logoUrl!}
        alt={title}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (displaySrc !== logoUrl) setDisplaySrc(logoUrl ?? null);
          else setErrored(true);
        }}
        className={cn(
          "h-full w-full object-contain transition-all duration-200",
          selected
            ? "brightness-0 invert"
            : "mix-blend-multiply dark:mix-blend-normal dark:invert"
        )}
      />
    </span>
  ) : (
    <span
      className={cn(
        "select-none px-2 text-[13px] font-bold leading-none tracking-tight",
        selected ? "text-text-inverse" : "text-text-primary",
      )}
      aria-hidden
    >
      {title}
    </span>
  );
}

const CHIP =
  "relative flex shrink-0 items-center justify-center rounded-full will-change-transform " +
  "transition-[transform,box-shadow,border-color,background-color] duration-100 ease-out " +
  "motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function chipSelected(selected: boolean) {
  return selected
    ? "bg-brand text-text-inverse shadow-[0_2px_10px_-2px_rgba(45,108,223,0.35)] ring-2 ring-brand/20"
    : "bg-surface-subtle text-text-secondary hover:bg-surface hover:shadow-sm";
}

export default function BrandFilterBar({ brands, activeBrands }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isRtl = locale.startsWith("ar");
  const t = useTranslations("products.filters");
  const [, startTransition] = useTransition();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [optimisticBrand, setOptimisticBrand] = useState<
    string | null | undefined
  >(undefined);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    const eps = 2;
    if (max <= eps) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }
    if (isRtl) {
      setShowLeftArrow(scrollLeft > -max + eps);
      setShowRightArrow(scrollLeft < -eps);
    } else {
      setShowLeftArrow(scrollLeft > eps);
      setShowRightArrow(scrollLeft < max - eps);
    }
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [brands, isRtl, activeBrands]);

  useEffect(() => {
    if (optimisticBrand === undefined) return;
    const match =
      optimisticBrand === null
        ? activeBrands.length === 0
        : activeBrands[0] === optimisticBrand;
    if (match) setOptimisticBrand(undefined);
  }, [activeBrands, optimisticBrand]);

  const buildBrandHref = useCallback(
    (nextIds: string[]) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.delete("page");
      writeMultiParamToUrl(next, "brand", nextIds.slice(0, 1));
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const prefetchBrandHref = useCallback(
    (nextIds: string[]) => {
      try {
        router.prefetch(buildBrandHref(nextIds));
      } catch {
        /* prefetch is best-effort */
      }
    },
    [router, buildBrandHref],
  );

  if (!brands || brands.length === 0) return null;

  const commitBrands = (nextIds: string[]) => {
    const href = buildBrandHref(nextIds);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const onAllClick = () => {
    setOptimisticBrand(null);
    commitBrands([]);
  };

  const onBrandSelect = (id: string) => {
    const nextIds = activeBrands.includes(id) ? [] : [id];
    setOptimisticBrand(nextIds.length === 0 ? null : nextIds[0]);
    commitBrands(nextIds);
  };

  const displayBrands: string[] =
    optimisticBrand === undefined
      ? activeBrands
      : optimisticBrand === null
        ? []
        : [optimisticBrand];

  const allLabel = t("allCollections") || "All brands";

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const amount = scrollContainerRef.current.clientWidth * 0.75;
    const delta = direction === "left" ? -amount : amount;
    scrollContainerRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  const allSelected = displayBrands.length === 0;

  return (
    <div className="relative flex w-full items-center py-2 sm:py-3 -mx-5 px-5 sm:mx-0 sm:px-0">
      <div
        className={cn(
          "absolute inset-y-0 left-0 z-10 flex w-16 sm:w-24 items-center justify-start bg-gradient-to-r from-surface via-surface/90 to-transparent ps-3 sm:ps-0 transition-opacity duration-300 ease-out motion-reduce:transition-none",
          showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!showLeftArrow}
      >
        <button
          type="button"
          tabIndex={showLeftArrow ? 0 : -1}
          disabled={!showLeftArrow}
          onClick={() => scroll("left")}
          className="flex size-8 items-center justify-center rounded-full border border-border/40 bg-surface/80 backdrop-blur-md text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:scale-105 hover:border-brand/40 hover:text-brand hover:shadow-md motion-safe:active:scale-95 disabled:pointer-events-none"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        dir={isRtl ? "rtl" : "ltr"}
        onScroll={checkScroll}
        className="flex w-full items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        <button
          type="button"
          onClick={onAllClick}
          onMouseEnter={() => prefetchBrandHref([])}
          className={cn(CHIP, "h-11 px-5 gap-2 w-auto", chipSelected(allSelected))}
          aria-label={allLabel}
          title={allLabel}
        >
          <LayoutGrid
            className={cn("size-[18px]", allSelected ? "text-text-inverse" : "text-text-secondary")}
            strokeWidth={2}
            aria-hidden
          />
          <span className={cn("text-[13px] font-bold truncate", allSelected ? "text-text-inverse" : "text-text-primary")}>
            {allLabel}
          </span>
        </button>

        {brands.map((b) => {
          const selected = displayBrands.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onBrandSelect(b.id)}
              onMouseEnter={() => prefetchBrandHref([b.id])}
              className={cn(
                CHIP,
                "h-11 w-auto px-4",
                chipSelected(selected),
              )}
              aria-label={b.title}
              title={b.title}
            >
              <BrandMark logoUrl={b.logoUrl} title={b.title} selected={selected} />
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "absolute inset-y-0 right-0 z-10 flex w-16 sm:w-24 items-center justify-end bg-gradient-to-l from-surface via-surface/90 to-transparent pe-3 sm:pe-0 transition-opacity duration-300 ease-out motion-reduce:transition-none",
          showRightArrow ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!showRightArrow}
      >
        <button
          type="button"
          tabIndex={showRightArrow ? 0 : -1}
          disabled={!showRightArrow}
          onClick={() => scroll("right")}
          className="flex size-8 items-center justify-center rounded-full border border-border/40 bg-surface/80 backdrop-blur-md text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:scale-105 hover:border-brand/40 hover:text-brand hover:shadow-md motion-safe:active:scale-95 disabled:pointer-events-none"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
