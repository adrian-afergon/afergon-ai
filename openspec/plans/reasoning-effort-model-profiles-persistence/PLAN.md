# Plan: Compatible, recoverable model-profile persistence

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole specification for this plan.
- **State**: ready
- **Execution Mode**: sequential
- **Vertical Slicing**: not-needed

## Summary

Deliver one semantic P1 PR: a complete, directly callable mixed-assignment store with strict validation, preservation, migration recovery, and tests/docs. Keep it inactive in every live workflow. Publish planning artifacts separately, then obtain the accepted Plan-to-Implement gate before execution.
Authority: `AGENTS.md`, the source spec/task, `openspec/debate/debate-summary-reasoning-effort-model-profiles.md`, and `openspec/tasks/PROJECT-TASKS.md`. Publication is an ordinary gate, not unresolved architecture.

## Planning Scope

Include mixed reads, targeted writes, independent clones, version policy, exact-byte snapshots, atomic replacement, failure evidence, and internal-only migration guidance.
Exclude P2 downgrade export, P3 resolution/clear/delete lifecycle, provider capability checks, host projection, CLI/TUI controls, and installer/refresh activation.
Keep `loadConfig`, `resolveAssignments`, `saveProfileAssignments`, live barrels, CLI/TUI/install/update/refresh routing and string contracts unchanged. Do not expose the new API through a live barrel.
Only new tests and future P2/P3 directly import the new module. No projection callback, projection import, child process, host read, or host write belongs in P1.

## Design Rule Alignment

- Registered skills read: `plannify`, `chained-pr`, `work-unit-commits`, `cognitive-doc-design`; registry: `.atl/skill-registry.md`. `skills/implement/SKILL.md` was also read to define accurate future TDD/result obligations, not executed.
- New code belongs to `scripts/lib/model-profiles/{domain,infrastructure}`; dependencies point inward. No application layer is needed for this bounded standalone storage operation.
- Domain behavior uses a class with static validation factory and private assignment-only constructor; interfaces describe data and operation parameters. Domain imports no fs, environment, host, or legacy infrastructure.
- Infrastructure may reuse pure `normalizeAgentName` and generic JSON `cloneAssignments` from existing core; do not rewrite the clone helper.
- Add `scripts/lib/model-profiles/**/*.ts` to the explicit `tsconfig.json` include list (currently legacy individual lib files only for this capability). `tsconfig.build.json` inherits it through `tsconfig.runtime.json` and excludes tests; a test-source import alone cannot prove emitted build inclusion.
- Reuse `getConfigPath`, `createDefaultConfig`, and the exact existing atomic `saveConfig` body. Its sole change is input type `AfergonModelConfig | Record<string, unknown>`; no broad type propagation or normalization edits.
- Keep code, focused tests, and associated docs in coherent semantic commits. Conventional Commit messages; no AI attribution, file-type split, or tests-only implementation PR.
- Record evidence as produced / not applicable / outstanding. Markdown planning needs content review, not application unit tests.

## Assumptions

None. Supplied Git evidence is a dated local observation, not an assumption of future cleanliness or remote state; reinspection is mandatory.

## Design Tensions

None.

## Vertical Slicing Decision

One primary P1 completes storage/recovery end to end while remaining inactive. Four ordered TDD units are execution checkpoints, not four commits or PRs; Units 2+3 form one complete targeted-write/recovery semantic commit. Review storage contracts first, preservation second, migration failures third, and boundary evidence last.
Budget risk is high: atomic failure coverage and result evidence may exceed estimates. The contingency below requires STOP, revised artifacts, and renewed approval; it does not preselect two PRs.

## Execution Strategy

Sequential execution lets each failure force the next smallest behavior and prevents overlapping migration work. No parallel agents are required.

### Observed Git evidence and disposition (2026-10-01)

