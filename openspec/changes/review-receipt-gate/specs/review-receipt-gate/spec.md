# Review Receipt Gate Specification

## Purpose

Provide a repository-owned, fail-closed CLI gate proving that the exact candidate and reviewed scope received terminal review. OpenSpec and Engram are mirrors only.

## Requirements

### Requirement: Explicit post-implementation review start

`review-start` MUST be explicitly invoked after implementation and MUST be the only command that creates or replaces a receipt or consumes review budget. Its input MUST contain terminal evidence only; it MUST NOT accept or assert candidate identity/content or reviewed scope. It MUST derive and store canonical staged/index candidate and normalized scope bindings.

#### Scenario: Valid review start

- GIVEN implementation is complete and the command is explicitly invoked with terminal evidence
- WHEN `review-start` receives valid terminal evidence
- THEN it derives the staged/index candidate and normalized scope, then atomically writes one repository-local receipt containing all required bindings

#### Scenario: Start without terminal evidence

- GIVEN the command is invoked before review is terminal or evidence is absent
- WHEN `review-start` is executed
- THEN it exits non-zero with a reason identifying non-terminal or evidence-missing input and writes nothing

#### Scenario: Caller cannot select the candidate

- GIVEN terminal evidence is supplied with candidate, digest, path, or scope assertions
- WHEN `review-start` is executed
- THEN it rejects those assertions and does not use them as receipt bindings

### Requirement: Canonical candidate and scope binding

The receipt MUST bind canonical repository identity, candidate content digest, and canonical reviewed scope. Identity MUST derive from Git’s common directory, including linked worktrees; paths MUST be normalized, repository-relative, deterministic, and free of aliases or traversal. Both commands MUST derive staged/index state, including additions, modifications, deletions, executable modes, and symlink entries. The digest MUST cover exact staged/index content; validation MUST fail closed on mismatch.

#### Scenario: Linked worktree validation

- GIVEN start occurs in a linked worktree and validation occurs in that worktree or another worktree of the same repository
- WHEN the canonical common directory, candidate digest, and path scope match
- THEN validation succeeds without treating the worktree administrative path as a foreign repository

#### Scenario: Staged candidate fidelity

- GIVEN staged additions, modifications, deletions, executable-mode changes, or symlink entries exist
- WHEN `review-start` creates a receipt and `review-validate` rederives the candidate
- THEN both use the same index candidate and validation fails closed if any entry, mode, target, or content differs

#### Scenario: Candidate or scope changes

- GIVEN a valid receipt exists
- WHEN candidate content or the normalized reviewed path scope differs
- THEN `review-validate` exits non-zero with `candidate-changed` or `scope-changed`

### Requirement: Versioned atomic repository storage

Receipts MUST use a versioned schema and policy, be stored beneath the Git common directory in a repository-specific namespace, and be written atomically. Storage corruption MUST fail closed.

#### Scenario: Missing, foreign, malformed, or corrupt receipt

- GIVEN no receipt exists, the receipt belongs to another canonical repository, violates schema/policy, or cannot be read atomically
- WHEN `review-validate` runs
- THEN it exits non-zero with a reasoned `missing`, `foreign-repo`, `schema-invalid`, or `storage-corrupt` failure

### Requirement: Read-only validation and lifecycle separation

`review-validate` MUST only read and validate the authoritative receipt. It MUST NOT create, replace, refresh, repair, or spend review budget. Validation MUST require matching repository, candidate, scope, versions, terminal state, and evidence.

#### Scenario: Valid receipt

- GIVEN the authoritative receipt is complete, terminal, evidence-backed, and matches the current repository, candidate, scope, and versions
- WHEN `review-validate` runs
- THEN it exits zero and does not modify receipt storage or budget state

#### Scenario: Non-terminal or missing evidence

- GIVEN a receipt is present but non-terminal or has missing/invalid evidence
- WHEN `review-validate` runs
- THEN it exits non-zero with a reasoned `non-terminal` or `evidence-missing` failure and performs no write

#### Scenario: Validation cannot bootstrap state

- GIVEN receipt storage is absent or invalid
- WHEN `review-validate` runs
- THEN it exits non-zero and leaves storage and review-budget state unchanged
