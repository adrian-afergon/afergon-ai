# Spec: Document OpenCode as the sole supported host

- **Source Task**: 003-remove-pi-host-integration.md
- **State**: ready

## Scope

Update active README and detect-skills guidance so they no longer present Pi as a supported configuration or package host. Retain documentation for the standalone TUI, OpenCode workflow, skills package content, model identifiers, and historical artifacts. Historical OpenSpec evidence is excluded from active-documentation cleanup.

## Requirements

- Active README guidance must describe OpenCode as the only initialization and update target, document `init` and `init --opencode`, and not advertise Pi installation, Pi package use, `init --pi`, or `init --all`.
- Active detect-skills guidance must describe skill installation and availability without claiming Pi discovery, Pi configuration, or Pi as a supported tool.
- Active documentation must preserve standalone-TUI launch/fallback guidance, OpenCode command/workflow guidance, and model identifiers.
- Documentation contract tests must distinguish prohibited active Pi-host claims from permitted historical OpenSpec references and permitted `@earendil-works/pi-tui` dependency naming.

## Acceptance Criteria

```gherkin
Feature: Active guidance supports OpenCode without advertising Pi host integration

  Scenario: Happy path - setup guidance directs users to OpenCode
    Given a user reads the active installation and initialization documentation
    When the user follows the documented host setup path
    Then the documentation directs the user to `init` or `init --opencode` for OpenCode setup
    And it does not direct the user to install or configure Pi as an afergon-ai host

  Scenario: Edge case - permitted Pi text is retained outside active host guidance
    Given historical OpenSpec evidence, model identifiers, or the standalone TUI dependency contains "pi"
    When active Pi host guidance is removed
    Then the permitted text remains unchanged

  Scenario: Failure case - documentation validation detects an active Pi-host claim
    Given active README or detect-skills guidance advertises Pi package installation, Pi host configuration, or Pi host discovery
    When the documentation contract check runs
    Then the check fails and identifies the active prohibited claim
```

## Technical Dependencies

- Phase 1 branch `chore/opencode-only-01-remove-claude-host` at commit `968aab6`
