# Cursor Workflow — Sama Link Store

This document defines the full lifecycle of how Cursor receives tasks, executes them, and how Claude governs that process.

---

## Overview

This project uses a **four-layer multi-agent model** (ADR-021). This document describes the Claude ↔ Cursor execution loop, which is the innermost layer.

- **Claude** = tech lead, orchestrator, reviewer, documentation owner
- **Cursor** = implementer, executes one task at a time from task briefs
- **Human** = router and bridge: approves decisions, copies briefs to Cursor, feeds output back to Claude, merges to main
- **Advisors (ChatGPT, Gemini)** = external advisory only; input enters the system only after Human approves and routes it

For the full agent model see `AGENTS.md`.

---

## Task Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. PLAN (Claude)                                           │
│  Read ROADMAP.md + TASKS.md → identify next task           │
│  Write task brief following AGENTS.md format               │
│  Print brief to human                                       │
└────────────────────────┬────────────────────────────────────┘
                         │ human copies brief
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. IMPLEMENT (Cursor)                                      │
│  Read brief + all referenced files                         │
│  Implement exactly the stated scope                        │
│  Run tsc --noEmit + next build                             │
│  Report: files changed + criteria met                      │
└────────────────────────┬────────────────────────────────────┘
                         │ human shows diff/report to Claude
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. REVIEW (Claude)                                         │
│  Verify each acceptance criterion                          │
│  Check no forbidden files were modified                    │
│  Check no architecture violations                          │
│  Mark task [x] in TASKS.md                                 │
│  Record new decisions in DECISIONS.md if needed            │
│  Produce next task brief                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## How Cursor Receives Tasks

Cursor receives tasks as self-contained briefs in the format defined in `AGENTS.md`.

Briefs are either:
1. Printed by Claude in the chat and pasted by the human into Cursor Composer
2. Written directly into `TASKS.md` under the active phase with the full brief format

The brief is always the single source of truth for what Cursor should do.
**Cursor must not accept informal instructions that contradict the brief.**

---

## How Claude Reviews Tasks

After Cursor reports done, Claude:

### Step 1 — Check TypeScript
The task is not reviewable if `tsc --noEmit` has errors. If errors exist, send back to Cursor.

### Step 2 — Check build
`next build` (or appropriate workspace build) must succeed.

### Step 3 — Check scope
Review the diff or file list. Were any files modified that weren't in the brief's scope?
- If yes: ask Cursor to revert those changes
- Document any necessary scope expansions as a separate task

### Step 4 — Check acceptance criteria
Go through each criterion in the brief one by one.
- `✅` — met
- `❌` — not met → send back with specific instructions

### Step 5 — Update TASKS.md
Mark the task `[x]`.

### Step 6 — Update DECISIONS.md
If Cursor made a non-obvious implementation choice, record it as a brief ADR.

### Step 7 — Update Notion (mandatory)
- Set task status to `Done` in Notion Task Tracker
- Update Feature Tracker if the task advances a feature's status
- Add new ADR to Notion Decision Log if Step 6 produced one
- Add Session Log entry at end of session

See `docs/notion/notion-sync-protocol.md` for the full checklist.

### Step 8 — Produce next brief
Identify the next task in sequence and produce its brief.

---

## How to Avoid Architectural Drift

Architectural drift = code that diverges from the intended design without being caught.

### Prevention (Claude's responsibility)
- Keep `ARCHITECTURE.md` updated as the authoritative diagram
- Keep `DEVELOPMENT_RULES.md` enforced via Cursor rules files
- Keep `.cursor/rules/` files current — they are Cursor's operating instructions
- Review the full diff, not just the summary

### Detection (both agents)
Signs of architectural drift in Cursor's output:
- A file appears in the wrong directory (e.g., business logic in `components/`)
- A new dependency not in the brief
- A type defined locally instead of in `packages/types`
- A `"use client"` added to a layout or page
- A hardcoded string where a translation key should be
- A raw hex color instead of a design token
- A direct API call from a component instead of through `lib/`

### Response
When drift is detected:
1. Do not merge the changes
2. Identify the specific violation
3. Write a corrected brief that includes "revert X and replace with Y"
4. Record the corrected pattern in the relevant `.cursor/rules/` file to prevent recurrence

---

## How to Handle Refactors

Refactors are changes that improve structure without changing behavior.

### Small refactors (< 5 files, < 30 lines net change)
- Can be included in a task brief if they're in the same scope
- Must be explicitly listed in the brief's scope section
- Must not change any public API or component interface

### Medium refactors (5–20 files)
- Get their own task brief: type = `refactor`
- Must include: what changes, what stays the same, why, risk level
- Must be reviewed by Claude before execution
- Tests must cover behavior before the refactor begins (Phase 8+ only — skip for now)

### Large refactors (20+ files, structural changes)
- Require an ADR in `DECISIONS.md` first
- Require Claude to update `ARCHITECTURE.md`
- Executed as a series of small tasks, not one large task
- Never mixed with feature work

### Rule for all refactors
> If it changes behavior, it's not a refactor — it's a feature or a fix.
> Create a separate task.

---

## How to Handle Documentation Changes

### Who updates what

| File | Owned by | Updated when |
|---|---|---|
| `TASKS.md` | Claude | After each task review |
| `DECISIONS.md` | Claude | When any non-obvious decision is made |
| `ROADMAP.md` | Claude | When a phase milestone is reached |
| `ARCHITECTURE.md` | Claude | When system structure changes |
| `DEVELOPMENT_RULES.md` | Claude | When a new rule is established |
| `.cursor/rules/` | Claude | When a recurring pattern needs enforcement |
| `SESSION_GUIDE.md` | Claude | When the project state changes significantly |
| `CLAUDE.md` | Claude | When Claude's role or project state changes |
| `README.md` | Claude | When the stack or setup process changes |
| `AGENTS.md` | Claude | When the agent model changes |
| Code comments | Cursor | During implementation (task scope) |
| `.env.example` | Cursor (Claude reviews) | When a new env var is introduced |

### Rule
**Cursor does NOT update governance documents.** This includes: CLAUDE.md, AGENTS.md, ARCHITECTURE.md, DEVELOPMENT_RULES.md, DECISIONS.md, TASKS.md, ROADMAP.md, PROJECT_OPERATIONS.md, SESSION_GUIDE.md, and all files under `docs/notion/`. If Cursor's task introduces something that should be documented, it flags it in the Task Report. Claude handles the documentation update.

---

## Handling Blocked Tasks

A task is blocked when Cursor cannot proceed without information or approval not in the brief.

### Cursor response to a block
1. Stop immediately — do not partially implement
2. Write a clear block report:
   - What step caused the block
   - What information or decision is needed
   - What options were considered
3. Return to Claude

### Claude response to a block
1. Provide the missing information OR
2. Update the brief with a clearer implementation path OR
3. Split the task into a smaller first step that doesn't hit the blocker

---

## Task ID Convention

Tasks are prefixed by phase area:

| Prefix | Area |
|---|---|
| `I18N-` | Internationalization |
| `LAYOUT-` | Layout and navigation |
| `UI-` | UI components |
| `CATALOG-` | Product catalog |
| `CART-` | Cart and checkout |
| `AUTH-` | Authentication |
| `ADMIN-` | Admin dashboard |
| `SEO-` | SEO and metadata |
| `PERF-` | Performance |
| `SEC-` | Security |
| `INFRA-` | Infrastructure and config |
| `FIX-` | Bug fix |
| `REFACTOR-` | Refactoring |

Example: `I18N-3`, `CATALOG-7`, `FIX-2`
