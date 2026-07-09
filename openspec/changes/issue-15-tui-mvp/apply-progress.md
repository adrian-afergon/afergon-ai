# Apply Progress: issue-15-tui-mvp

## Implementation Progress

**Change**: issue-15-tui-mvp
**Mode**: Strict TDD

### Completed Tasks
- [x] 1.1 Block apply until `openspec/config.yaml` testing metadata is refreshed to Vitest / `pnpm test`, and record verify/apply commands there.
- [x] 1.2 RED/GREEN: add `tests/tui-dispatch.test.mjs` for TTY vs non-TTY no-args, explicit `tui`, and explicit command bypass.
- [x] 1.3 Create `scripts/cli-dispatch.mjs`; update `bin/afergon-ai` and `bin/afergon-ai.cmd` to forward argv safely (`%*` on Windows, no fixed `%2..%5`).
- [x] 1.4 Add launcher parity notes to `README.md`; verify `pnpm test` plus launcher help/doctor/models/manual quoted-arg checks.
- [x] 2.1 RED/GREEN: add `tests/tui-shell.test.mjs` for `scripts/tui.mjs` startup, home route, and `q`/Esc exit flow.
- [x] 2.2 Create `scripts/tui.mjs` and `scripts/lib/tui/navigation.mjs` with route state limited to home/configuration/status/model-profiles.
- [x] 2.3 Add rollback note and manual checks for `./bin/afergon-ai` and `./bin/afergon-ai tui` keyboard flow.
- [x] 3.1 RED/GREEN: add `tests/tui-command-manifest.test.mjs` covering stable equivalents shown and no fabricated commands.
- [x] 3.2 Create `scripts/lib/tui/command-manifest.mjs` with explicit `init`/`doctor`/`update`/`models` mappings only.
- [x] 4.1 RED/GREEN: add `tests/tui-configuration.test.mjs`; create `scripts/lib/tui/config-status-adapter.mjs` and `scripts/lib/tui/screens/configuration.mjs`.
- [x] 4.2 RED/GREEN: add `tests/tui-status.test.mjs`; extend `scripts/lib/tui/config-status-adapter.mjs` and create `scripts/lib/tui/screens/status.mjs` with actionable failure messages.
- [x] 5.1 RED/GREEN: add `tests/tui-model-profiles.test.mjs`; create `scripts/lib/tui/model-profiles-adapter.mjs` and `scripts/lib/tui/screens/model-profiles.mjs`, exporting from `scripts/models.mjs` only if reuse is required.
- [x] 5.2 Update `README.md` and `prompts/afergon-ai.md` for no-args TUI, non-TTY behavior, Windows parity, CLI-equivalent visibility, and chained rollback notes.
- [x] 5.3 Final verify per slice and at end: `pnpm test`, explicit command preservation, launcher parity, and manual navigation across Configuration, Status, and Model Profiles.
- [x] 4.1 RED/GREEN: add `tests/tui-branding.test.mjs`; create `scripts/lib/branding/logo.mjs` with canonical lines, tagline, and fallback copy only.
- [x] 4.2 Update `extensions/startup-banner.ts` and `scripts/tui.mjs` to import the shared branding source without inventing charset variants.
- [x] 5.1 RED/GREEN: extend `tests/tui-shell.test.mjs` for `up/down/enter` and retained `c/s/m/h` shortcuts.
- [x] 5.2 Update `scripts/lib/tui/navigation.mjs` and `scripts/tui.mjs` with Home selection state, visible markers, and route activation.
- [x] 6.1 RED/GREEN: update `tests/tui-shell.test.mjs`, `tests/tui-docs.test.mjs`, and affected screen tests for non-color-only focus, help/exit hints, and fallback branding text.
- [x] 6.2 Update `scripts/lib/tui/screens/*.mjs`, `README.md`, `prompts/afergon-ai.md`, `apply-progress.md`, and `verify-report.md`; rerun `pnpm test` plus forced-TTY arrow smoke.
- [x] 7.1 RED/GREEN: add `tests/tui-actions.test.mjs` for argv-only execution, read-only inline output, confirm-before-mutate, and Esc/Cancel recovery.
- [x] 7.2 Create `scripts/lib/tui/actions/definitions.mjs`, `scripts/lib/tui/actions/runner.mjs`, and `scripts/lib/tui/actions/forms.mjs`; extend `scripts/lib/tui/command-manifest.mjs` for stable action argv builders only.
- [x] 7.3 Update `scripts/tui.mjs` and `scripts/lib/tui/navigation.mjs` with section action selection, modal state, output panel, and focus-return helpers.
- [x] 8.1 RED/GREEN: extend `tests/tui-configuration.test.mjs` and `tests/tui-status.test.mjs` for inline `doctor`, confirmed `update`, confirmed `init`, checkbox flag selection, output/error rendering, and section refresh.
- [x] 8.2 Update `scripts/lib/tui/config-status-adapter.mjs`, `scripts/lib/tui/screens/configuration.mjs`, and `scripts/lib/tui/screens/status.mjs` to expose executable action lists, confirmation copy, and output-panel summaries.
- [x] 8.3 Update `tests/tui-shell.test.mjs` and `README.md` for section action keyboard flow, modal focus bounds, and cancel/escape guidance.
- [x] 9.1 RED/GREEN: extend `tests/tui-model-profiles.test.mjs` for direct focused-profile `switch`, create-name entry, confirmed `profile delete`, explicit assignment-editor `S` save, and bounded degraded-guidance output with no fabricated commands.
- [x] 9.2 Update `scripts/lib/tui/model-profiles-adapter.mjs`, `scripts/lib/tui/screens/model-profiles.mjs`, `scripts/lib/tui/actions/forms.mjs`, `scripts/lib/tui/actions/definitions.mjs`, and `scripts/tui.mjs` for browse/profile-list navigation, assignment-editor shortcuts, confirmed destructive flows, output panels, and refresh-after-mutation.
- [x] 9.3 Update `tests/tui-docs.test.mjs`, `README.md`, `apply-progress.md`, and `verify-report.md`; rerun focused tests, full `pnpm test`, and bounded forced-TTY smoke for direct switch/save, confirmed delete, bounded create/save degraded guidance, and post-mutation refresh.

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `openspec/config.yaml` | Modified | Refreshed testing metadata to Vitest / `pnpm test` and recorded apply/verify commands. |
| `tests/tui-dispatch.test.mjs` | Created / Modified | Added dispatcher routing and launcher-boundary tests for TTY, help, explicit command bypass, Windows forwarding safety, CI guard behavior, caller cwd preservation, and Windows PowerShell command mapping. |
| `scripts/cli-dispatch.mjs` | Created / Modified | Added a shared Node dispatcher with TTY/CI routing, explicit command passthrough, argv-array subprocess execution, caller cwd preservation, and Windows `init` / `update` PowerShell routing. |
| `tests/tui-shell.test.mjs` | Created / Modified | Added strict-TDD shell/navigation tests for startup rendering, home route defaults, MVP route constraints, `q` / Esc exit flow, Home arrow wrapping, Enter activation, shortcut preservation, visible selection markers, and non-hanging off-Home arrow/Enter input. |
| `scripts/tui.mjs` | Modified | Replaced the PR1 placeholder with the real minimal Pi TUI shell/runner, then extended minimal `c`/`h`, `s`/`h`, and `m`/`h` navigation so Configuration, Status, and Model Profiles are reachable; PR9 adds Home arrow/Enter handling plus visible non-color-only selection and help text. |
| `scripts/lib/tui/navigation.mjs` | Created / Modified | Added the constrained MVP route state for `home`, `configuration`, `status`, and `model-profiles`, then extended it with Home selection state plus wrap/activation helpers for PR9. |
| `tests/tui-command-manifest.test.mjs` | Created / Modified | Added strict-TDD manifest contract tests for the stable CLI-equivalent commands, no-fabrication guardrails, and PR3 immutability regressions covering nested `argv` mutation on shared exports plus helper copies. |
| `scripts/lib/tui/command-manifest.mjs` | Created / Modified | Added the frozen command manifest plus deep-frozen copy/lookup helpers so shared `argv` arrays and accessor results cannot be mutated or poisoned by callers. |
| `tests/tui-configuration.test.mjs` | Created / Modified | Added strict-TDD configuration adapter/screen tests for missing vs discovered state, stable CLI-equivalent action visibility, TUI route reachability back to Home, and invalid/corrupt config failure-path regressions with actionable repair guidance. |
| `scripts/lib/tui/config-status-adapter.mjs` | Created / Modified | Added the shared configuration/status adapter that reuses model-profile helpers plus existing install file boundaries, then extended it with PR5 readiness summarization and actionable Status repair guidance while preserving the Configuration contract. |
| `scripts/lib/tui/screens/configuration.mjs` | Created | Added the configuration screen renderer that shows current state and stable CLI-equivalent actions without fabricating commands. |
| `tests/tui-status.test.mjs` | Created / Modified | Added strict-TDD status adapter/screen tests for readiness summaries, actionable failure guidance, stable CLI-equivalent actions, Home → Status → Home navigation, and the isolated all-healthy temp-fixture regression path. |
| `scripts/lib/tui/screens/status.mjs` | Created | Added the Status screen renderer for readiness, current health items, and stable CLI-equivalent actions. |
| `tests/tui-model-profiles.test.mjs` | Created / Modified | Added strict-TDD model-profile adapter/screen/navigation tests for missing-config guidance, isolated active-profile rendering, stable CLI-equivalent visibility, Home → Model Profiles → Home navigation, and PR6 reliability regressions for invalid JSON plus invalid config-shape fail states. |
| `scripts/lib/tui/model-profiles-adapter.mjs` | Created / Modified | Added the model-profiles adapter that reuses existing config/profile helpers and exposes only the stable `afergon-ai models` CLI surface plus supported profile actions, then hardened it to return a renderable fail state instead of throwing on corrupt model config. |
| `scripts/lib/tui/screens/model-profiles.mjs` | Created | Added the Model Profiles screen renderer for active profile state, known profiles, resolved assignments, and supported profile actions. |
| `scripts/tui.mjs` | Modified | Wired the Model Profiles route into the shell and replaced the deferred home copy with discoverable `m` navigation. |
| `bin/afergon-ai` | Modified | Replaced inline command routing with delegation to the shared dispatcher. |
| `bin/afergon-ai.cmd` | Modified | Replaced fixed-slot forwarding with `%*` delegation to the shared dispatcher. |
| `README.md` | Modified | Expanded the launch-mode docs with MVP section visibility, stable CLI-equivalent rules, chained rollback notes, and the final verification checklist. |
| `prompts/afergon-ai.md` | Modified | Added the dispatcher/TUI launch contract, Windows parity note, CLI-equivalent visibility rule, and final-slice rollback scope to the Pi prompt. |
| `tests/tui-docs.test.mjs` | Created / Modified | Added strict-TDD docs contract coverage for launch routing, CLI-equivalent visibility, rollback guidance, final verification instructions, the PR7 rollback file set, and the documented non-TTY `tui` exit-1 expectation. |
| `tests/tui-branding.test.mjs` | Created / Modified | Added strict-TDD branding contract coverage for the shared logo module, startup-banner reuse, TUI Home banner rendering, and behavior-level startup-banner output coverage for wide and fallback widths. |
| `scripts/lib/branding/logo.mjs` | Created | Added the canonical shared branding payload plus explicit variant lookup and width-safety helpers without fabricating charset variants. |
| `extensions/startup-banner.ts` | Modified | Replaced inline logo ownership with the shared branding source and now renders fallback branding text when narrow widths cannot safely fit the canonical banner. |
| `scripts/tui.mjs` | Modified | Reused shared branding on Home, rendering the full banner on wide terminals and plain-text fallback copy when the banner is unsafe to fit. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Marked PR8 tasks 4.1 and 4.2 complete after focused and full-suite verification passed. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Marked PR9 tasks 5.1 and 5.2 complete after focused and full-suite verification passed. |
| `openspec/changes/issue-15-tui-mvp/apply-progress.md` | Modified | Merged the PR8 branding slice, PR8 reliability follow-up, and PR9 Home arrow-navigation slice into the cumulative artifact without overwriting earlier slices. |
| `tests/tui-shell.test.mjs` | Modified | Added PR10 accessibility assertions for `[selected]` markers, explicit keyboard-help copy, and plain-text branding-mode guidance on narrow terminals. |
| `tests/tui-docs.test.mjs` | Modified | Added docs-contract coverage for keyboard shortcuts, plain-text branding fallback, and text-first accessibility notes in README and prompt guidance. |
| `tests/tui-configuration.test.mjs` | Modified | Locked the Configuration screen keyboard-help footer and text-state-marker guidance. |
| `tests/tui-status.test.mjs` | Modified | Locked the Status screen keyboard-help footer and text-state-marker guidance. |
| `tests/tui-model-profiles.test.mjs` | Modified | Locked the Model Profiles screen keyboard-help footer and text-state-marker guidance. |
| `scripts/tui.mjs` | Modified | Added explicit Home keyboard-help copy, `[selected]` text markers, retained shortcut reminders, and a plain-text branding-mode note for narrow terminals. |
| `scripts/lib/tui/screens/configuration.mjs` | Modified | Added keyboard-help footer text and explicit non-color state-marker guidance. |
| `scripts/lib/tui/screens/status.mjs` | Modified | Added keyboard-help footer text and explicit non-color state-marker guidance. |
| `scripts/lib/tui/screens/model-profiles.mjs` | Modified | Added keyboard-help footer text and explicit non-color state-marker guidance. |
| `README.md` | Modified | Documented arrow-key navigation, direct keyboard shortcuts, plain-text banner fallback, and text-first accessibility cues. |
| `prompts/afergon-ai.md` | Modified | Added the orchestrator-level Home accessibility contract for text-first cues, direct shortcuts, and plain-text banner fallback. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Marked PR10 tasks 6.1 and 6.2 complete after focused, full-suite, and bounded PTY verification passed. |
| `openspec/changes/issue-15-tui-mvp/verify-report.md` | Modified | Refreshed the final verification report for the accessibility extension with PR10 evidence and updated compliance counts. |
| `openspec/changes/issue-15-tui-mvp/apply-progress.md` | Modified | Merged the PR10 accessibility/docs/verification slice into the cumulative artifact without overwriting earlier slices. |
| `tests/tui-actions.test.mjs` | Created / Modified | Added strict-TDD coverage for manifest argv builders, argv-only runner execution, timeout/error handling, confirm-before-mutate flow, output-panel close behavior, PR11 stale-selection regression coverage, output sanitization, manifest-allowlist enforcement, the PR12 reliability blocker regressions for bounded capture/render truncation, and the exact-boundary no-false-truncation regression. |
| `scripts/lib/tui/actions/definitions.mjs` | Created / Modified | Added the shared action-definition model, then tightened it so executable argv must come from the stable manifest allowlist instead of ad hoc dispatcher commands. |
| `scripts/lib/tui/actions/runner.mjs` | Created / Modified | Added the bounded argv runner with shell-disabled spawn execution, timeout handling, captured stdout/stderr results, per-stream byte/line truncation flags for the PR12 reliability fix, and exact-boundary truncation detection that only flips true when output is actually omitted. |
| `scripts/lib/tui/actions/forms.mjs` | Created / Modified | Added shared confirmation/output state helpers, sanitized ANSI CSI/OSC/control characters before inline output is rendered back into the terminal, and capped rendered output with a visible `[output truncated]` marker. |
| `scripts/lib/tui/command-manifest.mjs` | Modified | Added `buildCommandArgv()` so shared interactive actions can compose immutable stable argv arrays without shell strings, and branded those arrays so only manifest-backed commands can become executable actions. |
| `scripts/lib/tui/navigation.mjs` | Modified | Added section-action selection plus open/close modal helpers for bounded interactive state, then normalized stale or out-of-range section selections during route/action-list changes. |
| `scripts/tui.mjs` | Modified | Added injected interactive-action rendering, confirm/output modal flow, Esc/Enter handling, default argv-runner wiring, and safe action-selection normalization so route/action count mismatches cannot crash execution or rendering. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Marked PR11 tasks 7.1, 7.2, and 7.3 complete after focused and full-suite verification passed. |
| `openspec/changes/issue-15-tui-mvp/apply-progress.md` | Modified | Merged the PR11 shared-action-framework slice and the PR12 exact-boundary truncation follow-up into the cumulative artifact without overwriting earlier slices. |
| `tests/tui-configuration.test.mjs` | Modified | Added PR12 behavior-first coverage for configuration action injection, inline doctor output, init checkbox selection, exact argv confirmation, and post-action refresh. |
| `tests/tui-status.test.mjs` | Modified | Added PR12 behavior-first coverage for status doctor `--opencode`, update confirmation, cancel recovery, and bounded output rendering. |
| `tests/tui-shell.test.mjs` | Modified | Added PR12 keyboard-flow coverage for section action help, form guidance, cancel recovery, and a no-action off-Home regression path. |
| `scripts/lib/tui/actions/definitions.mjs` | Modified | Extended shared action definitions to support either static manifest argv or form-backed argv builders while preserving allowlist enforcement. |
| `scripts/lib/tui/actions/forms.mjs` | Modified | Added checkbox-form state helpers and included CLI-equivalent summaries in bounded output rendering. |
| `scripts/lib/tui/config-status-adapter.mjs` | Modified | Added default Configuration/Status interactive action definitions plus the `init` checkbox argv builder and `doctor --opencode` Status mapping. |
| `scripts/tui.mjs` | Modified | Wired section-provided interactive actions, checkbox form modals, resolved argv confirmations, inline doctor output, and post-action section rerenders. |
| `README.md` | Modified | Documented Configuration/Status interactive-action keyboard flow, inline doctor output, init checkbox choices, and confirm-before-update behavior. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Marked PR12 tasks 8.1, 8.2, and 8.3 complete after focused and full-suite verification passed. |
| `tests/tui-model-profiles.test.mjs` | Modified | Added PR13 strict-TDD coverage for direct focused-profile `switch`, create-name entry, confirmed `profile delete`, explicit assignment-editor `S` save, cancel recovery, degraded-output handling, and refreshed screen state. |
| `scripts/lib/tui/model-profiles-adapter.mjs` | Modified | Added the current browse/profile-list plus assignment-editor Model Profiles flow, including create-name entry, direct switch, delete confirmation, and staged assignment editing without reviving removed action-list flows. |
| `scripts/lib/tui/actions/definitions.mjs` | Modified | Extended shared form validation to accept create-name, assignment-entry, and confirm Model Profiles flows while keeping manifest allowlist enforcement. |
| `scripts/lib/tui/actions/forms.mjs` | Modified | Added create-name, assignment text-entry, and confirm state helpers plus reusable submit/input extraction for PR13. |
| `scripts/tui.mjs` | Modified | Added create-name and assignment-entry rendering/input handling so Model Profiles support direct switch/save shortcuts, confirmed destructive flows, Esc cancel, bounded output recovery, and first-profile create guidance panels when success output is degraded. |
| `scripts/lib/tui/screens/model-profiles.mjs` | Modified | Added explicit interactive notes about inline reads, assignment entry, and post-mutation refresh behavior. |
| `tests/tui-docs.test.mjs` | Modified | Locked README guidance for Model Profiles inline actions, assignment entry, and refresh-after-mutation behavior. |
| `README.md` | Modified | Documented Model Profiles inline actions, assignment entry, and immediate refresh behavior after successful mutations. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Marked PR13 tasks 9.1, 9.2, and 9.3 complete after focused, full-suite, and bounded PTY verification passed. |
| `tests/tui-model-profiles.test.mjs` | Modified | Added PR13 review-fix regressions for empty set/create validation, explicit `--allow-unknown` preservation, delete confirmation cancel/success, sanitized model-profile rendering surfaces, and the current user-visible empty-submit plus delete refresh contracts. |
| `scripts/lib/tui/model-profiles-adapter.mjs` | Modified | Marked mutable model/profile text fields required and added delete confirmation metadata while keeping manifest-backed argv builders. |
| `scripts/lib/tui/actions/forms.mjs` | Modified | Added shared field-validation and confirmation helpers, cleared stale validation messages on edits, and sanitized action metadata shown in bounded output panels. |
| `scripts/lib/tui/screens/model-profiles.mjs` | Modified | Sanitized model-profile screen lines before truncation so profile/model/config strings cannot render terminal controls. |
| `scripts/tui.mjs` | Modified | Blocked empty form submissions before argv resolution, added delete-confirm input handling, and sanitized confirmation/form rendering for user-controlled strings. |
| `openspec/changes/issue-15-tui-mvp/apply-progress.md` | Modified | Recorded the PR13 review-fix RED/GREEN evidence, focused verification, and updated cumulative test counts without overwriting earlier slices. |
| `tests/tui-configuration.test.mjs` | Modified | Added strict-TDD regression coverage proving Configuration screen labels/details/path text strip ANSI, OSC, C1, and control-byte payloads before rendering. |
| `tests/tui-status.test.mjs` | Modified | Added strict-TDD regression coverage proving Status summary/item/action labels and path details strip ANSI, OSC, C1, and control-byte payloads before rendering. |
| `scripts/lib/tui/screens/configuration.mjs` | Modified | Sanitized Configuration screen lines before width truncation so rendered labels/details cannot emit terminal controls. |
| `scripts/lib/tui/screens/status.mjs` | Modified | Sanitized Status screen lines before width truncation so rendered summary/item/action text cannot emit terminal controls. |
| `openspec/changes/issue-15-tui-mvp/apply-progress.md` | Modified | Recorded the final PR13 risk-warning sanitization fix for Configuration/Status screens with RED/GREEN evidence and refreshed verification counts. |
| `openspec/changes/issue-15-tui-mvp/verify-report.md` | Modified | Updated the current verification counts to match the added Model Profiles safety-contract tests and latest reruns. |

### TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `N/A` | Config | N/A (metadata task) | ➖ Structural metadata refresh required before runnable tests | ✅ `openspec/config.yaml` updated to Vitest / `pnpm test` | ➖ Single output | ➖ None needed |
| 1.2 | `tests/tui-dispatch.test.mjs` | Unit | ✅ `pnpm test -- tests/model-profiles.test.mjs` → 120/120 | ✅ Wrote failing import-first routing tests | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 130/130 | ✅ 10 dispatcher/launcher cases | ✅ Removed import-time side effect by guarding `main()` |
| 1.3 | `tests/tui-dispatch.test.mjs` | Unit | ✅ `pnpm test -- tests/model-profiles.test.mjs` → 120/120 | ✅ Launcher delegation assertions written before dispatcher/launcher implementation | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 130/130 | ✅ POSIX delegation + Windows `%*` boundary | ✅ Centralized explicit-command execution builder |
| 1.4 | `tests/tui-dispatch.test.mjs` + manual verification | Mixed | ✅ `pnpm test -- tests/model-profiles.test.mjs` → 120/120 | ✅ Help-format coverage added before README/manual verification updates | ✅ `pnpm test` → 130/130 plus launcher/manual checks | ✅ Help text + no-args + explicit `tui` + quoted-arg checks | ➖ Docs/manual slice only |
| 2.1 | `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 135/135 | ✅ Wrote failing startup/home/exit tests before the shell/navigation implementation existed | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 140/140 | ✅ Startup render + `q` exit + Esc exit cases | ✅ Kept assertions at the fake-terminal boundary instead of mocking Pi TUI internals |
| 2.2 | `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 135/135 | ✅ Added route-state expectations before creating the navigation module and replacing the placeholder TUI | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 140/140 | ✅ Default home route + allowed-route set + unsupported-route guard | ✅ Split route validation into `scripts/lib/tui/navigation.mjs` and shortened home copy to fit the viewport |
| 2.3 | `tests/tui-shell.test.mjs` + manual verification | Mixed | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 135/135 | ✅ Exit-flow tests were written before adding rollback/manual notes | ✅ `pnpm test` → 140/140 plus launcher/manual checks | ✅ Verified `q` and Esc launcher paths through `./bin/afergon-ai` and `./bin/afergon-ai tui` | ➖ Docs/manual slice only |
| 3.1 | `tests/tui-command-manifest.test.mjs` | Unit | N/A (new) | ✅ Wrote failing import-first manifest tests before the module existed | ✅ `pnpm test -- tests/tui-command-manifest.test.mjs` → 144/144 | ✅ Covered the exact 4 stable equivalents plus explicit no-fabrication/unknown lookup cases | ✅ Added copy-based assertions so callers cannot mutate the shared contract |
| 3.2 | `tests/tui-command-manifest.test.mjs` | Unit | N/A (new) | ✅ Added the command-manifest contract before implementing the manifest module | ✅ `pnpm test -- tests/tui-command-manifest.test.mjs` → 144/144 | ✅ Forced explicit `init` / `doctor` / `update` / `models` mappings only | ✅ Extracted `cloneEntry()` and froze shared manifest entries |
| 4.1 | `tests/tui-configuration.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 147/147 | ✅ Wrote failing import-first tests for the configuration adapter/screen and navigation reachability before the modules existed | ✅ `pnpm test -- tests/tui-configuration.test.mjs` → 151/151 | ✅ Covered missing vs discovered local state, stable action visibility, screen rendering, and `Home → Configuration → Home` navigation | ✅ Extracted a thin configuration adapter plus a dedicated screen renderer and injected the loader into the shell |
| 4.2 | `tests/tui-status.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-configuration.test.mjs` + `pnpm test -- tests/tui-shell.test.mjs` → 154/154 baseline before status edits | ✅ Wrote failing import-first tests for the Status adapter/screen and route reachability before the screen module existed | ✅ `pnpm test -- tests/tui-status.test.mjs` → 158/158 | ✅ Covered readiness warn/fail states, stable action visibility, screen rendering, and `Home → Status → Home` navigation | ✅ Reused the shared config/install snapshot in the adapter and kept the new screen renderer thin |
| 5.1 | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs` → 159/159 baseline before PR6 edits | ✅ Added failing import-first tests for the new adapter/screen plus `m` route reachability before the modules existed | ✅ `pnpm test -- tests/tui-model-profiles.test.mjs` → 163/163 | ✅ Covered missing-config guidance, isolated active-profile rendering, stable `afergon-ai models` visibility only, and `Home → Model Profiles → Home` navigation | ✅ Reused `scripts/lib/model-profiles.mjs` directly so no extra `scripts/models.mjs` export surface was needed |
| 5.2 | `tests/tui-docs.test.mjs` | Unit | ✅ `pnpm test` → 166/166 baseline before final docs contract coverage | ✅ Added a failing README contract for the final verification checklist before adjusting the docs | ✅ `pnpm test -- tests/tui-docs.test.mjs` → 168/168 after README/prompt updates | ✅ Covered both README and prompt launch-contract surfaces plus rollback/CLI-equivalent guidance | ✅ Re-chunked the docs into small launch/rollback/verification sections instead of adding dense prose |
| 5.3 | `tests/tui-docs.test.mjs` + manual verification | Mixed | ✅ `pnpm test -- tests/tui-docs.test.mjs` → 168/168 before final command/smoke execution | ✅ The docs contract now requires the final verification checklist before evidence can be recorded | ✅ `pnpm test` → 168/168 plus launcher/manual verification commands | ✅ Covered non-TTY help/error routing, explicit command preservation, quoted-arg forwarding, Windows parity via Vitest launcher coverage, and forced-TTY navigation for Configuration, Status, and Model Profiles | ➖ Verification slice only |
| 4.1 | `tests/tui-branding.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 168/168 baseline before PR8 edits | ✅ Added failing import-first branding-contract tests before the shared module existed | ✅ `pnpm test -- tests/tui-branding.test.mjs` → 173/173 after the shared branding module landed | ✅ Covered canonical logo lines, fallback copy, default lookup, and missing-variant handling | ✅ Kept the branding API pure with a single exported payload plus small lookup helpers |
| 4.2 | `tests/tui-branding.test.mjs` + `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 168/168 baseline before PR8 edits | ✅ Added failing assertions first for startup-banner reuse plus TUI Home wide/fallback rendering | ✅ `pnpm test -- tests/tui-branding.test.mjs tests/tui-shell.test.mjs` → 173/173 after wiring both consumers to the shared source | ✅ Covered startup reuse, wide-terminal banner rendering, and width-based plain-text fallback without adding fake variants | ✅ Reused the same branding payload in both runtime surfaces and kept fallback logic local to the TUI renderer |
| 5.1 | `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 176/176 baseline before PR9 edits | ✅ Added failing Home-selection/default-marker, arrow-wrap, Enter-activation, shortcut-regression, and no-hang assertions before implementing the new navigation helpers | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 181/181 after PR9 shell/navigation updates | ✅ Covered wrap-from-top, wrap-from-bottom, Enter to open Status, retained `c/s/m/h`, and ignored off-Home arrow/Enter input | ✅ Kept the assertions at the fake-terminal boundary and moved route math into dedicated navigation helpers |
| 5.2 | `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 176/176 baseline before PR9 edits | ✅ Imported non-existent `moveHomeSelection()` / `activateHomeSelection()` behavior first so the RED state proved the new route-selection contract was missing | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 181/181 after extending `navigation.mjs` and `scripts/tui.mjs` | ✅ Covered state-level selection helpers plus runtime Home marker/help rendering and route activation | ✅ Added small pure helpers in `navigation.mjs` and kept TUI mutations localized to `scripts/tui.mjs` |
| 6.1 | `tests/tui-shell.test.mjs`, `tests/tui-docs.test.mjs`, `tests/tui-configuration.test.mjs`, `tests/tui-status.test.mjs`, `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs tests/tui-docs.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs tests/tui-branding.test.mjs` → 181/181 baseline before PR10 edits | ✅ Added failing accessibility assertions first for `[selected]` markers, keyboard-help copy, plain-text branding-mode guidance, and text-first docs/screen wording | ✅ `pnpm test -- tests/tui-shell.test.mjs tests/tui-docs.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs tests/tui-branding.test.mjs` → 182/182 after the PR10 runtime/docs updates | ✅ Covered Home selection markers, narrow-terminal fallback copy, README/prompt guidance, and all three section-footers with explicit text-state cues | ✅ Kept the change text-first and localized to renderers/docs without expanding routes or actions |
| 6.2 | `tests/tui-docs.test.mjs` + manual verification | Mixed | ✅ `pnpm test -- tests/tui-shell.test.mjs tests/tui-docs.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs tests/tui-branding.test.mjs` → 182/182 before final evidence sync | ✅ Added failing docs/accessibility contract coverage before syncing README, prompt, apply-progress, and verify-report evidence | ✅ `pnpm test` → 182/182 plus bounded launcher/non-TTY/PTY smoke checks | ✅ Covered help/no-args/explicit-`tui` exit behavior, quoted-arg preservation, doctor environment note, and forced-TTY arrow navigation through Configuration, Status, and Model Profiles | ➖ Verification/docs slice only |
| 7.1 | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs` → 182/182 baseline before PR11 edits | ✅ Added failing import-first tests for the shared action framework before the new modules existed | ✅ `pnpm test -- tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 187/187 after the shared action infrastructure landed | ✅ Covered immutable argv builders, argv-only spawn execution, timeout/non-zero failures, confirm cancel, and output close recovery | ✅ Kept the tests at the fake-terminal/process boundary and avoided wiring section-specific real commands |
| 7.2 | `tests/tui-actions.test.mjs` | Unit | N/A (new) | ✅ Added manifest-builder and runner-contract assertions before creating the action helper modules | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 187/187 after adding definitions, runner, forms, and manifest argv helpers | ✅ Covered success, stderr failure, timeout kill, immutable argv copies, and shell-disabled spawn options | ✅ Kept the framework pure and future-ready by isolating argv validation and command execution helpers |
| 7.3 | `tests/tui-actions.test.mjs` + `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 182/182 baseline before interactive shell edits | ✅ Added failing modal/output interaction tests first for Enter confirm, Esc cancel/close, and focus return | ✅ `pnpm test -- tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 187/187 after wiring interactive selection + modal state into the shell | ✅ Covered route-local action selection, confirm gating for mutating actions, inline output rendering for read actions, and Esc/Enter recovery | ✅ Injected interactive actions into `createTuiApp()` so PR11 stays generic and PR12/PR13 can wire real section actions later |
| 8.1 | `tests/tui-configuration.test.mjs` + `tests/tui-status.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 191/191 baseline before PR12 edits | ✅ Added failing behavior tests first for inline doctor output, confirmed update/init, checkbox selection, and bounded error handling in Configuration/Status | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs` → 196/196 after wiring the PR12 flows | ✅ Covered Configuration doctor/output, Status doctor `--opencode`, update confirm/cancel, init checkbox submission, and post-action refresh | ✅ Kept assertions at the fake-terminal boundary while sharing the action framework from PR11 |
| 8.2 | `tests/tui-configuration.test.mjs` + `tests/tui-status.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 191/191 baseline before PR12 edits | ✅ Added failing section-state action-injection and exact-argv confirmation expectations before updating adapters/TUI wiring | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs` → 196/196 after adding interactive action definitions, checkbox builders, and inline output summaries | ✅ Covered state-provided interactive actions, safe manifest-backed `init` flags, and Status `doctor --opencode` mapping without fabricated commands | ✅ Localized new behavior to section adapters plus shared action helpers instead of adding one-off shell strings |
| 8.3 | `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-shell.test.mjs` → 191/191 baseline before PR12 keyboard-flow updates | ✅ Added failing shell-level guidance tests first for section action help, form cancel copy, and off-Home no-action responsiveness | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs` → 196/196 after README/TUI guidance updates | ✅ Covered interactive-action navigation help, form focus bounds, Esc cancel copy, and a route with zero interactive actions | ✅ Kept the user-facing guidance terse in README while reusing the shell renderers for the visible text cues |

### PR1 Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Preserve caller cwd for explicit commands | `tests/tui-dispatch.test.mjs` | Unit | ✅ Previous suite green at 130/130 | ✅ Added failing execution-metadata expectation for `init` cwd preservation | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 135/135 | ✅ Covered POSIX `init` plus Windows `init` / `update` execution metadata | ✅ Normalized execution options and threaded `cwd` through dispatcher spawn |
| Restore Windows explicit-command parity for `init` / `update` | `tests/tui-dispatch.test.mjs` | Unit | ✅ Previous suite green at 130/130 | ✅ Added failing Windows PowerShell mapping and argv-preservation expectations | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 135/135 | ✅ Verified spaced argv stays array-based and no Bash dependency is required on Windows for those commands | ✅ Extracted shell-specific execution builders to keep routing explicit |
| Guard CI-specific TTY behavior | `tests/tui-dispatch.test.mjs` | Unit | ✅ Previous suite green at 130/130 | ✅ Added failing cases for `isInteractiveTTY: true` + `isCI: true` no-args and explicit `tui` | ✅ `pnpm test -- tests/tui-dispatch.test.mjs` → 135/135 | ✅ Covered both no-args help path and explicit `tui` fail-fast path under CI | ➖ No further refactor needed beyond keeping `interactiveLaunch = isInteractiveTTY && !isCI` |

### PR3 Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Prevent nested `argv` mutation from poisoning shared manifest state | `tests/tui-command-manifest.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-command-manifest.test.mjs` → 144/144 | ✅ Added failing regression tests for exported entries, `getCommandManifest()`, and `getCommandManifestEntry()` nested mutation attempts | ✅ `pnpm test -- tests/tui-command-manifest.test.mjs` → 147/147 | ✅ Covered shared export, whole-manifest helper copy, and single-entry helper copy paths | ✅ Added `deepFreeze()` and `cloneFrozenEntry()` so all manifest surfaces remain immutable and copy-safe |

### PR4 Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Surface invalid/corrupt config failures as actionable Configuration status | `tests/tui-configuration.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-configuration.test.mjs` → 151/151 baseline before review-fix changes | ✅ Added failing regression coverage for invalid JSON, invalid config shape, and fail-state rendering guidance | ✅ `pnpm test -- tests/tui-configuration.test.mjs` → 154/154 | ✅ Covered invalid JSON + invalid `models.activeProfile` shape + failure rendering path | ✅ Extracted `formatModelConfigFailure()` so the adapter adds a TUI-specific repair/rerun hint while preserving the underlying cause |
| Preserve root-cause detail alongside PR4 repair guidance | `tests/tui-configuration.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-configuration.test.mjs` → 154/154 baseline before contract-tightening | ⚠️ Added stricter contract assertions first; implementation already satisfied them, so no new RED failure was observable | ✅ `pnpm test -- tests/tui-configuration.test.mjs` → 154/154 with explicit `invalid JSON` and `models.activeProfile must be a string or null` assertions | ✅ Covered both corrupt JSON and invalid-shape causes while keeping the actionable rerun guidance requirement | ➖ Test-only follow-up; no implementation refactor required |

### PR5 Reliability Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Cover the all-healthy Status adapter path with isolated temp fixtures | `tests/tui-status.test.mjs` | Unit | ✅ `pnpm test` → 158/158 baseline before adding the review-follow-up coverage | ⚠️ Added the behavior-level healthy-path assertions first; implementation already satisfied them, so no new RED failure was observable | ✅ `pnpm test -- tests/tui-status.test.mjs` → 159/159 and `pnpm test` → 159/159 | ✅ Covered valid model config, `.pi/APPEND_SYSTEM.md`, `CLAUDE.md`, OpenCode config, and managed-agent file presence in one isolated fixture | ➖ Test-only follow-up; no implementation refactor required |

### PR6 Reliability Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Return a renderable fail state instead of throwing on corrupt model config | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-model-profiles.test.mjs` → 163/163 baseline before adding the review-fix regressions | ✅ Added failing regression coverage first for invalid JSON and invalid `models.activeProfile` shape using isolated config dirs; the adapter threw instead of returning screen state | ✅ `pnpm test -- tests/tui-model-profiles.test.mjs` → 166/166 after catching loader failures and returning a fail summary | ✅ Covered invalid JSON + invalid-shape root causes, asserted repair guidance plus concrete cause text, and verified the screen renders the fail state without throwing | ✅ Kept the fix adapter-local with a shared fail-state formatter; the screen contract already handled empty lists cleanly |

