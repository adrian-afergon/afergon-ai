# Architecture correction: Class-owned policies and injected persistence capabilities

- **Source Task**: [001](../../tasks/001-reasoning-effort-model-profiles-persistence.md)
- **Source Spec(s)**: [spec-01-compatible-profile-storage.md](../../specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md) — `ready`, sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied to planning; nine complete capabilities on the approved replacement delivery basis.

## Summary

Correct architecture while retaining the existing persistence behavior. Domain classes own validation, alias targeting and edit policy; application use cases own orchestration through constructor-injected semantic ports; infrastructure classes own Node filesystem, defaults, paths and legacy saver mechanics. This is corrective planning for task001, not a new product task.

**Execution authority for the correction:** this index and plans05–13 are ready-with-assumptions forward planning contracts on the user-approved replacement basis. Targeted parent re-review, separately authorized planning publication and renewed Plan-to-Implement approval remain required; readiness authorizes none of these actions. [PLAN.md](PLAN.md), [PLAN-INDEX.md](PLAN-INDEX.md), plans01–04 and A–D results remain unchanged historical behavior/evidence, not forward correction architecture authority.

Canonical re-entry remains `Review → Implement (confirmed defect; correction escalated) → Plan/plannify`. User approval now covers replanning, the replacement delivery basis and obsolete PR deprecation/closure only. Planning publication and new source implementation are NOT authorized. The approved class-based domain/application-port/infrastructure-adapter architecture remains unchanged.

| Order | Plan | Callable outcome | State |
| --- | --- | --- | --- |
| 05 | [Agent identity and target policy](plan-05-agent-target-policy.md) | Concrete alias classification and exact stored-key selection | ready-with-assumptions |
| 06 | [Validated raw document](plan-06-profile-document-policy.md) | Full-document validation class and retained assignment factory | ready-with-assumptions |
| 07 | [Observed read](plan-07-observed-read-use-case.md) | Read use case injected with a real observation adapter | ready-with-assumptions |
| 08 | [Independent preparation](plan-08-independent-preparation-use-case.md) | Pure edit-policy class, clone ownership and prepare use case | ready-with-assumptions |
| 09 | [Guarded atomic storage](plan-09-storage-recheck-atomic-adapter.md) | Source recheck and unchanged atomic-save adapter mechanics | ready-with-assumptions |
| 10 | [Existing recovery inspection](plan-10-snapshot-inspection-adapter.md) | Read-only recovery matching and completed-backup verification | ready-with-assumptions |
| 11 | [Owned snapshot acquisition](plan-11-snapshot-acquisition-adapter.md) | Complete exclusive creation/reuse/cleanup capability | ready-with-assumptions |
| 12 | [Update orchestration](plan-12-update-assignment-use-case.md) | Port-driven update use case, proved with memory fakes | ready-with-assumptions |
| 13 | [Compatibility composition](plan-13-compatibility-composition.md) | Original APIs delegate; full real-filesystem persistence verified | ready-with-assumptions |

The sole human structural decision is resolved, not assumed. All plans are ready-with-assumptions only for explicit local reversible fixture reuse/source-budget estimates; no product/architecture/delivery ambiguity remains. Publication/review/implementation gates are outstanding dependencies, not hidden design questions or automatic execution permission.

Planning WARN `ses_ee49cd162ffeTMC1TU4D5x56JD` gaps were corrected; parent reports technical planning PASS for types/path binding/allocation/checker/Windows/atomic boundaries. This pass changes readiness/delivery provenance only, not those contracts. Parent handles targeted re-review; this pass claims no independent review.

Human review path has five conceptual steps: (1) own identity/validation policies05–06, (2) read and prepare through classes07–08, (3) preserve atomic/recovery mechanics09–11, (4) orchestrate injected capabilities12, (5) compose original APIs and prove platform behavior13. Nine budget slices implement these five steps; they are not nine new product features.

## Planning Scope

Only the model-profiles persistence vertical and two deliberately bounded pure-policy extractions from legacy core are proposed. Preserve original task/spec acceptance: mixed values, metadata, strict paths, aliases, clones, snapshots, atomic faults, inactive runtime boundaries. No export, bulk lifecycle adapter, clear/delete, resolution, provider policy, host projection, CLI/TUI activation, installer work or issue105 workflow-instruction modification.

Today, write only this index, plans05–13 and the explicitly authorized [TEST-ALLOCATION.md](TEST-ALLOCATION.md) under this existing slug in D. Source/tests/CI/README/tsconfig/old plans/index/results and all other trees are preserve-only. Future results remain correction/S05/RESULT.md through S13/RESULT.md under the original results slug; never prepublish future cycle evidence.13's planned narrow Windows CI addition is a future owned implementation change, not a CI edit authorized now.

## Design Rule Alignment

