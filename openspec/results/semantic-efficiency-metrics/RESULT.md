# Semantic efficiency metrics — canonical completion evidence

This is the canonical evidence ledger for the `semantic-efficiency-metrics` change. It records what can be proved, leaves unavailable history outstanding, and does not authorize propagation or merge work.

## Review path

1. Check the covered heads and current cumulative verification.
2. Check the remediation and propagation ledgers.
3. Treat every `outstanding` item as unsatisfied. In particular, do not infer historical RED runs from commits that contain tests and implementation together.

## Status vocabulary

Every ledger row uses exactly one status:

- `produced` — the evidence and its observable result are recorded.
- `not applicable` — the item does not apply for the stated reason.
- `outstanding` — the evidence is unavailable, incomplete, stale, or awaits a future gate.

## Covered change and heads

| Scope | Head / commit | Recorded result |
| --- | --- | --- |
| PR #57 foundation boundary | `6c839cd58567d6cd24e1aa8877bb209e1891b073` | Source remained outside the later ReportQuery remediation; focused source-scope verification is still outstanding. |
| PR #60 ReportQuery and gap remediation | `51df84e800eb0c69dddb9f46c16673582c75b30f` | Commit time `2026-07-30T21:11:16+01:00`; approved remediation head. |
| PR #61 propagation | `70a18894c94931f0c676dccd7cbdad2c2725f964` | Commit time `2026-07-30T22:18:36+01:00`; approved propagation head. |
| PR #62 ancestry/compatibility | merge `c0d80c5c9281c6bc0f0cb02fa58933d00273f2f7`, result `4d2e10bfb42c875ccf02894f877856b61540f01d` | Commit times `2026-07-30T22:33:59+01:00` and `2026-07-31T08:16:31+01:00`; approved combined head. |
| PR #62 export remediation | `18c4d3442316fe0892cadf1f3d4d667d13d04ef3`, final `f688e07d8afc492c226953192a99cb148237f391` | Commit times `2026-07-31T11:04:39+01:00` and `2026-07-31T11:08:49+01:00`; approved final #62 head. |
| PR #63 parent propagation and evidence baseline | `ecff353858deea82fc45b3cf3e2c72466a539b68` | Commit time `2026-07-31T12:06:36+01:00`; verification below ran at `2026-07-31T11:31:25Z`–`2026-07-31T11:33:09Z`. |
| PR #63 canonical artifact publication | `f395cc80c0b2b79faa72f95e32879e4ef307ddde` | Artifact commit; focused/full/build/typecheck/runtime reran successfully before publication and all four publication-head CI jobs passed. |

PR #63 remained open on base `feat/semantic-efficiency-metrics-06-cli` at `f688e07d8afc492c226953192a99cb148237f391` when this artifact was prepared. PRs #81–#83 were excluded and observed unchanged at `56023dcae67ead554ef4d147ff9ad1f45d8fa8fb`, `4b4abc6b669157cc2d4c45971712e4d003837cf0`, and `c3f1fe44a1133b05a08e5302590f809c1e108906`.

## Current cumulative verification

All commands in this table ran in the clean isolated PR #63 worktree against `ecff353858deea82fc45b3cf3e2c72466a539b68`.

| Evidence item | Status | Exact command and observable result |
| --- | --- | --- |
| Focused remediation tests | produced | `pnpm exec vitest run tests/metrics-domain.test.ts tests/metrics-reporting.test.ts tests/metrics-export.test.ts tests/metrics-cli.test.ts --no-file-parallelism` → 4 files passed, 49 tests passed; start `2026-07-31T11:31:25Z`, duration 524 ms. |
| Build | produced | `pnpm build` → `tsx ./scripts/build-typescript.ts`, exit 0, run beginning `2026-07-31T11:31:37Z`. |
| Typecheck | produced | `pnpm typecheck` → `tsc -p tsconfig.runtime.json --noEmit`, exit 0, run beginning `2026-07-31T11:31:37Z`. |
| Runtime health | produced | `pnpm run health:runtime` → all `dist/scripts/cli-dispatch.js`, `models.js`, and `tui.js` imports succeeded; “Local dist runtime health check passed (no remote telemetry).” |
| Emitted CLI runtime | produced | With a new temporary `AFERGON_AI_CONFIG_DIR`: `node dist/scripts/metrics.js enable`; `node dist/scripts/metrics.js status`; `node dist/scripts/metrics.js report --group-by outcome` → “Metrics enabled.”, `{"enabled":true}`, then an outcome query with total `0`, rows `[]`, both gap counters `0`, and unavailable optional cost; exit 0 for all commands at `2026-07-31T11:33:09Z`. |
| Full suite | produced | `pnpm test` → build succeeded; 25 files passed, 2 skipped; 356 tests passed, 5 skipped; start `2026-07-31T11:31:37Z`, duration 59.62 s. |
| Diff hygiene and ancestry | produced | `git merge-base --is-ancestor f688e07 ecff353`; `git rev-parse ecff353^1 ecff353^2`; `git diff --check f688e07..ecff353` → source reachable, parents `b0e8401` then `f688e07`, and no whitespace errors. |
| Artifact-only unit tests | not applicable | This slice changes Markdown evidence only; spec-04 requires review rather than pointless unit tests solely for the artifact. Applicable product tests are recorded above. |

