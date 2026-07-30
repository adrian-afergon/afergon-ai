# Plan: Remove Pi host integration

- **Source Task**: 003-remove-pi-host-integration.md
- **Source Spec(s)**:
  - openspec/specs/003-remove-pi-host-integration/spec-01-package-distribution.md
  - openspec/specs/003-remove-pi-host-integration/spec-02-opencode-only-installers.md
  - openspec/specs/003-remove-pi-host-integration/spec-03-tui-opencode-host-surface.md
  - openspec/specs/003-remove-pi-host-integration/spec-04-active-documentation.md
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed

## Summary

Remove Pi as an afergon-ai configuration host and package host while preserving the standalone TUI and its direct `@earendil-works/pi-tui` dependency. The work is organized into four sequential commit units aligned with the four specs: (1) package distribution cleanup, (2) OpenCode-only installers, (3) TUI host surface simplification, and (4) active documentation update. Each commit unit follows strict TDD/TPP with RED→GREEN→TRIANGULATE→REFACTOR and includes POSIX/PowerShell parity tests where applicable.

## Planning Scope

**Included:**
- Removal of Pi manifest (`"pi"` key in package.json), Pi keywords, Pi description identity, `@earendil-works/pi-coding-agent` peer/dev dependency, Pi extension source (`extensions/`), Pi prompt asset (`prompts/`), and repository `.pi/` host state.
- Build script update to stop copying `prompts/` into dist.
- Package `files` array update to exclude `extensions/` and `prompts/`.
- POSIX and PowerShell init/update script rewrites: retire `--pi` and `--all` with side-effect-free errors, remove interactive host selection, make OpenCode the only init/update target, remove Pi update logic.
- CLI help text and launcher comment header updates.
- TUI config-status-adapter: remove Pi status item, remove Pi from init checkbox form, replace host-selection init action with direct `afergon-ai init` execution.
- Active README and detect-skills guidance updates.
- New and updated tests: package archive validation, init/update retirement (POSIX+PowerShell), TUI configuration/status without Pi, documentation contract.
- Preservation of: `@earendil-works/pi-tui` peerDependency, standalone TUI, OpenCode adapters, skills as package content, model identifiers, historical OpenSpec records, user-owned project files.

**Excluded:**
- Removing `@earendil-works/pi-tui` or rewriting the TUI onto another library.
- Deleting user-owned `.pi`, `CLAUDE.md`, or `.claude/` files in initialized projects.
- Rewriting historical `openspec/changes/**` evidence or model identifiers containing `pi`/`claude`.
- Adding Node engine constraints or changing the package version.
- Any changes to the prompts/afergon-ai.md orchestrator prompt content that is NOT the Pi extension asset (the file at `prompts/afergon-ai.md` is the Pi extension prompt asset and must be deleted; the orchestrator prompt concept lives only in historical context after this task).

## Design Rule Alignment

- **AGENTS.md**: Organize by product vertical; point dependencies inward; use interfaces for data structures and ports. This task removes host integration code, not domain boundaries — no structural violation.
- **AGENTS.md**: Preserve POSIX and PowerShell parity for installer changes. Both platforms are updated in each commit unit with equivalent tests.
- **AGENTS.md**: Require relevant tests for testable behavior. Each behavioral change has corresponding Vitest tests.
- **AGENTS.md**: Do not require pointless unit tests for Markdown-only changes; review remains required. Spec 04 (docs) relies on documentation contract tests, not unit tests per prose paragraph.
- **AGENTS.md**: Plan implementation against actual Git state. Current branch `chore/opencode-only-02-remove-pi-host` at `968aab6`, clean worktree, untracked files are only the openspec task/spec artifacts.

## Assumptions

