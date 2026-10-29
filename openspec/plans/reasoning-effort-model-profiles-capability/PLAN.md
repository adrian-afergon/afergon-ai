# Plan: Isolated capability validation and pair-bound acknowledgements (P4)

- **Source Task**: `openspec/tasks/004-reasoning-effort-model-profiles-capability.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md` — ready,117lines,16Gherkin scenarios
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed; one honest assessment exhausted, fresh P4-only cohesive exception approved

## Summary

P4 delivers a complete, directly callable but inactive capability validator over reviewed P3 `ca4d4f37d70b59d17f1ee67d228b210d0f99fb0e` (PR140): explicit provider/model/transport evidence queries, shared lifecycle/future-projection validation, and exact-pair unknown acknowledgements persisted with the assignment in one atomic commit.

The human approved the proof-boundary change2026-10-28: NO Effect dependency, NO copied executable OpenCode internals, NO upstream schema execution by P4, and NO package/lockfile changes. P4 tests its own rules with isolated ports and immutable evidence DATA. P6 owns real public-boundary configuration acceptance/instrumented request proof; P11 records/reuses actual tested-version evidence. Source evidence is not relabeled execution or provider acceptance.

The human authorized a fresh P4-only cohesive size exception2026-10-28, above400 with no new numeric ceiling; forecast1,150–1,350 is not a cap, no evidence cuts, no inheritance from P3. Implementation, commits, publication, new isolation and merges remain unauthorized. Existing PRs remain untouched for asynchronous human review.

## Planning Scope

- Supported, explicitly known unsupported and unknown outcomes with versioned evidence provenance. Availability, similar model names, missing variants and out-of-menu values never establish support or incompatibility by themselves.
- Per-pair explicit provider/model/transport context supplied through an injected resolver. Unknown context yields unknown; do not assign one assumed transport to every agent.
- Shared validation for save/switch/clone/delete and a callable future projection consumer; validate affected inheriting children before any snapshot/commit.
- Assignment-local, versioned unknown acknowledgement bound to the exact resolved model/effort; tagged runtime-default scope is not a wildcard for future concrete models. Separate model-ID allowance; neither allowance bypasses malformed or known-unsupported combinations.
- Single awaited validation pass, verified plain-data receipt application, atomic acknowledgement persistence, collision/prototype safety, preservation of foreign fields and original recovery data.
- Source-evidence report, data fixture/provenance, source/emitted behavior, cold imports, Windows suite-list additions, limitations guidance and implementation RESULT.

Excluded: Effect/new dependencies, executable upstream fixtures, provider requests, CLI/TUI flags/editors, host writes/projection, install/update activation, runtime diagnostics011, registry redesign, universal effort translation, and legacy workflow changes.

## Design Rule Alignment

- Domain behavior in classes (`CapabilityVerdict`, `UnknownEffortAcknowledgement`, acknowledgement policy); static validating factories and private assigning constructors. Interfaces describe semantic ports/receipts/data; constructor DI and inward dependencies; Node/fs only in infrastructure.
- Reuse strict assignment validation, cloner, existing lifecycle/storage ports and ORIGINAL-source snapshot-before-v2 sequencing. Exactly two application commit callers remain update and lifecycle; no replacement writer.
- Preserve existing P3 required void-callback behavior and original P2/P3 capability keysets, saver hash, negative architecture fixtures and live-entry boundaries.
- Tests, data fixtures, docs and RESULT remain with their behavior. No artificial compression, dropped evidence or separate-RESULT publication loophole.
- No network during tests/import/construction/live validation. Existing TypeScript glob already covers new vertical modules. Package manifest and lockfile remain byte-identical to the base.

## Verified Baseline and Evidence

Actual P3 source was inspected, not inferred from task prose. Its required `ValidateAffectedPairs` accepts readonly pairs and returns void, so acknowledgement persistence needs an additive receipt bridge, not an out-of-band callback mutation or a second writer.

At the unchanged OpenCode candidate pin1.18.34 / `e9f8a210b9e2b1e13d375b84906069886eb3b767`, read-only research found:

