# Plan: S08A validated independent edit context

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; callable capability boundary and planning publication approved, execution separately gated.

## Summary

Deliver complete `ProfileAssignmentPolicy.prepareContext(input)` as validate → select → copy, domain-owned generic JSON cloner and unchanged legacy facade. No `prepare` stub or application module. [Index](S08-PLAN-INDEX.md) governs the new A→B→C proposal; [B](plan-08b-complete-preparation-use-case.md) completes domain preparation on this class and [C](plan-08c-application-preparation-compatibility.md) completes application/original API.

## Planning Scope

Whole raw-source validation/future refusal, patch shape, actual key selection, captured own recognized patch validation, and independent context data. No edits, map materialization, changed/migration classification, prospective version promotion, filesystem/environment/defaults/host calls, or new product behavior.

## Design Rule Alignment

Root AGENTS/README and exact registered plannify/chained-pr/work-unit-commits/cognitive-doc-design govern. Domain class owns meaningful behavior; concrete validator/agents/cloner are injected. Plain `AssignmentPatch`, input and context interfaces are data contracts, not ports or VOs. No context class or extra constructor dependency.
Bounded deliberate core extraction retains generic return/default/fallback and exact JSON semantics. Keep core's unrelated guard for other consumers; domain never imports legacy core/config.

## Assumptions

Initial immutable tables27–33; itemized context/getter factory/graph/compiled proof82–107 replaces the former80–100. Complete result68–85 follows the index's explicit11-section layout. Every helper/export/type/replacement is charged below; local reversible estimates, never caps or measured fit.

## Design Tensions

None

## Reviewed budget risk

Technical planning review `ses_edf013fdeffe28KY1gSymJngGK` PASS retains a budget-risk note. The revised worksheet supports A upper370/B369 with fragile5/6 margins before STOP375; no measured fit. Any physical mismatch or new-cycle/review growth reopens the technical budget issue before execution continues. User “Correcto, apruebo” approves A→B→C boundaries and planning publication only; renewed Implement approval remains required. Current skill paths are refreshed in the index without rewriting dated observations.

## Vertical Slicing Decision

An independently validated, selected, copied raw edit draft is useful pure behavior without mutation or storage. Its contracts/cloner and genuine behavioral tests ship together. A receives zero original B-case credits; its new context tests cannot substitute for B's complete preparation assertions.

## Execution Strategy

Use current S08 tree only for this new plan. Verified branch/head/base/divergence0/0, complete21 topology, empty stage, four tracked/four untracked checkpoints are named in the index. Preserve/no transfer/no stage for every one: `openspec/plans/reasoning-effort-model-profiles-persistence/ARCHITECTURE-PLAN-INDEX.md`, `openspec/plans/reasoning-effort-model-profiles-persistence/plan-08-independent-preparation-use-case.md`, `scripts/lib/model-profiles-core.ts`, `tests/model-profiles-persistence.test.ts`, `openspec/results/reasoning-effort-model-profiles-persistence/correction/S08/RESULT.md`, `scripts/lib/model-profiles/domain/assignment-patch.ts`, `scripts/lib/model-profiles/domain/profile-assignment-policy.ts`, `scripts/lib/model-profiles/domain/raw-profile-document-cloner.ts`. Root32/161+1, D11, history/prunables/all other trees also preserve-only.
Future A starts from exact reviewed/published R2 docs descended from source PR123, never dirty original S08. Check unused `feat/reasoning-effort-p1-class-08a` and `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-08a`; reinspect all five categories before authorized creation/execution. Stage only approved A-owned domain patch/policy/cloner/core facade, focal/helper tests, README, `correction/S08A/RESULT.md` and measured completion deltas. No old checkpoint transfer or code copying; separate fresh TDD history preserves provenance without treating old literals as deliverable. The three entry drafts and newC are individually owned untracked proposal paths, no transfer/stage now; all other paths preserve-only.

| A forecast | Source | Tests | Docs | Result | Plan/index | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Additions + deletions | 65–90 | 138–169 | 4–6 | 68–85 | 16–20 | **291–370** |

Tests:19 clone characterizations +27–33 initial shared tables +82–107 itemized context/helper/proof +10 imports/setup =138–169. Source65–90 includes bindings/patch/input/context/constructor/validate-select-copy/helper and both core-facade replacement sides. Result68–85 retains all11 mandatory sections under the index's actual content/spacing layout, including exact commands/cycles/TPP/commits/gaps. Preserve old94 as provenance; expand/reforecast if actual evidence exceeds layout, no truncation.

