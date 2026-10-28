# Plan: Independent model and effort resolution lifecycle (P3 replan)

- **Source Task**: `openspec/tasks/003-reasoning-effort-model-profiles-resolution.md` (bounded size-only amendment2026-10-28; original preserved in adjacent `-old-20261028.md`)
- **Source Spec(s)**:
  - `openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle.md` — ready,17Gherkin scenarios
  - Published P1 compatible-storage specification — contract dependency
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed; one honest pass exhausted, fresh P3-only size exception approved

## Summary

P3 adds a complete, directly callable but inactive resolution/lifecycle capability over the reviewed P2 implementation at `c5088d15788bbb19b8640afdea8b909a4d363bbe` (PR137). Resolve model and effort independently, preserve local effort through edits and lifecycle operations, identify affected children, validate before committing, and expose complete desired-state/cleanup intent without performing host changes.

The whole-document commit port already exists: `ProfileStoragePort.recheck` and `atomicPersist`, backed by the unchanged legacy atomic saver. What is missing is P3's domain behavior and lifecycle orchestration, not a replacement filesystem writer. The old287-line plan is preserved unchanged in `PLAN-old-20261027.md`; its missing-API/tsconfig assumptions are superseded by actual source inspection.

This is local planning only: no code, commits, publication, branch/worktree creation, or merge. Existing PRs remain untouched for asynchronous human review. All product decisions remain as specified. The human approved a fresh P3-only cohesive size exception2026-10-28, above400 with no new numeric ceiling. Forecast620–857 is not a cap, no tests/docs/evidence may be cut, and no P1/P2 exception transfers. The size answer does not authorize implementation, commits, publication, or merges; the final gate remains pending.

## Planning Scope

- Separate configured and profile-resolved model/effort values and their sources; preserve legacy model inheritance while effort stays agent-local.
- Immutable model-only and combined edits, explicit effort clearing, affected-pair collection including inheriting children, bulk save, clone, switch, and deletion.
- Missing/unreadable/corrupt/malformed/dangling state is an error, never intentional reset. Explicit null and empty/effort-free profiles are valid distinct states.
- Complete cleanup coverage across supported agents and prior agent identities; active changes return refresh intent, inactive changes do not. No actual host refresh.
- Required injected downstream affected-pair validation before any snapshot or commit; no default acceptance, fabricated provider support, or dependence on P4 implementation.
- Tests, architecture assertions, explicit Windows suite-list additions, internal API guidance, emitted-runtime verification, and RESULT during implementation.

Excluded: capability policy004, ownership/projector005/006, CLI/TUI controls, host reads/writes/seeding, provider discovery, paid requests, and live activation before P8. Preserve P1/P2 behavior, legacy loader/facade, existing CLI/TUI/installers/registrar, atomic saver and snapshot files.

## Design Rule Alignment

- Product vertical with domain/application/infrastructure boundaries and inward dependencies. Domain behavior belongs to classes, interfaces to data/ports, constructor injection to collaborators.
- Reuse `StoredAssignment` static validation factories and the deep cloner. Private value-object constructors assign already-validated values only.
- New composition is an additive export in existing `profile-composition.ts`, not a new outward dependency or replacement of existing wrappers.
- Keep tests and docs with their behavior; no compression, deleted evidence, or repeated splitting to force an artificial line budget.
- Preserve negative architecture fixtures and saver hash. Deliberately extend application commit ownership to the new lifecycle use case, without allowing infrastructure to call `atomicPersist`.

## Verified Source Baseline

Inspected at exact P2 head, not inferred from the obsolete plan:

| Existing capability | Binding / consequence |
| --- | --- |
| `ProfileStoragePort` | `observe`, `recheck(source)`, `atomicPersist(document, source)`; whole-candidate persistence already available |
| `ReadProfileDocumentUseCase` | Strict validation/byte receipt; absent source has `exists:false` plus defaults placeholder that P3 must explicitly refuse |
| `ProfileDocumentPolicy` | Rejects malformed recognized assignments and dangling active references; supported-version union already includes update, which lifecycle can reuse |
| `ProfileAssignmentPolicy.prepare` | Clone-preserving targeted patch, omitted effort preservation, migration-required indication; not bulk lifecycle orchestration |
| `RawProfileDocumentCloner` | Candidate independence and foreign metadata preservation |
| `AgentTargetPolicy` / `StoredAssignment` | Eight supported agents, aliases, strict recognized assignment/effort validation; opaque foreign keys remain foreign data |
| Storage/saver adapters | Recheck plus unchanged temp-write/rename saver; pinned body SHA `79c929fed059901b1bd8e0ac19db30d309f1c7c7d714ff7c4cac95218869343d` |
| Migration snapshot adapter | `acquire({source,recoveryDocument})`, completed-receipt prerequisite; recovery must be ORIGINAL source |
| Update use case | Single-assignment writer, unchanged; not a generic lifecycle API |
| P2 export use case | Backup/export copy capability, not a lifecycle writer |
| Existing composition | Env-only capability keyset is asserted in P2 tests; leave it unchanged |
| TypeScript configuration | Vertical glob is ALREADY included; no tsconfig edit required |
| Architecture tests | Domain8/application10 counts, import shapes, wrapper purity, pinned update-call string, infrastructure commit prohibition, saver hash |
| Windows workflow | Explicit11-file list; new resolution/lifecycle tests require explicit inclusion |

