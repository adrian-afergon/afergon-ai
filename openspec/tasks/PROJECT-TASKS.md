# Reasoning Effort Model Profiles — Discovery Breakdown

## Project Overview

- **Project**: afergon-ai, a controlled delivery harness with OpenCode as its supported host.
- **Change slug**: `reasoning-effort-model-profiles`; approved issue #94; autonomous technical decisions.
- **Requirements authority**: [canonical debate](../debate/debate-summary-reasoning-effort-model-profiles.md), exclusively. Repository/source reads below establish baseline and feasibility, not additional requirements.
- **Technical direction**: optional per-agent effort independent of model inheritance; compatible mixed assignments; capability validation; owned JSON projection; CLI/TUI editing; native platform parity. New/migrated code stays in the model-profile vertical with inward dependencies.
- **Boundary**: Discovery product tasks and downstream spec targets only. No implementation contract or executable plan is produced here. Existing unrelated task files and the prior index record below are preserved.
- **State**: Discovery breakdown validated and ready for Plan `specify`. Delivery is **Stacked PRs to main**, independently safe and mergeable in order, each strictly <400 changed lines. No open product, technical, or delivery decisions.

## Ordered Tasks and Spec Targets

Each task is a focused 1–3-day target and one complete implementation capability with its tests/docs. Numbers and existing slugs are retained for traceability. Revised architecture safely changes 007/008 from separate platform activation to cross-platform packaging followed by complete cross-platform activation; all other dominant semantic intents remain.

| Task | Task file / slug suffix | Dominant outcome | Breadth | Debate slice | Validation |
| --- | --- | --- | --- | --- | --- |
| 001 | [reasoning-effort-model-profiles-persistence](001-reasoning-effort-model-profiles-persistence.md) | Compatible extended storage and migration | medium | P1 | passed |
| 002 | [reasoning-effort-model-profiles-downgrade](002-reasoning-effort-model-profiles-downgrade.md) | Non-destructive model-only export | medium | P2 | passed |
| 003 | [reasoning-effort-model-profiles-resolution](003-reasoning-effort-model-profiles-resolution.md) | Independent resolution and lifecycle intent | medium | P3 | passed |
| 004 | [reasoning-effort-model-profiles-capability](004-reasoning-effort-model-profiles-capability.md) | Reproducible capability validation | medium | P4 | passed |
| 005 | [reasoning-effort-model-profiles-ownership](005-reasoning-effort-model-profiles-ownership.md) | Recoverable field ownership | medium | P5 | passed |
| 006 | [reasoning-effort-model-profiles-projection](006-reasoning-effort-model-profiles-projection.md) | Non-destructive managed JSON projection | medium | P6 | passed |
| 007 | [reasoning-effort-model-profiles-posix](007-reasoning-effort-model-profiles-posix.md) | Packaged POSIX/native PowerShell entrypoint parity | medium | P7 | passed |
| 008 | [reasoning-effort-model-profiles-windows](008-reasoning-effort-model-profiles-windows.md) | Complete cross-platform activation and recovery | medium | P8 | passed |
| 009 | [reasoning-effort-model-profiles-cli](009-reasoning-effort-model-profiles-cli.md) | Atomic CLI editing and truthful inspection | medium | P9 | passed |
| 010 | [reasoning-effort-model-profiles-tui](010-reasoning-effort-model-profiles-tui.md) | Staged effort editing and inspection | medium | P10 | passed |
| 011 | [reasoning-effort-model-profiles-runtime-compatibility](011-reasoning-effort-model-profiles-runtime-compatibility.md) | Runtime-version diagnostics and verified support | medium | P11 | passed |

For every full task slug above, `specify` targets `openspec/specs/<task-slug>/`; `plannify` later targets `openspec/plans/<task-slug>/PLAN.md`. These are future targets, not existing specifications or plans. Joint sessions must retain separately traceable task/spec acceptance boundaries.

## Dependency Tree

`Requires`/`Enables` in task files describe direct behavioral prerequisites, not every preceding review branch. Transitive prerequisites are implied.

```text
001 persistence
├── 002 downgrade ───────────────────────┐
└── 003 resolution                       │
    └── 004 capability                   │
        └── 005 ownership                │
            └── 006 projection ─────────┘  (also requires 002)
                └── 007 packaged native parity
                    └── 008 cross-platform activation
                        └── 009 CLI
                            └── 010 TUI
                                └── 011 runtime compatibility
```

