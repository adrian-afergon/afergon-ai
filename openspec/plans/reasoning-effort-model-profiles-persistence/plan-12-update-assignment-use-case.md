# Plan12: Constructor-injected update orchestration and failure ordering

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete port-driven update capability.

## Summary

Move all update sequencing into `UpdateProfileAssignmentUseCase`. Constructor-injected storage/snapshot ports and concrete read/prepare/validation collaborators make ordering/failure behavior directly testable with in-memory capabilities. Infrastructure selects adapters; application never reaches Node/environment or legacy config.

## Planning Scope

Full source/candidate validation, future/no-op refusal, real-change source checks, completed snapshot before version2, final validation/recheck and atomic persist. Preserve D semantics; no lifecycle/bulk/clear/delete/host projection API. Original public update composition follows13.

## Design Rule Alignment

- Proposed `application/update-profile-assignment-use-case.ts` owns business orchestration; no helper/class static method can retain fs-direct business sequencing.
- Constructor receives Read/Prepare use cases, concrete ProfileDocumentPolicy, ProfileStoragePort and SnapshotPort. Concrete collaborators need no invented use-case interfaces absent alternate implementations.
- All use-case parameters/results are data interfaces, with raw document/Uint8Array observation contracts and diagnostic identities; no ProcessEnv/Buffer/fs-stage leakage.
- Ports represent genuinely replaceable capabilities; memory fakes must prove constructor injection, not merely monkey-patch Node.

## Assumptions

Local reversible assumption: readable fake logs/shared real-order/checker fixtures retain allocated assertions within source/test/result estimates. Existing D behavior remains characterization; new seams give RED only when genuinely missing. Reforecast all growth at checkpoints; approved basis is not assumed.

## Design Tensions

None

## Vertical Slicing Decision

Complete update case ships after actual storage/snapshot capabilities, with relevant fake-driven behavior tests/docs/result. It is independently callable with production or memory capabilities.13 is a composition/compatibility source unit, not a tests-only follow-up.

## Execution Strategy

Approved replacement chain:05→06→07→08→09→10→11 → 📍12 →13. Future p1-class-12 branch/worktree follows exact index collision/disposition checks after reviewed PR104-rooted docs/renewed gate and accepted predecessors; reinspect five categories. D closed-source baseline/root originals read-only, stage/transfer none today.

Future owned: application update case/contracts,10 real-adapter original D order cases, additional memory fakes and `tests/model-profiles-architecture.test.ts` checker/helpers/synthetic fixtures, README, correction/S12/RESULT.md and deltas. Revised source45–65/tests155–205/docs6–8/result65–75/artifacts8–12 =279–365. Test upper includes approximately70 real-order/55 memory/80 checker+fixture lines, counting helper additions/deletions; genuine cycle/result expansion must reforecast. TEST-ALLOCATION specifies exact ten IDs;13 retains55 original real integration cases. Prefer350/STOP375/hard399; no test/evidence cap or proved fit.

## Implementation Steps

- [ ] Construct update using in-memory storage/snapshot capabilities; assert callable behavior with no ambient Node/env access.
- [ ] Retain complete source/patch/candidate validation and future-version refusal before write-side port calls, including no-op>2.
- [ ] Implement changed/migration sequencing: recheck, completed snapshot, version2, final validation, recheck, persist.
- [ ] Prove injected failures stop later capabilities and preserve source/candidate flags; reconcile D order semantics and owned evidence.

## Interfaces and Technical Contracts

`UpdateAssignmentInput { profileName: string; agentName: string; patch: AssignmentPatch }`; `UpdateResult { configPath: string; version: number; snapshotPath?: string }`. configPath is diagnostic identity copied from observed source for old API compatibility; application does not interpret it as filesystem path.

`UpdateProfileAssignmentUseCase(reader: ReadProfileDocumentUseCase, preparer: PrepareProfileAssignmentUseCase, validator: ProfileDocumentPolicy, storage: ProfileStoragePort, snapshots: SnapshotPort).execute(input): UpdateResult`. Read use case receives the same storage collaborator in composition. No constructor defaults reach process.env/fs.

Import RawProfileDocument from06's DOMAIN owner, ProfileDocumentObservation/LoadedProfile from07's APPLICATION owner and shared snapshot input/receipt from10.07 reader accepts observation-only role;09 supplies complete storage role;11 supplies complete snapshot role. Update delegates future eligibility to06 requireSupportedVersion(...,"update") before no-op/write-side capabilities. It is the sole production raw atomicPersist caller; composition must never bypass it for extended writes.

