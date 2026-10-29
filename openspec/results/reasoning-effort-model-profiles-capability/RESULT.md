# Result: P4 Isolated capability validation and pair-bound acknowledgements

## Implementation Status

completed-with-notes

All locally producible implementation gates are green. The bounded correction round produced explicit top-level bulk acknowledgement intent, independent verdict provenance, shared constants and regression pins. Canonical review at `88facf1` independently reproduced the passing code/test gates and found no functional defect, but returned WARN for inaccurate counts and size presentation in this report. This user-authorized correction changes ONLY this RESULT, not code or tests. Exact-tip canonical re-review, publication and native Windows CI remain OUTSTANDING external gates.

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-capability/PLAN.md` (ready-with-assumptions, 226 lines at base B)
- Spec: `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md` (ready, 117 lines, 16 Gherkin scenarios)
- Execution Mode: sequential, strict TDD/TPP, new isolation
- Base: `80e3974d0a290060aca7c0d19a3e85b6f13f8022` (accepted unit-B artifact head, PR142)
- Branch/worktree: `feat/reasoning-effort-p4-capability` at `/tmp/opencode/afergon-ai-reasoning-effort-p4-capability`

## Execution Summary

P4 delivered the inactive capability-validation vertical over reviewed P3: two domain classes (`CapabilityVerdict`; `UnknownEffortAcknowledgement` + `UnknownEffortAcknowledgementPolicy`), application ports plus one strict shared validator (`ValidateProfileCapabilityUseCase`), an additive lifecycle bridge (capture-before-await, whole-receipt verification against the candidate's actual post-resolution pairs, collision-refusing acknowledgement application, ack-only intent with fresh validation and idempotent no-write, ORIGINAL-source snapshot before v2, exactly one atomic commit, P3 void-callback compatibility), the pinned OpenCode 1.18.34 evidence seed with exact-tuple adapter and source-evidence compatibility report, an immutable DATA fixture, an additive composition factory injecting exactly one strict validator, two new behavior suites, the Windows list extension 13→15, live-route inactivity assertions, limitations guidance in the vertical README, and this RESULT. All 16 active Gherkin scenarios are mapped to passing tests. The user-authorized review-correction round then made bulk acknowledgement intent an explicit OPERATION-WIDE top-level flag (per-item flags fail closed with a diagnostic), froze an independent copy of verdict provenance instead of the caller's object, deduplicated validator constants, and added the reviewer-recommended behavior pins. No Effect, no new dependencies, manifest/lockfile byte-identical to base, no copied executable upstream code, no OpenCode/provider execution, no network, no live CLI/TUI/install/update activation.

## Completed Steps

- Five allowlisted planning artifacts verified/published under prior authorization (PR141/PR142); fresh five-category Git audit; new isolation from exact base B. (Produced before this implementation stage; audit detail in supplementary sections.)
- Per-behavior strict TDD/TPP with contemporaneous command/exit capture. (Produced; bounded deviations disclosed under `## Blockers or Deviations`.)
- Verdict and acknowledgement domain classes/policy: identity, stale replay, runtime-default scope, raw malformed values, owned/foreign payloads, collisions, prototype-safe reads/application/clear. (Produced.)
- Query/context/receipt contracts and shared validator: supported provenance, explicit-negative rejection, conservative unknown, exact acknowledgement, allowance separation, per-pair context, projection-consumer equivalence. (Produced.)
- Additive lifecycle bridge with whole-receipt verification, no-op preservation, ack-only intent, ORIGINAL snapshot before v2, one atomic commit. (Produced.)
- Infrastructure exact-tuple evidence adapter, immutable catalog DATA extract, source-evidence report; no executable upstream files, no manifest/lockfile edit. (Produced.)
- Additive composition wiring with explicit per-pair resolver; original keysets/live routes stable; module counts updated; two-callers/negative-fixture/saver guards preserved. (Produced.)
- Capability and acknowledgement suites plus P3 callback/source/emitted regressions, pending-input mutation, forged/incomplete/duplicate/unrequested receipts, parent-change staleness, known-negative precedence, collisions, ack-only migration, atomic-failure preservation. (Produced.)
- Both new test files appended to the explicit native Windows list (13→15, nothing removed); cold-import no-IO; direct source/emitted parity; no whole fault-suite skips. (Produced; native EXECUTION not produced.)
- Limitations guidance in the existing vertical README; RESULT authored during implementation. (Produced.) Exact-head independent review and actual native CI: OUTSTANDING.
- Review-correction round (user `Autorizo` at `1178a7c`, same tree/base): bulk ACK intent moved to the top-level operation with per-item flags failing closed; verdict provenance frozen as an independent deep copy; validator marker/version constants deduplicated; reviewer behavior pins added (wrong-profile receipt atomic reject, stored runtime-default replay exactness, supported-pair intent no-write); emitted-test stderr check made warning-tolerant without silencing genuine failures. (Produced.)
- Final user-authorized documentation-only correction2026-10-29: align file/test counts, label the initial verification table historical, correct the README size cell, and distinguish named size anchors from the publication tree. No application behavior or test content changed.

