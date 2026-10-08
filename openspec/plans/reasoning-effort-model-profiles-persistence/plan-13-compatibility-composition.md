# Plan13: Bind original APIs to class capabilities and verify full persistence

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete compatibility and task acceptance.

## Summary

Deliver the infrastructure composition root and thin original function APIs. All policy/orchestration already lives in05–12; this unit wires actual class capabilities and retains original externally callable signatures/diagnostics. Verify full218-case storage behavior, architecture and602-suite historical regression baseline with real Node files/faults and native CI.

## Planning Scope

Only bounded persistence API compatibility, actual class composition, integrated read/prepare/snapshot/update round-trips, failure ordering and internal migration docs. No live barrels/CLI/TUI/install/update/refresh/host changes; no P2 exporter/P3 candidate-lifecycle API or issue105 instruction modification.

## Design Rule Alignment

- `infrastructure/profile-composition.ts` alone selects default process.env, legacy getConfigPath/createDefaultConfig/saveConfig and Node fs.
- Compose explicit collaborators/captured environment; constructors only assign. Original wrappers delegate, containing no validation/patch/version/snapshot/save orchestration.
- Existing module paths remain import-compatible: profile-store/document-validation/prepare-assignment/migration-snapshot, StoredAssignment and AssignmentPatch.
- Keep legacy saver body exactly unchanged. Policies reside domain, ports/use cases application, capability classes infrastructure; no static fs-direct cosmetic class conversion.

## Assumptions

Local reversible assumption: readable shared setup retains all55 allocated D cases plus final entry binding while inheriting already-published primitive/snapshot tests, without wholesale779/906-line transfer. Reforecast actual source/test/CI/result growth; estimates not caps/proof. Replacement basis/deprecation are approved decisions.

## Design Tensions

None

## Vertical Slicing Decision

This is a meaningful source composition/compatibility delivery with actual injected production adapters, related integration tests/docs/result. It completes an inactive callable store; no tests-only or docs-only source slice. Every earlier capability remains safe/callable without activating live consumers.

## Execution Strategy

Approved replacement chain:05→06→07→08→09→10→11→12 → 📍13 → full P1 acceptance → original P2/P3. Future p1-class-13 branch/worktree from accepted12 follows exact index collision checks after reviewed PR104-rooted planning publication/renewed gate/five-category audit. PR106–109 are CLOSED/unmerged, deprecated/superseded by authorized parent closure; preserve their branches/heads/history. No replacement source exists yet.

Future owned: bounded composition/wrappers,55 original D integration cases/saver-fault helper, final12 shared entry binding replacement, additional compatibility tests, **only relevant extra targeted step in .github/workflows/windows-launcher.yml**, README, correction/S13/RESULT.md and deltas. Revised source45–65 + CI3–5/tests145–185/docs12–17/result65–80/artifacts8–12 =278–364. TEST-ALLOCATION allocates all218 and keeps distinct14 raw-update assertions;09 primitive characterization does not replace completed-backup/retry integration. Count helper/CI/wrapper replacements both sides; prefer350/STOP375/hard399, local reversible reuse forecast not caps/proof. No CI/source/test/result edits or execution authorized now.

## Implementation Steps

- [ ] Compose all actual classes from captured environment/bound source/fs/defaults/saver; original wrappers only map compatibility data and delegate.
- [ ] Preserve Buffer-only legacy snapshot observation diagnostics and same-read text/Buffer loader return fields at edges, while application uses Uint8Array.
- [ ] Verify targeted migration/reload/no-op/future/default/prototype/alias/conflict integration through original APIs with real Node fs.
- [ ] Reconcile all218 old behavioral cases/assertions across owned units plus new seams; run exact full original commands and native checks.
- [ ] Record complete task/spec/old PLAN traceability, internal rollback/recovery docs, required review/evidence and actual final budgets before releasing P2/P3.

## Interfaces and Technical Contracts

Keep `loadProfileDocument(env?: NodeJS.ProcessEnv): LoadedProfileDocument`, `validateProfileDocument(raw: unknown, configPath: string): Record<string,unknown>`, `prepareProfileAssignment(input): PreparedAssignment`, `assertProfileSourceUnchanged(observation): void`, `acquireMigrationSnapshot(input): SnapshotReceipt`, `updateProfileAssignment(profileName, agentName, patch, options?: {env?: NodeJS.ProcessEnv}): {configPath;version;snapshotPath?}`. Node-specific types live only at compatibility edges, mapped to application contracts.

`createProfileCapabilities(env)` in infrastructure captures env/path/defaults/fs/save collaborators once and returns composed read/prepare/update/storage/snapshot capabilities. It does not perform config reads/writes during construction/import. Default selection happens here, never in constructors/inner code. Environment copy must retain original path-precedence semantics; same source identity is used for observation/rechecks/save.

True pinning: compute absoluteConfigPath=path.resolve(getConfigPath(initialEnv)) once using existing precedence; require basename config.json. Private boundEnv copies relevant initial vars and forces AFERGON_AI_CONFIG_DIR=absolute dirname; getConfigPath(boundEnv) must equal absoluteConfigPath. Bind reads/rechecks to that absolute path and legacy saveConfig(document,boundEnv), immune to later cwd/caller-relative-env mutation. Mere copying initial env leaves relative-path/cwd fallback drift.09 owns isolated real-adapter cwd characterization;13 verifies final wrapper preserves initial selection. No saver-body rewrite or application/domain Node/env leakage.

