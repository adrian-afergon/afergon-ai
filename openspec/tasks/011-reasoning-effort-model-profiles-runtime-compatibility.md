# Task: Diagnose runtime compatibility and prove supported propagation

- **Task Number**: 011
- **Slug**: reasoning-effort-model-profiles-runtime-compatibility
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Version diagnostics and instrumented runtime evidence jointly establish an honest support boundary for the completed vertical feature.

## Intent

Expose compatibility diagnostics backed by pinned unpaid runtime evidence rather than presenting projection as a universal runtime guarantee.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), compatibility/precedence and final verification; P11. OpenCode 1.18.34 at e9f8a210b9e2b1e13d375b84906069886eb3b767 is the initial test pin, not proof of all-version support. This is a diagnostic/support behavior unit with its tests/docs, not a deferred tests-only slice.

## In Scope

- User-visible compatibility diagnostic for unverified runtime versions, connected to an evidence-backed tested-version matrix.
- Reuse 006's pinned schema and primary/delegated propagation proof to verify the additive diagnostic's tested-version matrix without paid provider requests.
- Runtime precedence, JSON/frontmatter collision evidence, and final support/recovery guidance consistent with earlier delivered docs.

## Out of Scope

- Paid requests, universal provider/version guarantees, blanket translation to provider budgets, and deferring earlier units' tests/docs here.

## Capability Areas

Runtime compatibility diagnostics and supported behavior evidence.

## Dependencies

- **Requires**: 010
- **Enables**: None

## Acceptance Criteria

- [ ] Unverified runtime versions yield an actionable compatibility diagnostic rather than a universal support claim; the tested matrix identifies pin and evidence provenance.
- [ ] OpenCode 1.18.34 fixture accepts emitted JSON; unpaid instrumented requests prove primary and explicit child effort, including child with/without model and inherited variants.
- [ ] Evidence demonstrates model defaults → configured model options → agent options → selected variant → chat.params plugin precedence and documents project/session overrides.
- [ ] Top-level/nested effort and JSON/frontmatter collision fixtures establish the chosen authoritative projection behavior; no parent-option inheritance is assumed for delegates.
- [ ] Released guidance accurately covers tested versions/provider limits, variant/plugin precedence, reload, migration/downgrade, ownership/reset, and saved-but-not-projected retry, linking earlier unit guidance rather than replacing their tests.
- [ ] Focused compatibility tests accompany the diagnostic; complete-chain acceptance records actual focused/full tests, typecheck/build/runtime health, native platform CI, and standard review results.
- [ ] The diagnostic is an additive implemented capability with its own tests/docs; earlier merged behavior already has required propagation/parity evidence and needs no repair or activation here.
- [ ] This PR meets ordinary issue/approval/check/label and strict sub-400 gates in PROJECT-TASKS.md, independently of earlier merged PRs; final feature review does not introduce a cumulative publication PR.

## Open Decisions

None.

## Parallelization

Specify runtime cases early alongside 004 and 006; final diagnostic/integrated acceptance follows 010 and all transitive prerequisites.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/`. P11 in Stacked PRs to main; forecast 250–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: complete evidenced profile/editor/platform behavior; end: additive compatibility diagnostic; follow-on: final feature acceptance/review. Rollback withdraws the diagnostic and its claims without reverting unrelated working behavior. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates and data-preserving suffix rollback are in PROJECT-TASKS.md.
