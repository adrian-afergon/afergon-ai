#!/usr/bin/env bash
# afergon-ai/scripts/register-opencode-agents.sh
#
# Register afergon-ai agents in the global opencode.json config.
# Called by init-project.sh and update.sh after copying agent files.

set -euo pipefail

ADAPTER_PATH="${1:?Usage: register-opencode-agents.sh <adapter-path>}"
OC_BASE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
OC_CONFIG="$OC_BASE_DIR/opencode.json"
OC_AGENTS_DIR="$OC_BASE_DIR/agents"
REMOVE_LEGACY="${AFG_REMOVE_LEGACY:-0}"
NONINTERACTIVE="${AFG_OPENCODE_REGISTER_NONINTERACTIVE:-0}"

REQUIRED_AGENT_FILES=(
  "afergon-ai.md"
  "afg-debate.md"
  "afg-breakdown.md"
  "afg-specify.md"
  "afg-plannify.md"
  "afg-implement.md"
  "afg-review.md"
  "afg-design.md"
)

if [ ! -d "$ADAPTER_PATH/agents" ]; then
	echo "  register-opencode-agents: no agents directory at $ADAPTER_PATH/agents"
	exit 0
fi

mkdir -p "$OC_BASE_DIR"

missing_agent_files=()
for agent_file in "${REQUIRED_AGENT_FILES[@]}"; do
  if [ ! -f "$OC_AGENTS_DIR/$agent_file" ]; then
    missing_agent_files+=("$agent_file")
  fi
done

if [ "${#missing_agent_files[@]}" -gt 0 ]; then
  printf '  OpenCode: warning: missing managed agent file(s): %s\n' "${missing_agent_files[*]}"
  printf "  OpenCode: skipped opencode.json registration to avoid a partial write. Run 'afergon-ai update' or 'afergon-ai init --opencode' to repair.\n"
  exit 0
fi

python3 - "$OC_CONFIG" "$OC_AGENTS_DIR" "$REMOVE_LEGACY" "$NONINTERACTIVE" <<'PYEOF'
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

config_path = sys.argv[1]
oc_agents_dir = sys.argv[2]
remove_legacy = sys.argv[3] == "1"
noninteractive = sys.argv[4] == "1"

MANIFEST = {
    "afergon-ai": {
        "description": "afergon-ai — routes requests through Discovery/Plan/Implement/Review",
        "mode": "primary",
        "temperature": 0.2,
        "permission": {
            "bash": "allow",
            "edit": "allow",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": "allow",
        },
    },
    "afg-debate": {
        "description": "Socratic debate assistant — explores and refines ideas, produces a structured debate summary in openspec/debate/",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.7,
        "permission": {
            "bash": "deny",
            "edit": "deny",
            "glob": "deny",
            "grep": "deny",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "deny", "openspec/debate/debate-summary*.md": "allow"},
        },
    },
    "afg-breakdown": {
        "description": "Decomposes a debate summary into validated task artifacts with dependency graph and breadth analysis — writes to openspec/tasks/",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.2,
        "permission": {
            "bash": "allow",
            "edit": "deny",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "deny", "openspec/tasks/*.md": "allow"},
        },
    },
    "afg-specify": {
        "description": "Transforms a single task into Gherkin-first implementation specs with formal state tracking — writes to openspec/specs/<task-slug>/",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.2,
        "permission": {
            "bash": "allow",
            "edit": "deny",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "deny", "openspec/specs/**/*.md": "allow"},
        },
    },
    "afg-plannify": {
        "description": "Transforms a task + ready specs into an executable technical plan with execution strategy and verification criteria — writes to openspec/plans/<task-slug>/",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.2,
        "permission": {
            "bash": "allow",
            "edit": "deny",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "deny", "openspec/plans/**/*.md": "allow"},
        },
    },
    "afg-implement": {
        "description": "Executes a persisted plan from openspec/plans/ with strict TDD/TPP discipline — updates checkboxes, creates commits, writes RESULT.md",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.2,
        "permission": {
            "bash": "allow",
            "edit": "allow",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "allow"},
        },
    },
    "afg-review": {
        "description": "Adversarial post-implementation review — reads RESULT.md and diff, checks spec/plan compliance, TDD evidence, code quality, and diff size",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.2,
        "permission": {
            "bash": "allow",
            "edit": "deny",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "deny", "openspec/results/**/*.md": "allow"},
        },
    },
    "afg-design": {
        "description": "Plans and executes UI/UX design work in Google Stitch — plan → explicit approval → execution",
        "mode": "subagent",
        "hidden": True,
        "temperature": 0.3,
        "permission": {
            "bash": "deny",
            "edit": "deny",
            "glob": "allow",
            "grep": "allow",
            "read": "allow",
            "webfetch": "deny",
            "write": {"*": "deny"},
            "stitch_create_project": "allow",
            "stitch_get_project": "allow",
            "stitch_list_projects": "allow",
            "stitch_list_screens": "allow",
            "stitch_get_screen": "allow",
            "stitch_generate_screen_from_text": "allow",
            "stitch_edit_screens": "allow",
            "stitch_generate_variants": "allow",
            "stitch_create_design_system": "allow",
            "stitch_update_design_system": "allow",
            "stitch_list_design_systems": "allow",
        },
    },
}