### PR7 Documentation Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Include the PR7 docs-contract test file in rollback guidance | `tests/tui-docs.test.mjs` | Unit | ✅ `pnpm test` → 168/168 baseline before docs-contract tightening | ✅ Added failing assertions first requiring `tests/tui-docs.test.mjs` in README + prompt rollback guidance | ✅ `pnpm test -- tests/tui-docs.test.mjs` → 168/168 after updating rollback docs | ✅ Covered both user-facing README rollback notes and orchestrator prompt slice-boundary guidance | ➖ Docs-only follow-up; no runtime refactor needed |
| Annotate the final verification checklist with expected non-TTY outcomes | `tests/tui-docs.test.mjs` | Unit | ✅ `pnpm test` → 168/168 baseline before docs-contract tightening | ✅ Added failing assertions first requiring explicit non-TTY `./bin/afergon-ai` help/exit-0 and `./bin/afergon-ai tui` guidance/exit-1 expectations | ✅ `pnpm test -- tests/tui-docs.test.mjs` → 168/168 after checklist annotations landed | ✅ Covered README checklist expectations plus the prompt-level non-TTY contract | ➖ Docs-only follow-up; no runtime refactor needed |

### PR8 Reliability Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Prove externally visible startup-banner rendering still shows canonical branding and fallback copy after extraction | `tests/tui-branding.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-branding.test.mjs` → 173/173 baseline before adding the review-follow-up coverage | ✅ Added behavior-level fake `ExtensionAPI` / `UI` render assertions first for wide banner output and narrow-width fallback output | ✅ `pnpm test -- tests/tui-branding.test.mjs` → 176/176 and `pnpm test` → 176/176 after the startup-banner fallback render fix | ✅ Covered both the canonical-logo + tagline path and the plain-text fallback path at the rendered header boundary | ✅ Kept the fix local to `startup-banner.ts` by reusing the shared branding contract and existing width-safety helper |

