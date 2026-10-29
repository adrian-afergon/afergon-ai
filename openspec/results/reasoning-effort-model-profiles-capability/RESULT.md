# Result: P4 Isolated capability validation and pair-bound acknowledgements

## Implementation Status

completed-with-notes

All plan checkboxes that could be produced locally are produced; the full local verification battery passes at the source/test tip. Independent canonical review, actual native Windows CI, and publication are OUTSTANDING external gates — none is claimed as produced here.

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-capability/PLAN.md` (ready-with-assumptions, 226 lines at base B)
- Spec: `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md` (ready, 117 lines, 16 Gherkin scenarios)
- Execution Mode: sequential, strict TDD/TPP, new isolation
- Base: `80e3974d0a290060aca7c0d19a3e85b6f13f8022` (accepted unit-B artifact head, PR142)
- Branch/worktree: `feat/reasoning-effort-p4-capability` at `/tmp/opencode/afergon-ai-reasoning-effort-p4-capability`

## Execution Summary

P4 delivered the inactive capability-validation vertical over reviewed P3: two domain classes (`CapabilityVerdict`; `UnknownEffortAcknowledgement` + `UnknownEffortAcknowledgementPolicy`), application ports plus one strict shared validator (`ValidateProfileCapabilityUseCase`), an additive lifecycle bridge (capture-before-await, whole-receipt verification against the candidate's actual post-resolution pairs, collision-refusing acknowledgement application, ack-only intent with fresh validation and idempotent no-write, ORIGINAL-source snapshot before v2, exactly one atomic commit, P3 void-callback compatibility), the pinned OpenCode 1.18.34 evidence seed with exact-tuple adapter and source-evidence compatibility report, an immutable DATA fixture, an additive composition factory injecting exactly one strict validator, two new behavior suites (43 tests), the Windows list extension 13→15, live-route inactivity assertions, limitations guidance in the vertical README, and this RESULT. All 16 active Gherkin scenarios are mapped to passing tests. No Effect, no new dependencies, manifest/lockfile byte-identical to base, no copied executable upstream code, no OpenCode/provider execution, no network, no live CLI/TUI/install/update activation.

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

## Updated Plan Artifacts

- `openspec/plans/reasoning-effort-model-profiles-capability/PLAN.md` — Implementation Steps 1–9 and Acceptance Criteria 1–5 marked produced; step 10 / criterion 6 left unchecked pending external gates.
- `openspec/results/reasoning-effort-model-profiles-capability/RESULT.md` — this artifact.

## Commits Created

All seven known predecessors on `feat/reasoning-effort-p4-capability`, full SHAs from `git log`:

1. `519ba0e7e198796ec2d620fe1fb4f6b7a68697fa` — feat(model-profiles): add capability verdict and pair-bound acknowledgement domain classes
2. `658a306317fa9a867b3b2e07a1e7f1a6f7d497b7` — feat(model-profiles): add shared capability validation port and strict validator use case
3. `1c9696c1d6d68ab1a97b96cef4c04159165eb46f` — feat(model-profiles): bridge capability validation into the lifecycle with pair-bound acknowledgements
4. `1bedb2554b9554ac1050b265de2e2fdd1a114e79` — feat(model-profiles): add pinned evidence adapter, compatibility report, and capability composition
5. `ee1846ce37e8ce922379536d2e19ef3a923bf441` — docs(model-profiles): record P4 capability limitations guidance and implementation result
6. `d2577920eb6362911d358ad6c52af7babe622f7f` — docs(models): mark produced P4 plan steps and acceptance criteria
7. `0dbab37c01b308ef0e4f07374042699ca3a75ee4` — docs(model-profiles): record final measured P4 implementation size and closure commits

The final documentation-closure commit (this docs-only contract fix) is the branch HEAD at handoff time; its exact SHA is returned in the implementation handoff and is deliberately NOT embedded self-referentially here. No amend, no force, no history rewrite.

## Files Changed

20 files vs base B at anchor `0dbab37` (authoritative per-file table in `## Measured Size` supplementary section): 2 new domain modules, 2 new application modules, 3 new infrastructure modules, additive edits to `profile-lifecycle-use-case.ts` / `profile-resolution.ts` / `profile-composition.ts`, 2 new test suites, 1 new DATA fixture, updates to `model-profiles-architecture.test.ts` / `model-profiles-lifecycle.test.ts` / `model-profiles-resolution.test.ts`, `.github/workflows/windows-launcher.yml`, `scripts/lib/model-profiles/README.md`, PLAN.md, RESULT.md. Source, tests, package.json and pnpm-lock.yaml remain byte-identical to `0dbab37` in this docs-only closure (verified with `git diff --quiet` before handoff).

## Verification Results

