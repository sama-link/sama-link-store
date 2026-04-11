# Team Blueprint — First Wave Expansion

**Layer:** Governance
**Governed by:** ADR-021 / ADR-022 / ADR-024
**Status:** All contracts defined — Backend Specialist ✅ ADR-025, Security Reviewer ✅ ADR-026, Literal Executor ✅ ADR-027, TS Quality Reviewer ✅ ADR-028 (inactive), KB Keeper ✅ ADR-029 (inactive), QA Validator ✅ ADR-030 (inactive), SEO Reviewer ✅ ADR-031 (inactive). Activation of inactive roles requires Human + Claude decision.
**Updated when:** A wave is approved, a wave is superseded, or phase priorities shift.

---

## Purpose

This document proposes the first wave of specialized agents to define after the shared team foundation is established. It is a planning reference — not a task brief and not a commitment. The Human and Claude jointly decide which wave to build and when.

---

## Foundation Status

The shared team foundation (ADR-024) is now in place:
- `governance/team-principles.md` — behavioral floor for all agents
- `governance/authority-model.md` — consolidated authority reference
- `governance/skill-framework.md` — shared and specialized skill vocabulary
- `governance/actors/identity-template.md` — upgraded with usage guide and Skills Profile section

All first-wave agents will inherit from this foundation using the identity template.

---

## Why Expand the Team

The current 6-actor team (2 advisors, 1 human router, 1 orchestrator, 2 executors) is sufficient for Phase 1–2 work. As the project advances, specific gaps emerge:

**Gap 1: Backend depth**
BACK-2 through BACK-6 require Medusa v2 backend knowledge, PostgreSQL migration management, Stripe webhook implementation, and seed scripting. Codex handles these today, but without a specialized backend identity the briefs must carry all domain context on every task. A backend specialist identity reduces brief size and improves precision.

**Gap 2: Review coverage**
Claude reviews all executor output. As the codebase grows, domain-specific review passes (TypeScript type safety, security rule compliance, SEO correctness) become too specialized for a generalist review alone. Missed type errors compound; security gaps are harder to spot without a focused review lens.

**Gap 3: Documentation discipline**
The KB has grown reactively. Documents were created when urgently needed — not always maintained as implementations evolved. Without a dedicated documentation capability, KB drift accumulates silently until it causes planning failures.

**Gap 4: QA absence**
No systematic quality or regression check exists. Phase 3 (catalog) and Phase 4 (cart/checkout) introduce stateful user flows. Code review alone cannot verify that these flows work end-to-end after each task.

---

## First Wave Candidates

### Wave 1A — Immediate Priority (Phase 2 active) ✅ Complete

**Agent: Backend Specialist Executor** — ✅ Active (ADR-025, 2026-04-11)

| Field | Value |
|---|---|
| Layer | 4 — Execution |
| Role | Advanced executor specialized for Medusa v2 backend, PostgreSQL, and integration tasks |
| Core Skills | Backend Patterns (Medusa v2), Security Rules Compliance, API Guidelines, TypeScript Strict Mode, Integration Patterns, Environment Configuration |
| ADR | ADR-025 (2026-04-11) |
| Contract | `actors/backend-specialist-contract.md` |

---

**Agent: TypeScript Quality Reviewer** — Contract Defined — Inactive (ADR-028, 2026-04-11)

| Field | Value |
|---|---|
| Layer | Review Sublayer |
| Role | Specialized review agent for TypeScript correctness, type coverage, and `tsc` compliance |
| Core Skills | TypeScript Strict Mode, ADR Lookup (ADR-005), Review Execution |
| ADR | ADR-028 (2026-04-11) |
| Contract | `actors/ts-quality-reviewer-contract.md` |
| Activation Trigger | Phase 3 start (product data types become complex) |

---

### Wave 1B — Near-Term Priority ✅ Activated Early (Phase 2 midpoint)

**Agent: Security Reviewer** — ✅ Active (ADR-026, 2026-04-11)