Recovery inspection on 2026-10-01 verified actual local Git state read-only; no Git mutation or fetch occurred. Issue #94 was verified open through GitHub; local remote-tracking refs do not prove remote freshness.
Current branch `main`; HEAD, local `main`, and local `origin/main` all equal `b558aadbef0390c5e9ca833d6b34af1303ffb67a`. Both `main...HEAD` and `origin/main...HEAD` divergence are `0 0`; no fetch occurred.
Index: no staged changes. Unstaged tracked: `openspec/tasks/PROJECT-TASKS.md`, 161 additions + 1 deletion. Preserve untouched; no transfer/staging in this task or P1.

| Worktree | Branch | HEAD | Disposition |
| --- | --- | --- | --- |
| `/home/adrian/Projects/afergon-ai` | `main` | `b558aadbef0390c5e9ca833d6b34af1303ffb67a` | Active dirty planning tree; preserve |
| `/tmp/opencode/afergon-ai-ci-pnpm-release-pin` | `fix/ci-pnpm-release-pin` | `493c1b81441bcbdd814509ccb2aab32d3b13fc89` | Prunable; untouched |
| `/tmp/opencode/afergon-ai-merge-pr83-main` | `merge/pr83-main` | `38e452783e5d52b0c6829ef1a947a566930c294d` | Prunable; untouched |
| `/tmp/opencode/afergon-ai-remove-retirement-receipts` | `test/remove-retirement-receipt-tests` | `9d247053da2f483311dfaa92582d3e2beada35be` | Prunable; untouched |
| `/tmp/opencode/afergon-ai-stabilize-retirement-cleanup-verification` | `fix/retirement-cleanup-verification` | `5bc2263243e30707afb93de0826ca321ce0b18a6` | Prunable; untouched |

All four prunable entries have gitdirs pointing to nonexistent locations; never prune or reuse them.
Individual pre-existing untracked paths follow. Preserve ALL untouched; no staging or transfer now. Their later artifact publication has separate ownership and measured PRs; none belongs in P1's diff.

```text
openspec/debate/debate-summary-reasoning-effort-model-profiles.md
openspec/plans/reasoning-effort-model-profiles-cli/PLAN.md
openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md
openspec/plans/reasoning-effort-model-profiles-posix/PLAN.md
openspec/plans/reasoning-effort-model-profiles-projection/PLAN.md
openspec/plans/reasoning-effort-model-profiles-resolution/PLAN.md
openspec/plans/reasoning-effort-model-profiles-windows/PLAN.md
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
```

Historical initial inspection listed 14 specs and 26 untracked paths; recovery now reconciles all 32 individual untracked artifacts above. Preserve every path; reinspection must reconcile any subsequent change before Implement.
This task owns only `openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md`. Its initial publication is separate; only small verified checklist changes belong to P1 later.

Earlier refresh found CLI/POSIX/resolution plans; recovery additionally accounts for projection/windows plans and this plan. All nonowned artifacts remain untouched; no staging or transfer is authorized. Only this persistence PLAN.md receives recovery edits.

### Isolation and publication gates

