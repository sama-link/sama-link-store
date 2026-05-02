"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the input */
  label?: string;
  /** Helper text rendered below the input */
  hint?: string;
  /** Error message — also sets aria-invalid and error styling */
  error?: string;
  /** Optional icon component to display inside the input */
  icon?: React.ElementType;
}

/**
 * Text input with smooth focus rings and animated error states.
 */
export default function Input({
  label,
  hint,
  error,
  icon: Icon,
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
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-text-primary transition-colors group-focus-within:text-brand"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {/* Icon */}
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Icon className={cn(
              "h-5 w-5 transition-colors duration-200",
              hasError ? "text-error" : "text-text-muted group-focus-within:text-brand"
            )} />
          </div>
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
            /* Base */
            "block w-full rounded-xl border bg-surface text-base sm:text-sm",
            "text-text-primary placeholder:text-text-muted/60",
            "transition-all duration-200 ease-in-out",
            /* Size/Spacing */
            "h-12 py-2.5",
            Icon ? "pl-11 pr-4" : "px-4",
            /* Focus */
            "focus:outline-none focus:ring-0 focus:border-brand",
            /* Default border */
            !hasError &&
              "border-border hover:border-border-strong",
            /* Error border */
            hasError &&
              "border-error focus:border-error bg-error-muted/10",
            /* Disabled */
            disabled && "cursor-not-allowed bg-surface-subtle opacity-60 hover:border-border",
            className
          )}
          {...props}
        />
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-error mt-0.5"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            id={hintId}
            className="text-xs text-text-muted mt-0.5"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
