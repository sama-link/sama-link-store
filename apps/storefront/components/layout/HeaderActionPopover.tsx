"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

interface Props {
  /** aria-label for the trigger button. */
  triggerLabel: string;
  /** Icon (+ optional inline badge) rendered inside the trigger. */
  triggerContent: ReactNode;
  /** Numeric badge shown at the corner of the trigger. */
  badgeCount?: number;
  /** Human title shown at the top of the panel. */
  title: string;
  /** Render function — receives close() so children can dismiss after actions. */
  children: (opts: { close: () => void }) => ReactNode;
  /** Footer "View all" link (href + label). */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Badge tone (used for the corner badge color). Defaults to brand. */
  badgeTone?: "brand" | "error";
}

/* Shared trigger-anchored popover.
   Desktop ≥ sm: absolute panel anchored below the trigger (end-aligned).
   Mobile < sm: scrim + bottom sheet. Same content tree. */
export default function HeaderActionPopover({
  triggerLabel,
  triggerContent,
  badgeCount,
  title,
  children,
  viewAllHref,
  viewAllLabel,
  badgeTone = "brand",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Lock body scroll only on mobile sheet mode. */
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);
  const badgeColor =
    badgeTone === "error" ? "bg-error" : "bg-brand";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary sm:h-10 sm:w-10"
      >
        {triggerContent}
        {typeof badgeCount === "number" && badgeCount > 0 ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute end-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-text-inverse sm:end-1.5 sm:top-1.5",
              badgeColor,
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* Mobile scrim — soft dim + blur */}
          <div
            className="fixed inset-0 z-40 bg-[color:rgba(10,19,36,0.28)] backdrop-blur-sm sm:hidden"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              /* Mobile bottom sheet */
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-surface",
              /* Desktop anchored popover */
              "sm:absolute sm:inset-auto sm:end-0 sm:top-full sm:z-50 sm:mt-2 sm:max-h-[34rem] sm:w-[22rem] sm:rounded-xl sm:border sm:border-border",
            )}
          >
            {/* Mobile handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {title}
                {typeof badgeCount === "number" && badgeCount > 0 ? (
                  <span className="ms-2 text-xs font-normal text-text-muted">
                    ({badgeCount})
                  </span>
                ) : null}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{children({ close })}</div>

            {/* Footer view-all link */}
            {viewAllHref && viewAllLabel ? (
              <div className="border-t border-border bg-surface-subtle p-3">
                <Link
                  href={viewAllHref}
                  onClick={close}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
                >
                  <span>{viewAllLabel}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 rtl:-scale-x-100"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