- The `prompts/afergon-ai.md` file is exclusively a Pi extension prompt asset (loaded by Pi via the `"pi": { "prompts": ["./prompts"] }` manifest). Its content duplicates the orchestrator identity that now lives in OpenCode agent prompts under `adapters/opencode/agents/`. Deleting it does not remove any orchestrator capability from OpenCode.
- The `.pi/` directory at the repository root is repository-level Pi host state (APPEND_SYSTEM.md + settings.json), not a user-project artifact. It is safe to delete from the repo; user-owned `.pi/` directories in initialized projects are preserved by the update scripts (which will no longer read/write them).
- The `extensions/startup-banner.ts` file is a Pi extension that imports `ExtensionAPI` from `@earendil-works/pi-coding-agent`. It has no consumers after Pi host removal. The existing `tests/startup-banner.test.ts` will be removed with it.
- The `build-typescript.ts` `runtimeDirsToCopy` array currently includes `"prompts"`. After removing `prompts/`, this entry must be removed. The `"skills"` entry is retained because skills remain as OpenCode package content.
- The existing `tests/tui-docs.test.ts` references `prompts/afergon-ai.md` for the Pi prompt docs contract. After deletion, the prompt-specific assertions must be removed or replaced with OpenCode-agent-prompt assertions.
- The `verify-install.sh` script has a stale `expected_agents` array using legacy names (`orchestrator`, `debate`, etc.) instead of current `afergon-ai`/`afg-*` names. This is a pre-existing bug visible in the POSIX doctor script but NOT in scope for this task (the PowerShell version already uses correct names). Noted as a risk/watchout.

## Design Tensions

- None

## Vertical Slicing Decision

Vertical slicing is not applied. The four specs are sequential dependencies (package cleanup → installer rewrite → TUI surface update → docs update) and share tightly coupled state (e.g., the init checkbox form in the TUI adapter depends on the installer flag surface). Slicing would not reduce risk or enable parallel work; it would create artificial merge conflicts in shared test files.

## Execution Strategy

**Sequential** execution is appropriate because:
1. Commit 1 (package distribution) removes the Pi manifest, extension, prompt, and coding-agent dependency — this is the foundation that makes the package OpenCode-only at the distribution level.
2. Commit 2 (installers) rewrites init/update scripts — this depends on Commit 1 because the init scripts reference `prompts/afergon-ai.md` for Pi setup, which no longer exists.
3. Commit 3 (TUI surface) updates the config-status adapter — this depends on Commit 2 because the init action form and status items reference Pi host state.
4. Commit 4 (documentation) updates README and detect-skills — this depends on all prior commits because docs must reflect the final state.

Each commit unit is independently buildable and testable (`pnpm typecheck && pnpm build && pnpm test`).

## Implementation Steps

### Commit Unit 1: Remove Pi host package distribution (Spec 01)

- [ ] **1.1 RED**: Add package archive validation test that asserts:
  - `package.json` has no `"pi"` key
  - `package.json` keywords do not include `"pi-package"`, `"pi"`, or `"pi-coding-agent"`
  - `package.json` description does not contain `"Pi-native"`
  - `package.json` has no `@earendil-works/pi-coding-agent` in peerDependencies or devDependencies
  - `package.json` `files` array does not include `"extensions/"` or `"prompts/"`
  - `package.json` retains `@earendil-works/pi-tui` in peerDependencies
  - No `extensions/` directory exists at repo root
  - No `prompts/` directory exists at repo root
  - No `.pi/` directory exists at repo root
  - Test file: `tests/package-archive.test.ts`
- [ ] **1.2 GREEN**: Edit `package.json`:
  - Remove the `"pi"` key (lines 8-18)
  - Remove `"pi-package"`, `"pi"`, `"pi-coding-agent"` from keywords
  - Update description from `"afergon-ai: a Pi-native development harness..."` to `"afergon-ai: a development harness with a disciplined debate-to-implementation pipeline, Gherkin-first specs, TDD enforcement, and Stitch design integration."`
  - Remove `@earendil-works/pi-coding-agent` from peerDependencies (keep `@earendil-works/pi-tui`)
  - Remove `@earendil-works/pi-coding-agent` from devDependencies
  - Remove `"extensions/"` and `"prompts/"` from `files` array
- [ ] **1.3 GREEN**: Delete `extensions/startup-banner.ts` and the `extensions/` directory
- [ ] **1.4 GREEN**: Delete `prompts/afergon-ai.md` and the `prompts/` directory
- [ ] **1.5 GREEN**: Delete `.pi/APPEND_SYSTEM.md`, `.pi/settings.json`, and the `.pi/` directory
- [ ] **1.6 GREEN**: Edit `scripts/build-typescript.ts`:
  - Remove `"prompts"` from `runtimeDirsToCopy` (line 10: `["adapters", "prompts", "skills"]` → `["adapters", "skills"]`)