### PR11 Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Clamp stale or out-of-range section action selection across route/action-list changes | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 187/187 baseline before PR11 review-fix regressions | ✅ Added a failing route-change regression first; stale selection `2` remained active after moving to a one-action route and could target a missing action | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 190/190 after resetting/clamping route-local action selection in navigation and TUI render/enter paths | ✅ Covered route reset plus render-time/execute-time normalization when action counts shrink | ✅ Kept the fix in shared navigation/TUI helpers so PR12/PR13 inherit the guardrails automatically |
| Sanitize raw stdout/stderr before rendering inline output | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 187/187 baseline before PR11 review-fix regressions | ✅ Added a failing output-panel regression first with ANSI CSI, OSC title payloads, bell, carriage return, and NUL bytes leaking into rendered output | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 190/190 after sanitizing control sequences in the shared output formatter | ✅ Covered preserved readable text plus neutralized CSI, OSC, bell, carriage-return, and NUL payloads | ✅ Localized sanitization to the shared output formatter so runner capture remains lossless while terminal rendering stays safe |
| Prevent fabricated executable action argv outside the stable manifest allowlist | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 187/187 baseline before PR11 review-fix regressions | ✅ Added a failing definition-level regression first where `bash -lc ...` was accepted as an executable action | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 190/190 after branding manifest-built argv arrays and rejecting unbranded command lists | ✅ Covered both unsafe raw argv rejection and safe manifest-built `doctor --opencode` acceptance | ✅ Kept the enforcement in the manifest/definition boundary so future PR12/PR13 actions cannot accidentally invent dispatcher commands |
| Strip C1 terminal controls and C1 CSI/OSC payloads before rendering inline output | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 190/190 baseline before the PR11 risk re-review follow-up | ✅ Added a failing sanitizer regression first for `U+009B` CSI, `U+009D` OSC, and remaining C1 bytes leaking into rendered output | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 191/191 after extending the sanitizer to remove C1 CSI/OSC sequences and neutralize residual C1 controls | ✅ Covered preserved printable text/newlines plus removed C1 CSI color payloads, removed C1 OSC title payloads, and neutralized standalone C1 controls | ✅ Kept the fix local to `sanitizeTerminalOutput()` so captured process output stays unchanged and PR12 action wiring remains untouched |

