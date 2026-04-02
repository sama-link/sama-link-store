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