- [ ] **1.7 GREEN**: Remove `tests/startup-banner.test.ts` (tests the deleted Pi extension)
- [ ] **1.8 GREEN**: Update `tests/tui-docs.test.ts`:
  - Remove the `PROMPT` variable and the `"documents the dispatcher contract in the Pi prompt"` test case (lines 8, 61-69) since `prompts/afergon-ai.md` no longer exists
  - Retain all README assertions and historical OpenSpec assertions
- [ ] **1.9 GREEN**: Update `tests/init-retire-claude.test.ts`:
  - Remove assertions that check for `--pi` and `--all` in the `--claude` retirement error message (these flags are also retired now)
  - Update the `"does not create Claude artifacts with --all"` test: `--all` is now retired, so this test must be rewritten or removed
  - Remove/update tests that assert `.pi/APPEND_SYSTEM.md` creation (Pi init is retired)
- [ ] **1.10 TRIANGULATE**: Add edge-case test assertions:
  - Packed archive (via `pnpm pack --dry-run` or equivalent) contains `dist/`, `adapters/`, `skills/`, `bin/`, `scripts/` but not `extensions/`, `prompts/`, or `.pi/`
  - Model identifiers and historical OpenSpec records containing "pi" or "claude" remain unchanged
- [ ] **1.11 VERIFY**: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- [ ] **1.12 COMMIT**: `feat(package)!: remove Pi host package distribution`

### Commit Unit 2: OpenCode-only installers (Spec 02)

- [ ] **2.1 RED**: Add/extend tests in `tests/init-retire-pi.test.ts` (new file) for POSIX init:
  - `init --pi` exits non-zero with retirement error, no side effects
  - `init --all` exits non-zero with retirement error, no side effects
  - `init --claude` exits non-zero with retirement error (already retired, verify message updated)
  - `init --opencode --pi` exits non-zero with retirement error, no side effects
  - `init` (no flags) configures OpenCode without host-selection prompt
  - `init --opencode` configures OpenCode
  - `update` refreshes only OpenCode, preserves user-owned `.pi/`, `CLAUDE.md`, `.claude/`
- [ ] **2.2 RED**: Add equivalent PowerShell tests (gated with `it.runIf(process.platform === "win32")`)
- [ ] **2.3 GREEN**: Rewrite `scripts/init-project.sh`:
  - Add `--pi` and `--all` to the retired-flag rejection loop (alongside existing `--claude`)
  - Update retirement error messages: `--pi` → `"Error: --pi is retired. Supported host: --opencode."`, `--all` → `"Error: --all is retired. Supported host: --opencode."`, `--claude` → `"Error: --claude is retired. Supported host: --opencode."`
  - Remove the interactive host-selection prompt (lines 83-102); when no flags are provided, default to OpenCode initialization
  - Remove the entire `SETUP_PI` code path (lines 173-191: Pi setup section)
  - Remove `SETUP_PI` variable and all references
  - Set `SETUP_OPENCODE=true` as the default when no flags are provided
  - Update the memory system prompt text: remove "Pi-native" from Engram description
  - Update the done summary: remove Pi line
  - Update the script header comment: remove `--pi` and `--all` from usage
- [ ] **2.4 GREEN**: Rewrite `scripts/init-project.ps1`:
  - Mirror all POSIX changes: add `--pi` and `--all` to retired-flag rejection
  - Remove interactive host-selection prompt
  - Remove Pi setup section
  - Default to OpenCode when no flags provided
  - Update memory system prompt text and done summary
- [ ] **2.5 GREEN**: Rewrite `scripts/update.sh`:
  - Remove the entire Pi update section (lines 57-67: reads `.pi/APPEND_SYSTEM.md` and overwrites from `prompts/afergon-ai.md`)
  - Remove Pi-related output messages
  - Keep OpenCode update logic intact
- [ ] **2.6 GREEN**: Rewrite `scripts/update.ps1`:
  - Remove the entire Pi update section (lines 37-48)
  - Remove Pi-related output messages
  - Keep OpenCode update logic intact
- [ ] **2.7 GREEN**: Update `scripts/lib/cli-dispatch-core.ts`:
  - Update `formatHelp()` to remove `[--pi]` and `[--all]` from init usage line
  - Change to: `"  afergon-ai init [--opencode]"`
- [ ] **2.8 GREEN**: Update `bin/afergon-ai`:
  - Update header comment: remove `[--pi]` and `[--all]` from usage
