# Plan: Establish the AI operating base safely

- **Source Task**: `openspec/tasks/001-resolve-ai-operating-base-governance.md`
- **Source Spec(s)**:
  - `openspec/specs/001-resolve-ai-operating-base-governance/spec-01-root-contract-authority.md`
  - `openspec/specs/001-resolve-ai-operating-base-governance/spec-02-configuration-and-skill-registry-governance.md`
  - `openspec/specs/001-resolve-ai-operating-base-governance/spec-03-new-code-architecture-governance.md`
  - `openspec/specs/001-resolve-ai-operating-base-governance/spec-04-mandatory-practice-evidence.md`
  - `openspec/specs/001-resolve-ai-operating-base-governance/spec-05-implementation-plan-git-state-governance.md`
  - `openspec/specs/001-resolve-ai-operating-base-governance/spec-06-plannify-improvement-backlog.md`
- **State**: ready
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed

## Summary

Implement one bounded documentation/configuration work unit in a dedicated clean branch and worktree. Add only `AGENTS.md`, `openspec/config.yaml`, and `TODO-afg-plannify-improvements.md`; preserve all unrelated state in the current `main` worktree; and carry only the exact task-owned OpenSpec inputs required for traceability. The root contract will complement the canonical Afergon-AI workflow, establish Git-state planning governance, and defer the planner-agent enhancement to an actionable TODO. `adapters/opencode/agents/afg-plannify.md` is explicitly protected from modification.

## Planning Scope

Planned implementation files — these are the only product files to create:

1. `AGENTS.md` — concise repository-wide operating contract.
2. `openspec/config.yaml` — minimal Engram project configuration.
3. `TODO-afg-plannify-improvements.md` — bounded future improvement for planner Git-isolation behavior.

Existing task-owned planning inputs that may be copied by exact path into the isolated worktree for traceability, but are not additional implementation outputs:

- `openspec/tasks/001-resolve-ai-operating-base-governance.md`
- `openspec/specs/001-resolve-ai-operating-base-governance/spec-01-root-contract-authority.md`
- `openspec/specs/001-resolve-ai-operating-base-governance/spec-02-configuration-and-skill-registry-governance.md`
- `openspec/specs/001-resolve-ai-operating-base-governance/spec-03-new-code-architecture-governance.md`
- `openspec/specs/001-resolve-ai-operating-base-governance/spec-04-mandatory-practice-evidence.md`
- `openspec/specs/001-resolve-ai-operating-base-governance/spec-05-implementation-plan-git-state-governance.md`
- `openspec/specs/001-resolve-ai-operating-base-governance/spec-06-plannify-improvement-backlog.md`
- `openspec/plans/001-resolve-ai-operating-base-governance/PLAN.md`

The implementation result at `openspec/results/001-resolve-ai-operating-base-governance/RESULT.md` is also staged as execution and remediation traceability, but is not an implementation output.

Estimated implementation diff: **75–115 added lines across the three planned files**, with no deletions expected. Stop and report scope drift before exceeding **140 changed implementation lines**.

Out of scope:

- Editing `adapters/opencode/agents/afg-plannify.md`; this is prohibited in this change.
- Editing `.atl/skill-registry.md`, any other agent, adapter, skill, prompt, script, application file, test, installer, or generated artifact.
- Architecture remediation or migration of existing code.
- Copying Afergon-AI phases, routing, TDD/TPP, or review tables into `AGENTS.md`.
- Cleaning prunable worktree registrations or modifying any unrelated branch/worktree state.
- Committing, pushing, publishing, or opening a PR without separate authorization.

## Current Repository State

Observed directly in `/Users/adrian/projects/afergon/afergon-ai` on 2026-07-17:

