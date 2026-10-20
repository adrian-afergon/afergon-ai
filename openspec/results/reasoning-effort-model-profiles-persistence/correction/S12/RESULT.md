# S12 checkpoint: complete-capability forecast exceeds the normal budget

## Implementation Status

blocked

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-persistence/plan-12-update-assignment-use-case.md`, ready-with-assumptions; source task001 / sole ready P1 spec / architecture index / TEST-ALLOCATION read.
- Execution Mode: sequential, fresh isolated worktree; S12 only.

## Execution Summary

Stopped before source implementation at the required complete-projection gate. The original279–365 forecast is not a proven fit: the ten allocated real D test bodies already measure93 lines, before explicit Node composition and semantic-hook changes. Memory capability tests and the required scope-aware graph/syntax checker are additional. Complete forecast677–883 exceeds STOP375 by302–508 and hard399 by278–484. No size exception is inferred from S09/S10/S11.

## Completed Steps

- None of the four implementation checkboxes. Produced: current skills/contracts, dependency and Git inventory, fresh isolation, original-case measurement, complete forecast and this checkpoint.
- Read exact root `.atl/skill-registry.md`, root and new-worktree AGENTS, README, project `skills/implement/SKILL.md` and registered `.agents/skills/{work-unit-commits,chained-pr,cognitive-doc-design}/SKILL.md`. New worktree has no registry copy; the known root-only registry gap is reported, not repaired.
- Verified PR132 OPEN, exact published base `649b6032df695f064e77d3563b025aa34ad5811e`, four current Test/Windows checks SUCCESS, and issue94 OPEN with `status:approved`. Supplied fresh Review `ses_ea6c87c53ffeWPvysuc461Rb9v` PASS is parent evidence, not a review performed here.
- Verified PR106–109 CLOSED/unmerged at their retained original heads. Recovered D source through `git show 8963d8e5aa16a91b7a131e9405c58f9636c33301:tests/model-profiles-persistence.test.ts`; copied no source or ancestry.

## Updated Plan Artifacts

- Plan12: approved technical clarification of original recovery input versus candidate closure; appended blocked execution checkpoint. No spec, index or allocation change.

## Commits Created

- Checkpoint-only work unit: `docs(models): record blocked S12 budget checkpoint`; its full SHA is the delivery HEAD reported with this artifact. No source commit or publication.

## Files Changed

- Plan12 above and this `openspec/results/reasoning-effort-model-profiles-persistence/correction/S12/RESULT.md` only.
- Production, tests, helpers, fixtures, README, CI and inherited artifacts: zero changed lines.
- Measured checkpoint budget:125 changed lines = Plan12 additions5/deletions1 + new result119; remaining complete-unit growth552–758, final forecast677–883. This is an artifact-only stop, not125 lines of implemented behavior. `git diff --numstat` and `git diff --no-index --numstat /dev/null <result>` produced6 and119 respectively; the latter exits1 as expected for a new-file diff, not a test RED.

## Verification Results

- Step-level checks produced: `gh pr view 132 --json number,state,headRefName,headRefOid,baseRefName,statusCheckRollup`; `gh issue view 94 --json number,state,labels,body`; `gh pr view 106` through109 with `number,state,headRefOid,mergedAt`; all exit0.
- Git checks produced: `git status --porcelain=v2 --branch --untracked-files=all`, `git diff --cached --numstat`, `git diff --numstat`, `git worktree list --porcelain`, `git log --oneline -10`, `git for-each-ref`, `git ls-remote --heads origin` for05–12; all exit0. S12 local/remote branch and on-disk destination were unused before creation; parent `/tmp/opencode` was verified first.
- Isolation produced: branch `feat/reasoning-effort-p1-class-12`, worktree `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-12`, initial full HEAD/base `649b6032df695f064e77d3563b025aa34ad5811e`, base divergence0/0. Rechecked all five categories before artifact edits: staged/unstaged/untracked empty in S12; final checkpoint changes are only the two named Markdown paths.
- Preservation produced: root `main` at `b558aadbef0390c5e9ca833d6b34af1303ffb67a`, upstream0/0; staged empty, sole unstaged `openspec/tasks/PROJECT-TASKS.md`161 additions/1 deletion; all32 individually enumerated untracked originals preserved/no transfer/no stage. Existing accessible registered trees have no tracked changes; S09/S10 each retain operational untracked `node_modules`, excluded from staging. Other external/partial directories remain unknown and untouched; no missing contents are claimed hashed or clean.
- Final checks: tests/build/runtime not applicable to this Markdown-only checkpoint; all S12 behavioral gates outstanding, not passed. Review outstanding. No installer change, so POSIX/PowerShell parity evidence is not applicable here; S13 native fault target remains outstanding. S11's inherited955 passes/8 skips and four current CI successes are not S12 evidence.

### Complete topology and retained heads

Before creation28 registrations,20 prunable; afterward29, the same20 prunable. Paths below are under `/tmp/opencode/` unless absolute. `P` means prunable registration, including any accessible partial directory, with contents unverified; `C` means accessible registered tree with tracked state inspected. Every pre-existing ref/metadata/path is preserve-only. The ten delivered class heads match remote heads; unused original07/08 registrations are retained too.

| Worktree | Full HEAD | State |
| --- | --- | --- |
| `/home/adrian/Projects/afergon-ai` | b558aadbef0390c5e9ca833d6b34af1303ffb67a | C, dirty originals preserved |
| afergon-ai-ci-pnpm-release-pin | 493c1b81441bcbdd814509ccb2aab32d3b13fc89 | P |
| afergon-ai-class-07-split-plan-publication | cb7ab85405f20c42d2a36262977f150cbab87434 | P |
| afergon-ai-class-08-split-plan-publication | ab54a695fa796e34a50cda41c5a4064b13eeb0d7 | C |
| afergon-ai-class-architecture-plan-publication | 7dc66285ae6b185af51048563673120a44e09ed5 | P |
| afergon-ai-issue94-artifacts | 0c0c8e348afcff7e50f12029ad0c01c676f6400f | P |
| afergon-ai-issue94-p1-plan-publication | a37daeec2d1fee936f0aa7977704bbce49297e40 | P |
| afergon-ai-merge-pr83-main | 38e452783e5d52b0c6829ef1a947a566930c294d | P |
| afergon-ai-reasoning-effort-p1-class-05 | 06a0748312f109b0292d8db60253d1f1f4371794 | P |
| afergon-ai-reasoning-effort-p1-class-06 | a55ef80d29f0e11892c89f7ddd0b1d8bdfea968c | P |
| afergon-ai-reasoning-effort-p1-class-07 | a55ef80d29f0e11892c89f7ddd0b1d8bdfea968c | P, unused original07 |
| afergon-ai-reasoning-effort-p1-class-07a | 530e351fc8f773fe811a7a344fa3065daa49f64e | P |
| afergon-ai-reasoning-effort-p1-class-07b | cebcd6044a5be606b0059c2002357cd1c1cc843f | P |
| afergon-ai-reasoning-effort-p1-class-08 | cebcd6044a5be606b0059c2002357cd1c1cc843f | P, unused original08 |
| afergon-ai-reasoning-effort-p1-class-08a | 1ada42fd504fab645ec7ebca615b34195519f0a7 | C |
| afergon-ai-reasoning-effort-p1-class-08b | fe1189b74c10835a7f279f1e5aa5a0d73ec4a76f | C |
| afergon-ai-reasoning-effort-p1-class-08c | 777b9022bc06392e8c69b606a9a80fe6c4882ee3 | C |
| afergon-ai-reasoning-effort-p1-class-09 | 402722a1892f62dae621ac7bbe69adcdb38d3c8f | C, node_modules preserved |
| afergon-ai-reasoning-effort-p1-class-10 | 5d6d45bd2dbc5807413c4c8bfb9ab4f6d61098c0 | C, node_modules preserved |
| afergon-ai-reasoning-effort-p1-class-11 | 649b6032df695f064e77d3563b025aa34ad5811e | C |
| afergon-ai-reasoning-effort-p1-class-12 | 649b6032df695f064e77d3563b025aa34ad5811e | C, new owned checkpoint |
| afergon-ai-reasoning-effort-p1-exact-byte-snapshot-lifecycle | 071afba72776961a4a68a6e6e780c47a35ee4be7 | P |
| afergon-ai-reasoning-effort-p1-pure-edit-preparation | 9f53f838e2dd5e0ca916285cf81051502ddce8b9 | P |
| afergon-ai-reasoning-effort-p1-pure-edit-preparation-tdd | 08d6a22c398d799dbcc0bccf291ab712be6d9279 | P |
| afergon-ai-reasoning-effort-p1-read-validation | db9d2962f8ba0228f5f176de82c1ac8b01c2d2b0 | P |
| afergon-ai-reasoning-effort-p1-targeted-migration-atomic-writer | 8963d8e5aa16a91b7a131e9405c58f9636c33301 | P |
| afergon-ai-reasoning-effort-persistence | 2887100dbfb64cf1cc9371f190f934b850450ffb | P |
| afergon-ai-remove-retirement-receipts | 9d247053da2f483311dfaa92582d3e2beada35be | P |
| afergon-ai-stabilize-retirement-cleanup-verification | 5bc2263243e30707afb93de0826ca321ce0b18a6 | P |

### Measurement and complete remaining forecast

Counts are additions plus deletions against exact published S11, not a cap or implementation proof. Only the D body93 is a measured source workload; all unimplemented rows are estimates with explicit obligations. Unchanged inherited helpers/graphs cost0; any edits or replacement deletions must be added. No initial fixture, result, loader, hook or runtime evidence is treated as free.

| Layer | Complete forecast | Grounding / remaining work |
| --- | ---: | --- |
| Application class/data contracts | 45–65 | Five stored collaborators, input/result imports/interfaces, exact read/validate/guard/no-op/recheck/acquire/receipt/promote/validate/recheck/persist order; no production ports or checker framework |
| Ten original real D cases | 123–138 | Measured93 existing body lines plus30–45 imports/real storage+saver+snapshot construction/binding and semantic hooks; retain disk/result/error/backup/save0 assertions |
| Additional memory tests/fixture | 100–145 | Complete storage/snapshot roles and actual reader/preparer/policy, initial migration then T1 throw then T2 late conflict; source/candidate future, invalid candidate, no-op, legacy, v2, first conflict, read failure, incomplete receipt and persist failure; identity/bytes/candidate closure and real constructor/ambient guards |
| Architecture helper/fixtures/tests | 145–225 | Pure typed input + graph traversal/layer/composition-root checks and scope-aware syntax/alias/host checks90–140; synthetic adversaries/clean-shadow-string positives35–55; test-only real repository AST/edge loader20–30 |
| Emitted Update runtime evidence | 20–35 | Direct emitted import and controlled legacy/migration scenarios with isolated HOME/XDG/config/state, no public wrapper |
| README | 6–8 | Actual callable inactive capability and migration/old-writer limitations |
| Complete S12 result/evidence | 130–155 | This checkpoint plus contemporary individual RED/GREEN/TPP/triangulation/exact-command/count/forecast rows and final evidence; no invented cycles |
| Plan/index/clarification churn | 8–12 | Both sides of approved wording clarification and checkpoint/completion deltas; no policy rewrite |
| **Total** | **677–883** | Single best cohesive S12; no extra prefix, compression or removed evidence |

Measured D ranges at preserved D HEAD: D03 568–572=5; D04 573–581=9; D13 652–661=10; D14 662–669=8; D15 670–679=10; D17 687–697=11; D18 698–709=12; D19 710–721=12; D21 729–736=8; D22 737–744=8; sum93. Python used `subprocess.check_output(["git", "show", head + ":tests/model-profiles-persistence.test.ts"])`, split lines and summed inclusive ranges; exit0, actual93. This is static measurement, not ten executed tests. Original55 other D integration cases remain S13; no all218 acceptance claim.

### TDD and local-gate checkpoint

Source/helper TDD: not started; zero new original D, memory or synthetic negative cases executed; zero RED/GREEN/T1/T2 cycles or TPP transformations claimed. No minimal class seam or constant checker was added after the forecast failed. Current positive inward tests at focal576–614 and snapshot-runtime7–29 remain unchanged; their domain-edge restrictions and StoredAssignment constructor checks must remain. They are not synthetic checker negatives or new failure evidence.

After a scoped size decision, begin exactly one compilable migration assertion RED: acquire input is `{ source: loaded.source, recoveryDocument: loaded.document }`, original pre-migration document, while the independent candidate closure remains raw1 until completed receipt. Minimal GREEN, then snapshot-throw T1 RED/GREEN, then second-recheck-conflict T2 RED/GREEN, with contemporary measured projections before the next change. New checker begins an empty result and genuine bad-graph assertion RED; advance only through sequential adversaries. No historical class/graph behavior is relabelled RED.

Outstanding exact final gates: owned single-name filters recorded as each test is introduced; `pnpm exec vitest run tests/model-profiles-use-cases.test.ts tests/model-profiles-architecture.test.ts tests/model-profiles-persistence.test.ts tests/model-profiles-storage.test.ts tests/model-profiles-snapshot-inspection.test.ts tests/model-profiles-snapshot-acquisition.test.ts tests/model-profiles-snapshot-runtime.test.ts --no-file-parallelism`; `pnpm typecheck`; `pnpm build`; `pnpm run health:runtime`; inherited emitted reader import and direct emitted Update execution; original quartet `pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism`; `pnpm test` with300s isolated HOME/XDG/config/state. Expected exit0, actual not run; full-suite rebuild and restored spies required. Existing pnpm tool workaround may be reused without repository config changes. Native S13 fault coverage and fresh Review remain outstanding.

## Blockers or Deviations

- Complete projection exceeds S12 normal375/399; no S12 exception exists. Stopping early avoids an unsafe partial Update delivery. The93-line measurement defeats the old real-case allowance, and the newly required pure AST/scope checker cannot be replaced with class-name/string-presence checks.
- No source, helper, fixture, test, comment, whitespace or evidence was removed/compressed; no further slicing, old source ancestry, UI/host activation, S13 implementation, delegation, PR, merge or history rewrite.

## Notes

- Snapshot recovery source/candidate clarification is settled spec16/S11 behavior, not a new design decision. Final source recheck/atomic rename is not CAS; completed backup survives later failure.
- Rollback boundary: this new checkpoint artifact and Plan12's clarification/checkpoint delta only. All other paths preserve/no transfer/no stage. This checkpoint is Markdown-only; no runtime boundary changed.

## Next Step

Parent requests an explicit S12-only size exception for the complete cohesive unit, retaining all contracts and evidence. Resume only after that decision and renewed five-category/base/check inventory; do not infer authority from prior exceptions or publish this as completed S12.
