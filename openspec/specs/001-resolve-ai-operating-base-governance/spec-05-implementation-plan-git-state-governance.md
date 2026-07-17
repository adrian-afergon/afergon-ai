# Spec: Implementation-plan Git-state governance

- **Source Task**: 001-resolve-ai-operating-base-governance.md
- **State**: ready

## Scope

This spec governs the Git-state evidence and isolation decision required in every future implementation plan and in the current plan before implementation. It includes branch, worktree, staged, unstaged, and untracked state plus explicit disposition of existing changes. It excludes changing Git state, creating a branch or worktree, implementing `AGENTS.md`, and architecture remediation during this session.

## Requirements

- The future root `AGENTS.md` MUST require every implementation plan to inspect and report the current Git branch, worktree topology, staged changes, unstaged changes, and untracked paths before the Implement gate.
- Every implementation plan MUST explicitly decide whether the existing branch and worktree may be used safely or whether implementation requires a new branch, a new worktree, or both.
- Every implementation plan MUST state the intended disposition of staged, unstaged, and untracked state, including which task-owned paths may be carried forward and which existing paths must remain untouched.
- An implementation plan MUST NOT silently include, stage, overwrite, stash, clean, reset, or otherwise absorb unrelated existing changes.
- The current plan MUST record an actual repository-state snapshot and base its branch, worktree, and staging recommendation on that snapshot.
- If repository state changes before implementation, the implementer MUST repeat the inspection and update or stop on any conflict rather than relying on a stale snapshot.
- The current plan MUST recommend isolated implementation because the observed `main` worktree contains unrelated unstaged tracked files and broad untracked directories, while the task artifacts themselves are untracked.
- The isolation recommendation MUST preserve the original worktree unchanged, transfer only explicitly named task-owned OpenSpec artifacts to a dedicated branch/worktree, and stage only an explicit allowlist after verification.

## Acceptance Criteria

```gherkin
Feature: Safe Git-state planning before implementation

  Scenario: Happy path - Current mixed repository state results in an isolation recommendation
    Given the current main worktree has no staged changes, has unrelated unstaged tracked files, and has broad untracked directories containing task artifacts
    When the current implementation plan assesses branch, worktree, staged, unstaged, and untracked state
    Then it recommends a dedicated implementation branch in a separate clean worktree
    And it identifies the exact task-owned artifacts that may be transferred and staged

  Scenario: Happy path - A future plan reports all Git-state categories
    Given an implementation plan is prepared before its Implement gate
    When its repository preflight is reviewed
    Then the plan reports the current branch, worktrees, staged changes, unstaged changes, and untracked paths
    And it records an explicit reuse-or-isolate decision

  Scenario: Edge case - Repository state changes after planning
    Given a plan contains a prior Git-state snapshot and isolation decision
    And branch, worktree, staged, unstaged, or untracked state changes before implementation
    When the Implement gate is entered
    Then all five Git-state categories are inspected again before any task file is changed

  Scenario: Edge case - Existing state is fully clean and task-owned
    Given a plan reports a clean intended branch and worktree with no staged, unstaged, or untracked state
    When reuse safety is evaluated
    Then the plan may recommend using that existing branch and worktree with the reason recorded

  Scenario: Failure case - A plan omits a required Git-state category
    Given an implementation plan does not report one or more of branch, worktree, staged, unstaged, or untracked state
    When readiness for implementation is evaluated
    Then the plan is not ready for the Implement gate

  Scenario: Failure case - Unrelated changes would be absorbed
    Given existing changes are not explicitly identified as task-owned
    When a plan proposes carrying, staging, stashing, cleaning, resetting, or overwriting those changes
    Then implementation is blocked until the plan preserves or isolates those changes explicitly
```

## Technical Dependencies

- Read access to current Git branch, worktree, index, working-tree, and untracked-path metadata.