- **Branch**: `main` at `a7813c8be85df9043e04a2348b8c972eb1d7fe88`, tracking `origin/main`; ahead/behind is `0/0`, and `origin/main` resolves to the same commit.
- **Current worktree**: `/Users/adrian/projects/afergon/afergon-ai` on `main`; dirty and unsafe for implementation.
- **Other active worktrees**:
  - `/private/var/folders/lg/hhlr0bnn63d3924jg38xlxp40000gn/T/opencode/afergon-ai-review-receipt-gate` on `feat/review-receipt-gate-storage`.
  - `/Users/adrian/projects/afergon/afergon-ai-semantic-efficiency-metrics` on `feat/semantic-efficiency-metrics`.
  - `/Users/adrian/projects/afergon/afergon-ai-semantic-efficiency-metrics-pr-publish` on `feat/semantic-efficiency-metrics-08-cli-help`.
- **Prunable registered worktrees**: six `issue-15-stack` through `issue-15-stack-6` entries under the OpenCode temporary directory. They are unrelated and must not be pruned in this change.
- **Staged state**: none.
- **Unstaged tracked state**: `.pi/APPEND_SYSTEM.md`, `adapters/opencode/agents/afergon-ai.md`, and `adapters/opencode/agents/afg-debate.md` are modified; all are unrelated and user-owned for this task.
- **Untracked state**:
  - Unrelated and not transferable: `examples/metrics-example.json`, `openspec/debate/debate-summary-root-agents-ai-working-principles.md`, `openspec/tasks/002-create-evidence-grounded-root-ai-operating-base.md`, and `openspec/tasks/PROJECT-TASKS.md`.
  - Task-owned and transferable only by exact path: the Task 001 file, six specs, and this plan listed under Planning Scope.
- **Protected agent check**: `git diff -- adapters/opencode/agents/afg-plannify.md` is empty.
- **Isolation target availability**: local and remote branch `docs/ai-operating-base-governance` are absent, and `/Users/adrian/projects/afergon/afergon-ai-ai-operating-base-governance` does not exist.

## Design Rule Alignment

- All six source specs are `ready`; none has unresolved questions or blocking dependencies.
- `README.md` remains the workflow authority and canonical project-configuration reference. `AGENTS.md` will link/defer to it rather than restate workflow details.
- `.atl/skill-registry.md` remains the generated canonical skill index. This plan was prepared after resolving and reading the exact registered `plannify`, `cognitive-doc-design`, and `work-unit-commits` skill paths; the registry itself remains unchanged.
- `scripts/init-project.sh`, `scripts/init-project.ps1`, and `README.md` agree on the minimal `project.name` plus `memory.system` YAML shape.
- Architecture rules apply only to new or deliberately migrated code; no existing code is selected for migration here.
- Artifact-appropriate evidence applies: structural checks and fresh-context review are required; product unit tests and builds are not meaningful for these static Markdown/YAML outputs.
- The accepted scope expansion requires explicit branch, worktree, staged, unstaged, and untracked reporting plus safe disposition of each existing change class.

## Assumptions

None

## Design Tensions

None

## Vertical Slicing Decision

No vertical slices are needed. The three small files form one reviewable governance work unit, remain well below the 400-line review threshold, and share one acceptance/review boundary. Repository isolation is a prerequisite step, not a separate product slice.

## Execution Strategy

Use **sequential** execution by one implementer because safe isolation and exact-path transfer must complete before any implementation file is created.

Exact Git handling recommendation:

1. Reinspect all five Git-state categories immediately before implementation. If the snapshot changed materially, stop and update the disposition before editing.
2. Leave `/Users/adrian/projects/afergon/afergon-ai` on `main` untouched: do not switch branches, stash, clean, reset, stage, restore, delete, or overwrite anything there.
3. From the confirmed `origin/main` commit, create branch `docs/ai-operating-base-governance` in new worktree `/Users/adrian/projects/afergon/afergon-ai-ai-operating-base-governance`. Stop rather than reuse if either name/path has appeared or is dirty.
4. Copy only the eight exact task-owned OpenSpec paths listed in Planning Scope into the new worktree. Do not copy `openspec/` as a directory and do not transfer the debate summary, Task 002, `PROJECT-TASKS.md`, `examples/`, or any modified tracked file.
5. Confirm the isolated worktree contains only those eight transferred OpenSpec paths before creating the three planned implementation files.
6. After verification, stage only the explicit twelve-path allowlist: the eight transferred OpenSpec paths, the three planned files, and the implementation result. Never use broad staging such as `git add .`, `git add -A`, or `git add openspec/`.
7. Compare the cached path list exactly with the allowlist. Any extra path must be unstaged and investigated; a missing protected-file proof or unexpected diff blocks review.