- Root AGENTS/README and root `.atl/skill-registry.md` are authoritative. Exact registered plannify/chained-pr/work-unit-commits/cognitive-doc-design files were loaded; Implement was read only for future evidence obligations. D has no registry copy; this known root-only registry gap is reported, not repaired here.
- Root cause: `PLAN.md:24` says “No application layer is needed”; A/B/D place semantic validation, targeted-edit policy and orchestration in infrastructure functions. Existing checks prove factory/import shape, not class-owned behavior and constructor injection.
- `StoredAssignment.create(value, path)` remains compliant; its private constructor only assigns. `AssignmentPatch` is a valid data interface. No class-per-utility or interface-per-class rule is introduced.
- Existing `usage-metrics/use-cases.ts:3–15` and `ports.ts` demonstrate constructor injection and role contracts; `SqliteMetricsStore` demonstrates adapter capability classes. Reuse these concepts without migrating metrics or inheriting its directory layout mechanically.
- Domain imports only domain-owned pure policies/data. Application imports domain and application contracts only. No Node, Buffer, ProcessEnv, legacy core/config, fs, paths or infrastructure imports in either inner layer.

## Assumptions

Local, explicit, reversible assumptions: readable named-case tables/shared descriptor-aware setup can retain all assertions within source forecasts; remeasure at each GREEN and stop/replan before budgets are exceeded. No coverage/evidence caps or structural assumptions. Exact owned contract paths remain those declared; the user-approved PR104 replacement basis is a decision, not an assumption.

## Design Tensions

None

## Vertical Slicing Decision

Nine units separate alias extraction, validation, observed reads, preparation, atomic storage mechanics, existing-backup inspection, owned creation, injected orchestration and real composition. Four original PRs have only 25/42/27/34 lines before hard399; class moves add constructor/port/fake-test churn and replacement deletions. Read-only inspection separates C's refusal/reuse cases from creation/cleanup without ever landing a partial snapshot writer. Atomic mechanics remain an internal low-level capability, not a public structured-update API. Unit12 completes orchestration; unit13 binds the original API to those already complete capabilities.

Every prefix is compiled, directly testable and inactive. Ports ship with their consuming use case or adapter, never as scaffolding-only PRs; tests/results/docs ship with the capability, never as tests-only source PRs. P2/P3 wait for full corrected P1 acceptance, not an intermediate unit.

## Execution Strategy

### Five-category Git inventory — observed 2026-10-08, before writes

1. D branch `feat/reasoning-effort-p1-targeted-migration-atomic-writer`, HEAD `8963d8e5aa16a91b7a131e9405c58f9636c33301`; upstream `origin/feat/reasoning-effort-p1-targeted-migration-atomic-writer`, HEAD...upstream `0 0`. HEAD...C `3 0`; HEAD...PR104 `17 0`; HEAD...origin/main `28 0`. These counts use local refs, without fetch; remote PR heads were separately read below.
2. Complete registered topology follows. Preserve every branch/HEAD/worktree, including four prunable registrations. No prune, branch, worktree or history mutation.
3. D staged set empty. Root staged set empty. Other accessible registered trees inspected below have empty staged sets.
4. D unstaged tracked set empty. Root sole unstaged path `openspec/tasks/PROJECT-TASKS.md`, **161 additions + 1 deletion**, preserve/no transfer/no stage. Other accessible registered trees have empty unstaged tracked sets.
5. Readiness-entry D untracked set is exactly these eleven corrective files: index, plans05–13 and TEST-ALLOCATION.md, all existing from prior planning. Root's32 paths below/historical persistence's six remain preserve/no transfer/no stage. This pass modifies only those eleven owned documents; stage/transfer **none now**. All five categories were rechecked; D branch/base/divergence/topology/tracked/index state and old branch heads remain unchanged.

```text
openspec/debate/debate-summary-reasoning-effort-model-profiles.md
openspec/plans/reasoning-effort-model-profiles-cli/PLAN.md
openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md
openspec/plans/reasoning-effort-model-profiles-posix/PLAN.md
openspec/plans/reasoning-effort-model-profiles-projection/PLAN.md
openspec/plans/reasoning-effort-model-profiles-resolution/PLAN.md
openspec/plans/reasoning-effort-model-profiles-windows/PLAN.md
openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md
openspec/specs/reasoning-effort-model-profiles-cli/spec-01-atomic-effort-editing.md
openspec/specs/reasoning-effort-model-profiles-cli/spec-02-truthful-inspection-and-guidance.md
openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md
openspec/specs/reasoning-effort-model-profiles-ownership/spec-01-recoverable-field-ownership.md
openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md
openspec/specs/reasoning-effort-model-profiles-posix/spec-01-packaged-cross-platform-projection.md
openspec/specs/reasoning-effort-model-profiles-projection/spec-01-callable-managed-json-projection.md
openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle.md
openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-01-tested-version-diagnostic.md
openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-02-runtime-evidence-and-support.md
openspec/specs/reasoning-effort-model-profiles-tui/spec-01-staged-effort-editor.md
openspec/specs/reasoning-effort-model-profiles-tui/spec-02-inspection-and-save-status.md
openspec/specs/reasoning-effort-model-profiles-windows/spec-01-cross-platform-activation.md
openspec/tasks/001-reasoning-effort-model-profiles-persistence.md
openspec/tasks/002-reasoning-effort-model-profiles-downgrade.md
openspec/tasks/003-reasoning-effort-model-profiles-resolution.md
openspec/tasks/004-reasoning-effort-model-profiles-capability.md
openspec/tasks/005-reasoning-effort-model-profiles-ownership.md
openspec/tasks/006-reasoning-effort-model-profiles-projection.md
openspec/tasks/007-reasoning-effort-model-profiles-posix.md
openspec/tasks/008-reasoning-effort-model-profiles-windows.md
openspec/tasks/009-reasoning-effort-model-profiles-cli.md
openspec/tasks/010-reasoning-effort-model-profiles-tui.md
openspec/tasks/011-reasoning-effort-model-profiles-runtime-compatibility.md
```