- [ ] **2.9 TRIANGULATE**: Add adversarial test cases:
  - Combined flags in any position: `--pi --opencode`, `--opencode --all`, `--pi --all --claude`
  - Verify no project files (`.pi/`, `opencode.json`, `openspec/`) are created when a retired flag is used
  - Verify user-owned `.pi/`, `CLAUDE.md`, `.claude/` files survive `update`
- [ ] **2.10 VERIFY**: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- [ ] **2.11 COMMIT**: `feat(installer)!: make init and update OpenCode-only, retire --pi and --all`

### Commit Unit 3: TUI OpenCode-only host surface (Spec 03)

- [ ] **3.1 RED**: Update `tests/tui-configuration.test.ts`:
  - Assert `getConfigurationStatus()` items do NOT include a Pi status item (id: "pi")
  - Assert the init interactive action does NOT have a checkbox form with Pi/All options
  - Assert the init action directly invokes `afergon-ai init` without host-selection
- [ ] **3.2 RED**: Update `tests/tui-status.test.ts`:
  - Assert `getStatusScreenState()` items do NOT include a Pi status item
  - Assert no Pi repair guidance appears in status detail
  - Assert user-owned `.pi/` directory does not produce a managed Pi status item
- [ ] **3.3 GREEN**: Edit `scripts/lib/tui/config-status-adapter.ts`:
  - Remove `SupportedInitId` type's `"pi"` and `"all"` members (keep only `"opencode"`)
  - Update `buildInitCommandArgv()`: remove `"pi"` and `"all"` from the filter; when `selectedIds` is empty or contains only `"opencode"`, return `buildCommandArgv("init")` (no flags needed since OpenCode is the default)
  - Remove the Pi status item from `getBaseStatusItems()` (remove the `getProjectInstallItem()` call for Pi)
  - Remove the `"pi"` case from `addGuidance()`
  - Update `createInteractiveActions()`: replace the checkbox form init action with a direct init action (no form, static argv `buildCommandArgv("init")`)
  - Remove the `"all"` option from any remaining form definitions
- [ ] **3.4 GREEN**: Verify non-interactive TUI rejection remains intact:
  - The existing `cli-dispatch-core.ts` already rejects `tui` in non-TTY mode — no changes needed
  - Verify existing test `tui-shell.test.ts` or `tui-dispatch.test.ts` covers this
- [ ] **3.5 TRIANGULATE**: Add edge-case test:
  - Project with user-owned `.pi/` directory and no managed OpenCode install: Configuration and Status report only OpenCode state and model config, no Pi items
  - Narrow terminal width renders text fallback branding (existing test coverage should suffice; verify)
- [ ] **3.6 GREEN**: Update `tests/tui-configuration.test.ts`:
  - Update the `"opens the init checkbox form"` test: the form no longer exists; replace with a test that the init action runs directly with confirmation
  - Update parity assertions that compare TypeScript and JS adapter output to exclude Pi items
- [ ] **3.7 GREEN**: Update `tests/tui-status.test.ts`:
  - Remove/update tests that assert Pi status items exist
  - Update the `"reports an ok readiness summary"` test: remove Pi from the expected items
  - Update the `"does not treat an existing CLAUDE.md as a managed host surface"` test: remove Pi assertions
- [ ] **3.8 GREEN**: Update `tests/tui-actions.test.ts`:
  - Update checkbox form state tests that reference Pi/All options in the init form
  - The form options `[{ id: "all", label: "All" }, { id: "pi", label: "Pi" }, { id: "opencode", label: "OpenCode" }]` must be updated or the test must be removed if the form no longer exists
- [ ] **3.9 VERIFY**: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- [ ] **3.10 COMMIT**: `feat(tui): remove Pi from Configuration/Status, direct OpenCode init`

### Commit Unit 4: Active documentation (Spec 04)

- [ ] **4.1 RED**: Update `tests/tui-docs.test.ts`:
  - Add documentation contract assertions:
    - README does NOT contain `"init --pi"`, `"init --all"`, `"pi install"`, `"Pi setup"`, `"Pi-native"`
    - README DOES contain `"init"` or `"init --opencode"` as the setup path
    - detect-skills SKILL.md does NOT claim Pi discovery or Pi as a supported tool
  - Distinguish prohibited active Pi-host claims from permitted historical OpenSpec references and `@earendil-works/pi-tui` dependency naming
