## Implementation Status
completed-with-notes — C permission WARN repair locally verified; parent re-review/native CI/release acceptance outstanding.
## Plan Reference
- Plan: `openspec/plans/reasoning-effort-model-profiles-persistence/plan-03-exact-byte-snapshot-lifecycle.md`; Execution Mode: sequential.
## Execution Summary
C only, authorized after #105 and accepted A/B, plus explicit Review WARN repair: new backups request0600, existing/source permissions unchanged. A's historical evidence exception does not waive C TDD. No writer or activation; later-save faults belong to D.
## Completed Steps
- C1/C2/C3, authorized permission regression/fix and rerun original local baseline completed; no-writer/ownership audit produced. Task001 awaits D; external acceptance remains outstanding.
## Updated Plan Artifacts
- C plan: local steps/Tests/Build verified plus authorized0600 technical contract; native Additional Evidence/Rule Compliance/acceptance remain unchecked.
## Commits Created
- `02c0307fd1b7e7b702da1dca18b77b98b7b2c353 feat(model-profiles): acquire exact-byte migration snapshots` — C1/C2 code/tests/docs/live evidence; C3 deliberately unfinished.
- `e26c8bf3d56c03e83ea2878c8b6eda5c8986e1a1 fix(model-profiles): clean owned incomplete snapshots and report failures` — C3, complete fault/characterization matrix, default-byte fix, green readability refactor.
- `c3977f6858ce08c3bea6ecacc1a6bfa7c6c16694 docs(model-profiles): record verified C snapshot lifecycle evidence` — original C completion record; history retained.
- `12da0e4fa649c9b8b8e30df8962a00707f1dab2f refactor(model-profiles): share snapshot fixtures and conflict handling` — verified GREEN headroom, all150 prior names/assertions retained.
- Permission repair work unit: `fix(model-profiles): create migration snapshots with private permissions`; own SHA resolves to handed-off HEAD (`git log -1 --format=%H`), no invented self-reference.
## Files Changed
- `scripts/lib/model-profiles/infrastructure/migration-snapshot.ts`, `tests/model-profiles-persistence.test.ts`, `README.md`, C plan, this RESULT.
## Verification Results
Baseline **produced**: frozen install/build exit0; focal107 pass. Compilable no-algorithm API stubs created before first new test.
Command S(name): `pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t "<name>"`.
Command F: `pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism`.
Every cycle below uses exact current runnable tests: S RED expected exit1, actual assertion/exit; S GREEN expected/actual0; F GREEN expected/actual0 and count. Actual stdout remains in session tools. Rows appended during execution, not reconstructed history.
### Final local checks — produced, expected/actual exit0
| Exact command | Actual outcome |
| --- | --- |
| F (expanded above) | Rerun153 passed; original150 retained +3 POSIX cases (only3 skipIf win32); original baseline107 |
| `pnpm typecheck`; `pnpm build` | Both passed; inherited explicit vertical include emits snapshot module |
| `pnpm run health:runtime` | All three configured runtime entry imports pass |
| `node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"` | Passed unchanged |
| `pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism` | 132 pass/3skip; 3 files pass/1skip |
| `pnpm test` (300s tool limit) | Repair rerun537 pass/8skip; 26 files pass/3skip; 121.37s, no timeout. Original534/8skip in103.33s retained as historical evidence |
| Additional emitted-API smoke (`node --input-type=module -e`, exact program in session tool transcript) | Rerun: two exports, zero application fs/host import calls (10 loader-only reads); absent recheck/create0600/reuse unchanged mode; source absent; no live exports |

