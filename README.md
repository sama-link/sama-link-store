# Sama Link Store

A production-grade, multilingual, SEO-friendly e-commerce platform built on a composable commerce stack.

**Stack:** Next.js 15 App Router · TypeScript strict · Tailwind v4 · Medusa v2 · PostgreSQL · Turborepo

---

## Quick Setup

```bash
# Copy env file and fill in values
cp .env.example apps/backend/.env

# Start all services via Docker Compose
docker compose -f docker-compose.dev.yml up -d
```

| Service | URL |
|---|---|
| Storefront | http://localhost:3000 |
| Backend / Admin | http://localhost:9000 |
| Admin UI | http://localhost:9000/app |

**Prerequisites:** Docker Desktop

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