First publish D0, B1–B3 and consuming spec/plan artifacts as separately measured focused units, each at most 399 additions + deletions; target at most 350. Do not hide artifacts as untracked overhead or append their initial contents to P1.
Publication units, in order: D0 owns only the debate; B1 owns the index delta and tasks 001–002; B2 owns tasks 003–006; B3 owns tasks 007–011; the consuming planning unit owns only P1's source spec and this plan. Each targets its immediate published predecessor while pending, then main after integration. Publication/staging/commits/PRs require separate user authorization and review; none is authorized by recovery planning.
Recovery review measured these units at 233/272/226/277/344 lines respectively against the local baseline (P1 spec 75 + plan 269). Remeasure each actual base-relative diff including corrections/review churn; stop/replan if any exceeds 399. Other recovered specs/plans await their own publication units, not P1 implementation.
After publication and accepted Plan gate, use a fresh `feat/reasoning-effort-persistence` branch/worktree. Base it on the published immediate planning predecessor if pending; otherwise current main. Publication means committed/reviewable predecessor, not dirty files.
At Implement recheck branch/base/divergence, complete topology, index, unstaged and every individual untracked path. Stop on collisions, unexplained changes, or changed disposition; do not transfer the dirty original worktree.
Preserve originals in the recovery checkout. Future task-owned P1 spec/plan transfer is allowed only through authorized published ancestry (or explicitly authorized exact-path copying); all other dirty paths stay excluded. No historical autonomy setting constitutes current Plan-to-Implement approval.
Future illustrative commands only: verify `/tmp/opencode` with `ls /tmp/opencode`; verify branch/path unused before `git worktree add -b feat/reasoning-effort-persistence /tmp/opencode/afergon-ai-reasoning-effort-persistence <published-predecessor-sha>`.
The parent `/tmp/opencode` exists according to supplied context; verify again before creation. Do not run these commands during planning.
After predecessor merge, rebase/retarget to main, remove inherited diff pollution, remeasure and rerun required checks/review. No `git add .`, stash, reset, clean, restore, pruning, or unrelated-file transfer.
Future staging/commits require separate authorization: stage only exact task-owned paths in the budget table, after status/diff/recent-log review; generated dist is not staged. There is no staging authorization in this plan-writing request.

### Review workload and fallback

All figures count additions + deletions, including replacement-line churn, tests, README, RESULT, and PLAN updates. These are per-file forecast caps, not measurements.

| Exact future P1 allowlist | Cap |
| --- | ---: |
| `scripts/lib/model-profiles/domain/stored-assignment.ts` | 45 |
| `scripts/lib/model-profiles/infrastructure/profile-store.ts` | 105 |
| `scripts/lib/model-profiles-config.ts` | 2 |
| `tsconfig.json` — add only `scripts/lib/model-profiles/**/*.ts` include entry | 1 addition |
| `tests/model-profiles-persistence.test.ts` | 130 |
| `README.md` | 14 |
| `openspec/results/reasoning-effort-model-profiles-persistence/RESULT.md` | 40 |
| `openspec/plans/reasoning-effort-model-profiles-persistence/PLAN.md` | 16 |
| **Total / reserve to maximum 399** | **353 / 46** |

Preferred target is ≤350; the 353 upper forecast exceeds that preference by 3, not the hard ≤399 limit. Feasibility is unproven: do not claim these allocations demonstrate sufficient readable tests/results. Reforecast before execution and at EVERY GREEN/checkpoint, including documentation growth and deletion churn. If projected total reaches 375, STOP before 399; final measured total must be ≤399 and reviewable in approximately 60 minutes.
Do not shrink coverage, omit evidence, compress unreadably, or request a size exception to fit. If measured complete P1 cannot fit, STOP/replan/reapprove inactive capability slices: P1a complete compatible read validation + clone, callable without writes, tests/docs; P1b complete targeted writes + migration + atomic recovery, tests/docs, dependent on P1a. P2/P3 wait for full original task 001. Primary decision remains one P1.

## Implementation Steps

- [x] Gate: verify publication, accepted Plan, fresh isolation, five Git-state categories, and updated budget; record exact base and evidence.
- [x] Unit 1: implement validated mixed reads using the domain value and standalone loader, with sequential behavioral RED/GREEN triangulation.
- [ ] Unit 2: build/test pure in-memory targeted patch construction with metadata/representation preservation and reused clone independence; no disk writer yet.
- [ ] Unit 3: implement actual targeted persistence together with complete version migration, snapshot recovery, conflict detection, atomic failure coverage, and internal migration documentation.
- [ ] Unit 4: require the `scripts/lib/model-profiles/**/*.ts` include entry in `tsconfig.json`; prove inactive boundary, emitted import after build, legacy regressions and complete verification; record compact RESULT and measured review diff. Test-source imports alone are insufficient.

