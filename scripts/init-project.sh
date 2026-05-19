#!/usr/bin/env bash
# afergon-ai/scripts/init-project.sh
#
# Initialize afergon-ai in any project.
# Prefer using the CLI: afergon-ai init [--pi] [--claude] [--opencode] [--all]
#
# Flags (combinable):
#   --pi        Configure Pi (writes .pi/APPEND_SYSTEM.md)
#   --claude    Configure Claude Code (writes CLAUDE.md)
#   --opencode  Configure OpenCode (sets OPENCODE_CONFIG_DIR hint)
#   --all       Configure all three tools
#   (no flags)  Interactive tool selection

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$(pwd)"
PROJECT_NAME="$(basename "$TARGET_DIR")"

SETUP_PI=false
SETUP_CLAUDE=false
SETUP_OPENCODE=false

# ── Parse flags ───────────────────────────────────────────────────────────────

for arg in "$@"; do
	case $arg in
	--pi) SETUP_PI=true ;;
	--claude) SETUP_CLAUDE=true ;;
	--opencode) SETUP_OPENCODE=true ;;
	--all)
		SETUP_PI=true
		SETUP_CLAUDE=true
		SETUP_OPENCODE=true
		;;
	esac
done

echo ""
echo "afergon-ai — project initialization"
echo "====================================="
echo "Project : $PROJECT_NAME"
echo "Directory: $TARGET_DIR"
echo ""

# ── Preflight: verify global launcher wiring ──────────────────────────────────
if command -v afergon-ai >/dev/null 2>&1; then
	if ! bash "$PACKAGE_ROOT/scripts/verify-install.sh" >/dev/null 2>&1; then
		echo "⚠ Detected a potentially broken global launcher installation."
		echo "  Suggested fix (from afergon-ai repo):"
		echo "    pnpm remove -g afergon-ai"
		echo "    pnpm link --global"
		echo "    afergon-ai doctor"
		echo ""
	fi
fi

# ── Interactive tool selection (no flags provided) ────────────────────────────

if ! $SETUP_PI && ! $SETUP_CLAUDE && ! $SETUP_OPENCODE; then
	echo "Which AI tools do you want to configure? (space-separated numbers)"
	echo ""
	echo "  1) Pi"
	echo "  2) Claude Code"
	echo "  3) OpenCode"
	echo "  4) All"
	echo ""
	read -r -p "Select: " tool_input

	for t in $tool_input; do
		case $t in
		1) SETUP_PI=true ;;
		2) SETUP_CLAUDE=true ;;
		3) SETUP_OPENCODE=true ;;
		4)
			SETUP_PI=true
			SETUP_CLAUDE=true
			SETUP_OPENCODE=true
			;;
		esac
	done
fi

# ── Memory system ─────────────────────────────────────────────────────────────

echo "Memory system"
echo "-------------"
echo "  1) Engram       — Pi-native persistent memory (recommended if installed)"
echo "  2) Obsidian     — Markdown vault (requires vault path)"
echo "  3) memory.md    — Simple append-only file at openspec/MEMORY.md"
echo "  4) None         — No memory"
echo ""
read -r -p "Select [1-4, default 4]: " mem_choice

MEMORY_SYSTEM="none"
OBSIDIAN_VAULT=""
OBSIDIAN_FOLDER=""

case "${mem_choice:-4}" in
1)
	MEMORY_SYSTEM="engram"
	echo "✔ Memory: Engram"
	;;
2)
	MEMORY_SYSTEM="obsidian"
	read -r -p "Vault path (e.g. ~/Documents/Obsidian/MyVault): " OBSIDIAN_VAULT
	OBSIDIAN_VAULT="${OBSIDIAN_VAULT/#\~/$HOME}"
	read -r -p "Folder inside vault [default: Projects/$PROJECT_NAME]: " OBSIDIAN_FOLDER
	OBSIDIAN_FOLDER="${OBSIDIAN_FOLDER:-Projects/$PROJECT_NAME}"
	echo "✔ Memory: Obsidian ($OBSIDIAN_VAULT / $OBSIDIAN_FOLDER)"
	;;
3)
	MEMORY_SYSTEM="memory-md"
	echo "✔ Memory: memory.md (openspec/MEMORY.md)"
	;;
*)
	MEMORY_SYSTEM="none"
	echo "✔ Memory: none"
	;;
esac

# ── Write openspec/config.yaml ────────────────────────────────────────────────

mkdir -p "$TARGET_DIR/openspec"
CONFIG_FILE="$TARGET_DIR/openspec/config.yaml"

write_config=true
if [ -f "$CONFIG_FILE" ]; then
	read -r -p "Warning: $CONFIG_FILE exists. Overwrite? [y/N] " c
	[[ "$c" != "y" && "$c" != "Y" ]] && write_config=false
fi

if $write_config; then
	cat >"$CONFIG_FILE" <<EOF
# afergon-ai project configuration

project:
  name: $PROJECT_NAME

memory:
  system: $MEMORY_SYSTEM
EOF
	[ "$MEMORY_SYSTEM" = "obsidian" ] && cat >>"$CONFIG_FILE" <<EOF
  vault: $OBSIDIAN_VAULT
  folder: $OBSIDIAN_FOLDER
