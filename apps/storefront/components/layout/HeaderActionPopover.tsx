"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

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

/* Shared trigger-anchored popover with smooth animations.
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
  const badgeColor = badgeTone === "error" ? "bg-error" : "bg-brand";

  return (
    <div ref={ref} className="relative inline-flex shrink-0 items-center justify-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-all duration-200",
          open 
            ? "bg-brand-muted/10 text-brand border border-brand/20 shadow-sm" 
            : "hover:bg-brand/5 hover:text-brand border border-transparent hover:border-border hover:shadow-sm"
        )}
      >
        {triggerContent}
        {typeof badgeCount === "number" && badgeCount > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={badgeCount}
            aria-hidden="true"
            className={cn(
              "absolute -end-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface px-1 text-[10px] font-bold text-text-inverse",
              badgeColor,
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </motion.span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile scrim — soft dim + blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[color:rgba(10,19,36,0.45)] sm:hidden"
              onClick={close}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className={cn(
                /* Mobile bottom sheet */
                "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-surface shadow-[0_-8px_30px_rgb(0,0,0,0.12)]",
                /* Desktop anchored popover */
                "sm:absolute sm:inset-auto sm:end-0 sm:top-[calc(100%+0.5rem)] sm:z-50 sm:max-h-[36rem] sm:w-[24rem] sm:rounded-2xl sm:border sm:border-border sm:shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:sm:shadow-[0_12px_40px_rgb(255,255,255,0.04)]",
              )}
            >
              {/* Mobile handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
                <span className="h-1.5 w-12 rounded-full bg-border-strong/50" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface-subtle/50 px-5 py-4">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  {title}
                  {typeof badgeCount === "number" && badgeCount > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                      {badgeCount}
                    </span>
                  ) : null}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
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
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">{children({ close })}</div>

              {/* Footer view-all link */}
              {viewAllHref && viewAllLabel ? (
                <div className="border-t border-border bg-surface-subtle/50 p-4">
                  <Link
                    href={viewAllHref}
                    onClick={close}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
                  >
                    <span>{viewAllLabel}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
