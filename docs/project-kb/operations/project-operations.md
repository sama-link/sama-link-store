# Project Operations — Sama Link Store

Defines how work is planned, executed, reviewed, tracked, and scaled.
This is the operating manual for all sessions — human, Claude, and Cursor.

---

## Operating Model

```
┌─────────────────────────────────────────────────────────────────┐
│  SOURCE OF TRUTH: Repository markdown files                     │
│  GOVERNANCE/MONITORING SURFACE: Notion workspace (4-layer)      │
│  ORCHESTRATOR: Claude (reads repo+Notion, plans, reviews, syncs)│
│  EXECUTORS: Cursor (narrow scope) + Codex (broad scope)         │
│  ROUTER: Human (approves decisions, routes input, merges main)  │
│  ADVISORS: ChatGPT (Rafiq) + Gemini (Jimi) — read-only         │
└─────────────────────────────────────────────────────────────────┘
```

**Agent data flow (one-way):** Advisors → Human (approves) → Claude → Cursor. Consultants never write to any system. Human is the sole bridge between the advisory layer and the execution system.

---

## 1. Planning Model

### How phases are managed

- `docs/project-kb/operations/roadmap.md` defines 9 phases (0–8), each with scope, deliverables, and exit criteria
- One phase is active at a time
- The active phase is determined by the first phase whose exit criteria are NOT yet met
- No work on future phases until the current phase is complete (unless explicitly bridging)

### How tasks are created

1. Claude reads `docs/project-kb/operations/roadmap.md` (active phase) + `docs/project-kb/operations/tasks.md` (current state)
2. Claude identifies the next unstarted task in sequence
3. Claude produces a task brief following the format in `docs/project-kb/governance/agents.md`
4. Brief is added to `docs/project-kb/operations/tasks.md` under the correct phase
5. Brief is added to the Notion Task Tracker simultaneously

### Task brief requirements (non-negotiable)

Every brief must have:
- Unique Task ID (e.g. `I18N-3`)
- Goal (one sentence)
- Context (why this task exists)
- Files Allowed (explicit list)
- Files Forbidden (always includes governance docs)
- Implementation Steps (numbered)
- Acceptance Criteria (verifiable, includes tsc + build)
- Out of Scope (what Cursor must not do)

---

## 2. Execution Model

### Cursor's contract

