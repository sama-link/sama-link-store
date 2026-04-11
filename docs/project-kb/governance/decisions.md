# Architectural Decision Log — Sama Link Store

This file records significant technical and architectural decisions.
Format is lightweight ADR (Architecture Decision Record).

---

## ADR-001: Monorepo with Turborepo

**Date:** 2026-04-02
**Status:** Accepted

### Context
The project has three distinct applications (storefront, admin, backend) and shared code (types, UI components, configs). Managing these as separate repositories or a flat structure would create friction.

### Options Considered
- Single app (no monorepo)
- Turborepo monorepo with npm workspaces
- Nx monorepo

### Decision
Use Turborepo with npm workspaces. Turborepo is lighter than Nx, has excellent Next.js support, and is well-documented.

### Consequences
- Shared packages (`packages/types`, `packages/ui`, `packages/config`) can be imported across apps
- Turborepo handles incremental builds and caching
- All apps run from a single root with `npm run dev`
- Requires `turbo.json` pipeline configuration

---

## ADR-002: Next.js App Router for Storefront

**Date:** 2026-04-02
**Status:** Accepted

### Context
The storefront needs SSR/SSG for SEO, fast page loads, and server-side data fetching. Two options in Next.js: Pages Router (older) or App Router (new, React Server Components).

### Options Considered
- Next.js Pages Router
- Next.js App Router

### Decision
App Router. It is the current Next.js standard, provides Server Components by default (better performance, less client JS), and has better support for streaming, layouts, and nested routing.

### Consequences
- Default to Server Components; use `"use client"` only when necessary
- Data fetching happens in Server Components or Route Handlers
- Layout nesting must be deliberate
- Some third-party libraries may need `"use client"` wrappers

---

## ADR-003: Medusa v2 as Commerce Backend

**Date:** 2026-04-02
**Status:** Accepted

### Context
The project needs a full commerce backend: products, cart, checkout, orders, customers, payments. Building this from scratch is impractical.

### Options Considered
- Medusa v2 (open-source headless commerce)
- Shopify Headless (Hydrogen)
- Custom Express API

### Decision
Medusa v2. It is open-source, self-hostable, TypeScript-native, and provides a complete commerce module (cart, orders, products, payments, customers) that matches the project's needs.

### Consequences
- Backend is `apps/backend` — a Medusa app
- Storefront communicates with Medusa Store API
- Admin communicates with Medusa Admin API
- Medusa's module system allows extending without forking
- Locked to Medusa's data model conventions

---

## ADR-004: PostgreSQL as Primary Database

**Date:** 2026-04-02
**Status:** Accepted

### Context
Medusa v2 requires a relational database. PostgreSQL is the standard choice.

### Options Considered
- PostgreSQL
- MySQL/MariaDB
- SQLite (dev only)

### Decision
PostgreSQL. It is Medusa's primary supported database, widely hosted, and production-grade.

### Consequences
- Local development requires a PostgreSQL instance (Docker recommended)
- Production: managed PostgreSQL (Railway, Supabase, Neon, or AWS RDS)
- Medusa migrations manage schema

---

## ADR-005: TypeScript Everywhere, Strict Mode

**Date:** 2026-04-02
**Status:** Accepted

### Context
Type safety reduces runtime bugs and improves developer confidence, especially across apps sharing types.

### Decision
TypeScript strict mode (`"strict": true`) in all apps and packages. No `any` without explicit justification.

### Consequences
- Shared types in `packages/types` are the source of truth
- Medusa API response shapes must be typed
- Some third-party integrations may require type augmentation

---

## ADR-006: Admin App — Decision Deferred to Phase 6

**Date:** 2026-04-02
**Status:** Deferred

### Context
Two viable options for admin: Medusa's official Admin UI (React-based, bundled with Medusa) or a custom Next.js admin app.

### Options Considered
- Medusa Admin UI: fastest to stand up, less customizable
- Custom Next.js admin: full control, significantly more work

### Decision
Deferred to Phase 6. `apps/admin` is a placeholder. The decision will be made based on: how much customization is needed, team capacity, and Medusa Admin's capabilities at the time.

### Default assumption
Use Medusa Admin UI unless custom requirements make it insufficient.

---

## ADR-007: Stripe as Payment Gateway (MVP)

**Date:** 2026-04-02
**Status:** Accepted

### Context
The store needs a payment gateway for checkout. Stripe is the de-facto standard for international online payments.

### Options Considered
- Stripe
- PayPal
- Regional gateways (MyFatoorah, Tap Payments)

### Decision
Stripe for MVP. Widely supported by Medusa, excellent developer experience, available in target regions.

### Consequences
- Stripe keys must never be exposed to the client
- Stripe webhook verification is mandatory
- Regional gateway (e.g. Tap Payments) may be added in post-MVP if market demands it

---

## ADR-008: i18n — Arabic Primary, English Secondary

**Date:** 2026-04-02
**Status:** Accepted

### Context
The primary market is Arabic-speaking. Both Arabic (RTL) and English (LTR) must be supported.

### Decision
- Arabic is the primary locale (`ar`)
- English is secondary (`en`)
- Use `next-intl` for routing and string translation
- RTL/LTR handled via `<html dir>` attribute

### Consequences
- All UI strings must go through the i18n system — no hardcoded text in components
- Two message files: `messages/ar.json` and `messages/en.json`
- RTL layout must be tested throughout development
- Locale prefix in URLs: `/ar/...` and `/en/...`

---

## ADR-009: Search — Defer Meilisearch to Phase 7

**Date:** 2026-04-02
**Status:** Accepted

### Context
Product search is needed but adding Meilisearch in early phases adds operational complexity.

### Decision
Use Medusa's built-in basic search for Phases 1–6. Add Meilisearch in Phase 7 for production-quality full-text search.