| Pinned source | Scoped finding |
| --- | --- |
| `test/tool/fixtures/models-api.json`, `/openai/models/gpt-5.1`, `/openai/npm` | Reasoning enabled, explicit effort options `none/low/medium/high`, `@ai-sdk/openai` transport, no model override |
| `test/preload.ts:38` | Upstream tests explicitly select that committed catalog |
| `src/provider/provider.ts:1316–1369` | Resolves transport/capabilities and prioritizes explicit reasoning options over fallback variants |
| `src/provider/transform.ts:1717–1744,1820–1824` | Maps those declared effort options to OpenAI-shaped request options |

Immutable blob IDs: catalog `8ead8c2a9ab7b2758137f4b20299f8b8be97026d`; preload `16b4789b0725b50cd9056f0ff9b9885bcb9139b3`; provider `97f83bb51d1c6ffb6eca2605b40fcfd6116fb774`; transform `8ae8b4d9f16b73aa5fad0da2a19c48d59958a737`. Paths are under upstream `packages/opencode/`.

This is **source-declared mapping for a pinned TEST CATALOG**, not a production-release catalog or live-provider acceptance. Seed entries record that claim kind, exact context, conditions, commit, blob IDs and JSON pointers. An empty production seed is not a substitute for the evidence-backed adapter acceptance criterion. Real routes/context must be supplied by callers, not inferred from spelling; Cloudflare OpenAI records can normalize to native `@ai-sdk/openai`, not an assumed gateway transport.

No negative production record is invented from exposed variant lists. Known-unsupported classification is tested with explicitly labeled unit-data negatives; production negatives require actual applicable explicit evidence, otherwise unknown. Schema acceptance and request propagation remain unproduced until P6 executes its public-boundary proof; P11 must reuse actual results, not fill missing prerequisites.

P6's existing Requirement25 and P11's E1/E2/matrixR1 already own these obligations. They required no edits. The active P4 spec changed only Scope, the evidence boundary requirement, G14 and its dependency pointer; the other15 scenarios are byte-unchanged. Original112lines are preserved in `spec-01-capability-validation-old-20261028-no-effect.md`, compared byte-identically before amendment.

## Assumptions

Local engineering proposals, not additional product decisions:

1. Versioned assignment-local `unknownEffortAck` carries exact resolved-pair or tagged runtime-default identity. Malformed/foreign-shaped payloads are inert and preserved. New acknowledgement writes refuse foreign-field collisions rather than overwriting user data. Clone preserves metadata; replay still requires the exact resolved identity, never global permission.
2. One operation-scoped explicit acknowledgement intent covers only its currently resolved affected set. Receipts enumerate exact profile/agent/pairs; persistence is per-assignment, never an unbound global permission boolean.
3. Additively evolve the existing validation method: same readonly pairs argument, optional immutable validation context, `Promise<void | CapabilityValidationReceipt>`. Existing explicit P3 void callbacks remain compatible. Production P4 wiring injects exactly one strict validator; no default/no-op acceptance and no first validator that rejects before a second can read acknowledgements.
4. Resolve context per affected pair, including different child models/providers/transports. Verify context identity agrees with the candidate pair; absent/mismatched context cannot manufacture supported status.
5. After awaited validation, verify the WHOLE plain-data receipt against declared profile/agent/exact post-resolution pairs and complete requested-pair coverage before ANY metadata application. Reject forged, unrequested, foreign or missing outcomes; include explicit no-override outcomes for resolved omission. No mutable candidate references escape to validation; test pending-input mutation.
6. Regular unchanged/empty patches remain no-ops. Explicit acknowledgement-only save may write managed metadata through the full atomic path. After fresh validation, an already-identical acknowledgement causes no write/refresh; do not skip fresh evidence/context checks merely because stored metadata matches.
7. Clear effort removes only valid owned acknowledgement metadata and preserves foreign colliding fields. Subsequent acknowledgement writes fail closed on collisions. Changed model/effort invalidates matching; stale metadata is not generalized permission.
8. Missing effort after resolution is no override. Own raw null/empty/undefined/`inherit` fails strict assignment validation before resolution and cannot be treated as omission. Runtime-default acknowledgement does not authorize a later concrete model.

