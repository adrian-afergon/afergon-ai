# Tasks: Review Receipt Gate

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 900–1,200 authored lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3, stacked to main |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Git isolation and staged canonical manifest | PR 1 | `pnpm vitest run tests/review-receipt.test.ts` | temp non-bare repo with linked worktree and hostile Git config env | new `git.ts`, `manifest.ts`, and domain tests |
| 2 | Receipt schema, containment-safe atomic storage, read-only validation | PR 2 | `pnpm vitest run tests/review-receipt.test.ts` | temp common-dir receipt plus symlink/corruption/divergence cases | `receipt.ts`, `storage.ts`, `validation.ts`, related tests |
| 3 | CLI lifecycle, dispatch, docs, built runtime | PR 3 | `pnpm test && pnpm typecheck && pnpm build` | `pnpm exec tsx scripts/cli-dispatch.ts review-start/review-validate` | CLI/docs/tsconfig changes and process tests |

## Phase 1: Git and Manifest (PR 1)

- [x] 1.1 RED: add `tests/review-receipt.test.ts` fixtures for staged add/modify/delete, modes, symlinks, empty/unborn/unmerged/index-worktree divergence, and `HEAD` binding.
- [x] 1.2 RED: add process tests proving `GIT_DIR`, index/worktree/common/object/discovery and `GIT_CONFIG_*` overrides (including numbered/NOSYSTEM) cannot redirect identity, manifest, or outcome while credentials survive.
- [x] 1.3 GREEN: create `scripts/lib/review-receipt/git.ts` with fixed argv, `shell:false`, sanitized cloned env, non-bare cwd, bounded output/timeouts, and fail-closed errors.
- [x] 1.4 GREEN: create `scripts/lib/review-receipt/manifest.ts` with sorted repository-relative entries, modes/blob OIDs, scope/candidate SHA-256 digests, real common-dir identity, and linked-worktree support.

## Phase 2: Receipt, Storage, Validation (PR 2)

- [ ] 2.1 RED: add tests for evidence-only approved JSON, rejected assertions, schema/policy/version failures, missing/foreign/non-terminal evidence, candidate/scope mismatch and reason precedence.
- [ ] 2.2 RED: add containment/atomic tests for missing or symlinked intermediates, escaping common-dir paths, non-regular receipt/temp files, permissions, fsync/rename, corruption, and validation no-write snapshots.
- [ ] 2.3 GREEN: create `receipt.ts` for strict versioned evidence normalization and receipt encoding; create `storage.ts` for realpath containment, `0700`/`0600`, exclusive temp, fsync, atomic rename, and read-only reads.
- [ ] 2.4 GREEN: create `validation.ts` for fail-closed matching of repository, versions, terminal evidence, scope, and candidate without bootstrap/repair/budget writes.

## Phase 3: CLI, Integration, Documentation (PR 3)

- [ ] 3.1 RED: add `tests/review-receipt-cli.test.ts` and `tests/tui-dispatch.test.ts` coverage for option grammar, JSON/stdout versus stderr, exit codes, explicit start, validate read-only, and unknown/duplicate/positional options.
- [ ] 3.2 GREEN: create `scripts/review-receipt.ts`; wire explicit `review-start`/`review-validate` routing and help in `scripts/cli-dispatch.ts` and `scripts/lib/cli-dispatch-core.ts`; update `tsconfig.json`/runtime config.
- [ ] 3.3 Update `README.md` with pnpm lifecycle, local common-dir authority, migration/rollback, and fail-closed semantics; verify no OpenSpec/Engram receipt writes.
- [ ] 3.4 Run focused process tests, then `pnpm typecheck`, `pnpm test`, `pnpm build`, and built-runtime health checks.
