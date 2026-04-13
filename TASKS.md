# TASKS.md — Active Task Surface

Current active and pending tasks only. Completed task history lives in Notion Session Log.
Legend: `[ ]` = to do, `[~]` = in progress, `[x]` = done

---

## ~~Phase 2 — Commerce Backend Integration~~ CLOSED ✅

All Phase 2 tasks complete. ADR-034 recorded. History in Notion Session Log.

---

## Active: Phase 3 — Product Catalog

### ~~CAT-2: Product listing page~~ ✅ DONE

Completed 2026-04-13. `/[locale]/products` live with ISR, pagination stub, nav wiring. History in Notion.

---

### Pending — Phase 3

- [x] **CAT-3**: Collection/category pages at `/[locale]/collections/[handle]`
- [ ] **CAT-4a**: Dev media stabilization *(CAT-4 full CDN/S3/R2 deferred to pre-deployment — ADR-035)*
  - `next.config.ts` `remotePatterns` entries for external hosts are **temporary dev allowances only**
  - Do **not** add new external image hosts without explicit approval
  - No implementation work required until release readiness stage
- [ ] ~~**CAT-4**~~: ~~Image CDN/S3 integration for product media~~ — **DEFERRED** (ADR-035). Full production media architecture (own S3/R2 bucket + CDN) moved to pre-deployment phase.
- [x] **CAT-5**: Breadcrumbs and SEO metadata on catalog pages
- [ ] **CAT-6**: Basic filter sidebar (category, price range)
- [ ] **CHORE-1**: Remove `.gitkeep` files from empty directories
- [ ] **SEO-1b**: 404 page metadata (deferred — pending Next.js support confirmation)
- [ ] **INFRA-1**: `packages/config` with `tsconfig.base.json` (deferred, non-blocking)
- [ ] **INFRA-2**: `packages/types` with domain type stubs (deferred, non-blocking)

---

## Phase 3 Exit Criteria (all required)

- [x] Customer can browse all products — CAT-2 ✅
- [x] Customer can navigate categories — CAT-3 ✅
- [x] Customer can view product details and select variants — CAT-1 ✅
- [x] Pages are statically generated with ISR — `revalidate = 3600` on all catalog routes ✅
