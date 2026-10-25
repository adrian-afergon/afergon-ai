# Plan: Safe model-only export with a complete current-state backup (P2)

- **Source Task**: `002-reasoning-effort-model-profiles-downgrade.md`
- **Source Spec(s)**:
  - `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md`
- **State**: ready-with-assumptions
- **Execution Mode**: direct
- **Vertical Slicing**: not-needed

## Summary

This local, uncommitted plan delivers one internal export capability: capture valid current profile state, create a complete raw-byte backup, and write a separate model-only export. Return success only after both outputs complete. Recovery remains documented/manual, with no automatic or callable restore API. No CLI/TUI controls, host activation, or installer changes.

The human approved an additional CURRENT backup, a fresh P2-only cohesive size exception above400 without a new numeric ceiling, and the final functional contract. The earlier775–900 implementation forecast is not a cap. Those decisions do not authorize implementation, commits, publication, or merges. The next gate explicitly requests artifact publication and Plan→Implement authorization. Existing P1 PRs remain unchanged for asynchronous human review.

## Planning Scope

- Pure model-only transformation retaining exact model values and model inheritance; warn about effort and other assignment metadata omitted by legacy strings.
- Raw-byte current backup from the same captured source observation used for export. It is distinct from source, pre-migration snapshot, and export destination.
- Refuse absent, unreadable, corrupt, or unsupported-future sources without substituting defaults or creating outputs.
- Exclusive output creation, protected-path/alias checks, descriptor write/fsync/close failure handling, owned-partial cleanup, and reporting of a surviving complete backup.
- Directly callable internal API with required explicit `currentBackupPath` and `destinationPath` parameters.
- README guidance; focused behavior tests; emitted-runtime evidence; explicit native Windows suite-list updates; implementation RESULT before review.
- Focused pre-implementation publication of only the task-owned planning artifacts, as required by `PROJECT-TASKS.md`.

Excluded: automatic/callable restore, old-writer safety, effort support in legacy format, CLI/TUI controls, host cleanup/projection/activation, paid provider requests, multi-file atomicity, CAS, and directory-fsync guarantees. Tasks006/008 are guidance references, not behaviors delivered here.

## Design Rule Alignment

- Use the existing product vertical `scripts/lib/model-profiles/{domain,application,infrastructure}` with dependencies pointing inward. Domain/application contain no Node/fs/environment access. Classes own behavior; interfaces describe semantic ports and data; collaborators are constructor-injected.
- Reuse the existing reader, source observation, document validator, assignment value object, deep cloner, and storage recheck. Reuse the snapshot adapter's exclusive-write mechanics, NOT its reuse-if-identical EEXIST behavior: P2 rejects existing destinations.
- `Uint8Array` crosses the application port for raw backup bytes; serialized export is a string. Encoding belongs in infrastructure. Do not call the legacy normalizing facade or change the legacy saver.
- Architecture assertions at S13 pin domain7/application8 modules, inward import forms, original wrappers, sole production `atomicPersist` ownership, and the legacy saver body hash. Update module-count assertions with their new modules; preserve all negative fixtures and saver protection.
- Standing task-index size rules are superseded ONLY for this explicitly authorized cohesive P2 implementation. Tests, helpers, README, RESULT, and CI changes remain in the measured implementation unit. Other deliveries do not inherit the exception.
- Task-index artifact-publication rules still apply: publish focused planning units below400 before consuming them in implementation. No separate RESULT publication loophole.

## Assumptions

Local engineering choices, not separately attributed human approvals:

1. Preserve document `version` verbatim; serialize export as UTF-8 `JSON.stringify(document, null, 2) + "\n"`.
2. Require caller-supplied output paths, permitting retries with fresh destinations instead of implicit fixed-backup reuse. Reject existing destinations even if byte-identical.
3. Write backup first, then export. Preserve a completed backup if later transformation/serialization/export fails, and expose its path together with the original error. Clean only incomplete files owned by this invocation; never silently delete a valid backup.
4. Compare resolved paths before either write; use exclusive creation for final collision protection. No realpath, adversarial directory-replacement, or closed compare-to-write race guarantee.
5. Match existing adapter mechanics for recursive output-parent creation; newly created parent directories may remain on failure. This is not a multi-file transaction.
6. Preserve foreign document metadata. The existing validator skips unknown agent keys: opaque foreign values are not to be validated as managed assignments. Transform managed assignments and valid recognizable assignment values without claiming support for opaque foreign-agent state. Tests must make this boundary explicit; if source inspection exposes a contradiction with the active spec's metadata-loss contract, stop for respecification rather than silently narrow it.
7. Source observation already supplies existence and raw bytes, but the reader substitutes defaults for absent files. The export use case must explicitly refuse `!source.exists` before any output.
8. The snapshot path is injected from composition using the existing `${configPath}.pre-v2.bak` convention. It may be absent; neither receipt nor guidance claims it exists or contains current edits.
9. Recheck the captured source before the first write using the existing storage port. Backup/export represent that captured observation, not a guaranteed later filesystem state. No CAS or universal durability claim.
10. Refusals propagate meaningful original errors. A typed application error identifies any completed backup and retains all causes after later failure; success returns a receipt. Exact naming is local to implementation.

## Design Tensions

None. The original size tension and functional questions are resolved by the recorded human decisions. The explicit preservation/unknown-agent boundary above must be verified against the spec, not used as permission to redefine it.

## Vertical Slicing Decision

One cohesive implementation unit. The single prior slicing pass is exhausted; the additional current-backup scope invalidated its two-slice allocation. The human granted a fresh P2-only size exception. Do not repeat slicing, compress code, or remove evidence to meet an obsolete number. Focused planning-document publication is not a split of implementation behavior.

## Execution Strategy

After explicit authorization, create NEW isolated branches/worktrees from verified S13 commit `e8466abe5081a78bf7e605ffef4d926af729abeb`. Never recreate/prune old registrations or mutate the S13 worktree/PR. Artifact branches and then the implementation branch form an immediate-parent stack; each review uses the predecessor-relative diff. No merge or automatic retarget/rebase is authorized.

Proposed implementation branch: `feat/reasoning-effort-p2-export`; worktree: `/tmp/opencode/afergon-ai-reasoning-effort-p2-export`. Recheck branch/path collisions at creation. If the S13 head changes during asynchronous review, STOP and replan. All five Git categories must be re-inspected at each creation/implementation start.

### Artifact publication and size accounting

The S13 tree already contains the original task002, but not the P2 spec or plan. Based on the verified S13 diff:

| Planning unit | Allowed contents | Budget |
| --- | --- | ---: |
| A: approved contract | amended task002, active P2 spec, exact original task/spec provenance backups |255 changed lines at planning audit; remeasure before staging |
| B: executable plan | this PLAN only | measure actual added lines before staging; must remain below400 |

Publish only these focused planning units if explicitly authorized. Then create implementation from their accepted stack head, retaining S13 ancestry. Do not include unrelated root dirty files. Artifact commits are reviewed as Markdown changes; no pointless unit tests or builds claimed for them.

Implementation forecast remains approximately775–900 additions+deletions, excluding initial planning artifacts, with moderate confidence. Recalculate/report actual source, tests, helpers, README, RESULT, and Windows workflow delta; do not call the forecast measured work or a numerical ceiling. The complete feature change includes planning artifacts too: report their measured totals separately AND combined, not hidden outside review accounting.

Grounding: actual S13 sources read through `git show e8466ab:<path>`; existing update use case50lines, snapshot writer57, inspection adapter55, composition48, document policy67, use-case tests328, snapshot-runtime tests117, and explicit nine-file Windows suite list. Largest uncertainties are failure-triangulation test verbosity and RESULT length. No source was implemented to produce these estimates.

## Git Audit and Disposition

Audit2026-10-25, before implementation approval:

- Root branch `main`, HEAD `b558aadbef0390c5e9ca833d6b34af1303ffb67a`, tracking `origin/main`, divergence0/0.
- Prospective S13 base exists as branch/object and remote PR134 head at exact `e8466abe5081a78bf7e605ffef4d926af729abeb`. PR134 is OPEN/unmerged against `feat/reasoning-effort-p1-class-12`. Its technical review/CI evidence is not human acceptance.
- Complete topology:30 registrations, accessible root plus29 linked registrations marked prunable because gitdir paths are missing. Cause UNKNOWN. Metadata/refs preserved; unavailable contents, node_modules, and snapshot hashes are NOT verified. Do not prune or recreate them.
- Staged: empty. Unstaged: only pre-existing `openspec/tasks/PROJECT-TASKS.md`,161additions/1deletion, preserve untouched.
- Untracked:35 individual paths, listed below. Task002/spec002 were amended only by explicit contract-alignment authorization; their original bytes were copied to provenance files and verified identical with `cmp` before amendment.

Task-owned transfer allowlist (copy only after approval; root copies remain available):

1. `openspec/tasks/002-reasoning-effort-model-profiles-downgrade.md`
2. `openspec/tasks/002-reasoning-effort-model-profiles-downgrade-old-20261025-194903.md`
3. `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery.md`
4. `openspec/specs/reasoning-effort-model-profiles-downgrade/spec-01-non-destructive-export-and-recovery-old-20261025-194903.md`
5. `openspec/plans/reasoning-effort-model-profiles-downgrade/PLAN.md`

The other30 untracked paths are PRESERVE ONLY, never transfer/stage:

1. `openspec/debate/debate-summary-reasoning-effort-model-profiles.md`
2. `openspec/plans/reasoning-effort-model-profiles-cli/PLAN.md`
3. `openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md`
4. `openspec/plans/reasoning-effort-model-profiles-posix/PLAN.md`
5. `openspec/plans/reasoning-effort-model-profiles-projection/PLAN.md`
6. `openspec/plans/reasoning-effort-model-profiles-resolution/PLAN.md`
7. `openspec/plans/reasoning-effort-model-profiles-windows/PLAN.md`
8. `openspec/specs/reasoning-effort-model-profiles-capability/spec-01-capability-validation.md`
9. `openspec/specs/reasoning-effort-model-profiles-cli/spec-01-atomic-effort-editing.md`
10. `openspec/specs/reasoning-effort-model-profiles-cli/spec-02-truthful-inspection-and-guidance.md`
11. `openspec/specs/reasoning-effort-model-profiles-ownership/spec-01-recoverable-field-ownership.md`
12. `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md`
13. `openspec/specs/reasoning-effort-model-profiles-posix/spec-01-packaged-cross-platform-projection.md`
14. `openspec/specs/reasoning-effort-model-profiles-projection/spec-01-callable-managed-json-projection.md`
15. `openspec/specs/reasoning-effort-model-profiles-resolution/spec-01-independent-resolution-lifecycle.md`
16. `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-01-tested-version-diagnostic.md`
17. `openspec/specs/reasoning-effort-model-profiles-runtime-compatibility/spec-02-runtime-evidence-and-support.md`
18. `openspec/specs/reasoning-effort-model-profiles-tui/spec-01-staged-effort-editor.md`
19. `openspec/specs/reasoning-effort-model-profiles-tui/spec-02-inspection-and-save-status.md`
20. `openspec/specs/reasoning-effort-model-profiles-windows/spec-01-cross-platform-activation.md`
21. `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
22. `openspec/tasks/003-reasoning-effort-model-profiles-resolution.md`
23. `openspec/tasks/004-reasoning-effort-model-profiles-capability.md`
24. `openspec/tasks/005-reasoning-effort-model-profiles-ownership.md`
25. `openspec/tasks/006-reasoning-effort-model-profiles-projection.md`
26. `openspec/tasks/007-reasoning-effort-model-profiles-posix.md`
27. `openspec/tasks/008-reasoning-effort-model-profiles-windows.md`
28. `openspec/tasks/009-reasoning-effort-model-profiles-cli.md`
29. `openspec/tasks/010-reasoning-effort-model-profiles-tui.md`
30. `openspec/tasks/011-reasoning-effort-model-profiles-runtime-compatibility.md`

Stage only explicit task-owned paths in the NEW isolation after reviewing status/diff/log. Future implementation-owned paths are the four new domain/application/infrastructure modules, composition/policy/architecture-test edits, two export test files, README guidance, explicit Windows suite-list lines, and `openspec/results/reasoning-effort-model-profiles-downgrade/RESULT.md`. Preserve every other path. Do not stage dependency links, modify Git config, absorb unrelated changes, or rewrite history.

## Implementation Steps

- [ ] Reinspect all five Git categories and exact remote base; verify branch/path availability; create new isolation only after authorization.
- [ ] Transfer only the five planning files, review and publish focused artifacts A then B, each below400 and reviewed before consuming implementation. Keep all original root dirty state and existing PRs untouched.
- [ ] Start every behavior with ONE meaningful failing test, run real RED, implement minimum TPP GREEN, then at least two sequential adversarial tests/characterizations and refactor green. Never manufacture RED for already-correct reused behavior.
- [ ] Policy tests: exact strings/model/inherit values, effort-only and metadata-only assignments, mixed profiles, unrepresentable-member warning, foreign metadata, prototype-like keys, deep-clone/input independence; then implement `ModelOnlyExportPolicy`.
- [ ] Adapter real-FS tests: raw bytes and strings, protected-path aliases, existing export/backup files, parent creation, open/write/fsync/close faults, owned-partial cleanup and combined failures; then implement semantic port and adapter without EEXIST reuse.
- [ ] Use-case tests: refuse missing/unreadable/corrupt/future sources with no outputs, recheck conflict, same-observation raw backup, post-migration edits, backup-before-export, no success until both writes, all output-path collisions, backup failure, and surviving complete backup on later failure.
- [ ] Implement `ExportModelProfilesUseCase`, wire constructor-injected dependencies in composition, and extend only the supported-version operation union with `export`. Keep source/old snapshot and legacy saver untouched.
- [ ] Update architecture assertions in the same unit as new modules without weakening negative fixtures; add both export test files to the explicit Windows workflow list, preserving all existing steps.
- [ ] Add emitted-runtime API verification and recovery guidance with honest snapshot/current-backup distinction and future006/008 cleanup prerequisites. Review guidance content; no Markdown string-match tests.
- [ ] Author RESULT during implementation before independent review, with exact TDD/TPP evidence, commands/exits, preservation audit, measured size and outstanding native evidence honestly marked.
- [ ] Run full local verification; independent canonical review exact head; publish only after PASS/explicit routing and applicable authorization. Obtain actual native Windows exact-head evidence before acceptance. Never merge.

## Interfaces and Technical Contracts

Proposed names, not delivered code:

- `domain/model-only-export-policy.ts`: `ModelOnlyExportPolicy`, constructor-injected assignment/agent policy and cloner; returns independent model-only document and loss metadata. Known structured model → exact string; explicit `inherit` preserved; omitted model removes the managed assignment so legacy inheritance applies. Preserve unknown document fields. Exercise opaque foreign-agent boundary explicitly; no accidental silent normalization.
- `application/profile-export-port.ts`: semantic `ProfileExportPort.writeExclusive` accepting output path, string or `Uint8Array` contents, and protected paths. No fs/process types.
- `application/export-model-profiles-use-case.ts`: `ExportModelProfilesUseCase` receives reader, document/policy collaborators, destination port, source-recheck port, and snapshot path. `execute({ currentBackupPath, destinationPath })` returns source/current-backup/export paths plus loss warnings only after success.
- Sequence: read captured observation → explicit existence/version refusal → validate/transform/serialize without output effects → recheck → write captured raw current backup → write model-only export → receipt. Any failure after completed backup must retain/report that backup, even if error construction/serialization placement changes during implementation.
- `infrastructure/node-export-destination-adapter.ts`: resolve/protect paths; create parent; exclusive `wx`0600; write/fsync/close; cleanup only owned partial; preserve original and cleanup causes. No partial success and no deletion of completed backups.
- Composition adds `createProfileCapabilities(env).exportProfiles` without exposing a new live command. Preserve original environment/path binding.
- The pre-migration snapshot may be absent. Warning/receipt must not claim it exists, contains current edits, or was refreshed by export. Source and old snapshot are never written by this use case.

## Acceptance Criteria

- [ ] Active spec's happy path, inheritance/metadata edges, source-refusal outline, both destination-collision cases, backup/export failure cases, and guidance-only recovery covered with artifact-appropriate evidence.
- [ ] Exact raw current-state backup and model-only output reflect the same capture, including post-migration edits. Source and existing snapshot remain byte-identical; all prior destinations intact.
- [ ] Effort/unrepresentable assignment loss is explicit and recoverable from raw current backup; no substitution of defaults on invalid/missing source.
- [ ] Success requires both completed outputs; partial/compound failures retain causes and identify surviving complete backup. No false atomicity/durability claim.
- [ ] No callable/automatic restore, CLI/TUI controls, or host effects. Future cleanup006/activation008 are clearly not released.
- [ ] Architecture, legacy saver, dependency direction, full baseline, emitted import/API, and native Windows evidence pass; size fully reported under P2-only exception.
- [ ] Rollback withdraws export and dependent suffix without deleting saved source/current backups/old snapshots. No merge or existing PR mutation.

## Verification

- Tests: focused `pnpm exec vitest run tests/model-profiles-export.test.ts tests/model-profiles-export-runtime.test.ts --no-file-parallelism`; relevant architecture/persistence/use-case/legacy suites; full `pnpm test` with mandatory build. S13's1088pass/8skip is prior context, not a current run claim.
- Build: `pnpm typecheck`; `pnpm build`; `pnpm run health:runtime`; inspect `pnpm run doctor:runtime` as applicable. Scripts verified in S13 package metadata; do not invent scripts or mask pre-existing failures.
- Additional evidence: emitted internal API under temporary isolated environment, actual on-disk byte equality, fault outcomes, exact-head native Windows logs through the UPDATED explicit suite list, all normal Test/Windows checks, measured artifact and implementation deltas.
- Rule compliance: inward imports/classes/ports/DI, negative architecture fixtures intact, saver body unchanged, actual Git disposition reinspection and exact stage allowlist, independent review. Docs-only artifacts require content review; unit tests/build N/A for those units alone.
- Record each item as produced, not applicable, or outstanding. Native coverage and review are outstanding until actually executed; local Linux is not Windows evidence.

## Open Questions

None.

## Dependencies

- P1 technically complete at reviewed/published S13 `e8466ab`; human async review remains pending and is not presumed. Main landing remains dependent on P1; local P2 isolation need not mutate or merge it.
- Explicit authorization for focused artifact commits/PR publication, then the approved Plan→Implement transition. Functional and size confirmations are not that transition.
- Task006 owned-host cleanup and008 routing are documentation references only, not implementation dependencies for this internal API.

## Risks and Watchouts

- Existing worktree contents are unavailable; refs remain. Create new isolation, never recreate/prune old registrations. If the verified base changes, stop/replan, not automatic rebase.
- Reuse source observation but refuse its absent-source defaults. Reuse exclusive-write mechanics but not snapshot EEXIST reuse. Protect every output/source/snapshot combination.
- Backup and export are two writes, not one transaction. Preserve/report completed backup on failure; parent directories may remain; compound cleanup errors must not erase original causes.
- Unknown/foreign-agent data must not be accidentally rejected or normalized. Behavior must align with the active metadata-loss contract; stop if a genuine contradiction emerges.
- Initial artifacts add real review cost beyond the775–900 source-unit forecast. Include them in whole-change reporting; do not transfer unrelated root plans/specs.
- New tests will not run in Windows unless explicitly listed. No claims of native success until logs on the actual published head exist.

## Completion Condition

The plan is ready for explicit approval, not executed. After authorization, publish and review the focused planning artifacts, then enter implementation only against that accepted contract with fresh Git audit. Delivery completion requires all acceptance items, passing tests/build, independent exact-head review, actual native CI evidence, measured size, and no unreported deviations. No merge is authorized.