| Unit; exact S test name | RED expected / actual (exit) | Minimal GREEN TPP; S/F outcomes; measured/projected budget |
| --- | --- | --- |
| Mode characterizations (no invented RED); C mode T1 creates a private absent-source default snapshot; C mode T2 preserves a completed existing backup mode0640 | Each first S invocation expected/actual0, introduced sequentially: common open applies0600; unchanged EEXIST path never chmods | T1 F152 exit0 (measured367 before row1); T2 F153/typecheck/diff-check exit0 (measured369/project372). No two new breaks found: both creation paths share the unconditional argument, retry bypasses creation. Source0600/exact backup bytes preserved; finally restores umask; only these3 cases skip on Windows |
| Mode; C mode creates a private snapshot from a 0600 source under umask022 | 0600(384) / 0644(420), S exit1 as expected | #2 explicit constant0o600 argument suffices; no chmod/branch/locking; S expected/actual0, F151 exit0; measured366/project372; source0600+byte/ownership invariants retained, finally restores umask; Windows skips only POSIX cases |
| Absent extra; C absent source creates only a recoverable default snapshot (new reordered input) | deterministic default key order / recovery input key order (1) | #4 serialization input→validated default capture; S0/F150; measured321/project367–374; S uses unchanged exact name |
| Observation follow-up; C absent T2 refuses contradictory captured bytes (new direct assertion) | exported invalid observation / no error (1) | #6 absent-byte guard in exported check; S0/F133; measured316/project366–374; S uses unchanged exact name before parentheses |
| Observation extra; C observation requires captured Buffer before mkdir | Invalid observation / undefined.toString TypeError (1) | #6 Buffer guard at acquisition/exported comparison; S0/F133; measured315/project366–374 |
| Cleanup T2; C cleanup T2 retains simultaneous close and removal errors | both cleanup causes / only removal cause (1) | #7 collect independent close/removal errors, #6 preserve one or both; S0/F128; measured299/project365–374 (source90–94/tests174–178/result85–86/plan10/README6); next remaining fixtures use existing tables |
| Cleanup T1; C cleanup T1 close failure still attempts owned removal | own partial removed despite close error / backup remains (1) | #5 finally attempts removal even when close throws; S0/F127; measured292/project363–374 (source88–90/tests174–183/result85/plan10/README6); result estimate retains30 remaining evidence lines, not a cap |
| Cleanup; C cleanup removal failure reports original and cleanup errors | AggregateError(original,cleanup) / cleanup only (1) | #5 preserve original+cleanup via AggregateError; S0/F126; measured290/project354–374 (source88–92/tests165–171/result85–95/plan10/README6); extra simultaneous-fault cycles require reforecast |
| C3 T2; C3 T2 close failure cleans its incomplete snapshot | no partial / backup remains (1) | #5 move close into existing stage catch; retry close only on fault; S0/F125; measured270/project348–372 |
| C3 T1; C3 T1 fsync failure cleans its incomplete snapshot | close≥1/no partial/retry / close0 (1) | #5 include fsync inside existing error ownership; no close-fault algorithm; S0/F124; measured268/project348–372 |
| C3; C3 write failure cleans only its newly created partial | close≥1/no partial/retry / close0 (1) | #5 write-only catch closes/removes acquired incomplete handle; S0/F123; measured264/project348–372 (source90–96/tests157–165/result85–95/plan10/README6) |
| C2 extra; C2 rejects invalid known backup shape with its path | models path / generic byte mismatch (1) | #5 unchanged A validator on parsed backup; S0/F122/typecheck0; measured209/project326–368 |
| C2 T2; C2 T2 refuses malformed partial backup without deleting it | SyntaxError / generic byte mismatch (1) | #5 parse actual backup before equality; S0/F121; measured207/project326–368 |
| C2 T1; C2 T1 refuses valid but byte-different backup | byte mismatch refusal / reused receipt (1) | #6 actual backup Buffer equality; share expected bytes (#4); S0/F120; measured203/project326–368 |
| C2; C2 reuses a completed exact backup without writing or deleting | reused receipt / EEXIST (1) | #3 EEXIST→constant reused receipt; other errors propagate; S0/F119; measured190/project326–368 |
| Source extra; C source deletion fails closed with conflict diagnostic | deleted conflict / raw ENOENT (1) | #3 ENOENT produces absent-return or conflict constant; S0/F118; measured177/project326–368 |
| Absent T2; C absent T2 refuses contradictory captured bytes | observation refusal / no error (1) | #6 absent-byte guard only; S0/F117; measured171/project326–368 |
| Absent T1; C absent T1 refuses nondefault recovery before mkdir | default-only refusal / no error (1) | #4 absent comparison→unchanged default helper, no new schema; S0/F116; measured162/project326–368 |
| Absent; C absent source creates only a recoverable default snapshot | recoverable receipt+default bytes / ENOENT source (1) | #6 ENOENT+absent return/bytes choice, #5 mkdir; S0/F115; measured158/project326–368 |
| Recovery T2; C recovery T2 refuses matching future schema before mkdir | future-version refusal / no error (1) | #6 version>2 guard (A reads future); S0/F114; measured144/project326–368 |
| Recovery T1; C recovery T1 refuses structurally different recovery | structural mismatch / no error (1) | #6 structural equality guard+parsed validated capture; absent bypass retains C1 T2; S0/F113; measured141/project326–368 |
| Recovery; C recovery rejects malformed known fields before mkdir | models-path refusal / no error (1) | #5 call unchanged A validator, no new schema algorithm; S0/F112; measured136/project326–368 |
| C1 variation; C1 retains formatted multibyte source instead of reserialization | original UTF8/format bytes / literal{} (1) | #4 bytes constant→captured Buffer; S0/F111; measured122/project326–368 |
| C1 T2; C1 T2 refuses a source appearing after absent observation | conflict diagnostic / Buffer argument error (1) | #6 existence guard before byte equality; S0/F110; measured113/project326–368 |
| C1 T1; C1 T1 refuses changed observed bytes before acquisition | conflict refusal / no error (1) | #6 exact Buffer comparison guard; S0/F109; measured103/project326–368 |
| C1; C1 creates an exact durable snapshot without replacing source | sibling receipt / empty path (1) | #5 fs statements required by real bytes+fsync; literal{} (#2), scalar path (#4); S0/F108; measured92/project326–368 |
## Blockers or Deviations
External gates outstanding: parent re-review after authorized WARN fix, current C Ubuntu Test/Windows launcher CI and reviewed-PR acceptance. No publication before re-review; installer parity changes not applicable (installers untouched).
### Contract evidence matrix — produced
| Contract | Evidence |
| --- | --- |
| Exact formatted UTF8 bytes, structural recovery equality, deterministic absent default/reuse | Durable named fixtures; absent reordered input+byte restorability+source-absence assertions |
| Standalone changed/appeared/deleted comparison; immediate post-preflight recheck | Named source-conflict5 fixtures, including mkdir-stage late byte/appearance injection |
| Exclusive wx/fsync/close; exact valid retry; mismatch/malformed known shape refusal; new0600/existing mode preservation | C1/C2 plus mode RED/2 sequential passing adversaries; exact receipts/bytes, source0600 and existing0640 retained; no API chmod |
| Open/write/fsync/close failures, prior-backup preservation, owned retry/descriptor close | Fault-stage7 fixtures; matching retries, exact source/backup/directory invariants; per-case spy restoration |
| Original+cleanup errors, removal despite close failure, both cleanup causes | Three named cleanup fixtures; AggregateError identity assertions and partial existence/cleanup evidence |
| Invalid/future/nonmatching recovery before mkdir; observation consistency; no writer/host/live route | Recovery matrix18 incl14 A reuse; observation3; source import audit and emitted smoke; legacy/full regressions |
## Notes
Authorized WARN repair from Review `ses_ee8300415ffefgIz8AfdLkONtR`: new backups0600, existing/source permissions unchanged. GREEN refactor retains150 cases/names/assertions and24 cycle rows; focused150/typecheck/diff-check exit0. Shared backup-byte assertion initially rejected two intentional partials; corrected fixture expectation to `{` (not behavioral RED). Actual B-relative350 = source89/tests157/RESULT85/README7/plan12 before this note+commit row2; forecast final372 includes mode tests15/evidence3/plan2. Reinspected clean C at c3977f6, exact B remote/checks and full topology; all non-C dispositions unchanged.
Original24 genuine RED/GREEN cycles retained verbatim, plus1 new permission cycle. Six original units each have initial RED then sequential T1/T2; mode adversaries are already-GREEN exceptions explained above. Original reverse-chronological rows preserve order via focal counts; no future fault cleanup preceded its RED.
Already-green exceptions: unchanged A validation14, open/read propagation4, late-recheck2 and non-Buffer1 (21 added named characterizations). They cannot supply new RED: the reused validators/guards/catch paths already cover them. Absent completed retry also passed unchanged; no fabricated extra triangulation.
Emitted smoke initially failed twice on loader I/O: Node26 loads module URLs using readFileSync/openSync. Narrow allowlisting of read-only dist/package loading produced10 loader calls and zero application/host calls; no source change. Those harness failures are not RED cycles. All final commands used isolated HOME/XDG/config/state temp roots.
Original C at c3977f6 measured373 (README7/plan12/RESULT85/source93/tests176). Repair final372 = README7 + plan7add/7delete + RESULT90 + source89 + tests172; exact B base/all owned layers, below STOP375/hard399. Handed-off HEAD is permission work unit; expected final B0/5 and main/origin0/25, clean layers checked after commit. Native C CI remains outstanding; B SUCCESS/Linux tests are not substitutes.
GREEN-only readability refactor expands source guards/acquisition stages; deterministic absent backup reuse passes. F150/typecheck0/diff-check0; measured338 before README1+plan2+this note1, now342. Remaining RESULT25+final plan6 projects373; STOP375/hard399. Source93/test176 are actual complete counts, not coverage caps. No source changes planned except confirmed defects.
GREEN characterization/refactor: F150; reused A invalid-document14 cases reject before mkdir/open; late byte/appearance conflicts2 pass immediate recheck; non-Buffer guard passes unchanged. Shared durable fixture retains both exact names/all byte/JSON/fsync assertions. Measured317/project367–374 (source90–95/tests176/result85–87/plan10/README6); absent deterministic-key-order case now being introduced separately.
Four open/previous-backup-read/source-permission fault fixtures pass on first invocation (F132), characterization of existing exclusive-open/EEXIST/read propagation; no cleanup owns prior files. Measured308/project366–374 (source86–90/tests179–182/result85–86/plan10/README6); pending observation/timing/reused-validation fixtures and final verification retain all evidence.
GREEN-only fixture refactor shares named source-conflict setup and adds direct exported assertions; F117/typecheck0. Cleanup-close harness initially recursed by rebinding an overwritten spy; captured native functions before injection, no production edit/no behavioral RED claimed for that run.
Isolation **produced**: branch `feat/reasoning-effort-p1-exact-byte-snapshot-lifecycle`, worktree `/tmp/opencode/afergon-ai-reasoning-effort-p1-exact-byte-snapshot-lifecycle`, exact B BASE `08d6a22c398d799dbcc0bccf291ab712be6d9279`; initial B divergence0/0, main/origin0/20, clean staged/unstaged/untracked.
Fetch/PR107/remote prove exact B head and four SUCCESS checks; PR106 exact A `db9d2962f8ba0228f5f176de82c1ac8b01c2d2b0` ancestor. B reviews[]: supplied reviewed acceptance is user evidence, not a fabricated GitHub approval.
Complete topology/all five categories inspected twice. Root: staged empty, PROJECT-TASKS unstaged161+1 and32 individually listed untracked artifacts preserve-only. Other worktrees/failed B/historical results/four prunable registrations preserve-only; persistence tree's six untracked planning/results paths untouched. Transfer none; stage only five C allowlist paths after verification.
Registry root-only; exact registered implement/work-unit-commits/chained-pr/cognitive-doc-design read. Existing A/B validation characterizations are never new RED.
Forecast source90–100/tests140–155/README5–8/RESULT85–95/plan6–10 =326–368, additions+deletions across all owned layers; every GREEN reforecasts. STOP projected375, hard399; no evidence/coverage cuts.
## Next Step
Orchestrator launches parent re-review against exact B BASE using repaired C worktree/RESULT. Do not open a PR or start D before re-review; native CI/approval remains pending.
