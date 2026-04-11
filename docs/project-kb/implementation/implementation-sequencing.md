# Implementation Sequencing Model — Sama Link Store

**Layer:** Implementation
**Derives from:** Architecture Overview · Project Definition (MVP Scope, Phases 0–5)
**Implements constraints from:** ADR-014 (Git workflow) · ADR-018 (Medusa defaults before extending)
**Notion source:** https://www.notion.so/33a13205fce68196b33cd942e1898533

---

## Sequencing Principle

Implementation order is governed by three prerequisite types:

1. **Hard dependency** — cannot start until the preceding deliverable exists (e.g., database schema before seeding, Medusa init before extension)
2. **Soft dependency** — can start in parallel but integration requires the other to be present (e.g., storefront can be scaffolded while backend is running, but real data requires backend to be operational)
3. **Blocking gate** — a phase cannot be marked complete until all gate criteria are verified (see Phase-Gating table)

---

## Foundation Layer (Prerequisite for All)

These must be complete before any feature work begins:

- Monorepo scaffolded (Turborepo + apps/storefront + apps/backend + packages/types + packages/ui)
- TypeScript strict mode configured across all packages (ADR-005)
- ESLint and Prettier configured
- Tailwind CSS v4 configured in storefront (ADR — CSS-only config, no tailwind.config.js)
- `CLAUDE.md` and `docs/project-kb/` knowledge base in place
- `.env.example` files created for all apps
- `develop` branch established (ADR-014)

---

## Backend Sequence

Dependencies flow in this order:

1. **Medusa v2 init** — `apps/backend` scaffolded with Medusa, connected to PostgreSQL
2. **Database migrations** — Medusa baseline schema applied; connection verified
3. **Seed data** — Development seed: categories, sample products, admin user
4. **Stripe integration** — Medusa Payment Module with Stripe provider configured
5. **Custom subscribers** — Post-order notification subscriber (blocked on notification service selection)
6. **Custom extensions** — Only after built-in capabilities are confirmed insufficient (ADR-018)

BACK-1 (Medusa init) is complete. BACK-2 (database + seed) is the current active task.

---

## Storefront Sequence

Dependencies flow in this order:

1. **Next.js 16 App Router scaffold** — `apps/storefront` with `[locale]` route structure
2. **next-intl configuration** — middleware, `ar` default locale, `messages/ar.json` + `messages/en.json`
3. **`lib/medusa-client.ts`** — Medusa Store API client wrapper
4. **Shared layout and navigation** — RTL/LTR `dir` attribute, locale switcher, header/footer
5. **Product listing route** — `/[locale]/products` with ISR, catalog fetch from backend
6. **Product detail route** — `/[locale]/products/[handle]` with ISR, schema.org JSON-LD
7. **Cart UI** — Client-side cart state, server-authoritative totals
8. **Checkout flow** — Payment session, address, Stripe Elements UI
9. **Customer account routes** — Registration, login, order history

Storefront scaffold (steps 1–3) can proceed in parallel with backend sequence after the foundation layer is complete. Steps 4+ require backend to be operational with seed data.

---

## Integration Sequence

1. **Stripe webhook endpoint** — Backend receives and verifies `payment_intent.succeeded` events
2. **Order confirmation flow** — Post-order state update after payment confirmation
3. **Notification triggers** — Subscribers for order placed, shipped (blocked on notification service selection)
4. **Shipping provider integration** — (blocked on provider selection)
5. **Cache revalidation subscriber** — Backend event → Next.js revalidate API on product updates

---

## Admin Sequence

1. **Medusa Admin access** — Admin UI available after Medusa init (BACK-1); credential provisioning
2. **Catalog population** — Real product data entry via Admin (prerequisite for storefront integration testing)
3. **Order workflow validation** — End-to-end order from storefront through Admin verification
4. **Custom admin panels** — Only if Medusa Admin gaps are confirmed (deferred to post-MVP by default)

---

## Phase-Gating Table

| Phase | Gate Criteria | Blocked If |
|---|---|---|
| Phase 0 — Foundation | Monorepo builds; TypeScript passes; all base configs committed | Any package fails `tsc --noEmit` |
| Phase 1 — Scaffold | Storefront renders locale-aware shell; Medusa starts locally | `next build` fails; Medusa fails to start |
| Phase 2 — Backend Integration | Medusa connects to PostgreSQL; seed runs; Stripe configured | Database migration fails; Stripe webhook rejected |
| Phase 3 — Storefront Integration | Product listing and detail routes render live backend data | No products returned from API; ISR not configured |
| Phase 4 — Checkout & Payments | Guest checkout completes end-to-end with Stripe test mode | Payment intent fails; order not created in Medusa |
| Phase 5 — Accounts & Polish | Customer registration, login, and order history functional | Auth session not persisted; account routes inaccessible |
| Launch Gate | All 7 release readiness dimensions met (see `release-readiness.md`) | Any dimension fails launch gate criteria |

---

## Open Dependencies Affecting Sequencing

| Open Item | Blocked Sequence Step |
|---|---|
| Shipping provider selection | Shipping integration sequence (step 4) |
| Notification service selection | Notification trigger sequence (step 3); custom subscriber |
| CDN / ISR hosting finalization | Storefront cache revalidation configuration (storefront step 9 equivalent) |
| Search provider selection | Product search route and backend search configuration |

---

## Related Implementation Files

- [`backend-patterns.md`](backend-patterns.md) — Commerce backend patterns; extension model constraints on sequencing
- [`storefront-patterns.md`](storefront-patterns.md) — Storefront route architecture and rendering strategy
- [`environment-model.md`](environment-model.md) — Environment dependencies affecting each phase
- [`release-readiness.md`](release-readiness.md) — Launch gate criteria and readiness dimensions
- [`data-content-model.md`](data-content-model.md) — Cache invalidation dependencies in integration sequence
