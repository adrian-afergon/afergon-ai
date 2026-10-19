# S09: Internal source recheck and atomic storage

## Implementation Status

In progress — resumed under explicit S09-only size:exception; no completed capability or handoff claimed yet.

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-persistence/plan-09-storage-recheck-atomic-adapter.md`
- Execution Mode: sequential; approved S09 only.

## Execution Summary

Exact verified base `777b9022bc06392e8c69b606a9a80fe6c4882ee3` (PR129 OPEN, four current-head Test/Windows SUCCESS). Supplied Review `ses_eac6fd779ffef7SIACPtviVsJB` PASS all seven; no new independent Review claimed. Issue94 OPEN; user instruction/accepted plans authorize execution, not the issue's unchecked acceptance criteria.
Resume authority2026-10-19: user “Autorizo superar el techo de líneas para esta tarea.” This is S09-only size:exception with no new numerical bound;450 is not inferred. Before any resumed source edit, amend the sole P1 spec requirement19, current plan and architecture index. All functional contracts, meaningful evidence, final measurement/review burden and Review/native CI remain required; no extra split or broader-stage allowance.
Resume five-category inventory: same branch/HEAD/base0/0, no upstream; index empty; five tracked modifications and four owned untracked files exactly match the226 checkpoint, plus operational node_modules symlink preserve/no stage. Reuse this authorized isolated tree, no transfer/new branch. Full26 registrations/16 prunables and all accessible prior Git states rechecked unchanged; PR129 exact remote head/four SUCCESS reverified. Initial docs commit may stage only the specification, current plan/index and this result; partial source/tests remain unstaged until their coherent behavior is verified.
Fresh branch `feat/reasoning-effort-p1-class-09`, worktree `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-09`; local/remote/disk collision checks clear, parent listed first. Initial HEAD/base divergence0/0, no upstream, index/tracked/untracked empty. Rechecked all five Git categories at entry. Existing25 registrations retained,16 prunable; new tree makes26. An initial inventory attempted Git in orphan directories; corrected inventory excludes prunable registrations, without repair/recreation. No unavailable-content hashes claimed.
Preserve/no transfer/no stage: root32 individually enumerated paths in architecture index, root PROJECT-TASKS161+1, partial08 four tracked/eight untracked paths, all other accessible trees/closed106–109 refs and metadata. Stage only S09 owned source/tests/README/current plan/this result after verification; no other tree changes.

## Completed Steps

- Loaded exact current root registry/AGENTS/README and registered implement plus .agents work-unit-commits/chained-pr/cognitive-doc-design.
- Read full S09, architecture/S07/S08 dispatch,218-case allocation, sole P1 spec and actual adapter/composition/legacy saver.
- Four new assertion RED/GREEN cycles and compile/build/full-regression checkpoint only; no plan implementation checkbox marked complete.

## Updated Plan Artifacts

`openspec/plans/reasoning-effort-model-profiles-persistence/plan-09-storage-recheck-atomic-adapter.md` — appended verified blocked checkpoint; original technical contracts retained.

## Commits Created

None

No completed storage work unit exists to commit safely; preserve partial source/tests/results in this isolated worktree. No commits, stage, push or source PR created.

## Files Changed

- Application `profile-storage-port.ts`; infrastructure `node-profile-storage-adapter.ts`, `legacy-atomic-profile-saver-adapter.ts`; `tests/model-profiles-storage.test.ts`; this result. All paths under the existing model-profiles vertical unless qualified.
- Existing infrastructure `profile-read-composition.ts` explicit saver wiring; `scripts/lib/model-profiles-config.ts` sole signature union; `tests/model-profiles-persistence.test.ts` three constructor call sites/import; current S09 plan checkpoint. README and every other domain/application/source08 module unchanged because capability is blocked.

## Verification Results

Run commands from the S09 worktree. `E` below means `env HOME=/tmp/opencode/afergon-s09-isolated XDG_CONFIG_HOME=/tmp/opencode/afergon-s09-isolated/config XDG_STATE_HOME=/tmp/opencode/afergon-s09-isolated/state AFERGON_AI_CONFIG_DIR=/tmp/opencode/afergon-s09-isolated/profiles pnpm_config_pm_on_fail=ignore pnpm_config_verify_deps_before_run=false`.
`S(name)` means `E pnpm exec vitest run tests/model-profiles-storage.test.ts --no-file-parallelism -t '<exact name>'`; `S` omits `-t`. All single-name rows identify literal runnable names.
Initial `pnpm build` exit0; isolated focal+memory exit0,408 tests. Installed pnpm uses a newly created untracked `node_modules` symlink to existing root dependencies (preserve/no stage, not source delivery). First build attempt without verify_deps_before_run=false tried dependency reconciliation and exited1 (no TTY); no install/config changes made. Disabling reconciliation plus allowed pm_on_fail=ignore runs existing toolchain. Optional TypeScript source-map warning is not RED.

| Unit / exact test name | RED expected / actual | Minimum TPP / GREEN | Complete projection at GREEN |
| --- | --- | --- | --- |
| storage delegates a validated legacy candidate to its captured saver environment | S(name): expected missing call; exit1, `[]` instead of candidate/env | #5 statements: Node→saver→injected function; S(name) exit0,1 pass | Actual150; remaining source30/tests130/docs5/plan16/result30 =361 projected. |
| storage rejects a mismatched source identity before saver or filesystem access | S(name): expected refusal; exit1, did not throw | #6 conditional (#2 unconditional throw breaks initial seam); S exit0,2 pass | Measured156; remaining source27/tests120/docs5/plan16/result31 =355. Initial150 was a manual estimate; Git-measured initial143, corrected here. |
| storage recheck rejects a newly appeared source and preserves external bytes | S(name): expected conflict; exit1, did not throw | #5 read/ENOENT branch + constant conflict; no premature byte algorithm; S exit0,3 pass | Actual177; source20/tests104/docs5/plan16/result33 =355. |
| storage refuses absent observations carrying bytes before invoking saver | S(name): expected consistency refusal; exit1, did not throw | #6 conditional; S exit0,4 pass | Actual186 before checkpoint expansion. Remaining source20/tests159/docs5/plan16/result30 =416; STOP. |

Each RED ran individually before its production edit; each GREEN reran all existing storage cases. No missing-import/API/type failure was credited. First checkpoint typecheck exposed TS2345: save mock accepted only RawProfileDocument, narrower than legacy union. Corrected mock parameter to Parameters<typeof saveConfig>[0]; this is fixture typing, not behavioral RED. Final checkpoint outcomes follow below.

### Produced checkpoint verification

- `E pnpm typecheck` exit0 after mock-type correction; `E pnpm build` exit0 (initial fresh dist build preceded typecheck). Compileability was verified late; no claim of an initial RED-time typecheck is made.
- `E pnpm exec vitest run tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-storage.test.ts --no-file-parallelism` exit0,412 pass (394 focal,14 memory,4 storage).
- `E pnpm run health:runtime` exit0, all three generated runtime entry imports pass, no telemetry; `E node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"` exit0, inherited reader only.
- `E pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism` exit0,132 pass/3 skip (platform-specific inherited skips).
- `E pnpm test` with300s timeout exit0,796 pass/8 skip across28 passed/3 skipped files,113.20s; includes mandatory rebuild. This is checkpoint regression, not full S09 acceptance.
- Body audit produced: `git diff --unified=0 777b902 -- scripts/lib/model-profiles-config.ts` contains only the one authorized signature replacement. Full-body comparison with `git show 777b902:scripts/lib/model-profiles-config.ts` and `git show 8963d8e:scripts/lib/model-profiles-config.ts` matches; body SHA256 `79c929fed059901b1bd8e0ac19db30d309f1c7c7d714ff7c4cac95218869343d` (after signature through closing brace/trailing newline). No saver-body rewrite or legacy type propagation.
- `git diff --check` exit0. All spies restored by afterEach, own temporary fixture roots removed; HOME/XDG/config/state isolated. No user-config access or live CLI/TUI/host activation.

