# Task: Export model-only profiles safely for downgrade

- **Task Number**: 002
- **Slug**: reasoning-effort-model-profiles-downgrade
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Export, backup retention, and honest recovery guidance jointly protect users from incompatible old writers.

## Intent

Provide explicit model-only downgrade preparation without destroying the full extended profile state.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), migration/downgrade; P2. Older binaries accept version numbers but cannot safely preserve extended assignments.

## In Scope

- Explicit model-only export to a separate location and retained full extended backup.
- Complete internal export/recovery API, directly callable for verification without a new CLI command.
- Current-data export versus pre-migration snapshot recovery, with documented loss boundaries.
- Downgrade guidance requiring new-binary owned-effort cleanup before an old registrar runs; task 006 supplies the host-side behavior.

## Out of Scope

- Making old writers safe, inventing effort support in legacy format, and implementing host ownership cleanup here.

## Capability Areas

Downgrade and profile recovery.

## Dependencies

- **Requires**: 001
- **Enables**: 006

## Acceptance Criteria

- [ ] Explicit export produces legacy-readable model-only assignments while retaining model inheritance semantics.
- [ ] Export warns that effort cannot be represented and does not overwrite the only extended source/backup, including destination collisions.
- [ ] Export failures leave the extended source intact; current edits survive current-data export.
- [ ] Recovery guidance distinguishes current export from older snapshot restoration and warns that old registrars may lose manual host options.
- [ ] Documentation links required owned-host cleanup to 006's callable service and 008's live routing; internal export is usable now without claiming live downgrade integration is released.
- [ ] Export/recovery tests and API guidance belong to this unit; existing entrypoints retain legacy behavior and produce no new live host effects.

## Open Decisions

None.

## Parallelization

Specify/plan with 001; after 001, this task and 003 have no behavioral dependency on each other.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-downgrade/`. P2 in Stacked PRs to main; forecast 180–260 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: P1 mixed storage; end: complete internal export/recovery; next: P3. No live effort control or host activation occurs here. Rollback withdraws export and dependent integration while preserving saved copies. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates and suffix rollback are in PROJECT-TASKS.md.
