# Agent Permissions — Task Breakdown

## Project Overview

- **Project**: afergon-ai
- **Description**: A development harness that coordinates controlled software delivery across Pi, Claude Code, and OpenCode.
- **Technical Direction**: Keep OpenCode agent frontmatter and the registrar-generated `opencode.json` entries aligned, with automated coverage of the generated permission policy.
- **Constraints**: This breakdown does not modify source or configuration. The future implementation is limited to the two named agent permission definitions, their registrar representation, and relevant tests; it must be completed in an isolated worktree and address issue #67.

## Dependency Tree

```text
01 Add registrar permission-policy contract coverage
└── 02 Synchronize managed agent permission policies
```

## Ordered Tasks

1. **001-add-registrar-permission-policy-contract-coverage** — Add executable registrar-output coverage for the approved `afg-debate` and `afergon-ai` policies. **Breadth**: medium.
2. **002-synchronize-managed-agent-permission-policies** — Align the two agent declarations and registrar manifest with the approved permission matrix. **Breadth**: medium.

## Validation Status

- [x] Each task has one dominant intent and observable acceptance criteria.
- [x] The tasks cover source declarations, registrar parity, and registrar-output testing from the debate summary.
- [x] Dependencies are bidirectional and acyclic.
- [x] Breadth hints are assigned and justified.
- [x] No unresolved decisions from the debate summary block specification.
