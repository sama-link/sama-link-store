# Notion Sync Protocol — Sama Link Store

Defines the strict rules for keeping Notion and the repository in sync.

---

## Core Principle

```
Repository markdown = source of truth
Notion = monitoring and operations surface
```

When they conflict, the repository wins. Notion must be updated to match.

---

## Sync Triggers

### After every Claude session

| Event | Repository update | Notion update |
|---|---|---|
| Task completed | Mark `[x]` in TASKS.md | Set Task status → `Done` |
| Task started | Mark `[~]` in TASKS.md | Set Task status → `In Progress` |
| New task created | Add to TASKS.md | Add row to Task Tracker |
| New ADR recorded | Add to DECISIONS.md | Add row to Decision Log |
| Phase milestone reached | Update ROADMAP.md deliverables | Update Roadmap page + Project Hub callout |
| Feature status changes | N/A (not tracked in repo) | Update Feature Tracker row |
| Session ends | Session End Checklist in SESSION_GUIDE.md | Add row to Session Log |

### After every Cursor session (implementation)

Claude reviews Cursor's output. Claude then:
1. Updates TASKS.md (mark done or flag blocked)
2. Updates DECISIONS.md if Cursor made a non-obvious implementation choice
3. Updates Task Tracker in Notion (status, notes)
4. Updates Feature Tracker if feature progresses
5. Adds Session Log entry

---

## What Stays Repository-Only

The following never need to be in Notion (they are code or config):

- `.env.example`
- `turbo.json`, `package.json`
- `tsconfig.json`
- Source code
- `.cursor/rules/` files
- `CLAUDE.md`, `AGENTS.md`, `DEVELOPMENT_RULES.md` (governance, not project state)

---

## What Stays Notion-Only

- Session Log entries (narrative history)
- Feature-level UX notes
- Risk assessments
- Release readiness checklist (in Phase 8)

---

## Sync Checklist (End of Session)

```
[ ] All completed tasks marked [x] in TASKS.md
[ ] Corresponding tasks set to "Done" in Notion Task Tracker
[ ] New tasks added to both TASKS.md and Notion Task Tracker
[ ] Any new ADRs added to both DECISIONS.md and Notion Decision Log
[ ] Feature Tracker updated if any feature changed status
[ ] Session Log entry created in Notion
[ ] Project Hub callout updated if phase changed
[ ] No repo docs left out of sync with Notion
```

---

## Anti-Patterns to Avoid

| Anti-pattern | Why it breaks sync |
|---|---|
| Updating only Notion, not TASKS.md | Repo becomes stale; Cursor reads TASKS.md |
| Updating only TASKS.md, not Notion | Notion becomes stale; monitoring surface is wrong |
| Adding ADRs to Notion without DECISIONS.md | Repo is source of truth; Decision Log is a mirror |
| Cursor updating Notion | Cursor never touches Notion — Claude owns it |
| Creating tasks in Notion without a TASKS.md brief | Task briefs must exist in repo for Cursor to read |
| Marking a Notion task Done before Claude reviews | Review first, then mark Done in both places |

---

## Frequency

- **Minimum:** Once per session (at session end)
- **Recommended:** At each logical checkpoint within a long session

If a session ends without a Notion sync, mark `Notion Updated: false` in the Session Log so it is not lost.
