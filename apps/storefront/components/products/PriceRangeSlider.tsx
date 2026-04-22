"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

interface Props {
  /** Inclusive lower bound of the allowed range. */
  min: number;
  /** Inclusive upper bound of the allowed range. */
  max: number;
  /** Step increment. */
  step?: number;
  /** Current lower selection. Null = use `min`. */
  valueMin: number | null;
  /** Current upper selection. Null = use `max`. */
  valueMax: number | null;
  /** Commit-only callback — fires on pointer release / change-end. */
  onCommit: (lo: number | null, hi: number | null) => void;
  /** Currency label appended to value chips (e.g. "EGP"). */
  currency?: string;
}

/* Dual-handle price slider — modern, compact.
   Values live above the track as a single inline range label (bold numbers,
   subdued separator). Below the track: only a faint range-bounds strip. */
export default function PriceRangeSlider({
  min,
  max,
  step = 50,
  valueMin,
  valueMax,
  onCommit,
  currency = "EGP",
}: Props) {
  const locale = useLocale();
  const [lo, setLo] = useState(valueMin ?? min);
  const [hi, setHi] = useState(valueMax ?? max);

  useEffect(() => {
    setLo(valueMin ?? min);
  }, [valueMin, min]);
  useEffect(() => {
    setHi(valueMax ?? max);
  }, [valueMax, max]);

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  });

  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;

  const onLoChange = (v: string) => {
    const n = Math.min(Number(v), hi - step);
    setLo(Number.isFinite(n) ? Math.max(min, n) : min);
  };
  const onHiChange = (v: string) => {
    const n = Math.max(Number(v), lo + step);
    setHi(Number.isFinite(n) ? Math.min(max, n) : max);
  };

  const commit = () => {
    onCommit(lo > min ? lo : null, hi < max ? hi : null);
  };

  /* Bold inline range label. Order is LTR-friendly and flips gracefully in
     RTL via inline-flex + paragraph direction. */
  const isAr = locale === "ar";
  const formatVal = (n: number) =>
    isAr ? `${nf.format(n)} ${currency}` : `${currency} ${nf.format(n)}`;

  return (
    <div className="space-y-3">
      {/* Inline value label */}
      <div className="flex items-baseline justify-between text-[13px] text-text-secondary">
        <span className="font-semibold tabular-nums text-text-primary">
          {formatVal(lo)}
        </span>
        <span className="mx-2 text-text-muted">—</span>
        <span className="font-semibold tabular-nums text-text-primary">
          {formatVal(hi)}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-1 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-brand transition-[width,left,right] duration-100"
          style={{
            insetInlineStart: `calc(${pctLo}% + 4px)`,
            width: `calc(${Math.max(0, pctHi - pctLo)}% - 8px)`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onLoChange(e.target.value)}
          onMouseUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          aria-label="Min price"
          className="prs-input pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onHiChange(e.target.value)}
          onMouseUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          aria-label="Max price"
          className="prs-input pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent"
        />
      </div>

      {/* Faint range-bounds strip */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted">
        <span>{formatVal(min)}</span>
        <span>{formatVal(max)}</span>
      </div>
    </div>
  );
}