### Consequences
- Basic search works from the start (via Medusa)
- Fast typo-tolerant search is a Phase 7 concern
- Meilisearch integration will require a Medusa search plugin

---

## ADR-010: Image Storage — S3-Compatible Object Storage

**Date:** 2026-04-02
**Status:** Accepted

### Context
Product images need to be stored and served efficiently. Local disk storage is not suitable for production.

### Decision
S3-compatible object storage. AWS S3 or Cloudflare R2 (cheaper egress, same API). Decision between AWS and R2 deferred to Phase 3 setup.

### Consequences
- Medusa's file plugin handles uploads
- Images served via CDN URL (CloudFront or R2 public bucket)
- `next/image` handles optimization with configured remote patterns

---

## ADR-011: Dual-Agent Development Model (Claude + Cursor)

**Date:** 2026-04-02
**Status:** Accepted

### Context
The project requires consistent architectural governance across many development sessions. Using a single AI agent for both planning and implementation creates risk of architectural drift, scope creep, and undocumented decisions.

### Options Considered
- Single agent (Claude or Cursor) handles everything
- Claude = architect/governor, Cursor = implementer
- Human-only implementation with Claude for review only

### Decision
Claude (Claude Code CLI) owns architecture, task decomposition, documentation, and review. Cursor owns implementation only. Every task flows through a brief format that defines scope, forbidden files, and acceptance criteria.

### Consequences
- All task briefs must follow the format in `docs/project-kb/governance/agents.md`
- Cursor must not modify governance files (`docs/project-kb/governance/decisions.md`, `docs/project-kb/definition/architecture.md`, etc.)
- Claude must review every completed task before marking it done in `docs/project-kb/operations/tasks.md`
- Architecture changes require an ADR before implementation begins
- `.cursor/rules/` files encode the operating constraints into Cursor's context

---

## ADR-012: Tailwind v4 CSS-Only Configuration

**Date:** 2026-04-02
**Status:** Accepted

### Context
The project uses Tailwind CSS v4 (installed via `@tailwindcss/postcss`). Tailwind v4 changed the configuration model — there is no `tailwind.config.js` file. Instead, all theme customization happens in CSS via the `@theme` block.

### Decision
All design tokens (colors, radius, shadows, spacing overrides) are defined in `app/globals.css` using `@theme`. No `tailwind.config.js` or `tailwind.config.ts` is created.

### Consequences
- Token names in `@theme` generate Tailwind utility classes automatically (e.g. `bg-brand`, `text-text-primary`)
- To add a new token: add it to `globals.css` `@theme` block — Claude must approve
- Any Tailwind v4 documentation or examples should be used, not v3 docs
- `tailwind-merge` (via `cn()`) works correctly with v4 class names

---

## ADR-014: Direct-to-Main Git Workflow (Phase 1 Exception)

**Date:** 2026-04-02
**Status:** Accepted (time-limited)

### Context
docs/project-kb/governance/development-rules.md §9 specifies a `develop` branch, feature branches, and PRs. In practice, all Phase 1 work has been committed directly to `main` with no branching, which is a deliberate deviation.

### Decision
Allow direct commits to `main` for Phase 1 solo development. This exception is explicitly time-limited. From Phase 2 onward — when the backend is introduced and multiple concerns diverge — the full branch workflow (`develop`, feature branches, PRs) must be enforced.

### Consequences
- Phase 1 commits are direct to `main`, each scoped to a single reviewed task
- `main` is the only branch; Vercel auto-deploys on every push
- Phase 2 kick-off requires creating a `develop` branch and updating CI/deployment config
- This ADR must be revisited before any second contributor (human or agent) joins the codebase

---

## ADR-015: Mobile-First UI is Mandatory

**Date:** 2026-04-02
**Status:** Accepted

### Context
The primary market is Arabic-speaking, predominantly mobile. All UI design and implementation must reflect this. Desktop experience is important but secondary.

### Decision
All UI components and layouts must be designed and implemented mobile-first (320–480px baseline). Desktop layouts are progressive enhancements via Tailwind breakpoints (`sm:`, `md:`, `lg:`). No component ships without a verified mobile layout. RTL must be confirmed on mobile as the primary case.

### Consequences
- Tailwind classes are written mobile-first; desktop overrides are `sm:` or larger
- Component reviews must check mobile layout before desktop
- No `hidden` class that hides critical UI on mobile without a mobile alternative
- Lighthouse mobile score is the primary performance target (not desktop)

---

## ADR-016: SEO and AI Discovery are First-Class Architectural Concerns

**Date:** 2026-04-02
**Status:** Accepted

### Context
Sama Link Store is an SEO-dependent e-commerce platform. Organic discovery via search engines and AI assistants (LLM-powered search) is a primary acquisition channel. SEO is not a Phase 7 afterthought — it shapes architecture from Phase 1 onward.

### Decision
SEO and discoverability requirements are baked into the architecture:
- Every page must export `generateMetadata` with accurate `title`, `description`, and `openGraph` values
- Structured data (JSON-LD) is required on product, collection, and breadcrumb pages from the moment those pages exist
- A `sitemap.xml` and `robots.txt` are created before Phase 2 ships
- `next/image` is mandatory for all images (correct `alt`, dimensions, formats)
- URLs must be clean, locale-prefixed, and canonical — no duplicate content between `/ar/` and `/en/`

### Consequences
- Page briefs must include metadata as a required deliverable, not optional
- Product and category page templates designed with structured data from the start
- SEO audit is a Phase 2 exit criterion, not deferred to Phase 7
- A lightweight SEO foundation task (metadata, sitemap, robots.txt) is inserted before Phase 2

---

## ADR-017: Rendering Strategy and Caching Must Be Intentional

**Date:** 2026-04-02
**Status:** Accepted

