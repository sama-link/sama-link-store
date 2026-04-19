// Injects the ADR-045 flat-refresh token bundle into <head> exactly once.
//
// Medusa's admin-sdk bundles every widget/route as its own chunk with no
// way to inject a shared global stylesheet. Without dedup we'd end up with
// N copies of the same ~6 KB CSS block living inside the DOM. This component
// appends a single <style id="sama-brand-tokens"> element to <head> and
// short-circuits on every subsequent mount (across widgets, routes, and
// React strict-mode double-invocations).
//
// The module-level `injected` flag covers same-mount dedup; the DOM lookup
// covers reloads + hot-module-replacement cycles.

import { useEffect } from "react"
import { BRAND_CSS, BRAND_STYLE_ID } from "../lib/brand-tokens"

let injected = false

export function BrandStyle(): null {
  useEffect(() => {
    if (injected) return
    if (typeof document === "undefined") return
    if (document.getElementById(BRAND_STYLE_ID)) {
      injected = true
      return
    }
    const el = document.createElement("style")
    el.id = BRAND_STYLE_ID
    el.textContent = BRAND_CSS
    document.head.appendChild(el)
    injected = true
  }, [])
  return null
}
