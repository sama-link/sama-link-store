# Skill Framework — Sama Link Store

**Layer:** Governance
**Governed by:** ADR-024
**Purpose:** Defines the shared and specialized skill vocabulary for the multi-agent team. Every agent declares its skills using this framework. Future agents inherit shared capabilities without redefining them in individual contracts.
**Updated when:** A new KB document is added that introduces a new skill domain, or a new agent type is approved that requires a new specialized skill.

---

## What Is a Skill in This System

A **skill** is a defined, reusable capability that an agent can apply to produce correct, governance-compliant output. Skills are not job titles or role descriptions — they are units of capability mapped to specific knowledge sources in the project KB.

A skill has:
- A **name** — stable identifier used in agent contracts
- A **description** — what it enables an agent to do
- A **knowledge source** — which KB document grounds the skill
- A **declaration type** — shared (inherited by all) or specialized (declared per agent)

**Anti-duplication rule:** Agent contracts declare skills by name and describe how they apply them. Contracts do not re-define what a skill is. The definition lives here.

---

## Shared Skills

Shared skills represent the behavioral baseline defined in `governance/team-principles.md`. They are the **pool** from which each agent selects its active subset — not a block to inherit wholesale.

**Selective inheritance rule:** Each agent contract declares only the shared skills that are active for its layer, authority level, and execution mode. Three criteria apply per skill:
1. **Role relevance** — does this agent's role require this behavior?
2. **Authority fit** — does this agent's authority level permit this behavior as defined?
3. **Mode alignment** — does this agent's mode (advisory / execution / orchestration) apply this skill in the standard way?

If all three are yes, the skill is listed as active. If any answer is no or significantly different, the skill is either excluded or adapted with a note in the contract.

Agents do **not** begin with a blanket inheritance statement. They begin with an explicit list of active shared skills.

| Skill | What It Enables | Knowledge Source |
|---|---|---|
| **ADR Lookup** | Finding the governing decision for any library, pattern, or architectural choice before acting | `governance/decisions.md` |
| **Escalation Handling** | Knowing when and how to escalate ambiguity instead of guessing or proceeding silently | `governance/team-principles.md` §3 |
| **Boundary Respect** | Respecting file boundaries, authority limits, and governance document immunity | `governance/team-principles.md` §4 |
| **Truth-Source Navigation** | Knowing which document is authoritative when two sources conflict | `governance/team-principles.md` §5 |
| **Anti-Drift Self-Check** | Detecting when output is drifting from assigned scope, ADRs, or role, and self-correcting | `governance/team-principles.md` §1 |
| **Role Containment** | Recognizing when an action belongs to a different layer and refusing to perform it | `governance/team-principles.md` §2 |
| **Safe Ambiguity Handling** | Escalating or documenting assumptions when ambiguous — never producing silence | `governance/team-principles.md` §7 |
| **Efficiency Discipline** | Operating with minimum reading, minimum output, plan-first for complex tasks, and selective sync | `governance/team-principles.md` §8 |

---

## Specialized Skills

Specialized skills are domain-specific capabilities declared per agent. They map to specific KB documents that provide the technical or operational grounding for each skill domain.

### Orchestration Skills (Claude-tier)

| Skill | What It Enables | Knowledge Source |
|---|---|---|
| **Brief Authoring** | Writing V2 task briefs that are scope-complete, acceptance-clear, and executor-appropriate | `governance/agents.md` |
| **ADR Authoring** | Writing governance-valid ADRs with context, options considered, decision, and consequences | `governance/decisions.md` (format) |
| **Review Execution** | Validating executor output against acceptance criteria with explicit pass/fail per criterion | `governance/agents.md` |
| **Notion Sync** | Maintaining semantic alignment between repo governance documents and Notion databases | `operations/notion-sync.md` |
| **Architecture Analysis** | Evaluating library, pattern, and system choices against project constraints and existing ADRs | `definition/architecture.md` + `governance/decisions.md` |
| **Phase Planning** | Decomposing phases into ordered, dependency-correct task sequences | `operations/roadmap.md` + `operations/task-workflow.md` |

### Execution Skills (Cursor/Codex-tier)

| Skill | What It Enables | Knowledge Source |
|---|---|---|
| **Next.js Storefront Patterns** | Implementing App Router routes, layouts, Server/Client Components correctly | `implementation/storefront-patterns.md` |
| **Backend Patterns (Medusa v2)** | Implementing Medusa services, subscribers, API routes, migrations, workflows | `implementation/backend-patterns.md` |
| **TypeScript Strict Mode** | Writing fully type-safe code under strict tsconfig; no `any` without justification | `governance/development-rules.md` §2 |
| **Security Rules Compliance** | Applying secrets-handling, CORS, auth, input validation, and header security rules | `implementation/security-baseline.md` |
| **API Guidelines** | Following the typed API client patterns, error handling model, and versioning conventions | `implementation/api-guidelines.md` |
| **UI Principles** | Applying component hierarchy, RTL support, accessibility rules, and responsive patterns | `implementation/ui-principles.md` |
| **SEO Guidelines** | Applying metadata exports, JSON-LD, canonical URL structure, and sitemap standards | `implementation/seo-guidelines.md` |
| **i18n Compliance** | Using next-intl correctly per ADR-008; no hardcoded user-facing strings in components | `governance/development-rules.md` §11 |
| **Design Protocol Compliance** | Applying ADR-019 three-layer boundary (Safe/Restricted/Forbidden) and token-only rules | `governance/development-rules.md` §13 |
| **Media Intake Compliance** | Handling assets per the MEDIA-1 media intake protocol | `implementation/media-intake-protocol.md` |
| **Data / Content Model** | Correctly using the canonical data model for products, localization, and content ownership | `implementation/data-content-model.md` |
| **Integration Patterns** | Implementing Stripe, webhook intake, and third-party integration patterns correctly | `implementation/integrations-webhooks.md` |
| **Environment Configuration** | Applying environment variable conventions and deployment model correctly | `implementation/environment-model.md` |