## Design Tensions

None. The proof-boundary choice is resolved (Effect rejected, isolated P4 tests approved), and the human approved a fresh P4-only cohesive size exception2026-10-28 without a new numeric cap. Publication and Plan→Implement approvals remain normal pending gates, not unresolved product/design questions.

## Vertical Slicing Decision

Historical rationale retained for the approved exception: one honest assessment of the newly approved scope, not repeated fragmentation of the rejected Effect design:

| Candidate | Complete observable capability | Forecast | Assessment |
| --- | --- | ---: | --- |
| One complete unit | Classification, acknowledgement and lifecycle integration |1,150–1,350| Needs a fresh exception |
| Classifier/evidence then acknowledgement/lifecycle | Classification is independently useful and testable |620–700 and500–620| Neither reliably below400 |
| Minimal classifier without shared validation | Smaller observable query, incomplete remaining shared semantics |410–490| Still no reliable fit |

The recommended P4-only cohesive exception was approved2026-10-28, above400 with no new cap and no evidence cuts. No further splitting pass, source-only/test-only slices or manufactured small forecasts. Forecasts are not measured implementation. The size decision grants no implementation/publication authority.

## Execution Strategy

Sequential after final artifact verification/publication and explicit Plan→Implement approval. Publish unit A (contract/provenance) over verified P3, then unit B (PLAN) over A. Implementation base AND PR target must be the accepted unit-B head/branch, preventing polluted predecessor-relative review. No merge is authorized by the size decision.

Proposed implementation branch `feat/reasoning-effort-p4-capability`, worktree `/tmp/opencode/afergon-ai-reasoning-effort-p4-capability`. Check parent/local/remote/path availability again before creation; do not recreate/prune old registrations. If PR140 moves during async review, stop/replan; no automatic rebase, retarget, merge or old PR mutation.

## Implementation Steps

- [x] Verify/publish the five allowlisted planning artifacts only after explicit authorization; fresh five-category Git audit and new isolation from the accepted unit-B artifact head. Size-only task004 alignment is already produced with an exact preserved original.
- [x] Per behavior: minimal compilable surface, ONE assertion producing genuine behavioral RED, minimum TPP GREEN, at least two sequential adversarial cases/characterizations, then refactor green. Exact commands/exits captured contemporaneously; module/type failures are scaffolding, not RED.
- [x] Verdict and acknowledgement domain classes/policy: identity, stale replay, runtime-default scope, raw malformed values, owned/foreign payloads, collisions and prototype-safe reads/application/clear.
- [x] Query/context/receipt contracts and shared validator: supported provenance, explicit-negative rejection, conservative unknown, exact acknowledgement, allowance separation, per-child transport context and projection-consumer equivalence.
- [x] Additive lifecycle bridge: capture independent candidate context, await one validation, verify/apply whole receipt, final document validation/rechecks, ORIGINAL snapshot completion before v2, exactly one existing atomic commit. Ordinary unchanged patches stay no-op with[]coverage/refreshIntent:false. Explicit acknowledgement-only intent runs fresh validation; metadata writes use normal active/inactive intent, already-identical acknowledgement after validation causes no write/refresh.
- [x] Infrastructure exact-tuple evidence adapter, minimal immutable catalog DATA extract and source-evidence report; no executable upstream files, runtime invocation, dependency or manifest/lockfile edit.
- [x] Additive composition wiring with explicit per-pair resolver, original keysets/live routes stable. Update actual domain/application module counts and preserve the two-callers/negative-fixture/saver guards.
- [x] Capability and acknowledgement suites; existing P3 callback/source/emitted regressions; pending-input mutation, forged/incomplete receipts, parent-change acknowledgement mismatch unless explicitly acknowledged as a new exact set, known-negative rejection despite matching acknowledgement, metadata collisions, ack-only migration and real atomic-save-failure preservation.
- [x] Add both new test files to the explicit native Windows list without removing baseline suites. Cold import/construction no IO; direct source/emitted parity; no whole fault-suite skips.
- [ ] Limitations guidance in the existing README model-profiles area, no new global documentation directory; RESULT authored during implementation before independent review; local/full gates, exact-head review and actual native CI before acceptance. No P5 activation or merges.

