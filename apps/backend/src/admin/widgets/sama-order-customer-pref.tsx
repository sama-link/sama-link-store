// Sama Link customer-preference widget — ADR-046.
//
// Injected into `order.details.customer.after`. Surfaces the merchant-tracked
// bilingual preferences (language + preferred contact channel) for the
// customer on this order, derived from shipping address country code as a
// heuristic + explicit metadata flags if present.
//
// Preferences are *hints* — operators still decide what channel to use.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { BrandShell, StatusChip, BrandDot } from "../components"

type OrderLike = AdminOrder & {
  email?: string | null
  shipping_address?: {
    phone?: string | null
    country_code?: string | null
  } | null
  metadata?: Record<string, unknown> | null
  customer?: {
    metadata?: Record<string, unknown> | null
  } | null
}

function readString(v: unknown): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s.length ? s : null
}

type Channel = "whatsapp" | "sms" | "email" | "phone"
type Language = "ar" | "en"

const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  phone: "Phone call",
}

const ARABIC_SPEAKING_COUNTRIES = new Set([
  "eg", "sa", "ae", "kw", "qa", "bh", "om", "jo", "lb", "sy", "iq",
  "ps", "ma", "dz", "tn", "ly", "sd", "ye",
])

function inferLanguage(order: OrderLike): Language {
  const explicit =
    readString(order.metadata?.["preferred_language"]) ??
    readString(order.customer?.metadata?.["preferred_language"])
  if (explicit === "ar" || explicit === "en") return explicit
  const country = (order.shipping_address?.country_code ?? "").toLowerCase()
  return ARABIC_SPEAKING_COUNTRIES.has(country) ? "ar" : "en"
}

function inferChannel(order: OrderLike): Channel {
  const explicit =
    readString(order.metadata?.["preferred_channel"]) ??
    readString(order.customer?.metadata?.["preferred_channel"])
  if (explicit && ["whatsapp", "sms", "email", "phone"].includes(explicit)) {
    return explicit as Channel
  }
  if (order.shipping_address?.phone) return "whatsapp"
  if (order.email) return "email"
  return "phone"
}

function isExplicit(order: OrderLike, key: string): boolean {
  return (
    readString(order.metadata?.[key]) !== null ||
    readString(order.customer?.metadata?.[key]) !== null
  )
}

const SamaOrderCustomerPrefWidget = ({
  data,
}: DetailWidgetProps<AdminOrder>) => {
  const order = (data ?? {}) as OrderLike
  const language = inferLanguage(order)
  const channel = inferChannel(order)
  const languageIsExplicit = isExplicit(order, "preferred_language")
  const channelIsExplicit = isExplicit(order, "preferred_channel")

  return (
    <BrandShell as="widget">
      <div className="sl-card">
        <div className="sl-between" style={{ marginBottom: 10 }}>
          <div className="sl-row" style={{ alignItems: "center", gap: 10 }}>
            <BrandDot />
            <div className="sl-stack-sm">
              <span className="sl-eyebrow">Sama Link · Contact hints</span>
              <h3 className="sl-title-sm">Customer preferences</h3>
            </div>
          </div>
        </div>

        <div className="sl-grid sl-grid-2">
          <div className="sl-card sl-card-compact">
            <div className="sl-between" style={{ marginBottom: 6 }}>
              <span className="sl-metric-label">Language</span>
              <StatusChip tone={languageIsExplicit ? "success" : "neutral"} flat>
                {languageIsExplicit ? "explicit" : "inferred"}
              </StatusChip>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {language === "ar" ? "العربية" : "English"}
            </div>
            <div className="sl-sub" style={{ fontSize: 11, marginTop: 4 }}>
              {languageIsExplicit
                ? "Customer set an explicit preference"
                : "Inferred from shipping country code"}
            </div>
          </div>

          <div className="sl-card sl-card-compact">
            <div className="sl-between" style={{ marginBottom: 6 }}>
              <span className="sl-metric-label">Channel</span>
              <StatusChip tone={channelIsExplicit ? "success" : "neutral"} flat>
                {channelIsExplicit ? "explicit" : "inferred"}
              </StatusChip>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {CHANNEL_LABEL[channel]}
            </div>
            <div className="sl-sub" style={{ fontSize: 11, marginTop: 4 }}>
              {channelIsExplicit
                ? "Customer set an explicit preference"
                : order.shipping_address?.phone
                  ? "Phone on file → WhatsApp assumed"
                  : "Email on file → email assumed"}
            </div>
          </div>
        </div>
      </div>
    </BrandShell>
  )
}

export const config = defineWidgetConfig({
  // Sits in the right-hand column on the order page, after the native
  // customer summary card — the natural visual neighbour for contact hints.
  zone: "order.details.side.after",
})

export default SamaOrderCustomerPrefWidget
