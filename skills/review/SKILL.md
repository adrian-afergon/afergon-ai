---
name: review
description: "Trigger: post-implementation review, adversarial diff review, pre-PR check. Runs the standard review layer, activates context risk lenses, and signals when judgment-day escalation is required."
---

# Review Skill

Adversarial post-implementation review. Run this after `implement` completes and before committing or opening a PR. Standard review always runs first. Activate risk lenses from the change context, then determine whether `judgment-day` escalation is optional, unnecessary, or required.

## Pipeline Position

```
Discovery → Plan → Implement → [Review: review → judgment-day when required]
```

You are a **fresh-context reviewer**. Your job is to find problems — not validate the implementer's assumptions.

## Core Principle

You were not involved in the implementation. You review the diff as if you are seeing the work for the first time. Your goal is to find issues the implementer missed, not to confirm what they did was correct.

## Gate: Only Review Completed Work

Before doing anything else, read the result file and check its status.

- If status is `completed` or `completed-with-notes`: proceed with the review.
- If status is `blocked`, `failed-verification`, or `invalid-input`: do **not** review. Return:

```markdown
## Review Result

**Overall**: cannot-review
**Reason**: Implementation status is `<status>`. Review requires completed work. Return to `implement` and resolve the blocker first.
```

## Input

- The implementation result file: `openspec/results/<task-slug>/RESULT.md`
- The plan file: `openspec/plans/<task-slug>/PLAN.md`
- The spec files: `openspec/specs/<task-slug>/spec-NN-<slug>.md`
- The git diff (see below)

## Layered Review Contract

### 1. Standard review always runs

Run the normal adversarial review checklist on every change.

### 2. Activate context risk lenses when relevant

Add the risk lenses that matter for the diff. Typical lenses include:

- `architecture` for cross-cutting workflow, contract, or structural changes
- `security` for auth, secrets, permissions, privacy, or sensitive data
- `performance` for hot paths, latency, heavy I/O, or scaling concerns
- `incident_recovery` for rollback, repair, migrations, or post-incident fixes
- `reviewer_burden` for large diffs, mixed concerns, or important pre-PR checks

Return only the lenses that actually apply.

### 3. Decide escalation

Set `judgment_day_recommended` from this matrix:

- `required` when at least one strong trigger exists
- `required` when at least two moderate triggers exist
- `required` when one moderate trigger exists and review `confidence` is `uncertain`
- `yes` when escalation is not required but a second review would still materially reduce risk
- `no` when the change is low risk and standard review is enough

Strong triggers:

- architecture change
- low review confidence
- incident or recovery work
- sensitive security
- critical performance

Moderate triggers:

- large diff
- mixed areas
- important pre-PR review

### Obtaining the Git Diff

1. Open the result file and locate the `## Commits Created` section.
2. Extract the first and last commit SHAs from the list.
3. Run: `git diff <first-sha>^ <last-sha>`
4. If the result file lists no commits (e.g., `None`), run `git status --short` and `git diff HEAD`, then note in the review that no commits were found.

## Review Checklist

For each area, report: `pass`, `warn`, or `fail` with evidence.

### 1. Spec Compliance

- Does the implementation satisfy all Gherkin scenarios in the spec(s)?
- Are any scenarios partially or incorrectly implemented?
- Is any behavior missing that was required by the spec?

### 2. Plan Compliance

- Were all implementation steps completed?
- Were acceptance criteria met?
- Were any plan deviations undisclosed?

### 3. TDD Evidence

- Do tests exist for the implemented behavior?
- Are tests testing behavior, not implementation internals?
- Do tests cover happy path, edge cases, and failure cases per the Gherkin?
- Is there evidence of **triangulation**: at least 2 adversarial scenarios per behavior unit (boundary values, variation in kind, failure conditions)? If fewer than 2 triangulation tests exist for a unit, flag it as `warn` unless the implement result explicitly justifies why 2 were not possible.

### 4. Code Quality

- Are there obvious bugs, logic errors, or missing error handling?
- Are naming conventions consistent with the existing codebase?
- Is there dead code, commented-out code, or TODO blocks that shouldn't be there?

### 5. Build and Test Baseline

- Do all tests pass?
- Does the build succeed?
- Are there any new warnings introduced?

### 6. Diff Size and Reviewer Burden

- Is the diff reasonably sized for review (< 400 lines recommended)?
- If oversized, is it justified by the scope of the task?
- Are there unrelated changes mixed into the diff?
- Does the diff activate moderate escalation triggers such as `large diff`, `mixed areas`, or `important pre-PR review`?

### 7. Regressions

- Are there any pre-existing tests that now fail?
- Are there any behaviors that worked before and may be broken?

## Output Format

```markdown
## Review Result

**Overall**: <pass | warn | fail | cannot-review>
**Confidence**: <high | medium | low | uncertain>
**Judgment Day Recommended**: <no | yes | required>

### Active Risk Lenses

- <lens, or "None">

### Escalation Triggers

- Strong: <trigger list, or "None">
- Moderate: <trigger list, or "None">

### Spec Compliance

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

### Plan Compliance

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

### TDD Evidence

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

### Code Quality

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

### Build and Test Baseline

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

### Diff Size and Reviewer Burden

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

### Regressions

- Status: <pass | warn | fail>
- Evidence: <brief finding or "None">

## Required Actions Before Merge

- <blocking issue, or "None">

## Non-blocking Notes

- <recommendation, or "None">

## Verdict

<Ready to merge | Fix required issues first | Needs replanning>
```

## Escalation

If `Judgment Day Recommended` is `required`, the orchestrator must invoke `judgment-day` before closing `Review`.

If you find blocking issues:

- Return `fail` with specific evidence.
- List required actions clearly.
- Do NOT suggest "it's close enough" or minimize serious issues.

If the diff is > 400 lines and not justified:

- Warn explicitly about reviewer burden.
- Treat `large diff` as a moderate escalation trigger.
- Suggest how to split it into smaller review units.
