# Plan B: Pure targeted edit preparation and independent clones

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready.
- **State**: ready
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; B of approved A → B → C → D.

## Summary

Deliver an independently callable pure preparation capability using A validation and the existing JSON deep clone. It selects one recognized assignment, applies only own supplied members, and reports whether persistence/migration would be needed. No reads, directories, snapshots, configuration writes, projection or live routing.

## Planning Scope

Target/alias selection, patch validation before clone, representation/foreign-field preservation, clone independence, no-op and migration classification. No clear/delete/default/resolution/lifecycle API. Disk persistence waits for D. [PLAN-INDEX](PLAN-INDEX.md) governs audit, publication/result ownership and complete traceability.

## Design Rule Alignment

- Domain patch contracts use interfaces and existing `StoredAssignment` factory. Put pure preparation in the vertical infrastructure layer so it can consume A's validator and legacy pure helpers without a domain-to-infrastructure import. Never import filesystem or call environment/path helpers.
- Reuse `cloneAssignments` unchanged for JSON documents and `normalizeAgentName` for classification; do not normalize foreign data or broaden live string contracts.
- Validate source and own patch fields before cloning can erase undefined. Use own-key lookup and safe own-property creation for prototype-like names.
- Relevant tests/docs/result travel with B, measured only against accepted A ancestry.

## Assumptions

None

## Design Tensions

None

## Vertical Slicing Decision

B is complete pure edit preparation, safe to call without persistence. C independently owns snapshot lifecycle; D alone combines them into a writer. It does not claim the original storage task is done.

## Execution Strategy

Sequential A → B → C → D. Reinspect the index's five-category/topology/disposition contract at execution; stop on changed state. Use exact planned branch `feat/reasoning-effort-p1-pure-edit-preparation` and worktree path only after collision checks and authorization, based on accepted A. No source/branch mutation now.

Exact allowlist: `scripts/lib/model-profiles/domain/assignment-patch.ts`, `scripts/lib/model-profiles/infrastructure/prepare-assignment.ts`, focused additions to `tests/model-profiles-persistence.test.ts`, B documentation in README, `openspec/results/reasoning-effort-model-profiles-persistence/B/RESULT.md`, and this plan's verified checklist changes. Import A's `infrastructure/document-validation.ts` without duplicating validation. No historical PLAN/RESULT update.

Forecast source65–90, tests125–175, docs4–6, B result65–85, plan6–10 =265–366. Roughly14–19 fixtures with shared pure setup cover target/preservation/validation/clone behavior. Tests/README/plan inherited from the actual immediate base count additions AND deletions, including helper replacement churn; new source/result files count final additions. This is a forecast, not a cap/proof. Reforecast extra cycles/review fixes at every GREEN; prefer350, STOP375, maximum399, never truncate evidence. Do not charge A/initial plans/historical RESULT again or prepublish future exact-cycle evidence.

## Implementation Steps

- [ ] B1 construct a validated independent targeted candidate, preserving omitted fields/representation and computing actual change flags.
- [ ] B2 enforce own patch validation, exact-key/alias rules, safe own profile creation, future-version refusal and correct migration classification.
- [ ] B3 prove nested source/clone independence and foreign metadata preservation in both directions; verify no disk/host I/O.
- [ ] Run original final commands, review pure/inactive boundaries, and persist complete B result/base-relative budget.

### Ordered TDD and adversarial matrix

For each unit run ONE behavioral RED, minimal GREEN at lowest sufficient Implement TPP index; write T1, RED/GREEN, then T2, RED/GREEN. Refactor only green. Missing API/type errors are not RED. Passing helper/no-op characterizations stay labelled; find uncovered behavior or explain inability to obtain two genuine breaks.

| Unit | Initial behavior | Sequential adversarial T1, then T2 |
| --- | --- | --- |
| B1 | One-member patch on structured value preserves omitted members | Model-only legacy edit stays string; adding effort to legacy creates object retaining original model and nested unrelated fields |
| B2 | Resolve exact stored target without rewriting other slots | No exact key with two canonical-equivalent aliases refuses; prototype-like profile creation produces own key and leaves prototype/active selection unchanged |
| B3 | Prepared clone independent of source metadata | Mutate nested source effort/foreign metadata after preparation; mutate nested candidate metadata and prove source unchanged |

Required additional cases introduced individually when absent: exact-key wins among aliases; sole equivalent reused with original spelling; canonical key created; unsupported agent rejected; existing/missing profile and absent-source defaults; empty patch never materializes containers; identical patch is no-op even mixedv1; missing vs present member distinguishes inheritance; omitted member preserved; own undefined/model/effort invalid rejects before clone; malformed recognized nontarget source rejects; opaque foreign slot remains unparsed. Future version>2 refuses even no-op. Legacy-only change does not bump due to unrelated structured slots; changed structured model without effort does migrate; v2 does not migrate again.

