# Plan: Remediate Effective Managed Agent Permissions for Canonical Review

- **Source Task**: `openspec/tasks/001-repair-effective-agent-permissions.md`
- **Source Spec(s)**: `openspec/specs/agent-permissions/spec-01-effective-agent-permission-repair.md`
- **State**: ready
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed

## Summary

Complete the bounded remediation of PR #70 without changing the approved policies: reconcile one canonical OpenSpec task/spec/plan/result set, add direct evaluation evidence for the bounded `afg-debate` write rule, cover the two named missing-file variants, verify the repository, record every delivered commit, then push the existing branch and correct PR metadata while preserving its label set except for enforcing `type:bug` as the sole `type:*` label.

## Planning Scope

Expected implementation changes are limited to:

- `tests/model-profiles.test.ts` — add a test-local OpenCode-compatible write-rule evaluator, direct allow/deny assertions over the persisted `afg-debate` policy, and two named missing-file atomicity variants.
- `openspec/tasks/PROJECT-TASKS.md`, `openspec/tasks/001-repair-effective-agent-permissions.md`, `openspec/specs/agent-permissions/spec-01-effective-agent-permission-repair.md`, and this plan — retain one active canonical task/spec/plan chain and remove superseded task inputs from the delivered artifact set.
- `openspec/results/agent-permissions/RESULT.md` — replace the rejected re-entry result with final remediation, verification, commit, and PR evidence.
- PR #70 metadata — update only the title/body linkage and, if needed, its `type:*` labels; reuse its current head branch.

The approved frontmatter and MANIFEST policies are already present. Do not modify `adapters/opencode/agents/afg-debate.md`, `adapters/opencode/agents/afergon-ai.md`, or `scripts/register-opencode-agents.sh` unless a focused test proves they have drifted from the canonical spec. Do not change unrelated agents, generated `dist/`, lockfiles, prompts, installer behavior, models, or PR code scope.

## Design Rule Alignment

- Follow the repository's Gherkin-first and strict `RED -> GREEN (lowest TPP) -> TRIANGULATE -> REFACTOR` workflow from `README.md` and `adapters/opencode/agents/afg-implement.md`.
- Reuse the existing Vitest registrar block, `copyManagedAgents`, temporary XDG roots, `runRegistrar`, and real `scripts/register-opencode-agents.sh`; do not introduce a second registrar harness or a new matcher dependency.
- Compare complete permission objects for declaration/MANIFEST/persisted parity; selected-key checks are insufficient for privilege-drift detection.
- Evaluate bounded writes from the persisted permission object using OpenCode semantics: normalize path separators, wildcard-match anchored patterns, preserve rule order, and select the last matching rule. With default `"*": "deny"` before the specific allow pattern, the matching debate summary is allowed and other writes are denied.
- Treat already-correct runtime behavior as characterization/safety-net evidence; do not manufacture a production RED or make a no-op source change merely to satisfy TDD ceremony.
- Follow the implementation agent's per-work-unit commit policy, stage explicitly around pre-existing OpenSpec changes, and never edit generated `dist/`.

## Assumptions

None.

## Design Tensions

None.

## Vertical Slicing Decision

Not needed. The remaining work is a small, coupled remediation over one test suite, one canonical artifact chain, and one existing PR. Splitting it would allow tests, result evidence, or PR metadata to disagree temporarily at review handoff. Keep local commits reviewable, but push them together only after final verification.

## Execution Strategy

Use sequential execution because canonical inputs must be established before Implement re-entry, test evidence must exist before RESULT is finalized, and commit SHAs must exist before delivery evidence is recorded. Work in three explicit units: (1) canonical replanning artifacts, (2) bounded permission and missing-file tests, and (3) final RESULT/plan evidence. Verify all units before a single non-force push, then update and re-read PR #70 metadata. Do not run PR mutations until the branch is verified and pushed.

## Implementation Steps

