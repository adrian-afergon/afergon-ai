# Semantic efficiency metrics — canonical completion evidence

This is the canonical evidence ledger for the completed `semantic-efficiency-metrics` change through main merge `9e328a760e84544d2db82755d80e8fa159a4894e`. It records what can be proved and leaves only unavailable historical TDD evidence outstanding. The artifact records authorization evidence but does not itself grant authorization.

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
| PR #57 foundation boundary | `6c839cd58567d6cd24e1aa8877bb209e1891b073` | Focused foundation verification produced at `2026-07-31T20:10:55Z`–`2026-07-31T20:12:18Z`; source remains outside the later ReportQuery factory/private-constructor/caller/unsupported-filter remediation assigned to PR #60. |
| PR #60 ReportQuery and gap remediation | `51df84e800eb0c69dddb9f46c16673582c75b30f` | Commit time `2026-07-30T21:11:16+01:00`; approved remediation head. |
| PR #61 propagation | `70a18894c94931f0c676dccd7cbdad2c2725f964` | Commit time `2026-07-30T22:18:36+01:00`; approved propagation head. |
| PR #62 ancestry/compatibility | merge `c0d80c5c9281c6bc0f0cb02fa58933d00273f2f7`, result `4d2e10bfb42c875ccf02894f877856b61540f01d` | Commit times `2026-07-30T22:33:59+01:00` and `2026-07-31T08:16:31+01:00`; approved combined head. |
| PR #62 export remediation | `18c4d3442316fe0892cadf1f3d4d667d13d04ef3`, final `f688e07d8afc492c226953192a99cb148237f391` | Commit times `2026-07-31T11:04:39+01:00` and `2026-07-31T11:08:49+01:00`; approved final #62 head. |
| PR #63 parent propagation and evidence baseline | `ecff353858deea82fc45b3cf3e2c72466a539b68` | Commit time `2026-07-31T12:06:36+01:00`; verification below ran at `2026-07-31T11:31:25Z`–`2026-07-31T11:33:09Z`. |
| PR #63 canonical artifact publication | `f395cc80c0b2b79faa72f95e32879e4ef307ddde` | Artifact commit; focused/full/build/typecheck/runtime reran successfully before publication and all four publication-head CI jobs passed. |
| PR #63 final evidence head and approval | `b9c203c99472ecdf2347c00b8afa31edea66806f` | Added the produced PR #57 verification evidence; four current-head CI jobs passed and the user explicitly approved this final #63 head before integration. |
| PR #63 → #66 propagation | `b4632cf888b07c18bdcc7b0f03e7875d80aa1dd3` | Ordinary merge with parents prior #66 `602a8b382e28f5d31d675d234c20336ad03fd14e` then approved #63 `09cbf67731612ba606a23325c733d989cf4d5bb1`; focused/full/build/typecheck/runtime and four current-head CI jobs passed, followed by explicit user approval. |
| Ordered integration #66 → #63 | `0b1d341ed45351cead3b86ef6130beaeb3e06a18` | GitHub ordinary merge with parents current #63 `b9c203c99472ecdf2347c00b8afa31edea66806f` then #66 `b4632cf888b07c18bdcc7b0f03e7875d80aa1dd3`; PR #66 merged, PR #63 advanced, and four result-head CI jobs passed. |
| Ordered integration #63 → #62 | `52c686a2e3ee6e952a86b4ea42af6de3fe7af8ec` | GitHub ordinary merge with parents prior #62 `f688e07d8afc492c226953192a99cb148237f391` then #63 `0b1d341ed45351cead3b86ef6130beaeb3e06a18`; PR #63 merged and PR #62 advanced with an identical tree to #63. |
| Ordered integration #62 → #61 | `ebcc119ddc7a9581478af6a9fb2f8ab2226f90f1` | GitHub ordinary merge with parents prior #61 `70a18894c94931f0c676dccd7cbdad2c2725f964` then final #62 `cedc4533250e7ae8d89632ef5d4966c4533f51ca`; PR #62 merged and all four result-head checks passed. |
| Ordered integration #61 → #60 | `f3e907ba806309c76105bd324cd8e7ad09c79828` | GitHub ordinary merge with parents prior #60 `51df84e800eb0c69dddb9f46c16673582c75b30f` then #61 `ebcc119ddc7a9581478af6a9fb2f8ab2226f90f1`; PR #61 merged and all four result-head checks passed. |
| Ordered integration #60 → #59 | `829d03eb0bf83f79e3ab31898b070257a16d28b0` | GitHub ordinary merge with parents prior #59 `a23c6c06192bce4e8caf03315429c0ba0002eef3` then #60 `f3e907ba806309c76105bd324cd8e7ad09c79828`; PR #60 merged and all four result-head checks passed. |
| Ordered integration #59 → #58 | `3bb6e1f5f0c86ac28f85be49b5f5638abad0b81a` | GitHub ordinary merge with parents prior #58 `a4b5303c9b051231ba9d863c0db1c9400b6b4bc7` then #59 `829d03eb0bf83f79e3ab31898b070257a16d28b0`; PR #59 merged and all four result-head checks passed. |
| Ordered integration #58 → #57 | `6ca8a748a34bac44aa8a9c59faef50376de8fec6` | GitHub ordinary merge with parents prior #57 `6c839cd58567d6cd24e1aa8877bb209e1891b073` then #58 `3bb6e1f5f0c86ac28f85be49b5f5638abad0b81a`; PR #58 merged and all four result-head checks passed. |
| Ordered integration #57 → tracker #56 | `b2df1def2434f4fbbeb16d0ef3182bc446715f56` | GitHub ordinary merge with parents prior #56 `356dcfe0b50be3efaf22c7f792bb55c31a204286` then #57 `6ca8a748a34bac44aa8a9c59faef50376de8fec6`; PR #57 merged, the complete #66-through-#57 chain became reachable, and all four result-head checks passed. |
| Tracker #56 → `main` | `9e328a760e84544d2db82755d80e8fa159a4894e` | GitHub ordinary merge with parents prior main `115ac8952c9bb9c01dd299fae6890e3969985d9a` then exact tracker `b2df1def2434f4fbbeb16d0ef3182bc446715f56`; PR #56 merged last. The active one-review rule still blocked readiness, so the user-authorized administrator bypass was used once. Main Test run `30670237955` and Windows launcher run `30670237987` passed. |

