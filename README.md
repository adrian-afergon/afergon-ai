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
```

**From the repo (stable snapshot):**

```bash
git clone https://github.com/adrian-afergon/afergon-ai.git
cd afergon-ai
pnpm add -g .
```

`pnpm add -g .` installs a copy of the current state. Later local edits in your clone are **not** reflected automatically.

**From the repo (linked dev mode, recommended while developing):**

```bash
git clone https://github.com/adrian-afergon/afergon-ai.git
cd afergon-ai
pnpm link --global
```

`pnpm link --global` creates a global symlink to your local checkout, so changes are picked up immediately.

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
opencode agent list | rg "orchestrator|debate|implement"
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

`init --opencode` copies agents and commands to `${XDG_CONFIG_HOME:-~/.config}/opencode/agents/` and `${XDG_CONFIG_HOME:-~/.config}/opencode/commands/`. These merge with your existing global OpenCode config — nothing is overwritten without confirmation.

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

Skills are available in all supported tools. In Pi, invoke with `/skill:<name>`. In Claude Code and OpenCode, load the skill file or use the corresponding command.

```
/skill:debate          Socratic debate session
/skill:breakdown       Decompose a debate summary into tasks
/skill:specify         Gherkin-first specs from a task
/skill:plannify        Technical execution plan
/skill:implement       TDD/TPP strict implementation
/skill:design          UI/UX design in Google Stitch
/skill:review          Standard review with optional escalation
/skill:detect-skills   Auto-detect skills for your tech stack
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
