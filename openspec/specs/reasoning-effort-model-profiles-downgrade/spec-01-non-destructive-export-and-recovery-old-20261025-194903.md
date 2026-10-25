# Spec: Non-destructive model-only export and downgrade recovery

- **Source Task**: 002-reasoning-effort-model-profiles-downgrade.md
- **State**: ready

## Scope

Define the directly callable internal export/recovery behavior and guidance. Explicit export writes legacy-readable model-only assignments to a separate destination while preserving extended source and full backup. Excludes CLI exposure, old-writer safety, host cleanup implementation, live routing, and host changes. The semantic implementation unit, including tests, docs, and artifacts, MUST remain strictly below 400 changed lines and independently safe in P1→P2→P3 stacked order.

## Requirements

- Export MUST be explicitly invoked and target a destination distinct from source and full backup. It MUST preserve model values and inheritance, omit effort with an explicit loss warning, and never imply legacy writers preserve extended state.
- Export MUST use current data, including post-migration edits; leave source and backup intact; and reject existing destinations without modifying any copy.
- Export MUST report failures; incomplete output MUST NOT be presented as success. Guidance MUST distinguish current export from pre-migration snapshot restoration, which loses later edits.
- Downgrade guidance MUST require new-binary owned-effort cleanup before an old registrar runs and warn old registrars may lose manual host options. It MUST identify task 006 callable cleanup and task 008 live routing as future integration, without claiming it is released or producing host effects.
- Existing entrypoints MUST retain legacy behavior. Withdrawal MUST preserve saved extended copies and remove dependent integration first.

## Acceptance Criteria

```gherkin
Feature: Prepare a non-destructive model-only downgrade export

  Scenario: Happy path - export current profiles while retaining extended state
    Given extended profiles contain edits newer than the pre-migration snapshot
    And the destination is separate and does not exist
    When the internal export API is explicitly invoked
    Then the destination contains legacy-readable model-only assignments with equivalent model inheritance
    And effort is omitted with a warning that it cannot be represented
    And the current source and full backup remain unchanged

  Scenario: Edge case - preserve inheritance in legacy output
    Given an assignment inherits its model and has explicit effort
    When it is exported to a separate destination
    Then model inheritance is retained and no effort value is present

  Scenario: Failure case - reject destination collision
    Given the requested destination already exists
    When export is attempted
    Then export reports a collision without overwriting destination, source, or backup

  Scenario: Failure case - destination write fails
    Given the destination cannot be written completely
    When export is attempted
    Then export reports failure and no successful export is reported
    And the extended source and backup remain unchanged

  Scenario: Edge case - distinguish current export from snapshot recovery
    Given current data differs from the pre-migration snapshot
    When recovery guidance is presented
    Then it distinguishes current model-only export from snapshot restoration
    And warns snapshot restoration loses subsequent edits

  Scenario: Failure case - cleanup has not preceded downgrade
    Given owned projected effort has not been cleaned up by the new binary
    When downgrade guidance is consulted before an old registrar runs
    Then guidance states cleanup is a prerequisite and export does not perform it
    And warns the old registrar may lose manual host options
```

## Technical Dependencies

- Task 001: extended profile storage and retained pre-migration snapshot.
- Task 006: callable owned-host effort cleanup required before old registrar execution; outside this implementation.
- Task 008: future live routing integration; not released by this spec.

## Unresolved Questions

None. Task Open Decisions is None.
