// Empty-state card — shown when a list endpoint returns zero rows or
// when a precondition (e.g. metadata field) is not yet configured.

import type { ReactNode } from "react"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
}

/** Default icon — a subtle info dot. Routes / widgets can override. */
const DefaultIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
  </svg>
)

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="sl-empty">
      <div className="sl-empty-icon">{icon ?? <DefaultIcon />}</div>
      <h3 className="sl-empty-title">{title}</h3>
      {description ? <p className="sl-empty-sub">{description}</p> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  )
}
