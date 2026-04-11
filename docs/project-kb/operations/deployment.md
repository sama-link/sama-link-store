# Deployment — Sama Link Store

This file tracks deployment environments, URLs, and configuration for the Sama Link Store project.

---

## Current Deployments

### Preview — Vercel (Phase 1)

| Field | Value |
|---|---|
| Environment | Preview |
| Vercel Project | `sama-link-store-storefront` |
| Live URL | https://sama-link-store-storefront.vercel.app/ |
| GitHub Repository | https://github.com/sama-link/sama-link-store |
| Branch | `main` |
| Root Directory | `apps/storefront` |
| Framework | Next.js (auto-detected) |
| Node Version | (Vercel default — check project settings) |
| Deployed | 2026-04-02 |
| Status | ✅ Live and verified |

**Verification result (2026-04-02, post-i18n — commit `f5297b8`):**
- `/ar` serves home page with `<html lang="ar" dir="rtl">` ✅
- `/en` serves home page with `<html lang="en" dir="ltr">` ✅
- Locale switcher navigates between `/ar` and `/en` equivalents ✅
- Header and Footer strings render in correct locale ✅
- 404 page (`/ar/nonexistent`) shows Arabic copy ✅
- No JavaScript errors detected ✅

**Notes:**
- This is a **preview deployment**, not a production launch. See ADR-013.
- No environment variables are required for Phase 1 (no backend, no API keys).
- Auto-deploys on every push to `main`.
- Production deployment is Phase 8, after hardening and testing (see docs/project-kb/operations/roadmap.md).

---

## Environment Variables

### Phase 1 (current)

None required. The storefront in Phase 1 has no backend integration.

### Phase 2+ (planned)

| Variable | Description | Required from |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Medusa v2 API base URL | Phase 2 |
| `MEDUSA_API_KEY` | Server-side Medusa admin key | Phase 2 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Phase 4 |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) | Phase 4 |

Add these to Vercel project settings (Environment Variables tab) when the relevant phase begins.
Never commit actual values — use `.env.example` for documentation only.

---

## Vercel Configuration Notes

- **Root Directory:** `apps/storefront` — set in Vercel project settings
- **Build Command:** `next build` (Vercel default for Next.js)
- **Output Directory:** `.next` (Vercel default)
- **Install Command:** `npm install` (runs at monorepo root — Vercel detects workspaces)
- **Framework Preset:** Next.js

---

## DNS / Custom Domain

Not configured. To be set up in Phase 8 alongside production deployment.

---

## Deployment History

| Date | Commit | Description |
|---|---|---|
| 2026-04-02 | `2a760a1` | Initial deployment — Phase 1 storefront skeleton |
| 2026-04-02 | `ce48a91`–`37f6585` | I18N-1–7 — next-intl installed, routing, middleware, plugin, locale layouts, route migration |
| 2026-04-02 | `397ed8c` | I18N-8 — translations wired in Header, Footer, MobileMenu |
| 2026-04-02 | `40c80f9` | LAYOUT-1 + LAYOUT-4 — `generateStaticParams`, 404 page |
| 2026-04-02 | `8104d45` | COPY-1 — dedicated 404 and locale switcher translation keys |
| 2026-04-02 | `a674bcf` | LAYOUT-2 — `LocaleSwitcher.tsx` isolated client component |
| 2026-04-02 | `f5297b8` | LAYOUT-3 — Phase 1 placeholder home page |