## Blockers or Deviations

**Resolved on resume2026-10-19:** the user grants the task-scoped exception above; no current budget blocker. The following worksheet and blocked-state prose record the original pre-authorization checkpoint, not current authority. Scope/architecture/sensitive-risk stops remain applicable.

The initial fixture forecast is unsupported by the actual readable cases. Best cohesive unit remains the approved full S09; the already-approved slicing pass is exhausted. No new prefix, A/B450 extension, compression or evidence deletion is applied. Source recheck is still a TDD checkpoint (present/deleted/byte/invalid-present handling unfinished), not a completed implementation; do not publish/use this tree as an accepted prefix.

### Remaining whole-capability worksheet

| Required work, additions plus deletions | Remaining estimate | Why still required |
| --- | ---: | --- |
| Complete recheck consistency/byte mechanics and bound composition/storage access | 20 | Exact bytes, genuine Uint8Array/boolean, deleted/permission errors, same private saver binding; no future stub acceptance. |
| Consistency matrix and positive/changed/deleted/error cases | 46 | Sequential assertion cycles, exact original error/read count/external state, no false ENOENT absence. |
| Descriptor-aware real saver fault fixture/matrix | 58 | serialize/write/fsync/close/rename, cleanup failures, exact precommit bytes/existence, retry and postcommit directory-fsync characterization. |
| Child-process binding precedence/cwd/env proof | 33 | Four initial path precedence variants; real save stays at original absolute identity with no new-cwd file. |
| Cold constructors, full memory capability, emitted real saver/zero-I/O imports | 22 | Injected full role and actual emitted behavior, no class-name-only proof. |
| README/current plan/full result/final evidence | 51 | 5+16+30; retains every mandatory section and exact commands/outcomes; forecast, not an evidence cap. |
| **Total remaining at four-test checkpoint** | **230** | **186 actual +230 =416 projected,17 above hard399 /41 above STOP375.** |