| Context/helper/proof component | Authored lines, including replacement deletions |
| --- | ---: |
| Shape/identity/selected key/effective version (shared expected context data included) | 12–14 |
| Whole-source/patch/future refusal tables and clone0 | 18–22 |
| Actual-key/ambiguity/unsupported selection | 6–8 |
| Bidirectional raw-draft/known-command independence | 8–10 |
| Fresh getter factory exports/types/body plus A capture/trap assertions | 14–18 |
| Pure constructor plus actual policy/cloner graph-root/membership churn | 10–14 |
| Own emitted-context invocation, concrete program prefix and child helper churn | 14–21 |
| **Sum** | **82–107** |

Compiled upper21 is grounded in builtRead168–174: optional program-prefix parameter/spawn-preamble replacements4 changed lines; exported test-only prefix declaration delimiters2 + four emitted-domain imports4 + four actual constructor statements4 =10; direct context smoke/fresh input/full JSON equality/status7. All exports/delimiters are charged. Lower14 reflects shared fixture/setup reuse, not assertion deletion. Existing reader default/three calls unchanged; no helper rename/whole module move. B reuses the tested prefix and child helper; no future prepare stub in production.

## Implementation Steps

- [ ] After reviewed publication, explicit A→B→C boundary approval and renewed gate, obtain clean isolation and remeasure every layer.
- [ ] Characterize six generic default/fallback/JSON parity cases; extract exact unchanged owner and legacy facade as green-only refactor.
- [ ] Introduce one behavioral context assertion, then minimal GREEN; add T1 and T2 individually RED/GREEN before green-only refactor.
- [ ] Add source/future/patch/alias/capture/copy matrix, shared getter/table definitions and tested emitted-domain prefix; prove direct context invocation and inward graph/constructor behavior.
- [ ] Run full prefix verification, record actual evidence/result/budget and review before publishing accepted A for B.

## Interfaces and Technical Contracts

Domain `assignment-patch.ts`: `AssignmentPatch { model?: string; reasoningEffort?: string }`. Domain `profile-assignment-policy.ts` owns `PrepareAssignmentInput { document: RawProfileDocument; sourceIdentity: string; profileName: string; agentName: string; patch: AssignmentPatch }` and `ValidatedAssignmentContext { document: RawProfileDocument; knownPatch: AssignmentPatch; selectedKey: string; effectiveVersion: number; sourceIdentity: string; profileName: string }`. RawProfileDocument is inherited from06's `domain/profile-document.ts`.
`ProfileAssignmentPolicy(validator: ProfileDocumentPolicy, agents: AgentTargetPolicy, cloner: RawProfileDocumentCloner).prepareContext(input): ValidatedAssignmentContext`. Same exact three concrete collaborators as original08/13; constructor only stores them. No application type ownership, alternative policy interfaces, context class, fs port or future method stub.
Validate the **full raw source** through validator with diagnostic sourceIdentity; require supported version with operation `prepare`, including nominal empty patch. Patch must be a non-array object. Select actual target through `AgentTargetPolicy.select` **before** patch-field capture/path validation; preserve exact/sole alias/ambiguity/unsupported diagnostics and own-profile lookup.
Capture own `model`/`reasoningEffort` getter values **once into independent knownPatch before validating those values** through `StoredAssignment.create` at `models.profiles[JSON.stringify(profileName)][JSON.stringify(selectedKey)]`. Unknown/inherited patch fields are ignored and never copied/read as command metadata. Own undefined/invalid rejects before JSON erasure. Never validate a getter result and reread the original patch to apply it.
Only after all guards/selection/captured-command validation, clone the **whole raw source exactly once**, using `RawProfileDocumentCloner.clone<T extends Record<string, unknown>>(input?: T): T`. Preserve unchanged `JSON.parse(JSON.stringify(asPlainObject(...)))`, same pure local guard/default/fallback; legacy `cloneAssignments` delegates. No extra cloned-context full validation. Return draft/knownPatch/selectedKey/effectiveVersion/identity/profileName only, with source raw version unchanged; no mutation/materialization/flags/promotion.
Context owns an independent parsed-JSON raw draft and known command; bidirectional source/draft and patch/knownPatch independence are observable. It is mutable plain data, not arbitrary graph immutability or support for cycles/proxies/accessor-rich source documents. Identity/profile name are diagnostic/data tokens, not I/O authority.

