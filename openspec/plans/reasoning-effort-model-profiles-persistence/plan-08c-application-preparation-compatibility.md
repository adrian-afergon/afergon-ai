# Plan: S08C application preparation and original compatibility API

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; completes original S08 after domain preparation.

## Summary

Deliver complete injected `PrepareProfileAssignmentUseCase` and the thin original `prepareProfileAssignment` API, using accepted B's complete domain policy unchanged. Actually rerun every shared72 preparation assertion through wrapper→application→domain; ledger credits remain A0/B72/C0. [Index](S08-PLAN-INDEX.md), [A](plan-08a-validated-edit-context.md) and [B](plan-08b-complete-preparation-use-case.md) are approved plans following user “Correcto, apruebo”; source execution still requires a separate renewed Implement gate.

## Planning Scope

Pure constructor/delegation/input-result-error propagation, diagnostic configPath→sourceIdentity mapping, original input/output/export compatibility, actual inward app graph and direct emitted application/wrapper invocation. No business algorithms, I/O/environment/default/path resolver, writer/snapshot/provider/lifecycle/live CLI/TUI/host activation.

## Design Rule Alignment

Exact registered plannify/chained-pr/work-unit-commits/cognitive-doc-design and root AGENTS/README govern. Domain owns behavior/data; app receives one concrete policy; infra only composes the original function. No domain constructor change, inheritance, cloner port, interface-per-class, new VO/context constructor, or production spy hooks. Original13 binding contracts remain unchanged.

## Assumptions

Accepted B physically owns the complete callable72 registrar and all definitions/assertions; C inherits them unchanged but actually executes them again. Per-test prototype spies observe real privately composed collaborators, restored per case. Source15–30/tests40–60/result68–90 are local layout forecasts, not caps or measured proof.

## Design Tensions

None

## Reviewed budget risk

Technical planning review `ses_edf013fdeffe28KY1gSymJngGK` PASS retains a budget-risk note. Complete worksheet supports C143–206; A/B370/369 uppers include their own emitted proofs/complete result layout but remain fragile. Physical mismatch reopens budget reconciliation before execution; approval is not a waiver. User “Correcto, apruebo” approves A→B→C boundaries and planning publication only; renewed Implement approval remains required. Current skill paths are refreshed in the index without rewriting dated observations.

## Vertical Slicing Decision

C is a complete independently callable application/original API capability with tests/docs/result, not tests-only integration. B owns all72 original credits; C's identical72 assertions provide additional original-entrypoint evidence, never substitute for domain tests or double-count ledger totals. Full S08 is complete only here.

## Execution Strategy

Current planning tree `feat/reasoning-effort-p1-class-08` at HEAD/base cebcd6044a5be606b0059c2002357cd1c1cc843f/divergence0/0; stageempty,21 topology. Preserve/no transfer/no stage all eight exact checkpoints: `openspec/plans/reasoning-effort-model-profiles-persistence/ARCHITECTURE-PLAN-INDEX.md`, `openspec/plans/reasoning-effort-model-profiles-persistence/plan-08-independent-preparation-use-case.md`, `scripts/lib/model-profiles-core.ts`, `tests/model-profiles-persistence.test.ts` (tracked modified); `openspec/results/reasoning-effort-model-profiles-persistence/correction/S08/RESULT.md`, `scripts/lib/model-profiles/domain/assignment-patch.ts`, `scripts/lib/model-profiles/domain/profile-assignment-policy.ts`, `scripts/lib/model-profiles/domain/raw-profile-document-cloner.ts` (untracked). Index's root32/161+1/D11/history/prunables/all other trees preserve-only. Only index/A/B/C proposal docs are owned for this pass, no transfer/stage.
Future fresh unused `feat/reasoning-effort-p1-class-08c` and `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-08c` start from B's exact published/reviewed/current-CI head, after reviewed R0→R1→R2 publication from sourcePR123 and renewed gate. Reinspect all five categories/local and remote refs/path collisions; STOP on changed isolation. Stage only authorized app/wrapper, focal/usecase invocation/seam tests, README, `correction/S08C/RESULT.md` and measured completion deltas. A/B source/registrar/fixtures inherited unchanged; no dirty old08/code/history transfer.

