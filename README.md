# afergon-ai

```
 █████╗  ███████╗ ███████╗ ██████╗   ██████╗   ██████╗  ███╗   ██╗  ·   █████╗  ██╗
██╔══██╗ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔════╝  ██╔═══██╗ ████╗  ██║     ██╔══██╗ ██║
███████║ █████╗   █████╗   ██████╔╝ ██║  ███╗ ██║   ██║ ██╔██╗ ██║     ███████║ ██║
██╔══██║ ██╔══╝   ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║ ██║╚██╗██║     ██╔══██║ ██║
██║  ██║ ██║      ███████╗ ██║  ██║ ╚██████╔╝ ╚██████╔╝ ██║ ╚████║     ██║  ██║ ██║
╚═╝  ╚═╝ ╚═╝      ╚══════╝ ╚═╝  ╚═╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═══╝     ╚═╝  ╚═╝ ╚═╝
```

> afergon's development harness. From debate to working code: Gherkin-first specs, strict TDD/TPP, and a pipeline that asks before it assumes.
>
> ⚠️ **Status:** This project is currently under active development and is **not production-ready** yet.

## What is afergon-ai?

afergon-ai is a development harness that turns your coding agent into a **controlled delivery orchestrator**. It works with **Pi**, **Claude Code**, and **OpenCode**.

It provides:

- A **work routing ladder**: small tasks execute directly; complex work follows the full pipeline.
- A **canonical 4-phase workflow**: `Discovery → Plan → Implement → Review`, backed by the current subphases `debate → breakdown → specify → plannify → implement → review` (+ `design` for UI/UX with Stitch, + `detect-skills` for auto-discovery).
- **Gherkin-first specs**: behavior as the primary implementation contract.
- **Strict TDD/TPP**: RED → GREEN (lowest-complexity transformation) → TRIANGULATE (≥2 adversarial scenarios) → REFACTOR.
- **Epistemic discipline**: agents never invent missing product decisions.
- **`openspec/` artifact store**: all pipeline artifacts live in the project repo.
- **Memory system**: optional integration with Engram, Obsidian, or a plain `memory.md` file.

---

## Install

### Step 1 — Get the CLI

**From npm** (once published):

```bash
pnpm add -g afergon-ai
afergon-ai --help
```

The published package already includes the generated `dist/` runtime. Package creation runs the build lifecycle before `dist/` is packed, so global consumers do not need TypeScript or a post-install build step.

**From the repo (stable snapshot):**

```bash
git clone https://github.com/adrian-afergon/afergon-ai.git
cd afergon-ai
pnpm install
pnpm build
pnpm add -g .
```

`pnpm add -g .` installs a copy of the current state. Later local edits in your clone are **not** reflected automatically.

**From the repo (linked dev mode, recommended while developing):**

```bash
git clone https://github.com/adrian-afergon/afergon-ai.git
cd afergon-ai
pnpm install
pnpm build
pnpm link --global
```

`pnpm link --global` creates a global symlink to your local checkout. Build again with `pnpm build` after changing runtime files; the CLI intentionally runs the generated `dist/` runtime, not source `scripts/`.

### Development build step

When running from a source checkout or linked development mode, generate the runtime before the first CLI launch:

```bash
pnpm build
afergon-ai --help
```

In linked development mode, rerun the build after pulling changes or editing runtime files. If a source checkout launcher reports that afergon-ai has not been built, run `pnpm build` from that checkout and retry. `dist/` is generated, reproducible output and remains ignored by Git; the package lifecycle builds it before publishing. A failed build leaves the last successfully published `dist/` runtime intact, so fix the build error and rerun `pnpm build` rather than recovering generated files manually.

The TypeScript transition executes the built `dist/scripts/` runtime. The dispatcher, models, TUI, their library modules, and the build bootstrap are TypeScript sources; the runtime is emitted as JavaScript. The build command uses `tsx` to execute `scripts/build-typescript.ts`, while `pnpm typecheck` remains the separate static validation step. Pi extensions continue to load from the source `extensions/` package path because that extension loading boundary has not been cut over in this phase.

