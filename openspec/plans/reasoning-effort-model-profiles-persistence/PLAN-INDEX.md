# Plan index: Four complete inactive persistence capabilities

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied to planning; four boundaries approved, implementation not approved.

## Summary

Execute A → B → C → D only after accepted plans, reviewed publication, and renewed Plan-to-Implement approval. Fresh review found no product blocker; source-grounded local reuse resolves the prior forecast tensions without broader decomposition or a size exception. The user approved planning corrections, not implementation. Task 001 remains incomplete until D and full original verification pass. Historical PLAN, Unit 1 commit, source/tests and blocked RESULT remain unchanged.

| Slice | Artifact | Capability | Plan state |
| --- | --- | --- | --- |
| A | [plan-01-compatible-read-validation.md](plan-01-compatible-read-validation.md) | Mixed read, strict validation, explicit compiler/emission inclusion | ready-with-assumptions |
| B | [plan-02-pure-edit-preparation.md](plan-02-pure-edit-preparation.md) | Pure targeted preparation and independent clones; no disk | ready |
| C | [plan-03-exact-byte-snapshot-lifecycle.md](plan-03-exact-byte-snapshot-lifecycle.md) | Exact-byte snapshot, source recheck, retry/refusal, owned cleanup; no config writer | ready-with-assumptions |
| D | [plan-04-targeted-migration-atomic-writer.md](plan-04-targeted-migration-atomic-writer.md) | Complete targeted migration and atomic writer consuming A/B/C | ready |

Readiness describes a slice contract, not permission or completed dependencies. Aggregate state is `ready-with-assumptions`; B/D remain contingent on accepted predecessors and the renewed gate. No slice is executable now.

## Planning Scope

Preserve the complete task/spec and original PLAN contracts. All slices remain directly callable and inactive: no live barrel, CLI/TUI, installer/update/refresh, host I/O, provider check, default effort, clear/delete, downgrade export, or resolution change. P2/P3 await full D. P3 owns any additional whole-candidate lifecycle commit adapter; P1 exports only bounded assignment persistence.

## Design Rule Alignment

- Read exact registered `plannify`, `chained-pr`, `work-unit-commits`, `cognitive-doc-design`, and the Implement evidence contract before planning.
- Registry resolved from `/home/adrian/Projects/afergon-ai/.atl/skill-registry.md`; the isolated checkout has no registry file. Reported gap, no registry/configuration write or invented load.
- New vertical code uses domain/infrastructure boundaries, inward imports, interfaces for contracts, and `StoredAssignment.create` with assignment-only private constructor.
- Reuse `normalizeAgentName`, JSON `cloneAssignments`, defaults/path helpers, and the unchanged atomic `saveConfig` body. Only its parameter union may widen in D.
- Every source PR owns behavior, relevant tests/docs, result evidence, and verified slice checklist delta. No tests-only behavior delivery or unsafe writer intermediate.

## Assumptions

Local, reversible reuse: A extracts existing checks and uses readable named-case tables/shared setup; C shares descriptor-aware fault/conflict setup and invariant assertions, retaining explicit cleanup and absent-source cases. These are forecasts, not caps or proven sizes. Extra cycles, helper replacement churn and review fixes require reforecast; never truncate evidence. Local refs do not prove remote freshness.

## Design Tensions

None

## Vertical Slicing Decision

The approved four boundaries separate materially different callable contracts. A reads, B prepares, C handles backup lifecycle, and D alone writes extended configuration. These replace future execution of the monolithic plan, not its history or product scope. Roll back a dependent suffix in reverse order; never deploy an old writer over extended data.

## Execution Strategy

### Observed Git state — 2026-10-02

Current worktree is `/tmp/opencode/afergon-ai-reasoning-effort-persistence`, branch `feat/reasoning-effort-persistence`, HEAD `2887100dbfb64cf1cc9371f190f934b850450ffb`. Its immediate parent/published plan predecessor is `0c0c8e348afcff7e50f12029ad0c01c676f6400f`; divergence predecessor...HEAD is `0 1`. No upstream configured. Local main/origin/main both `b558aadbef0390c5e9ca833d6b34af1303ffb67a`, divergence to HEAD `0 6`. No fetch; remote freshness/approvals unverified.

