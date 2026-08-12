# Spec: Retire Claude Code host configuration

- **Source Task**: `002-remove-claude-code-host.md`
- **State**: `ready`

## Scope

Retire Claude Code from afergon-ai's active host configuration surfaces. This covers POSIX and PowerShell init and update, CLI help, TUI configuration/status, the Claude adapter, and active README guidance. Pi, the standalone TUI, and OpenCode remain supported. Do not delete, modify, or otherwise migrate pre-existing user-owned `CLAUDE.md` or `.claude/` files/directories. Historical OpenSpec records and model identifiers such as `anthropic/claude-opus` are excluded.

## Requirements

- POSIX and PowerShell `init` must expose only Pi, OpenCode, and all as configurable hosts; `all` must mean Pi plus OpenCode.
- Both init script surfaces must reject `--claude` with a non-zero exit and an actionable message that tells the user the flag is retired.
- `--pi`, `--opencode`, and `--all` must retain their respective Pi/OpenCode initialization behavior without creating Claude artifacts.
- POSIX and PowerShell `update` must continue to refresh detected Pi and OpenCode installs and must not read, write, copy, or delete `CLAUDE.md` or `.claude/skills/`.
- CLI help, TUI Configuration and Status items, and the TUI initialization form must not list Claude as a configurable host. The TUI itself and its remaining host choices must remain available.
- Remove the Claude adapter artifact and remove active README guidance that documents Claude Code as a supported configuration host.
- Add or update focused tests for retired flag rejection, remaining init argvs, TUI state, and Windows script parity.
- Validate the slice with `typecheck`, `build`, runtime health, and the complete test suite.

## Acceptance Criteria

```gherkin
Feature: Retire Claude Code as a configurable host

  Scenario: Happy path - all initializes Pi and OpenCode only
    Given a project without an afergon-ai installation
    When the user runs `init --all`
    Then Pi and OpenCode are configured
    And no `CLAUDE.md` or `.claude/skills/` artifact is created

  Scenario: Happy path - update refreshes remaining hosts without touching Claude files
    Given a project with detected afergon-ai Pi and OpenCode installations
    And the project also contains user-owned `CLAUDE.md` and `.claude/skills/` content
    When the user runs `update`
    Then the detected Pi and OpenCode installations are refreshed
    And the user-owned `CLAUDE.md` and `.claude/skills/` content remains unchanged

  Scenario: Happy path - the active interface offers only remaining hosts
    Given a user views the CLI help or opens the TUI Configuration, status, and initialization choices
    When the active host options are rendered
    Then only Pi, OpenCode, and all are listed as configurable host options
    And the TUI remains usable for Configuration and Status actions

  Scenario: Edge case - combined remaining host flags preserve user Claude files
    Given a project that already contains user-owned `CLAUDE.md` and `.claude/skills/` content
    When the user runs `init --pi --opencode`
    Then Pi and OpenCode are configured as requested
    And the existing Claude files and directories remain unchanged

  Scenario: Edge case - the Claude adapter is not shipped
    Given the package source and produced package contents
    When the active host adapters are inspected
    Then no Claude Code adapter artifact is present
    And Pi and OpenCode package surfaces remain present

  Scenario: Failure case - POSIX init rejects the retired Claude flag
    Given a project directory
    When the user runs `init --claude` through the POSIX script surface
    Then the command exits non-zero
    And its error message states that `--claude` is retired and directs the user to supported options

  Scenario: Failure case - PowerShell init rejects the retired Claude flag
    Given a project directory
    When the user runs `init --claude` through the PowerShell script surface
    Then the command exits non-zero
    And its error message states that `--claude` is retired and directs the user to supported options

  Scenario: Failure case - removed Claude guidance cannot be invoked
    Given the active CLI and README guidance
    When a user searches for Claude Code as a supported configuration host
    Then no such active host guidance is present
```

## Technical Dependencies

- Phase 0 Windows OpenCode CI commit `56023dc` on the parent branch (present on the active branch).