The worksheet is a forecast of unimplemented work, not a measured final diff or proof416 is sufficient. Earlier355 projection undercounted the test fixtures (104 remaining versus159) and source edges. Stop immediately rather than discovering a larger actual diff by implementing past the gate. Updated artifact checkpoint totals below count this worksheet too; do not double-count written result lines as remaining.

Final measured checkpoint: **216 additions +10 deletions =226** across nine owned paths (source52, tests74, plan8, result92); index empty, HEAD/base both `777b9022bc06392e8c69b606a9a80fe6c4882ee3`, no new commits. Untracked operational node_modules symlink is excluded from source delivery/no stage. Updated complete projection:226 +source20 +tests159 +README5 +remaining plan8 +further result10 =**428**,29 over399 /53 over375; already-written worksheet/checkpoint lines are not charged twice. Remaining numbers are lower-confidence estimates, not caps. Final topology26/16 prunable and all prior accessible Git states match entry; disappearance cause remains unknown, no missing-content claims.

## Notes

S09 owns zero original218 credits; all storage cases are additional. D12 completed-backup/retry integration remains required later. Constructors assign collaborators only; temporary compilable seams are TDD state, never accepted future-method stubs.
Budget STOP375/hard399; A/B450 exceptions do not apply. No comment/spacing/evidence cuts or additional slicing. Source50–65/tests90–120/docs4–6/result55–65/plan8–12 are forecasts, not caps; count every layer and replacement deletion.
Outstanding: remaining consistency/positive/byte/error cycles, actual legacy fault characterization, private binding subprocess proof, emitted storage real persist/zero-application-I/O import smoke, independent Review and native post-publication CI. No helper fault-matrix GREEN/RED is claimed: unchanged helper not yet wired to those real fault tests; future serialize/write/fsync/close/rename tests must be honest characterization, with per-unit reasons when two breaks cannot be found. No production atomicPersist caller before12; no unsafe update wrapper/activation before13. Rename is commit point, directory fsync best-effort; compare-to-rename gap remains.

## Next Step

Resume one runnable assertion RED at a time under the authorized S09-only size exception; complete the same capability and all evidence before parent Review. The earlier request for an exact numerical ceiling is superseded by explicit authorization without one. No S10 code, own Review delegation, source PR, merge, approval, force/history rewrite or activation.
