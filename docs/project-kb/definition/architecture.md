# Architecture — Sama Link Store

**Layer:** Definition
**Source of truth for:** System boundaries, application structure, data flow, integration specs.
**Updated when:** Architecture decisions change (record in `docs/project-kb/governance/decisions.md` first; requires ADR).
**Notion counterpart:** https://www.notion.so/33613205fce6810692e3f625276bb2c6 (Architecture Overview — abstract/conceptual; this file is the technical detail counterpart)

---

## Overview

Sama Link Store is built as a **composable commerce platform** using a monorepo structure. The system is composed of independently deployable applications that communicate over well-defined APIs, with shared logic and types extracted into packages.

---

## System Diagram (Logical)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   Browser (Customer)        Browser (Merchant Admin)        │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐     ┌─────────────────────────┐
│  apps/storefront     │     │  apps/admin             │
│  Next.js 16          │     │  Next.js or Medusa Admin│
│  App Router          │     │  Node hosting           │
│  Vercel              │     │                         │
└──────────┬───────────┘     └────────────┬────────────┘
           │                              │
           │    Medusa Store API          │  Medusa Admin API
           ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  apps/backend — Medusa v2                    │
│  Commerce logic: products, orders, customers, cart, payments │
│  Node.js / Express / Medusa framework                        │
└──────────┬───────────────────────────────────────┬───────────┘
           │                                       │
           ▼                                       ▼
┌──────────────────┐                    ┌──────────────────────┐
│  PostgreSQL DB   │                    │  External Services   │
│  Primary store   │                    │  Stripe (payments)   │
└──────────────────┘                    │  S3/R2 (media)       │
                                        │  Meilisearch (search)│
                                        │  SMTP (email)        │
                                        └──────────────────────┘
```

---

## Applications

### `apps/storefront`

**Role:** Customer-facing shopping experience.

- Next.js 16 with App Router
- TypeScript throughout (strict mode)
- Server Components by default; Client Components only when necessary (interactivity, browser APIs)
- Tailwind CSS v4 for styling (CSS-only configuration via `@theme`)
- RTL/LTR layout support (Arabic/English via `next-intl`)
- SEO-first: `generateMetadata`, structured data, sitemap, robots.txt
- Communicates with Medusa via its Store REST API (or JS SDK)
- No business logic lives here — only presentation and data-fetching

**Key directories:**
```
apps/storefront/
├── app/               # App Router: layouts, pages, route groups
├── components/        # UI components (uses packages/ui primitives)
├── lib/               # API clients, utilities, helpers
├── hooks/             # Client-side React hooks
├── i18n/              # next-intl routing and request config
├── messages/          # Translation files (ar.json, en.json)
└── public/            # Static assets
```

### `apps/admin`

**Role:** Merchant-facing dashboard for managing the store.

- Phase 6+ — placeholder until then
- Options: Medusa's built-in Admin UI (fastest), or custom Next.js admin (more control)
- **Decision deferred to Phase 6** — documented in `docs/project-kb/governance/decisions.md` ADR-006
- Must support role-based access control
- Should be separately deployed (not bundled with storefront)

### `apps/backend`

**Role:** Commerce API and business logic layer.

- Medusa v2 application
- Handles: products, variants, collections, cart, checkout, orders, customers, auth, payments, fulfillment
- Connects to PostgreSQL for persistence
- Extensible via Medusa modules and custom plugins
- Environment-specific config via `.env`

---

## Packages

### `packages/types`

Shared TypeScript types and domain interfaces used by both storefront and admin.

- Product, variant, order, customer, cart types
- API response shapes
- Enum definitions
- Do NOT include React components or Node.js-only code here

### `packages/ui`

Shared React UI primitives.

- Button, Input, Badge, Card, Modal, etc.
- No business logic — purely presentational
- Tailwind-based, accessible (WCAG AA target)
- RTL-aware

### `packages/config`

Shared tooling configurations.

- `eslint-config/` — shared ESLint preset
- `tsconfig/` — base TypeScript configs
- `tailwind-config/` — shared Tailwind preset (if needed)

---

## Data Flow

### Storefront — Product Page Request

```
Browser → Next.js Server Component
  → lib/medusa-client.ts (fetch product from Medusa API)
  → Medusa backend (queries PostgreSQL)
  → Returns product data
  → Server Component renders HTML with structured data + metadata
  → Browser receives fully-rendered page (SSR/ISR)
```

### Storefront — Add to Cart

```
Browser Client Component (CartButton)
  → hooks/useCart.ts
  → lib/medusa-client.ts (POST /store/carts/:id/line-items)
  → Medusa backend
  → Cart state updated in client-side context
```

### Admin — Create Product

```
Admin UI (form submit)
  → lib/admin-client.ts (POST /admin/products)
  → Medusa Admin API (authenticated)
  → Medusa backend processes, saves to PostgreSQL
  → Storefront picks up on next page load
```

---

## Architecture Boundaries

These boundaries must not be violated. Violations are treated identically to architecture decisions — they require an ADR.

| Boundary | Rule |
|---|---|
| `components/` | UI only — no business logic, no API calls |
| `lib/` | Utilities and API clients — no React/JSX |
| `hooks/` | React hooks only — no direct API calls, use lib clients |
| `packages/types` | TypeScript types only — no React, no Node.js-only code |
| `packages/ui` | Generic UI primitives — no business logic, no Medusa types |
| Backend secrets | Server-side only — never in `NEXT_PUBLIC_*` vars |
| Medusa API calls | Through `lib/medusa-client.ts` only |

---

## Integration Boundaries

| Boundary | Method | Notes |
|---|---|---|
| Storefront ↔ Backend | REST (Medusa Store API) | JSON, typed with packages/types |
| Admin ↔ Backend | REST (Medusa Admin API) | JWT-authenticated |
| Backend ↔ Stripe | Stripe SDK (server-side only) | Never expose Stripe secret to client |
| Backend ↔ S3/R2 | AWS SDK / Cloudflare SDK | File upload via signed URLs |
| Storefront ↔ Meilisearch | Meilisearch JS client | Search-only, no write operations |

---

## Deployment Architecture

| App | Target | Strategy |
|---|---|---|
| storefront | Vercel | Automatic builds on `develop`/`main` branch |
| admin | Railway / VPS / Vercel | Separate deployment, restricted access |
| backend | Railway / VPS / Render | Node process, persistent DB connection |
| PostgreSQL | Managed (Supabase/Railway/Neon) or self-hosted | Backups required |
| Redis | Managed or self-hosted | Optional for Phase 1–3 |

---

## Key Architectural Decisions

All rationale is in `docs/project-kb/governance/decisions.md`. Locked decisions:

- **Monorepo:** Turborepo with npm workspaces (ADR-001)
- **Storefront:** Next.js 16 App Router (ADR-002)
- **Backend:** Medusa v2 (ADR-003)
- **Database:** PostgreSQL (ADR-004)
- **TypeScript:** Strict mode everywhere (ADR-005)
- **Admin:** Deferred to Phase 6; default to Medusa Admin UI (ADR-006)
- **Payments:** Stripe (ADR-007)
- **i18n:** next-intl, Arabic primary (ADR-008)
- **CSS:** Tailwind v4, CSS-only configuration via `@theme` (ADR-012)
- **Adopt > Extend > Rebuild:** Use Medusa defaults before extending (ADR-018)