Shared types are imported, not redeclared: DOMAIN RawProfileDocument from06; APPLICATION ProfileDocumentObservation/ObservedProfile/LoadedProfile from07; AcquireMigrationSnapshotInput/SnapshotReceipt from10. All interfaces are complete for their prefix; original Buffer-based shapes remain compatibility-local. Only UpdateUseCase calls raw atomicPersist in production; no first extended write can bypass its snapshot ordering, and no UI/public update route exists before this unit.

Validation/preparation wrappers select concrete domain policies and delegate; read/update wrappers select composed cases and delegate. Snapshot wrapper performs only required compatibility input mapping/checks and delegates acquire; recheck wrapper maps then delegates storage. No business-rule orchestration remains in any wrapper. Keep field/diagnostic names and error messages, including historical rejection of non-Buffer snapshot observations. Node Buffer may implement/copy Uint8Array at edges without leaking its API inward.

Full preservation: exact/no-op byte and version retention, all alias/own-profile keys, root/models/profiles/assignment metadata, bidirectional clone independence, raw prospective version unchanged before backup, deterministic absent recovery, existing-backup reuse/malformed/mismatch refusal/0600/existing modes, all source conflict timing, owned cleanup/AggregateErrors and every precommit save-stage outcome. Rename/compare-to-rename/best-effort-dir-fsync limitations stay explicit.

## Acceptance Criteria

- [ ] All original task/spec/PLAN behavior and218 cases are mapped to runnable evidence; historical counts alone are not proof.
- [ ] Original APIs/signatures/errors/representations work by thin delegation with no ambient constructor/import I/O.
- [ ] All source/snapshot/save real fault matrices and native Windows regression checks retain their contracts.
- [ ] Architecture tests prove resolved inward imports, class-owned policy, injected capabilities and no Node/env in inner layers.
- [ ] Live output/routes/barrels remain unchanged; docs/results/review/CI/full checks and actual≤399 delivery complete before task001 acceptance.

## Verification

New composition seam initial RED: original update delegates to class capabilities while absent read/import constructs no filesystem state. T1 after GREEN: separate bound temporary environments cannot cross-write; T2 after GREEN: integrated snapshot failure prevents actual saver and preserves source. If reused behavior already passes, label characterization and document inability to find two breaks; no compiler/missing-export RED. Real faults use restored descriptor-aware Node spies; serialization fault only inside saver; integrated recheck tests inject semantic points rather than brittle old validator-call counts.

Future exact commands (not run during planning):

```text
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t "<exact single test name>"
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism
pnpm exec vitest run tests/model-profiles-use-cases.test.ts tests/model-profiles-architecture.test.ts --no-file-parallelism
pnpm typecheck
pnpm build
pnpm run health:runtime
node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"
pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism
pnpm test
```

Retain compiler include/emitted module and import-no-I/O evidence; source tests alone do not prove emission. Ubuntu Test/native Windows launcher baseline is required; only POSIX mode checks skip on Windows. Isolate HOME/XDG/config/state; restore spies/umask. `pnpm test` includes required build; expected602 historical passes/8 skips must be reconciled with newly added seam tests, never forced to exact stale count. Keep every old semantic assertion even if tests are partitioned.

Actual Windows workflow currently runs bootstrap/argv/OpenCode suites, not persistence faults. Old SUCCESS is not native validation of this correction.13 alone adds a targeted Vitest step after existing build/typecheck/health, leaving launchers/baseline steps unchanged: `pnpm exec vitest run tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-architecture.test.ts --no-file-parallelism`. Domain/read/prepare/storage/snapshot/compat groups live in focal suite, injected use cases in use-case suite, checker negatives in architecture suite. Only original C01's3 POSIX mode cases skip Windows; every other applicable real adapter/integration fault runs natively. Workflow addition/churn3–5 is budgeted, execution and current native success remain outstanding. No unrelated CI changes.

Original-case reconciliation is already concretely planned in TEST-ALLOCATION: A35/B72/C46/D65,55 groups,218 total; destinations06=3/07=32/08=72/11=46/12=10/13=55. Retarget12's shared update-entry binding to this compatibility wrapper for final full218 original API coverage; new checker/memory/relative-binding tests are additional, not replacements. Focal779 lines is absent PR104; inherited2705-line global regression stays unchanged/free of re-additions, but must be rerun.

Result uses unchanged Implement headings/exact-cycle/TPP evidence and original traceability. Produced now: source-grounded correction contracts and approved replacement/deprecation basis. Not applicable now: tests/build/installer changes. Outstanding: parent targeted re-review, separately authorized planning publication, renewed Implement gate and future full/local/native/review/budget evidence.

## Open Questions

None

## Dependencies

Accepted complete05–12, corrective planning publications and renewed gate. Full current review/native checks/ordinary approval precede task001 acceptance; P2/P3 remain downstream and receive no invented whole-candidate commit adapter.

## Risks and Watchouts

Do not introduce a new live export or host callback to demonstrate capability. Full snapshot remains after failed config save; no rollback after rename. Old writers can discard extended state despite schema bump: freeze writes, retain full extended documents/backups, reverse dependent suffix, restore pre-v2 only with consent accepting loss of subsequent edits. No downgrade export is available at P1.

## Completion Condition

Plan is ready-with-assumptions: approved replacement basis/deprecation, no questions/tensions, local reversible fixture estimates only. Planning publication and new source implementation remain separately unauthorized. Full correction completes only with class composition/compatibility, preserved/new behavior, inward/no-I/O proof, baseline/native/review evidence, results/docs and measured budgets; no task implementation acceptance claimed now.
