## Implementation Status
In progress; not an acceptance claim.
## Plan Reference
- Plan: `openspec/plans/reasoning-effort-model-profiles-persistence/plan-03-exact-byte-snapshot-lifecycle.md`; Execution Mode: sequential.
## Execution Summary
C only, authorized after #105 and accepted A/B; A's historical evidence exception does not waive C TDD. No writer or activation.
## Completed Steps
- C1/C2 verified by focal122/typecheck0; fault cleanup C3 remains unfinished.
## Updated Plan Artifacts
- C plan: C1/C2 local verification checkboxes only.
## Commits Created
None
## Files Changed
- `scripts/lib/model-profiles/infrastructure/migration-snapshot.ts`, `tests/model-profiles-persistence.test.ts`, this RESULT; planned README and C checklist delta.
## Verification Results
Baseline **produced**: frozen install/build exit0; focal107 pass. Compilable no-algorithm API stubs created before first new test.
Command S(name): `pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t "<name>"`.
Command F: `pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism`.
Every cycle below uses exact current runnable tests: S RED expected exit1, actual assertion/exit; S GREEN expected/actual0; F GREEN expected/actual0 and count. Actual stdout remains in session tools. Rows appended during execution, not reconstructed history.
| Unit; exact S test name | RED expected / actual (exit) | Minimal GREEN TPP; S/F outcomes; measured/projected budget |
| --- | --- | --- |
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
None
## Notes
GREEN-only fixture refactor shares named source-conflict setup and adds direct exported assertions; F117/typecheck0. No source algorithm changed; projected326–368.
Isolation **produced**: branch `feat/reasoning-effort-p1-exact-byte-snapshot-lifecycle`, worktree `/tmp/opencode/afergon-ai-reasoning-effort-p1-exact-byte-snapshot-lifecycle`, exact B BASE `08d6a22c398d799dbcc0bccf291ab712be6d9279`; initial B divergence0/0, main/origin0/20, clean staged/unstaged/untracked.
Fetch/PR107/remote prove exact B head and four SUCCESS checks; PR106 exact A `db9d2962f8ba0228f5f176de82c1ac8b01c2d2b0` ancestor. B reviews[]: supplied reviewed acceptance is user evidence, not a fabricated GitHub approval.
Complete topology/all five categories inspected twice. Root: staged empty, PROJECT-TASKS unstaged161+1 and32 individually listed untracked artifacts preserve-only. Other worktrees/failed B/historical results/four prunable registrations preserve-only; persistence tree's six untracked planning/results paths untouched. Transfer none; stage only five C allowlist paths after verification.
Registry root-only; exact registered implement/work-unit-commits/chained-pr/cognitive-doc-design read. Existing A/B validation characterizations are never new RED.
Forecast source90–100/tests140–155/README5–8/RESULT85–95/plan6–10 =326–368, additions+deletions across all owned layers; every GREEN reforecasts. STOP projected375, hard399; no evidence/coverage cuts.
External C native CI and fresh canonical Review **outstanding**; installer parity changes **not applicable**. No PR, D, merge, force/reset or policy changes.
## Next Step
Continue C's sequential evidence-driven implementation, then hand off for fresh canonical Review before any PR or D.
