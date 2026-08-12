# Plan: Semantic-metrics remediation and ordered integration

- **Source Task**: `openspec/tasks/001-semantic-metrics-remediation-integration.md`
- **Source Spec(s)**:
  - `openspec/specs/semantic-metrics-remediation-integration/spec-01-report-query-value-object.md`
  - `openspec/specs/semantic-metrics-remediation-integration/spec-02-gap-dimension-reporting.md`
  - `openspec/specs/semantic-metrics-remediation-integration/spec-03-export-boundary-and-selection.md`
  - `openspec/specs/semantic-metrics-remediation-integration/spec-04-canonical-verification-evidence.md`
  - `openspec/specs/semantic-metrics-remediation-integration/spec-05-pr-chain-context-metadata.md`
  - `openspec/specs/semantic-metrics-remediation-integration/spec-06-ordered-integration-safety.md`
  - `openspec/specs/semantic-metrics-remediation-integration/spec-07-safe-parent-head-propagation.md`
- **State**: completed
- **Execution Mode**: sequential
- **Vertical Slicing**: applied

## Summary

The semantic-metrics remediation and authorized bottom-up integration completed through main merge `9e328a760e84544d2db82755d80e8fa159a4894e`. The explicitly authorized post-review unit reconciles the canonical ledger and task handoff with every completed integration, Chain Context reconciliation, final checks, source-branch/#81–#83 preservation, and the one-time administrator bypass; it also makes focused emitted-runtime metrics tests self-contained. It truthfully discloses that integration advanced while the canonical ledger still marked required evidence outstanding. No history rewrite or PR/#81–#83 mutation is permitted.

## Planning Scope

Included:

- PR #57: preserve source unchanged for ReportQuery; verify focused foundation scope and update only its PR-body Chain Context.
- PR #60: `ReportQuery` static validation factory/private assignment-only constructor with caller and diagnostic coverage, plus exact `present|absent` grouping/filtering for attribution and enrichment gaps.
- PR #62: first one combined ancestry-and-compatibility update containing the ordinary #61→#62 merge plus only the `scripts/metrics.ts` caller migration to `ReportQuery.create(groupBy, filters)`; later, in a distinct slice, raw local-output validation before resolution and JSON/CSV serialization of selected aggregated `EfficiencyReport` rows.
- PR #63: `openspec/results/semantic-efficiency-metrics/RESULT.md` with exact evidence classifications and outcomes.
- PR-body-only Chain Context reconciliation for #56, #57, #58, #59, #60, #61, #62, #63, and #66.
- Parent-head propagation in two waves: completed prerequisite #60→#61; one combined #61→#62 ordinary merge plus minimal caller-compatibility migration; then post-remediation #62→#63→#66, with exact head, conflict, diff, verification, push, and approval gates.
- Per-PR current-head verification, user review/approval stops, and guarded integration planning.

Excluded and immutable: PRs #81–#83 and all their source/branches/checks/reviews/comments/metadata/merges; `ccusage`; remote telemetry; TUI metrics integration; broad refactoring; unrelated worktrees and artifacts; and every product/Git/GitHub mutation during planning.

## Design Rule Alignment

- `AGENTS.md`: retain the usage-metrics product vertical and inward dependencies; use a static factory plus private assignment-only constructor for validation value objects.
- `AGENTS.md`: classify each evidence item `produced`, `not applicable`, or `outstanding`; require applicable tests and completed human review.
- `AGENTS.md`: preserve staged, unstaged, and untracked state; never stash, clean, reset, restore, overwrite, delete, or accidentally stage unrelated work.
- `README.md` and `implement`: every behavior follows `RED → GREEN (lowest sufficient TPP transformation) → TRIANGULATE` with at least two adversarial scenarios → `REFACTOR`.
- `work-unit-commits`: behavior, tests, runtime evidence, and rollback boundary stay in one Conventional Commit work unit.
- `chained-pr`: preserve the Feature Branch Chain, focused diffs, dependency diagrams, and tracker-last policy.
- `branch-pr`: preserve issue linkage, exactly one `type:*` label, template content, and passing checks.
- `cognitive-doc-design`: make the review path, predecessor/follow-up, evidence, and exclusions scannable.
- The task and specs 06–07 distinguish parent-to-child branch synchronization from later bottom-up PR integration; neither operation may retarget a PR.
- Published branch history is preserved. For #63→#66, prior #66 must remain first parent and exact approved #63 second parent. Rebase, force-push, cherry-pick, squash, retargeting, merge strategies/options that auto-select a side, and automatic conflict resolution remain forbidden. The only newly approved exception is explicit line-by-line manual resolution of the two known conflict files under this plan.
- The task and specs 06–07 now supersede the propagation-only #62 boundary: they authorize one combined review slice containing preserved ordinary merge `c0d80c5` plus only the minimal `scripts/metrics.ts` caller migration, while retaining a separately authorized TDD export-remediation slice and every safety prohibition.

## Assumptions

None.

## Design Tensions

None.

## Vertical Slicing Decision

