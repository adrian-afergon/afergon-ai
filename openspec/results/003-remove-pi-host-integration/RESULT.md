## Implementation Status

completed-with-notes

## Plan Reference

- Plan: `/Users/mcabsan/dev/myugen/afergon-ai-phase2/openspec/plans/003-remove-pi-host-integration/PLAN.md`
- Execution Mode: sequential

## Execution Summary

Executed all four commit units of the ready-with-assumptions plan in the isolated phase2 worktree. Removed Pi host package distribution, rewrote POSIX/PowerShell installers to be OpenCode-only, simplified the TUI Configuration/Status surface to a direct OpenCode init action, and updated active README/detect-skills guidance. All verification commands pass; the package archive contains no Pi-only artifacts; retired flags reject before side effects.

## Completed Steps

- 1.1 RED: Add package archive validation test
- 1.2 GREEN: Edit `package.json`
- 1.3 GREEN: Delete `extensions/startup-banner.ts` and the `extensions/` directory
- 1.4 GREEN: Delete `prompts/afergon-ai.md` and the `prompts/` directory
- 1.5 GREEN: Delete `.pi/APPEND_SYSTEM.md`, `.pi/settings.json`, and the `.pi/` directory
- 1.6 GREEN: Edit `scripts/build-typescript.ts`
- 1.7 GREEN: Remove `tests/startup-banner.test.ts`
- 1.8 GREEN: Update `tests/tui-docs.test.ts`
- 1.9 GREEN: Update `tests/init-retire-claude.test.ts`
- 1.10 TRIANGULATE: Add edge-case test assertions
- 1.11 VERIFY: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- 1.12 COMMIT: `feat(package)!: remove Pi host package distribution`
- 2.1 RED: Add/extend tests in `tests/init-retire-pi.test.ts`
- 2.2 RED: Add equivalent PowerShell tests
- 2.3 GREEN: Rewrite `scripts/init-project.sh`
- 2.4 GREEN: Rewrite `scripts/init-project.ps1`
- 2.5 GREEN: Rewrite `scripts/update.sh`
- 2.6 GREEN: Rewrite `scripts/update.ps1`
- 2.7 GREEN: Update `scripts/lib/cli-dispatch-core.ts`
- 2.8 GREEN: Update `bin/afergon-ai`
- 2.9 TRIANGULATE: Add adversarial test cases
- 2.10 VERIFY: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- 2.11 COMMIT: `feat(installer)!: make init and update OpenCode-only, retire --pi and --all`
- 3.1 RED: Update `tests/tui-configuration.test.ts`
- 3.2 RED: Update `tests/tui-status.test.ts`
- 3.3 GREEN: Edit `scripts/lib/tui/config-status-adapter.ts`
- 3.4 GREEN: Verify non-interactive TUI rejection remains intact
- 3.5 TRIANGULATE: Add edge-case test
- 3.6 GREEN: Update `tests/tui-configuration.test.ts`
- 3.7 GREEN: Update `tests/tui-status.test.ts`
- 3.8 GREEN: Update `tests/tui-actions.test.ts`
- 3.9 VERIFY: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- 3.10 COMMIT: `feat(tui): remove Pi from Configuration/Status, direct OpenCode init`
- 4.1 RED: Update `tests/tui-docs.test.ts`
- 4.2 GREEN: Edit `README.md`
- 4.3 GREEN: Edit `skills/detect-skills/SKILL.md`
- 4.4 GREEN: Update `tests/tui-docs.test.ts`
- 4.5 VERIFY: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- 4.6 COMMIT: `docs: update active guidance for OpenCode-only host support`

## Updated Plan Artifacts

- `openspec/plans/003-remove-pi-host-integration/PLAN.md`

## Commits Created

- `508f2f6` docs(openspec): add task, specs, and plan for Pi host removal
- `bc68f3c` feat(package)!: remove Pi host package distribution
- `b989b27` feat(installer)!: make init and update OpenCode-only, retire --pi and --all
- `59ff72b` feat(tui): remove Pi from Configuration/Status, direct OpenCode init
- `d3604be` docs: update active guidance for OpenCode-only host support
- `72db322` docs(plan): mark all Pi-removal execution units complete

## Files Changed

- `.pi/APPEND_SYSTEM.md` (deleted)
- `.pi/settings.json` (deleted)
- `README.md`
- `bin/afergon-ai`
- `extensions/startup-banner.ts` (deleted)
- `openspec/plans/003-remove-pi-host-integration/PLAN.md`
- `openspec/specs/003-remove-pi-host-integration/spec-01-package-distribution.md`
- `openspec/specs/003-remove-pi-host-integration/spec-02-opencode-only-installers.md`
- `openspec/specs/003-remove-pi-host-integration/spec-03-tui-opencode-host-surface.md`
- `openspec/specs/003-remove-pi-host-integration/spec-04-active-documentation.md`
- `openspec/tasks/003-remove-pi-host-integration.md`
- `package.json`
- `pnpm-lock.yaml`
- `prompts/afergon-ai.md` (deleted)
- `scripts/build-typescript.ts`
- `scripts/init-project.ps1`
- `scripts/init-project.sh`
- `scripts/lib/cli-dispatch-core.ts`
- `scripts/lib/tui/config-status-adapter.ts`
- `scripts/update.ps1`
- `scripts/update.sh`
- `skills/detect-skills/SKILL.md`
- `tests/init-retire-claude.test.ts`
- `tests/init-retire-pi.test.ts` (new)
- `tests/package-archive.test.ts` (new)
- `tests/startup-banner.test.ts` (deleted)
- `tests/tui-actions.test.ts`
- `tests/tui-branding.test.ts`
- `tests/tui-configuration.test.ts`
- `tests/tui-docs.test.ts`
- `tests/tui-shell.test.ts`
- `tests/tui-status.test.ts`

## Verification Results

- Step-level checks:
  - Unit 1 `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`: passed
  - Unit 2 `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`: passed
  - Unit 3 `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`: passed
  - Unit 4 `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`: passed
- Final checks:
  - Tests: passed (`pnpm test` → 22 passed / 3 skipped test files, 335 passed / 15 skipped tests)
  - Build: passed (`pnpm build`)
  - Additional Evidence:
    - `pnpm run health:runtime`: passed
    - `pnpm typecheck`: passed
    - Package archive check: passed (`pnpm pack --dry-run` contains no `extensions/`, `prompts/`, or `.pi/` entries; `tests/package-archive.test.ts` enforces this)
    - POSIX init retirement: passed (`bash scripts/init-project.sh --pi` exits 1 with `Error: --pi is retired. Supported host: --opencode.`)
    - POSIX init default: passed (`bash scripts/init-project.sh` in a temp dir creates `opencode.json`, `openspec/config.yaml`, and managed OpenCode agents; no `.pi/` directory is created)
    - PowerShell init retirement: covered by gated tests in `tests/init-retire-pi.test.ts` (platform-specific, skipped on non-Windows)

## Blockers or Deviations

- None

## Notes

- `@earendil-works/pi-tui` remains declared in `peerDependencies` as specified by the plan. The task text describes it as a "direct runtime dependency" but the plan's acceptance criteria explicitly keep it as a peerDependency; implementation followed the plan.
- The pre-existing `verify-install.sh` legacy agent-name mismatch noted in the plan's risks was not touched because it is out of scope.
- Historical OpenSpec records and model identifiers containing `pi`/`claude` were preserved, verified by `tests/package-archive.test.ts` and `tests/tui-docs.test.ts`.

## Next Step

Hand off to the `afergon-review` agent for post-implementation review and verification of the result artifact.
