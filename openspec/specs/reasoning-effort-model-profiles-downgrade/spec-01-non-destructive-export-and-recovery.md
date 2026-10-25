# Spec: Non-destructive model-only export, current backup, and recovery guidance

- **Source Task**: 002-reasoning-effort-model-profiles-downgrade.md
- **State**: ready

## Scope

Define a callable internal model-only export, an additional complete CURRENT extended-state backup, and recovery guidance. The active source, old pre-migration snapshot, current backup, and legacy export are distinct. Preserve existing files and newer edits. Excludes CLI/TUI exposure, automatic/callable restore, old-writer safety, host cleanup implementation, live routing, and host changes. The unit remains independently safe in P1→P2→P3 stacked order.

Human-approved amendments: additional current backup; fresh P2-only cohesive size exception above400 without a new numeric ceiling; and functional closure2026-10-25 confirming export+backup+guidance, source refusal instead of defaults, and explicit unrepresentable-metadata loss. The old<400 constraint is superseded;775–900 is a forecast only. Do not cut tests/docs/evidence. Exact prior spec is preserved in `spec-01-non-destructive-export-and-recovery-old-20261025-194903.md`; that file is historical provenance, not a second active specification.

No multi-file atomicity, compare-and-swap, or directory-fsync guarantee is promised. Backup-first sequencing is a proposed implementation detail; the contract requires honest success/failure reporting. Existing P1 PRs remain unmodified for asynchronous human review. Implementation still requires a separate Plan→Implement approval.

## Requirements

- Export MUST be explicitly invoked and target a destination distinct from the source, current backup, and pre-migration snapshot. It MUST preserve exact model values and inheritance, omit effort and other assignment metadata unrepresentable by legacy strings with an explicit loss warning, and never imply legacy writers preserve extended state.
- Each successful invocation MUST produce a complete backup of the captured CURRENT extended source, including post-migration edits, as raw bytes retaining all data. It MUST leave the source, pre-migration snapshot (if present), and existing files unchanged and reject existing output destinations.
- Export MUST refuse absent, unreadable/corrupt, or unsupported-future sources instead of exporting defaults; no backup or export output is created on those refusals.
- Success MUST be reported only after BOTH current backup and model-only export complete. Failures MUST identify completed outputs, including a surviving complete current backup if export subsequently fails; incomplete output MUST NOT be presented as success.
- Recovery MUST be guidance only, with no automatic/callable restore API. Guidance MUST distinguish current export, current full-backup recovery, and pre-migration snapshot restoration; restoring the snapshot loses later edits.
- Downgrade guidance MUST require new-binary owned-effort cleanup before an old registrar runs and warn old registrars may lose manual host options. It MUST identify task 006 callable cleanup and task 008 live routing as future integration, without claiming it is released or producing host effects.
- Existing entrypoints MUST retain legacy behavior. Withdrawal MUST preserve saved extended copies and remove dependent integration first.

## Acceptance Criteria

```gherkin
Feature: Prepare a non-destructive model-only downgrade export

  Scenario: Happy path - export current profiles while retaining extended state
    Given extended profiles contain edits newer than the pre-migration snapshot
    And export and current-backup destinations are separate and do not exist
    When the internal export API is explicitly invoked
    Then the destination contains legacy-readable model-only assignments with equivalent model inheritance
    And effort is omitted with a warning that it cannot be represented
    And a complete raw backup preserves the current extended state including newer edits
    And success is reported only after both outputs are complete
    And the source and pre-migration snapshot remain unchanged

  Scenario: Edge case - preserve inheritance in legacy output
    Given an assignment inherits its model and has explicit effort
    When it is exported to a separate destination
    Then model inheritance is retained and no effort value is present

  Scenario: Failure case - reject destination collision
    Given the requested destination already exists
    When export is attempted
    Then export reports a collision without overwriting destination, source, snapshot, or any backup

  Scenario: Failure case - reject current-backup destination collision
    Given the requested current-backup destination already exists
    When export is attempted
    Then a collision is reported without overwriting any existing file
    And no successful export is reported

  Scenario: Failure case - destination write fails
    Given the current backup has completed
    And the export destination cannot be written completely
    When export is attempted
    Then export reports failure and no successful export is reported
    And the surviving complete current backup is identified
    And the extended source and pre-migration snapshot remain unchanged

  Scenario: Failure case - current backup cannot complete
    Given the current-backup destination cannot be written completely
    When export is attempted
    Then failure is reported and no success is reported
    And the source and pre-migration snapshot remain unchanged

  Scenario Outline: Failure case - refuse unavailable or invalid source
    Given the extended source is <condition>
    When export is attempted
    Then export is refused with a diagnostic for the source failure
    And no defaults are substituted and no output is created

    Examples:
      | condition                     |
      | absent                        |
      | unreadable                    |
      | corrupt                       |
      | an unsupported future version |

  Scenario: Edge case - warn about unrepresentable assignment metadata
    Given current assignments include effort and other metadata unrepresentable by legacy strings
    When export completes
    Then output retains exact model values and inheritance but omits that metadata
    And an explicit loss warning describes the omitted metadata
    And original source and raw current backup retain all data

  Scenario: Edge case - distinguish current export from snapshot recovery
    Given current data differs from the pre-migration snapshot
    When recovery guidance is presented
    Then it distinguishes current model-only export from snapshot restoration
    And explains the separate current full backup retains newer edits
    And warns snapshot restoration loses subsequent edits

  Scenario: Failure case - cleanup has not preceded downgrade
    Given owned projected effort has not been cleaned up by the new binary
    When downgrade guidance is consulted before an old registrar runs
    Then guidance states cleanup is a prerequisite and export does not perform it
    And warns the old registrar may lose manual host options

  Scenario: Edge case - recovery is guidance only
    Given the export unit is available
    When its callable surface is inspected
    Then export and backup are available without an automatic or callable restore operation
```

## Technical Dependencies

- Task 001: extended profile storage and retained pre-migration snapshot.
- Task 006: callable owned-host effort cleanup required before old registrar execution; outside this implementation.
- Task 008: future live routing integration; not released by this spec.

## Unresolved Questions

None. Task Open Decisions is None; the human confirmed the functional contract2026-10-25. Success, edge, and failure cases are covered; docs-only guidance requires content review, not Markdown string-match unit tests.
