# Task: Package shared projection for POSIX and native PowerShell

- **Task Number**: 007
- **Slug**: reasoning-effort-model-profiles-posix
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: One packaged callable entrypoint needs native execution, path/quoting, parity, and failure evidence on both platforms before live routing can safely change.

## Intent

Deliver a complete packaged projection entrypoint executable on POSIX and native PowerShell before changing live install/update/refresh routing.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), revised P7 distribution boundary. Keep the existing slug for traceability; its former POSIX-only activation scope becomes cross-platform packaging so each merged prefix is safe. Current CLI refresh remains on its legacy route until 008.

## In Scope

- Packaged compiled entrypoint exposing 006's complete shared projection on both platforms.
- Native POSIX/PowerShell execution, equivalent managed JSON, path/quoting and failure diagnostics.
- Direct invocation and retry evidence against isolated host fixtures without changing existing live routing.

## Out of Scope

- Live install/update/profile-refresh activation on either platform (008), CLI/TUI effort editors (009/010), or live-session hot swap.

## Capability Areas

Cross-platform distribution and callable projection parity.

## Dependencies

- **Requires**: 006
- **Enables**: 008

## Acceptance Criteria

- [ ] A built package contains and executes the compiled shared projection entrypoint on POSIX and native PowerShell without source TypeScript or a Bash requirement on Windows.
- [ ] Direct invocations against equivalent isolated host fixtures produce equivalent JSON, including effort, owned cleanup, repeated invocation and absent-effort compatibility.
- [ ] Native executions cover paths with spaces/quoting, missing runtime, invalid source/host and capability failures with actionable non-destructive diagnostics and idempotent retry.
- [ ] Existing install/update/CLI/TUI refresh routing and live host output remain unchanged; extended-state creation is not exposed through those workflows before P8.
- [ ] Native Windows execution evidence, POSIX integration tests and callable-entrypoint guidance ship with the implementation; skipped/text-only checks do not establish parity.

## Open Decisions

None.

## Parallelization

Specify/plan with 008; native platform scenarios may be designed independently, but packaging/parity must complete before live activation. Review and merge order stays P7 then P8.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-posix/`. P7 in Stacked PRs to main; forecast 250–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: P6 callable projection; end: packaged native parity with live routing unchanged; next: P8 activation. Rollback removes any dependent activation before withdrawing the entrypoint, preserving profiles/receipts. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
