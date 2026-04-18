# TASKS.md — Active Task Surface

Current active and pending tasks only. Completed task history lives in Notion Session Log.
Legend: `[ ]` = to do, `[~]` = in progress, `[x]` = done

---

## ~~Phase 2 — Commerce Backend Integration~~ CLOSED ✅

All Phase 2 tasks complete. ADR-034 recorded. History in Notion Session Log.

---

## ~~Phase 3 — Product Catalog~~ CLOSED ✅

All Phase 3 tasks complete. History in Notion Session Log.
Deferred (non-blocking): CAT-4 (ADR-035) · SEO-1b · INFRA-1 · INFRA-2

---

## ~~Phase 4 — Cart & Checkout~~ CLOSED ✅

ADRs locked: ADR-036 (cookie, no middleware) · ADR-037 (custom drawer) · ADR-038 (multi-route checkout) · ADR-039 (Stripe deferred)

### Cart stream

- [x] **CART-1**: `CartProvider` + `useCart` hook + cart API methods + cookie helpers — done 2026-04-14
- [x] **CART-3**: "Add to Cart" button wired on product detail page — done 2026-04-14
- [x] **CART-5**: Header cart icon badge — live item count from `useCart` — done 2026-04-14
- [x] **CART-2**: Cart drawer — slide-in, RTL-aware, item list, qty controls, remove, empty state — done 2026-04-14
- [x] **CART-4**: Dedicated `/[locale]/cart` page — done 2026-04-14

### Checkout stream *(after CART-4)*

- [x] **CHK-1**: Route scaffold `/[locale]/checkout/[step]` + shared layout + step progress indicator — done 2026-04-14
- [x] **CHK-2**: Address form step — shipping address attached to Medusa cart — done 2026-04-14
- [x] **CHK-3**: Shipping method selection step — list options, select one — done 2026-04-14
- [x] **CHK-4**: Review/summary step — order summary display + place order CTA (no payment provider — ADR-039) — done 2026-04-14

---

## Phase 4 Exit Criteria (all required)

- [x] Customer can add product to cart from product detail page — verified 2026-04-16
- [x] Cart state persists via cookie across page refreshes — verified 2026-04-16
- [x] Cart drawer shows items, quantities, subtotal; qty and remove work — verified 2026-04-16
- [x] Dedicated cart page provides same controls as drawer — verified 2026-04-16
- [x] Customer can complete address → shipping → review checkout steps — verified 2026-04-16
- [x] Review step shows order summary — verified 2026-04-16
- [x] No Stripe packages in `package.json` — verified 2026-04-16

---

## Active: Phase 5 — Frontend Acceptance Baseline / Storefront Buildout

ADRs locked: ADR-041 (Radix NavigationMenu mega menu) · ADR-042 (Medusa CMS informational pages)
Implementation rule (all tasks): **No hardcoded user-facing strings.** All copy must be in storefront.csv + messages pipeline. Arabic values left blank in CSV for human translation.

### Workstream A — PDP & Product Content

- [x] **MVP-1**: PDP content upgrade — localize hardcoded strings (Variants/SKU), expand with Medusa product fields (subtitle, material, weight, origin_country), improve information hierarchy and purchase flow — done 2026-04-16

### Workstream B — Catalog Card Actions + Wishlist + Compare

- [x] **MVP-2**: Catalog card actions — Add to Cart, Buy Now, Quick View (prefer existing data, no unnecessary fetch), Wishlist (frontend/local state Stage A + /[locale]/wishlist page), Compare (frontend/local state Stage A + /[locale]/compare page) on ProductCard and PDP — done 2026-04-18
- [x] **MVP-2a**: Refinement pass — hydration fix (card nested-anchor), PDP gallery wishlist/compare overlay (top-start), Buy Now styling (PDP + sticky bar), selected-variant accent swap, dark-mode Add-to-Cart contrast, Wishlist/Compare in header + mobile menu — done 2026-04-18
- [x] **MVP-2b**: Catalog redesign + variant UX + branding + i18n audit — card Buy Now primary + Add-to-Cart icon, price bold/brand, sticky bar horizontal match; variant pills smaller/value-only/hover-preview; accent → brand sweep; i18n for ThemeToggle/PdpTabs/ProductGallery/RecommendationsCarousel aria-labels; full Arabic population (one-time ADR-040 exception) — done 2026-04-18

### Workstream C — Product Card Consistency

- [x] **MVP-3**: ProductCard layout — uniform card heights (flex-grow, h-full), image aspect ratio decision + normalization, title clamp-2, description clamp-2, price and action controls pinned to card bottom — done 2026-04-16

### Workstream D — Categories Filter

- [x] **MVP-4**: Categories filter — add `listProductCategories` helper to medusa-client.ts, add categories section to FilterSidebar, wire `category_id[]` param to `listProducts`, fix label confusion (collections labeled as "Categories") — done 2026-04-16

### Workstream E — CMS-Backed Informational Pages (ADR-042)

- [x] **MVP-5**: Medusa CMS pages — route layer first (known handles get fallback shell, unknown handles 404), then CMS integration; `getCmsPageByHandle`/`listCmsPages` in medusa-client.ts; if Medusa CMS API has gaps → gap report immediately, not silent stub; seed About, FAQ, Contact, Shipping & Returns, Privacy, Terms — done 2026-04-16 (GAP: Medusa CMS page API absent, stubs in place)

### Workstream F — Collections Listing Page

