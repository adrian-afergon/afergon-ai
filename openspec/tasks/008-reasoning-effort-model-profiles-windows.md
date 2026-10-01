# Task: Activate complete projection on POSIX and Windows

- **Task Number**: 008
- **Slug**: reasoning-effort-model-profiles-windows
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Both platform routes and profile lifecycle/recovery must switch together to a proven shared entrypoint; deletion and integration scope require a high-risk Plan budget check.

## Intent

Activate complete install/update/profile-refresh projection on both platforms with safe lifecycle cleanup and truthful saved-but-pending recovery.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), revised P8 activation boundary. Keep the existing slug for traceability; 007 now proves packaged native parity before this task switches both platforms' live routes. This is the first live activation of extended profile/projection behavior.

## In Scope

- POSIX and native PowerShell install/update plus CLI/TUI profile-refresh consumers routed through 007's packaged entrypoint.
- Complete extended-state lifecycle integration: save, clone, switch/reset/deletion, validation, model-only seeding and downgrade cleanup; no new effort editors.
- Separate persistence/projection outcomes, idempotent retry, and equivalent ownership/failure/path behavior on both platforms.
- Replacement of duplicated live registrar resolution while retaining manifest permissions and legacy absent-effort/model behavior.

## Out of Scope

- Bash workaround as Windows support, deferred parity, effort UI features, and unrelated installer changes.

## Capability Areas

Cross-platform activation, lifecycle and refresh recovery.

## Dependencies

- **Requires**: 007
- **Enables**: 009

## Acceptance Criteria

- [ ] POSIX and native PowerShell install/update and profile refresh execute the proven shared entrypoint; Windows has no Bash dependency and both platform routes activate in this unit.
- [ ] Equivalent fixtures produce equivalent managed JSON on POSIX and Windows, including independent effort and owned cleanup.
- [ ] Native execution covers paths with spaces/quoting, failed projection, invalid source/host, and saved-but-pending recovery without destructive fallback.
- [ ] Successful save followed by missing install, timeout or projection failure retains the profile and reports saved plus pending/failed projection; retry is idempotent and rejected validation leaves selection/profile/host unchanged.
- [ ] Active switch to effort-free/empty, clear and active/final deletion reconcile owned effort; valid null differs from corrupt/dangling source, inactive edits never refresh, and downgrade cleanup uses the new binary.
- [ ] Absent effort and legacy strings preserve model semantics; extended state is safe through existing save/clone/model-edit flows, and no new effort editors are exposed before 009/010.
- [ ] Packaged-route tests retain 007's execution/parity guarantees and prove permission preservation, model-only seeding and complete lifecycle behavior without waiting for P11.
- [ ] Windows CI records executed assertions rather than Linux-skipped or shell-text-only evidence; platform/install guidance ships with this behavior.

## Open Decisions

None. Native parity remains required; unavailable execution evidence is an acceptance blocker, not permission to defer Windows.

## Parallelization

Specify/plan with 007; this task behaviorally requires its completed packaged entrypoint and parity evidence. Both live platforms activate together in P8 before CLI/TUI effort exposure.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-windows/`. P8 in Stacked PRs to main; forecast 280–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: P7 packaged native parity; end: complete live cross-platform projection/lifecycle/retry; next: P9. Count removed registrar code in the budget. Rollback removes dependent editors first, cleans/restores owned effort with the new binary and preserves/exports extended backups before deactivation; never return an old writer to extended state. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
