# Spec: Evidence for mandatory practices

- **Source Task**: 001-resolve-ai-operating-base-governance.md
- **State**: ready

## Scope

This spec records the evidence required before an agent practice is treated as mandatory. It includes context-appropriate tests and review, optional multi-tool validation, and installer parity. It excludes implementing tests, reviews, installer changes, or compatibility backlog items in this session.

## Requirements

- A proposed mandatory practice MUST have tests and review evidence when each is applicable to the changed artifact or behavior.
- Evidence MUST be appropriate to the artifact; Markdown-only changes require review and MUST NOT require pointless unit tests.
- Multi-tool validation MAY supplement, but MUST NOT replace, applicable tests and review.
- Installer changes MUST preserve POSIX and PowerShell parity.
- An installer change without parity MAY proceed only when the temporary incompatibility is clearly documented and a backlog item records the missing platform work.
- The governance record MUST distinguish evidence that was produced, evidence that was inapplicable, and evidence that remains outstanding.

## Acceptance Criteria

```gherkin
Feature: Evidence threshold for mandatory agent practices

  Scenario: Happy path - Applicable tests and review support a mandatory practice
    Given a proposed mandatory practice changes testable behavior
    And the change is reviewable
    When evidence for promotion is evaluated
    Then passing relevant tests and a completed review are both required

  Scenario: Edge case - The proposed practice changes only Markdown
    Given a proposed mandatory practice changes only Markdown documentation
    When evidence for promotion is evaluated
    Then completed review is required
    And unit tests are recorded as not applicable

  Scenario: Edge case - Multi-tool validation is available
    Given applicable tests and review evidence already exist
    When the practice is exercised through multiple supported tools
    Then the multi-tool results may be recorded as supplementary evidence

  Scenario: Edge case - Installer parity is temporarily unavailable
    Given an installer change supports only POSIX or only PowerShell
    When the change is evaluated for acceptance
    Then the unsupported platform is documented as a temporary incompatibility
    And a backlog item identifies the missing parity work

  Scenario: Failure case - Applicable evidence is missing
    Given a proposed mandatory practice lacks an applicable test result or completed review
    When promotion is attempted
    Then the practice is not recorded as mandatory

  Scenario: Failure case - Installer incompatibility is undocumented
    Given an installer change lacks POSIX and PowerShell parity
    And no temporary incompatibility and backlog item are documented
    When acceptance is attempted
    Then the installer change is rejected
```

## Technical Dependencies

- None
