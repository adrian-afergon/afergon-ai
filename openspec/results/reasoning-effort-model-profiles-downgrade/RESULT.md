# Result: Safe model-only export with a complete current-state backup (P2)

- **Source Task**: `002-reasoning-effort-model-profiles-downgrade.md`
- **Plan**: `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md` (ready-with-assumptions)
- **Spec**: `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md` (active; historical `-old-20261025-194903` files excluded)
- **Branch**: `feat/reasoning-effort-p2-export` (isolated worktree `/tmp/opencode/afergon-ai-reasoning-effort-p2-export`, created from exact accepted B head `d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2`)
- **Dates**: initial implementation 2026-10-25; review-correction re-entry 2026-10-25 (canonical review FAIL at `9c3b356`, bounded fixes applied)

## Implementation Status

`completed-with-notes` — all local engineering gates produced and green after the bounded review-correction re-entry; independent canonical re-review, publication, and native Windows exact-head evidence remain external gates (outstanding, not circular blockers).

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md`
- Execution Mode: direct (sequential TDD/TPP, single cohesive unit; bounded review→implement re-entry, no new scope)

## Execution Summary

Implemented the P2 internal export capability per the approved plan: `ModelOnlyExportPolicy` (domain), `ProfileExportPort` + `ExportModelProfilesUseCase` (application), `NodeExportDestinationAdapter` (infrastructure), composition wiring (`createProfileCapabilities(env).exportProfiles`), `export` added to the supported-version operation union, architecture assertion updates (domain 8, application 10), both export test files in the explicit Windows suite list, README recovery guidance, and this RESULT. After the canonical review FAIL at `9c3b356`, a bounded re-entry applied: Windows-portable mode assertions, the review-required evidence tests, the filesystem-identity protected-path fix, test-harness nits, and the artifact corrections in this RESULT. No new scope; no evidence removed.

## Completed Steps

- Five-category Git audit and isolated worktree creation at exact B head (re-verified at re-entry).
- TDD/TPP implementation of policy, adapter, use case, composition (honest RED classification below).
- Architecture assertions updated in the same unit; Windows suite list extended (11 files).
- Emitted-runtime verification and README guidance.
- Review-correction re-entry: portability guards, evidence coverage, identity-based protection, RESULT corrections.
- RESULT authored before its own commit; plan checkboxes updated to evidence-produced state only.

## Updated Plan Artifacts

- `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md` (checkboxes; TDD checkbox reclassified honestly at re-entry)

## Commits Created

Non-circular strategy: this RESULT file is authored before its own commit; the five predecessor commits are enumerated by exact SHA, and the RESULT commit itself is the branch tip created immediately after this file was written (identifiable as HEAD at publication; not self-referenced by SHA).

- `2dbc213` feat(model-profiles): add model-only export with complete current backup
- `61652b0` docs(readme): document model-only export and recovery guidance
- `9c3b356` docs(model-profiles): record P2 export implementation result
- `c62bd4f` fix(model-profiles): compare protected paths by filesystem identity
- `45e2575` test(model-profiles): guard POSIX mode assertions and add review evidence coverage
- *(this RESULT + plan checkbox commit — branch tip at publication)*

## Files Changed

- `scripts/lib/model-profiles/domain/model-only-export-policy.ts` (new — model-only transformation + loss metadata)
- `scripts/lib/model-profiles/application/profile-export-port.ts` (new — semantic port, one method)
- `scripts/lib/model-profiles/application/export-model-profiles-use-case.ts` (new — orchestration, refusals, typed partial-failure error)
- `scripts/lib/model-profiles/infrastructure/node-export-destination-adapter.ts` (new — exclusive write, owned-partial cleanup, identity-based protection)
- `scripts/lib/model-profiles/domain/profile-document-policy.ts` (operation union + `export`)
- `scripts/lib/model-profiles/infrastructure/profile-composition.ts` (`exportProfiles` wiring)
- `tests/model-profiles-export.test.ts` (new — 37 tests)
- `tests/model-profiles-export-runtime.test.ts` (new — 2 tests)
- `tests/model-profiles-architecture.test.ts` (counts + presence; fixtures intact)
- `.github/workflows/windows-launcher.yml` (+2 suite lines)
- `README.md` (export/recovery guidance)
- `openspec/results/reasoning-effort-model-profiles-downgrade/RESULT.md` (new)
- `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md` (checkboxes)

## Git Audit (corrected 2026-10-25 at re-entry)

The original RESULT (commit `9c3b356`) stated "30 registrations" — that was inaccurate for the implementation-time state and is corrected here; the earlier plan-audit figure of 30 reflected its own pre-A/B audit snapshot and is preserved as historical context, not treated as current fact.

- **Before P2 worktree creation**: 32 registrations — accessible root `main` @ `b558aadbef0390c5e9ca833d6b34af1303ffb67a`, A `/tmp/opencode/afergon-ai-p2-export-contract` @ `587647092f177138ca53b8e36b0e66e586e00990` (clean), B `/tmp/opencode/afergon-ai-p2-export-plan` @ `d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2` (clean), plus 29 prunable records (gitdir missing; cause UNKNOWN — preserved, never pruned or recreated).
- **After creation and at re-entry (verified again 2026-10-25)**: 33 registrations, 29 prunable — the P2 worktree is the one addition.
- Staged: empty. Unstaged: only pre-existing `openspec/tasks/PROJECT-TASKS.md` (161 additions/1 deletion) — untouched. Untracked: 35 individual paths — preserved, never staged.
- Collisions: `feat/reasoning-effort-p2-export` absent locally/remotely before creation; target path absent; remote A/B heads matched exact SHAs. No base/head movement during execution or re-entry.

## TDD/TPP Evidence (honest classification)

Environment: Node v26.2.0, pnpm 11.21.0. `pnpm install --frozen-lockfile` in the new tree → exit 0 (parent `node_modules` verified first; no package/lock/config changes). Tests isolate all filesystem state under `os.tmpdir()` with explicit `AFERGON_AI_CONFIG_DIR`; no real profile access.

**RED classification (corrected)**: a first test failing because its module does not exist yet is a SCAFFOLDING failure, not behavioral proof. Behavioral REDs are assertion failures against existing code.

- **Scaffolding failures (3)**: policy first test, adapter first test, use-case first test (module absent).
- **Behavioral REDs (9)**:
  - Policy (4): structured `{model}` returned as object instead of exact string; effort metadata silently dropped (losses `[]`); no-model assignment not removed; invalid managed model (`{model: 42}`) not refused.
  - Adapter (2): protected-path alias leaked raw EEXIST instead of a protected-path refusal; write-fault left the owned partial on disk.
  - Use case (1): caller-path collisions not refused before any write.
  - Composition (2): `capabilities.exportProfiles` undefined on the composed surface; composed run refused its own backup path (each write was protecting itself instead of the sibling output — real design flaw caught by the composed test).
- **Not REDs**: corrupt-source test initially failed due to a test-harness log bug (fixed in test); emitted-runtime iterations were harness corrections (AST entry, ESM loader guard, fd-level fault injection, assertion contract); all recorded as authoring fixes, not behavioral proof.

**TPP deviations (disclosed, cannot be erased)**: the initial use-case GREEN included the existence refusal and the typed-error wrap ahead of their forcing tests (both are explicit clauses of the plan's sequence contract); the adapter's AggregateError cleanup structure was written with the write-fault test (reused snapshot-adapter mechanic) and pinned by the combined-fault characterizations; the re-entry's `sameProtectedIdentity` predicate was implemented before its tests (reviewer-directed bounded fix; order disclosed, no retroactive RED claimed). Strict TDD was therefore NOT followed to the letter in every unit; the deviations are bounded and disclosed.

**Characterizations (honest)**: inherit preservation, foreign-agent verbatim preservation, non-effort metadata loss, `__proto__` own-property inertness, deep-clone independence, mixed profiles, absent containers, close-fault and removal-fault combined causes, byte-identical destination rejection, offset-view bytes, absent/future/corrupt source refusals, recheck conflict, backup-failure ordering, surviving-backup typed error, snapshot-absent protected paths, and the 7 re-entry evidence tests (fsync fault, non-EEXIST open refusal, both-cleanup-failures, fake-port EACCES, real unreadable source, real malformed source, real backup failure preserving source/snapshot) — all passed against existing mechanics; none was manufactured as RED.

### Command log (relabeled: summarized selectors, not verbatim per-cycle transcripts)

Per-cycle TDD commands were run as repeated invocations of the two selectors below; individual cycle counts and timings were not transcribed contemporaneously and are NOT invented here. Outcomes per cycle are summarized in the tables above and were observed at run time.

- Selector 1: `pnpm exec vitest run tests/model-profiles-export.test.ts --no-file-parallelism` — cycled RED→GREEN through policy, adapter, use-case, composition units; final at re-entry: exit 0, 37 passed.
- Selector 2: `pnpm build && pnpm exec vitest run tests/model-profiles-export-runtime.test.ts --no-file-parallelism` — emitted-runtime iterations to green; final: exit 0, 2 passed.

Exact verbatim commands with outcomes (contemporaneous):

| Command | Exit | Outcome |
| --- | --- | --- |
| `git worktree add -b feat/reasoning-effort-p2-export /tmp/opencode/afergon-ai-reasoning-effort-p2-export d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2` | 0 | isolation at exact B head |
| `pnpm install --frozen-lockfile` | 0 | deps installed |
| `pnpm test` (baseline, pre-change) | 0 | 1088 passed \| 8 skipped (1096) |
| `pnpm exec vitest run tests/model-profiles-architecture.test.ts tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-snapshot-runtime.test.ts tests/model-profiles.test.ts --no-file-parallelism` | 0 | 669 passed (initial unit) |
| `pnpm exec vitest run tests/model-profiles-export.test.ts tests/model-profiles-export-runtime.test.ts tests/model-profiles-architecture.test.ts tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-snapshot-runtime.test.ts tests/model-profiles.test.ts --no-file-parallelism` (re-entry) | 0 | 708 passed |
| `pnpm typecheck` | 2→0 | 3 test-side strictness fixes initially; re-entry patch-site casts; final exit 0 |
| `pnpm test` (initial completion) | 0 | 1118 passed \| 8 skipped (1126) |
| `pnpm test` (re-entry full baseline) | 0 | **1127 passed \| 8 skipped (1135)** |
| `pnpm run health:runtime` | 0 | local dist runtime health passed |
| `pnpm run doctor:runtime` | 0 | no recorded local-only health failures |

## Preservation Audit

- Source and pre-migration snapshot never written: identity-based protected-path refusal (case-insensitive filesystems included), use-case collision refusal, explicit tests (source byte-identical after export; snapshot content unchanged; real composed backup failure preserves both).
- Legacy saver untouched: saver body hash assertion (`79c929fe…`) passing in every full run; sole production `atomicPersist` ownership unchanged; no infrastructure file calls `atomicPersist`.
- Existing destinations rejected even when byte-identical (no snapshot-style EEXIST reuse). An export-destination collision AFTER a completed backup remains the contracted honest outcome: typed error identifying the surviving backup — no transactional promise added.
- Owned-partial cleanup only; completed backups survive later export failure.
- No callable/automatic restore API: composed surface keys asserted `^(configPath|reader|preparer|validator|storage|inspector|snapshots|update|exportProfiles)$`; no CLI/TUI/host activation; no live command changes.
- No multi-file atomicity/CAS/directory-fsync claims in code or docs. No realpath/symlink race guarantee (excluded by plan); case-variant absent-snapshot aliasing now covered by identity comparison.
- Root dirty state, A/B worktrees, and 29 prunable registrations untouched; no force/rebase/amend/stash/reset/clean/gitconfig changes; no existing PR mutated; nothing pushed.

## Measured Size (P2-only cohesive exception; forecast 775–900 was a forecast, not a cap; no evidence cuts)

All figures measured with `git diff --numstat d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2..<sha>`; every number below is exact at its named SHA, with no approximations.

| Measurement point | Additions | Deletions | Combined |
| --- | ---: | ---: | ---: |
| Initial implementation tip `9c3b356` (pre-re-entry) | 872 | 15 | 887 |
| Re-entry tip `79aa6c6` (includes corrected RESULT; net-line-neutral rewrite) | 1033 | 15 | 1048 |

- Implementation total at `79aa6c6`: **1033 additions, 15 deletions, 1048 combined changed lines vs B**.
- Planning artifacts (ancestors of this branch, reported separately per plan): A = 255 lines, B = 199 lines, **454 combined**.
- Whole-change accounting (planning + implementation at `79aa6c6`): **1502 combined changed lines**. The only commit after `79aa6c6` is this figure-correction edit itself; its exact delta is visible in its own commit stat and the tip-inclusive figure is reproducible with the same numstat command at publication.
- Reported honestly under the authorized P2-only exception; no numeric cap applied and no content compressed to fit an estimate. Code formatting is readable; nothing was compacted to approach the forecast band.

## Acceptance Criteria Mapping

- Happy path, inheritance/metadata edges, source-refusal outline (absent/unreadable/corrupt/future — fake AND real composed), both destination-collision cases, backup/export failure cases, guidance-only recovery: **produced** (37 unit + 2 runtime tests).
- Exact raw backup + model-only output from same capture incl. post-migration edits; source/snapshot byte-identical: **produced**.
- Effort/unrepresentable loss explicit and recoverable from raw backup; no defaults on invalid/missing source: **produced**.
- Success requires both outputs; compound failures retain causes and identify surviving backup; no false atomicity: **produced**.
- No callable restore / CLI/TUI / host effects; 006/008 clearly not released: **produced**.
- Architecture, legacy saver, dependency direction, full baseline, emitted import/API: **produced** locally. Native Windows evidence: **outstanding** (external; mode assertions now guarded, no local Windows run claimed).
- Rollback preserves saved copies; no merge/PR mutation: **produced** by construction.

## Verification Results

- Step-level checks: all TDD cycles and targeted suites **passed** (selectors and exact commands above).
- Final checks (re-entry): Tests **passed** (1127 | 8 skip); Build **passed**; Typecheck **passed**; health:runtime **passed**; doctor:runtime **passed**; legacy + architecture negative fixtures and saver hash **passed** within the full run.
- Additional evidence: emitted internal API + byte equality + fault outcomes **produced**; native Windows exact-head logs **outstanding**; independent canonical re-review **outstanding**.

## Blockers or Deviations

- None blocking. Disclosed: TPP deviations and scaffolding-vs-behavioral RED classification (above); original RESULT's 30-registration audit figure corrected to 32-before/33-after with dated correction; per-cycle command transcripts not contemporaneously captured and summarized as selectors instead of invented; `sameProtectedIdentity` implemented before its tests (reviewer-directed).

## Notes

- The composed protected-paths flaw (self-protection) and the case-variant identity gap were both found by tests, fixed in production, and pinned by deterministic tests; POSIX behavior is unchanged (case-sensitive), Windows behavior is conservatively casefolded and awaits native evidence.
- `requireSupportedVersion` export refusal message: `Cannot export unsupported profile version N` (existing non-prepare branch).
- Backup-destination collision surfaces as raw EEXIST; export-destination collision after a completed backup surfaces as the typed error with the surviving backup — both tested at emitted level.

## Next Step

Orchestrator: independent canonical re-review at the branch tip (HEAD at publication, at or after `45e2575` + this RESULT commit); obtain native Windows exact-head CI evidence through the updated suite list; handle publication/PR. No merge. S13 human async review remains OPEN and untouched.
