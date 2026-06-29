# Proposal: TUI Interactive Command Surface MVP

## Intent

Create a gradual TUI MVP for discoverable guided workflows while explicit CLI commands remain scriptable. Intentional behavior change: no-args `afergon-ai` opens the TUI instead of printing help; help remains explicit via flags/docs.

## Scope

### In Scope
- Launch paths: `afergon-ai tui` and no-args `afergon-ai`.
- Windows `.cmd` launch parity in the first PR.
- Functional MVP screens: Configuration, Status, and Model profiles.
- CLI-equivalent command visibility where practical.
- Skeletal future navigation only when needed.
- Forced chained PR slices under 400 changed lines.

### Out of Scope
- Replacing all CLI commands or making TUI mandatory.
- Complex dashboards, remote telemetry, or full memory/metrics/plugins/skills.
- Product behavior not explicitly decided here.

## Capabilities

### New Capabilities
- `tui-command-surface`: launch behavior, navigation, MVP screens, CLI-command visibility, and cross-platform parity.

### Modified Capabilities
- None; existing specs do not cover CLI launcher behavior.

## Approach

Build a small Node ESM TUI runner using existing `@earendil-works/pi-tui`. Reuse model/config/status helpers. Route Bash and `.cmd` launchers to TUI for `tui` and no-args; preserve explicit `init`, `doctor`, `update`, and `models`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bin/afergon-ai` | Modified | Add `tui`; no-args launches TUI. |
| `bin/afergon-ai.cmd` | Modified | Add Windows TUI parity. |
| `scripts/` | New/Modified | TUI runner and status/config/model adapters. |
| `scripts/models.mjs`, `scripts/lib/model-profiles.mjs` | Modified | Reuse/export model-profile state if needed. |
| `README.md`, `prompts/afergon-ai.md` | Modified | Document no-args behavior and CLI equivalents. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No-args changes help expectations | Med | Document/spec explicitly; keep `--help`. |
| Scope exceeds 400 changed lines | High | Force chained PRs by work unit with tests/docs in each slice. |
| TUI duplicates CLI logic | Med | Reuse helpers; show command equivalents. |
| Windows launcher parity lags Bash | Med | Include `.cmd` in first PR acceptance scope. |

## Open Decisions

- Visual layout/navigation labels are deferred.
- Future placeholders disabled vs hidden is undecided.

## Rollback Plan

Revert launcher routing, TUI runner/adapters, and docs/spec deltas. Restoring no-args help returns prior behavior without affecting explicit commands.

## Dependencies

- Existing `@earendil-works/pi-tui` peer dependency.
- Existing model-profile/config helpers and status scripts.

## Success Criteria

- [ ] `afergon-ai` and `afergon-ai tui` launch TUI.
- [ ] Windows `.cmd` supports equivalent TUI launch behavior.
- [ ] Configuration, Status, and Model profiles screens are functional.
- [ ] Existing explicit CLI commands continue to work.
- [ ] TUI actions show CLI equivalents.
- [ ] Chained PR plan keeps slices under 400 changed lines or flags risk.