### Context
Next.js App Router defaults can produce unexpected dynamic rendering or stale cached responses. As the storefront grows, undefined rendering behaviour becomes a performance and correctness risk.

### Decision
Every route type must have an explicit rendering strategy defined when it is created:

| Route type | Strategy |
|---|---|
| Home page | Static (ISR, revalidate: 3600) |
| Product listing | ISR (revalidate: 300) |
| Product detail | ISR (revalidate: 60) |
| Cart / Checkout | Dynamic (no cache) |
| Account pages | Dynamic, authenticated |
| 404 / Error | Static |

- No route ships without a declared caching/rendering strategy
- `fetch()` calls must include explicit `cache` or `next.revalidate` options
- `export const dynamic = 'force-dynamic'` is only used with justification

### Consequences
- Route briefs must include rendering strategy as a required field
- `generateStaticParams` is used for all locale and slug routes
- Performance reviews check rendering mode as part of acceptance criteria

---

## ADR-018: Adopt > Extend > Rebuild

**Date:** 2026-04-02
**Status:** Accepted

### Context
The project uses Medusa v2 as a full commerce backend. Medusa provides modules, workflows, and an Admin UI out of the box. The risk is re-implementing what Medusa already provides.

### Decision
When a commerce capability is needed, evaluate in this order:

1. **Adopt** — use the Medusa module, plugin, or Admin UI as-is
2. **Extend** — customise via Medusa's extension points (custom modules, workflows, API routes)
3. **Rebuild** — only if Medusa's approach is fundamentally incompatible with a documented requirement

Rebuilding requires an explicit ADR with justification. "We want more control" or "it would be faster" are not sufficient justifications.

### Consequences
- Default to Medusa Admin UI for Phase 6 (admin dashboard)
- Default to Medusa cart, order, and customer modules — do not replicate in custom code
- Any deviation from Medusa defaults must be documented as an ADR before implementation begins
- Medusa version is pinned in `package.json`; upgrades are reviewed before applying

---

## ADR-013: Early Preview Deployment Before Phase 8

**Date:** 2026-04-02
**Status:** Accepted

### Context
The original roadmap (docs/project-kb/operations/roadmap.md) places deployment at Phase 8 (post-hardening, post-testing). The project is currently in Phase 1 (Storefront Skeleton). The decision was made to create an early preview deployment on Vercel to enable visual review, stakeholder feedback, and URL-based testing during active development.

### Options Considered
- Wait for Phase 8 to deploy (original plan)
- Deploy now as a preview/review environment (selected)

### Decision
Deploy the storefront to Vercel as a **preview deployment** during Phase 1. This is not a production launch. The Phase 8 production deployment milestone remains unchanged. The preview URL is for development review only — not shared publicly as a product.

### Consequences
- A `docs/project-kb/operations/deployment.md` file tracks deployment details, environment URLs, and verification status
- The preview deployment is connected to the `main` branch on GitHub
- Subsequent pushes to `main` trigger automatic Vercel preview builds
- Production deployment (Phase 8) will require a separate Vercel project or promotion from preview
- `RELEASE-1` through `RELEASE-6` task track manages this work

---

## ADR-019: Design Modification Protocol

**Date:** 2026-04-02
**Status:** Accepted

### Context
As UI work progresses across phases, design changes (typography, color, spacing, layout) will be made by Cursor under Claude's supervision. Without a defined protocol, design tasks risk touching business logic, routing, i18n, or SEO architecture — either accidentally or through scope creep. A structured boundary system is needed to enable fast UI iteration without breaking system integrity.

### Options Considered
- No formal protocol — rely on task briefs to define scope each time
- Lightweight checklist in docs/project-kb/governance/development-rules.md only
- Full Design Modification Protocol with layer boundaries, design modes, review gate, and integration with the enforcement system (selected)

### Decision
Adopt the **Design Modification Protocol** as a mandatory governance layer integrated into the existing enforcement system. It defines three design layers (Safe, Restricted, Forbidden), two design modes (Safe Mode, Exploration Mode), a mandatory pre-declaration step before every design task, and a review gate after every design task. All styling must use `@theme` tokens — no hardcoded values in components.

### Consequences
- Every design task must declare its mode (SAFE or EXPLORATION) before implementation begins
- Cursor must output a pre-declaration block before writing any code: files to change, visual changes, what will not be touched
- Pages in the Critical UI Boundary (product, cart, checkout, auth) are permanently STRICT DESIGN MODE — no structural changes
- The review gate is mandatory: Claude validates token usage, forbidden file boundaries, and RTL/LTR integrity after every design task
- Violations of the forbidden layer are treated the same as architecture violations — task is rejected and a correction brief is issued
- See `docs/project-kb/governance/development-rules.md` Rule 13 and `docs/project-kb/operations/project-operations.md` Section 10 for full implementation detail


---

## ADR-020: Brand Identity & Media Foundation as Phase 2 Prerequisite

**Date:** 2026-04-03
**Status:** Accepted

### Context
Phase 2 was declared active with the close of Pre-Phase 2. However, before any backend integration begins, two foundational concerns must be addressed: (1) the brand identity in the codebase does not reflect the actual logo — current tokens use a purple-navy brand color and a red accent that have no relationship to the Sama Link logo palette; (2) there is no formal protocol governing how media assets enter the repository, resulting in raw source PNGs already present at the repo root.

Raw brand assets (`sama-link_brand-assets_FULL/`) were provided and analyzed. The logo is a raster-only asset (no SVG source) featuring a dual-droplet mark with steel blue and charcoal colors. The `_on-dark` full lockup variants have broken exports (white text on white canvas) and must be re-exported with transparent backgrounds before dark mode use. The color identity of the logo — steel blue `#4b8fc4` and deep navy `#1c3d6b` — directly conflicts with the current red accent and purple-navy tokens.

