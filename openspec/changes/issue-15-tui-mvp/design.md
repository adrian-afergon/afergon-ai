# Design: TUI Interactive Command Surface MVP

## Technical Approach

Preserve the verified MVP launcher and section scope, then extend the TUI with an interactive actions layer inside Configuration, Status, and Model Profiles. The new layer reuses explicit argv-based command definitions, adds bounded modal/form state plus an inline output panel, and keeps accessibility/keyboard flow review-safe through stacked PR11-PR13 after the completed PR1-PR10 slices.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Branding source | Extract the canonical logo/tagline/fallback copy to `scripts/lib/branding/logo.mjs` and import it from `extensions/startup-banner.ts` and `scripts/tui.mjs` | Keep duplicated art in startup banner, README, and TUI | One runtime source of truth avoids drift and lets TUI reuse the project brand safely. |
| Charset handling | Ship default canonical artwork plus plain-text fallback now; keep the branding module ready for optional future variants | Invent new ASCII/Unicode variants immediately | Exploration found no separate variants today, so the design must not fabricate them. |
| Navigation scope | Add selection state only to Home for this extension | Full cross-screen focus model in one slice | Home-only arrows improve keyboard operability without pushing the change over the 400-line budget. |
| Visible focus | Use text markers and footer hints, not color-only cues | Color-only highlight or hidden keymap | Terminal accessibility must remain readable in monochrome or low-color environments. |
| Action execution | Run TUI actions through argv arrays and `spawn`/dispatcher helpers only | Shell strings or inline `exec` | Prevents shell injection, preserves quoted arguments, and matches existing CLI routing discipline. |
| Modal state | Add explicit action/form/output state in `scripts/tui.mjs` with small helper modules | Implicit ad hoc booleans inside each screen renderer | Shared modal state keeps focus recovery, cancellation, and refresh rules consistent across sections. |
| Section definitions | Add typed action-definition builders per section | Hard-code per-screen key handlers and one-off commands | Section-local definitions can express read-only vs mutating behavior while sharing one runner/confirmation pipeline. |
| Post-mutation refresh | Re-read adapters after successful mutation before returning to the section | Mutate cached screen state in place | Current sections already derive state from adapters; rereading avoids divergent local cache logic. |

## Data Flow

```text
scripts/lib/branding/logo.mjs
   ├─> extensions/startup-banner.ts
   └─> scripts/tui.mjs -> renderHomeScreen()

scripts/lib/tui/navigation.mjs
   └─> home selection index + route state
         └─> scripts/tui.mjs input handler
               ├─> action definitions per section
               ├─> inline runner / confirmation / form state
               └─> screens + help/footer copy + output panel

scripts/lib/tui/actions/*.mjs
   ├─> section action definitions + argv builders
   ├─> action runner (read-only inline / mutating confirm)
   └─> completion result
         └─> scripts/tui.mjs refreshes adapters + re-renders section/output panel
```

## File Changes

| File | Action | Description |
|---|---|---|
| `scripts/lib/branding/logo.mjs` | Create | Canonical runtime logo lines, tagline, fallback title/copy, and future variant hook. |
| `extensions/startup-banner.ts` | Modify | Import the shared branding payload instead of owning the banner text inline. |
| `scripts/tui.mjs` | Modify | Add section action selection, modal/form/output state, inline execution flow, confirmations, and refresh-after-mutation wiring. |
| `scripts/lib/tui/navigation.mjs` | Modify | Extend navigation state beyond Home selection to track active section actions and modal focus return points. |
| `scripts/lib/tui/command-manifest.mjs` | Modify | Expand stable argv definitions for `doctor --opencode`, `init` option sets, and model profile action builders without shell strings. |
| `scripts/lib/tui/actions/runner.mjs` | Create | Execute bounded argv actions, capture stdout/stderr/exit status, and classify read-only vs mutating outcomes. |
| `scripts/lib/tui/actions/definitions.mjs` | Create | Define per-section action metadata, required inputs, confirmation copy, and refresh targets. |
| `scripts/lib/tui/actions/forms.mjs` | Create | Normalize checkbox, picker, and text-form state for init/model profile actions. |
| `scripts/lib/tui/screens/*.mjs` | Modify | Render actionable lists, modal prompts, form fields, output panel, and non-color-only focus/help cues. |
| `tests/tui-shell.test.mjs` | Modify | Cover Home selection state, arrow movement, enter activation, and retained letter shortcuts. |
| `tests/tui-actions.test.mjs` | Create | Cover shared action definitions, runner safety, confirmations, cancellation, output capture, and refresh triggers. |
| `tests/tui-docs.test.mjs` | Modify | Lock docs/help expectations for logo, accessibility copy, and final verification notes. |
| `tests/tui-configuration.test.mjs` | Modify | Cover inline `doctor`, confirm-before-`init`/`update`, checkbox init form, and Configuration focus recovery. |
| `tests/tui-status.test.mjs` | Modify | Cover Status inline doctor output, repair action confirmations, and section refresh messaging. |
| `tests/tui-model-profiles.test.mjs` | Modify | Cover read-only views plus switch/set/create/delete forms, output/errors, and refresh-after-mutation. |
| `README.md` | Modify | Keep human-facing logo/docs aligned with the new TUI accessibility behavior. |

