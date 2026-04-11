# Sama Link Store

A production-grade, multilingual, SEO-friendly e-commerce platform built on a composable commerce stack.

**Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Medusa v2 · PostgreSQL · Turborepo

---

## Quick Setup

```bash
# Install dependencies
npm install

# Copy env files and fill in values
cp .env.example apps/backend/.env
cp .env.example apps/storefront/.env.local

# Run everything in dev mode
npm run dev
```

**Prerequisites:** Node.js >= 20 · npm >= 10 · PostgreSQL

---

## Repository Structure

```
sama-link-store/
├── apps/
│   ├── storefront/   # Next.js customer-facing store
│   ├── admin/        # Admin/dashboard app (Phase 6)
│   └── backend/      # Medusa v2 commerce backend
├── packages/
│   ├── ui/           # Shared React UI primitives
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared ESLint, TS, Tailwind configs
└── docs/project-kb/  # All project knowledge
```

---

## Project Knowledge Base

All governance, decisions, tasks, and architecture documentation lives under [`docs/project-kb/`](docs/project-kb/README.md).

**Start here:** [`docs/project-kb/README.md`](docs/project-kb/README.md)

### Definition
| Document | Description |
|---|---|
| [`docs/project-kb/definition/project-definition.md`](docs/project-kb/definition/project-definition.md) | Business goals, platform scope, MVP boundary |
| [`docs/project-kb/definition/architecture.md`](docs/project-kb/definition/architecture.md) | System architecture, boundaries, data flow |
| [`docs/project-kb/definition/multi-agent-model.md`](docs/project-kb/definition/multi-agent-model.md) | Agent operating model |

### Governance
| Document | Description |
|---|---|
| [`docs/project-kb/governance/decisions.md`](docs/project-kb/governance/decisions.md) | Architectural Decision Records (ADR log) |
| [`docs/project-kb/governance/development-rules.md`](docs/project-kb/governance/development-rules.md) | Coding standards and constraints |
| [`docs/project-kb/governance/agents.md`](docs/project-kb/governance/agents.md) | Agent roles, task brief format, handoff protocol |
| [`docs/project-kb/governance/constitution.md`](docs/project-kb/governance/constitution.md) | Authority model, core principles, conflict resolution |

### Operations
| Document | Description |
|---|---|
| [`docs/project-kb/operations/roadmap.md`](docs/project-kb/operations/roadmap.md) | Phased implementation plan |
| [`docs/project-kb/operations/tasks.md`](docs/project-kb/operations/tasks.md) | Active task backlog |
| [`docs/project-kb/operations/deployment.md`](docs/project-kb/operations/deployment.md) | Environment URLs, Vercel config, deployment history |
| [`docs/project-kb/operations/project-operations.md`](docs/project-kb/operations/project-operations.md) | Operating model — planning, execution, review, tracking |
| [`docs/project-kb/operations/notion-sync.md`](docs/project-kb/operations/notion-sync.md) | Notion sync protocol |

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production only. Never commit directly. |
| `develop` | Default working branch for low-risk changes. |
| `feature/back-N-<slug>` | Required for backend, security, env, or structural changes. |

**Rule:** If the change touches runtime, backend, env, security, or > 3 files → feature branch. Otherwise → `develop`.

---

## Agent Sessions

Two files remain at root for tooling reasons:

- [`CLAUDE.md`](CLAUDE.md) — Auto-read by Claude Code. Compact operative shell with pre-flight and guardrails.
- [`.env.example`](.env.example) — Environment variable reference.

Notion Project Hub: https://www.notion.so/33613205fce68182a043cc6ad0088c3e
