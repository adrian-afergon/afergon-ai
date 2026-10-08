# Plan05: Class-owned agent identity and stored-key targeting

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; first corrected capability.

## Summary

Deliver a pure concrete `AgentTargetPolicy` that classifies supported aliases and selects the actual stored assignment key. Deliberately migrate only legacy alias ownership; keep the legacy exported API as a delegation facade. This is callable behavior, not interface scaffolding.

## Planning Scope

Supported list/map/normalization errors and exact/sole/ambiguous/canonical targeting. No assignment mutation, filesystem, profile-name normalization, provider checks, live activation or broader core migration. [ARCHITECTURE-PLAN-INDEX](ARCHITECTURE-PLAN-INDEX.md) governs correction authority, all five Git categories, preservation, delivery fork and common evidence.

## Design Rule Alignment

- Proposed owner: `scripts/lib/model-profiles/domain/agent-target-policy.ts`; concrete class, no normalization port or interface-per-class.
- Domain owns the supported names/type/map and pure normalization policy, importing no legacy core/app/infra/Node.
- Legacy `model-profiles-core.ts` reexports the same supported constant/type and retains `normalizeAgentName(input)` as delegation with identical errors. Its unrelated behavior stays untouched.
- Preserve own-key lookup and exact original stored spelling; validation errors must not be caught as unsupported-name classification.

## Assumptions

Local reversible assumption: readable named-case tables reuse existing normalization fixtures without losing assertions; remeasure source/tests/results each checkpoint. No test/evidence cap. The replacement base is explicitly approved, not assumed.

## Design Tensions

None

## Vertical Slicing Decision

Alias ownership and targeting are one complete deterministic policy used by validation and preparation. No fs port is relevant. Extracting first makes06/08 domain imports legal and permits direct parity evidence before migration of other behavior.

## Execution Strategy

Approved replacement chain: separately authorized reviewed docs rooted at PR104 → 📍05 →06→07→08→09→10→11→12→13, Stacked PRs to main. Future branch/worktree p1-class-05 uses the exact index naming/collision/disposition contract after renewed Implement gate. Today reuse D only for planning; transfer/stage none, old closed-PR branches read-only. Reinspect all five categories before execution.

Future owned: domain policy, narrow core alias exports/body, initial vertical tsconfig include, new direct targeting/parity cases, README, correction/S05/RESULT.md and corrective deltas. Revised source/config110–145/tests55–90/docs4–6/result55–65/artifacts8–12 =232–318 changed lines; extraction deletions/facades/include count. [TEST-ALLOCATION](TEST-ALLOCATION.md) assigns **0 original218 cases here**: B06/B12 stay at08 because their candidate/path assertions cannot be replaced by target-only tests. Tests here are additional class/parity evidence, not duplicate old-case credit. Prefer350/STOP375/hard399; ranges are local reversible reuse forecasts, not caps.

## Implementation Steps

- [x] Characterize all legacy supported aliases, whitespace/case and exact unsupported errors; preserve supported-array order and exported type.
- [x] Introduce class-owned normalization with the same policy; retain legacy compatibility exports/delegation, not duplicate divergent maps.
- [x] Implement actual stored-key selection with sequential behavioral cycles and own-key safety.
- [x] Verify legacy parity/inward imports/no I/O and produce owned tests/docs/result/review budget before06.

## Interfaces and Technical Contracts

`AgentTargetPolicy.normalize(input: unknown): SupportedAgent`; `select(profile: Record<string, unknown>, requested: string): string`. Constructor has no ambient dependencies. It normalizes comparisons only, never keys in source.

Selection prioritizes exact supplied own key; else sole canonical-equivalent supported key; else canonical key. Two equivalent keys without exact match fail “Ambiguous assignment aliases”. Unsupported requested agent fails even for empty patch; unsupported existing slots are opaque. Selection returns the stored key for subsequent original-path errors. The policy does not materialize profile maps or mutate source/prototypes.

No new utility classes for path formatting or plain-object checks are required. Keep such pure implementation-local helpers within the owning behavior module. No algorithm implementation is prescribed by this plan.

## Acceptance Criteria

- [x] All old aliases/canonical names/error messages and order are unchanged through legacy facade and new class.
- [x] Exact duplicate priority, sole alias spelling, canonical new key, ambiguity and unsupported requests have behavioral evidence.
- [x] Own/prototype-like keys cannot become inherited targets; source untouched; domain import graph has no legacy dependencies.
- [x] Complete callable policy, tests/docs/result and measured budget/review travel together; no source activation.

## Verification

New seam initial RED: supplied exact key must win among equivalent aliases. T1 introduced after GREEN: no exact key with two aliases refuses. T2 after its GREEN: sole padded/case-varied stored alias returns its actual spelling/path. Additional canonical-new/unsupported/inherited-key cases enter individually. Existing normalizer parity is passing characterization, not fabricated RED.

Future single-name/focal/regression/build/health/emitted/full-suite commands are exactly those in the index; run owned cases with `-t "<exact single test name>"`. Architecture evidence inspects resolved domain imports and constructor behavior, not names alone. Follow strict lowest-index TPP and two sequential adversaries or documented inability; all Implement result headings/exact cycles required. Source/test fixture transfer must be individually charged, not wholesale779/906 lines.

Prefix emitted evidence is `node --input-type=module -e "import('./dist/scripts/lib/model-profiles/domain/agent-target-policy.js')"`; initial explicit include ships here. Original profile-store import becomes applicable from07 and remains required at final acceptance;05 cannot claim a not-yet-delivered reader emitted successfully.

Produced: user-approved Implement gate,41 owned tests,132 legacy regressions, full425 passed/8 skipped, typecheck/build/health/emitted policy and measured all-layer budget; see correction/S05/RESULT.md under the original results slug. Not applicable: future reader import and installer parity. Outstanding: independent parent source Review and source CI/native acceptance.

## Open Questions

None

## Dependencies

Published PR116 exact7dc6628 is the approved source base; explicit user Plan→Implement approval covers05–13. This execution is05 only.06 waits for independent source Review and05 source CI; P2/P3 await13/full P1 acceptance.

## Risks and Watchouts

Extraction touches legacy exports and can pollute a new source PR with deletions; count both sides. Do not trim stored values or normalize unsupported slots. Reusing correct normalizer code cannot supply new RED without a real missing seam behavior. Do not rewrite core's model/profile/refresh policies.

## Completion Condition

Plan is ready-with-assumptions: no open questions/tensions, approved basis, local reversible fixture estimates only. Publication and implementation gates remain separate pending dependencies. Execution completes with callable policy/legacy parity, tests/docs/result, native checks/review and measured≤399; all old closed-source records remain preserved.