### Ordered TDD protocol (every behavior unit)

Start with ONE executable failing behavioral test, run it and record why it fails; implement only minimal GREEN using the lowest-index sufficient TPP transformation. Introduce only the source seam needed to reach the assertion: missing import, compiler/type failure, or typo is not RED evidence.
Then introduce ≥2 adversarial scenarios individually, each RED → minimal GREEN before writing the next. Refactor only while green, preserving behavior. Never implement a future validation/migration algorithm before its failing test.
Use the exact TPP ordering in `skills/implement/SKILL.md`; record index, transformation and justification per cycle. Passing characterization tests are regression evidence, never fabricated RED cycles. If a scenario already passes, find a genuine uncovered case or explicitly record why two breaking cases cannot be found.

| Unit | First behavioral RED → GREEN | Sequential adversarial triangulations and checkpoint |
| --- | --- | --- |
| 1: mixed read | Read a mixed string/object document retaining values and version without writes | Next: model absent; next: effort absent; next: malformed recognized effort; next: malformed model, each independently RED/GREEN when behavior is absent. Add empty/whitespace/case-varied inherit, null/array/number, malformed containers/version, opaque foreign slot and original-path fixtures. Read-only no-op is explicit. |
| 2: in-memory targeted patch | Construct a pure in-memory one-member patch preserving omitted members and representation, without disk I/O | Next: foreign nested metadata survives; next: other profile unchanged; next: source mutation cannot affect cloned nested metadata; next: reverse clone mutation cannot affect source. Reused clone may already pass: label characterization honestly. Include model-only edit on structured value, legacy string edit, aliases/exact keys and own undefined rejection. |
| 3: targeted persistence/migration/recovery | Persist the first changed structured assignment only after an exact snapshot, then version 2 | Next: backup stage fault; next: config rename fault; then actual targeted disk-write preservation, mixed-document targeted no-op update retaining exact bytes/version/snapshot, and subsequent v2 persistence retaining legacy-string/structured representations on reload; future-version mutation refusal, changed-source comparison, matching/mismatching existing snapshot, absent-source default recovery, structured-without-effort migration. Fault cases enter individually; all final matrix assertions required. |
| 4: inactive boundary | Direct emitted capability import plus unchanged legacy behavior may already be GREEN characterization | Add genuine adversarial tests for standalone store absence of host I/O, invalid update not invoking save, and compiled capability absent from live exports. Distinguish new failing behavior from passing boundary regressions; do not alter live routing to manufacture RED. |

When authorized, Unit 1 read-only validation is a coherent separate semantic commit with its tests/docs (for example `feat(model-profiles): validate mixed stored assignments`). Units 2+3 remain the same complete targeted-write/recovery semantic commit with relevant tests/docs; no separately deliverable unsafe structured writer precedes backup support. Unit 4 evidence stays with the behavior it verifies, never a standalone tests-only PR. No partial intermediate commit is claimed as complete P1.
RESULT must use the mandatory Implement result headings; compact tables may combine evidence. Keep one row per actual cycle: test name, exact command/outcome, RED reason, lowest TPP index/transformation, GREEN result, triangulation/refactor result. Include produced/not applicable/outstanding, step/final commands, commits, changed paths and deviations. If evidence needs more lines than forecast, reforecast/STOP rather than discard it.

## Interfaces and Technical Contracts

### Domain and document API