- [x] **0. Re-establish the safety boundary.** Confirm the worktree is `/Users/adrian/projects/afergon/afergon-ai-agent-permissions`, the branch is PR #70's open head branch, and the base/remote are unchanged. Record `git status --short`, `git diff --name-status`, `git log --oneline -10`, and a read-only `gh pr view 70 --json title,body,labels,headRefName,state,url,commits,files`. Snapshot every current PR label by name; preserve all non-`type:*` labels. Do not discard or sweep pre-existing OpenSpec reconciliation changes.
- [x] **1. Reconcile the canonical active artifacts.** Keep exactly one active chain: `PROJECT-TASKS.md` -> `001-repair-effective-agent-permissions.md` -> `spec-01-effective-agent-permission-repair.md` -> `PLAN.md` -> `RESULT.md`. Ensure every `Source Task`, `Source Spec(s)`, plan, and result reference resolves and uses the canonical paths above. Remove the superseded split task files from the delivered PR and do not stage timestamped `*-old-*` backup copies as active or archival deliverables. Keep the spec `ready` and this plan executable during implementation; replace the stale `invalid-input` RESULT only in the final evidence unit. Commit the canonical input reconciliation separately as `docs(openspec): replan agent permission remediation`.
- [ ] **2. Baseline the effective-policy contract.** Run the focused registrar suite before test edits and confirm the complete `afg-debate` and `afergon-ai` persisted-policy and frontmatter-parity assertions pass. Capture the approved policies and unrelated-agent/non-permission metadata as the no-change boundary. If the baseline fails because the approved source policies drifted, stop and report the contradiction rather than broadening scope silently.
- [ ] **3. Add direct bounded-write evaluation evidence.** In `tests/model-profiles.test.ts`, add a bounded test-local evaluator over `config.agent["afg-debate"].permission.write`. It must reject unsupported shapes/effects, normalize `\` to `/`, convert OpenCode `*`/`?` wildcards to anchored matching, iterate `Object.entries` in persisted order, and return the last matching effect (default `ask` only when no rule matches). Add two separately named tests that run the real isolated registrar and assert `openspec/debate/debate-summary-agent-permissions.md` evaluates to `allow` while `openspec/debate/notes.md` evaluates to `deny`. Keep the existing exact-object assertions so evaluator coverage cannot hide an added or reordered privilege.
- [ ] **4. Add both required-file omission variants.** Refactor the current single missing-`afg-review.md` test into a shared local assertion or a named parameterized table that produces two independently reported cases: omitted `afg-debate.md` and omitted `afergon-ai.md`. For each case, copy every required managed file, remove only the named file, seed `opencode.json` with distinctive pre-existing bytes, run the real registrar, assert status `0`, assert stdout identifies exactly that omitted filename, and compare the resulting file bytes (Buffer or exact UTF-8 bytes) with the original. Do not change registrar control flow if both characterization cases are already GREEN.
- [ ] **5. Triangulate and refactor tests.** Run each new direct evaluator and omission case independently, then the complete `OpenCode registrar behavior` block. Keep helper scope local, diagnostics agent/representation/path-specific, and the scalar `afergon-ai.write` versus nested `afg-debate.write` distinction explicit. Commit only the intended test change as `test(opencode): cover permission remediation edge cases`.
- [ ] **6. Verify scope and repository health.** Run every command in Verification. Inspect the branch diff against its base and the staged/unstaged diff. Confirm policy source files are unchanged by this remediation, unrelated agent policy/metadata remains unchanged, no generated or dependency artifacts appear, and only the canonical OpenSpec set plus the focused test change are newly delivered. Resolve any failure before delivery; do not weaken assertions.
- [ ] **7. Finalize canonical delivery evidence.** Rewrite `openspec/results/agent-permissions/RESULT.md` with a descriptive H1 title, canonical plan reference, completed remediation steps, direct allow/deny and both omission-case evidence, exact final verification results, changed files, PR URL, and all commits delivered by PR #70 as reported by Git/GitHub. Record exact SHAs and subjects for every preceding implementation/correction commit; identify the commit containing RESULT by its stable subject to avoid impossible self-hash recursion. Update this plan's execution checkboxes/state only as required by the implementation contract. Commit this evidence as `docs(openspec): record permission review remediation`, then verify `git log` and RESULT agree.
- [ ] **8. Push the verified existing branch.** Confirm PR #70 is still open and its `headRefName` equals the current branch, the working tree contains no unintended changes, and local commits are ahead of that branch only. Push normally to the existing remote head; do not force-push, create another branch/PR, merge, or push any untracked `*-old-*` backups.
- [ ] **9. Correct PR #70 metadata while preserving labels.** Set the title exactly to `fix(opencode): repair managed agent permissions`. Update the body so it contains `Closes #71` and `Refs #67`, removes the existing closing linkage to #67, and contains no closing keyword (`close(s|d)`, `fix(es|ed)`, or `resolve(s|d)`) applied to #67. Preserve the existing summary/test evidence where accurate. Preserve all snapshotted non-`type:*` labels; if label correction is necessary, modify only `type:*` labels so the final type-label set is exactly `type:bug`. If `type:bug` is already the sole type label, perform no label mutation.
- [ ] **10. Re-read the delivered handoff.** Use `gh pr view 70 --json title,body,labels,headRefName,state,url,commits,files` and local Git evidence to prove the exact title, correct closing/nonclosing issue linkage, open state, existing head reuse, preserved non-type labels, sole `type:bug` type label, canonical artifact files, test commit(s), and RESULT commit inventory. Record this final read-only evidence in the implementation response; do not merge PR #70.

