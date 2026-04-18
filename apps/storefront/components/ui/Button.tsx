import { cn } from "@/lib/cn";

/* ─── Variant & size maps ─── */

const variantClasses = {
  primary:
    "bg-brand text-text-inverse hover:bg-brand-hover focus-visible:ring-brand dark:bg-text-primary dark:text-surface dark:border-text-primary dark:border dark:hover:bg-white dark:focus-visible:ring-text-primary",
  secondary:
    "bg-surface-subtle text-text-primary border border-border hover:bg-surface-raised hover:border-border-strong focus-visible:ring-brand",
  outline:
    "bg-transparent text-brand border border-brand hover:bg-brand hover:text-text-inverse focus-visible:ring-brand",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:ring-brand",
  destructive:
    "bg-error text-text-inverse hover:opacity-90 focus-visible:ring-error",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
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

/* ─── Spinner ─── */

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
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
        "transition-colors duration-150",
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
      {loading && <Spinner />}
      {children}
    </button>
  );
}
