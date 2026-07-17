# Task: Resolve AI operating-base governance decisions

- **Task Number**: 001
- **Slug**: resolve-ai-operating-base-governance
- **Spec Breadth Hint**: broad
- **Spec Breadth Rationale**: Resolves interconnected governance concerns for root authority, configuration, skill discovery, architecture boundaries, evidence, Git-state planning, and deferred planner-agent improvement.

## Intent

Resolve the governance decisions that must constrain a future root AI operating base so it complements current repository contracts rather than silently rewriting them or absorbing unrelated repository state.

## Context

The repository dogfoods its AI harness, skills, adapters, and OpenSpec artifacts; the debate found a present skill registry but absent `openspec/config.yaml`, plus no evidence for an existing DDD or hexagonal production architecture. Before the Implement gate, the approved-in-principle scope was expanded to govern implementation-plan Git-state assessment and to record, but not implement, a future improvement to the OpenCode planning agent.

## In Scope

- Decide whether to create a root `AGENTS.md` and its precedence relative to installed agents, skills, and tool adapters.
- Decide whether to create `openspec/config.yaml` or explicitly retain the no-memory-configuration mode.
- Decide whether `.atl/skill-registry.md` is canonical, must be regenerated, or must be replaced.
- Define the threshold for introducing interfaces, classes, or adaptation boundaries.
- Define the minimum dogfooding evidence for promoting an agent practice from candidate to mandatory rule.
- Require future implementation plans to inspect and report branch, worktree, staged, unstaged, and untracked state and to choose reuse or isolation without silently absorbing unrelated changes.
- Require the current implementation plan to assess actual repository state and recommend branch, worktree, and staging treatment before implementation.
- Require the eventual implementation to create root `TODO-afg-plannify-improvements.md` with specific deferred scope for planning Git-state hygiene.

## Out of Scope

- Creating or modifying `AGENTS.md`, `openspec/config.yaml`, or `TODO-afg-plannify-improvements.md` during specification and replanning.
- Creating or modifying `.atl/skill-registry.md`, skills, adapters, application code, or tests.
- Modifying `adapters/opencode/agents/afg-plannify.md`; its improvement is backlog-only in the eventual implementation.
- Creating, switching, cleaning, or removing Git branches or worktrees during specification and replanning.
- Architecture remediation, including a migration to DDD, hexagonal architecture, classes, or new generic layers.

## Dependencies

- **Requires**: None
- **Enables**: 002-create-evidence-grounded-root-ai-operating-base

## Acceptance Criteria

- [ ] The user-approved record explicitly answers all original governance decisions from the debate summary.
- [ ] The record states the precedence relationship among root instructions, installed agents, skills, and tool adapters.
- [ ] The record states the desired handling of the absent memory configuration and the present skill registry.
- [ ] The record defines observable evidence or a decision rule for each promoted mandatory practice.
- [ ] The record explicitly confirms that no architecture remediation is authorized by these decisions.
- [ ] The future root contract requires every implementation plan to inspect and report branch, worktree, staged, unstaged, and untracked state and explicitly choose reuse or isolation.
- [ ] The current plan records actual repository state and recommends branch, worktree, and staging treatment before implementation.
- [ ] The eventual implementation creates `TODO-afg-plannify-improvements.md` with specific planning Git-state, isolation, and disposition scope while leaving `adapters/opencode/agents/afg-plannify.md` unchanged.

## Open Decisions

None

## Approved Decisions

1. Create a concise root `AGENTS.md`; it governs repository-wide operation, storage, design, and technology, while Afergon-AI governs workflow and more-specific agents, skills, and adapters govern their specialized concerns.
2. Create `openspec/config.yaml` for the repository's selected Engram memory configuration.
3. Keep `.atl/skill-registry.md` as the canonical skill index and load applicable skills from its exact `SKILL.md` paths.
4. Apply the approved interface, class, composition, validation Value Object, and inward-dependency rules only to new or deliberately migrated code.
5. Promote practices using artifact-appropriate tests and review, with multi-tool validation supplementary and installer parity required or explicitly backlogged.
6. Require implementation plans to inspect all named Git-state categories, report them, and choose safe reuse or branch/worktree isolation without absorbing unrelated changes.
7. Record future `afg-plannify` Git-state governance in the named root TODO; do not modify that agent in this scope.

## Parallelization

None; the decisions jointly define the boundary for the downstream root-instruction implementation.

## Notes

The decisions above are user-approved. Replanning must use the observed repository state rather than infer that the current branch or worktree is safe.