- Step-level checks: passed — focused suites 43 passed (exit 0); P3 regression set 665 passed | 1 skipped (exit 0); per-unit RED/GREEN exits recorded contemporaneously in the supplementary TDD Log.
- Final checks at the source/test tip (content of anchor `0dbab37`; these are verified source anchors, NOT re-claimed as fresh runs of the docs-only closure commit):
  - Tests: passed — full `pnpm test` → **1250 passed | 9 skipped (1259)**, 39 files passed | 3 skipped (42), exit 0 (baseline before changes in this tree: 1205 passed | 9 skipped, 37 files → +45 tests, +2 files).
  - Build: passed — `pnpm build` exit 0; `pnpm typecheck` exit 0.
  - Additional Evidence: passed — `pnpm run health:runtime` (no remote telemetry), `pnpm run doctor:runtime` (no recorded failures), emitted/source parity cold-import with fs guard, saver-hash and two-callers guards intact, manifest/lockfile diff vs base empty, no `effect` references.
- Docs-only closure commit: tests/build **not applicable** (no source/test/manifest bytes change — proven by `git diff --quiet 0dbab37..HEAD -- scripts tests package.json pnpm-lock.yaml`); diff check and content review apply and are the applicable evidence for this commit.

## Blockers or Deviations

- No blocking blockers. Bounded deviations, disclosed exactly (history preserved, nothing erased, no tests changed or recreated):
  - **Batch RED authoring** (more than one failing test authored in one cycle, contrary to the one-behavior-at-a-time rule): Unit A triangulation 3 (2 tests: unknown factory + immutability); Unit B B3+B4 (characterization + RED in one edit); Unit D D7–D9 (3 tests), D10–D12 (3 tests), D13–G13 (4 tests, one failing for a scaffold reason); Unit E E3 (2 tests). Each batch still went GREEN before the next batch was authored.
  - **Scaffold-vs-behavioral RED classification**: Unit B B7's first failure was a missing test import (`ReferenceError`) — scaffolding, not a behavioral RED; the behavioral assertions passed immediately after the import fix. Unit D D13–G13's single failure was likewise a missing helper import (scaffolding). Module-absence failures for F1 (`createProfileCapabilityLifecycleCapabilities` is not a function) are scaffolding-adjacent: the module existed, the factory behavior did not.
  - **TPP overstep (bounded)**: Unit C3's GREEN implemented the whole unknown-decision branch (policy → intent → reject) in one step because the single test asserted both the rejection and the intent-acknowledgement outcomes; Unit F1's GREEN built the complete factory because the test asserted the full additive keyset. Lower-index transformations were used everywhere else as logged.
  - **Size growth**: measured 2,210 adds+dels at anchor `0dbab37` vs the 1,150–1,350 provisional forecast. The plan states forecasts are not measured implementation and the approved exception has no numeric cap; no evidence was compressed or cut. Largest deltas: the two behavior suites (1,126 lines vs 430 forecast — adversarial depth: forged/incomplete/duplicate/unrequested receipts, pending-input mutation, collision refusal, parent/child staleness, void compatibility, ack-only idempotence, atomic failure preservation) and the lifecycle bridge (257 changed lines vs 106 forecast — whole-receipt verification plus ack-only/migration accounting).

## Notes

- Independent canonical review, actual native Windows CI, and publication are OUTSTANDING and are not claimed produced anywhere in this artifact. Native CI execution necessarily follows publication of the exact head.
- P6 owns real public-boundary configuration acceptance and instrumented request proof; P11 owns the tested/unverified matrix. P4 claims neither; source evidence is never relabeled execution.
- The production seed contains exactly one positive record (pinned TEST CATALOG); no production negative is invented; known-unsupported is exercised only via clearly labeled unit negatives.
- No Effect dependency, no new dependencies, `package.json`/`pnpm-lock.yaml` byte-identical to base, no copied executable OpenCode internals, no provider requests, no network in tests, no live-route activation.
- Root `main` worktree state (unstaged `PROJECT-TASKS.md` 161+/1−, 41 untracked paths) was never staged, transferred, or modified; the 29 prunable worktree registrations were preserved (no prune, cause unknown).
- Measurement caveat: per-component rows in the supplementary size table are exact at the named anchor `0dbab37`; the authoritative totals for any later documentation-closure tip are the reproducible `git diff --shortstat <base>..<tip>` returned in the handoff, not recursive self-measuring commits.

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

## Verification Evidence (supplementary detail)

All commands run in the implementation worktree; exits recorded contemporaneously.

| Check | Command | Result |
| --- | --- | --- |
| Focused | `pnpm exec vitest run tests/model-profiles-capability.test.ts tests/model-profiles-acknowledgement.test.ts --no-file-parallelism` | 43 passed, exit 0 |
| Regressions | `pnpm exec vitest run tests/model-profiles-{lifecycle,resolution,architecture,persistence,export}.test.ts --no-file-parallelism` | 665 passed \| 1 skipped, exit 0 |
| Full suite | `pnpm test` (builds first) | **1250 passed \| 9 skipped (1259)**, 39 files passed \| 3 skipped (42), exit 0 (164.92s) |
| Typecheck | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Runtime health | `pnpm run health:runtime` | passed, no remote telemetry, exit 0 |
| Runtime doctor | `pnpm run doctor:runtime` | no recorded failures, exit 0 |