## Acceptance Criteria

- [ ] Full source/future/patch/target/known-field refusals precede clone; exactly one clone for valid context, no source mutation.
- [ ] Exact context shape, own-field getter capture once, stable actual stored error path and ignored unknown/inherited command fields.
- [ ] No absent-map materialization or prepare/flags; source/candidate and command copies independent both ways.
- [ ] Six legacy generic clone parity cases remain characterization; no fabricated clone defect/retrospective RED.
- [ ] No inner ambient graph/calls; complete actual result/review and measured budget; zero B72 credits.

## Verification

New context groups, additional to B72: shape/selected-key/raw-version/identity3; refusal all14 raw fixtures/15 invalid tuples/five patch shapes/future empty; target3 aliases+unsupported/ambiguous; copies2; capture model/effort plus throwing unknown/inherited getters; constructor/actual graph/direct compiled context. Record expanded axes/counts in actual evidence; zero old-case credit. The82–107 worksheet includes every helper/setup/copy/graph/emission obligation, not a test-count cap.
Proposed `tests/_testModelPreparationFixtures.ts`: invalidFieldValues/invalidPatchFields exact15 expanded tuples6 lines; eight editCases tuples10; three alias tuples5; four missing-container fixtures6 =27 core definition lines,27–33 with safe data declarations. A context tests actually use each table's input projection; B uses the same immutable initial definitions for full outcome assertions. Freeze definitions or create fresh values per case; never share mutable prepared candidates. `tests/_testModelRawFixtures.ts` stays S07B-owned/inherited, including14 invalidReads and5 readableDocuments; no whole test-module move or recharge.
The same fixture module additionally exports a fresh changing-known-field patch factory with read counter and throwing own-unknown/inherited-recognized getters; initial typing/body/export+A assertions charged14–18, outside tables27–33. No mutable shared patch. A independently proves capture/traps; B augments both original B07 bodies retaining whole outcomes/counts; C reruns them. Test-only domainProgramPrefix declaration/imports/constructors are separately charged in compiled14–21.
Strict new-unit TDD: one runnable behavioral assertion RED → minimal **lowest TPP** GREEN → T1 RED/GREEN → T2 RED/GREEN, then refactor. Suggested first unit: context returns independent raw draft; T1 changes actual target spelling, T2 changing recognized patch getter proves one-read capture. Guard units receive their own genuine adversaries as needed. Compile/missing-export errors are not behavioral RED; already-green clone/factory behavior is honest characterization, not an exception for new units.
Use index exact single/focal/memory/typecheck/build/health/reader-import/regression/full commands, isolated temp env/restored spies. Emitted policy.prepareContext invokes its real emitted cloner via the charged concrete prefix; child exits0/full parsed context equality, not class presence. Generic fallback/default parity remains six direct source characterizations. Actual policy/cloner graph roots preserve reader traversal/add full domain membership; count deletions, reject Node/core/config/app/env edges. Constructor proves no validation/selection/clone/ambient calls. Test subprocess Node is not domain authority.
Produced now: contracts/accounting/Git inventory, technical planning PASS and explicit boundary/publication approval. Not applicable now: runtime tests/build. Outstanding: publication/current-head CI/new gate, actual TDD/results/copies/graph/legacy/native baseline/budget.13's native full-fault target remains future.

## Open Questions

None

## Dependencies

Source PR123 exact cebcd6044a5be606b0059c2002357cd1c1cc843f → reviewed R0→R1→R2 docs → renewed gate → 📍A → B → C. A uses05/06 and inherited07B reader;09 technically extends07B but strategic sequence waits C. Original08 is not an accepted dependency.

## Risks and Watchouts

Five-line upper margin is fragile; count getter/data/compiled helper typing and source/graph/result growth. No fabricated clone RED, literal prepare inheritance or unitemized emitted cap. Unknown metadata survives JSON copy; no arbitrary graph support. If actual forecast≥375, STOP/report exact gap; safe A-only planning may be considered by the human, never automatically executed.

## Completion Condition

Ready-with-assumptions: technical review PASS and explicit boundary/publication approval recorded; technical worksheet is complete with local reversible layout assumptions, not a measured delivery. Reviewed publication/current-head CI and renewed gate separately pending. Accepted A requires context/cloner, own direct emitted proof/all new tests/results/review and measured≤399 without unaddressed STOP375. Full S08 waits C; no writer is delivered.