The complete integration is present on `main` at `9e328a7`. All nine semantic-metrics source branches remain present; no source branch was deleted or rewritten. All nine PR bodies were reconciled to the canonical eight-child Chain Context through #66 while retaining their stacked bases and unrelated content. PRs #81–#83 remain excluded, open, and unchanged at `56023dcae67ead554ef4d147ff9ad1f45d8fa8fb`, `4b4abc6b669157cc2d4c45971712e4d003837cf0`, and `c3f1fe44a1133b05a08e5302590f809c1e108906`.

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

## Post-review correction verification on main

| Evidence item | Status | Exact command and observable result |
| --- | --- | --- |
| RED — focused execution without preexisting `dist/` | produced | On main `9e328a7` with no `dist/scripts/metrics.js`, `pnpm exec vitest run tests/metrics-cli.test.ts --no-file-parallelism` failed only the two emitted-runtime help scenarios: 17 passed, 2 failed because the child process exited 1. |
| GREEN and triangulation — self-contained emitted runtime | produced | The metrics-help behavior setup now runs `pnpm run build` before emitted-runtime assertions. The same focused command from the no-`dist/` state passed 19/19. Report-help and export-help are two structurally distinct runtime scenarios; both retain exit/output/no-enablement assertions. Lowest sufficient TPP move: statement → statements in test setup, with no product-code change. |
| Focused CLI/TUI tests | produced | `pnpm exec vitest run tests/metrics-cli.test.ts tests/tui-dispatch.test.ts --no-file-parallelism` → 2 files passed, 55 passed, 3 skipped. |
| Focused metrics regression | produced | `pnpm exec vitest run tests/metrics-domain.test.ts tests/metrics-reporting.test.ts tests/metrics-export.test.ts tests/metrics-cli.test.ts tests/tui-dispatch.test.ts --no-file-parallelism` → 5 files passed, 95 passed, 3 skipped. |
| Typecheck and build | produced | `pnpm typecheck` and `pnpm build` both exited 0. |
| Emitted runtime and health | produced | `node dist/scripts/metrics.js export --help` exited 0 and advertised both `--group-by` and repeatable `--filter`; `pnpm run health:runtime` imported all declared runtime entry points successfully. |
| Full suite | produced | `pnpm test` → build passed; 25 files passed, 3 skipped; 376 tests passed, 8 skipped. |
| Documentation review and diff hygiene | produced | Canonical ledger and task-local PLAN/RESULT were checked for stale future-integration claims; `git diff --check` passed. Markdown-only claims are reviewed rather than covered by pointless unit tests. |
| Forward-only publication | produced | Commits `e2ca7898ebb4bbae451bef4c895f5183d7a51f1e` and `a280a3511acd5097c49696abdbaca8cf77617def` were non-force pushed directly to `main` under the user's explicit authorization. GitHub reported administrator bypass of the pull-request-only and verified-signature rules for those two commits; no historical PR, source branch, or #81–#83 state was altered. |

