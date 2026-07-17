# Task: Repair effective managed agent permissions and review remediation

- **Task Number**: 001
- **Slug**: repair-effective-agent-permissions
- **Status**: ready
- **Spec Breadth Hint**: broad
- **Spec Breadth Rationale**: Agent frontmatter, registrar MANIFEST parity, registrar-output coverage, direct write-path evaluation, canonical artifact reconciliation, and PR delivery metadata are coupled parts of one reviewable repair. Splitting them would leave the effective policy or its canonical delivery evidence incomplete.

## Intent

Repair the effective OpenCode permissions for `afg-debate` and `afergon-ai`, keep their declarations and registrar MANIFEST entries equivalent, protect that equivalence with registrar-output tests, and remediate every canonical review failure before PR #70 is reviewed again.

## Context

OpenCode agent frontmatter is copied into the managed agents directory, while `scripts/register-opencode-agents.sh` separately projects MANIFEST permissions into `opencode.json`. The original policy implementation passed focused verification, but canonical review failed because delivery metadata and canonical OpenSpec artifacts were inaccurate or incomplete, bounded writes were asserted only structurally, and missing-file behavior had only one omission variant. A later Implement re-entry was rejected because the canonical PLAN remained `completed`; the canonical plan is now ready for implementation.

## In Scope

- Retain `afg-debate` read access, denied core operations, and its bounded debate-summary write exception in both frontmatter and registrar MANIFEST.
- Retain `afergon-ai` access to `bash`, `edit`, `glob`, `grep`, `read`, and `write`, with `webfetch` denied, in both frontmatter and registrar MANIFEST.
- Retain focused isolated-registrar assertions over the complete persisted permission objects in `opencode.json`.
- Add direct permission evaluation coverage proving a matching debate-summary write path is allowed and a nonmatching write path is denied.
- Cover all-or-nothing registration with two distinct required-file omission variants: missing `afg-debate.md` and missing `afergon-ai.md`.
- Reconcile the canonical active task, spec, plan, and result artifacts so their references, scope, states, and recorded delivery commits are consistent and included in PR #70.
- Update PR #70 to use the exact title `fix(opencode): repair managed agent permissions`, close approved bug issue #71, and reference parent issue #67 without closing it.
- Preserve exactly one `type:*` label on PR #70: `type:bug`.

## Out of Scope

- Changing the approved permission policy beyond the two named agents and exact permissions described here.
- Changing prompts, models, descriptions, modes, temperatures, installer flow, model-profile behavior, or conflict handling.
- Changing permissions or metadata for any agent other than `afg-debate` and `afergon-ai`.
- Enabling web access for either named agent.
- Closing parent issue #67, opening another PR, or merging PR #70.

## Dependencies

- **Requires**: Approved bug issue #71, parent issue #67, and open PR #70 (all available)
- **Enables**: Canonical replanning and bounded Implement re-entry for PR #70

## Acceptance Criteria

- [ ] `afg-debate` frontmatter, registrar MANIFEST, and persisted policy allow `read`; deny `bash`, `edit`, `glob`, `grep`, and `webfetch`; deny other writes by default; and allow writes only matching `openspec/debate/debate-summary*.md`.
- [ ] `afergon-ai` frontmatter, registrar MANIFEST, and persisted policy allow `bash`, `edit`, `glob`, `grep`, `read`, and `write`, and deny `webfetch`.
- [ ] The focused contract detects any added, removed, or changed permission in either named declaration, MANIFEST policy, or persisted permission object.
- [ ] Direct write-path evaluation proves `openspec/debate/debate-summary-agent-permissions.md` is allowed and `openspec/debate/notes.md` is denied for `afg-debate`.
- [ ] Separate omission tests remove `afg-debate.md` and `afergon-ai.md`; each reports the exact missing file and leaves the existing `opencode.json` byte-for-byte unchanged.
- [ ] Policies and non-permission metadata for all unrelated agents remain unchanged.
- [ ] PR #70 contains one reconciled active canonical task/spec/plan/result set, all source references resolve, the executable plan includes every review remediation, and RESULT records every implementation and correction commit delivered by the PR.
- [ ] PR #70 has the exact title `fix(opencode): repair managed agent permissions`, contains `Closes #71` and nonclosing `Refs #67`, does not contain a closing keyword for #67, and has exactly one type label: `type:bug`.

## Open Decisions

None.

## Parallelization

None; the effective policy, adversarial coverage, canonical artifacts, and PR metadata must be reconciled as one atomic review handoff.

## Notes

Reuse PR #70 during the authorized Implement stage. The approved canonical plan at `openspec/plans/agent-permissions/PLAN.md` governs test, commit, push, and PR metadata operations.
