# Project Knowledge Base — Sama Link Store

**This is the canonical knowledge root for the Sama Link Store repository.**

A human reviewer, a new session, or any agent consuming repository knowledge should start here. All project knowledge has one home — this index navigates to it.

For session startup, Claude also reads: `CLAUDE.md` (auto-loaded) → `docs/project-kb/operations/roadmap.md` → `docs/project-kb/operations/tasks.md` → `docs/project-kb/governance/decisions.md` → `docs/project-kb/governance/development-rules.md`.

---

## Knowledge Model

This project uses a **4-layer knowledge model** (the authoritative model per the Governance Constitution):

| Layer | Purpose | Change Sensitivity |
|---|---|---|
| **Definition** | What the project is, why it exists, what must remain true | Very High |
| **Governance** | What is formally approved, required, or forbidden; how official change happens | Very High |
| **Implementation** | How approved decisions are translated into stable, validated implementation logic | High |
| **Operations** | What is happening now: tasks, sessions, decisions in flight, risks, deployment state | Low (updated continuously) |

> Note: The Notion workspace has additional supporting structures (Actor Identity Cards, Workflows & Movement Protocols, Rules Registry, Management Dashboard, Session Log, etc.). These are internal organizational surfaces within the 4-layer model — not a competing top-level model. Historical references to a "7-layer model" reflect an earlier organizational scheme that is now deprecated.

---

## Layer 1 — Definition

What the project is, what it must remain, what success means.

| Document | Description |
|---|---|
| [`definition/project-definition.md`](definition/project-definition.md) | Commercial identity, business goals, platform scope, success criteria, MVP boundary |
| [`definition/architecture.md`](definition/architecture.md) | System architecture, application boundaries, integration specs, data flow |
| [`definition/multi-agent-model.md`](definition/multi-agent-model.md) | Operating model — role layers, handoff model, flow sequence |

---

## Layer 2 — Governance

What is formally approved, what is mandatory, and how official change occurs.

| Document | Description |
|---|---|
| [`governance/constitution.md`](governance/constitution.md) | Authority model, core principles, 4-layer knowledge model, conflict resolution, anti-drift principles |
| [`governance/decisions.md`](governance/decisions.md) | **ADR record** — all architectural decisions with rationale (source of truth) |
| [`governance/development-rules.md`](governance/development-rules.md) | **Engineering rules** — all coding standards, boundaries, and constraints |
| [`governance/agents.md`](governance/agents.md) | **Agent roles and brief format** — task brief template V2, escalation rules, handoff protocol |
| [`governance/actors/claude-contract.md`](governance/actors/claude-contract.md) | Claude CLI compiled behavioral contract (V2.1) |
| [`governance/actors/chatgpt-contract.md`](governance/actors/chatgpt-contract.md) | ChatGPT (Rafiq) behavioral contract — Strategic Companion |
| [`governance/actors/gemini-contract.md`](governance/actors/gemini-contract.md) | Gemini (Jimi) behavioral contract — Commercial Consultant |
| [`governance/actors/advanced-executor-contract.md`](governance/actors/advanced-executor-contract.md) | Advanced Executor behavioral contract (V2.1) — role decoupled from agent; Assigned Agent TBD |
| [`governance/actors/backend-specialist-contract.md`](governance/actors/backend-specialist-contract.md) | Backend Specialist Executor behavioral contract (V2, ADR-025) — Medusa v2, PostgreSQL, integration layer |
| [`governance/actors/security-reviewer-contract.md`](governance/actors/security-reviewer-contract.md) | Security Reviewer behavioral contract (V2, ADR-026) — Review sublayer, security audit |
| [`governance/actors/literal-executor-contract.md`](governance/actors/literal-executor-contract.md) | Literal Executor behavioral contract (V2, ADR-027) — default execution actor, Layer 4 |
| [`governance/actors/ts-quality-reviewer-contract.md`](governance/actors/ts-quality-reviewer-contract.md) | TypeScript Quality Reviewer contract (V2, ADR-028) — Review sublayer, type-safety audit — **Inactive** |
| [`governance/actors/kb-keeper-contract.md`](governance/actors/kb-keeper-contract.md) | Knowledge Base Keeper contract (V2, ADR-029) — Documentation sublayer, KB alignment — **Inactive** |
| [`governance/actors/qa-validator-contract.md`](governance/actors/qa-validator-contract.md) | QA / Regression Validator contract (V2, ADR-030) — Execution/Review sublayer, flow validation — **Inactive** |
| [`governance/actors/seo-reviewer-contract.md`](governance/actors/seo-reviewer-contract.md) | SEO Governance Reviewer contract (V2, ADR-031) — Review sublayer, SEO compliance audit — **Inactive** |
| [`governance/actors/identity-template.md`](governance/actors/identity-template.md) | Actor Identity V2 template (ADR-022/ADR-024) — includes Skills Profile section and usage guide |
| [`governance/team-principles.md`](governance/team-principles.md) | **Shared Team Principles** — behavioral floor inherited by all agents (anti-drift, role discipline, escalation, boundary respect, truth-source discipline, review, ambiguity) |
| [`governance/authority-model.md`](governance/authority-model.md) | **Authority Model** — consolidated reference: authority levels, decision gates, human-only decisions, ADR requirements, escalation chain, write access |
| [`governance/skill-framework.md`](governance/skill-framework.md) | **Skill Framework** — shared and specialized skill vocabulary; skill-to-KB map; how future agents declare skills |
| [`governance/team-blueprint.md`](governance/team-blueprint.md) | **Team Blueprint** — first wave expansion proposal: when to add specialized agents and what order |