| Specify / plannify together | Why this is coherent | PR boundary |
| --- | --- | --- |
| 001 + 002 | Storage evolution and downgrade safety | Separate P1, P2 |
| 003 + 004 | Resolution determines the validated model/effort pair | Separate P3, P4 |
| 005 + 006 | Ownership decisions and their host application | Separate P5, P6 |
| 007 + 008 | Prove packaged native parity before activating both platforms | Separate P7, P8 |
| 009 + 010 | Consistent inspection/edit semantics across CLI and TUI | Separate P9, P10 |
| 011 alongside 004/006 | Specify runtime evidence and precedence early; accept after 010 | Separate P11 with diagnostic behavior, not a tests-only PR |

After 001, 002 and 003 may be specified/planned independently. Platform scenarios may be designed together, but 008 now behaviorally requires 007; 009 requires 008, with 007 transitively required. Joint specification/planning does not authorize parallel implementation or a workflow skip. Review/merge order remains P1 → P2 → … → P11; pending PRs use predecessor-relative review, then target main after that predecessor lands.

## Safe Prefixes and Activation Boundary

| Prefix | Complete observable deliverable | Why the merged prefix is safe |
| --- | --- | --- |
| P1–P4 | Mixed storage, internal export, domain lifecycle and capability APIs | Directly callable/testable capabilities; extended writes and effort-dependent consumers remain outside live entrypoints. Legacy CLI/TUI/install/update keep their existing path and output. |
| P5 | Executable receipt persistence, reconciliation and recovery | Real isolated service, exercised on controlled fixtures; no live route invokes new receipt/host writes. |
| P6 | Complete callable managed-JSON projection | Includes ownership, permissions, corrupt-host protection and pinned unpaid schema/primary/delegated propagation proof; existing launchers do not invoke it. |
| P7 | Compiled packaged entrypoint with POSIX/native PowerShell parity | Both native executions and failure paths are proven before routing changes; existing install/update/profile-refresh routing remains unchanged. |
| **P8** | **Live activation on both platforms** | Routes install/update/profile refresh to the proven service with complete lifecycle, ownership, validation and saved-but-pending recovery. Tolerates absent effort and preserves legacy model semantics; no new editors yet. |
| P9–P10 | CLI then TUI effort exposure | Every exposed operation is backed by complete active projection; each editor ships with its tests/docs. |
| P11 | Additive runtime-version diagnostic | Adds implemented diagnostic behavior; does not supply missing activation, repair or prerequisite projection evidence. |

Every prefix must verify legacy workflows and its new capability. Inactive means unreachable from existing live entrypoints, not an interface stub or an untested implementation. P6/P7 direct fixture invocations may write their isolated hosts; merging them must not alter a user's live host output. Early documentation describes internal APIs honestly rather than advertising unreleased controls.

## Review Workload Forecast

**Retain eleven semantic work units.** The revised debate's smallest two slice lower bounds total 180 + 250 = 430, already above the 399-line maximum before extra artifacts. No measured overlap saving supports consolidation. Revised forecasts include implementation, focused tests and behavior docs; actual additions + deletions govern acceptance.

| Candidate consolidation | Summed debate forecast, additions + deletions | Decision |
| --- | ---: | --- |
| P1 + P2 | 460–610 | Retain storage/export boundaries |
| P3 + P4 | 530–680 | Retain resolution/validation boundaries |
| P5 + P6 | 560–700 | Retain ownership/projection boundaries |
| P7 + P8 | 530–700 | Retain packaged-parity/activation boundaries |
| P9 + P10 | 530–700 | Retain UI boundaries |
| P10 + P11 | 530–700 | Retain editor/runtime diagnostic boundaries |

| Unit | Inherited implementation + tests + behavior-doc forecast | Budget risk |
| --- | ---: | --- |
| P1 | 280–350 | High: preservation/migration and artifact overhead |
| P2 | 180–260 | Medium: internal export/recovery and guidance |
| P3 | 250–330 | Medium: affected-child edits and lifecycle |
| P4 | 280–350 | High: evidence adapter and acknowledgement |
| P5 | 280–350 | High: concurrency and crash cases |
| P6 | 280–350 | High: complete writer plus pinned propagation proof |
| P7 | 250–350 | High: packaged native execution and failure evidence |
| P8 | 280–350 | High: both platform routes, lifecycle and removed registrar code |
| P9 | 250–350 | Medium: parsing and truthful display |
| P10 | 280–350 | High: staged UI and validation/status interactions |
| P11 | 250–350 | High: pinned runtime instrumentation plus diagnostic |