| Field | Value |
|---|---|
| Layer | Review Sublayer |
| Role | Specialized audit agent for security rule compliance |
| Core Skills | Security Rules Compliance, API Guidelines, Integration Patterns (webhook verification) |
| ADR | ADR-026 (2026-04-11) |
| Contract | `actors/security-reviewer-contract.md` |
| Activation Note | Approved ahead of SEC-1 completion; may be invoked on high-confidence security surfaces (BACK-6 CORS). Full enforcement begins after SEC-1 completes. |

---

**Agent: Knowledge Base Keeper** — Contract Defined — Inactive (ADR-029, 2026-04-11)

| Field | Value |
|---|---|
| Layer | Documentation Sublayer |
| Role | Proactive KB maintenance agent — aligns documentation with completed implementation |
| Core Skills | Brief Authoring (documentation variant), Notion Sync, ADR Lookup, Architecture Analysis |
| ADR | ADR-029 (2026-04-11) |
| Contract | `actors/kb-keeper-contract.md` |
| Activation Trigger | Phase 3 lead-up (significant new implementation patterns: catalog, search, media) |
| Note | Document authority level was already defined in authority-model.md; no separate ADR needed |

---

### Wave 1C — Contracts Defined — Inactive (Phase 4+)

**Agent: QA / Regression Validator** — Contract Defined — Inactive (ADR-030, 2026-04-11)

| Field | Value |
|---|---|
| Layer | Execution/Review Sublayer |
| Role | Test plan authoring and regression checking against critical user flows |
| Core Skills | Next.js Storefront Patterns, Backend Patterns (Medusa), API Guidelines |
| ADR | ADR-030 (2026-04-11) |
| Contract | `actors/qa-validator-contract.md` |
| Activation Trigger | Phase 3 catalog stable; before Phase 4 begins |

---

**Agent: SEO Governance Reviewer** — Contract Defined — Inactive (ADR-031, 2026-04-11)

| Field | Value |
|---|---|
| Layer | Review Sublayer |
| Role | Specialized SEO review — metadata, JSON-LD, canonical URLs, sitemap, hreflang |
| Core Skills | SEO Guidelines, i18n Compliance, ADR Lookup (ADR-016) |
| ADR | ADR-031 (2026-04-11) |
| Contract | `actors/seo-reviewer-contract.md` |
| Activation Trigger | Phase 3 product pages begin |

---

## Recommended Build Order

```
[Foundation Complete — 2026-04-11]           ✅
         ↓
[Wave 1A] Backend Specialist Executor        ✅ ADR-025 (2026-04-11)
         ↓
[Wave 1B] Security Reviewer                 ✅ ADR-026 (2026-04-11)
         ↓
[Wave 1A] Literal Executor Contract          ✅ ADR-027 (2026-04-11)
         ↓
[Wave 1A] TypeScript Quality Reviewer        ✅ ADR-028 — Contract defined; activates Phase 3 start
         ↓
[Wave 1B] KB Keeper                          ✅ ADR-029 — Contract defined; activates Phase 3 lead-up
         ↓
[Wave 1C] QA Validator                       ✅ ADR-030 — Contract defined; activates before Phase 4
         ↓
[Wave 1C] SEO Governance Reviewer            ✅ ADR-031 — Contract defined; activates Phase 3 product pages
```

---

## Dependency Map

All first-wave agents depend on the shared foundation:

```
team-principles.md + authority-model.md + skill-framework.md
         ↓ (inherited by)
identity-template.md (with Skills Profile)
         ↓ (used to define each agent contract)
Backend Specialist → TS Reviewer → Security Reviewer → KB Keeper → QA → SEO Reviewer
```

Every agent in the wave:
- Requires an ADR per ADR-021
- Uses `identity-template.md` to define its contract
- Declares its Skills Profile using `skill-framework.md` vocabulary
- References `team-principles.md` as its shared behavioral base
- References `authority-model.md` for escalation chain and write access

---

## What This Blueprint Is Not

- Not a commitment to build all agents — the Human and Claude decide when each wave is needed
- Not a guarantee these agents are final — priorities may shift as the project evolves
- Not a task brief — each wave requires its own ADR and identity contract before activation
- Not a scope expansion — building this team happens alongside Phase 2 work, not instead of it
