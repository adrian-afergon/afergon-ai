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

### Test Summary
- **Total tests written**: 62
- **Total tests passing**: 182
- **Layers used**: Unit (59), Integration (0), E2E (0)
- **Approval tests** (refactoring): None — no behavior-preserving refactor-only task
- **Pure functions created**: 35 (`formatHelp`, `resolveDispatchPlan`, `resolveExecutionOptions`, `buildBashExecution`, `buildPowerShellExecution`, `buildExecution`, `createNavigationState`, `navigateTo`, `assertHomeSelection`, `moveHomeSelection`, `activateHomeSelection`, `shouldExitTui`, `renderHomeScreen`, `deepFreeze`, `cloneEntry`, `cloneFrozenEntry`, `getCommandManifest`, `getCommandManifestEntry`, `createAction`, `formatModelConfigFailure`, `renderConfigurationScreen`, `createActions`, `addGuidance`, `summarizeItems`, `renderStatusScreen`, `createStableModelsAction`, `createSupportedActions`, `summarizeProfiles`, `getModelProfilesScreenState`, `renderProfiles`, `renderAssignments`, `renderSupportedActions`, `renderModelProfilesScreen`, `getBrandingLines`, `canRenderBrandingLogo`)

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

### Deviations from Design
None — implementation matches the PR10 accessibility-polish design intent and keeps route/action scope unchanged.

### Issues Found
`./bin/afergon-ai doctor --opencode` still reports pre-existing local OpenCode registration gaps outside this slice. Dispatcher routing preserved the command path; no launcher fix required for that environment state.

PR1 review blockers also exposed that the dispatcher was forcing subprocess `cwd` to the package root and routing Windows `init` / `update` through Bash-only scripts. Both regressions are fixed in this slice.

PR3 review also exposed that the shared manifest only froze top-level entries, leaving nested `argv` arrays mutable. This slice now deep-freezes exported entries and deep-frozen helper copies so callers cannot mutate or poison shared manifest state.

PR4 reliability review exposed that invalid/corrupt config failures reached the Configuration screen only as the lower-level loader message. This slice now adds a TUI-specific repair/rerun hint while preserving the root-cause detail and covers invalid JSON plus invalid-shape regressions.

The remaining PR4 follow-up confirmed the implementation already preserved the root-cause detail; that batch tightened the test contract so both actionable guidance and concrete causes stay locked for invalid JSON and invalid-shape failures.

The PR5 reliability review follow-up confirmed the Status adapter already returned the healthy summary correctly; this batch locked that path with isolated temp fixtures covering model config, project install files, and managed OpenCode files together.

PTY smoke capture for the live TUI is ANSI-noisy, so detailed Configuration-route and Status-route assertions stay in the unit test harness instead of string-matching raw terminal frames.

PR6 reused `scripts/lib/model-profiles.mjs` directly for read-only TUI state, so `scripts/models.mjs` did not need a new export surface and the CLI `main()` behavior remained intact.

PR6 reliability review exposed that corrupt model config still threw from the Model Profiles adapter. This slice now matches the Configuration/Status failure-handling pattern by returning a renderable fail summary with repair guidance plus the underlying loader cause.

Final verification confirmed that `./bin/afergon-ai doctor --opencode` still exits non-zero only because of pre-existing local OpenCode registration gaps. The launcher/dispatcher path remained intact, so this stays an environment note rather than a PR7 regression.

PR7 documentation review warned that the rollback notes omitted `tests/tui-docs.test.mjs` and that the checklist did not spell out the expected non-TTY `tui` failure contract. This follow-up locks both requirements in the docs contract test and mirrors them in README/prompt guidance without expanding runtime scope.

PR8 confirmed there is still no separate charset-specific artwork source in the repo, so the shared branding API exposes only the canonical default banner and explicit fallback copy. Unknown variants resolve to `undefined` rather than fabricated art.

The PR8 reliability follow-up showed that startup-banner tests only proved shared-branding identity, not the rendered header output. Narrow widths would have truncated the canonical art until the header renderer reused the existing width-safety helper and switched to fallback branding text.

PR9 confirmed the existing shell tolerated unknown input without hanging; the focused work added explicit Home-only arrow/Enter handling while leaving off-Home arrow/Enter input inert so the current section flow stays stable.

PR10 confirmed the existing text-first state labels were already strong in the data rows; the remaining gap was discoverable keyboard guidance and an explicit `[selected]` marker on Home. The final slice closes that gap without adding new screens or actions.

### Remaining Tasks
- None.

### Workload / PR Boundary
- Mode: stacked PR slice
- Current work unit: PR10 — accessibility polish + docs/final verify
- Boundary: starts after the verified PR9 Home-navigation slice and ends with explicit keyboard-help copy, `[selected]` text markers, plain-text branding guidance, docs/prompt accessibility notes, and final verification evidence
- Estimated review budget impact: focused text/docs/test updates plus artifact sync; stayed below the chained review budget guard

### Status
15/15 tasks complete. Ready for verify.
