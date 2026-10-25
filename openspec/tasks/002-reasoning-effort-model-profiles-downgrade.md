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

- Explicit model-only export and an additional complete CURRENT extended-state backup, each separate from the active source, the pre-migration snapshot, and each other.
- Callable internal export API and recovery guidance, without a new CLI command or an automatic/callable restore API.
- Current-data export versus pre-migration snapshot recovery, with documented loss boundaries.
- Refusal of absent, unreadable/corrupt, or future-unsupported sources instead of exporting defaults.
- Downgrade guidance requiring new-binary owned-effort cleanup before an old registrar runs; task 006 supplies the host-side behavior.

## Out of Scope

- Making old writers safe, inventing effort support in legacy format, implementing host ownership cleanup here, and automatic/callable restoration.

## Capability Areas

Downgrade and profile recovery.

## Dependencies

- **Requires**: 001
- **Enables**: 006

## Acceptance Criteria

- [ ] Explicit export produces legacy-readable model-only assignments while retaining model inheritance semantics.
- [ ] Export warns that effort and other assignment metadata unrepresentable by the legacy format are omitted; original and raw current backup retain all data.
- [ ] Export refuses absent, unreadable/corrupt, or unsupported-future sources without exporting defaults or creating outputs.
- [ ] Success requires both the current full backup and model-only export to complete; failures report partial completion honestly.
- [ ] Source, pre-migration snapshot, and existing files remain intact, including destination collisions.
- [ ] Export failures leave the extended source intact; current edits survive current-data export.
- [ ] Recovery guidance distinguishes current export from older snapshot restoration and warns that old registrars may lose manual host options.
- [ ] Documentation links required owned-host cleanup to 006's callable service and 008's live routing; internal export is usable now without claiming live downgrade integration is released.
- [ ] Export/recovery tests and API guidance belong to this unit; existing entrypoints retain legacy behavior and produce no new live host effects.

## Open Decisions

None.

## Parallelization

Specify/plan with 001; after 001, this task and 003 have no behavioral dependency on each other.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-downgrade/`. P2 follows P1 in the existing stacked chain; next: P3. No live effort control or host activation occurs here. Rollback withdraws export and dependent integration while preserving saved copies. Per-PR verification and suffix rollback rules remain in PROJECT-TASKS.md.

Approved amendments: the human chose an additional current-state backup, authorized a fresh P2-only cohesive size exception above400 (no new numeric ceiling), and confirmed the export/recovery contract. The historical180–260 forecast and P2's original<400 constraint are superseded;775–900 is a later forecast, not a cap. Include tests/docs/results/native verification without cuts. These decisions do not authorize implementation, commits, publication, or merging. Exact original task/spec contents are preserved in their adjacent `-old-20261025-194903.md` files. Functional closure recorded2026-10-25.
