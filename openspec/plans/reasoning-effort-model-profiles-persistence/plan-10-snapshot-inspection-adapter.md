# Plan10: Read-only recovery and existing snapshot inspection

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete read-only backup inspection.

## Summary

Deliver a meaningful `NodeSnapshotInspectionAdapter` class that validates recovery against captured source/default state and inspects an existing backup for valid exact-byte reuse. No create/cleanup writer lands in this slice. This separates real refusal/recovery behavior from owned acquisition, keeping both readable.

## Planning Scope

Observation/recovery consistency, future refusal, structural recovery equality, deterministic absent defaults, malformed/mismatch/read-error existing backups, complete reused receipt. No mkdir, open-for-write, config save, snapshot deletion or public acquire facade yet.

## Design Rule Alignment

- Infrastructure owns UTF8 parsing, Node isDeepStrictEqual, expected backup bytes/default serialization and sibling filename.
- Constructor receives bound source path, injected fs, concrete06 validator and default-provider adapter; no process.env/fs constructor work.
- Deliver shared APPLICATION `application/migration-snapshot-contracts.ts` containing AcquireMigrationSnapshotInput/SnapshotReceipt with the real inspector here. Import06 domain RawProfileDocument and07 application ProfileDocumentObservation;11/12 import these contracts without redeclaration. Internal expected bytes/filename stay infrastructure-local.
- No inspector port is invented:11 uses a concrete collaborator; SnapshotPort remains the meaningful replaceable acquire capability.

## Assumptions

Local reversible assumption: readable refusal/reuse fixtures share already-owned setup without whole-suite transfer and retain existing snapshot semantics within estimated source/test/result growth. Reforecast actual checkpoints; approved base is not an assumption.

## Design Tensions

None

## Vertical Slicing Decision

Complete existing-backup inspection/recovery verification is callable/read-only and independently useful to11. It is not an incomplete snapshot writer or ports-only PR. This grounds C's extra class/port overhead without forcing all recovery/fault cases into one near400-line delivery.

## Execution Strategy

Approved replacement chain:05→06→07→08→09 → 📍10 →11→12→13. Future p1-class-10 branch/worktree follows exact index collision checks from accepted predecessor after reviewed PR104-rooted docs/new gate; reinspect all five categories. Preserve closed C/source/history/root originals; planning only today.

Future owned: real inspector/shared application snapshot datatypes, shared snapshot setup/new standalone inspection tests, README, correction/S10/RESULT.md and deltas. Revised source65–85/tests65–90/docs4–6/result55–65/artifacts8–12 =197–258. TEST-ALLOCATION assigns0 old218 cases here: original C refusals/reuse all remain at acquire11. Shared setup is charged here,11 owns fault helper/case additions; count edits both sides. No empty SnapshotPort implementation. Prefer350/STOP375/hard399; local reversible forecast, not coverage cap.

## Implementation Steps

- [ ] Encapsulate expected-recovery validation in a class using captured Uint8Array or canonical default state; reject malformed/future/nonmatching input before write-side operations.
- [ ] Inspect existing backup through injected fs; ENOENT means missing, other read errors propagate.
- [ ] Return complete reused receipt only after parse/known validation/exact expected byte equality; protect malformed/mismatched files.
- [ ] Prove no write calls, exact default/key-order/formatting semantics and owned evidence before11.

## Interfaces and Technical Contracts

`NodeSnapshotInspectionAdapter(boundPath, filesystem, validator, defaults).inspect(input: AcquireMigrationSnapshotInput): SnapshotReceipt | undefined`. Public inspection result is undefined when no existing backup, complete reused receipt only when verified. It may expose an infrastructure-local `prepareExpected(input): ExpectedSnapshot` collaborator method to11 to avoid duplicated validation/serialization; that internal record is not an application port or product API.

This concrete real inspector does **not** implement SnapshotPort; acquire is not delivered until11. APPLICATION migration-snapshot-contracts.ts owns `AcquireMigrationSnapshotInput { source: ProfileDocumentObservation; recoveryDocument: RawProfileDocument }` and `SnapshotReceipt { snapshotPath: string; disposition: "created" | "reused"; complete: true }`. Declaration ships with actual inspection behavior, not standalone scaffolding; later consumers import it exactly.

Input uses07's ProfileDocumentObservation/06's RawProfileDocument; enforce present Uint8Array/absent no bytes/bound configured identity. Inspector delegates full validation and `requireSupportedVersion(recoveryDocument,"snapshot")` to06 DOMAIN policy, with original errors. Node parses captured bytes and computes existing isDeepStrictEqual structural comparison; domain `requireRecoveryMatch(matches)` owns refusal. This separates pure admissibility from Node comparison/default mechanics. Expected backup bytes are actual captured bytes, never present JSON reserialization.

Absent source requires equality with canonical createDefaultConfig state, regardless of recovery object's key order; expected bytes are canonical pretty JSON plus newline. Existing sibling `${boundPath}.pre-v2.bak` is read, parsed and validated at its own diagnostic path before exact byte comparison. Valid-but-byte-different, malformed or known-invalid backup refuses without write/delete/chmod. Existing read faults propagate, never become “missing”. Receipt carries snapshotPath/disposition:reused/complete:true, not config-commit proof.

Default state/path/serialization remain adapter mechanics; domain match policy receives comparison fact without importing legacy defaults/Node. Exact existing-backup byte comparison remains infrastructure file-identity verification; do not conflate it with structural recovery equality.11 must still execute acquire-entrypoint invalid/reuse cases even when all standalone inspector checks already pass.

## Acceptance Criteria

- [ ] Formatting/multibyte exact bytes and structurally reordered recovery behave exactly as C; absent defaults are deterministic.
- [ ] Invalid/future/mismatching recovery refuses before any write call; existing malformed/mismatch/permission files remain untouched.
- [ ] Exact existing valid backup returns completed reuse, missing returns no receipt, with no mkdir/write/delete/chmod.
- [ ] Class/collaborator ownership/tests/docs/result reviewed together and native parity remains explicit.

## Verification

Initial new seam RED: inspector refuses structurally nonmatching recovery without invoking write capability. T1: same JSON/different backup bytes refuses; T2: canonical absent defaults accept reordered recovery while expected bytes remain canonical. Existing equivalent cases may already pass when mechanically extracted; mark characterization and explain any inability to obtain two breaks. Never change working Node semantics for artificial RED.

Future exact index focal/single-name/regression/typecheck/build/health/emitted/full commands; inspection class tests assert injected capability usage/no write stages. Retain recovery invalidReads reuse, own observation inconsistency, future/malformed known backup diagnostics and previous read-fault preservation. Results record actual cycles/lowest TPP and evidence statuses; original C result remains historical.

Produced: source-grounded inspection contracts and approved basis. Not applicable now: tests/build. Outstanding: parent targeted re-review, planning publication approval, renewed Implement gate and future behavior/native/budget evidence.

## Open Questions

None

## Dependencies

06 validator/07 observation/default provider; source sequence after09.11 consumes complete concrete inspector; SnapshotPort acquisition is delivered with11, not empty now.

## Risks and Watchouts

Never semantic-compare existing backup bytes: exact equality is mandatory. Never reserialize a present source or stringify caller-ordered absent recovery. Inspection must not erase the distinction between ENOENT and EACCES or delete an unknown partial file.

## Completion Condition

Plan is ready-with-assumptions: approved replacement basis, no questions/tensions, local reversible fixture estimates. Publication and implementation gates remain pending. Completion requires read-only class/receipt/refusal semantics, no-write evidence, result/review/native baseline and measured≤399; no acquisition/config writer completed here.