Order is exact: read/source validation → prepare/whole candidate validation → explicit future-candidate refusal → no-op return or pre-migration recheck → SnapshotPort.acquire if migrationRequired → apply version2 only after complete receipt → full final validation → immediately pre-save recheck → atomicPersist. Snapshot adapter also rechecks immediately before exclusive acquisition. Legacy-only change preserves absent raw version; prospective prepared version is not prematurely assigned. v2 update never calls snapshot.

Invalid source/patch/candidate/future version, including future no-op, prevents snapshot/persist. No-op invokes neither recheck nor snapshot/persist and retains exact bytes/version/prior backup. Receipt failure/incompleteness cannot permit version2/persist. Completed snapshot survives later failures. Return snapshotPath only for this invocation's completed created/reused migration receipt; return effective version for no-op or successful update.

The use case retains09's source identity and Uint8Array observation through all rechecks; no reserialized observation. Final recheck does not promise CAS between it and rename. No callback/projection/host operation exists.

## Acceptance Criteria

- [ ] In-memory injected storage/snapshot capabilities fully drive execution without real I/O or ambient env.
- [ ] Observable call order exactly matches original migration/validation/recheck sequence, including snapshot before raw version promotion.
- [ ] Invalid/future/no-op/legacy-only/v2 cases call only permitted capabilities and retain source/candidate invariants.
- [ ] Every injected source/snapshot/persist failure prevents later calls; application has no Node/legacy/infra imports.
- [ ] Complete case/tests/docs/result reviewed together and budget measured; no source activation or P1 completion claim before13.

## Verification

Initial assertion RED: fake snapshot observes candidate's raw version still1 and persist sees2 only after completed receipt. T1 after GREEN: fake snapshot throws and persist remains uncalled. T2 after GREEN: second recheck conflict preserves external memory bytes and prevents persist despite completed backup. Additional source-future no-op, invalid/future candidate, first recheck failure, v2/no-op exact preservation, absent bytes and real non-Buffer Uint8Array enter individually.

Use future exact index focal/single-name/regression/build/health/emitted/full commands; explicitly run new `tests/model-profiles-use-cases.test.ts` and `tests/model-profiles-architecture.test.ts` with Vitest/no-file-parallelism. Fake call logs assert collaborators/call order/error identity; guard real fs/env to demonstrate no ambient I/O. Import-graph tests resolve transitive inward violations and exercise methods with injected capabilities; names/folders alone are insufficient. Results retain strict lowest TPP/exact genuine RED and sequential adversaries, with passing old behavior labelled characterization.

Checker contract is a pure test-owned graph/syntax analysis helper receiving in-memory module text, resolved edges/layers and declared composition roots. Synthetic negatives prove domain→application, domain→infrastructure, domain→legacy, indirect forbidden chains, inner node:fs/other Node imports, process.env/globalThis.process/aliased globals and host process calls reject; misleading compliant names/folders cannot make them pass. Positive clean transitive graphs/local shadow bindings, constructor-only assignment and fake-capability execution pass. Constructor behavior guards actual I/O; syntax checks alone are insufficient. Negative checker assertions are genuine executable REDs when detection is absent, never compiler errors. No new production architecture framework/interface or test-only source PR.

The ten allocated original D cases use real Node adapters/storage/snapshot/saver constructed explicitly in test setup, preserving disk/backup assertions; they are separate from new in-memory fake cases.13 retargets their shared entry binding to original wrapper for final full-suite compatibility, counting replacement churn. This keeps12 a complete production use-case behavior delivery while avoiding a tests-only follow-up.

Produced: application ownership/order contract and approved basis. Not applicable now: tests/build. Outstanding: parent targeted re-review, separately authorized planning publication, renewed Implement gate and future seam/architecture/native/budget evidence.

## Open Questions

None

## Dependencies

Accepted07 reader/08 preparation/09 complete storage/11 complete snapshot plus06 validator; corrective docs/gate.13 binds original APIs. Original P2/P3 still blocked on full corrected P1 acceptance.

## Risks and Watchouts

Do not replace constructor injection with parameters defaulting to globals. Do not pass Node Buffer checks into domain/application. Candidate mutation/version tests should observe semantic collaborators, not rely on exact validator call-count internals. Strict preservation concerns behavior, not stale function-spy implementation coupling.

## Completion Condition

Plan is ready-with-assumptions: approved replacement basis, no questions/tensions, local reversible fixture estimates. Publication/new source approval still pending. Completion requires injected use-case behavior/inward/no-I/O proof, preserved D sequencing, result/review/native checks and measured≤399; compatibility/fs integration remains13.
