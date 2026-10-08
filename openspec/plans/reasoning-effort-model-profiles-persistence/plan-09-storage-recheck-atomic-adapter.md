# Plan09: Semantic source recheck and unchanged atomic storage mechanics

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete internal storage capability.

## Summary

Extend07's actual Node storage class with semantic source recheck and atomic persistence through a concrete legacy-save adapter. No business migration/version policy is placed in the adapter. Preserve the saver body exactly; only its already-established parameter union is needed relative to PR104.

## Planning Scope

Bound identity/existence/byte conflicts, ENOENT/error differentiation and real saver serialize/write/fsync/close/rename/cleanup behavior. No public structured update route, snapshot implementation, locking/CAS or new durability claim. Low-level atomic mechanics do not complete task001.

## Design Rule Alignment

- APPLICATION profile-storage-port.ts declares ProfileStoragePort extending07's complete ProfileObservationPort with recheck/atomicPersist. NodeProfileStorageAdapter now implements all three actual methods, with no missing-method/throw-future stubs;07 claimed only observation.
- Adapter dependencies: explicit bound path/injected fs/defaults/`LegacyAtomicProfileSaverAdapter`; no ambient constructor reads.
- Saver adapter receives the legacy save function and captured environment; no generic fs interface leaks inward.
- Domain/application contain no Buffer, ProcessEnv, fd, temp filename or Node dependencies. No copy/refactor of45-line legacy saver body.

## Assumptions

Local reversible assumption: readable descriptor-aware fixtures retain full mechanical assertions within estimated source/test/result growth. Existing saver passes remain characterization, not new algorithm RED. Remeasure checkpoints; approved base is not assumed.

## Design Tensions

None

## Vertical Slicing Decision

Source recheck/atomic adapter is a complete capability used by snapshot/update. Keep internal-only with no original high-level update binding before13; direct low-level tests do not advertise a migration-bypassing product API. Mechanical faults are verified here so final integration is not a single oversized fault-test PR.

## Execution Strategy

Approved replacement chain:05→06→07→08 → 📍09 →10→11→12→13. Future p1-class-09 branch/worktree follows exact index collision checks from accepted predecessor after reviewed PR104-rooted planning publication/renewed gate. Preserve CLOSED obsolete PR heads/trees and root originals. No stage/transfer today.

Future owned: complete storage role/actual Node+saver classes, bound private env mechanics, sole saver parameter union, new primitive/cwd/source tests, README, correction/S09/RESULT.md and deltas. Revised source50–65/tests90–120/docs4–6/result55–65/artifacts8–12 =207–268. Include2-line signature churn, absolute-binding helper and subprocess/fixture additions/deletions. TEST-ALLOCATION assigns0 old218 cases: primitive tests are additional and do not replace D12's completed-backup/retry integration. Prefer350/STOP375/hard399; local reuse forecast only.

## Implementation Steps

- [ ] Extend actual storage class/port with exact observation recheck; validate observation consistency and bound diagnostic identity.
- [ ] Bind concrete atomic-save collaborator to the same captured environment/path used by observe; preserve saver body byte-for-byte.
- [ ] Verify all real precommit faults/temp cleanup limits and source existence transitions with descriptor-aware spies.
- [ ] Prove internal/inactive boundaries, whole baseline, result/review budget before snapshot acquisition/update.

## Interfaces and Technical Contracts

`ProfileStoragePort extends ProfileObservationPort`: inherited observe():ObservedProfile, recheck(source:ProfileDocumentObservation):void, atomicPersist(document:RawProfileDocument, source:ProfileDocumentObservation):void. Import domain RawProfileDocument from06 and application observation/ObservedProfile from07, never redeclare them. No fd/stage/env leakage; source identity is a configured capability token matched to the bound adapter, not caller-selected I/O authority.