Historical baseline measurements from the prior breakdown: config 203 lines, core 296, save 115, CLI 332, registrar 409, TUI controller 261; profile tests 2,705, TUI tests 1,975, controller tests 102, Windows execution tests 103. The duplicated registrar resolver spans 61 lines; replacement/deletion counts against P8's budget. This revision re-inspected `model-profiles-save.ts:65–115` (save before refresh; inactive-profile isolation), `models.ts:100–175` (Bash route and Windows skip), package distribution and both CI workflows. These support isolating capabilities until P8; they do not prove the future feature works. Existing helpers offer reuse, not guaranteed savings.

These are **historical baseline surfaces and revised debate forecasts, not measured future diffs**. Every revised upper target is ≤350, leaving at least 49 lines below the maximum 399; this is headroom, not proof. Plan must reforecast especially ownership, projection proof, both-platform activation, TUI and runtime diagnostic work. Each justified medium-breadth task remains a 1–3-day target, not an effort guarantee. If scope exceeds that boundary, split into complete observable capabilities with safe inactive boundaries, retaining tests/docs with implementation.

Every actual PR must be **<400 lines (maximum 399)** and reviewable within about 60 minutes. Specification/plan/result artifacts are not free overhead. Publish initial Discovery/Plan artifacts only as focused planning-document units, each separately measured below 400; do not append this entire breakdown to D0 or to a near-budget implementation PR. Later artifact changes still count in their owning PR. Plan must allocate those artifact budgets and reforecast every unit; split by observable behavior before crossing the limit, never into source-only/tests-only halves. No size exception is available.

Publish this breakdown as three focused artifact units in order: B1 foundation/index + 001–002 (**272 lines**); B2 resolution/validation/ownership/projection 003–006 (**226**); B3 packaged delivery/UX/runtime 007–011 (**277**). Current total is **775 additions + deletions**: tracked index diff against HEAD 162, existing untracked task artifacts 613 against absence. Each partition is below 400 with review headroom; the complete breakdown cannot be one PR. The index is a roadmap; referenced task artifacts arrive before the consuming Plan gate. Remeasure against each intended publication base including review edits. D0's revised debate is separate (233 current artifact lines, not a guaranteed PR size). Future specs/plans also need focused sub-400 artifact units before their consuming implementation gate. Artifact-only Discovery/Plan deliverables are legitimate; they never substitute for P1–P11 implementation capabilities. No implementation-less or tests-only implementation PR is permitted.

## Sequential Stacked Delivery and Per-PR Gates

The revised authoritative debate selects **Stacked PRs to main**. Each ready PR lands normally on main in dependency order. The former publication conflict is resolved by the user's delivery choice; no aggregate final PR, protection bypass, ruleset change or size exception is allowed.

```text
D0 → 📍 B1 → B2 → B3 → focused specify/plannify artifacts + accepted Plan gate
   → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10 → P11
main ← next approved, verified PR (repeat in order)
Pending PR → immediate predecessor; after predecessor merges → rebase/retarget to main
```

Current boundary is revision of the existing breakdown artifacts only; B1–B3/P1–P11 are planning identifiers, not published PRs. No branches, commits or GitHub actions are performed here.

Historical prior-breakdown checks on 2026-10-01 verified active **18910665 / protect-main**: PR required, one approving review, stale approvals dismissed, deletion/non-fast-forward forbidden. Those ruleset reads are retained evidence, not fresh GitHub checks in this revision. Approved issue linkage, labels and checks remain ordinary per-PR requirements alongside protection:

- Link approved issue #94 (retain its `status:approved` evidence and revalidate at publication); include exactly one appropriate `type:*` label on every PR.
- Obtain one approving review and pass all required/applicable checks before each merge. Recheck current policy at publication; local `Test` and `Windows launcher` workflows establish available CI, not a claim about a newly queried required-check list.
- Review only the current work unit against its immediate predecessor while stacked. After the predecessor lands, rebase/retarget to main, remove inherited diff pollution, remeasure additions + deletions, rerun checks and renew review/approval as required; never merge a dependent PR early.
- Record exact base, start/end, prior/next, exclusions, tests/docs, rollback and a dependency diagram marking the current PR `📍`. Require strictly <400 total changed lines including artifacts and approximately ≤60-minute review scope.
- Verify prefix safety and native parity appropriate to the slice. Hold/revise an unmerged unit and its dependent suffix when evidence fails; this is an ordinary merge gate, not an unresolved delivery decision.

Rollback returns to the last safe prefix: remove/deactivate dependent merged slices in reverse order before reverting a prerequisite, using reviewed sub-400 PRs and preserving unrelated work. Before withdrawing projection or extended-state support, use the new binary to clean/restore owned effort and retain/export extended backups; never put an old writer over extended profiles. Artifact rollback preserves a coherent planning contract.