### Decision
Insert a brand identity and media foundation sequence (BRAND-2 through BRAND-5 + MEDIA-1) as a blocking pre-work requirement before Phase 2 backend tasks begin. The sequence is:

1. **MEDIA-1**: Define and commit a Media Intake Protocol governing all media assets entering the project
2. **BRAND-2**: Extract production-ready logo variants (WebP) following MEDIA-1; note `_on-dark` re-export requirement
3. **BRAND-3**: Replace current color tokens with a semantic palette derived directly from the logo identity
4. **BRAND-4**: Implement a class-based light/dark theme system using CSS variable overrides in Tailwind v4
5. **BRAND-5**: Apply logo and brand tokens to all global surfaces (header, nav, footer, menus)

Raw source files (`sama-link_brand-assets_FULL/`) are added to `.gitignore`. Only production-optimized outputs enter the repo under `public/brand/`.

### Color token changes
- `--color-brand`: `#1a1a2e` → `#1c3d6b` (deep navy from logo)
- `--color-accent`: `#e94560` → `#4b8fc4` (steel blue from logo)
- All other derived accent tokens updated to match
- New: `--color-charcoal`, `--color-charcoal-muted` from logo mark

### Consequences
- Phase 2 backend work (BACK-1) does not begin until BRAND-5 is complete and accepted
- The red accent color `#e94560` is removed from the project — any component using it must be updated in BRAND-3
- A `docs/project-kb/implementation/media-intake-protocol.md` governance document is created and enforced from this point forward — no media asset enters the repo without following it
- SVG source files for the logo do not exist; WebP is the production format; if SVG is later provided by the designer, it supersedes the WebP logo under the same naming convention
- The `_on-dark` full lockup PNG variants are flagged as broken exports — a designer re-export with transparent backgrounds is required before full dark mode logo implementation
- BRAND-4 implements class-based dark mode using `html.dark` class toggling — not system-preference-only — to give users explicit control
- All BRAND tasks operate under ADR-019 (BRAND-3: SAFE MODE; BRAND-4 and BRAND-5: EXPLORATION MODE)

---

## ADR-021: Multi-Agent Team Architecture — Advisory + Execution Layers

**Date:** 2026-04-04
**Status:** Accepted

### Context
As the project enters Phase 2 (backend integration), task complexity increases. A single architect/executor model (Claude + Cursor) creates a bottleneck when strategic decisions require research, business logic design, or UX analysis that benefits from broader perspectives. At the same time, introducing more AI agents without strict boundaries risks data pollution, hallucinated context, and conflicting decisions being written to the codebase or Notion.

### Options Considered
- Keep the dual-agent model (Claude + Cursor) unchanged
- Add AI consultants with unrestricted access to Notion and GitHub
- Add AI consultants in a read-only advisory layer, routing through Human (selected)

### Decision
Adopt a four-layer multi-agent architecture with a strict One-Way Data Flow:

```
[Consultants: ChatGPT + Gemini]
        ↓  (read-only advice)
[Human Router]
        ↓  (approved strategies written to Notion)
[Claude CLI — Tech Lead]
        ↓  (task briefs)
[Cursor / Codex — Executors]
```

**Layer 1 — Advisory (Consultants):**
- **ChatGPT**: Strategic Consultant — system architecture, business logic, pricing strategy, UX/UI flows
- **Gemini**: Practical Consultant — framework/library research, algorithmic problem-solving, technical comparisons
- Both have READ-ONLY access to project context shared by the Human
- Neither writes to Notion, GitHub, or the local folder under any circumstances
- Neither produces production code, config files, or ADRs directly

**Layer 2 — Routing (Human):**
- The Human is the sole bridge between the Advisory and Execution layers
- Approved consultant strategies are manually transferred into Notion by the Human
- No direct consultant → Claude pipeline; every input is Human-reviewed first

**Layer 3 — Orchestration (Claude CLI):**
- Reads approved strategies from Notion
- Translates strategies into task briefs with scope, acceptance criteria, and forbidden files
- Maintains all governance documents (`docs/project-kb/governance/decisions.md`, `docs/project-kb/operations/tasks.md`, `docs/project-kb/operations/roadmap.md`, `CLAUDE.md`)
- Reviews Cursor's output before any task is marked complete
- Owns Notion sync (Task Tracker, Session Log, Decision Log, Feature Tracker)
- Does NOT implement product features

**Layer 4 — Execution (Cursor / Codex):**
- Implements product code based on Claude's task briefs
- READ/WRITE access to the local folder only
- Never touches governance files
- Never commits directly to `main`

### Consequences
- Consultants must be given a system prompt that enforces their read-only, no-code boundaries (contracts stored in `docs/project-kb/governance/actors/chatgpt-contract.md` and `docs/project-kb/governance/actors/gemini-contract.md`)
- Claude never pulls strategy directly from consultants — only from Human-approved Notion entries
- ADR-011 (Dual-Agent Model) is superseded by this ADR for overall team structure; its task brief format and Cursor constraints remain in force
- Any new AI agent introduced to the team requires an ADR update before it is granted any access
- The Human retains final authority over all strategic decisions — consultants advise, they do not decide

---

## ADR-022: Actor Identity V2 — Layered Behavioral Contract System

**Date:** 2026-04-05
**Status:** Accepted

### Context

The existing system defines all agents using operational roles (purpose, responsibilities, authority boundaries). This provides execution alignment but does not enforce behavioral consistency, decision-making alignment, or ambiguity handling. Long sessions and complex tasks have exposed risks: scope creep, premature optimization, inconsistent interpretation of instructions, and output drift. The dual-agent brief format (ADR-011) and team architecture (ADR-021) define *what* each actor does but not *how* each actor reasons, validates, and self-corrects.

