# Notion Entry Templates — Sama Link Store

Use these templates when creating entries in Notion databases. For property definitions and allowed values, see [`notion-schemas.md`](notion-schemas.md).

---

## Task Brief Template

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
[docs/project-kb/definition/architecture.md, docs/project-kb/governance/development-rules.md, docs/project-kb/governance/decisions.md, docs/project-kb/operations/tasks.md, docs/project-kb/governance/agents.md, CLAUDE.md, plus any other files outside scope]

Acceptance Criteria:
[Pipe-separated or newline-separated criteria]
[Always include: tsc --noEmit passes | next build passes]

Notes:
[Gotchas, patterns to follow, linked ADRs, decisions to enforce]
```

**Status flow:**
```
Not Started → Ready (when dependencies are complete)
Ready → In Progress (when Cursor starts)
In Progress → In Review (when Cursor reports done)
In Review → Done (when Claude verifies all criteria pass)
In Progress → Blocked (when Cursor hits a blocker)
Blocked → In Progress (when Claude resolves the blocker)
Any → Deferred (when descoped)
```

**Rules:**
- Every task added to Notion **must also exist in docs/project-kb/operations/tasks.md** with the full brief format
- Task Tracker in Notion is a monitoring mirror — docs/project-kb/operations/tasks.md in the repo is the source of truth
- Claude creates tasks; Cursor executes them
- Do not mark `Done` in Notion until Claude has reviewed against acceptance criteria
- Do not add tasks for future phases until that phase becomes active

---

## Feature Entry Template

**Database:** Feature Tracker (`collection://c357977b-4718-4ce1-97d9-971f70c86ba1`)

```
Feature Name:         [Human-readable feature name, e.g. "Product Catalog"]
Status:               Not Started | In Progress | Done | Deferred | Cancelled
Phase:                Phase 0 – Phase 8 | Post-MVP
Area:                 [See area list below]
MVP or Post-MVP:      MVP | Post-MVP | Infrastructure
Risk:                 Low | Medium | High

Description:
[What this feature does, why it matters, what it includes at a high level]

Dependencies:
[Other features or phases that must complete first. E.g. "Commerce Backend Integration"]

Tech Notes:
[Key libraries, architectural decisions, patterns. Link to ADR IDs where relevant.]

UX Notes:
[UX considerations: RTL behaviour, accessibility, mobile responsiveness, edge cases.]

Expandability Notes:
[How this feature can be extended post-MVP without rewriting it.]
```

**Area reference:**

| Area | Covers |
|---|---|
| `Storefront` | General storefront scaffolding, layout, routing |
| `i18n & RTL` | Internationalization, locale routing, RTL layout |
| `SEO` | Metadata, structured data, sitemap, robots |
| `Product Catalog` | Product listing, detail, variants, images |
| `Search` | Search input, results, filtering |
| `Collections` | Category and collection browsing pages |
| `Cart` | Cart context, drawer, quantity management |
| `Checkout` | Multi-step checkout, address, shipping |
| `Customer Accounts` | Auth, profile, order history, addresses |
| `Admin & Dashboard` | Merchant admin UI, product/order management |
| `Payments` | Payment gateway integration |
| `Analytics` | GA4, GTM, event tracking |
| `Marketing` | Promotions, discount codes, email hooks |
| `Notifications` | Order confirmation, transactional email |
| `Security` | Security headers, rate limiting, audit |
| `DevOps` | Deployment, CI/CD, monitoring, backups |
| `Monorepo & Infra` | Turborepo, shared packages, config |

**Rules:**
- Feature Tracker is a monitoring view of the product roadmap
- It does not replace docs/project-kb/operations/roadmap.md — that is the source of truth
- Features are not the same as tasks — one feature has many tasks
- Claude updates feature status as tasks complete
- Cursor never interacts with the Feature Tracker

---

## Session Log Template

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

**Session naming convention:**
```
Session 1 — Project Foundation & Governance Setup
Session 2 — Notion OS Build, Task & Feature Population
Session N — [Phase] [Focus Area]: [Key tasks or milestone]
```

**Review outcome guide:**

| Outcome | When to use |
|---|---|
| `Passed` | All acceptance criteria met, tsc + build pass, no drift |
| `Partial` | Some criteria met, minor issues remain, no blocking failures |
| `Failed` | Build fails, TypeScript errors, or critical criteria not met |
| `Pending Review` | Cursor finished, Claude has not reviewed yet |
| `No Review Needed` | Planning/governance session with no Cursor output to review |

**Minimum viable entry** (if time is limited):
1. Session Title
2. Date
3. Agent
4. Phase
5. Next Recommended Task
6. Notion Updated (mark honestly — even if No)
