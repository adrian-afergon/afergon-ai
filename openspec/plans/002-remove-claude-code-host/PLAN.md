# Plan: Retire Claude Code host configuration

- **Source Task**: `002-remove-claude-code-host.md`
- **Source Spec(s)**:
  - `openspec/specs/002-remove-claude-code-host/spec-01-retire-claude-code-host.md`
- **State**: `ready`
- **Execution Mode**: `sequential`
- **Vertical Slicing**: `not-needed`

## Summary

This plan retires Claude Code from afergon-ai's active host configuration surfaces. It removes Claude from POSIX and PowerShell `init` and `update` scripts, adds explicit `--claude` rejection with a non-zero exit and actionable retirement message on both script surfaces, removes Claude from CLI help text, TUI configuration/status items, and TUI init checkbox form, deletes the Claude adapter artifact, and removes active README guidance. Pi, OpenCode, the standalone TUI, model identifiers, and user-owned Claude files are preserved.

## Planning Scope

**Included:**
- POSIX `init-project.sh`: remove Claude flag, setup block, interactive option; add `--claude` rejection
- PowerShell `init-project.ps1`: same changes for Windows parity
- POSIX `update.sh`: remove Claude update section
- PowerShell `update.ps1`: remove Claude update section
- CLI help (`scripts/lib/cli-dispatch-core.ts`): remove `[--claude]` from usage line
- TUI config-status adapter (`scripts/lib/tui/config-status-adapter.ts`): remove Claude from `SupportedInitId`, init form options, status items, and guidance
- Claude adapter deletion (`adapters/claude/`)
- README.md: remove Claude Code as a supported host from init flags, per-tool setup, skills, skill discovery, and memory sections
- Focused tests: retired flag rejection, remaining init argvs, TUI state, Windows script parity

**Excluded:**
- Pi, `@earendil-works/pi-tui`, standalone TUI removal
- OpenCode registration, update, or Windows parity changes
- Deletion of pre-existing user-owned `CLAUDE.md` or `.claude/` files
- Historical OpenSpec records
- Model identifiers such as `anthropic/claude-opus`
- `scripts/models.ts` and model-profiles infrastructure (no Claude host references)
- `scripts/verify-install.sh` and `scripts/verify-install.ps1` (no Claude references found)
- `prompts/afergon-ai.md` (no Claude references found)

## Design Rule Alignment

- **POSIX and PowerShell parity**: Both script surfaces must receive equivalent changes. The `--claude` rejection must exit non-zero with an actionable message on both.
- **Preserve human decisions and artifacts**: User-owned `CLAUDE.md` and `.claude/` files are never touched by init or update.
- **Artifact-appropriate evidence**: Focused tests prove retired flag behavior, remaining init argvs, TUI state, and Windows parity. Typecheck, build, runtime health, and full test suite must pass.
- **Govern new code**: No new architectural boundaries are introduced. Changes are removals and narrow modifications to existing surfaces.

## Assumptions

- The `--claude` rejection message will follow the pattern: `"Error: --claude is retired. Supported hosts: --pi, --opencode, --all."` and exit with code 1.
- The interactive tool selection menu will renumber from `1) Pi, 2) Claude Code, 3) OpenCode, 4) All` to `1) Pi, 2) OpenCode, 3) All`.
- The `--all` flag will set only `SETUP_PI=true` and `SETUP_OPENCODE=true` (no `SETUP_CLAUDE`).
- Tests using `"claude"` as a generic test fixture id (e.g., `tui-actions.test.ts` picker tests) are not Claude-host-specific and will remain unchanged unless they assert Claude-host-specific behavior.
- The `adapters/claude/` directory contains only `CLAUDE.md` and can be deleted entirely.

## Design Tensions

- None

## Vertical Slicing Decision

Vertical slicing is not needed. The task is a single coherent removal across tightly coupled surfaces (scripts, TUI adapter, help text, README, tests). Splitting would create intermediate states where some surfaces still reference Claude while others do not, increasing risk. A single sequential pass with commit units at logical boundaries is safer.

