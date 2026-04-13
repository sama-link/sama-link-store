# TASKS.md — Active Task Surface

Current active and pending tasks only. Completed task history lives in Notion Session Log.
Legend: `[ ]` = to do, `[~]` = in progress, `[x]` = done

---

## Active: Phase 2 — Commerce Backend Integration

### Open

#### BACK-6: Configure CORS between storefront and backend

**Phase:** Phase 2
**Target Executor:** Backend Specialist
**Branch:** `feature/back-1-medusa-init`
**Depends on:** BACK-5 ✅

**Goal:** Configure environment-based CORS restrictions for storefront and admin origins in the Medusa backend.

**Context:**
CORS is currently permissive. Security rule requires strict, environment-based origins in staging and production. No wildcard `*` in staging/production. Use `STORE_CORS` and `ADMIN_CORS` env vars already defined in `.env.example`. ADR pending — record as part of this task close (ADR-034 candidate).

**Files Allowed:**
- `apps/backend/medusa-config.ts` — add CORS config reading from env vars
- `.env.example` — verify/update STORE_CORS and ADMIN_CORS examples

**Files Forbidden:** `CLAUDE.md`, `TASKS.md`, `docs/` (entire directory), `.agents/` (entire directory), any storefront file

**Implementation Steps:**
1. Read `apps/backend/medusa-config.ts` current state
2. Update CORS config to read from `process.env.STORE_CORS` and `process.env.ADMIN_CORS`
3. Ensure wildcard is acceptable only for local dev (env-controlled), not staging/production
4. Verify `.env.example` has `STORE_CORS=http://localhost:3000` and `ADMIN_CORS=http://localhost:9000` examples

**Acceptance Criteria:**
- [ ] `medusa-config.ts` reads CORS origins from env vars, not hardcoded values
- [ ] No `*` wildcard is the default for non-development environments
- [ ] `.env.example` documents STORE_CORS and ADMIN_CORS with examples
- [ ] `tsc --noEmit` passes
- [ ] `docker compose -f docker-compose.dev.yml up -d --build backend` rebuilds successfully
- [ ] Storefront at `localhost:3000` can still fetch from backend (`GET /store/products` returns 200)

**Out of Scope:** Any storefront changes, any database changes, any new npm dependencies

---

## Active: Phase 3 — Product Catalog

### Next Up

#### CAT-2: Product listing page

**Phase:** Phase 3
**Target Executor:** Advanced Executor
**Branch:** `feature/back-1-medusa-init`
**Depends on:** CAT-1 ✅

**Goal:** Create the product listing page at `/[locale]/products` with ISR, pagination stub, and nav link wiring.

**Context:**
CAT-1 delivered the product detail page with variant display and ISR. CAT-2 completes the browsing layer: a listing page that shows all products, paginated, with navigation from header. Uses the same `listProducts` from `lib/medusa-client.ts` (already wired with region/pricing context). SEO metadata required. Must match storefront rendering strategy (ISR, ADR-017).

**Files Allowed:**
- `apps/storefront/app/[locale]/(storefront)/products/page.tsx` — CREATE
- `apps/storefront/components/products/ProductGrid.tsx` — CREATE (grid layout wrapper)
- `apps/storefront/lib/medusa-client.ts` — MODIFY only if pagination params missing from `listProducts`
- `apps/storefront/messages/ar.json` — ADD `products.listing.*` keys
- `apps/storefront/messages/en.json` — ADD `products.listing.*` keys
- Navigation component (`components/layout/Header.tsx` or `MobileMenu.tsx`) — ADD products link

**Files Forbidden:** `CLAUDE.md`, all governance files, any backend file, `app/[locale]/(storefront)/products/[handle]/page.tsx` (existing detail page — do not modify)

**Implementation Steps:**
1. Create `app/[locale]/(storefront)/products/page.tsx` as async Server Component
2. Fetch products via `listProducts` with limit (start with 12 per page)
3. Add `generateMetadata` for SEO (title, description, canonical)
4. Add `export const revalidate = 3600` for ISR (ADR-017)
5. Create `ProductGrid.tsx` — responsive grid wrapping existing `ProductCard` components
6. Add pagination stub (Next/Previous links or page numbers — static for now)
7. Wire products link in Header and MobileMenu navigation
8. Add translation keys: `products.listing.title`, `products.listing.empty`

**Acceptance Criteria:**
- [ ] `/ar/products` and `/en/products` both serve and render product grid
- [ ] Each product card links to its detail page (inherits from ProductCard)
- [ ] Page has `generateMetadata` exporting title + description
- [ ] `export const revalidate = 3600` present (ISR)
- [ ] Navigation header/mobile menu includes a products link
- [ ] No hardcoded strings — all text via i18n keys
- [ ] `tsc --noEmit` passes
- [ ] `next build` passes

**Out of Scope:** Filters, category pages, search, image CDN, breadcrumbs (separate tasks)

---

### Pending — Phase 3

- [ ] **CAT-3**: Collection/category pages at `/[locale]/collections/[handle]`
- [ ] **CAT-4**: Image CDN/S3 integration for product media (replace placehold.co)
- [ ] **CAT-5**: Breadcrumbs and SEO metadata on catalog pages
- [ ] **CAT-6**: Basic filter sidebar (category, price range)
- [ ] **CHORE-1**: Remove `.gitkeep` files from empty directories
- [ ] **SEO-1b**: 404 page metadata (deferred — pending Next.js support confirmation)
- [ ] **INFRA-1**: `packages/config` with `tsconfig.base.json` (deferred, non-blocking)
- [ ] **INFRA-2**: `packages/types` with domain type stubs (deferred, non-blocking)

---

## Phase 3 Exit Criteria (all required)

- [ ] Customer can browse all products
- [ ] Customer can navigate categories
- [ ] Customer can view product details and select variants
- [ ] Pages are statically generated with ISR