### Options Considered

- Keep operational-only role definitions (current state)
- Add philosophical guidance as freeform prose in docs/project-kb/governance/agents.md
- Upgrade all actors to a Layered Identity Specification — Structural + Operational + Philosophical + I/O Contract + Validation Hooks (selected)

### Decision

Upgrade all actor definitions from "role descriptions" to **5-layer Behavioral Contracts (Actor Identity V2)**. Each actor is now defined by:

1. **Structural Identity** — name, layer position, primary function
2. **Operational Identity** — responsibilities, authority boundaries, inputs/outputs
3. **Philosophical Identity** — core mission, values, temperament, failure modes
4. **Instruction Handling Model (I/O Contract)** — interpretation mode, ambiguity protocol, escalation path
5. **Validation & Alignment Hooks** — pre-execution checks, self-alignment, drift signals

**Artifacts produced:**
- `docs/project-kb/governance/actors/claude-contract.md` — compiled behavioral contract for Claude CLI (V2.1)
- `docs/project-kb/governance/actors/identity-template.md` — reusable V2 template for all actors
- `docs/project-kb/governance/history/actor-identity-migration-plan.md` — per-actor migration specification
- `docs/project-kb/governance/agents.md` — task brief format upgraded to V2 (strict, ambiguity-proof)
- Notion Actor Identity Registry — V2 identity pages created for all actors at time of this ADR (note: 'Layer 5 extension' referenced the now-deprecated 7-layer workspace model; 4-layer model is authoritative; actor set was subsequently extended by ADR-023, which added Codex as the 6th actor)

**Interpretation Modes (locked per actor):**
- Cursor: **Literal** — execute exactly what is written, no inference
- Claude: **Analytical** — extract constraints, reconstruct intent, validate before acting
- ChatGPT / Gemini: **Advisory** — frame outputs as proposals, never directives
- Human: **Evaluative** — judge quality and risk of inputs before routing

**Claude's internal validation (mandatory, not user-visible):**
Before every output, Claude checks: inputs clear? constraints identified? action within authority? conflict with ADRs? Any failure → escalate instead of proceed.

### Consequences