| Worktree (under `/tmp/opencode/` unless absolute) | Branch | HEAD prefix | State/disposition |
| --- | --- | --- | --- |
| `/home/adrian/Projects/afergon-ai` | main | b558aad | Dirty originals above; preserve |
| afergon-ai-ci-pnpm-release-pin | fix/ci-pnpm-release-pin | 493c1b8 | Prunable registration; preserve |
| afergon-ai-issue94-artifacts | docs/issue94-p1-persistence-plan | 0c0c8e3 | Clean; preserve |
| afergon-ai-issue94-p1-plan-publication | docs/issue94-p1d-writer-plan | a37daee | Clean; preserve |
| afergon-ai-merge-pr83-main | merge/pr83-main | 38e4527 | Prunable registration; preserve |
| afergon-ai-reasoning-effort-p1-exact-byte-snapshot-lifecycle | feat/reasoning-effort-p1-exact-byte-snapshot-lifecycle | 071afba | Clean; preserve |
| afergon-ai-reasoning-effort-p1-pure-edit-preparation | feat/reasoning-effort-p1-pure-edit-preparation | 9f53f83 | Clean old B tree; preserve |
| afergon-ai-reasoning-effort-p1-pure-edit-preparation-tdd | feat/reasoning-effort-p1-pure-edit-preparation-tdd | 08d6a22 | Clean; preserve |
| afergon-ai-reasoning-effort-p1-read-validation | feat/reasoning-effort-p1-read-validation | db9d296 | Clean; preserve |
| afergon-ai-reasoning-effort-p1-targeted-migration-atomic-writer | feat/reasoning-effort-p1-targeted-migration-atomic-writer | 8963d8e | Only corrective untracked plans; reuse for planning only |
| afergon-ai-reasoning-effort-persistence | feat/reasoning-effort-persistence | 2887100 | Six untracked historical artifacts; preserve |
| afergon-ai-remove-retirement-receipts | test/remove-retirement-receipt-tests | 9d24705 | Prunable registration; preserve |
| afergon-ai-stabilize-retirement-cleanup-verification | fix/retirement-cleanup-verification | 5bc2263 | Prunable registration; preserve |

Historical persistence untracked paths: this slug's `PLAN-INDEX.md`, `plan-01-compatible-read-validation.md`, `plan-02-pure-edit-preparation.md`, `plan-03-exact-byte-snapshot-lifecycle.md`, `plan-04-targeted-migration-atomic-writer.md`, and `openspec/results/reasoning-effort-model-profiles-persistence/RESULT.md`. Each remains untouched. Prunable registrations point to nonexistent locations; their filesystem state cannot be inspected and is not claimed clean.

### Verified closure and approved replacement delivery

| PR | State / merge | Exact head | Immediate base | Changed lines |
| --- | --- | --- | --- | ---: |
| 104 | OPEN | a37daeec2d1fee936f0aa7977704bbce49297e40 | docs/issue94-p1c-snapshot-plan | docs predecessor |
| 106 | CLOSED / unmerged | db9d2962f8ba0228f5f176de82c1ac8b01c2d2b0 | docs/issue94-p1d-writer-plan | 366+8=374 historical |
| 107 | CLOSED / unmerged | 08d6a22c398d799dbcc0bccf291ab712be6d9279 | feat/reasoning-effort-p1-read-validation | 347+10=357 historical |
| 108 | CLOSED / unmerged | 071afba72776961a4a68a6e6e780c47a35ee4be7 | feat/reasoning-effort-p1-pure-edit-preparation-tdd | 365+7=372 historical |
| 109 | CLOSED / unmerged | 8963d8e5aa16a91b7a131e9405c58f9636c33301 | feat/reasoning-effort-p1-exact-byte-snapshot-lifecycle | 352+13=365 historical |