Legacy loader coercion of missing/dangling state must not enter P3. Existing active deletion selects the lexicographically first remaining profile or null; retain that policy without changing legacy unconditional refresh routing.

## Assumptions

Local engineering proposals, not new product decisions:

1. Add `domain/profile-resolution.ts` and `application/profile-lifecycle-use-case.ts`; reuse existing ports instead of adding a competing writer.
2. Use domain classes `ProfileAssignments`, `ProfileResolution`, and `ProfileDesiredState` with clear responsibilities and independently owned state. Static factories validate; private constructors only assign.
3. All lifecycle operations return `Promise<LifecycleResult>` because the required validation port may be asynchronous. Await rejection/acceptance before any persistence side effect.
4. Use a separate additive composition export `createProfileLifecycleCapabilities(env, validateAffectedPairs)`. Original `createProfileCapabilities(env)` behavior/keyset remain unchanged.
5. Desired active AND explicit no-active results carry cleanup coverage as `readonly string[]`, preserving prior-only unsupported identities instead of restricting them to supported-agent types.
6. Reuse the existing update version-policy discriminant; if actual implementation requires materially different contracts, stop/replan rather than invent APIs or silently widen scope.

## Design Tensions

None. The former size conflict is resolved by the explicit human P3-only exception. Task/spec budget text is aligned; all17Gherkin scenarios, requirements, functional scope, and dependencies remain unchanged. Exact originals were preserved and compared byte-identically before amendment.

## Vertical Slicing Decision

Historical one-pass analysis, retained as the rationale for the approved exception; no further slicing iteration:

| Candidate | Cohesive contents | Forecast | Assessment |
| --- | --- | ---: | --- |
| Whole unit | Complete resolution and lifecycle |620–857| Exceeds original boundary |
| Slice A | Domain resolution/immutable edit behavior, tests and guidance |340–400| Borderline, no reliable margin |
| Slice B | Validated lifecycle persistence, wiring, tests, CI and RESULT |400–530| No reliable fit below400 |

The human approved one complete P3 implementation delivery above400 with no new cap, superseding the original size boundary for P3 only. Do not cut failure tests/docs/evidence or manufacture small slices. Implementation and publication are NOT approved by this size decision.

## Execution Strategy

After explicit publication/implementation authorization, publish TWO focused planning units over PR137. Unit A contains the bounded task003 amendment, active spec, and their two original-version backups: expected286 changed lines against P2 (task2 + spec114 + backups56+114). Unit B contains only the finalized PLAN; measure its actual added lines before staging and keep it below400. The amended task MUST transfer, even though its original is already in ancestry. Never bundle A+B into one oversized artifact PR, copy the dirty index, or absorb unrelated artifacts.

Implementation base must be the published P3 unit-B artifact head, and its PR must target that artifact branch, preserving immediate-parent review. Proposed new branch `feat/reasoning-effort-p3-resolution` and worktree `/tmp/opencode/afergon-ai-reasoning-effort-p3-resolution`; check parent and all local/remote/path collisions before creating either. No creation during planning.

If P2 changes while under human review, stop/replan. No automatic rebase, retarget, merge, or existing PR mutation. Human asynchronous approval remains distinct from technical predecessor evidence. Landing order remains P1→P2→P3.

## Git State and Disposition

Verified2026-10-28 after size-only task/spec alignment; prior audit snapshots are identified below:

- Root `main` at `b558aadbef0390c5e9ca833d6b34af1303ffb67a`, tracking `origin/main`, divergence0/0.
- Complete topology inspected:33 registrations: dirty root; clean contract worktree at `587647092f177138ca53b8e36b0e66e586e00990`; clean P2-plan worktree at `d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2`; clean P2 implementation at `c5088d15788bbb19b8640afdea8b909a4d363bbe`;29 old linked registrations prunable, cause unknown. Preserve all metadata/refs; no recreation, prune, or unavailable-content hash claims.
- Staged empty. Tracked unstaged only `openspec/tasks/PROJECT-TASKS.md`,161additions/1deletion, preserve untouched.
- Untracked history:35 individual files before the2026-10-27 PLAN rewrite;36 after preserving the original287-line PLAN;38 after today's two task/spec provenance backups. Actual individual paths were inspected, not directory-collapsed status entries. Current task/spec differ from their originals only in the approved budget clauses.
- The prior287-line PLAN under `PLAN-old-20261027.md` remains local historical provenance, not an active plan or publication input. Its content was preserved unchanged by the earlier move.
- Remote PR137 remains OPEN at exact `c5088d1`, base `docs/issue94-p2-export-plan`, all four checks SUCCESS. Approved issue94 stays OPEN. No human acceptance, merge, or new app execution is inferred.

Explicit future transfer allowlist (five files, all other dirty state preserved):

1. `openspec/tasks/003-reasoning-effort-model-profiles-resolution.md`
2. `openspec/tasks/003-reasoning-effort-model-profiles-resolution-old-20261028.md`
3. `openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle.md`
4. `openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle-old-20261028.md`
5. `openspec/plans/reasoning-effort-model-profiles-resolution/PLAN.md`

The other33 individual untracked paths are preserve-only, never transferred/staged:

1. `openspec/debate/debate-summary-reasoning-effort-model-profiles.md`
2. `openspec/plans/reasoning-effort-model-profiles-cli/PLAN.md`
3. `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md`
4. `openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md`
5. `openspec/plans/reasoning-effort-model-profiles-posix/PLAN.md`
6. `openspec/plans/reasoning-effort-model-profiles-projection/PLAN.md`
7. `openspec/plans/reasoning-effort-model-profiles-resolution/PLAN-old-20261027.md`
8. `openspec/plans/reasoning-effort-model-profiles-windows/PLAN.md`
9. `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md`
10. `openspec/specs/reasoning-effort-model-profiles-cli/spec-01-atomic-effort-editing.md`
11. `openspec/specs/reasoning-effort-model-profiles-cli/spec-02-truthful-inspection-and-guidance.md`
12. `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md`
13. `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery-old-20261025-194903.md`
14. `openspec/specs/reasoning-effort-model-profiles-ownership/spec-01-recoverable-field-ownership.md`
15. `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md`
16. `openspec/specs/reasoning-effort-model-profiles-posix/spec-01-packaged-cross-platform-projection.md`
17. `openspec/specs/reasoning-effort-model-profiles-projection/spec-01-callable-managed-json-projection.md`
18. `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-01-tested-version-diagnostic.md`
19. `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-02-runtime-evidence-and-support.md`
20. `openspec/specs/reasoning-effort-model-profiles-tui/spec-01-staged-effort-editor.md`
21. `openspec/specs/reasoning-effort-model-profiles-tui/spec-02-inspection-and-save-status.md`
22. `openspec/specs/reasoning-effort-model-profiles-windows/spec-01-cross-platform-activation.md`
23. `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
24. `openspec/tasks/002-reasoning-effort-model-profiles-downgrade.md`
25. `openspec/tasks/002-reasoning-effort-model-profiles-downgrade-old-20261025-194903.md`
26. `openspec/tasks/004-reasoning-effort-model-profiles-capability.md`
27. `openspec/tasks/005-reasoning-effort-model-profiles-ownership.md`
28. `openspec/tasks/006-reasoning-effort-model-profiles-projection.md`
29. `openspec/tasks/007-reasoning-effort-model-profiles-posix.md`
30. `openspec/tasks/008-reasoning-effort-model-profiles-windows.md`
31. `openspec/tasks/009-reasoning-effort-model-profiles-cli.md`
32. `openspec/tasks/010-reasoning-effort-model-profiles-tui.md`
33. `openspec/tasks/011-reasoning-effort-model-profiles-runtime-compatibility.md`

Implementation stage allowlist: new domain/application modules; additive `profile-composition.ts` change; two new focused test files; architecture-test updates; explicit Windows-list lines; `scripts/lib/model-profiles/README.md`; `openspec/results/reasoning-effort-model-profiles-resolution/RESULT.md`; evidence-backed PLAN checkbox changes. Reinspect all five Git categories before execution; stop if state invalidates ownership/isolation. Never `git add .`.

## Implementation Steps

- [x] Publish and review focused artifact units A then B after authorization; accepted Plan→Implement gate; fresh Git audit and isolated worktree from the published unit-B head. Size-only contract alignment is already produced.
- [x] Per behavior: establish a compilable surface, write ONE assertion, observe behavioral RED, minimum TPP GREEN, then at least two sequential adversarial cases. Module absence/type errors are scaffolding, not RED. Preserve contemporaneous exact commands/outcomes; no invented logs.
- [x] U1–U4 domain classes: independent configured/resolved values/sources, local effort, legacy inheritance, model-only effort preservation, combined edits, affected-parent/children collection and explicit effort clear. Gherkin1–7,16.
- [x] U5–U6 desired state: active/empty/effort-free/null and complete supported-plus-prior cleanup coverage; strict source/malformed/dangling failures never reset. Gherkin10–12,15,17.
- [x] U7–U11 lifecycle: single/bulk save, clear, clone, switch, delete; async injected validation awaited, rejection leaves prior bytes/caller state intact; inactive refresh intent false; active/final deletion retains lexicographic selection policy. Gherkin5–9,13–14.
- [x] Shared commit sequence: retain original source/document → version gate → independent candidate → mutate/resolve/collect → await validation → validate/recheck → if migration required acquire snapshot of ORIGINAL source and require complete receipt → only then promote candidate to2 → final validation/recheck → exactly ONE application-layer `atomicPersist` → committed result/intent. Failures produce no success intent; retained complete snapshots are recovery artifacts, not rollback garbage.
- [x] Wire additive lifecycle composition export. Deliberately update architecture counts domain8→9/application10→11 and commit-caller allowlist; preserve other architecture constraints. Add both test files to Windows list.
- [ ] Add internal guidance, source/emitted parity, no-live-route/host-sentinel proofs, and implementation RESULT. Full local verification, independent review, exact-head native CI before acceptance; no merges. *(Local guidance, parity, sentinels, RESULT, and full local verification are produced; independent review and exact-head native Windows CI remain outstanding external gates. A bounded review→Implement re-entry (canonical review corrections, user-approved 2026-10-28) applied empty-patch data-loss guards, complete supported-union-prior-verbatim cleanup coverage for active/empty/no-active states, first-class resolvedEffort, supported-only desired assignments, prototype-safe cloning, bulk item type clarification with agent-policy injection, a strengthened atomicPersist caller scan, and caller-mutation/rename-fault/corrupt-JSON evidence; task/spec functional scope unchanged.)*

## Interfaces and Technical Contracts

- `ProfileAssignments`: independent validated assignments, resolve, model-only/combined immutable edit, clear effort, clone and affected-pair collection. Edited agent plus changed inheriting children are included; explicit unchanged children excluded; compare model AND effort, deduplicate, retain nullable runtime-default model.
- `ProfileResolution`: configured and profile-resolved model/effort with separate sources; distinguish explicit model, explicit inherit, implicit inherit, runtime default; explicit/no-override effort. Parent effort never propagates.
- `ProfileDesiredState`: active/no-active/error discrimination; active and no-active carry cleanup coverage over supported agents and prior verbatim string identities. Never encode missing/error as intentional null.
- `ProfileLifecycleUseCase`: constructor-injected reader, validator, cloner, storage, snapshots and required `ValidateAffectedPairs` port. `saveAssignment`, `clearEffort`, `saveAssignments`, `cloneProfile`, `switchProfile`, `deleteProfile` return `Promise<LifecycleResult>`. No default validation acceptance. Result carries desired state, refresh intent, path and optional migration receipt/path after commit.
- Composition adds `createProfileLifecycleCapabilities(env, validateAffectedPairs)` in the existing root. It performs no lifecycle mutation at import/construction and does not change the original capability keyset or live routing.
- Architecture update is explicit: retain the pinned update-use-case call assertion and permit the new lifecycle application use case as the second named commit caller; prohibit calls from infrastructure and all other files. Retain wrapper negatives, saver hash, inward import rules and existing composition-root list.

## Publication and Budget

Forecast adds+deletes, not measured implementation:

| Component | Lines |
| --- | ---: |
| Domain behavior classes |110–140|
| Lifecycle application use case |130–170|
| Additive composition |10–16|
| Resolution behavior tests |150–200|
| Lifecycle/failure tests |150–220|
| Architecture assertions |8–14|
| Windows list |2|
| Internal guidance |15–25|
| RESULT during implementation |45–60|
| Late PLAN evidence edits |0–10|
| **Complete implementation forecast** |**620–857**|

These allocations are estimates, not caps or evidence. Record actual totals even if they grow; never abbreviate RESULT/tests to honor an estimate. RESULT is authored during implementation before review, not in a separate evidence-only PR. Initial planning costs are reported separately AND combined with implementation: unit A expected286 lines, unit B actual finalized PLAN lines, each below400. Preserve the historical287-line PLAN locally; excluding it from publication does not erase its authored-history cost. No application tests/build are claimed for planning-only work.

## Acceptance Criteria

- [x]17Gherkin scenarios covered with happy/edge/failure behavior and genuine sequential TDD/TPP evidence.
- [x] Independent sources/local effort, legacy inheritance, absent-effort meaning, nullable models and caller independence proven.
- [x] Combined/bulk one-commit behavior, clear, metadata preservation, affected-child rejection, clone independence and atomic failure preserve previous state.
- [x] Complete supported-plus-prior cleanup coverage including explicit no-active state; errors/dangling never reset; active/final selection policy and inactive refresh intent unchanged.
- [x] Source/emitted parity and direct internal APIs; no live entry-route reachability, host changes, or original capability-keyset change.
- [ ] Full tests/build, architecture/saver protection, exact-head native Windows, independent review, measured size and provenance accurately recorded. *(Full tests/build, architecture/saver protection, and measured size/provenance are recorded locally; exact-head native Windows logs and independent review remain outstanding.)*

## Verification

- Focused: `pnpm exec vitest run tests/model-profiles-resolution.test.ts tests/model-profiles-lifecycle.test.ts tests/model-profiles-architecture.test.ts --no-file-parallelism`.
- Regression: `pnpm exec vitest run tests/model-profiles.test.ts tests/model-profiles-storage.test.ts tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-export.test.ts tests/model-profiles-export-runtime.test.ts tests/model-profiles-update-runtime.test.ts tests/model-profiles-snapshot-acquisition.test.ts tests/model-profiles-snapshot-inspection.test.ts tests/model-profiles-snapshot-runtime.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts --no-file-parallelism`; then `pnpm typecheck`; `pnpm build`; `pnpm run health:runtime`; `pnpm run doctor:runtime`; `pnpm test`. Prior1128/9 is historical, not a new run.
- Direct source/emitted fixtures for resolution, rejected async validation, lifecycle intent, snapshot/commit failures and host sentinels; health alone is not new-API evidence.
- Inspect transitive live call/import reachability without expanding facade/CLI/TUI/installers/registrar. Controlled fixture HOME/XDG/AFERGON directories, no paid/live requests.
- Add P3 tests to explicit native Windows list; guard POSIX mode/case assertions by appropriate platform AND filesystem conditions, no whole fault-suite skip. Native exact-head logs required; Linux/source-text checks are not Windows proof.
- Record evidence as produced/not applicable/outstanding; docs-only plan changes require content review, not app tests/build. Do not mark acceptance complete before applicable review/native proof.

## Open Questions

None. The sole size question was resolved by explicit human P3-only authorization2026-10-28. No functional questions are reopened.

## Dependencies

- P1 storage implemented and P2 reviewed/published at verifiedc5088d1; pending human async review/landing remains theirs, not presumed.
- Published P3 contract unit A and finalized PLAN unit B become implementation ancestors. Implementation base/PR target must be unit B's published head/branch. Separate authorization for publication and Plan→Implement is still required; size approval is not that gate.
- P4 supplies real capability validation policy through the required port; P3 uses injected tests, not a fabricated support policy.

## Risks and Watchouts

Legacy coercion, affected children, candidate aliasing, premature intent and async validation are explicit failure-test obligations. Preserve original recovery data and receipt-before-version-promotion ordering. A shared atomic port is not a whole-lifecycle implementation; do not assume it supplies missing behavior. The P3 size exception resolves the boundary, not the obligation to measure/report actual scope. Moving base or dirty-state changes invalidate isolation: stop/replan, never automatic rebase. Preserve all workflow history and saved copies on rollback; no merge, issue closure, or old-worktree pruning.

## Completion Condition

Planning is ready-with-assumptions: the P3-only size exception is approved and task/spec budget alignment is applied with exact original provenance. No implementation/publication is authorized here. After explicit artifact publication and Plan→Implement authorization, completion requires all behavior/evidence/review/native acceptance obligations; only then may downstream P4 execution advance.