- ADR-021 is **extended** (not superseded) by this ADR — team structure unchanged, identities deepened
- ADR-011 task brief format is superseded by the V2 brief format in docs/project-kb/governance/agents.md
- Human must update ChatGPT and Gemini system prompts to add Philosophical Identity and Drift Signals sections (flagged in migration plan)
- Consultant behavioral contracts in `docs/project-kb/governance/actors/` must be kept in sync with Notion Actor Identity Registry
- All future actors introduced to the system require a V2 identity before being granted any access (extends ADR-021's "any new agent requires ADR update" rule)

---

## ADR-025: Backend Specialist Executor — Layer 4 Domain-Specialized Actor

**Date:** 2026-04-11
**Status:** Accepted

### Context

Phase 2 backend work (BACK-2 through BACK-6) requires deep Medusa v2 knowledge: PostgreSQL migration management, service/subscriber patterns, Stripe webhook wiring, CORS configuration, and seed scripting. Codex (ADR-023) is the current advanced executor and can handle these tasks, but without a backend-specific identity every task brief must carry the full Medusa domain context — the correct extension level, security rules for secrets, migration safety expectations, and API boundary rules — to compensate for a generalist contract.

This increases brief length, increases the chance that critical backend constraints are omitted under time pressure, and produces less consistent output across the BACK-* task series.

### Options Considered

- Continue using general Codex for all backend work — briefs must carry full domain context every time
- Add backend context as a briefing annex rather than an actor identity — still ad hoc, no persistent contract
- Define Backend Specialist as a distinct Layer 4 actor with a domain-specific identity contract (selected)

### Decision

Add **Backend Specialist** as a Layer 4 Execution actor under the same authority model as Codex (ADR-023). The Backend Specialist identity is invoked by Claude writing `Target Executor: Backend Specialist` in a task brief. The Human loads `docs/project-kb/governance/actors/backend-specialist-contract.md` alongside the brief when submitting to the execution environment.

**Key design constraints:**
- Authority level: identical to Codex — no architectural authority, no governance write authority, no Notion authority
- Interpretation mode: Analytical-Literal — same as Codex
- Scope of specialization: Medusa v2 backend, PostgreSQL, integration layer only
- Medusa extension hierarchy (ADR-018 Adopt > Extend > Rebuild) is a hard constraint this actor enforces before proposing any backend pattern
- The Backend Specialist does NOT extend beyond the execution layer — it is not a backend architect

### Consequences

- Claude may now specify `Target Executor: Backend Specialist` in task briefs for BACK-2 through BACK-6 and future backend-domain tasks
- Task briefs targeting Backend Specialist may omit detailed Medusa domain context already covered by the contract, keeping briefs focused on scope and acceptance criteria
- Backend Specialist is subject to all shared team principles (`governance/team-principles.md`) and the authority model (`governance/authority-model.md`) without exception
- `governance/actors/backend-specialist-contract.md` is the canonical contract; Notion Actor Identity Card mirrors it
- `docs/project-kb/governance/skill-framework.md` Execution Skills table is unchanged — Backend Specialist declares skills from that table without adding new skill definitions
- ADR-023 is extended (not superseded) — Backend Specialist is a third Layer 4 actor alongside Cursor and Codex

---

## ADR-024: Team Operating Foundation — Shared Principles, Authority Model, and Skill Framework

**Date:** 2026-04-11
**Status:** Accepted

### Context

The multi-agent team is defined by 6 actors with detailed V2 behavioral contracts (ADR-022/ADR-023). As the project advances through Phase 2 and beyond, new specialized agents will need to be added. The current state has three structural problems:

1. **Shared principles are scattered.** Anti-drift behavior, escalation rules, boundary respect, and truth-source discipline exist in the constitution, agents.md, individual actor contracts, and the task brief format — but not in a single agent-consumable document. Every new agent contract must re-derive or re-define these principles, creating drift risk.

2. **The authority model is not consolidated.** What requires an ADR, what is human-only, and what each authority level permits are spread across constitution.md and agents.md. There is no single reference that answers "what does this action require?" without reading multiple documents.

3. **Skills have no vocabulary.** There is no formal model distinguishing shared skills (inherited by all agents) from specialized skills (domain-specific). New agent contracts cannot declare capabilities consistently, creating duplication and ambiguity about what knowledge grounds each agent's behavior.

### Options Considered

- Continue building agent contracts without a shared base (current approach) — accepted for 6 actors, unsustainable for 12+
- Consolidate into a single "super-constitution" document — too monolithic; loses the separation of governance concerns
- Create three focused documents that extend the constitution (selected)

### Decision

Formalize three governance documents as the shared team foundation:

1. **`docs/project-kb/governance/team-principles.md`** — Shared behavioral principles for all agents (anti-drift, role discipline, escalation, boundary respect, truth-source discipline, review expectations, ambiguity handling). This is the behavioral floor every agent inherits.

2. **`docs/project-kb/governance/authority-model.md`** — Consolidated authority reference consolidating decision gate matrix, authority levels, human-only decisions, ADR requirements, and the escalation chain into one document. Individual agent contracts reference this instead of replicating the model.

3. **`docs/project-kb/governance/skill-framework.md`** — Shared and specialized skill vocabulary. Shared skills are inherited by all agents without re-definition. Specialized skills are declared per agent using this vocabulary, mapped to specific KB documents.

Additionally:
- **`docs/project-kb/governance/actors/identity-template.md`** is upgraded to include a Skills Profile section and a "How to Use" guidance block — making it the complete entry point for defining any future agent.
- **`docs/project-kb/governance/team-blueprint.md`** is created as a planning artifact proposing the first specialized team expansion wave.

### Consequences

- All future agent contracts reference `team-principles.md` as the shared behavioral base — they do not re-define shared principles
- Authority decisions are looked up in `authority-model.md` — not reconstructed per actor
- New agents declare their specialized skills using `skill-framework.md` vocabulary — no ad-hoc capability claims
- The identity template is the single entry point for defining new agents — complete with foundation references
- ADR-022 is **extended** (not superseded) — V2 layered structure preserved; foundation documents added beneath it
- ADR-021's "any new agent requires an ADR" rule is unchanged; the foundation makes that ADR easier to write
- `docs/project-kb/README.md` updated to index the three new governance documents

---

## ADR-023: Actor Identity V2.1 — Team Refinement (ChatGPT Companion, Gemini Commercial Guard, Codex Executor)

**Date:** 2026-04-05
**Status:** Accepted

### Context

After the ADR-022 migration, several actor definitions remained too rigid or incomplete relative to the intended real-world workflow. ChatGPT was framed as a cold formal strategist, losing its natural companion value. Gemini was framed as a passive research tool, missing its active anti-drift function. No actor existed for complex, broad-scope implementation tasks — Cursor's strictly literal model is intentionally narrow and cannot handle backend, infrastructure, or multi-system tasks without excessive fragmentation.

### Decision

**A) ChatGPT → Strategic Companion / Reflective Consultant (Rafiq)**
Redefine ChatGPT as a warm, reflective thinking partner. Key changes:
- Arabic-first communication; technical terms preserved
- Identifies Human intent at conversation start before assuming context
- Scenario exploration, trade-off analysis, depth calibration per Human's need
- Helps draft briefs and prompts for Claude
- Helps monitor Notion consistency with Human
- Aware of Gemini as a parallel consultant; participates in shared deliberations
- Optional companion name: Rafiq (رفيق)
- Output format: flexible — no mandatory "Open Questions for Tech Lead" on every response
- Advisory-only constraints preserved

**B) Gemini → Scientific, Practical & Commercial Consultant (Jimi / جيمي)**
Redefine Gemini as an active commercial discipline and anti-drift guard. Key changes:
- Optional companion name: Jimi (جيمي)
- Anti-drift across four dimensions: business goal drift, ADR/rules drift, resource waste, overengineering
- Proactive — surfaces warnings even when not explicitly asked
- Explains concepts accessibly before going deep
- Participates in shared deliberations with Rafiq/ChatGPT + Human
- Output format: pragmatic — warnings/clarifications over rigid structure; no mandatory "Open Questions"
- Advisory-only constraints preserved

**C) Codex → Advanced Executor (new actor, Layer 4)**
Add Codex as a second execution actor with a different scope and interpretation model:
- Handles complex, broad-scope, or technically deep implementation tasks
- Interpretation mode: Analytical-Literal (scope fixed by brief; implementation approach may be reasoned through, with documentation)
- Also usable for smaller tasks to preserve Cursor usage limits
- Still under Claude orchestration — no architectural authority
- Claude specifies target executor (`Cursor` or `Codex`) in each task brief via `Target Executor:` field

**D) Task Brief V2 updated**
Brief header adds `Target Executor:` field. Interpretation Mode section updated to cover both Cursor (Literal) and Codex (Analytical-Literal).

### Consequences

- ADR-022 is **extended** (not superseded) — V2 layered structure preserved, actor personas and execution topology refined
- ADR-021 team architecture extended from 5 actors to 6 actors
- docs/project-kb/governance/agents.md system flow diagram updated to show dual executor paths
- Quick Reference table updated to include Codex column and ChatGPT/Gemini distinction
- Notion Actor Identity Cards: ChatGPT and Gemini updated to V2.1; Codex page created
- Human must update ChatGPT and Gemini Custom Instructions with V2.1 additions (personality, anti-drift role, relaxed output format) — flagged in each actor's Notion page