### Step 2 — Initialize a project

Run from the root of any project:

```bash
afergon-ai init
```

Select which tools to configure (Pi, Claude Code, OpenCode, or all) and which memory system to use. The command creates `openspec/config.yaml` and sets up each tool.

**Flags (skips interactive selection):**

```bash
afergon-ai init --pi
afergon-ai init --claude
afergon-ai init --opencode
afergon-ai init --all
```

### Step 3 — Update after pulling changes

```bash
afergon-ai update
```

Re-applies the latest files to all tools already installed in the project. Detects which tools are active automatically.

### Step 4 — Manage model profiles

```bash
afergon-ai models
afergon-ai models show budget
afergon-ai models list
afergon-ai models switch budget
afergon-ai models set afergon-ai openai/gpt-5.5
afergon-ai models set --allow-unknown afergon-ai local/custom-model
afergon-ai models set afg-review inherit
afergon-ai models profile create fallback
```

Model profiles are stored in afergon-ai-owned config at `${AFERGON_AI_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/afergon-ai}/config.json`.
Missing agent assignments inherit from `afergon-ai`. If `afergon-ai` is also unset or `inherit`, afergon-ai preserves the runtime default instead of forcing a model.

Use `afergon-ai models` or `afergon-ai models show` to inspect the active profile, and `afergon-ai models show <name>` or `afergon-ai models profile show <name>` to inspect any saved profile without switching the active one.

Concrete model strings should use `provider/model` format, for example `openai/gpt-5.5`; `inherit` remains accepted for inheritance. When `opencode` is available, `models set` validates concrete `provider/model` IDs against `opencode models <provider>`. Unknown listed models and malformed concrete strings are rejected by default. If `opencode` is unavailable or provider listing fails, afergon-ai keeps the change and warns that availability could not be verified. Use `--allow-unknown` to explicitly save an unlisted or custom concrete model anyway.

When OpenCode is already installed through afergon-ai, `models switch` and `models set` refresh the managed OpenCode agent registrations on disk. Existing sessions may still need a new compatible run; live hot-swap is not guaranteed.

### Step 5 — Choose the launch mode

`afergon-ai` now routes through a shared dispatcher so interactive and scripted use stay separate:

```bash
afergon-ai          # opens the TUI when run in an interactive terminal
afergon-ai tui      # explicitly opens the TUI
afergon-ai --help   # always prints help
afergon-ai doctor   # stays non-interactive and scriptable
```

Dispatcher rules:

- Interactive TTY + no args: open the TUI.
- Interactive TTY + `tui`: open the TUI.
- Non-TTY/CI + no args: print help and exit 0.
- Non-TTY/CI + `tui`: fail fast with guidance instead of hanging.
- Explicit commands like `init`, `doctor`, `update`, and `models` always bypass the TUI.

Windows launchers use the same dispatcher boundary and forward the full argument list, so quoted arguments are preserved instead of being truncated to fixed `%2 ... %5` slots.

The MVP TUI currently exposes these sections:

- **Configuration** — current install/config state plus stable CLI actions for `init`, `doctor`, `update`, and `models`
- **Status** — readiness summary and actionable repair guidance using the same stable CLI actions
- **Model Profiles** — active profile, saved profiles, resolved assignments, and the stable `afergon-ai models` surface

CLI-equivalent visibility rules:

- Show a CLI equivalent only when afergon-ai already has a stable explicit command.
- Do not invent CLI equivalents for unsupported or read-only TUI actions.

Accessibility and keyboard notes:

