# Task: Resolve effort independently through profile lifecycle

- **Task Number**: 003
- **Slug**: reasoning-effort-model-profiles-resolution
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Inheritance and lifecycle mutations share one desired-assignment meaning, including affected children and explicit reset intent.

## Intent

Keep effort local to each agent while preserving existing model inheritance across edits and profile lifecycle events.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), independent resolution/lifecycle; P3. Storage is supplied by 001; host reconciliation belongs to 005/006.

## In Scope

- Separate configured and profile-resolved model/effort values and sources.
- Model-only preservation, combined assignment mutation, clear, clone, switch, and deletion desired state.
- Identification of all pairs affected by a parent-model edit for validation in 004.
- Distinguish valid null/empty active state from missing, unreadable, corrupt, or dangling source state.

## Out of Scope

- Capability evidence/acknowledgement (004), host writes (006), and user-interface commands.

## Capability Areas

Assignment resolution and lifecycle intent.

## Dependencies

- **Requires**: 001
- **Enables**: 004

## Acceptance Criteria

- [ ] Agents sharing a model retain different explicit efforts; inherited/unset child models can have effort, and main-agent effort never flows into children.
- [ ] Legacy model resolution remains compatible; absent effort means no override rather than disabled reasoning.
- [ ] Model-only edits preserve effort; combined changes are one assignment operation and affected inheriting children are included for later validation.
- [ ] Clear leaves the model intact; switch to empty/effort-free and active/final deletion expose deliberate cleanup intent, including valid activeProfile null.
- [ ] Inactive deletion/editing does not request host refresh; existing profile-selection policy remains intact.
- [ ] Missing/corrupt/unreadable source and dangling active references cannot masquerade as reset; focused lifecycle/clone tests and semantics docs accompany the unit.
- [ ] Complete domain operations are callable and tested in isolation; live entrypoints retain legacy routing/output and cannot reach unfinished effort-dependent behavior before P8.

## Open Decisions

None.

## Parallelization

Specify/plan with 004; may prepare independently of 002 after 001's storage boundary is defined.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-resolution/`. P3 in Stacked PRs to main after P2 (behavioral prerequisite: 001); forecast 250–330 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: mixed assignments; end: complete isolated resolution/lifecycle capability; next: P4. Host cleanup preserves the legacy null-versus-empty model distinction. Rollback removes dependent consumers first without discarding stored effort. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
