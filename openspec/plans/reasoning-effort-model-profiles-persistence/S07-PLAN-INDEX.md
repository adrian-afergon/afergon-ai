# Replan S07: Injected reader before Node integration

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; user-approved S07A/S07B delivery boundary.

## Summary

Replace the delivery of S07 with two complete capabilities: S07A is a callable injected application reader; S07B integrates the real Node observation adapter and original read API. Architecture, APIs and the final S07 outcome are unchanged. The user explicitly approved this structural boundary, docs publication and sequential implementation; this index becomes execution authority after docs review/publication/current-head CI, not before. The original plan remains historical evidence.

## Planning Scope

Preserve every contract in `plan-07-observed-read-use-case.md`, the corrective architecture index and case ledger. No preparation, config persistence, snapshots, live activation or wider legacy migration. Downstream S08/S09 require completed S07B; S10–S13 retain their original contracts.

## Design Rule Alignment

- Domain classes from S05/S06 remain the sole policy owners.
- Application owns observation data and constructor-injected `ProfileObservationPort` consumption. It imports no Node, environment or infrastructure code.
- Infrastructure owns actual bytes, parsing, defaults, absolute binding and compatibility conversion to Buffer.
- Neither prefix contains missing-method adapters or future throwing stubs. A real memory capability exercises S07A; S07B delivers the actual filesystem capability.

## Assumptions

Local fixture reuse supports the ranges below without dropping assertions. Forecasts are not caps or demonstrated final sizes. Shared S07A code/evidence is inherited by S07B, not charged twice; inherited-file replacements still count additions and deletions.

## Design Tensions

None

## Vertical Slicing Decision

The whole-contract budget audit forecasts 388–457 changed lines, rather than the original 242–323. Neither range proves impossibility, but no sustainable sub375 whole-delivery forecast was established. One additional observable prefix separates application behavior from Node integration without changing functional scope or delivery strategy.

## Execution Strategy

Approved chain: PR118 → R0 → R1 → S07A → S07B → S08–S13, retaining Stacked PRs to main. Pending PRs target their immediate predecessor; no merge is authorized here.
Publish these initial documents separately from source. R0 owns this index and plan07A, minimal architecture dispatch/capability-dependency/count changes and an old plan07 historical-delivery notice; R1 owns plan07B, TEST-ALLOCATION dispatch and minimal navigation here. Measure every initial line and amendment against its actual predecessor; each unit must remain below375 projected and399 final.
R0 starts from verified PR118 source HEAD so source05/06 is inherited, not copied. Only after reviewed R1 publication and current-head CI satisfy the approved implementation gate, create fresh `feat/reasoning-effort-p1-class-07a` / `-07b` and matching `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-07a` / `-07b` worktrees. S07A starts from the exact final reviewed/published R1 head, never old PR118; S07B starts from accepted S07A. Check local/remote/disk collisions and the parent directory first. This pass executes docs only.
Preserve the current S07 branch, its blocked RESULT and all other trees. Do not overwrite untracked copies to integrate documentation, reset history, stash, prune or delete obsolete branches.

### Current Git evidence and dispositions

- Current branch: `feat/reasoning-effort-p1-class-07`, HEAD/base `a55ef80d29f0e11892c89f7ddd0b1d8bdfea968c`; divergence0/0 against the S06 predecessor ref. S07 has no configured upstream. PR118 independently verified OPEN at that head with four successful Test/Windows checks.
- Staged and tracked-unstaged sets: empty. No upstream freshness beyond the checked source head is assumed.
- Before these writes, the sole individual untracked path was `openspec/results/reasoning-effort-model-profiles-persistence/correction/S07/RESULT.md`. Preserve unchanged and exclude from replacement delivery. New owned untracked paths are this index, plan07A and plan07B, all planning-only until authorized publication.
- Complete topology inspected: root; four prunable CI-pin/merge-pr83/remove-receipt/stabilize-cleanup registrations; eight historical artifact/source trees; corrective docs publication; S05/S06/S07. All17 registrations remain preserved. Exact historical paths/heads are recorded in the architecture index; S05=`06a0748`, S06/S07=`a55ef80`, corrective docs=`7dc6628`.
- Root's32 individually named paths in the architecture inventory and sole tracked `PROJECT-TASKS.md`161+1 are preserve/no transfer/no stage. D's11 corrective planning paths and historical persistence's six paths remain preserve-only. Reinspect all five categories and each individual path before any future branch, transfer or implementation.

## Implementation Steps

- [x] Review the proposal and record user approval of the extra source prefix as a structural decision, not an assumption.
- [ ] Publish authorized R0/R1 after docs review with current-head CI; source remains untouched in this pass.
- [ ] Reinspect isolation/base/topology/index/tracked/untracked state and satisfy the approved implementation gate's reviewed-publication/CI dependencies.
- [ ] Execute and review S07A, publish it and verify current-head CI.
- [ ] Execute and review S07B, publish it and verify current-head CI before S08/S09.

## Interfaces and Technical Contracts

The exact observation, port and reader contracts of original S07 move to S07A unchanged. S07B imports them and supplies the complete observe-only Node adapter, injected legacy defaults and thin legacy load edge. Storage recheck/persist methods remain S09, not empty placeholders here. No class or interface ownership moves outward.