`stored-assignment.ts`: encapsulate validation in `StoredAssignment` with static factory accepting unknown stored value and original JSON path; private constructor only assigns validated data. Interfaces describe structured data and patches; a string-or-structured union describes stored assignments. Retain unknown JSON members, not normalized projections.
Legacy value: nonempty, nonwhitespace model string, with `inherit` valid. Structured object: optional `model`, optional `reasoningEffort`, plus arbitrary unknown JSON fields. Empty structured object is valid implicit model inheritance/no effort override.
Present model must be a valid nonempty/nonwhitespace string; no provider/model enumeration, availability lookup, or model default. Present effort must be a nonempty/nonwhitespace string excluding `inherit` after case/trim comparison; null, arrays, numbers, and own undefined are invalid. No effort enum, provider checks, or default.
Validate with trimmed comparisons only; preserve valid stored strings, whitespace/case, key spelling and string/object representation exactly on read. Reject malformed known fields with original `models.profiles[profile][agent].member` JSON path (quote/escape original keys); an invalid assignment/container identifies its original container path.
Recognize supported names/aliases using pure `normalizeAgentName` in infrastructure. Catch only unsupported-name classification; never catch/suppress assignment validation. Unsupported agent slots are opaque JSON, retained without interpreting their `model`/`reasoningEffort` fields.
`loadProfileDocument(env?)` returns an interface containing validated raw `document`, `configPath`, `exists`, and original bytes when present; it performs no writes/migration. Reuse existing absent-file defaults in memory without promoting a read into persistence.
Validate root/models/profiles/profile containers and activeProfile's string-or-null shape; reject a dangling non-null active profile. Missing optional legacy containers/version use the existing default meaning without injecting those fields into an existing raw document on read; a present malformed version is an error.
Version must be a positive safe integer when present: 1 legacy, 2 extended; >2 validates known shapes, preserves original raw version and foreign fields on read. All >2 mutations reject before write-side I/O (source reads/validation are necessary), even a nominal no-op; never downgrade.
`updateProfileAssignment(profileName, agentName, patch, {env?})` returns `{configPath, version, snapshotPath?}`. Patch interface has optional model/effort strings; own-present undefined fails at runtime before cloning can erase it. Absence means preserve; no clear/delete operation in P1.
P1 supplies only this bounded assignment API, not whole-candidate lifecycle commits. P3 owns planning/binding any additional bulk/clone/switch/delete commit adapter against these validation, migration and atomic-save guarantees; it must not assume P1 already exports that adapter or silently expand this slice.
Target the exact profile key; a nonempty patch may materialize its missing map, including on absent source, without changing active selection. Agent must be recognized; edit the exact supplied stored key if present, otherwise its sole canonical-equivalent existing key, otherwise canonical key. Reject ambiguous aliases without an exact key; never merge/delete other slots. Use own-key checks for user keys, including prototype-like names.
Deep-clone validated raw JSON with existing `cloneAssignments`, edit only the targeted assignment's own supplied members, preserve everything else at root/models/profiles/assignment depth. Structured model edits retain effort/foreign metadata; model-only legacy edits remain strings; adding effort to a string creates structured data retaining its model.
An empty/identical patch is a no-op: preserve original bytes/version/snapshot, including mixed v1 documents. First introduction OR actual change of structured assignment data migrates v1 to v2, even without effort. Legacy-only edits do not bump despite unrelated pre-existing structured slots. Subsequent v2 changes do not snapshot again.
Return `snapshotPath` only when this operation creates or verifies/reuses a migration snapshot; `version` reports the resulting effective version even for a no-op.

### Write ordering, failure guarantees and recovery

1. Read original bytes/existence; parse and validate. Apply patch to independent raw clone; validate the full proposed document and mutation/version policy before mkdir, temp creation or backup. No invalid known field elsewhere may be normalized away.
2. For real changes, compare current source bytes/existence to the original immediately before migration and again immediately before calling atomic save/replacement. Detectable changes fail closed, preserving the external version. No general multiwriter transaction is promised: the reused saver has a compare-to-rename race; concurrent old writers are unsupported.
3. On v1→v2, create sibling `config.json.pre-v2.bak` exclusively (`wx`), write full exact original bytes, fsync, close, then save config. For absent source, snapshot serialization of `createDefaultConfig()` is the recoverable initial state; confirm source still absent. No live workflow invokes this path.
4. Never overwrite an existing snapshot. A valid existing snapshot with exact expected bytes may be reused; mismatch/malformed snapshot fails with source unchanged. On partial snapshot failure remove only the file created by this operation; preserve previously valid snapshots. Cleanup failures are reported and never disguised as success.
5. Reuse unchanged `saveConfig` serialize/write/fsync/close temporary-file + rename body. Serialization, write, fsync, close or rename failure before commit leaves original bytes/version intact; cleanup temp where possible. A completed snapshot may remain after failed config save; retry must verify byte equality before reuse.
6. Atomic rename is the commit point. Never promise rollback after commit. Existing directory fsync is best effort, not universal crash durability. No host I/O at any stage; no failure can trigger projection.

