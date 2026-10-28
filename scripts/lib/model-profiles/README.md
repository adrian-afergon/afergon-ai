# Model Profiles Vertical

Product vertical for model profile storage, resolution, and lifecycle. Layers point inward: `domain/` holds behavior classes, `application/` holds use cases and ports, `infrastructure/` holds adapters and composition roots.

## P3 resolution and lifecycle (inactive capability)

- `domain/profile-resolution.ts` — `ProfileAssignments` (validated assignments, immutable edits, affected-pair collection, cleanup coverage), `ProfileResolution` (configured vs resolved model/effort with independent sources), `ProfileDesiredState` (active/no-active discrimination with verbatim cleanup coverage). Effort is always agent-local; parent effort never propagates. Legacy strings keep existing model semantics and mean no effort override.
- `application/profile-lifecycle-use-case.ts` — `ProfileLifecycleUseCase` with `saveAssignment`, `clearEffort`, `saveAssignments`, `cloneProfile`, `switchProfile`, `deleteProfile`; all return `Promise<LifecycleResult>`. The `ValidateAffectedPairs` port is required and injected; there is no default acceptance. Rejections leave saved state and caller inputs untouched.
- Commit sequence per operation: retain original source/document → version gate → independent candidate → mutate/resolve/collect → await pair validation → validate/recheck → snapshot the ORIGINAL source before any version-2 promotion (complete receipt required) → final validate/recheck → exactly one `atomicPersist`. Retained snapshots are recovery artifacts, not rollback garbage.
- Missing, unreadable, corrupt, malformed, and dangling states are errors, never intentional resets. Valid `activeProfile: null` is the only no-active source.
- `createProfileLifecycleCapabilities(env, validateAffectedPairs)` in `infrastructure/profile-composition.ts` is additive: the original `createProfileCapabilities` keyset and live routing are unchanged, and nothing reaches the lifecycle from CLI/TUI/facade entry routes before P8.
- Only the update and lifecycle application use cases may call `atomicPersist`; infrastructure and all other files are prohibited (asserted in `tests/model-profiles-architecture.test.ts`).
