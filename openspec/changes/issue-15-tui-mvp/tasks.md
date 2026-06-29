# Tasks: TUI Interactive Command Surface MVP

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 2150-2900 total across 13 PRs |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8 → PR9 → PR10 → PR11 → PR12 → PR13 |
| Delivery strategy | auto-chain (forced chained) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Launcher + dispatcher parity | PR1 | base main; complete |
| 2 | TUI shell + home route | PR2 | base main after PR1; complete |
| 3 | CLI-equivalent manifest | PR3 | base main after PR2; complete |
| 4 | Configuration screen | PR4 | base main after PR3; complete |
| 5 | Status screen | PR5 | base main after PR4; complete |
| 6 | Model Profiles screen | PR6 | base main after PR5; complete |
| 7 | Docs + final MVP verify | PR7 | base main after PR6; complete |
| 8 | Branding/logo extraction | PR8 | base main after PR7; target 140-220 lines |
| 9 | Home arrow navigation + focus | PR9 | base main after PR8; target 180-280 lines |
| 10 | Accessibility polish + final verify | PR10 | base main after PR9; target 120-200 lines |
| 11 | Shared TUI action framework + runner | PR11 | base main after PR10; target 220-320 lines |
| 12 | Configuration + Status interactive actions | PR12 | base main after PR11; target 260-360 lines |
| 13 | Model Profiles interactive actions | PR13 | base main after PR12; target 300-390 lines |

Gate: if PR11-PR13 forecast reaches 350-400 lines, split again before apply; otherwise stop for `size:exception` approval.

## Phase 1: Launcher and Shell Foundations
- [x] 1.1 Refresh `openspec/config.yaml` test metadata to Vitest / `pnpm test`.
- [x] 1.2 Add `tests/tui-dispatch.test.mjs`; create `scripts/cli-dispatch.mjs`; update `bin/afergon-ai*`.
- [x] 1.3 Add `tests/tui-shell.test.mjs`; create `scripts/tui.mjs` and `scripts/lib/tui/navigation.mjs`.

## Phase 2: MVP Screens
- [x] 2.1 Add `tests/tui-command-manifest.test.mjs`; create `scripts/lib/tui/command-manifest.mjs`.
- [x] 2.2 Add `tests/tui-configuration.test.mjs`; create configuration adapter + screen files.
- [x] 2.3 Add `tests/tui-status.test.mjs`; extend shared adapter; create `screens/status.mjs`.
- [x] 2.4 Add `tests/tui-model-profiles.test.mjs`; create model-profiles adapter + screen files.

## Phase 3: MVP Docs and Verify
- [x] 3.1 Update `README.md` and `prompts/afergon-ai.md` for launcher/TUI contracts.
- [x] 3.2 Finalize `pnpm test`, launcher parity, and forced-TTY manual verification evidence.

## Phase 4: PR8 Branding Extraction
- [x] 4.1 RED/GREEN: add `tests/tui-branding.test.mjs`; create `scripts/lib/branding/logo.mjs` with canonical lines, tagline, and fallback copy only.
- [x] 4.2 Update `extensions/startup-banner.ts` and `scripts/tui.mjs` to import the shared branding source without inventing charset variants.

## Phase 5: PR9 Home Arrow Navigation
- [x] 5.1 RED/GREEN: extend `tests/tui-shell.test.mjs` for `up/down/enter` and retained `c/s/m/h` shortcuts.
- [x] 5.2 Update `scripts/lib/tui/navigation.mjs` and `scripts/tui.mjs` with Home selection state, visible markers, and route activation.

## Phase 6: PR10 Accessibility Polish and Verify
- [x] 6.1 RED/GREEN: update `tests/tui-shell.test.mjs`, `tests/tui-docs.test.mjs`, and affected screen tests for non-color-only focus, help/exit hints, and fallback branding text.
- [x] 6.2 Update `scripts/lib/tui/screens/*.mjs`, `README.md`, `prompts/afergon-ai.md`, `apply-progress.md`, and `verify-report.md`; rerun `pnpm test` plus forced-TTY arrow smoke.

## Phase 7: PR11 Shared Action Framework
- [x] 7.1 RED/GREEN: add `tests/tui-actions.test.mjs` for argv-only execution, read-only inline output, confirm-before-mutate, and Esc/Cancel recovery.
- [x] 7.2 Create `scripts/lib/tui/actions/definitions.mjs`, `scripts/lib/tui/actions/runner.mjs`, and `scripts/lib/tui/actions/forms.mjs`; extend `scripts/lib/tui/command-manifest.mjs` for stable action argv builders only.
- [x] 7.3 Update `scripts/tui.mjs` and `scripts/lib/tui/navigation.mjs` with section action selection, modal state, output panel, and focus-return helpers.

## Phase 8: PR12 Configuration and Status Actions
- [x] 8.1 RED/GREEN: extend `tests/tui-configuration.test.mjs` and `tests/tui-status.test.mjs` for inline `doctor`, confirmed `update`, confirmed `init`, checkbox flag selection, output/error rendering, and section refresh.
- [x] 8.2 Update `scripts/lib/tui/config-status-adapter.mjs`, `scripts/lib/tui/screens/configuration.mjs`, and `scripts/lib/tui/screens/status.mjs` to expose executable action lists, confirmation copy, and output-panel summaries.
- [x] 8.3 Update `tests/tui-shell.test.mjs` and `README.md` for section action keyboard flow, modal focus bounds, and cancel/escape guidance.

## Phase 9: PR13 Model Profiles Interactive Actions
- [x] 9.1 RED/GREEN: extend `tests/tui-model-profiles.test.mjs` for `models list/show` inline output plus picker/form-driven `switch`, `set`, `profile create`, and `profile delete` with no fabricated commands.
- [x] 9.2 Update `scripts/lib/tui/model-profiles-adapter.mjs` and `scripts/lib/tui/screens/model-profiles.mjs` for read-only action lists, mutating forms/pickers, confirmations, refresh-after-mutation, and bounded error/output panels.
- [x] 9.3 Update `tests/tui-docs.test.mjs`, `apply-progress.md`, and `verify-report.md`; rerun `pnpm test` plus forced-TTY smoke for inline output, cancel, confirm, and post-mutation refresh on temp fixtures.
