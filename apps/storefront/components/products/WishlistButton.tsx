"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { WishlistItem } from "@/hooks/useWishlist";
import { useWishlist } from "@/hooks/useWishlist";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

export interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
}

export default function WishlistButton({ item, className }: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const { has, toggle, isHydrated } = useWishlist();
  const [liveMsg, setLiveMsg] = useState("");

  const pressed = has(item.id);

  const announce = useCallback(
    (msg: string) => {
      setLiveMsg("");
      requestAnimationFrame(() => setLiveMsg(msg));
    },
    [],
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(item);
      announce(pressed ? t("removedAria") : t("addedAria"));
    },
    [announce, item, pressed, t, toggle],
  );

  return (
    <span className={cn("relative inline-flex", className)}>
      <span className="sr-only" aria-live="polite">
        {liveMsg}
      </span>
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
        <HeartIcon filled={pressed} />
      </button>
    </span>
  );
}