LEGACY_NAMES = ["orchestrator", "debate", "breakdown", "specify", "plannify", "implement", "review", "design"]

def normalize_assignment(value):
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value:
        return None
    return "inherit" if value.lower() == "inherit" else value

def model_config_path() -> Path:
    explicit_dir = os.environ.get("AFERGON_AI_CONFIG_DIR")
    if explicit_dir:
        return Path(explicit_dir).expanduser() / "config.json"

    xdg = os.environ.get("XDG_CONFIG_HOME")
    home = os.environ.get("HOME", "")
    base_dir = Path(xdg).expanduser() if xdg else Path(home).expanduser() / ".config"
    return base_dir / "afergon-ai" / "config.json"

def load_active_model_profile():
    config_file = model_config_path()
    if not config_file.exists():
        return {}, True

    try:
        with open(config_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        print(f"  OpenCode: warning: could not read afergon-ai model config ({exc}); preserving existing managed model assignments.")
        return {}, False

    if not isinstance(data, dict):
        print("  OpenCode: warning: afergon-ai model config root is not an object; preserving existing managed model assignments.")
        return {}, False

    models = data.get("models")
    if not isinstance(models, dict):
        return {}, False

    active_profile = models.get("activeProfile")
    profiles = models.get("profiles")
    if not isinstance(active_profile, str) or not isinstance(profiles, dict):
        return {}, False

    profile = profiles.get(active_profile)
    if not isinstance(profile, dict):
        return {}, False
    return profile, True

ACTIVE_MODEL_PROFILE, MODEL_PROJECTION_ENABLED = load_active_model_profile()

def resolve_model(name: str):
    orchestrator = normalize_assignment(ACTIVE_MODEL_PROFILE.get("afergon-ai"))
    if name == "afergon-ai":
        return None if orchestrator in (None, "inherit") else orchestrator

    explicit = normalize_assignment(ACTIVE_MODEL_PROFILE.get(name))
    if explicit and explicit != "inherit":
        return explicit
    if orchestrator and orchestrator != "inherit":
        return orchestrator
    return None

def read_prompt_body(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.startswith("---\n"):
        return content.strip() + "\n"
    lines = content.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return content.strip() + "\n"
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return "".join(lines[i + 1 :]).lstrip("\n")
    return content.strip() + "\n"

def looks_managed(existing: dict, desired: dict, managed_path: str) -> bool:
    prompt = existing.get("prompt", "")
    return (
        prompt == desired["prompt"]
        or prompt == f"{{file:{managed_path}}}"
        or (
            existing.get("description") == desired.get("description")
            and existing.get("mode") == desired.get("mode")
        )
    )

def load_opencode_config(path: str) -> dict:
    if not os.path.exists(path):
        return {"$schema": "https://opencode.ai/config.json"}
    def backup_original(reason: str) -> str:
        backup_path = f"{path}.{reason}-{os.getpid()}"
        try:
            shutil.copy2(path, backup_path)
            return f" Backed up original to {backup_path}."
        except Exception as backup_exc:
            return f" Could not back up original ({backup_exc})."

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        backup_note = backup_original("corrupt")
        print(f"  OpenCode: warning: could not read opencode.json ({exc}); recreating managed config shell.{backup_note}")
        return {"$schema": "https://opencode.ai/config.json"}
    if not isinstance(data, dict):
        backup_note = backup_original("invalid-root")
        print(f"  OpenCode: warning: opencode.json root is not an object; recreating managed config shell.{backup_note}")
        return {"$schema": "https://opencode.ai/config.json"}
    return data

def atomic_write_json(path: str, data: dict) -> None:
    directory = os.path.dirname(path)
    fd, tmp_path = tempfile.mkstemp(prefix=".opencode.json.", suffix=".tmp", dir=directory, text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, path)
        try:
            dir_fd = os.open(directory, os.O_RDONLY)
            try:
                os.fsync(dir_fd)
            finally:
                os.close(dir_fd)
        except OSError:
            pass
    except Exception:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass
        raise

config = load_opencode_config(config_path)

agents = config.setdefault("agent", {})
if not isinstance(agents, dict):
    backup_path = f"{config_path}.invalid-agent-{os.getpid()}"
    try:
        shutil.copy2(config_path, backup_path)
        backup_note = f" Backed up original to {backup_path}."
    except Exception as backup_exc:
        backup_note = f" Could not back up original ({backup_exc})."
    print(f"  OpenCode: warning: opencode.json field 'agent' is not an object; recreating managed agent registry.{backup_note}")
    agents = {}
    config["agent"] = agents
registered = []
skipped = []

for name, meta in MANIFEST.items():
    managed_path = os.path.join(oc_agents_dir, f"{name}.md")
    desired = {
        "description": meta["description"],
        "mode": meta["mode"],
        "temperature": meta["temperature"],
        "permission": meta["permission"],
        "prompt": read_prompt_body(managed_path),
    }
    model = resolve_model(name)
    if model:
        desired["model"] = model
    if meta.get("hidden"):
        desired["hidden"] = True

    existing = agents.get(name)
    if existing is not None and not isinstance(existing, dict):
        backup_path = f"{config_path}.invalid-agent-entry-{os.getpid()}"
        try:
            shutil.copy2(config_path, backup_path)
            backup_note = f" Backed up original to {backup_path}."
        except Exception as backup_exc:
            backup_note = f" Could not back up original ({backup_exc})."
        print(f"  OpenCode: warning: agent '{name}' entry is not an object; replacing it with afergon-ai managed definition.{backup_note}")
        existing = None
    if not MODEL_PROJECTION_ENABLED and isinstance(existing, dict) and "model" in existing:
        desired["model"] = existing["model"]
    if existing and not looks_managed(existing, desired, managed_path):
        print(f"Conflict: agent '{name}' already exists in opencode.json and does not look managed by afergon-ai.")
        if noninteractive:
            skipped.append(name)
            continue
        answer = input(f"Overwrite '{name}' with afergon-ai's managed definition? [y/N] ").strip().lower()
        if answer not in {"y", "yes"}:
            skipped.append(name)
            continue

    if existing != desired:
        agents[name] = desired
        registered.append(name)

if remove_legacy:
    removed = []
    for legacy in LEGACY_NAMES:
        existing = agents.get(legacy)
        if not existing:
            continue
        prompt = existing.get("prompt", "")
        if prompt == f"{{file:{os.path.join(oc_agents_dir, legacy + '.md')}}}" or prompt == read_prompt_body(os.path.join(oc_agents_dir, legacy + ".md")) if os.path.exists(os.path.join(oc_agents_dir, legacy + ".md")) else False:
            del agents[legacy]
            removed.append(legacy)
    if removed:
        print(f"  OpenCode: removed {len(removed)} legacy opencode.json entry(ies): {', '.join(sorted(removed))}")

atomic_write_json(config_path, config)

if registered:
    print(f"  OpenCode: registered {len(registered)} agent(s) in opencode.json: {', '.join(registered)}")
else:
    print("  OpenCode: agents already registered in opencode.json (up to date)")

if skipped:
    print(f"  OpenCode: kept existing non-managed agent definition(s): {', '.join(skipped)}")
PYEOF
