# Plan11: Complete owned snapshot acquisition through a semantic port

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete creation/reuse/cleanup capability.

## Summary

Deliver `SnapshotPort.acquire` with a complete `NodeMigrationSnapshotAdapter` class using09 storage recheck and10 concrete inspection. Exclusive create, fsync/close, retry protection and owned partial cleanup ship together. No partial writer prefix is accepted.

**Execution checkpoint, 2026-10-20: blocked by S11 size gate.** See [S11 RESULT](../../results/reasoning-effort-model-profiles-persistence/correction/S11/RESULT.md) for source-grounded complete projection, genuine seam cycles and frozen unstaged work. No S11 exception, completed creator, review or publication is claimed; all completion checkboxes remain open.

**Later S11-only authorization, 2026-10-20:** user “Autorizo” explicitly grants `size:exception` for complete acquisition/cleanup/tests/evidence and continuation from that checkpoint. No new numerical cap;183/423–457 remain historical, not bounds. This overrides only S11's STOP375/hard399, including the completion ceiling below. Amend spec/index/result before resumed code, count every layer against exact published S10, preserve meaningful code/spacing/comments/evidence, no further slicing or scope expansion. S12/S13 retain normal375/399; S09/S10 and A/B450 exceptions remain independent. Functional contracts, Review and native CI gates are unchanged; no extra docs PR is required for this approved revision.

## Planning Scope

Snapshot wx/private0600 creation, immediate post-preflight source recheck, exact bytes/defaults, EEXIST validation/reuse, all stage faults and owned cleanup/AggregateErrors. No config persist, lock/CAS, host I/O or receipt-based arbitrary delete API.

## Design Rule Alignment

- Application snapshot-port.ts imports AcquireMigrationSnapshotInput/SnapshotReceipt from10's application/migration-snapshot-contracts.ts and exposes acquire. No shared redeclaration; actual NodeMigrationSnapshotAdapter implements complete SnapshotPort.acquire, unlike10's inspection-only class.
- Infrastructure `node-migration-snapshot-adapter.ts` receives injected fs, concrete inspector and `Pick<ProfileStoragePort,"recheck">` by constructor. Separate snapshot capability is justified by C's standalone recovery use and failure lifecycle.
- Private fd/partial handle ownership remains adapter-local. Constructors only assign; no class merely wraps the old direct-fs function statically.
- Domain policies remain fs/legacy/Node-free; adapter uses06/10 validation rather than duplicating rules.

## Assumptions

Local reversible assumption: named descriptor-aware stage/cleanup fixtures retain all invariants with shared setup within source/test/result estimates. Estimates are not caps; genuine cycles/error evidence require reforecast at checkpoints. Replacement basis is approved, not assumed.

## Design Tensions

None

## Vertical Slicing Decision

Port + actual class + complete safe acquisition/fault lifecycle form one callable capability. Prior10 is read-only, so no unsafe incomplete creator lands before cleanup. Existing-backup ownership never transfers to the creator.

## Execution Strategy

Approved replacement chain:05→06→07→08→09→10 → 📍11 →12→13. Future p1-class-11 branch/worktree follows exact index collision checks from accepted predecessor after reviewed PR104-rooted publication/renewed gate and five-category audit. Old closed C/D source/results/tests/root originals preserve-only; stage/transfer none today.

Future owned: acquire port importing10 datatypes, complete adapter/acquire+recheck delegates, **all46 original C acquisition cases**/snapshot fault helper, new injection tests, README, correction/S11/RESULT.md and deltas. Revised source65–85/tests155–185/docs6–8/result65–80/artifacts8–12 =299–370. TEST-ALLOCATION retains21 refusal cases including14 invalid raw inputs at acquire, even though06/07/08/10 also validate. Inherit charged07 raw data/10 snapshot setup; count actual new/changed fault helpers/entrypoint assertions.5 lines remain beforeSTOP375: reforecast extra cycles, no truncation; prefer350/hard399, unproved local reuse.

## Implementation Steps

- [x] Bind semantic acquire to a class that validates expected bytes/recovery through10 before any write-side operation.
- [x] After validation create parent, immediately recheck09 source, then exclusive open0600/write/fsync/close and completed receipt.
- [x] Handle EEXIST via actual10 backup validation and exact reuse; never overwrite/delete prior data.
- [x] Own incomplete cleanup from successful exclusive open; preserve original plus all cleanup errors and protect completed backups.
- [x] Verify all real fault/mode/conflict/default/retry cases, direct callable port/no config save and owned result prepared for independent Review.

## Interfaces and Technical Contracts