Fault injection uses narrow fs-stage spies, restored after each test; discriminate backup/config descriptors and pre/post-commit stages. Assert exact original bytes and version, snapshot bytes and restorability, no accidental host I/O, and no temp leftovers where cleanup is possible. Cover backup open/write/fsync/close and config serialize/write/fsync/close/rename, plus source-change injection and retry.

## Acceptance Criteria

- [ ] Mixed round-trip: legacy strings, structured-without-model and without-effort retain values/representation through targeted no-op load/save and subsequent v2 persistence/reload; reads and unchanged updates do not migrate or snapshot.
- [ ] Strict validation: every malformed recognized value reports its original path; unsupported slots/foreign JSON remain opaque and preserved; future reads/mutations have explicit safe outcomes.
- [ ] Targeted persistence: absent patch members, other assignments/profiles and nested foreign fields survive; clones are independent in both mutation directions.
- [ ] Recoverability: first actual extended change promotes to v2 only after recoverable snapshot; faults/conflicts leave precommit source unchanged; matching snapshot retry is safe, mismatch fails.
- [ ] Inactive completeness: directly callable compiled storage works, while legacy routing/string contracts and host output remain unchanged; docs describe internal-only support and unsafe old writers.
- [ ] All unit/final evidence, reviewed docs, ≤399 measured P1 lines, ordinary approval/checks and accepted gate are recorded before implementation acceptance.

## Verification

- [ ] Tests: run the exact single-test, focused, regression and `pnpm test` commands below; cover every Ordered TDD matrix scenario and write-failure assertion.
- [ ] Build: verify the required source include; run `pnpm typecheck`, `pnpm build`, `pnpm run health:runtime` and the exact emitted-import command below.
- [ ] Additional Evidence: record the Git-state/changed-line commands below, native CI obligations and RESULT cycle matrix with evidence statuses.
- [ ] Rule Compliance: review the Design Rule Alignment and rule-compliance checklist below against the exact allowlist, semantic commit boundaries and measured budget.

Tests use isolated temporary HOME, XDG_CONFIG_HOME and AFERGON_AI_CONFIG_DIR; never the user's configuration. Source imports give rapid TDD; built import and existing regression suites prove emitted runtime boundaries. Commands below are future execution obligations, not claimed runs.

```text
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t "<exact single test name>"
pnpm typecheck
pnpm build
pnpm run health:runtime
node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"
pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism
pnpm test
```

Run single-name command per RED/GREEN cycle, focused suite at unit checkpoints, final commands in listed dependency order. The emitted import must succeed without live reads/writes; inspect exports and import graph to establish new API is not in live barrel/routing. Full suite rebuild is required by repository script, not redundant ad hoc testing.
CI obligations: Ubuntu `Test` runs build/typecheck/runtime health/full suite; native `Windows launcher` runs bootstrap test, build/typecheck/health, argv and OpenCode script tests, and PowerShell CMD help/error/doctor smoke. Preserve these unchanged checks; a Linux shell-text pass is not native Windows evidence. No upstream OpenCode/provider request proof is needed for inactive P1.
Rule compliance review covers inward imports, static factory/private constructor, exact saver-body reuse, unchanged live paths, foreign-field/error handling, source conflict limitations, docs and semantic commit boundaries.
README addition is a short internal-only paragraph: no live effort controls yet, migration snapshot location, old writers unsafe even with version bump, concurrent old-writer use unsupported, and freeze/recovery guidance below; do not advertise P2 export as available.

