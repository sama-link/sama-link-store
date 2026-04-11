# Authority Model — Sama Link Store

**Layer:** Governance
**Governed by:** ADR-021 / ADR-022 / ADR-023 / ADR-024
**Source documents consolidated here:** `governance/constitution.md`, `governance/agents.md`
**Updated when:** ADR update required (any change to the authority model is a governance change)

> This document is the consolidated authority reference. Read this before making any decision about what an agent can or cannot do, what requires a human decision, and what requires an ADR.
>
> When this document conflicts with `governance/constitution.md`, the constitution takes precedence. This document is a consolidation of the constitution's authority model into an actionable reference — not a competing authority.

---

## Purpose

The authority model is scattered across the constitution, agents.md, and the task brief format. This document consolidates it into one place. Individual agent contracts reference this document instead of replicating the model per actor.

---

## Authority Levels

The system recognizes seven functional authority levels. These are capability types, not roles — an actor may exercise one or more, depending on their layer definition.

| Level | Name | What It Permits | Current Holders |
|---|---|---|---|
| **Advise** | Advisory | Produce analysis, proposals, and recommendations. No binding decisions. No system writes. | ChatGPT (Rafiq), Gemini (Jimi) |
| **Route** | Routing | Approve or reject advisory input; direct work into the execution system; final decision authority | Human |
| **Orchestrate** | Orchestration | Plan, decompose, govern, brief, review, and synchronize system state | Claude CLI |
| **Execute** | Execution | Implement within a defined brief scope | Literal Executor, Advanced Executor, Backend Specialist (Assigned Agents: TBD) |
| **Review** | Review | Validate output against acceptance criteria; approve or reject completion | Claude CLI (primary), Security Reviewer (specialized security audit pass), Human (functional assist) |
| **Audit** | Governance Audit | Verify that governance documents, ADRs, and team behavior remain consistent over time | Claude CLI (current); future: dedicated audit agent |
| **Document** | Documentation | Write, maintain, and synchronize governance documents and the knowledge base | Claude CLI (current); KB Keeper (defined — inactive, activates Phase 3 lead-up — ADR-029) |

**Note on future agents:** New agents introduced to the team through the ADR process inherit one or more authority levels at the layer they occupy. A specialized execution agent holds Execute authority only. A specialized review agent holds Review authority only. No new agent may claim Orchestrate or Route authority without an explicit ADR redefining the authority model.

---

## Decision Gate Matrix

For every type of decision, this table defines what is required before the decision is final.

| Decision Type | Required Before Action | Who Decides | Notes |
|---|---|---|---|
| Library or framework selection | ADR in `decisions.md` + Human alignment | Claude proposes → Human confirms | Locked decisions in `CLAUDE.md` need no re-decision |
| Pattern or architecture choice | ADR + Human alignment | Claude proposes → Human confirms | |
| Task scope definition | Task brief V2 recorded in `tasks.md` | Claude | Human may adjust scope — requires brief update |
| Executor role selection | Task brief V2 with `Target Executor` field | Claude | Default: Literal Executor |
| Phase transition | `roadmap.md` update + Human alignment | Claude proposes → Human confirms | Session Log entry mandatory |
| New actor introduction | ADR + Human alignment | Claude proposes → Human confirms | ADR-021 requirement; identity contract required |
| Actor role modification | ADR update + Human alignment | Claude proposes → Human confirms | |
| ADR deprecation | ADR status update in `decisions.md` + Human alignment | Claude proposes → Human confirms | No orphan rules left behind |
| Governance rule addition | Justification + Rules Registry entry + `CLAUDE.md` update if operative | Claude proposes → Human confirms | |
| Branch merge to `main` | Human decision | Human only | No agent merges to `main` |
| Accepting or rejecting consultant advice | Human review | Human only | Consultants never bypass Human routing |
| Implementation approach (within brief) | Output Report documentation | Advanced Executor / Backend Specialist (documents); Literal Executor escalates all | Approach ≠ architecture |
| Design mode declaration | Pre-declaration block (ADR-019) | Executor declares; Claude approves | |
| Exception to an accepted ADR | Exception recorded in Notion Exceptions Register | Human approves | Temporary deviation requires review trigger |
| Agent skill assignment | ADR (when formalizing new agent) | Claude proposes → Human confirms | References `skill-framework.md` |

---

## What Remains Human-Only

These decisions are permanently reserved for the Human. They may not be delegated to any agent, regardless of the agent's capability or layer position.

