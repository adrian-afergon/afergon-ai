# Task: Synchronize managed agent permission policies

- **Task Number**: 002
- **Slug**: synchronize-managed-agent-permission-policies
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: The change must consistently update two agent declarations and the registrar manifest while satisfying the executable output contract.

## Intent

Align the declared and registered permissions for `afg-debate` and `afergon-ai` so OpenCode grants each agent its approved tool access.

## Context

Agent frontmatter is copied to the OpenCode agents directory, but the registrar separately projects permissions into `opencode.json`; both representations must match to fix issue #67.

## In Scope

- Update `adapters/opencode/agents/afg-debate.md` so its core operations are read-only.
- Update `adapters/opencode/agents/afergon-ai.md` to allow `bash`, `edit`, `read`, `write`, `glob`, and `grep`, while denying `webfetch`.
- Mirror both approved policies in the `MANIFEST` within `scripts/register-opencode-agents.sh`.
- Make the Task 001 registrar-output contract pass.

## Out of Scope

- Changing prompts, models, descriptions, modes, or permissions for other agents.
- Changing installer flow, model-profile behavior, or OpenCode conflict handling.
- Web access enablement for either named agent.

## Dependencies

- **Requires**: 001-add-registrar-permission-policy-contract-coverage
- **Enables**: None

## Acceptance Criteria

- [ ] `afg-debate` declares read access and continues to deny its other core operations as specified by the approved policy.
- [ ] `afergon-ai` declares allow access for `bash`, `edit`, `read`, `write`, `glob`, and `grep`, and deny access for `webfetch`.
- [ ] The registrar emits permission policies equivalent to both agent declarations.
- [ ] The focused registrar permission-policy contract passes.

## Open Decisions

None.

## Parallelization

None; implementation follows the executable contract in Task 001.

## Notes

Perform the future implementation in an isolated worktree because the main worktree is dirty. Keep the change limited to the named agent definitions, registrar, and relevant tests.
