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

## Active: Phase 4 — Cart & Checkout

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

- [ ] Customer can add product to cart from product detail page
- [ ] Cart state persists via cookie across page refreshes
- [ ] Cart drawer shows items, quantities, subtotal; qty and remove work
- [ ] Dedicated cart page provides same controls as drawer
- [ ] Customer can complete address → shipping → review checkout steps
- [ ] Review step shows order summary
- [ ] No Stripe packages in `package.json`
