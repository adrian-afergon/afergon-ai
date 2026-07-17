# Spec: Root operating-contract authority

- **Source Task**: 001-resolve-ai-operating-base-governance.md
- **State**: ready

## Scope

This spec records the approved responsibility and precedence boundaries for a future concise root `AGENTS.md`. It includes the relationship between repository rules and Afergon-AI, installed agents, skills, and tool adapters. It excludes creating or modifying `AGENTS.md`, those contracts, or application code in this session.

## Requirements

- The governance record MUST authorize a concise root `AGENTS.md` as the primary contract for repository operation, artifact storage, design, and technology rules.
- The root contract MUST defer workflow definition to Afergon-AI and MUST NOT repeat its phase or orchestration instructions.
- Installed agents, skills, and tool adapters MUST remain authoritative for their more-specific execution concerns, while the root contract remains authoritative for repository-wide operation, storage, design, and technology constraints.
- A contract conflict that cannot be resolved by those responsibility boundaries MUST be exposed to the user rather than silently choosing or rewriting a contract.
- The governance decision MUST authorize only the future operating contract; creating `AGENTS.md` remains outside this task.

## Acceptance Criteria

```gherkin
Feature: Root operating-contract authority

  Scenario: Happy path - Repository and workflow responsibilities are complementary
    Given an approved governance record for the future root operating contract
    When its authority boundaries are reviewed
    Then it identifies AGENTS.md as primary for repository operation, storage, design, and technology rules
    And it identifies Afergon-AI as the workflow authority without repeating that workflow

  Scenario: Edge case - A specialized contract adds tool-specific behavior
    Given a tool adapter or registered skill defines behavior only for its specialized execution scope
    When that behavior is evaluated with the future root contract
    Then the specialized contract governs that scope while repository-wide AGENTS.md constraints remain in force

  Scenario: Failure case - Contracts claim incompatible authority over the same concern
    Given two applicable contracts prescribe incompatible outcomes for the same concern
    And their documented responsibility boundaries do not resolve the conflict
    When an agent attempts to continue
    Then the conflict is reported to the user before the agent applies either outcome
```

## Technical Dependencies

- None
