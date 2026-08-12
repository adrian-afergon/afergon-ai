#!/usr/bin/env bash
# afergon-ai/scripts/update.sh
#
# Re-copy afergon-ai managed OpenCode components.
# Run this after pulling updates from the afergon-ai repo.
#
# Usage:
#   afergon-ai update
#   bash /path/to/afergon-ai/scripts/update.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$(pwd)"

copy_with_prompt() {
	local src="$1"
	local dest="$2"
	local label="$3"
	if [ -f "$dest" ]; then
		if cmp -s "$src" "$dest"; then
			return 0
		fi
		read -r -p "Conflict: $label exists and differs. Overwrite? [y/N] " c
		[[ "$c" != "y" && "$c" != "Y" ]] && return 1
	fi
	cp "$src" "$dest"
	return 0
}

migrate_legacy_file() {
	local old_path="$1"
	local new_path="$2"
	local label="$3"
	[ -f "$old_path" ] || return 0
	if [ -f "$new_path" ] && ! cmp -s "$old_path" "$new_path"; then
		read -r -p "Conflict: migrating $label would overwrite $(basename "$new_path"). Replace it? [y/N] " c
		[[ "$c" != "y" && "$c" != "Y" ]] && return 1
		rm -f "$new_path"
	fi
	mv "$old_path" "$new_path"
	echo "  OpenCode: migrated $(basename "$old_path") → $(basename "$new_path")"
	return 0
}

UPDATED=0
SKIPPED=0

echo ""
echo "afergon-ai update"
echo "=================="
echo "Package : $PACKAGE_ROOT"
echo "Project : $TARGET_DIR"
echo ""

# ── OpenCode ──────────────────────────────────────────────────────────────────

OC_BASE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
OC_AGENTS_DIR="$OC_BASE_DIR/agents"
OC_COMMANDS_DIR="$OC_BASE_DIR/commands"
ADAPTER_PATH="$PACKAGE_ROOT/adapters/opencode"
OC_MARKER="$OC_AGENTS_DIR/afergon-ai.md"
OC_LEGACY_MARKER="$OC_AGENTS_DIR/orchestrator.md"

if [ -f "$OC_MARKER" ] || [ -f "$OC_LEGACY_MARKER" ]; then
	REMOVE_LEGACY=0
	legacy_found=()
	for old_name in orchestrator debate breakdown specify plannify implement review design; do
		[ -f "$OC_AGENTS_DIR/${old_name}.md" ] && legacy_found+=("agents/${old_name}.md")
		[ -f "$OC_COMMANDS_DIR/${old_name}.md" ] && legacy_found+=("commands/${old_name}.md")
	done
	if [ ${#legacy_found[@]} -gt 0 ]; then
		echo "Detected possible legacy OpenCode files with old afergon-ai names:"
		for item in "${legacy_found[@]}"; do
			echo "  - $item"
		done
		read -r -p "Migrate these legacy names to afergon-ai/afg-* and remove matching legacy opencode.json entries? [y/N] " migrate_legacy
		if [[ "$migrate_legacy" == "y" || "$migrate_legacy" == "Y" ]]; then
			REMOVE_LEGACY=1
			migrate_legacy_file "$OC_AGENTS_DIR/orchestrator.md" "$OC_AGENTS_DIR/afergon-ai.md" "agent orchestrator.md" || true
			for old_name in debate breakdown specify plannify implement review design; do
				migrate_legacy_file "$OC_AGENTS_DIR/${old_name}.md" "$OC_AGENTS_DIR/afg-${old_name}.md" "agent ${old_name}.md" || true
				migrate_legacy_file "$OC_COMMANDS_DIR/${old_name}.md" "$OC_COMMANDS_DIR/afg-${old_name}.md" "command ${old_name}.md" || true
			done
		else
			echo "  OpenCode: leaving legacy generic names untouched."
		fi
	fi

	# Update afergon-ai-owned agents and commands with confirmation on conflicts
	for src in "$ADAPTER_PATH"/agents/*.md; do
		copy_with_prompt "$src" "$OC_AGENTS_DIR/$(basename "$src")" "agent $(basename "$src")" || true
	done
	echo "✔ OpenCode: updated $OC_BASE_DIR/agents/"

	for src in "$ADAPTER_PATH"/commands/*.md; do
		copy_with_prompt "$src" "$OC_COMMANDS_DIR/$(basename "$src")" "command $(basename "$src")" || true
	done
	echo "✔ OpenCode: updated $OC_BASE_DIR/commands/"

	# Register/update agents in global opencode.json
	AFG_REMOVE_LEGACY="$REMOVE_LEGACY" bash "$PACKAGE_ROOT/scripts/register-opencode-agents.sh" "$ADAPTER_PATH"

	UPDATED=$((UPDATED + 1))
else
	echo "  OpenCode: not installed globally in $OC_BASE_DIR (skipped)"
	SKIPPED=$((SKIPPED + 1))
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "Done. Updated: $UPDATED component(s), skipped: $SKIPPED."
if [ "$SKIPPED" -gt 0 ]; then
	echo "Run 'afergon-ai init' to install skipped OpenCode files."
fi