| Worktree | Branch | HEAD (prefix) | Disposition |
| --- | --- | --- | --- |
| `/home/adrian/Projects/afergon-ai` | main | b558aad | Preserve all dirty originals |
| `/tmp/opencode/afergon-ai-issue94-artifacts` | docs/issue94-p1-persistence-plan | 0c0c8e3 | Clean publication worktree; preserve |
| `/tmp/opencode/afergon-ai-reasoning-effort-persistence` | feat/reasoning-effort-persistence | 2887100 | Reuse for these exact plan writes only |
| `/tmp/opencode/afergon-ai-ci-pnpm-release-pin` | fix/ci-pnpm-release-pin | 493c1b8 | Prunable; preserve registration |
| `/tmp/opencode/afergon-ai-merge-pr83-main` | merge/pr83-main | 38e4527 | Prunable; preserve registration |
| `/tmp/opencode/afergon-ai-remove-retirement-receipts` | test/remove-retirement-receipt-tests | 9d24705 | Prunable; preserve registration |
| `/tmp/opencode/afergon-ai-stabilize-retirement-cleanup-verification` | fix/retirement-cleanup-verification | 5bc2263 | Prunable; preserve registration |

All four prunable gitdirs point to nonexistent locations; no prune/reuse. Current staged and unstaged tracked sets were empty. Individual pre-existing current untracked paths were this `PLAN-INDEX.md` (owned update) and `openspec/results/reasoning-effort-model-profiles-persistence/RESULT.md` (54 lines, preserve byte-for-byte). Four new slice paths in the table are task-owned; stage/transfer none now. All tracked paths, including historical PLAN, README, source and tests, are preserve-only this session.

Root staged set is empty. Root unstaged `openspec/tasks/PROJECT-TASKS.md` is 161 additions + 1 deletion; preserve, no transfer/staging. Root's 32 individual untracked paths are exactly the original PLAN's lines 66–99 inventory, rechecked in full: debate; six plans (CLI, persistence, POSIX, projection, resolution, Windows); tasks 001–011; and fourteen specs (capability, two CLI, downgrade, ownership, persistence, POSIX, projection, resolution, two runtime compatibility, two TUI, Windows). That exact linked inventory names every path and remains authoritative; preserve all, no transfer/staging. Publication worktree has no staged, unstaged, or untracked changes.

### Publication and ancestry, future only

Continue the chosen Stacked PRs to main strategy. Pending children target the immediate reviewed predecessor, then main after integration; no tracker, aggregate source PR, merge, or strategy switch. PRs #95–#99 are historical publication references; current remote state/approval must be checked when authorized.

First publish the unchanged 54-line historical partial RESULT in a focused checkpoint-documentation predecessor off plan PR #99 (`0c0c8e3`), with an index bootstrap recording corrected provenance: 281 additions + 2 deletions = 283 changed lines, plus RESULT54 = 337. The historical artifact mislabels additions as changed lines and still says281/335; it remains bytewise unchanged, not falsely described as corrected. No source commit or future exact-cycle evidence is prepublished. Forecast RESULT54 + bootstrap18–24 = 72–78. This is historical evidence publication, separate from slice-plan publications.

Then publish four focused planning PRs, each owning exactly one slice plan plus its index delta. A expands the bootstrap to this index; B/C/D update their publication entries, not re-add inherited index or other plans. Initial contents of all four plans are visible once in these reviewed predecessors. Forecast A publication: full index + A plan + bootstrap replacement churn; measure against its actual bootstrap base. B/C/D: their actual plan line counts plus 8–16 changed index lines each. Reinspect/remeasure before publication; stop at projected 375, final <400. No publication is authorized now.

Measured corrected artifact lines are index180, A120, B120, C121 and D124. Documentation forecasts, including this index's full initial publication and index edits, are recorded below. Bootstrap deletions count in A; its additions are already included in the full index and are not charged twice. Review corrections change these forecasts and require remeasurement.

