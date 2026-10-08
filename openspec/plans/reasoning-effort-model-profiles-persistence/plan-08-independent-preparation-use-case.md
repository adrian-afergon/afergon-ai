# Plan08: Class-owned targeted preparation and independent JSON clones

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete pure preparation.

## Summary

Deliver concrete `ProfileAssignmentPolicy` and `PrepareProfileAssignmentUseCase`, moving B's pure business behavior into domain/application. Deliberately extract the same generic JSON clone body into a domain-owned concrete cloner and preserve the legacy facade. No domain import of core/config or disk I/O.

## Planning Scope

Whole-source/patch/candidate validation, target selection via05, representation/preservation/no-op/migration classification and bidirectional deep independence. Exclude filesystem, bulk candidate commit, clear/delete or resolution. AssignmentPatch remains a data interface.

## Design Rule Alignment

- `domain/profile-assignment-policy.ts` receives concrete validator/target policy/cloner through constructor; no alternative-policy interfaces without need.
- `domain/raw-profile-document-cloner.ts` owns the unchanged generic JSON.parse(JSON.stringify(asPlainObject(...))) behavior plus a local copy of its same pure fallback guard/default argument. Retain legacy core's unrelated guard for other consumers; no broad helper migration.
- Legacy `cloneAssignments<T>` delegates to that owner, retaining its generic return/default semantics; this deliberate tiny extraction is bounded, not broad legacy migration.
- Application `prepare-profile-assignment-use-case.ts` delegates domain preparation; old infrastructure function becomes compatibility composition/delegation only.

## Assumptions

Local reversible assumption: readable B1 tables/shared already-owned fixture data retain all B assertions and exact clone behavior within source estimates; label passing characterization honestly. No coverage/evidence caps, remeasure each GREEN. Structural replacement decision is approved.

## Design Tensions

None

## Vertical Slicing Decision

Complete pure candidate preparation is callable without storage; no interface-only skeleton or unsafe writer.05 already owns aliases/target selection and06 validation, reducing coupling and duplicated rules.

## Execution Strategy

Approved replacement chain:05→06→07 → 📍08 →09→10→11→12→13. Future p1-class-08 branch/worktree from accepted07 follows exact index collision/disposition checks after separately authorized reviewed planning publication/renewed gate. Today preserve all source/closed history/root originals; stage/transfer none.

Future owned: domain patch/policy/cloner/core clone facade, application preparation/delegate, all72 original B cases, new class seams, README, correction/S08/RESULT.md and deltas. Revised source85–105/tests150–180/docs4–6/result55–65/artifacts8–12 =302–368. Local reversible reuse shares07's already charged raw data, expresses four B1 variations as readable named tables and preserves both assertions in all15 own-invalid tests. No B entrypoint is deduplicated into05/06; see TEST-ALLOCATION. Include clone-body extraction/facade additions AND deletions, new fixtures/extra cycles; upper368 leaves7 beforeSTOP375, not proof of fit. Prefer350/hard399; stop/replan rather than truncate.

## Implementation Steps

- [ ] Characterize generic clone fallback/default behavior and bidirectional JSON independence; move exact body/guard into bounded domain ownership.
- [ ] Encapsulate59-line preparation semantics with constructor-injected concrete05/06/cloner; retain original4-line patch interface.
- [ ] Introduce prepare use case and thin original delegate; prove no disk/env/host calls.
- [ ] Reconcile every B case, exact key/path/version/metadata flags and full baseline; record owned result/review/actual budget.

## Interfaces and Technical Contracts

`PrepareAssignmentInput { document: RawProfileDocument; sourceIdentity: string; profileName: string; agentName: string; patch: AssignmentPatch }`; `PreparedAssignment { document: RawProfileDocument; changed: boolean; migrationRequired: boolean; version: number; agentKey?: string }`. Compatibility maps existing configPath diagnostic to sourceIdentity.

RawProfileDocument is imported from06's DOMAIN domain/profile-document.ts; these pure preparation data contracts are domain-owned with the policy. Future-version refusal delegates06 requireSupportedVersion(...,"prepare"), retaining exact preparation diagnostics; no duplicate infrastructure guard or application-owned raw type.

`RawProfileDocumentCloner.clone<T extends Record<string,unknown>>(input?: T): T` retains generic JSON behavior, not arbitrary JS graph support. `ProfileAssignmentPolicy(validator, agents, cloner).prepare(input): PreparedAssignment`; `PrepareProfileAssignmentUseCase(policy).execute(input): PreparedAssignment`. Domain has no legacy import/port/fs.

Validate full source and future>2 refusal before clone, even no-op. Patch is a non-array object; only own supplied recognized members apply; own undefined/invalid values reject at the actual stored target's path before JSON erasure. Unknown/inherited patch fields do not edit metadata. Use05 target rules; safe own profile materialization only for real change, preserving active selection/prototype.

Structured edits preserve omitted members/foreign data; model-only legacy edits remain strings; effort addition retains legacy model in object. Empty/identical edits return changed=false without materializing maps. Candidate always independently cloned/validated. Prospective version2/migrationRequired appears only for actual structured change in effectivev1, even no effort; unrelated structured slots don't bump legacy-only edits. Candidate raw version stays unchanged until12's completed snapshot; v2 never requires another migration.

## Acceptance Criteria

- [ ] Full B matrix retained: own invalid/nontarget data, alias/path/prototype, missing maps, representation, metadata and no-op/version flags.
- [ ] Generic clone behavior unchanged through both owners/facade, source→candidate and candidate→source nested independence proved.
- [ ] Pure classes/use case do not import or call fs/env/core/config; compatibility wrapper only delegates.
- [ ] Tests/docs/result/full evidence and compliant actual budget accompany complete preparation.

## Verification

Initial seam RED: class preparation preserves unspecified effort during structured model change. T1: adding effort to legacy retains model; T2: identical mixedv1 patch returns independent clone without version promotion. Enter exact/ambiguous/prototype/undefined/future cases sequentially if not already covered. Extracted clone/validation passing tests remain characterization; explicitly explain inability to find two genuinely failing cases rather than fabricate RED.

Use future exact index single-name/focal/typecheck/build/health/emitted/regression/full commands and owned use-case/architecture file runs. Test prepare constructor injection and no ambient I/O. Preserve all original B assertions and own invalidPatchFields/read matrices. Every result has required headings/exact command/lowest TPP/cycle evidence; reforecast all-layer growth each GREEN.

Produced: contracts/extraction rationale and approved replacement basis. Not applicable now: tests/build. Outstanding: parent targeted re-review, planning publication approval, renewed Implement gate and future behavior/architecture/native/budget evidence.

## Open Questions

None

## Dependencies

Accepted05/06; sequence follows07 and published corrective docs/gate.12 consumes preparation. P3's whole-candidate lifecycle API is still outside P1.

## Risks and Watchouts

Clone erases undefined; never clone before own recognized validation. A clone facade that calls back into legacy core creates a forbidden cycle. Source path is diagnostic, not domain I/O. Test spy coupling to old functions must be replaced with class behavior evidence only where necessary, counting replacement deletions.

## Completion Condition

Plan is ready-with-assumptions: no questions/tensions, approved basis, local reversible fixture estimates. Publication and implementation remain separately gated. Completion requires pure preparation/class ownership, all72 B cases, clone parity, result/review/native checks and measured≤399; upper368 remains unproved and STOP375 still applies.
