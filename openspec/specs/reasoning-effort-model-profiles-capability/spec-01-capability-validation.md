# Spec: Evidence-backed effort capability and pair validation

- **Source Task**: 004-reasoning-effort-model-profiles-capability.md
- **State**: ready

## Scope

Define the internal capability and validation contract for resolved model/effort pairs, including evidence provenance, explicit unknown acknowledgement, consistent validation surfaces, and source evidence for the candidate OpenCode pin. This is a safe internal P4 capability: it MUST NOT expose effort controls through live CLI/TUI/install/update workflows. Excludes general registry discovery, model-name inference, universal effort enumeration or translation, and runtime diagnostic activation assigned to task 011.

P4 tests isolated capability rules and exact-pair acknowledgement without an Effect development dependency, copied executable upstream internals, or OpenCode execution. The project MUST NOT depend on Effect or directly load OpenCode internal schema modules for these tests; a later public runtime boundary may use Effect internally.

User decision approved on 2026-10-28: preserve this no-Effect P4 boundary and assign public-boundary acceptance proof to task 006, with task 011 evidence reuse. The original 112-line specification is preserved in adjacent `spec-01-capability-validation-old-20261028-no-effect.md` as historical provenance, not an active contract. This clarification does not authorize implementation.

## Requirements

- The capability query MUST distinguish supported (with provider, model, transport, versioned evidence provenance), known unsupported, and unknown; it MUST NOT conflate capability with model availability. Only reproducible evidence establishes supported values.
- Validation MUST reject malformed and known-unsupported pairs with model-specific feedback. Neither unknown-effort nor model-ID acknowledgement may bypass those failures.
- Unknown pairs MAY be accepted only with `--allow-unknown-effort` acknowledgement bound to the exact resolved model/effort pair. Model-ID allowance is separate. A model or effort change invalidates the acknowledgement; runtime-default model plus effort is unknown unless a compatible concrete runtime model is established.
- Save, switch, and projection validation MUST share semantics and run before mutation. Parent model changes MUST revalidate affected inheriting children. Rejection MUST preserve profile, active selection, and host state. Legacy model-only custom workflows remain available.
- Validation MUST NOT infer support from model names, substring matches, or availability listings. Evidence and tests MUST distinguish the candidate OpenCode 1.18.34 pin (upstream commit `e9f8a210b9e2b1e13d375b84906069886eb3b767`) from unverified versions and distinguish schema parse/acceptance from provider request acceptance. Pin evidence alone MUST NOT claim provider execution or universal compatibility. P4 records inspected pin material as source evidence, not executed schema acceptance. P4 neither executes nor vendors OpenCode internal schema modules. Task 006 produces acceptance/normalization through a public configuration-loading boundary and instrumented request proof in a controlled identified runtime; task 011 records/reuses that evidence in its tested/unverified matrix. No provider request acceptance is inferred.
- The complete API MUST remain unreachable from live effort controls at this task prefix; legacy model-only CLI/TUI/install/update behavior MUST remain unchanged. Focused tests and limitations documentation MUST ship with the capability.

## Acceptance Criteria

```gherkin
Feature: Validate resolved model and reasoning-effort capability

  Scenario: Happy path - evidence supports a resolved pair
    Given versioned evidence identifies a supported effort for a provider, model, and transport
    When the resolved pair is validated
    Then validation returns supported with that evidence provenance

  Scenario: Edge case - availability is not capability evidence
    Given a model appears in an availability listing but has no capability evidence
    When its effort pair is validated
    Then validation returns unknown

  Scenario: Edge case - runtime-default model has explicit effort
    Given an effort is assigned and no compatible concrete runtime model is established
    When the pair is validated
    Then validation returns unknown

  Scenario: Happy path - exact unknown pair is acknowledged
    Given a resolved model and effort have unknown capability
    When validation receives acknowledgement for that exact pair
    Then validation accepts the pair as explicitly acknowledged unknown

  Scenario: Edge case - changed model invalidates acknowledgement
    Given an unknown pair was acknowledged for one resolved model
    When the resolved model changes while the effort remains the same
    Then the prior acknowledgement does not authorize the changed pair

  Scenario: Edge case - changed effort invalidates acknowledgement
    Given an unknown pair was acknowledged for one effort
    When the effort changes while the model remains the same
    Then the prior acknowledgement does not authorize the changed pair

  Scenario: Failure case - malformed effort is rejected
    Given an assignment contains a malformed effort value
    When validation is attempted with either acknowledgement flag
    Then validation rejects it with model-specific feedback

  Scenario: Failure case - known unsupported effort cannot be acknowledged
    Given evidence classifies a resolved pair as known unsupported
    When validation is attempted with either acknowledgement flag
    Then validation rejects it with model-specific feedback

  Scenario: Failure case - model-name resemblance does not establish support
    Given an unevidenced model name resembles a model with documented support
    When its effort pair is validated
    Then validation returns unknown rather than inferring support

  Scenario: Failure case - rejected save preserves state
    Given a profile edit contains an invalid resolved pair
    When the edit is saved
    Then the profile and active selection remain unchanged

  Scenario: Failure case - rejected switch preserves host state
    Given switching profiles would produce an invalid resolved pair
    When the switch is attempted
    Then the active selection and host state remain unchanged

  Scenario: Edge case - parent change revalidates inheriting child
    Given a child inherits its model and has an explicit effort
    When a parent change resolves the child to a different model
    Then the child's new pair is validated before the parent change is committed

  Scenario: Edge case - projection validation uses shared semantics
    Given a resolved pair has a known validation result
    When projection validation evaluates that pair
    Then it produces the same acceptance or rejection as save and switch validation

  Scenario: Happy path - pinned source evidence is reported without execution claims
    Given inspected source evidence identifies OpenCode 1.18.34 at upstream commit e9f8a210b9e2b1e13d375b84906069886eb3b767
    When P4 reports that evidence
    Then it identifies the pin and provenance as source evidence
    And it claims neither executed schema acceptance, provider request acceptance, nor compatibility with other versions

  Scenario: Failure case - untested OpenCode version is not claimed compatible
    Given an OpenCode version has no verified compatibility evidence
    When compatibility status is reported
    Then it is identified as unverified rather than inferred from the tested pin

  Scenario: Edge case - effort controls remain inactive at P4
    Given the capability API and validation tests are available
    When legacy CLI, TUI, install, or update workflows run
    Then no live effort control is exposed and legacy model-only behavior is unchanged
```

## Technical Dependencies

- Task 003: model/effort resolution and lifecycle operations; P4 is sequenced after P3.
- P4 records source evidence only for candidate OpenCode 1.18.34 / commit `e9f8a210b9e2b1e13d375b84906069886eb3b767`, as supplied by the canonical debate; source inspection MUST NOT be relabeled executed. Task 006's projection requirement for pinned schema acceptance and unpaid instrumented requests owns acceptance/normalization through the real public configuration loader and instrumented request proof. Task 011's spec-02 E1/E2 and matrix R1 record/reuse actual tested/unverified evidence, not missing prerequisite proof; runtime diagnostics remain task 011. Schema acceptance and request propagation MUST remain distinct from provider request acceptance.

## Unresolved Questions

None. The task's Open Decisions field is `None`.
