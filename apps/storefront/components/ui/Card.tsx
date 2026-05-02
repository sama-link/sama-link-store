"use client";

import { cn } from "@/lib/cn";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

/* ─── Card root ─── */

export interface CardProps extends Omit<HTMLMotionProps<"div">, "className"> {
  /**
   * flat    — white with a 1px border (default, good for lists)
   * raised  — white with a shadow (good for featured items)
   * ghost   — transparent, no border (good for grouped sections)
   */
  variant?: "flat" | "raised" | "ghost";
  /** Adds a subtle lift and shadow on hover */
  interactive?: boolean;
  className?: string;
}

/**
 * Composable surface container with smooth hover interactions.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "flat", interactive = false, className, children, ...props },
  ref
) {
  return (
    <motion.div
      ref={ref}
      whileHover={interactive ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-2xl bg-surface overflow-hidden transition-all duration-300",
        variant === "flat" && "border border-border",
        variant === "raised" && "border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]",
        variant === "ghost" && "bg-transparent",
        interactive && variant === "flat" && "hover:border-brand-muted hover:shadow-md",
        interactive && variant === "raised" && "hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgb(255,255,255,0.04)] hover:border-brand-muted/50",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/* ─── Card Header ─── */

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-border bg-surface-subtle/30 px-6 py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Card Body ─── */

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

/* ─── Card Footer ─── */

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-border bg-surface-subtle/30 px-6 py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
