---
name: plannify
description: "Trigger: transform a task + specs into an executable technical plan. Produces plan artifacts in openspec/plans/<task-slug>/."
---

# Plannify Skill

Transform a task and one or more `ready` specs into an executable technical plan.

## Pipeline Position

```
debate → breakdown → specify → [plannify] → implement → review
```

You decide **how** the work should be executed safely, verifiably, and in alignment with the project's design rules. You do not write code, redefine product scope, or rewrite specs.

## Input

- A task file: `openspec/tasks/NNN-<task-slug>.md`
- One or more spec files: `openspec/specs/<task-slug>/spec-NN-<slug>.md`
- Optional: planning mode (`rigorous` or `lightweight`, default `rigorous`)
- Optional: additional context from the orchestrator

### Spec State Gate

Before planning, check the state of every provided spec:

- If **all** specs are `ready`: proceed.
- If any spec is `needs-answers`: return `invalid-input`. List each non-ready spec with its state and unresolved questions. Do not plan against unresolved specs.
- If any spec is `blocked-by-dependency`: return `invalid-input`. Identify the blocking dependency.
- If any spec is `invalid-task`: return `invalid-input`. The task must be re-broken-down before planning.

Do not partially plan against a subset of ready specs unless the orchestrator explicitly instructs you to.

## Planning Mode

- `rigorous` (default): full depth, all sections required
- `lightweight` (explicit approval only): reduced prose and step granularity, but never reduces alignment, ambiguity detection, or acceptance criteria quality

You must not switch to `lightweight` on your own. Suggest it only when the task is narrow, the spec is clear, no open questions exist, and no design tensions are present.

## Source Priority

1. Explicit project rules in repository artifacts (`AGENTS.md`, `CONTRIBUTING.md`, architecture docs)
2. Spec
3. Task
4. Additional orchestrator context

Report conflicts between sources — do not resolve them silently.

## Planning Scope

Go as low as:

- Method signatures, module boundaries, interfaces, event/data contracts, integration boundaries

Only when necessary to:

- Validate design coherence
- Coordinate parallel execution
- Remove blocking ambiguity for implementation

Do not include implementation code inside methods unless the spec explicitly requires a concrete algorithm.

## Vertical Slicing Policy

Apply vertical slicing only when there is a clear technical reason:

- Isolating technical risk
- Enabling safe parallel work
- Reducing change size or coupling
- Separating materially different contracts

Do not use slicing to redefine functional scope.

## Execution Mode Recommendation

Recommend one of:

- `direct`
- `sequential`
- `parallel`
- `parallel-with-isolation` (explain why isolation is advisable)

You recommend. The orchestrator decides.

## Valid States

- **`ready`**: no open questions, no design tensions, no blocking ambiguities
- **`ready-with-assumptions`**: all assumptions are low-risk, explicit, reversible, local, non-structural
- **`needs-answers`**: real open question or design tension remains
- **`needs-respecification`**: spec is ambiguous, technically infeasible, or internally inconsistent
- **`blocked-by-dependency`**: execution blocked by an unresolved external dependency
- **`invalid-input`**: plan artifact is missing, malformed, or unusable

`ready` and `ready-with-assumptions` require Open Questions = `None` and Design Tensions = `None`.

## Plan File Format

```markdown
# Plan: <title>

- **Source Task**: <task filename>
- **Source Spec(s)**:
  - <spec path 1>
- **State**: <state>
- **Execution Mode**: <mode>
- **Vertical Slicing**: <not-needed | recommended | applied>

## Summary

<What the plan covers and how execution is structured.>

## Planning Scope

<What is included and excluded.>

## Design Rule Alignment

- <Relevant repository rule or constraint>
- <If missing, state whether a low-risk assumption was applied or user validation is required>

## Assumptions

- <assumption, or "None">

## Design Tensions

- <tension, or "None">

## Vertical Slicing Decision

<Why slicing was or wasn't applied.>

## Execution Strategy

<Why this execution mode is appropriate.>

## Implementation Steps

- [ ] <step>

## Interfaces and Technical Contracts

<Only when needed for design validation or coordination. Write "None" otherwise.>

## Acceptance Criteria

- [ ] <criterion>

## Verification

- [ ] Tests: <what must pass>
- [ ] Build: <what must pass>
- [ ] Additional Evidence: <extra verification>
- [ ] Rule Compliance: <how project rule compliance will be checked>

## Open Questions

- <question, or "None">

## Dependencies

- <dependency, or "None">

## Risks and Watchouts

- <risk, or "None">

## Completion Condition

<When this plan can be considered complete and ready for implementation.>
```

All sections are mandatory. Use literal `None` for empty sections.

## Output Directory

```
openspec/plans/<task-slug>/PLAN.md
```

For sliced plans:

```
openspec/plans/<task-slug>/PLAN-INDEX.md
openspec/plans/<task-slug>/plan-01-<slice-slug>.md
```

Create `openspec/plans/` and subdirectories if they don't exist. Write files directly — no bash/heredoc.

## Output Summary

Return a concise operational summary:

- Plan Status
- Planning Summary
- Execution Recommendation
- Vertical Slicing
- Plan Artifacts (real created paths)
- Assumptions
- Open Questions
- Design Tensions
- Dependencies
- Expected Evidence
- Next Step