User explicitly approved replacement basis and obsolete source PR deprecation/closure. Parent reports authorized `gh pr close --comment` in109→108→107→106 order, marking class-hexagon issue94 supersession, without merge/delete-branch/force actions. This pass independently read gh states/heads and verified retained local refs with git show-ref and remote heads with git ls-remote; it performed no PR/Git mutation. Historical alternatives were rejected: additive changes threatened budgets; appending after D would land the rejected prefix before correction. No pending fork or old-PR disposition remains.

**Approved delivery basis:** replacement class-correct source chain from historical docsPR104 `a37daeec2d1fee936f0aa7977704bbce49297e40`, through separately authorized reviewed corrective planning publications first. PR104 remains OPEN/unmerged; PR106–109 remain CLOSED/unmerged records with heads/branches/history preserved read-only. Keep **Stacked PRs to main**: pending children target immediate predecessor, then main after authorized integration/revalidation; no tracker/strategy switch. No replacement source branch/worktree/PR exists or is created here.

Reuse D only for these eleven planning edits. Future source isolation uses `feat/reasoning-effort-p1-class-05` through `-13` and `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-05` through `-13`, each from its exact accepted predecessor after renewed gate. Future docs use branches docs/issue94-p1-class-plan-00 through -06 and worktrees /tmp/opencode/afergon-ai-issue94-p1-class-plan-00 through -06. Check each exact local/remote ref and filesystem path for collisions before authorized creation; STOP on changed isolation/disposition. Preserve old source trees/closed-PR refs/root32/index161+1 read-only. No wholesale source ancestry/dirty-file transfer. After explicit publication authorization, transfer/stage only that P0–P6 unit's exact named planning paths/index delta, never unrelated files; implementation stages only its owned source/test/docs/result deltas after a separate gate.

### Source workload forecasts — additions AND deletions

D's six-module source baseline is297 lines; focal suite779 lines is absent from docs PR104. [TEST-ALLOCATION.md](TEST-ALLOCATION.md) statically reconciles55 groups into A35/B72/C46/D65 =218, with exact ranges, expanded arguments, destinations and retained assertions. The2705-line `tests/model-profiles.test.ts` exists in PR104 and is inherited unchanged, not newly charged. All14 invalid raw fixtures remain separate at read/prepare/acquire/update entrypoints. New seams/checker/path tests are additional; no whole779/906-line initial focal transfer or deduplicated entrypoint coverage.

| Unit | Source/config incl extraction deletions | Tests incl fixture churn | Docs | New result | Plan/index churn | Total forecast |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 05 | 110–145 | 55–90 | 4–6 | 55–65 | 8–12 | 232–318 |
| 06 | 100–125 | 70–105 | 4–6 | 55–70 | 8–12 | 237–318 |
| 07 | 75–95 | 100–145 | 4–6 | 55–65 | 8–12 | 242–323 |
| 08 | 85–105 | 150–180 | 4–6 | 55–65 | 8–12 | 302–368 |
| 09 | 50–65 | 90–120 | 4–6 | 55–65 | 8–12 | 207–268 |
| 10 | 65–85 | 65–90 | 4–6 | 55–65 | 8–12 | 197–258 |
| 11 | 65–85 | 155–185 | 6–8 | 65–80 | 8–12 | 299–370 |
| 12 | 45–65 | 155–205 | 6–8 | 65–75 | 8–12 | 279–365 |
| 13 | 45–65 + CI3–5 | 145–185 | 12–17 | 65–80 | 8–12 | 278–364 |

Grounding:05 alias/core extraction counts deletions/facades/include;06 owns domain raw type/version/recovery policy plus3 old direct cases/new matrix;07 owns application observation type/observation-only port and32 old read cases/shared fixture data.08 owns all72 B cases,59-line preparation/4-line patch and exact clone extraction; reversible named B1 tables/shared raw data reduce duplicate setup without dropping any entrypoint assertion.09 adds absolute binding/cwd seams and legacy-only primitive fault characterization.10 owns shared snapshot application datatypes with a real inspector and new standalone cases;11 imports them and retains all46 old acquire cases plus fault helpers.12 owns10 real-adapter old update cases, new memory fakes and negative graph/checker fixtures (205-line test upper includes approximately70 real-order/55 memory/80 checker+fixture lines).13 owns55 old real integration cases/saver fault helper, final entry binding churn and CI3–5. Initial TEST-ALLOCATION/planning publication is charged separately, never hidden in source overhead.

These are local reversible readable-fixture reuse forecasts, not caps/proven fits.08/11 retain only7/5 lines before STOP; extra cycles/review fixes require reforecast or another complete-capability split before execution continues. No known technical blocker remains. Count all additions/deletions/helpers/results/CI/artifacts; prefer≤350, **STOP375, hard399**, never cut evidence. Remeasure each actual approved replacement PR base; no additive source delivery is authorized.