**Conflict resolution:** When repo governance documents conflict with Notion, the repo wins. `CLAUDE.md` > `governance/decisions.md` > `governance/development-rules.md` > Notion Governance Layer.

---

## Layer 3 — Implementation

How approved decisions are translated into stable, validated implementation patterns.

**Architectural system models** (mirror Notion Implementation Layer pages):

| Document | Description |
|---|---|
| [`implementation/storefront-patterns.md`](implementation/storefront-patterns.md) | Storefront ownership boundary, route architecture, rendering strategy, component model, i18n shape |
| [`implementation/backend-patterns.md`](implementation/backend-patterns.md) | Backend ownership boundary, Medusa extension model, service/subscriber patterns, capability realization |
| [`implementation/data-content-model.md`](implementation/data-content-model.md) | Data ownership, product data model, localization structure, source-of-truth table, cache invalidation |
| [`implementation/integrations-webhooks.md`](implementation/integrations-webhooks.md) | Integration boundary, Stripe architecture, webhook intake model, failure/retry patterns |
| [`implementation/environment-model.md`](implementation/environment-model.md) | Environment topology, storefront/backend/database deployment models, variable structure, CI/CD |
| [`implementation/admin-operations-capability.md`](implementation/admin-operations-capability.md) | Admin interface options, catalog/order/inventory/customer capabilities, ops capability principle |
| [`implementation/implementation-sequencing.md`](implementation/implementation-sequencing.md) | Foundation layer, backend/storefront/integration/admin sequences, phase-gating table |
| [`implementation/release-readiness.md`](implementation/release-readiness.md) | 7 readiness dimensions, go-live gate criteria, evidence expectations, required vs. deferrable |

**Code-level implementation guides**:

| Document | Description |
|---|---|
| [`implementation/api-guidelines.md`](implementation/api-guidelines.md) | API client patterns, error handling, Route Handlers, versioning |
| [`implementation/ui-principles.md`](implementation/ui-principles.md) | Component hierarchy, RTL support, accessibility, responsive design |
| [`implementation/security-baseline.md`](implementation/security-baseline.md) | Secrets, auth, CORS, HTTP headers, payment security, dependency audit |
| [`implementation/seo-guidelines.md`](implementation/seo-guidelines.md) | Metadata strategy, JSON-LD, URL structure, sitemap, AI readability |
| [`implementation/media-intake-protocol.md`](implementation/media-intake-protocol.md) | Asset formats, conversion rules, naming convention, folder structure, manifest |

---

## Layer 4 — Operations

What is happening now: execution state, task tracking, session management, Notion sync.

| Document | Description |
|---|---|
| [`operations/roadmap.md`](operations/roadmap.md) | Phase-by-phase plan with deliverables and exit criteria (source of truth) |
| [`operations/tasks.md`](operations/tasks.md) | Task backlog with full briefs and status (source of truth) |
| [`operations/deployment.md`](operations/deployment.md) | Environment URLs, Vercel config, deployment history |
| [`operations/project-operations.md`](operations/project-operations.md) | Operating model — planning, execution, review, tracking, session protocols, agent matrix |
| [`operations/workspace-architecture.md`](operations/workspace-architecture.md) | Notion workspace 4-layer structure, database IDs, ownership rules |
| [`operations/notion-sync.md`](operations/notion-sync.md) | Sync protocol — what goes where, triggers, checklist |
| [`operations/task-workflow.md`](operations/task-workflow.md) | Full task lifecycle — Plan → Implement → Review loop |
| [`operations/notion-schemas.md`](operations/notion-schemas.md) | Notion database property schemas and Task ID conventions |
| [`operations/notion-templates.md`](operations/notion-templates.md) | Entry templates for Task Tracker, Feature Tracker, and Session Log |

---

## Root-Level Files

Only two markdown files remain at the repository root:

| File | Role |
|---|---|
| `CLAUDE.md` | Auto-read by Claude Code; compact operative shell with pre-flight and guardrails |
| `README.md` | Human-facing entrypoint — setup, structure, navigation to this index |

---

## Supporting References

| Document | Description |
|---|---|
| `.env.example` (repo root) | All environment variables with comments |
| `docs/project-kb/governance/history/actor-identity-migration-plan.md` | ADR-022 V2 migration record (point-in-time reference) |

---

## Notion Workspace

**Project Hub:** https://www.notion.so/33613205fce68182a043cc6ad0088c3e

The Notion workspace mirrors this 4-layer model. It is the management and governance monitoring surface — the repository is the source of truth for execution-facing state.

See [`operations/workspace-architecture.md`](operations/workspace-architecture.md) for the full Notion structure.
