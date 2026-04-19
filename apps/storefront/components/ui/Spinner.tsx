import { cn } from "@/lib/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual size preset. Defaults to `sm` (20px). */
  size?: "xs" | "sm" | "md" | "lg";
  /** Accessible label — announced to screen readers. */
  label?: string;
}

const sizePx = { xs: 14, sm: 20, md: 28, lg: 40 } as const;
const ringPx = { xs: 2, sm: 2, md: 2.5, lg: 3 } as const;

/* Ring spinner — brand top, border ring, smooth rotate.
   Powered by the .sl-spinner keyframes in globals.css. */
export default function Spinner({
  size = "sm",
  label,
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      role={label ? "status" : "presentation"}
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      {...rest}
    >
      <span
        className="sl-spinner"
        style={
          {
            "--sl-spinner-size": `${sizePx[size]}px`,
            "--sl-spinner-ring": `${ringPx[size]}px`,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
