# Plan: Repair Effective Managed Agent Permissions

- **Source Task**: `openspec/tasks/001-repair-effective-agent-permissions.md`
- **Source Spec(s)**: `openspec/specs/agent-permissions/spec-01-effective-agent-permission-repair.md`
- **State**: completed
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed

## Summary

Repair the approved `afg-debate` and `afergon-ai` policies in agent frontmatter and the registrar MANIFEST, then execute the real registrar in an isolated OpenCode configuration and compare complete persisted permission objects. Preserve all-or-nothing registration, unrelated agents, and PR #70's issue linkage.

## Planning Scope

Expected implementation files:

- `adapters/opencode/agents/afg-debate.md` — change only `permission.read` to `allow`.
- `adapters/opencode/agents/afergon-ai.md` — replace the deny-all policy with the approved complete policy.
- `scripts/register-opencode-agents.sh` — align only the two named MANIFEST permission objects.
- `tests/model-profiles.test.ts` — extend the existing registrar suite and temporary-XDG harness.
- `openspec/results/agent-permissions/RESULT.md` — record implementation, TDD/TPP, verification, commits, deviations, and PR evidence.

No installer, prompt, model-profile, metadata, generated `dist/`, lockfile, or unrelated-agent changes are planned.

## Design Rule Alignment

- Follow the repository's Gherkin-first and strict `RED -> GREEN (lowest TPP) -> TRIANGULATE -> REFACTOR` rules from `README.md` and `adapters/opencode/agents/afg-implement.md`.
- Treat declaration, MANIFEST projection, and persisted `opencode.json` as one atomic contract.
- Reuse `tests/model-profiles.test.ts`, `copyManagedAgents`, temporary XDG roots, the real Bash registrar, and `readJson`; do not create a parallel harness.
- Deep-compare complete objects and include the agent/representation in assertion messages.
- Avoid a new YAML dependency. A test-local reader may normalize only the bounded permission subset used here (scalar keys and the nested `write` map) and must reject duplicate or unsupported shapes.
- Do not edit generated `dist/`; build output is verification only.

## Assumptions

None.

## Design Tensions

None.

## Vertical Slicing Decision

Not needed. The expected diff is well below the repository's roughly 400-line review threshold, while splitting declarations, MANIFEST, and output tests would temporarily create an inconsistent effective policy. If the implementation approaches 400 changed lines, stop and replan rather than splitting these coupled representations across PRs.

## Execution Strategy

Use sequential execution because each strict-TDD step changes shared policy representations and establishes the next RED. Keep all source/config updates and tests as one atomic implementation work unit; do not publish a partial representation. Sequence: baseline, failing persisted debate policy, minimum MANIFEST change, failing structurally different primary-agent policy, minimum MANIFEST change, failing declaration/projection parity, minimum frontmatter changes, preservation checks, refactor, full verification, then PR #70 reuse.

## Implementation Steps