## Validation, Traceability, and Handoff

| Debate success criterion | Owning tasks |
| --- | --- |
| 1 mixed persistence / clone / lifecycle | 001, 003, 007, 008 |
| 2 independent effort | 003 |
| 3 truthful inspection | 009, 010 |
| 4 preserved effort / rejected edit atomicity | 003, 004, 009, 010 |
| 5 stale cleanup / invalid source | 005, 006, 007, 008 |
| 6 idempotence / collisions / interrupted writes | 005, 006 |
| 7 supported / unsupported / unknown | 004 |
| 8 pinned primary/delegated runtime proof | 006 before activation; 011 diagnostic evidence |
| 9 platform / packaged entrypoint parity | 007, 008 |
| 10 released guidance / downgrade / precedence | 002, 005, 007, 008, 009, 010, 011 |
| 11 semantic budgets / safe merged prefixes | All tasks; P8 activation boundary above |
| 12 artifact budgets / ordinary sequential PR gates | B1–B3 and Plan artifact units; every P1–P11 |

- **Produced**: six breakdown phases completed; unique dominant intents, observable acceptance criteria, justified medium breadth, acyclic direct dependencies, reciprocal Requires/Enables, source coverage, and preserved historical tasks. Each task passes content validation, not implementation acceptance.
- **Produced**: initial status inspected before edits: this index already modified; revised debate and all eleven existing reasoning-effort task files untracked. Existing user work preserved. Revision writes only this index and those eleven task files; no fresh remote/GitHub verification is claimed.
- **Produced**: revised architecture/content review, ordinary per-PR policy gates, consistent forecast arithmetic and safe-prefix/activation boundaries. Final local status, whitespace checks and full tracked/untracked artifact diffs validate scope and content.
- **Not applicable**: application tests for Markdown-only Discovery. No claim of executed feature, native Windows, or pinned OpenCode evidence.
- **Outstanding**: downstream specifications/plans, measured future PR budgets, implementation and focused/adversarial tests, typecheck/build/runtime health/full suite/platform CI, and standard review.
- **Open decisions**: None (product, technical or delivery). Compatibility experiments, actual diff budgets and required approval/checks are evidence obligations, not unresolved choices.
- **Next state**: Plan `specify`, then `plannify → accepted Plan-to-Implement gate → implement → review`. Issue approval and autonomy do not waive the accepted Plan gate. No downstream specification or implementation is executed here.
- **Skill resolution**: exact registered `breakdown`, `chained-pr`, `work-unit-commits`, and `cognitive-doc-design` files read fully before task-specific reads/writes; chained-PR reference read as supplementary guidance. No missing applicable skill or registry inconsistency found. Downstream `specify`/`plannify` are not executed by this breakdown.

---

# Preserved Prior Index: Agent Permissions — Atomic Task Plan

## Project Overview

- **Project**: afergon-ai
- **Description**: A development harness that coordinates controlled software delivery across Pi, Claude Code, and OpenCode.
- **Technical Direction**: Repair the effective permissions for `afg-debate` and `afergon-ai` as one atomic change spanning agent frontmatter, registrar MANIFEST parity, and registrar-output coverage.
- **Constraints**: Planning does not modify production source or PR #70. Future implementation remains limited to the two named agent definitions, their registrar representation, and relevant tests, and will reuse PR #70 later.

## Dependency Tree

```text
01 Repair effective managed agent permissions
```

## Ordered Tasks

1. **`openspec/tasks/001-repair-effective-agent-permissions.md`** — Align both managed-agent declarations and registrar MANIFEST policies, then prove the persisted `opencode.json` policies with focused automated coverage. **Breadth**: broad, intentionally atomic because the three coupled representations jointly define the effective repair.

Canonical chain: `openspec/tasks/PROJECT-TASKS.md` → `openspec/tasks/001-repair-effective-agent-permissions.md` → `openspec/specs/agent-permissions/spec-01-effective-agent-permission-repair.md` → `openspec/plans/agent-permissions/PLAN.md` → `openspec/results/agent-permissions/RESULT.md`.

## Validation Status

- [x] The task has non-empty intent, in-scope work, acceptance criteria, and `Dependencies.Requires`.
- [x] The atomic task covers agent frontmatters, registrar MANIFEST parity, and registrar-output testing.
- [x] No task dependency blocks implementation or specification.
- [x] No unresolved decision blocks specification.
- [x] Consolidation into one spec was explicitly approved.
