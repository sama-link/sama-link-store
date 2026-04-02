# Roadmap — Sama Link Store

This document defines the phased implementation plan. Each phase has a clear goal, scope, deliverables, dependencies, and exit criteria.

Progress status: `[ ]` = not started, `[~]` = in progress, `[x]` = complete

---

## Phase 0 — Project Foundation ✅ COMPLETE

**Goal:** Establish a clean, documented, production-ready project base before writing any app code.

**Scope:**
- Monorepo structure
- All core documentation files
- Environment variable reference
- Git configuration
- Base package configuration

**Deliverables:**
- [x] Folder structure: `apps/`, `packages/`, `docs/`
- [x] `README.md`
- [x] `PROJECT_BRIEF.md`
- [x] `ARCHITECTURE.md`
- [x] `DEVELOPMENT_RULES.md`
- [x] `ROADMAP.md`
- [x] `TASKS.md`
- [x] `SESSION_GUIDE.md`
- [x] `DECISIONS.md`
- [x] `.env.example`
- [x] `.gitignore`
- [x] Root `package.json` (monorepo)
- [x] `turbo.json`
- [x] Extended docs in `docs/`

**Dependencies:** None

**Exit criteria:** Repository is structured, documented, and ready for a new developer (or AI session) to start Phase 1 without ambiguity.

---

## Phase 1 — Storefront Skeleton ✅ COMPLETE

**Goal:** Scaffold the Next.js storefront app with core layout, routing, localization foundation, and design system baseline.

**Deliverables:**
- [x] `apps/storefront` initialized and running (Next.js 16 App Router)
- [x] Tailwind v4 design tokens (`@theme` in `app/globals.css`)
- [x] UI component system: `Button`, `Input`, `Card`, `Badge` in `components/ui/`
- [x] Core layout: `Header` (Server Component), `Footer`, `Container`, `MobileMenu` (client)
- [x] `LocaleSwitcher.tsx` — working locale switcher, isolated client boundary
- [x] Route structure: `app/[locale]/(storefront)/` — all public routes under locale segment
- [x] i18n: `next-intl` wired end-to-end — routing, middleware, request config, plugin
- [x] `app/[locale]/layout.tsx` — RTL/LTR, `NextIntlClientProvider`, `generateStaticParams`
- [x] `app/[locale]/not-found.tsx` — 404 with translated copy and locale-aware back link
- [x] `app/[locale]/(storefront)/page.tsx` — Phase 1 placeholder home page
- [x] `messages/ar.json` + `messages/en.json` — complete: `common`, `nav`, `home`, `footer`, `errors`
- [x] Storefront loads at `localhost:3000`; `/ar` (RTL) and `/en` (LTR) both serve correctly
- [ ] `packages/ui` — deferred; components live in `components/ui/` for now (INFRA-2)
- [ ] `packages/types` — deferred; domain types not yet needed (INFRA-2)
- [ ] `packages/config` — deferred; storefront uses its own tsconfig (INFRA-1)

**Exit criteria — all met:**
- [x] `/ar` serves home page with `<html lang="ar" dir="rtl">`
- [x] `/en` serves home page with `<html lang="en" dir="ltr">`
- [x] Header and Footer use translation keys — no hardcoded strings
- [x] `next build` passes with 5 prerendered pages
- [x] `tsc --noEmit` passes

**Latest commit:** `f5297b8`

---

## Pre-Phase 2 — Governance, Branding & SEO Foundation ✅ COMPLETE

**Goal:** Before connecting a backend, establish the visual identity, strengthen governance, and lay a minimal SEO foundation. These steps are cheap now and expensive to retrofit later.

**Scope:**
- Documentation and governance alignment (ADR-014 through ADR-018)
- Branding definition: typography system, refined color palette, logo/wordmark
- SEO foundation (light): `generateMetadata` pattern, `robots.txt`, sitemap stub, `canonical` links
- INFRA-1 / INFRA-2: shared config and types packages (recommended but not blocking)

