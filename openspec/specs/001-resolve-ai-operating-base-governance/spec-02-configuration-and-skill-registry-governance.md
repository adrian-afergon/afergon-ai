# Spec: Configuration and skill-registry governance

- **Source Task**: 001-resolve-ai-operating-base-governance.md
- **State**: ready

## Scope

This spec records the approved governance of `openspec/config.yaml` and `.atl/skill-registry.md`, including per-session skill discovery. It excludes creating the configuration, changing the registry, or injecting skills in this session.

## Requirements

- The governance record MUST direct a future task to create `openspec/config.yaml` rather than retain an unconfigured memory mode.
- `.atl/skill-registry.md` MUST be the canonical repository index for resolving applicable skills.
- Every work session MUST review the canonical registry before task work and update or refresh it when newly added applicable skills are not represented.
- Applicable skills MUST be loaded from the exact `SKILL.md` paths resolved from the canonical registry.
- Missing, unreadable, or inconsistent configuration or registry state MUST be reported explicitly and MUST NOT be represented as successfully configured or injected.
- Creation or modification of either governed file remains outside this task.

## Acceptance Criteria

```gherkin
Feature: Configuration and canonical skill discovery

  Scenario: Happy path - Session resolves current applicable skills
    Given .atl/skill-registry.md is present and current at session start
    When an agent reviews it before task work
    Then the agent loads each applicable skill from the exact registered SKILL.md path
    And reports which registered skills were selected

  Scenario: Edge case - A newly added applicable skill is absent from the registry
    Given a session review detects an applicable repository skill that is not represented in .atl/skill-registry.md
    When skill resolution is performed
    Then the registry is refreshed or updated before that skill is treated as injected
    And the session uses the resulting canonical path

  Scenario: Failure case - Canonical registry cannot be used
    Given .atl/skill-registry.md is missing, unreadable, or maps an applicable skill to an unreadable path
    When an agent attempts skill resolution
    Then the agent reports the unresolved registry state
    And does not claim that the affected skill was injected

  Scenario: Happy path - Memory configuration direction is explicit
    Given the approved governance record is reviewed
    When its initialization decision is inspected
    Then it directs a future task to create openspec/config.yaml
    And it does not describe absent configuration as an intentional permanent mode
```

## Technical Dependencies

- None
