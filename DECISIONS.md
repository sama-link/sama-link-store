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
- All task briefs must follow the format in `AGENTS.md`
- Cursor must not modify governance files (`DECISIONS.md`, `ARCHITECTURE.md`, etc.)
- Claude must review every completed task before marking it done in `TASKS.md`
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
DEVELOPMENT_RULES.md §9 specifies a `develop` branch, feature branches, and PRs. In practice, all Phase 1 work has been committed directly to `main` with no branching, which is a deliberate deviation.

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
The original roadmap (ROADMAP.md) places deployment at Phase 8 (post-hardening, post-testing). The project is currently in Phase 1 (Storefront Skeleton). The decision was made to create an early preview deployment on Vercel to enable visual review, stakeholder feedback, and URL-based testing during active development.

### Options Considered
- Wait for Phase 8 to deploy (original plan)
- Deploy now as a preview/review environment (selected)

### Decision
Deploy the storefront to Vercel as a **preview deployment** during Phase 1. This is not a production launch. The Phase 8 production deployment milestone remains unchanged. The preview URL is for development review only — not shared publicly as a product.

### Consequences
- A `DEPLOYMENT.md` file tracks deployment details, environment URLs, and verification status
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
- Lightweight checklist in DEVELOPMENT_RULES.md only
- Full Design Modification Protocol with layer boundaries, design modes, review gate, and integration with the enforcement system (selected)

### Decision
Adopt the **Design Modification Protocol** as a mandatory governance layer integrated into the existing enforcement system. It defines three design layers (Safe, Restricted, Forbidden), two design modes (Safe Mode, Exploration Mode), a mandatory pre-declaration step before every design task, and a review gate after every design task. All styling must use `@theme` tokens — no hardcoded values in components.

### Consequences
- Every design task must declare its mode (SAFE or EXPLORATION) before implementation begins
- Cursor must output a pre-declaration block before writing any code: files to change, visual changes, what will not be touched
- Pages in the Critical UI Boundary (product, cart, checkout, auth) are permanently STRICT DESIGN MODE — no structural changes
- The review gate is mandatory: Claude validates token usage, forbidden file boundaries, and RTL/LTR integrity after every design task
- Violations of the forbidden layer are treated the same as architecture violations — task is rejected and a correction brief is issued
- See `DEVELOPMENT_RULES.md` Rule 13 and `PROJECT_OPERATIONS.md` Section 10 for full implementation detail


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
- A `docs/media-intake-protocol.md` governance document is created and enforced from this point forward — no media asset enters the repo without following it
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
- Maintains all governance documents (`DECISIONS.md`, `TASKS.md`, `ROADMAP.md`, `CLAUDE.md`)
- Reviews Cursor's output before any task is marked complete
- Owns Notion sync (Task Tracker, Session Log, Decision Log, Feature Tracker)
- Does NOT implement product features

**Layer 4 — Execution (Cursor / Codex):**
- Implements product code based on Claude's task briefs
- READ/WRITE access to the local folder only
- Never touches governance files
- Never commits directly to `main`

### Consequences
- Consultants must be given a system prompt that enforces their read-only, no-code boundaries (prompt stored in `docs/agents/chatgpt-system-prompt.md` and `docs/agents/gemini-system-prompt.md`)
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
- Add philosophical guidance as freeform prose in AGENTS.md
- Upgrade all actors to a Layered Identity Specification — Structural + Operational + Philosophical + I/O Contract + Validation Hooks (selected)

### Decision

Upgrade all actor definitions from "role descriptions" to **5-layer Behavioral Contracts (Actor Identity V2)**. Each actor is now defined by:

1. **Structural Identity** — name, layer position, primary function
2. **Operational Identity** — responsibilities, authority boundaries, inputs/outputs
3. **Philosophical Identity** — core mission, values, temperament, failure modes
4. **Instruction Handling Model (I/O Contract)** — interpretation mode, ambiguity protocol, escalation path
5. **Validation & Alignment Hooks** — pre-execution checks, self-alignment, drift signals

**Artifacts produced:**
- `docs/agents/claude-system-prompt.md` — compiled XML behavioral contract for Claude CLI
- `docs/governance/actor-identity-v2-template.md` — reusable V2 template for all actors
- `docs/governance/actor-identity-migration-plan.md` — per-actor migration specification
- `AGENTS.md` — task brief format upgraded to V2 (strict, ambiguity-proof)
- Notion Actor Identity Registry — V2 pages for all 5 actors (Layer 5 extension)

**Interpretation Modes (locked per actor):**
- Cursor: **Literal** — execute exactly what is written, no inference
- Claude: **Analytical** — extract constraints, reconstruct intent, validate before acting
- ChatGPT / Gemini: **Advisory** — frame outputs as proposals, never directives
- Human: **Evaluative** — judge quality and risk of inputs before routing

**Claude's internal validation (mandatory, not user-visible):**
Before every output, Claude checks: inputs clear? constraints identified? action within authority? conflict with ADRs? Any failure → escalate instead of proceed.

### Consequences

- ADR-021 is **extended** (not superseded) by this ADR — team structure unchanged, identities deepened
- ADR-011 task brief format is superseded by the V2 brief format in AGENTS.md
- Human must update ChatGPT and Gemini system prompts to add Philosophical Identity and Drift Signals sections (flagged in migration plan)
- Consultant system prompts in `docs/agents/` must be kept in sync with Notion Actor Identity Registry
- All future actors introduced to the system require a V2 identity before being granted any access (extends ADR-021's "any new agent requires ADR update" rule)

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
- AGENTS.md system flow diagram updated to show dual executor paths
- Quick Reference table updated to include Codex column and ChatGPT/Gemini distinction
- Notion Actor Identity Cards: ChatGPT and Gemini updated to V2.1; Codex page created
- Human must update ChatGPT and Gemini Custom Instructions with V2.1 additions (personality, anti-drift role, relaxed output format) — flagged in each actor's Notion page
