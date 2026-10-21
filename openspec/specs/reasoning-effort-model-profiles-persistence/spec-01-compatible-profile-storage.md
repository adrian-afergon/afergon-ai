# Spec: Compatible per-agent effort profile storage

- **Source Task**: `001-reasoning-effort-model-profiles-persistence.md`
- **State**: ready

## Scope

Defines directly callable profile persistence for legacy model-string and structured assignments, strict validation, targeted data preservation, migration recovery, clone independence, and the inactive P1 boundary. Excludes downgrade export (002), resolution/lifecycle (003), capability validation, host projection, CLI/TUI editing, and live host activation.

## Requirements

- Profile storage MUST round-trip legacy string assignments unchanged alongside structured assignments; reads MUST NOT migrate schema or convert strings.
- A structured assignment MAY omit `model` to retain existing model inheritance. `reasoningEffort` MUST be explicit when present; omission means no override, while null, empty string, and `inherit` are invalid.
- Malformed recognized assignment fields MUST fail with an error identifying the offending profile/agent field path; parsing MUST NOT silently discard them.
- Targeted profile updates MUST preserve unrelated and unknown user fields, including fields nested beside recognized data.
- First persistence of extended assignment data MUST use a newer schema version and create a recoverable pre-migration snapshot before replacing profile data. Validation, snapshot, or atomic-save failure MUST leave original persisted data intact and prevent downstream projection.
- Cloning MUST preserve assignment metadata while keeping the clone independent from later source or clone mutations.
- P1 MUST expose directly testable storage capability without routing live CLI, TUI, install, update, or refresh workflows through extended writes or changing host output. Focused tests and migration/old-writer limitation documentation MUST accompany the capability.
- Each implementation delivery MUST remain independently safe in dependency order and strictly below 400 changed lines, counting additions and deletions across implementation, tests, documentation, and artifacts; tests/docs MUST remain with their behavior unit.

  User-approved exception, 2026-10-16: S08A alone MAY contain up to **450 changed lines inclusive**, counting every source, test, helper, documentation, specification, plan, result and review-fix delta. Stop if its complete projection exceeds450; no automatic extension or evidence cuts. S08C retains STOP375/hard399; functional requirements and all other deliveries retain the general rule above, except the separately approved S08B exception below.

  User-approved exception, 2026-10-19: S08B alone MAY contain up to **450 changed lines inclusive** against published S08A HEAD1ada42fd504fab645ec7ebca615b34195519f0a7, including all source, tests, fixtures, documentation, this amendment, plans, results and review fixes. Stop above450 complete projection; no automatic extension, further prefix, code compression or evidence cuts. S08A's separate450 exception remains scoped to A; S08C/all other deliveries retain their original STOP375/hard399 and general rule.

  - User-approved S09-only `size:exception`, 2026-10-19: “Autorizo superar el techo de líneas para esta tarea.” The complete cohesive S09 storage capability MAY exceed STOP375/hard399; no replacement numerical ceiling was specified or inferred from the earlier450 suggestion. Count and report the final additions plus deletions across source, tests, fixtures, README, specification, plans/index, result and review fixes; preserve meaningful evidence and report review burden. Functional Gherkin, migration/inactive boundaries and verification/review/CI obligations remain unchanged. No further slicing or code/evidence compression. S08A/B450 remain independent historical exceptions; S08C and S10–S13 retain STOP375/hard399.

  - User-approved S10-only `size:exception`, 2026-10-20: “autorizo una excepcion”, answering the S10-specific size request. The complete cohesive read-only S10 inspection delivery MAY exceed STOP375/hard399; no new numerical ceiling was agreed. Measure all source, tests, fixtures, README, specification, plan/index, result and review-fix additions plus deletions against published S09 `402722a1892f62dae621ac7bbe69adcdb38d3c8f`; report actual size and review burden. Preserve all meaningful code, spacing, comments and evidence; no further slicing or scope expansion. Functional Gherkin, types, architecture, Review and native CI obligations remain unchanged. This later S10 authorization is separate from S09 and S08A/B450; S11–S13 retain STOP375/hard399.

  - User-approved S11-only `size:exception`, 2026-10-20: “Autorizo”, answering the S11 acquisition/cleanup/tests/evidence exception request. The complete cohesive S11 delivery MAY exceed STOP375/hard399 with no new numerical cap. The183 actual and423–457 forecast are historical checkpoints, not ceilings. Count all source, helper/extraction additions AND deletions, tests, README, this amendment, plans/index, result and review fixes against published S10 `5d6d45bd2dbc5807413c4c8bfb9ab4f6d61098c0`; report final measured size and review burden. Preserve code, comments, spacing, docs, tests and evidence; no further slicing or scope expansion. Functional Gherkin, types, architecture, Review and native CI obligations are unchanged. S09/S10 and S08A/B450 exceptions remain separate; S12/S13 retain STOP375/hard399 and the general rule.

  - User-approved S12-only `size:exception`, 2026-10-20: “autorizo”, answering the S12-specific request. The complete cohesive UpdateProfileAssignmentUseCase, ten allocated real D order cases, memory-port evidence and pure test-owned architecture checker MAY exceed STOP375/hard399 with no new numerical cap. The125-line checkpoint and677–883 forecast are dated measurements/estimates, not limits. Count all source, tests, helpers, fixtures, emitted programs, README, specification, plan/index, result and review-fix additions plus deletions against published S11 `649b6032df695f064e77d3563b025aa34ad5811e`; report actual size and review burden. Retain comments, spacing, docs, tests and evidence; no compression, additional prefix or functional expansion. Gherkin, API/architecture and verification/review/CI obligations remain unchanged. This exception is S12-only; S13 retains STOP375/hard399.

  - User-approved S13-only `size:exception`, 2026-10-21: “Acepto la excepcion” authorizes the complete cohesive S13 compatibility composition, original APIs, remaining55 real integration cases, ten-case wrapper retarget, full218 reconciliation, runtime/architecture/binding evidence and targeted native Windows step above STOP375/hard399, without a new numerical cap. The605–855 forecast is an estimate, not a ceiling or proof. Count and disclose every source/test/helper/CI/README/spec/plan/index/result/review delta against published S12 `21923939b5b305ac2a829f67d08e1955355cd66c`, including the checkpoint and this authority amendment. Preserve tests, evidence, comments and spacing; no code golf, additional prefix or functional expansion. All Gherkin/types/layers and Review/native CI obligations remain unchanged. Previous exceptions remain separately scoped. Resume needs no additional documentation-publication gate.