---

## ADR-026: Security Reviewer — Layer Review Sublayer Specialized Auditor

**Date:** 2026-04-11
**Status:** Accepted

### Context

Phase 2 backend work produces code that touches security-critical surfaces: secret handling in environment variables, CORS policy configuration, API endpoint authentication, webhook signature verification, and input validation. Claude currently performs all review. As the backend codebase grows and BACK-2 through BACK-6 introduce real configuration and integration code, security review becomes too domain-specific for a generalist review pass alone.

SEC-1 (security baseline task) will produce the canonical security baseline document. A dedicated Security Reviewer role, invoked as a specialized review pass after security-relevant executor output, enforces that baseline systematically rather than through ad hoc checklist review.

Without this role, security gaps can survive review because they require a focused, criterion-by-criterion audit that competes with other review concerns (correctness, type safety, scope compliance) in a single pass.

### Options Considered

- Continue using Claude's general review for all security checks — all review in one pass, no specialization
- Add security checks as an annex to every task brief — still ad hoc, adds brief complexity
- Define Security Reviewer as a dedicated review-layer identity invoked by Claude on security-relevant output (selected)

### Decision

Add **Security Reviewer** as a Review sublayer actor. The Security Reviewer is invoked by Claude after executor output on tasks that touch: secrets configuration, CORS settings, API endpoint authentication, webhook handlers, or input validation. Claude writes "Security Review Required" in the task brief or issues a post-execution security review request; the Human loads this contract alongside the relevant output.

**Key design constraints:**
- Authority level: Review only — no write, no execution, no governance, no architecture
- Scope: Backend code and configuration (`apps/backend/`) and any storefront API integration layer
- Activation trigger: SEC-1 completion + any output that touches security-critical surfaces
- Report format: Pass/Fail per criterion; severity classification (Critical / Major / Minor); required action per finding
- Critical findings block merge; Major findings must be resolved before the next batch closes; Minor findings are tracked

### Consequences

- Claude may now invoke a Security Review pass on BACK-* output before marking any security-relevant task done
- The Security Reviewer is the second Review sublayer actor (Claude CLI remains primary — Security Reviewer provides the specialized security lens)
- `governance/actors/security-reviewer-contract.md` is the canonical contract; Notion Actor Identity Card mirrors it
- `governance/authority-model.md` Write Access table updated to include Security Reviewer
- SEC-1 must complete before the Security Reviewer is used in production review — pre-SEC-1 use is optional for high-confidence security checks (e.g., secrets discipline on BACK-6)
- No new skills are added to `skill-framework.md` — Security Reviewer declares existing skills from that table
- ADR-021 is extended (not superseded) — Security Reviewer is a Review sublayer actor alongside Claude CLI

---

## ADR-027: Literal Executor — Layer 4 Default Execution Actor Contract

**Date:** 2026-04-11
**Status:** Accepted

### Context

The Literal Executor has been the default execution actor since ADR-021 (multi-agent architecture) and ADR-023 (executor roles formalized). It is invoked by default on every task brief where Claude does not specify a different executor. Despite being the most frequently invoked actor in the system, it has never had a standalone identity contract file — its behavioral definition exists only inline in `governance/agents.md`.

Without a standalone contract, the Literal Executor cannot self-load a complete identity context the way the Advanced Executor (Codex), Backend Specialist, and Security Reviewer can. This creates a documentation gap and a behavioral-consistency risk as the team grows.

### Decision

Formalize the Literal Executor's identity in a standalone V2 contract using the identity template (ADR-022 / ADR-024). The contract extracts and formalizes the behavioral definition from `governance/agents.md` without changing any of the established rules.

**Key contract decisions:**
- Layer: 4 — Execution
- Status: Active (role is already in production use)
- Interpretation mode: Literal — zero inference, zero assumption, zero scope extension
- Ambiguity threshold: Zero — every gap between brief and observable reality is an escalation trigger
- Default executor rule: When `Target Executor` is not specified in a brief, Literal Executor is the default
- Specialized skills are brief-domain-dependent: storefront skills activate on storefront briefs; backend skills activate on backend briefs

### Consequences

- `governance/actors/literal-executor-contract.md` is the canonical contract; Human may load it for any brief where the Literal Executor is the target
- No behavioral change — the contract formalizes existing rules, does not introduce new ones
- The default executor rule (no `Target Executor` field = Literal Executor) is explicitly recorded in the contract
- ADR-021 is extended (not superseded) — Literal Executor is Layer 4 default execution actor

---

## ADR-028: TypeScript Quality Reviewer — Review Sublayer Type-Safety Auditor

**Date:** 2026-04-11
**Status:** Accepted

### Context

As the codebase grows past Phase 2, TypeScript type-safety drift becomes harder to catch in a generalist review pass. `tsc --noEmit` passing is necessary but not sufficient — structural type issues, `any` creep, missing type exports, and architecturally weak typing can compile without errors but create maintenance debt and runtime ambiguity at scale. Phase 3 introduces complex product data types, Medusa response shape typing, and catalog models that require a dedicated type-safety lens.

### Decision

Define a **TypeScript Quality Reviewer** as a Review sublayer actor. The TS Quality Reviewer is invoked by Claude after executor output on tasks that produce or modify complex TypeScript types — new interfaces, Medusa response shapes, shared package types, or generic type structures. Claude writes `TypeScript Review Required: Yes` in the brief or issues a post-delivery TS review request.

**Key design constraints:**
- Authority level: Review only — no write, no execution, no governance, no architecture
- Status: Inactive — activation trigger is Phase 3 start
- Audit criterion: `any` usage, missing type coverage, generic constraint discipline, shared type export structure, `tsc` passing is the floor not the bar
- Report format: criterion-by-criterion; severity classification (Major / Minor); required action per finding
- Major findings block next batch close; Minor findings are tracked follow-ups