## PR #57 focused foundation verification

All commands in this table ran in the clean isolated PR #57 worktree against exact live head `6c839cd58567d6cd24e1aa8877bb209e1891b073`, which was 0 ahead / 0 behind `origin/feat/semantic-efficiency-metrics-01-foundation`.

| Evidence item | Status | Exact command and observable result |
| --- | --- | --- |
| Focused foundation test | produced | `pnpm exec vitest run tests/metrics-domain.test.ts --no-file-parallelism` → 1 file passed, 11 tests passed; start `2026-07-31T20:10:55Z`, Vitest duration 156 ms. |
| Typecheck | produced | `pnpm typecheck` → `tsc -p tsconfig.runtime.json --noEmit`, exit 0; `2026-07-31T20:11:01Z`–`20:11:03Z`. |
| Build | produced | `pnpm build` → `tsx ./scripts/build-typescript.ts`, exit 0; `2026-07-31T20:11:06Z`–`20:11:09Z`. |
| Runtime health | produced | `pnpm run health:runtime` → all `dist/scripts/cli-dispatch.js`, `models.js`, and `tui.js` imports succeeded; “Local dist runtime health check passed (no remote telemetry).”; `2026-07-31T20:11:13Z`. |
| Full suite | produced | `pnpm test` → build succeeded; 21 files passed, 2 skipped; 314 tests passed, 5 skipped; `2026-07-31T20:11:18Z`–`20:12:18Z`, Vitest duration 57.61 s. |
| Focused diff and source boundary | produced | `git diff --stat`, `git diff --name-status`, and `git diff --check 356dcfe0b50be3efaf22c7f792bb55c31a204286..6c839cd58567d6cd24e1aa8877bb209e1891b073` → one foundation commit, 5 declared files, 304 additions, no deletions, and no whitespace errors. The head contains the original public-constructor `ReportQuery` foundation behavior, but PR #60 remediation commits `b69d92e`, `b9718ab`, and `51df84e` are not ancestors; no factory/private-constructor/caller/unsupported-filter remediation is present. |
| Live PR head, base, metadata, and CI | produced | PR #57 remained open/clean/mergeable at head `6c839cd`, base `feat/semantic-efficiency-metrics-stack` / `356dcfe`; body retained `Closes #18`, position `1 of 8`, dependency #56, follow-up #58, and the chain through #66; exactly one `type:feature` label; two `test` and two `windows-launcher` jobs successful. |
| Product runtime smoke beyond health imports | not applicable | PR #57 introduces domain types, ports, and parser behavior but no metrics CLI/runtime command boundary. Focused domain behavior plus the required emitted-module health gate are the applicable runtime evidence. |
| Focused verification review | produced | Post-run status was clean with no staged, unstaged, or untracked paths in the PR #57 worktree; the declared five-file diff and unchanged live head/base/CI were rechecked. PRs #81–#83 retained heads `56023dc`, `4b4abc6`, and `c3f1fe4`. |

## Remediation evidence ledger

