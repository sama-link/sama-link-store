# Multi-Agent Operating Model — Sama Link Store

**Layer:** Definition
**Source of truth for:** The stable operating model — role layers, handoff structure, and flow sequence. This document is intentionally abstract: it describes the model regardless of which specific tools or agents occupy each role.
**Updated when:** The fundamental operating model changes (requires Human alignment + ADR update).

> For tool-specific actor definitions, behavioral contracts, and brief format: see `docs/project-kb/governance/agents.md` (operative) and `docs/project-kb/governance/actors/` (compiled contracts).

---

## Operating Philosophy

- **AI-first in execution** — implementation, specification, documentation, and review support are delegated to AI agents wherever appropriate
- **Human-led in direction and review** — humans set priorities, approve scope, route input, and hold final judgment
- **Documentation-first** — work is shaped and communicated through written artifacts; informal instruction alone does not define the work
- **Handoff-driven** — work moves between layers through explicit, traceable transitions, not implicit assumptions
- **Review is built into the model** — execution output returns to a review layer before acceptance is determined

---

## Why This Model Exists

- To reduce ambiguity at every handoff point
- To keep execution traceable and reviewable at all times
- To delegate structured work to AI agents while keeping humans in control of direction and judgment
- To prevent uncontrolled execution drift as the system grows
- To support scalable AI-assisted delivery without sacrificing alignment or quality

---

## Role Layers

| Layer | Primary Role | Core Responsibilities | Must Not Own |
|---|---|---|---|
| Advisory | Strategic input | Generate approaches, explore alternatives, provide analysis and recommendations, support decision-making | Direct instruction to any executor; writing to the repository or management system |
| Human Direction | Authority and routing | Set scope and priorities, route approved input, clarify ambiguity, hold final acceptance, authorize scope changes | Implementation work; routing unreviewed input directly to executors |
| Management / Orchestration | Planning and coordination | Shape tasks into specifications, sequence work, maintain documentation, coordinate layer boundaries, structure and maintain the knowledge base | Implementation of product code; accepting input that has not been routed through human direction |
| Execution | Implementation | Write code, edit files, deliver bounded implementation per defined specification and acceptance criteria | Self-approving output; expanding scope beyond the defined brief |
| Review / Validation | Quality and alignment | Verify output against acceptance criteria, check architectural and constraint alignment, surface issues, support human acceptance decisions | Declaring final acceptance on behalf of the human direction layer |

---

## Current Tool Assignments (as of Phase 2)

| Role Layer | Current Actor(s) |
|---|---|
| Advisory | ChatGPT (Rafiq — strategic companion), Gemini (Jimi — commercial consultant) |
| Human Direction | Human Owner / Router |
| Management / Orchestration | Claude CLI (Tech Lead) |
| Execution — narrow scope | Cursor (literal, ≤ ~5 files) |
| Execution — broad scope | Codex (analytical-literal, complex/multi-system tasks) |
| Review / Validation | Claude CLI (also owns review and Notion sync) |

Tool assignments are governed by ADR-021 (team architecture) and ADR-023 (team refinement). Adding a new actor requires an ADR update before access is granted.

---

## Handoff Model

- Work moves through explicit handoffs — no layer silently assumes another layer's responsibility
- Each handoff transfers a defined output with stated deliverables
- Advisory input enters the flow only after human review and explicit approval
- Execution output returns to the review layer before advancing — acceptance is not declared within the execution layer
- Hidden assumptions at any handoff point are a failure mode, not an efficiency
- Every layer's output is traceable forward and backward through the flow

---

## Flow Sequence

```
Advisory layer generates input → Human direction reviews and approves
Human direction routes approved input → Management / Orchestration layer
Management / Orchestration shapes work into a bounded specification → Execution layer
Execution delivers output against the specification → Review / Validation layer
Review / Validation confirms alignment → Human direction accepts or returns for revision
```

Each stage depends on the one before it. The flow does not advance between layers unilaterally.

---

## One-Way Data Flow (Current Implementation)

```
[Advisors: Rafiq/ChatGPT + Jimi/Gemini]
        ↓  read-only advice
[Human Owner / Router]
        ↓  approved strategies → Notion / Claude
[Claude CLI — Tech Lead / Orchestrator]
        ↓  task briefs (with Target Executor specified)
[Cursor (narrow) | Codex (broad)] — Executors
```

No consultant writes to the repository, Notion, or any execution surface directly. The Human is the sole bridge between the advisory layer and the execution system.

---

## Boundary of This Document

This page defines the operating model at the definition layer only. Specific tool assignments, detailed governance protocols, agent-level operating instructions, brief templates, and session management procedures belong in governance layer documents (`docs/project-kb/governance/agents.md`, `docs/project-kb/governance/`).