## Interfaces and Technical Contracts

- `EffortCapabilityContext`: per-pair explicit provider/model/transport/effort and applicable evidence identity. `CapabilityContextResolver.resolve(pair, operationContext)` supplies it; no single global context for heterogeneous agents.
- `EffortCapabilityQuery`: semantic classification port returning verdict, scoped provenance and model-specific feedback. Model availability is not capability input evidence.
- `CapabilityVerdict`, `UnknownEffortAcknowledgement`, acknowledgement policy: classes own validated outcomes, exact tagged identity, own-property read and verified application. Data interfaces remain in the owning domain/application layer; no domain→application imports or Node/environment dependencies inward.
- Evolved `ValidateAffectedPairs`: required existing method with optional immutable per-request context; returns void or one `CapabilityValidationReceipt`. Production P4 returns the receipt once; existing explicit P3 void callbacks produce no metadata effects and remain tested.
- `CapabilityValidationReceipt`: immutable complete outcomes for requested pairs (including explicit no-override) and exact profile/agent/identity records; lifecycle is the only candidate mutator. Verify the entire receipt before applying any acknowledgement; one forged/incomplete entry rejects the batch without partial mutation. Then use the existing single commit sequence.
- P4 composition returns the shared strict validator plus real evidence adapter and injected resolver. Compatibility reports identify inspected source pin and unverified execution; they cannot certify runtime/provider acceptance.

## Publication and Budget

Reforecast over actual P3 sources, excluding initial planning publication but including all implementation evidence:

| Component | Forecast adds+deletes |
| --- | ---: |
| Domain verdict/acknowledgement classes/policy |165|
| Application contracts/shared validator |165|
| P3 lifecycle/resolution bridge |106|
| Infrastructure evidence/adapter/report/composition |207|
| Two new behavior suites |430|
| Catalog DATA extract and provenance |30|
| Existing lifecycle/architecture tests and Windows list |71|
| Internal limitations guidance |65|
| RESULT during implementation |55, never a cap|
| Package manifest/lockfile/dependencies |0|
| **Provisional total** |**1,294; range1,150–1,350**|

Measure real totals and report growth without compression. Focused artifact unit A is expected287 changed lines versus P3: task004 amended Notes diff2, original task backup56, active spec117, historical spec112. Unit B contains only this finalized PLAN, measured before staging and below400. Never bundle A+B into an oversized planning PR. Report initial planning and implementation separately AND combined; RESULT remains part of implementation, not a separate evidence-only PR. The original task was compared byte-identically before its size-only amendment; the spec provenance likewise predates its approved proof-boundary change.

## Acceptance Criteria

- [x] All16active scenarios pass with the revised source-only G14 and unchanged other15 behaviors.
- [x] Exact provider/model/transport provenance; unknown context and resemblance remain unknown; no negative inference from menu absence; unsupported/malformed cannot be acknowledged around.
- [x] Exact-pair persisted acknowledgement/invalidation, runtime-default scope, parent-child revalidation, idempotent ack-only writes and same-commit failure atomicity proven; no global permission or foreign-data loss.
- [x] Existing required P3 void callbacks, no-op/cleanup semantics, source/emitted behavior and keysets remain compatible; one awaited production validation, no default acceptance.
- [x] No Effect/new dependencies, executable upstream code, OpenCode/provider execution, live UI/host effects or manifest/lockfile changes. Source evidence stays distinct from P6 proof/P11 matrix.
- [ ] Full relevant tests/build/architecture/saver preservation, independent review, actual native CI and measured size/provenance recorded accurately.

## Verification

