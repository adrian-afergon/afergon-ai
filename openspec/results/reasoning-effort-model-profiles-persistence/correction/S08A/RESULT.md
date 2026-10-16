# S08A execution evidence

## Implementation Status

In progress.

## Plan Reference

- Plan: `openspec/plans/reasoning-effort-model-profiles-persistence/plan-08a-validated-edit-context.md`.
- Execution Mode: sequential; user explicitly authorized S08A only in this execution.

## Execution Summary

Fresh `feat/reasoning-effort-p1-class-08a` at `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-08a`, exact base `ab54a695fa796e34a50cda41c5a4064b13eeb0d7` (PR126 OPEN, four SUCCESS checks; issue94 OPEN/status:approved).
Entry: root main/upstream0/0; planning branch/upstream0/0; 22 registrations including seven prunable, all preserved. All accessible valid trees inspected; unavailable registrations are not claimed clean. Fresh tree HEAD/base0/0, empty staged/unstaged/untracked sets.
Preserve/no transfer/no stage: root PROJECT-TASKS161+1 and32 enumerated originals, old S08 four tracked/four checkpoint untracked/four planning originals, S07 four untracked, D eleven untracked, all other refs/trees. Only A-owned deltas in this fresh tree may stage. Old S08's three cycles remain provenance, not new proof.

## Completed Steps

- Isolation and remote gate verification produced.
- Six clone characterizations and exact inward extraction complete; `pnpm build`, then `pnpm typecheck` exit0; `git diff --check` exit0. Rollback: cloner, core facade and six focal clone cases as one unit. Runtime invocation belongs to context delivery.

## Updated Plan Artifacts

None

## Commits Created

None

## Files Changed

- Focal tests and this result; source extraction/context pending.

## Verification Results

Commands run from the isolated worktree. Environment prefix `pnpm_config_pm_on_fail=ignore` uses installed pnpm11.3.0: pinned11.21.0 auto-switch fails ENOENT before execution; no repository config changed. Frozen-lockfile install succeeded (exit0).
- Characterization command: `pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t 'generic clone'`: exit0, six passes/162 skipped before extraction. Defaults, three guard fallbacks, JSON conversion, nested bidirectional independence. Already green; no invented RED. Cannot find two breaks without changing inherited JSON/default/guard semantics, which this extraction must preserve.
- Extracted the exact generic body/guard/default/fallback inward; legacy facade delegates, unrelated guard retained. Same command post-extraction: exit0, six passes/162 skipped. TypeScript missing source-map warning is non-failing, not RED.
- GREEN forecast: source12 measured + remaining53–78; tests20 measured + remaining118–149; docs4–6/result68–85/planchurn16–20 =291–370 complete. No additional behavior added.

## Blockers or Deviations

None

## Notes

- Initial forecast: source65–90/tests138–169/docs4–6/result68–85/planchurn16–20 =291–370; reforecast after each GREEN.
- Expected evidence: tests/build/emitted/graph outstanding; independent review and source-head CI external gates; Windows new persistence fault target belongs to S13. No B72 credits.

## Next Step

Characterize original clone behavior before unchanged extraction, then fresh strict context TDD.
