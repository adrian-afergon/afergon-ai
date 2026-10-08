# Plan D: Complete targeted migration and atomic persistence

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready.
- **State**: ready
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; D completes approved A → B → C → D.

## Summary

Complete original task001 by integrating A validation/read, B pure targeted preparation and C snapshot/source checks with the existing atomic saver. D is the only new capability that persists structured assignments. It remains inactive in every live workflow; P2/P3 can proceed only after full original storage acceptance and review.

## Planning Scope

Direct bounded assignment update, no-op exact preservation, v1→v2 ordering/retry, future-version refusal, targeted disk round-trip and precommit save faults, detectable races and inactive full verification. No bulk candidate lifecycle adapter, clear/delete, clone/switch persistence, resolution, export, provider validation, projection or UI/installer activation. Index maps all original requirements without omission.

## Design Rule Alignment

- Writer in vertical infrastructure consumes pure infrastructure preparation, domain patch contracts and validated raw documents; no inward dependency violation or broad live type propagation.
- Reuse `saveConfig`'s exact serialize/write/fsync/close/temp/rename/cleanup body; widen only parameter to `AfergonModelConfig | Record<string, unknown>` (one replacement costs2 lines).
- Never call legacy `loadConfig`, live normalization or projection callbacks. Do not expose through live barrel. Domain remains filesystem-free.
- Tests/docs/result belong to D's semantic writer integration, not a separate tests-only delivery; initial plan artifacts are published predecessors.

## Assumptions

None

## Design Tensions

None

## Vertical Slicing Decision

D integrates complete safe persistence only after all three accepted support capabilities. No unsafe structured writer lands before snapshots. All original acceptance criteria are proved across the chain, with D owning final integrated evidence. P3 owns future candidate lifecycle adapter against these guarantees.

## Execution Strategy

Sequential reviewed A → B → C → D. Before authorized execution reinspect full topology/all five Git categories and index dispositions; check exact branch `feat/reasoning-effort-p1-targeted-migration-atomic-writer` and corresponding worktree unused locally/remotely/on disk. Base on accepted C, charge only D delta; never reset/rewrite inherited Unit1 or absorb original root artifacts.

Allowlist: writer additions to `scripts/lib/model-profiles/infrastructure/profile-store.ts`, sole saveConfig parameter union in `scripts/lib/model-profiles-config.ts`, focused `tests/model-profiles-persistence.test.ts` additions, bounded README internal migration/recovery/old-writer guidance, `D/RESULT.md`, verified D-plan checklist changes. No C algorithm duplication or historical PLAN/RESULT updates.

Forecast new writer45–70 + saver2, tests125–170, docs10–14, D result80–100, plan6–10 =268–366. Approximately12–16 integration/fault cases plus descriptor-helper reuse explain tests; C faults/clone coverage are inherited, run again but not re-added. Edits to inherited writer/test/README/plan files count additions AND deletions, including helper replacement churn; new result counts final additions. Evidence includes full mapping and genuine exact writer cycles produced with source, never prepublished. Prefer350, STOP375, hard399; reforecast extra cycles/review fixes each GREEN, never truncate evidence or count inherited chain/historical result again.

## Implementation Steps

- [x] D1 bind bounded update to A/B, validate whole source/candidate and refuse future versions before write-side I/O; exact no-op returns without save/snapshot.
- [x] D2 integrate C snapshot acquisition and two source rechecks, then migration version and existing atomic save; verify targeted reload/retry/absent-source/version cases.
- [x] D3 verify every config precommit fault, snapshot retained on failed save, cleanup where possible, source-conflict preservation and no host side effects.
- [ ] D4 complete original task traceability, internal-only recovery docs, full original final verification/native checks/review, and D result/budget.

### Ordered TDD and adversarial matrix

Every new behavior: ONE executable RED, lowest-sufficient Implement TPP GREEN; T1 RED/GREEN, then T2 RED/GREEN; refactor only green. No missing import/type error RED or whole fault algorithm before tests. Inherited passing C/saver/boundary cases remain characterization; document if no two genuine breaks can be found.

| Unit | Initial behavior | Sequential adversarial T1, then T2 |
| --- | --- | --- |
| D1 | No-op leaves exact mixedv1 bytes/version/snapshot untouched | Futurev3 nominal no-op refuses before write I/O; invalid nontarget known data/own patch undefined prevents save and backup |
| D2 | First structured change snapshots exact original before savingv2 | Source changes after snapshot but before save, preserve external bytes; failed save retry verifies/reuses snapshot instead of overwriting |
| D3 | Config rename failure preserves source with completed backup | Config serialization/write failure removes temp where possible; config fsync/close failure preserves source and retry remains recoverable |
| D4 | Full direct persistence works without live activation | Legacy workflows remain string-based and do not call new writer; emitted store import causes no host/config read or write |

Additional cases: legacy-only edit staysv1 even unrelated structured slots; structured-without-effort actual change migrates; identical structured patch does not; subsequentv2 saves retain string/object representations without new backup. Target foreign nested metadata/other profiles/aliases/prototype-like keys and missing profile preserve selection. Absent-source first edit snapshots default before new config; a newly appeared source refuses. Matching/mismatch/malformed backup, backup-stage fault, source deletion/change before acquisition and before save are inherited C scenarios plus integrated D assertions. Serialization/write/fsync/close/rename faults enter separately. No host callback exists.

## Interfaces and Technical Contracts

