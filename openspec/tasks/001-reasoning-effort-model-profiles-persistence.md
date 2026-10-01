# Task: Persist compatible per-agent effort assignments

- **Task Number**: 001
- **Slug**: reasoning-effort-model-profiles-persistence
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Mixed representation, strict recognized-field validation, foreign-field preservation, and migration safety form one bounded storage behavior.

## Intent

Persist explicit per-agent effort without silently discarding extended data or rewriting legacy model-only profiles.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), assignment representation and migration; P1. Current normalization accepts strings only. This is the storage prerequisite for the feature, not host activation.

## In Scope

- Legacy strings alongside structured optional model and reasoningEffort; no implicit effort default.
- Path-specific errors for malformed recognized fields; targeted preservation of unknown user data.
- New schema version on first extended persistence, recoverable pre-migration snapshot, and atomic saves.
- Deep-clone and metadata round-trip guarantees; documented migration and old-writer limitations.

## Out of Scope

- Downgrade export (002), resolution behavior (003), provider validation (004), and host/UI changes.

## Capability Areas

Profile storage compatibility and recoverability.

## Dependencies

- **Requires**: None
- **Enables**: 002, 003

## Acceptance Criteria

- [ ] Mixed strings/structured assignments round-trip; reads alone neither migrate nor convert strings.
- [ ] Optional structured model preserves implicit inheritance; omitted effort is no override; null, empty, and `inherit` effort fail visibly with the offending path.
- [ ] Recognized malformed data is not swallowed; unknown fields survive targeted edits; future-version/foreign-field fixtures have explicit safe outcomes.
- [ ] First extended write records the new version only with a recoverable pre-migration snapshot; backup, validation, or atomic-write failure preserves original data and prevents projection.
- [ ] Clones remain independent, including effort metadata, and focused tests/docs accompany this behavior.
- [ ] The complete storage API is directly testable, but live CLI/TUI/install/update entrypoints cannot create extended state or change host output; legacy workflow regression evidence accompanies P1.

## Open Decisions

None.

## Parallelization

Specify/plan with 002 for one storage/recovery narrative; 002 and 003 become independent behavioral tracks after this task.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-persistence/`. P1 in Stacked PRs to main; forecast 280–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: legacy string storage; end: complete inactive mixed-storage capability; next: P2. Extended writes stay outside live entrypoints until P8's complete activation. Every PR is independently safe in order and strictly <400 additions + deletions. Rollback preserves extended copies and removes any dependent suffix first; never deploy an old writer over extended data. See PROJECT-TASKS.md for per-PR gates and rollback discipline.
