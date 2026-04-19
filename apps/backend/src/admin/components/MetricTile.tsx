// KPI metric tile used in sama-dashboard and snapshot widgets.
//
// Signals delta direction with colour (never with ± alone) so the meaning
// survives on monochrome-printed audit PDFs. `delta` accepts either a
// pre-formatted string or a number (in which case we render with the sign
// prefix and the matching directional class).

import type { ReactNode } from "react"

type DeltaProps =
  | { delta: string; deltaDirection: "up" | "down" | "flat" }
  | { delta?: undefined; deltaDirection?: undefined }

type MetricTileProps = {
  label: string
  value: ReactNode
  foot?: ReactNode
  muted?: boolean
} & DeltaProps

export function MetricTile({
  label,
  value,
  foot,
  muted,
  delta,
  deltaDirection,
}: MetricTileProps) {
  const cls = muted ? "sl-metric sl-metric-muted" : "sl-metric"
  return (
    <div className={cls}>
      <div className="sl-metric-label">{label}</div>
      <div className="sl-metric-value">{value}</div>
      {delta ? (
        <div
          className={
            deltaDirection === "up"
              ? "sl-metric-foot sl-metric-delta-up"
              : deltaDirection === "down"
                ? "sl-metric-foot sl-metric-delta-down"
                : "sl-metric-foot"
          }
        >
          {delta}
        </div>
      ) : foot ? (
        <div className="sl-metric-foot">{foot}</div>
      ) : null}
    </div>
  )
}