- Use ↑/↓ to move the Home selection, Enter to open it, and `c`/`s`/`m`/`h` as direct shortcuts.
- Inside Configuration and Status, use ↑/↓ to move the action list, Enter to run the selected action, and `Esc` to cancel confirmations, forms, or output panels.
- Focused rows use a fixed-width `>` cursor plus teal emphasis when the terminal supports color; unfocused rows reserve the same cursor column so labels stay aligned.
- Action lists keep labels quiet: command metadata stays out of the picker rows and only appears in confirmations or output panels.
- In Model Profiles browse mode, ↑/↓ move only the profile list, Enter switches the focused existing profile inline with no success output panel, Delete or `D` opens a floating submit/cancel delete alert over the Models frame, `U` edits the focused profile, and `N` or `* New Profile` starts inline create-name entry in the profile list with Enter to create or Cancel to abort.
- Clean successful Enter-driven profile switches stay in the profile list without opening an output panel, while failures and degraded refresh guidance still surface bounded output.
- In Model Profiles assignment mode, ↑/↓ move agents, Enter opens manual `provider/model` entry for the focused agent, `S` saves staged edits to the target profile, and `Esc` cancels without saving.
- A filterable provider-model registry/list is tracked separately in GitHub issue #29; this slice keeps manual entry as the current assignment path.
- Model-profile mutations refresh the active profile, saved profile list, and resolved assignments immediately after the action succeeds.
- `doctor` runs inline inside the TUI and shows bounded stdout/stderr output instead of leaving the screen.
- `init` opens checkbox choices for Pi, Claude Code, OpenCode, or all before showing a confirmation with the exact argv that will run.
- `update` always asks for confirmation before it executes.
- Home and section screens include explicit text help for returning Home and exiting with `q` or `Esc`.
- If the full AFERGON-AI banner is unsafe to render, the TUI falls back to plain-text branding instead of broken artwork.
- Status and failure cues use text markers such as `[ok]`, `[warn]`, and `[fail]`, not color alone.

PR2 shell rollback boundary: revert `scripts/tui.ts` and `scripts/lib/tui/navigation.ts` together if the minimal TUI shell regresses before later slices land.

Chained rollback notes:

- PR1 launcher/dispatcher: revert `bin/afergon-ai`, `bin/afergon-ai.cmd`, and `scripts/cli-dispatch.ts` together.
- PR3 CLI-equivalent manifest: revert `scripts/lib/tui/command-manifest.ts` with its tests if command labels drift.
- PR4/PR5/PR6 screens: revert the matching adapter + screen + focused tests together (`configuration`, `status`, or `model-profiles`).
- PR7 docs/polish: revert `README.md`, `prompts/afergon-ai.md`, `tests/tui-docs.test.ts`, and `openspec/changes/issue-15-tui-mvp/*` together if documentation or verification evidence needs to roll back without touching runtime code.

PR2 manual keyboard smoke checks:

```bash
printf 'q' | AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai
printf '\033' | AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui
```

Final verification checklist:

```bash
pnpm test  # expected: all docs + TUI contract tests pass
./bin/afergon-ai --help  # expected: prints dispatcher help and exits 0
./bin/afergon-ai  # expected: prints help and exits 0 in non-TTY mode
./bin/afergon-ai tui  # expected: exits 1 in non-TTY mode after printing guidance
./bin/afergon-ai doctor --opencode  # expected: explicit command bypass runs; local environment warnings may still surface
./bin/afergon-ai models show "budget profile"  # expected: quoted arg stays intact as one profile name
AFERGON_AI_FORCE_TTY=1 ./bin/afergon-ai tui  # expected: forced-TTY smoke can visit Configuration, Status, and Model Profiles, then exit with q
```

Use the forced-TTY smoke run to confirm you can enter **Configuration**, **Status**, and **Model Profiles**, return with `h`, and exit with `q`.

### Local install troubleshooting (`pnpm add -g .` vs `pnpm link --global`)

If global install appears "disconnected" from your machine after `pnpm add -g .`, this is expected: pnpm installed a global package copy instead of linking your local checkout.

Use this recovery flow:

```bash
# from afergon-ai repo
pnpm remove -g afergon-ai
pnpm link --global
which afergon-ai
afergon-ai doctor
```

`which afergon-ai` should point to your global bin and resolve to the linked local checkout.
`afergon-ai doctor` validates that the launcher resolves to the package root and that required scripts are present.

If you see an error like:

```bash
bash: /Users/<you>/.nvm/versions/node/<ver>/scripts/init-project.sh: No such file or directory
```

