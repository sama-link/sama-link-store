"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ExpandingBadgeProps {
  icon: ReactNode;
  label: string;
  /** Tailwind classes for the colour scheme — applied to root.
   *  Examples: "bg-success-muted text-success" or "bg-accent-muted text-brand"
   */
  tone: string;
}

/**
 * Compact pill that displays as icon-only by default and expands to reveal
 * the text on hover OR keyboard focus. Tap on touch devices fires :hover
 * via tap-and-hold; for explicit reveal we expose tabIndex so users can
 * tab/focus to expand (also covers a11y).
 */
export default function ExpandingBadge({
  icon,
  label,
  tone,
}: ExpandingBadgeProps) {
  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={label}
      className={cn(
        "group/badge inline-flex h-8 items-center overflow-hidden rounded-full",
        "transition-all duration-300 ease-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
        tone,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span
        className={cn(
          "max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium",
          "transition-[max-width,padding] duration-300 ease-out",
          "group-hover/badge:max-w-[14rem] group-hover/badge:pe-3",
          "group-focus-within/badge:max-w-[14rem] group-focus-within/badge:pe-3",
        )}
      >
        {label}
      </span>
    </div>
  );
}
