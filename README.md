# Sama Link Store

A production-grade, multilingual, SEO-friendly, AI-friendly e-commerce platform built on a modern composable commerce stack.

---

## Stack

| Layer | Technology |
|---|---|
| Storefront | Next.js 14+ (App Router, TypeScript) |
| Admin / Dashboard | Next.js (custom) or Medusa Admin (Phase 6) |
| Commerce Backend | Medusa v2 |
| Database | PostgreSQL |
| Search | Meilisearch (Phase 7) |
| Payments | Stripe (Phase 4) |
| Storage | S3-compatible (Phase 3) |
| Monorepo tooling | Turborepo + npm workspaces |
| Deployment | Vercel (storefront), Node/VPS or Railway (backend) |

---

## Repository Structure

```
sama-link-store/
├── apps/
│   ├── storefront/        # Next.js customer-facing store
│   ├── admin/             # Admin/dashboard app (Phase 6)
│   └── backend/           # Medusa commerce backend
├── packages/
│   ├── ui/                # Shared React UI primitives
│   ├── types/             # Shared TypeScript types & domain models
│   └── config/            # Shared ESLint, TS, Tailwind configs
├── docs/                  # Extended documentation
├── .env.example           # Environment variable reference
├── turbo.json             # Turborepo pipeline config
└── package.json           # Monorepo root
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL running locally or via Docker
- (Optional) Redis for sessions/queues

### Setup

```bash
# 1. Clone / enter the project
cd sama-link-store

# 2. Copy env files and fill in values
cp .env.example apps/backend/.env
cp .env.example apps/storefront/.env.local

# 3. Install dependencies (once apps are scaffolded)
npm install

# 4. Run everything in dev mode
npm run dev
```

> **Note:** Individual apps have not been scaffolded yet — see ROADMAP.md Phase 0–1.

---

## Development Phases

| Phase | Focus |
|---|---|
| 0 | Project foundation, structure, docs |
| 1 | Storefront skeleton (Next.js, layout, routing) |
| 2 | Medusa backend integration |
| 3 | Product catalog |
| 4 | Cart and checkout |
| 5 | Orders and customer accounts |
| 6 | Admin/dashboard |
| 7 | SEO, localization, analytics |
| 8 | Hardening and launch readiness |

See [ROADMAP.md](./ROADMAP.md) for detailed phase breakdown.

---

## Key Documentation

- [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) — Business goals, product vision, MVP scope
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and integration boundaries
- [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) — Coding standards and project rules
- [ROADMAP.md](./ROADMAP.md) — Phased implementation plan
- [TASKS.md](./TASKS.md) — Actionable task backlog
- [DECISIONS.md](./DECISIONS.md) — Architectural decision log
- [SESSION_GUIDE.md](./SESSION_GUIDE.md) — Guide for future Claude/AI sessions
- [docs/](./docs/) — Extended technical documentation

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-only. Never commit directly. |
| `develop` | Default working branch. Safe for docs, minor UI, config changes. |
| `feature/back-N-<slug>` | Required for all backend, security, env, or multi-file structural changes. |

**Decision rule:** If the change touches runtime, backend, env, security, or more than ~3 files → use a feature branch. Otherwise → commit directly to `develop`.

---

## Contributing / Development

See [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) for all coding and workflow standards.
