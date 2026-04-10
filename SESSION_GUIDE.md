# Session Guide — Sama Link Store

> **Navigation pointer.**
>
> This file is preserved as a lightweight session entrypoint. The full project knowledge base is at:
>
> **→ [`docs/project-kb/README.md`](docs/project-kb/README.md)**
>
> For task workflow: [`docs/project-kb/operations/task-workflow.md`](docs/project-kb/operations/task-workflow.md)
> For Notion sync: [`docs/project-kb/operations/notion-sync.md`](docs/project-kb/operations/notion-sync.md)

---

## Session Start — Mandatory Pre-Flight (every session)

Read in this order:

1. `CLAUDE.md` — Claude's active operating rules (read automatically by Claude Code)
2. `ROADMAP.md` — identify active phase and completed deliverables
3. `TASKS.md` — identify current task queue state
4. `DECISIONS.md` — recall all architectural decisions (check before any library/pattern choice)
5. `DEVELOPMENT_RULES.md` — enforce these rules in all guidance

For deeper context: `docs/project-kb/README.md` — full knowledge base index

---

## Session End — Mandatory Checklist

**Repository:**
- [ ] All completed tasks marked `[x]` in `TASKS.md`
- [ ] New ADRs added to `DECISIONS.md`
- [ ] `ROADMAP.md` updated if phase milestone reached
- [ ] `.env.example` updated if new env vars introduced
- [ ] Build passes (`tsc --noEmit` + `next build`)

**Notion:**
- [ ] Task Tracker: completed tasks set to `Done`
- [ ] Task Tracker: new tasks added if created this session
- [ ] Feature Tracker: status updated if any feature progressed
- [ ] Decision Log: new ADRs added; Related Rules and Related Workflows fields set
- [ ] Session Log: new entry added (mandatory every session)
- [ ] Project Hub callout updated (format: `[Phase] active. [Task + status]. Branch: \`[branch]\`. Build: [✅/⚠️/❌] | Notion sync: [✅/❌] | Updated: [YYYY-MM-DD]`)
- [ ] System health: Invalid Tasks = 0, Invalid Features = 0

---

## Current State (verify in `ROADMAP.md`)

Phase 2 — Commerce Backend Integration is active. BACK-1 complete. BACK-2 awaiting review. Branch: `feature/back-1-medusa-init`.

Always verify current state in `ROADMAP.md` — this note may lag.