## Updated Plan Artifacts

- `openspec/plans/reasoning-effort-model-profiles-capability/PLAN.md` — Implementation Steps 1–9 and Acceptance Criteria 1–5 marked produced; step 10 / criterion 6 left unchecked pending external gates.
- `openspec/results/reasoning-effort-model-profiles-capability/RESULT.md` — this artifact.

## Commits Created

All ten known predecessors on `feat/reasoning-effort-p4-capability`, full SHAs from `git log`:

1. `519ba0e7e198796ec2d620fe1fb4f6b7a68697fa` — feat(model-profiles): add capability verdict and pair-bound acknowledgement domain classes
2. `658a306317fa9a867b3b2e07a1e7f1a6f7d497b7` — feat(model-profiles): add shared capability validation port and strict validator use case
3. `1c9696c1d6d68ab1a97b96cef4c04159165eb46f` — feat(model-profiles): bridge capability validation into the lifecycle with pair-bound acknowledgements
4. `1bedb2554b9554ac1050b265de2e2fdd1a114e79` — feat(model-profiles): add pinned evidence adapter, compatibility report, and capability composition
5. `ee1846ce37e8ce922379536d2e19ef3a923bf441` — docs(model-profiles): record P4 capability limitations guidance and implementation result
6. `d2577920eb6362911d358ad6c52af7babe622f7f` — docs(models): mark produced P4 plan steps and acceptance criteria
7. `0dbab37c01b308ef0e4f07374042699ca3a75ee4` — docs(model-profiles): record final measured P4 implementation size and closure commits
8. `1178a7c498468f3f461d4fe999b8444aa6cdee0f` — docs(model-profiles): align implementation result with the 11-section handoff contract
9. `917aa7d642721a5f0973471fb8574b20461e19d2` — fix(model-profiles): make bulk acknowledgement intent a top-level operation and harden verdict provenance
10. `88facf1dc6ec756175d8d51a3cc80ea7638c77da` — docs(model-profiles): record the review-correction round evidence and current anchors (the prior report with the accuracy warning corrected here)

The additional RESULT-only accuracy correction is HEAD at handoff; its exact SHA is reported externally, never embedded self-referentially. Complete range: `git log --format="%H %s" 80e3974..HEAD`; review `git diff 80e3974 HEAD`. Code/tests remain byte-identical to `917aa7d`; only this report changes after `88facf1`. No amend, force, or history rewrite.

## Files Changed

The complete P4 change touches20 files vs base B (named-anchor per-file table below): 2 new domain modules, 2 new application modules, 3 new infrastructure modules, additive lifecycle/resolution/composition edits, 2 new suites, 1 DATA fixture, existing architecture/lifecycle/resolution tests, Windows list, vertical README, PLAN and RESULT. This final correction touches only RESULT; scripts, tests, workflow, PLAN, README, manifest and lockfile remain identical to `88facf1`, with application code/tests identical to `917aa7d`.

## Verification Results

- Step-level checks at the unchanged code/test anchor, independently reproduced by the reviewer at `88facf1`: focused **50 passed**; P3 regression set **665 passed | 1 skipped**, exit0. Per-unit evidence is preserved in the historical TDD Log (including correction-round Units G–K); no new application run is claimed for this documentation-only correction.
- Final checks at the current source/test tip (commit `917aa7d` content; the docs-only closure commit changes no source/test bytes — proven by `git diff --quiet 917aa7d..HEAD -- scripts tests package.json pnpm-lock.yaml`):
  - Tests: passed — full `pnpm test` → **1257 passed | 9 skipped (1266)**, **39 files passed | 3 skipped (42)**, exit0, independently reproduced by the reviewer at `88facf1`. Historical baseline:1205 passed/9 skipped with37 passed files; initial P4:1250 passed/9 skipped with39 passed files. The correction adds7 tests without adding a test file; complete P4 delta is52 passing tests and2 passed test files over baseline.
  - Build: passed — `pnpm build` exit 0; `pnpm typecheck` exit 0.
  - Additional Evidence: passed — `pnpm run health:runtime` (no remote telemetry), `pnpm run doctor:runtime` (no recorded failures), emitted/source API parity re-verified after the bulk-operation signature change (`tests/typescript-build.test.ts` 12 passed, including the emitted capability cold-import), saver-hash and two-callers guards intact, manifest/lockfile diff vs base empty, no `effect` references.
- Docs-only closure commit: tests/build **not applicable** (no source/test/manifest bytes change — proven by `git diff --quiet`); diff check and content review apply and are the applicable evidence for this commit.

## Blockers or Deviations