Baseline before changes in this tree: 1205 passed \| 9 skipped (1214), 37 files — so P4 adds **+45 passing tests and +2 test files** with the skip set unchanged.

Boundary evidence:
- `git diff <base> -- package.json pnpm-lock.yaml` → empty (byte-identical manifest/lockfile).
- No `effect` dependency in package.json; no `effect` imports anywhere under `scripts/` or `tests/`.
- Fixture DATA carries commit/blob/JSON-pointer provenance; production seed asserted in exact agreement with the fixture.
- Emitted/source parity: dist cold-import with fs guard (module-read allowlist) — no IO during import; strict validator executes against the emitted adapter.
- Live-route inactivity (G16) asserted for the capability surface; existing P3 live-route guard untouched and passing.
- No network or provider credentials used; all tests offline by construction.

## Measured Size (supplementary; exact at named anchor `0dbab37c01b308ef0e4f07374042699ca3a75ee4`, vs base B `80e3974d0a290060aca7c0d19a3e85b6f13f8022`)

| Component | Adds | Dels |
| --- | ---: | ---: |
| `tests/model-profiles-acknowledgement.test.ts` | 695 | 0 |
| `tests/model-profiles-capability.test.ts` | 431 | 0 |
| `application/profile-lifecycle-use-case.ts` (bridge) | 245 | 12 |
| `openspec/results/.../RESULT.md` (this file, at the named anchor) | 186 | 0 |
| `domain/unknown-effort-acknowledgement.ts` | 137 | 0 |
| `application/validate-profile-capability-use-case.ts` | 105 | 0 |
| `infrastructure/opencode-capability-evidence.ts` | 59 | 0 |
| `domain/capability-verdict.ts` | 52 | 0 |
| `application/capability-validation-port.ts` | 48 | 0 |
| `infrastructure/opencode-capability-adapter.ts` | 47 | 0 |
| `tests/model-profiles-architecture.test.ts` | 39 | 2 |
| `tests/fixtures/opencode-pin-catalog/gpt-5.1.json` | 36 | 0 |
| `infrastructure/opencode-compatibility-report.ts` | 35 | 0 |
| `infrastructure/profile-composition.ts` | 29 | 0 |
| `scripts/lib/model-profiles/README.md` | 15 | 0 |
| `openspec/plans/.../PLAN.md` (checkbox updates) | 14 | 14 |
| `domain/profile-resolution.ts` | 5 | 0 |
| `.github/workflows/windows-launcher.yml` (13→15) | 2 | 0 |
| emitted-test module-read allowlists (lifecycle, resolution) | 2 | 0 |
| **Total at named anchor `0dbab37` (20 files, `git diff --shortstat`)** | **2182** | **28** |

Authoritative totals: implementation at the named code/test tip `0dbab37` = **2182 adds + 28 dels = 2210**; initial planning publication reported separately = 287 (unit A, PR141) + 226 (unit B, PR142) = **513**; planning + implementation combined = **2723**. The docs-only contract-fix closure tip is measured reproducibly via `git diff --shortstat <base>..<HEAD>` in the handoff (no recursive fix commits, no self-embedded SHA). Component rows are exact at the named anchor and are historical anchors — they are not re-measured per later docs commit and do not substitute for the diff short-stat.

Honest growth report: the measured implementation total (2,210 adds+dels) exceeds the 1,150–1,350 provisional forecast. The plan explicitly states forecasts are not measured implementation, the size exception has no numeric cap, and no evidence was compressed or cut to approach the forecast. The largest deltas are the two behavior suites (1,126 lines vs 430 forecast — the adversarial triangulation depth the plan requires) and the lifecycle bridge (257 changed lines vs 106 forecast — whole-receipt verification against actual post-resolution pairs plus ack-only/migration accounting).

## Known Limits and Outstanding Gates

- Independent review, actual native Windows CI on the exact published head, and publication are OUTSTANDING — not claimed here. The Windows list extension (13→15) is produced; native execution evidence belongs to the external gate and necessarily follows publication.
- P6 owns real public-boundary configuration acceptance and instrumented request proof; P11 owns the tested/unverified matrix. P4 claims neither.
- The production seed covers exactly one positive record (pinned TEST CATALOG); no production negative is invented.
- The 29 prunable worktree registrations were preserved untouched (cause unknown, no prune).
- Root `main` worktree state (unstaged PROJECT-TASKS.md, 41 untracked paths) was never staged, transferred, or modified.
