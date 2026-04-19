// Sama Link global admin theme — ADR-047 (supersedes ADR-046's scoped-only rule).
//
// Overrides Medusa's CSS custom properties so every native admin surface
// (dashboard, products list, orders, settings, etc.) inherits the Sama flat
// palette without us having to re-skin each page. Scoped to `:root` and `.dark`
// to match where Medusa itself sets them. We append this AFTER Medusa's bundle
// has loaded, so identical-specificity selectors resolve to our declaration.
//
// KNOWN LIMITATION (documented in ADR-047): admin-sdk widgets do NOT mount on
// `/app/login`. So a *first* load on login stays Medusa-default until the
// operator signs in and any main-list widget mounts, which injects the theme
// for the rest of the SPA session. Hardening login too requires a more
// invasive index.html patch — tracked as a follow-up inside Workstream Q.
//
// FRAGILITY (accepted): these selectors target Medusa's built-in variable
// names. A Medusa minor upgrade can rename them — the contract is one smoke
// pass (REF-33) per `@medusajs/*` bump; update this file's selectors if the
// smoke fails.
//
// Palette source of truth: `lib/brand-tokens.ts` light + dark sections.

export const ADMIN_THEME_STYLE_ID = "sama-admin-theme"

export const ADMIN_THEME_CSS = `
/* ─────────────────────────────────────────────────────────────────────────
   LIGHT MODE — override Medusa's :root tokens.
   ──────────────────────────────────────────────────────────────────────── */
:root {
  /* Surfaces */
  --bg-base: #ffffff;
  --bg-base-hover: #f7f8fa;
  --bg-base-pressed: #eef0f3;
  --bg-subtle: #f7f8fa;
  --bg-subtle-hover: #eef0f3;
  --bg-subtle-pressed: #e3e6eb;
  --bg-component: #ffffff;
  --bg-component-hover: #f7f8fa;
  --bg-component-pressed: #eef0f3;
  --bg-field: #ffffff;
  --bg-field-hover: #f7f8fa;
  --bg-field-component: #ffffff;
  --bg-field-component-hover: #f7f8fa;
  --bg-disabled: #f7f8fa;
  --bg-overlay: rgba(10, 10, 10, 0.45);
  --bg-interactive: #2d6cdf;
  --bg-highlight: #eaf1fd;
  --bg-highlight-hover: #d9e6fb;

  /* Text */
  --fg-base: #0a0a0a;
  --fg-subtle: #525866;
  --fg-muted: #8a8f98;
  --fg-disabled: #a5aab1;
  --fg-interactive: #2d6cdf;
  --fg-interactive-hover: #1e5bd0;
  --fg-on-color: #ffffff;
  --fg-on-inverted: #ffffff;
  --fg-error: #d43a3a;

  /* Borders */
  --border-base: #eceff3;
  --border-strong: #d7dbe0;
  --border-interactive: #2d6cdf;
  --border-danger: #d43a3a;
  --border-error: #d43a3a;
  --border-transparent: transparent;
  --border-menu-top: #eceff3;
  --border-menu-bot: #eceff3;
  --borders-base: #eceff3;
  --borders-error: #d43a3a;
  --borders-focus: #2d6cdf;
  --borders-interactive-with-active: #2d6cdf;
  --borders-interactive-with-focus: #2d6cdf;
  --borders-interactive-with-shadow: rgba(45, 108, 223, 0.18);

  /* Buttons — inverted = primary (Sama navy, flat) */
  --button-inverted: #0f2b4f;
  --button-inverted-hover: #1a3a63;
  --button-inverted-pressed: #0a2342;
  --buttons-inverted: #0f2b4f;
  --buttons-inverted-focus: rgba(15, 43, 79, 0.18);
  --button-neutral: #ffffff;
  --button-neutral-hover: #f7f8fa;
  --button-neutral-pressed: #eef0f3;
  --buttons-neutral: #ffffff;
  --buttons-neutral-focus: rgba(45, 108, 223, 0.18);
  --button-danger: #d43a3a;
  --button-danger-hover: #be3232;
  --button-danger-pressed: #a62929;
  --buttons-danger: #d43a3a;
  --buttons-danger-focus: rgba(212, 58, 58, 0.2);
  --button-transparent: transparent;
  --button-transparent-hover: #eaf1fd;
  --button-transparent-pressed: #d9e6fb;

  /* Switches */
  --bg-switch-off: #d7dbe0;
  --bg-switch-off-hover: #c6ccd3;

  /* Elevations — flat refresh (ADR-045): kill heavy shadows everywhere */
  --elevation-card-rest: 0 0 0 1px #eceff3;
  --elevation-card-hover: 0 0 0 1px #d7dbe0;
  --elevation-code-block: 0 0 0 1px #eceff3;
  --elevation-commandbar: 0 6px 24px rgba(10, 10, 10, 0.08), 0 0 0 1px #eceff3;
  --elevation-flyout: 0 4px 16px rgba(10, 10, 10, 0.08), 0 0 0 1px #eceff3;
  --elevation-modal: 0 8px 32px rgba(10, 10, 10, 0.12), 0 0 0 1px #eceff3;
  --elevation-tooltip: 0 2px 8px rgba(10, 10, 10, 0.12), 0 0 0 1px #d7dbe0;

  /* Contrast layer (used on dark inverted buttons) */
  --contrast-bg-base: #0f2b4f;
  --contrast-bg-base-hover: #1a3a63;
  --contrast-bg-base-pressed: #0a2342;
  --contrast-bg-subtle: #1a3a63;
  --contrast-border-base: #1a3a63;
  --contrast-border-top: #1a3a63;
  --contrast-border-bot: #1a3a63;
  --contrast-fg-primary: #ffffff;
  --contrast-fg-secondary: #c6d3e6;

  /* Tag palette — keep Medusa's semantic hues but nudge blue toward Sama accent */
  --tag-blue-bg: #eaf1fd;
  --tag-blue-bg-hover: #d9e6fb;
  --tag-blue-border: #c3d7f7;
  --tag-blue-text: #2d6cdf;
  --tag-blue-icon: #2d6cdf;
}

/* ─────────────────────────────────────────────────────────────────────────
   DARK MODE — override Medusa's .dark tokens.
   ──────────────────────────────────────────────────────────────────────── */
.dark {
  --bg-base: #14171c;
  --bg-base-hover: #1b1f26;
  --bg-base-pressed: #0f1217;
  --bg-subtle: #0b0d10;
  --bg-subtle-hover: #14171c;
  --bg-subtle-pressed: #080a0c;
  --bg-component: #14171c;
  --bg-component-hover: #1b1f26;
  --bg-component-pressed: #0f1217;
  --bg-field: #0b0d10;
  --bg-field-hover: #14171c;
  --bg-field-component: #14171c;
  --bg-field-component-hover: #1b1f26;
  --bg-disabled: #0b0d10;
  --bg-overlay: rgba(0, 0, 0, 0.6);
  --bg-interactive: #6b9eea;
  --bg-highlight: #1a2a44;
  --bg-highlight-hover: #233b5f;

  --fg-base: #e8eaed;
  --fg-subtle: #a2a9b3;
  --fg-muted: #6b7280;
  --fg-disabled: #4a5058;
  --fg-interactive: #6b9eea;
  --fg-interactive-hover: #85b1ef;
  --fg-on-color: #ffffff;
  --fg-on-inverted: #0a0a0a;
  --fg-error: #f87171;

  --border-base: #23262d;
  --border-strong: #2d3138;
  --border-interactive: #6b9eea;
  --border-danger: #f87171;
  --border-error: #f87171;
  --border-menu-top: #23262d;
  --border-menu-bot: #23262d;
  --borders-base: #23262d;
  --borders-error: #f87171;
  --borders-focus: #6b9eea;
  --borders-interactive-with-active: #6b9eea;
  --borders-interactive-with-focus: #6b9eea;

  --button-inverted: #6b9eea;
  --button-inverted-hover: #85b1ef;
  --button-inverted-pressed: #5a8ad4;
  --buttons-inverted: #6b9eea;
  --buttons-inverted-focus: rgba(107, 158, 234, 0.3);
  --button-neutral: #14171c;
  --button-neutral-hover: #1b1f26;
  --button-neutral-pressed: #0f1217;
  --buttons-neutral: #14171c;
  --buttons-neutral-focus: rgba(107, 158, 234, 0.3);
  --button-danger: #f87171;
  --button-danger-hover: #fa8a8a;
  --button-danger-pressed: #e15252;
  --buttons-danger: #f87171;
  --buttons-danger-focus: rgba(248, 113, 113, 0.3);
  --button-transparent: transparent;
  --button-transparent-hover: #1a2a44;
  --button-transparent-pressed: #233b5f;

  --bg-switch-off: #2d3138;
  --bg-switch-off-hover: #3a3f48;

  --elevation-card-rest: 0 0 0 1px #23262d;
  --elevation-card-hover: 0 0 0 1px #2d3138;
  --elevation-code-block: 0 0 0 1px #23262d;
  --elevation-commandbar: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px #23262d;
  --elevation-flyout: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px #23262d;
  --elevation-modal: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px #23262d;
  --elevation-tooltip: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 1px #2d3138;

  --contrast-bg-base: #6b9eea;
  --contrast-bg-base-hover: #85b1ef;
  --contrast-bg-base-pressed: #5a8ad4;
  --contrast-bg-subtle: #85b1ef;
  --contrast-border-base: #85b1ef;
  --contrast-border-top: #85b1ef;
  --contrast-border-bot: #85b1ef;
  --contrast-fg-primary: #0a0a0a;
  --contrast-fg-secondary: #1a2a44;

  --tag-blue-bg: #1a2a44;
  --tag-blue-bg-hover: #233b5f;
  --tag-blue-border: #2d4971;
  --tag-blue-text: #85b1ef;
  --tag-blue-icon: #85b1ef;
}

/* ─────────────────────────────────────────────────────────────────────────
   GLOBAL TYPOGRAPHY — mirror storefront ADR-045 font stack.
   ──────────────────────────────────────────────────────────────────────── */
html, body {
  font-family: "IBM Plex Sans Arabic", "Geist", "Inter", system-ui, -apple-system,
    Segoe UI, Roboto, sans-serif !important;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ─────────────────────────────────────────────────────────────────────────
   LOGO REPLACEMENT — Sama Link mark in every Medusa logo slot.

   Three DOM slots were inspected live on 2026-04-19 against this branch's
   Medusa dashboard build. Each block below targets one slot via the most
   stable class combo we could spot; if Medusa renames or restructures any
   of them the visual will fall back to a clean Sama-navy badge (no "S"
   leak) because we have hidden the inner text with font-size:0 before
   the pseudo-element paints. Patch these selectors in REF-33 smoke after
   any @medusajs/* bump.

   Requires CSS :has() — Chrome 105+ / Firefox 121+ / Safari 15.4+. Safe
   across every supported admin browser per Medusa compatibility matrix.
   ──────────────────────────────────────────────────────────────────────── */

/* ── 1. Login-page wordmark.
      The login mark is an inline <svg viewBox="0 0 400 400"> inside a
      nested <div> wrapper inside .bg-ui-button-neutral. Hide the SVG,
      repaint the wrapper as a Sama navy tile, and drop an "SL" monogram
      on top via the after-pseudo. ─────────────────────────────────── */
.bg-ui-button-neutral > div > svg[viewBox="0 0 400 400"] {
  display: none !important;
}
.bg-ui-button-neutral > div:has(> svg[viewBox="0 0 400 400"]) {
  background: #0f2b4f !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  position: relative;
  overflow: hidden;
}
.bg-ui-button-neutral > div:has(> svg[viewBox="0 0 400 400"])::after {
  content: "SL";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  font-family: "Geist", "IBM Plex Sans Arabic", system-ui, sans-serif;
  letter-spacing: 0.04em;
  pointer-events: none;
}
/* Kill the neutral-button gradient the login tile uses so the Sama navy
   reads cleanly instead of washing out. */
.bg-ui-button-neutral.after\:button-neutral-gradient::after,
.bg-ui-button-neutral.shadow-buttons-neutral {
  background: transparent !important;
  box-shadow: none !important;
}

/* ── 2. Sidebar store badge (top).
      24×24 rounded-md tile whose inner <span> prints the store's first
      letter. Paint the outer tile navy, zero out the inner font-size to
      hide the "S", and overlay "SL" via a pseudo. Selector narrowness
      (class combo + letter-badge descendant) keeps customer/variant
      avatars elsewhere in the admin untouched. ──────────────────────── */
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-md {
  background: #0f2b4f !important;
  box-shadow: none !important;
}
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-md > .bg-ui-bg-component-hover,
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-md > span {
  background: transparent !important;
  color: transparent !important;
  font-size: 0 !important;
  position: relative;
}
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-md > span::after {
  content: "SL";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff !important;
  font-weight: 700;
  font-size: 9px !important;
  font-family: "Geist", "IBM Plex Sans Arabic", system-ui, sans-serif;
  letter-spacing: 0.04em;
}

/* ── 3. Sidebar user avatar (bottom).
      24×24 rounded-full tile with the same letter-badge pattern. The
      operator asked for Sama in every slot so we mirror block 2 but
      keep the circle shape. (Trade-off: you lose the per-user initial
      cue for the logged-in operator; if that's unwanted, remove this
      block and the user's initial comes back.) ──────────────────────── */
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-full {
  background: #0f2b4f !important;
  box-shadow: none !important;
}
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-full > .bg-ui-bg-component-hover,
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-full > span {
  background: transparent !important;
  color: transparent !important;
  font-size: 0 !important;
  position: relative;
}
.shadow-borders-base.bg-ui-bg-base.h-6.w-6.rounded-full > span::after {
  content: "SL";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff !important;
  font-weight: 700;
  font-size: 9px !important;
  font-family: "Geist", "IBM Plex Sans Arabic", system-ui, sans-serif;
  letter-spacing: 0.04em;
}
`.trim()
