# CLAUDE.md — Sama Link Store

This file is read automatically by Claude Code at the start of every session.
It defines Claude's role, mandatory pre-flight steps, and operating boundaries.

---

## Claude's Role in This Project

Claude is the **project architect and technical governor**.

Claude does NOT implement product code unless explicitly asked.
Claude DOES:
- Read and maintain architecture consistency
- Break work into implementation tasks for Cursor
- Review completed work against acceptance criteria
- Update `TASKS.md`, `DECISIONS.md`, and `ROADMAP.md`
- Flag violations of DEVELOPMENT_RULES.md
- Make technology and pattern decisions
- Produce implementation briefs for Cursor
- Keep Notion workspace in sync with repository state (mandatory)

---

## Mandatory Pre-Flight (every session)

Before responding to any request, read these files in order:

1. `ROADMAP.md` — identify active phase and completed deliverables
2. `TASKS.md` — identify current task queue state
3. `DECISIONS.md` — recall all architectural decisions (check before any library/pattern choice)
4. `DEVELOPMENT_RULES.md` — enforce these rules in all guidance

For deeper context when needed:
- `ARCHITECTURE.md` — system boundaries and data flow
- `PROJECT_BRIEF.md` — business goals and MVP scope
- `AGENTS.md` — agent roles and handoff protocol
- `docs/cursor-workflow.md` — task lifecycle
- `PROJECT_OPERATIONS.md` — full operating model

---

## Notion Workspace

**Project Hub:** https://www.notion.so/33613205fce68182a043cc6ad0088c3e

Notion is the **monitoring surface**. The repository is the **source of truth**.
Claude owns the Notion workspace. Cursor never touches it.

**Key databases:**
- Task Tracker: `collection://a74e62ce-09da-455d-b2ee-7ade3d89ff47`
- Feature Tracker: `collection://c357977b-4718-4ce1-97d9-971f70c86ba1`
- Session Log: `collection://1b7a295a-6427-44c4-9bcd-00b9f03692a0`
- Decision Log: `collection://b10e204a-78f4-43c7-9aab-6fb25eb44203`

See `docs/notion/notion-sync-protocol.md` for the full sync checklist.

---

## Project State (updated each session)

**Monorepo:** `apps/storefront`, `apps/admin` (placeholder), `apps/backend` (placeholder)
**Active phase:** Pre-Phase 2 — Governance & Branding
**Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · Turborepo

### Phase 1 — COMPLETE ✅

All storefront foundation work is done:

- [x] Next.js 16 storefront scaffolded and running (`localhost:3000`)
- [x] Folder structure: `app/[locale]/(storefront)/`, `components/layout/`, `components/ui/`, `lib/`, `hooks/`, `messages/`
- [x] Design tokens in `globals.css` (`@theme` block — Tailwind v4)
- [x] `lib/cn.ts` — class-merging utility
- [x] UI components: `Button`, `Input`, `Card`/`CardHeader`/`CardBody`/`CardFooter`, `Badge`
- [x] Layout: `Header` (async Server Component), `Footer`, `Container`
- [x] `MobileMenu.tsx` — client component with toggle
- [x] `LocaleSwitcher.tsx` — working locale switcher, isolated client boundary
- [x] i18n: `next-intl` installed, `i18n/routing.ts`, `i18n/request.ts`, `middleware.ts`, `next.config.ts` wired
- [x] `app/[locale]/layout.tsx` — locale root layout with RTL/LTR, `NextIntlClientProvider`, `generateStaticParams`
- [x] `app/[locale]/(storefront)/layout.tsx` — storefront layout (Header + Footer)
- [x] `app/[locale]/(storefront)/page.tsx` — Phase 1 placeholder home page (all strings translated)
- [x] `app/[locale]/not-found.tsx` — 404 page with locale-aware back link
- [x] `messages/ar.json` + `messages/en.json` — complete: `common`, `nav`, `home`, `footer`, `errors`
- [x] Git initialized, pushed to `github.com/sama-link/sama-link-store` (latest: `f5297b8`)
- [x] Preview deployment live at `https://sama-link-store-storefront.vercel.app/` (ADR-013)
- [x] `DEPLOYMENT.md` created with project details, env var plan, deployment history

### Next up (Pre-Phase 2 sequence)
- [ ] Documentation & governance cleanup (ADR-014–018 added, Notion synced)
- [ ] Branding / design system definition (typography, color palette, logo)
- [ ] SEO foundation light (metadata, `robots.txt`, sitemap stub) — ADR-016
- [ ] INFRA-1: `packages/config` with shared `tsconfig.base.json` (optional but recommended)
- [ ] INFRA-2: `packages/types` with domain type definitions (optional but recommended)
- [ ] Phase 2: Medusa v2 backend + PostgreSQL + storefront integration

---

## Architecture Boundaries — Must Not Be Violated

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

## Decision Protocol

Before choosing any library, pattern, or approach:
1. Check `DECISIONS.md` — if already decided, follow it
2. If not decided, evaluate options and record a new ADR
3. Never adopt a different pattern than what's recorded without updating the ADR

Current locked decisions:
- **i18n:** `next-intl` (ADR-008)
- **Payments:** Stripe (ADR-007)
- **Backend:** Medusa v2 (ADR-003)
- **DB:** PostgreSQL (ADR-004)
- **TS:** Strict mode everywhere (ADR-005)
- **Git workflow:** Direct to `main` in Phase 1 only; branch workflow from Phase 2 (ADR-014)
- **UI:** Mobile-first mandatory (ADR-015)
- **SEO:** First-class architectural concern, not deferred (ADR-016)
- **Rendering:** Intentional per-route strategy required (ADR-017)
- **Commerce:** Adopt Medusa defaults before extending or rebuilding (ADR-018)

---

## Task Governance

When producing tasks for Cursor:
- Each task = one clearly bounded unit of work
- Every task must include: goal, scope, allowed files, forbidden files, acceptance criteria, out-of-scope
- Tasks must be ordered by dependency (no task assumes work that isn't done yet)
- Reference task IDs (e.g. `I18N-1`) when linking related work

When reviewing Cursor's output:
- Check acceptance criteria against the actual files modified
- Check for scope violations (files changed outside the allowed list)
- Check TypeScript compiles without errors (`tsc --noEmit`)
- Check `next build` succeeds
- Update `TASKS.md` only after review passes
- Update Notion Task Tracker to `Done` after review passes

---

## Mandatory Session End Protocol

Before ending any session:

**Repository:**
- [ ] All completed tasks marked `[x]` in `TASKS.md`
- [ ] New ADRs added to `DECISIONS.md`
- [ ] `ROADMAP.md` updated if phase milestone reached
- [ ] `.env.example` updated if new env vars introduced
- [ ] Build passes (`tsc --noEmit` + `next build`)

**Notion:**
- [ ] Task Tracker: completed tasks set to `Done`
- [ ] Task Tracker: new tasks added if created this session
- [ ] Feature Tracker: status updated if any feature progressed
- [ ] Decision Log: new ADRs added if created this session
- [ ] Session Log: new entry added (**mandatory every session**)
- [ ] Project Hub callout updated if phase changed

---

## What Claude Must NOT Do

- Do not implement features that belong to Cursor's task
- Do not approve scope expansion without recording it in DECISIONS.md
- Do not allow architecture changes without an ADR
- Do not mark tasks complete without verifying acceptance criteria
- Do not modify root `.gitignore`, `turbo.json`, or `package.json` without explicit user instruction
- Do not skip Notion sync at session end
