# Plan C: Exact-byte migration snapshot lifecycle

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; C of approved A → B → C → D.

## Summary

Deliver a callable snapshot lifecycle with byte/existence source recheck, exclusive durable backup creation, valid exact-match retry, mismatch refusal, and owned partial-cleanup/error reporting. C never serializes or replaces structured configuration. D later consumes its source observation/receipt and performs the atomic save.

## Planning Scope

Sibling `config.json.pre-v2.bak`, byte preservation and default-state recovery for absent source, backup open/write/fsync/close faults, detectable source conflicts, reusable completed backup and partial cleanup. No config saver, host I/O, live activation, general locking, lifecycle commit or downgrade exporter. Index owns audit/ancestry/budget/traceability.

## Design Rule Alignment

- Put filesystem snapshot behavior at `scripts/lib/model-profiles/infrastructure/migration-snapshot.ts`, importing A validation and defaults as needed; no domain→infrastructure dependency.
- Interfaces describe observations, acquisition parameters and receipts; no inheritance or invented alternate implementation framework.
- Never use JSON reserialization of present source as exact backup bytes; retain A's same-read Buffer.
- Keep completed existing backup protected; cleanup authority is limited to a newly created, incomplete backup owned by this invocation.

## Assumptions

Local, reversible reuse: named descriptor-aware fault/conflict tables share stage setup and invariant assertions, retaining explicit special cleanup and absent-source cases. Reuse A's observation/validation and existing default state. Forecasts are not caps/proven sizes; extra cycles/helper replacement churn/review fixes require reforecast without evidence truncation. Byte equality/recoverability still require actual assertions.

## Design Tensions

None

## Vertical Slicing Decision

C is a complete recovery-support capability: callers can recheck, acquire/reuse and fail safely without ever writing structured config. It is not a writer-only partial migration. D owns pairing its guarantees with config replacement; P3 owns future whole-candidate lifecycle binding.

## Execution Strategy

Sequential source chain A → B → C → D, with C behavior dependent on A byte/validation contracts, not B's implementation. Reinspect full Git topology/all five categories and index dispositions before authorized execution. Exact future branch `feat/reasoning-effort-p1-exact-byte-snapshot-lifecycle`, worktree named for that slug; verify unused local/remote/path at execution.

Allowlist: new migration-snapshot module, focused `tests/model-profiles-persistence.test.ts` additions, bounded README snapshot/retry caveats, `C/RESULT.md`, and verified C-plan checklist delta. No saver or original history changes. Publish initial C plan and index delta separately before source consumption.

Reviewed forecast: source90–100 for observation/recovery/exclusive acquisition/owned cleanup, tests140–155 using named descriptor-aware fault/conflict tables/shared invariant assertions, result85–95, README5–8, slice PLAN6–10 = **326–368**. Explicit special cleanup and absent-source cases remain; all mandatory result headings/genuine exact-cycle rows/full verification remain. This is local reversible reuse, not a cap or proven final fit. Reforecast extra cycles/helper replacement churn/review fixes; inherited test/README/plan edits count additions AND deletions, not just final lengths. Prefer350, STOP375, hard399; never truncate evidence or charge inherited A/B/docs/historical RESULT again. Future exact-cycle result evidence belongs with C source, not doc predecessors.

## Implementation Steps

- [x] C1 implement exact observation comparison and exclusive completed snapshot acquisition, after all validation and immediate source recheck.
- [x] C2 verify/reuse valid existing exact backup, refuse mismatch/malformed backup and source existence/byte conflicts, including absent-source recovery.
- [x] C3 handle each backup stage failure and owned partial cleanup; preserve completed/prior backups and report cleanup failure honestly.
- [x] Run full original baseline, review no-writer/ownership boundaries, and persist complete C result and measured diff.

### Ordered TDD and adversarial matrix

Each unit: one behavioral RED, minimal lowest-sufficient TPP GREEN, then T1 RED/GREEN, then T2 RED/GREEN, then refactor green. An absent import/type error is not RED. Additional faults enter one at a time, never implement the entire fault algorithm first. Existing passing cases are characterization; document inability to find two breaks if applicable.

| Unit | Initial behavior | Sequential adversarial T1, then T2 |
| --- | --- | --- |
| C1 | Create recoverable exact snapshot before any config replacement | Source bytes change after observation; source appears after absent observation, each fails preserving external source |
| C2 | Reuse valid existing backup with exact expected bytes | Valid but byte-different backup refuses; malformed/partial backup refuses and is never overwritten/deleted |
| C3 | Failed backup write removes only newly created partial file | Backup fsync/close fault preserves source and cleans own partial; cleanup removal fault reports original+cleanup failure and never claims success |

Also cover exclusive-open fault/EEXIST acquisition path, backup write/fsync/close faults individually, unchanged completed backup after later config failure (D integration), source deletion/existence transitions, same JSON with different formatting bytes, multibyte data, structurally matching recoveryDocument accepted despite captured formatting, structurally mismatching recoveryDocument rejected before I/O, absent-source default snapshot, malformed recovery input refusal before mkdir, previously valid backup preserved on read/fs faults, descriptor close attempted, retry after owned partial cleanup. Config serialization/write/fsync/close/rename faults belong to D, not a fabricated C writer.

