# Spec: Effective Managed Agent Permission Repair and Review Remediation

- **Source Task**: `openspec/tasks/001-repair-effective-agent-permissions.md`
- **State**: ready

## Scope

Includes the complete approved `afg-debate` and `afergon-ai` permission policies in agent frontmatter, equivalent registrar MANIFEST policies, persisted `opencode.json` verification, direct allowed/denied evaluation of the bounded debate-summary write path, two distinct required-file omission variants, canonical task/spec/plan/result reconciliation, and accurate PR #70 metadata. These remain one atomic contract because policy representations, executable evidence, canonical artifacts, and delivery linkage must agree for review. Excludes other agent policies, unrelated metadata or behavior, additional permissions, closing parent issue #67, opening another PR, and merging PR #70.

## Requirements

- `afg-debate` MUST declare and persist `read: allow`; MUST deny `bash`, `edit`, `glob`, `grep`, and `webfetch`; and MUST deny writing by default while allowing only paths matching `openspec/debate/debate-summary*.md`.
- `afergon-ai` MUST declare and persist `allow` for `bash`, `edit`, `glob`, `grep`, `read`, and `write`, and MUST declare and persist `deny` for `webfetch`.
- The registrar MANIFEST MUST contain a complete permission object for each named agent equivalent to that agent's complete frontmatter policy.
- The automated contract MUST execute `scripts/register-opencode-agents.sh` in an isolated configuration containing all required managed agent files and MUST inspect the persisted `opencode.json` output.
- The automated contract MUST compare each complete persisted permission object with its approved policy so any added, removed, or changed permission causes a focused failure identifying the agent and representation.
- Direct permission evaluation MUST prove that `afg-debate` allows a matching target such as `openspec/debate/debate-summary-agent-permissions.md` and denies a nonmatching target such as `openspec/debate/notes.md`.
- Registration MUST retain all-or-nothing behavior in two separately verified omission variants: missing `afg-debate.md` and missing `afergon-ai.md`. Each failure MUST identify the exact omitted file and preserve the existing `opencode.json` byte-for-byte.
- Permissions and non-permission metadata for every unrelated agent MUST remain unchanged.
- PR #70 MUST contain one reconciled active canonical task, spec, plan, and result set; all artifact references MUST resolve; the replanned executable PLAN MUST include every review remediation; superseded artifacts MUST NOT appear as active canonical inputs; and RESULT MUST identify every implementation and correction commit delivered by the PR.
- PR #70 MUST use the exact title `fix(opencode): repair managed agent permissions`, MUST close approved bug issue #71 with `Closes #71`, MUST reference parent issue #67 nonclosing with `Refs #67`, MUST NOT apply any closing keyword to #67, and MUST retain exactly one `type:*` label: `type:bug`.

## Acceptance Criteria

```gherkin
Feature: Effective managed agent permission repair and canonical review remediation

  Scenario: Happy path - Persist the approved afergon-ai policy
    Given the afergon-ai frontmatter and registrar MANIFEST define the approved complete policy
    And an isolated OpenCode configuration contains every required managed agent file
    When the managed registration flow completes
    Then the persisted afergon-ai permission object exactly allows bash, edit, glob, grep, read, and write, and denies webfetch

  Scenario: Happy path - Persist the approved afg-debate policy
    Given the afg-debate frontmatter and registrar MANIFEST define the approved complete policy
    And an isolated OpenCode configuration contains every required managed agent file
    When the managed registration flow completes
    Then the persisted afg-debate permission object allows read, denies bash, edit, glob, grep, and webfetch, denies other writes, and allows only writes matching openspec/debate/debate-summary*.md

  Scenario: Happy path - Reconcile canonical delivery artifacts
    Given PR #70 contains the repair implementation and its OpenSpec delivery artifacts
    When the active task, spec, executable plan, and result are checked as one canonical set
    Then each source reference resolves, the plan includes every review remediation, no superseded artifact is an active canonical input, and the result identifies every delivered implementation and correction commit

  Scenario: Happy path - Name PR #70 for the delivered bug fix
    Given PR #70 delivers the effective managed agent permission repair
    When its title is inspected
    Then the title is exactly "fix(opencode): repair managed agent permissions"

  Scenario: Happy path - Link PR #70 to the correct issues
    Given issue #71 is the approved permission bug and issue #67 is its parent initiative
    When the PR #70 body is inspected
    Then it contains "Closes #71" and "Refs #67" and contains no closing keyword applied to issue #67

  Scenario: Edge case - Allow a matching bounded debate-summary write target
    Given the persisted afg-debate permission policy is active
    When write permission is evaluated for "openspec/debate/debate-summary-agent-permissions.md"
    Then the write is allowed

  Scenario: Edge case - Deny a nonmatching write target
    Given the persisted afg-debate permission policy is active
    When write permission is evaluated for "openspec/debate/notes.md"
    Then the write is denied

  Scenario: Edge case - Leave unrelated managed agents unchanged
    Given the effective permission repair is applied
    When unrelated managed agent definitions and registrar MANIFEST entries are compared with their prior values
    Then every unrelated permission and metadata value is unchanged

  Scenario: Edge case - Retain the bug type label only
    Given PR #70 is prepared for canonical review
    When its type labels are inspected
    Then the complete type-label set is exactly "type:bug"

  Scenario: Failure case - Detect declaration or registrar policy drift
    Given an approved permission is added, removed, or changed in a named agent frontmatter, registrar MANIFEST entry, or persisted permission object
    When the focused effective-permission contract runs
    Then the contract fails and identifies the named agent and mismatched representation

  Scenario: Failure case - Reject registration when afg-debate is omitted
    Given an isolated OpenCode configuration omits only the required file "afg-debate.md"
    And its opencode.json contains an existing registry value
    When the managed registration flow is attempted
    Then it reports "afg-debate.md" as missing and leaves opencode.json byte-for-byte unchanged

  Scenario: Failure case - Reject registration when afergon-ai is omitted
    Given an isolated OpenCode configuration omits only the required file "afergon-ai.md"
    And its opencode.json contains an existing registry value
    When the managed registration flow is attempted
    Then it reports "afergon-ai.md" as missing and leaves opencode.json byte-for-byte unchanged
```

## Technical Dependencies

- Existing Vitest registrar behavior suite and temporary XDG configuration helpers
- OpenCode agent frontmatter, permission evaluation, and registrar configuration schemas
- `bash` and `python3` used by the existing registrar flow
- Approved GitHub bug issue #71, parent issue #67, and open PR #70
