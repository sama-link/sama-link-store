"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

/* Collapsed-to-icon header search.
   Starts as a 40×40 icon button. Expands to a full pill when hovered, focused,
   or clicked. Auto-collapses when the input loses focus and is empty. */
export default function HeaderSearch() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function collapse() {
    if (query.trim().length === 0) setExpanded(false);
  }

  function expand() {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q.length === 0) return;
    router.push(`/${locale}/products?q=${encodeURIComponent(q)}`);
    setExpanded(false);
    inputRef.current?.blur();
  }

  /* Collapse when clicking outside the wrapper. */
  useEffect(() => {
    if (!expanded) return;
    function onPointer(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
      if (query.trim().length === 0) setExpanded(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [expanded, query]);

  return (
    <div
      ref={wrapperRef}
      className="relative hidden md:flex md:items-center"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => collapse()}
    >
      <form
        onSubmit={onSubmit}
        role="search"
        className={cn(
          "flex items-center overflow-hidden rounded-full border transition-[width,background-color,border-color] duration-300 ease-out",
          expanded
            ? "w-72 border-brand bg-surface"
            : "w-10 border-border bg-surface-subtle",
        )}
      >
        <label htmlFor="header-search" className="sr-only">
          {t("searchLabel")}
        </label>

        <button
          type="button"
          onClick={() => (expanded ? inputRef.current?.focus() : expand())}
          aria-label={t("searchLabel")}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center text-text-secondary transition-colors",
            expanded ? "text-brand" : "hover:text-text-primary",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>

        <input
          ref={inputRef}
          id="header-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={expand}
          onBlur={collapse}
          placeholder={t("searchPlaceholder")}
          tabIndex={expanded ? 0 : -1}
          className={cn(
            "h-10 flex-1 bg-transparent pe-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none",
            expanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      </form>
    </div>
  );
}
