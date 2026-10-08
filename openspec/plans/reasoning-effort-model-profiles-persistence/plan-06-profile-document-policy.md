# Plan06: Full raw-document validation as domain behavior

- **Source Task**: `openspec/tasks/001-reasoning-effort-model-profiles-persistence.md`
- **Source Spec(s)**: `openspec/specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md` — ready; sole P1 spec.
- **State**: ready-with-assumptions
- **Execution Mode**: sequential
- **Vertical Slicing**: recommended; validated-document capability.

## Summary

Move the complete57-line document validation behavior into a concrete domain policy using05. Retain the33-line `StoredAssignment` factory unchanged. Validation returns the original raw object and never normalizes recognized/foreign fields away.

## Planning Scope

Mixed assignment values, optional fields, containers, active reference, safe schema integers, foreign slots and original escaped errors. No reads/default injection, filesystem or mutation. Historical A checks remain behavioral references; they do not authorize infrastructure-owned business policy.

## Design Rule Alignment

- `domain/profile-document-policy.ts` owns ProfileDocumentPolicy; **DOMAIN** `domain/profile-document.ts` definitively owns RawProfileDocument, delivered here. Application/adapters import it; no application-owned duplicate.
- Constructor receives concrete `AgentTargetPolicy`; no replaceable alias interface. Domain depends only inward.
- Keep `StoredAssignment.create(unknown, path)` with private assignment-only constructor. Never move validation into a value object's constructor.
- If required for original APIs, `infrastructure/document-validation.ts` becomes a thin delegate composed outside domain. No business checks remain there.

## Assumptions

Local reversible assumption: readable named fixtures retain all allocated assertions without wholesale779-line transfer; existing successful validation remains characterization. Counts are unproved source-budget estimates, remeasured each checkpoint; approved replacement basis is not assumed.

## Design Tensions

None

## Vertical Slicing Decision

Complete directly callable validation is safe without a reader/writer. It enables07 read and08 prepare with no forbidden legacy imports, rather than a models-only scaffolding delivery.

## Execution Strategy

Approved replacement chain:05 → 📍06 →07→08→09→10→11→12→13. Future p1-class-06 branch/worktree from accepted05 follows exact index collision checks after renewed gate; reviewed planning ancestry roots at PR104. Today D writes planning only, transfer/stage none; old closed-source branches/root originals preserve-only.

Future owned: domain document/raw/version/recovery policy, retained assignment factory, compatibility validation delegate, owned focal class tests, README, correction/S06/RESULT.md and corrective deltas. Revised source100–125/tests70–105/docs4–6/result55–70/artifacts8–12 =237–318. [TEST-ALLOCATION](TEST-ALLOCATION.md) assigns A08's3 original direct cases; complete direct domain matrix/version/recovery checks are additional. The14 old raw-reader cases stay at07 and are not silently relabelled domain-only coverage. Factory33 additions and pure method growth count; additive-base deletions require separate reforecast. Prefer350/STOP375/hard399; no fixture/evidence caps.

## Implementation Steps

- [ ] Retain existing factory/class and all valid/invalid stored-value behavior; characterize direct own undefined without serialization loss.
- [ ] Encapsulate full-document checks with injected05 classification and original path formatting.
- [ ] Prove inactive/nontarget recognized errors propagate; unsupported slots remain opaque; future reads remain raw.
- [ ] Complete no-I/O/inward/class behavior evidence, original command baseline and owned result/review.

## Interfaces and Technical Contracts

`RawProfileDocument` is a data interface preserving arbitrary unknown members, not a normalized live config. `ProfileDocumentPolicy(agents: AgentTargetPolicy).validate(raw: unknown, sourceIdentity: string): RawProfileDocument` returns the same object. Identity is diagnostic text only.

Concrete DOMAIN methods `requireSupportedVersion(document: RawProfileDocument, operation: "prepare" | "update" | "snapshot"): void` and `requireRecoveryMatch(matches: boolean): void` own existing mutation/acquisition eligibility and mismatch refusal. Preserve operation-specific original error text/punctuation. Read validation alone accepts valid future schema; preparation/update (including no-op) and snapshot acquisition refuse>2.10's inspector delegates these rules; it computes existing Node JSON structural-comparison facts, not business admissibility. Exact backup-byte equality remains file adapter mechanics. No Node/default-provider import or deterministic-policy port enters domain.

Root/models/profiles/individual profiles must be non-array objects when present. Active selection string/null shape and own-profile existence are checked. Present version is a positive safe integer; omitted version means effective1 without adding a field; >2 known shape is readable unchanged. Every recognized assignment across all profiles uses the factory. Catch only unsupported alias classification, never its subsequent field-validation error.

Strings remain raw nonempty/nonwhitespace, including model inherit. Objects allow omitted model/effort and unknown metadata. Present own model is a nonempty string; present own effort is nonempty string excluding trim/case-varied inherit. Undefined/null/arrays/numbers fail where recognized. Original key spelling and dot/JSON-quoted path escaping remain identical, including invalid container diagnostics. No provider enumeration/default effort.

## Acceptance Criteria

- [ ] All existing invalidReads/readableDocuments/effort matrices and direct own undefined retain errors/values/reference identity.
- [ ] Malformed inactive/nontarget fields cannot be swallowed; unsupported JSON slots remain opaque.
- [ ] Missing fields remain missing; future versions remain readable; all original strings/metadata retained.
- [ ] Class owns validation, domain graph is clean, and relevant behavior/tests/docs/result are reviewed together.

## Verification

New class seam initial runnable RED: malformed recognized inactive assignment reports original path through an injected policy. T1: escaped quote/backslash profile/agent key retains its path; T2: future raw document with opaque malformed foreign slot returns original identity. If extracted checks already pass, label characterization and document inability to find two genuine breaks; never invent behavior changes or compiler RED.

Future exact single-name/focal/typecheck/build/health/emitted/regression/full commands and native CI are in the index. Direct class tests assert behavior/no env/fs and inspect inward imports. Retain full original validation matrix including containers, safe integer bounds, active reference, optional empty objects and prototype-like profiles. Results record exact RED/GREEN/TPP/sequential adversaries or explained already-green exceptions.

Prefix emitted evidence is `node --input-type=module -e "import('./dist/scripts/lib/model-profiles/domain/profile-document-policy.js')"` using05's inherited include. Original profile-store emitted import remains outstanding until07 supplies its reader; full original final acceptance still requires it.

Produced: contracts/source audit and approved replacement basis. Not applicable now: tests/build. Outstanding: parent targeted re-review, separately authorized planning publication, renewed Implement gate and future evidence/budgets. Old A passes remain historical.

## Open Questions

None

## Dependencies

05 complete and accepted, corrective planning publication/gate.07/08 depend on this validator;10 also uses it. P2/P3 wait for full13 acceptance.

## Risks and Watchouts

JSON clone would erase undefined: this validation precedes cloning. Do not tighten plain-object semantics beyond the accepted non-array object behavior or invent arbitrary graph support. Factory compliance alone does not prove the complete vertical architecture.

## Completion Condition

Plan is ready-with-assumptions with literal None questions/tensions and only local reversible fixture estimates. Publication and renewed implementation approval remain pending. Capability completion still requires original validation behavior, class/import evidence, result/review and measured≤399; no source implementation today.
