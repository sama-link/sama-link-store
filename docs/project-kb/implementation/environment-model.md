# Environment, CI/CD & Deployment Model — Sama Link Store

**Layer:** Implementation
**Derives from:** Technical Requirements · Architecture Overview
**Implements constraints from:** ADR-005 (TypeScript strict) · ADR-014 (Git workflow)
**Notion source:** https://www.notion.so/33a13205fce681bdaa28eb66e5632965

---

## Environment Topology

| Environment | Purpose | Storefront | Backend | Database |
|---|---|---|---|---|
| `local` | Developer working environment | `localhost:3000` | `localhost:9000` | Local PostgreSQL instance |
| `preview` | Branch/PR validation; stakeholder review | Vercel Preview Deploy (per-branch) | Backend preview instance or shared staging | Staging database (seeded) |
| `staging` | Pre-production integration validation | Vercel Staging deploy | Staging backend on Node/VPS | Staging PostgreSQL |
| `production` | Live customer-facing platform | Vercel Production | Production Node/VPS | Production PostgreSQL |

Environments are strictly isolated. Production credentials never appear in non-production environments.

---

## Storefront Deployment Model

| Concern | Approach |
|---|---|
| Hosting | Vercel (ADR — hosting provider pending full confirmation) |
| Build trigger | Git push to branch or merge to `main` |
| ISR / cache revalidation | Vercel's edge cache; Next.js cache tags; revalidation via API route |
| Preview deploys | Automatic per-branch Vercel deploy for PR review |
| Environment variables | Set in Vercel dashboard per environment; `NEXT_PUBLIC_*` for client-safe values only |

---

## Backend Deployment Model

| Concern | Approach |
|---|---|
| Hosting | Node.js / VPS (self-managed or managed Node hosting) |
| Process management | PM2 or equivalent process manager |
| Build | `turbo build --filter=backend` from monorepo root |
| Start | `node dist/main.js` (or Medusa start command) |
| Database migrations | Run via Medusa migration CLI before each deployment |
| Environment variables | Set on the server; never committed to repository |

---

## Database Deployment Model

| Concern | Approach |
|---|---|
| Engine | PostgreSQL (ADR-004) |
| Migrations | Medusa-managed migration files; run before backend process starts |
| Seeding | Seed scripts for non-production environments; production data is never seeded from scripts |
| Backups | Automated daily backups in staging and production (implementation TBD) |

---

## Environment Variable Structure

| Scope | Prefix / Location | Examples |
|---|---|---|
| Storefront — client-safe | `NEXT_PUBLIC_` prefix | `NEXT_PUBLIC_MEDUSA_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Storefront — server-only | No prefix; not in `NEXT_PUBLIC_` | `MEDUSA_API_KEY` (if server-to-server auth token needed) |
| Backend — server-only | Environment variables on backend host | `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET` |
| Shared secrets | Never shared — each service has its own credentials | N/A |

Backend secrets must never appear in the storefront environment. Any value needed by the browser is explicitly marked `NEXT_PUBLIC_` and must not be sensitive.

`.env.example` in the repository documents required variable names without values. Actual values are never committed.

---

## Monorepo Build Flow

Turborepo orchestrates the build across apps and packages:

1. `turbo build` from repo root
2. Turborepo resolves the build graph — `packages/ui` and `packages/types` build before apps
3. `apps/storefront` builds via `next build`
4. `apps/backend` builds via Medusa build command
5. Build cache is stored per-package; unchanged packages skip rebuild
6. `tsc --noEmit` is run as a pre-build type check step; build fails if TypeScript errors exist

---

## CI/CD Expectations

| Stage | Action | Gate |
|---|---|---|
| On push to any branch | TypeScript type check (`tsc --noEmit`) | Must pass |
| On push to any branch | Lint (`eslint`) | Must pass |
| On PR open/update | Full build (`turbo build`) | Must pass |
| On PR open/update | Vercel preview deploy | Must succeed for storefront |
| On merge to `main` | Production deploy (storefront + backend) | Requires passing PR build |

CI/CD pipeline tooling selection is an open dependency — the above represents expected behavior regardless of tooling chosen.

---

## Open Dependencies

| Open Item | Impact on This Page | Blocks |
|---|---|---|
| CI/CD pipeline tooling (GitHub Actions, etc.) | Determines exact CI configuration files and workflow structure | CI/CD implementation |
| Backend hosting provider finalization | Determines whether PM2/VPS or managed Node hosting is used | Backend deployment configuration |
| Image CDN / Next.js image loader | Determines `next/image` domains config and responsive image delivery | Product image rendering |
| Object storage provider (AWS S3 vs. Cloudflare R2) | Determines `NEXT_PUBLIC_` image base URL and backend upload configuration | Image upload and delivery |
| Database hosting provider | Determines `DATABASE_URL` format, SSL config, and connection pooling setup | Database connectivity |

---

## Related Implementation Files

- [`backend-patterns.md`](backend-patterns.md) — Commerce backend architectural patterns
- [`storefront-patterns.md`](storefront-patterns.md) — Storefront rendering and build patterns
- [`integrations-webhooks.md`](integrations-webhooks.md) — Integration secret management
- [`implementation-sequencing.md`](implementation-sequencing.md) — Build dependency and phase-gating logic
