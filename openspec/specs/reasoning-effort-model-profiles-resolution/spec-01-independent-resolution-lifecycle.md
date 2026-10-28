# Spec: Independent Model and Effort Resolution Lifecycle

- **Source Task**: 003-reasoning-effort-model-profiles-resolution.md
- **State**: ready

## Scope

Defines isolated profile-domain resolution and lifecycle desired-state operations: assignments, model-only and combined edits, child impact, clear, clone/save, switch, and deletion. It excludes capability validation (004), host projection/reconciliation (005/006), UI commands, and live host activation. P3 MUST remain directly callable but inactive; live entrypoints MUST retain legacy routing/output and MUST NOT reach effort-dependent behavior before P8. Implementation forecast: 620–857 changed lines under a fresh P3-only cohesive size exception (human owner approval 2026-10-28): the complete unit is authorized above 400 additions plus deletions with no tests/docs/evidence cuts; the forecast is a planning estimate, not a numeric cap; the exception is not inherited from P2; all other budgets are unchanged. This size exception does not authorize implementation, commits, publication, or merges. This spec does not authorize live host activation.

## Requirements

- The domain MUST resolve configured and profile-resolved model and effort independently, each with its own source. Legacy model strings MUST retain existing model-resolution semantics and mean no effort override.
- Effort MUST remain local to an agent. An inherited or unset child model MAY have explicit effort; a parent/main-agent effort MUST NOT flow to children. The domain MUST identify every pair affected by a parent-model edit for downstream validation in 004.
- Model-only edits MUST preserve effort and inheritance. A combined model/effort assignment MUST be one operation. Rejected edits MUST leave saved profile state unchanged.
- Clearing effort MUST leave model assignment unchanged and remove only that agent's effort override. Missing, unreadable, malformed, corrupt, or dangling source state MUST be surfaced and MUST NOT be interpreted as intentional reset. Valid `activeProfile: null` means no active profile and is distinct from a dangling reference.
- Clone and save MUST preserve assignment metadata and existing atomicity guarantees; clones MUST be independent. Switch and deletion MUST express complete desired state, including stale-effort cleanup intent for agents absent from a selected or now-empty profile. Inactive-profile edits/deletion MUST NOT request host refresh. Existing profile-selection policy on deletion MUST remain unchanged.
- Empty and effort-free profiles MUST be valid. Effort omission means no Afergon override, not disabled reasoning. Empty/null/malformed effort values MUST NOT be accepted as aliases for omission.

## Acceptance Criteria

```gherkin
Feature: Independent model and effort profile lifecycle

  Scenario: Happy path - shared model retains agent-local effort
    Given two agents resolve to the same model and each has a distinct explicit effort
    When their profile assignments are resolved
    Then each agent resolves its own effort and source independently

  Scenario: Edge case - inherited child model has explicit local effort
    Given a child has no model override and has explicit effort
    When the profile is resolved
    Then the child inherits its model and resolves only its own effort

  Scenario: Edge case - parent effort does not flow to child
    Given the main agent has explicit effort and a child has no effort override
    When the profile is resolved
    Then the child has no effort override

  Scenario: Happy path - model-only edit preserves effort
    Given an assignment has explicit effort and an inherited model
    When its model is changed without specifying effort
    Then effort remains unchanged and model follows existing inheritance rules

  Scenario: Happy path - combined assignment is atomic
    Given an assignment has a saved model and effort
    When a combined model-and-effort edit passes required validation
    Then both values are saved together as one assignment operation

  Scenario: Failure case - rejected edit leaves saved assignment unchanged
    Given a parent-model edit changes resolved models for affected agents
    And downstream validation rejects at least one affected model/effort pair
    When the edit is attempted
    Then the profile remains unchanged and all affected pairs are identified

  Scenario: Edge case - clear effort preserves model
    Given an agent has an explicit model and effort
    When its effort is cleared
    Then the model assignment is unchanged and the agent has no effort override

  Scenario: Happy path - clone and save preserve independent assignments
    Given a profile contains legacy and structured assignments with distinct efforts
    When it is cloned and the clone is saved
    Then assignments round-trip and later clone edits do not change the source

  Scenario: Failure case - failed atomic save preserves prior profile
    Given a profile has saved assignment data
    When saving a lifecycle mutation fails
    Then the prior saved profile remains intact and the failure is surfaced

  Scenario: Happy path - switch to empty profile requests complete cleanup intent
    Given the current profile has effort assignments and the selected profile is empty
    When the selected profile becomes active
    Then desired state has no effort overrides and accounts for every previously assigned agent

  Scenario: Edge case - valid null active profile is intentional empty state
    Given activeProfile is explicitly null
    When active desired state is resolved
    Then it is reported as no active profile with no effort overrides

  Scenario: Failure case - dangling active profile is not reset
    Given activeProfile names a profile that does not exist
    When active desired state is resolved
    Then resolution reports an invalid source and does not produce intentional empty state

  Scenario: Edge case - inactive profile deletion does not refresh host
    Given the profile being deleted is not active
    When deletion succeeds
    Then active selection is unchanged and no host refresh is requested

  Scenario: Happy path - active or final deletion exposes cleanup intent
    Given the active profile or final profile is deleted
    When deletion applies the existing profile-selection policy
    Then desired state identifies selected assignments or explicit no-active-profile cleanup

  Scenario: Failure case - unreadable or malformed source is not reset intent
    Given the profile source is unreadable, corrupt, or has malformed recognized assignment data
    When resolution or lifecycle mutation is attempted
    Then a visible error or degraded result is returned and no reset state is inferred

  Scenario: Edge case - absent effort remains no override
    Given an assignment omits reasoning effort
    When it is resolved
    Then effort is reported as no override, not disabled reasoning

  Scenario: Failure case - invalid effort aliases are rejected
    Given an assignment specifies null, an empty string, or inherit as effort
    When it is resolved or saved
    Then malformed effort is reported and is not treated as omission
```

## Technical Dependencies

- `spec-01-compatible-profile-storage.md` (task 001) defines the assignment contract consumed here: legacy strings remain unchanged; structured assignments may omit `model`; `reasoningEffort` is optional, with omission meaning no override and null/empty/`inherit` invalid; recognized malformed data fails with a field path. It also provides independent clone and atomic persistence guarantees. This specification adds resolution and lifecycle behavior without changing those storage semantics.
- Task 004 consumes the affected model/effort pairs for capability validation. Host reconciliation is outside this spec and belongs to 005/006. The 001 contract is a planning/specification dependency; implementation completion is not a prerequisite to specifying or planning this dependency chain.