## Interfaces and Technical Contracts

`AssignmentPatch` interface has optional `model?: string` and `reasoningEffort?: string`. Own presence, not truthiness, determines supplied fields. Own undefined/null/array/number/invalid string fails with target's original path before cloning. No clear/delete semantics. Unknown patch members are not an implicit foreign-field editing API; only known own supplied members affect the candidate.

`PrepareAssignmentInput` contains validated-source `document: Record<string, unknown>`, `configPath: string` for errors, exact `profileName: string`, recognized `agentName: string`, and `patch: AssignmentPatch`. Runtime source validation via A is mandatory, even if caller asserts validity. Profile key is exact, not normalized by CLI name rules; own `__proto__`/`constructor` keys are data.

`prepareProfileAssignment(input): PreparedAssignment` is pure. Result interface contains independent document, changed/migrationRequired flags, `version: number` and chosen `agentKey?: string`. Version is prospective effective1/2; the candidate preserves source version presence/value until D's snapshot-backed commit path applies migration. Future source version>2 fails before clone/write-side operations, even no-op. Empty/identical patch returns changed=false/migration=false and original effective version; no missing maps materialized.

Target rule: exact supplied own agent key if present; otherwise sole supported canonical-equivalent key; otherwise canonical key. Multiple equivalent keys with no exact key refuse without merge/delete. Materialize missing profiles/models only for a real nonempty edit; preserve activeProfile presence/value. Use data-property creation to avoid prototype setters. Validate the whole candidate with A after editing.

Deep-clone validated raw JSON through unchanged `cloneAssignments`. Preserve all root/models/profiles/assignment metadata and unsupported slots. Structured edits retain unspecified effort/model/foreign fields. Model-only legacy edits remain strings; effort addition converts string to object retaining model. Actual introduction/change of structured data in effectivev1 marks migrationRequired=true and resulting version2, including model-only structured changes; legacy-only edits stayv1. The candidate does not acquire version2 until D applies the approved migration sequencing; B's reported version is prospective, its raw document retains source version.

No source observation or snapshot is accepted/created by B. Returned objects are independent, not an immutable transaction token. D must validate again before any write-side I/O; P3 owns future whole-candidate lifecycle adapter.

## Acceptance Criteria

- [ ] Target edits preserve omitted/foreign fields and exact unrelated representations; source/candidate are independent both directions.
- [ ] Alias/exact/prototype/no-op/version flags satisfy every named case without any filesystem access.
- [ ] Invalid source/patch rejects before clone; full candidate validates without defaults or foreign normalization.
- [ ] No live exports or unsafe structured writer; tests/docs/result and actual compliant budget reviewed.

## Verification

- [ ] Tests: cycle single-name checks, focused suite per unit, full original regression/full suite below.
- [ ] Build: inherited explicit include, typecheck/build/health/emitted import.
- [ ] Additional Evidence: no-disk/host spy assertions, original Git evidence commands, B result and required native CI.
- [ ] Rule Compliance: review inward imports, reused clone, own-key handling, migration flags and unchanged live contracts.

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

Use isolated temporary configuration environment even in boundary tests. Restore spies per case. Record genuine exact-cycle command/reason/TPP/GREEN/triangulation/refactor and all Implement headings in B result; unrecorded historical details stay unknown, existing own-undefined domain rejection is characterization if passing. Produced now: supplied fresh review and planning contract corrections. Not applicable now: application tests/build. Outstanding: corrected-plan acceptance/re-review, predecessor/gate/publication, all implementation/full/native checks/review and measured budget. Readiness remains contingent on dependencies and gate; text parity is not native evidence.

## Open Questions

None

## Dependencies

A accepted and compiled validator available; reviewed planning ancestry and renewed gate required. C follows as next source delivery; D integrates B. P2/P3 wait for full D.

## Risks and Watchouts

JSON clone drops undefined and cannot establish arbitrary JavaScript graph preservation; this contract is raw parsed JSON plus recognized patch checks. No-op compares targeted values/presence, not whole-document serialization that could migrate accidentally. Reused clone behavior may already pass and must be labelled characterization, never fabricated RED. The existing legacy saver is not called here. Forecast below399 does not waive predecessor readiness or mandatory approval gates.

## Completion Condition

B completes only with all pure preparation/clone/version/key evidence, full baseline, owned result/checklist and measured reviewed PR. Its ready plan remains unexecuted until A and approval gates complete; it does not satisfy original persistence acceptance by itself.
