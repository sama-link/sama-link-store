# Task Brief Template — Sama Link Store

Use this template when creating a new task in the Notion Task Tracker.
This mirrors the format in AGENTS.md and TASKS.md.

---

## Template

**Database:** Task Tracker (`collection://a74e62ce-09da-455d-b2ee-7ade3d89ff47`)

```
Task Title:           [Short description, e.g. "Install next-intl"]
Task ID:              [PREFIX-N, e.g. I18N-1, CATALOG-3, FIX-2]
Status:               Not Started | Ready | In Progress | In Review | Done | Blocked | Deferred
Phase:                Phase 0 | Phase 1 | ... | Phase 8
Area:                 Storefront | Admin | Backend | UI System | i18n | SEO | Infrastructure | Security | DevOps | Monorepo
Type:                 Feature | Fix | Refactor | Infra | Docs | Chore | i18n | SEO
Owner:                Claude | Cursor | Human | Unassigned
Priority:             P0 Critical | P1 High | P2 Medium | P3 Low
Depends On:           [Task ID(s) or "none"]

Files Allowed:
[List of files Cursor is permitted to create or modify]

Files Forbidden:
[ARCHITECTURE.md, DEVELOPMENT_RULES.md, DECISIONS.md, TASKS.md, AGENTS.md, CLAUDE.md, plus any other files outside scope]

Acceptance Criteria:
[Pipe-separated or newline-separated criteria]
[Always include: tsc --noEmit passes | next build passes]

Notes:
[Gotchas, patterns to follow, linked ADRs, decisions to enforce]
```

---

## Status Flow

```
Not Started → Ready (when dependencies are complete)
Ready → In Progress (when Cursor starts)
In Progress → In Review (when Cursor reports done)
In Review → Done (when Claude verifies all criteria pass)
In Progress → Blocked (when Cursor hits a blocker)
Blocked → In Progress (when Claude resolves the blocker)
Any → Deferred (when descoped)
```

---

## Task ID Prefix Reference

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
| `INFRA-` | Infrastructure |
| `FIX-` | Bug fix |
| `REFACTOR-` | Refactoring |

---

## Rules

- Every task added to Notion **must also exist in TASKS.md** with the full brief format
- Task Tracker in Notion is a monitoring mirror — TASKS.md in the repo is the source of truth
- Claude creates tasks; Cursor executes them
- Do not mark `Done` in Notion until Claude has reviewed against acceptance criteria
- Do not add tasks for future phases until that phase becomes active
