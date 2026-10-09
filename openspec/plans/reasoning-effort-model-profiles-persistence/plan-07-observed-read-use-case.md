# Plan07: Validated reads through an injected storage observation

> Historical delivery record: user-approved [S07 split authority](S07-PLAN-INDEX.md) supersedes this single-unit delivery with 07A → 07B after reviewed docs publication/current-head CI. Technical goals/APIs remain valid; the State/checklists/budget/permission statements below describe the old plan, not a currently executable ready07. S08 and later original07 consumers wait for completed07B. No old technical record or blocked RESULT is rewritten.

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; complete observed read.

## Summary

Deliver `ReadProfileDocumentUseCase` with constructor-injected observation capability and06 validator, plus real `NodeProfileStorageAdapter.observe`. The adapter captures bytes/defaults/parsing; the application owns validating the raw result. Constructors perform no I/O.

## Planning Scope

Exact same-read bytes/text, ENOENT-only absence/default handling, non-ENOENT propagation, pure application validation and inactive emitted read. No edits, snapshot or config persistence. Domain does not import defaults/config helpers.

## Design Rule Alignment

- Deliver APPLICATION `profile-document-observation.ts` and `profile-observation-port.ts` alongside read-profile-document-use-case.ts. RawProfileDocument is imported from06's DOMAIN profile-document.ts.
-07 NodeProfileStorageAdapter explicitly implements only complete ProfileObservationPort;09 later extends the role to complete ProfileStoragePort. No full-interface claim with missing/throwing future methods or early generic fs port.
- Node fs, Buffer/UTF8/JSON parse, bound path and concrete legacy default-provider adapter stay infrastructure. Constructors receive collaborators explicitly.
- Only composition selects process.env/getConfigPath/createDefaultConfig/fs; no inner-layer env/path/default lookup.

## Assumptions

Local reversible assumption: same-read fixture reuse plus memory fakes retain all allocated behavior within readable source/test/result estimates. Counts are forecasts, not caps or proven fit; remeasure at checkpoints. Approved replacement base is a decision.

## Design Tensions

None

## Vertical Slicing Decision

Class use case + semantic observe role + working Node adapter forms a complete read, not ports-only setup. Missing source remains read-only; adapter extension09 will preserve this implementation.

## Execution Strategy

Approved replacement chain:05→06 → 📍07 →08→09→10→11→12→13. Future p1-class-07 branch/worktree follows exact index collision checks from accepted predecessor after reviewed PR104-rooted planning publication/renewed gate. Reinspect all five categories; preserve closed historical trees/branches and root originals. No stage/transfer today.

Future owned: application observation/observe-only port/read case, actual Node/default-provider/read composition, focal tests/shared raw/readable fixtures, README, correction/S07/RESULT.md and deltas. Inherit05 include without recharging. Revised source75–95/tests100–145/docs4–6/result55–65/artifacts8–12 =242–323. [TEST-ALLOCATION](TEST-ALLOCATION.md) assigns32 old read/emission cases; new constructor/memory observe tests are additional.07 owns shared invalidReads/readable data/setup, but08/11/13 still execute their own14 entrypoint assertions. Count all fixture growth/replacements; prefer350/STOP375/hard399.

## Implementation Steps

- [ ] Introduce typed observation and a compilable callable reader seam; assert behavior through a constructor-injected memory observe fake.
- [ ] Implement Node observation with one byte read, exact text compatibility, ENOENT defaults only and bound identity.
- [ ] Delegate legacy load edge through composition, mapping Uint8Array to Buffer only at that boundary if needed.
- [ ] Prove read/default/error/emission/inactive boundaries and owned evidence before08/09.

## Interfaces and Technical Contracts

APPLICATION `ProfileDocumentObservation { sourceIdentity: string; exists: boolean; sourceBytes?: Uint8Array }`, `ObservedProfile { document: unknown; source: ProfileDocumentObservation; originalText?: string }` and LoadedProfile live at application/profile-document-observation.ts. LoadedProfile uses06's domain RawProfileDocument. Present means actual captured bytes; absent forbids bytes. Defensive copies, no reserialization. Identity is a configured capability/diagnostic token, not a caller-authorized path or env object.

`ProfileObservationPort.observe(): ObservedProfile`; `ReadProfileDocumentUseCase(storage: ProfileObservationPort, validator: ProfileDocumentPolicy).execute(): LoadedProfile`. The real adapter implements observe only at this prefix, with no incomplete StoragePort implementation. Application validates raw result using diagnostic identity and cannot read fs/process/select defaults.09's complete ProfileStoragePort extends this interface compatibly.

`NodeProfileStorageAdapter(boundPath, filesystem, defaults).observe()` reads once, decodes/parses captured bytes, propagates SyntaxError/read failures, catches ENOENT only from read and returns default memory state without mkdir/file/backup. `LegacyProfileDefaultsAdapter(factory)` delegates existing createDefaultConfig; constructor assigns dependency. No alternate default-policy interface is introduced.

Read composition computes initial absolute configPath once with existing getConfigPath precedence plus path.resolve; constructs private boundEnv with AFERGON_AI_CONFIG_DIR=absolute dirname and preserves other relevant initial variables. basename remains config.json; getConfigPath(boundEnv) must equal the bound absolute identity.09 reuses this binding for saver despite cwd/relative-env changes, not a mere env copy. No inner-layer Node/env dependency.

## Acceptance Criteria

- [ ] Mixed metadata/future reads/omitted fields remain unchanged with exact multibyte/formatted byte/text observation.
- [ ] Missing read creates nothing; permission and parse faults propagate; no existence-check shortcut hides read faults.
- [ ] Injected fake read works without Node/env; constructors don't access fs; application validates before returning.
- [ ] Emitted callable reader, compiler include, no live export and legacy regressions are verified.

## Verification

Initial seam RED: fake.observe supplies malformed raw data and application refuses rather than returning it. T1 after GREEN: second valid identity/raw representation returned without normalization; T2: observe failure propagates without fallback or second call. Adapter exact-byte/ENOENT/permission cases may already pass reuse: label characterization honestly. Assert one observe call and no ambient I/O; no missing-import RED.

Future index exact focal/single-name/typecheck/build/health/emitted/regression/full-suite commands plus owned memory-use-case test file command; native Windows baseline remains required. Source/architecture tests check no Node/env/legacy infrastructure imports and constructor injection. Result records lowest sufficient TPP, exact cycles and evidence status, not fabricated old commands.

Produced: plan/contracts and approved basis. Not applicable now: tests/build. Outstanding: parent targeted re-review, separately authorized planning publication/renewed Implement gate and future adapter/native/budget evidence.

## Open Questions

None

## Dependencies

Accepted05/06, corrective docs/gate.09 extends storage capability;10/11 use exact observation;12 receives reader via constructor.

## Risks and Watchouts

Text alone is not exact-byte proof. Uint8Array application acceptance must not silently relax the old Buffer-required snapshot wrapper. Avoid adapter constructors that read process.env or fs and an application wrapper that simply calls legacy loadConfig normalization.

## Completion Condition

Plan is ready-with-assumptions: approved replacement basis, no questions/tensions, local reversible fixture estimates only. Publication/new implementation remain separately gated. Completion requires injected reader/adapter, preserved read/error/no-I/O/emission evidence, result/review/native checks and measured≤399; no writer activation.