- [x] **0. Baseline and scope safety.** Record `git status --short`, `git diff --stat`, and `git diff --name-only` so existing OpenSpec work is not mistaken for implementation output. Run `pnpm build && pnpm exec vitest run tests/model-profiles.test.ts --no-file-parallelism`. Capture all unrelated agent permission blocks and the two named agents' non-permission frontmatter/MANIFEST fields as the comparison boundary.
- [x] **1. RED — persisted `afg-debate` policy.** In `tests/model-profiles.test.ts`, add approved-policy fixtures and an isolated registrar helper that creates `${XDG_CONFIG_HOME}/opencode`, copies all required managed agents, seeds minimal `opencode.json`, runs `bash scripts/register-opencode-agents.sh adapters/opencode` noninteractively, and reads the output. Add one focused test deep-comparing the complete persisted `agent["afg-debate"].permission`; prove it fails specifically on current `read: deny`.
- [x] **2. GREEN (TPP constant-to-constant+) — debate projection.** Change only `MANIFEST["afg-debate"].permission.read` to `allow`. Re-run the focused test to GREEN while retaining denies for `bash`, `edit`, `glob`, `grep`, `webfetch` and the exact write map `{"*":"deny","openspec/debate/debate-summary*.md":"allow"}`.
- [x] **3. TRIANGULATE/RED — structurally different `afergon-ai` policy.** Through the same real registrar helper, add a focused complete-object assertion requiring scalar `allow` for `bash`, `edit`, `glob`, `grep`, `read`, and `write`, and `deny` for `webfetch`. Prove RED against the deny-all/nested-write policy; minimally update only that MANIFEST permission object and re-run both policy tests to GREEN.
- [x] **4. TRIANGULATE/RED — declaration/projection parity.** Add a bounded test-local frontmatter permission reader. For each named agent, compare the complete normalized declaration to its approved fixture and persisted object, with named diagnostics. Prove RED because checked-in frontmatter remains stale; then minimally update both frontmatter blocks to GREEN. This catches any added, removed, or changed permission in either representation.
- [x] **5. Preserve edge/failure behavior.** Strengthen the existing missing-file registrar test: copy all required agents, remove exactly one, seed an existing registry/sentinel, run registration, assert stdout names the missing file, and assert `opencode.json` remains byte-for-byte unchanged. Assert `afg-debate.write` contains exactly default deny plus the single debate-summary allow pattern, so no other target has an allow rule. If current code already passes this preservation test, record safety-net evidence instead of manufacturing a production change.
- [x] **6. REFACTOR tests only.** Deduplicate registrar spawn/environment/setup logic within `tests/model-profiles.test.ts`; keep helpers local unless demonstrated reuse requires otherwise. Re-run the complete registrar describe block after each refactor. Do not refactor production registrar flow or relocate MANIFEST data.
- [x] **7. Scope and diff-size review.** Run `git diff --check`; inspect stat, names, and focused diffs. Confirm production edits are limited to two frontmatter permission blocks and two MANIFEST permission objects, all unrelated policies/metadata are byte-identical, no lockfile/`dist/` changes exist, and total change remains comfortably under 400 lines. Roll back or replan any broader deviation before commit.
- [x] **8. Verify and record one atomic work unit.** Run every command in Verification. Write `openspec/results/agent-permissions/RESULT.md` with RED/GREEN/TRIANGULATE/REFACTOR evidence and any already-green preservation evidence. Commit only intended implementation/test/result files as `fix(opencode): repair managed agent permissions`; do not sweep pre-existing worktree changes into the commit.
- [x] **9. Reuse PR #70 after verified implementation and only when authorized.** Push to its existing head branch; do not open another PR. First inspect `gh pr view 70 --json body,labels,headRefName,state` and require it to remain open on the expected branch. Preserve the exact `Closes #67` body linkage. Replace `type:docs` with `type:bug`, removing any other `type:*` label that appeared, so exactly one type label remains: `type:bug`. Refresh stale implementation summary/test-plan text only if needed and never remove `Closes #67`. Verify with `gh pr view 70 --json body,labels,url,headRefName,state`.

## Interfaces and Technical Contracts

Approved normalized policies:

- `afg-debate.permission`: `bash`, `edit`, `glob`, `grep`, `webfetch` = `deny`; `read` = `allow`; `write` = `{ "*": "deny", "openspec/debate/debate-summary*.md": "allow" }`.
- `afergon-ai.permission`: `bash`, `edit`, `glob`, `grep`, `read`, `write` = scalar `allow`; `webfetch` = `deny`.

Registrar test contract:

- Input: repository adapter path; isolated `HOME`, `XDG_CONFIG_HOME`, `AFERGON_AI_CONFIG_DIR`; all eight `REQUIRED_AGENT_FILES` under `<xdg>/opencode/agents`.
- Execution: `spawnSync("bash", [registerScript, adapterPath], ...)`, noninteractive, 10-second timeout.
- Success: status `0`; both complete persisted policies equal approved fixtures and normalized declarations.
- Failure preservation: when exactly one required file is absent, stdout identifies it and existing config bytes do not change.
- Drift diagnostics: assertions name `afg-debate`/`afergon-ai` and `frontmatter`/`persisted`.