## Implementation Steps

- [x] Re-run and record `git branch --show-current`, `git rev-parse HEAD`, `git rev-parse origin/main`, `git rev-list --left-right --count main...origin/main`, `git worktree list --porcelain`, `git status --short --branch`, `git diff --cached --name-status`, `git diff --name-status`, and the untracked path list.
- [x] Confirm `docs/ai-operating-base-governance` and `/Users/adrian/projects/afergon/afergon-ai-ai-operating-base-governance` remain unused; create the branch/worktree from the revalidated clean `origin/main` base.
- [x] Transfer only the eight exact OpenSpec paths in Planning Scope and verify no other changed or untracked path entered the isolated worktree.
- [x] In the isolated worktree, reread `.atl/skill-registry.md`, resolve/read exact matching skills, and report selected paths before editing.
- [x] Create `openspec/config.yaml` with only `project.name: afergon-ai` and `memory.system: engram` in the installer-supported shape.
- [x] Create concise `AGENTS.md` sections covering authority/conflict escalation, session startup, exact-path skill loading and selected-skill reporting, implementation-plan Git preflight, user-owned decisions and OpenSpec storage, new/deliberately migrated code, and evidence classification.
- [x] In `AGENTS.md`, require plans to report branch, worktree topology, staged, unstaged, and untracked state; choose safe reuse versus a new branch/worktree; state preserve/transfer/stage disposition; and prohibit silent absorption of unrelated changes.
- [x] Create `TODO-afg-plannify-improvements.md` as one bounded future backlog item that names `adapters/opencode/agents/afg-plannify.md`, identifies its current generic execution-mode gap, and defines the five-category Git inspection, reuse-or-isolate choice, explicit state disposition, and unrelated-change prohibition as future acceptance criteria.
- [x] State in the TODO that the behavior is deferred and not currently enforced. Do not edit `adapters/opencode/agents/afg-plannify.md` under any circumstance in this change.
- [x] Verify `.atl/skill-registry.md` and `adapters/opencode/agents/afg-plannify.md` have empty diffs against the isolated-worktree base; stop on any difference.
- [x] Run the structural, whitespace, scope, line-budget, and protected-path checks in Verification.
- [x] Stage each of the twelve allowlisted paths explicitly, inspect the cached path list and complete cached diff, and remove/investigate anything outside the allowlist.
- [x] Run fresh-context `afergon-review` against the six specs, this plan, the Git-state evidence, and the staged diff; its canonical rerun found the missing selected-skill reporting rule required by spec-02.
- [x] Add the selected-skill reporting rule, update Task 001 traceability, and rerun focused structural verification before returning the remediation for canonical re-review.

## Interfaces and Technical Contracts

- `openspec/config.yaml` has the exact data contract:

  ```yaml
  # afergon-ai project configuration

  project:
    name: afergon-ai

  memory:
    system: engram
  ```
- `AGENTS.md` is authoritative for repository-wide operation, storage, design, technology, and plan preflight. Afergon-AI remains authoritative for workflow; registered skills, agents, and adapters remain authoritative for more-specific concerns. Session startup must report selected registered skills by name or exact path. An unresolved same-concern conflict must be surfaced to the user.
- Every implementation plan must report branch, worktree topology, staged, unstaged, and untracked state; choose and justify reuse or branch/worktree isolation; and assign explicit disposition without absorbing unrelated work.
- `TODO-afg-plannify-improvements.md` is a future-work contract, not an agent change. It must name the protected target and provide checkable future acceptance criteria for the complete Git-state behavior.
- Evidence status uses `produced`, `not applicable`, or `outstanding`.

## Acceptance Criteria

