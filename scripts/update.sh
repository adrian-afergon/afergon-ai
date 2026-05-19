#!/usr/bin/env bash
# afergon-ai/scripts/update.sh
#
# Re-copy afergon-ai components to all detected tool installations.
# Run this after pulling updates from the afergon-ai repo.
#
# Usage:
#   afergon-ai update
#   bash /path/to/afergon-ai/scripts/update.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$(pwd)"

UPDATED=0
SKIPPED=0

echo ""
echo "afergon-ai update"
echo "=================="
echo "Package : $PACKAGE_ROOT"
echo "Project : $TARGET_DIR"
echo ""

# ── Pi ────────────────────────────────────────────────────────────────────────

APPEND_SYSTEM="$TARGET_DIR/.pi/APPEND_SYSTEM.md"
if [ -f "$APPEND_SYSTEM" ]; then
	awk '/^---/{found++; next} found==2{print}' "$PACKAGE_ROOT/prompts/afergon-ai.md" >"$APPEND_SYSTEM"
	echo "✔ Pi: updated .pi/APPEND_SYSTEM.md"
	UPDATED=$((UPDATED + 1))
else
	echo "  Pi: not installed in this project (skipped)"
	SKIPPED=$((SKIPPED + 1))
fi

# ── Claude Code ───────────────────────────────────────────────────────────────

CLAUDE_MD="$TARGET_DIR/CLAUDE.md"
if [ -f "$CLAUDE_MD" ]; then
	cp "$PACKAGE_ROOT/adapters/claude/CLAUDE.md" "$CLAUDE_MD"
	echo "✔ Claude: updated CLAUDE.md"
	UPDATED=$((UPDATED + 1))
else
	echo "  Claude: not installed in this project (skipped)"
	SKIPPED=$((SKIPPED + 1))
fi

CLAUDE_SKILLS="$TARGET_DIR/.claude/skills"
if [ -d "$CLAUDE_SKILLS" ]; then
	cp -r "$PACKAGE_ROOT/skills/"* "$CLAUDE_SKILLS/"
	echo "✔ Claude: updated .claude/skills/"
	UPDATED=$((UPDATED + 1))
fi

# ── OpenCode ──────────────────────────────────────────────────────────────────

OC_BASE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
OC_AGENTS_DIR="$OC_BASE_DIR/agents"
OC_COMMANDS_DIR="$OC_BASE_DIR/commands"
ADAPTER_PATH="$PACKAGE_ROOT/adapters/opencode"
OC_MARKER="$OC_AGENTS_DIR/orchestrator.md"

if [ -f "$OC_MARKER" ]; then
	# Overwrite all afergon-ai agents and commands silently
	for src in "$ADAPTER_PATH"/agents/*.md; do
		cp "$src" "$OC_AGENTS_DIR/$(basename "$src")"
	done
	echo "✔ OpenCode: updated $OC_BASE_DIR/agents/"

	for src in "$ADAPTER_PATH"/commands/*.md; do
		cp "$src" "$OC_COMMANDS_DIR/$(basename "$src")"
	done
	echo "✔ OpenCode: updated $OC_BASE_DIR/commands/"
	UPDATED=$((UPDATED + 1))
else
	echo "  OpenCode: not installed globally in $OC_BASE_DIR (skipped)"
	SKIPPED=$((SKIPPED + 1))
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "Done. Updated: $UPDATED component(s), skipped: $SKIPPED."
if [ "$SKIPPED" -gt 0 ]; then
	echo "Run 'afergon-ai init' to install skipped tools."
fi