- Reads the full brief before writing a single line
- Implements exactly what the brief states — no more, no less
- Runs `tsc --noEmit` and `next build` before declaring done
- Reports: files changed, criteria met/unmet, any blockers
- Never modifies governance files (CLAUDE.md, docs/project-kb/governance/agents.md, docs/project-kb/definition/architecture.md, docs/project-kb/governance/development-rules.md, docs/project-kb/governance/decisions.md, docs/project-kb/operations/tasks.md, docs/project-kb/operations/roadmap.md, docs/project-kb/operations/project-operations.md, CLAUDE.md, docs/project-kb/*)
- Never makes architectural decisions — stops and escalates to Claude

### What blocks a task

A task is blocked if:
- Brief is ambiguous (Cursor cannot proceed without guessing)
- A required file conflicts with the brief
- A new dependency is needed that isn't in the brief
- A forbidden file must be changed to complete the task

**Response to a block:** Stop immediately. Report clearly. Return to Claude.

---

## 3. Review Model

Claude reviews every task before marking it done. Review order:

1. **TypeScript:** `tsc --noEmit` must pass with zero errors
2. **Build:** `next build` must succeed (or known expected failure noted in brief)
3. **Scope:** Check diff — were any files changed outside the allowed list?
4. **Acceptance Criteria:** Go through each criterion one by one
5. **Architecture:** No violations of boundaries from `docs/project-kb/definition/architecture.md`
6. **Code quality:** No hardcoded strings, no raw colors, logical CSS properties used

If any check fails:
- Do NOT mark the task done
- Write a specific correction brief
- Record the pattern violation in `.cursor/rules/` to prevent recurrence

---

## 4. Tracking Model

### Repository tracking (source of truth)

| File | Tracks |
|---|---|
| `docs/project-kb/operations/tasks.md` | All tasks with `[ ]` / `[~]` / `[x]` status |
| `docs/project-kb/governance/decisions.md` | All ADRs with date, status, rationale |
| `docs/project-kb/operations/roadmap.md` | Phase deliverables with completion status |
| `CLAUDE.md` | Session start/end protocol |

### Notion tracking (governance and monitoring surface)

The Notion workspace uses a **4-layer knowledge model** (Definition / Governance / Implementation / Operations).

| Layer | Surface | Mirrors / Purpose |
|---|---|---|
| Governance | Decision Log (database) | `docs/project-kb/governance/decisions.md` — one row per ADR |
| Governance | Rules & Standards Registry (database) | `docs/project-kb/governance/development-rules.md` — constraints and rules |
| Governance | Governance Protocols (database) | Execution protocols, sync checkpoints |
| Governance | Exceptions / Deviations Register (database) | Approved deviations from rules |
| Operations | Task Tracker (database) | `docs/project-kb/operations/tasks.md` — one row per task |
| Operations | Feature Tracker (database) | `docs/project-kb/operations/roadmap.md` features — one row per feature |
| Operations | Session Log (database) | Session history — one row per session |
| Operations | Workflows & Movement Protocols (database) | Handoff protocols, execution workflows |

The Decision Log has native relation fields to Related Workflows (→ Governance Protocols) and Related Rules (→ Rules & Standards Registry). Set these when adding new ADRs.

See `docs/project-kb/operations/workspace-architecture.md` for the full workspace structure.

### Sync rule

Repo and Notion must stay in sync. After every session:
- All completed tasks marked in both `docs/project-kb/operations/tasks.md` and Notion Task Tracker
- All new ADRs added to both `docs/project-kb/governance/decisions.md` and Notion Decision Log
- Session Log entry added in Notion
- See `docs/project-kb/operations/notion-sync.md` for the full checklist

---

## 5. Scaling Rules

### When adding new tasks

- Tasks are added to the **current active phase only**
- Future phase tasks are listed as bullets in docs/project-kb/operations/tasks.md under their phase heading but have no full briefs yet
- Full briefs are written only when the phase becomes active

### When a new dependency is needed

1. Cursor flags it to Claude — never installs unilaterally
2. Claude evaluates: can existing deps cover it?
3. If yes: Claude instructs how to use existing dep
4. If no: Claude approves, records ADR if non-trivial, adds to brief
5. Cursor installs only what was explicitly approved

### When architecture needs to change

1. Raise with Claude
2. Claude writes a new ADR
3. Claude updates `docs/project-kb/definition/architecture.md`
4. Claude produces updated task briefs
5. Implementation begins only after ADR is recorded

**No architecture changes without an ADR. No exceptions.**

### When a feature is descoped

1. Update `docs/project-kb/operations/roadmap.md` (mark deliverable as deferred or removed)
2. Update affected tasks in `docs/project-kb/operations/tasks.md` (mark `Deferred`)
3. Update Notion Feature Tracker and Task Tracker
4. Record in `docs/project-kb/governance/decisions.md` if the descoping is an architectural choice

---

## 6. Anti-Chaos Rules

These rules exist specifically to prevent the most common failure modes.

| Anti-pattern | Rule |
|---|---|
| "Let me just quickly fix this other thing" | No. Scope creep is the primary source of bugs. Write a separate task. |
| "I'll update the docs later" | No. Update docs in the same session as the work. |
| "Cursor knows best for this one" | No. Cursor implements. Claude decides architecture. |
| "The tests can wait" | No tests in Phase 1–7 (explicitly deferred). But build and tsc must always pass. |
| "I'll add the ADR retroactively" | No. ADR before implementation begins. If you already implemented, write the ADR now. |
| "Just one hardcoded string" | No. All visible strings go through the i18n system per docs/project-kb/governance/development-rules.md rule 11. |
| "Let's skip the Notion update this session" | No. Notion sync is mandatory. Mark `Notion Updated: false` if you skip — do not pretend. |
| "This phase isn't done but let's start Phase N+1" | No. Exit criteria must be met. If blocked, record the blocker. Do not skip phases. |

---

## 7. Session Start Protocol

Every session begins with:

1. Read `CLAUDE.md` (Claude Code reads this automatically)
2. Read `docs/project-kb/operations/roadmap.md` — identify active phase
3. Read `docs/project-kb/operations/tasks.md` — identify next task in queue
4. Read `docs/project-kb/governance/decisions.md` — recall all decisions before choosing any pattern
5. Read `docs/project-kb/governance/development-rules.md` — enforce these rules in all guidance
6. Check Notion Project Hub for any status flags not in repo

---

## 8. Session End Protocol

Every session ends with:

```
Repository:
[ ] All completed tasks marked [x] in docs/project-kb/operations/tasks.md
[ ] Any new ADRs added to docs/project-kb/governance/decisions.md
[ ] docs/project-kb/operations/roadmap.md updated if phase milestone reached
[ ] .env.example updated if new env vars introduced
[ ] No secrets committed
[ ] Build passes (tsc --noEmit + next build)

Notion:
[ ] Task Tracker: completed tasks set to Done
[ ] Task Tracker: new tasks added if created this session; Is Pre-Phase Blocker set if applicable
[ ] Feature Tracker: status updated if any feature advanced; Feature ↔ Task links set for new tasks
[ ] Decision Log: new ADRs added if created this session; Phase field set
[ ] Technical Debt: resolved items removed (not marked done — deleted); new items added if introduced
[ ] Session Log: new entry added (mandatory); Phase Transition checked if phase status changed; Features Advanced populated
[ ] Project Hub callout updated if phase changed or next task changed
```

### Session Closure Block (mandatory format for Session Log entry)

Every Session Log entry must include in "What Was Implemented":
- State before: [active phase, blocking tasks]
- State after: [what changed]
- Phase transition: YES / NO
- Features advanced: [list or "none"]
- Surfaces updated: [which of the 7 required surfaces were touched]

---

## 9. System Validation Check (mandatory before session close)

Run this check before every session ends. A session cannot be closed if steps 1–2 fail.

```
Enforcement Layer (Notion auto-detection):
[ ] Task Tracker → ⚠️ Invalid Tasks view: count = 0
    If > 0: each flagged task must have Feature and Phase set; Is Pre-Phase Blocker correct
[ ] Feature Tracker → ⚠️ Invalid Features view: count = 0
    If > 0: set Phase, link Tasks, or update Status to Done as appropriate
[ ] Task Tracker → 🔴 Active Blockers view: matches docs/project-kb/operations/roadmap.md blocking task list exactly
    If mismatch: update Is Pre-Phase Blocker flags or docs/project-kb/operations/roadmap.md to reconcile

State Engine (Project Hub):
[ ] Top callout updated with Standard State Sentence:
    Active Phase: [name] | Blocking Tasks: [IDs or "none"] | Next Task: [ID] | Build: [✅/❌] | Last Updated: [date]
[ ] Phase Tracker rows reflect current phase statuses

Only after all checks pass: create Session Log entry with Closure Block.
```

### What "broken state" looks like

A task is orphaned: `Health = "⚠️ ORPHAN — no feature linked"` → Invalid Tasks view shows it → session cannot close until fixed.

A feature is stale: all tasks Done, Feature status still "In Progress" → `Health = "⚠️ STALE — tasks done, status not updated"` → Invalid Features view shows it → must update Feature status to Done.

A phase blocker is complete but still flagged: `Is Pre-Phase Blocker = true`, `Status = Done` → Active Blockers view excludes it (correct) → no action needed.

---

## 10. Design Modification Protocol

All UI/visual changes follow this protocol. It is integrated into the enforcement system — design task violations are treated identically to architecture violations. See `docs/project-kb/governance/development-rules.md` Rule 13 for the implementation-level rules Cursor follows.

### Design Task Flow

```
1. PRE-DECLARATION (Cursor outputs before any code)
   [ ] Mode declared: SAFE MODE or EXPLORATION MODE
   [ ] Files to change: explicit list
   [ ] Visual changes: what the user will see differently
   [ ] Design-only confirmation: YES
   [ ] What will NOT be touched: explicit list

2. IMPLEMENTATION
   [ ] Token-only styling (zero hardcoded values)
   [ ] Forbidden layer not touched
   [ ] Component consumption rule respected

3. REVIEW GATE (Claude validates after implementation)
   [ ] No forbidden files modified
   [ ] No logic/routing/API code touched
   [ ] All values trace to @theme tokens
   [ ] i18n files untouched (unless new keys explicitly scoped)
   [ ] tsc --noEmit passes
   [ ] next build passes
   [ ] RTL (/ar) and LTR (/en) both render correctly
```

If the pre-declaration is missing → task is INVALID before implementation starts.
If the review gate fails → task is rejected and a correction brief is issued.

### Design Modes

| Mode | Allowed | Forbidden |
|---|---|---|
| **SAFE MODE** (default) | Token changes, spacing, color, typography, responsive tweaks | Layout restructuring, new/removed components |
| **EXPLORATION MODE** (must be declared) | Layout improvements, section reordering | Logic, routing, i18n, SEO, new pages |

### Critical UI Boundary — STRICT DESIGN MODE (permanent)

No structural changes ever on:
- Product detail page
- Cart (drawer + page)
- Checkout flow
- Auth pages (login, register, reset)

### Three-Layer Summary

| Layer | Status |
|---|---|
| Safe: colors, typography, spacing, shadows (tokens only) | Always allowed |
| Restricted: new/removed components, layout restructuring | Requires approval |
| Forbidden: routing, API, auth, i18n, SEO, config, governance | Never in design tasks |

### Integration with System Validation Check

A design task is closed only after:
1. Review gate passes (all 7 checks)
2. System Validation Check confirms Invalid Tasks = 0 (standard session close)
3. Session Log entry includes which design mode was used and what visual changes were made

Design task violations (forbidden layer touched, hardcoded values found, build broken) are recorded as correction tasks in Task Tracker — same process as architecture violations.

---

## Quick Reference: Who Does What

| Task | ChatGPT (Rafiq) | Gemini (Jimi) | Human | Claude | Cursor | Codex |
|---|---|---|---|---|---|---|
| Strategic advisory | ✅ advisory | ✅ advisory | ✅ | ✅ | ❌ | ❌ |
| Anti-drift / commercial warnings | ❌ | ✅ proactive | ❌ | ✅ | ❌ | ❌ |
| Approve consultant advice | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Write task briefs | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Select target executor per task | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Implement narrow-scope code | ❌ | ❌ | ❌ | ❌ (unless unblocking) | ✅ | ❌ |
| Implement broad/complex code | ❌ | ❌ | ❌ | ❌ (unless unblocking) | ❌ | ✅ |
| Review output | ❌ | ❌ | Can assist | ✅ | ❌ | ❌ |
| Update docs/project-kb/operations/tasks.md | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Update docs/project-kb/governance/decisions.md | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Update docs/project-kb/operations/roadmap.md | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Update Notion | ❌ | ❌ | ❌ (unless directed) | ✅ | ❌ | ❌ |
| Approve architecture | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Merge develop → main | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Run builds/tests | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Deliver briefs to executor | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
