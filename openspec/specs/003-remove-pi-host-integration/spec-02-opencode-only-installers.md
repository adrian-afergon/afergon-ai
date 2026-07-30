# Spec: Initialize and update only OpenCode

- **Source Task**: 003-remove-pi-host-integration.md
- **State**: ready

## Scope

Make the POSIX and PowerShell initialization and update flows OpenCode-only. Retire Pi and aggregate host flags before side effects while keeping the already-retired Claude flag rejected. Preserve user-owned project files, including `.pi`, `CLAUDE.md`, and `.claude/`.

## Requirements

- `init` and `init --opencode` must configure the managed OpenCode agents, commands, and project configuration on both POSIX and PowerShell.
- The no-flag initialization path must directly initialize OpenCode; it must not present a host-selection prompt.
- `init --pi`, `init --all`, and `init --claude`, including when combined with other flags, must exit non-zero with a retirement error before prompting or creating, modifying, or deleting files.
- `update` must refresh only an existing managed OpenCode install on both platforms and must not read, write, create, modify, or delete project `.pi`, `CLAUDE.md`, or `.claude/` content.
- POSIX and PowerShell checks must exercise equivalent default/explicit init, retired-flag rejection, update, and user-file-preservation behavior.

## Acceptance Criteria

```gherkin
Feature: OpenCode-only project initialization and update

  Scenario Outline: Happy path - initialization configures OpenCode
    Given an uninitialized project and a supplied non-host memory choice
    When the user runs <command> through <platform>
    Then the managed OpenCode agents, commands, and project OpenCode configuration are created

    Examples:
      | platform   | command             |
      | POSIX      | init                |
      | POSIX      | init --opencode     |
      | PowerShell | init                |
      | PowerShell | init --opencode     |

  Scenario Outline: Edge case - OpenCode update preserves user-owned non-OpenCode files
    Given a project contains a managed OpenCode installation and user-owned `.pi`, `CLAUDE.md`, and `.claude/` files
    When the user runs update through <platform>
    Then the managed OpenCode files are refreshed
    And the user-owned `.pi`, `CLAUDE.md`, and `.claude/` files are unchanged

    Examples:
      | platform   |
      | POSIX      |
      | PowerShell |

  Scenario Outline: Failure case - retired host flags have no side effects
    Given an uninitialized project with no afergon-ai files
    When the user runs init with <flag> through <platform>
    Then the command exits non-zero with a retirement error for <flag>
    And no prompt is shown and no project or host files are created, modified, or deleted

    Examples:
      | platform   | flag                   |
      | POSIX      | --pi                   |
      | POSIX      | --all                  |
      | POSIX      | --claude               |
      | POSIX      | --opencode --pi        |
      | PowerShell | --pi                   |
      | PowerShell | --all                  |
      | PowerShell | --claude               |
      | PowerShell | --opencode --pi        |
```

## Technical Dependencies

- Phase 1 branch `chore/opencode-only-01-remove-claude-host` at commit `968aab6`
