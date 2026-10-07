# Plan A: Complete compatible read and validation

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: applied; A of approved A → B → C → D.

## Summary

Complete the existing inactive reader as a validated, compiled capability. Reuse Unit 1 commit `2887100dbfb64cf1cc9371f190f934b850450ffb`, never reset/rewrite it or call it full persistence. A includes strict full-document validation and the exact source-byte observation required by later recovery. It neither prepares edits nor writes snapshots/configuration.

## Planning Scope

Mixed legacy/structured reads, raw metadata/representation preservation, original-path errors, effective version policy, absent-file defaults, pure candidate validation, explicit compiler inclusion and emitted import. No live routing/host/CLI/TUI/installer changes. Follow [PLAN-INDEX](PLAN-INDEX.md) for full audit, publication, ancestry, ownership and traceability.

## Design Rule Alignment

- Keep `StoredAssignment.create(unknown, path)`; private constructor assigns validated data only. Domain imports no filesystem/legacy infrastructure.
- Extract existing document checks into `scripts/lib/model-profiles/infrastructure/document-validation.ts`, a filesystem-free validator using pure alias classification and domain values. Infrastructure handles file reads. Do not use legacy `loadConfig` normalization.
- Add the exact `scripts/lib/model-profiles/**/*.ts` include entry to `tsconfig.json`; runtime/build inheritance excludes tests, so a source test import cannot prove emission.
- Preserve raw values/key spelling and unknown fields. Pure `normalizeAgentName` only classifies supported entries; catch unsupported classification, not validation errors.

## Assumptions

Local, reversible reuse: extract existing validation checks and refactor green tests into readable named-case tables/shared setup/error assertions, preserving all20 cases and byte/default/read-fault/boundary coverage. Forecasts are not caps or proven final sizes. Extra cycles, replacement helpers and review fixes require reforecast without truncating evidence. Old focused/build/typecheck passes remain historical, not current emission/full proof.

## Design Tensions

None

## Vertical Slicing Decision

A ends with a complete callable read/validation capability, independently safe without disk writes. B will consume its pure validator, C its exact observation, D both. P2/P3 still wait for full D.

## Execution Strategy

Reinspect all five Git categories/full topology and named dispositions in the index before any execution. Publish initial plans separately; historical partial RESULT belongs in the checkpoint docs predecessor. Preferred authorized integration merges that reviewed docs predecessor into existing source ancestry; alternate fresh branch plus explicit exact Unit 1 cherry-pick needs transfer authorization. Select route, check collisions, and obtain renewed gate first.

Source ownership: existing domain/reader/test/README/PLAN deltas, `tsconfig.json`, `scripts/lib/model-profiles/infrastructure/document-validation.ts`, `openspec/results/reasoning-effort-model-profiles-persistence/A/RESULT.md`, and verified A-plan checklist churn. Historical PLAN/RESULT never get rewritten as new completion. No unrelated path is transferred/staged.

Corrected historical checkpoint: domain33 + reader72 + tests172 + README2 + PLAN4 =283 changed lines (281 additions +2 deletions); historical RESULT54 gives337. RESULT's281/335 mislabels additions as changed lines and stays bytewise unchanged; checkpoint docs publish corrected provenance beside it. The old417–489 forecast already summed283, despite its prose error.

Reviewed forecast: final source111–121 (domain33 + loader28–30 + extracted validator50–58), final tests125–140, A result80–90, README4–6, include1, historical PLAN churn4, slice PLAN6–10 = **331–372**. Named-case tables/shared setup retain every original case and additional observation/read-fault/boundary behavior; result keeps all mandatory headings, genuine exact-cycle rows and explicitly unknown historical details.

Source/tests are new files absent from the docs PR base. After authorized GREEN, readable refactors count their final file lengths as additions, not the original283 plus intermediate edits. Preserve2887100 without reset/force; any inherited-file replacements count additions+deletions. Historical RESULT is charged once in docs, future exact-cycle result only with source. Forecasts are not caps/proof: reforecast extra cycles/helper churn/review fixes at each GREEN, STOP≥375, hard399, prefer350, never truncate evidence.

## Implementation Steps

- [x] A1 characterize inherited mixed reads and missing defaults; implement any uncovered exact-byte observation through sequential behavioral cycles.
- [x] A2 expose pure full-document validation; reject invalid own recognized fields before JSON cloning and retain original quoted paths.
- [x] A3 complete supported/opaque classification, version/container/reference and unusual own-key validation matrix without normalization.
- [x] A4 add explicit compiler inclusion; prove emitted import and inactive boundaries; run full original baseline and persist A result/review budget.

### Ordered TDD and adversarial matrix

Each unit starts with one executable behavior test, minimal GREEN using lowest sufficient Implement TPP index, then T1 RED/GREEN before T2 RED/GREEN, then green-only refactor. Missing export/type error is not RED. If inherited code already passes, label characterization; identify an uncovered behavior or document why two genuinely breaking cases cannot be found.

