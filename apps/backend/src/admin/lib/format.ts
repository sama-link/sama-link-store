// Shared formatters for admin widgets & routes.
//
// Kept tiny and locale-agnostic by default — the admin UI is English-first
// per Medusa core. Arabic labels live inside component markup where natural
// (e.g. translation-status chips) but numbers stay in en-US so merchants can
// read them consistently alongside Medusa's native tables.

export function formatInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("en-US").format(n)
}

export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined
): string {
  if (amount == null || !Number.isFinite(amount)) return "—"
  const code = (currency ?? "").toUpperCase() || "—"
  return `${code} ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount)}`
}

export function formatMoneyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined
): string {
  if (min == null && max == null) return "—"
  const mn = min ?? max!
  const mx = max ?? min!
  if (mn === mx) return formatMoney(mn, currency)
  const code = (currency ?? "").toUpperCase() || "—"
  return `${code} ${formatInt(mn)} – ${formatInt(mx)}`
}

export function formatDate(
  iso: string | null | undefined,
  style: "short" | "long" = "short"
): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return style === "long"
    ? d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const now = Date.now()
  const diffMs = now - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

/** Convert Medusa's amount-in-smallest-unit to a display float.
 *  Medusa v2 returns `total` already divided for most currencies, but we
 *  keep this helper in case raw integers come through. */
export function fromMinorUnits(
  amount: number | null | undefined,
  currencyCode: string | null | undefined
): number | null {
  if (amount == null || !Number.isFinite(amount)) return null
  const code = (currencyCode ?? "").toLowerCase()
  // Zero-decimal currencies per ISO-4217 (Medusa covers the majority here)
  const zeroDecimal = new Set([
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg",
    "rwf", "vnd", "vuv", "xaf", "xof", "xpf",
  ])
  if (zeroDecimal.has(code)) return amount
  return amount / 100
}

export function truncate(s: string | null | undefined, max: number): string {
  if (!s) return "—"
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}
