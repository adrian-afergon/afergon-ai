# Task: Repair effective managed agent permissions

- **Task Number**: 001
- **Slug**: repair-effective-agent-permissions
- **Spec Breadth Hint**: broad
- **Spec Breadth Rationale**: Agent frontmatter, registrar MANIFEST parity, and registrar-output coverage are three coupled representations of one effective permission contract. The user explicitly approved one atomic specification because none of the parts independently proves the complete repair.

## Intent

Repair the effective OpenCode permissions for `afg-debate` and `afergon-ai`, keep their declarations and registrar MANIFEST entries equivalent, and protect that equivalence with registrar-output tests.

## Context

OpenCode agent frontmatter is copied into the managed agents directory, while `scripts/register-opencode-agents.sh` separately projects MANIFEST permissions into `opencode.json`. The repair is complete only when both sources agree and an isolated registrar test verifies the persisted policy.

## In Scope

- Update `adapters/opencode/agents/afg-debate.md` to allow reading while retaining denied core operations and its bounded debate-summary write exception.
- Update `adapters/opencode/agents/afergon-ai.md` to allow `bash`, `edit`, `glob`, `grep`, `read`, and `write`, while denying `webfetch`.
- Mirror both complete policies in the `MANIFEST` within `scripts/register-opencode-agents.sh`.
- Extend the existing registrar suite to run the managed registration flow in an isolated OpenCode configuration and assert the persisted permission objects.
- Preserve existing prevention of partial registry updates.

## Out of Scope

- Changing prompts, models, descriptions, modes, temperatures, installer flow, model-profile behavior, or conflict handling.
- Changing permissions for any agent other than `afg-debate` and `afergon-ai`.
- Enabling web access for either named agent.

## Dependencies

- **Requires**: None
- **Enables**: None

## Acceptance Criteria

- [x] `afg-debate` frontmatter allows `read`, denies `bash`, `edit`, `glob`, `grep`, and `webfetch`, denies other writes by default, and allows writes only matching `openspec/debate/debate-summary*.md`.
- [x] `afergon-ai` frontmatter allows `bash`, `edit`, `glob`, `grep`, `read`, and `write`, and denies `webfetch`.
- [x] The registrar MANIFEST contains complete permission objects equivalent to both named agent declarations.
- [x] A focused automated test executes the registrar with all required managed files in an isolated configuration and inspects the resulting `opencode.json`.
- [x] The focused contract detects any added, removed, or changed permission in either named policy and passes with the approved policies.
- [x] Existing partial-registration safeguards and policies for all other agents remain unchanged.

## Open Decisions

None.

## Parallelization

None; declaration, MANIFEST, and executable output coverage form one atomic effective-policy repair.

## Notes

Reuse PR #70 later for implementation delivery. This task artifact does not authorize changing that PR during specification.