### PR12 Reliability Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Bound runner stdout/stderr accumulation so large command output cannot grow unbounded in memory | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 191/191 baseline before the PR12 reliability blocker follow-up | ✅ Added a failing runner regression first for oversized stdout/stderr capture with truncation metadata expectations; existing runner kept the full streams and exposed no truncation signal | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 198/198 after adding per-stream byte/line caps and truncation flags in the shared runner | ✅ Covered mixed stdout/stderr failure output, preserved non-zero exit behavior, and verified both streams report truncation independently | ✅ Kept the fix local to the shared runner so PR12/PR13 section actions inherit bounded capture without changing command routing |
| Cap output-panel rendering and show a visible truncation marker instead of dumping every captured line | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 191/191 baseline before the PR12 reliability blocker follow-up | ✅ Added a failing output-panel regression first for oversized sanitized output; the panel rendered every available line with no truncation cue | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 198/198 after bounding rendered output lines/bytes and appending `[output truncated]` | ✅ Covered line-cap truncation, byte-cap truncation, and upstream runner-truncated results without regressing the close/help footer | ✅ Localized the rendering cap to shared output formatting so section screens stay unchanged while inline output remains review-safe |

### PR12 Exact-Boundary Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Do not mark `stdoutTruncated` / `stderrTruncated` true when capture lands exactly on the configured byte or line limit | `tests/tui-actions.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 198/198 baseline before the exact-boundary follow-up | ✅ Added a failing regression first for exact-line stdout plus exact-byte stderr boundaries; the collector reported `stdoutTruncated: true` even though no content was omitted | ✅ `pnpm test -- tests/tui-actions.test.mjs` → 199/199 after removing the eager post-append truncation flip | ✅ Covered exact line-boundary stdout and exact byte-boundary stderr in one runner-level case while preserving the existing over-limit truncation regression | ✅ Simplified the collector so truncation is set only when an additional character cannot be stored, preserving existing over-limit behavior |
| 9.1 | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs` → 7/7 baseline before PR13 edits | ✅ Added failing assertions first for missing Model Profiles browse/create/save flows, inline output, and destructive behavior before implementation | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs` → 9/9 after PR13 implementation | ✅ Covered direct focused-profile `switch`, create-name entry, confirmed `profile delete`, explicit assignment-editor `S` save, cancel recovery, and refresh-after-mutation | ✅ Reused isolated config fixtures plus a focused action executor so the tests stay behavior-first without mutating user config |
| 9.2 | `tests/tui-model-profiles.test.mjs` + `tests/tui-shell.test.mjs` | Unit | ✅ `pnpm vitest run tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 24/24 baseline before shared-form edits | ✅ Added failing expectations first for create-name/assignment-entry form metadata, generic modal rendering, and Model Profiles action execution before extending the shared framework | ✅ `pnpm vitest run tests/tui-docs.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs tests/tui-model-profiles.test.mjs` → 35/35 after wiring shared create-name/assignment-entry forms and Model Profiles actions | ✅ Covered form rendering, Esc cancel, output close, shared framework regressions, and refreshed route state after successful mutations | ✅ Kept the implementation in shared form helpers plus the Model Profiles adapter so Configuration/Status behavior stayed green |
| 9.3 | `tests/tui-docs.test.mjs` + bounded PTY smoke | Mixed | ✅ `pnpm vitest run tests/tui-docs.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs tests/tui-model-profiles.test.mjs` → 35/35 before final evidence sync | ✅ Added README contract assertions first for Model Profiles inline actions, direct switch/save behavior, and refresh behavior before updating docs/evidence | ✅ `pnpm test` → 201/201 plus bounded forced-TTY smoke for direct switch, assignment-editor entry, confirmed delete, cancel, and refreshed active profile | ✅ Covered browse/profile-list navigation, switched active profile to `fallback` via focused-profile activation (current UX: `Enter`), entered the assignment editor with `U`, canceled confirmed delete safely, and preserved keyboard-only exit flow in a temp config fixture | ➖ Verification/docs slice only |

### PR13 Review Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Block empty assignment-entry / profile-create text submissions and keep focus recoverable | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 33/33 baseline before the PR13 review-fix edits | ✅ Added failing form-submission regressions first for empty model/profile text plus explicit `--allow-unknown` preservation | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 37/37 after required-field validation landed | ✅ Covered empty assignment entry, empty profile create, recoverable focus on the invalid field, and model text that stays positional unless the explicit toggle is enabled | ✅ Kept the fix in shared field-validation helpers plus adapter metadata so the current browse/editor flows stayed unchanged |
| Require submit/cancel alert before `models profile delete` executes | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 33/33 baseline before the PR13 review-fix edits | ✅ Added failing cancel/success regressions first for delete confirmation before execution | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 37/37 after confirmation handling landed | ✅ Covered Esc cancels safely and sanitized visible text still matches the selected profile on success | ✅ Reused the existing confirm pipeline by adding confirmation metadata instead of inventing a one-off delete form |
| Sanitize model/profile/config strings in screen, form, and confirmation rendering | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 33/33 baseline before the PR13 review-fix edits | ✅ Added failing regressions first for ANSI/C1/control payloads leaking through screen rendering and delete confirmation surfaces | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` → 37/37 after shared sanitization was applied to render paths | ✅ Covered screen summaries, profile names, resolved model assignments, confirmation prompts, and sanitized argv display without mutating the underlying action argv | ✅ Localized sanitization to shared render helpers plus the Model Profiles screen so command execution semantics remained unchanged |