## Execution Strategy

**Sequential** execution is appropriate because:
1. Script changes (init/update) must be coordinated with adapter deletion — the scripts reference `adapters/claude/CLAUDE.md`.
2. TUI adapter changes must be coordinated with test updates — tests assert on the exact items returned by the adapter.
3. README changes are documentation-only and safe to include in the same pass.
4. A single sequential pass avoids intermediate broken states where scripts reference a deleted adapter or tests assert on removed items.

## Implementation Steps

### Commit Unit 1: Retire Claude from POSIX and PowerShell init/update scripts

- [x] **Step 1.1**: Edit `scripts/init-project.sh`:
  - Remove `SETUP_CLAUDE=false` variable declaration (line 37)
  - Remove `--claude) SETUP_CLAUDE=true ;;` from flag parsing (line 45)
  - Remove `SETUP_CLAUDE=true` from `--all` block (line 49)
  - Add `--claude` rejection before flag parsing loop: detect `--claude` in `$@`, print retirement message to stderr, exit 1
  - Update interactive menu: remove `2) Claude Code`, renumber `3) OpenCode` → `2) OpenCode`, `4) All` → `3) All`
  - Remove `2) SETUP_CLAUDE=true` and update `4)` → `3)` in interactive case block
  - Update no-flags guard: `! $SETUP_PI && ! $SETUP_CLAUDE && ! $SETUP_OPENCODE` → `! $SETUP_PI && ! $SETUP_OPENCODE`
  - Remove entire Claude Code setup block (lines 189–216)
  - Remove `$SETUP_CLAUDE && echo "  Claude    → CLAUDE.md + .claude/skills/"` summary line (line 307)
  - Update header comment to remove `--claude` from usage and flags list
- [x] **Step 1.2**: Edit `scripts/init-project.ps1`:
  - Remove `$SETUP_CLAUDE = $false` variable declaration (line 15)
  - Remove `'--claude'` case from flag switch (line 21)
  - Remove `$SETUP_CLAUDE = $true` from `--all` case (line 23)
  - Add `--claude` rejection: detect in `$Flags`, write retirement message to stderr, exit 1
  - Update interactive menu: remove `2) Claude Code`, renumber options
  - Remove `'2' { $SETUP_CLAUDE = $true }` and update `'4'` → `'3'` in interactive switch
  - Update no-flags guard to remove `$SETUP_CLAUDE`
  - Remove entire Claude Code setup block (lines 153–176)
  - Remove `if ($SETUP_CLAUDE)` summary line (line 227)
  - Update header comment to remove `--claude`
- [x] **Step 1.3**: Edit `scripts/update.sh`:
  - Remove entire Claude Code section (lines 69–86): `CLAUDE_MD` detection, copy, `.claude/skills` update
- [x] **Step 1.4**: Edit `scripts/update.ps1`:
  - Remove entire Claude Code section (lines 50–69): `$CLAUDE_MD` detection, copy, `$CLAUDE_SKILLS` update
- [x] **Step 1.5**: Write test for POSIX `init --claude` rejection:
  - Spawn `bash scripts/init-project.sh --claude` in a temp directory
  - Assert exit code is non-zero
  - Assert stderr contains retirement message mentioning `--claude` is retired and listing supported options
- [x] **Step 1.6**: Write test for PowerShell `init --claude` rejection:
  - Spawn `powershell.exe -File scripts/init-project.ps1 --claude` in a temp directory (runIf win32)
  - Assert exit code is non-zero
  - Assert stderr/stdout contains retirement message
- [x] **Step 1.7**: Write test for `init --all` not creating Claude artifacts:
  - Run `bash scripts/init-project.sh --all` with memory choice `4` (none) in a temp directory
  - Assert no `CLAUDE.md` is created
  - Assert no `.claude/skills/` directory is created
  - Assert Pi and OpenCode artifacts are created as expected
