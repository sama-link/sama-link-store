# Notion Database Schema — Sama Link Store

Canonical schema for all Notion databases. Use this as the reference when adding new entries or modifying schema.

---

## Task Tracker

**Data Source:** `collection://a74e62ce-09da-455d-b2ee-7ade3d89ff47`

| Property | Type | Values / Notes |
|---|---|---|
| Task Title | title | Short description of the task |
| Task ID | text | e.g. `I18N-1`, `CATALOG-3`, `FIX-2` |
| Status | select | `Not Started` · `Ready` · `In Progress` · `In Review` · `Done` · `Blocked` · `Deferred` |
| Phase | select | `Phase 0` – `Phase 8` |
| Area | select | `Storefront` · `Admin` · `Backend` · `UI System` · `i18n` · `SEO` · `Infrastructure` · `Security` · `DevOps` · `Monorepo` |
| Type | select | `Feature` · `Fix` · `Refactor` · `Infra` · `Docs` · `Chore` · `i18n` · `SEO` |
| Owner | select | `Claude` · `Cursor` · `Human` · `Unassigned` |
| Priority | select | `P0 Critical` · `P1 High` · `P2 Medium` · `P3 Low` |
| Depends On | text | Comma-separated Task IDs, e.g. `I18N-1, I18N-2` |
| Files Allowed | text | Files Cursor is permitted to change |
| Files Forbidden | text | Files Cursor must not touch |
| Acceptance Criteria | text | Pipe-separated criteria that must pass |
| Notes | text | Gotchas, decisions to follow, patterns to use |
| Created At | created_time | Auto |
| Updated At | last_edited_time | Auto |

**Status flow:**
```
Not Started → Ready → In Progress → In Review → Done
                                              ↘ Blocked → (fix) → In Progress
```

---

## Feature Tracker

**Data Source:** `collection://c357977b-4718-4ce1-97d9-971f70c86ba1`

| Property | Type | Values / Notes |
|---|---|---|
| Feature Name | title | Human-readable feature name |
| Status | select | `Not Started` · `In Progress` · `Done` · `Deferred` · `Cancelled` |
| Phase | select | `Phase 0` – `Phase 8` · `Post-MVP` |
| Area | select | `Storefront` · `i18n & RTL` · `SEO` · `Product Catalog` · `Search` · `Collections` · `Cart` · `Checkout` · `Customer Accounts` · `Admin & Dashboard` · `Payments` · `Analytics` · `Marketing` · `Notifications` · `Security` · `DevOps` · `Monorepo & Infra` |
| MVP or Post-MVP | select | `MVP` · `Post-MVP` · `Infrastructure` |
| Risk | select | `Low` · `Medium` · `High` |
| Description | text | What this feature does and why it matters |
| Dependencies | text | Other features or phases that must complete first |
| Tech Notes | text | Implementation approach, key decisions, libraries |
| UX Notes | text | UX considerations, RTL behaviour, accessibility |
| Expandability Notes | text | How this feature can be extended post-MVP |
| Created At | created_time | Auto |
| Updated At | last_edited_time | Auto |

---

## Session Log

**Data Source:** `collection://1b7a295a-6427-44c4-9bcd-00b9f03692a0`

| Property | Type | Values / Notes |
|---|---|---|
| Session Title | title | `Session N — [Brief description]` |
| Date | date | ISO-8601 date (use `date:Date:start`) |
| Agent | select | `Claude` · `Cursor` · `Human` · `Mixed` |
| Phase | select | `Phase 0` – `Phase 8` |
| Review Outcome | select | `Passed` · `Partial` · `Failed` · `Pending Review` · `No Review Needed` |
| Tasks Worked On | text | Comma-separated Task IDs |
| What Was Planned | text | What was intended at session start |
| What Was Implemented | text | What was actually completed |
| What Remains | text | Unfinished items and blockers |
| Decisions Made | text | New ADRs or architectural decisions |
| Files Changed | text | Summary of files created/modified/deleted |
| Next Recommended Task | text | Task ID and one-line description |
| Repo Docs Updated | checkbox | Were TASKS.md, DECISIONS.md etc. updated? |
| Notion Updated | checkbox | Was Notion updated at end of session? |
| Created At | created_time | Auto |

---

## Decision Log

**Data Source:** `collection://b10e204a-78f4-43c7-9aab-6fb25eb44203`

| Property | Type | Values / Notes |
|---|---|---|
| Decision Title | title | Short title, e.g. `Monorepo with Turborepo` |
| ADR ID | text | e.g. `ADR-001` |
| Status | select | `Accepted` · `Deferred` · `Superseded` · `Rejected` · `Under Review` |
| Area | select | `Architecture` · `Frontend` · `Backend` · `i18n` · `Security` · `DevOps` · `Process` · `Payments` · `Database` |
| Date | date | Decision date (use `date:Date:start`) |
| Context | text | Why this decision was needed |
| Decision | text | What was chosen |
| Consequences | text | What this means going forward |
| Affects | text | Which areas or features are affected |
| Created At | created_time | Auto |
| Updated At | last_edited_time | Auto |

---

## Task ID Conventions

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