### PR13 Final Risk Warning Fix Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Sanitize Configuration screen labels, details, and path text before terminal rendering | `tests/tui-configuration.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs` → 205/205 baseline before the final risk-warning follow-up | ✅ Added a failing regression first with ANSI CSI, OSC, C1 CSI/OSC, and C1 control bytes in configuration labels/details/action text; raw payloads reached rendered lines | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs` → 207/207 after sanitizing Configuration screen lines before truncation | ✅ Covered item labels, item detail/path text, action labels, and action descriptions while preserving visible text and `[ok]` state markers | ✅ Reused the existing shared `sanitizeTerminalOutput()` helper instead of adding a new screen-specific sanitizer |
| Sanitize Status screen labels, details, and path text before terminal rendering | `tests/tui-status.test.mjs` | Unit | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs` → 205/205 baseline before the final risk-warning follow-up | ✅ Added a failing regression first with ANSI CSI, OSC, C1 CSI/OSC, and C1 control bytes in readiness, status-item, and action text; raw payloads reached rendered lines | ✅ `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs` → 207/207 after sanitizing Status screen lines before truncation | ✅ Covered readiness labels/details, status item labels/details, action descriptions, and path strings while preserving readable text plus `[warn]` / `[fail]` markers | ✅ Reused the shared output sanitizer at the screen-render boundary so underlying status data stays unchanged |

### Post-verify Safety Contract Evidence
| Finding | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|------------|-----|-------|-------------|----------|
| Lock empty create-name submit, empty assignment-model submit, delete confirmation typing ignored, and delete success/refresh as explicit user-visible contracts | `tests/tui-model-profiles.test.mjs` | Unit | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs` → 27/27 baseline before the new safety-contract assertions | ✅ Added the four behavior-first assertions before artifact sync; the first draft failed at 29 passed / 2 failed because the assertions assumed the wrong browse/output details | ✅ `pnpm vitest run tests/tui-model-profiles.test.mjs` → 32/32 after refining the tests to the shipped Enter-driven UX and rerunning the focused suite, then current `pnpm test` → 173/173 | ✅ Covered empty create-name submit, empty assignment-model submit, ignored typing in delete confirmation, and delete success followed by refreshed browse state | ➖ Test-and-artifact follow-up only; runtime behavior already satisfied the safety contract |