- [ ] **4.2 GREEN**: Edit `README.md`:
  - Line 18: Change `"It works with **Pi** and **OpenCode**."` → remove Pi reference
  - Lines 80: Remove `"Pi extensions continue to load from the source extensions/ package path..."` sentence
  - Lines 90-98: Remove `"Select which tools to configure (Pi, OpenCode, or all)"` and the `--pi`/`--all` flag examples; replace with direct OpenCode init guidance
  - Lines 174: Remove `"init opens checkbox choices for Pi, OpenCode, or all"` — replace with direct init description
  - Lines 261-271: Remove the entire `"### Pi"` per-tool setup section
  - Lines 360-373: Remove Pi skill invocation examples (`Pi skill: /skill:debate` etc.); keep only OpenCode commands
  - Line 373: Remove `"compatible with Pi, Cursor, and OpenCode"` — update to reflect OpenCode only
  - Lines 385-412: Update Skill Discovery section: remove `"Pi and OpenCode both discover automatically"`, remove `"available in Pi"` claims
  - Line 427: Update Engram memory description: remove `"Pi-native persistent memory"`
  - Preserve: standalone TUI launch/fallback guidance, OpenCode command/workflow guidance, model identifiers, all historical OpenSpec references
- [ ] **4.3 GREEN**: Edit `skills/detect-skills/SKILL.md`:
  - Line 65: Remove `"Pi discovers this directory automatically. No Pi configuration needed for the skills themselves to be available."`
  - Line 121-123: Remove `"These skills are now available to Pi"` claim
  - Line 127: Remove `"compatible with Pi"` reference
  - Replace with OpenCode-focused guidance
- [ ] **4.4 GREEN**: Update `tests/tui-docs.test.ts`:
  - Remove the `PROMPT` import and the `"documents the dispatcher contract in the Pi prompt"` test (if not already done in Commit 1)
  - Add new assertions for the updated README and detect-skills content
- [ ] **4.5 VERIFY**: `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`
- [ ] **4.6 COMMIT**: `docs: update active guidance for OpenCode-only host support`

## Interfaces and Technical Contracts

### `SupportedInitId` type change (config-status-adapter.ts)

```typescript
// Before:
type SupportedInitId = "pi" | "opencode" | "all";

// After:
type SupportedInitId = "opencode";
```

### `buildInitCommandArgv` signature change

```typescript
// Before: builds --pi, --opencode, --all flags from selectedIds
// After: always returns buildCommandArgv("init") — no host flags needed
export function buildInitCommandArgv({ selectedIds = [] }: { selectedIds?: readonly string[] } = {}): ManifestCommandArgv {
  return buildCommandArgv("init");
}
```

### Init action definition change (config-status-adapter.ts)

```typescript
// Before: checkbox form with Pi/OpenCode/All options
// After: direct mutate action with static argv, no form
createActionDefinition({
  id: `${section}-init`,
  section,
  kind: "mutate",
  label: "Initialize project files",
  cliEquivalent: "afergon-ai init",
  argv: buildCommandArgv("init"),
  confirmLabel: "Initialize OpenCode project files?",
  refreshTarget: section,
})
```

### Retired flag error messages (init-project.sh / init-project.ps1)

```
--pi:     "Error: --pi is retired. Supported host: --opencode."
--all:    "Error: --all is retired. Supported host: --opencode."
--claude: "Error: --claude is retired. Supported host: --opencode."
```

### Package.json dependency changes

```json
// Before:
"peerDependencies": {
  "@earendil-works/pi-coding-agent": "*",
  "@earendil-works/pi-tui": "*"
}
// After:
"peerDependencies": {
  "@earendil-works/pi-tui": "*"
}
```

## Acceptance Criteria

- [ ] The package has no Pi manifest (`"pi"` key), Pi extension (`extensions/`), Pi prompt (`prompts/`), Pi coding-agent dependency, or Pi host package identity; `@earendil-works/pi-tui` remains a peerDependency.
- [ ] The generated package (dist/) contains the standalone TUI runtime, OpenCode adapters, and skills, but no `extensions/`, `prompts/`, or repository Pi host state.
- [ ] POSIX and PowerShell `init` configure OpenCode by default and via `--opencode`; `--pi`, `--all`, and `--claude` reject before side effects with non-zero exit.
- [ ] POSIX and PowerShell `update` operate only on OpenCode and preserve existing user-owned `.pi/`, `CLAUDE.md`, and `.claude/` files.
- [ ] CLI help and TUI host surfaces advertise only OpenCode; the TUI remains usable and renders branding/fallback correctly.
- [ ] Active README and detect-skills guidance no longer promise Pi host/package integration.
- [ ] Typecheck, build, package archive checks, runtime health, focused tests, and the complete suite pass.

