# Task: Validate reproducible model and effort compatibility

- **Task Number**: 004
- **Slug**: reasoning-effort-model-profiles-capability
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Evidence-backed capability and pair-bound acknowledgement jointly determine whether an assignment may be saved, selected, or projected.

## Intent

Accept supported efforts and explicitly acknowledged unknown pairs while rejecting malformed or known unsupported combinations consistently.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), provider capability; P4. Issue #29 is related discovery work, not a prerequisite. Runtime-version diagnostics are activated in 011.

## In Scope

- Narrow capability port with a versioned, evidence-backed provider/model/transport adapter and evidence provenance.
- Supported values, known unsupported, and unknown results, distinct from model availability.
- Exact resolved-pair acknowledgement for `--allow-unknown-effort`, separate from model-ID allowance.
- Consistent pre-mutation/pre-projection validation; parent changes revalidate affected children.

## Out of Scope

- General registry redesign, substring inference, universal effort enumeration/budget conversion, CLI/TUI flag/editor wiring.

## Capability Areas

Capability evidence and validation.

## Dependencies

- **Requires**: 003
- **Enables**: 005

## Acceptance Criteria

- [ ] Supported values carry provider/model/transport evidence; availability listings alone never count as capability evidence.
- [ ] Malformed/known unsupported effort fails with model-specific feedback and cannot be bypassed by either unknown flag.
- [ ] Unknown/custom pairs require explicit acknowledgement persisted against the exact resolved model/effort; changed pairs invalidate it.
- [ ] Runtime-default model plus effort is unknown unless a compatible concrete runtime model is established; legacy model-only custom workflows remain available.
- [ ] Save/switch/projection share validation semantics; invalid edits/switches preserve profile, active selection, and host state, including affected inheriting children.
- [ ] Focused evidence/validation tests and limitations docs ship together; verified adapter coverage is not inferred from the later runtime proof task.
- [ ] The complete validation API remains outside live effort controls until projection activation in P8; legacy model-only CLI/TUI/install/update workflows retain their behavior at this prefix.

## Open Decisions

None. Exact evidence entries are technical verification work, not a new provider-support promise.

## Parallelization

Specify/plan with 003; coordinate runtime evidence scenarios with 011 early without making 004 depend on 011.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-capability/`. P4 in Stacked PRs to main; user-authorized 2026-10-28 cohesive >400 size exception (P4-only; original 56-line task preserved in adjacent `004-reasoning-effort-model-profiles-capability-old-20261028-size.md`): forecast 1150–1350 lines including implementation/tests/docs is a forecast, not a cap, with no cuts to fit a number; initial planning artifacts budgeted separately. The size exception authorizes volume only, not implementation, commits, publication, or merges. The approved scope still excludes Effect/new dependencies, copied executable upstream schema, provider/network tests, and manifest/lock changes; task 006 public proof and task 011 matrix are unchanged. Start: resolved pairs; end: complete reproducible validation API; next: P5. Rollback removes dependent consumers first; never reinterpret accepted unknown metadata as universal permission. Every PR remains independently safe in order; the strict <400 additions + deletions rule still governs deliveries without their own explicit exception, and per-PR gates are in PROJECT-TASKS.md.
