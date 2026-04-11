# Notion Workspace Architecture — Sama Link Store

**Layer:** Operations (support structure)
**Source of truth for:** How the Notion workspace is organized, what each surface is for, ownership rules.
**Updated when:** Workspace structure changes or new databases are added.
**Mirrors:** Notion workspace structure (Project Hub: https://www.notion.so/33613205fce68182a043cc6ad0088c3e)

> **Historical note:** The workspace was previously described using a "7-layer model" (Layer 1 through Layer 7). That model is deprecated. The 4-layer knowledge model is now authoritative. This document reflects the current state.

---

## Workspace Entry Point

**Page:** Sama Link Store — Project Hub
**URL:** https://www.notion.so/33613205fce68182a043cc6ad0088c3e

This is the single entry point to the entire Notion workspace. All pages and databases are navigable from this Hub page. The Hub is the primary daily oversight surface (Operations Layer).

---

## 4-Layer Notion Structure

The Notion workspace mirrors the project's 4-layer knowledge model:

| Layer | Notion Surface | Purpose |
|---|---|---|
| Definition | Definition Layer pages | What the project is, platform scope, success criteria, multi-agent model |
| Governance | Governance Layer pages + databases | Authority model, ADRs, rules, protocols, exceptions |
| Implementation | Implementation Layer pages | How approved decisions are built — patterns, sequencing, release model |
| Operations | Execution & Tracking databases | Current work: tasks, sessions, features, roadmap, risks |

---

## Definition Layer

**Index page:** Project Definition
**URL:** https://www.notion.so/33613205fce681ea8ec2fbfc605c096f

| Sub-page | Purpose |
|---|---|
| Project Definition | Commercial identity, scope, success criteria |
| Business Requirements | Detailed business and functional requirements |
| Core User Journeys | Customer journey maps and flow scenarios |
| Architecture Overview | System diagram, app boundaries, integration specs |
| Technical Requirements | Technology standards, stack requirements |
| Validation Strategy | How quality and acceptance are determined |
| Multi-Agent Operating Model | Role layers, handoff model, flow sequence |

**Repo source:** `docs/project-kb/definition/`

---

## Governance Layer

**Index page:** Project Governance Framework
**URL:** https://www.notion.so/33e13205fce6815d9158d865066deab4

| Component | Type | Purpose | URL / Data Source |
|---|---|---|---|
| Governance Constitution | Static page | Authority model, 4-layer model, conflict resolution, anti-drift principles | https://www.notion.so/33813205fce681258408c9a31f99ba30 |
| Decision Log | **Database** | All ADRs — approved, rejected, deferred, superseded | `collection://b10e204a-78f4-43c7-9aab-6fb25eb44203` |
| Rules & Standards Registry | **Database** | Mandatory rules, constraints, approval requirements | `collection://4e9a5c29-9b8e-4657-bb59-9facd44875d3` |
| Governance Protocols | **Database** | How ADRs are created, changed, deprecated; exception workflows | `collection://da0bfedf-93fc-457e-a9f3-f45b4069cf04` |
| Exceptions / Deviations Register | **Database** | Approved deviations from rules with rationale and review triggers | `collection://edb3f679-803c-4383-bf42-97c32c182338` |
| Actor Identity Cards | Static pages | Per-actor behavioral specifications (V2.1) | https://www.notion.so/33813205fce6815090f9f2195ffcad5d |

**Decision Log schema:** ADR ID, Decision Title, Status, Decision Type, Area, Context, Decision, Consequences, Date, Related Rules (→ Rules Registry), Related Workflows (→ Governance Protocols).

**Rules Registry schema:** Rule/Constraint Name (incl. ID prefix), Type, Scope, Applies To, Source Principle, Status, Enforcement Level, Short Summary, Related Decision (→ Decision Log).

**Governance Protocols schema:** Protocol Name, Type, Scope, Applies To, Trigger, Owner, Status, Priority, Short Summary, Related Decision(s) (→ Decision Log).

**Repo sources:** `docs/project-kb/governance/`, `docs/project-kb/governance/decisions.md`, `docs/project-kb/governance/development-rules.md`, `docs/project-kb/governance/agents.md`

---

## Implementation Layer

**Index page:** Implementation Overview
**URL:** https://www.notion.so/33a13205fce681e89b3ed0734a21f505

| Sub-page | Purpose |
|---|---|
| Storefront Implementation Patterns | Next.js, App Router, component patterns, routing conventions |
| Backend & API Implementation Patterns | Medusa v2 patterns, API client conventions, extension model |
| Data & Content Implementation Model | Data model, content structure, type definitions |
| Integrations & Webhooks Model | Stripe, S3/R2, Meilisearch, SMTP integration patterns |
| Environment, CI/CD & Deployment Model | Env strategy, CI pipeline, deployment targets |
| Admin & Operations Capability Model | Admin UI decisions, operational tooling |
| Implementation Sequencing Model | Phase dependencies, task ordering, constraint graph |
| Release Readiness Model | Launch checklist, Phase 8 exit criteria |

**Repo sources:** `docs/project-kb/implementation/`

---

## Operations Layer

**Index page:** Execution & Tracking
**URL:** https://www.notion.so/33813205fce681408084d4ffa18b27eb

| Surface | Type | Purpose | URL / Data Source |
|---|---|---|---|
| Project Hub (Management Dashboard) | Static page | Primary oversight — phase status, system health, next actions | https://www.notion.so/33613205fce68182a043cc6ad0088c3e |
| Roadmap | Static page | Phase-by-phase plan with milestones | https://www.notion.so/33613205fce6810fab1af5be2b316353 |
| Task Tracker | **Database** | Every implementation task; one row per task | `collection://a74e62ce-09da-455d-b2ee-7ade3d89ff47` |
| Feature Tracker | **Database** | Every product feature from MVP to post-MVP | `collection://c357977b-4718-4ce1-97d9-971f70c86ba1` |
| Session Log | **Database** | One entry per development session | `collection://1b7a295a-6427-44c4-9bcd-00b9f03692a0` |
| Workflows & Movement Protocols | **Database** | Execution protocols, sync checkpoints, handoff rules | `collection://6960a99e-8bec-4c6c-824f-1198e6020057` |
| Technical Debt & Risks | Static page | Known debt, deferred decisions, risks with severity | https://www.notion.so/33613205fce681f384a3f01b77c1ea79 |
| Release Readiness | Static page | Launch checklist for Phase 8 | https://www.notion.so/33613205fce6818bbce9e14d60e16054 |

**Repo sources:** `docs/project-kb/operations/roadmap.md`, `docs/project-kb/operations/tasks.md`, `CLAUDE.md`

---

## Hub Callout Standard Format

The Project Hub callout must always use this format:

```
[Phase] active. [Active task + status]. Branch: `[branch]`. Build: [✅/⚠️/❌] | Notion sync: [✅/❌] | Updated: [YYYY-MM-DD]
```

---

## Data Relationships

The Decision Log, Governance Protocols, Rules & Standards Registry, and Exceptions Register are linked via native Notion relation fields:

```
Decision Log → Related Rules          → Rules & Standards Registry
Decision Log → Related Workflows      → Governance Protocols
Rules Registry → Related Decision     → Decision Log (back-relation)
Governance Protocols → Related Decision(s) → Decision Log (back-relation)
```

This enables traceability: from an ADR, navigate to the rules it governs and the protocols it establishes, and vice versa.

Session Log, Task Tracker, and Feature Tracker maintain relationships via text references (Task IDs, ADR IDs) rather than native relation fields, to avoid tight coupling.

---

## Ownership Rules

| Content | Owner | Trigger |
|---|---|---|
| Project Hub callout | Claude | Each session close |
| Definition Layer pages | Claude | When project goals or scope change |
| Governance Constitution | Claude | When governance model changes (Human alignment required) |
| Decision Log entries | Claude | When `docs/project-kb/governance/decisions.md` is updated |
| Rules & Standards Registry entries | Claude | When new governance constraints are adopted |
| Governance Protocols entries | Claude | When execution protocol changes |
| Exceptions entries | Claude | When a deviation is approved |
| Actor Identity Cards | Claude | When actor roles or boundaries change |
| Implementation Layer pages | Claude | When implementation patterns are established |
| Task Tracker entries | Claude | When producing task briefs or marking tasks complete |
| Feature Tracker entries | Claude | When feature scope is defined or status changes |
| Session Log entries | Claude | End of every session (mandatory) |
| Hub callout | Claude | Each session close |
| External agent prompts (ChatGPT, Gemini) | Human | When Claude flags a required context update |

**Cursor never touches Notion.** Human may update as directed by Claude.

---

## Reading Priority (Per Session)

| When | What to read |
|---|---|
| Every session start | Hub (Operations) — status callout, current phase, system health |
| Every execution session | Task Tracker, Session Log, Decision Log (Operations Layer databases) |
| When governance questions arise | Governance Constitution, Rules Registry, Governance Protocols (Governance Layer) |
| When architecture questions arise | Architecture Overview, Decision Log (Definition/Governance layers) |
| Rarely | Definition Layer — stable, changes infrequently |

Do not re-read the Implementation Layer in full every session. Read when implementation pattern questions arise.
