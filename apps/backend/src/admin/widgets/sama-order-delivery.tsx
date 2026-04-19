// Sama Link order delivery widget — ADR-046.
//
// Injected into `order.details.side.before` so it sits high in the right
// column on the order page. Shows the delivery zone + an operator-friendly
// WhatsApp-ready message template (bilingual) they can copy into WhatsApp
// Business to confirm the order. READ-ONLY — we never send messages from
// here (that belongs to a dedicated integration, not the admin UI).
//
// The message template uses AR / EN placeholders filled from the order
// data. If the shipping address is missing pieces we fall back to "—" so
// the template stays usable.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useCallback, useMemo, useState } from "react"
import { BrandShell, BrandButton, StatusChip, BrandDot } from "../components"
import { formatMoney } from "../lib/format"

type OrderLike = AdminOrder & {
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
    phone?: string | null
  } | null
  currency_code?: string | null
  total?: number | null
  display_id?: number | null
}

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function addressOneLine(a: OrderLike["shipping_address"]): string {
  if (!a) return "—"
  const parts = [
    a.address_1,
    a.address_2,
    a.city,
    a.province,
    a.postal_code,
    a.country_code?.toUpperCase(),
  ].filter(Boolean)
  return parts.length ? parts.join(", ") : "—"
}

function customerName(a: OrderLike["shipping_address"]): string {
  const full = [a?.first_name, a?.last_name].filter(Boolean).join(" ").trim()
  return full || "—"
}

function buildTemplateEn(order: OrderLike): string {
  const a = order.shipping_address
  return [
    `Hi ${customerName(a)},`,
    ``,
    `This is Sama Link. We've received order #${order.display_id ?? "—"} — ${formatMoney(
      order.total,
      order.currency_code
    )}.`,
    `Shipping to: ${addressOneLine(a)}.`,
    `We'll confirm dispatch shortly. Reply to this message if anything needs changing.`,
    ``,
    `— Sama Link`,
  ].join("\n")
}

function buildTemplateAr(order: OrderLike): string {
  const a = order.shipping_address
  return [
    `أهلاً ${customerName(a)}،`,
    ``,
    `من Sama Link — استلمنا طلبك رقم #${order.display_id ?? "—"} بقيمة ${formatMoney(
      order.total,
      order.currency_code
    )}.`,
    `عنوان التوصيل: ${addressOneLine(a)}.`,
    `هنأكد الشحن قريب. لو محتاج تغير أي حاجة رد على الرسالة دي.`,
    ``,
    `— Sama Link`,
  ].join("\n")
}

const SamaOrderDeliveryWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const order = (data ?? {}) as OrderLike
  const [lang, setLang] = useState<"ar" | "en">("ar")
  const [copied, setCopied] = useState(false)

  const message = useMemo(
    () => (lang === "ar" ? buildTemplateAr(order) : buildTemplateEn(order)),
    [order, lang]
  )

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard may be denied — fallback: select the textarea and let
      // the operator hit Ctrl/Cmd+C themselves. The browser handles that path.
    }
  }, [message])

  const zoneLabel = order.shipping_address?.city
    ? `${order.shipping_address.city}${order.shipping_address.country_code ? ` · ${order.shipping_address.country_code.toUpperCase()}` : ""}`
    : "—"

  return (
    <BrandShell as="widget">
      <div className="sl-card">
        <div className="sl-between" style={{ marginBottom: 10 }}>
          <div className="sl-row" style={{ alignItems: "center", gap: 10 }}>
            <BrandDot />
            <div className="sl-stack-sm">
              <span className="sl-eyebrow">Sama Link · Delivery</span>
              <h3 className="sl-title-sm">Zone & customer message</h3>
            </div>
          </div>
          <StatusChip tone="info">{zoneLabel}</StatusChip>
        </div>

        <p className="sl-sub" style={{ marginBottom: 12 }}>
          Copy a ready-made bilingual message to paste into WhatsApp or SMS.
          Never sends automatically — the operator stays in control.
        </p>

        <div className="sl-row" style={{ marginBottom: 10, justifyContent: "space-between" }}>
          <div className="sl-tabs" role="tablist" aria-label="Language">
            <button
              type="button"
              role="tab"
              aria-selected={lang === "ar"}
              data-active={lang === "ar"}
              className="sl-tab"
              onClick={() => setLang("ar")}
            >
              العربية
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={lang === "en"}
              data-active={lang === "en"}
              className="sl-tab"
              onClick={() => setLang("en")}
            >
              English
            </button>
          </div>
          <BrandButton
            variant={copied ? "secondary" : "primary"}
            size="sm"
            onClick={onCopy}
            leading={copied ? <CheckIcon /> : <CopyIcon />}
          >
            {copied ? "Copied" : "Copy message"}
          </BrandButton>
        </div>

        <textarea
          className="sl-textarea"
          value={message}
          readOnly
          dir={lang === "ar" ? "rtl" : "ltr"}
          lang={lang}
          rows={8}
          style={{
            fontFamily:
              lang === "ar"
                ? "\"IBM Plex Sans Arabic\", system-ui, sans-serif"
                : "inherit",
            fontSize: 13,
          }}
          onFocus={(e) => e.currentTarget.select()}
        />

        <div className="sl-note" style={{ marginTop: 10 }}>
          Phone on file: <strong>{order.shipping_address?.phone ?? "—"}</strong>. Always verify the customer
          before sending — the template is a starting point, not a final approval.
        </div>
      </div>
    </BrandShell>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default SamaOrderDeliveryWidget