- [x] The only implementation files created are `AGENTS.md`, `openspec/config.yaml`, and `TODO-afg-plannify-improvements.md`.
- [x] `AGENTS.md` covers repository authority, exact-path skill loading, selected-skill reporting, human decision ownership, OpenSpec artifact storage, scoped new-code architecture, evidence, and complete implementation-plan Git preflight without reproducing the Afergon-AI workflow.
- [x] The Git preflight explicitly names branch, worktree, staged, unstaged, and untracked state; reuse-or-isolate choice; state disposition; and preservation of unrelated changes.
- [x] `openspec/config.yaml` exactly matches the Engram contract above.
- [x] The root TODO names `adapters/opencode/agents/afg-plannify.md`, distinguishes existing generic execution modes from the missing behavior, and records bounded actionable future acceptance criteria for all five Git-state categories, isolation choice, and disposition.
- [x] `adapters/opencode/agents/afg-plannify.md`, `.atl/skill-registry.md`, and every unrelated current-worktree path remain unchanged.
- [x] No application, adapter, agent, skill, prompt, installer, script, test, generated file, or legacy architecture is modified.
- [x] The three-file implementation diff targets 75–115 added lines and does not exceed 140 changed lines without replanning.
- [x] The staged path set equals the explicit twelve-path allowlist and focused structural checks pass; canonical re-review remains the next workflow gate after this remediation.

## Verification

- [x] Tests: `Not applicable` for product unit tests because no executable behavior or existing contract parser changes; record this classification rather than running unrelated suites.
- [x] Build: `Not applicable` because the three static outputs are not build inputs and no runtime source changes.
- [x] Additional Evidence: preserve the pre-implementation outputs for branch, HEAD/base divergence, worktree topology, staged, unstaged, and untracked state.
- [x] Additional Evidence: search `AGENTS.md` for selected registered-skill reporting and search `AGENTS.md` and the TODO for all required Git-state terms and for explicit reuse/isolation, disposition, and unrelated-change language.
- [x] Additional Evidence: validate `openspec/config.yaml` by exact comparison with the contract in this plan.
- [x] Additional Evidence: require empty `git diff origin/main -- .atl/skill-registry.md adapters/opencode/agents/afg-plannify.md` in the isolated worktree.
- [x] Additional Evidence: run `git diff --cached --check`, inspect `git diff --cached --name-only`, `git diff --cached --numstat`, and the complete cached diff; compare paths exactly to the twelve-path allowlist and confirm the implementation line budget.
- [x] Additional Evidence: confirm `git status --short` in the original `main` worktree still reports its pre-existing unrelated state and none of the three planned implementation files.
- [x] Rule Compliance: fresh-context `afergon-review` must read all six specs, this plan, Git-state evidence, and the staged diff and return no blocking warning; it must explicitly confirm the protected planner agent was not modified.

## Open Questions

None

## Dependencies

- Readable `.atl/skill-registry.md` and exact matching `SKILL.md` paths.
- Git support and permission to create the named branch/worktree from a revalidated `origin/main`.
- Current canonical contracts in `README.md`, both initializer scripts, and the inspected agent contracts.
- Fresh-context `afergon-review` availability for the final review gate.

## Risks and Watchouts

- Broad untracked directories collapse detail in ordinary `git status`; implementation must enumerate individual untracked paths and never transfer/stage whole directories.
- The snapshot can become stale. Any branch, worktree, staged, unstaged, untracked, base, branch-name, or target-path change requires reinspection before edits.
- Task-owned and unrelated OpenSpec files share directories. Exact-path copy and exact-path staging are mandatory.
- The original tracked modifications are unrelated and user-owned; no convenience stash, reset, restore, or cleanup is permitted.
- The TODO must remain bounded to planner Git-state/isolation behavior and must not become permission to edit the planner agent now.
- Root guidance can grow into duplicated workflow documentation; enforce the line budget and defer to canonical sources.

## Completion Condition

This plan is ready for implementation when the implementer has revalidated the Git snapshot and can create the named isolated branch/worktree without touching the original worktree. Implementation is complete only when the three planned files satisfy all six specs, the staged path set exactly matches the twelve-path allowlist, unrelated and protected paths remain unchanged, the diff stays within budget, and structural evidence is produced. Canonical review is the subsequent acceptance gate.