### Consequences

- Claude may invoke a TS Review pass on executor output for type-heavy tasks beginning Phase 3
- `governance/actors/ts-quality-reviewer-contract.md` is the canonical contract
- No new skills added to `skill-framework.md` — TS Quality Reviewer declares existing skills from that table
- ADR-021 is extended (not superseded) — TS Quality Reviewer is a Review sublayer actor

---

## ADR-029: Knowledge Base Keeper — Documentation Sublayer Maintenance Agent

**Date:** 2026-04-11
**Status:** Accepted

### Context

The KB has grown reactively — documents were created when urgently needed, not always maintained as implementations evolved. The `Document` authority level already exists in `governance/authority-model.md` (`Claude CLI (current); future: dedicated documentation agent`) but no dedicated agent has been defined to hold it. As Phase 3 introduces catalog patterns, search, and media handling, implementation patterns will stabilize faster than documentation can track without a dedicated alignment function.

Without a dedicated KB maintenance capability, documentation drift accumulates silently until it causes planning failures — executors implement against stale patterns, briefs are written from incorrect KB state, and reviews catch drift that should have been caught earlier.

### Decision

Define a **Knowledge Base Keeper** as a Documentation Sublayer actor, activating the `Document` authority level already defined in the authority model. The KB Keeper receives alignment requests from Claude, reads KB documents and implementation files, identifies gaps and drift, and produces structured KB Update Proposals — it does not self-apply changes.

**Key design constraints:**
- Authority level: Document (already defined) — scoped to `implementation/` KB alignment; no governance document writes
- Status: Inactive — activation trigger is Phase 3 lead-up
- Output: KB Update Proposals (one per gap) + KB Gap Report; all changes applied by Claude after review
- Scope: `docs/project-kb/implementation/` alignment only; governance documents and ADRs are out of scope

### Consequences

- Claude may invoke KB Keeper for alignment checks after batch completions or before phase transitions beginning Phase 3 lead-up
- `governance/actors/kb-keeper-contract.md` is the canonical contract
- `governance/authority-model.md` updated: Document authority row now references KB Keeper as defined inactive holder
- No new skills added to `skill-framework.md` — KB Keeper declares existing shared and orchestration skills
- ADR-021 is extended (not superseded) — KB Keeper is a Documentation Sublayer actor

---

## ADR-030: QA / Regression Validator — Execution/Review Sublayer Quality Gate

**Date:** 2026-04-11
**Status:** Accepted

### Context

No systematic quality or regression check exists in the current team. Phase 3 (catalog) and Phase 4 (cart/checkout) introduce stateful user flows — cart operations, checkout, authentication, order confirmation — where code review alone cannot verify that flows work end-to-end after each task. A broken checkout is a production incident; finding it only during Claude's code review is too late.

### Decision

Define a **QA / Regression Validator** as an Execution/Review Sublayer actor. The QA Validator authors test plans for stateful user flows and executes regression checks after executor delivery. Claude writes `QA Validation Required: Yes` in the brief for tasks that touch stateful flows. The QA Validator produces a QA Report that Claude uses to approve or reject delivery.

**Key design constraints:**
- Authority level: Review (advisory) — produces reports; no final approve/reject; no source file writes
- Status: Inactive — activation trigger is Phase 3 catalog stable / before Phase 4
- Flows in scope: cart, checkout, authentication, product catalog, locale switching
- Severity: Critical (blocks merge), Major (blocks batch close), Minor (tracked follow-up)
- Test plan covers happy path + edge cases + error states; "probably fine" is not a test result

### Consequences

- Claude may invoke QA Validator for flow validation on Phase 4 tasks and regression checks at phase gates
- `governance/actors/qa-validator-contract.md` is the canonical contract
- No new skills added to `skill-framework.md` — QA Validator declares existing skills from that table
- ADR-021 is extended (not superseded) — QA / Regression Validator is an Execution/Review Sublayer actor

---

## ADR-031: SEO Governance Reviewer — Review Sublayer SEO Compliance Auditor

**Date:** 2026-04-11
**Status:** Accepted

### Context

ADR-016 mandates SEO and AI discoverability as first-class architectural concerns. As product pages ship in Phase 3, SEO correctness — metadata exports, JSON-LD structured data, canonical URLs, hreflang alternate tags, sitemap entries — must be systematically enforced rather than manually checked per task in Claude's general review pass. A single missed canonical URL on a product page creates duplicate content risk across the entire catalog.

### Decision

Define a **SEO Governance Reviewer** as a Review sublayer actor. The SEO Reviewer is invoked by Claude after executor output on storefront tasks that produce or modify pages, metadata, structured data, URL structure, or sitemap. Claude writes `SEO Review Required: Yes` in the brief or issues a post-delivery SEO review request.

**Key design constraints:**
- Authority level: Review only — no write, no execution, no governance, no architecture
- Status: Inactive — activation trigger is Phase 3 product pages
- Audit criteria: `generateMetadata` presence, canonical URL correctness, JSON-LD schema, hreflang for both locales (ar/en), sitemap, `noindex` absence on indexable pages
- Baseline: must read `implementation/seo-guidelines.md` before every audit — never from memory
- Severity: Critical (blocks merge), Major (blocks batch close), Minor (tracked follow-up)

### Consequences

- Claude may invoke SEO Review pass on storefront executor output beginning Phase 3 product pages
- `governance/actors/seo-reviewer-contract.md` is the canonical contract
- No new skills added to `skill-framework.md` — SEO Governance Reviewer declares existing skills from that table
- ADR-021 is extended (not superseded) — SEO Governance Reviewer is a Review sublayer actor