**Deliverables:**
- [x] ADR-014: Git workflow exception documented
- [x] ADR-015: Mobile-first mandatory
- [x] ADR-016: SEO first-class
- [x] ADR-017: Rendering strategy
- [x] ADR-018: Adopt > Extend > Rebuild
- [x] Branding: typography system complete (Cairo + Inter via BRAND-1); color palette and logo deferred to BRAND-2+ (non-blocking)
- [x] SEO: `generateMetadata` on home page (SEO-1a), `robots.txt` and `sitemap.xml` stub (SEO-2); 404 metadata deferred to SEO-1b (non-blocking — Next.js auto-injects noindex)
- [ ] INFRA-1: `packages/config` with `tsconfig.base.json` — deferred, non-blocking
- [ ] INFRA-2: `packages/types` with domain type stubs — deferred, non-blocking

**Dependencies:** Phase 1 complete ✅

**Exit criteria:** Brand is defined. All pages export metadata. `robots.txt` and sitemap exist. Build passes.

---

## Phase 2 — Commerce Backend Integration 🔄 ACTIVE

**Goal:** Stand up the Medusa backend and connect the storefront to real product data.

### Phase 2 Pre-Work — Brand Identity & Media Foundation (blocking BACK-1)

**ADR-020.** Brand tokens, logo, dark mode, and media protocol must be complete before backend tasks begin.

**Deliverables:**
- [ ] MEDIA-1: `docs/media-intake-protocol.md` — authored ✅ (2026-04-03)
- [ ] BRAND-2: Production-ready logo WebP variants in `public/brand/logo/` + `manifest.json`
- [ ] BRAND-3: Semantic color tokens from logo identity — new `--color-brand` and `--color-accent`
- [ ] BRAND-4: Light/dark theme system — class-based `html.dark`, ThemeProvider, toggle
- [ ] BRAND-5: Logo component + applied to Header, nav, footer, global surfaces

**Exit criteria:** Logo renders in header. Dark/light toggle works. All color tokens match logo identity. Build passes.

### Phase 2 Core — Commerce Backend

**Scope:**
- Initialize `apps/backend` as a Medusa v2 project
- Configure PostgreSQL connection
- Seed initial data (1 category, 2–3 products with variants)
- Create `lib/medusa-client.ts` in storefront (typed Medusa Store API client)
- Replace mock data in storefront with live Medusa API data
- Configure CORS between storefront and backend

**Deliverables:**
- [ ] `apps/backend` initialized and running on `localhost:9000`
- [ ] PostgreSQL connected and migrations run
- [ ] Seed script with initial test data
- [ ] Storefront fetches and displays real products
- [ ] API client typed and isolated

**Dependencies:** Phase 1 complete, PostgreSQL available, Phase 2 Pre-Work complete

**Exit criteria:** Products visible in storefront are sourced from Medusa/PostgreSQL. No mock data remains in storefront data layer.

---

## Phase 3 — Product Catalog

**Goal:** Full product browsing experience: collections, product detail, variants, images, basic filtering.

**Scope:**
- Product listing page with pagination
- Collection/category pages
- Product detail page: images, variants, pricing, description
- Basic filter sidebar (category, price range)
- Product search (basic — Medusa built-in, Meilisearch deferred to Phase 7)
- Image handling with `next/image` and S3/R2 storage
- ISR for product and collection pages

**Deliverables:**
- [ ] Product listing with pagination and filters
- [ ] Collection/category pages
- [ ] Product detail page with variant selector
- [ ] Image CDN/S3 integration for product media
- [ ] ISR caching configured
- [ ] Breadcrumbs and SEO metadata on catalog pages

**Dependencies:** Phase 2 complete

**Exit criteria:** Customer can browse all products, navigate categories, view product details, and select variants. Pages are statically generated with ISR.

---

## Phase 4 — Cart and Checkout

**Goal:** End-to-end cart and checkout flow with Stripe payment.

