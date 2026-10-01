# Task: Edit and inspect effort through the CLI

- **Task Number**: 009
- **Slug**: reasoning-effort-model-profiles-cli
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Atomic edit grammar and truthful inspection expose one capability across existing and new commands while keeping model-only compatibility.

## Intent

Let CLI users explicitly set/clear per-agent effort and distinguish saved profile intent from projected and request-effective behavior.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), CLI contract; P9. The debate's proposed grammar is a downstream specification input, not released syntax on this base.

## In Scope

- Existing models set with optional reasoning-effort, effort set/clear, and profile inspection.
- Distinct unknown-model and unknown-effort allowances, atomic combined edits, explicit reapplication after ownership conflict.
- Configured/profile-resolved model and effort with separate sources, capability, projection status, and unmanaged host information.
- CLI help and README examples matching actual delivered behavior.

## Out of Scope

- TUI editing, general model picker, effort inheritance/defaults, or promises of final request-effective values.

## Capability Areas

CLI model-profile UX.

## Dependencies

- **Requires**: 008
- **Enables**: 010

## Acceptance Criteria

- [ ] Legacy models set syntax works; omission of effort preserves it; combined model/effort validates and saves once; conflicting set/clear intent is rejected.
- [ ] Effort set and clear preserve model semantics, apply capability rules, and support pair-scoped explicit unknown acknowledgement distinct from --allow-unknown.
- [ ] Rejected edits leave profile and host unchanged, including inherited children; explicit reapply can renew owned effort after a reported external edit.
- [ ] Show separates configured/resolved/source for model and effort, labels no-override correctly, and exposes capability/projection status without claiming final request effectiveness.
- [ ] Host-only effort is unmanaged information; inactive inspection/editing does not switch or refresh the active host.
- [ ] Help/examples and focused command tests ship together, including saved-but-projection-failed output and reload expectations.
- [ ] Every exposed effort command uses P8's already complete active projection on both platforms; no incomplete path or deferred activation is exposed to users.

## Open Decisions

None. Exact parser details are autonomous downstream technical choices constrained by the proposed debate syntax and compatibility.

## Parallelization

Specify/plan with 010 for shared semantics; CLI and TUI require separate behavior PRs under the forecast.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-cli/`. P9 in Stacked PRs to main; forecast 250–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: complete active cross-platform projection; end: supported CLI effort UX; next: P10. Rollback removes dependent UI first and withdraws commands/help together, preserving saved data. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