### Planning publication units — future authorization only

All eleven corrective planning artifacts aggregate well above400 lines; parent already warned. Replace the old359-line P0 grouping with an index-only predecessor and separate exact owned pairs/ledger. Initial docs are fully charged before source delivery, never free overhead.

| Publication | Exact owned artifacts | Predecessor | Artifact count | Forecast including index delta |
| --- | --- | --- | ---: | ---: |
| P0 overview | ARCHITECTURE-PLAN-INDEX.md only | PR104 exact head | 1 | actual index lines |
| P1 domain contracts | plan05 + plan06 + index delta | P0 | 3 | actual pair +6–12 |
| P2 read/preparation | plan07 + plan08 + index delta | P1 | 3 | actual pair +6–12 |
| P3 storage/inspection | plan09 + plan10 + index delta | P2 | 3 | actual pair +6–12 |
| P4 complete snapshot/update | plan11 + plan12 + index delta | P3 | 3 | actual pair +6–12 |
| P5 compatibility/platform | plan13 + index delta | P4 | 2 | actual plan +6–12 |
| P6 case ledger | TEST-ALLOCATION.md + index delta | P5 | 2 | actual ledger +6–12 |

Measure actual lines/base-relative additions+deletions, including6–12 changed status-index lines per descendant. P0 index-only must remain below375 projected/399 final; pairs/ledger have ample current artifact headroom. Any later review growth requires remeasurement/split, not abbreviated contracts. No publication/stage/commit/push/PR/history/worktree mutation is authorized.

Measured readiness artifact lines: index287,05=88,06=90,07=88,08=90,09=90,10=90,11=91,12=97,13=112,allocation118; aggregate1241, unchanged line totals after readiness edits. Earlier271/1079 counts are historical pre-WARN measurements. Initial docs cost these final full contents once relative to PR104, not local intermediate edits; later publication/source churn counts additions AND deletions. No publication performed.

| Unit | Initial artifact lines | Future status-delta additions+deletions | Projected publication workload |
| --- | ---: | ---: | ---: |
| P0 | 287 | 0 | 287 |
| P1 | 88+90=178 | 6–12 | 184–190 |
| P2 | 88+90=178 | 6–12 | 184–190 |
| P3 | 90+90=180 | 6–12 | 186–192 |
| P4 | 91+97=188 | 6–12 | 194–200 |
| P5 | 112 | 6–12 | 118–124 |
| P6 | 118 | 6–12 | 124–130 |

These subtotals do not prove future publication diffs: review corrections and later index replacements count both sides. Initial documents are new relative to the approved docs base, so their final complete contents count once, not intermediate local editing churn. Source deliveries still count all actual additions/deletions. Seven-unit planning publication requires separate authorization; none is performed here.

## Implementation Steps

- [x] Record user-approved replacement basis and parent-authorized obsolete closures; verify retained heads/branches read-only.
- [ ] Complete independent planning review and user acceptance; publish measured owned documentation units when separately authorized.
- [ ] Obtain renewed Plan-to-Implement gate; reinspect all five Git categories and exact remote heads. Stop if disposition/isolation changed.
- [ ] Execute05→13 sequentially; each capability has code/tests/docs/result, current checks and review before a dependent delivery.
- [ ] Reconcile all218 behavioral cases and602-suite historical baseline with final actual verification; only full corrected acceptance enables P2/P3.

## Interfaces and Technical Contracts

### Ownership and inward dependencies

```text
compatibility functions → infrastructure composition root
                           ├→ NodeProfileStorageAdapter → legacy saveConfig (unchanged body)
                           ├→ NodeSnapshotInspectionAdapter / NodeMigrationSnapshotAdapter
                           └→ Read / Prepare / Update use cases
application use cases → application semantic ports + concrete domain policies
infrastructure adapters → application ports + domain classes
domain classes → domain-owned alias policy, raw contracts and pure cloner only
```

| Existing module | Proposed ownership |
| --- | --- |
| domain/stored-assignment.ts | Retain class/static factory/private assignment-only constructor |
| domain/assignment-patch.ts | Retain data interface |
| infrastructure/document-validation.ts | Compatibility delegate to domain ProfileDocumentPolicy; original-path checks move intact |
| infrastructure/prepare-assignment.ts | Compatibility delegate to PrepareProfileAssignmentUseCase + domain ProfileAssignmentPolicy |
| infrastructure/migration-snapshot.ts | Thin compatibility delegates; mechanics in snapshot adapter classes and storage recheck |
| infrastructure/profile-store.ts | Thin load/update delegates; all business sequencing in application UpdateProfileAssignmentUseCase |

Domain: `AgentTargetPolicy.normalize(input: unknown): SupportedAgent`, `select(profile: Record<string, unknown>, requested: string): string`; concrete, no alias port. Move only existing supported-agent list/map/normalization into its pure domain module; legacy core keeps exports/type/facade delegation and identical errors. No unsupported-name exception swallows recognized assignment validation.

