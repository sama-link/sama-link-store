// Sama Link wordmark badge — the 24×24 (or 32×32) navy tile with "SL".
// Used as a visual anchor at the start of every branded widget header.

type BrandDotProps = {
  size?: "sm" | "md" | "lg"
  label?: string
}

export function BrandDot({ size = "md", label = "SL" }: BrandDotProps) {
  const cls = size === "lg" ? "sl-brand-dot sl-brand-dot-lg" : "sl-brand-dot"
  return (
    <span className={cls} aria-hidden>
      {label}
    </span>
  )
}