Applied along existing PR boundaries. The immediate slice is only the #63→#66 propagation candidate: two manually resolved conflict files plus the smallest command-specific export-help/test alignment needed to preserve both parent behaviors. It remains separate from PR-body metadata and all bottom-up PR merges. Execution is sequential because the candidate must consume one exact approved #63 head and must pass local review, push, current-head CI, and human approval gates before any later operation.

## Execution Strategy

Use `sequential` execution in the retained clean detached #66 isolation worktree. Main is planning-artifact-only and must not receive product changes. The existing published #66 worktree remains a read-only branch reference; it must not be reused for conflict resolution. The detached worktree provides a bounded pre-push rollback boundary without moving a branch ref.

After renewed explicit Plan→Implement approval, re-inspect all five Git/worktree categories and live PR state before any mutation. Retry only an ordinary non-fast-forward #63-into-#66 merge in the detached worktree, resolve only the two known conflicts manually, make the command-specific export-help/test adjustment in the same bounded merge work unit, and verify before attaching/pushing the candidate. A propagation merge updates only the child branch; it is not a GitHub PR merge and must not close a PR.

Synchronization and ordered integration are complete in the approved order `#66 → #63 → #62 → #61 → #60 → #59 → #58 → #57 → #56 → main`. This forward-only correction runs on main, changes only the canonical ledger, task-local PLAN/RESULT, and focused-test setup, and is pushed only after all declared gates pass.

### Current Git and worktree evidence (read-only refresh, 2026-07-31)

- Current worktree: `/Users/adrian/projects/afergon/afergon-ai`, branch `main`, HEAD `115ac8952c9bb9c01dd299fae6890e3969985d9a`, upstream `origin/main`, divergence `+0/-0`; staged and unstaged tracked changes: none. All listed OpenSpec task/spec/plan/result paths are untracked task-owned artifacts. Preserve them in place; do not transfer to product branches; stage only under a separately accepted artifact work unit.
- Live PR #63 remains open/clean at approved head `09cbf67731612ba606a23325c733d989cf4d5bb1`, base `feat/semantic-efficiency-metrics-06-cli`, with two `test` and two `windows-launcher` checks passing. Live PR #66 remains open/dirty at prior head `602a8b382e28f5d31d675d234c20336ad03fd14e`, unchanged base `feat/semantic-efficiency-metrics-07-docs`; its old checks are stale for any new candidate. The heads diverge `11/2` from common base `b0e840198b8d23284f37eebe3c6f5d336865bbae`.
- Exact read-only `git merge-tree` analysis reproduces only two content conflicts: `scripts/lib/cli-dispatch-core.ts` and `tests/metrics-cli.test.ts`. The resolution must preserve the #66 global `afergon-ai metrics --help` line and the inherited #63 global export usage line, preserve the #66 help tests and inherited #63 export behavior/safety tests, and make `metrics export --help` advertise `--group-by <dimension>` and `--filter <dimension=value>`/repeatability consistently with established parsing behavior.
- Existing worktrees and disposition:
  - Main: preserve all task-owned untracked OpenSpec artifacts; planning only.
  - `afergon-ai-agent-permissions`: preserve its seven untracked backup artifacts; untouched.
  - `afergon-ai-ai-operating-base-governance`: clean; untouched.
  - `afergon-ai-semantic-efficiency-metrics`: preserve its seven untracked design artifacts; untouched.
  - `afergon-ai-semantic-efficiency-metrics-pr-publish`: clean branch `feat/semantic-efficiency-metrics-08-cli-help` at `602a8b3`, upstream divergence `+0/-0`; read-only published #66 reference, do not resolve here.
  - PR #57/#60/#61 worktrees: clean at `6c839cd`, `51df84e`, and `70a1889`; preserve as prior evidence, untouched.
  - `afergon-ai-semantic-metrics-pr62-compatibility`: clean branch at `f688e07`; preserve, untouched.
  - `afergon-ai-semantic-metrics-pr62-propagation`: clean detached `c0d80c5`; preserve saved evidence, untouched.
  - `afergon-ai-semantic-metrics-pr62-remediation`: clean local branch at `144be32`, behind upstream by eight; do not update, reset, or reuse.
  - `afergon-ai-semantic-metrics-pr63-propagation`: clean branch at approved `09cbf67`; preserve as source, never target.
  - `afergon-ai-semantic-metrics-pr66-propagation`: clean detached `602a8b3`; designated isolated target only after renewed authorization. Preserve detached and unchanged during planning.
  - All prunable missing-directory worktree registrations remain preserved; no prune/repair/reuse.
- Excluded PRs #81, #82, and #83 remain open at `56023dc`, `4b4abc6`, and `c3f1fe4`; no source, ref, worktree, check, body, comment, review, merge, or cleanup operation is permitted.
- Planning inspection performed no fetch, source edit, Git ref/worktree mutation, GitHub mutation, conflict resolution, or merge.

## Implementation Steps

### Gate 0 — specification state and authorization