- [x] **Step 1.8**: Run `pnpm build && pnpm test` to verify script changes do not break existing tests

### Commit Unit 2: Remove Claude from CLI help and TUI surfaces

- [ ] **Step 2.1**: Edit `scripts/lib/cli-dispatch-core.ts`:
  - Change help text line 24 from `"  afergon-ai init [--pi] [--claude] [--opencode] [--all]"` to `"  afergon-ai init [--pi] [--opencode] [--all]"`
- [ ] **Step 2.2**: Edit `scripts/lib/tui/config-status-adapter.ts`:
  - Change `SupportedInitId` type from `"pi" | "claude" | "opencode" | "all"` to `"pi" | "opencode" | "all"`
  - Remove `id === "claude"` from the filter predicate in `buildInitCommandArgv` (line 156)
  - Remove `{ id: "claude", label: "Claude" }` from init form options (line 196)
  - Remove `case "claude":` from `addGuidance` switch (line 227)
  - Remove the Claude `getProjectInstallItem` call from `getBaseStatusItems` (lines 258–264)
- [ ] **Step 2.3**: Update `tests/tui-configuration.test.ts`:
  - Remove Claude from `selectedIds` in `buildArgv` tests (lines 114, 128–131)
  - Remove Claude status item assertions (lines 148, 170, 192, 285)
  - Remove Claude from init form checkbox assertions (lines 563, 585)
  - Update remaining assertions to expect only Pi, OpenCode, and model-config items
- [ ] **Step 2.4**: Update `tests/tui-status.test.ts`:
  - Remove Claude from `selectedIds` in `buildArgv` tests (line 119)
  - Remove Claude status item from test fixtures (lines 156, 302, 321–324, 345, 373–376, 506)
  - Remove `CLAUDE.md` file creation in test setup (line 190)
  - Remove Claude-specific assertions (lines 216, 223, 355, 393–394)
  - Update readiness summary assertions to reflect reduced item count
- [ ] **Step 2.5**: Update `tests/tui-shell.test.ts`:
  - Remove Claude from test fixture items (line 54)
  - Remove Claude from init form options (line 580)
- [ ] **Step 2.6**: Update `tests/tui-dispatch.test.ts`:
  - Update or replace the test that dispatches `init --claude` (lines 160–165) to use a remaining flag like `--pi` or `--opencode`
- [ ] **Step 2.7**: Run `pnpm typecheck` to verify TypeScript changes compile
- [ ] **Step 2.8**: Run `pnpm build && pnpm test` to verify all tests pass

### Commit Unit 3: Delete Claude adapter and update README

- [ ] **Step 3.1**: Delete `adapters/claude/` directory entirely (contains only `CLAUDE.md`)
- [ ] **Step 3.2**: Edit `README.md`:
  - Line 18: Change "It works with **Pi**, **Claude Code**, and **OpenCode**." to "It works with **Pi** and **OpenCode**."
  - Lines 90–91: Remove "Claude Code" from tool selection list; update to "Pi, OpenCode, or all"
  - Lines 95–99: Remove `afergon-ai init --claude` flag example
  - Line 175: Remove "Claude Code" from init checkbox description; update to "Pi, OpenCode, or all"
  - Lines 274–277: Remove entire "### Claude Code" per-tool setup section
  - Line 365: Remove "In Claude Code, load the skill file." from skills intro
  - Lines 367–376: Remove Claude Code column from skills table (keep Pi and OpenCode columns)
  - Line 378: Remove "Claude Code" from Agent Skills compatibility list
  - Line 390: Remove "Claude Code" from autoskills install path list
  - Line 417: Remove "Claude Code" from autoskills compatibility list
  - Line 432: Remove "in Claude Code requires Engram MCP" from memory table
