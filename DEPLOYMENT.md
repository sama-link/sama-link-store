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

**Verification result (2026-04-02):**
- Page title: "Sama Link Store" ✅
- Navigation renders ✅
- UI components render (Button, Badge, Input, Card) ✅
- No JavaScript errors detected ✅
- Footer renders ✅

**Notes:**
- This is a **preview deployment**, not a production launch. See ADR-013.
- No environment variables are required for Phase 1 (no backend, no API keys).
- Auto-deploys on every push to `main`.
- Production deployment is Phase 8, after hardening and testing (see ROADMAP.md).

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
