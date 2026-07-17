# Spec: Deferred afg-plannify Git-state improvement backlog

- **Source Task**: 001-resolve-ai-operating-base-governance.md
- **State**: ready

## Scope

This spec requires the eventual implementation to create the named root backlog file `TODO-afg-plannify-improvements.md` and defines its minimum actionable content. It explicitly excludes modifying `adapters/opencode/agents/afg-plannify.md` in this scope and excludes architecture remediation.

## Requirements

- The eventual implementation MUST create `TODO-afg-plannify-improvements.md` at the repository root.
- The TODO MUST identify `adapters/opencode/agents/afg-plannify.md` as the future change target without changing that agent in the current scope.
- The TODO MUST state that future planning-agent behavior should inspect and report Git branch, worktree topology, staged changes, unstaged changes, and untracked paths before recommending implementation.
- The TODO MUST require a future planner to decide whether existing state may be used or must be isolated through a new branch, a new worktree, or both.
- The TODO MUST require explicit disposition for staged, unstaged, and untracked state and must prohibit silently absorbing unrelated changes.
- The TODO MUST describe this work as deferred future scope and MUST NOT claim that the current `afg-plannify` contract already enforces the new behavior.
- Verification of the eventual implementation MUST show no content change to `adapters/opencode/agents/afg-plannify.md`.

## Acceptance Criteria

```gherkin
Feature: Actionable backlog for future planning-agent Git governance

  Scenario: Happy path - Named root TODO captures the complete deferred scope
    Given the operating-base implementation is completed without changing afg-plannify
    When TODO-afg-plannify-improvements.md is reviewed
    Then it names adapters/opencode/agents/afg-plannify.md as a future target
    And it specifies branch and worktree assessment plus staged, unstaged, and untracked disposition
    And it prohibits silently absorbing unrelated changes

  Scenario: Edge case - Current planner has a generic execution-mode recommendation
    Given afg-plannify can recommend an execution mode but does not require complete Git-state reporting
    When the backlog item describes the gap
    Then it distinguishes the future Git-state contract from the planner's existing execution-mode behavior

  Scenario: Failure case - Backlog language is not actionable
    Given the root TODO says only to improve Git handling or isolation
    When its required scope is evaluated
    Then the TODO is rejected until it names every required Git-state category and the reuse-or-isolate decision

  Scenario: Failure case - The planning agent is modified in the current scope
    Given adapters/opencode/agents/afg-plannify.md has the inspected pre-implementation content
    When the eventual operating-base diff is reviewed
    Then any content change to that agent blocks acceptance
```

## Technical Dependencies

- The inspected current contract at `adapters/opencode/agents/afg-plannify.md`.
