"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  children: ReactNode;
  /** Delay before the reveal animation starts, in ms. */
  delay?: number;
  /** Translation offset on the y-axis before reveal. */
  offset?: number;
  /** Additional className applied to the wrapper. */
  className?: string;
  /** Disable the observer entirely (e.g. above-the-fold content). */
  disabled?: boolean;
}

/* Fade-up-on-scroll wrapper.

   Renders the children inside a div that starts at opacity-0 + subtle downward
   offset, then transitions to opacity-1 + translate-0 when the div enters the
   viewport. `prefers-reduced-motion` makes it show immediately. */
export default function Reveal({
  children,
  delay = 0,
  offset = 12,
  className,
  disabled = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    /* Respect reduced-motion — show immediately without waiting for scroll. */
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    /* If the element is already in view on mount (SSR-visible content), fire immediately. */
    const rect = node.getBoundingClientRect();
    if (
      rect.top < window.innerHeight * 0.9 &&
      rect.bottom > 0
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled]);

  return (
    <div
      ref={ref}
      style={
        {
          transitionDelay: `${delay}ms`,
          "--reveal-offset": `${offset}px`,
        } as React.CSSProperties
      }
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-[var(--reveal-offset)] opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
