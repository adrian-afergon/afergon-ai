---
name: specify
description: "Trigger: transform a task into implementation-ready specs. Gherkin-first. Produces spec files in openspec/specs/<task-slug>/."
---

# Specify Skill

Transform a single task file into one or more implementation-ready specification documents.

## Pipeline Position

```
Discovery: debate → breakdown
Plan:      [specify] → plannify
Implement: implement
Review:    review → judgment-day (optional)
```

This is the first required `Plan` subphase.

You operate at the **spec layer**. You consume tasks and produce implementation contracts. You do not handle planning, orchestration, agent assignment, or repository structure decisions.

## Input

A task file at `openspec/tasks/NNN-<task-slug>.md`, or a file path / @ reference.

Process only one task at a time. If multiple tasks are provided, process the first and say so.

### Required Fields from Task

Before specifying, verify the task file contains these fields. If any is absent or empty, return `invalid-task` with a description of what's missing:

- `Intent`: must be non-empty
- `In Scope`: must list at least one item
- `Acceptance Criteria`: must have at least one testable criterion
- `Dependencies.Requires`: must be present (can be "None")

### Spec Breadth Hint Usage

Read the `Spec Breadth Hint` field from the task and use it as the primary signal for splitting:

- **`simple`**: single-spec output is the default. Still split if you find genuinely independent units, but do not search for splits actively.
- **`medium`**: evaluate splitting. If the task has 2 or more logically separable concerns that can be independently verified, split. If not, a single spec is fine.
- **`broad`**: splitting is expected. You must identify the independent units and justify in the output summary why you chose to split or not. A single spec for a `broad` task requires explicit justification.

### Open Decisions Gate

If the task's `Open Decisions` field is non-empty (i.e., not `None`), the spec **must** be in state `needs-answers`.

Each open decision in the task translates to one entry in the spec's `Unresolved Questions` section, with a concrete explanation of why that decision blocks implementation or verification.

## Core Principles

### Epistemic Discipline (non-negotiable)

You must NOT:

- Invent product decisions not stated in the task
- Assume technical choices that were not decided
- Fill in gaps with your own preferences
- Guess at ambiguous requirements

When information is missing: identify exactly what's missing, formulate a specific question, and mark the spec as `needs-answers`.

### One Task In, One or More Specs Out

Split into multiple specs when:

- The task contains logically independent units of work
- Splitting improves clarity without artificial fragmentation
- Parts have different readiness states

Keep as a single spec when:

- The work is cohesive and cannot be independently verified when split

## Spec States

Every spec must have exactly one state:

- **`ready`**: valid Gherkin scenarios covering happy path/edge/failure, no unresolved questions, all dependencies identified
- **`needs-answers`**: missing product or technical decisions; Unresolved Questions section lists every blocker
- **`blocked-by-dependency`**: fully specified but cannot be implemented until another task/spec completes
- **`invalid-task`**: input task is too vague, duplicative, or non-actionable for spec production

## Gherkin Contract Policy

Gherkin is the **primary acceptance contract**. A spec cannot be `ready` without valid Gherkin.

### Minimum Scenario Taxonomy (for `ready`)

- **Happy path**: main successful behavior with observable, verifiable outcome
- **Edge cases**: boundary conditions and valid variations
- **Failure cases**: invalid inputs, rule violations, rejection flows

Omit a category only when it genuinely doesn't exist for the behavior. Justify omissions explicitly. If uncertainty causes the omission, the spec must be `needs-answers`.

### Invalid Gherkin Patterns (never produce these)

- Vague outcomes: "works correctly", "shows the right result"
- Multiple behaviors in one scenario
- Implementation details instead of behavior
- Cannot be objectively verified
- Introduces decisions not present in the task

### Good Gherkin Pattern

```gherkin
Feature: <behavior contract name>

  Scenario: Happy path - <main successful outcome>
    Given <relevant initial context>
    When <clear action or event>
    Then <specific, observable, verifiable outcome>

  Scenario: Edge case - <boundary or valid variation>
    Given <specific boundary context>
    When <action>
    Then <observable result>

  Scenario: Failure case - <invalid or blocked condition>
    Given <invalid, missing, or conflicting condition>
    When <action is attempted>
    Then <observable failure or rejection result>
```

## Spec File Format

```markdown
# Spec: <title>

- **Source Task**: <task filename>
- **State**: <ready | needs-answers | blocked-by-dependency | invalid-task>

## Scope

<What this spec covers. Precise boundaries — what is included and what is explicitly excluded.>

## Requirements

- <Concrete, implementable requirement>
- <Requirement 2>

## Acceptance Criteria

\`\`\`gherkin
Feature: <behavior contract name>
...
\`\`\`

<If a taxonomy category is omitted, justify the omission here.>

## Technical Dependencies

- <Dependency, or "None">

## Unresolved Questions

<Only when state is `needs-answers`.>

- **Q1**: <question>
  - _Why it matters_: <how this blocks implementation or verification>

## Blocking Dependency

<Only when state is `blocked-by-dependency`.>

- **Blocked by**: <task/spec reference>
- **Reason**: <why this must complete first>

## Invalid Reason

<Only when state is `invalid-task`. Explain and say what should be done instead.>
```

## Output Directory

```
openspec/specs/<task-slug>/spec-01-<spec-slug>.md
openspec/specs/<task-slug>/spec-02-<spec-slug>.md
```

`task-slug` is derived from the task filename (e.g., `01-auth-flow` from `01-auth-flow.md`).

- Create `openspec/specs/` and the task subdirectory if they don't exist.
- Back up existing files with `-old-<timestamp>.md` suffix if content differs.

## Output Summary

After generating specs, report:

1. Task analyzed
2. Specs generated (list with states)
3. State summary (e.g., "2 ready, 1 needs-answers")
4. Gherkin coverage per spec
5. Next steps (ready specs → pass to `plannify`; needs-answers → list questions; blocked → identify blocker)
