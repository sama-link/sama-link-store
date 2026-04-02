# Session Guide — Sama Link Store

This document is a persistent guide for all future development sessions, including AI-assisted sessions (Claude Code or similar).

Every session — human or AI — should read this file first.

---

## Before You Write Any Code

### Step 1: Read project context

Read these files in order:
1. `SESSION_GUIDE.md` — this file
2. `ROADMAP.md` — understand what phase we're in and what's been completed
3. `TASKS.md` — find the current active tasks
4. `DECISIONS.md` — understand architectural decisions already made
5. `DEVELOPMENT_RULES.md` — verify you know the project standards

For AI sessions using Claude Code memory, also check: `memory/MEMORY.md`

### Step 2: Understand the current state

Before touching any code:
- Check which phase is active in `ROADMAP.md`
- Check the `[ ]`/`[x]` status in `TASKS.md`
- Look at existing code in the relevant app/package before writing new code
- If resuming mid-task, re-read the files most recently modified

### Step 3: Confirm scope

Only work on tasks that are within the current phase's scope. If a task appears to need work from a future phase, note it in `TASKS.md` under the correct phase — but do not implement it yet.

---

## How to Behave During a Session

### DO

- Read files before editing them
- Follow naming conventions from `DEVELOPMENT_RULES.md`
- Write TypeScript types for all new data structures
- Put shared types in `packages/types`
- Put shared UI primitives in `packages/ui`
- Keep API client logic in `lib/` directories
- Write small, focused functions and components
- Use Server Components by default in Next.js
- Document every non-obvious architectural decision in `DECISIONS.md`
- Update `TASKS.md` when a task is completed (check the box)
- Update `ROADMAP.md` phase status when a phase is complete

### DO NOT

- Add code that isn't needed for the current phase
- Add dependencies without checking if existing deps cover the need
- Modify working code outside the current task's scope
- Write any `any` in TypeScript without a comment justifying it
- Hard-code env variables, URLs, or locale strings in components
- Expose secrets or API keys to the client side
- Skip accessibility in UI work
- Merge/commit incomplete features

---

## How to Record Decisions

When you make a non-obvious architectural or technical decision, add an entry to `DECISIONS.md`:

```markdown
## ADR-XXX: [Short Title]

**Date:** YYYY-MM-DD
**Status:** Accepted

### Context
[Why this decision was needed]

### Options Considered
- Option A
- Option B

### Decision
[What was chosen]

### Consequences
[What this means going forward]
```

Even small decisions are worth recording if they might confuse a future reader.

---

## How to Update Docs After Code Changes

| Change type | Files to update |
|---|---|
| New feature or component | Update relevant `TASKS.md` items (check off) |
| Architectural change | Add entry to `DECISIONS.md`, update `ARCHITECTURE.md` if needed |
| Phase milestone reached | Update `ROADMAP.md` deliverables, mark phase as complete |
| New env variable added | Add to `.env.example` with comment |
| New package dependency added | Note in `DECISIONS.md` if non-obvious |
| Breaking change | Note in `DECISIONS.md` + update relevant docs |

---

## How to Propose Changes Incrementally

For any non-trivial change:

1. **Read** the existing code and understand it first
2. **Summarize** what you find before proposing changes
3. **Propose** the specific change with clear reasoning
4. **Implement** incrementally — one logical unit at a time
5. **Verify** the change works before moving to the next unit

Do not batch multiple unrelated changes into one commit.

---

## How to Avoid Breaking Architecture

- Respect the app/package boundaries defined in `ARCHITECTURE.md`
- Never put business logic in `components/` — it belongs in `lib/` or the backend
- Never put React/UI code in `packages/types`
- Never call external APIs directly from components — use the lib client
- Never add client-side state management unless it's explicitly required by a task
- Check `DECISIONS.md` before choosing a library or pattern — it may already be decided

---

## Current Phase at Session Start

When beginning a new session, identify the current phase:
- Look for the most recent phase in `ROADMAP.md` where all exit criteria are NOT yet met
- That is the active phase
- Focus all work on that phase unless explicitly told otherwise

**As of project initialization:** Phase 0 is complete. Phase 1 (Storefront Skeleton) is the next active phase.

---

## Quick Reference: Key File Locations

| Purpose | Location |
|---|---|
| Commerce API client | `apps/storefront/lib/medusa-client.ts` |
| Admin API client | `apps/admin/lib/admin-client.ts` |
| Shared types | `packages/types/src/` |
| Shared UI primitives | `packages/ui/src/components/` |
| Shared configs | `packages/config/` |
| i18n messages | `apps/storefront/messages/` |
| Environment reference | `.env.example` |
| Route structure | `apps/storefront/app/` |

---

## Session End Checklist

Before ending a session:
- [ ] All completed tasks marked in `TASKS.md`
- [ ] Any new decisions added to `DECISIONS.md`
- [ ] `.env.example` updated if new env vars were added
- [ ] No secrets committed
- [ ] Code compiles without TypeScript errors
- [ ] No regressions in previously working routes/features