## Remediation evidence ledger

| Evidence item | Status | Evidence / reason |
| --- | --- | --- |
| PR #57 contains no ReportQuery remediation | produced | `ReportQuery` remediation commits `b69d92e`, `b9718ab`, and `51df84e` are descendants of #57 and were authored on #60, not in #57 head `6c839cd`. |
| PR #57 focused foundation verification | outstanding | The separate plan slice for focused source/diff/typecheck/build/full-suite verification has not been executed; successful CI alone does not replace it. |
| PR #60 ReportQuery factory/private constructor behavior | produced | Current cumulative focused command above passes domain/reporting coverage, including defaults, preserved unsupported-dimension diagnostics, and compile-time private-constructor rejection. |
| PR #60 gap grouping/filtering behavior | produced | Current cumulative focused command passes mixed and single `present|absent` grouping, both gap filters, composed filters, invalid values, totals, and enrichment consistency coverage. |
| PR #60 historical local outcomes | produced | Recorded against `51df84e`: focused domain/reporting tests 36/36; `pnpm typecheck`, `pnpm build`, and `pnpm run health:runtime` passed; `pnpm test` passed 343 tests with 5 skipped. Exact retained console transcript and focused command timestamp are unavailable, so they are separately outstanding below. |
| PR #60 exact historical focused command transcript | outstanding | No durable failing/passing console transcript with timestamp is present in the branch. The current cumulative 49-test command is produced evidence; it does not recreate the historical run. |
| PR #62 raw-output boundary and no-side-effect behavior | produced | Current cumulative CLI tests pass HTTPS, case-insensitive scheme, `file:`, missing output, malformed selection, local relative/absolute, and Windows drive-path cases. |
| PR #62 selected aggregate JSON/CSV behavior | produced | Current cumulative export/CLI tests pass filter-before-aggregation, non-default grouping, top-level JSON rows, fixed CSV schema, and empty JSON/CSV cases. |
| PR #62 historical local outcomes | produced | Recorded against final `f688e07`: the same exact four-file focused command passed 49/49; typecheck, build, runtime health, emitted CLI smoke, and full suite passed (356 passed, 5 skipped). |
| Product-code review | produced | The #60 and #62 implementation slices were reviewed before approval; the current cumulative product baseline is also covered by passing focused/full verification. |
| Canonical Markdown review | produced | Adversarial diff review completed before commit: required categories are classified, unavailable historical RED is not inferred, propagation is separated from PR integration, exclusions are explicit, and no blocking inconsistency was found. |
| PR #63 post-artifact human review | outstanding | The updated PR must be summarized and explicitly approved after this artifact is pushed. Until then, #63 is not eligible as the #66 source or for merge. |

## RED → GREEN → triangulation ledger

| Behavior | RED | GREEN | Adversarial triangulation | Classification note |
| --- | --- | --- | --- | --- |
| ReportQuery factory/defaults/diagnostics | outstanding | produced — current focused tests pass at `ecff353` | produced — current tests cover unsupported grouping, unsupported filter, and direct construction | The branch commits contain tests and implementation together. A historical failing RED run and its exact output cannot be verified and are not inferred. |
| Attribution/enrichment gap grouping and filtering | outstanding | produced — current focused tests pass at `ecff353` | produced — mixed states, enrichment grouping, composed filtering, invalid vocabulary, and single-state cases pass | Historical failing-first and per-step TPP console history is unavailable; current tests prove behavior, not sequence. |
| Raw URL-like output rejection | outstanding | produced — current CLI tests pass at `ecff353` | produced — `file:`, case-insensitive schemes, missing output, malformed selection, and Windows absolute paths pass | Historical RED output was not retained in a durable repository artifact; do not reconstruct it from `18c4d34`. |
| Selected aggregate JSON/CSV export | outstanding | produced — current export/CLI tests pass at `ecff353` | produced — empty schemas and non-default grouping pass | Historical RED output and exact transformation-by-transformation transcript are unavailable. |
| One-line ReportQuery caller compatibility on #62 | outstanding | produced — `4d2e10b` replaced only direct construction and current verification passes | produced — inherited unsupported-grouping/filter tests pass | A historical TypeScript failure was observed, but its durable exact console transcript/time is unavailable; it remains outstanding rather than being restated as produced RED evidence. |
| Markdown-only canonical evidence slice | not applicable | produced — this artifact supplies the required ledger | produced — review checks unclassified items, stale-head claims, and unavailable-history handling | No product behavior is introduced, so artifact-only RED/GREEN unit testing is not applicable; review is required. |

## Parent-to-child propagation ledger