it means the global shim was resolving paths from the global bin directory instead of the package root. Update to the latest version and relink (`pnpm link --global`) so the fixed launcher is used.

If OpenCode starts but your agents do not appear, verify:

```bash
afergon-ai doctor --opencode
opencode agent list | rg "afergon-ai|afg-debate|afg-implement"
```

If that list is empty, ensure files exist in:

```bash
${XDG_CONFIG_HOME:-$HOME/.config}/opencode/agents
${XDG_CONFIG_HOME:-$HOME/.config}/opencode/commands
```

---

## Per-tool setup

### Pi

`init --pi` writes `.pi/APPEND_SYSTEM.md`, which Pi reads automatically on startup from that directory. Skills are globally available once the package is installed via `pi install`.

```bash
pi install /path/to/afergon-ai
# or:
pi install npm:afergon-ai
```

### Claude Code

`init --claude` writes `CLAUDE.md` to the project root and copies skills to `.claude/skills/`. Claude Code reads both automatically.

### OpenCode

`init --opencode` copies agents and commands to `${XDG_CONFIG_HOME:-~/.config}/opencode/agents/` and `${XDG_CONFIG_HOME:-~/.config}/opencode/commands/`. These merge with your existing global OpenCode config, and install/update asks before overwriting conflicting files.

Agents are also registered in the global `opencode.json` so they appear in the agent selector. The main `afergon-ai` agent is visible (`mode: primary`), while pipeline subagents (`afg-debate`, `afg-breakdown`, `afg-specify`, `afg-plannify`, `afg-implement`, `afg-review`, `afg-design`) are hidden from the user interface and use the `afg-` prefix to avoid name collisions with other installed agents.

If you manage models with `afergon-ai models`, the active profile is projected into those managed OpenCode agent entries. This updates the generated host config, not necessarily a session that is already running.

OpenCode command surface:

```text
/afg-debate
/afg-breakdown
/afg-specify
/afg-plannify
/afg-implement
/afg-review
/afg-design
```

---

## Pipeline

```
Discovery: debate → breakdown
Plan:      specify → plannify
Implement: implement
Review:    review → judgment-day (only when escalation is required)
            ↓
        design  (parallel, UI/UX only)
```

### Macro-phase contract

| Macro-phase | Required subphases | Notes |
| ----------- | ------------------ | ----- |
| `Discovery` | `debate`, `breakdown` | Defines scope, tasks, and open decisions |
| `Plan` | `specify`, `plannify` | Produces Gherkin specs and an implementation-ready plan |
| `Implement` | `implement` | Executes the approved slice with strict TDD/TPP expectations |
| `Review` | `review`, optional `judgment-day` | Runs standard review first and escalates only when risk triggers it |

The normal flow is `Discovery -> Plan -> Implement -> Review`. Allowed re-entry paths are `Plan -> Discovery`, `Implement -> Plan`, and `Review -> Implement`. Any other jump is an exceptional skip and requires explicit user confirmation.

### Autonomy and gates

- Supported autonomy modes: `interactive`, `semiautonomous`, `autonomous`
- Default mode: `semiautonomous`
- Precedence: `session > active_change > default`
- Required confirmations ignore autonomy mode
- `Plan -> Implement` is a mandatory gate: implementation starts only after `plannify` produced an accepted plan or the user explicitly approved the transition

### Review escalation path

`Review` always starts with the standard `review` step. It escalates to `judgment-day` when strong risk triggers exist, when multiple moderate triggers combine, or when review confidence is uncertain.

The canonical review executor name is `review`.

### Chained delivery guidance

When a workflow change is likely to exceed roughly 400 changed lines, split it into chained PR-sized work units with a clear start state, finish state, verification step, and rollback boundary. Keep prompt/docs changes with the user-visible workflow change they describe.

### Stages