| Unit | Initial behavior | Sequential adversarial T1, then T2 |
| --- | --- | --- |
| A1 | Mixed document read with exact observation and no side effects | Multibyte/formatting source bytes retained; non-ENOENT permission/read failures propagate rather than becoming defaults |
| A2 | Pure validator rejects recognized own invalid effort with original path | Direct own-undefined rejection is characterization if already passing; escaped profile/agent keys plus malformed model retain original paths, and untested malformed kinds enter sequentially |
| A3 | Full known-shape validation while unsupported slots remain opaque | Present invalid version/container/dangling active reference fails; future version plus prototype-like own profile and malformed foreign slot preserves raw data |
| A4 | Explicit runtime emission imports standalone capability | Built import performs no host/config write; legacy barrel/routing still excludes new capability and legacy regressions remain unchanged |

The old RESULT records mixed-read and individual container/field REDs and passing optional-field/foreign/future-version characterizations. Missing historical exact-command/TPP details stay explicitly unknown, never reconstructed as observed. Existing domain own-property checks already reject own undefined: add direct characterization, not fabricated RED. Retain all20 inherited cases and add ENOENT-only missing defaults/no file/directory/backup, permission/read failures, byte capture and boundaries. Matrix also covers assignment null/array/number, empty/whitespace model, valid case/trim-varied model inherit, empty/whitespace/case-varied effort inherit, numeric/array/null effort, structured no model/no effort/empty object, safe integer bounds, malformed activeProfile, absent version/containers. Direct undefined fixtures cannot serialize the value away.

## Interfaces and Technical Contracts

`validateProfileDocument(document: unknown, configPath: string): Record<string, unknown>` validates without filesystem/environment access, returns the same raw object, and never injects defaults into an existing document. Empty optional containers mean legacy defaults for interpretation only. All profiles and recognized slots are checked, not just active/target. Version when present is positive safe integer; missing means effective1, >2 is readable with known shapes validated.

`loadProfileDocument(env?: NodeJS.ProcessEnv): LoadedProfileDocument` retains document/configPath/exists and compatible `originalBytes?: string`, adding `sourceBytes?: Buffer`. Perform one Buffer read, capture those actual bytes and decode only for JSON parsing/text compatibility; never reread or serialize parsed data to derive bytes. Catch only ENOENT from the read for absent-source defaults: no exists-check shortcut or broad catch that hides permission/read faults. Other filesystem errors propagate. Absence returns default in memory with no captured bytes or filesystem creation. C compares Buffer/existence. Object-equality fixture updates are refactor churn, not new RED behavior.

Valid legacy strings are nonempty/nonwhitespace, including inherit. Structured optional model uses the same string rule; optional effort is a nonempty string excluding case/trim-varied inherit. Comparisons trim but stored values retain case/whitespace. No provider format/enum/default. Unsupported slots are opaque JSON. Own-key checks protect prototype-like user names. Validation errors name the original escaped container/member path and propagate.

## Acceptance Criteria

- [ ] All A matrix cases pass; read preserves representation/foreign data/version and never migrates or writes.
- [ ] Pure validator catches malformed recognized fields/containers/version/reference, including own undefined without clone loss.
- [ ] Exact source Buffer and legacy text describe the same read; ENOENT alone returns defaults, permission/read faults propagate, absent source remains absent.
- [ ] Compiler include, emitted import, unchanged live boundaries and complete original regression baseline are proved.
- [ ] Reviewed reuse forecast revalidated at execution, A result complete, base-relative diff399 maximum and ordinary approval/checks obtained.

## Verification

- [ ] Tests: single-name command per cycle, focused suite per unit, original regression/full suite below.
- [ ] Build: inspect include/inheritance, typecheck/build/health and emitted import below.
- [ ] Additional Evidence: actual ancestry/topology/status/numstat via original PLAN's exact Git commands; A result and native CI.
- [ ] Rule Compliance: review inward dependencies, validation factory/raw preservation, byte fidelity and no live export.

Exact original final commands; future obligations only:

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

Use isolated HOME/XDG_CONFIG_HOME/AFERGON_AI_CONFIG_DIR. New cycles need genuine exact single-name invocation/outcome/RED reason/TPP evidence; old passing cases are characterization, unrecorded historical detail explicitly unknown. `pnpm test` includes required rebuild. Produced now: supplied fresh review and arithmetic/contract planning audit. Not applicable now: application tests/build for Markdown-only correction. Outstanding: corrected-plan acceptance/re-review, publication/renewed gate and all new implementation/full/native evidence. Future cycle evidence cannot be prepublished.

## Open Questions

None

## Dependencies

Reviewed checkpoint and four planning publications, accepted corrected plan and renewed implementation gate. Unit1 is preserved input, not completed A. B/C/D and full task acceptance follow A.

## Risks and Watchouts

The UTF-8 string currently captured is not arbitrary-byte fidelity. Do not claim a test with only JSON.stringify ASCII proves exact bytes. Build/typecheck historical success did not emit this inactive module because tests are excluded. Future versions validate known shape but B/D refuse every mutation including no-op. Raw read objects are not a whole-candidate lifecycle adapter.

## Completion Condition

A is ready-with-assumptions for local reversible reuse; execution awaits accepted corrected plans, publication and renewed gate. A completes only when read/validation/emission/boundary evidence and result are produced with a measured compliant PR. Original task remains incomplete; planning approval is not renewed implementation approval.