- No functional blocker found in the last canonical review. The remaining documentation-accuracy WARN prompted this authorized RESULT-only correction; exact-tip re-review is still pending. Bounded historical deviations remain disclosed (no tests recreated or history erased):
  - **Batch RED authoring** (more than one failing test authored in one cycle, contrary to the one-behavior-at-a-time rule): Unit A triangulation 3 (2 tests: unknown factory + immutability); Unit B B3+B4 (characterization + RED in one edit); Unit D D7–D9 (3 tests), D10–D12 (3 tests), D13–G13 (4 tests, one failing for a scaffold reason); Unit E E3 (2 tests). Each batch still went GREEN before the next batch was authored.
  - **Scaffold-vs-behavioral RED classification**: Unit B B7's first failure was a missing test import (`ReferenceError`) — scaffolding, not a behavioral RED; the behavioral assertions passed immediately after the import fix. Unit D D13–G13's single failure was likewise a missing helper import (scaffolding). Module-absence failures for F1 (`createProfileCapabilityLifecycleCapabilities` is not a function) are scaffolding-adjacent: the module existed, the factory behavior did not.
  - **TPP overstep (bounded)**: Unit C3's GREEN implemented the whole unknown-decision branch (policy → intent → reject) in one step because the single test asserted both the rejection and the intent-acknowledgement outcomes; Unit F1's GREEN built the complete factory because the test asserted the full additive keyset. Lower-index transformations were used everywhere else as logged.
  - **Size growth**: measured 2,210 adds+dels at anchor `0dbab37` (2,479 at the post-correction anchor `917aa7d`) vs the 1,150–1,350 provisional forecast. The plan states forecasts are not measured implementation and the approved exception has no numeric cap; no evidence was compressed or cut. Largest deltas: the two behavior suites (1,297 lines at `917aa7d` vs 430 forecast — adversarial depth: forged/incomplete/duplicate/unrequested receipts, pending-input mutation, collision refusal, parent/child staleness, void compatibility, ack-only idempotence, atomic failure preservation, plus the correction round's top-level-intent and pin tests) and the lifecycle bridge (262 changed lines vs 106 forecast — whole-receipt verification plus ack-only/migration accounting).
  - **Correction-round honest labels**: G3 (absent/false flag rejects before snapshot), J-1 (wrong-profile receipt atomic reject), and J-3 (supported-pair intent writes nothing) passed immediately after authoring — honest characterizations of already-correct behavior, not fabricated REDs. J-2 needed one test-side message-regex alignment (the concrete-model rejection surfaces the missing-context feedback in that test's empty-resolver setup; the rejection itself was correct). G1's GREEN intentionally broke the two prior bulk tests that encoded the removed per-item contract; they were updated to the approved top-level shape with their forged/incomplete/duplicate semantics unchanged — a contract-driven test update, not a workaround.

## Notes

- Independent canonical review, actual native Windows CI, and publication are OUTSTANDING and are not claimed produced anywhere in this artifact. Native CI execution necessarily follows publication of the exact head.
- P6 owns real public-boundary configuration acceptance and instrumented request proof; P11 owns the tested/unverified matrix. P4 claims neither; source evidence is never relabeled execution.
- The production seed contains exactly one positive record (pinned TEST CATALOG); no production negative is invented; known-unsupported is exercised only via clearly labeled unit negatives.
- No Effect dependency, no new dependencies, `package.json`/`pnpm-lock.yaml` byte-identical to base, no copied executable OpenCode internals, no provider requests, no network in tests, no live-route activation.
- Root `main` worktree state (unstaged `PROJECT-TASKS.md` 161+/1−, 41 untracked paths) was never staged, transferred, or modified; the 29 prunable worktree registrations were preserved (no prune, cause unknown).
- Measurement caveat: component rows are exact at their labeled historical anchors `0dbab37` and `917aa7d`. The additional `88facf1` total and this documentation-closure tree are recorded separately below. Verify final publication with `git diff --shortstat 80e3974..HEAD`; handoff/PR metadata identify the exact SHA. No own-commit SHA is embedded or recursive evidence-only commits required.

## Next Step

Independent canonical review of the new documentation-closure HEAD (exact SHA returned in the handoff), then publication, then actual native Windows CI on the published exact head. No push, PR, review delegation, merge, or P5 advance is performed in this stage.

---

# Supplementary Evidence (preserved contemporaneous logs)

## Isolation and Git Audit (five categories, verified 2026-10-29 before worktree creation)

1. **Branch/tracking/base**: root `main` at `b558aadbef0390c5e9ca833d6b34af1303ffb67a`, tracking `origin/main`, divergence 0/0.
2. **Topology**: 38 registrations after creation base (root + 37): 29 prunable with unknown disappearance cause (preserved, no prune), 9 accessible (root dirty; clean published trees: p2-export-contract, p2-export-plan, p3-resolution-contract, p3-resolution-plan, p4-capability-contract `11c4a2ca`, p4-capability-plan `80e3974d`, p2-export `c5088d1`, p3-resolution `ca4d4f3`). After implementation worktree creation: 39 registrations.
3. **Staged**: empty.
4. **Unstaged**: sole tracked file `openspec/tasks/PROJECT-TASKS.md` (161+/1−) — preserved untouched.
5. **Untracked**: 41 individual paths (`-uall`), exactly the plan's 38 originals + P4 PLAN + historical spec + original task backup. Only the 5-file transfer allowlist was published in PR141/PR142; all 41 root copies remain untouched.

Remote verification: `docs/issue94-p4-capability-contract` = `11c4a2ca702619b6b5d5a7b23400ed7dcf8edfd9` (PR141 head, base `feat/reasoning-effort-p3-resolution` @ `ca4d4f3`); `docs/issue94-p4-capability-plan` = `80e3974d0a290060aca7c0d19a3e85b6f13f8022` (PR142 head, base A `11c4a2ca`); PR140/141/142 all OPEN, unmerged, MERGEABLE. No GitHub owner review inferred.

New isolation: branch `feat/reasoning-effort-p4-capability` created at exact base `80e3974d0a290060aca7c0d19a3e85b6f13f8022`, worktree `/tmp/opencode/afergon-ai-reasoning-effort-p4-capability` (branch/path absence verified before creation; no prune/recreate of old registrations). Dependencies installed with `pnpm install --frozen-lockfile`; `git diff <base> -- package.json pnpm-lock.yaml` = empty (byte-identical manifest/lockfile).

## Fresh Baseline (before any change, this tree)

- `pnpm test` → exit 0: **Test Files 37 passed | 3 skipped (40); Tests 1205 passed | 9 skipped (1214)** (155.24s). Matches the historical P3 numbers; recorded fresh here, not claimed from history.

## TDD Log (contemporaneous)

### Unit A — CapabilityVerdict domain class (`domain/capability-verdict.ts`)

- RED: `supported` factory stub threw `not implemented`; test asserted kind/provenance/feedback → failed for the right reason. `pnpm exec vitest run tests/model-profiles-capability.test.ts --no-file-parallelism` → 1 failed.
- GREEN TPP: #4/#5 (constant→scalar feedback, construct+return). No conditionals until a test forced them.
- Triangulation (each RED→GREEN sequentially):
  1. supported rejects missing/incomplete provenance → forced validating guard (TPP #6 if). RED 1 failed → GREEN 2 passed.
  2. knownUnsupported: null provenance, model-specific feedback required, empty rejected → RED → GREEN 3 passed.
  3. unknown factory + immutability freeze → RED 2 failed → GREEN 5 passed. *(Honesty clarification: two tests were authored in this one cycle — a bounded batch-RED deviation, disclosed under `## Blockers or Deviations`; both failures were behavioral, not scaffold.)*
- REFACTOR: extracted duplicated feedback guard into `requireFeedback` (TPP #11); 5 passed after.
- Exits: all runs exit 0 at green steps; RED steps exit 1 with the expected assertion.

### Unit B — UnknownEffortAcknowledgement + policy (`domain/unknown-effort-acknowledgement.ts`)

- RED B1: `create` stub threw `not implemented`; exact-pair match asserted → 1 failed. GREEN TPP #4/#5 (store + exact equality) → 1 passed.
- Triangulation:
  1. B2 malformed payloads rejected (marker/version/scope/effort/model-shape per scope) → RED → GREEN validating factory (TPP #6) → 2 passed. One test-side regex fix (message is path-specific, behavior was already correct).
  2. B3 scope-exactness (runtime-default matches only exact null model + effort; never a wildcard for concrete models) — honest characterization: passed by construction of exact equality after B2; labeled as characterization, not fabricated RED. *(Authored in the same edit as B4 — bounded mixed authoring, disclosed.)*
  3. B4 `readOwn` absent/owned/foreign classification incl. prototype-carried payload reading as absent → RED (`not implemented`) → GREEN own-key `Object.hasOwn` guard + create-in-try → 4 passed.
  4. B5 `applyTo`: absent writes own property (defineProperty), identical owned → false, stale owned → replaced, foreign → throws preserving payload → RED → GREEN (collision refusal + idempotent equals) → 5 passed (one test-side regex alignment).
  5. B6 `removeFrom`: owned removed, foreign/absent preserved → RED → GREEN → 6 passed.
  6. B7 policy: authorizes only `unknown` verdicts with exact stored match; matching ack never bypasses supported/known-unsupported; stale/absent authorizes nothing → first failure was a missing test import (`ReferenceError`) — **scaffolding, not a behavioral RED** — then the behavioral assertions passed immediately after the import fix → 7 passed. Refusal branches passed immediately after the minimal guard — honest characterizations.
- Step verification: `pnpm typecheck` → exit 0.

### Unit C — Application ports + shared validator (`application/capability-validation-port.ts`, `application/validate-profile-capability-use-case.ts`)

- RED C1: use-case stub threw `not implemented`; supported pair → complete receipt asserted → 1 failed. GREEN TPP #5/#7 (map pairs, plain-data outcome objects) → 6 passed (suite total).
- Triangulation:
  1. C2 no-override outcome without consulting evidence (query-call counter) → RED → GREEN TPP #6 branch → 7 passed.
  2. C3 runtime-default + effort stays unknown (G3); rejects without ack/intent; intent creates exact runtime-default metadata (null model state) → RED → GREEN unknown-decision branch (policy → intent → reject) → 8 passed. *(Bounded TPP overstep: one test asserted both behaviors, so one GREEN built the whole branch — disclosed.)*
  3. C4/C5 stored exact ack authorizes without intent; changed model (G5)/changed effort (G6) invalidate; malformed stored payloads inert → characterization of the C3 branch (passed after message-regex alignment; labeled honestly) → 9 passed.
  4. C6 known-unsupported rejects even with matching ack + intent (G8) — characterization of the throw-first branch → 10 passed.
  5. C7 malformed effort (`""`, whitespace) rejects before acknowledgements apply (G7) → RED → GREEN guard (TPP #6) → 11 passed.
  6. C8/C9 missing context → unknown reject; mismatched context identity (resolver describes a different model) → unknown, never supported → RED → GREEN identity-agreement check → 12 passed (one test-side regex alignment).
  7. C10 pending-input mutation safety (mutating the caller array after invocation) + frozen receipt/outcomes — characterization of the entry snapshot + freeze built in C1 → 13 passed.
- Step verification: `pnpm typecheck` → exit 0 (after typing test stored-ack fixtures); focused suites 20 passed.

### Unit D — Additive lifecycle bridge (`application/profile-lifecycle-use-case.ts`, `domain/profile-resolution.ts`)

- RED D1: `withClearedEffort` kept acknowledgement metadata → 1 failed. GREEN: owned-only removal via `readOwn` (foreign preserved) → 8 passed.
- RED D2: intent save rejected by the strict validator (no bridge) → GREEN: evolved `ValidateAffectedPairs` (optional immutable context, `Promise<void | receipt>`), `CommitMutation.profileName/ackAgentNames`, capture-before-await, whole-receipt verification against actual post-resolution pairs, collision-refusing application, effectiveChanged/migration accounting → 9 passed.
- Triangulation:
  1. D3 unknown without intent rejects before write, state preserved (G10) — characterization of the strict path → 10 passed.
  2. D4 stored ack authorizes switch; unacknowledged switch rejects preserving host state (G11) → 11 passed (test-harness `saved` reset fix).
  3. D5 forged receipt (wrong post-pair identity) rejects the batch without partial apply → 12 passed (test data: `review` is an alias of `afg-review`; switched to distinct canonical agents).
  4. D6 incomplete/duplicate/unrequested receipts reject atomically → 13 passed.
  5. D7 void P3 validators: no acknowledgement effects, existing behavior unchanged → 16 passed (harness storage now updates its observation after persist, mirroring the P3 memory storage). *(Authored as a 3-test batch with D8–D9 — bounded deviation, disclosed.)*
  6. D8 ack-only intent: fresh validation, v1→v2 with ORIGINAL snapshot, identical ack afterwards → no write/no refresh → 16 passed.
  7. D9 ordinary unchanged patches stay P3 no-ops with zero validation calls → 16 passed.
  8. D10 parent (`afergon-ai`) model change revalidates the inheriting child before commit (G12); stale child ack cannot authorize the new pair; explicit intent writes the child's NEW exact pair → exposed a real validator bug: concrete-model pairs with missing context forged runtime-default metadata; fixed to honest resolved-pair acks with null context provenance (matching stays model+effort only) → 32 passed across both suites. *(Authored as a 3-test batch with D11–D12 — bounded deviation, disclosed.)*
  9. D11 foreign payload at the acknowledgement key refuses overwrite, bytes preserved → green.
  10. D12 separate model-ID allowance never authorizes effort (changed effort without ack/intent rejects) → green.
  11. D13 clone preserves metadata; replay still requires the exact resolved pair → green. *(D13–G13 authored as a 4-test batch; the single failure was a missing helper import — scaffolding, disclosed.)*
  12. D14 atomic save failure after acknowledgement application preserves the original observation → green.
  13. D15 known-unsupported through the lifecycle rejects even with matching ack + intent → green.
  14. G13 projection equivalence: pure use-case call and lifecycle save accept/reject identically → green.
- Regression: architecture count guard updated to the new actuals (domain 11, application 13 — planned edit); `pnpm exec vitest run tests/model-profiles-{lifecycle,resolution,architecture,persistence,export}.test.ts --no-file-parallelism` → 663 passed | 1 skipped, exit 0. `pnpm typecheck` → exit 0.

### Unit E — Infrastructure evidence, adapter, report, DATA fixture

- RED E1: adapter stub threw `not implemented`; pinned pair classified supported with scoped provenance → 1 failed. GREEN: materialized the real production seed (pinned 1.18.34/e9f8a210 record with catalog/npm pointers, blob IDs, explicit `resolvedModelIdentity` construction) + exact-tuple classification → 14 passed.
- Triangulation:
  1. E2 transport/provider variance, name resemblance (G9), out-of-menu effort → unknown with "menu absence is not negative evidence" feedback; clearly labeled unit-negative record → known-unsupported mechanism without forging upstream claims; out-of-menu on a negative record still unknown → 16 passed (characterizations of the exact-tuple semantics from E1's GREEN).
  2. E3 report (G14): pin + provenance identified as source evidence; claims executedSchemaAcceptance/providerRequestAcceptance/otherVersionCompatibility all false. (G15): untested version → `unverified`, pin → `source-inspected` → RED → GREEN → 18 passed. *(Authored as a 2-test batch — bounded deviation, disclosed.)*
  3. E4 DATA fixture `tests/fixtures/opencode-pin-catalog/gpt-5.1.json` with full provenance; production seed asserted in exact agreement (pin, blobs, reasoning, effort options, transport, override, npm) and nonempty → 19 passed.
  4. Emitted/source parity: dist cold-import with fs guard (module-read allowlist, mirroring the P3 pattern) — no IO during import; strict validator executes supported + rejection against the emitted adapter → 20 passed (one test-side effort fix: `low` is in the pinned menu; used out-of-menu `extreme` for the rejection probe).

### Unit F — Composition wiring, live-route inactivity, Windows list

- RED F1: `createProfileCapabilityLifecycleCapabilities` absent → GREEN: additive factory injecting exactly ONE strict validator (asserted `lifecycle["validateAffectedPairs"] === capabilityValidator`), returning validator + adapter + report + evidence; original keyset unchanged → 35 passed (composition re-exports added for instanceof assertions). *(Module existed; the missing factory is the behavior under test — classified scaffold-adjacent, disclosed.)*
- G16: new architecture assertion — live routes (`model-profiles.ts`, `models.ts`, `cli-dispatch.ts`, `tui.ts`, TUI adapter/controller) reference neither the capability factory, ports, use case, adapter, `unknownEffortAck`, nor `acknowledgeUnknownEffort` → 36 passed.
- Windows explicit list extended 13→15 (`tests/model-profiles-acknowledgement.test.ts`, `tests/model-profiles-capability.test.ts` appended; nothing removed).
- Step verification: `pnpm typecheck` → exit 0; focused capability+acknowledgement+architecture → 79 passed, exit 0; `pnpm build` → exit 0.

### Unit G — Correction round: top-level bulk acknowledgement intent (`application/profile-lifecycle-use-case.ts`)

- RED G1: misplaced per-item `acknowledgeUnknownEffort` flag silently broadened permission via OR-of-item-flags; test asserted fail-closed rejection with a diagnostic, no write, no snapshot → 1 failed. GREEN: runtime diagnostic rejection only (minimal) → 24 passed. Two prior bulk tests (D5/D6) encoded the removed per-item contract and were updated to the approved top-level shape with unchanged forged/incomplete/duplicate semantics.
- RED G2: top-level `saveAssignments({ acknowledgeUnknownEffort: true })` ignored (flag not yet wired) → unknown rejected; test asserted both unknown affected pairs receipted exactly with per-pair persisted metadata → 1 failed. GREEN: top-level input flag wired, per-item flag removed from `LifecycleAssignmentItem`, OR-of-item-flags and dead `ackAgentNames` field removed, ack-only scope = all item agents (operation-wide) → 25 passed.
- G3 absent/false top-level flag rejects unknown before ANY snapshot commit (v1 document, `snapshots.acquired` empty, no persist) → passed immediately; honest characterization of the commit sequence (validation precedes the snapshot stage), labeled as such → 26 passed.
- Parent/inheriting-children coverage under the operation-wide intent remains the existing D10 test (parent change + intent writes the child's NEW exact pair); unchanged and passing.

### Unit H — Correction round: verdict provenance copy (`domain/capability-verdict.ts`)

- RED H1: the constructor froze the CALLER's provenance object (input side effect); test asserted the caller object stays unfrozen/mutable, the verdict carries an independent frozen copy, and post-factory caller mutation cannot change the verdict → 1 failed. GREEN: `freezeProvenanceCopy` deep-copies the known layout (flat identity fields + nested pin) and the constructor stores the frozen copy → 21 passed (suite total). One intermediate failure (copy frozen but original still assigned) was fixed before green; recorded honestly.

### Unit I — Correction round: validator constants (pure green refactor)

- Replaced the repeated `"afergon-ai.unknown-effort-acknowledgement"` / `ackVersion: 1` literals in the strict validator with the exported `UNKNOWN_EFFORT_ACK_MARKER` / `UNKNOWN_EFFORT_ACK_VERSION` constants. Same behavior; no fake RED — proven by the existing read/matching tests staying green: focused suites 47 passed, exit 0.

### Unit J — Correction round: reviewer behavior pins (sequential, honest labels)

- J-1 receipt naming a different profile rejects atomically (no metadata, no snapshot, no write) → passed immediately; honest characterization (the profile check is the first verification step) → 27 passed.
- J-2 stored runtime-default acknowledgement replay in the pure validator: accepts the exact null model state + effort, never a later concrete model → RED on the assertion message only (the empty-resolver setup surfaces the missing-context feedback; the rejection itself was correct) → aligned to the actual contract message → 22 passed (suite total).
- J-3 acknowledgement intent on an already-SUPPORTED unchanged pair: fresh validation runs, no metadata, no write, no refresh → passed immediately; honest characterization of the supported-outcome/no-ack path → 28 passed.

### Unit K — Correction round: emitted-test stderr check (test-harness only)

- The emitted capability child asserted `stderr === ""`, brittle against incidental Node diagnostics. Simple meaningful fix: non-zero status remains the genuine failure gate and stderr must not carry real error markers (`AssertionError|Error:|Cannot find module`), while incidental warnings no longer fail the check. No production change, no broad harness remediation; P3 emitted tests untouched.

## Gherkin → Test Mapping (16 active scenarios)

| # | Scenario | Proving test(s) |
| --- | --- | --- |
| G1 | Happy path — evidence supports a resolved pair | capability: "classifies the pinned catalog pair as supported with scoped provenance" + emitted strict-validator receipt |
| G2 | Availability is not capability evidence | capability: "never infers capability from transport variance, resemblance, or menu absence" (unknown without a record) |
| G3 | Runtime-default model has explicit effort | capability: "keeps runtime-default pairs unknown and acknowledges only the exact null state" |
| G4 | Exact unknown pair is acknowledged | capability: stored/intent acceptance; acknowledgement: "persists an exact-pair acknowledgement with the assignment in one atomic commit" |
| G5 | Changed model invalidates acknowledgement | capability: "accepts unknown pairs through exact stored acknowledgements…" (changed-model rejection) |
| G6 | Changed effort invalidates acknowledgement | capability: same test (changed-effort rejection) |
| G7 | Malformed effort is rejected | capability: "rejects malformed effort values before any acknowledgement can apply" (+ StoredAssignment guard upstream) |
| G8 | Known unsupported cannot be acknowledged | capability: "rejects known-unsupported pairs even with matching acknowledgement and intent"; acknowledgement lifecycle variant |
| G9 | Model-name resemblance does not establish support | capability: "never infers capability from transport variance, resemblance, or menu absence" |
| G10 | Rejected save preserves state | acknowledgement: "rejects unknown pairs without intent before any write and preserves state" + collision/allowance/failure preservation tests |
| G11 | Rejected switch preserves host state | acknowledgement: "honors stored acknowledgements on switch and preserves host state on rejection" |
| G12 | Parent change revalidates inheriting child | acknowledgement: "revalidates inheriting children on parent change and refuses stale acknowledgements" |
| G13 | Projection validation uses shared semantics | acknowledgement: "gives projection validation the same verdicts as save validation through the shared use case" |
| G14 | Pinned source evidence reported without execution claims | capability: "reports the pinned source evidence without execution claims" |
| G15 | Untested OpenCode version is not claimed compatible | capability: "identifies untested OpenCode versions as unverified…" |
| G16 | Effort controls remain inactive at P4 | architecture: "S13 live entry routes never reach the P4 capability validation surface" (+ existing lifecycle live-route guard) |

## Initial Verification Evidence (historical, before the approved correction round)

The following table preserves the INITIAL P4 result at the byte-identical initial code/test tip `0dbab37`:43 focused and1250 full passes. These are historical, not current figures. The approved correction round and independent review supersede them with50 focused and1257 full passes (see Verification Results above).

| Check | Command | Result |
| --- | --- | --- |
| Focused | `pnpm exec vitest run tests/model-profiles-capability.test.ts tests/model-profiles-acknowledgement.test.ts --no-file-parallelism` | 43 passed, exit 0 |
| Regressions | `pnpm exec vitest run tests/model-profiles-{lifecycle,resolution,architecture,persistence,export}.test.ts --no-file-parallelism` | 665 passed \| 1 skipped, exit 0 |
| Full suite | `pnpm test` (builds first) | **1250 passed \| 9 skipped (1259)**, 39 files passed \| 3 skipped (42), exit 0 (164.92s) |
| Typecheck | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Runtime health | `pnpm run health:runtime` | passed, no remote telemetry, exit 0 |
| Runtime doctor | `pnpm run doctor:runtime` | no recorded failures, exit 0 |

Historical initial delta:1205→1250 added45 passing tests and2 passed test files. The CURRENT code/test result is1257 passed/9 skipped,39 passed files/3 skipped (42); complete P4 delta is **+52 passing tests and +2 passed test files**, with the skip set unchanged. No correction-round test file was added.

Boundary evidence:
- `git diff <base> -- package.json pnpm-lock.yaml` → empty (byte-identical manifest/lockfile).
- No `effect` dependency in package.json; no `effect` imports anywhere under `scripts/` or `tests/`.
- Fixture DATA carries commit/blob/JSON-pointer provenance; production seed asserted in exact agreement with the fixture.
- Emitted/source parity: dist cold-import with fs guard (module-read allowlist) — no IO during import; strict validator executes against the emitted adapter.
- Live-route inactivity (G16) asserted for the capability surface; existing P3 live-route guard untouched and passing.
- No network or provider credentials used; all tests offline by construction.

## Measured Size (supplementary; exact at named anchors, vs base B `80e3974d0a290060aca7c0d19a3e85b6f13f8022`)

Named historical anchors: `0dbab37c01b308ef0e4f07374042699ca3a75ee4` (initial implementation), `917aa7d642721a5f0973471fb8574b20461e19d2` (final code/test content), and `88facf1dc6ec756175d8d51a3cc80ea7638c77da` (prior documentation tip). The component table covers the first two, not later closure sizes. Cells are additions/deletions; a single number means additions with zero deletions. The two final rows after the table distinguish the prior report from this correction's publication tree.

| Component | @`0dbab37` | @`917aa7d` |
| --- | ---: | ---: |
| `tests/model-profiles-acknowledgement.test.ts` | 695 | 818 |
| `tests/model-profiles-capability.test.ts` | 431 | 479 |
| `application/profile-lifecycle-use-case.ts` (bridge) | 245/12 | 249/13 |
| `openspec/results/.../RESULT.md` | 186 | 262 |
| `domain/unknown-effort-acknowledgement.ts` | 137 | 137 |
| `application/validate-profile-capability-use-case.ts` | 105 | 105 |
| `infrastructure/opencode-capability-evidence.ts` | 59 | 59 |
| `domain/capability-verdict.ts` | 52 | 68 |
| `application/capability-validation-port.ts` | 48 | 48 |
| `infrastructure/opencode-capability-adapter.ts` | 47 | 47 |
| `tests/model-profiles-architecture.test.ts` | 39/2 | 39/2 |
| `tests/fixtures/opencode-pin-catalog/gpt-5.1.json` | 36 | 36 |
| `infrastructure/opencode-compatibility-report.ts` | 35 | 35 |
| `infrastructure/profile-composition.ts` | 29 | 29 |
| `scripts/lib/model-profiles/README.md` | 15/0 | 15/0 |
| `openspec/plans/.../PLAN.md` | 14/14 | 15/14 |
| `domain/profile-resolution.ts` | 5 | 5 |
| `.github/workflows/windows-launcher.yml` (13→15) | 2 | 2 |
| emitted-test module-read allowlists (lifecycle, resolution) | 2 | 2 |
| **Total (`git diff --shortstat`)** | **2182/28 = 2210** | **2450/29 = 2479** |

Historical totals: `917aa7d` =2450 additions/29 deletions,2479 combined; planning513, whole2992. Prior documentation tip `88facf1` = **2481 additions/29 deletions,2510 combined across20 files**; planning **513**, whole **3023**. Both totals are exact at their named anchors, not the new publication tip.

Current documentation-closure tree total, measured against base B before commit and rechecked after this same-line numeric update: **20 files,2485 additions/29 deletions =2514 implementation changed lines; plus513 planning =3027 whole-change lines**. The final commit contains this exact tree; its SHA is reported in handoff/PR metadata, not embedded here. Source and tests are unchanged.

Honest growth report: the historical code/test anchor2479 and prior report2510 already exceeded the1,150–1,350 forecast; this final correction adds only documentation. The approved P4 exception has no numeric cap and no evidence was cut. Largest deltas remain the two suites1297lines versus430 forecast and lifecycle bridge262changed lines versus106 forecast. Current measured totals are distinguished above; no estimate or historical anchor is mislabeled final.

## Known Limits and Outstanding Gates

- Independent review, actual native Windows CI on the exact published head, and publication are OUTSTANDING — not claimed here. The Windows list extension (13→15) is produced; native execution evidence belongs to the external gate and necessarily follows publication.
- P6 owns real public-boundary configuration acceptance and instrumented request proof; P11 owns the tested/unverified matrix. P4 claims neither.
- The production seed covers exactly one positive record (pinned TEST CATALOG); no production negative is invented.
- The 29 prunable worktree registrations were preserved untouched (cause unknown, no prune).
- Root `main` worktree state (unstaged PROJECT-TASKS.md, 41 untracked paths) was never staged, transferred, or modified.
