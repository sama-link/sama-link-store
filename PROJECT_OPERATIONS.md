# Project Operations — Sama Link Store

Defines how work is planned, executed, reviewed, tracked, and scaled.
This is the operating manual for all sessions — human, Claude, and Cursor.

---

## Operating Model

```
┌─────────────────────────────────────────────────────────────────┐
│  SOURCE OF TRUTH: Repository markdown files                     │
│  MONITORING SURFACE: Notion workspace                           │
│  IMPLEMENTATION ENGINE: Cursor (from Claude's task briefs)      │
│  GOVERNOR: Claude (reads repo, plans, reviews, updates)         │
│  BRIDGE: Human (copies briefs, feeds output back, approves)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Planning Model

### How phases are managed

- `ROADMAP.md` defines 9 phases (0–8), each with scope, deliverables, and exit criteria
- One phase is active at a time
- The active phase is determined by the first phase whose exit criteria are NOT yet met
- No work on future phases until the current phase is complete (unless explicitly bridging)

### How tasks are created

1. Claude reads `ROADMAP.md` (active phase) + `TASKS.md` (current state)
2. Claude identifies the next unstarted task in sequence
3. Claude produces a task brief following the format in `AGENTS.md`
4. Brief is added to `TASKS.md` under the correct phase
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
- Never modifies governance files (CLAUDE.md, AGENTS.md, ARCHITECTURE.md, DEVELOPMENT_RULES.md, DECISIONS.md, TASKS.md, ROADMAP.md)
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
5. **Architecture:** No violations of boundaries from `ARCHITECTURE.md`
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
| `TASKS.md` | All tasks with `[ ]` / `[~]` / `[x]` status |
| `DECISIONS.md` | All ADRs with date, status, rationale |
| `ROADMAP.md` | Phase deliverables with completion status |
| `SESSION_GUIDE.md` | Session start/end protocol |

### Notion tracking (monitoring surface)

| Database | Mirrors |
|---|---|
| Task Tracker | `TASKS.md` — one row per task |
| Decision Log | `DECISIONS.md` — one row per ADR |
| Feature Tracker | `ROADMAP.md` features — one row per feature |
| Session Log | Session history — one row per session |

### Sync rule

Repo and Notion must stay in sync. After every session:
- All completed tasks marked in both `TASKS.md` and Notion Task Tracker
- All new ADRs added to both `DECISIONS.md` and Notion Decision Log
- Session Log entry added in Notion
- See `docs/notion/notion-sync-protocol.md` for the full checklist

---

## 5. Scaling Rules

### When adding new tasks

- Tasks are added to the **current active phase only**
- Future phase tasks are listed as bullets in TASKS.md under their phase heading but have no full briefs yet
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
3. Claude updates `ARCHITECTURE.md`
4. Claude produces updated task briefs
5. Implementation begins only after ADR is recorded

**No architecture changes without an ADR. No exceptions.**

### When a feature is descoped

1. Update `ROADMAP.md` (mark deliverable as deferred or removed)
2. Update affected tasks in `TASKS.md` (mark `Deferred`)
3. Update Notion Feature Tracker and Task Tracker
4. Record in `DECISIONS.md` if the descoping is an architectural choice

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
| "Just one hardcoded string" | No. All visible strings go through the i18n system per DEVELOPMENT_RULES.md rule 11. |
| "Let's skip the Notion update this session" | No. Notion sync is mandatory. Mark `Notion Updated: false` if you skip — do not pretend. |
| "This phase isn't done but let's start Phase N+1" | No. Exit criteria must be met. If blocked, record the blocker. Do not skip phases. |

---

## 7. Session Start Protocol

Every session begins with:

1. Read `CLAUDE.md` (Claude Code reads this automatically)
2. Read `ROADMAP.md` — identify active phase
3. Read `TASKS.md` — identify next task in queue
4. Read `DECISIONS.md` — recall all decisions before choosing any pattern
5. Read `DEVELOPMENT_RULES.md` — enforce these rules in all guidance
6. Check Notion Project Hub for any status flags not in repo

---

## 8. Session End Protocol

Every session ends with:

```
Repository:
[ ] All completed tasks marked [x] in TASKS.md
[ ] Any new ADRs added to DECISIONS.md
[ ] ROADMAP.md updated if phase milestone reached
[ ] .env.example updated if new env vars introduced
[ ] No secrets committed
[ ] Build passes (tsc --noEmit + next build)

Notion:
[ ] Task Tracker: completed tasks set to Done
[ ] Task Tracker: new tasks added if created this session
[ ] Feature Tracker: feature status updated if changed
[ ] Decision Log: new ADRs added if created this session
[ ] Session Log: new entry added (mandatory)
[ ] Project Hub callout updated if phase changed
```

---

## Quick Reference: Who Does What

| Task | Claude | Cursor | Human |
|---|---|---|---|
| Read project state | ✅ | ✅ | ✅ |
| Write task briefs | ✅ | ❌ | ❌ |
| Implement code | ❌ (unless unblocking) | ✅ | ❌ |
| Review output | ✅ | ❌ | Can assist |
| Update TASKS.md | ✅ | ❌ | ❌ |
| Update DECISIONS.md | ✅ | ❌ | ❌ |
| Update ROADMAP.md | ✅ | ❌ | ❌ |
| Update Notion | ✅ | ❌ | Can assist |
| Approve architecture | ✅ | ❌ | ✅ |
| Run builds/tests | ❌ | ✅ | ✅ |
| Paste briefs to Cursor | ❌ | ❌ | ✅ |
| Feed Cursor output to Claude | ❌ | ❌ | ✅ |