- [ ] **Step 3.3**: Run `pnpm build && pnpm test` to verify no test references the deleted adapter path
- [ ] **Step 3.4**: Run `pnpm run health:runtime` to verify dist runtime entries import cleanly

### Commit Unit 4: Final verification

- [ ] **Step 4.1**: Run full verification suite (see Verification section below)
- [ ] **Step 4.2**: Manual smoke test: `./bin/afergon-ai --help` shows no `--claude` in init usage
- [ ] **Step 4.3**: Manual smoke test: `./bin/afergon-ai init --claude` exits non-zero with retirement message
- [ ] **Step 4.4**: Confirm no residual Claude references in production source (excluding model identifiers, historical OpenSpec records, and user-owned files)

## Interfaces and Technical Contracts

### `--claude` rejection contract (both scripts)

- **Input**: `--claude` as any positional argument to `init`
- **Behavior**: Print to stderr: `Error: --claude is retired. Supported hosts: --pi, --opencode, --all.`
- **Exit code**: 1 (non-zero)
- **Side effects**: None. No files created, no interactive prompts shown.

### `SupportedInitId` type (config-status-adapter.ts)

- **Before**: `"pi" | "claude" | "opencode" | "all"`
- **After**: `"pi" | "opencode" | "all"`

### Init form options (TUI checkbox form)

- **Before**: `[{ id: "pi", label: "Pi" }, { id: "claude", label: "Claude" }, { id: "opencode", label: "OpenCode" }, { id: "all", label: "All" }]`
- **After**: `[{ id: "pi", label: "Pi" }, { id: "opencode", label: "OpenCode" }, { id: "all", label: "All" }]`

### Status items (config-status-adapter.ts)

- **Before**: `[model-config, pi, claude, opencode]`
- **After**: `[model-config, pi, opencode]`

## Acceptance Criteria

