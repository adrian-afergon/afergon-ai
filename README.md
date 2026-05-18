# afergon-ai

> A Pi-native development harness with a disciplined debate-to-implementation pipeline.

## What is afergon-ai?

afergon-ai is a Pi package that turns your coding agent into a **controlled development orchestrator**. It provides:

- A **work routing ladder**: small tasks execute directly; complex work follows the full pipeline.
- A **7-stage pipeline**: `debate → breakdown → specify → plannify → implement → review` (+ `design` for UI/UX work with Stitch).
- **Gherkin-first specs**: behavior as the primary implementation contract.
- **TDD/TPP enforcement**: strict RED → GREEN → REFACTOR with step-level verification.
- **Epistemic discipline**: agents never invent missing product decisions.
- **openspec/ artifact store**: all pipeline artifacts live under `openspec/` in the project repo.

## Install

```bash
pi install /path/to/afergon-ai
# or once published:
pi install npm:afergon-ai
```

## Pipeline

```
debate → breakdown → specify → plannify → implement → review
                                    ↓
                                 design (parallel, UI/UX only)
```

### Artifact store (openspec/)

| Stage     | Artifact location                                                  |
| --------- | ------------------------------------------------------------------ |
| debate    | `openspec/debate/debate-summary-<topic>.md`                        |
| breakdown | `openspec/tasks/PROJECT-TASKS.md` + `openspec/tasks/NNN-<slug>.md` |
| specify   | `openspec/specs/<task-slug>/spec-NN-<slug>.md`                     |
| plannify  | `openspec/plans/<task-slug>/PLAN.md`                               |
| implement | project source files (commits)                                     |
| design    | Stitch (external)                                                  |
| review    | inline report                                                      |

## Skills

Each pipeline stage is a Pi skill. Load on demand:

```bash
/skill:debate       # start a Socratic debate session
/skill:breakdown    # decompose a debate summary into tasks
/skill:specify      # transform a task into Gherkin specs
/skill:plannify     # build a technical execution plan
/skill:implement    # execute a plan with TDD discipline
/skill:design       # design in Google Stitch
/skill:afergon-review  # adversarial post-implement review
```

## Work Routing

```
small + clear context     → inline direct (no pipeline)
moderate / multi-file     → single skill phase
ambiguous / risky / large → full pipeline from debate
```

## Philosophy

- The AI is a tool directed by the human, never the decision-maker.
- Never invent product decisions. Surface missing ones.
- Gherkin scenarios are the behavioral contract, not documentation.
- Implementation is only complete when tests pass and the build succeeds.
- Review protects the human reviewer: never produce oversized diffs without warning.
