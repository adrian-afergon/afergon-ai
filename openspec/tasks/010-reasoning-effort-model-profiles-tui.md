# Task: Stage explicit effort edits in the TUI

- **Task Number**: 010
- **Slug**: reasoning-effort-model-profiles-tui
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Editor selection, deep-cloned staging, validation, and status display comprise one user interaction; the revised 350-line upper forecast still demands a Plan budget check.

## Intent

Provide explicit, cancellable TUI effort editing that preserves current profile values and inactive-profile isolation.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), TUI contract; P10. Existing assignment mode supports model entry and staged save/discard; extend it without a general registry picker.

## In Scope

- Distinct effort editor with No Afergon override, supported choices, and explicit unknown/custom acknowledgement.
- Current-value preselection, including unrecognized saved effort, and separate model/effort inspection.
- S save, Esc discard, independent staged copies, model-change revalidation, text errors and pending-refresh status.

## Out of Scope

- General provider-model registry, silent effort default/clearing, host seeding of manual effort, or live-session update guarantees.

## Capability Areas

TUI assignment editing and inspection.

## Dependencies

- **Requires**: 009
- **Enables**: 011

## Acceptance Criteria

- [ ] Opening the editor preselects current effort, including unrecognized saved values, and never selects the first effort as an implicit default.
- [ ] No Afergon override clears only profile effort intent; supported choices and explicitly acknowledged custom unknown pairs follow shared validation.
- [ ] S saves deep-cloned staged changes; Esc leaves saved/host state unchanged; editing inactive profiles never refreshes active host state.
- [ ] Model edits preserve staged effort and revalidate affected pairs/children; invalid saves do not mutate profile or host.
- [ ] Inspection separates configured/profile-resolved values and sources; text reports capability errors, unmanaged host effort, and saved-but-pending projection without claiming final request effectiveness.
- [ ] Controller/screen interaction tests and keyboard/help guidance ship with the editor behavior.
- [ ] Effort editing is backed by the complete active projection delivered in P8; P11 is additive diagnostics, not a prerequisite for safe editor use.

## Open Decisions

None.

## Parallelization

Specify/plan with 009; prepare interaction scenarios together, retaining separate CLI and TUI review units.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-tui/`. P10 in Stacked PRs to main; forecast 280–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: shared CLI-visible semantics; end: complete staged TUI effort UX; next: P11. Rollback removes dependent diagnostic integration as needed, then editor/status changes with guidance while preserving profiles. If Plan cannot retain sub-400 headroom, split by complete observable interaction with tests/docs. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
