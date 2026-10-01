# Debate: Reasoning effort in model profiles

**Date**: 2026-10-01

## Objective

Make optional reasoning effort reproducible per agent within a Model Profile, independently of model inheritance, through persistence, CLI/TUI editing, and OpenCode runtime projection. This is the canonical Discovery/debate summary for approved [issue #94](https://github.com/adrian-afergon/afergon-ai/issues/94), not authorization to implement.

## Initial Scope

- Extend existing profile assignments without changing the behavior of legacy model strings or introducing a default effort.
- Define migration, downgrade recovery, validation, model/effort resolution, host seeding, ownership, switch/reset/deletion, and failure behavior.
- Extend CLI inspection/editing and TUI staged assignment editing; retain inactive-profile isolation.
- Project profile state through managed OpenCode JSON for primary and delegated agents, including install, update, and profile refresh on POSIX and Windows.
- Specify runtime compatibility evidence, focused tests, documentation, and independently safe semantic slices delivered through Stacked PRs to main.

### Entry, exit, and related work

| Boundary | Contract |
| --- | --- |
| Start | Approved issue #94 and clean local `main` at `b558aadbef0390c5e9ca833d6b34af1303ffb67a`; current profiles hold model strings only. |
| End of this task | This English summary, with all mandatory debate sections and autonomous technical choices recorded. |
| Prior dependency | [#10](https://github.com/adrian-afergon/afergon-ai/issues/10), model profiles, is CLOSED. Existing model semantics remain the baseline. |
| Follow-on | Align the existing Discovery `breakdown` with this revision, then Plan `specify` and `plannify`; accepted Plan-to-Implement gate, implementation, and review remain required. |
| Related, not prerequisite | [#29](https://github.com/adrian-afergon/afergon-ai/issues/29), provider/model picker, is OPEN. Consume a narrow capability port without waiting for a general registry. |
| Separate proposal | [#64](https://github.com/adrian-afergon/afergon-ai/issues/64), tool-scoped profiles, is OPEN. Do not assume its schema exists on this base; reconcile only if revived. |
| Out of scope | Source changes in this task; new default models/budgets; retired hosts; universal provider reasoning translation; variant management; general registry redesign; unrelated permission/workflow changes. |

## Constraints

- Autonomy: **autonomous** for technical decisions within the supplied scope. Issue approval does not bypass the repository's Plan-to-Implement gate.
- Current task writes exactly this artifact. No source, other artifacts, branches, commits, issues, or PRs are changed or created.
- Delivery uses **Stacked PRs to main**, explicitly selected by the user after breakdown. Each slice must be independently safe and mergeable in dependency order; whole-feature-only atomic landing is not required.
- Every PR must contain **strictly fewer than 400 changed lines** (maximum 399), counting additions plus deletions, including tests, documentation, and Discovery/Plan artifacts. No aggregate final PR, protection bypass, ruleset change, or size exception is permitted.
- Early storage/domain capabilities preserve live host output and legacy workflows. Unfinished behavior stays unreachable/inactive until its complete semantic vertical is delivered; CLI/TUI exposure follows complete underlying projection support.
- The user reports that breakdown verified active `protect-main` rules requiring PRs and one approval. Honor those requirements for every sequential merge; this revision does not independently verify GitHub policy.
- Preserve legacy string assignments; effort is explicit per agent and never copied from the main agent merely because a model is inherited.
- Omitted effort means **no Afergon override**, not disabled reasoning. No universal `high`, `xhigh`, or other default.
- Reset removes only Afergon-owned projected effort. Preserve unrelated user fields, nonmanaged agents, provider configuration, and authoritative managed permissions.
- Runtime JSON is the authoritative Afergon projection. Markdown must not carry competing generated profile model/effort values.
- Unknown capability requires an explicit escape hatch; known unsupported combinations remain errors. Model availability alone is not capability evidence.
- POSIX/PowerShell parity is part of acceptance. No platform deferral is selected; any later deferral requires a documented limitation and linked backlog item before acceptance.
- Follow `AGENTS.md`, `README.md`, and the registered `debate`, `cognitive-doc-design`, `chained-pr`, and `work-unit-commits` skills. New/migrated code belongs to the model-profile vertical with inward-pointing dependencies.

## Success Criteria

1. Legacy strings round-trip without forced conversion. Structured effort assignments survive load/save, clone, switch, installation, and update. Invalid recognized assignment data fails visibly rather than disappearing.
2. Two agents sharing a compatible model retain different efforts. A child can inherit its model and set its own effort; a main-agent effort never implicitly becomes a child's effort.
3. CLI and TUI expose configured model/effort, profile-resolved values, and their separate sources. They do not label projected values as final request-effective values.
4. Model-only edits preserve effort and revalidate affected combinations, including children whose resolved model changes. Rejected edits leave profile and host state unchanged.
5. Effort clear, switching to an effort-free/empty profile, and deleting the active/final profile remove stale owned effort while preserving user-owned values. Missing/corrupt source data does not masquerade as an intentional reset.
6. Registration is idempotent and field-aware. Top-level/nested effort collisions, concurrent user edits, and interrupted ownership writes have deterministic, non-destructive outcomes.
7. Known supported combinations work; malformed/unsupported values are rejected; unknown/custom combinations require explicit, pair-scoped acknowledgement. Legacy model-only custom workflows remain available.
8. A pinned OpenCode 1.18.34 compatibility fixture accepts emitted JSON and instrumented, unpaid request tests prove primary and delegated-agent option propagation, including variant override precedence.
9. POSIX and native PowerShell install/update/refresh produce equivalent managed JSON. Packaged runtime tests prove the shared projection entrypoint ships and executes without a Bash requirement on Windows.
10. Documentation covers actual released syntax, supported-version evidence, provider limitations, migration/downgrade, ownership/reset, variant/plugin precedence, reload expectations, and saved-but-not-projected recovery.
11. Every implementation PR delivers a complete capability or behavior with its own tests/docs, clean parent-relative diff, rollback boundary, and measured additions plus deletions below 400. Each merged prefix is safe: storage/domain work leaves live host output unchanged; projection activation is complete for its surface and tolerates absent effort; CLI/TUI follow projection; the final runtime diagnostic is additive.
12. Discovery/Plan PRs are focused artifact deliverables below 400 lines, or share a semantic PR with sufficient measured budget. No implementation-less/tests-only slice substitutes for a behavior PR. Each PR meets required review/approval and checks before merging to main in order.

## Open Questions

None. Product decisions remain unchanged. The user's explicit stacked delivery choice resolves publication feasibility under the reported ruleset; compatibility experiments, actual diff budgets, and per-PR checks/approvals remain required evidence.

## Debated Points

### 1. Evidence and baseline

Historical checks recorded during the original Discovery summary (not rerun by this revision):

| Evidence | Result |
| --- | --- |
| Local base | `git rev-parse main` returned `b558aadbef0390c5e9ca833d6b34af1303ffb67a`; current branch is `main`. |
| Remote base | `git ls-remote origin refs/heads/main` returned the same full SHA. No fetch or checkout was needed. |
| Issue approval | Live `gh issue view 94` returned OPEN, `enhancement`, `type:feature`, and `status:approved`. |
| Related issues | Live reads confirmed #10 CLOSED, #29 OPEN, and #64 OPEN; their implementation branches were not inspected. |
| Worktree | Initial staged, unstaged, and individual untracked-path checks were empty. Worktree listing also contains four prunable `/tmp/opencode/` entries; none is used or modified. |
| Instructions | Read repository `AGENTS.md`, `.atl/skill-registry.md`, `README.md`, and exact selected skill files. No nested `AGENTS.md` was found. |

**Delivery revision evidence:** the user reports that breakdown verified active `protect-main` requiring PRs and one approval, and explicitly selected sequential Stacked PRs to main. This is user-verified evidence, not an independent ruleset check in this revision. Local revision checks found existing task-artifact changes and this untracked debate artifact; only the latter is edited. The previously observed artifact length was 226 lines, not a measured revised PR diff.

Direct source inspection confirmed:

- `scripts/lib/model-profiles-config.ts:6-14,97-120` and `model-profiles-core.ts:90-101`: assignments are string-only; object assignments disappear during normalization. Arbitrary numeric config versions are accepted, so a version bump alone cannot protect against old writers.
- `model-profiles-core.ts:219-260`: inheritance currently resolves only model selection. Existing JSON deep cloning and atomic config writes already exist (`core.ts:262-264`, `config.ts:130-173`); preserve and regression-test these rather than replacing them gratuitously.
- `scripts/register-opencode-agents.sh:195-268,346-385`: Python independently parses/resolves strings, removes prompt frontmatter, and reconstructs managed agent objects, dropping additional manual options.
- `scripts/lib/model-profiles-host-seeding.ts`: seeding reads model fields only. `model-profiles-save.ts` refreshes only the active profile after persistence.
- `scripts/models.ts:100-148`: refresh invokes Bash and normally skips Windows. The PowerShell copy-only path is reported in #94; native execution was not performed here.

OpenCode evidence is **attributed to the fetched issue and supplied findings**, not independently reproduced in this session: version `1.18.34`, upstream commit `e9f8a210b9e2b1e13d375b84906069886eb3b767`. Issue #94 links agent-schema normalization, request preparation, delegated-task propagation, and provider transforms at that pin. No claim is made that OpenCode or a provider request was executed here.

### 2. Assignment representation, migration, and downgrade

**Decision:** accept legacy strings and structured assignments in the same profile map. An assignment with effort uses `{ "model": "inherit", "reasoningEffort": "high" }` or a concrete model instead of `inherit`. The structured `model` member is optional to preserve implicit model inheritance. Effort omission is the only no-override state; `null`, empty strings, and `inherit` are not effort aliases.

- Normalize into a model/effort domain value without eagerly rewriting legacy strings. Clearing the last effort-related metadata may return an explicit model-only assignment to a string; an implicit-model assignment may become absent.
- Use a new schema version when first persisting extended data, with a recoverable pre-migration snapshot. Reads alone do not migrate. Preserve unrelated/unknown user fields through targeted updates; malformed recognized fields produce a path-specific error.
- A metadata side map would keep model strings readable to old binaries, but old writers still discard new metadata and split one assignment across locations. Prefer cohesive structured assignments with honest downgrade limits.
- Older Afergon versions are **not safe writers** for extended profiles. Provide a documented explicit model-only export to a separate location before downgrade, with a warning that effort cannot be represented; retain the full extended backup. Never overwrite the only extended copy with an export.
- Downgrade preparation removes/restores owned projected effort using the new binary before running the old registrar. It cannot promise that old software preserves manual host options. Restoring a pre-migration snapshot also loses subsequent profile edits; prefer a current model-only export when needed.
- Failed validation/migration/backup prevents persistence and projection. Preserve existing atomic-save and clone guarantees; test metadata round-trips and failure recovery.

### 3. Independent resolution and lifecycle

| Input/event | Model behavior | Effort behavior |
| --- | --- | --- |
| Legacy string | Existing explicit/inherit rules | No override |
| Inherited/unset model plus explicit effort | Resolve model using existing rules | Use this agent's effort only; validate against resolved model |
| Main-agent effort only | Existing model inheritance | Children still have no override |
| Model-only edit | Change model, preserve inheritance rules | Preserve effort; revalidate all affected pairs before save |
| Clear effort | Leave model untouched | Remove assignment override and reconcile only owned host effort |
| Switch to empty/effort-free profile | Existing model semantics | Reconcile all previously owned effort, not just newly populated agents |
| Delete inactive profile | Active host unchanged | No active refresh |
| Delete active/final profile | Existing profile-selection policy | Reconcile selected profile, or clear owned effort when active profile becomes null |
| Missing/unreadable/malformed source | Preserve host; surface degraded/error state | Never infer reset from inability to read desired state |

Valid `activeProfile: null` explicitly means no active effort overrides; a dangling active-profile reference is invalid, not equivalent to null. Keep effort cleanup independent of the legacy null-versus-empty model projection difference. Runtime-default models with explicit effort have unknown capability unless a concrete compatible runtime model can be established; require the unknown-capability escape hatch.

### 4. Projection authority, ownership, and recovery

**Decision:** use one platform-neutral TypeScript projection service, called by CLI refresh and both installer families, replacing duplicated profile resolution at the affected registrar boundary. Preserve the existing manifest/permission contract. Infrastructure reads/writes host files; application/domain code resolves desired state without shell dependencies.

- Emit direct `agent.<name>.reasoningEffort` into managed JSON. Keep named `variant` and unrelated nested `options` user-owned. Do not equate variants with raw effort values.
- Store a versioned ownership receipt outside OpenCode's agent schema, keyed by host-config path, agent, and exact field path. Record the last projected value and any displaced user value/absence. Merely matching a value is not evidence of ownership.
- On first explicit set, snapshot the prior user effort before replacing that exact field. With no override and no receipt, leave manual effort intact. Reset restores displaced user state only if the current field still matches Afergon's recorded projection; otherwise preserve the external edit and report a conflict.
- For nested manual `options.reasoningEffort`, preserve it as a user fallback while the projected top-level value takes precedence at the pinned OpenCode version. Reset removes/restores only the owned top-level slot. Test definitions containing both forms.
- An external edit after a receipt exists must not be silently overwritten on refresh. Report degraded projection and require explicit reapplication of the effort assignment to renew ownership. Do not silently import manual effort during ordinary host seeding; continue model-only seeding and show detected host effort as unmanaged information.
- Merge unrelated user fields while replacing the manifest-owned fields, especially authoritative permissions. Nonmanaged name conflicts retain existing conflict handling rather than gaining automatic ownership.
- Use recoverable write-ahead receipt state and atomic host-file replacement, with previous/desired snapshots and compare-before-write checks. Test crashes on both sides of host replacement; uncertain recovery must preserve user data and report actionable repair guidance.
- Invalid host JSON or invalid managed-entry shapes stop this projection rather than reconstructing a blank host config. This deliberately tightens the current registrar's destructive fallback within the touched boundary.
- A profile save and host refresh are separate outcomes. If save succeeds but refresh fails, retain the saved profile, report “saved; projection pending/failed,” and offer an idempotent retry. Never claim runtime application from persistence alone.

### 5. Provider capability and OpenCode precedence

**Decision:** use a narrow capability port with a versioned, evidence-backed adapter for supported provider/model/transport combinations. Return supported values, known unsupported, or unknown, plus evidence provenance. Start with verified combinations; do not infer capabilities from model-name substrings or model-ID listings. General registry discovery remains #29.

- Reject malformed input and known unsupported pairs with model-specific feedback. Do not translate `high` into another provider's token-budget field or invent a universal effort enumeration.
- Introduce explicit `--allow-unknown-effort` for uncertain/custom combinations, distinct from existing model-ID `--allow-unknown`. Persist acknowledgement bound to the exact resolved model/effort pair; otherwise switch/update could not reproduce an explicitly accepted choice. A model change invalidates that acknowledgement. It never bypasses known unsupported results.
- Apply the same validation to CLI, TUI save, profile switch, and projection. A switch invalidated by current capability evidence leaves active selection and host unchanged; an installer refresh failure preserves the host and reports degraded state.
- The issue's pinned normal-request precedence is generated model defaults → configured model options → current agent options → selected variant → `chat.params` plugins. Later layers can override projected effort. Project/session configuration can also change the loaded agent or selected model; global projection is not final request authority.
- Delegated tasks do not inherit parent options. Project every child explicitly where requested; test child-with-model and child-without-model cases, including inherited variants.
- Treat 1.18.34 as the initial compatibility test pin, not proof that all older/newer versions work. Unknown versions require a compatibility diagnostic; document the tested matrix and avoid claims of universal support.

### 6. CLI and TUI contract

Proposed syntax for downstream specification; these commands/options are **not implemented on the verified base**:

```text
afergon-ai models set afg-review inherit --reasoning-effort high
afergon-ai models effort set afg-review high [--allow-unknown-effort]
afergon-ai models effort clear afg-review
afergon-ai models show [profile]
```

- Keep existing `models set <agent> <model>` behavior and syntax; omission of the new flag preserves effort. Reject conflicting set/clear intent rather than guessing. A combined model/effort edit validates and saves as one assignment operation.
- Inspection separates model configured/resolved/source from effort configured/profile-resolved/source (`explicit` or `no-override`), capability status, and projection status. Host-only manual effort is not a profile value.
- In TUI assignment mode, provide a distinct effort editor with “No Afergon override,” supported choices, and explicit custom-entry acknowledgement for unknown capability. Preselect the current value, including unrecognized saved values; never default a picker to its first effort.
- Preserve `S` to save, `Esc` to discard, deep-cloned staging, and inactive-profile editing without host refresh. A model edit revalidates staged effort instead of silently clearing it. Show text-based errors and pending refresh state.
- CLI help and README examples ship with their user-visible behavior. No live-session hot-swap promise: a new compatible run/config reload may be necessary.

### 7. Verification and platform parity

Tests belong with the semantic behavior they verify, primarily extending `tests/model-profiles.test.ts`, `tests/tui-model-profiles.test.ts`, `tests/tui-model-profiles-controller.test.ts`, and `tests/windows-opencode-scripts.test.ts` or focused successors.

| Evidence group | Required scenarios |
| --- | --- |
| Persistence | Mixed legacy/structured values, malformed fields, future fields/version, migration backup failure, clone independence, downgrade export, atomic failure. |
| Resolution/validation | Same model/different efforts, inherited model/explicit effort, different providers, runtime-default model, changed parent model, known unsupported, pair-bound unknown acknowledgement. |
| Ownership | Manual top-level/nested values, switch/reset/null/empty/final deletion, repeated refresh, external edits, receipt crash recovery, corrupt source/host, unrelated fields and permissions. |
| UX | Model-only preservation, combined atomic edits, configured versus projected display, picker preselection, staged save/cancel, inactive profile, degraded refresh after successful save. |
| Runtime | Pinned schema acceptance plus instrumented primary/delegated requests, variant/plugin overrides, JSON/frontmatter collision fixtures; no paid requests. |
| Distribution/platforms | POSIX and native PowerShell init/update/refresh parity, path/quoting behavior, compiled entrypoint packaging and failure diagnostics. Shell-text tests alone do not establish Windows execution support. |

Before acceptance run applicable focused tests, then repository typecheck/build/runtime health/full suite, platform CI, and review. Record actual results rather than anticipated passes. Markdown-only Discovery requires content review, not application unit tests.

## Partial Conclusions

### Agreed technical direction

Preserve legacy strings; add optional structured per-agent effort; separate effort from model inheritance; choose direct JSON projection with field-level ownership; preserve unrelated user state; validate provider capability without universal defaults; require explicit acknowledgement for unknown combinations; deliver native platform parity through shared projection. These are autonomous technical decisions under the supplied authority, not new unresolved human choices.

### Stacked PR strategy and semantic ordering

**Stacked PRs to main:** merge each approved, verified slice in order. There is no publication blocker from whole-feature atomicity. Labels below are planning identifiers, not existing branches or PR numbers. Implementation budgets are provisional targets including code, focused tests, and docs, with headroom below 400; actual diffs govern acceptance.

| Slice | Start / prior | End: semantic deliverable | Follow-on / excluded here | Approx. changed lines |
| --- | --- | --- | --- | ---: |
| D0 | Approved #94 / recorded base | This revised canonical debate artifact lands through its own PR to main | Focused breakdown/Plan artifacts; no source | 226 lines previously observed; actual diff required |
| P1 | D0 + accepted Plan gate | Complete mixed-assignment storage API: round-trip, strict errors, foreign fields, migration snapshot | P2; extended writes remain outside live entrypoints | 280–350 |
| P2 | P1 | Complete model-only export/recovery capability, retaining extended backups | P3; internal API, no new CLI or old-writer safety claim | 180–260 |
| P3 | P2 | Complete domain resolution/lifecycle operations for save, clone, model edit and deletion | P4; isolated capability, live host output unchanged | 250–330 |
| P4 | P3 | Complete capability validation and pair-bound unknown acknowledgement API | P5; no live effort controls or general registry | 280–350 |
| P5 | P4 | Executable ownership reconciliation/recovery capability with durable receipts, conflict handling and restoration | P6; isolated service, no live host writes | 280–350 |
| P6 | P5 | Complete callable managed-JSON projection service: validation, ownership, permissions, corrupt-host protection and pinned propagation proof | P7; no live launcher activation | 280–350 |
| P7 | P6 | Packaged shared projection entrypoint callable on POSIX and native PowerShell, with parity/failure evidence | P8; existing install/update/refresh routing remains unchanged | 250–350 |
| P8 | P7 | Activate complete install/update/profile-refresh projection on both platforms, including switch/reset/deletion and saved-but-pending recovery | P9; tolerate absent effort, preserve legacy model semantics; no new editors | 280–350 |
| P9 | P8 | CLI effort edit/clear/combined set and truthful inspection/help, fully backed by active projection | P10; no TUI changes | 250–350 |
| P10 | P9 | Complete TUI effort inspection/editor: preselection, staging, save/cancel and unknown acknowledgement | P11; no provider-model registry | 280–350 |
| P11 | P10 | Additive runtime compatibility diagnostic implementation, pinned unpaid request tests and diagnostic/recovery docs | Final acceptance; earlier behavior needs no repair or activation here | 250–350 |

P1–P7 are complete, directly testable capabilities, not interface stubs or file-type slices. Existing entrypoints keep their legacy path/output until P8; extended-state creation and effort-dependent paths stay unreachable from live workflows before their supporting vertical is complete. Verify every intermediate prefix against legacy CLI/TUI/install/update behavior. P6 includes runtime/schema evidence needed to trust projection; P7 proves distribution parity; P8 owns complete activation and lifecycle evidence. P11 adds a real diagnostic, not a source-free test/documentation catch-up PR.

**Artifact budget:** D0 is this artifact's change to main, not a fixed 226-line estimate. Measure its actual additions plus deletions against the intended base, reserve review-edit headroom (target at most 350), and require less than 400 before publication. If over budget, split the artifact revision into focused, internally consistent artifact-update PRs, each below 400. Apply the same rule to breakdown/specification/plan deliverables: focused artifact PRs before the consuming implementation gate, or inclusion in the relevant semantic PR only with sufficient total budget. Do not conceal artifact lines or defer required planning until after implementation.

If any implementation estimate fails measurement, subdivide by complete observable capability with tests/docs and a safe inactive boundary; never separate implementation from its tests or activate incomplete behavior. Keep review scope within approximately 60 minutes.

```text
Dependency / merge order (each arrow requires the prior accepted deliverable):
📍 D0 → focused breakdown/Plan PRs + accepted gate → P1 → P2 → P3 → P4
   → P5 → P6 → P7 → P8 → P9 → P10 → P11
main ← D0; then main ← next ready PR, repeated in dependency order
Pending stacked PRs target their immediate predecessor for focused review.
After that predecessor lands, rebase/retarget the next PR to main and recheck.
```

- **Current boundary:** D0 artifact revision only. Branch setup, PR publication and implementation remain future work. Existing breakdown files require downstream alignment; they are untouched here.
- **Per-slice review:** record source #94, exact base, start/end, prior/next links, exclusions, tests/docs, measured additions plus deletions, rollback and a diagram marking the current PR `📍`. Rebase/retarget polluted diffs; remeasure against main and renew checks/review as required after dependency changes. Each merge needs the reported one approval and all applicable checks.
- **Sequential publication:** each ready PR merges normally to main; no cumulative final PR or direct main-ref advance is needed. The supplied ruleset therefore does not impose the former publication blocker; ordinary PR requirements still apply.
- **Rollback:** hold/revise an unmerged slice and its dependent suffix. For merged work, revert the affected behavior through a reviewed PR; if later slices depend on it, first deactivate/revert that suffix in reverse order. Restore the last safe prefix without unrelated reverts. Before removing projection or extended-state support, use the new binary for owned-effort cleanup and preserve/export extended backups; never deploy an old writer over extended profiles. Artifact rollback restores a coherent planning contract. Every rollback PR also stays below 400 lines.

### Evidence status and handoff

| Expected evidence | Status |
| --- | --- |
| Repository instructions, local/remote base, issue approval and related issue state | produced — read-only checks listed above |
| Source-backed current behavior and canonical artifact | produced — cited files and this summary |
| Artifact format/content review | produced — required headings/product decisions retained; obsolete strategy wording removed; whitespace check passed. Current untracked artifact measured against `/dev/null`: 233 additions, 0 deletions (166 lines below maximum 399); remeasure the actual publication diff at its final base |
| Application tests for this Markdown-only change | not applicable |
| New upstream execution/provider request evidence | outstanding — issue-supplied source evidence is not a runtime test |
| Migration, ownership, UX, platform parity and packaged-runtime tests | outstanding — implementation work |
| Active `protect-main`: PRs and one approval | user-verified during breakdown; not independently rechecked by this revision; sequential PR publication is the selected route |
| Measured final PR diffs, per-prefix safety, checks/approvals and full feature review | outstanding — Plan/Implement/Review gates; estimates are not acceptance evidence |

Next workflow step is to align `breakdown` with this revised summary, then proceed through Plan and its acceptance gate. This task changes only the canonical debate artifact; task files, specifications, implementation plans, code, branches, commits, PRs and GitHub state are untouched.