### Git-state and changed-line evidence (future, read-only)

```text
git status --short --untracked-files=all
git branch --show-current
git rev-parse HEAD main origin/main
git rev-list --left-right --count main...HEAD
git rev-list --left-right --count origin/main...HEAD
git worktree list --porcelain
git diff --cached --name-status
git diff --name-status
git diff --check
git diff --numstat BASE...HEAD
git diff --cached --numstat
git diff --numstat
git diff --no-index --numstat /dev/null FILE
```

Replace BASE with exact immediate published predecessor (then main after retarget); FILE with each individual new allowed path. Exit 1 from no-index denotes differences, not failed validation. Add additions + deletions for all paths; reconcile committed/index/working/untracked layers without double-counting overlapping changes. No untracked artifact is invisible overhead; no awk/script is needed. Final PR measurement is its actual base-relative diff, not worktree line count.
Evidence now: produced — source/skills/spec review, 14 ready specs, recovered 32-path inventory and topology, issue verification and read-only recovery audit. Historical standalone review preceded these corrections; current correction review remains required. Not applicable — application tests for this Markdown-only plan. Outstanding — current user acceptance, authorized publication and measurements, all implementation tests/build/runtime/CI, final budget, policy verification and approval. No implementation executed.

## Open Questions

None.

## Dependencies

No behavioral prerequisite for 001; P2/P3 consume this storage capability. Publication and accepted Plan are ordinary required execution gates.
`planning-publication → accepted Plan gate → 📍 P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10 → P11`
Strategy: Stacked PRs to main. Pending PRs target immediate predecessor, then rebase/retarget main after merge; no dependent early merge or aggregate final PR. P1 branch: `feat/reasoning-effort-persistence`; start legacy storage, end complete inactive store, next P2; exclude later lifecycle/host/UX behavior.
Future PR links approved issue #94, uses exactly one appropriate `type:*` label, includes start/end/prior/next/exclusions/diagram/evidence/rollback and exact measured base. Obtain one approval and current required checks; revalidate issue/policy remotely when publication is authorized. Recovery verified issue #94 open; publication-time policy/checks/approval evidence remains outstanding.

## Risks and Watchouts

- High budget risk: atomic edge cases and per-cycle evidence must remain readable; stop/replan at the stated checkpoint rather than cutting tests or hiding artifact churn.
- Old normalization drops objects/foreign fields; isolation is essential. A schema number does not protect against an old writer; never route mixed data through `loadConfig` or broad live types.
- Compare-before-save detects conflicts, but does not eliminate a concurrent write between comparison and rename. Document unsupported old-writer concurrency; no locking/transaction guarantee.
- Rollback: hold an unmerged unit and dependent suffix; revert merged dependents in reverse order via reviewed sub-400 PRs, preserving unrelated work and coherent planning artifacts.
- Before withdrawing extended support, retain full current documents and snapshots. At P1 no P2 exporter exists: freeze writes and retain the new reader until explicit separately located legacy recovery is verified. Never run the old writer over extended profiles or overwrite the sole extended copy.
- Restore pre-v2 snapshot only with consent accepting loss of subsequent edits, retaining a full current copy first. No host cleanup is needed for inactive P1; later activated suffixes require their own cleanup before rollback.

## Completion Condition

This rigorous plan is ready: sole spec ready, all mandatory sections present, no open questions/tensions, one bounded inactive P1 and explicit gates/evidence. Planning completes after Markdown review; publication and accepted Plan gate must precede execution. Implementation completes only when all implementation step checkboxes have verified evidence, RESULT exists, full P1 contracts pass, measured diff ≤399, and required review/checks approve the safe prefix.