| Publication unit | Counted contents | Forecast additions + deletions |
| --- | --- | ---: |
| Checkpoint evidence | Historical RESULT54 + bootstrap index18–24 | 72–78 |
| A planning | Index180 + A120 + deleted bootstrap18–24, worst full replacement | 318–324; shared lines may reduce this |
| B planning | B120 + index delta8–16 | 128–136 |
| C planning | C121 + index delta8–16 | 129–137 |
| D planning | D124 + index delta8–16 | 132–140 |

Publication state: checkpoint, A, B, C and D are all unpublished by this session. At each future publication update that unit's status/provenance in this index with its actual reviewed commit/base and measured diff, keeping those changes in the indicated index delta.

Planned exact documentation branches: `docs/issue94-p1-replan-checkpoint`, `docs/issue94-p1-replan-a`, `docs/issue94-p1-replan-b`, `docs/issue94-p1-replan-c`, `docs/issue94-p1-replan-d`. Corresponding `/tmp/opencode/afergon-ai-issue94-p1-replan-{checkpoint,a,b,c,d}` paths must be checked individually for collision at execution. No matching local branches were observed; remote names/path availability remain unproven.

Preferred source integration preserves and safely reuses existing `feat/reasoning-effort-persistence`: after authorized publication, merge the exact reviewed final documentation predecessor into it, retaining `2887100` as ancestry. Inspect merge base/diff first; documentation predecessor must not modify historical PLAN/source/tests or unrelated paths. Resolve unexpected conflicts by stopping, never reset/force or silently absorbing dirty files. Once all doc commits are ancestors, A's source PR targets that published predecessor, so inherited documentation is absent from its diff.

An alternative requiring explicit transfer authorization is a fresh `feat/reasoning-effort-p1-read-validation` from that same documentation predecessor, then cherry-pick exactly `2887100dbfb64cf1cc9371f190f934b850450ffb`. Preserve original branch/commit/worktree. Do not cherry-pick predecessor chain or untracked files. Select integration route before execution; no mutation now. Existing branch reuse avoids duplicating Unit 1; fresh isolation costs a new commit identity and conflict verification.

B/C/D source branch names: `feat/reasoning-effort-p1-pure-edit-preparation`, `feat/reasoning-effort-p1-exact-byte-snapshot-lifecycle`, `feat/reasoning-effort-p1-targeted-migration-atomic-writer`. Matching local names were absent on audit. At execution check exact local/remote name and corresponding `/tmp/opencode/afergon-ai-reasoning-effort-p1-<slice-slug>` path unused. Each starts from its immediate accepted source predecessor; no inherited changes are charged again in its PR.

### Numeric budgets and result ownership

The measured historical diff against `0c0c8e3` is 33 domain + 72 reader + 172 tests + 2 README + 4 PLAN churn = **283 committed changed lines** (281 additions + 2 deletions). Historical RESULT adds54, giving **337**. Our earlier281/335 statements were incorrect. RESULT's281 counts additions only and mislabels the metric; preserve that artifact bytewise and publish corrected provenance beside it. It is not a new slice result or complete P1 proof. The previous A417–489 forecast already summed283 despite its incorrect prose subtotal.

Publishing historical RESULT54 charges it once in the checkpoint docs predecessor. A's source/tests are absent from that docs base: after authorized GREEN, readable behavior-preserving refactoring counts their final file lengths as additions, not283 plus every intermediate edit. Preserve commit2887100 in ancestry without reset/force. README and historical PLAN count actual base-relative churn, including PLAN's2 additions +2 deletions. B/C/D edits to inherited files count additions AND deletions; never charge the entire inherited chain or sum overlapping intermediate snapshots.

Future slice results live at `openspec/results/reasoning-effort-model-profiles-persistence/{A,B,C,D}/RESULT.md`, produced with their source deliveries, never prepublished as future-cycle evidence. A owns historical attribution and new cycles, B/C their capabilities, D writer integration/full task acceptance. Historical blocked RESULT stays unchanged. Each uses all mandatory Implement headings and genuine exact-cycle rows with commands/outcomes, RED reason, lowest TPP index, GREEN/triangulation/refactor, commits/paths/deviations and evidence status. Unrecorded historical details stay explicitly unknown; already passing own-undefined validation is direct characterization, not RED.