## Interfaces / Contracts

```ts
type TuiRoute = "home" | "configuration" | "status" | "model-profiles";
type HomeSelection = 0 | 1 | 2;

type NavigationState = {
  route: TuiRoute;
  routes: TuiRoute[];
  homeSelection: HomeSelection;
  sectionActionSelection?: number;
  modal?: { kind: "confirm" | "form" | "output"; actionId: string };
};

type BrandingLogo = {
  lines: string[];
  tagline: string;
  fallbackTitle: string;
  fallbackCopy: string;
  variants?: Partial<Record<string, string[]>>;
};

type TuiActionDefinition = {
  id: string;
  section: TuiRoute;
  kind: "read" | "mutate";
  label: string;
  cliEquivalent?: string;
  buildArgv(input?: Record<string, unknown>): string[];
  confirmLabel?: string;
  form?: "init-checkboxes" | "profile-picker" | "set-model" | "create-profile" | "delete-profile";
  refreshTarget?: "configuration" | "status" | "model-profiles";
};
```

Contract notes:
- `Up`/`Down` cycle Home selections only; `Enter` opens the selected route.
- `c`/`s`/`m`/`h` remain valid regardless of arrow support.
- If no safe variant exists for the terminal, Home renders `fallbackTitle` and `fallbackCopy` instead of broken art.
- Action execution uses argv arrays only; no shell interpolation or fabricated commands are allowed.
- Read-only actions render bounded output inline; mutating actions require confirmation and trigger adapter refresh on success.
- Esc/Cancel dismisses the active confirm/form/output surface and restores focus to the invoking section action.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | branding module contract | Vitest assertions for canonical lines, fallback fields, and no invented variants. |
| Unit | Home navigation behavior | Vitest shell tests for `up/down/enter`, visible selection markers, and shortcut regression coverage. |
| Unit | Action runner + definitions | Verify argv-only execution, read-only inline results, confirmation gates, cancellation, and stderr/exit handling. |
| Unit | Forms and focus recovery | Verify init checkboxes, model-profile pickers/forms, Esc/Cancel behavior, and return focus markers. |
| Unit | Screen accessibility copy | Focused screen/docs tests for help/footer text, output panel cues, and non-color-only status text. |
| Manual | Forced-TTY TUI smoke | Visit each section, run inline `doctor`, cancel one mutating action, confirm one safe mutation in a temp fixture, return Home, exit with `q`. |

## Chained PR Slicing Plan

8. **Branding extraction** — shared logo module, startup-banner reuse, TUI Home render hook, branding tests. (completed)
9. **Home arrow navigation** — selection state, `up/down/enter`, visible markers, shortcut regressions. (completed)
10. **Accessibility polish + docs/final verify** — footer/help copy, fallback wording, docs contracts, verify evidence. (completed)
11. **Shared action framework** — action definitions, argv runner, confirmation/output state, core tests. (~220-320 lines)
12. **Configuration + Status actions** — inline doctor, init/update confirmation/form flow, refresh, docs/tests. (~260-360 lines)
13. **Model Profiles interactive actions** — switch/set/create/delete forms, output/error handling, refresh, docs/tests. (~300-390 lines)

## Migration / Rollout

No data migration required. Roll out as stacked-to-main PR11 → PR12 → PR13 after the verified PR10 baseline so each slice stays reviewable and reversible.

## Open Questions

- None blocking. Future charset-specific variants remain deferred until a real variant source exists.