- [ ] POSIX and PowerShell `init` expose only Pi, OpenCode, and all as configurable hosts
- [ ] `--claude` exits non-zero with an actionable retirement message on both POSIX and PowerShell script surfaces
- [ ] `--all` configures Pi and OpenCode without creating `CLAUDE.md` or `.claude/skills/` artifacts
- [ ] `--pi`, `--opencode`, and `--all` retain their respective Pi/OpenCode initialization behavior
- [ ] POSIX and PowerShell `update` no longer reference or mutate `CLAUDE.md` or `.claude/skills/` and retain Pi/OpenCode behavior
- [ ] CLI help text contains no `--claude` flag in init usage
- [ ] TUI Configuration and Status items contain no Claude host entry
- [ ] TUI init checkbox form contains no Claude option
- [ ] TUI remains usable for Configuration and Status actions with remaining hosts
- [ ] No Claude Code adapter artifact is present in the package source
- [ ] Active README guidance contains no Claude Code as a supported configuration host
- [ ] Focused tests prove retired flag rejection, remaining init argvs, TUI state, and Windows script parity
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm run health:runtime` passes
- [ ] `pnpm test` (complete test suite) passes

## Verification

- [ ] **Tests**: `pnpm test` — all existing and new tests pass, including:
  - New: POSIX `init --claude` exits non-zero with retirement message
  - New: PowerShell `init --claude` exits non-zero with retirement message (runIf win32)
  - New: `init --all` does not create Claude artifacts
  - Updated: TUI configuration tests expect no Claude item
  - Updated: TUI status tests expect no Claude item
  - Updated: TUI dispatch tests use remaining flags
  - Existing: Windows OpenCode scripts tests continue to pass
  - Existing: Model profiles tests continue to pass (model identifiers like `anthropic/claude-opus` are preserved)
- [ ] **Build**: `pnpm build` — TypeScript compilation succeeds, `dist/` is generated cleanly
- [ ] **Typecheck**: `pnpm typecheck` — TypeScript validation completes without errors
- [ ] **Runtime health**: `pnpm run health:runtime` — every local dist runtime entry imports; no remote telemetry
- [ ] **Additional Evidence**:
  - `./bin/afergon-ai --help` prints help without `--claude` in init usage and exits 0
  - `./bin/afergon-ai init --claude` exits non-zero with retirement message
  - `grep -r "claude" scripts/ adapters/ --include="*.sh" --include="*.ps1" --include="*.ts"` returns no active Claude host references (model identifiers and test fixtures excluded)
- [ ] **Rule Compliance**:
  - POSIX and PowerShell parity verified: both scripts reject `--claude` equivalently
  - No user-owned `CLAUDE.md` or `.claude/` files are modified or deleted
  - Historical OpenSpec records are untouched
  - Model identifiers like `anthropic/claude-opus` are preserved in model-profiles code and tests

## Open Questions

- None

## Dependencies

- Phase 0 Windows OpenCode CI commit `56023dc` on the parent branch (present on active branch `chore/opencode-only-01-remove-claude-host` at HEAD)

## Risks and Watchouts

- **Test fixture false positives**: Some tests in `tui-actions.test.ts` use `"claude"` as a generic picker option id or adapter label. These are not Claude-host-specific assertions and should remain unchanged unless they assert host-specific behavior. Verify each reference before modifying.
- **Adapter deletion timing**: The `adapters/claude/` directory must be deleted after script changes that remove references to `adapters/claude/CLAUDE.md`. If deleted before scripts are updated, `update.sh`/`update.ps1` would fail on the `cp` command for any project with an existing `CLAUDE.md`. Commit Unit 1 (scripts) must land before Commit Unit 3 (adapter deletion).
- **Interactive menu renumbering**: The interactive tool selection menu changes from 4 options to 3. Users who have muscle memory for `2` (Claude Code) will now select OpenCode. The retirement message on `--claude` mitigates this for flag-based usage, but interactive users may need a session to adjust.
- **README cross-references**: The README has Claude references scattered across multiple sections (intro, install, per-tool setup, skills, skill discovery, memory). A thorough grep after editing is needed to ensure no active guidance remains.
- **`package.json` files array**: The `"adapters/"` glob in `package.json` `files` array will naturally exclude the deleted `adapters/claude/` subdirectory. No `package.json` change is needed.

## Git-State Preservation and Disposition

### Current branch and base

- **Branch**: `chore/opencode-only-01-remove-claude-code-host`
- **HEAD**: `56023dc` (required dependency commit, present)
- **Base divergence**: Branch is on the required commit; no divergence from task dependency.

### Worktree topology

- Standard single-worktree layout at `/Users/mcabsan/dev/myugen/afergon-ai`

### Staged changes

- None. No staged changes to preserve or dispose.

### Unstaged changes

- None. No unstaged changes to preserve or dispose.

### Untracked paths

| Path | Disposition | Rationale |
|------|-------------|-----------|
| `.idea/` | **Preserve, do not stage** | IDE configuration, not task-owned |
| `opencode.json` | **Preserve, do not stage** | User-owned project config, not task-owned |
| `openspec/specs/002-remove-claude-code-host/` | **Preserve, do not stage** | Spec artifact for this task; staging is an orchestrator decision |
| `openspec/tasks/002-remove-claude-code-host.md` | **Preserve, do not stage** | Task artifact for this task; staging is an orchestrator decision |

### Branch reuse decision

- **Reuse current branch**: The branch `chore/opencode-only-01-remove-claude-code-host` is already named for this task and sits on the required dependency commit. No new branch or worktree is needed.

## Completion Condition

This plan is complete when:
1. All four commit units are executed in sequence.
2. All acceptance criteria checkboxes are checked.
3. All verification commands pass.
4. No residual Claude host references exist in production source (scripts, TUI adapter, CLI help, README, adapter directory).
5. Model identifiers, historical OpenSpec records, and user-owned Claude files remain untouched.
6. The implement agent has produced a result artifact at `openspec/results/002-remove-claude-code-host/RESULT.md`.
