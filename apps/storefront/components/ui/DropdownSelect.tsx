"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";

export interface DropdownSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: React.ReactNode }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
}

export default function DropdownSelect({
  value,
  defaultValue,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  name,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  const activeValue = value !== undefined ? value : internalValue;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === activeValue);

  return (
    <div className="relative" ref={containerRef}>
      {name && <input type="hidden" name={name} value={activeValue} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full items-center justify-between gap-2 text-start transition-colors focus:outline-none focus:border-brand focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed",
          className,
          "flex",
          open && "border-brand ring-[3px] ring-brand/15"
        )}
      >
        <span className="block truncate text-sm font-medium">
          {selectedOption ? selectedOption.label : placeholder || ""}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform duration-200",
            open ? "rotate-180" : ""
          )}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute top-full start-0 z-[100] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg focus:outline-none min-w-[max-content]">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center px-3 py-2 text-sm transition-colors",
                  isSelected
                    ? "bg-brand text-text-inverse font-semibold"
                    : "text-text-primary hover:bg-surface-subtle"
                )}
                onClick={() => {
                  setInternalValue(option.value);
                  if (onChange) {
                    onChange(option.value);
                  }
                  setOpen(false);
                }}
              >
                <span className="block truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
