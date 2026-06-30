## Exploration: TUI MVP foundation for issue #15

### Current State
afergon-ai is a Bash-first CLI wrapper (`bin/afergon-ai`, `bin/afergon-ai.cmd`) that dispatches `init`, `doctor`, `update`, and `models`. The only rich runtime command today is `scripts/models.mjs`, which already owns model-profile CRUD, active-profile switching, and status-style output for config/profile resolution. The closest install/status surface is `scripts/verify-install.sh`. There is no TUI entrypoint yet, but `@earendil-works/pi-tui` is already a peer dependency and is used in `extensions/startup-banner.ts`, so the repo already has a UI-adjacent dependency foothold.

### Affected Areas
- `bin/afergon-ai` / `bin/afergon-ai.cmd` — entrypoint routing for `tui` and any no-args alias decision.
- `scripts/models.mjs` and `scripts/lib/model-profiles.mjs` — best source of truth for active profile, config status, and profile commands.
- `scripts/verify-install.sh` — current install/status checks the TUI can surface in a friendly view.
- `package.json` — dependency/entrypoint shape for any TUI runtime module.
- `README.md` and `prompts/afergon-ai.md` — user-facing command surface and product contract need to stay aligned.
- `extensions/startup-banner.ts` — proves `pi-tui` is already in use and lowers dependency risk.

### Approaches
1. **Dedicated `tui` subcommand on top of `@earendil-works/pi-tui`** — add a small Node ESM TUI runner and reuse shared config/status/model helpers.
   - Pros: aligns with existing Pi-native stack, reuses the already-declared peer dependency, keeps CLI scriptable, and is easiest to grow into future screens.
   - Cons: still needs launcher plumbing and a small amount of new adapter code; library behavior is less familiar than plain stdio.
   - Effort: Medium

2. **Custom ANSI/stdio menu with no new UI framework** — build a minimal interactive shell around existing scripts and config helpers.
   - Pros: zero UI dependency risk, very explicit control over terminal behavior, simplest shell-launcher story.
   - Cons: becomes bespoke quickly, harder to scale to plugins/metrics/memory screens, and testability is weaker unless extra abstraction is added.
   - Effort: Medium-High

### Recommendation
Use a dedicated `afergon-ai tui` entrypoint backed by `@earendil-works/pi-tui`, but keep the actual screen logic thin: a view/router shell, a command-manifest for CLI equivalents, and pure data helpers for config/status/model/profile state. For MVP, ship only **Configuration** and **Status** screens plus a route skeleton for future sections. Preserve current non-interactive behavior by leaving existing argv commands unchanged and avoiding any hidden side effects in the launcher.

### Risks
- The repo’s current launcher is asymmetric: Bash exposes more commands than `afergon-ai.cmd`, so cross-platform TUI parity needs a decision.
- `afergon-ai` with no args currently prints help; changing that to auto-launch TUI would be a script-breaking behavior change.
- Status is not yet a first-class JS API; if the TUI shells out to scripts too much, testability and latency will suffer.
- Future screens (memory/plugins/metrics/skills/model profiles) need a stable navigation model now or the MVP will be hard to extend cleanly.

### Ready for Proposal
Yes — the repo has a clear attachment point and a safe MVP shape. The orchestrator should ask the user to decide: (1) whether no-args should launch TUI or stay as help, and (2) whether Windows `.cmd` parity is required in the first slice.
