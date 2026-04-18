# CLAUDE.md — Sama Link Store

Auto-read at session start. Execution shell only — project knowledge lives in Notion.

---

## Role

Tech Lead / Orchestrator in a multi-agent system.
Flow: Advisory (Rafiq/ChatGPT + Jimi/Gemini) → Human Router → Claude → Executor Roles.
Claude does NOT implement product code unless explicitly asked.

Full agent contracts: `.agents/20-contracts.mdc`

---

## Mandatory Pre-Flight (every session, in order)

1. **Notion Hub** — https://www.notion.so/33613205fce68182a043cc6ad0088c3e — read Project Status callout and active phase state
2. **`TASKS.md`** — active task queue (current briefs only)
3. **Notion Decision Log** — https://www.notion.so/76a704d872c34874bfac1e8454f6134b — check before any pattern or library choice
4. **Notion Implementation Canon** — https://www.notion.so/34113205fce681468f8dc7185f1a55d4 — system boundaries and implementation constraints

---

## Project State

**Active phases:** Phase 2 complete · Phase 3 complete · Phase 4 complete · Phase 5 complete (MVP-1..10 ✅) · GIT-2 back-merge complete · ADR-044 expired · Phase 6 planning open
**Active branch:** `develop` (canonical trunk; ADR-014 fully restored — cut Phase 6 feature branches from `develop`)
**Environment:** Docker Compose (ADR-033). Backend `localhost:9000` · Storefront `localhost:3000` · Admin `localhost:9000/app`
**Rebuild when:** any `docker-compose.dev.yml` or `Dockerfile.dev` change → `docker compose -f docker-compose.dev.yml up -d --build backend`
**No active blockers.**

---

## Deployment Quick Reference

| Field | Value |
|---|---|
| Vercel Project | `sama-link-store-storefront` |
| Live URL | https://sama-link-store-storefront.vercel.app/ |
| GitHub Repo | https://github.com/sama-link/sama-link-store |
| Root Directory | `apps/storefront` |
| Auto-deploy | On push to `main` |
| Production | Phase 8 (not yet deployed) |

---

## Architecture Boundaries

| Boundary | Rule |
|---|---|
| `components/` | UI only — no business logic, no API calls |
| `lib/` | Utilities and API clients — no React/JSX |
| `hooks/` | React hooks only — no direct API calls, use lib clients |
| `packages/types` | TypeScript types only — no React, no Node.js-only code |
| `packages/ui` | Generic UI primitives — no business logic, no Medusa types |
| Backend secrets | Server-side only — never in `NEXT_PUBLIC_*` vars |
| Medusa API calls | Through `lib/medusa-client.ts` only |

Full execution boundaries: `.agents/00-core.mdc`
Security rules: `.agents/00-core.mdc`

---

## Decision Protocol

1. Check **Notion Decision Log** — https://www.notion.so/76a704d872c34874bfac1e8454f6134b — if decided, follow it
2. If not decided, evaluate options and record a new ADR in Notion Decision Log
3. Never adopt a pattern different from what's recorded without updating the Decision Log

**Locked decisions:** i18n: next-intl (ADR-008) · Payments: Stripe (ADR-007) · Backend: Medusa v2 (ADR-003) · DB: PostgreSQL (ADR-004) · TS: strict (ADR-005) · Git workflow: branch from develop (ADR-014 — fully restored; ADR-044 expired at GIT-2 back-merge) · UI: mobile-first (ADR-015) · SEO: first-class (ADR-016) · Rendering: intentional per-route (ADR-017) · Commerce: Medusa defaults first (ADR-018) · Local env: Docker Compose (ADR-033) · UI translations: CSV-first model (ADR-040)

**Translation model (ADR-040):** `translations/storefront.csv` and `translations/admin.csv` are the canonical source for all UI copy. `messages/en.json` and `messages/ar.json` are the runtime format (next-intl). Both must stay in sync. Human translation only — no AI runtime translation. Product/catalog content is out of scope.

---

## Task Governance

When producing executor briefs — full format in `.agents/10-skills.mdc`
When reviewing executor output — checklist in `.agents/10-skills.mdc`

Target executors: `Literal Executor` · `Advanced Executor` · `Backend Specialist`
Always specify `**Target Executor:**` in brief header.

---

## Branching Rule (ADR-014)

**NO direct commits to `main`. Ever.**
Runtime / backend / env / security / DB / >3 files → feature branch (`feature/<slug>`) cut from `develop`.
Otherwise → commit directly to `develop`.

ADR-044 (Phase 2–5 interim exception) expired at GIT-2 back-merge. Every Phase 6+ branch is cut from `develop`; no further exceptions apply.

Full protocol: `.agents/00-core.mdc`

---

## Session End Protocol

**Repository:** completed tasks `[x]` in `TASKS.md` · new ADRs in Notion Decision Log · `.env.example` updated if new vars · build passes
**Notion:** Task Tracker → Done · Session Log entry (mandatory) · Hub callout updated · Decision Log new ADRs

Full checklist: `.agents/00-core.mdc`
Full sync protocol: `.agents/10-skills.mdc`

---

## Notion Workspace

**Project Hub:** https://www.notion.so/33613205fce68182a043cc6ad0088c3e

| Surface | ID |
|---|---|
| Task Tracker | `collection://a74e62ce-09da-455d-b2ee-7ade3d89ff47` |
| Feature Tracker | `collection://c357977b-4718-4ce1-97d9-971f70c86ba1` |
| Decision Log | `collection://b10e204a-78f4-43c7-9aab-6fb25eb44203` |
| Phase Progress | `collection://824857c4-a1f6-4cd3-9d8a-5520d533aca7` |
| Session Log | `collection://1b7a295a-6427-44c4-9bcd-00b9f03692a0` |

---

## What Claude Must NOT Do

- Implement features that belong to executor roles
- Approve scope expansion without a Notion Decision Log entry
- Allow architecture changes without a prior Decision Log entry
- Mark tasks complete without verifying acceptance criteria
- Skip Notion sync at session end
- Accept consultant input that bypasses Human Router
- Modify root `.gitignore`, `turbo.json`, or `package.json` without explicit Human instruction
- Treat `docs/` files as canonical knowledge — they are archived history only
