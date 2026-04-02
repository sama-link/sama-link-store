import { cn } from "@/lib/cn";

const variantClasses = {
  default: "bg-surface-subtle text-text-secondary border border-border",
  success: "bg-success-muted text-success border border-success/20",
  warning: "bg-warning-muted text-warning border border-warning/20",
  error:   "bg-error-muted text-error border border-error/20",
  info:    "bg-info-muted text-info border border-info/20",
  brand:   "bg-brand text-text-inverse",
  accent:  "bg-accent text-text-inverse",
} as const;

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
} as const;

type BadgeVariant = keyof typeof variantClasses;
type BadgeSize = keyof typeof sizeClasses;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

/**
 * Inline label for status, category, or metadata.
 *
 * @example
 *   <Badge variant="success">In Stock</Badge>
 *   <Badge variant="error" size="sm">Out of Stock</Badge>
 *   <Badge variant="brand">New</Badge>
 *   <Badge variant="warning">Low Stock</Badge>
 */
export default function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