| Stage            | What it does                                        | Artifact                                     |
| ---------------- | --------------------------------------------------- | -------------------------------------------- |
| `debate`         | Socratic session to explore and define requirements | `openspec/debate/debate-summary-<topic>.md`  |
| `breakdown`      | Decompose debate summary into validated tasks       | `openspec/tasks/`                            |
| `specify`        | Transform a task into Gherkin implementation specs  | `openspec/specs/<task-slug>/`                |
| `plannify`       | Build an executable technical plan                  | `openspec/plans/<task-slug>/PLAN.md`         |
| `implement`      | Execute the plan with strict TDD/TPP                | project source files + commits               |
| `design`         | UI/UX design in Google Stitch                       | Stitch (external)                            |
| `review`         | Standard review with optional `judgment-day` escalation | `openspec/results/<task-slug>/RESULT.md` |
| `detect-skills`  | Auto-detect and install project skills              | `.agents/skills/` + `.atl/skill-registry.md` |

### Work routing

```
small + clear + single-file   → inline (no pipeline)
moderate / multi-file         → single stage
ambiguous / risky / large     → full workflow from Discovery
```

---

## Skills

Skills are available in all supported tools. In Pi, invoke with `/skill:<name>`. In Claude Code, load the skill file. In OpenCode, use the corresponding `/afg-*` command.

```text
Pi skill: /skill:debate        OpenCode: /afg-debate
Pi skill: /skill:breakdown     OpenCode: /afg-breakdown
Pi skill: /skill:specify       OpenCode: /afg-specify
Pi skill: /skill:plannify      OpenCode: /afg-plannify
Pi skill: /skill:implement     OpenCode: /afg-implement
Pi skill: /skill:design        OpenCode: /afg-design
Pi skill: /skill:review        OpenCode: /afg-review
Pi skill: /skill:detect-skills
```

Skills follow the [Agent Skills](https://agentskills.io) standard and are compatible with Pi, Claude Code, Cursor, and OpenCode.

---

## Skill Discovery

afergon-ai can auto-detect and install skills matched to your project's tech stack using [autoskills](https://www.npmjs.com/package/autoskills).

### How it works

1. `autoskills` scans the project (package.json, file extensions, frameworks detected)
2. Matches technologies to a curated skill registry (React, TypeScript, Go, Bash, etc.)
3. Installs matching skills to `.agents/skills/` — a path Pi, Claude Code, and OpenCode all discover automatically
4. Updates `.atl/skill-registry.md` so the orchestrator can inject them into pipeline subagents

### When to use it

- Starting a new project with afergon-ai for the first time
- After a significant tech stack change
- When the orchestrator recommends it at session start (shown once if no project skills are found)

### Running it

In any supported tool:

```
/skill:detect-skills
```

The skill will show a dry-run preview first and ask for confirmation before installing anything.

### Manual alternative

```bash
npx autoskills --dry-run   # preview without installing
npx autoskills             # interactive install
npx autoskills -y          # skip confirmation
```

Skills installed by `autoskills` follow the [Agent Skills](https://agentskills.io) standard and are immediately available in Pi, Claude Code, Cursor, and OpenCode once installed.

---

## Memory

Configure the memory system during `init` or manually in `openspec/config.yaml`:

```yaml
memory:
  system: engram | obsidian | memory-md | none
```

| System      | Behavior                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engram`    | Pi-native persistent memory. Requires Engram installed; in Claude Code requires Engram MCP. Searches context at session start, saves after each pipeline stage. |
| `obsidian`  | Appends structured entries to a configured vault folder.                                                                                                        |
| `memory-md` | Appends to `openspec/MEMORY.md`. Simple and tool-agnostic.                                                                                                      |
| `none`      | No memory operations.                                                                                                                                           |

---

## Project config

`openspec/config.yaml` is the single source of truth for project-level afergon-ai settings:

```yaml
project:
  name: my-project

memory:
  system: engram
```

---

## Philosophy

- The AI is a tool directed by the human, never the decision-maker.
- Never invent product decisions. Surface missing ones.
- Gherkin scenarios are the behavioral contract, not documentation.
- TDD is evidence: RED → GREEN → TRIANGULATE → REFACTOR, with proof at every step.
- Implementation is only complete when tests pass and the build succeeds.
- Review protects the human reviewer: never produce oversized diffs without warning.
