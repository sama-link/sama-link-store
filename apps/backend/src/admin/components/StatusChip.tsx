// Semantic status pill — thin wrapper around the .sl-pill primitive.
//
// Keeps the tone → colour mapping declarative so call sites don't hard-code
// class names. `flat` drops the leading status dot (used for neutral
// metadata badges like "AR proposed" where a dot feels noisy).

import type { ReactNode } from "react"

export type StatusTone = "neutral" | "success" | "warning" | "error" | "info"

type StatusChipProps = {
  children: ReactNode
  tone?: StatusTone
  flat?: boolean
}

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "sl-pill-neutral",
  success: "sl-pill-success",
  warning: "sl-pill-warning",
  error: "sl-pill-error",
  info: "sl-pill-info",
}

export function StatusChip({ children, tone = "neutral", flat }: StatusChipProps) {
  const cls = [
    "sl-pill",
    TONE_CLASS[tone],
    flat ? "sl-pill-flat" : "",
  ]
    .filter(Boolean)
    .join(" ")
  return <span className={cls}>{children}</span>
}

/** Map common Medusa order/payment/fulfilment statuses to a tone. */
export function toneForStatus(status: string | null | undefined): StatusTone {
  const s = (status ?? "").toLowerCase()
  if (["captured", "paid", "completed", "fulfilled", "delivered", "published"].includes(s)) return "success"
  if (["pending", "awaiting", "not_paid", "not_fulfilled", "processing"].includes(s)) return "info"
  if (["partially_captured", "partially_fulfilled", "partially_shipped", "draft", "requires_action"].includes(s)) return "warning"
  if (["canceled", "cancelled", "refunded", "failed", "archived"].includes(s)) return "error"
  return "neutral"
}
