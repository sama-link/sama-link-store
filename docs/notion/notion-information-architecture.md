# Notion Information Architecture — Sama Link Store

This document defines the structure, hierarchy, and purpose of every page and database in the Notion workspace.

---

## Workspace Root

**Page:** 🏪 Sama Link Store — Project Hub
**URL:** https://www.notion.so/33613205fce68182a043cc6ad0088c3e

This is the single entry point to the entire Notion workspace. All pages and databases are children of or linked from this page.

---

## Page Hierarchy

```
🏪 Sama Link Store — Project Hub
├── 📄 Product Vision
├── 📄 Architecture Overview
├── 📄 Roadmap
├── 📄 Release Readiness
├── 📄 Technical Debt & Risks
├── 🗄️ Task Tracker (database)
├── 🗄️ Feature Tracker (database)
├── 🗄️ Session Log (database)
└── 🗄️ Decision Log (database)
    ├── ADR-001: Monorepo with Turborepo
    ├── ADR-002: Next.js App Router
    ├── ADR-003: Medusa v2
    ├── ADR-004: PostgreSQL
    ├── ADR-005: TypeScript Strict Mode
    ├── ADR-006: Admin Deferred to Phase 6
    ├── ADR-007: Stripe Payments
    ├── ADR-008: i18n Arabic Primary
    ├── ADR-009: Defer Meilisearch
    ├── ADR-010: S3-Compatible Storage
    ├── ADR-011: Dual-Agent Model
    └── ADR-012: Tailwind v4 CSS-Only
```

---

## Pages

### Project Hub
**Purpose:** Entry point and status dashboard. Shows active phase, build status, agent model, tech stack. Updated each session.

### Product Vision
**URL:** https://www.notion.so/33613205fce681ea8ec2fbfc605c096f
**Purpose:** Mirrors `PROJECT_BRIEF.md`. Business goal, product vision, core capabilities, MVP scope, success criteria.
**Updated when:** Business goals or MVP scope change.

### Architecture Overview
**URL:** https://www.notion.so/33613205fce6810692e3f625276bb2c6
**Purpose:** Mirrors `ARCHITECTURE.md`. System diagram, application boundaries, integration points, deployment model.
**Updated when:** Architecture decisions change (always record in DECISIONS.md first).

### Roadmap
**URL:** https://www.notion.so/33613205fce6810fab1af5be2b316353
**Purpose:** Mirrors `ROADMAP.md`. Phase-by-phase progress view with status indicators.
**Updated when:** A phase milestone is reached.

### Release Readiness
**URL:** https://www.notion.so/33613205fce6818bbce9e14d60e16054
**Purpose:** Launch checklist for Phase 8. Tracks security, performance, SEO, backup, staging verification.
**Updated when:** Approaching Phase 8.

### Technical Debt & Risks
**URL:** https://www.notion.so/33613205fce681f384a3f01b77c1ea79
**Purpose:** Tracks known technical debt, deferred decisions, and risks with severity and owner.
**Updated when:** New debt is identified or existing items are resolved.

---

## Databases

### Task Tracker
**URL:** https://www.notion.so/e332bf42abb143fd88853e50d8d684c8
**Data Source:** `collection://a74e62ce-09da-455d-b2ee-7ade3d89ff47`
**Purpose:** Every implementation task Cursor executes. One row per task. Mirrors TASKS.md.
**Key fields:** Task ID, Status, Phase, Area, Owner, Depends On, Acceptance Criteria, Files Allowed, Files Forbidden.
**Updated when:** Claude produces a new task brief or marks a task complete after review.

### Feature Tracker
**URL:** https://www.notion.so/dcf8e96969674c268f8b0dc3cc5ee728
**Data Source:** `collection://c357977b-4718-4ce1-97d9-971f70c86ba1`
**Purpose:** Every product feature, from MVP to post-MVP. Tracks phase, status, risk, tech approach.
**Key fields:** Feature Name, Status, Phase, Area, MVP or Post-MVP, Risk, Description, Tech Notes, UX Notes.
**Updated when:** A feature's status changes or a new feature is added.

### Session Log
**URL:** https://www.notion.so/c8609cd7671944b4ae368fe6445f7bb4
**Data Source:** `collection://1b7a295a-6427-44c4-9bcd-00b9f03692a0`
**Purpose:** One entry per development session. Tracks what was planned, implemented, what remains, decisions made.
**Key fields:** Session Title, Date, Agent, Phase, Tasks Worked On, Files Changed, Next Recommended Task, Notion Updated.
**Updated when:** End of every session (mandatory).

### Decision Log
**URL:** https://www.notion.so/76a704d872c34874bfac1e8454f6134b
**Data Source:** `collection://b10e204a-78f4-43c7-9aab-6fb25eb44203`
**Purpose:** Mirrors DECISIONS.md. Every ADR as a Notion database entry for searchable, filterable reference.
**Key fields:** ADR ID, Decision Title, Status, Area, Context, Decision, Consequences, Date.
**Updated when:** A new ADR is added to DECISIONS.md (both must be updated together).

---

## Data Relationships

```
Session Log → references Tasks Worked On (Task IDs)
Task Tracker → each task belongs to a Phase and Feature area
Feature Tracker → each feature belongs to a Phase
Decision Log → each ADR affects specific Areas/Features
```

No native Notion relation fields are used — relationships are maintained via text references (Task IDs, ADR IDs) to avoid Notion-specific coupling.

---

## Ownership Rules

| Content | Owner | Trigger |
|---|---|---|
| Project Hub status callout | Claude | Each session start |
| Task Tracker entries | Claude | When producing task briefs |
| Task status updates | Claude | After reviewing Cursor output |
| Feature Tracker entries | Claude | When feature scope is defined |
| Feature status updates | Claude | When phase progresses |
| Session Log entries | Claude | End of every session |
| Decision Log entries | Claude | When DECISIONS.md is updated |
| Page content (Vision, Arch, Roadmap) | Claude | When repo source docs change |

**Cursor never touches Notion.** Human may update as directed by Claude.