## Interfaces and Technical Contracts

Approved normalized policies:

- `afg-debate.permission`: `bash`, `edit`, `glob`, `grep`, and `webfetch` are `deny`; `read` is `allow`; `write` is `{ "*": "deny", "openspec/debate/debate-summary*.md": "allow" }` in that order.
- `afergon-ai.permission`: `bash`, `edit`, `glob`, `grep`, `read`, and scalar `write` are `allow`; `webfetch` is `deny`.

Test-local evaluation contract:

- Input: the complete persisted `afg-debate.permission.write` map and one target path.
- Matching: normalize separators to `/`; anchor the entire target; support OpenCode `*` as any character sequence and `?` as one character; preserve object entry order; the last matching rule wins.
- Output: `allow`, `deny`, or fallback `ask`; the two canonical targets must return `allow` and `deny`, respectively.
- Scope: test helper only; no exported production API or new package dependency.

Missing-file contract:

- Inputs: otherwise complete isolated managed-agent directory, one omitted required filename, and a pre-existing `opencode.json` byte sequence.
- Variants: exactly `afg-debate.md` and `afergon-ai.md`.
- Output: registrar status `0`, stdout naming the exact omitted file, and byte-for-byte unchanged `opencode.json`.

Canonical artifact contract:

- Active set: `openspec/tasks/PROJECT-TASKS.md`, canonical task, canonical ready spec, this plan, and canonical RESULT.
- Superseded split tasks and timestamped backups are not delivered as active inputs.
- RESULT enumerates the complete PR commit history relevant to implementation/correction and uses a stable subject for its own containing commit.

PR contract:

- Existing PR/head only: #70 on its current head branch, open and unmerged.
- Exact title: `fix(opencode): repair managed agent permissions`.
- Body linkage: `Closes #71` and `Refs #67`; no closing keyword targets #67.
- Labels: preserve all non-type labels; complete `type:*` set equals `["type:bug"]`.

## Acceptance Criteria

