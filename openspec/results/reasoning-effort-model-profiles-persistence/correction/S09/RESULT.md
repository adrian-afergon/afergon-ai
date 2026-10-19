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

- `8958046` docs(models): authorize scoped S09 size exception — four owned documents only, diff/format reviewed; tests/runtime N/A for authority amendment; rollback is those four document deltas, not source.
- `89e1ef1` feat(models): complete bound profile storage capability — complete role/Node+saver/composition,31 owned tests, inherited constructor/graph changes, README/current plan/result. Precommit storage31 pass; combined439/typecheck/build pass before strengthened child byte assertions; storage31 rechecked after them.

At the original blocked checkpoint no completed storage unit existed and no commit/stage/push/source PR was created. Resumed verified work-unit commits are listed here as they become available.

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

### Resumed sequential cycles — 2026-10-19

Runner `bash /tmp/opencode/s09-pnpm.sh` is the exact E environment above followed by pnpm and its arguments, with no test logic or repository configuration. `R(name)` is `E pnpm exec vitest run tests/model-profiles-storage.test.ts --no-file-parallelism -t '<name>'`; `R` omits selector. `M` is Git base-relative numstat plus all owned untracked files, excluding operational node_modules; source is always measured against777b902, never the docs amendment. All counts include meaningful evidence; size exception permits growth without a new numerical gate.

| Exact test name | RED expected / actual | Lowest sufficient TPP / GREEN | Checkpoint |
| --- | --- | --- | --- |
| storage accepts unchanged captured non-Buffer bytes in one bound read | typecheck0 first; R(name) exit1, unexpected Profile source changed | #6 branch permits existing present read; no byte algorithm yet; R exit0,5 pass | Source27 adapter delta; test79 lines; full measured count follows next checkpoint. |
| storage rejects same-length byte changes even when parsed JSON is equal | R(name) exit1, missing refusal | #4 capture actual scalar then #6 exact Buffer comparison; no semantic JSON comparison; R exit0,6 pass | M268 before this row; remaining types/deletion/errors/real saver/binding/evidence, exception active. |
| storage rejects deleted captured source without recreating it | R(name) exit1, missing refusal | #6 ENOENT/present branch; absence-only return retained; R exit0,7 pass | M280; consistency/read-error characterization and saver/binding evidence remain. |
| storage rejects present observation without bytes before any read | R(name) exit1, wrong Profile source changed diagnostic | #6 missing-byte branch; R exit0,8 pass | M290; no preimplemented kind/impostor/boolean guards. |
| storage rejects arrays masquerading as captured bytes before any read | R(name) exit1, wrong conflict diagnostic | #6 generalize missing check to Uint8Array instance; R exit0,9 pass | M300; genuine view check still not added ahead. |
| storage rejects prototype-only Uint8Array impostors before any read | R(name) exit1, wrong conflict diagnostic | #6 genuine view predicate; R exit0,10 pass | M311; two genuine kind adversaries completed after missing-byte initial. |
| storage rejects non-boolean existence before reading or saving | R(name) exit1, missing refusal | #6 typeof-boolean guard; R exit0,11 pass | M322; correct guard's further kinds/error paths require characterization, not invented RED. |
| bound storage composes the actual saver with its private absolute environment | typecheck0; R(name) exit1, explicit temporary seam error | #4 injected constructor expression with captured env; R exit0,20 pass | M379; exception active; fault/cwd/cold/emitted/full proof still required. |

Read-error and boolean-kind characterization ran separately before the composition RED: `R` with `-t 'storage characterizes non-boolean existence|storage preserves original read faults'` exit0,8 pass/12 skipped. Existing exact catch/typeof code already handles EACCES/EIO for present and absent sources plus six other flag kinds; no production change or manufactured read-error RED. Exact-error identity, two bound reads, saver0 and original file state are asserted. Two new breaking cases cannot be found for this already-correct catch/guard without changing its specified semantics. Byte-comparison unit has two genuine sequential adversaries (same-length changed bytes and deletion); type-validation unit has array and prototype-only genuine adversaries. Composition has four subsequent cwd/env precedence adversaries below; if already green they remain characterization.

Green-only refactor: reader now uses createStorage() rather than duplicating the same constructor expression; expanded injected constructor formatting and documented trusted policy/compare-to-rename gap. `E pnpm build`, `E pnpm typecheck`, combined focal/memory/storage command above all exit0:439 tests (394+14+31). M500 before these evidence/docs updates. Constructors/capability memory test, captured subarray/view kinds and four emitted cwd/env precedence children are additional already-green characterizations; inherited resolved inward graph now includes the new storage port and all31 storage tests restore spies. Same-candidate saver/environment identity is asserted through actual saveConfig.
Composition adversaries cannot expose two new breaks because S07B already pins an absolute AFERGON override in a copied private environment; S09 merely passes that same captured environment to the concrete saver. Four real child-process variants assert original identity/full persisted document/exact bytes, later cwd empty and caller-mutated path absent. No worker chdir, manual extended write or new product policy. First storage work-unit rollback is the new storage port/saver, Node recheck/persist and constructor wiring, new storage tests, inherited constructor/graph deltas and matching README/current-plan/result deltas; preserve earlier observation behavior.

### Actual saver characterization — unchanged production helper