`SnapshotPort.acquire(input: AcquireMigrationSnapshotInput): SnapshotReceipt` imports both shared types from10. They in turn import application ProfileDocumentObservation from07 and domain RawProfileDocument from06. No local type redeclaration/missing acquire stub. Snapshot path is diagnostic output, not arbitrary deletion authority; NodeMigrationSnapshotAdapter implements real complete acquire with injected collaborators.

Use10's prepared expected state, no repeated divergent default serialization. Before acquisition validate source/recovery/future schema. Parent mkdir may occur only after validation; source recheck occurs after preflight and immediately before exclusive open, preserving timing conflicts injected during mkdir. On EEXIST inspect the actual competing file, requiring parsed known-valid and exact expected bytes before reused receipt. Earlier inspection does not replace this race-time verification.

Future acquisition admissibility is06's concrete DOMAIN requireSupportedVersion(...,"snapshot"), reached via10; no unexplained adapter business guard. Recovery-match refusal is06 policy, structural Node comparison/default mechanics10, byte equality/file ownership11. Complete46-case original acquire matrix remains here and is distinct from new standalone inspector evidence.

Exclusive wx requests0600, writes full exact bytes, fsyncs and closes before completion. Existing source/backup permissions remain unchanged; no chmod. Cleanup accepts only invocation-owned incomplete internal handle, attempts close/removal independently, preserves all close/removal errors and wraps original+cleanup in AggregateError where necessary. Never remove completed or pre-existing backup. A completed backup may remain after later12/13 failure; reuse requires exact verified match.

Compatibility facade preserves original Buffer-required observation failures; inner SnapshotPort accepts actual Uint8Array. Both validate presence/absence consistency before mkdir. No universal crash durability, locking or hostile concurrent-backup replacement protection is newly promised.

## Acceptance Criteria

- [x] Exact present/default backups, completed receipt, fsync/close/private creation and valid retry all preserve C behavior.
- [x] Source changed/deleted/appeared pre-open fails closed; permission faults propagate and source remains intact.
- [x] Every open/write/fsync/close and cleanup remove/close/both fault retains original/cleanup errors and correct ownership.
- [x] Existing/completed backup bytes/mode survive failures; no config saver/host/live route; complete capability/tests/docs/result stay together.

## Verification

Initial seam RED: adapter's injected recheck failure prevents exclusive open. T1 after GREEN: mkdir-stage source appearance is detected before acquire; T2 after GREEN: EEXIST file created after earlier inspection is verified rather than trusted. Existing snapshot fault/cleanup/mode behavior may pass extraction; retain real Node tests as characterization and explain any unavailable genuine adversaries. Never manufacture RED through missing compile/API.

Use index future exact focal/single-name/regression/build/health/emitted/full commands and owned port/architecture tests. Restore fd-aware spies/umask per case, assert source/backup/temp byte/existence invariants, distinguish own partial/prior complete files and retain three POSIX-only permission cases with unchanged native Windows behavior. Result includes exact cycles/lowest TPP/all headings and evidence status. Linux text parity cannot replace native Windows checks.

Produced: full lifecycle/source audit contracts and approved basis. Not applicable now: tests/build/installer changes. Outstanding: parent targeted re-review, separately authorized planning publication/renewed Implement gate and future fault/architecture/native/budget evidence.

Local execution evidence, 2026-10-20: all46 original acquisition cases plus24 additional class/graph/emitted cases, same42 inspector and51 storage assertions, explicit six-file571pass, typecheck/build/health/emitted reader and actual emitted complete acquire pass, legacy quartet132pass/3skip, full955pass/8skip. S11 RESULT preserves12 genuine cycles, characterization reasons, all-layer measurements and original recovery integration. Local execution complete under S11-only exception; independent Review/publication/current-head CI remain external, full native persistence/fault target13 remains future. No S12 work or live activation.

## Open Questions

None

## Dependencies

Accepted09 source recheck and10 inspection,06 validator/07 defaults/observation; corrective publication/gate.12 can orchestrate only after complete11. P2/P3 wait for13 acceptance.

## Risks and Watchouts

Cleanup failure must never appear as successful receipt. Partial unknown existing snapshots intentionally block retry; no generic delete/recovery action. SnapshotPort independence does not imply a config transaction or new lock system. Recheck cannot close later saver compare-to-rename gap.

## Completion Condition

Plan is ready-with-assumptions: approved replacement basis, no questions/tensions, local reversible fixture estimates only. The later explicit S11-only authorization above satisfies the renewed Implement gate and overrides S11's old measured≤399/STOP375 completion ceiling without a new cap; report full measured size. Completion requires complete port/adapter/ownership semantics, all46 C cases, local fault/class/emitted evidence, tests/build and result. Independent Review and current-head external CI remain subsequent gates; native full persistence/fault target remains13, not inferred from baseline launcher CI. Other deliveries retain their own limits.
