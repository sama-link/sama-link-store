"use client";

import { cn } from "@/lib/cn";
import Spinner from "./Spinner";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

/* ─── Variant & size maps ─── */

const variantClasses = {
  primary:
    "bg-brand text-text-inverse border border-brand hover:bg-brand-hover hover:border-brand-hover focus-visible:ring-brand shadow-sm hover:shadow-md hover:shadow-brand/20",
  secondary:
    "bg-surface-subtle text-text-primary border border-border hover:bg-surface hover:border-border-strong focus-visible:ring-brand shadow-sm",
  outline:
    "bg-transparent text-brand border border-brand hover:bg-brand hover:text-text-inverse focus-visible:ring-brand",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:bg-surface-subtle hover:text-text-primary focus-visible:ring-brand",
  destructive:
    "bg-error text-text-inverse border border-error hover:opacity-90 focus-visible:ring-error shadow-sm hover:shadow-error/20",
} as const;

const sizeClasses = {
  sm: "h-8 px-4 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-6 text-sm gap-2 rounded-xl",
  lg: "h-14 px-8 text-base gap-2.5 font-semibold rounded-2xl",
} as const;

/* ─── Types ─── */

type ButtonVariant = keyof typeof variantClasses;
type ButtonSize = keyof typeof sizeClasses;

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "disabled" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and disables interaction */
  loading?: boolean;
  /** Stretches the button to fill its container */
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/* ─── Component ─── */

/**
 * Primary interactive element with delightful micro-interactions.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={props.type || "button"}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={cn(
        /* Base */
        "relative inline-flex items-center justify-center font-semibold tracking-wide",
        "transition-colors duration-200 whitespace-nowrap overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        /* Variant */
        variantClasses[variant],
        /* Size */
        sizeClasses[size],
        /* States */
        isDisabled && "cursor-not-allowed opacity-60 hover:shadow-none",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {/* Subtle shine effect on primary hover */}
      {variant === "primary" && !isDisabled && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
      )}
      
      {loading && (
        <Spinner
          size={size === "lg" ? "sm" : "xs"}
          className="[--sl-spinner-ring:2px] text-current absolute"
        />
      )}
      <span className={cn("flex items-center gap-inherit transition-opacity", loading && "opacity-0")}>
        {children}
      </span>
    </motion.button>
  );
});

export default Button;
