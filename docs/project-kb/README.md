# Project Knowledge Base — Sama Link Store

**This is the canonical knowledge root for the Sama Link Store repository.**

A human reviewer, a new session, or any agent consuming repository knowledge should start here. All project knowledge has one home — this index navigates to it.

For session startup, Claude also reads: `CLAUDE.md` (operative rules) → `ROADMAP.md` → `TASKS.md` → `DECISIONS.md` → `DEVELOPMENT_RULES.md`.

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

**Also see:** `PROJECT_BRIEF.md` (thin pointer), `ARCHITECTURE.md` (thin pointer)

---

## Layer 2 — Governance

What is formally approved, what is mandatory, and how official change occurs.

| Document | Description |
|---|---|
| [`governance/constitution.md`](governance/constitution.md) | Authority model, core principles, 4-layer knowledge model, conflict resolution, anti-drift principles |
| `DECISIONS.md` | **Operative ADR record** — all architectural decisions with rationale (source of truth) |
| `DEVELOPMENT_RULES.md` | **Operative engineering rules** — all coding standards, boundaries, and constraints |
| `AGENTS.md` | **Operative agent brief format** — task brief template V2, escalation rules, handoff protocol |
| [`governance/actors/claude-contract.md`](governance/actors/claude-contract.md) | Claude CLI compiled behavioral contract (V2.1) |
| [`governance/actors/chatgpt-contract.md`](governance/actors/chatgpt-contract.md) | ChatGPT (Rafiq) system prompt — Strategic Companion |
| [`governance/actors/gemini-contract.md`](governance/actors/gemini-contract.md) | Gemini (Jimi) system prompt — Commercial Consultant |
| [`governance/actors/identity-template.md`](governance/actors/identity-template.md) | Actor Identity V2 template (ADR-022) |

**Conflict resolution:** When repo governance documents conflict with Notion, the repo wins. `CLAUDE.md` > `DECISIONS.md` > `DEVELOPMENT_RULES.md` > Notion Governance Layer.

---

## Layer 3 — Implementation

How approved decisions are translated into stable, validated implementation patterns.

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
| `ROADMAP.md` | Phase-by-phase plan with deliverables and exit criteria (source of truth) |
| `TASKS.md` | Task backlog with full briefs and status (source of truth) |
| `CLAUDE.md` | Claude's operative session rules — read automatically by Claude Code |
| `SESSION_GUIDE.md` | Session start/end checklist (thin pointer) |
| `PROJECT_OPERATIONS.md` | Operating model reference — planning, execution, review, tracking |
| [`operations/workspace-architecture.md`](operations/workspace-architecture.md) | Notion workspace 4-layer structure, database IDs, ownership rules |
| [`operations/notion-sync.md`](operations/notion-sync.md) | Sync protocol — what goes where, triggers, checklist |
| [`operations/task-workflow.md`](operations/task-workflow.md) | Full task lifecycle — Plan → Implement → Review loop |

---

## Supporting References

| Document | Description |
|---|---|
| `README.md` (repo root) | Developer setup and stack overview |
| `DEPLOYMENT.md` | Environment URLs, deployment config, Vercel setup |
| `.env.example` | All environment variables with comments |
| `docs/governance/actor-identity-migration-plan.md` | ADR-022 V2 migration record (point-in-time reference) |

---

## Operative Files (Root Level — Do Not Move)

The following root-level files must remain at the repo root for tool compatibility, executor reference, and Claude Code entrypoint reasons. They are **not** duplicates of project-kb documents — they are the operative versions.

| File | Role |
|---|---|
| `CLAUDE.md` | Auto-read by Claude Code; Claude's active operating contract |
| `AGENTS.md` | Executor task brief format; referenced in all briefs |
| `DECISIONS.md` | ADR source of truth; updated every session |
| `DEVELOPMENT_RULES.md` | Engineering rules; referenced in executor briefs |
| `ROADMAP.md` | Phase and milestone source of truth |
| `TASKS.md` | Task queue source of truth |

---

## Notion Workspace

**Project Hub:** https://www.notion.so/33613205fce68182a043cc6ad0088c3e

The Notion workspace mirrors this 4-layer model. It is the management and governance monitoring surface — the repository is the source of truth for execution-facing state.

See [`operations/workspace-architecture.md`](operations/workspace-architecture.md) for the full Notion structure.
