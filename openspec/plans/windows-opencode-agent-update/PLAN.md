# Windows OpenCode Agent Update Plan

## Source

User report: `afergon-ai.cmd` reports OpenCode as not installed while the `opencode` executable is available.

## Git State

- Base: `main` at `9d2d759`, aligned with `origin/main` (`0` behind, `0` ahead before this work).
- Isolation: branch `fix/windows-opencode-agent-update` reuses the current worktree safely.
- Staged state: none.
- Unstaged state to preserve: `.pi/APPEND_SYSTEM.md` and `package.json` are user-owned and must remain untouched.
- Untracked state: none.
- Task-owned paths: `scripts/init-project.ps1`, `scripts/update.ps1`, `scripts/verify-install.ps1`, focused Windows tests, and this plan/result pair.

## Plan

1. Make the PowerShell scripts use the same XDG-aware OpenCode configuration root and current managed agent names as the POSIX flow.
2. Retain recognition of the legacy `orchestrator.md` marker only for updating already-managed legacy installations.
3. Add Windows-only integration coverage for initialization, update detection, and verification of current managed agent names.
4. Build the emitted runtime and run focused plus relevant full validation.

## Evidence

- Tests: produced by `tests/windows-opencode-scripts.test.ts`; full-suite status recorded in the linked result.
- Review: outstanding.
- Multi-tool validation: `pnpm build`, `pnpm typecheck`, focused Windows suite, and `git diff --check` produced.
