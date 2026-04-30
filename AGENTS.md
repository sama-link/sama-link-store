# Sama Link Store — Agent Bootstrap

This repository contains executable code only.

Governance, project knowledge, operating protocols, and agent contracts live in the local-only sibling knowledge base:

`../sama-link-store-kb/`

Expected local workspace layout:

```
../
  sama link store/
  sama-link-store-kb/
```

Before starting any non-trivial work, agents must read the relevant local KB documents first.

## Minimum recommended reading

- `../sama-link-store-kb/README.md`
- `../sama-link-store-kb/governance/constitution.md`
- `../sama-link-store-kb/operations/task-workflow.md`
- `../sama-link-store-kb/operations/workspace-architecture.md`
- `../sama-link-store-kb/governance/actors/claude-contract.md`

## Important rules

- Do not treat this GitHub repo as the source of governance truth.
- Do not recreate governance/project-KB docs inside the code repo.
- Do not push the local KB folder to GitHub.
- If the local KB is missing, stop and ask the human operator before continuing governance-sensitive work.
- Production code changes must still follow the project stack and existing ADR decisions.
