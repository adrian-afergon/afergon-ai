# Design: TUI Interactive Command Surface MVP

## Technical Approach

Preserve the verified MVP launcher and section scope, then extend only the TUI presentation layer with a shared branding source, Home arrow navigation, visible selection markers, and explicit accessibility hints. The extension stays review-safe by isolating branding extraction, Home focus behavior, and polish/docs into stacked PRs.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Branding source | Extract the canonical logo/tagline/fallback copy to `scripts/lib/branding/logo.mjs` and import it from `extensions/startup-banner.ts` and `scripts/tui.mjs` | Keep duplicated art in startup banner, README, and TUI | One runtime source of truth avoids drift and lets TUI reuse the project brand safely. |
| Charset handling | Ship default canonical artwork plus plain-text fallback now; keep the branding module ready for optional future variants | Invent new ASCII/Unicode variants immediately | Exploration found no separate variants today, so the design must not fabricate them. |
| Navigation scope | Add selection state only to Home for this extension | Full cross-screen focus model in one slice | Home-only arrows improve keyboard operability without pushing the change over the 400-line budget. |
| Visible focus | Use text markers and footer hints, not color-only cues | Color-only highlight or hidden keymap | Terminal accessibility must remain readable in monochrome or low-color environments. |

## Data Flow

```text
scripts/lib/branding/logo.mjs
   ├─> extensions/startup-banner.ts
   └─> scripts/tui.mjs -> renderHomeScreen()

scripts/lib/tui/navigation.mjs
   └─> home selection index + route state
         └─> scripts/tui.mjs input handler
               └─> screens + help/footer copy
```

## File Changes

| File | Action | Description |
|---|---|---|
| `scripts/lib/branding/logo.mjs` | Create | Canonical runtime logo lines, tagline, fallback title/copy, and future variant hook. |
| `extensions/startup-banner.ts` | Modify | Import the shared branding payload instead of owning the banner text inline. |
| `scripts/tui.mjs` | Modify | Render the shared logo/fallback on Home; add arrow/enter handling and visible selection text. |
| `scripts/lib/tui/navigation.mjs` | Modify | Extend route state with Home selection index and helpers for `up`, `down`, and `enter`. |
| `scripts/lib/tui/screens/*.mjs` | Modify | Normalize help/footer wording and preserve non-color-only cues across sections. |
| `tests/tui-shell.test.mjs` | Modify | Cover Home selection state, arrow movement, enter activation, and retained letter shortcuts. |
| `tests/tui-docs.test.mjs` | Modify | Lock docs/help expectations for logo, accessibility copy, and final verification notes. |
| `tests/tui-*.test.mjs` | Modify/Create | Add focused branding/accessibility regressions where screen output changes. |
| `README.md` | Modify | Keep human-facing logo/docs aligned with the new TUI accessibility behavior. |

## Interfaces / Contracts

```ts
type TuiRoute = "home" | "configuration" | "status" | "model-profiles";
type HomeSelection = 0 | 1 | 2;

type NavigationState = {
  route: TuiRoute;
  routes: TuiRoute[];
  homeSelection: HomeSelection;
};

type BrandingLogo = {
  lines: string[];
  tagline: string;
  fallbackTitle: string;
  fallbackCopy: string;
  variants?: Partial<Record<string, string[]>>;
};
```

Contract notes:
- `Up`/`Down` cycle Home selections only; `Enter` opens the selected route.
- `c`/`s`/`m`/`h` remain valid regardless of arrow support.
- If no safe variant exists for the terminal, Home renders `fallbackTitle` and `fallbackCopy` instead of broken art.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | branding module contract | Vitest assertions for canonical lines, fallback fields, and no invented variants. |
| Unit | Home navigation behavior | Vitest shell tests for `up/down/enter`, visible selection markers, and shortcut regression coverage. |
| Unit | Screen accessibility copy | Focused screen/docs tests for help/footer text and non-color-only status text. |
| Manual | Forced-TTY TUI smoke | Visit Home, move selection with arrows, open a section with `Enter`, return with `h`, exit with `q`. |

## Chained PR Slicing Plan

8. **Branding extraction** — shared logo module, startup-banner reuse, TUI Home render hook, branding tests. (~140-220 lines)
9. **Home arrow navigation** — selection state, `up/down/enter`, visible markers, shortcut regressions. (~180-280 lines)
10. **Accessibility polish + docs/final verify** — footer/help copy, fallback wording, docs contracts, verify evidence. (~120-200 lines)

## Migration / Rollout

No data migration required. Roll out as stacked-to-main PR8 → PR9 → PR10 so each slice stays reviewable and reversible.

## Open Questions

- None blocking. Future charset-specific variants remain deferred until a real variant source exists.
