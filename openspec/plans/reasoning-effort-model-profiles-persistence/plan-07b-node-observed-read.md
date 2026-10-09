# Plan S07B: Complete Node observation and original read compatibility

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; user-approved completion of S07.

## Summary

Provide the real observation adapter and composition for the accepted S07A reader, then preserve the original directly callable load edge and all32 historical read cases. No write, snapshot or live activation is added.

## Planning Scope

Exact one-read capture, UTF8/JSON parsing, ENOENT-only defaults, private absolute source binding, original Buffer/text output and compiled inactive API. Inherit application behavior/types from S07A; do not duplicate or move those definitions.

## Design Rule Alignment

- `NodeProfileStorageAdapter` implements only the complete `ProfileObservationPort`. Recheck/persist methods belong to S09, not throwing placeholders.
- `LegacyProfileDefaultsAdapter(factory)` is a concrete injected adapter, with an assignment-only constructor and delegated legacy defaults. No new policy interface-per-class.
- Infrastructure selects Node/path/environment/defaults; application and domain stay unchanged and inward-dependent.
- The original load function is a thin composition/delegation/conversion boundary, not a second validation algorithm.

## Assumptions

All32 historical cases/shared tables cost135–151 lines. Additional adapter/binding tests14–20 and imports/default-callable evidence10–15 yield159–186. These grounded ranges are not measured caps; future review or additional cycles may require reforecast.

## Design Tensions

None

## Vertical Slicing Decision

This is a complete real file read, not a tests-only follow-up: its Node adapter/defaults/composition/compatibility API and integration evidence ship together. The earlier application prefix is already callable; this prefix finishes the original S07 outcome.

## Execution Strategy

The user approved the structural split, docs publication and sequential implementation. After reviewed replan publication/current-head CI and accepted S07A review/publication/current-head checks, create fresh `feat/reasoning-effort-p1-class-07b` at `/tmp/opencode/afergon-ai-reasoning-effort-p1-class-07b` from the exact accepted S07A source head. All S07A contracts and evidence remain inherited. Reinspect all five Git categories and stop on changed isolation or unexpected state. This pass executes docs only.
Owned vertical paths: `infrastructure/node-profile-storage-adapter.ts`, `legacy-profile-defaults-adapter.ts`, `profile-read-composition.ts`, and thin `profile-store.ts` load edge; focal read cases/fixtures, README, verified plan07B checklist and `correction/S07B/RESULT.md`. Preserve old blocked S07 RESULT, old published plan07 and historical source branches.
Forecast source65–76/tests159–186/docs4/result68–80/plan16–20 =312–366 additions plus deletions. Fixture introduction is charged here; inherited application/type code is not re-added. Prefer350, STOP projected375, hard399. Future source/result/index churn also counts; no case/evidence reduction to fit.

## Implementation Steps

- [x] Deliver class-owned observation with injected filesystem/default dependencies; construction performs no reads/default invocation.
- [x] Read one Buffer, decode/parse that capture and distinguish ENOENT from permission/read/parse/default-factory errors.
- [x] Bind initial absolute source once, retain private environment for later saver binding, and delegate the original load signature through S07A.
- [x] Preserve all32 actual read assertions and add adapter/binding evidence; verify emitted inactive read, legacy baseline and complete result.

## Interfaces and Technical Contracts

`NodeProfileStorageAdapter(boundPath, filesystem, defaults).observe(): ObservedProfile` consumes the actual Node filesystem collaborator inside infrastructure. It implements S07A's application observation port only; there is no generic filesystem port in application.
Read exactly once without an encoding shortcut, retain captured bytes, derive exact UTF8 text and JSON from that capture. The read catch alone handles ENOENT. JSON parsing and default-factory exceptions must not be caught as missing-file reads. Defaults are in memory only; do not mkdir, create files/backups or normalize config through legacy loadConfig.
`LegacyProfileDefaultsAdapter(factory)` delegates `createDefaultConfig`. A valid default document then passes application/domain validation. Constructors assign explicit dependencies rather than looking up fs, process.env or defaults.
Composition resolves `path.resolve(getConfigPath(initialEnv))` once using current precedence. Private copied `boundEnv` retains relevant initial variables and sets AFERGON_AI_CONFIG_DIR to that absolute dirname; basename is config.json and getConfigPath(boundEnv) equals identity. Caller mutation cannot change binding. Retain this binding for S09's unchanged atomic saver; tests of actual cwd movement and saving remain S09/S13.
`loadProfileDocument(env?)` constructs the capabilities at the infrastructure edge and delegates to the reader. Map source identity to configPath, originalText to originalBytes and Uint8Array to Buffer only here. Preserve the legacy loaded shape and omit byte/text fields for missing files. Conversion must not reserialize JSON or trigger another read.

### Allocation:32 original read cases, all actual reader entrypoints