- [ ] Both named frontmatter declarations, MANIFEST entries, and persisted complete permission objects remain exactly equal to the approved policies.
- [ ] Direct evaluation of the persisted `afg-debate` write map allows `openspec/debate/debate-summary-agent-permissions.md` and denies `openspec/debate/notes.md`.
- [ ] Separate missing-`afg-debate.md` and missing-`afergon-ai.md` test cases name the exact file and preserve `opencode.json` bytes.
- [ ] Complete-object parity tests still detect added, removed, or changed permissions with focused diagnostics.
- [ ] Unrelated agent permissions/metadata and named-agent non-permission metadata remain unchanged.
- [ ] The PR delivers one resolvable canonical task/spec/plan/result chain and no superseded task or timestamped backup as an active input.
- [ ] RESULT accurately records remediation evidence and all delivered implementation/correction commits without a stale or impossible SHA claim.
- [ ] Focused tests, full tests, typecheck, build, shell syntax, and diff checks pass.
- [ ] The existing branch is pushed without force and PR #70 remains open on that head.
- [ ] PR #70 has the exact required title, `Closes #71`, nonclosing `Refs #67`, no closing keyword for #67, preserved non-type labels, and exactly one type label: `type:bug`.

## Verification

- [ ] Tests: `pnpm build && pnpm exec vitest run tests/model-profiles.test.ts --no-file-parallelism -t "OpenCode registrar behavior"`
- [ ] Tests: `pnpm exec vitest run tests/model-profiles.test.ts --no-file-parallelism`
- [ ] Tests: `pnpm test`
- [ ] Build: `pnpm typecheck && pnpm build`
- [ ] Additional Evidence: `bash -n scripts/register-opencode-agents.sh && git diff --check`
- [ ] Additional Evidence: `git status --short`, `git diff --stat`, `git diff --name-status`, `git diff <base>...HEAD --stat`, and focused diffs prove bounded scope and no generated/unrelated changes.
- [ ] Additional Evidence: canonical-path inspection proves every source reference resolves and superseded split tasks/timestamped backups are absent from the delivered PR file set.
- [ ] Additional Evidence: `git log --oneline <base>..HEAD` and `gh pr view 70 --json commits,files` agree with RESULT's delivered-commit/file inventory.
- [ ] Additional Evidence: final `gh pr view 70 --json title,body,labels,headRefName,state,url` proves title, linkage, branch reuse, open state, non-type-label preservation, and sole `type:bug`.
- [ ] Rule Compliance: RESULT records baseline, focused per-case runs, full verification, characterization-vs-RED status, lowest-sufficient changes, commit boundaries, and PR evidence.

## Open Questions

None.

## Dependencies

- Existing Vitest registrar suite, temporary XDG helpers, and real Bash/Python registrar flow.
- OpenCode permission ordering/wildcard semantics represented by the persisted policy object.
- pnpm 11.13.0, TypeScript 5.9, Vitest 4.1, Bash, and Python 3.
- Approved issue #71, parent issue #67, open PR #70, authenticated `git`/`gh`, and later authorization for implementation, commit, push, and PR mutation.

## Risks and Watchouts

- An evaluator that only checks whether the allow key exists does not prove effective behavior; evaluate the concrete target with last-match precedence.
- JavaScript object insertion order is part of the persisted rule-order test here; do not sort the write map before evaluation.
- A broad glob implementation or new dependency would exceed the bounded need; mirror only documented OpenCode wildcard semantics and reject unsupported values.
- Parameterizing missing files must still emit two distinct named cases and remove exactly one file per run.
- The worktree contains pre-existing canonical reconciliation changes and untracked timestamped backups; stage by explicit path and verify the PR file list before pushing.
- PR #70 currently closes #67; body editing must replace that linkage, not append contradictory text.
- PR #70 already has `type:bug`; avoid unnecessary label churn and preserve any non-type label added concurrently.
- RESULT cannot contain the SHA of the commit that contains RESULT without changing that SHA; identify that containing commit by stable subject and verify its actual SHA externally.
- If PR head/state, required files, policy schema, registrar behavior, or canonical spec differs from this plan, stop for replanning rather than silently broadening scope.

## Completion Condition

All implementation checkboxes are complete; the approved policies remain unchanged and fully covered; direct bounded-write and both named omission variants pass; the canonical active artifact chain is singular and resolvable; RESULT and Git/GitHub delivery evidence agree; all verification succeeds; verified commits are pushed normally to PR #70's existing head; and PR #70 remains open with the exact required title/linkage and preserved labels with `type:bug` as its sole type label.
