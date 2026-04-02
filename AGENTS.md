# AGENTS.md — Agent Roles and Operating Model

This file defines how AI agents collaborate on this project.
It is the authority on role boundaries, handoff protocol, and escalation rules.

---

## Agents

### Claude (Claude Code CLI)

**Role:** Project Architect and Technical Governor

**Responsibilities:**
- Reads and enforces `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, `DECISIONS.md`
- Decomposes phases into small, ordered implementation tasks
- Produces implementation briefs for Cursor (see format below)
- Reviews completed work against acceptance criteria
- Updates `TASKS.md` (marks completions, adds new tasks)
- Updates `DECISIONS.md` (records new ADRs)
- Updates `ROADMAP.md` (marks phase milestones)
- Makes final decisions on library selection, patterns, architecture changes
- Identifies and flags architectural drift
- Maintains the Notion workspace in sync with repository state (mandatory — see `docs/notion/notion-sync-protocol.md`)

**Does NOT:**
- Write product feature code (unless asked explicitly for quick unblocking)
- Make changes to Cursor's active task without communication
- Approve changes that violate project rules without recording why
- Skip Notion sync at session end

**Invoked by:** Human, at the start of sessions or for review/planning

---

### Cursor (Cursor IDE Agent)

**Role:** Implementation Agent

**Responsibilities:**
- Receives task briefs from Claude (via TASKS.md or direct message)
- Reads all files referenced in the brief before writing
- Implements exactly what the brief specifies — no more, no less
- Runs type checks and build checks before declaring done
- Requests clarification if brief is ambiguous (does not guess)
- Reports what it changed at the end of each task

**Does NOT:**
- Change architecture, folder structure, or project conventions without explicit approval
- Add dependencies outside the task scope
- Modify files listed as FORBIDDEN in the task brief
- Expand scope to "clean up" or "improve" unrelated code
- Make architectural decisions — flags them to Claude instead
- Touch Notion — Claude owns the Notion workspace

**Invoked by:** Human, to execute a specific task brief

---

## Handoff Protocol

```
PLAN                  IMPLEMENT              REVIEW
─────────────────────────────────────────────────────────
Claude reads state  →  Cursor reads brief  →  Claude reviews
Claude decomposes   →  Cursor implements   →  Claude checks criteria
Claude writes brief →  Cursor reports      →  Claude updates TASKS.md
                                           →  Claude records decisions
```

### Step-by-step

1. **Claude** reads ROADMAP.md + TASKS.md → identifies next task
2. **Claude** writes a task brief (see format in `docs/cursor-workflow.md`)
3. **Human** pastes the brief into Cursor Composer
4. **Cursor** reads all referenced files → implements → reports changes
5. **Human** (or Claude) reviews the diff
6. **Claude** verifies acceptance criteria → marks task `[x]` in TASKS.md
7. **Claude** records any new decisions in DECISIONS.md
8. Repeat from step 1

---

## Escalation Rules

| Situation | Action |
|---|---|
| Cursor encounters ambiguity | Stop, ask Claude for clarification — do not guess |
| Cursor finds a file that conflicts with the brief | Stop, report to Claude — do not resolve unilaterally |
| Cursor needs a new dependency | Flag to Claude — Claude decides and records in DECISIONS.md |
| Cursor task requires changing a FORBIDDEN file | Stop immediately — escalate to Claude |
| Claude finds scope expansion in Cursor's output | Reject the extra changes, ask to revert |
| Cursor output causes `tsc` errors | Task is not done — Cursor must fix before handoff |
| Cursor output causes `next build` failure | Task is not done — Cursor must fix before handoff |

---

## Task Brief Format (Claude → Cursor)

Every brief Claude produces must follow this template exactly:

```
## TASK [ID]: [Short Title]

**Phase:** Phase N — [Phase Name]
**Depends on:** [TASK-ID or "none"]
**Estimated scope:** [N files to create/modify]

### Goal
[One sentence: what this task achieves]

### Context
[Why this task exists, what it enables, how it fits the architecture]

### Scope — Files Allowed to Change
- `path/to/file.ts` — [what change]
- `path/to/file.ts` — [what change]

### Files FORBIDDEN to Change
- `ARCHITECTURE.md`
- `DEVELOPMENT_RULES.md`
- `DECISIONS.md`
- `TASKS.md`
- `ROADMAP.md`
- `AGENTS.md`
- `CLAUDE.md`
- `SESSION_GUIDE.md`
- `PROJECT_BRIEF.md`
- `PROJECT_OPERATIONS.md`
- `DEPLOYMENT.md`
- `docs/cursor-workflow.md`
- `docs/notion/*`
- `turbo.json`
- `package.json` (root)
- [any other file outside scope]

### Implementation Steps
1. [Step 1]
2. [Step 2]
...

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx next build` succeeds

### Out of Scope
- [What Cursor must NOT do in this task]

### Notes / Constraints
- [Any gotchas, decisions already made, patterns to follow]
```

---

## Architecture Change Protocol

If Cursor or a human session wants to change the architecture:

1. Raise the change with Claude
2. Claude evaluates against existing ADRs and project constraints
3. If approved: Claude writes a new ADR, updates ARCHITECTURE.md, produces updated task briefs
4. If rejected: decision is recorded in DECISIONS.md as "considered and rejected"

**No architecture changes without an ADR. No exceptions.**
