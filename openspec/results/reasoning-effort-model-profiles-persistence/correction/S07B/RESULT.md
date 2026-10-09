## Implementation Status

completed-with-notes

## Plan Reference

- Plan: openspec/plans/reasoning-effort-model-profiles-persistence/plan-07b-node-observed-read.md; task001/sole ready P1 spec, published S07 split/index/allocation authority.
- Execution Mode: sequential/direct; explicit user approval covers B implementation. PR122 is OPEN at530e351fc8f773fe811a7a344fa3065daa49f64e, all four current-head checks SUCCESS; issue94 OPEN/status:approved.
- Base: exact published S07A530e351fc8f773fe811a7a344fa3065daa49f64e (its R1 predecessor cb7ab854); branch feat/reasoning-effort-p1-class-07b, worktree /tmp/opencode/afergon-ai-reasoning-effort-p1-class-07b.

## Execution Summary

Complete observe-only Node/default adapters feed the inherited application reader/domain validator. Infrastructure binds a copied private environment to the initial absolute config.json; thin loadProfileDocument converts portable captures to the original Buffer/text/identity/exists shape. No write, migration, snapshot, availability, inheritance or live activation algorithm is introduced.
Constructor dependencies are explicit and assignment-only. One unencoded Buffer read supplies UTF8 text/JSON; only the read catch accepts ENOENT. Parsing/default invocation are outside it; exact other errors propagate. The adapter and inherited application both detach bytes without reserialization; absence omits legacy byte/text fields.

## Completed Steps

- All four implementation steps and all four local acceptance criteria; test/build/rule-compliance checkboxes verified.
- Historical allocation A01=1/A02=1/A03=1/A04=6/A05=5/A06=14/A07=1/A09=3: all32 actual reader cases, original tuples/assertions retained; A08 direct3 remain S06, A memory owns zero historical cases.
- Additional9 cases: capture/constructor/copy1, defaults1, exact read/parse/default-factory fault3, private initial AFERGON/XDG/HOME/cwd precedence binding4. Focal121 and memory11 inherited unchanged.

## Updated Plan Artifacts

- plan-07b-node-observed-read.md only: verified local checkboxes and external handoff note; historical07/index/allocation/source-A evidence unchanged.

## Commits Created

- Implementation work-unit commit and verified evidence follow-up identities are recorded after commit creation.

## Files Changed

- scripts/lib/model-profiles/infrastructure/{node-profile-storage-adapter,legacy-profile-defaults-adapter,profile-read-composition,profile-store}.ts
- tests/model-profiles-persistence.test.ts; tests/_testModelRawFixtures.ts (new reusable original14-invalid/5-readable data, fully charged).
- README.md; plan07B above; openspec/results/reasoning-effort-model-profiles-persistence/correction/S07B/RESULT.md.

## Verification Results

Commands: `S(name) = pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t '^<name>$'`; exact names below substitute literally. F=focal persistence file; M=use-cases file, each `pnpm exec vitest run <file> --no-file-parallelism`. No missing-source-import/compiler failure counts as RED.

| Sequential cycle / exact S name | RED: assertion/exit | Lowest sufficient GREEN / selected counts / contemporaneous all-layer checkpoint |
| --- | --- | --- |
| Node observation captures formatted multibyte data in one read | present/raw/text/bytes expected, stub returned absent {}; exit1,1 failed/121 skipped | #5 consume injected read + reused UTF8/JSON codec/portable copy; exit0,1 passed/121 skipped;40 actual, remaining326 upper |
| Node absence delegates defaults once without capturing bytes (T1 only after prior GREEN) | S exit1, ENOENT escaped,1 failed/122 skipped | #6 narrow read branch + delegated default outside catch; GREEN actual filter `^Node (observation captures formatted multibyte data in one read\|absence delegates defaults once without capturing bytes)$`, exit0/2 passed/121 skipped;58 actual, remaining308 upper |
| Node propagates the exact %s fault without fallback (read/parse/defaults characterizations) | Already GREEN, no invented RED | Actual group filter `^Node ` exit0/5 passed/121 skipped; EACCES/parser ENOENT/default-factory ENOENT exact objects, read1/default0 or1; later real SyntaxError assertion;79 actual, remaining292 |
| captures exact UTF-8 bytes and original formatting | legacy bytes undefined; exit1,1 failed/126 skipped | #5 compose inherited case/map Buffer/text; exit0,1 passed/126 skipped;148 actual, remaining223 |
| returns absent-source defaults without creating a file; propagates a permission read fault instead of returning missing-file defaults (compatibility T1/T2) | Each S immediately GREEN reuse, individually after prior GREEN | Exact absent shape/no directory; original permission despite existsSync:false/one read; each exit0/1 passed;181 then193 actual, remaining190 then178 |
| emits a directly importable reader module | actual compiled entry absent after compilable source existed; exit1,1 failed/159 skipped | Normal pnpm build lifecycle, no new source/compiler transformation; exit0,1 passed/159 skipped;252 actual, remaining110 |
| Full reader/binding/copy matrix | Characterization of existing generalized codec, A copy/domain policy and config helper | F+M exit0/173 passed;266 actual, remaining96; final parser assertion strengthens genuine SyntaxError evidence |

