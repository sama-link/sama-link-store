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
├── .agents/          # Agent contracts (Claude tooling)
├── CLAUDE.md         # Claude Code session entry point
└── TASKS.md          # Active task queue
```

---

## Project Knowledge Base

All governance, decisions, architecture, and operations documentation lives in **Notion**.  
The repository holds no duplicate knowledge — Notion is the single source of truth.

| Surface | Link |
|---|---|
| Project Hub | https://www.notion.so/33613205fce68182a043cc6ad0088c3e |
| Decision Log (ADRs) | https://www.notion.so/76a704d872c34874bfac1e8454f6134b |
| Implementation Canon | https://www.notion.so/34113205fce681468f8dc7185f1a55d4 |

### In-repo agent layer

The `.agents/` directory contains the operative layer for Claude Code sessions — not documentation.

| File | Purpose |
|---|---|
| `.agents/00-core.mdc` | Architecture boundaries, branching rules, security constraints |
| `.agents/10-skills.mdc` | Task brief format, review checklist, session sync protocol |
| `.agents/20-contracts.mdc` | Per-role executor contracts |

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production only. Never commit directly. |
| `develop` | Default working branch for low-risk changes. |
| `feature/back-N-<slug>` | Required for backend, security, env, or structural changes. |

**Rule:** runtime / backend / env / security / DB / > 3 files → feature branch. Otherwise → `develop`.

---

## Agent Sessions

- [`CLAUDE.md`](CLAUDE.md) — Auto-read by Claude Code. Pre-flight checklist, guardrails, and Notion surface index.
- [`TASKS.md`](TASKS.md) — Active task queue for the current sprint.
- [`.env.example`](.env.example) — Environment variable reference.
