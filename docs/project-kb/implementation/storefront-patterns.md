# Storefront Implementation Patterns — Sama Link Store

**Layer:** Implementation
**Derives from:** Technical Requirements · Architecture Overview · Project Definition
**Implements constraints from:** ADR-005 (TypeScript strict) · ADR-008 (next-intl) · ADR-015 (mobile-first) · ADR-017 (intentional rendering per route) · ADR-018 (Medusa defaults before extending)
**Notion source:** https://www.notion.so/33a13205fce681ec8fe5fef494c18c5d

> This file covers the architectural and structural patterns for the storefront layer.
> For code-level API client patterns and error handling, see `api-guidelines.md`.
> For UI component conventions, RTL patterns, accessibility, and visual standards, see `ui-principles.md`.

---

## Storefront Ownership Boundary

The storefront owns:
- Presentation logic and route handling
- Locale-aware rendering
- Backend API consumption via the shared Medusa client
- Customer-facing interaction states (cart UI, checkout flow, account views)

The storefront does NOT own:
- Business logic — pricing decisions, inventory validation, and payment processing belong in the commerce backend
- Data access — all persistence flows through the backend API, not direct database connections
- External service integrations — payment, shipping, and marketing connections route through the backend
- Data mutations — state changes are executed server-side via API calls

*Source: Architecture Overview — System Boundary Constraints*

---

## Derived Technical Baseline

| Concern | Approved Approach |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript — strict mode (no implicit `any`, no unsafe type assertions) |
| Styling | Tailwind CSS v4 |
| i18n | next-intl (ADR-008) |
| Monorepo location | `apps/storefront` (Turborepo) |

---

## Route Architecture

- All routes live under a `[locale]` segment as the root path prefix: `/ar/...` and `/en/...`
- Locale is expressed in the URL path — not inferred from query strings, cookies, or browser headers
- Every route explicitly declares its rendering strategy — no undeclared defaults (ADR-017)
- Route groups: `(storefront)` for public customer routes · `(account)` for authenticated customer routes

---

## Rendering Strategy by Route Type

| Route Type | Rendering Strategy | Key Behavior |
|---|---|---|
| Home / landing | Server-rendered, cached | ISR with revalidation interval; no client-fetched content on initial load |
| Product listing | Server-rendered, cached | ISR with catalog-scoped cache tag; must not be client-rendered |
| Product detail | Server-rendered, cached | ISR; schema.org JSON-LD generated in Server Component on initial response |
| Cart | Server-rendered shell + client-interactive | Cart UI is client-managed; cart totals and validity are server-authoritative |
| Checkout | Server-rendered + client-interactive | Page structure is server-rendered; payment UI is client-interactive; validation is server-side |
| Customer account | Server-authenticated | Requires active session; no public caching; no static generation |
| Not found / error | Server-rendered | Static; locale-aware |

All product and catalog routes must deliver complete, indexable content in the initial server response. No metadata, structured data, or SEO-affecting content may depend on client-side execution.

---

## Component Boundary Model

| Directory | Permitted Content | Out of Scope |
|---|---|---|
| `apps/storefront/components/` | Presentation components, locale-aware display, UI composition | Business logic, direct API calls, pricing rules |
| `apps/storefront/lib/` | Medusa client wrapper, utility functions | React or JSX, business rules |
| `apps/storefront/hooks/` | React hooks consuming `lib/` clients | Raw fetch, direct API access |
| `packages/ui` | Generic reusable UI primitives | Business logic, Medusa-specific types |
| `packages/types` | Shared TypeScript type definitions | Application logic, framework-specific code |

**Server vs. Client Components:**
- App Router defaults every component to a Server Component
- `'use client'` is declared only on components requiring browser interactivity (event handlers, reactive state, browser APIs)
- Business-critical rendering (product content, metadata, structured data) executes in Server Components
- Client Components are always leaf components — they do not wrap Server Component trees