`R` with `-t 'real saver|real storage reads|emitted application imports'`: first run typecheck0,6 pass/1 fixture failure/31 skipped. The application import probe incorrectly blocked Node's own read-only openSync under dist (stack node:internal/modules/esm/load); corrected the harness to allow only read-only dist loader reads/opens, still rejecting all config I/O/writes/host calls/cwd. This is not a product RED and required no production change. Named matrix expansion retains all original assertions while giving each stage/existence tuple an independently runnable selector. Second run typecheck0,19 pass/31 skipped. M702 before further final evidence, with no new size gate.

| Unit / exact runnable name(s) | Actual evidence and why no two new breaking adversaries |
| --- | --- |
| real saver preserves captured existence false through serialize fault and retry; same name with true | Ordinary validated legacy candidate only; serializer spy activates on candidate identity inside actual saver after precheck, no cyclic/invalid accepted JSON. Original failure object/source absence or bytes/temp cleanup/retry asserted. Unchanged helper already catches serialization; other candidate shapes follow the same expression, not a new algorithm RED. |
| real saver preserves captured existence false through write fault and retry; true variant | Only tracked config-temp descriptor is faulted; parent/read descriptors are separate. Both existence variants already green because helper closes/removes/rethrows original error. No missing two new breaks without changing the existing helper's semantics. |
| real saver preserves captured existence false through fsync fault and retry; true variant | Only temp-fsync is faulted before close/rename. Both variants preserve exact original bytes/existence and retry full validated legacy output. Existing catch path already correct; no saver rewrite or fabricated RED. |
| real saver preserves captured existence false through close fault and retry; true variant | First temp-close fails, actual catch attempts it again (exactly2); descriptor ownership retained until actual close. Original error/temp cleanup/retry pass in both variants. Already-correct reused catch has no additional required missing algorithm. |
| real saver preserves captured existence false through rename fault and retry; true variant | Actual temp-to-config rename fails precommit; original source unchanged, temp removed and retry succeeds. Two existence variants already green; postcommit rollback would be a false adversary. |
| real saver preserves captured existence false through mkdir fault and retry; true variant; same two names with open | Extra precommit coverage: mkdir outside helper try propagates unchanged; exclusive temp-open failure cleans only temp candidate. Source/existence/retry assertions retained; unchanged mechanics already green. |
| real saver retains the original rename error when cleanup also fails; write variant | Rename+remove and write+close+remove failures preserve original failure identity, source bytes and one retained temp. Test-owned leaked descriptor explicitly released after spy restoration. Original cleanup errors are intentionally ignored; automatic clean-directory/retry guarantees are not invented. |
| real saver commits at rename and suppresses only the later directory fsync fault | Actual descriptor-aware event sequence asserts temp-open→serialize→write→temp-fsync→close→rename→parent-open→parent-fsync→parent-close. Failure after rename is swallowed, new source committed; no false rollback expectation. Existing best-effort behavior has no missing second break. |
| real storage reads once before invoking its injected saver | One bound read before saver, exact call order and saver1. All consistency/identity failures run before this call; no CAS promise for the later race window. |
| emitted application imports perform no config filesystem or host I/O | Separate isolated Node process imports emitted port/reader/preparer while forbidding config reads/writes/host/cwd; only native dist loader reads/opens allowed. Empty forbidden-call list and no config files. Already-green inner imports need no production patch. |

Fault-matrix implementation is a verification work unit for this same S09, not another PR/prefix. Rollback is its named helper/matrix/smoke test additions and corresponding result/plan evidence; the preceding verified capability remains intact. All filesystem/JSON spies restore per case. Full storage selector and all final commands follow below; S09 still owns zero old218 credits and D12 backup/retry integration stays mandatory later.
`R` full storage exit0,51 pass; fresh body audit matches exact S08C and historical D git objects byte-for-byte, only signature union differs, same SHA256 below; M729 before native-capability fixture clarification/evidence. The directory-fsync characterization permits an explicitly recorded native directory-open-unsupported event instead of claiming an injected fsync was reached on platforms unable to open directories; Linux run reaches the actual injected parent fsync. No test skip or production fallback is added. Source semantics remain unchanged throughout this verification unit.

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
Historical pre-authorization budget: STOP375/hard399; A/B450 exceptions did not apply. Current S09-only size:exception above resolves that stop, with no new numeric cap. No comment/spacing/evidence cuts or additional slicing. Source50–65/tests90–120/docs4–6/result55–65/plan8–12 were forecasts, not caps; count every layer and replacement deletion.
Outstanding: remaining consistency/positive/byte/error cycles, actual legacy fault characterization, private binding subprocess proof, emitted storage real persist/zero-application-I/O import smoke, independent Review and native post-publication CI. No helper fault-matrix GREEN/RED is claimed: unchanged helper not yet wired to those real fault tests; future serialize/write/fsync/close/rename tests must be honest characterization, with per-unit reasons when two breaks cannot be found. No production atomicPersist caller before12; no unsafe update wrapper/activation before13. Rename is commit point, directory fsync best-effort; compare-to-rename gap remains.

## Next Step

Resume one runnable assertion RED at a time under the authorized S09-only size exception; complete the same capability and all evidence before parent Review. The earlier request for an exact numerical ceiling is superseded by explicit authorization without one. No S10 code, own Review delegation, source PR, merge, approval, force/history rewrite or activation.