- Focused: `pnpm exec vitest run tests/model-profiles-capability.test.ts tests/model-profiles-acknowledgement.test.ts --no-file-parallelism`; regressions: `pnpm exec vitest run tests/model-profiles-lifecycle.test.ts tests/model-profiles-resolution.test.ts tests/model-profiles-architecture.test.ts tests/model-profiles-persistence.test.ts tests/model-profiles-export.test.ts --no-file-parallelism`; then full `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm run health:runtime`, `pnpm run doctor:runtime`. Record exact commands/exits contemporaneously.
- Verify per-pair context/identity mismatch, replay and model/effort/parent changes, raw invalid aliases, both allowance bypass attempts, forged/colliding receipts, pending caller mutation, foreign preservation, ack-only/no-op behavior, snapshot ordering and real save failure.
- No network or provider credentials; fixture DATA contains commit/blob/JSON-pointer provenance. Source reporting never counts as an executed upstream test or production-provider result.
- Emitted API parity, cold imports/no IO, transitive live-route negatives and unchanged sentinels. Append both new test files to the explicit Windows list (13→15), removing nothing; use platform AND filesystem guards only where relevant, no blanket skip or unguarded POSIX assertions. Actual exact-head logs required later.
- Tests/build are not applicable to this Markdown-only draft. Record produced/not applicable/outstanding honestly; prior P3 counts are historical, not fresh P4 runs.

## Git State and Disposition

Read-only audit2026-10-28: root `main` at `b558aad`, tracking `origin/main`, divergence0/0; index empty; sole tracked unstaged `openspec/tasks/PROJECT-TASKS.md`161+/1− preserved. PR140 freshly checked OPEN at exact `ca4d4f3`; no human acceptance inferred.

Complete topology:36 registrations, seven accessible (root dirty, six clean published artifact/implementation worktrees),29 old linked registrations prunable with unknown disappearance cause. Preserve all refs/metadata; no prune, recreation or unavailable-content hash claims.

Current41 individual untracked paths verified, not directory-collapsed entries:38originals + P4PLAN + historical spec + original task backup. Only task004 Notes changed under explicit size authority; its original56lines match the P3 task blob `5a4d3fb8502e5f457cfd5e8b04c13a9f5ac0e8e3` (SHA-256 `407cdd715b40e21cb83fae9a25ec4cbccd51581c1790d919d232c2903a42d980`). No P6/P11/source/old PR edits occurred.

Future publication transfer allowlist (five files, all root copies preserved):

1. `openspec/tasks/004-reasoning-effort-model-profiles-capability.md`
2. `openspec/tasks/004-reasoning-effort-model-profiles-capability-old-20261028-size.md`
3. `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md`
4. `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation-old-20261028-no-effect.md`
5. `openspec/plans/reasoning-effort-model-profiles-capability/PLAN.md`

The other36 untracked paths are preserve-only, never transferred/staged:

