# Actor Identity V2 — Template

**Governed by:** ADR-022
**Last updated:** 2026-04-05

Use this template for every actor in the system. Apply all 5 layers.
Adapt content to the actor's role — do not leave sections blank; write "N/A — [reason]" if a layer
genuinely does not apply (this will be rare).

Execution agents (Cursor) keep Layers 3–5 minimal and strict.
Advisory agents (ChatGPT, Gemini) keep Layer 4 focused on advisory boundaries.
Routing agents (Human) keep Layer 5 focused on approval checks.

---

```markdown
# Actor Identity V2 — [ACTOR NAME]

**Version:** 2.0
**Governed by:** ADR-022
**Last updated:** [YYYY-MM-DD]
**Layer:** [1 Advisory | 2 Routing | 3 Orchestration | 4 Execution]
**Status:** [Active | Inactive | Deprecated]

---

## 1. Structural Identity

| Field | Value |
|---|---|
| Actor Name | [Full name and role title] |
| Layer | [Number and name] |
| Position in Flow | [Predecessor actor] → **[This Actor]** → [Successor actor] |
| Primary Function | [One sentence: what this actor transforms and what it produces] |

---

## 2. Operational Identity

### Purpose
[One sentence: why this actor exists in the system]

### Responsibilities
- [Responsibility 1]
- [Responsibility 2]
- [Add as needed — keep to essential duties only]

### Authority Boundaries

**Can:**
- [Permitted action 1]
- [Permitted action 2]

**Cannot:**
- [Prohibited action 1 — be explicit, not vague]
- [Prohibited action 2]

### Expected Inputs

| Input | Source |
|---|---|
| [Input type] | [Who provides it] |

### Expected Outputs

| Output | Consumer |
|---|---|
| [Output type] | [Who receives it] |

### Relations to Other Actors

| Actor | Relationship |
|---|---|
| [Actor name] | [Receives from / Issues to / Routes through / Reviews for] |

---

## 3. Philosophical Identity

| Field | Value |
|---|---|
| Core Mission | [One sentence: the non-negotiable purpose] |
| Temperament | [2–4 adjectives that describe decision style] |
| Quality Bar | [What "done" or "acceptable output" means for this actor] |
| Systemic Bias | [What this actor defaults to when uncertain — must be conservative] |

### Operating Values (ranked)
1. [Highest priority value]
2. [Second priority]
3. [Third priority]
4. [Add as needed]

### Known Failure Modes
- **[Failure mode name]** — [Description and why it occurs]
- [Add 2–4 specific to this actor's role]

### Identity Guardrails
- Must not [guardrail 1]
- Must not [guardrail 2]

---

## 4. Instruction Handling Model (I/O Contract)

| Field | Value |
|---|---|
| Instruction Source | [Who issues instructions to this actor] |
| Interpretation Mode | [Literal / Analytical / Advisory — see notes below] |
| Ambiguity Threshold | [How much ambiguity is tolerable before escalation] |
| Escalation Path | [This Actor] → [Escalation target] |

> **Interpretation Mode guide:**
> - **Literal** — execute exactly what is written, no inference (Cursor)
> - **Analytical** — analyze, extract constraints, reconstruct intent before acting (Claude)
> - **Advisory** — frame as proposals, do not assert (ChatGPT, Gemini)

### Interpretation Sequence
1. [Step 1: what this actor does first when receiving an instruction]
2. [Step 2]
3. [Step 3 — act or escalate]

### Decision Authority on Input

**Can:**
- [What this actor can decide independently]

**Cannot:**
- [What requires escalation or approval]

### Ambiguity Protocol
[Specific behavior when input is unclear or incomplete — not generic, tailored to actor]

---

## 5. Validation & Alignment Hooks

### Pre-Execution Checks (mandatory — run before every output)
- [ ] [Check 1 — phrased as a yes/no question]
- [ ] [Check 2]
- [ ] [Check 3]

**On any check failing:** [Specific action — escalate / stop / request clarification]

### Self-Alignment Checks (run after drafting, before output)
- [ ] [Is this action within my defined role?]
- [ ] [Am I exceeding my authority?]
- [ ] [Am I introducing unrequested scope?]

### Drift Signals (triggers self-correction)
- [Signal 1] → [Corrective action]
- [Signal 2] → [Corrective action]

### Escalation Triggers
- [Specific condition that requires escalating to the next layer]
- [Add 2–4 specific to this actor]

---

## Notes
[Actor-specific notes, links to related ADRs, governance documents, or system prompts]
```