### Advisory Skills (Consultant-tier)

| Skill | What It Enables | Knowledge Source |
|---|---|---|
| **Strategic Scenario Analysis** | Exploring decision trade-offs, downstream consequences, and alternatives in advisory form | Actor contract (Rafiq / ChatGPT) |
| **Commercial Discipline Guard** | Detecting business goal drift, resource waste, and overengineering proactively | Actor contract (Jimi / Gemini) |
| **Brief Drafting Assistance** | Helping Human formulate implementation-ready prompts and briefs for Claude review | Actor contract (Rafiq / ChatGPT) |

---

## How Future Agents Declare Skills

When defining a new agent identity using `docs/project-kb/governance/actors/identity-template.md`, include a **Skills Profile** section:

```markdown
## Skills Profile

> Skills declared by reference to `governance/skill-framework.md`. Shared skills are selectively inherited — not blanket-inherited.

**Shared Skills (selective):**
- **[Skill Name]** — active: [one line: why this skill is relevant to this agent's role and mode]
- [List only the shared skills that are active — not all seven by default]

**Not Inherited:**
- **[Skill Name]** — [reason: role / authority / mode mismatch — prevents false capability assumptions]
- [Include any shared skill not listed above that could be mistakenly assumed to apply]

**Specialized Skills:**
- **[Skill Name]** — [how this specific agent applies this skill in its role]

**Explicitly Excluded:**
- **[Skill Name]** — [reason: out of scope for this agent's role, or owned by a different authority tier]
```

**Rules for this section:**
1. List only the shared skills that are **actually active** for this agent — forced selection, not blanket acceptance
2. Every shared skill omitted must appear in **Not Inherited** with a one-line rationale
3. List only specialized skills this agent actively uses (not a wishlist)
4. Explicitly exclude skills that look applicable but are not — prevents false authority assumptions
5. Reference skills by the exact name in this document's tables

---

## Skill-to-KB Map

This table is the canonical mapping from skill domain to KB document. When a future agent needs a skill domain, it references the corresponding KB document in its contract.

| Domain | KB Document | Description |
|---|---|---|
| Storefront implementation | `implementation/storefront-patterns.md` | Route architecture, rendering strategy, component model |
| Backend / Medusa v2 | `implementation/backend-patterns.md` | Service, subscriber, API route, workflow patterns |
| API patterns | `implementation/api-guidelines.md` | Typed clients, error handling, Route Handlers |
| UI / Component design | `implementation/ui-principles.md` | Component hierarchy, RTL, accessibility, responsive |
| Security | `implementation/security-baseline.md` | Secrets, auth, CORS, headers, payment security |
| SEO | `implementation/seo-guidelines.md` | Metadata, JSON-LD, URLs, sitemap, AI readability |
| Media handling | `implementation/media-intake-protocol.md` | Asset formats, conversion, naming, folder structure |
| Data / Content model | `implementation/data-content-model.md` | Data ownership, product model, localization, caching |
| Integrations / Webhooks | `implementation/integrations-webhooks.md` | Stripe, webhook intake, failure/retry patterns |
| Environment / CI-CD | `implementation/environment-model.md` | Topology, variable structure, deployment models |
| Admin / Operations capability | `implementation/admin-operations-capability.md` | Admin interface options, catalog/order/customer ops |
| Implementation sequencing | `implementation/implementation-sequencing.md` | Phase-gating, foundation/backend/storefront sequences |
| Release readiness | `implementation/release-readiness.md` | Go-live gate criteria, readiness dimensions |
| Architecture decisions | `governance/decisions.md` | All accepted ADRs — governing authority for all choices |
| Team behavioral base + efficiency | `governance/team-principles.md` | Shared principles — floor for all agents; §8 is canonical efficiency discipline |
| Authority model | `governance/authority-model.md` | Decision gates, escalation chain, write access |
| Brief format | `governance/agents.md` | Task brief V2, escalation rules, handoff protocol |

---

## How This Framework Grows

**Adding a new KB document:** When a new document is added to `implementation/` or `governance/`, add the corresponding row to the Skill-to-KB Map. Add a new Specialized Skills row if the document introduces a genuinely new skill domain.

**Adding a new agent:** When a new specialized agent is introduced (requiring an ADR per ADR-021), its Skills Profile is defined using this vocabulary. If the agent introduces a genuinely new skill domain not covered here, add it to the Specialized Skills table in the same ADR.

**Deprecating a skill:** If a KB document is deprecated, mark the corresponding skill in this table with `(deprecated — see [replacement])`. Do not silently remove skills — agent contracts may still reference them.
