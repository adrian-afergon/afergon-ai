# Spec: Retain the standalone TUI with OpenCode-only host state

- **Source Task**: 003-remove-pi-host-integration.md
- **State**: ready

## Scope

Remove Pi from TUI Configuration and Status state and replace host selection with a direct OpenCode initialization action. Preserve the standalone TUI, its direct `@earendil-works/pi-tui` use, interactive navigation, branding, and narrow-width fallback behavior.

## Requirements

- Configuration and Status must report managed OpenCode state without listing Pi installation state or Pi repair guidance, even when a user-owned `.pi` directory exists.
- The TUI initialization action must execute the stable `afergon-ai init` command directly and must not present Pi, OpenCode, or all host checkboxes.
- The TUI must remain startable in an interactive terminal, allow Configuration and Status navigation, and retain text-first status markers and safe plain-text branding fallback.
- Non-interactive `tui` invocation must remain a non-zero, guidance-only rejection and must not start the interactive UI.

## Acceptance Criteria

```gherkin
Feature: Standalone TUI exposes only OpenCode host management

  Scenario: Happy path - Configuration initializes OpenCode without host selection
    Given the TUI is running in an interactive terminal for a project without a managed OpenCode install
    When the user runs the Configuration initialization action and confirms it
    Then the action invokes `afergon-ai init` directly
    And the action does not display a host-selection form

  Scenario: Edge case - user-owned Pi state is not reported as a managed host
    Given the project contains a user-owned `.pi` directory and no managed OpenCode installation
    When the user opens Configuration or Status
    Then the screen reports only the OpenCode installation state and OpenCode repair guidance
    And no Pi status item or Pi initialization option is displayed

  Scenario: Edge case - narrow interactive terminal renders text fallback branding
    Given the standalone TUI is running in an interactive terminal too narrow for the full banner
    When the Home screen renders
    Then it displays the plain-text AFERGON-AI branding fallback and text-first navigation cues

  Scenario: Failure case - non-interactive TUI launch is rejected without rendering the UI
    Given afergon-ai is invoked without an interactive terminal
    When the user runs `afergon-ai tui`
    Then the command exits non-zero with interactive-terminal guidance
    And no interactive TUI session starts
```

## Technical Dependencies

- Phase 1 branch `chore/opencode-only-01-remove-claude-host` at commit `968aab6`- `@earendil-works/pi-tui` retained as the standalone TUI runtime dependency

