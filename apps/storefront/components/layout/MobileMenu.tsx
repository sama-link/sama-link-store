"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "Products", href: "#" },
  { label: "Collections", href: "#" },
  { label: "About", href: "#" },
] as const;

/**
 * Hamburger toggle + collapsible mobile nav panel.
 * Rendered inside Header as the only client component there.
 *
 * Planned additions (Phase 1 i18n + Phase 3+):
 *  - Links wired to locale-prefixed routes
 *  - Animated slide-down transition
 *  - Close on route change (usePathname)
 *  - Trap focus while open
 */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors sm:hidden"
      >
        {open ? (
          /* X icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Hamburger icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Mobile nav panel */}
      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={cn(
          "absolute inset-x-0 top-full border-b border-border bg-surface sm:hidden",
          open ? "block" : "hidden"
        )}
      >
        <ul className="flex flex-col divide-y divide-border">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center px-4 text-sm font-medium text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