| Source PR | Source/config churn | Tests | Docs | New RESULT | Slice plan churn | Total forecast |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 111–121 final source + 1 include | 125–140 final file | 4–6 | 80–90 | 4 historical + 6–10 slice | **331–372** |
| B | 65–90 | 125–175 | 4–6 | 65–85 | 6–10 | **265–366** |
| C | 90–100 | 140–155 | 5–8 | 85–95 | 6–10 | **326–368** |
| D | 45–70 + 2 saver type churn | 125–170 | 10–14 | 80–100 | 6–10 | **268–366** |

Fresh review grounds A source111–121 in domain33 + loader28–30 + extracted validator50–58. Its named-case tables/shared setup/error checks preserve all20 inherited cases plus bytes/default/read-fault/boundary coverage in a125–140-line final test file. A result80–90 retains mandatory headings, genuine new exact-cycle rows and explicitly unknown historical details. C source90–100 covers observation/recovery/exclusive acquisition/owned cleanup; tests140–155 use named descriptor-aware fault/conflict tables/shared invariants with explicit special cleanup and absent-source cases; result85–95 retains full evidence. These local reversible reuse forecasts are not caps or proven final fits; no scope loss or broader decomposition/exception. Reforecast extra cycles, helper replacement deletions and review fixes, never truncate evidence. All upper forecasts remain below375; prefer350 where feasible.

If a future reviewed decision updates rather than preserves historical RESULT, explicitly subtract the proposed separate result allocation and count its actual additions AND deletions instead. Example: replacement of a 54-line result with 80 entirely changed lines costs 134, not 80 or 54+80+another result. This is not approved. Final acceptance uses actual PR-base diff, not summed snapshots of overlapping committed/index/worktree changes. Preferred ≤350; STOP at projected ≥375; hard maximum 399. No size exception requested.

## Implementation Steps

- [x] Audit all five Git categories/topology, exact ancestry, task/spec, original plan/result, Unit 1, reusable clone/saver and compiler chain.
- [x] Produce four rigorous approved-boundary plans and complete traceability without changing source or history.
- [x] Apply supplied fresh-review arithmetic/contracts and source-grounded reuse forecasts; record local assumptions without claiming implementation evidence.
- [ ] Obtain acceptance/review of the corrected planning artifacts.
- [ ] Authorize and publish checkpoint evidence and four separate planning predecessors with measured budgets.
- [ ] Obtain renewed Plan-to-Implement approval, choose authorized source integration, and reinspect all five categories/dispositions.
- [ ] Execute accepted A → B → C → D, each with review/checks before dependent delivery; P2/P3 follow full D.

## Interfaces and Technical Contracts

A exposes pure full-document validation plus the existing loader, preserving raw representation and providing exact source bytes for C. B returns an independent validated candidate and change/migration flags without disk I/O. C receives expected existence/bytes and validated recovery state, exposes source recheck, exclusive snapshot acquisition/reuse and owned partial-cleanup, never saves configuration. D rechecks twice around snapshot/save, uses B flags/C receipt, and calls the existing atomic saver. Specific signatures and guarantees are in each plan; no live export is introduced.

### Complete traceability

