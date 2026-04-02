# Feature Template — Sama Link Store

Use this template when creating a new feature entry in the Notion Feature Tracker.

---

## Template

**Database:** Feature Tracker (`collection://c357977b-4718-4ce1-97d9-971f70c86ba1`)

```
Feature Name:         [Human-readable feature name, e.g. "Product Catalog"]
Status:               Not Started | In Progress | Done | Deferred | Cancelled
Phase:                Phase 0 – Phase 8 | Post-MVP
Area:                 [See area list below]
MVP or Post-MVP:      MVP | Post-MVP | Infrastructure
Risk:                 Low | Medium | High

Description:
[What this feature does, why it matters, what it includes at a high level]

Dependencies:
[Other features or phases that must complete first. E.g. "Commerce Backend Integration"]

Tech Notes:
[Key libraries, architectural decisions, patterns. Link to ADR IDs where relevant.]

UX Notes:
[UX considerations: RTL behaviour, accessibility, mobile responsiveness, edge cases.]

Expandability Notes:
[How this feature can be extended post-MVP without rewriting it.]
```

---

## Area Reference

| Area | Covers |
|---|---|
| `Storefront` | General storefront scaffolding, layout, routing |
| `i18n & RTL` | Internationalization, locale routing, RTL layout |
| `SEO` | Metadata, structured data, sitemap, robots |
| `Product Catalog` | Product listing, detail, variants, images |
| `Search` | Search input, results, filtering |
| `Collections` | Category and collection browsing pages |
| `Cart` | Cart context, drawer, quantity management |
| `Checkout` | Multi-step checkout, address, shipping |
| `Customer Accounts` | Auth, profile, order history, addresses |
| `Admin & Dashboard` | Merchant admin UI, product/order management |
| `Payments` | Payment gateway integration |
| `Analytics` | GA4, GTM, event tracking |
| `Marketing` | Promotions, discount codes, email hooks |
| `Notifications` | Order confirmation, transactional email |
| `Security` | Security headers, rate limiting, audit |
| `DevOps` | Deployment, CI/CD, monitoring, backups |
| `Monorepo & Infra` | Turborepo, shared packages, config |

---

## Status Guide

| Status | Meaning |
|---|---|
| `Not Started` | Phase not yet active or dependencies not met |
| `In Progress` | Active development (tasks in progress in Task Tracker) |
| `Done` | All tasks for this feature complete and verified |
| `Deferred` | Explicitly moved to later phase or post-MVP |
| `Cancelled` | Removed from scope entirely |

---

## Risk Guide

| Risk | Meaning |
|---|---|
| `Low` | Well-understood, clear implementation path, minimal blast radius |
| `Medium` | Some unknowns, external dependencies, or cross-cutting concerns |
| `High` | Complex integration, security-sensitive, or blocking for other features |

---

## Rules

- Feature Tracker is a monitoring view of the product roadmap
- It does not replace ROADMAP.md — that is the source of truth
- Features are not the same as tasks — one feature has many tasks
- Claude updates feature status as tasks complete
- Cursor never interacts with the Feature Tracker
