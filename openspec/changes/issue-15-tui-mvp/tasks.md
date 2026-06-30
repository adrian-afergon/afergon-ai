# Tasks: TUI Interactive Command Surface MVP

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 1350-1850 total across 10 PRs |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8 → PR9 → PR10 |
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

Gate: if PR8-PR10 forecast reaches 350-400 lines, split again before apply; otherwise stop for `size:exception` approval.

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