`ProfileDocumentPolicy.validate(raw: unknown, sourceIdentity: string): RawProfileDocument` returns the same object, with no defaults/normalization. `ProfileAssignmentPolicy.prepare(input: PrepareAssignmentInput): PreparedAssignment` receives concrete validator, target policy and `RawProfileDocumentCloner` via constructor. Move the exact generic clone JSON body into that domain-owned cloner, reproducing its same pure asPlainObject guard locally; legacy `cloneAssignments<T>(...)` delegates with the same default/fallback behavior. Retain legacy core's unrelated asPlainObject helper for its other consumers; no broad guard migration. This narrow deliberate extraction avoids domain→legacy imports, retains generic clone behavior and establishes one clone owner. No replaceable-cloner interface is justified.

Shared ownership:06 delivers DOMAIN `RawProfileDocument` at `domain/profile-document.ts`, retaining arbitrary unknown members.07 delivers APPLICATION `ProfileDocumentObservation { sourceIdentity: string; exists: boolean; sourceBytes?: Uint8Array }`, `ObservedProfile { document: unknown; source: ProfileDocumentObservation; originalText?: string }` and `LoadedProfile` at `application/profile-document-observation.ts`, importing the domain type.10 delivers APPLICATION `AcquireMigrationSnapshotInput { source: ProfileDocumentObservation; recoveryDocument: RawProfileDocument }` and `SnapshotReceipt { snapshotPath: string; disposition: "created" | "reused"; complete: true }` at `application/migration-snapshot-contracts.ts` with its real inspector;11/12 import them without redeclaration. Present/absent byte consistency and defensive copies remain required. Identity is a configured capability/diagnostic token, never caller-selected I/O or environment authority.

Prefix contracts:07 declares `ProfileObservationPort.observe(): ObservedProfile` at `application/profile-observation-port.ts`; NodeProfileStorageAdapter implements **only that complete capability**.09 declares `ProfileStoragePort extends ProfileObservationPort` at `application/profile-storage-port.ts`, adding `recheck(source: ProfileDocumentObservation): void` and `atomicPersist(document: RawProfileDocument, source: ProfileDocumentObservation): void`; actual adapter then implements all methods.10's real NodeSnapshotInspectionAdapter implements no SnapshotPort.11 declares complete `SnapshotPort.acquire(input: AcquireMigrationSnapshotInput): SnapshotReceipt` at `application/snapshot-port.ts`, and NodeMigrationSnapshotAdapter implements acquire. No accepted prefix has missing methods or throwing future stubs; ports ship with real consumers.

`ReadProfileDocumentUseCase(storage, validator).execute(): LoadedProfile`; `PrepareProfileAssignmentUseCase(policy).execute(input): PreparedAssignment`; `UpdateProfileAssignmentUseCase(reader, preparer, validator, storage: ProfileStoragePort, snapshots: SnapshotPort).execute({profileName, agentName, patch}): UpdateResult`. Constructors receive collaborators, never read environment or fs. Concrete domain collaborators need no interface without alternate behavior. Port fakes substitute storage/snapshot capabilities in memory.

Absolute binding: composition preserves existing precedence by computing `absoluteConfigPath = path.resolve(getConfigPath(initialEnv))` once, then private `boundEnv` copies relevant initial variables and sets AFERGON_AI_CONFIG_DIR to the absolute dirname. Require basename/config.json and `getConfigPath(boundEnv) === absoluteConfigPath`; legacy API always chooses config.json. Observe/recheck use that absolute path; `saveConfig(document, boundEnv)` uses the same path despite later cwd/caller-env changes. Merely copying relative env did NOT pin location (config.ts24–38/130–131). This adds no saver-body rewrite/precedence change or inner ambient dependency;09/13 own real relative-path/cwd characterization.

Only infrastructure selects Node/defaults/env/path collaborators; constructors assign. Buffer/UTF8/Node comparison/fd/stage filename/0600 stay outside. Domain `ProfileDocumentPolicy.requireSupportedVersion(document, operation: "prepare"|"update"|"snapshot")` owns existing future-version operation admissibility/errors; inspector delegates. `requireRecoveryMatch(matches: boolean)` owns recovery-match refusal, while adapter computes Node structural comparison of parsed captured/default JSON. Exact file-byte equality remains adapter mechanics. Legacy snapshot wrapper retains Buffer-only diagnostics; inner ports accept genuine Uint8Array.

Atomic primitive authority:09 atomicPersist trusts its caller for full validation/migration. Before12 no production atomicPersist caller exists; tests call it only with validated legacy data for mechanical characterization. From12 the sole production invocation is UpdateProfileAssignmentUseCase through the port; composition may instantiate adapters but must not call raw persist. No new backup guard/product restriction is added to the primitive and no public extended-update wrapper exists before13.

