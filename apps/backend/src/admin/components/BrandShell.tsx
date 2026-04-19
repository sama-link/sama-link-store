// Root wrapper for every custom admin surface.
//
// Provides the `.sama-brand` scope (so all `.sl-*` classes resolve) and
// hosts the BrandStyle injector. Every widget/route should be wrapped in
// exactly one BrandShell near its root so nested surfaces don't re-scope.
//
// `as="page"` emits a full-bleed page padded container (for route pages).
// `as="widget"` emits a transparent wrapper (for widgets embedded inside
// Medusa's own panels — no extra padding, so we don't double-pad).

import type { ReactNode, HTMLAttributes } from "react"
import { BrandStyle } from "./BrandStyle"

type BrandShellProps = {
  children: ReactNode
  /** `page` applies the full-bleed page background + padding (for routes).
   *  `widget` is a transparent wrapper (for admin widget zones). */
  as?: "page" | "widget"
  dir?: "ltr" | "rtl"
  className?: string
  style?: HTMLAttributes<HTMLDivElement>["style"]
}

export function BrandShell({
  children,
  as = "widget",
  dir,
  className,
  style,
}: BrandShellProps) {
  const scopeClass = as === "page" ? "sama-brand sl-page" : "sama-brand"
  const finalClass = className ? `${scopeClass} ${className}` : scopeClass
  return (
    <div className={finalClass} dir={dir} style={style}>
      <BrandStyle />
      {as === "page" ? <div className="sl-page-inner">{children}</div> : children}
    </div>
  )
}
