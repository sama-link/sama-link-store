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
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
          "group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface/90 text-text-secondary backdrop-blur transition-[background-color,border-color,color,transform] duration-200 active:scale-95",
          "hover:border-error hover:bg-surface hover:text-error",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-error/20",
          pressed && "border-error bg-error/10 text-error",
        )}
      >
        <HeartIcon filled={pressed} />
      </button>
    </span>
  );
}
