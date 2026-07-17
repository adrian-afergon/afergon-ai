# Task: Add registrar permission-policy contract coverage

- **Task Number**: 001
- **Slug**: add-registrar-permission-policy-contract-coverage
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: The contract must exercise the filesystem-backed registrar output and assert distinct permission matrices for two managed agents.

## Intent

Add a failing registrar-output contract so the approved agent permissions are protected against future frontmatter/manifest drift.

## Context

The registrar independently defines managed OpenCode permissions, so checking only the agent Markdown files would not prove the installed `opencode.json` policy.

## In Scope

- Extend relevant registrar tests to execute `scripts/register-opencode-agents.sh` with managed agent files in an isolated temporary OpenCode configuration.
- Assert the generated policies give `afg-debate` read access while preserving its denied core operations.
- Assert the generated `afergon-ai` policy allows `bash`, `edit`, `read`, `write`, `glob`, and `grep`, and denies `webfetch`.

## Out of Scope

- Changing production agent definitions or registrar behavior.
- Testing permissions for agents other than `afg-debate` and `afergon-ai`.

## Dependencies

- **Requires**: None
- **Enables**: 002-synchronize-managed-agent-permission-policies

## Acceptance Criteria

- [ ] A registrar test executes the managed registration flow and inspects the resulting `opencode.json` agent permissions.
- [ ] The test fails against the pre-change registrar policy and asserts the approved `afg-debate` and `afergon-ai` permission matrices.
- [ ] The focused registrar test passes after Task 002 without weakening existing registrar behavior coverage.

## Open Decisions

None.

## Parallelization

None; this RED contract establishes the observable target for Task 002.

## Notes

Use the existing OpenCode registrar test suite and its temporary XDG configuration helpers; do not introduce a second registrar harness unless the existing one cannot express the contract.