- [x] **MVP-6**: Collections listing page — `/[locale]/collections` listing all collections, linked from nav and footer — done 2026-04-16

### Workstream G — Nav Wiring & Dead Links

- [x] **MVP-7**: Nav + footer dead links — add Home to nav, wire all `#` hrefs in Header/MobileMenu/Footer to real routes; Track Order → dedicated placeholder page (not a broken link); New Arrivals/Sale → `/products` (marked as temporary); blocked only on MVP-5 route layer + MVP-6 (not CMS content completeness) — done 2026-04-16

### Workstream H — Mega Menu (ADR-041, blocked on MVP-6 + MVP-7)

- [x] **MVP-8**: Mega menu — install `@radix-ui/react-navigation-menu`, build desktop mega menu with categories + collections panels, wire to real routes — done 2026-04-18 (MVP-8b visual polish pass: chevrons, accent bar, hierarchy, pill CTA, icon empty state)

### Workstream I — Brand & Mobile Polish

- [x] **MVP-9**: Brand polish — header logo h-8→h-10, footer h-7→h-8; favicon already present at `app/favicon.ico`; LocaleSwitcher exposed in MobileMenu panel (mobile variant); mobile responsive audit passes on current breakpoints — done 2026-04-18

### Workstream J — SEO Foundational Pass

- [x] **MVP-10**: SEO — sitemap.xml (dynamic, all product + collection + page routes), robots.txt, JSON-LD structured data (Organization, Product, BreadcrumbList), page metadata audit, semantic heading structure check — done 2026-04-18 (sitemap 120 URLs, `lib/seo.ts` shared helpers, Organization + Product JSON-LD added, BreadcrumbList pre-existing in `Breadcrumbs.tsx`, 14 new `meta.*` CSV keys)

---

## Phase 5 Dependency Map

```
Parallel-safe (can start immediately):
  MVP-1  MVP-2  MVP-3  MVP-4  MVP-9
  MVP-5 (route layer) — known handles + fallback shell, no CMS content required

Requires MVP-5 route layer + MVP-6 complete:
  MVP-7 (all nav/footer routes must exist before wiring)

Requires MVP-6 + MVP-7 complete:
  MVP-8 (mega menu links must resolve)

Recommended last:
  MVP-10 (after route structure is stable)

NOTE: MVP-7 is NOT blocked on CMS content completeness — only on route existence.
```

## Phase 5 Frontend Acceptance Bar (all required)

- [x] No dead links in header / footer / mobile nav — MVP-7 ✅ 2026-04-16
- [x] No temporary links resolve to missing pages — Track Order page exists, New Arrivals/Sale → /products marked temporary — MVP-7 ✅ 2026-04-16
- [x] Homepage exists and is linked from nav — MVP-7 ✅ 2026-04-16
- [x] All 6 informational page routes resolve — MVP-5 ✅ 2026-04-16 (fallback shell; CMS API absent — see ADR/Notion gap)
- [x] Compare page exists at /[locale]/compare and is usable — MVP-2 ✅ 2026-04-18
- [x] Wishlist page or view exists and is usable — MVP-2 ✅ 2026-04-18
- [x] Catalog supports Add to Cart, Buy Now, Quick View, Wishlist, Compare from product grid and PDP — MVP-2 / MVP-2b ✅ 2026-04-18
- [x] PDP materially improved: professional hierarchy, content richness, purchase flow — MVP-1 + 5 PDP redesign passes ✅ 2026-04-16 (ADR-043)
- [x] Categories filter works alongside collections filter — MVP-4 ✅ 2026-04-16
- [x] Product cards visually consistent across grid (height, image, clamping, price/action) — MVP-3 ✅ 2026-04-16
- [x] Mobile locale switcher visible and usable — MVP-9 ✅ 2026-04-18
- [x] Responsive behavior acceptable across mobile / tablet / desktop — MVP-9 ✅ 2026-04-18
- [x] Foundational SEO artifacts present (sitemap, robots.txt, JSON-LD, metadata, locale alternates) — MVP-10 ✅ 2026-04-18
- [x] No hardcoded user-facing strings in any touched frontend code path; all copy in storefront.csv + messages pipeline — verified across MVP-1/3/4/5/6/7 + PDP redesign
- [x] Arabic strings added in this phase are clean, readable, and ecommerce-appropriate — backfilled 2026-04-16
- [x] No Stripe packages in `package.json` ✅

---

## Phase 5 → Phase 6 Governance Closeout (mandatory before Phase 6 opens)

ADR-044 is time-boxed. The back-merge below restores ADR-014 and expires ADR-044. **Phase 6 planning does not open until `GIT-2` is `[x]`.**

- [ ] **GIT-2**: Trunk reconciliation back-merge (ADR-044 exit criteria)
  - [ ] Merge active feature branch (current: `feature/front-10-seo-foundational`, plus any subsequent Phase 5 branches) into `develop`
  - [ ] Merge `develop` into `main`
  - [ ] Verify `develop` now contains all Phase 2–5 product code
  - [ ] Update `CLAUDE.md` § Project State → `Active branch:` back to `develop` (or the next Phase 6 feature branch once cut)
  - [ ] Archive ADR-044 in Notion Decision Log (Status → Expired, with exit-criteria checklist attached)
  - [ ] First Phase 6 task branch demonstrably cut from `develop` — evidenced in the task's brief header

**Blocker:** Phase 6 kickoff. Do not open Phase 6 planning, brief Phase 6 tasks, or assign Phase 6 work until every sub-item above is `[x]` and ADR-044 is archived.
