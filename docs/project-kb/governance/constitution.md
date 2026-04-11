# Governance Constitution — Sama Link Store

**Layer:** Governance
**Authority level:** Highest — this document governs how all other governance documents are interpreted and changed.
**Updated when:** Human alignment required + explicit record of what changed and why.
**Mirrors:** Notion Governance Constitution (https://www.notion.so/33813205fce681258408c9a31f99ba30)

> When repo content conflicts with Notion content, the repository wins and Notion must be corrected.

---

## Purpose

The Governance Constitution defines the authority model, core principles, official knowledge layer model, conflict resolution rules, and anti-drift principles for this project. It governs how official change occurs, who has authority over what, and how disagreements between documents are resolved.

For step-by-step operational procedures, see the Governance Protocols (Notion Governance Layer database) and Sync Checkpoints (Workflows & Movement Protocols database).

For technical boundary rules and architectural constraints, see `DEVELOPMENT_RULES.md` and `docs/project-kb/implementation/`.

---

## Authority Model

**Claude** is the central execution and synchronization operator:
- Writes directly to the repository via Claude Code CLI
- Writes to Notion via MCP tools
- Does NOT implement product features — that is Cursor/Codex's domain
- Does NOT accept consultant input that bypasses Human routing
- Owns Notion workspace; Cursor never touches it

**Human** is the final authority over all strategic decisions:
- Consultants (Rafiq/ChatGPT, Jimi/Gemini) advise only — they do not decide
- Human is the sole bridge between the Advisory Layer and Execution Layer
- Approved strategies are manually transferred to Notion by Human before Claude acts on them
- All architecture and governance changes require Human alignment before Claude writes the ADR

**Cursor / Codex** execute only:
- No architectural authority
- Never touch governance files (`DECISIONS.md`, `CLAUDE.md`, `AGENTS.md`, `DEVELOPMENT_RULES.md`, `TASKS.md`)
- Never commit directly to `main`

**Consultants** advise only:
- Read-only access to project context shared by Human
- Never write to Notion, GitHub, or local repo under any circumstances
- Never produce ADRs, config files, or production code directly

---

## Core Principles

- **Repository is source of truth.** Notion mirrors and monitors. When they conflict, the repository wins.
- **One-way data flow.** Consultants → Human Router → Notion → Claude CLI → Cursor/Codex. No consultant writes directly to any system.
- **Intentional over automatic.** Every phase transition, architectural decision, and actor handoff is explicit and documented.
- **Governance must earn its cost.** Every rule and document must reduce friction or prevent real drift. Rules that do neither should be retired.
- **Formal before implementation.** No library, pattern, or architecture change is implemented without a prior ADR.
- **Adopt before extend.** Use framework defaults before customizing. Document all extensions in `DECISIONS.md`.
- **Multi-representation discipline.** The same approved change may have different representations depending on target surface. Claude is the central synchronization operator.

---

## Official Knowledge Model: 4 Layers

The project operates under a **4-layer top-level knowledge model**. This is the authoritative model for understanding how knowledge is structured, owned, and governed.

| Layer | Name | Purpose | Change Sensitivity |
|---|---|---|---|
| **Definition** | Definition Layer | What the project is, why it exists, and what must remain true | Very High — changes require Human decision |
| **Governance** | Governance Layer | What is formally approved, required, or forbidden; how official change is managed | Very High — changes require explicit governance decision + Human alignment |
| **Implementation** | Implementation Layer | How approved decisions are translated into stable, validated implementation logic | High — changes require ADR derivation and Claude review |
| **Operations** | Operations Layer | What is happening now: tasks, sessions, decisions in flight, risks, deployment state | Low — updated continuously during execution |

**Authority over this model:** This 4-layer model is the governing reference. Any document that presents a different top-level model is either legacy material or a sub-organizational structure within one of these layers.

### Note on Workspace Organization

The Notion workspace contains additional supporting structures — Actor Identity Cards, Workflows & Movement Protocols, Rules & Standards Registry, Management Dashboard, Session Log, and more. These are **internal organizational and operational surfaces** within the 4-layer model. They are not a competing top-level model. Specifically:

- Actor Identity Cards → governance/definition support within the Governance and Definition layers
- Workflows & Movement Protocols → operational workflow support within the Operations layer
- Rules & Standards Registry → a Governance Layer component
- Management Dashboard (Hub) → operational oversight surface within the Operations layer
- Session Log, Task Tracker, Feature Tracker → Operations layer execution tracking

**Historical note:** References to a "7-layer model" reflect an earlier workspace organizational scheme. The 4-layer model is the current authoritative knowledge model. Any repo file still referencing the 7-layer model has drifted and must be updated.

---

## Conflict Resolution

When two documents conflict, this order of precedence applies:

1. **`CLAUDE.md`** — Claude's active operating rules (highest operational authority in-session)
2. **`DECISIONS.md`** — Formal ADR record (governs all technical and architectural choices)
3. **`DEVELOPMENT_RULES.md`** — Engineering constraints
4. **Notion Governance Layer** — Mirror of the above; repository always wins if they diverge
5. **Other Notion pages** — Lower authority; never override repo markdown files

If Notion content conflicts with the corresponding repo file, the repo file wins and Notion must be corrected.

---

## Anti-Drift Principles

1. **Governance must earn its cost** — rules that don't prevent real problems should be retired, not accumulated
2. **No undocumented architectural choices** — all significant choices have an ADR, or are explicitly flagged as an open decision gap
3. **No ambiguous authority** — every class of decision has a clear owner; ambiguity is a governance defect
4. **No floating governance fragments** — governance content lives in the Governance Layer, not scattered in session notes, task briefs, or comments
5. **Monotonic formalization** — once formally approved, a decision requires an explicit deprecation process to un-approve; silence does not deprecate
6. **Mirror discipline** — Notion is always consistent with the repository; divergence is treated as a defect, not a state
7. **Model consistency** — the 4-layer model is the active governing model; legacy organizational structures do not compete with it

---

## Change Sensitivity by Action Type

| Change Type | Required Steps |
|---|---|
| New ADR / architecture decision | ADR in `DECISIONS.md` • Human alignment • Notion Decision Log entry |
| Governance rule addition | Explicit justification + source principle + Rules Registry entry + `CLAUDE.md` update if operative |
| Phase transition | `ROADMAP.md` update + `CLAUDE.md` update + Hub callout update + Session Log entry |
| Actor role change | ADR update + `AGENTS.md` update + Actor Identity Card update |
| Constitution update | Human alignment required + explicit record of what changed and why |
| Deprecation of rule or decision | Mark Superseded/Deprecated in registry + cite replacement or confirm no replacement + verify no orphaned dependencies |
| 4-layer model change | Constitution update required + Human alignment + all affected layer documents updated |

---

## Promotion and Escalation

### Promoting a draft ADR to Accepted

1. Claude proposes ADR with context, options considered, decision, consequences
2. Human reviews and aligns
3. ADR added to `DECISIONS.md` with Status = Accepted
4. Notion Decision Log entry created (Status = Accepted, all fields populated)
5. Implementation task may now be briefed to Cursor/Codex

### Escalating a constraint violation

1. Claude flags the violation in session output
2. Human decides: require rework, accept deviation, or reject
3. If accepted as deviation: create record in Notion Exceptions / Deviations Register database with review trigger

### Deprecating a decision

1. ADR status set to Superseded or Deprecated in `DECISIONS.md` and Notion Decision Log
2. Replacement ADR cited where applicable
3. Rules derived from the deprecated ADR reviewed for orphan status and updated accordingly

---

## Governance Components Reference

| Component | Role | Location |
|---|---|---|
| Governance Constitution | Authority model, principles, conflict resolution, layer map | `docs/project-kb/governance/constitution.md` (this file) |
| Decision Log | Formal record of all ADRs — approved, rejected, deferred, superseded | `DECISIONS.md` (repo) + Notion Decision Log database |
| Development Rules | Mandatory engineering rules, boundary constraints | `DEVELOPMENT_RULES.md` (repo) |
| Governance Protocols | How ADRs are created, changed, deprecated; how exceptions are filed | Notion Governance Protocols database |
| Exceptions / Deviations Register | Documented approved deviations with rationale and review triggers | Notion Exceptions database |
| Rules & Standards Registry | Mandatory rules, boundary constraints, approval requirements | Notion Rules & Standards Registry database |
