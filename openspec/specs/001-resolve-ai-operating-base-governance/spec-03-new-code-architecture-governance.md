# Spec: New-code architecture governance

- **Source Task**: 001-resolve-ai-operating-base-governance.md
- **State**: ready

## Scope

This spec records architecture rules for newly created or deliberately migrated code. It includes vertical organization, dependency direction, interface and class criteria, composition, and validation Value Objects. It excludes migrating or remediating legacy code in this session.

## Requirements

- New or deliberately migrated code MUST be organized by vertical, with domain, application, and infrastructure boundaries inside the relevant vertical.
- Dependencies MUST point inward: infrastructure may depend on application and domain, application may depend on domain, and domain MUST NOT depend on application or infrastructure.
- Interfaces MUST be used for data structures, ports, and use-case parameters rather than prohibited or introduced indiscriminately.
- Classes MUST encapsulate domain behavior when no useful alternate implementation exists; inheritance MUST NOT be the default reuse mechanism.
- Composition MUST be preferred over inheritance.
- A validation Value Object MUST expose a static factory and use a private constructor that only assigns already validated values.
- Validation logic MUST NOT execute in a Value Object constructor.
- Existing legacy code MUST remain eligible for gradual migration, and no architecture remediation is authorized in this session.

## Acceptance Criteria

```gherkin
Feature: Architecture rules for new and migrated code

  Scenario: Happy path - New behavior follows an inward-dependent vertical
    Given new behavior belongs to one product vertical
    When its domain, application, and infrastructure responsibilities are defined
    Then each responsibility is located within that vertical
    And dependencies point from infrastructure through application toward domain

  Scenario: Edge case - Domain behavior has no useful alternate implementation
    Given domain behavior must preserve invariants and has no useful alternate implementation
    When its representation is selected
    Then a class may encapsulate that behavior without requiring an interface for the class itself

  Scenario: Edge case - A boundary requires a structural contract
    Given a data structure, port, or use-case parameter needs an explicit contract
    When the boundary is specified
    Then an interface represents that contract

  Scenario: Edge case - A validation Value Object is created from valid input
    Given input satisfies all rules of a validation Value Object
    When its static factory is called
    Then the factory returns an instance whose private constructor only assigns the validated value

  Scenario: Failure case - An outer dependency enters the domain
    Given proposed code makes the domain depend on application or infrastructure
    When the architecture is reviewed
    Then the proposal is rejected until the outward dependency is removed

  Scenario: Failure case - A constructor performs validation
    Given a proposed validation Value Object validates input inside its constructor
    When the Value Object is reviewed
    Then the proposal is rejected until validation is moved to its static factory

  Scenario: Failure case - Governance is used to require immediate legacy migration
    Given existing legacy code has not been deliberately selected for migration
    When this governance rule is invoked to require its remediation in the current session
    Then that remediation is rejected as out of scope
```

## Technical Dependencies

- None
