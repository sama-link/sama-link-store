import { cn } from "@/lib/cn";
import Spinner from "./Spinner";

/* ─── Variant & size maps ─── */

/* Flat refresh (ADR-045): no shadows, no glow, tight radius.
   Variants lean on border + background only. Dark mode handled via token flip. */
const variantClasses = {
  primary:
    "bg-brand text-text-inverse border border-brand hover:bg-brand-hover hover:border-brand-hover focus-visible:ring-brand",
  secondary:
    "bg-surface-subtle text-text-primary border border-border hover:bg-surface hover:border-border-strong focus-visible:ring-brand",
  outline:
    "bg-transparent text-brand border border-brand hover:bg-brand hover:text-text-inverse focus-visible:ring-brand",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:bg-surface-subtle hover:text-text-primary focus-visible:ring-brand",
  destructive:
    "bg-error text-text-inverse border border-error hover:opacity-90 focus-visible:ring-error",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5 font-semibold",
} as const;

/* ─── Types ─── */

type ButtonVariant = keyof typeof variantClasses;
type ButtonSize = keyof typeof sizeClasses;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and disables interaction */
  loading?: boolean;
  /** Stretches the button to fill its container */
  fullWidth?: boolean;
}

/* ─── Component ─── */

/**
 * Primary interactive element.
 *
 * @example
 *   <Button variant="primary" size="md">Add to cart</Button>
 *   <Button variant="outline" loading>Saving…</Button>
 *   <Button variant="ghost" size="sm" fullWidth>See all</Button>
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        /* Base */
        "inline-flex items-center justify-center rounded-lg font-medium",
        "transition-[background-color,border-color,color,transform] duration-150 whitespace-nowrap",
        "motion-safe:active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        /* Variant */
        variantClasses[variant],
        /* Size */
        sizeClasses[size],
        /* States */
        isDisabled && "cursor-not-allowed opacity-50",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <Spinner
          size={size === "lg" ? "sm" : "xs"}
          className="[--sl-spinner-ring:2px] text-current"
        />
      )}
      {children}
    </button>
  );
}
