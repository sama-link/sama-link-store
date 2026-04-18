"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { CompareItem } from "@/hooks/useCompare";
import { COMPARE_MAX_ITEMS, useCompare } from "@/hooks/useCompare";

function CompareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="6" height="16" rx="1" />
      <rect x="14" y="4" width="6" height="16" rx="1" />
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
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle text-text-secondary transition-colors",
          "hover:border-brand hover:bg-surface-raised hover:text-brand",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          pressed && "border-brand bg-brand/10 text-brand",
        )}
      >
        <CompareIcon />
      </button>
    </span>
  );
}