### Budget and case ownership

| Category | S07A | S07B |
| --- | ---: | ---: |
| Source/contracts | 39–46 | 65–76 |
| Tests, fixtures and inherited replacement churn | 47–60 | 159–186 |
| README | 4 | 4 |
| New complete RESULT | 68–80 | 68–80 |
| Verified plan churn | 16–20 | 16–20 |
| Total additions + deletions | **174–210** | **312–366** |

S07A's47–60 test range owns memory observation, byte consistency/copies, constructor/no-ambient-I/O and application/domain positive-graph evidence. S07B's159–186 comprises all historical fixtures/cases135–151, adapter/binding additions14–20 and imports/additional callable-default characterization10–15. No synthetic negative checker is transferred from S12. Extra cycles and review corrections require reforecast, never curtailed evidence.
S07A owns **zero** of the original218 cases. S07B retains A01=1, A02=1, A03=1, A04=6, A05=5, A06=14, A07=1 and A09=3: **32** total. S06 retains the three A08 direct cases; all other destinations remain unchanged. Observe-once/permission/default assertions may share existing historical cases, but remain explicit assertions. The repeated14-case matrices at prepare/acquire/update entrypoints are still required later.

## Acceptance Criteria

- [ ] Every old S07 contract and all32 original read cases are assigned, without duplicates being credited as replacement coverage.
- [ ] Both prefixes are callable, compiled, tested and safe; no new public load API or Node implementation is claimed for S07A.
- [ ] Full S07 completion occurs only after S07B integration; downstream consumers cannot bypass it.

## Verification

- [ ] Tests: original focal/regression/full-suite commands plus owned use-case tests in each slice.
- [ ] Build: typecheck/build/health and applicable emitted import. Original `profile-store.js` import becomes mandatory in S07B, not fictitiously passed in S07A.
- [ ] Additional Evidence: genuine cycles, complete result headings, all-layer budgets, preservation and current-source-head CI.
- [ ] Rule Compliance: class-owned policies, constructor-injected capabilities, inward dependencies, no default selection or Node conversion in application.

Produced now: source/contract review, budget audit, current Git inventory, PR118 checks, user boundary/publication/sequential-implementation approval and independent read-only proposal review (`ses_edffb3679ffeapwmpBS6XWjGNV`). Its Git-upstream wording correction is applied. Application tests/build are not applicable; publication/current-head CI and all new implementation evidence remain outstanding. Estimates174–210/312–366 are not execution proof.

## Open Questions

None

## Dependencies

Reviewed S05/S06 and explicit acceptance of this changed delivery boundary are produced. Reviewed R0/R1 publication and current-head CI remain execution dependencies. Original parent architecture/behavior specification remains authoritative outside S07; S08–S13 original S07 consumers wait for S07B, never partial memory-only S07A.

## Risks and Watchouts

S07B's upper366 leaves nine lines before STOP375. Actual cases, helpers, results, plan/index changes and inherited replacements count fully. Initial planning publication is not free source overhead. Preserve the blocked RESULT as honest history without prepublishing future RED evidence. A subagent usage limit prevented the planning executor; the parent wrote this proposal directly, followed by an independent read-only review. No implementation was performed.

## Completion Condition

Planning permission is resolved: ready-with-assumptions, literal None for questions/tensions, only local reversible fixture/budget estimates. The user-approved structural prefix is not an assumption. Reviewed docs publication/current-head CI must complete before the authorized sequential implementation starts. Each prefix needs its own complete result/review/current-head checks. This docs pass does not complete S07 or the effort feature.

## Publication navigation — authorized 2026-10-09

R0: `docs/issue94-p1-class-07-split-plan-00` targets PR118's `feat/reasoning-effort-p1-class-06` at exact `a55ef80d29f0e11892c89f7ddd0b1d8bdfea968c`; R1: `docs/issue94-p1-class-07-split-plan-01` targets R0. Shared fresh docs worktree: `/tmp/opencode/afergon-ai-class-07-split-plan-publication`. Original17 registrations remain preserved; publication adds one, with no pruning.
Transfer is byte-identical for the approved three source plans except this allowed appended navigation. R0 stages only this index, plan07A, architecture dispatch and the old plan07 notice. R1 stages only plan07B, TEST-ALLOCATION dispatch and navigation here. Root32/index161+1, D11, historical6 and blocked135-line S07 RESULT are preserve/no transfer/no stage.
Produced: independent proposal technical PASS `ses_edffb3679ffeapwmpBS6XWjGNV`, corrected upstream wording, parent docs/permission/ownership/budget review and transfer verification. Not applicable: local application tests/build for docs-only deltas. Outstanding: publication/current-head Test and Windows launcher checks; every future source/TDD/result/native-persistence outcome. PR112's old07 delivery is historical; its08 remains valid and that PR stays open.
R0 initially publishes two new artifacts (106-line source index plus navigation,109-line plan07A); R1 adds the121-line plan07B. All three remain ready-with-assumptions. Initial full contents and every inherited-line replacement are charged; estimates174–210/312–366 remain source forecasts, not measured proof. S07A execution waits the final reviewed/published R1 head and successful current-head checks for both docs units.
