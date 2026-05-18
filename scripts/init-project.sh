#!/usr/bin/env bash
# afergon-ai/scripts/init-project.sh
#
# Run from the root of any project to opt-in to afergon-ai as the active orchestrator.
# Creates .pi/APPEND_SYSTEM.md with the orchestrator content.
#
# Usage:
#   bash /path/to/afergon-ai/scripts/init-project.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$(pwd)"
PI_DIR="$TARGET_DIR/.pi"
APPEND_SYSTEM="$PI_DIR/APPEND_SYSTEM.md"

echo "afergon-ai: initializing orchestrator in $TARGET_DIR"

# Create .pi/ if it doesn't exist
mkdir -p "$PI_DIR"

# Check for conflict
if [ -f "$APPEND_SYSTEM" ]; then
	echo "Warning: $APPEND_SYSTEM already exists."
	read -r -p "Overwrite? [y/N] " confirm
	if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
		echo "Aborted."
		exit 0
	fi
fi

# Copy orchestrator content (strip frontmatter from prompt template)
awk '/^---/{found++; next} found==2{print}' "$PACKAGE_ROOT/prompts/afergon-ai.md" >"$APPEND_SYSTEM"

echo "Created $APPEND_SYSTEM"
echo ""
echo "afergon-ai orchestrator is now active for this project."
echo "Open Pi from $TARGET_DIR to use it."
echo ""
echo "Available skills (global, any project):"
echo "  /skill:debate, /skill:breakdown, /skill:specify"
echo "  /skill:plannify, /skill:implement, /skill:design, /skill:afergon-review"
