import { useId } from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the input */
  label?: string;
  /** Helper text rendered below the input */
  hint?: string;
  /** Error message — also sets aria-invalid and error styling */
  error?: string;
}

/**
 * Text input with optional label, hint, and error state.
 * The label and input are always associated via matching htmlFor / id.
 *
 * @example
 *   <Input label="Email address" type="email" placeholder="you@example.com" />
 *   <Input label="Password" type="password" error="Password is required" />
 *   <Input hint="We'll never share your email." label="Email" />
 */
export default function Input({
  label,
  hint,
  error,
  id: idProp,
  className,
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}

      {/* Input */}
      <input
        id={id}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={
          [hint && hintId, error && errorId].filter(Boolean).join(" ") ||
          undefined
        }
        className={cn(
          /* Base — flat refresh: 10px radius, 42px height equivalent */
          "block h-10 w-full rounded-lg border px-3.5 text-sm",
          "bg-surface text-text-primary placeholder:text-text-muted",
          "transition-colors duration-150",
          /* Focus */
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-0",
          /* Default border */
          !hasError &&
            "border-border focus-visible:border-brand focus-visible:ring-brand/15",
          /* Error border */
          hasError &&
            "border-error focus-visible:border-error focus-visible:ring-error/15",
          /* Disabled */
          disabled && "cursor-not-allowed bg-surface-subtle opacity-60",
          className
        )}
        {...props}
      />

      {/* Hint */}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
