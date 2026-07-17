# Agent Permission Repair Result

## Implementation Status

completed-with-notes

## Plan Reference

- Plan: `openspec/plans/agent-permissions/PLAN.md`
- Execution Mode: sequential, strict TDD/TPP

## Execution Summary

Repaired both named agent declarations and registrar MANIFEST projections, added real-registrar complete-policy/parity contracts, and strengthened missing-file registration protection. Reused PR #70, retained `Closes #67`, and changed its sole type label to `type:bug`.

## Completed Steps

- Baseline and scope safety
- RED/GREEN persisted `afg-debate` policy
- TRIANGULATE RED/GREEN persisted `afergon-ai` policy
- TRIANGULATE RED/GREEN declaration/projection parity
- Missing-file byte-preservation safety net
- Test-helper refactor and registrar-suite verification
- Scope review, full verification, atomic implementation commit, push, and PR #70 update

## Updated Plan Artifacts

- `openspec/plans/agent-permissions/PLAN.md`
- `openspec/tasks/001-repair-effective-agent-permissions.md`
- `openspec/results/agent-permissions/RESULT.md`

## Commits Created

- `43a1c5e` `fix(opencode): repair managed agent permissions`
- Evidence artifact commit is created after this file is written and is reported inline.

## Files Changed

- `adapters/opencode/agents/afg-debate.md`
- `adapters/opencode/agents/afergon-ai.md`
- `scripts/register-opencode-agents.sh`
- `tests/model-profiles.test.ts`
- `openspec/plans/agent-permissions/PLAN.md`
- `openspec/tasks/001-repair-effective-agent-permissions.md`
- `openspec/results/agent-permissions/RESULT.md`

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Persist approved policies | `tests/model-profiles.test.ts` | Integration | 76/76 baseline | `afg-debate` failed on `read: deny` | 1/1 after MANIFEST literal change | `afergon-ai` failed on six denied operations and nested write, then 2/2 passed | Shared isolated registrar helper retained GREEN |
| Declaration/projection parity | `tests/model-profiles.test.ts` | Integration | 2/2 persisted-policy tests | Failed with named `afg-debate frontmatter permission` diagnostic | 3/3 after minimum frontmatter literals | Structurally covers nested debate write and scalar primary-agent write | Bounded reader rejects duplicate/unsupported shapes; 12/12 registrar tests passed |
| Partial-registration protection | `tests/model-profiles.test.ts` | Integration | Existing early-exit behavior | Already GREEN safety net; no production change manufactured | Missing `afg-review.md` named and existing config byte-identical | Failure path differs from successful real registration | Registrar spawn/environment setup deduplicated; 12/12 registrar tests passed |

Lowest-sufficient TPP transformations were literal `constant -> constant+` changes for permission values and `constant -> scalar` for `afergon-ai.write`. No registrar control-flow change was needed.

## Work Unit Evidence

| Evidence | Result |
| --- | --- |
| Focused test | `pnpm exec vitest run tests/model-profiles.test.ts --no-file-parallelism -t "OpenCode registrar behavior"` — passed, 12 tests |
| Runtime harness | Real `bash scripts/register-opencode-agents.sh adapters/opencode` executed by Vitest in isolated HOME/XDG/config roots — passed |
| Rollback boundary | Revert implementation commit `43a1c5e`; it contains the two frontmatter blocks, two MANIFEST objects, and their tests as one unit |

## Verification Results

- Step-level checks:
  - Baseline `pnpm build && pnpm exec vitest run tests/model-profiles.test.ts --no-file-parallelism`: passed, 76 tests
  - Debate RED: passed as RED evidence; failed only on persisted `read: deny`
  - Debate GREEN: passed, 1 focused test
  - Primary-agent RED: passed as RED evidence; failed on complete deny-all/nested-write mismatch
  - Both persisted policies GREEN: passed, 2 focused tests
  - Frontmatter parity RED: passed as RED evidence; failed on named stale debate frontmatter
  - Policy and parity GREEN: passed, 3 focused tests
  - Missing-file preservation: passed, 1 focused test
  - Refactored registrar block: passed, 12 tests
- Final checks:
  - Tests: passed — focused file 79/79; full suite 306 passed, 5 skipped
  - Build: passed — `pnpm typecheck && pnpm build`
  - Shell/diff: passed — `bash -n scripts/register-opencode-agents.sh`, `git diff --check`
  - PR: passed — open PR #70 on `docs/agent-permissions-tasks`, `Closes #67`, sole type label `type:bug`

## Blockers or Deviations

- None. Pre-existing OpenSpec task deletions/reorganization remained unstaged and were not included in the atomic implementation commit.

## Notes

- Implementation commit diff: 159 additions, 30 deletions (189 changed lines), below the 400-line threshold.
- No generated `dist/`, lockfile, installer, prompt body, model profile, or unrelated agent policy was changed.
- PR URL: https://github.com/adrian-afergon/afergon-ai/pull/70

## Next Step

Run the canonical Review stage against PR #70; do not merge automatically.