1. `openspec/debate/debate-summary-reasoning-effort-model-profiles.md`
2. `openspec/plans/reasoning-effort-model-profiles-cli/PLAN.md`
3. `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md`
4. `openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md`
5. `openspec/plans/reasoning-effort-model-profiles-posix/PLAN.md`
6. `openspec/plans/reasoning-effort-model-profiles-projection/PLAN.md`
7. `openspec/plans/reasoning-effort-model-profiles-resolution/PLAN.md`
8. `openspec/plans/reasoning-effort-model-profiles-resolution/PLAN-old-20261027.md`
9. `openspec/plans/reasoning-effort-model-profiles-windows/PLAN.md`
10. `openspec/specs/reasoning-effort-model-profiles-cli/spec-01-atomic-effort-editing.md`
11. `openspec/specs/reasoning-effort-model-profiles-cli/spec-02-truthful-inspection-and-guidance.md`
12. `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md`
13. `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery-old-20261025-194903.md`
14. `openspec/specs/reasoning-effort-model-profiles-ownership/spec-01-recoverable-field-ownership.md`
15. `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md`
16. `openspec/specs/reasoning-effort-model-profiles-posix/spec-01-packaged-cross-platform-projection.md`
17. `openspec/specs/reasoning-effort-model-profiles-projection/spec-01-callable-managed-json-projection.md`
18. `openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle.md`
19. `openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle-old-20261028.md`
20. `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-01-tested-version-diagnostic.md`
21. `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-02-runtime-evidence-and-support.md`
22. `openspec/specs/reasoning-effort-model-profiles-tui/spec-01-staged-effort-editor.md`
23. `openspec/specs/reasoning-effort-model-profiles-tui/spec-02-inspection-and-save-status.md`
24. `openspec/specs/reasoning-effort-model-profiles-windows/spec-01-cross-platform-activation.md`
25. `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
26. `openspec/tasks/002-reasoning-effort-model-profiles-downgrade.md`
27. `openspec/tasks/002-reasoning-effort-model-profiles-downgrade-old-20261025-194903.md`
28. `openspec/tasks/003-reasoning-effort-model-profiles-resolution.md`
29. `openspec/tasks/003-reasoning-effort-model-profiles-resolution-old-20261028.md`
30. `openspec/tasks/005-reasoning-effort-model-profiles-ownership.md`
31. `openspec/tasks/006-reasoning-effort-model-profiles-projection.md`
32. `openspec/tasks/007-reasoning-effort-model-profiles-posix.md`
33. `openspec/tasks/008-reasoning-effort-model-profiles-windows.md`
34. `openspec/tasks/009-reasoning-effort-model-profiles-cli.md`
35. `openspec/tasks/010-reasoning-effort-model-profiles-tui.md`
36. `openspec/tasks/011-reasoning-effort-model-profiles-runtime-compatibility.md`

Implementation staging allowlist: new domain `capability-verdict.ts`, `unknown-effort-acknowledgement.ts`; application `capability-validation-port.ts`, `validate-profile-capability-use-case.ts`; infrastructure `opencode-capability-evidence.ts`, `opencode-capability-adapter.ts`, `opencode-compatibility-report.ts` (all under the existing vertical); additive edits to `profile-lifecycle-use-case.ts`, `profile-resolution.ts`, `profile-composition.ts`; the two new test files, test-only `tests/fixtures/opencode-pin-catalog/gpt-5.1.json`, existing lifecycle/architecture tests, explicit Windows list, README, implementation RESULT and evidence-backed late PLAN changes. No package/lock/config edits.

Production evidence is TypeScript inside infrastructure, emitted by the existing build; never import tests/fixtures or require a new JSON runtime-asset copy step. Test fixture is DATA only. Refresh all five Git categories before transfer/implementation and stop if isolation changes. Never transfer root index/unrelated artifacts or prune/recreate registrations; no new worktree during planning.

## Open Questions

None. The human approved the fresh P4-only cohesive size exception2026-10-28. Effect remains rejected, no dependency approval is implied, and the forecast is not a cap. Separate publication/implementation authorization is still required.

## Dependencies

- P3 PR140 at `ca4d4f3`; recheck before isolation and stop/replan on movement. Async human review remains theirs and untouched.
- Source-evidence pin1.18.34/e9f8a210 remains fixed; P6 owns actual public config acceptance/request proof, P11 records/reuses actual tested/unverified evidence. Neither later unit's obligations were removed or postponed further.
- Final artifact review/publication and explicit Plan→Implement gate remain mandatory and pending. Neither the approved proof boundary nor size exception grants implementation, commit, publication or merge authority.

## Risks and Watchouts

Pinned TEST CATALOG evidence is not a production-release catalog or live request proof. Never invent route context, unsupported entries, universal effort values or executed statuses. Protect caller/candidate data across await and verify whole receipts before mutation. Preserve original recovery data and P3 no-op/cleanup guarantees. No source proof may certify another installed runtime. No merges, issue closure, dependency installs or old-worktree cleanup.

## Completion Condition

Plan is ready-with-assumptions: proof boundary and P4-only size decisions are resolved, bounded task alignment is produced, and remaining engineering assumptions are explicit. Implementation starts only after focused artifact publication and an explicitly approved Plan→Implement transition, with fresh Git/base verification. Completion requires actual behavior/evidence/review/native obligations, not expected outcomes. P5 remains downstream.
