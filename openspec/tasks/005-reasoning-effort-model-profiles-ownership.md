# Task: Reconcile owned effort with recoverable receipts

- **Task Number**: 005
- **Slug**: reasoning-effort-model-profiles-ownership
- **Spec Breadth Hint**: medium
- **Spec Breadth Rationale**: Field ownership, restoration, concurrent edits, and interrupted writes are inseparable parts of one non-destructive reconciliation capability; Plan must recheck its high size risk.

## Intent

Make effort ownership recoverable so refresh/reset never silently overwrites user edits or loses displaced values.

## Context

Source: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), ownership/recovery; P5. This delivers reusable reconciliation behavior with real receipt persistence and failure tests; 006 applies it to the complete managed host document.

## In Scope

- Versioned receipts outside agent schema, keyed by host path, agent, and exact field path, retaining prior value/absence and last projection.
- First-set ownership, reset/restoration, external-edit conflict, and explicit-reapply renewal.
- Recoverable write-ahead previous/desired state and compare-before-write coordination with atomic host replacement.

## Out of Scope

- Full managed-agent writer/manifest integration, installer activation, automatic manual-effort import, or user-owned variant/nested option ownership.

## Capability Areas

Owned field reconciliation and recovery.

## Dependencies

- **Requires**: 004
- **Enables**: 006

## Acceptance Criteria

- [ ] Matching a value without a receipt never proves ownership; no override/no receipt leaves manual effort untouched.
- [ ] First set records displaced value/absence; reset restores it only when the field still equals the recorded projection.
- [ ] External edits are preserved and reported as degraded conflict; explicit reapplication can renew ownership without ordinary refresh silently overwriting them.
- [ ] Top-level ownership leaves nested options.reasoningEffort and variants user-owned; repeated reconciliation is idempotent.
- [ ] Interrupted writes on either side of host replacement and concurrent edits have deterministic recovery; uncertain state preserves user data and reports repair guidance.
- [ ] Focused receipt/reconciliation/crash tests and ownership guidance accompany this behavior.
- [ ] The executable isolated service persists real receipts in controlled fixtures; existing live entrypoints never invoke it or write new host/receipt state before P8 activation.

## Open Decisions

None.

## Parallelization

Specify/plan with 006 to align receipt and host-replacement outcomes; keep independent semantic review boundaries.

## Notes

Spec target: `openspec/specs/reasoning-effort-model-profiles-ownership/`. P5 in Stacked PRs to main; forecast 280–350 lines including implementation/tests/docs, with initial planning artifacts budgeted separately. Start: validated desired effort; end: complete isolated ownership/recovery capability; next: P6. Rollback retains receipts/backups and removes dependent writer consumers first, preserving restoration evidence. Every PR is independently safe in order and strictly <400 additions + deletions; per-PR gates are in PROJECT-TASKS.md.
