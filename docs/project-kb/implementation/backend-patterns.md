# Backend & API Implementation Patterns — Sama Link Store

**Layer:** Implementation
**Derives from:** Technical Requirements · Architecture Overview · Project Definition
**Implements constraints from:** ADR-003 (Medusa v2) · ADR-004 (PostgreSQL) · ADR-005 (TypeScript strict) · ADR-018 (Medusa defaults before extending)
**Notion source:** https://www.notion.so/33a13205fce6819c8bbffe479db3515e

> This file covers the architectural and structural patterns for the commerce backend layer.
> For API consumption patterns from the storefront side, see `api-guidelines.md`.
> For storefront route and rendering architecture, see `storefront-patterns.md`.

---

## Backend Ownership Boundary

The commerce backend owns:
- Business logic — pricing decisions, inventory validation, discount application, order lifecycle
- Data persistence — all commerce domain writes flow through Medusa's data layer
- External service integrations — payment (Stripe), shipping, notifications
- API surface — REST and event interfaces consumed by the storefront and admin clients

The backend does NOT own:
- Presentation logic — rendering decisions belong to the storefront
- Customer-facing routing — URL structure and locale behavior is a storefront concern
- Admin UI rendering — admin interface is consumed via Medusa Admin or a dedicated admin client, not built in the backend
- Static content delivery — assets are served via CDN, not through the backend

*Source: Architecture Overview — System Boundary Constraints*

---

## Medusa Extension Model

All backend customization follows the ADR-018 adoption sequence: use Medusa's built-in capability first, extend only when the built-in is insufficient, rebuild only when extension cannot meet requirements.

| Extension Level | When to Apply | Examples |
|---|---|---|
| Adopt (built-in) | Medusa provides the behavior; configure via admin or seed data | Product catalog, basic cart, order lifecycle, customer accounts |
| Extend (module/plugin) | Built-in shape exists but behavior needs adjustment | Custom pricing logic, localized shipping rules, custom order states |
| Custom Subscriber | Cross-module side effects, event-driven workflows | Post-order notifications, inventory sync, webhook dispatch |
| Rebuild (custom module) | No viable Medusa primitive exists for the requirement | Specialized B2B pricing, non-standard fulfillment models |

Adopting a higher extension level without first confirming the lower level is insufficient is a violation of ADR-018. New backend capabilities must be justified at the lowest applicable level.

---

## Service Boundary Pattern

- Backend business logic is encapsulated in Medusa service classes — not in route handlers or subscribers
- Route handlers resolve input, delegate to services, and return responses
- Subscribers handle async side effects by calling services — they do not contain business logic directly
- Services are the testable, reusable unit of backend behavior

---

## Subscriber Pattern

Medusa subscribers handle async event-driven behavior:

- Subscribers listen to Medusa lifecycle events (e.g., `order.placed`, `product.updated`)
- Side effects triggered by subscribers must be idempotent — retrying the same event must not produce duplicate state changes
- Subscribers call services for all business logic — subscriber bodies contain only wiring (event binding, service delegation, error handling)
- Subscriber failures are logged; non-critical failures must not block order or checkout completion

---

## Core Capability Realization

| Capability | Implementation Approach | Extension Level |
|---|---|---|
| Product catalog | Medusa Product module — categories, variants, images, pricing | Adopt |
| Cart | Medusa Cart module — line items, tax, discount application | Adopt |
| Checkout | Medusa Checkout flow — payment session, address, fulfillment method | Adopt → Extend for custom validation |
| Payments | Stripe via Medusa Payment module (ADR-007) | Adopt |
| Orders | Medusa Order module — lifecycle, fulfillment, returns | Adopt |
| Customer accounts | Medusa Customer module — registration, login, address book | Adopt |
| Inventory | Medusa Inventory module — stock levels, reservations | Adopt |
| Promotions / discounts | Medusa Promotions module — discount codes, automatic rules | Adopt → Extend for custom rules |

New capabilities not in this table must be evaluated against ADR-018 before implementation begins.

---

## API Surface

- Storefront consumes the Medusa Store API via `lib/medusa-client.ts` exclusively (see `storefront-patterns.md`)
- Admin operations use the Medusa Admin API — either via Medusa Admin UI or a custom admin client
- Backend-to-backend integrations (e.g., shipping, notification services) communicate through Medusa's integration layer
- Custom API routes are added via Medusa's route extension pattern — not by overriding core endpoints

---

## Open Dependencies

| Open Item | Impact on This Page | Blocks |
|---|---|---|
| Shipping provider selection | Determines which Medusa shipping module or integration to configure | Shipping capability realization |
| Notification service (email/SMS) | Determines subscriber-to-notification wiring and subscriber pattern for post-order flows | Order confirmation and notification features |
| Inventory sync strategy | Determines whether Medusa Inventory module is sufficient or requires external WMS integration | Inventory feature scope |
| Search provider (Medusa built-in vs. Algolia) | Determines backend search configuration and indexing subscriber setup | Product search capability |

---

## Related Implementation Files

- [`storefront-patterns.md`](storefront-patterns.md) — Storefront architectural patterns and API consumption model
- [`data-content-model.md`](data-content-model.md) — Product data ownership and cache invalidation
- [`integrations-webhooks.md`](integrations-webhooks.md) — Integration boundary and webhook intake model
- [`environment-model.md`](environment-model.md) — Environment topology and deployment model
- [`implementation-sequencing.md`](implementation-sequencing.md) — Build dependency and phase-gating logic
- [`api-guidelines.md`](api-guidelines.md) — API client patterns and error handling (storefront consumption side)
