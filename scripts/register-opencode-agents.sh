#!/usr/bin/env bash
# afergon-ai/scripts/register-opencode-agents.sh
#
# Register afergon-ai agents in the global opencode.json config.
# Called by init-project.sh and update.sh after copying agent files.
#
# Usage:
#   bash /path/to/register-opencode-agents.sh <adapter-path>
#
# Reads agent frontmatter from <adapter-path>/agents/*.md and writes
# corresponding entries to ~/.config/opencode/opencode.json.

set -euo pipefail

ADAPTER_PATH="${1:?Usage: register-opencode-agents.sh <adapter-path>}"
OC_BASE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
OC_CONFIG="$OC_BASE_DIR/opencode.json"

if [ ! -d "$ADAPTER_PATH/agents" ]; then
	echo "  register-opencode-agents: no agents directory at $ADAPTER_PATH/agents"
	exit 0
fi

mkdir -p "$OC_BASE_DIR"

# Create opencode.json if it doesn't exist
if [ ! -f "$OC_CONFIG" ]; then
	echo '{"$schema":"https://opencode.ai/config.json"}' > "$OC_CONFIG"
fi

# Use Python to safely merge JSON
python3 - "$ADAPTER_PATH" "$OC_CONFIG" << 'PYEOF'
import json, sys, os, re

adapter_path = sys.argv[1]
config_path = sys.argv[2]
agents_dir = os.path.join(adapter_path, "agents")

# Load existing config
with open(config_path) as f:
    config = json.load(f)

agents = config.setdefault("agent", {})

# Known afergon-ai agent names (derived from files in adapter)
afergon_files = sorted(f for f in os.listdir(agents_dir) if f.endswith(".md"))

def parse_frontmatter(filepath):
    """Extract frontmatter dict from a markdown file."""
    with open(filepath) as f:
        content = f.read()
    if not content.startswith("---"):
        return {}
    end = content.find("---", 3)
    if end == -1:
        return {}
    fm_text = content[3:end].strip()
    result = {}
    for line in fm_text.split("\n"):
        if ":" in line:
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            # Parse basic types
            if val.lower() == "true":
                result[key] = True
            elif val.lower() == "false":
                result[key] = False
            elif val.isdigit():
                result[key] = int(val)
            else:
                result[key] = val
    return result

def determine_tools(frontmatter):
    """Determine which tools to enable based on frontmatter permissions."""
    perm = frontmatter.get("permission", {})
    tools = {}

    # Map permission keys to tool names
    tool_map = {
        "bash": "bash",
        "edit": "edit",
        "glob": "glob",
        "grep": "grep",
        "read": "read",
        "webfetch": "webfetch",
        "write": "write",
    }

    for perm_key, tool_name in tool_map.items():
        if perm_key in perm:
            val = perm[perm_key]
            if isinstance(val, dict):
                # write: {"*": deny, "path": allow} -> enable the tool
                tools[tool_name] = True
            elif isinstance(val, bool):
                tools[tool_name] = val
            elif val == "allow":
                tools[tool_name] = True
            elif val == "deny":
                tools[tool_name] = False

    # Always enable read for agents that can read
    if "read" not in tools:
        tools["read"] = True

    # Subagents that implement always need edit/write
    mode = frontmatter.get("mode", "primary")
    if mode == "subagent":
        tools.setdefault("bash", True)
        tools.setdefault("edit", True)
        tools.setdefault("read", True)
        tools.setdefault("write", True)

    return tools

registered = []
for fname in afergon_files:
    filepath = os.path.join(agents_dir, fname)
    agent_name = fname[:-3]  # remove .md
    fm = parse_frontmatter(filepath)

    mode = fm.get("mode", "primary")
    hidden = fm.get("hidden", False)
    description = fm.get("description", f"afergon-ai {agent_name} agent")

    entry = {
        "description": description,
        "mode": mode,
        "prompt": "{file:" + filepath + "}",
        "tools": determine_tools(fm),
    }

    if hidden:
        entry["hidden"] = True

    # Only add/update if not already present with a different prompt source
    # (preserve user customizations if prompt doesn't point to our file)
    existing = agents.get(agent_name, {})
    existing_prompt = existing.get("prompt", "")
    if existing_prompt != entry["prompt"]:
        agents[agent_name] = entry
        registered.append(agent_name)

# Write back
with open(config_path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")

if registered:
    print(f"  OpenCode: registered {len(registered)} agent(s) in opencode.json: {', '.join(registered)}")
else:
    print("  OpenCode: agents already registered in opencode.json (up to date)")
PYEOF