| Source obligation | Owning behavior units | Required evidence |
| --- | --- | --- |
| Spec requirement 1; mixed round-trip scenario; task AC1; PLAN AC1 | A1 read, B1 representation, D1 no-op/D2 reload | Raw strings/objects, optional fields, exact unchanged bytes/version/backup; changed v2 reload |
| Requirement 2; omitted effort scenario; task AC2 | A2 validation, B1 patch | Empty object, model-only, effort-only, omitted members; no defaults/provider enum |
| Requirements 3; invalid effort/malformed scenarios; task AC2–3; PLAN AC2 | A2/A3, B2, D1 | Original escaped paths; null/array/number/empty/whitespace/inherit/own undefined; invalid containers/version/active reference |
| Requirement 4; foreign metadata scenario; task AC3; PLAN AC3 | A1/A3, B1/B3, D2 | Root/models/profiles/assignment metadata, opaque foreign slots, untouched profiles, bidirectional deep independence |
| Future-version safe outcomes; PLAN version policy | A3, B2, D1 | Positive safe integers, missing version effective 1, >2 read preserved, all mutation/no-op >2 refusal before write I/O |
| Exact keys/aliases/prototype ownership; PLAN targeting policy | A3, B2, D2 | Exact key priority, sole canonical equivalent, ambiguous rejection, canonical creation, own `__proto__`/`constructor` profile fields |
| Requirement 5; first extended/recovery scenarios; task AC4; PLAN AC4 | B1/B2 flags, C1/C2, D2 | Structured actual change even without effort bumps; legacy-only/no-op do not; snapshot before version2; later v2 no new snapshot |
| PLAN backup ordering/retry/cleanup | C1/C2/C3, D2/D3 | Exclusive open, exact bytes/fsync/close, existing valid equality, malformed/mismatch refusal, owned partial cleanup/error reporting |
| PLAN detectable source conflicts/absent source | A1 bytes, C1/C2, D2/D3 | Presence/absence and bytes rechecked before backup and save; newly appeared/deleted/changed source preserved; default snapshot restoration |
| Atomic-save failure scenario; PLAN fault matrix | C3 backup, D3 config | Backup open/write/fsync/close; config serialization/write/fsync/close/rename; source unchanged precommit, temp cleanup/retry, no host I/O |
| Requirement 6; task AC5; PLAN AC3 | B3; D2 on-disk preservation | Source→clone and clone→source nested effort/foreign metadata independence; reused helper passing characterization labelled honestly |
| Requirement 7; live-workflow scenario; task AC6; PLAN AC5 | A4 and every slice boundary, D4 complete | Explicit compiler include/emitted import, direct calls only, legacy regressions, unchanged barrels/routes/host output, old-writer/recovery docs |
| Requirement 8; task delivery/rollback notes; PLAN AC6 | Every publication/source unit | Actual base additions+deletions, full result/plan churn, ordinary approval/checks, semantic tests/docs, reverse-dependent rollback |
| PLAN original Unit2/Unit3/Unit4 and all fault/acceptance matrices | B1–B3 / C1–C3+D1–D3 / A4+D4 | No original unit or acceptance silently dropped; no partial Unit1 relabelled full task |
| Original downstream exclusions/dependencies | D4 completion; future P2/P3 | No lifecycle/export/projection implementation; P3 owns candidate adapter; P2/P3 blocked until full D |

## Acceptance Criteria

- [ ] Every row above has produced evidence before complete task acceptance; no reduced spec/task scope.
- [ ] Validate local reuse forecasts during execution; each actual delivery <400 and checkpoint respected without hidden artifact lines or truncated evidence.
- [ ] All four inactive capabilities are callable, reviewed, documented and verified in order.
- [ ] Original histories/root dirty paths/topology are preserved and every publication/result has explicit ownership.

## Verification

Tests/build are **not applicable** to this Markdown-only correction. Supplied fresh reviewer findings and our arithmetic/contract/content audit are **produced**; acceptance/re-review of corrected artifacts, publication and approvals are **outstanding**. Historical Unit1 reports20 tests and build/typecheck passing; no new implementation/full tests or build evidence was produced here.

Every future source slice runs the original PLAN's exact test/build/regression/full-suite commands, copied in each slice. Single-name checks apply per new cycle, focused checks per behavior checkpoint. Original Git evidence commands at `PLAN.md:228–242` apply with actual BASE and each new FILE. Record current branch/base/divergence, full topology, staged/unstaged and individual untracked paths again at execution and stop on changed disposition.

Native CI remains outstanding: unchanged Ubuntu Test and Windows launcher checks from original PLAN. Linux text inspection is not native Windows proof. Installer parity tests are not newly applicable because installers stay unchanged; Windows regression/required CI still apply. Review checks inward imports, factory/private constructor, byte recovery, exact saver-body reuse, inactive boundaries, budgets and semantic ownership.

## Open Questions

None

## Dependencies