| Evidence item | Status | Evidence / reason |
| --- | --- | --- |
| PR #57 contains no ReportQuery remediation | produced | `ReportQuery` remediation commits `b69d92e`, `b9718ab`, and `51df84e` are descendants of #57 and were authored on #60, not in #57 head `6c839cd`. |
| PR #57 focused foundation verification | produced | The focused foundation test, typecheck, build, runtime health, full suite, focused diff/source-boundary review, metadata/linkage/label review, and current-head CI were verified at exact head `6c839cd` on `2026-07-31`; see the dedicated table above. |
| PR #60 ReportQuery factory/private constructor behavior | produced | Current cumulative focused command above passes domain/reporting coverage, including defaults, preserved unsupported-dimension diagnostics, and compile-time private-constructor rejection. |
| PR #60 gap grouping/filtering behavior | produced | Current cumulative focused command passes mixed and single `present|absent` grouping, both gap filters, composed filters, invalid values, totals, and enrichment consistency coverage. |
| PR #60 historical local outcomes | produced | Recorded against `51df84e`: focused domain/reporting tests 36/36; `pnpm typecheck`, `pnpm build`, and `pnpm run health:runtime` passed; `pnpm test` passed 343 tests with 5 skipped. Exact retained console transcript and focused command timestamp are unavailable, so they are separately outstanding below. |
| PR #60 exact historical focused command transcript | outstanding | No durable failing/passing console transcript with timestamp is present in the branch. The current cumulative 49-test command is produced evidence; it does not recreate the historical run. |
| PR #62 raw-output boundary and no-side-effect behavior | produced | Current cumulative CLI tests pass HTTPS, case-insensitive scheme, `file:`, missing output, malformed selection, local relative/absolute, and Windows drive-path cases. |
| PR #62 selected aggregate JSON/CSV behavior | produced | Current cumulative export/CLI tests pass filter-before-aggregation, non-default grouping, top-level JSON rows, fixed CSV schema, and empty JSON/CSV cases. |
| PR #62 historical local outcomes | produced | Recorded against final `f688e07`: the same exact four-file focused command passed 49/49; typecheck, build, runtime health, emitted CLI smoke, and full suite passed (356 passed, 5 skipped). |
| Product-code review | produced | The #60 and #62 implementation slices were reviewed before approval; the current cumulative product baseline is also covered by passing focused/full verification. |
| Canonical Markdown review | produced | Adversarial diff review completed before commit: required categories are classified, unavailable historical RED is not inferred, propagation is separated from PR integration, exclusions are explicit, and no blocking inconsistency was found. |
| PR #63 post-artifact human review | produced | The user explicitly approved canonical evidence head `09cbf67`, enabling #63→#66 propagation, and later explicitly approved final evidence head `b9c203c` after the PR #57 verification ledger update, enabling #66→#63 integration. |

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
| #62 → #63 | produced | `f688e07` / `b0e840198b8d23284f37eebe3c6f5d336865bbae` / `ecff353858deea82fc45b3cf3e2c72466a539b68` | #63 base remained `feat/semantic-efficiency-metrics-06-cli`; parents are `b0e8401 f688e07`; conflict-free ordinary merge; focused #63 diff remained `.ai/plans/semantic-efficiency-metrics.md`, `README.md`, `bin/afergon-ai`, and `openspec/changes/semantic-efficiency-metrics/independent-feature-plan.md` (23 additions, 4 deletions); focused 49/49, build, typecheck, runtime health, emitted metrics smoke, full 356 passed/5 skipped, and four current-head CI jobs passed; non-force push and propagation-head approval produced. Canonical evidence head `09cbf67` and final evidence head `b9c203c` were each explicitly approved after their updates. |
| #63 → #66 | produced | approved #63 `09cbf67731612ba606a23325c733d989cf4d5bb1` / prior #66 `602a8b382e28f5d31d675d234c20336ad03fd14e` / `b4632cf888b07c18bdcc7b0f03e7875d80aa1dd3` | #66 base remained `feat/semantic-efficiency-metrics-07-docs`; merge parents are `602a8b3 09cbf67`. Manual resolution was limited to `scripts/lib/cli-dispatch-core.ts` and `tests/metrics-cli.test.ts`, with bounded `scripts/metrics.ts` export-help alignment. Focused 55 passed/3 skipped, focused regression 95 passed/3 skipped, full 366 passed/5 skipped, typecheck, build, emitted runtime, and runtime health passed; four current-head CI jobs passed; non-force push and explicit #66 approval produced. The later `b9c203c` evidence-only #63 update was not part of this propagation and entered the cumulative chain when #66 was integrated into current #63. |

## Current-head CI ledger

