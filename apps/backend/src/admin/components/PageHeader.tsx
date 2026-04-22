// Standard eyebrow + title + subtitle + actions header for custom routes.
//
// Kept thin and layout-neutral so it composes inside `.sama-brand .sl-page`
// without reaching into the page container's padding.

import type { ReactNode } from "react"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="sl-page-header">
      <div className="sl-stack-sm" style={{ minWidth: 0, flex: 1 }}>
        {eyebrow ? <span className="sl-eyebrow">{eyebrow}</span> : null}
        <h1 className="sl-title">{title}</h1>
        {subtitle ? <p className="sl-sub" style={{ maxWidth: "68ch" }}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="sl-row" style={{ flexShrink: 0 }}>{actions}</div> : null}
    </header>
  )
}