## Interfaces and Technical Contracts

`SourceObservation` interface: `configPath: string`, `exists: boolean`, `sourceBytes?: Buffer`. Present requires captured Buffer; absent forbids pretending a prior file existed. `assertProfileSourceUnchanged(observation): void` compares actual current existence and exact Buffer content; distinguish ENOENT from permission/read errors. Changed/deleted/newly appeared source fails closed and preserves external bytes. This function is exported for D's second recheck immediately before save.

`AcquireMigrationSnapshotInput` contains `source: SourceObservation` and validated `recoveryDocument: Record<string, unknown>`. `acquireMigrationSnapshot(input): SnapshotReceipt` first validates recovery JSON via A. When present, compare recoveryDocument structurally to the validated parsed captured source; do not reserialize it and demand byte equality, which would reject formatting-preserving input. Snapshot/source comparisons still use the actual captured Buffer bytes. For absent source recoveryDocument must be createDefaultConfig's default state; snapshot bytes are its deterministic pretty JSON plus newline. Reject invalid/future-version input before write-side I/O. D invokes only for actual v1→v2 migration.

`SnapshotReceipt` interface exposes `snapshotPath: string`, `disposition: "created" | "reused"`, and `complete: true`. Path is fixed sibling `${configPath}.pre-v2.bak`. The receipt is not permission to delete a completed backup, nor proof a later save committed. C creates parents only after validation; immediately before acquisition it rechecks source. Exclusive `wx` open, write full expected bytes, fsync, close, then return completed receipt. No structured configuration save or rename.

On EEXIST, read actual backup bytes, parse and validate known shapes, require exact expected bytes, then return reused receipt. Matching formatting/byte equality is required, not semantic JSON equality. Never overwrite mismatched/malformed backup. Backup read/permission failures propagate; no cleanup of a pre-existing file.

`cleanupOwnedPartialSnapshot(handle): void` is a narrowly scoped internal lifecycle operation using an opaque invocation-owned incomplete handle created only after successful exclusive open. It closes if needed and removes only that invocation's partial file. It cannot accept an arbitrary caller path or completed receipt. Acquisition invokes it on write/fsync/close failure; failure includes both original and cleanup errors (for example AggregateError), and leaves reported outstanding cleanup. Exported acquisition owns this cleanup; D does not call generic delete.

Ordinary error ownership is guaranteed, not concurrent hostile backup replacement protection. A complete backup remains after D save failure; retries verify exact bytes. C's source recheck cannot close D's compare-to-rename gap. No general multiwriter transaction or universal crash durability; backup fsync required, directory fsync best effort in reused D saver.

## Acceptance Criteria

- [ ] Present backups retain exact original bytes; absent-source backup restores the default state and source remains absent in C.
- [ ] Matching valid backup reuses; malformed/mismatch refuses without overwrite; all source existence/byte conflicts fail closed.
- [ ] Every open/write/fsync/close fault preserves source; owned partial cleanup works where possible and cleanup failure reports truthfully.
- [ ] Completed/prior backups remain protected; no config replacement/host I/O/live route, and all fault/result/review evidence retained.
- [ ] Reviewed reuse forecast revalidated and measured source delivery below400 with checkpoint respected, without evidence truncation.

## Verification

- [x] Tests: single-case cycles plus focused unit matrix; full original baseline below.
- [x] Build: inherited explicit include, typecheck/build/health/emitted store import; inspect emitted snapshot module.
- [ ] Additional Evidence: stage-specific fs spies/descriptor discrimination restored per case, byte restorability/temp/source assertions, original Git commands and C result/native CI.
- [ ] Rule Compliance: review snapshot ownership/retry/source checks, validation before I/O and no config-writer imports/calls.

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

Isolate HOME/XDG_CONFIG_HOME/AFERGON_AI_CONFIG_DIR, discriminate backup/config descriptors and pre/postcommit failures; never user's files. C result uses every Implement heading and genuine exact-cycle command/RED/TPP/GREEN/triangulation/refactor, never prepublished future passes; unrecorded historical details stay unknown. Produced now: supplied fresh review and corrected arithmetic/contract planning audit. Not applicable now: application tests/build. Outstanding: corrected-plan acceptance/re-review, publication/renewed gate and all implementation/full/native checks/review.

## Open Questions

None

## Dependencies

A supplies validation and same-read byte observation; source sequence also follows accepted B. Reviewed planning predecessors, accepted corrected plan and renewed gate precede execution. D needs completed C; P2/P3 wait for D.

## Risks and Watchouts

An existing partial snapshot intentionally blocks retry instead of silently deleting data of unknown ownership. Permission errors are not absence. Equality requires original bytes, never JSON.stringify of present source. Refusal may leave a completed valid backup after source conflicts; report it. No rollback after D's rename, and no old-writer concurrency support.

## Completion Condition

C is ready-with-assumptions for local reversible reuse; execution awaits accepted corrected plans, publication and renewed gate. Completion requires actual lifecycle/fault/cleanup/source/no-writer evidence, complete result and compliant measured reviewed PR. It does not itself migrate persisted version or complete task001.