| Head | Status | Exact observable result |
| --- | --- | --- |
| #57 `6c839cd` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful on 2026-07-16. These current-head checks are included with the separately executed focused #57 verification recorded above. |
| #60 `51df84e` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-30T20:14:43Z`–`20:15:17Z`. |
| #61 `70a1889` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-30T21:22:52Z`–`21:23:58Z`. |
| #62 `f688e07` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-31T10:12:32Z`–`10:12:47Z`. |
| #63 `ecff353` | produced | GitHub reported two `test` and two `windows-launcher` jobs successful, completed `2026-07-31T11:10:38Z`–`11:11:29Z`. |
| Artifact publication `f395cc8` | produced | Two `test` jobs succeeded: [job 91146492964](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627648326/job/91146492964) completed `2026-07-31T11:38:44Z`; [job 91146501552](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627651125/job/91146501552) completed `2026-07-31T11:38:51Z`. Two `windows-launcher` jobs succeeded: [job 91146492952](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627648348/job/91146492952) completed `2026-07-31T11:38:18Z`; [job 91146501576](https://github.com/adrian-afergon/afergon-ai/actions/runs/30627651124/job/91146501576) completed `2026-07-31T11:38:20Z`. |
| Final #63 evidence `b9c203c` | produced | Two `test` and two `windows-launcher` check runs succeeded, completing `2026-07-31T20:22:05Z`–`20:22:45Z`. |
| #66 propagation `b4632cf` | produced | Two `test` and two `windows-launcher` check runs succeeded, completing `2026-07-31T13:50:22Z`–`13:51:14Z`. |
| #66→#63 integration `0b1d341` | produced | Two `test` and two `windows-launcher` check runs succeeded, completing `2026-07-31T20:50:09Z`–`20:53:20Z`. |
| #63→#62 integration `52c686a` | produced | Two `test` and two `windows-launcher` check runs succeeded, completing `2026-07-31T21:26:53Z`–`21:27:34Z`. |
| #62→#61 through #57→#56 integrations | produced | Each result head recorded above passed two `test` and two `windows-launcher` jobs before the next bottom-up integration advanced. |
| Main `9e328a7` | produced | Test workflow run `30670237955` and Windows launcher workflow run `30670237987` completed successfully against the final merge commit. |

## Authorization, review, and integration ledger

| Evidence item | Status | Evidence / reason |
| --- | --- | --- |
| Plan→Implement authorization for this canonical-evidence slice | produced | The user explicitly authorized only the PR #63 canonical-evidence slice on current head `ecff353`. |
| Permission to update and non-force push only PR #63 after green gates | produced | Included in the bounded authorization for this slice. |
| Canonical Chain Context reconciliation | produced | Tracker #56 and children #57–#63/#66 all described the eight-child chain `#57 → #58 → #59 → #60 → #61 → #62 → #63 → #66`; positions, dependencies, follow-ups, stacked bases, and unrelated body content were preserved through integration. |
| #66 propagation | produced | Approved #63 evidence head `09cbf67` was propagated into prior #66 `602a8b3` by ordinary merge `b4632cf`; verification, non-force push, current-head CI, summary, and explicit #66 approval were produced. |
| PR merge authorization | produced | After approving the final tracker and all updated semantic-metrics PRs, the user explicitly authorized the unchanged bottom-up merge sequence `#66 → #63 → #62 → #61 → #60 → #59 → #58 → #57 → #56 → main`, with a fresh stop/preflight before each advance. |
| Completed ordered integration | produced | The authorized order completed exactly as `#66 → #63 → #62 → #61 → #60 → #59 → #58 → #57 → #56 → main`; exact merge commits and parent identities are recorded in the covered-heads table. No PR was retargeted. |
| Final tracker readiness and administrator bypass | produced | The user explicitly authorized final tracker readiness and merge. After #56 was marked ready, the active `protect-main` ruleset still required one approving review and no review existed. Repository-role bypass was available to the current admin and was used once only for exact #56 head `b2df1de` → main. |
| Source branch preservation | produced | Tracker and all eight child source branches remained present after merge; no branch deletion, reset, rebase, or force-push was performed. |
| PR #63 final post-update approval | produced | The user explicitly approved final evidence head `b9c203c` after its current-head checks passed, before #66 was integrated into #63. |
| PRs #81–#83 preservation | produced | They remained open at exact heads `56023dc`, `4b4abc6`, and `c3f1fe4`, with their bases, bodies, checks, reviews, comments, refs, and source unchanged before and after final integration. |

## Prior evidence-gate deviation

| Evidence item | Status | Evidence / reason |
| --- | --- | --- |
| Canonical ledger current before every integration | outstanding | Integration advanced from #62 through main while this canonical artifact still described those steps and Chain Context reconciliation as future/outstanding. That contradicted spec 06's requirement to stop on outstanding required evidence. The merges, ancestry, checks, approvals, bodies, branch preservation, and exclusions were independently verified afterward, but this forward-only correction cannot retroactively make the pre-merge ledger current. |
| Forward-only disclosure and reconciliation | produced | This correction records the completed facts without rewriting merge history, altering closed PRs, deleting branches, or claiming that the prior evidence gate passed when it did not. |

## Rollback boundary and completion

The post-review correction is limited to this ledger, the task-local PLAN/RESULT handoff, and the focused metrics test's self-contained emitted-runtime setup. Before push it can be abandoned without affecting published history. After a non-force push to main, recovery requires another reviewed forward change; published history must not be reset or rewritten.

The semantic-metrics implementation and ordered integration are complete through `9e328a7`. Outstanding historical RED rows remain truthful limitations on claims about the original TDD sequence; they do not describe future product or integration work and must never be fabricated. This forward-only correction is ready for independent re-review after its own verification and current-head CI pass.