Recheck present requires Uint8Array captured bytes; absent forbids bytes. Accept genuine non-Buffer Uint8Array at application capability boundary. Actual Node reads compare exact bytes and existence; only ENOENT maps to absence. Permission/read failures propagate; changed/deleted/appeared source fails “Profile source changed”. Compatibility wrappers later preserve their historical Buffer-only checks independently.

AtomicPersist is a trusted internal primitive: caller owns full validation/version/migration. Before12, no production atomicPersist caller exists; direct tests use only validated legacy documents/mechanical faults, never first extended writes. From12 the sole production invocation is UpdateProfileAssignmentUseCase through the port; composition instantiates but never invokes raw persist. No new backup guard/product restriction is inserted here. Source binds identity, not CAS. Rename/best-effort directory fsync/original cleanup-error behavior stay unchanged; no public extended-update API before13.

Absolute binding is infrastructure-only: select initial absolute path via path.resolve(getConfigPath(initialEnv)) with existing precedence; verify basename config.json. Create private boundEnv copying relevant initial variables and forcing AFERGON_AI_CONFIG_DIR to that absolute dirname. Assert getConfigPath(boundEnv)===selected absolute path. Observe/recheck use that path and LegacyAtomicProfileSaverAdapter(saveFunction,boundEnv).persist(document) invokes unchanged saveConfig with it. Relative env/cwd fallback resolved once; caller env mutation or later cwd change cannot retarget saver. Mere copying env is insufficient. Constructors assign, no inner ambient dependencies or legacy body/precedence rewrite.

## Acceptance Criteria

- [ ] Observation invalidity/mismatch/conflicts and real ENOENT/permission cases preserve external bytes/existence.
- [ ] Saver exact body unchanged; serialization/write/fsync/close/rename faults preserve precommit source, with honest temp cleanup/retry guarantees.
- [ ] Uint8Array role works with memory fakes/Node conversion; no infra data leaks inward and constructors do no I/O.
- [ ] Internal capability/tests/docs/result reviewed together; no public unsafe structured writer or activation.

## Verification

New seam initial RED: injected saver receives candidate at bound source instead of ambient default. T1: inconsistent/mismatched source identity fails before saver; T2: recheck sees a newly appeared source and preserves it. Introduce changed/deleted/read-error cases individually. Existing serialize/write/fsync/close/rename matrix is real Node characterization; retain assertions, do not rewrite saver to manufacture RED.

Additional real-adapter characterization uses isolated child-process cwd changes (not unsafe worker chdir): relative AFERGON override, relative XDG/HOME precedence and absent-env cwd fallback each initially select the legacy path, then later cwd/caller-env mutation still persists there. Assert original-location bytes/diagnostic identity and no file at new cwd. Test primitive with validated legacy data only;13 additionally proves final wrapper binding. New cases/fixture/subprocess code count in09, not old218 preservation credit.

Run index future exact commands plus owned port/architecture tests; compare full saveConfig body to published legacy baseline and D, permitting only signature type union. Serialization spy is activated inside saver after ordinary candidate validation; never label cyclic input valid. Restore fs/JSON spies per case and discriminate temp descriptors. Results require genuine exact cycles/lowest TPP/sequential adversaries or explained characterization and all mandatory headings.

Produced: storage/body audit contracts and approved basis. Not applicable now: tests/build. Outstanding: parent targeted re-review, separately authorized planning publication, renewed Implement gate and future source/fault/native/budget evidence.

## Open Questions

None

## Dependencies

Accepted07 actual reader, source sequence after08; planning/gate.11 uses recheck;12 receives complete storage role;13 binds final high-level API.

## Risks and Watchouts

Do not claim atomicPersist closes compare-to-rename gap or makes snapshots optional. Staging descriptors/ProcessEnv stay in infrastructure tests. No new lock system, durability rewrite or old live-writer type propagation is allowed.

## Completion Condition

Plan is ready-with-assumptions on approved replacement basis, no questions/tensions, local reversible fixture estimates. Publication and source implementation still require separate approvals. Completion requires source/fault/body/inward/inactive evidence, result/review/native checks and measured≤399; no product writer released by this prefix.