| Group | Count | Retained assertion obligations |
| --- | ---: | --- |
| A01 | 1 | Formatted multibyte Buffer/text exactness; one captured read; copy ownership |
| A02 | 1 | Original EACCES despite misleading existsSync; no default or retry |
| A03 | 1 | Complete mixed/foreign/empty/inherit values and loaded shape; unchanged file; no backup |
| A04 | 6 | Each null/empty/whitespace/inherit/number/array effort error at actual stored path |
| A05 | 5 | Structured inheritance/model-only, future schema, omitted containers and own prototype-like/opaque data |
| A06 | 14 | Every invalid raw tuple at reader entry, including escaped profile/alias keys; no domain-test substitution |
| A07 | 1 | Exact absent default/identity/false shape; byte/text fields omitted; no directory/file creation |
| A09 | 3 | Emitted callable reader, emitted absent read with no creation, unchanged live facade |
| Total | **32** | Original A08 direct3 stay S06; remaining183 original cases retain their other assigned destinations |

Keep the source tuples/labels/assertions recorded in the old S07 budget analysis and TEST-ALLOCATION. Shared invalid/readable tables are real new fixtures here. Their reuse later does not remove the14 assertions at prepare, acquisition and update entrypoints.

### Ordered evidence

Introduce one failing behavior and minimal lowest-TPP GREEN before T1/T2. Candidate units: same-read byte fidelity, narrow read/default/parse failure scope, and bound composition/legacy shape. New assertions must fail for behavior, not missing import/dist. If an unchanged Node/helper delegation already satisfies an adversary, label characterization and the precise inability to find two new breaks, never fabricate RED.
Additional checks cover injected defaults called once only after ENOENT, constructor silence, malformed JSON SyntaxError identity, a default-factory ENOENT propagated outward, caller env immutability, initial AFERGON/XDG/HOME precedence, absolute private identity and later env mutation. Existing A01/A02/A07 may carry these meaningful assertions without being counted as new historical cases. Node/infrastructure imports never become application allowances.

## Acceptance Criteria

- [x] All32 historical cases execute against the original actual reader/compiled edge with complete assertions.
- [x] Same captured bytes/text/raw JSON, strict failure scope and absent read without writes are proved.
- [x] Absolute binding and outside-only Buffer/environment/default conversion preserve the approved architecture.
- [x] No live exports, writer methods, backups or partial full-storage interface claims.

## Verification

- [x] Tests: single-name sequential cycles, memory suite inherited from S07A, focal suite, original regressions and full suite.
- [x] Build: typecheck/build/health and required original emitted profile-store import.
- [ ] Additional Evidence: direct compiled absent read, constructor/capture/default/error/binding spies, current-source-head CI, complete result and actual budget.
- [x] Rule Compliance: complete adapter capability, explicit composition, preserved source identity and all historical allocations.

Future commands, not run for this proposal:

```text
pnpm exec vitest run tests/model-profiles-persistence.test.ts --no-file-parallelism -t "<exact test name>"
pnpm exec vitest run tests/model-profiles-use-cases.test.ts tests/model-profiles-persistence.test.ts --no-file-parallelism
pnpm typecheck
pnpm build
pnpm run health:runtime
node --input-type=module -e "import('./dist/scripts/lib/model-profiles/infrastructure/profile-store.js')"
pnpm exec vitest run tests/model-profiles.test.ts tests/tui-model-profiles.test.ts tests/tui-model-profiles-controller.test.ts tests/windows-opencode-scripts.test.ts --no-file-parallelism
pnpm test
```

Restore per-case spies and isolate HOME/XDG/config/state/temp roots. Current-head Ubuntu Test and Windows launcher are required; S13 still adds native execution of persistence/use-case/architecture suites, not silently discharged by launcher success. All future outcomes remain outstanding; Markdown application tests/build are not applicable now.

## Open Questions

None

## Dependencies

Completed reviewed/published S07A, explicit approval and reviewed replan authority. S08/S09 consume this complete S07B; original S10/S11/S12 dependencies on S07 likewise bind to S07B. No later API contract changes.

## Risks and Watchouts

The upper366 is only nine below STOP375 and not a proof of final size. Initial fixture/import/checklist growth and inherited graph replacements count both sides. Do not reduce exact loaded-shape comparisons, treat default-factory ENOENT as read absence, use Buffer.slice as an independent copy or interpret sourceIdentity as caller-selected filesystem authority.

## Completion Condition

Permission is ready-with-assumptions: user-approved structural split is a decision, not an assumption; only local reversible fixture/budget estimates remain. After reviewed docs publication/current-head CI and accepted S07A, all reader/integration/emission/case/result/review/current-head checks and compliant measured budget complete the original S07 outcome. This does not complete full storage, snapshots or user effort editing; later approved plans remain necessary.

Local execution produced: focal162 + memory11, regression132/3 skipped, full557/8 skipped, typecheck/build/health and emitted import/absent smoke. Exact cycles, all-layer budget and preservation: [S07B RESULT](../../results/reasoning-effort-model-profiles-persistence/correction/S07B/RESULT.md).
The approved docs/S07A prerequisites are verified; independent B Review and post-publication current-head CI remain normal external handoff evidence, not another implementation-permission gate. Additional Evidence stays unchecked for that CI obligation; S13 native persistence remains separate.