No production signature or registrar CLI change is required.

## Acceptance Criteria

- [x] `afg-debate` declaration and MANIFEST allow read, retain all specified denies, and retain exactly one bounded write exception over default deny.
- [x] `afergon-ai` declaration and MANIFEST allow the six specified operations, use scalar `write: allow`, and deny webfetch.
- [x] A focused Vitest contract executes the real registrar with all managed files in an isolated config and deep-compares both complete persisted policies with fixtures and declarations.
- [x] Added, removed, or changed permissions fail with the affected agent and representation visible.
- [x] Removing one required file reports it and leaves a pre-existing registry byte-for-byte unchanged.
- [x] No unrelated permission/metadata or named-agent non-permission metadata changes.
- [x] The implementation remains under the approximately 400-line threshold and atomic in PR #70.
- [x] PR #70 retains `Closes #67` and exactly one `type:*` label, `type:bug`.

## Verification

- [x] Tests: `pnpm build && pnpm exec vitest run tests/model-profiles.test.ts --no-file-parallelism`
- [x] Tests: `pnpm test`
- [x] Build: `pnpm typecheck && pnpm build`
- [x] Additional Evidence: `bash -n scripts/register-opencode-agents.sh && git diff --check && git diff --stat && git diff --name-only`
- [x] Additional Evidence: focused diff comparison proves unrelated agent policies/metadata and named-agent non-permission metadata are unchanged.
- [x] Additional Evidence: after authorized reuse, `gh pr view 70 --json body,labels,url,headRefName,state` proves existing PR/head reuse, `Closes #67`, and filtered `type:*` labels exactly `["type:bug"]`.
- [x] Rule Compliance: RESULT records expected REDs, lowest-sufficient literal TPP changes, two structurally different policy scenarios plus the missing-file failure case, GREEN after each step, and refactor verification.

## Open Questions

None.

## Dependencies

- Existing Vitest registrar suite and helpers.
- Bash and Python 3 used by the registrar.
- pnpm 11.13.0, TypeScript, and the existing build/test lifecycle.
- Open PR #70 and later GitHub CLI authorization for push/metadata actions.

## Risks and Watchouts

- Selected-key assertions could miss added privilege; deep-compare complete objects.
- `afergon-ai.write` is scalar while `afg-debate.write` is nested; preserve this structural difference.
- Agent files supply prompt bodies, but MANIFEST supplies persisted permission; copied frontmatter alone is not effective-registration proof.
- `looks_managed` and model projection can affect seeded named entries; use fresh named entries for happy paths and a neutral unrelated sentinel for missing-file atomicity.
- OpenSpec task/spec edits already exist in the worktree; stage explicitly.
- A RED caused by missing Bash/Python/setup is invalid evidence; repair the environment before source edits.
- If schema, required files, registrar path, test framework, or execution structure differs, stop and return to Plan rather than silently redesign.

Rollback/deviation boundary:

- Before commit, restore the two frontmatter blocks, two MANIFEST objects, and new tests together.
- After commit but before merge, revert the single atomic implementation commit; never hand-revert only one representation.
- If implementation is abandoned after PR metadata changes, restore `type:docs` only after confirming PR #70 is documentation-only again; retain `Closes #67` unless explicitly directed otherwise.

## Completion Condition

All checkboxes complete; declarations, MANIFEST, and persisted output equal the approved policies; focused/full verification passes; unrelated values remain unchanged; diff stays below threshold; RESULT contains TDD/TPP and deviation evidence; and, when delivery is authorized, PR #70 is reused with `Closes #67` intact and exactly `type:bug` as its type label.
