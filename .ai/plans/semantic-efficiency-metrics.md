# Independent Feature Plan: Semantic Efficiency Metrics

This plan intentionally excludes Gentle AI and its review guardrails. Execution uses only the native Plan and Build agents.

- [x] **1. Correct the current foundation**
  - Locate the `occurredAt` validator and replace the `Date.parse()`-only check with strict ISO 8601 UTC format and calendar-date validation.
  - Add RED tests for a non-ISO but parseable timestamp and for a calendar-invalid ISO timestamp such as `2026-02-30T08:00:00.000Z`.
  - Preserve valid ISO UTC timestamps already accepted by the parser.
  - Make the smallest GREEN implementation change without altering domain, port, or adapter responsibilities.
  - Run focused tests, typecheck, and build before proceeding.

- [x] **2. Complete the AFERGON-AI v1 domain contract**
  - Define a single v1 input contract and normalized internal representation.
  - Centralize closed phase, outcome, and schema-version vocabularies so TypeScript types and runtime validation cannot drift.
  - Define domain classes for validated events, normalization results, and typed local diagnostics.
  - Require stable event ID, timestamp, workflow run, phase, agent, and outcome.
  - Validate optional task, subagent, model, profile, review cycle, correlation, and retry fields only when present.
  - Preserve missing optional attribution as `unavailable` or `unattributed`; never infer it.
  - Reject unsupported versions, non-AFERGON-AI schemas, and Gentle AI events.
  - Add RED tests for each invalid category and every missing required field.
  - Verify invalid events produce local diagnostics and never reach persistence.

- [x] **3. Implement local SQLite persistence**
  - Run a minimal compatibility spike and select the smallest SQLite driver compatible with the TypeScript runtime and build.
  - Resolve a metrics-owned local data path using the repository configuration convention.
  - Create a SQLite schema for enablement state, normalized records, query dimensions, and migration metadata.
  - Implement idempotent migrations, parameterized queries, and transactions.
  - Implement disabled-by-default lifecycle operations: `enable` and `status`.
  - Implement atomic batch imports so invalid records cannot partially persist.
  - Ensure disabled metrics create no files and persist no semantic or enrichment data.
  - Implement confirmed clear that removes only metrics-owned data.
  - Add temporary-directory tests for isolation, atomicity, disabled behavior, and preservation of unrelated data.

- [x] **4. Implement use cases and reports**
  - Define repository, query, export, and optional enrichment ports.
  - Implement import as validate, normalize, check enablement, then persist.
  - Support filters by task, phase, agent, subagent, model, profile, outcome, and review cycle.
  - Support grouping by the same dimensions with counts for rework, acceptance, rejection, failure, and coordination.
  - Make attribution and enrichment gaps visible in reports.
  - Keep token and cost data optional and separate from semantic success criteria.
  - Define a replaceable enrichment port; provider absence, failure, or ambiguity must not block reports.
  - Add RED tests for filters, groupings, rework, review cycles, gaps, and absent enrichment.

- [x] **5. Implement local exports**
  - Serialize already queried data without duplicating domain or report rules.
  - Export JSON with stable IDs, dimensions, unavailable values, gaps, and optional enrichment.
  - Export CSV with a fixed header, stable order, and explicit unavailable values.
  - Ensure exports respect selected filters and groupings.
  - Validate local output paths and prohibit remote output behavior.
  - Add tests for CSV order and escaping, plus JSON gap preservation.
  - Verify export does not mutate records or enable metrics implicitly.

- [ ] **6. Integrate CLI and documentation**
  - Add `metrics enable` and `metrics status` routing.
  - Add `metrics import <event-file>` routing.
  - Add `metrics report` filters and grouping arguments.
  - Add `metrics export --format json|csv --output <path>`.
  - Add `metrics clear --confirm` and reject clears without confirmation.
  - Provide clear local diagnostics for missing files, invalid JSON, invalid events, and disabled metrics.
  - Document opt-in behavior, local path, privacy, SQLite storage, export, clear, and enrichment limitations.
  - Add CLI smoke tests for arguments, exit codes, and unauthorized persistence.

- [ ] **7. Verify each delivery slice**
  - Apply RED, GREEN, triangulation, and minimal refactoring for every functional change.
  - Run focused tests after domain, storage, report/export, and CLI slices.
  - Run typecheck and build after each relevant integration.
  - Run the full suite before closing each slice.
  - Keep foundation, SQLite, report/export, and CLI/documentation as separate deliveries.
  - Keep each delivery below the 400 changed-line review target.
  - Do not implement `ccusage`; leave only its replaceable enrichment boundary.