Only one genuinely breaking Node triangulation was found: ENOENT; permission/parse/default faults already propagate through a narrow read catch, and native codecs/copier cover value variations. Compatibility T1/T2 and four binding permutations already pass inherited/helper behavior. Two additional breaking scenarios per unit could not be found without inventing bugs; all adversaries remain tested, not waived or relabelled historical domain coverage. No generalized new schema/input-guard algorithm was added; no refactor changed behavior.
- Produced step/final tests: exact S filters above; `pnpm exec vitest run tests/model-profiles-use-cases.test.ts --no-file-parallelism -t '^reader propagates exact port error without validation retry or fallback$'` exit0/1 passed/10 skipped; F162, M11; combined command from plan exit0/173.
- Produced build: `pnpm typecheck`, `pnpm build`, `pnpm run health:runtime`, and `node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"` all exit0.
- Produced additional smoke: compiled load under isolated HOME/XDG/config/state deep-equals canonical absent document/configPath/false, no model directory; both emitted child cases and source live-facade non-export pass.
- Produced regressions: exact plan quartet `pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism` exit0/132 passed/3 skipped.
- Produced full: `pnpm test`, isolated temp HOME/XDG_CONFIG_HOME/XDG_STATE_HOME/AFERGON_AI_CONFIG_DIR,300s timeout, exit0/557 passed/8 skipped/116.81s; rebuild included. Per-case filesystem/JSON spies restored; all original32 reader assertions retained.
- Produced parent diff/source inspection and positive seven-module inward graph/memory tests; independent canonical B Review remains outstanding, not self-certified. Optional dependency TypeScript source-map ENOENT warning is nonfatal, unrelated to read fallback.

## Blockers or Deviations

None blocking local implementation. Independent B Review, publication and current-B-head native CI are outstanding external evidence; no PR/push/review approval/merge is performed. Existing Windows launcher SUCCESS for A is not B/native persistence evidence; S13 still owns native persistence coverage.

## Notes

- Budget measured against exact A, additions AND deletions across all9 paths: source67/tests203/README4/plan25/RESULT72 =371 (358 additions+13 deletions). All fixtures/helpers/evidence charged, unchanged A/domain/core/include inherited. Above preferred350, below STOP375/hard399; no compression, case cuts or automatic extra split; allow conservative GitHub±2 when later published.
- Checkpoint forecasts above were contemporaneous remaining-work estimates, not caps; final count includes final checks/result/plan. Old blocked135-line S07 result preserves403/388–457 budget provenance and is not copied/charged into B.
- All five categories inspected before isolation: root main0/0, A upstream0/0,19 full registrations; new unused local/remote/disk B collision checks and parent ls passed. B initially clean0/0 to A;20 registrations now, including all four preserved prunables.
- Root32 individual artifacts +index161+1, D11, historical6, original07 at a55 with three untracked split plans/blocked RESULT, new docs publication and all old heads remain preserve/no transfer/no stage. PR106–109 verified CLOSED. Stage only the nine named B paths.
- Rollback: B-owned four infrastructure modules/read API, focal additions/raw fixture, README guidance and local B plan/result; preserve A/S05/S06 and historical contracts. Permutation/opaque/future/raw-path/empty/inheritance behavior stays with existing policy; saver/cwd movement proof belongs09/13.

## Next Step

Canonical external Review of exact committed B against530e351, then separately authorized publication/current-head checks; S08 waits that accepted B handoff. Local implementation is complete with normal external evidence notes.
