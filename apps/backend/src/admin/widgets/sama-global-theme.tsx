// Sama Link global admin theme injector — ADR-047.
//
// A zero-weight widget whose single job is to append `<style id="sama-admin-theme">`
// to document.head exactly once per SPA session. Once the style is in the head
// it persists across every client-side route change, so mounting this widget
// on ANY zone gives us the entire admin shell branded for the rest of the
// session.
//
// We register on a generous set of zones (list-before variants of the most
// common top-level resources) so the probability of catching the operator's
// first admin page after login is ~1.0 in practice.
//
// Login page caveat (documented in admin-theme-css.ts): admin-sdk widgets do
// NOT mount on `/app/login`, so a cold load on login renders unbranded until
// the operator signs in. Hardening login requires patching index.html directly
// (out of admin-sdk scope) and is tracked as a Workstream Q follow-up.
//
// The widget returns `null` — it has no visible output. Keeping it as a
// component (not a module side effect) is intentional: React strict-mode +
// HMR trigger module side effects at odd times, the component's `useEffect`
// only fires on actual mount, which is what we want.
//
// Rebuild required after any change:
//   docker compose -f docker-compose.dev.yml up -d --build backend

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { ADMIN_THEME_STYLE_ID, buildAdminThemeCss } from "../lib/admin-theme-css"
import samaLogoUrl from "../assets/sama-link-icon-on-dark.webp"

let injected = false

const SamaGlobalThemeWidget = (): null => {
  useEffect(() => {
    try {
      if (injected) return
      if (typeof document === "undefined") return

      // Already present from a previous mount (HMR / fast-refresh) — short-circuit.
      if (document.getElementById(ADMIN_THEME_STYLE_ID)) {
        injected = true
        return
      }

      const el = document.createElement("style")
      el.id = ADMIN_THEME_STYLE_ID
      el.textContent = buildAdminThemeCss(samaLogoUrl)
      // Append LAST so our :root + .dark declarations win the specificity
      // tie against Medusa's own ones (same specificity — later declaration wins).
      document.head.appendChild(el)
      injected = true
    } catch (err) {
      // Theme injection must never break the admin shell. If anything goes
      // wrong, log and bail — the admin stays on Medusa default colors, which
      // is recoverable; a thrown error during widget mount blanks the whole
      // admin page.
      // eslint-disable-next-line no-console
      console.error("[sama-global-theme] injection failed:", err)
    }
  }, [])

  return null
}

// Widget zones — five well-documented zones that are guaranteed valid in
// Medusa v2 admin-sdk. The widget is a zero-weight null component, so once
// it mounts on any of these pages the `<style>` tag is in the document head
// and persists across every SPA route change for the rest of the session.
//
// `login.before` is what hardens the cold-load case: a fresh visit to
// `/app/login` (no prior session) mounts our widget BEFORE Medusa's login
// form renders, so the Sama logo paints from first paint instead of after
// the operator signs in once. Zone confirmed against
// `node_modules/@medusajs/dashboard/dist/login-IMDOL4BZ.mjs` line 234,
// which calls `getWidgets("login.before")` during login render.
//
// Earlier iteration listed 22 zones (including speculative ones like
// `tax.list.before`, `store.details.before`, `inventory.list.before`,
// `location.list.before`). Invalid zone names cause the admin-sdk bundle to
// throw `ReferenceError: ui is not defined` at runtime, which blanks the
// entire admin — do NOT add zones without confirming them against live
// Medusa admin-sdk source or a successful smoke test first.
export const config = defineWidgetConfig({
  zone: [
    "login.before",
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "product.details.before",
  ],
})

export default SamaGlobalThemeWidget
