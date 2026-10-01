# Spec: Compatible per-agent effort profile storage

- **Source Task**: `001-reasoning-effort-model-profiles-persistence.md`
- **State**: ready

## Scope

Defines directly callable profile persistence for legacy model-string and structured assignments, strict validation, targeted data preservation, migration recovery, clone independence, and the inactive P1 boundary. Excludes downgrade export (002), resolution/lifecycle (003), capability validation, host projection, CLI/TUI editing, and live host activation.

## Requirements

- Profile storage MUST round-trip legacy string assignments unchanged alongside structured assignments; reads MUST NOT migrate schema or convert strings.
- A structured assignment MAY omit `model` to retain existing model inheritance. `reasoningEffort` MUST be explicit when present; omission means no override, while null, empty string, and `inherit` are invalid.
- Malformed recognized assignment fields MUST fail with an error identifying the offending profile/agent field path; parsing MUST NOT silently discard them.
- Targeted profile updates MUST preserve unrelated and unknown user fields, including fields nested beside recognized data.
- First persistence of extended assignment data MUST use a newer schema version and create a recoverable pre-migration snapshot before replacing profile data. Validation, snapshot, or atomic-save failure MUST leave original persisted data intact and prevent downstream projection.
- Cloning MUST preserve assignment metadata while keeping the clone independent from later source or clone mutations.
- P1 MUST expose directly testable storage capability without routing live CLI, TUI, install, update, or refresh workflows through extended writes or changing host output. Focused tests and migration/old-writer limitation documentation MUST accompany the capability.
- Each implementation delivery MUST remain independently safe in dependency order and strictly below 400 changed lines, counting additions and deletions across implementation, tests, documentation, and artifacts; tests/docs MUST remain with their behavior unit.

## Acceptance Criteria

```gherkin
Feature: Compatible and recoverable model profile persistence

  Scenario: Happy path - Mixed assignments round-trip without read migration
    Given a profile contains legacy model strings and valid structured assignments, including one without a model
    When the profile is loaded and saved without extended-data changes
    Then legacy strings and structured values retain their representations and values
    And the schema version and migration snapshot remain unchanged

  Scenario: Edge case - Omitted effort means no override
    Given a structured assignment contains an optional model but omits reasoningEffort
    When the assignment is loaded
    Then it remains valid and exposes no effort override

  Scenario: Edge case - Targeted edits retain foreign metadata
    Given a profile contains unknown top-level and nested user fields beside valid assignments
    When one recognized assignment is updated and persisted
    Then every untouched unknown field retains its original value

  Scenario: Edge case - First extended write is recoverable
    Given valid legacy profile data with no migration snapshot
    When a structured assignment with explicit effort is first persisted
    Then the newer schema version is persisted only after a recoverable pre-migration snapshot exists

  Scenario: Failure case - Invalid recognized effort is rejected with its path
    Given a structured assignment has null, empty, or inherit as reasoningEffort
    When the profile is read or validated for persistence
    Then the operation fails with the offending profile and agent field path
    And no malformed recognized value is silently discarded

  Scenario: Failure case - Malformed recognized assignment is not normalized away
    Given a recognized assignment contains a malformed model or reasoningEffort field
    When the profile is loaded
    Then loading fails with the offending field path and does not return a silently reduced assignment

  Scenario: Failure case - Snapshot or atomic save failure preserves source data
    Given an extended write requires migration and snapshot creation or atomic replacement fails
    When persistence is attempted
    Then the original profile data remains intact and no downstream projection occurs

  Scenario: Failure case - Live workflows remain on legacy behavior
    Given the P1 storage capability is present but later activation work is incomplete
    When a user runs existing CLI, TUI, installation, update, or refresh workflows
    Then none creates extended assignment state and host output remains unchanged
```

## Technical Dependencies

- None; this is P1 and the task declares `Dependencies.Requires: None`. Tasks 002 and 003 depend on this capability and are not prerequisites.

## Unresolved Questions

None. The task and canonical debate resolve the technical choices; no open decisions remain.
