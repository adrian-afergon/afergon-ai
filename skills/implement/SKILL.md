---
name: implement
description: "Trigger: execute a technical plan from openspec/plans/. Strict TDD (RED→GREEN→TRIANGULATE→REFACTOR) with TPP enforcement: always use the lowest-complexity transformation the test requires. At least 2 adversarial triangulation scenarios per behavior unit."
---

# Implement Skill

Execute a persisted plan artifact and apply the planned changes to the repository.

## Pipeline Position

```
debate → breakdown → specify → plannify → [implement] → review
```

You execute plans strictly. You do not redesign work, rewrite specs, or modify the plan's technical approach unless escalating.

## Input

- A plan file: `openspec/plans/<task-slug>/PLAN.md`
- Optional: execution context from the orchestrator
- Optional: constraints about sequencing or isolation

The plan must be in state `ready` or `ready-with-assumptions` before execution begins.

## Implementation Disciplines

### TDD + TPP Cycle

TDD and TPP are not separate disciplines — they run together on every behavior unit. The cycle is:

```
RED → GREEN (TPP) → TRIANGULATE → GREEN (TPP) × N → REFACTOR
```

#### RED

Write a **single failing test** that defines the expected behavior of the unit.

- The test must fail for the right reason (not a compilation error or typo).
- Test one behavior at a time. Do not write multiple failing tests before going green.
- Use domain language, not implementation language.

#### GREEN (with TPP enforcement)

Write the **minimum code** that makes the failing test pass using the **lowest-priority TPP transformation** that suffices.

TPP defines the ordered list of transformations from simplest to most complex. You must always pick the transformation with the **lowest index** that satisfies the test. Never skip ahead to a more complex transformation when a simpler one works.

| #   | Transformation           | Description                                         |
| --- | ------------------------ | --------------------------------------------------- |
| 1   | `{} → nil`               | Return nothing (null/nil/void)                      |
| 2   | `nil → constant`         | Return a fixed literal value                        |
| 3   | `constant → constant+`   | Return one of several constants (e.g., with an if)  |
| 4   | `constant → scalar`      | Replace a constant with a variable                  |
| 5   | `statement → statements` | Add more statements to the body                     |
| 6   | `unconditional → if`     | Introduce a conditional branch                      |
| 7   | `scalar → array`         | Replace a scalar with a collection                  |
| 8   | `array → container`      | Replace an array with a more complex data structure |
| 9   | `statement → recursion`  | Replace iteration with recursion                    |
| 10  | `if → while`             | Replace a conditional with a loop                   |
| 11  | `expression → function`  | Extract an expression into a named function         |
| 12  | `variable → assignment`  | Replace a variable with a mutation/reassignment     |

**Enforcement rule**: if a test passes with transformation #2 (return a constant), do not write transformation #6 (a conditional) even if you already know the next test will require it. Stay at the lowest transformation that makes the current test pass. Let the triangulation step force the next move.

#### TRIANGULATE

After GREEN, actively search for **at least 2 scenarios** that would break the current implementation.

This is adversarial thinking. Your goal is to find the cases your current code handles incorrectly or incompletely. Specifically, look for:

- **Boundary values**: inputs at the edge of valid ranges (zero, empty, max, min, one-off)
- **Variation in kind**: a different valid input that produces a different output
- **Failure conditions**: invalid inputs, missing preconditions, rule violations
- **Equivalent but structurally different inputs**: two inputs that look alike but should behave differently

For each scenario found:

1. Write a test for it — it should **fail** with the current code
2. Go back to GREEN using the lowest necessary TPP transformation
3. Repeat until all triangulation tests pass

**Minimum requirement**: at least 2 triangulation tests per behavior unit before considering the behavior generalized. If you cannot find 2 breaking scenarios, state that explicitly and document why.

Triangulation is what forces TPP upward: each new failing test demands a slightly more general implementation. This is intentional — it ensures the code only becomes as complex as the evidence requires.

#### REFACTOR

Once all RED + triangulation tests pass:

- Remove duplication
- Improve naming and readability
- Extract well-named abstractions where the pattern is clear
- **Do not change observable behavior**
- **All tests must still pass after every refactor step**

Do not add new functionality during refactor. If you discover missing behavior, write a new RED test first.

### Incremental Verification Policy

After completing each plan checkbox:

- Run the smallest relevant verification set that proves that step is done.
- This may include targeted tests, type checks, lint, local functional validation.
- **Do not mark a checkbox complete without step-level verification evidence.**

### Final Verification Policy

After all checkboxes are completed:

- Read the `Verification` section of the plan file. Run the exact commands declared there: tests, build, and any additional evidence steps.
- Do not substitute or invent a different verification baseline. If the plan's Verification section is empty or says `None`, flag it as a plan defect and run the most conservative baseline available (all tests + build).
- Do not declare implementation complete unless all declared verification steps pass.

## Commit Policy

Create commits for completed execution units (a unit = one logically complete checkbox or group of related checkboxes).

Commit message format:

```
<type>(<scope>): <short description>

<optional body if clarification is useful>
```

Never batch all changes into one commit at the end. Commit as work units complete.

## Deviation Policy

Do not silently deviate from the plan. Stop and escalate when:

- The plan contradicts the actual repository state
- Required files, interfaces, or contracts do not exist as assumed
- Continuing would require materially changing the execution structure
- The plan would introduce high technical risk not reflected in the plan

## Failure Handling

- If step-level verification fails: do not mark the checkbox; fix or escalate.
- If final verification fails: do not declare `completed`; report `failed-verification`.
- If pre-existing failures exist before implementation starts: report them; do not hide behind partial success.

## Valid Output States

- **`completed`**: all checkboxes done, persisted plan updated, commits exist, all tests pass, build succeeds, no unreported deviation
- **`completed-with-notes`**: everything above is true + notes are non-blocking
- **`blocked`**: cannot safely continue without user input, dependency completion, or replanning
- **`failed-verification`**: work exists but final verification does not pass
- **`invalid-input`**: plan is missing, malformed, or unusable

## Result Artifact

Write the implementation result to disk:

```
openspec/results/<task-slug>/RESULT.md
```

Create `openspec/results/<task-slug>/` if it doesn't exist. Write the file before returning the inline summary. If writing fails, say so explicitly — do not claim the artifact was created.

The result file is the handoff artifact for `afergon-review`. It must exist on disk for review to proceed.

## Implementation Result Contract

Write to `openspec/results/<task-slug>/RESULT.md` AND return the same content inline:

```markdown
## Implementation Status

<completed | completed-with-notes | blocked | failed-verification | invalid-input>

## Plan Reference

- Plan: <path>
- Execution Mode: <direct | sequential | parallel | parallel-with-isolation>

## Execution Summary

<Brief summary of what was implemented or why execution stopped.>

## Completed Steps

- <checkbox text, or "None">

## Updated Plan Artifacts

- <path, or "None">

## Commits Created

- <sha> <message>

## Files Changed

- <path>

## Verification Results

- Step-level checks:
  - <check>: <passed | failed | not-run>
- Final checks:
  - Tests: <passed | failed | not-run>
  - Build: <passed | failed | not-run>
  - Additional Evidence: <passed | failed | not-run>

## Blockers or Deviations

- <issue, or "None">

## Notes

- <note, or "None">

## Next Step

<What the orchestrator should do next.>
```

Use literal `None` for empty sections.
