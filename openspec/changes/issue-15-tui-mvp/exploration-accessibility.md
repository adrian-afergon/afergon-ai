## Exploration: accessibility, arrow navigation, and logo reuse for issue-15-tui-mvp

### Current State
The runtime TUI lives in `scripts/tui.mjs` and is intentionally small: it renders a home screen, switches to three read-only routes (`configuration`, `status`, `model-profiles`), and currently reacts to single-letter shortcuts (`c`, `s`, `m`, `h`) plus exit keys (`q`, Esc, Ctrl-C). `scripts/lib/tui/navigation.mjs` only validates routes; there is no selection/focus model yet. The section renderers are plain text and already avoid color-only state labels by showing `[ok]`, `[warn]`, and `[fail]` in text.

The project logo is defined twice today: once in `extensions/startup-banner.ts` as the session banner artwork, and once in the README header. I did not find separate charset-variant logo definitions anywhere else in the repo. That means the TUI should not retype the art inline; it should reuse a shared branding source if the slice adds the logo to the TUI.

### Affected Areas
- `extensions/startup-banner.ts` — current runtime banner/logo definition.
- `README.md` — duplicated logo copy and human-facing branding source.
- `scripts/tui.mjs` — current input handling, home screen copy, and route switching.
- `scripts/lib/tui/navigation.mjs` — route validation and future selection/focus state.
- `scripts/lib/tui/screens/*.mjs` — screen text, help hints, and any visible focus/selection markers.
- `tests/tui-*.test.mjs` — current keyboard-route coverage; new arrow-key and accessibility assertions belong here.
- `openspec/changes/issue-15-tui-mvp/{spec.md,design.md,tasks.md,apply-progress.md,verify-report.md}` — this extension needs a new delta/spec slice and chained PR plan.
- `scripts/lib/branding/logo.mjs` (proposed) — shared logo source if the art is extracted once and imported by both the startup banner and TUI.

### Approaches
1. **Shared branding module + home-menu arrow navigation** — extract logo art into a shared module, import it into the startup banner and TUI, and add a home-screen selection index driven by `Key.up/down/enter`.
   - Pros: single source of truth for the brand art, smallest safe arrow-key slice, preserves current shortcuts, easy to test.
   - Cons: does not yet add arrow navigation inside section screens; requires one new shared module.
   - Effort: Medium

2. **Inline TUI banner + route-level arrow shortcuts only** — keep the logo local to the TUI and map arrows directly to route jumps without shared branding extraction.
   - Pros: fewer files touched in the first pass.
   - Cons: duplicates the logo, does not solve the reuse problem, and makes later branding changes brittle.
   - Effort: Low-Medium

3. **Full focus model across all screens** — add selection/focus state to Home and each section screen in one slice, with richer accessibility hints and screen-local navigation.
   - Pros: more complete accessibility story.
   - Cons: likely over the 400-line budget and too risky for the first chained PR.
   - Effort: High

### Recommendation
Use a shared branding module for the logo and a first accessibility slice that only adds arrow-key navigation to the Home route. Keep `c/s/m/h` as backward-compatible shortcuts, render a visible selection marker plus explicit help/exit hints, and leave section screens read-only for now. This is the smallest safe path that improves keyboard operability without inflating the PR.

Planned chained PR order under the 400-line budget:
1. **Branding extraction** — shared logo source consumed by startup banner and TUI.
2. **Home arrow navigation** — `up/down/enter` selection model with tests.
3. **Accessibility hardening** — stronger focus text, plain-language status/help footer, and any screen-reader-friendly fallback copy.
4. **Docs/spec/tasks sync** — update the delta spec, design, tasks, and verification notes for the new accessibility scope.

### Risks
- No separate charset-variant definitions were found, so the first slice may need a new canonical branding module before the TUI can reuse the logo cleanly.
- Arrow navigation can become ambiguous if later sections add interactive controls and the Home selection model is not clearly separated from section focus.
- The current screens are text-first and accessible enough for state labels, but future color styling must not replace the existing textual state indicators.

### Ready for Proposal
Yes — the extension is clear enough to spec now. The only open question is whether arrow navigation should stay Home-only for this chained slice or also reserve a pattern for future in-screen focusable actions.
