---
name: detect-skills
description: "Trigger: detect and install project-specific skills using autoskills. Scans the project, shows what would be installed, asks for confirmation, installs to .agents/skills/, and updates the skill registry."
---

# Detect Skills

Scan the project for relevant AI skills using `autoskills`, install them, and register them so the orchestrator can inject them into pipeline subagents.

## When to Use This Skill

Use this skill when:
- Starting work on a project with no project-specific skills yet detected
- The orchestrator recommends it at session start
- The project's tech stack has changed and skills may be stale
- You want to bootstrap a new project's skill baseline quickly

## Prerequisites

`autoskills` is available via `npx`. No global installation required.

## Execution Steps

### Step 1 — Dry Run

Run the detection without installing anything:

```bash
npx autoskills --dry-run
```

Present the full output to the user. Include:
- Technologies detected
- Skills that would be installed (name, source, matched technology)

If no skills are detected, report that the project has no matching skills in the autoskills registry and stop. Do not proceed to installation.

### Step 2 — Confirmation

Ask the user explicitly:

```
autoskills detected N skills for this project.
Detected technologies: <list>

Skills to install:
- <skill-name> ← <technology>
- <skill-name> ← <technology>

Install these skills? [yes/no]
```

Do not proceed without explicit confirmation. If the user declines, stop and report what was found without installing.

### Step 3 — Install

Run installation:

```bash
npx autoskills -y
```

Skills are installed into `.agents/skills/` — Pi discovers this directory automatically. No Pi configuration needed for the skills themselves to be available.

### Step 4 — Register in Skill Registry

After installation, update `.atl/skill-registry.md` to include the newly installed skills so the orchestrator can inject them into pipeline subagents.

#### Read installed skills

Scan `.agents/skills/` for `SKILL.md` files. For each one, extract:
- Skill name (from frontmatter `name:` or directory name)
- Description (from frontmatter `description:` or first non-empty line after the heading)
- Path (absolute path to `SKILL.md`)

#### Update the registry

Open `.atl/skill-registry.md`. Find the section for project-scoped skills (or create it if missing). Add a row per installed skill:

```
| `<name>` | <description> | project | `/path/to/.agents/skills/<name>/SKILL.md` |
```

Do not duplicate entries. If a skill is already in the registry, skip it.

If `.atl/skill-registry.md` does not exist, create it using the standard registry format:

```markdown
# Skill Registry — <project name>

Last updated: <YYYY-MM-DD>

## Contract

**Delegator use only.** Match task context against triggers, pass exact SKILL.md paths to subagents.

## Project Skills (auto-detected)

| Skill | Trigger / description | Scope | Path |
| --- | --- | --- | --- |
```

### Step 5 — Report

Return a summary:

```
## Skills Installed

Technologies detected: <list>

Installed (<N> skills):
- <skill-name>: <description>
  Path: .agents/skills/<name>/SKILL.md

Skill registry updated: .atl/skill-registry.md

These skills are now available to Pi and will be injected into pipeline
subagents when their trigger matches the task context.
```

## Notes

- Skills from autoskills follow the universal agent skills format (SKILL.md) — compatible with Pi.
- `skills-lock.json` is created/updated by autoskills in the project root. Commit it to lock skill versions.
- To refresh skills after a stack change, run this skill again. Autoskills will detect the delta.
- To clear the autoskills cache: `npx autoskills --clear-cache`
