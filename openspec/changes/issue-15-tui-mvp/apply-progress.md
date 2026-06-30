# Apply Progress: issue-15-tui-mvp

## Implementation Progress

**Change**: issue-15-tui-mvp  
**Mode**: Strict TDD

### Completed Tasks
- [x] 1.1-6.2 Prior launcher, shell, MVP screen, branding, navigation, and accessibility slices remain complete from PR1-PR10.
- [x] 7.1 RED/GREEN: add `tests/tui-actions.test.mjs` for argv-only execution, read-only inline output, confirm-before-mutate, and Esc/Cancel recovery.
- [x] 7.2 Create `scripts/lib/tui/actions/definitions.mjs`, `scripts/lib/tui/actions/runner.mjs`, and `scripts/lib/tui/actions/forms.mjs`; extend `scripts/lib/tui/command-manifest.mjs` for stable action argv builders only.
- [x] 7.3 Update `scripts/tui.mjs` and `scripts/lib/tui/navigation.mjs` with section action selection, modal state, output panel, and focus-return helpers.

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `scripts/lib/tui/command-manifest.mjs` | Modified | Added manifest-backed argv builders and allowlist branding for executable interactive actions. |
| `scripts/lib/tui/actions/definitions.mjs` | Created | Added shared action-definition validation for read/mutate actions and manifest-backed argv resolution. |
| `scripts/lib/tui/actions/forms.mjs` | Created | Added shared confirmation, form, sanitization, and bounded output helper state for the interactive TUI layer. |
| `scripts/lib/tui/actions/runner.mjs` | Created | Added shell-disabled argv execution with timeout handling and captured stdout/stderr results. |
| `scripts/lib/tui/navigation.mjs` | Modified | Added section-action selection plus modal open/close helpers for route-local interaction state. |
| `scripts/tui.mjs` | Modified | Added injected interactive action rendering, read vs mutate execution flow, confirmations, form handling, output panel behavior, and focus recovery. |
| `tests/tui-actions.test.mjs` | Created | Added shared framework coverage for manifest argv builders, runner safety, output sanitization, stale-selection clamping, and modal/output recovery. |
| `openspec/changes/issue-15-tui-mvp/tasks.md` | Modified | Added PR11-PR13 action-extension tasks and marked PR11 complete. |
| `openspec/changes/issue-15-tui-mvp/design.md` | Modified | Extended the design to cover the shared action framework and later section action slices. |
| `openspec/changes/issue-15-tui-mvp/specs/tui-command-surface/spec.md` | Modified | Extended the spec with interactive-action, modal/focus, and bounded-output requirements. |

### TDD Cycle Evidence
| Task | Test File | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-----|-------|-------------|----------|
| 7.1 | `tests/tui-actions.test.mjs` | ✅ Added failing import-first action-framework tests before the helper modules existed. | ✅ Focused Vitest run passed after definitions, runner, modal flow, and output rendering landed. | ✅ Covered immutable argv builders, read-only inline execution, mutating confirmation, cancel recovery, stale-selection clamping, and sanitization. | ✅ Kept the framework generic by isolating manifest validation, navigation helpers, and output formatting from section-specific adapters. |
| 7.2 | `tests/tui-actions.test.mjs` | ✅ Added failing definition/runner assertions before `actions/*.mjs` existed. | ✅ Shared action helpers passed focused Vitest coverage. | ✅ Covered success, stderr failure, timeout kill, manifest-allowlist rejection, and C1/ANSI sanitization. | ✅ Centralized command execution in `runner.mjs` and argv policy in `definitions.mjs`. |
| 7.3 | `tests/tui-actions.test.mjs` | ✅ Added failing modal/output interaction tests before wiring interactive state into `createTuiApp()`. | ✅ TUI interaction tests passed after section selection, modal state, and output close behavior were wired. | ✅ Covered route-local action selection, output close, Escape cancel, and stale-selection normalization across route changes. | ✅ Injected section actions into `createTuiApp()` so later PR12/PR13 slices can wire real adapters without rewriting the shell. |

### Remaining Tasks
- [ ] 8.1-8.3 Configuration and Status interactive action wiring, docs, and verification.
- [ ] 9.1-9.3 Model Profiles interactive action wiring, final sanitization/docs, and verification report refresh.

### Verification
- `pnpm test -- tests/tui-actions.test.mjs tests/tui-shell.test.mjs` ✅
- `pnpm test` ✅

### Deviations from Design
None — PR11 stays within the shared interactive framework and defers section-specific wiring to PR12/PR13.

### Issues Found
None.
