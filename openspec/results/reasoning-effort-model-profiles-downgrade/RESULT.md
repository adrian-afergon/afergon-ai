# Result: Safe model-only export with a complete current-state backup (P2)

- **Source Task**: `002-reasoning-effort-model-profiles-downgrade.md`
- **Plan**: `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md` (ready-with-assumptions)
- **Spec**: `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md` (active; historical `-old-20261025-194903` files excluded)
- **Branch**: `feat/reasoning-effort-p2-export` (new isolated worktree `/tmp/opencode/afergon-ai-reasoning-effort-p2-export`, created from exact accepted B head `d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2`)
- **Date**: 2026-10-25

## Implementation Status

`completed-with-notes` — all local engineering gates produced and green; independent canonical review, publication, and native Windows exact-head evidence remain external gates (outstanding, not circular blockers).

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md`
- Execution Mode: direct (sequential TDD/TPP, single cohesive unit)

## Execution Summary

Implemented the P2 internal export capability per the approved plan: `ModelOnlyExportPolicy` (domain), `ProfileExportPort` + `ExportModelProfilesUseCase` (application), `NodeExportDestinationAdapter` (infrastructure), composition wiring (`createProfileCapabilities(env).exportProfiles`), `export` added to the supported-version operation union, architecture assertion updates (domain 8, application 10), both export test files added to the explicit Windows suite list, README recovery guidance, and this RESULT. Strict sequential RED→GREEN(TPP)→TRIANGULATE→REFACTOR was followed per behavior unit; reused-correct behavior was characterized honestly, never manufactured as RED.

## Git Audit and Isolation (executed 2026-10-25)

All five categories reinspected before creation and at implementation start:

1. **Worktrees**: 30 registrations — accessible root `main` @ `b558aadbef0390c5e9ca833d6b34af1303ffb67a` (matches plan), A `/tmp/opencode/afergon-ai-p2-export-contract` @ `587647092f177138ca53b8e36b0e66e586e00990` clean, B `/tmp/opencode/afergon-ai-p2-export-plan` @ `d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2` clean, plus exactly 29 prunable records (gitdir missing; cause unknown — preserved, no prune, no recreate).
2. **Staged**: empty.
3. **Unstaged**: only pre-existing `openspec/tasks/PROJECT-TASKS.md` (161 additions/1 deletion) — untouched.
4. **Untracked**: 35 individual paths (`-uall`) — 7 planning dirs + 28 others — all preserved, never staged.
5. **Collisions**: `feat/reasoning-effort-p2-export` absent locally and on `origin`; `/tmp/opencode/afergon-ai-reasoning-effort-p2-export` absent; parent `/tmp/opencode` verified via `ls`; remote A/B heads match exact SHAs.

Creation: `git worktree add -b feat/reasoning-effort-p2-export /tmp/opencode/afergon-ai-reasoning-effort-p2-export d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2` → HEAD verified `d3dca9b…`, clean status. No base/head movement occurred during execution.

## TDD/TPP Evidence (sequential, per behavior unit)

Environment: Node v26.2.0, pnpm 11.21.0. `pnpm install --frozen-lockfile` in the new tree → exit 0 (parent `node_modules` verified first; no package/lock/config changes; no secrets). Tests isolate all filesystem state under `os.tmpdir()` and pass explicit `AFERGON_AI_CONFIG_DIR` env objects; no real profile access.

**Baseline (before any change)**: `pnpm test` → exit 0, **1088 passed | 8 skipped (1096)**, 33 files passed | 3 skipped. (Non-fatal pre-existing warning: `typescript.js.map` ENOENT from the pnpm store; all tests unaffected.)

### Unit 1 — `ModelOnlyExportPolicy` (domain)

| Step | Test | Outcome |
| --- | --- | --- |
| RED | managed string passthrough + independent document | failed: module absent (capability does not exist) |
| GREEN (TPP #5: statements) | minimal clone+return | 1 passed |
| RED (adversary 1) | structured `{model}` → exact string | failed: object returned unchanged |
| GREEN (TPP #6: conditional) | managed/foreign branch + `defineProperty` replacement | 2 passed |
| RED (adversary 2) | effort metadata recorded as loss | failed: losses `[]` |
| GREEN (TPP #5) | omitted-keys collection | 3 passed |
| RED (adversary 3) | no-model assignment removed (legacy inheritance) | failed: key still present |
| GREEN (TPP #6) | delete branch | 4 passed |
| TRIANGULATE batch | inherit preserved; foreign verbatim (no validation/loss); non-effort metadata loss; `__proto__` own-property inertness; deep-clone input independence; mixed profiles; absent containers | 10 passed — honest characterizations of the generalized loop (no manufactured RED) |
| RED (adversary 4) | managed `{model: 42}` refused, not emitted | failed: no throw |
| GREEN | `StoredAssignment.create` validation (domain assignment primitive) | 11 passed |
| REFACTOR | removed dead `void profileName` | 11 passed |

### Unit 2 — `ProfileExportPort` + `NodeExportDestinationAdapter`

| Step | Test | Outcome |
| --- | --- | --- |
| RED | string write, parent creation, mode 0600 | failed: module absent |
| GREEN | mkdir → `wx` 0600 → write → fsync → close | 12 passed |
| RED (adversary 1) | protected-path alias refused before any write | failed: raw EEXIST leaked instead of protected-path diagnostic |
| GREEN (TPP #6) | `path.resolve` comparison pre-open | 13 passed |
| RED (adversary 2) | write fault → owned partial removed, original cause preserved | failed: partial file remained |
| GREEN (TPP #5) | close+rm cleanup preserving causes (reused snapshot-adapter mechanic; AggregateError structure written here, pinned by the next tests) | 14 passed |
| TRIANGULATE batch | close-fault combined causes; rm-fault combined causes; existing byte-identical destination rejected untouched (EEXIST propagation, NO reuse); exact offset-view bytes | 18 passed — honest characterizations |
| Port | `application/profile-export-port.ts` (type-only, one semantic method) | 18 passed |

### Unit 3 — `ExportModelProfilesUseCase` (fake ports)

| Step | Test | Outcome |
| --- | --- | --- |
| RED | happy path: raw backup bytes + serialized model-only export from ONE observation, ordered writes, receipt with warnings, protected paths | failed: module absent |
| GREEN | full planned sequence (read → existence refusal → version refusal → transform/serialize → recheck → backup → export → receipt) | 19 passed |
| TRIANGULATE batch | absent source refusal (no outputs); future version refusal; corrupt source propagation (no outputs); recheck conflict (no writes); backup-failure propagates raw without export attempt; export-failure → typed `ExportModelProfilesError` identifying surviving backup with cause; snapshot-absent protected paths | passed — characterizations of the planned sequence |
| RED (adversary) | caller-path collision refusal before any write (backup=destination, destination=source, backup=source) | failed: no throw |
| GREEN (TPP #6) | `refuseCollisions` exact-string pairwise check (application layer: no Node path APIs; alias collisions still caught by adapter resolve + `wx`) | 27 passed |

Composition RED/GREEN: `capabilities.exportProfiles` undefined → wired with constructor-injected reader/validator/policy/destination-adapter/storage-recheck and `${configPath}.pre-v2.bak` snapshot convention → **composition test caught a real design flaw**: each write must protect the OTHER output (plus source/snapshot), not itself — fixed in use case + two test expectations → 28 passed.

### Unit 4 — Architecture, Windows list, emitted runtime

- Architecture assertions updated in the same unit: domain 7→8, application 8→10, new-module presence checks; negative fixtures and legacy saver body hash (`79c929fe…`) untouched and passing. Relevant suites: `pnpm exec vitest run tests/model-profiles-architecture.test.ts tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-snapshot-runtime.test.ts tests/model-profiles.test.ts --no-file-parallelism` → exit 0, **669 passed**.
- Windows workflow: both export test files inserted into the explicit suite list; all existing steps preserved.
- Emitted runtime (`tests/model-profiles-export-runtime.test.ts`): port AST contract (one semantic method, inward resolved graph, no Node/process/Buffer in application+domain) + spawned emitted-API scenario under isolated temp env. Iterations to green (test-harness fixes, not production changes): AST program entry corrected to the use case; ESM loader I/O guard aligned with the existing snapshot-runtime pattern; fault injection patched at fd level (adapter writes via fd); collision assertions corrected to the honest contract (backup-destination collision → raw EEXIST, export-destination collision → typed error with surviving backup). Final: **2 passed**.

## Command Log (exact, contemporaneous)

| Command | Exit | Outcome |
| --- | --- | --- |
| `git worktree add -b feat/reasoning-effort-p2-export /tmp/opencode/afergon-ai-reasoning-effort-p2-export d3dca9b7f3c59a221a9b251e9c1f28a3579de6c2` | 0 | isolation created at exact B head |
| `pnpm install --frozen-lockfile` | 0 | deps installed (3.2s) |
| `pnpm test` (baseline) | 0 | 1088 passed \| 8 skipped |
| `pnpm exec vitest run tests/model-profiles-export.test.ts --no-file-parallelism` (×~15 TDD cycles) | 1→0 per cycle | RED/GREEN evidence above |
| `pnpm build && pnpm exec vitest run tests/model-profiles-export-runtime.test.ts --no-file-parallelism` (×4) | 1→0 | emitted runtime green |
| `pnpm exec vitest run <5 relevant suites> --no-file-parallelism` | 0 | 669 passed |
| `pnpm typecheck` | 2→2→2→0 | 3 rounds of test-side strictness fixes (`RawProfileDocument` index access), then green |
| `pnpm test` (final full) | 0 | **1118 passed \| 8 skipped (1126)**, 35 files passed \| 3 skipped |
| `pnpm run health:runtime` | 0 | local dist runtime health passed |
| `pnpm run doctor:runtime` | 0 | no recorded local-only health failures |

## Preservation Audit

- Source and pre-migration snapshot are never written: protected-path checks (adapter resolve-level) + use-case collision refusal + explicit tests (source byte-identical after export, snapshot content unchanged).
- Legacy saver untouched: `S13 composition retains the exact legacy saver body` hash assertion passing in the full run; sole production `atomicPersist` ownership unchanged; no infrastructure file calls `atomicPersist`.
- Existing destinations rejected even when byte-identical (no snapshot-style EEXIST reuse).
- Owned-partial cleanup only; completed backups survive later export failure (typed error identifies them; verified on real fs in emitted test).
- No callable/automatic restore API: capabilities surface keys asserted `^(configPath|reader|preparer|validator|storage|inspector|snapshots|update|exportProfiles)$`; no CLI/TUI/host activation added; no live command changes.
- No multi-file atomicity/CAS/directory-fsync claims anywhere in code or docs.
- Root dirty state (PROJECT-TASKS 161+/1-, 35 untracked) untouched; A/B worktrees and 29 prunable registrations untouched; no force/rebase/amend/stash/reset/clean/gitconfig changes; no existing PR mutated; nothing pushed.

## Measured Size (P2-only cohesive exception; forecast 775–900 is not a ceiling)

| Unit | Additions | Deletions |
| --- | ---: | ---: |
| Commit `2dbc213` (code+tests+CI, 10 files) | 696 | 4 |
| Commit `61652b0` (README guidance) | 10 | 0 |
| Commit 3 (this RESULT + plan checkbox state) | ~160 | ~11 |
| **Implementation total (vs B `d3dca9b`)** | **~866** | **~15** |

Initial planning artifacts (A 255 lines, B 199 lines) are reported separately per the plan and are ancestors of this branch, not part of this diff. No evidence was cut to fit a number.

## Acceptance Criteria Mapping

- Happy path, inheritance/metadata edges, source-refusal outline, both destination-collision cases, backup/export failure cases, guidance-only recovery: **produced** (28 unit tests + 2 runtime tests).
- Exact raw backup + model-only output from same capture incl. post-migration edits; source/snapshot byte-identical: **produced** (byte-equality assertions on real fs).
- Effort/unrepresentable loss explicit and recoverable from raw backup; no defaults on invalid/missing source: **produced**.
- Success requires both outputs; compound failures retain causes and identify surviving backup; no false atomicity: **produced**.
- No callable restore / CLI/TUI / host effects; 006/008 clearly not released: **produced** (surface assertion + README guidance).
- Architecture, legacy saver, dependency direction, full baseline, emitted import/API: **produced** locally. Native Windows evidence: **outstanding** (external).
- Rollback preserves saved copies; no merge/PR mutation: **produced** by construction (nothing pushed/merged).

## Blockers or Deviations

- None blocking. Honest notes:
  1. Minor TPP deviations: the initial use-case GREEN included the existence refusal and typed-error wrap slightly ahead of their forcing tests (both are explicit clauses of the plan's sequence contract); the adapter's AggregateError cleanup structure was written with the write-fault test (reused snapshot-adapter mechanic) and then pinned by the combined-fault characterizations.
  2. One mechanical 6-instance rename in the test file used `sed -i`; all substantive authoring used the specialized edit/write tools.
  3. Pre-existing non-fatal `typescript.js.map` ENOENT warning during vitest transforms (pnpm store artifact, present in baseline too).

## Verification Results

- Step-level checks: all TDD cycles and targeted suites **passed** (table above).
- Final checks: Tests **passed** (1118/8 skip); Build (`pnpm build` via `pnpm test` + standalone) **passed**; Typecheck **passed**; health:runtime **passed**; doctor:runtime **passed**.
- Additional evidence: emitted internal API + on-disk byte equality + fault outcomes **produced**; native Windows exact-head logs **outstanding**; independent canonical review **outstanding**.

## Notes

- The composition test's protected-paths catch (each write protects the sibling output) materially improved the design; the earlier happy-path expectation was corrected accordingly.
- `requireSupportedVersion` message for export refusals is `Cannot export unsupported profile version N` (existing non-prepare branch).
- Backup-destination collisions surface as the raw EEXIST (no completed backup exists to identify); export-destination collisions surface as `ExportModelProfilesError` naming the surviving backup. Both are tested at emitted level.

## Next Step

Orchestrator: run independent canonical review at exact HEAD `61652b0` (pre-RESULT) / final HEAD after commit 3; obtain native Windows exact-head CI evidence through the updated suite list; handle publication/PR. No merge. S13 human async review remains OPEN and untouched.