## Verification

- [ ] Tests: `pnpm test` — all existing and new tests pass (typecheck + build + vitest run)
- [ ] Build: `pnpm build` — TypeScript compilation succeeds, dist/ contains expected artifacts
- [ ] Additional Evidence:
  - `pnpm run health:runtime` — all dist/ runtime entries import successfully
  - `pnpm typecheck` — TypeScript validation completes
  - Package archive check: `pnpm pack --dry-run` output or test assertion confirms no Pi-only artifacts
  - POSIX init retirement: `bash scripts/init-project.sh --pi` exits non-zero with retirement message
  - POSIX init default: `bash scripts/init-project.sh` (with memory input) creates OpenCode files only
  - PowerShell init retirement: equivalent PowerShell invocation exits non-zero (Windows CI or local)
- [ ] Rule Compliance:
  - POSIX/PowerShell parity: both platforms have equivalent test coverage for init/update/retirement
  - TDD evidence: each commit unit has RED→GREEN→TRIANGULATE test commits
  - No user-owned files (`.pi/`, `CLAUDE.md`, `.claude/`) are modified or deleted by update
  - Historical OpenSpec records and model identifiers containing "pi"/"claude" remain unchanged

## Open Questions

- None

## Dependencies

- Phase 1 branch `chore/opencode-only-01-remove-claude-host` at commit `968aab6` — already the base of the current branch `chore/opencode-only-02-remove-pi-host`
- `@earendil-works/pi-tui` retained as the standalone TUI runtime dependency — no version change required
- `python3` required by `register-opencode-agents.sh` for OpenCode agent registration — pre-existing, no change

## Risks and Watchouts

- **Stale verify-install.sh agent names**: The POSIX `verify-install.sh` script (lines 58-59) still uses legacy agent names (`orchestrator`, `debate`, etc.) instead of current `afergon-ai`/`afg-*` names. The PowerShell version already uses correct names. This is a pre-existing bug NOT in scope for this task but should be tracked as a follow-up.
- **pnpm-lock.yaml regeneration**: Removing `@earendil-works/pi-coding-agent` from devDependencies will require `pnpm install` to regenerate the lockfile. The lockfile diff should be inspected to confirm only the expected dependency is removed.
- **Test file cross-references**: Multiple test files (`tui-configuration.test.ts`, `tui-status.test.ts`, `tui-actions.test.ts`, `init-retire-claude.test.ts`, `tui-docs.test.ts`) reference Pi host state. Each must be updated in the correct commit unit to avoid breaking the build between commits.
- **prompts/afergon-ai.md referenced by tui-docs.test.ts**: The docs contract test imports and asserts against `prompts/afergon-ai.md`. This must be addressed in Commit 1 (when the file is deleted) to avoid a broken import.
- **init-project.sh references prompts/afergon-ai.md**: The Pi setup section uses `awk` to extract content from `prompts/afergon-ai.md`. Since both the setup section and the file are removed in different commit units, Commit 1 must not break the build — the init script still works because the Pi setup section is guarded by `$SETUP_PI` which is only set by `--pi`/`--all` flags. However, Commit 2 removes both the flags and the section, so the ordering is safe.
- **Memory system prompt text**: The Engram memory description in init scripts says "Pi-native persistent memory". This should be updated to remove the Pi reference, but the memory system itself is host-agnostic. Updated in Commit 2.
- **`.gitignore` comment**: Line 1 says `"# Local Pi runtime state"` for `.atl/`. This is a comment-only reference and is not in scope, but could be updated for clarity in a follow-up.

## Completion Condition

This plan is complete when all four commit units are implemented, each with passing `pnpm typecheck && pnpm build && pnpm run health:runtime && pnpm test`, and the acceptance criteria are verified. The final state is a package that distributes only OpenCode host integration, a CLI that initializes and updates only OpenCode, a TUI that reports only OpenCode state, and active documentation that directs users to OpenCode as the sole supported host.