- [x] Confirm all seven active specs declare `ready` and that task/specs 06–07 supersede the former propagation-only #62 boundary.
- [x] Record the user decision to combine #61→#62 propagation with only the minimal `scripts/metrics.ts` compatibility migration, while preserving a later separate export-remediation slice and every no-retarget/no-rewrite exclusion.
- [x] Obtain renewed explicit Plan→Implement authorization for the combined #62 slice; all prior implementation authorization applied to the superseded propagation-only boundary, and merge authorization remains separately outstanding.
- [x] Re-run branch/upstream/divergence, complete worktree topology, staged names, unstaged names, and every untracked path in each extant worktree; stop on any mismatch.
- [x] Preserve prior PR #60–#63/#66 snapshot evidence as historical context and refresh local ancestry/worktree evidence read-only; do not treat prior GitHub checks as current-head evidence.
- [x] At the newly authorized implementation start, re-snapshot PR #56–#63/#66 and excluded #81–#83 heads, bases, bodies, labels, checks, reviews, comments, mergeability, and changed files; stop on drift.
- [x] At implementation, establish or safely reuse a clean isolated worktree for each target (#61, #62, #63, #66) with exact starting SHAs and rollback boundaries; no stash/clean/reset/restore/delete/force-push.
- [x] On the combined candidate head, rerun `pnpm exec vitest run tests/metrics-domain.test.ts tests/metrics-reporting.test.ts tests/metrics-export.test.ts tests/metrics-cli.test.ts --no-file-parallelism`, `pnpm typecheck`, `pnpm build`, `pnpm run health:runtime`, and `pnpm test`; prior saved-merge failures are blocker evidence, not passing baseline evidence.

### Slice 1 — PR #57 verification and PR-body metadata only

- [x] Verify the clean #57 branch still contains only its declared foundation scope and does not contain the ReportQuery factory/caller/unsupported-filter remediation assigned to #60.
- [x] Run the focused domain test, typecheck, build, applicable full suite, focused-diff review, labels/linkage, and current-head CI without changing #57 product source.
- [x] Update #57 body to `1 of 8`, dependency #56, follow-up #58, and full chain through #66 while preserving unrelated content and its existing base.
- [x] Present #57 metadata summary, exact verification evidence, head SHA, diff, and rollback boundary. **STOP for explicit user approval of updated PR #57.**

### Slice 2 — PRs #58 and #59

- [x] Preserve #58 on its existing #57 base; do not retarget, force push, or introduce unrelated commits.
- [x] Verify #58 focused domain scope with `tests/metrics-domain.test.ts`, typecheck, build, full suite, and current-head CI; update body to `2 of 8`, dependency #57, follow-up #59, full chain. **STOP for user approval of #58.**
- [x] Verify #59 focused SQLite scope with `tests/metrics-store.test.ts`, typecheck, build, full suite, and current-head CI; update body to `3 of 8`, dependency #58, follow-up #60, full chain. **STOP for user approval of #59.**

### Slice 3 — PR #60

- [x] RED: add factory/default query behavior coverage on the first branch containing the reporting callers and unsupported-filter diagnostics.
- [x] GREEN/TPP: add `ReportQuery.create(...)`; make the constructor private and assignment-only; move only existing validation and migrate all PR #60 production/test callers.
- [x] TRIANGULATE with separately failing unsupported-grouping and unsupported-filter tests, preserving exact `MetricsError` field/code/message, plus compile-time direct-construction rejection.
- [x] RED: add mixed-data `attributionGaps` grouping test requiring exact `present|absent` labels.
- [x] GREEN/TPP: admit both gap dimensions and minimally map attribution gap state.
- [x] TRIANGULATE with at least two separately failing scenarios: enrichment-gap grouping and composed existing-dimension plus gap filtering.
- [x] Add invalid-value rejection and single-state tests for both dimensions; preserve totals, outcomes, rework, counters, and optional cost.
- [x] Ensure one consistent per-record enrichment result drives selection, grouping, and counters; avoid divergent repeated provider calls.
- [x] REFACTOR under green tests; commit both ReportQuery and gap behavior/tests as reviewable #60 work units. Rollback: query factory/callers/diagnostics, gap types/validation, report selection/aggregation, required CLI text, and tests.
- [x] Verify domain/reporting/CLI tests, typecheck, build, runtime health, full suite, focused diff, and current-head CI.
- [x] Update #60 body to `4 of 8`, dependency #59, follow-up #61, full chain. Present evidence. **STOP for user approval of #60.**

### Slice 4 — combined PR #62 ancestry and minimal compatibility update

- [x] #60→#61 completed at approved #61 head `70a18894c94931f0c676dccd7cbdad2c2725f964`; retain its evidence and approval as the exact source prerequisite.
- [x] Read-only local evidence confirms saved ordinary merge `c0d80c5c9281c6bc0f0cb02fa58933d00273f2f7` has parents prior #62 `144be32c4b128095f4642851ed294de4ba69e7a9` then approved #61 `70a18894c94931f0c676dccd7cbdad2c2725f964`, is conflict-free, and preserves the focused five-file #62 diff.
- [x] Respecify the task and specs 06–07 to permit one combined #62 update containing this ordinary merge plus only the minimal caller migration while preserving a separate later export-remediation authorization and approval gate.
- [x] Obtain renewed Plan→Implement authorization for the respecified combined slice. The user approval of the sequencing decision is not authorization to mutate source, refs/worktrees, GitHub state, or PRs.
- [x] Reinspect all five Git/worktree categories and live PR state. Require exact source #61 `70a18894c94931f0c676dccd7cbdad2c2725f964`, exact published/local #62 `144be32c4b128095f4642851ed294de4ba69e7a9`, unchanged #62 base branch #61, clean isolated execution state, unchanged saved merge object/parents/tree, and no excluded or unrelated drift. Any mismatch stops for renewed planning.
- [x] Reuse saved merge `c0d80c5c9281c6bc0f0cb02fa58933d00273f2f7` only through a safe non-rewriting branch advance that preserves that exact ordinary merge object and parents; otherwise recreate the same ordinary non-fast-forward #61→#62 merge from the exact reviewed heads. Never cherry-pick, rebase, amend the merge, force-push, retarget, squash, or auto-resolve. Any conflict stops and is aborted without product edit, branch update, or push.
- [x] On top of the ordinary merge, create one separate minimal compatibility commit changing only `scripts/metrics.ts` report-query construction from `new ReportQuery(groupBy, filters)` to `ReportQuery.create(groupBy, filters)`. Do not alter parsing, defaults, filters, reporting/export behavior, tests, help, exporters, or any other source in this work unit. The inherited PR #60 tests already provide factory/private-constructor behavior evidence; add no redundant test unless the existing CLI/report coverage cannot prove unchanged behavior.
- [x] Prove exact #61 and transitive #60 ancestry, expected merge parents, unchanged base, clean diff, and two review boundaries: imported approved ancestry plus the one-line compatibility delta. Run focused domain/reporting/export/CLI tests, typecheck, build, emitted runtime/health, full suite, `git diff --check`, runtime report smoke, and local review against the combined candidate head.
- [x] Push only the final combined #62 head after every local gate passes; require current-head CI and recheck base/head/diff/ancestry. Do not edit the PR body unless separately authorized. Present merge source/prior/result SHAs, compatibility commit/result SHA, unchanged base, exact diff, verification/CI, push status, rollback boundary, and preserved exclusions. **STOP for explicit user approval of the combined #62 head before the later export remediation.**
- [x] Rollback boundary before push: abandon only the isolated combined candidate while leaving published #62 and the saved detached merge evidence unchanged. After an authorized non-force push, recovery requires a new approved forward change; never reset or rewrite the published branch.

### Slice 5 — later PR #62 export remediation on approved combined ancestry

- [x] Reconfirm the explicitly approved combined #62 head contains exact approved #61/#60 ancestry and the minimal `ReportQuery.create` compatibility commit; any stale ancestry, missing combined-head approval, or additional Slice 4 behavior change blocks RED.
- [x] RED: CLI export to raw `https://example.test/metrics.json` must fail and create no `https:` path/output under cwd.
- [x] GREEN/TPP: validate raw output before resolution, mkdir, or writer invocation; retain relative/absolute local paths.
- [x] TRIANGULATE with at least two separately failing boundary cases: `file:` URI and malformed/missing selection/output with no filesystem side effect.
- [x] RED: selected export with multiple agents/outcomes must serialize only filtered, grouped `EfficiencyReport` rows.
- [x] GREEN/TPP: preserve the already-migrated report path and route export through `ReportQuery.create` and `EfficiencyReportService.generate`; remove unconditional raw `store.all()` serialization.
- [x] TRIANGULATE with empty JSON/CSV and non-default grouping stable-schema tests.
- [x] Narrow exporter input to report rows as required; JSON is a top-level array, CSV is fixed canonical header plus one row per group; update help.
- [x] REFACTOR under green tests; commit code/tests together on #62. Rollback: CLI, exporter/ports/types, help, and focused tests.
- [x] Verify export/report/CLI tests, emitted `dist/scripts/metrics.js` runtime, typecheck, build, health, full suite, diff, and current-head CI.
- [x] Update #62 body to `6 of 8`, dependency #61, follow-up #63, full chain and selected-report contract only if separately authorized. Present the export-remediation delta separately from the combined ancestry/compatibility slice. **STOP for a new explicit user approval of remediated #62; combined-slice approval does not carry forward.**

### Slice 6 — propagation wave B and PR #63

- [x] After final remediated #62 is verified and approved, reinspect state and merge that exact #62 head into prior #63 with an ordinary merge commit; preserve base #62 and published history. Conflict, drift, dirty state, or polluted diff aborts/stops without push.
- [x] Prove exact #62/#60 ancestry, expected merge parents, unchanged base, and a focused #63 docs/evidence diff; then identify exact covered heads/results.
- [x] Create `openspec/results/semantic-efficiency-metrics/RESULT.md` with PR/head/time table and exact focused/runtime/typecheck/build/full-suite/check/review/authorization evidence.
- [x] Classify every item exactly `produced`, `not applicable`, or `outstanding`; historical RED that cannot be proven stays outstanding.
- [x] Record current GREEN/triangulation behavior evidence for both #60 remediations and #62 by behavior and head; record unavailable historical RED as outstanding and separately record that #57 source was intentionally unchanged.
- [x] Review the Markdown artifact; no pointless artifact-only tests. Commit only the canonical result and direct evidence markers. Rollback: those docs only.
- [x] Verify docs/evidence scope, applicable docs tests, typecheck, build, health, full suite, CI, and ledger completeness.
- [x] Push only #63 after local verification, require current-head CI, update its body only if separately authorized, and present propagation plus evidence deltas. **STOP for explicit user approval of final #63 before it can be the #66 source.**

### Slice 7 — bounded manual #63→#66 conflict resolution and PR #66 review stop

- [x] Obtain renewed explicit Plan→Implement authorization for this bounded strategy. The user approval that enabled replanning does not itself authorize source, Git/worktree, GitHub, push, or merge mutation.
- [x] Reinspect exact live #63/#66 heads and unchanged #66 base; all worktrees; staged, unstaged, and each untracked path; excluded #81–#83; and source-head CI. Require #63 `09cbf67731612ba606a23325c733d989cf4d5bb1`, prior #66 `602a8b382e28f5d31d675d234c20336ad03fd14e`, and a clean detached target. Drift or extra conflicts stop without cleanup or mutation.
- [x] Retry only `#63 → #66` as an ordinary non-fast-forward, no-commit merge with prior #66 as first parent and exact approved #63 as second parent. Do not use rebase, cherry-pick, squash, force-push, amend, retargeting, `-Xours`, `-Xtheirs`, checkout-ours/theirs as a blanket resolution, rerere/automerge acceptance, a merge tool that resolves automatically, or any other automatic side selection.
- [x] Confirm the unmerged set is exactly `scripts/lib/cli-dispatch-core.ts` and `tests/metrics-cli.test.ts`. If any other conflict appears, abort the merge and stop for replanning. Resolve these two files manually, line by line:
  - retain both global `formatHelp()` lines: `afergon-ai metrics --help` and `afergon-ai metrics export --format json|csv --output <path> [--group-by <dimension>] [--filter <dimension=value>]...`;
  - retain the complete #66 metrics dispatch/help suite and the complete inherited #63 CLI export behavior, URL-safety, selection, and aggregate-schema suite; do not delete, weaken, skip, or rewrite either side to make tests pass.
- [x] RED within the bounded merge work unit: strengthen the `executeMetrics(["export", "--help"])` expectation in `tests/metrics-cli.test.ts` so command-specific output must contain `--format json|csv`, `--output <path>`, `--group-by <dimension>`, and `--filter <dimension=value>` (or the established `dimension=value` spelling), and continue proving exit 0, empty stderr, and no metrics filesystem side effect.
- [x] GREEN/TPP in the already cleanly merged `scripts/metrics.ts`: update only `COMMAND_HELP.export` wording/usage to document `--group-by` and repeatable `--filter` consistently with the inherited parser and global usage. Preserve all established command dispatch, help side-effect freedom, export validation, filtering-before-aggregation, JSON/CSV schema, defaults, and diagnostics. No broader help redesign or product behavior change.
- [x] TRIANGULATE by retaining/proving both pre-existing help paths: global `afergon-ai --help` contains both global lines, and emitted runtime `metrics export --help` exposes both selection options without requiring metrics enablement or creating storage. Existing inherited #63 malformed-filter and URL-like-output tests remain mandatory regression evidence.
- [x] Before committing, prove: no conflict markers/unmerged entries; only the two exact conflicts were manually resolved; the only deliberate non-conflict source adjustment is `scripts/metrics.ts` command-specific export help; both test suites remain present; exact first/second parents and #63 ancestry; unchanged PR base; focused #66 diff; `git diff --check`; and no unrelated staged path.
- [x] Run focused gates in order: `pnpm exec vitest run tests/metrics-cli.test.ts tests/tui-dispatch.test.ts --no-file-parallelism`; `pnpm exec vitest run tests/metrics-domain.test.ts tests/metrics-reporting.test.ts tests/metrics-export.test.ts tests/metrics-cli.test.ts tests/tui-dispatch.test.ts --no-file-parallelism`; `pnpm typecheck`; `pnpm build`; emitted `node dist/scripts/metrics.js export --help` smoke with assertions for both selection options and no enablement diagnostic; `pnpm run health:runtime`; and `pnpm test`. Any failure stops without commit/push until corrected within this exact scope or escalated.
- [x] Perform a fresh-context pre-commit adversarial diff inspection of the resolved index/worktree. Require no blocking finding before creating one ordinary merge commit; a finding outside the exact scope stops for replanning, and a within-scope finding must be corrected and all gates rerun before commit.
- [x] Create one local ordinary merge commit only after all local gates and the pre-commit inspection pass. Write the implementation result with exact commit/evidence, then run registered `afergon-review` against the committed candidate and require a pass/no blocking action before push. If review fails, do not amend or push; abandon only the local candidate under the rollback boundary and replan.
- [x] After review passes, attach/update only the authorized #66 branch by non-force means and push only #66; never push #63 or any other ref. Require all #66 current-head CI jobs to pass, then recheck head/base/parents/ancestry/diff and excluded PR heads. Record focused/full counts, build/typecheck/runtime outcomes, merge parents, ancestry, diff budget, both review verdicts, rollback boundary, and evidence status as produced/not applicable/outstanding.
- [x] Present exact candidate SHA, parents, conflict resolutions, help contract, preserved suites/behavior, verification, review, push, CI, Git/worktree dispositions, and exclusions. **STOP for mandatory human PR #66 review/explicit approval. Do not merge #66, update PR bodies, advance another PR, or begin bottom-up integration.**
- [x] Rollback boundary: before commit/push, abort or discard only the authorized detached candidate if the plan gate fails, without touching other worktrees/refs. After non-force push, do not reset/rewrite; any correction requires a separately approved forward change.

### Slice 8 — tracker #56 and PR-body sequence

- [x] Update tracker #56 body last: all eight children, #66 final, draft/no-merge preserved, unrelated content retained, no metadata-only retarget.
- [x] Produce before/after records for all nine bodies; PR-body update order does not alter or retarget their bases, and each updated PR has its own user-approval stop.
- [x] Present #56/body evidence. **STOP for explicit user approval of updated PR #56.**
- [x] Re-run final cumulative tests/typecheck/build/health/runtime/full suite and update the evidence ledger truthfully.
- [x] Prove #81–#83 heads, bases, bodies, checks, reviews, comments, and refs match the start snapshot.

### Gate 9 — authorized bottom-up integration

- [x] Execute only the explicitly authorized first integration: merge #66 head `b4632cf888b07c18bdcc7b0f03e7875d80aa1dd3` into current #63 head `b9c203c99472ecdf2347c00b8afa31edea66806f` with GitHub's ordinary merge method and head matching. Result `0b1d341ed45351cead3b86ef6130beaeb3e06a18` has parents `b9c203c` then `b4632cf`; #66 is merged, #63 remains open/clean/mergeable with two `test` and two `windows-launcher` checks passing, the #66 branch remains present, and execution stopped without advancing #63 or touching #81–#83.
- [x] Execute only the explicitly authorized second integration: merge #63 head `0b1d341ed45351cead3b86ef6130beaeb3e06a18` into current #62 head `f688e07d8afc492c226953192a99cb148237f391` with GitHub's ordinary merge method and head matching. Result `52c686a2e3ee6e952a86b4ea42af6de3fe7af8ec` has parents `f688e07` then `0b1d341`; its tree exactly equals #63 tree `7701b647f9f6d8bac17d961e0df5c290d9fad5e6`. #63 is merged; #62 remains open/clean/mergeable with two `test` and two `windows-launcher` checks passing; source branches remain present; execution stopped without advancing #62 or touching #81–#83.
- [x] Merge #62 exact head `cedc4533250e7ae8d89632ef5d4966c4533f51ca` into current #61 head `70a18894c94931f0c676dccd7cbdad2c2725f964` with GitHub's ordinary merge method and head matching. Result `ebcc119ddc7a9581478af6a9fb2f8ab2226f90f1` has parents `70a1889` then `cedc453`; #62 is merged, #61 is open/clean/mergeable on its unchanged #60 base, and all four result-head checks pass. Source branch and PR body were preserved.
- [x] Merge #61 exact head `ebcc119ddc7a9581478af6a9fb2f8ab2226f90f1` into current #60 head `51df84e800eb0c69dddb9f46c16673582c75b30f` with GitHub's ordinary merge method and head matching. Result `f3e907ba806309c76105bd324cd8e7ad09c79828` has parents `51df84e` then `ebcc119`; #61 is merged, #60 is open/clean/mergeable on its unchanged #59 base, and all four result-head checks pass. Source/target branches and both PR bodies were preserved.
- [x] Merge #60 exact head `f3e907ba806309c76105bd324cd8e7ad09c79828` into current #59 head `a23c6c06192bce4e8caf03315429c0ba0002eef3` with GitHub's ordinary merge method and head matching. Result `829d03eb0bf83f79e3ab31898b070257a16d28b0` has parents `a23c6c0` then `f3e907b`; #60 is merged, #59 is open/clean/mergeable on its unchanged #58 base, and all four result-head checks pass. Source/target branches and both PR bodies were preserved.
- [x] Merge #59 exact head `829d03eb0bf83f79e3ab31898b070257a16d28b0` into current #58 head `a4b5303c9b051231ba9d863c0db1c9400b6b4bc7` with GitHub's ordinary merge method and head matching. Result `3bb6e1f5f0c86ac28f85be49b5f5638abad0b81a` has parents `a4b5303` then `829d03e`; #59 is merged, #58 is open/clean/mergeable on its unchanged #57 base, and all four result-head checks pass. Source/target branches and both PR bodies were preserved.
- [x] Merge #58 exact head `3bb6e1f5f0c86ac28f85be49b5f5638abad0b81a` into current #57 head `6c839cd58567d6cd24e1aa8877bb209e1891b073` with GitHub's ordinary merge method and head matching. Result `6ca8a748a34bac44aa8a9c59faef50376de8fec6` has parents `6c839cd` then `3bb6e1f`; #58 is merged, #57 is open/clean/mergeable on its unchanged tracker base, and all four result-head checks pass. Source/target branches and both PR bodies were preserved.
- [x] Merge #57 exact head `6ca8a748a34bac44aa8a9c59faef50376de8fec6` into current tracker #56 head `356dcfe0b50be3efaf22c7f792bb55c31a204286` with GitHub's ordinary merge method and head matching. Result `b2df1def2434f4fbbeb16d0ef3182bc446715f56` has parents `356dcfe` then `6ca8a74`; #57 is merged, cumulative #66-through-#57 is reachable from #56, all four result-head checks pass, and branches/bodies were preserved.
- [x] Mark #56 ready, re-preflight, and merge exact head `b2df1def2434f4fbbeb16d0ef3182bc446715f56` into `main` with GitHub's ordinary merge method. The active `protect-main` ruleset still required one approving review after readiness, so the explicitly authorized administrator bypass was required and used once. Result `9e328a760e84544d2db82755d80e8fa159a4894e` has parents prior `main` `115ac8952c9bb9c01dd299fae6890e3969985d9a` then exact #56 head `b2df1de`; #56 is merged, `main` points to the result, both result-head workflows pass, and all source branches, PR body, and #81–#83 were preserved.
- [x] Obtain explicit merge authorization after all nine update approvals; implementation authorization is insufficient. Produced before integration began; the authorization retains the unchanged order and fresh per-step stop/preflight gates.
- [x] Before each merge record head/base SHA, predecessor state, focused diff, current-head checks, review/approval, ledger, mergeability, and recovery action; no mismatch advanced.
- [x] Merge and verify reachability one candidate at a time: #66 into #63, #63 into #62, #62 into #61, #61 into #60, #60 into #59, #59 into #58, #58 into #57, and #57 into #56.
- [x] After each child merge, prove the complete integrated descendant chain is reachable from the next candidate head and every remaining PR still targets its unchanged existing base.
- [x] Keep #56 draft/open until cumulative #57, including #58 through #66, is reachable in #56 and final verification passes; obtain final explicit tracker readiness/merge authorization in the 2026-07-31 final-integration request.
- [x] Merge #56 to `main` last as `9e328a760e84544d2db82755d80e8fa159a4894e` and prove `main` contains exact tracker head `b2df1def2434f4fbbeb16d0ef3182bc446715f56`; #81–#83 retained identical heads, bases, bodies, checks, reviews, and open state.

## Interfaces and Technical Contracts

- `ReportQuery.create(groupBy?: ReportDimension, filters?: Readonly<Partial<Record<ReportDimension, ReportFilterValue>>>): ReportQuery`; private assignment-only constructor.
- `ReportDimension` adds `attributionGaps` and `enrichmentGaps`; their filter vocabulary is exactly `"present" | "absent"`.
- Attribution gap: at least one canonical attribution field is `UNAVAILABLE`. Enrichment gap: enrichment unavailable. One computed state drives filtering, grouping, and counts.
- Export parser accepts format, raw local output, group-by, and repeatable filters; validation precedes all resolution/filesystem effects.
- Exporters consume selected aggregated report rows, not raw records. JSON: top-level row array. CSV: fixed documented row header. Empty: `[]` or header-only.
- Evidence artifact: `openspec/results/semantic-efficiency-metrics/RESULT.md`, with exact statuses/commands/results/SHA/time and no fabricated history.
- PR map: #56 tracker; #57 1/8; #58 2/8; #59 3/8; #60 4/8; #61 5/8; #62 6/8; #63 7/8; #66 8/8.

## Acceptance Criteria

- [x] Propagation and integration topology remain distinct, sequential, no-retarget/no-history-rewrite contracts, and all active specs are `ready` without unresolved tension.
- [x] Approved #60/#61 ancestry reaches one independently reviewable combined #62 head through the ordinary merge plus only the minimal `ReportQuery.create` caller migration, before later export-remediation work. Explicit user approval of that pushed head remains the active stop gate.
- [x] Final approved #62 is propagated through final approved #63 into #66 by the bounded manual two-file conflict resolution; both global help lines, both test suites, and command-specific export selection help are preserved and verified before downstream integration.
- [x] #57 source remains outside the ReportQuery remediation and its focused foundation scope is verified.
- [x] #60 satisfies factory/private-constructor/default/diagnostic/direct-construction behavior and exact gap grouping/filtering without regressions, with TDD/TPP evidence.
- [x] #62 rejects URL-like raw outputs without side effects and exports selected aggregate rows in stable schemas.
- [x] #63 has a reviewed truthful canonical ledger.
- [x] All nine bodies match the canonical map and preserve unrelated content.
- [x] Every updated PR receives a summary and explicit user approval before merge eligibility.
- [x] Every diff is focused and ≤400 authored lines or has approved `size:exception`; current-head checks pass.
- [x] Integration is only #66→#63→#62→#61→#60→#59→#58→#57→#56→main after merge authorization, with no PR base retargeting.
- [x] #56 remains open until cumulative #57 contains all children through #66 and is integrated into #56; #56 is the only semantic PR merged to `main`.
- [x] #81–#83 and unrelated worktree/untracked state remain untouched.

## Verification

- [x] Tests: for Slice 7, focused `tests/metrics-cli.test.ts tests/tui-dispatch.test.ts`, then domain/reporting/export/CLI/TUI focused regression tests, then final `pnpm test`; exact counts/results recorded. Status: produced at `b4632cf` — 55 passed/3 skipped; 95 passed/3 skipped; full 366 passed/5 skipped.
- [x] Build: `pnpm typecheck`, `pnpm build`, emitted `node dist/scripts/metrics.js export --help` smoke, and `pnpm run health:runtime` on the #66 candidate. Status: produced at `b4632cf`.
- [x] Additional Evidence: exact two-file unmerged set and manual resolutions, no conflict markers, both preserved global lines/test suites, command-specific export-help assertions, propagation source/prior/result heads and parents, unchanged base, focused diff, no-side-effect/runtime smoke, fresh adversarial review, current-head CI, approval stop, worktree dispositions, and #81–#83 snapshot. Status: produced; human PR #66 approval remains the mandatory stop.
- [x] Rule Compliance: re-read project rules/skills/task/specs at implementation start; verify TDD/TPP receipts, work-unit commits, body preservation, Git dispositions, and no unauthorized mutation. Status: produced for Slice 7.

## Open Questions

None.

## Post-review deviation disclosure

The final review found that integration from #62 through main continued while the canonical ledger still marked those integrations and Chain Context reconciliation `outstanding`. That violated spec 06's evidence stop gate even though the merge order, ancestry, approvals, checks, bodies, branch preservation, and exclusions were subsequently verified. The authorized correction is forward-only: it records the deviation and completed facts but does not rewrite history or claim the earlier gate passed.

## Dependencies

- All propagation, remediation, approvals, Chain Context reconciliation, and ordered integrations are complete through `9e328a7`.
- The post-review correction depends only on green local verification, a focused diff review, a non-force push to main, and current-head CI/re-review.

## Risks and Watchouts

- Treating approval of this task/spec/plan update as Plan→Implement authorization would violate the explicit gate and is an immediate stop.
- Confusing branch propagation with PR integration, using any prohibited history operation, or automatically choosing either conflict side breaks the approved contract and is an immediate stop.
- Reusing the saved detached merge without proving exact object identity, parents, tree, source/target heads, unchanged base, and clean execution state risks attaching stale evidence to #62; any drift requires stop and renewed planning.
- The compatibility work unit is intentionally one caller migration only. Pulling URL validation, export selection, parser changes, help, or unrelated cleanup into Slice 4 contaminates the combined approval boundary.
- Any ascending, skipped, or retargeted PR merge breaks the approved cumulative integration contract and is an immediate stop.
- #63/#66 intentionally remain stale during Wave A; touching them before final #62 would create redundant updates and approvals. They remain blocked until Wave B.
- PR #60 source changes invalidate check/head evidence for #60 and every downstream child, but do not require moving that remediation backward into #57.
- The conflict files contain additive intent on both sides; choosing ours/theirs wholesale would silently delete either #66 help discoverability or #63 export safety/selection coverage. Manual line-level preservation is mandatory.
- `scripts/metrics.ts` merges cleanly but its #66 command-specific export help is stale relative to inherited #63 options; omitting the bounded help/test adjustment would leave global and command-specific contracts inconsistent.
- Dirty worktrees risk accidental staging/overwrite.
- Repeated enrichment calls can make gap selection/counts divergent.
- Record-to-report export migration can accidentally preserve old wrappers/headers.
- Historical RED evidence must remain outstanding if unprovable; required outstanding evidence blocks integration under spec 06.
- PR-body edits do not change head SHA; body approval and source-head CI are distinct.
- Any #81–#83 or unrelated-state mutation is an immediate stop.

## Completion Condition

This plan is complete when the canonical ledger records every integration through `9e328a7`, Chain Context reconciliation, final checks, branch/#81–#83 preservation, administrator bypass, and the prior evidence-gate deviation; the task-local RESULT agrees; focused metrics tests build their emitted runtime from a checkout without `dist/`; all declared verification passes; and the bounded forward-only correction is committed and non-force pushed to main for re-review. Historical RED evidence that cannot be proved remains `outstanding` and is not fabricated.