| C layer, additions + deletions | Forecast |
| --- | ---: |
| App class/input-result bindings + original wrapper imports/contracts/composition | 15–30 |
| Actual registration/invoker/delegation/graph/emitted tests | 40–60 |
| README | 4–6 |
| Complete fresh result | 68–90 |
| Plan/index completion churn | 16–20 |
| **Total** | **143–206** |

Tests40–60: registration/imports/fresh wrapper invocation+prototype-spy adapters10–14; actual pure constructor/exact input-result delegation/varied input/error propagation12–18; own direct emitted app+wrapper invocation12–18; actual application graph root/membership replacement churn6–10. No72 assertion-body recharge; registration/adapters/spies are new and fully charged. Domain emission is inherited B evidence but does not replace C's app/wrapper invocation. Source includes all new declarations/exports/bindings/helpers and replacement deletions, not algorithm moves. Result68–90 retains all11 mandatory sections, actual fresh app/delegate cycles and full72 execution results/commands/review gaps; no truncation or old94 free evidence.

## Implementation Steps

- [x] Obtain explicit three-boundary approval, reviewed docs/current-CI/new gate and exact accepted B; remeasure complete ownership.
- [x] Introduce one app delegation behavioral assertion RED→minimal lowest-TPP GREEN; separately characterize already-green T1/T2, documenting why minimum delegation has no two breaking adversaries; constructor is ambient-free.
- [x] Deliver pure original wrapper with diagnostic mapping; run genuine input/error/mapping adversaries sequentially, not just export-presence tests.
- [x] Register/execute shared full72 through actual wrapper with fresh actual prototype spies; retain getter traps/copies/flags/two validations/clone0.
- [ ] Prove direct emitted app/wrapper invocation and real app graph, run full baseline, record complete result/budget/review; only then complete S08.

## Interfaces and Technical Contracts

`scripts/lib/model-profiles/application/prepare-profile-assignment-use-case.ts`: `PrepareProfileAssignmentUseCase(policy: ProfileAssignmentPolicy).execute(input: PrepareAssignmentInput): PreparedAssignment`. Constructor only stores the policy; execute delegates unchanged input/result and propagates exact errors, no business functions/ambient dependencies. Types remain domain-owned, imported without redeclaration.
`scripts/lib/model-profiles/infrastructure/prepare-assignment.ts`: original `prepareProfileAssignment` input retains `document`, `configPath`, `profileName`, `agentName`, `patch`; output retains `document`, `changed`, `migrationRequired`, `version`, optional `agentKey`. Pure compatibility maps configPath→sourceIdentity and constructs actual AgentTargetPolicy/ProfileDocumentPolicy/RawProfileDocumentCloner/ProfileAssignmentPolicy/use case only. No filesystem/default/path/env selection; original function/type export signatures stay compatible. Domain policy still receives exactly validator/agents/cloner.
Successful wrapper preparation retains source/full final candidate validation exactly twice, one whole raw-source clone after guards, captured own patch values applied once, original representation/metadata/maps/raw schema/prospective flags. No extra wrapper validation or clone. Existing observed reader/byte contracts and future10–13 constructor/data binding unchanged.
Test-only `registerPreparationContract(label, createInvoker)` is inherited from B, no import-time registration. C creates fresh prototype spies on `ProfileDocumentPolicy.prototype.validate` and `RawProfileDocumentCloner.prototype.clone` before each real wrapper invocation; spies call original methods, record actual privately composed instances, and restore after each case. No production collaborators exposed, hooks added or exports altered. Inputs/candidates/getter counters are fresh; suite-local lifecycle only, no global mutable invocation state.

## Acceptance Criteria

- [ ] Complete app/original API delegates and preserves exact input/output/diagnostics/errors; constructor and wrapper pure.
- [ ] All72 shared cases actually pass through compatibility, including full B15 dual errors/clone0, B16 raw14, B14 eight spies, B02 exact two calls.
- [ ] Original B07 outcomes plus captured model/effort counts/ignored getter traps rerun, alongside copies/flags; no ledger double credit.
- [ ] Direct emitted application and wrapper invocations return full expected results and diagnose mapped invalid inputs, not merely import.
- [ ] Real app/domain graph inward/Node/core/config/env-free, complete fresh evidence/review and compliant measured delivery; full S08 then complete.

## Verification