`updateProfileAssignment(profileName: string, agentName: string, patch: AssignmentPatch, options?: { env?: NodeJS.ProcessEnv }): { configPath: string; version: number; snapshotPath?: string }` is the bounded original API. No clear/delete or arbitrary candidate commit. Own undefined patch fields fail before cloning. Version reports effective result; snapshotPath appears only when this operation creates/verifies a migration backup.

Order: read/validate source and exact observation through A; prepare independent candidate through B; validate full candidate again and apply future-version mutation policy before mkdir/temp/backup. An unchanged patch returns immediately preserving original bytes/schema/snapshot, even mixedv1. No writes occur for invalid source/patch/candidate or future version>2, including nominal no-op.

For a real change, call C source recheck immediately before migration stage. If B migrationRequired, acquire C completed receipt (C also rechecks immediately before acquisition); only after completed snapshot set candidate version2. If not migrating retain source effective schema policy, without injecting a version field just because it was absent during a legacy-only change. Candidate raw metadata stays intact. Revalidate versioned candidate before save as pure work.

Call C `assertProfileSourceUnchanged` again immediately before `saveConfig(candidate, env)`. Then existing saver serializes/writes/fsyncs/closes temporary config and renames it atomically. No intervening asynchronous work/projection between recheck and call; no claim that this detects a concurrent change during saver serialization/write-to-rename. No lock/CAS/new writer transaction is added. Detectable byte/existence conflicts fail closed preserving external state; completed backup can remain and must be reported.

Backup failures prevent save; config precommit failures leave original bytes/version intact and may retain completed snapshot for retry. Never delete that completed/prior backup on config failure. Matching expected backup is reused; mismatch/malformed backup fails unchanged. Absent source uses C default snapshot and must still be absent at both checks. Rename is commit point; no postcommit rollback promise. Directory fsync is best effort; existing saver suppresses temp cleanup errors while reporting original failure, so cleanup success is asserted only when possible, not fabricated.

Serialization failure injection must reach the saver stage after normal JSON candidate validation (narrow spy), not use an unsupported cyclic document as a claimed valid input. Distinguish backup/config descriptors, pre/postrename faults and cleanup; restore spies per case. No broad saver-body rewrite to improve guarantees beyond original contract.

## Acceptance Criteria

- [ ] Direct targeted writer preserves metadata/omitted members/representation, handles aliases/own keys and no-op/future-version rules.
- [ ] Migration requires completed exact snapshot before version2 replacement; retry, absent source and detectable races obey C contract.
- [ ] All backup and config fault matrix assertions across C/D prove source/backup/temp/host outcomes honestly; no rollback after rename claim.
- [ ] Every original spec/task/PLAN acceptance row is produced, complete inactive built capability and legacy regressions pass.
- [ ] Docs/results/review/native checks and actual compliant budget complete before P2/P3 release.

## Verification

- [ ] Tests: sequential single-name cycles, focused suite checkpoints and full original regression/full suite.
- [ ] Build: explicit inherited include, typecheck/build/health/emitted import; inspect direct API and import graph.
- [ ] Additional Evidence: stage spies and exact bytes/backup restoration/no temp where possible; full index traceability, original Git commands, D result and native CI.
- [ ] Rule Compliance: exact saver body unchanged except input type; inward imports/static factory, full raw validation, inactive boundaries, budget/semantic ownership.

Exact original final commands; future only:

```text
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t "<exact single test name>"
pnpm typecheck
pnpm build
pnpm run health:runtime
node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"
pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism
pnpm test
```

All fixtures use temporary HOME/XDG_CONFIG_HOME/AFERGON_AI_CONFIG_DIR. Do not substitute tests or omit required rebuild. Result records all Implement headings, genuine exact cycle commands/RED reasons/TPP/GREEN/triangulation/refactor and final checks/statuses; unrecorded historical details stay unknown. Ubuntu Test/native Windows launcher obligations remain as original PLAN; Linux is not native Windows evidence. B's version is prospective; candidate source version is preserved until this snapshot-backed commit path applies migration.

README: internal-only callable support, sibling pre-v2 backup, migration/version rules, old writers unsafe despite bump, unsupported concurrency, freeze writes/retain full extended copies before rollback, consent for snapshot restoration losing later edits, no P2 export yet. No host cleanup needed for inactive P1. Produced now: supplied fresh review and planning contract corrections. Not applicable now: application tests/build. Outstanding: corrected-plan acceptance/re-review, all source/full/native checks/review, predecessors/publication/renewed gate and measured budget. Readiness remains contingent on those dependencies/gates.

## Open Questions

None

## Dependencies

Accepted complete A/B/C, reviewed planning ancestry and renewed implementation approval. D's successful full original acceptance enables original P2 downgrade and P3 resolution/lifecycle; P3 must plan its additional candidate commit adapter, never assume P1 supplies it.

## Risks and Watchouts

Old normalization discards objects/foreign fields; never route mixed candidate through it. Before rollback retain full extended documents and snapshot, remove dependent suffix first, freeze old writers, and restore only with informed consent. A schema number alone does not protect old writers. Reusing a completed backup is valid only with original expected byte equality. Actual review churn/fault helpers may exceed forecast: stop/replan rather than omit evidence. Already passing saver faults are characterization, not invented RED. The accepted compare-to-rename limitation remains explicit; forecasts do not waive checkpoints.

## Completion Condition

D completes only with all checkboxes/evidence, full original storage contract, mandatory result, measured≤399 source PR and required approval/native checks. Until then task001 and P2/P3 stay blocked. Ready D contract is not current implementation authorization, and planning produces no source PR or merge.
