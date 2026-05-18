---
name: breakdown
description: "Trigger: decomposing a debate summary into tasks. Produces PROJECT-TASKS.md and individual task files in openspec/tasks/."
---

# Breakdown Skill

Decompose a debate summary into a validated, durable task artifact for roadmap work and downstream spec generation.

## Pipeline Position

```
debate → [breakdown] → specify → plannify → implement → review
```

You produce **tasks** (product intent with clear boundaries). You must NOT produce implementation contracts, repository execution plans, or orchestration details.

## Input

A debate summary file at `openspec/debate/debate-summary-<topic>.md`, or content provided inline.

Required sections: Objective, Initial Scope, Constraints, Success Criteria, Open Questions.

## Internal Phases

Process every debate summary through these six sequential phases:

### Phase 1: Context Framing

Extract: project name, description, technical direction, constraints and non-negotiables.

### Phase 2: Initial Task Decomposition

Identify all actionable requirements. Decompose into discrete tasks:

- One dominant intent per task
- Clear in-scope / out-of-scope boundaries
- Achievable in 1-3 days of focused work
- Numbered sequentially: 01, 02, 03 … N

### Phase 3: Task Enrichment

For each task, fill in the complete task template (see below).

### Phase 4: Breadth Analysis

Assign a **Spec Breadth Hint** per task:

- `simple`: single concern, clear path — no rationale required
- `medium`: multiple concerns or moderate complexity — rationale required
- `broad`: multiple interconnected concerns, high ambiguity — rationale required, consider splitting

### Phase 5: Validation

Validate the complete task set:

- No duplicate intent across tasks
- No task without observable acceptance criteria
- No circular dependencies
- Breadth hints assigned and justified where required
- All dependencies mapped bidirectionally

### Phase 6: Artifact Assembly

Write the two output artifacts (see Output below).

## Task File Format

```markdown
# Task: <title>

- **Task Number**: <NNN>
- **Slug**: <task-slug>
- **Spec Breadth Hint**: <simple | medium | broad>
- **Spec Breadth Rationale**: <required for medium/broad; write "None" for simple>

## Intent

<What this task accomplishes and why it matters. One sentence.>

## Context

<How this task fits the broader project.>

## In Scope

- <item>

## Out of Scope

- <item>

## Capability Areas

<Optional. Use only when it clarifies scope. Write "None" otherwise.>

## Dependencies

- **Requires**: <tasks that must complete first, or "None">
- **Enables**: <tasks this unblocks, or "None">

## Acceptance Criteria

- [ ] <specific, testable, observable criterion>

## Open Decisions

<Unresolved decisions affecting this task. Write "None" if none.>

## Parallelization

<Can any work in this task be done in parallel? With what? Write "None" if not applicable.>

## Notes

<Optional. Implementation hints, risks, or constraints. Write "None" if none.>
```

## Output

### openspec/tasks/PROJECT-TASKS.md

Contains:

- Project overview (name, description, technical direction)
- Visual dependency tree (ASCII diagram showing order, dependencies, parallel tracks)
- Ordered task list with per-task summaries
- Optional phase grouping for roadmap planning
- Validation status per task and for the artifact as a whole

### openspec/tasks/NNN-<task-slug>.md (one per task)

Individual task files following the task template above.

## Artifact Persistence

- Create `openspec/tasks/` if it doesn't exist.
- Do not use bash/heredoc to create files — use direct file write.
- If writing is unavailable, say so explicitly and return the content inline.

## Epistemic Discipline

- Never invent requirements not stated in the debate summary.
- When the summary is ambiguous, surface the ambiguity — do not resolve it silently.
- Open Decisions in tasks must be real questions, not rhetorical ones.

## Output Summary

After generating artifacts, report:

1. Tasks generated (list with slugs and breadth hints)
2. Dependency graph summary
3. Validation status
4. Any open decisions that must be resolved before `specify` can proceed
5. Next step recommendation
