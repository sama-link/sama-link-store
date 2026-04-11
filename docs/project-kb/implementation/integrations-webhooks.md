# Integrations & Webhooks Model — Sama Link Store

**Layer:** Implementation
**Derives from:** Technical Requirements · Architecture Overview · Project Definition
**Implements constraints from:** ADR-007 (Stripe payments)
**Notion source:** https://www.notion.so/33a13205fce681fe8f8fd8f43fe8ac7b

---

## Integration Boundary Principle

All external service integrations are owned and mediated by the commerce backend. The storefront never communicates directly with external services (payment providers, shipping carriers, notification services). Integration secrets never appear in storefront code or `NEXT_PUBLIC_*` environment variables.

---

## Stripe Payment Integration

Stripe is the primary payment gateway at MVP (ADR-007). Integration runs through Medusa's Payment Module.

| Concern | Implementation |
|---|---|
| Integration layer | Medusa Payment Module — Stripe provider plugin |
| Payment intent lifecycle | Created server-side by Medusa on checkout session init; never client-initiated |
| Client interaction | Stripe.js / Stripe Elements loaded client-side for card input UI only; no secrets in browser |
| Webhook intake | Stripe webhooks received at backend endpoint; verified via Stripe signature before processing |
| Idempotency | Medusa payment module handles idempotent Stripe API calls; retries are safe |
| Secret management | `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-side only — never exposed to storefront |

Payment status is always confirmed server-side. The storefront trusts Medusa's order state, not Stripe's client-side response, as the authoritative payment confirmation signal.

---

## Shipping Integration

Shipping provider selection is an open dependency at this time. The integration shape when a provider is selected:

- Shipping options are configured in Medusa Admin and served via the Medusa Fulfillment Module
- Rate fetching (if real-time) runs server-side through a Medusa shipping provider plugin
- Fulfillment creation and tracking updates flow through Medusa's fulfillment lifecycle
- Carrier webhooks (shipment updates) follow the webhook intake model below

---

## Notification Integration

Notification service (email/SMS) selection is an open dependency. The integration shape when a service is selected:

- Notification triggers are Medusa lifecycle events (e.g., `order.placed`, `order.shipped`)
- A Medusa subscriber listens to these events and dispatches to the notification service
- Notification templates are managed in the notification service, not in the backend codebase
- Failed notification sends are logged; they must not block order state transitions

---

## Webhook Intake Model

All inbound webhooks from external services follow this 5-step intake pattern:

| Step | Action | Responsibility |
|---|---|---|
| 1. Receive | Accept HTTP POST at dedicated endpoint | Backend route handler |
| 2. Verify | Validate provider signature (e.g., `Stripe-Signature` header) before processing | Backend route handler |
| 3. Parse | Extract event type and payload | Backend route handler |
| 4. Dispatch | Delegate to appropriate service based on event type | Backend service layer |
| 5. Respond | Return `200 OK` immediately after successful verification and queuing | Backend route handler |

Webhook endpoints respond with `200 OK` before processing completes whenever possible. Long-running processing is handled asynchronously — the provider must not be blocked waiting for business logic to complete.

---

## Webhook Failure & Retry

| Failure Type | Handling | Recovery |
|---|---|---|
| Signature verification failure | Reject immediately with `400`; log the attempt | No retry — invalid payload |
| Service processing error (transient) | Log error; return `200` to prevent provider retry storm | Internal retry queue or manual reprocessing |
| Service processing error (permanent) | Log with full context; alert ops channel | Manual review and reprocessing |
| Duplicate event (already processed) | Detect via idempotency key; skip silently; return `200` | No action needed |

Idempotency keys must be stored for any webhook that triggers a state change. Reprocessing the same event must produce the same outcome.

---

## Open Dependencies

| Open Item | Impact on This Page | Blocks |
|---|---|---|
| Shipping provider selection | Determines shipping integration plugin, rate fetch pattern, and carrier webhook shape | Shipping capability implementation |
| Notification service selection | Determines subscriber-to-notification wiring and template management approach | Order confirmation, shipping notification features |
| Webhook retry queue infrastructure | Determines whether a queue service (Redis, BullMQ, or similar) is needed for async processing | High-reliability webhook handling |
| Multi-currency / multi-region (post-MVP) | Determines whether Stripe payment intents require currency-specific configuration | Post-MVP payment scope |

---

## Related Implementation Files

- [`backend-patterns.md`](backend-patterns.md) — Commerce backend architectural patterns, subscriber pattern
- [`environment-model.md`](environment-model.md) — Environment topology; secret management by environment
- [`implementation-sequencing.md`](implementation-sequencing.md) — Integration phase dependencies
