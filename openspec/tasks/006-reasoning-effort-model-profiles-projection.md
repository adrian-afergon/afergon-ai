# Task: Project managed JSON without destroying user state

- **Task Number**: 006
- **Slug**: reasoning-effort-model-profiles-projection
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Callable projection combines validation, ownership, permissions, and pinned propagation proof at one host-document boundary; Plan must recheck its high integration budget risk.

## Intent

Produce authoritative managed OpenCode JSON from validated profile intent while preserving unrelated configuration and recoverable effort ownership.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), projection authority and lifecycle; P6. Uses 005's reconciliation and supplies 002's callable host-side cleanup. Live routing waits for 008; runtime evidence required to trust this service belongs here, before activation.

## In Scope

- Complete callable platform-neutral TypeScript projection service with shell-independent domain/application behavior; replacement of live duplicated registrar routing belongs to 008.
- Direct agent reasoningEffort and JSON-only generated profile authority; preservation of manifest-owned permissions and unrelated user fields.
- Clear/switch/empty/null/active-final-delete reconciliation across previously owned agents; downgrade preparation cleanup.
- Strict corrupt-host/source failure and model-only host seeding with manual effort reported as unmanaged.
- Pinned schema and unpaid primary/delegated request evidence for emitted JSON, nested/top-level effort and variant precedence.

## Out of Scope

- POSIX/Windows launcher activation, UI editing, general registrar cleanup, or changed nonmanaged-name conflict policy.

## Capability Areas

Managed host projection.

## Dependencies

- **Requires**: 002, 005
- **Enables**: 007

## Acceptance Criteria

- [ ] Shared projection emits direct top-level effort per requested agent; Markdown contains no competing generated profile model/effort values.
- [ ] Unrelated agent fields, nested options, variants, providers, and nonmanaged entries survive; authoritative managed permissions remain correct and existing name-conflict handling is retained.
- [ ] Clear, effort-free/empty switch, valid null, and active/final deletion reconcile previously owned effort, restoring displaced state without changing legacy null/empty model semantics.
- [ ] Missing/corrupt source, invalid host JSON, invalid managed-entry shape, or capability failure preserves host data and surfaces actionable failure rather than rebuilding blank config.
- [ ] First set, repeat refresh, external edit, and both top-level/nested collision cases use 005's ownership; actual host-write failure/recovery integration is verified here.
- [ ] Downgrade preparation removes/restores owned effort with the new binary before old registration; seeding remains model-only and identifies host effort as unmanaged.
- [ ] Projection integration tests and reset/ownership guidance ship in this unit.
- [ ] OpenCode 1.18.34 fixtures accept emitted JSON; instrumented unpaid primary/delegated requests prove explicit effort propagation, children with/without a model, inherited variants, nested/top-level precedence and JSON/frontmatter authority before activation.
- [ ] Direct invocation is complete and tested against isolated hosts; existing CLI/TUI/install/update entrypoints retain legacy routing/output until P8, including absent-effort behavior.

## Open Decisions

None.

## Parallelization

Specify/plan with 005 and define runtime evidence with 011 early. Specify 007/008 together, retaining the 006 → 007 → 008 capability/activation dependency.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-projection/`. P6 in Stacked PRs to main; forecast 280–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: validation, receipts and export; end: complete callable projection with pinned propagation proof; next: P7. No live launcher activation. Rollback removes dependent platform consumers first and retains receipts/backups. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
