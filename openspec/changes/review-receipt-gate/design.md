# Design: Review Receipt Gate

## Technical Approach

Add commands behind dispatcher. Both derive the *staged index candidate*; `review-start` writes terminal evidence, while `review-validate` rederives and reads. Common-dir storage is authoritative; OpenSpec and Engram are mirrors.

## Architecture Decisions

| Decision | Alternatives | Rationale |
|---|---|---|
| Bind `HEAD` + staged index delta | Worktree/untracked snapshot; caller digest/paths | A commit uses index; covers staged adds/modifies/deletes, modes, symlink blobs. Unborn HEAD, unmerged, intent-to-add, or empty delta fail closed. |
| Separate candidate and scope digests | One path/content digest | Canonical entries yield scope (paths/kinds) and candidate (paths, modes, blobs, `HEAD`) digests, preserving `scope-changed` versus `candidate-changed`. |
| Common-dir, containment-checked receipt | Repository-root or per-worktree file | Real common-dir identity supports linked worktrees without trusting administrative paths. |
| Isolated Git override environment | Inherit all Git environment; disable all user config | Clone environment, delete authority/config injection, retain ordinary credentials and default safe configuration. |
| Native entrypoint and pure modules | Shell implementation | Extends `cli-dispatch.ts` argv-array routing and keeps Git/storage logic testable. |

## Data Flow

```text
CLI -> dispatcher -> receipt entrypoint -> sanitized Git discovery -> canonical index manifest
                                                              |                 |
review-start: terminal evidence only -------------------------+--> atomic receipt
review-validate: rederive + read-only comparison -------------> result / exit
```

## Interfaces / Contracts

```text
afergon-ai review-start --evidence <evidence.json> [--json]
afergon-ai review-validate [--json]
```

Unknown, duplicate, positional, or malformed options exit 1. Evidence is UTF-8 JSON containing only `schemaVersion`, terminal `outcome: "approved"`, and nonempty `summary`; candidate/digest/path/scope assertions are rejected. Receipt: normalized evidence/SHA-256, versions, terminal flag, real-common-dir ID, `headOid`, digests, manifest.

The Git adapter uses fixed argv-only (`shell: false`) commands, non-bare cwd, `--`, bounded output/timeouts, and never executes candidate files. Each child clones `process.env`, then deletes authority injection: `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY`, `GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_CEILING_DIRECTORIES`, `GIT_DISCOVERY_ACROSS_FILESYSTEM`, `GIT_IMPLICIT_WORK_TREE`; and config injection: `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `GIT_CONFIG_NOSYSTEM`, `GIT_CONFIG_COUNT`, every `GIT_CONFIG_KEY_*`/`GIT_CONFIG_VALUE_*`. It retains `PATH`, `HOME`, SSH/askpass/credential variables, locale, and default system/global/repository configuration.

The manifest uses `HEAD`, cached diff/index records, and staged blob IDs; sorted entries are `{path, change, oldMode, newMode, blobOid}`. Deletions lack a new blob; symlinks are `120000`; mode changes bind mode. Domain-prefixed JSON is SHA-256 hashed. Git/schema/decode failure is `git-unavailable`/non-zero.

Default output is one stderr diagnostic; `--json` emits exactly one result object to stdout. Validation requires matching identity, versions, terminal evidence, scope, and candidate; it creates, repairs, refreshes, or spends nothing.

## File Changes

| File | Action | Description |
|---|---|---|
| `scripts/lib/review-receipt/{git,manifest,receipt,storage,validation}.ts` | Create | Sanitized Git adapter, index model, schemas, containment-safe atomic store, validator. |
| `scripts/review-receipt.ts` | Create | CLI parsing/output boundary. |
| `scripts/{cli-dispatch.ts,lib/cli-dispatch-core.ts}` | Modify | Explicit command routing/help. |
| `tsconfig.json` | Modify | Compile the new runtime sources. |
| `tests/{review-receipt,review-receipt-cli,tui-dispatch}.test.ts` | Create/Modify | RED domain, integration, and dispatch contracts. |
| `README.md` | Modify | Lifecycle, local authority, rollback. |

## Storage and Failure Safety

Resolve and `realpath` the common dir, then use `<real-common-dir>/afergon-ai/review-receipts/v1`. Before read/write/create, `lstat` each existing component: real directory with `realpath` beneath common dir. Symlink, non-directory, missing parent, or containment mismatch fails closed. Receipt/temp files are regular non-symlinks. Create `0700` directories and exclusive `0600` temp; fsync, in-directory rename, then directory fsync. Validation never repairs corruption.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Canonical index manifests, modes, symlink blobs, evidence rejection, reason precedence | Fixture Git records; RED first. |
| Integration | Staged add/modify/delete/mode/symlink; divergence; linked worktree; containment | Temporary repos/indexes; escaping parent/intermediate symlinks deny. |
| CLI | Grammar, output/exits, isolated child environment, built dispatch | `spawnSync` against `dist`; hostile selection/object/index/discovery and config override values cannot alter receipt repository ID, manifest/digests, or validation result. |

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A — no classification/execution | Paths are index metadata only | None |
| Git repository selection | Applicable | Sanitized environment and cwd-derived real common dir; every Git child deletes repository/index/worktree/common-dir/object/discovery and config override variables while preserving credentials/default config; outside/bare/mismatch deny | `git -C`, relative/absolute/nested cwd, linked worktree; process-level `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM` (and numbered/NOSYSTEM) hostile values cannot change repository ID, manifest/digests, or start/validate outcome |
| Commit state | Applicable | Bind staged index only; no candidate/any mismatch denies | staged add/modify/delete, `commit -a`-equivalent divergence, empty index, mode/symlink, index/worktree divergence |
| Push state | N/A — no push | No ref/destination handling | None |
| PR commands | N/A — no PR tooling | No composed PR command | None |

## Migration / Rollout

No migration required. Stack ≤400-line slices: (1) RED index manifest/contracts, (2) RED containment-safe storage and validation, (3) CLI/dispatcher/docs. Rollback reverts slices and removes only the checked common-dir namespace; absence remains denied.

## Open Questions

- [ ] None for the non-bare pre-commit MVP.