**Scope:**
- Cart: add, remove, update quantity, persist via Medusa cart API
- Cart drawer/page
- Checkout: shipping address, shipping method selection, payment
- Stripe integration (server-side payment intent, client-side Elements)
- Order success page
- Guest checkout supported
- Basic email confirmation (via Medusa notifications)

**Deliverables:**
- [ ] Cart context and hooks
- [ ] Cart UI (drawer + dedicated page)
- [ ] Multi-step checkout flow
- [ ] Stripe payment integration (server-side only for secret key)
- [ ] Order confirmation page
- [ ] Post-order email trigger

**Dependencies:** Phase 3 complete, Stripe account configured

**Exit criteria:** A customer can add a product to cart, complete checkout with a test Stripe card, and receive an order confirmation.

---

## Phase 5 — Orders and Customer Accounts

**Goal:** Customer account system and order management experience.

**Scope:**
- Customer registration and login (Medusa auth)
- Account dashboard: profile, addresses, order history
- Order detail page
- Protected account routes
- Password reset flow
- Guest order lookup (by email + order ID)

**Deliverables:**
- [ ] Auth flow (register, login, logout, password reset)
- [ ] Account dashboard pages
- [ ] Order history and order detail
- [ ] Saved addresses management
- [ ] Protected route middleware

**Dependencies:** Phase 4 complete

**Exit criteria:** Customers can register, log in, place orders, and view their order history. Auth state persists across sessions.

---

## Phase 6 — Admin / Dashboard

**Goal:** Merchant-facing admin interface for day-to-day store operations.

**Scope:**
- Decision: Medusa Admin UI vs custom Next.js admin (see DECISIONS.md)
- Product management: create, edit, delete products and variants
- Order management: view orders, update status, fulfillment
- Customer management: view customers
- Basic analytics: revenue, orders, top products
- Role-based access (admin vs staff roles)

**Deliverables:**
- [ ] Admin app running and authenticated
- [ ] Product CRUD
- [ ] Order management UI
- [ ] Customer view
- [ ] Basic dashboard metrics

**Dependencies:** Phase 5 complete

**Exit criteria:** Merchant can log into admin, manage products, and process orders without touching the database directly.

---

## Phase 7 — SEO, Localization, Analytics, Marketing

**Goal:** Maximize discoverability, complete multilingual support, and connect marketing tools.

**Scope:**
- Full SEO: dynamic metadata, Open Graph, JSON-LD structured data, sitemap.xml, robots.txt
- i18n completion: all strings translated AR/EN, locale-specific URLs
- Meilisearch integration for fast product search
- Google Analytics / GTM integration
- Email marketing hooks (abandoned cart, promotional)
- Discount codes and basic promotions (Medusa promotions module)

**Deliverables:**
- [ ] Full metadata strategy implemented
- [ ] JSON-LD on product, category, breadcrumb pages
- [ ] `sitemap.xml` generated dynamically
- [ ] All UI strings translated in AR and EN
- [ ] Meilisearch connected to product search
- [ ] GA4 / GTM event tracking
- [ ] Promotion/discount code support

**Dependencies:** Phase 6 complete

**Exit criteria:** Storefront scores 90+ Lighthouse SEO. All pages have correct metadata. Both locales fully functional. Search works via Meilisearch.

---

## Phase 8 — Hardening and Launch Readiness

**Goal:** Production security, performance, reliability, and observability.

**Scope:**
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Dependency audit and cleanup
- Error monitoring (Sentry or similar)
- Rate limiting on API endpoints
- Load testing / performance profiling
- Backup strategy for PostgreSQL
- Environment configuration review
- Staging environment verification
- Launch checklist sign-off

**Deliverables:**
- [ ] All security headers configured
- [ ] `npm audit` — no critical/high vulnerabilities
- [ ] Error monitoring active
- [ ] Rate limiting on auth and cart endpoints
- [ ] Performance verified on staging
- [ ] Backup automation confirmed
- [ ] Launch checklist completed

**Dependencies:** Phase 7 complete

**Exit criteria:** Platform passes security review, performance benchmarks, and launch checklist. Ready for production traffic.
