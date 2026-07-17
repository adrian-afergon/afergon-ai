# Agent Permissions — Atomic Task Plan

## Project Overview

- **Project**: afergon-ai
- **Description**: A development harness that coordinates controlled software delivery across Pi, Claude Code, and OpenCode.
- **Technical Direction**: Repair the effective permissions for `afg-debate` and `afergon-ai` as one atomic change spanning agent frontmatter, registrar MANIFEST parity, and registrar-output coverage.
- **Constraints**: Planning does not modify production source or PR #70. Future implementation remains limited to the two named agent definitions, their registrar representation, and relevant tests, and will reuse PR #70 later.

## Dependency Tree

```text
01 Repair effective managed agent permissions
```

## Ordered Tasks

1. **`openspec/tasks/001-repair-effective-agent-permissions.md`** — Align both managed-agent declarations and registrar MANIFEST policies, then prove the persisted `opencode.json` policies with focused automated coverage. **Breadth**: broad, intentionally atomic because the three coupled representations jointly define the effective repair.

Canonical chain: `openspec/tasks/PROJECT-TASKS.md` → `openspec/tasks/001-repair-effective-agent-permissions.md` → `openspec/specs/agent-permissions/spec-01-effective-agent-permission-repair.md` → `openspec/plans/agent-permissions/PLAN.md` → `openspec/results/agent-permissions/RESULT.md`.

## Validation Status

- [x] The task has non-empty intent, in-scope work, acceptance criteria, and `Dependencies.Requires`.
- [x] The atomic task covers agent frontmatters, registrar MANIFEST parity, and registrar-output testing.
- [x] No task dependency blocks implementation or specification.
- [x] No unresolved decision blocks specification.
- [x] Consolidation into one spec was explicitly approved.