EOF
	[ "$MEMORY_SYSTEM" = "memory-md" ] && printf "  path: openspec/MEMORY.md\n" >>"$CONFIG_FILE"
	echo "✔ Created $CONFIG_FILE"
fi

# ── Pi ────────────────────────────────────────────────────────────────────────

if $SETUP_PI; then
	echo ""
	echo "Pi setup"
	echo "--------"
	PI_DIR="$TARGET_DIR/.pi"
	APPEND_SYSTEM="$PI_DIR/APPEND_SYSTEM.md"
	mkdir -p "$PI_DIR"

	write_pi=true
	if [ -f "$APPEND_SYSTEM" ]; then
		read -r -p "Warning: $APPEND_SYSTEM exists. Overwrite? [y/N] " c
		[[ "$c" != "y" && "$c" != "Y" ]] && write_pi=false
	fi

	if $write_pi; then
		awk '/^---/{found++; next} found==2{print}' "$PACKAGE_ROOT/prompts/afergon-ai.md" >"$APPEND_SYSTEM"
		echo "✔ Created $APPEND_SYSTEM"
	fi
fi

# ── Claude Code ───────────────────────────────────────────────────────────────

if $SETUP_CLAUDE; then
	echo ""
	echo "Claude Code setup"
	echo "-----------------"
	CLAUDE_MD="$TARGET_DIR/CLAUDE.md"

	write_claude=true
	if [ -f "$CLAUDE_MD" ]; then
		read -r -p "Warning: $CLAUDE_MD exists. Overwrite? [y/N] " c
		[[ "$c" != "y" && "$c" != "Y" ]] && write_claude=false
	fi

	if $write_claude; then
		cp "$PACKAGE_ROOT/adapters/claude/CLAUDE.md" "$CLAUDE_MD"
		echo "✔ Created $CLAUDE_MD"
	fi

	# Skills: suggest copying to .claude/skills/
	if [ -d "$TARGET_DIR/.claude" ] || $write_claude; then
		mkdir -p "$TARGET_DIR/.claude/skills"
		if [ -d "$PACKAGE_ROOT/skills" ]; then
			cp -rn "$PACKAGE_ROOT/skills/"* "$TARGET_DIR/.claude/skills/" 2>/dev/null || true
			echo "✔ Copied skills → .claude/skills/"
		fi
	fi
fi

# ── OpenCode ──────────────────────────────────────────────────────────────────

if $SETUP_OPENCODE; then
	echo ""
	echo "OpenCode setup"
	echo "--------------"
	ADAPTER_PATH="$PACKAGE_ROOT/adapters/opencode"
	OC_BASE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
	OC_AGENTS_DIR="$OC_BASE_DIR/agents"
	OC_COMMANDS_DIR="$OC_BASE_DIR/commands"

	mkdir -p "$OC_AGENTS_DIR" "$OC_COMMANDS_DIR"

	agents_copied=0
	commands_copied=0

	# Copy agents — ask on conflict
	for src in "$ADAPTER_PATH"/agents/*.md; do
		dest="$OC_AGENTS_DIR/$(basename "$src")"
		if [ -f "$dest" ]; then
			read -r -p "Warning: $(basename "$dest") exists in global agents. Overwrite? [y/N] " c
			[[ "$c" != "y" && "$c" != "Y" ]] && continue
		fi
		if cp "$src" "$dest"; then
			agents_copied=$((agents_copied + 1))
			echo "✔ agents/$(basename "$dest")"
		fi
	done

	# Copy commands — ask on conflict
	for src in "$ADAPTER_PATH"/commands/*.md; do
		dest="$OC_COMMANDS_DIR/$(basename "$src")"
		if [ -f "$dest" ]; then
			read -r -p "Warning: $(basename "$dest") exists in global commands. Overwrite? [y/N] " c
			[[ "$c" != "y" && "$c" != "Y" ]] && continue
		fi
		if cp "$src" "$dest"; then
			commands_copied=$((commands_copied + 1))
			echo "✔ commands/$(basename "$dest")"
		fi
	done

	echo "OpenCode config dir: $OC_BASE_DIR"
	echo "OpenCode agents copied: $agents_copied"
	echo "OpenCode commands copied: $commands_copied"

	# Project-level opencode.json (for MCP and project-specific config)
	if [ ! -f "$TARGET_DIR/opencode.json" ]; then
		cp "$ADAPTER_PATH/opencode.json" "$TARGET_DIR/opencode.json"
		echo "✔ Created opencode.json"
	else
		echo "Note: opencode.json already exists — not overwritten."
	fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "====================================="
echo "afergon-ai initialized"
echo ""

$SETUP_PI && echo "  Pi        → .pi/APPEND_SYSTEM.md (active on next Pi session)"
$SETUP_CLAUDE && echo "  Claude    → CLAUDE.md + .claude/skills/"
$SETUP_OPENCODE && echo "  OpenCode  → ${XDG_CONFIG_HOME:-$HOME/.config}/opencode/agents/ + commands/"

echo ""
echo "Available skills (all tools):"
echo "  debate · breakdown · specify · plannify · implement · design · review · detect-skills"
echo ""
echo "Artifact store: openspec/"
echo "Memory system : $MEMORY_SYSTEM"