## Acceptance Criteria


```gherkin
Feature: Compatible and recoverable model profile persistence

  Scenario: Happy path - Mixed assignments round-trip without read migration
    Given a profile contains legacy model strings and valid structured assignments, including one without a model
    When the profile is loaded and saved without extended-data changes
    Then legacy strings and structured values retain their representations and values
    And the schema version and migration snapshot remain unchanged

  Scenario: Edge case - Omitted effort means no override
    Given a structured assignment contains an optional model but omits reasoningEffort
    When the assignment is loaded
    Then it remains valid and exposes no effort override

  Scenario: Edge case - Targeted edits retain foreign metadata
    Given a profile contains unknown top-level and nested user fields beside valid assignments
    When one recognized assignment is updated and persisted
    Then every untouched unknown field retains its original value

  Scenario: Edge case - First extended write is recoverable
    Given valid legacy profile data with no migration snapshot
    When a structured assignment with explicit effort is first persisted
    Then the newer schema version is persisted only after a recoverable pre-migration snapshot exists

  Scenario: Failure case - Invalid recognized effort is rejected with its path
    Given a structured assignment has null, empty, or inherit as reasoningEffort
    When the profile is read or validated for persistence
    Then the operation fails with the offending profile and agent field path
    And no malformed recognized value is silently discarded

  Scenario: Failure case - Malformed recognized assignment is not normalized away
    Given a recognized assignment contains a malformed model or reasoningEffort field
    When the profile is loaded
    Then loading fails with the offending field path and does not return a silently reduced assignment

  Scenario: Failure case - Snapshot or atomic save failure preserves source data
    Given an extended write requires migration and snapshot creation or atomic replacement fails
    When persistence is attempted
    Then the original profile data remains intact and no downstream projection occurs

  Scenario: Failure case - Live workflows remain on legacy behavior
    Given the P1 storage capability is present but later activation work is incomplete
    When a user runs existing CLI, TUI, installation, update, or refresh workflows
    Then none creates extended assignment state and host output remains unchanged
```

## Technical Dependencies

Local evidence, 2026-10-21: all eight Gherkin scenarios map to runnable original-API/domain/preparation/snapshot/update assertions in [TEST-ALLOCATION](../../plans/reasoning-effort-model-profiles-persistence/TEST-ALLOCATION.md); [S13 RESULT](../../results/reasoning-effort-model-profiles-persistence/correction/S13/RESULT.md) records full1084/8skip, all218 original-case mapping, unchanged live regressions and emitted/no-I/O proof. Functional Gherkin above is unchanged. Full P1 acceptance still awaits canonical Review and current published source-head native Windows targeted fault execution.

- None; this is P1 and the task declares `Dependencies.Requires: None`. Tasks 002 and 003 depend on this capability and are not prerequisites.

## Unresolved Questions

None. The task and canonical debate resolve the technical choices; no open decisions remain.
