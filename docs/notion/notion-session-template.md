# Session Log Template — Sama Link Store

Use this template when creating a new Session Log entry in Notion at the end of every session.

---

## Template

**Database:** Session Log (`collection://1b7a295a-6427-44c4-9bcd-00b9f03692a0`)

```
Session Title:        Session N — [Brief one-line description of session focus]
Date:                 YYYY-MM-DD
Agent:                Claude | Cursor | Human | Mixed
Phase:                Phase 0 | Phase 1 | ... | Phase 8
Review Outcome:       Passed | Partial | Failed | Pending Review | No Review Needed
Tasks Worked On:      I18N-1, I18N-2, ... (comma-separated Task IDs, or "N/A")
Repo Docs Updated:    ✅ Yes | ❌ No
Notion Updated:       ✅ Yes | ❌ No

What Was Planned:
[What was intended at the start of the session]

What Was Implemented:
[Specific completed items — files created, tasks done, decisions made]

What Remains:
[Unfinished items, blockers, next steps not yet taken]

Decisions Made:
[New ADRs or non-obvious decisions. "None" if none.]

Files Changed:
[Summary: CREATED: x.ts, y.tsx | MODIFIED: z.md | DELETED: old.tsx]

Next Recommended Task:
[Task ID + one-line description, e.g. "I18N-1: Install next-intl"]
```

---

## Session Naming Convention

```
Session 1 — Project Foundation & Governance Setup
Session 2 — Notion OS Build, Task & Feature Population
Session 3 — I18N-1 through I18N-4: next-intl Installation and Config
Session N — [Phase] [Focus Area]: [Key tasks or milestone]
```

---

## Review Outcome Guide

| Outcome | When to use |
|---|---|
| `Passed` | All acceptance criteria met, tsc + build pass, no drift |
| `Partial` | Some criteria met, minor issues remain, no blocking failures |
| `Failed` | Build fails, TypeScript errors, or critical criteria not met |
| `Pending Review` | Cursor finished, Claude has not reviewed yet |
| `No Review Needed` | Planning/governance session with no Cursor output to review |

---

## Minimum Viable Session Entry

If time is limited, the minimum required fields are:

1. Session Title
2. Date
3. Agent
4. Phase
5. Next Recommended Task
6. Notion Updated (even if No — mark it honestly)
