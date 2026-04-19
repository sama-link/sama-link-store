// Flat card primitive — single border, no shadows, per ADR-045.
//
// `BrandSection` is the larger variant used to group a whole section on a
// route page; `BrandCard` is the compact variant used inside grids.
// Both accept an optional header (title + actions) and arbitrary children.

import type { ReactNode } from "react"

type CommonProps = {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function BrandSection({ title, subtitle, actions, children, className }: CommonProps) {
  const cls = className ? `sl-section ${className}` : "sl-section"
  return (
    <section className={cls}>
      {title || actions ? (
        <div className="sl-between" style={{ marginBottom: subtitle ? 4 : 12 }}>
          <div className="sl-stack-sm" style={{ minWidth: 0, flex: 1 }}>
            {title ? <h2 className="sl-title-sm">{title}</h2> : null}
            {subtitle ? <p className="sl-sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="sl-row" style={{ flexShrink: 0 }}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function BrandCard({
  title,
  subtitle,
  actions,
  children,
  className,
  compact,
}: CommonProps & { compact?: boolean }) {
  const cls = [
    "sl-card",
    compact ? "sl-card-compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ")
  return (
    <div className={cls}>
      {title || actions ? (
        <div className="sl-between" style={{ marginBottom: 10 }}>
          <div className="sl-stack-sm" style={{ minWidth: 0, flex: 1 }}>
            {title ? <h3 className="sl-title-sm">{title}</h3> : null}
            {subtitle ? <p className="sl-sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="sl-row" style={{ flexShrink: 0 }}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
