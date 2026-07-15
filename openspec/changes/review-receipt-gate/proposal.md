# Proposal: Native Content-Bound Review Receipt Gate

## Intent

Unblock lifecycle policy with a repository-owned, fail-closed receipt gate. Maintainers need a trustworthy proof that the exact candidate content was reviewed before commit, push, or PR validation, without using a gate to silently spend a new review budget.

## Scope

### In Scope
- Native `afergon-ai review-start` and `review-validate`-equivalent commands, exposed through the established TypeScript CLI/runtime and documented for pnpm use.
- A versioned receipt binding repository/target identity, base/head or candidate identity, normalized reviewed paths, review evidence, policy version, and terminal state.
- Repository-derived authoritative local storage (prefer Git common directory); validation compares the current candidate and scope, and fails closed for absent, malformed, foreign, stale, non-terminal, or mismatched receipts.
- Lifecycle and CLI contracts: start is post-implementation only; commit/push/PR validation reads and validates only, never creates/replaces review state or budget.
- Focused unit/CLI tests, migration guidance, and a reversible rollout.

### Out of Scope
- Enterprise receipt signing, remote attestation, reviewer identity federation, retention service, or cross-repository sharing.
- Changing OpenSpec/Engram into authoritative receipt stores or touching the metrics worktree.

## Capabilities

### New Capabilities
- `review-receipt-gate`: native lifecycle commands and content-bound, repository-local review receipt validation.

### Modified Capabilities
- None; `openspec/specs/` is not present in this repository.

## Approach

Add a small TypeScript review-receipt domain behind CLI dispatch. Derive identity from Git repository/common-directory state and a deterministic candidate/path manifest; persist an atomically written, schema-versioned receipt beneath the common Git directory. Make `review-start` the sole writer and make `review-validate` a read-only, non-zero validator with actionable mismatch reasons.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `scripts/cli-dispatch.ts` | Modified | Route review commands. |
| `scripts/lib/cli-dispatch-core.ts` | Modified | Define command/help contract. |
| `scripts/lib/review-receipt/` | New | Identity, manifest, receipt, storage, validation. |
| `tests/` | New/Modified | Unit and process-level CLI contracts. |
| `README.md` | Modified | Lifecycle, migration, and rollback instructions. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Git/worktree identity edge cases | Med | Isolated worktree/common-dir tests; fail closed. |
| Slice exceeds review budget | High | Stacked-to-main work units, each ≤400 changed lines. |
| Receipt bypass through ambiguous scope | Med | Canonical paths and deterministic manifest tests. |

## Rollback Plan

Revert the command/receipt slices and remove only this repository's common-dir receipt namespace. Existing gates remain denied until a valid native replacement is installed; no source content or OpenSpec/Engram mirror is mutated.

## Dependencies

- Existing Node TypeScript runtime, pnpm build, and Git executable.

## Success Criteria

- [ ] `review-start` writes a terminal receipt only after post-implementation review evidence is supplied.
- [ ] `review-validate` succeeds only for the same repository, candidate, and reviewed paths; missing or changed/scope-changed content exits non-zero.
- [ ] Validation cannot create or refresh a receipt/review budget.
- [ ] Tests cover receipt schema, storage, lifecycle separation, and CLI exit contracts.