Checkpoint + four reviewed planning predecessors → renewed approval → A → B → C → D → P2/P3. Slice readiness does not waive unresolved predecessor readiness, approval, or native required checks.

## Risks and Watchouts

- Existing loader captures UTF-8 text, not arbitrary exact bytes; A must retain the same read's Buffer as well, with text compatibility preserved. No claim that current Unit 1 proves byte fidelity.
- JSON clone erases own undefined; reject recognized own undefined before cloning. Parsed foreign JSON remains opaque; no unsupported arbitrary JavaScript graph contract.
- C cannot close the existing compare-to-rename gap in D's reused saver. Detectable conflicts fail closed; concurrent old writers unsupported, directory fsync best effort, rename the commit point.
- Do not describe already passing old characterization as RED. Every new behavior gets one executable RED then two sequential adversarial RED/GREEN cycles, or an explicit documented inability to find two genuinely failing cases.
- Freeze old writers, retain full extended copies/backups, and obtain consent before restoring a pre-v2 snapshot that loses subsequent edits. No P2 exporter advertised yet.

## Completion Condition

Corrected planning output is `ready-with-assumptions`, with no open product questions or design tensions. Execution still requires accepted corrected plans, measured/reviewed documentation publication, and explicit renewed gate. Task001 completes only after D's full original acceptance/evidence and required approvals/checks. No source PR, merge, tests/build, staging, or Git mutation was performed by this correction pass.

## Publication handoff — current docs task

**Implementation awaiting user GitHub review.** Publication authorization does not approve implementation or merging.
The preceding audit, branch proposals, checklists and readiness statements are preserved source-planning observations, not the current docs-worktree state.
Supplied fresh review PASS: `ses_f04d3e108ffeFWtWN7Dln0OASJ`; transfer checks do not replace user acceptance.
Historical [RESULT](../../results/reasoning-effort-model-profiles-persistence/RESULT.md) remains byte-identical: its281/335 claims count additions only; actual281+2=283, +54=337. Unit1 passes remain historical.
Docs isolation: `/tmp/opencode/afergon-ai-issue94-p1-plan-publication`, exact PR99 head `0c0c8e348afcff7e50f12029ad0c01c676f6400f`; no Unit1 source ancestry.
Current authorized branch suffixes under `docs/issue94-` are `p1-checkpoint`, `p1a-read-plan`, `p1b-preparation-plan`, `p1c-snapshot-plan`, `p1d-writer-plan`, replacing historical naming proposals only.
Checkpoint published: [PR100](https://github.com/adrian-afergon/afergon-ai/pull/100), `d86ed8a0feb97fa511a48e86f01e3fb975fa7870`, basePR99;78 changed lines.
A published: [PR101](https://github.com/adrian-afergon/afergon-ai/pull/101), `16bd96189b3af4e5400d86ce0b0bfae016b4d53d`, base checkpoint;322 changed lines. B/C/D entries follow in their own deltas.
User decides implementation after GitHub review; task001/issue94 remain incomplete. Never merge dependents early; later retarget/revalidation requires separate authorization.

### B publication

B plan is copied unchanged,120 lines; this unit adds only that artifact and current index navigation.
B published: [PR102](https://github.com/adrian-afergon/afergon-ai/pull/102), `7de63a33dc17de237b4c45e656f916a66ba19c57`, base A PR101;128 changed lines.
Start: reviewed A planning publication; end: pure preparation plan available for user review. C/D follow separately.

### C publication

C plan is copied unchanged,121 lines; this unit adds only that artifact and current index navigation.
C published: [PR103](https://github.com/adrian-afergon/afergon-ai/pull/103), `963554563f032f207731d571e90d74d5c8f8e8d7`, base B PR102;129 changed lines.
Start: B planning published; end: exact-byte snapshot lifecycle plan available for user review. D follows separately.

### D publication

D plan is copied unchanged,124 lines; this unit adds only that artifact and current index navigation.
Current branch `docs/issue94-p1d-writer-plan` targets C PR103; exact current head/size are in PR metadata.
Start: C planning published; end: all four plans available. Next: user GitHub review/decision, then separately authorized source integration/execution.