---

## Medusa API Client Pattern

- All storefront communication with the commerce backend flows through `lib/medusa-client.ts` exclusively
- Bypassing it with raw `fetch` is outside the approved storefront pattern
- The shared client handles authentication context, error normalization, and TypeScript response typing
- Medusa API keys and credentials must not appear in client-accessible code or `NEXT_PUBLIC_*` environment variables

---

## i18n Implementation Shape

| Concern | Implementation |
|---|---|
| Library | next-intl (ADR-008) |
| URL structure | `/[locale]/` as the root path prefix — `/ar/...` and `/en/...` |
| Direction | `dir` attribute on `<html>` element set from active locale — `rtl` for Arabic, `ltr` for English |
| Default locale | Arabic (`ar`) — all layout behavior defaults to RTL; English is a fully supported co-equal locale |
| Message files | `messages/ar.json` and `messages/en.json` — all display strings externalized |
| Routing | next-intl middleware handles locale detection and route rewriting |
| Session continuity | Locale transitions preserve cart state and session without full-page reload |
| Format conventions | Dates, numbers, and currency use next-intl locale-aware formatters |

---

## Data Fetching Patterns

- **Server Components:** Data is fetched in async Server Component bodies using `fetch()` with Next.js cache directives
- **Cache scoping:** Cache tags map to content types (e.g., `products`, `categories`) — enabling targeted revalidation
- **Static params:** `generateStaticParams` used for product and category routes
- **Metadata:** `generateMetadata` exported from every route segment — locale-aware, includes canonical URL and `hreflang` alternates
- **Client mutations:** Cart operations use client-side state; server state is always authoritative
- **No client-side catalog fetching:** Product content, pricing, and catalog data is always fetched server-side for initial render

*Cart state management library is an open dependency — see below.*

---

## SEO and Discoverability Implementation

- `generateMetadata` on every route segment — title, description, canonical URL, Open Graph
- schema.org `Product` JSON-LD markup generated in Server Components for all product pages
- Canonical URLs include locale prefix
- `hreflang` alternates declared on all localizable routes
- `sitemap.xml` served via Next.js route handler, derived from live catalog state
- `robots.txt` served via Next.js route handler
- No SEO-affecting content depends on client-side JavaScript execution

---

## Performance Baselines

- Core commerce routes target Lighthouse Performance ≥ 90 on mobile (Technical Requirements); release gate thresholds defined in the Release Readiness Model
- Images rendered via Next.js `Image` component with layout-appropriate `sizes`; optimized and responsive for mobile-first viewports
- Interactive components isolated so they do not degrade non-interactive page rendering
- Core Web Vitals (LCP, CLS, INP) tracked as release readiness dimensions, not per-feature acceptance criteria

---

## Open Dependencies

| Open Item | Impact on This Page | Blocks |
|---|---|---|
| Cart state management library (SWR, Zustand, React Context, or other) | Determines client-side cart implementation pattern | Cart UI implementation |
| Search feature approach (Medusa built-in, Algolia, or other) | Determines search route rendering and data fetching shape | Search feature scoping |
| CDN / ISR hosting provider | Determines revalidation behavior and cache tag support in production | Environment Model, deployment phase |
| Image CDN / Next.js image loader configuration | Determines `next/image` loader and responsive format support | Environment setup |

---

## Related Implementation Files

- [`backend-patterns.md`](backend-patterns.md) — Commerce backend architectural patterns
- [`data-content-model.md`](data-content-model.md) — Product data ownership and cache invalidation
- [`environment-model.md`](environment-model.md) — Environment topology and deployment model
- [`implementation-sequencing.md`](implementation-sequencing.md) — Build dependency and phase-gating logic
- [`seo-guidelines.md`](seo-guidelines.md) — Detailed SEO and structured data patterns
- [`ui-principles.md`](ui-principles.md) — UI component conventions, RTL, accessibility
