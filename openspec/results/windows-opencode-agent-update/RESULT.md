# Windows OpenCode Agent Update Result

## Source

`openspec/plans/windows-opencode-agent-update/PLAN.md`

## Changes

- Made PowerShell initialization and update respect `XDG_CONFIG_HOME` before falling back to `$HOME/.config`.
- Updated the PowerShell marker and verification lists to current `afergon-ai` and `afg-*` managed names.
- Kept `orchestrator.md` as an update-only legacy marker.
- Changed the skipped update message to identify missing afergon-ai-managed agents rather than claiming OpenCode itself is absent.
- Added Windows-only regression coverage, including the emitted runtime via `bin/afergon-ai.cmd update`.

## Evidence

| Item | Status | Evidence |
| --- | --- | --- |
| Focused Windows tests | produced | `pnpm build; pnpm exec vitest run tests/windows-opencode-scripts.test.ts --no-file-parallelism` - 3 passed |
| Type checking | produced | `pnpm typecheck` passed |
| Build | produced | `pnpm build` passed |
| Diff validation | produced | `git diff --check` passed |
| Full test suite | outstanding | `pnpm test` ran 300 passing, 20 skipped, and failed one unrelated existing TUI expectation in `tests/tui-model-profiles.test.ts:1463` (`assignments` received, `browse` expected). The focused rerun failed identically. |
| Review | produced | Focused review found no findings in the task-owned changes. |
