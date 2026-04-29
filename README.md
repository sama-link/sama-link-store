# Sama Link Store

A production-grade, multilingual, SEO-friendly e-commerce platform built on a composable commerce stack.

**Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Medusa v2 · PostgreSQL · Turborepo

---

## Quick Setup

```bash
# 1. Workspace install (root)
npm install

# 2. Copy backend env (defaults to admin@example.com / supersecret — change for your machine)
cp .env.example apps/backend/.env

# 3. Start postgres + Medusa (storefront stays on the host)
docker compose -f docker-compose.dev.yml up -d postgres backend

# 4. Create the admin user + seed the catalog/region/publishable key
docker compose -f docker-compose.dev.yml exec backend \
  sh -c "cd /app/apps/backend && npm run seed:local"

# 5. Copy storefront env, then paste the two seed-printed values
cp apps/storefront/.env.local.example apps/storefront/.env.local
#    (paste NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY and NEXT_PUBLIC_MEDUSA_REGION_ID
#     from the seed output's "Local development summary" block)

# 6. Start the storefront on the host
npm run dev:storefront
```

| Service | URL |
|---|---|
| Storefront | http://localhost:3000 |
| Backend / Admin | http://localhost:9000 |
| Admin UI | http://localhost:9000/app |

**Prerequisites:** Docker Desktop, Node 20+

`npm run seed:local` is idempotent — safe to re-run any time. See
[`docs/development/local-seed.md`](docs/development/local-seed.md) for
what it creates, the admin-user requirement, and the optional
GCP/dev → local fixture-derivation procedure.

> Rebuild after any `docker-compose.dev.yml` or `Dockerfile.dev` change:
> `docker compose -f docker-compose.dev.yml up -d --build backend`

---

## Repository Structure

```
sama-link-store/
├── apps/
│   ├── storefront/   # Next.js customer-facing store
│   └── backend/      # Medusa v2 commerce backend
├── packages/
│   ├── ui/           # Shared React UI primitives
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared ESLint, TS, Tailwind configs
└── translations/     # Canonical UI translation files (CSV)
```

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production only. Never commit directly. |
| `develop` | Default working branch for low-risk changes. |
| `feature/<slug>` | Required for backend, security, env, or structural changes. |

**Rule:** runtime / backend / env / security / DB / > 3 files → feature branch. Otherwise → `develop`.

---

## Translations

UI copy is managed via CSV files in `translations/`. Runtime JSON files in `apps/storefront/messages/` are the format consumed by next-intl.

| File | Purpose |
|---|---|
| `translations/storefront.csv` | Storefront UI strings (en + ar) |
| `translations/admin.csv` | Admin dashboard strings (en + ar) |
| `apps/storefront/messages/en.json` | Runtime English translations |
| `apps/storefront/messages/ar.json` | Runtime Arabic translations |

---

## Environment

See [`.env.example`](.env.example) for all required environment variables.

---

## Project Governance

This repository contains executable code only. Project governance, ADRs, task workflows, handoff documents, and the local knowledge base are stored **outside this repo** in the sibling folder `../sama-link-store-kb/` (local only — not pushed to GitHub).

Notion remains the daily operating workspace.