### Preservation ledger and write order

Validation retains strings/structured optional fields/empty objects/unknown metadata, recognized own undefined failures before clone, original escaped paths, malformed inactive/nontarget fields, future positive-safe versions readable but every mutation/no-op>2 refused before write-side operations. Targeting retains exact stored key priority, sole equivalent, ambiguous rejection, canonical new key, own prototype-like profile keys and active selection. Cloning preserves JSON metadata and independence both directions; unsupported JS graphs are not newly supported.

Preparation returns independent candidate, changed/migrationRequired/prospective version and actual agentKey. Candidate raw version stays unchanged until completed migration snapshot. Empty/identical updates preserve exact source bytes/version/previous backup. Legacy-only edits stay legacy; changed structured data migrates even without effort; v2 never snapshots again.

Update order: observed read/full validation → prepare/full candidate validation/future refusal → no-op return or source recheck → required completed snapshot (including adapter's immediate pre-open recheck) → apply version2 only after receipt → full final validation → source recheck → atomicPersist. Invalid/future/preflight failures never invoke snapshot or persist. Snapshot failure never persists. Completed snapshot survives later save failure for exact verified retry.

Snapshots retain exact present bytes, deterministic default bytes when absent, structural recovery equality, exclusive wx/mode0600, fsync/close, valid exact-byte reuse, malformed/mismatch refusal, ownership-limited partial cleanup and nested AggregateErrors. Existing source/backup mode unchanged; Windows has no invented POSIX mode assertion. Observe/recheck distinguish ENOENT from read faults; changed/deleted/appeared source fails closed. Do not rewrite lock systems or saver. Rename remains commit point; compare-to-rename gap and best-effort directory fsync remain explicit, without crash-durability/transaction promises.

## Acceptance Criteria

- [ ] Every old spec/task/PLAN obligation and all218 cumulative cases retain behavior, not merely equal test counts.
- [ ] Policies/classes own real behavior; business sequencing is in injected application use cases, never cosmetic static wrappers around fs.
- [ ] Domain/application have no legacy/Node/env imports; architecture tests inspect resolved inward graph and actual fake-driven class behavior.
- [ ] All real Node fault/mode/conflict/retry contracts and native Windows baseline remain required; live entrypoints/host output stay unchanged.
- [ ] Every source/publication unit is measured≤399, all expected evidence classified, and user gates respected.

## Verification

**Produced:** prior technical contracts/allocation and supplied parent technical PASS, five-category readiness inventory, read-only closure/ref verification and planning format/preservation checks. **Not applicable:** tests/build for this Markdown-only pass. **Outstanding:** parent targeted readiness re-review, separately authorized planning publication, renewed Implement gate and all future source/TDD/build/native/review/budget evidence. No independent review is performed here.

Readiness format/preservation checks produced: index and nine plans each have15 required headings and literal None in both Open Questions/Design Tensions; all are ready-with-assumptions. D tracked/cached diffs empty, exactly eleven owned untracked paths; branch/HEAD/topology/root161+1/32 originals and old local/remote heads retained. Static218 ledger unchanged. This is planning evidence, not tests/build or independent re-review.

12 owns `tests/model-profiles-architecture.test.ts` and its pure in-memory graph/checker helpers/fixtures: negative domain→application/infrastructure/legacy edges, transitive forbidden chains, inner Node/fs imports, process/env/global aliases and host calls must be rejected even under misleading class/folder names. Positive clean inward graphs, no-I/O constructors and real injected fake-port behavior must pass. Test the checker itself against synthetic failures; class-presence checks are insufficient. Count helper/negative fixture/result growth in12's revised budget.

Native gap: actual `.github/workflows/windows-launcher.yml` currently runs bootstrap/argv/OpenCode tests, **not the new persistence fault suite**. Old SUCCESS is no new native proof.13 owns a narrow extra step after existing build/health: `pnpm exec vitest run tests/model-profiles-persistence.test.ts tests/model-profiles-use-cases.test.ts tests/model-profiles-architecture.test.ts --no-file-parallelism`. It covers new domain/usecase/adapter/compat cases; only C's3 POSIX mode cases skip Windows. Existing launcher checks stay intact; workflow addition/churn counts in13. No CI file is edited now.

Future TDD follows exact `skills/implement/SKILL.md`: one runnable assertion RED, minimal GREEN at lowest sufficient TPP index, then ≥2 adversaries individually RED/GREEN, green-only refactor. Missing import/compile errors are not RED. Reused behavior that passes is characterization; explicitly explain if two genuine breaks cannot be found. New injected seams test behavior/call order with memory fakes, not folder/class-name assertions alone. Results retain every mandatory Implement heading and exact command/outcome/reason/TPP/cycle rows, never fabricated historic evidence.

Future commands, **not run here**: focal `pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism` and single-name `-t "<exact single test name>"`; additional architecture/use-case files run explicitly per owned unit; `pnpm typecheck`; `pnpm build`; `pnpm run health:runtime`; `node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"`; original regression `pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism`; `pnpm test` (includes mandatory rebuild). Retain original Ubuntu Test/native Windows launcher checks. No current602/218 rerun is claimed; counts are historical D result evidence. Isolate HOME/XDG/config/state and restore stage spies per case.

Replacement-prefix applicability:05 owns the initial explicit tsconfig vertical include (one addition);07 inherits it without charging it twice. Before the reader exists,05/06 require their own exact emitted imports declared in those plans; the historical profile-store import is outstanding/not yet applicable to those pure capabilities, never fabricated as passed. From07 onward the exact original profile-store emitted import and full final baseline apply. All prefixes still run typecheck/build/health/original regression/full suite; no command is run during this planning session.

## Open Questions

None

## Dependencies

Approved replacement basis (produced) → parent targeted planning re-review → separately authorized measured P0–P6 publication rooted at exact PR104 → renewed Implement gate → 05→06→07→08→09→10→11→12→13 → full P1 acceptance → original P2/P3. Ordinary publication/implementation gates are pending, not unresolved design. Per-PR diagrams mark current 📍. Technical dependency:06 uses05;07 uses06;08 uses05/06;09 extends07;10 uses06/07;11 uses09/10;12 uses07/08/09/11;13 composes all. No delegation required.

## Risks and Watchouts

Do not stage whole779/906-line tests from a source-free docs base, copy D ancestry as “free” correction, or omit initial planning/result overhead. Replacement forecasts do not apply to additive deletion-heavy moves. Narrow pure ownership extraction must preserve legacy aliases/errors/generic cloning and does not authorize broader legacy remediation. Snapshot receipt is not config-commit proof. Adapter atomicPersist is internal mechanics, not a public bypass around migration. No old writer may overwrite extended state; retain full extended copies, freeze writes and require consent for pre-v2 restoration losing later edits.

## Completion Condition

Planning output is ready-with-assumptions: approved structural basis recorded, no open questions/design tensions, unchanged technical contracts and218-case allocation, only local reversible fixture/budget assumptions. Parent targeted re-review and explicit P0–P6 publication approval remain; source execution requires a separate renewed Plan-to-Implement gate. No publication/new implementation/release is authorized now. Full correction completes after13's required behavior/architecture/native/review evidence, preserving closed obsolete history and original scope.

## Publication navigation — authorized 2026-10-08

**Planning publication only; replacement implementation awaits user approval.** User authorized P0–P6 publication after final planning Review PASS `ses_ee49cd162ffeTMC1TU4D5x56JD`. The preceding 287 lines are the byte-preserved D planning record: its inventory, permission statements, counts and pending gates describe that dated planning tree, not this clean docs publication tree. This block records the later publication authorization; architecture contracts and source forecasts are unchanged.

Stacked PRs to main: historical [PR104](https://github.com/adrian-afergon/afergon-ai/pull/104) at `a37daeec2d1fee936f0aa7977704bbce49297e40` → P0 → P1 → P2 → P3 → P4 → P5 → P6. Each pending child targets its immediate predecessor; integration/retargeting requires later authorization. PR101–104 remain historical; PR106–109 are CLOSED/unmerged and superseded, with branches/history preserved. This index is forward corrective architecture authority; no merge/review approval or source gate is granted.

| Unit | Owned documents (plus this block's small descendant delta) | Publication status / URL |
| --- | --- | --- |
| P0 | Index only | Published [PR110](https://github.com/adrian-afergon/afergon-ai/pull/110); OPEN, not merged |
| P1 | plans05–06 | Published [PR111](https://github.com/adrian-afergon/afergon-ai/pull/111); OPEN, not merged |
| P2 | plans07–08 | Published [PR112](https://github.com/adrian-afergon/afergon-ai/pull/112); OPEN, not merged |
| P3 | plans09–10 | Published [PR113](https://github.com/adrian-afergon/afergon-ai/pull/113); OPEN, not merged |
| P4 | plans11–12 | Published [PR114](https://github.com/adrian-afergon/afergon-ai/pull/114); OPEN, not merged |
| P5 | plan13 | Published [PR115](https://github.com/adrian-afergon/afergon-ai/pull/115); OPEN, not merged |
| P6 | TEST-ALLOCATION.md | Prepared on `docs/issue94-p1-class-plan-06`; PR pending |

Forward links to owned plans/ledger become available progressively through P6; they are intentional future links in earlier prefixes. Produced: supplied final planning PASS, exact historical-base verification and byte-identical transfer checks. Not applicable: local application tests/build for docs-only publication. Outstanding: current-head CI, human integration authorization and renewed Plan-to-Implement approval; native persistence/checker evidence remains future implementation work.