### Test Summary
- **Historical tests added across all TDD slices**: 87
- **Historical passing checkpoints recorded across all slices**: 207
- **Current release evidence**: see the focused 2026-07-09 reruns and final full-suite `pnpm test` entry below; the historical totals above are cumulative, not the current suite size.
- **Layers used**: Unit (76), Integration (0), E2E (0)
- **Approval tests** (refactoring): None — no behavior-preserving refactor-only task
- **Pure functions created**: 80 (previous 75 plus `clearValidationMessage`, `validateFormInput`, `appendConfirmationCharacter`, `backspaceConfirmationCharacter`, and `validateConfirmationState`)

### Verification
- `pnpm test -- tests/model-profiles.test.mjs` ✅ baseline 120/120 before launcher edits
- `pnpm test -- tests/tui-dispatch.test.mjs` ✅ 130/130 after dispatcher implementation
- `pnpm test` ✅ 130/130
- `pnpm test -- tests/tui-dispatch.test.mjs` ✅ 135/135 after PR1 review-blocker regression tests and fixes
- `pnpm test` ✅ 135/135 after PR1 review-blocker fixes
- `./bin/afergon-ai --help` ✅ explicit help prints dispatcher usage
- `./bin/afergon-ai` ✅ non-TTY no-args prints help and exits 0
- `./bin/afergon-ai tui` ✅ non-TTY explicit `tui` fails fast with guidance
- `AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai` ✅ routes to PR1 TUI placeholder target
- `AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui` ✅ routes to PR1 TUI placeholder target
- `./bin/afergon-ai doctor --opencode` ✅ explicit command bypass preserved (doctor ran; reported pre-existing local OpenCode install gaps)
- `./bin/afergon-ai models show "budget profile"` ✅ quoted argument forwarded intact to models CLI and rejected as one profile name
- `pnpm test -- tests/tui-shell.test.mjs` ✅ 140/140 after PR2 shell/navigation implementation
- `pnpm test` ✅ 140/140 after PR2 shell/navigation implementation
- `printf 'q' | AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai` ✅ launcher opens the real shell and exits cleanly on `q`
- `printf '\033' | AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui` ✅ explicit `tui` shell exits cleanly on Esc
- `pnpm test -- tests/tui-command-manifest.test.mjs` ✅ 144/144 after PR3 manifest implementation
- `pnpm test` ✅ 144/144 after PR3 manifest implementation
- `pnpm test -- tests/tui-command-manifest.test.mjs` ✅ 147/147 after PR3 immutability regression coverage and deep-freeze fix
- `pnpm test` ✅ 147/147 after PR3 immutability review fix
- `pnpm test -- tests/tui-shell.test.mjs` ✅ baseline 147/147 before Configuration-route shell edits
- `pnpm test -- tests/tui-configuration.test.mjs` ✅ 151/151 after PR4 configuration adapter/screen implementation
- `pnpm test` ✅ 151/151 after PR4 configuration slice
- `pnpm test -- tests/tui-configuration.test.mjs` ✅ 151/151 baseline before PR4 review-fix regression coverage
- `pnpm test -- tests/tui-configuration.test.mjs` ❌ 151 passed / 3 failed after adding invalid/corrupt config regression tests first (RED confirmed)
- `pnpm test -- tests/tui-configuration.test.mjs` ✅ 154/154 after PR4 review-fix implementation
- `pnpm test` ✅ 154/154 after PR4 review-fix implementation
- `pnpm test -- tests/tui-configuration.test.mjs` ✅ 154/154 after tightening the PR4 root-cause preservation contract (test-only)
- `pnpm test` ✅ 154/154 after the PR4 root-cause preservation follow-up
- `AFERGON_AI_FORCE_TTY=1 python3 <pty-smoke>` ✅ explicit `tui` PTY smoke exited 0 after injected navigation/exit keys; detailed route rendering remains covered by unit tests because terminal capture is ANSI-noisy
- `pnpm test -- tests/tui-configuration.test.mjs` + `pnpm test -- tests/tui-shell.test.mjs` ✅ 154/154 baseline before PR5 status edits
- `pnpm test -- tests/tui-status.test.mjs` ❌ failed immediately with `Cannot find module '../scripts/lib/tui/screens/status.mjs'` after adding the status contract first (RED confirmed)
- `pnpm test -- tests/tui-status.test.mjs` ✅ 158/158 after PR5 status implementation
- `pnpm test` ✅ 158/158 after PR5 status slice
- `AFERGON_AI_FORCE_TTY=1 python3 <status-pty-smoke>` ✅ live TUI smoke visited Home → Status → Home and exited cleanly after injected `s`, `h`, and `q`
- `pnpm test` ✅ 158/158 baseline before the PR5 healthy-path review follow-up
- `pnpm test -- tests/tui-status.test.mjs` ✅ 159/159 after adding isolated all-healthy temp-fixture coverage
- `pnpm test` ✅ 159/159 after the PR5 healthy-path review follow-up
- `pnpm test -- tests/tui-model-profiles.test.mjs` ❌ failed immediately with `Cannot find module '../scripts/lib/tui/model-profiles-adapter.mjs'` after adding the PR6 contract first (RED confirmed)
- `pnpm test -- tests/tui-model-profiles.test.mjs` ✅ 163/163 after PR6 model-profile adapter/screen/navigation implementation
- `pnpm test -- tests/tui-model-profiles.test.mjs tests/tui-shell.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs` ✅ 163/163 focused TUI slice verification after PR6
- `pnpm test` ✅ 163/163 after PR6 model-profile slice
- `AFERGON_AI_FORCE_TTY=1 python3 <model-profiles-pty-smoke>` ✅ explicit `tui` PTY smoke visited Home → Model Profiles → Home and exited 0 after injected `m`, `h`, and `q` keys
- `pnpm test -- tests/tui-model-profiles.test.mjs` ✅ 163/163 baseline before PR6 reliability regression coverage
- `pnpm test -- tests/tui-model-profiles.test.mjs` ❌ 164 passed / 2 failed after adding invalid JSON + invalid-shape fail-state regressions first (RED confirmed)
- `pnpm test -- tests/tui-model-profiles.test.mjs` ✅ 166/166 after PR6 reliability review fix
- `pnpm test` ✅ 166/166 after PR6 reliability review fix
- `pnpm test -- tests/tui-docs.test.mjs` ❌ 167 passed / 1 failed after adding the final README verification-checklist contract first (RED confirmed)
- `pnpm test -- tests/tui-docs.test.mjs` ✅ 168/168 after the README/prompt docs update
- `pnpm test` ✅ 168/168 final full-suite verification
- `./bin/afergon-ai --help` ✅ explicit help still prints the dispatcher usage
- `./bin/afergon-ai` ✅ non-TTY no-args still prints help and exits 0
- `./bin/afergon-ai tui` ✅ non-TTY explicit `tui` still fails fast with guidance and exit 1
- `./bin/afergon-ai doctor --opencode` ✅ explicit command bypass preserved; the command executed and reported pre-existing local OpenCode install gaps (non-zero environment status unchanged)
- `./bin/afergon-ai models show "budget profile"` ✅ quoted argument stayed intact as one profile name and was rejected by existing validation
- `AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui` ✅ forced-TTY PTY smoke reached Configuration → Home, Status → Home, and Model Profiles → Home, then exited cleanly with `q`
- `pnpm test -- tests/tui-docs.test.mjs` ❌ 166 passed / 2 failed after adding PR7 review-follow-up assertions for rollback file-set coverage and documented non-TTY `tui` expectations first (RED confirmed)
- `pnpm test -- tests/tui-docs.test.mjs` ✅ 168/168 after the PR7 rollback/checklist docs update
- `pnpm test` ✅ 168/168 after the PR7 docs review follow-up
- `pnpm test -- tests/tui-shell.test.mjs` ✅ 168/168 baseline before PR8 branding extraction
- `pnpm test -- tests/tui-branding.test.mjs` ❌ failed immediately with `Cannot find module '../scripts/lib/branding/logo.mjs'` after adding the shared-branding contract first (RED confirmed)
- `pnpm test -- tests/tui-branding.test.mjs tests/tui-shell.test.mjs` ✅ 173/173 after PR8 branding extraction and Home rendering updates
- `pnpm test` ✅ 173/173 after the PR8 branding slice
- `pnpm test -- tests/tui-branding.test.mjs` ✅ 173/173 baseline before the PR8 reliability review follow-up
- `pnpm test -- tests/tui-branding.test.mjs` ❌ 175 passed / 1 failed after adding behavior-level startup-banner render coverage first for narrow-width fallback output (RED confirmed)
- `pnpm test -- tests/tui-branding.test.mjs` ✅ 176/176 after adding startup-banner fallback rendering for unsafe widths
- `pnpm test` ✅ 176/176 after the PR8 reliability review follow-up
- `pnpm test -- tests/tui-shell.test.mjs` ✅ 176/176 baseline before PR9 Home-navigation edits
- `pnpm test -- tests/tui-shell.test.mjs` ❌ 176 passed / 5 failed after adding PR9 Home-selection, arrow-wrap, Enter-activation, shortcut-regression, and no-hang assertions first (RED confirmed)
- `pnpm test -- tests/tui-shell.test.mjs` ✅ 181/181 after adding Home selection state, arrow/Enter handling, and visible focus markers
- `pnpm test` ✅ 181/181 after the PR9 Home arrow-navigation slice
- `pnpm test -- tests/tui-shell.test.mjs tests/tui-docs.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs tests/tui-branding.test.mjs` ✅ 181/181 baseline before PR10 accessibility-polish edits
- `pnpm test -- tests/tui-shell.test.mjs tests/tui-docs.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs` ❌ 174 passed / 8 failed after adding PR10 accessibility/docs assertions first (RED confirmed)
- `pnpm test -- tests/tui-shell.test.mjs tests/tui-docs.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs tests/tui-branding.test.mjs` ✅ 182/182 after PR10 accessibility/runtime/docs updates
- `pnpm test` ✅ 182/182 final full-suite verification after PR10
- `./bin/afergon-ai --help` ✅ explicit help still prints dispatcher usage and exits 0
- `./bin/afergon-ai` ✅ non-TTY no-args still prints help and exits 0
- `./bin/afergon-ai tui` ✅ non-TTY explicit `tui` still fails fast with guidance and exit 1
- `./bin/afergon-ai doctor --opencode` ✅ explicit command bypass preserved; exits 1 only because of pre-existing local OpenCode registration gaps
- `./bin/afergon-ai models show "budget profile"` ✅ quoted spaced argument still stays intact as one invalid profile name and is rejected by existing validation
- `AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui` via bounded PTY smoke ✅ exited 0 after arrow-key navigation reached Configuration, Status, and Model Profiles, returned Home with `h`, and exited with `q`; transcript also retained Home keyboard-help copy
- `pnpm test -- tests/tui-shell.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-model-profiles.test.mjs` ✅ 182/182 baseline before PR11 interactive-action edits
- `pnpm test -- tests/tui-actions.test.mjs` ❌ failed immediately with `Cannot find module '../scripts/lib/tui/actions/definitions.mjs'` after adding the PR11 contract first (RED confirmed)
- `pnpm test -- tests/tui-actions.test.mjs tests/tui-shell.test.mjs` ✅ 187/187 after the shared action framework implementation
- `pnpm test` ✅ 187/187 final full-suite verification after PR11
- `pnpm test -- tests/tui-actions.test.mjs` ❌ 187 passed / 3 failed after adding PR11 review-fix regressions first for stale selection, output sanitization, and manifest allowlist enforcement (RED confirmed)
- `pnpm test -- tests/tui-actions.test.mjs` ✅ 190/190 after the PR11 review-fix implementation
- `pnpm test` ✅ 190/190 after the PR11 review fixes
- `pnpm test -- tests/tui-actions.test.mjs` ❌ 190 passed / 1 failed after adding the PR11 risk re-review regression first for C1 CSI/OSC and residual C1 controls (RED confirmed)
- `pnpm test -- tests/tui-actions.test.mjs` ✅ 191/191 after extending `sanitizeTerminalOutput()` for C1 control handling
- `pnpm test` ✅ 191/191 after the PR11 risk re-review fix
- `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs` ❌ 191 passed / 5 failed after adding PR12 behavior-first Configuration/Status action tests before implementation (RED confirmed)
- `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs` ✅ 196/196 after the PR12 Configuration/Status action implementation
- `pnpm test` ✅ 196/196 after the PR12 slice
- `pnpm test -- tests/tui-actions.test.mjs` ❌ 196 passed / 2 failed after adding PR12 reliability blocker regressions first for bounded runner capture and output-panel truncation (RED confirmed)
- `pnpm test -- tests/tui-actions.test.mjs` ✅ 198/198 after the PR12 reliability blocker fix
- `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs` ✅ 198/198 after the PR12 reliability blocker regression sweep
- `pnpm test` ✅ 198/198 after the PR12 reliability blocker fix
- `pnpm test -- tests/tui-actions.test.mjs` ❌ 198 passed / 1 failed after adding the PR12 exact-boundary truncation regression first (RED confirmed)
- `pnpm test -- tests/tui-actions.test.mjs` ✅ 199/199 after the bounded collector stopped flagging exact-boundary output as truncated
- `pnpm test -- tests/tui-actions.test.mjs tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-shell.test.mjs` ✅ 199/199 after the PR12 focused regression sweep
- `pnpm test` ✅ 199/199 after the PR12 exact-boundary truncation fix
- `pnpm vitest run tests/tui-model-profiles.test.mjs` ❌ 6 passed / 3 failed after adding PR13 Model Profiles interaction assertions first (RED confirmed)
- `pnpm vitest run tests/tui-model-profiles.test.mjs` ✅ 9/9 after PR13 Model Profiles interactive action implementation
- `pnpm vitest run tests/tui-docs.test.mjs tests/tui-shell.test.mjs tests/tui-actions.test.mjs tests/tui-model-profiles.test.mjs` ✅ 35/35 after the shared picker/field form flow and Model Profiles docs update
- `pnpm test` ✅ 201/201 after the PR13 slice
- `AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui` via bounded PTY smoke ✅ temp-fixture run switched to `fallback` via the direct profile-switch key, entered the assignment editor from browse mode, canceled the confirmed delete flow safely, refreshed the Model Profiles section state, and exited with `q`
- `pnpm vitest run tests/tui-model-profiles.test.mjs` ❌ 9 passed / 4 failed after adding PR13 review-fix regressions first for empty field validation, delete confirmation, and sanitized rendering (RED confirmed)
- `pnpm vitest run tests/tui-model-profiles.test.mjs` ✅ 13/13 after the PR13 review-fix implementation
- `pnpm vitest run tests/tui-model-profiles.test.mjs tests/tui-actions.test.mjs tests/tui-shell.test.mjs` ✅ 37/37 after the focused PR13 review-fix regression sweep
- `pnpm test` ✅ 205/205 after the PR13 review-fix full-suite verification
- `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs` ❌ 205 passed / 2 failed after adding the final risk-warning screen-sanitization regressions first (RED confirmed)
- `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs` ✅ 207/207 after sanitizing Configuration/Status render lines
- `pnpm test -- tests/tui-configuration.test.mjs tests/tui-status.test.mjs tests/tui-actions.test.mjs` ✅ 207/207 after the focused risk regression sweep
- `pnpm test` ✅ 207/207 after the final Configuration/Status sanitization fix
- `pnpm vitest run tests/tui-model-profiles.test.mjs` ❌ 29 passed / 2 failed after adding the empty-submit and typed-delete safety-contract assertions first (RED confirmed; expectations needed alignment with the shipped browse/output UX)
- `pnpm vitest run tests/tui-model-profiles.test.mjs` ✅ 32/32 after refining the new safety-contract assertions and rerunning the current focused Model Profiles suite
- `pnpm vitest run tests/tui-docs.test.mjs` ✅ 2/2 after the artifact-count wording check
- `pnpm test` ✅ 173/173 after the Enter-driven Model Profiles docs-contract and artifact-count follow-up rerun

### Deviations from Design
None — test coverage and artifacts now match the shipped Model Profiles UX.

### Issues Found
`./bin/afergon-ai doctor --opencode` still reports pre-existing local OpenCode registration gaps outside this slice. This remediation does not change that environment issue.

### Remaining Tasks
- [ ] None.

### Workload / PR Boundary
- Mode: stacked PR slice
- Current work unit: Post-verify safety-contract + artifact-count remediation
- Boundary: starts after the verified PR13 final risk-warning slice and ends with added Model Profiles behavior coverage plus corrected OpenSpec verification counts only; no runtime code changes
- Estimated review budget impact: minimal follow-up diff limited to one test file and two OpenSpec artifacts

### Status
24/24 tasks complete. Ready for verify.
