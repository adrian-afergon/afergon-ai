# Plan: Discoverable Metrics CLI Help

This child slice extends PR #63 and does not use Gentle AI or its guardrails.

- [x] **1. Define the help contract**
  - Add `metrics --help` and `metrics -h` with the complete command list.
  - Add command-specific help for `enable`, `status`, `import`, `report`, `export`, and `clear`.
  - Keep help side-effect free: stdout output, exit code 0, and no SQLite directory creation.

- [x] **2. Test and implement help routing**
  - Add RED tests for root metrics help, each subcommand help, unknown commands, and emitted runtime behavior.
  - Implement the smallest routing change without changing existing command semantics or report filters.
  - Keep usage errors on stderr with exit code 1.

- [x] **3. Document and verify the feature**
  - Document help discovery and examples in README.
  - Run focused tests, typecheck, build, full suite, and runtime health.
  - Keep the child PR below the 400-line review budget and preserve the PR63 dependency chain.
