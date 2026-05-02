"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

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

  const isAr = locale === "ar";

  const presets = [
    { lbl: isAr ? "أقل من 1000" : "Under 1,000", lo: 0, hi: 1000 },
    { lbl: "1,000 – 3,000", lo: 1000, hi: 3000 },
    { lbl: "3,000 – 7,000", lo: 3000, hi: 7000 },
    { lbl: isAr ? "أكثر من 7000" : "Over 7,000", lo: 7000, hi: 10000 },
  ];

  const setPreset = (p: (typeof presets)[0]) => {
    setLo(p.lo);
    setHi(p.hi);
    onCommit(p.lo > min ? p.lo : null, p.hi < max ? p.hi : null);
  };

  const isActive = (p: (typeof presets)[0]) => lo === p.lo && hi === p.hi;

  return (
    <div className="flex flex-col gap-6">
      {/* Slider track */}
      <div className="relative mt-2 flex h-5 items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-border" />
        <div
          className="absolute h-1.5 rounded-full bg-brand"
          style={{
            insetInlineStart: `${pctLo}%`,
            width: `${Math.max(0, pctHi - pctLo)}%`,
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
          className="absolute inset-0 h-full w-full appearance-none bg-transparent pointer-events-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-sm"
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
          className="absolute inset-0 h-full w-full appearance-none bg-transparent pointer-events-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>

      {/* Number Inputs */}
      <div className="flex items-center gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{isAr ? "من" : "Min"}</span>
          <div className="relative flex items-center">
            <input
              type="number"
              min={min}
              max={hi - step}
              value={lo}
              onChange={(e) => onLoChange(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pe-10 ps-3 text-[13px] font-medium text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="absolute end-3 text-[11px] font-medium text-text-muted pointer-events-none">{currency}</span>
          </div>
        </label>
        <span className="mt-5 text-border-strong">—</span>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{isAr ? "إلى" : "Max"}</span>
          <div className="relative flex items-center">
            <input
              type="number"
              min={lo + step}
              max={max}
              value={hi}
              onChange={(e) => onHiChange(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pe-10 ps-3 text-[13px] font-medium text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="absolute end-3 text-[11px] font-medium text-text-muted pointer-events-none">{currency}</span>
          </div>
        </label>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors motion-safe:active:scale-[0.98]",
              isActive(p)
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary"
            )}
            onClick={() => setPreset(p)}
          >
            {p.lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
