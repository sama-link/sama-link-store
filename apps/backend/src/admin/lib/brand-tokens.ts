// Sama Link admin flat-refresh tokens — ADR-045 + ADR-046.
//
// Single source of truth for all custom admin surfaces (widgets + routes).
// CSS is scoped to `.sama-brand` so it never leaks into Medusa's native shell.
// Dark mode hooks into BOTH `.dark` (Medusa's own toggle class) and the
// system `prefers-color-scheme` media query so custom surfaces track whichever
// the operator prefers.
//
// Injection strategy: BrandStyle component (see components/BrandStyle.tsx)
// appends a single <style id="sama-brand-tokens"> to <head> and short-circuits
// on subsequent mounts. This keeps the DOM clean and avoids re-parsing CSS
// when multiple widgets/routes mount.

export const BRAND_STYLE_ID = "sama-brand-tokens"

export const BRAND_CSS = `
.sama-brand {
  /* ── Light mode tokens — mirror storefront globals.css ─────────────── */
  --sl-brand: #0f2b4f;
  --sl-brand-hover: #1a3a63;
  --sl-accent: #2d6cdf;
  --sl-accent-muted: #eaf1fd;
  --sl-amber: #c2680a;
  --sl-amber-muted: #fbf1e4;
  --sl-surface: #ffffff;
  --sl-surface-subtle: #f7f8fa;
  --sl-surface-sunk: #eef0f3;
  --sl-text: #0a0a0a;
  --sl-text-secondary: #525866;
  --sl-text-muted: #8a8f98;
  --sl-text-inverse: #ffffff;
  --sl-border: #eceff3;
  --sl-border-strong: #d7dbe0;
  --sl-success: #16a34a;
  --sl-success-muted: #e8f5ed;
  --sl-warning: #c2680a;
  --sl-warning-muted: #fbf1e4;
  --sl-error: #d43a3a;
  --sl-error-muted: #fbe9e9;
  --sl-info: #2d6cdf;
  --sl-info-muted: #eaf1fd;

  --sl-radius-sm: 6px;
  --sl-radius-md: 8px;
  --sl-radius-lg: 10px;
  --sl-radius-xl: 14px;
  --sl-radius-pill: 9999px;

  --sl-shadow-focus: 0 0 0 3px rgba(45, 108, 223, 0.18);
  --sl-transition: 150ms ease;

  font-family: "Geist", "Inter", system-ui, -apple-system, sans-serif;
  color: var(--sl-text);
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

/* ── Dark mode: Medusa .dark class OR system preference ────────────── */
.dark .sama-brand,
[data-mode="dark"] .sama-brand {
  --sl-brand: #6b9eea;
  --sl-brand-hover: #85b1ef;
  --sl-accent: #6b9eea;
  --sl-accent-muted: #1a2a44;
  --sl-amber: #d98834;
  --sl-amber-muted: #2a1d0d;
  --sl-surface: #14171c;
  --sl-surface-subtle: #0b0d10;
  --sl-surface-sunk: #080a0c;
  --sl-text: #e8eaed;
  --sl-text-secondary: #a2a9b3;
  --sl-text-muted: #6b7280;
  --sl-text-inverse: #0a0a0a;
  --sl-border: #23262d;
  --sl-border-strong: #2d3138;
  --sl-success: #4ade80;
  --sl-success-muted: #0f2a1a;
  --sl-warning: #e5a15a;
  --sl-warning-muted: #2a1d0d;
  --sl-error: #f87171;
  --sl-error-muted: #2a1212;
  --sl-info: #6b9eea;
  --sl-info-muted: #1a2a44;
}

/* RTL — widgets containing Arabic need padding/margin flips */
.sama-brand[dir="rtl"] { font-family: "IBM Plex Sans Arabic", "Geist", system-ui, sans-serif; }

/* ── Typography ─────────────────────────────────────────────────────── */
.sama-brand .sl-eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--sl-accent); margin: 0;
}
.sama-brand .sl-title {
  font-size: 22px; font-weight: 600; letter-spacing: -0.02em;
  color: var(--sl-text); margin: 0;
}
.sama-brand .sl-title-sm {
  font-size: 16px; font-weight: 600; letter-spacing: -0.01em;
  color: var(--sl-text); margin: 0;
}
.sama-brand .sl-sub {
  font-size: 13px; color: var(--sl-text-secondary); margin: 0; line-height: 1.55;
}
.sama-brand .sl-muted { color: var(--sl-text-muted); }
.sama-brand .sl-mono {
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 12px; color: var(--sl-text-secondary);
}
.sama-brand .sl-kbd {
  font-family: ui-monospace, Menlo, monospace; font-size: 11px;
  background: var(--sl-surface-subtle); border: 1px solid var(--sl-border);
  padding: 1px 6px; border-radius: var(--sl-radius-sm); color: var(--sl-text-secondary);
}

/* ── Layout primitives ──────────────────────────────────────────────── */
.sama-brand .sl-page {
  padding: 24px 28px; background: var(--sl-surface-subtle); min-height: 100%;
}
.sama-brand .sl-page-inner { max-width: 1080px; margin: 0 auto; }
.sama-brand .sl-page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
}
.sama-brand .sl-section {
  border: 1px solid var(--sl-border);
  border-radius: var(--sl-radius-xl);
  background: var(--sl-surface);
  padding: 20px 24px;
  margin-bottom: 16px;
}
.sama-brand .sl-card {
  border: 1px solid var(--sl-border);
  border-radius: var(--sl-radius-xl);
  background: var(--sl-surface);
  padding: 16px 18px;
}
.sama-brand .sl-card-compact { padding: 12px 14px; }
.sama-brand .sl-stack { display: flex; flex-direction: column; gap: 12px; }
.sama-brand .sl-stack-sm { display: flex; flex-direction: column; gap: 8px; }
.sama-brand .sl-stack-lg { display: flex; flex-direction: column; gap: 20px; }
.sama-brand .sl-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sama-brand .sl-between {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.sama-brand .sl-grid { display: grid; gap: 12px; }
.sama-brand .sl-grid-auto { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.sama-brand .sl-grid-2 { grid-template-columns: repeat(2, 1fr); }
.sama-brand .sl-grid-3 { grid-template-columns: repeat(3, 1fr); }
.sama-brand .sl-grid-4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 840px) {
  .sama-brand .sl-grid-3, .sama-brand .sl-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .sama-brand .sl-grid-2, .sama-brand .sl-grid-3, .sama-brand .sl-grid-4 { grid-template-columns: 1fr; }
}

/* ── Buttons ────────────────────────────────────────────────────────── */
.sama-brand .sl-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 36px; padding: 0 14px;
  border-radius: var(--sl-radius-lg); border: 1px solid transparent;
  font: inherit; font-weight: 500; font-size: 13px; cursor: pointer;
  transition: background var(--sl-transition), border-color var(--sl-transition), color var(--sl-transition);
  text-decoration: none;
  white-space: nowrap;
}
.sama-brand .sl-btn:focus-visible { outline: none; box-shadow: var(--sl-shadow-focus); }
.sama-brand .sl-btn-lg { height: 40px; padding: 0 16px; font-size: 14px; }
.sama-brand .sl-btn-sm { height: 30px; padding: 0 12px; font-size: 12px; }
.sama-brand .sl-btn-primary { background: var(--sl-brand); color: #fff; border-color: var(--sl-brand); }
.sama-brand .sl-btn-primary:hover:not(:disabled) { background: var(--sl-brand-hover); border-color: var(--sl-brand-hover); }
.sama-brand .sl-btn-secondary { background: var(--sl-surface-subtle); color: var(--sl-text); border-color: var(--sl-border); }
.sama-brand .sl-btn-secondary:hover:not(:disabled) { background: var(--sl-surface); border-color: var(--sl-border-strong); }
.sama-brand .sl-btn-outline { background: transparent; color: var(--sl-brand); border-color: var(--sl-brand); }
.sama-brand .sl-btn-outline:hover:not(:disabled) { background: var(--sl-accent-muted); }
.sama-brand .sl-btn-ghost { background: transparent; color: var(--sl-text-secondary); }
.sama-brand .sl-btn-ghost:hover:not(:disabled) { background: var(--sl-surface-subtle); color: var(--sl-text); }
.sama-brand .sl-btn-danger { background: var(--sl-error); color: #fff; border-color: var(--sl-error); }
.sama-brand .sl-btn-danger:hover:not(:disabled) { filter: brightness(0.95); }
.sama-brand .sl-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Pills / Chips / Status ─────────────────────────────────────────── */
.sama-brand .sl-pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: var(--sl-radius-pill);
  border: 1px solid transparent;
  white-space: nowrap;
}
.sama-brand .sl-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.sama-brand .sl-pill-neutral { color: var(--sl-text-secondary); background: var(--sl-surface-subtle); border-color: var(--sl-border); }
.sama-brand .sl-pill-success { color: var(--sl-success); background: var(--sl-success-muted); }
.sama-brand .sl-pill-warning { color: var(--sl-warning); background: var(--sl-warning-muted); }
.sama-brand .sl-pill-error   { color: var(--sl-error);   background: var(--sl-error-muted); }
.sama-brand .sl-pill-info    { color: var(--sl-accent);  background: var(--sl-accent-muted); }
.sama-brand .sl-pill-flat::before { display: none; }
.sama-brand .sl-pill-flat { padding: 2px 8px; }

/* ── Metric tiles ───────────────────────────────────────────────────── */
.sama-brand .sl-metric {
  border: 1px solid var(--sl-border);
  border-radius: var(--sl-radius-lg);
  padding: 14px 16px;
  background: var(--sl-surface);
  display: flex; flex-direction: column; gap: 4px;
}
.sama-brand .sl-metric-muted { background: var(--sl-surface-subtle); }
.sama-brand .sl-metric-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--sl-text-muted);
}
.sama-brand .sl-metric-value {
  font-size: 24px; font-weight: 700; letter-spacing: -0.02em;
  color: var(--sl-text); font-variant-numeric: tabular-nums; line-height: 1.1;
}
.sama-brand .sl-metric-foot { font-size: 11px; color: var(--sl-text-secondary); margin-top: 2px; }
.sama-brand .sl-metric-delta-up   { color: var(--sl-success); }
.sama-brand .sl-metric-delta-down { color: var(--sl-error); }

/* ── Tables ─────────────────────────────────────────────────────────── */
.sama-brand .sl-table-wrap {
  border: 1px solid var(--sl-border); border-radius: var(--sl-radius-lg); overflow: hidden;
}
.sama-brand .sl-table {
  width: 100%; border-collapse: collapse; font-size: 13px; color: var(--sl-text);
}
.sama-brand .sl-table thead {
  background: var(--sl-surface-subtle); border-bottom: 1px solid var(--sl-border);
}
.sama-brand .sl-table th {
  text-align: inline-start; font-weight: 600; color: var(--sl-text-secondary);
  font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 10px 14px;
}
.sama-brand .sl-table td {
  padding: 10px 14px; border-bottom: 1px solid var(--sl-border);
  vertical-align: middle;
}
.sama-brand .sl-table tbody tr:last-child td { border-bottom: none; }
.sama-brand .sl-table tbody tr:hover { background: var(--sl-surface-subtle); }

/* ── Notes / blockquotes ────────────────────────────────────────────── */
.sama-brand .sl-note {
  font-size: 12px; color: var(--sl-text-secondary);
  border-inline-start: 2px solid var(--sl-accent);
  padding: 8px 12px;
  background: var(--sl-accent-muted);
  border-radius: 0 var(--sl-radius-sm) var(--sl-radius-sm) 0;
}
.sama-brand .sl-note-warning {
  border-inline-start-color: var(--sl-warning);
  background: var(--sl-warning-muted);
}
.sama-brand .sl-note-error {
  border-inline-start-color: var(--sl-error);
  background: var(--sl-error-muted);
}

/* ── Empty state ────────────────────────────────────────────────────── */
.sama-brand .sl-empty {
  border: 1px dashed var(--sl-border-strong);
  border-radius: var(--sl-radius-lg);
  padding: 32px 24px; text-align: center;
  background: var(--sl-surface);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.sama-brand .sl-empty-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: var(--sl-surface-subtle); color: var(--sl-text-muted);
  display: grid; place-items: center;
}
.sama-brand .sl-empty-title { font-size: 14px; font-weight: 600; color: var(--sl-text); margin: 0; }
.sama-brand .sl-empty-sub { font-size: 12px; color: var(--sl-text-secondary); margin: 0; max-width: 44ch; }

/* ── Skeleton (subtle pulse, no gradient) ───────────────────────────── */
.sama-brand .sl-skeleton {
  background: var(--sl-surface-sunk);
  border-radius: var(--sl-radius-md);
  animation: sama-brand-pulse 1.4s ease-in-out infinite;
}
@keyframes sama-brand-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

/* ── Brand dot (wordmark badge used in widget headers) ──────────────── */
.sama-brand .sl-brand-dot {
  width: 24px; height: 24px; border-radius: var(--sl-radius-md);
  background: var(--sl-brand); color: #fff;
  display: grid; place-items: center;
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  flex-shrink: 0;
}
.sama-brand .sl-brand-dot-lg { width: 32px; height: 32px; font-size: 12px; border-radius: 10px; }

/* ── Swatch (style guide) ───────────────────────────────────────────── */
.sama-brand .sl-swatch {
  border: 1px solid var(--sl-border); border-radius: var(--sl-radius-lg);
  padding: 12px; font-size: 12px; color: var(--sl-text-secondary);
  display: flex; flex-direction: column; gap: 6px;
  background: var(--sl-surface);
}
.sama-brand .sl-swatch-chip {
  height: 44px; border-radius: var(--sl-radius-md); border: 1px solid var(--sl-border);
}
.sama-brand .sl-swatch-name { color: var(--sl-text); font-weight: 600; }
.sama-brand .sl-swatch-hex  { font-family: ui-monospace, Menlo, monospace; font-size: 11px; }

/* ── Inputs ─────────────────────────────────────────────────────────── */
.sama-brand .sl-input, .sama-brand .sl-select, .sama-brand .sl-textarea {
  width: 100%; height: 36px; padding: 0 12px;
  border: 1px solid var(--sl-border);
  border-radius: var(--sl-radius-md);
  background: var(--sl-surface);
  color: var(--sl-text); font: inherit; font-size: 13px;
  transition: border-color var(--sl-transition), box-shadow var(--sl-transition);
}
.sama-brand .sl-textarea { height: auto; padding: 10px 12px; line-height: 1.5; resize: vertical; }
.sama-brand .sl-input:focus, .sama-brand .sl-select:focus, .sama-brand .sl-textarea:focus {
  outline: none; border-color: var(--sl-accent); box-shadow: var(--sl-shadow-focus);
}
.sama-brand .sl-input::placeholder, .sama-brand .sl-textarea::placeholder { color: var(--sl-text-muted); }
.sama-brand .sl-label {
  display: block; font-size: 12px; font-weight: 500; color: var(--sl-text-secondary);
  margin-bottom: 6px;
}

/* ── Tabs ───────────────────────────────────────────────────────────── */
.sama-brand .sl-tabs {
  display: inline-flex; gap: 4px; padding: 3px;
  background: var(--sl-surface-subtle);
  border: 1px solid var(--sl-border);
  border-radius: var(--sl-radius-lg);
}
.sama-brand .sl-tab {
  font-size: 12px; font-weight: 500; padding: 6px 12px;
  border-radius: var(--sl-radius-md); color: var(--sl-text-secondary);
  background: transparent; border: none; cursor: pointer;
  transition: background var(--sl-transition), color var(--sl-transition);
}
.sama-brand .sl-tab:hover { color: var(--sl-text); }
.sama-brand .sl-tab[data-active="true"] {
  background: var(--sl-surface); color: var(--sl-text);
  box-shadow: inset 0 0 0 1px var(--sl-border);
}

/* ── Divider ────────────────────────────────────────────────────────── */
.sama-brand .sl-divider {
  height: 1px; background: var(--sl-border); border: none; margin: 12px 0;
}
`.trim()
