"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/* Persistent search bar — always-visible input, ergonomic for e-commerce.
   Sits between the logo and the action cluster, flex-grows to fill the
   available middle space (with a sane max-width for readability). */
export default function HeaderSearch() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q.length === 0) return;
    router.push(`/${locale}/products?q=${encodeURIComponent(q)}`);
    inputRef.current?.blur();
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={[
        "relative flex h-11 w-full max-w-[760px] items-center overflow-hidden rounded-full border bg-surface-subtle transition-colors duration-150",
        focused
          ? "border-brand bg-surface shadow-[0_0_0_3px_rgba(45,108,223,0.08)]"
          : "border-border hover:border-border-strong hover:bg-surface",
      ].join(" ")}
    >
      <label htmlFor="header-search" className="sr-only">
        {t("searchLabel")}
      </label>

      {/* Search icon — sits at the start of the bar, decorative.
          Click on the bar focuses the input via the wrapping <form>. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 inline-flex items-center ps-3.5 text-text-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        ref={inputRef}
        id="header-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t("searchPlaceholder")}
        className="h-full min-w-0 flex-1 bg-transparent ps-10 pe-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none"
      />

      {/* Submit button — visible only on small viewports as a tap-friendly
          end cap. Desktop submits via Enter. */}
      <button
        type="submit"
        aria-label={t("searchSubmit")}
        className="hidden h-full items-center justify-center bg-brand px-6 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover sm:inline-flex"
      >
        {t("searchSubmit")}
      </button>
    </form>
  );
}
