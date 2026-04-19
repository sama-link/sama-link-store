"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { CompareItem } from "@/hooks/useCompare";
import { COMPARE_MAX_ITEMS, useCompare } from "@/hooks/useCompare";

function CompareIcon() {
  /* Two opposing arrows — reads as "compare side-by-side" cleaner than a 2-rect glyph. */
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] transition-transform duration-200 group-hover:rotate-[8deg]"
      aria-hidden="true"
    >
      <path d="M3 7h12a4 4 0 0 1 4 4v2" />
      <polyline points="7 3 3 7 7 11" />
      <path d="M21 17H9a4 4 0 0 1-4-4v-2" />
      <polyline points="17 21 21 17 17 13" />
    </svg>
  );
}

export interface CompareButtonProps {
  item: CompareItem;
  className?: string;
}

export default function CompareButton({ item, className }: CompareButtonProps) {
  const t = useTranslations("compare");
  const { has, toggle, isHydrated } = useCompare();
  const [liveMsg, setLiveMsg] = useState("");
  const [fullHint, setFullHint] = useState(false);

  const pressed = has(item.id);

  const announce = useCallback((msg: string) => {
    setLiveMsg("");
    requestAnimationFrame(() => setLiveMsg(msg));
  }, []);

  useEffect(() => {
    if (!fullHint) return;
    const id = window.setTimeout(() => setFullHint(false), 4000);
    return () => window.clearTimeout(id);
  }, [fullHint]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const result = toggle(item);
      if (!result.ok && result.reason === "full") {
        setFullHint(true);
        return;
      }
      announce(pressed ? t("removedAria") : t("addedAria"));
    },
    [announce, item, pressed, t, toggle],
  );

  return (
    <span className={cn("relative inline-flex flex-col items-center", className)}>
      <span className="sr-only" aria-live="polite">
        {liveMsg}
      </span>
      {fullHint ? (
        <span
          role="status"
          className="absolute -top-1 left-1/2 z-10 w-max max-w-xs -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-2 py-1 text-center text-xs text-text-secondary"
        >
          {t("full", { max: COMPARE_MAX_ITEMS })}
        </span>
      ) : null}
      <button
        type="button"
        aria-pressed={pressed}
        aria-label={pressed ? t("remove") : t("add")}
        title={pressed ? t("remove") : t("add")}
        disabled={!isHydrated}
        onClick={onClick}
        className={cn(
          "group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface/90 text-text-secondary backdrop-blur transition-[background-color,border-color,color,transform] duration-200 active:scale-95",
          "hover:border-brand hover:bg-surface hover:text-brand",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/20",
          pressed && "border-brand bg-brand/10 text-brand",
        )}
      >
        <CompareIcon />
      </button>
    </span>
  );
}