1. **Merge `develop` → `main`** — final integration decision
2. **Approve consultant advice for entry into the execution system** — sole bridge between advisory and execution layers
3. **Approve phase transitions** — strategic alignment decision
4. **Approve scope expansion** — any work beyond what is in the current task brief
5. **Accept governance deviations** — Exceptions Register entries require Human approval
6. **Override Claude's architectural decisions** — Human is the final authority
7. **Invite new actors** — no agent joins the system without a Human decision and an ADR
8. **Approve Constitution updates** — the constitution is the highest governance layer

---

## What Requires an ADR (mandatory)

An ADR in `docs/project-kb/governance/decisions.md` is required **before** any of the following:

- A library, framework, or package is adopted as a project dependency
- An architectural pattern is established (routing, data flow, auth, payments, rendering strategy)
- An actor is added to, modified in, or removed from the multi-agent team
- A governance rule is formalized as a mandatory constraint
- A phase-level strategic decision is made (scope changes, milestone commitments)
- An existing ADR is superseded or deprecated
- A deviation from an existing ADR is made (even temporary)
- A new layer type is introduced to the team structure

An ADR is **not** required for:
- Implementation approach choices within a brief (document in Output Report instead)
- Task ordering within a phase (Claude decides operationally)
- Bug fixes that do not change architecture
- Documentation and KB updates

---

## Escalation Chain

| Situation | Who Escalates | Escalation Target | Required Action |
|---|---|---|---|
| Execution agent hits scope ambiguity | Any executor | Human → Claude | Stop. Issue BLOCKED report. Await clarification brief. |
| Execution agent hits architecture question | Any executor | Human → Claude | Stop. Issue BLOCKED report. Do not implement until resolved. |
| Execution agent needs unapproved dependency | Any executor | Human → Claude | Stop. Do not install. Await decision. |
| Execution agent finds a FORBIDDEN file conflict | Any executor | Human → Claude | Stop immediately. Report. Do not touch the file. |
| Claude hits strategic ambiguity | Claude | Human | Issue clarification request. Do not produce execution output. |
| Consultant advice arrives without Human review | Claude rejects | Human (informed) | Not accepted. Human is informed that a bypass was attempted. |
| Executor output fails review | Claude | Executor via Human | Issue correction brief. Task not marked done. |
| Architecture change needed during implementation | Executor role | Human → Claude | Stop. Report needed change. Claude evaluates and writes ADR if approved. |
| New ADR conflicts with an existing ADR | Claude | Human | Escalate conflict. Do not create ADR until conflict resolved. |
| Phase exit criteria not fully met | Claude | Human | Flag gap. Do not transition phase without Human alignment. |

---

## Write Access by Actor

| Actor | May Write To | May Not Write To |
|---|---|---|
| ChatGPT (Rafiq) | Nothing in shared systems | Repository, Notion, local folder |
| Gemini (Jimi) | Nothing in shared systems | Repository, Notion, local folder |
| Human | Notion (when directed by Claude); repository content (rare, when directed); brief delivery | Governance files independently; no direct writes that bypass Claude |
| Claude CLI | Entire repository; entire Notion workspace | N/A — but must not implement product features |
| Literal Executor (Assigned Agent: TBD) | Files in brief's Allowed list only | Governance files, Notion, `main` branch |
| Advanced Executor (Assigned Agent: TBD) | Files in brief's Allowed list only | Governance files, Notion, `main` branch |
| Backend Specialist (Assigned Agent: TBD) | Files in brief's Allowed list only | Governance files, Notion, `main` branch |
| Security Reviewer (Assigned Agent: TBD) | Nothing — review only, no write authority | All source files, governance files, Notion, repository |

---

## Governance File Immunity (permanent — no exceptions)

The following files are read-only for all execution agents at all times:

```
CLAUDE.md
docs/project-kb/governance/decisions.md
docs/project-kb/governance/agents.md
docs/project-kb/governance/development-rules.md
docs/project-kb/governance/constitution.md
docs/project-kb/governance/team-principles.md
docs/project-kb/governance/authority-model.md
docs/project-kb/governance/skill-framework.md
docs/project-kb/operations/tasks.md
docs/project-kb/operations/roadmap.md
docs/project-kb/operations/project-operations.md
docs/project-kb/definition/project-definition.md
docs/project-kb/definition/architecture.md
docs/project-kb/governance/history/*
docs/project-kb/governance/actors/*
turbo.json
package.json (root)
```

Any brief that lists one of these files in its Allowed list is malformed. Execution agents must escalate if they receive such a brief.
