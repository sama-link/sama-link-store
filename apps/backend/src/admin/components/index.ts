// Barrel export for admin brand components (ADR-046).
// Prefer the named imports — re-exported here so call sites have a single
// stable path regardless of how we rearrange folders later.

export { BrandStyle } from "./BrandStyle"
export { BrandShell } from "./BrandShell"
export { PageHeader } from "./PageHeader"
export { BrandSection, BrandCard } from "./BrandCard"
export { MetricTile } from "./MetricTile"
export { StatusChip, toneForStatus } from "./StatusChip"
export type { StatusTone } from "./StatusChip"
export { EmptyState } from "./EmptyState"
export { BrandButton } from "./BrandButton"
export type { BrandButtonVariant, BrandButtonSize } from "./BrandButton"
export { BrandDot } from "./BrandDot"
export { BrandForm, EMPTY_BRAND, deriveHandle } from "./BrandForm"
export type { BrandFormValues } from "./BrandForm"