Call inherited registrar once for domain (retained B registration) and once for original wrapper with distinct labels. Use actual wrapper→usecase→domain, not a fake or direct domain shortcut. B ledger72/C0 stays unchanged while C records additional compatibility72 executed; annotate every original group B01–B17 as rerun with original tuples/assertions. Prototype spies preserve actual sourceIdentity and source→candidate order; two successful validate calls, clone0 on all refusals. Unknown/inherited throwing getters and changing known getters come from fresh A factories inside the same B07 bodies, not an uncharged replacement suite.
New application seams use a real concrete policy with restored method spies to prove constructor inactivity, exact supplied input/result identity, varied input and exact thrown-error identity. Wrapper mapping failures assert original configPath appears in source diagnostic and actual selected-key errors; no path resolution. Full prepared candidate/type/export compatibility and inactive live facade remain explicit evidence.
Use index single-name/focal/memory/typecheck/build/health/inherited-reader-import/regression/full commands under isolated HOME/XDG/config/state; restore spies per case. Direct emitted `application/prepare-profile-assignment-use-case.js` and `infrastructure/prepare-assignment.js` invocation uses actual classes and original DTO, child exits0/full parsed output equals expected; a caught invalid-input invocation preserves original diagnostic. Reuse A's tested child-process/preamble helper but charge C app/wrapper imports/program/assertions12–18. App graph root and expected-membership changes count both replacement sides, retaining B domain and reader checks. Constructors cannot call policy/validator/cloner/ambient operations.
Strict new app/delegate units each require ONE runnable initial assertion RED→lowest-TPP minimal GREEN→T1 RED/GREEN→T2 RED/GREEN before green-only refactor. Inherited72 passing cases are characterization/rerun evidence, not fabricated RED or a substitute for new seam cycles. Actual result records commands/outcomes/TPP/cycles/commits and gaps; old08 three-cycle history stays preserved separately.
Produced now: original-entrypoint/all72 registrar strategy and complete worksheet, technical planning PASS and explicit boundary/publication approval. Not applicable now: runtime tests/build. Outstanding: publication/current-CI/new gate/acceptedB, actual cycles/app/compat72/emission/graph/results/review/budget/native baseline. Existing Ubuntu/native Windows checks remain;13's new native full-fault target remains future, not proved here. No own review delegation.

## Open Questions

None

## Dependencies

Reviewed R0→R1→R2 docs from sourcePR123 → renewed gate → acceptedA → acceptedB → 📍C →09→10→11→12→13.09 technically extends07B observation but strategic sequence waits C;12 consumes C preparer/fullB;13 composes unchanged constructors/data. P2/P3 wait full P1 acceptance.

## Risks and Watchouts

Registrar registration is not test execution; record all72 actual wrapper runs. Prototype spies must observe real implementations and restore per case; never patch exports to obtain private instances. No mutable fixtures/candidate leakage, domain algorithm duplication, or missing emitted invocation. If actual growth crossesSTOP375, report exact gap without truncation/extra prefix; original partial08 remains untouched.

## Completion Condition

Ready-with-assumptions: technical review PASS and explicit boundary/publication approval recorded; technical layout estimates are reversible, not measured fit. Reviewed publication/current-CI/new gate/acceptedB remain separate pending dependencies. Full original S08 completes only after accepted C's actual app/wrapper cycles, full72 compatibility rerun, direct compiled proofs, inward graph, complete result/review and measured≤399 with STOP375 addressed. No storage/live activation follows from C itself.

2026-10-19 execution: renewed approval is supplied by the user/Engram4449; Issue94 status:approved, PR126/four SUCCESS and exact reviewed B PR128 fe1189b/four SUCCESS verified. Fresh isolated C preserves all prior state. App and wrapper initial behavioral RED→minimal GREEN are recorded in [S08C result](../../results/reasoning-effort-model-profiles-persistence/correction/S08C/RESULT.md); their separately added T1/T2 adversaries already pass through unconditional delegation/inherited B rules, with explicit reasons rather than fabricated RED.
All77 inherited registrar cases actually rerun through original API plus four source wrapper seams; direct emitted app/wrapper/full result/mapped diagnostics and actual inward app graph pass. No B source/registrar/fixture changes or original-credit redistribution. Final local baseline, exact budget and parent Review/source-head CI status are recorded in the result; historical planning forecasts above remain forecasts.