| Propagation | Status | Source / prior target / result | Base, parents, diff, conflict, verification, push, approval |
| --- | --- | --- | --- |
| #60 → #61 | produced | `51df84e` / `c0d5b387f316a513626a42d2545defbc8da6a2d8` / `70a18894c94931f0c676dccd7cbdad2c2725f964` | #61 base remained `feat/semantic-efficiency-metrics-04-reports`; parents are `c0d5b38 51df84e`; clean ordinary merge; focused child diff remained four export files (176 additions, 2 deletions); focused 12/12, build, typecheck, runtime health, full 346 passed/5 skipped, and four current-head CI jobs passed; non-force push produced; user approval produced before #61 was used downstream. |
| #61 → #62 plus compatibility | produced | `70a1889` / `144be32c4b128095f4642851ed294de4ba69e7a9` / merge `c0d80c5`, compatibility/result `4d2e10b` | #62 base remained `feat/semantic-efficiency-metrics-05-exports`; merge parents are `144be32 70a1889`; clean ordinary merge; compatibility changed only one call in `scripts/metrics.ts`; focused 42/42, build, typecheck, runtime health, emitted smoke, full 349 passed, and four current-head CI jobs passed; non-force push and combined-head approval produced. |
| Final #62 remediation head | produced | compatibility `4d2e10b` / remediation `18c4d34` / final `f688e07` | #62 base unchanged; focused child scope limited to declared CLI/export files; focused 49/49, build, typecheck, runtime health, emitted smoke, full 356 passed/5 skipped, and four current-head CI jobs passed; non-force push and final #62 approval produced. This is remediation, not a parent-to-child merge. |
| #62 → #63 | produced | `f688e07` / `b0e840198b8d23284f37eebe3c6f5d336865bbae` / `ecff353858deea82fc45b3cf3e2c72466a539b68` | #63 base remained `feat/semantic-efficiency-metrics-06-cli`; parents are `b0e8401 f688e07`; conflict-free ordinary merge; focused #63 diff remained `.ai/plans/semantic-efficiency-metrics.md`, `README.md`, `bin/afergon-ai`, and `openspec/changes/semantic-efficiency-metrics/independent-feature-plan.md` (23 additions, 4 deletions); focused 49/49, build, typecheck, runtime health, emitted metrics smoke, full 356 passed/5 skipped, and four current-head CI jobs passed; non-force push produced; prior propagation-head approval produced. Post-artifact approval is separately outstanding. |
| #63 → #66 | outstanding | Future source must be the explicitly approved final #63 evidence head; prior #66 is `602a8b382e28f5d31d675d234c20336ad03fd14e` | No merge, conflict outcome, result head, post-propagation diff, verification, push, CI, or approval exists. #66 remains untouched. |

## Current-head CI ledger

| Head | Status | Exact observable result |
| --- | --- | --- |
| #57 `6c839cd` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful on 2026-07-16. These checks do not satisfy the outstanding focused #57 verification slice. |
| #60 `51df84e` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-30T20:14:43Z`–`20:15:17Z`. |
| #61 `70a1889` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-30T21:22:52Z`–`21:23:58Z`. |
| #62 `f688e07` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-31T10:12:32Z`–`10:12:47Z`. |
| #63 `ecff353` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-31T11:10:38Z`–`11:11:29Z`. |
| Artifact publication `f395cc8` | produced | Two `test` jobs succeeded: [job 91146492964](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627648326/job/91146492964) completed `2026-07-31T11:38:44Z`; [job 91146501552](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627651125/job/91146501552) completed `2026-07-31T11:38:51Z`. Two `windows-launcher` jobs succeeded: [job 91146492952](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627648348/job/91146492952) completed `2026-07-31T11:38:18Z`; [job 91146501576](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627651124/job/91146501576) completed `2026-07-31T11:38:20Z`. |

## Authorization, review, and integration ledger

| Evidence item | Status | Evidence / reason |
| --- | --- | --- |
| Plan→Implement authorization for this canonical-evidence slice | produced | The user explicitly authorized only the PR #63 canonical-evidence slice on current head `ecff353`. |
| Permission to update and non-force push only PR #63 after green gates | produced | Included in the bounded authorization for this slice. |
| PR-body edit | not applicable | Explicitly excluded from this slice; no PR body may be edited. The separate chain-context reconciliation remains outstanding overall. |
| #66 propagation | outstanding | Explicitly excluded until final #63 is summarized and approved. |
| PR merge authorization | outstanding | No PR merge was authorized. Parent propagation is not PR integration. |
| Ordered bottom-up integration | outstanding | Must not begin while any required evidence or approval is outstanding. |
| PR #63 final post-update approval | outstanding | Must be obtained after the artifact commit, push, and current-head CI summary. |
| PRs #81–#83 mutation | not applicable | They are outside this task and must remain untouched. |

## Rollback boundary and next gate

The work unit is this file only: `openspec/results/semantic-efficiency-metrics/RESULT.md`. Before push it can be abandoned without affecting published history. After a permitted non-force push, recovery requires a separately approved forward change; published history must not be reset or rewritten.

The next gate is mandatory user review of the exact final PR #63 head and its current-head checks. Outstanding historical RED evidence remains outstanding and blocks any claim that the complete historical TDD sequence was proved; it must never be fabricated.
