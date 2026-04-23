# Notion Sync Protocol — Sama Link Store

**Layer:** Operations (support structure)
**Source of truth for:** Rules and triggers for keeping the Notion workspace in sync with the repository.
**Updated when:** Sync protocol changes.

---

## Core Principle

```
Repository markdown = source of truth for execution-facing state
Notion = management and governance monitoring surface
```

When they conflict, the repository wins. Notion must be updated to match.

Claude is the central synchronization operator for all representations. Notion never originates decisions. Repo always wins on conflict.

---

## Reading Priority

The Notion workspace has 4 layers. **Not all layers are read every session.**

| When | What to read |
|---|---|
| Every session start | Hub (Layer: Operations) — status callout, current phase, system health |
| Every session (execution work) | Task Tracker, Session Log, Decision Log (Operations Layer databases) |
| When governance questions arise | Governance Constitution, Rules Registry, Governance Protocols (Governance Layer) |
| Rarely | Definition Layer — stable, changes infrequently |

Do not re-read the full Governance or Definition Layer every session. Reading the Hub and the Operations databases is sufficient for routine execution.

---

## Sync Triggers

### After every Claude session

| Event | Repository update | Notion update |
|---|---|---|
| Task completed | Mark `[x]` in `TASKS.md` | Set Task status → `Done` |
| Task started | Mark `[~]` in `TASKS.md` | Set Task status → `In Progress` |
| New task created | Add to `TASKS.md` | Add row to Task Tracker |
| New ADR recorded | Add to `DECISIONS.md` | Add row to Decision Log; set Related Rules and Related Workflows where applicable |
| Phase milestone reached | Update `ROADMAP.md` deliverables | Update Roadmap page + Hub callout |
| Feature status changes | N/A (not tracked in repo) | Update Feature Tracker row |
| Session ends | Session End Checklist | Add row to Session Log |
| Governance rule changed | Update `CLAUDE.md` / `DEVELOPMENT_RULES.md` | Update relevant Governance Layer entries |
| Execution protocol changed | Update `CLAUDE.md` | Update relevant Governance Protocols database entry |
| New constraint adopted | Update `CLAUDE.md` / `DECISIONS.md` | Add row to Rules & Standards Registry database |
| Actor role / protocol changed | Update `AGENTS.md` / `CLAUDE.md` | Update Actor Identity Card |
| New exception/deviation approved | N/A (operational) | Add row to Exceptions / Deviations Register database |

### After every executor session (Cursor/Codex)

Claude reviews executor output. Claude then:
1. Updates `TASKS.md` (mark done or flag blocked)
2. Updates `DECISIONS.md` if executor made a non-obvious implementation choice
3. Updates Task Tracker in Notion (status, notes)
4. Updates Feature Tracker if feature progresses
5. Adds Session Log entry

---

## What Stays Repository-Only

These never need to be in Notion — they are code, config, or execution context for repo-oriented agents:

- `.env.example`
- `turbo.json`, `package.json`
- `tsconfig.json`
- Source code
- `.agents/*.mdc` files (Claude Code worktree)
- `CLAUDE.md`, `TASKS.md` — execution surfaces in the Claude Code worktree, not human-facing management surfaces

---

## What Stays Notion-Only

- Session Log entries (narrative session history)
- Feature-level UX notes
- Risk assessments and debt detail
- Release readiness checklist (Phase 8)
- Actor Identity Card detail (not needed in repo — `AGENTS.md` covers roles for repo-oriented agents)
- Governance Protocol entry detail (full procedure bodies — `CLAUDE.md` holds the operative summary)
- Rules & Standards Registry entry detail (full rationale — `CLAUDE.md` and `DEVELOPMENT_RULES.md` hold the operative rules)
- Exceptions / Deviations Register entries (operational governance events)

---

## Sync Checklist (End of Session)

```
[ ] All completed tasks marked [x] in TASKS.md
[ ] Corresponding tasks set to "Done" in Notion Task Tracker
[ ] New tasks added to both TASKS.md and Notion Task Tracker
[ ] Any new ADRs added to both DECISIONS.md and Notion Decision Log
[ ] New ADR's Related Rules and Related Workflows fields set in Decision Log where applicable
[ ] Feature Tracker updated if any feature changed status
[ ] Session Log entry created in Notion (mandatory — no exceptions)
[ ] Project Hub callout updated if phase changed or next task changed
[ ] System health validated: Invalid Tasks = 0, Invalid Features = 0
[ ] No repo docs left out of sync with Notion
```

---

## Layer-Specific Sync Rules

| Layer | Form | Sync trigger | Repo source | Sync frequency |
|---|---|---|---|---|
| Definition | Static pages | Project scope or business goal changes | `PROJECT_BRIEF.md`, `ARCHITECTURE.md` | Rare |
| Governance — Constitution | Static page | Governance model changes | `docs/project-kb/governance/constitution.md` | Rare |
| Governance — Decision Log | Database entries | New ADR added | `DECISIONS.md` | Every ADR |
| Governance — Rules Registry | Database entries | New governance constraints adopted | `DEVELOPMENT_RULES.md`, `DECISIONS.md` | When new constraints formalized |
| Governance — Protocols | Database entries | Execution protocol changes | `CLAUDE.md` | When protocol updates |
| Governance — Exceptions | Database entries | Deviation approved | (no repo equivalent) | When deviation occurs |
| Actor Identity Cards | Static pages | Actor role or boundary changes | `AGENTS.md`, `CLAUDE.md` | Rare |
| Operations — Hub | Static page | Every session close | `ROADMAP.md`, `TASKS.md` | Every session |
| Operations — Task Tracker | Database | Per task | `TASKS.md` | Every session |
| Operations — Feature Tracker | Database | Per feature | N/A | When feature status changes |
| Operations — Session Log | Database | Per session | N/A | Every session |
| Operations — Workflows | Database | Protocol changes | `CLAUDE.md` | When protocols update |

---

## Multi-Representation Sync Obligation

When an approved change is made:
1. Claude documents it in the repository first
2. Claude then syncs to the appropriate Notion layer(s)
3. If external agent instruction context (ChatGPT, Gemini system prompts) needs updating, Claude flags it for Human to update manually

---

## Anti-Patterns to Avoid

| Anti-pattern | Why it breaks sync |
|---|---|
| Updating only Notion, not `TASKS.md` | Repo becomes stale; executors read `TASKS.md` |
| Updating only `TASKS.md`, not Notion | Notion becomes stale; monitoring surface is wrong |
| Adding ADRs to Notion without `DECISIONS.md` | Repo is source of truth; Decision Log is a mirror |
| Cursor updating Notion | Cursor never touches Notion — Claude owns it |
| Creating tasks in Notion without a `TASKS.md` brief | Task briefs must exist in repo for executors to read |
| Marking a Notion task Done before Claude reviews | Review first, then mark Done in both places |
| Referencing the old 7-layer model | The 7-layer model is deprecated; use the 4-layer model |
| Updating legacy Notion static pages for Layers 4/5 | Those pages are migration sources, no longer authoritative — update the database entries |
| Updating external agent prompts directly as Claude | External prompts are updated by Human — Claude flags needed changes |

---

## Frequency

- **Minimum:** Once per session (at session end)
- **Recommended:** At each logical checkpoint within a long session (Loop 2 trigger per CLAUDE.md batched execution protocol)

If a session ends without a Notion sync, mark `Notion Updated: false` in the Session Log so it is not lost.
