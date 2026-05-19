#!/usr/bin/env bash
set -euo pipefail

CHECK_OPENCODE=false
for arg in "$@"; do
	case "$arg" in
	--opencode) CHECK_OPENCODE=true ;;
	esac
done

ok() { echo "✅ $*"; }
warn() { echo "⚠️  $*"; }
fail() {
	echo "❌ $*"
	exit 1
}

BIN_PATH="$(command -v afergon-ai || true)"
[ -n "$BIN_PATH" ] || fail "No se encontró 'afergon-ai' en PATH."
ok "Bin encontrado: $BIN_PATH"

# Resolve symlink chain
SOURCE="$BIN_PATH"
while [ -L "$SOURCE" ]; do
	DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
	SOURCE="$(readlink "$SOURCE")"
	[[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done
CLI_PATH="$(cd -P "$(dirname "$SOURCE")" && pwd)/$(basename "$SOURCE")"
ok "CLI real: $CLI_PATH"

PACKAGE_ROOT="$(cd "$(dirname "$CLI_PATH")/.." && pwd)"
ok "Package root: $PACKAGE_ROOT"

[ -f "$PACKAGE_ROOT/scripts/init-project.sh" ] || fail "Falta: $PACKAGE_ROOT/scripts/init-project.sh"
[ -f "$PACKAGE_ROOT/scripts/update.sh" ] || fail "Falta: $PACKAGE_ROOT/scripts/update.sh"
ok "Scripts requeridos presentes."

if grep -q "while \[ -L \"\$SOURCE\" \]" "$CLI_PATH"; then
	ok "Launcher con fix de resolución de symlink detectado."
else
	warn "Launcher sin fix de symlink. Recomendado: actualizar y ejecutar 'pnpm link --global' en el repo de afergon-ai."
fi

if $CHECK_OPENCODE; then
	OC_BASE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
	OC_AGENTS_DIR="$OC_BASE_DIR/agents"
	OC_COMMANDS_DIR="$OC_BASE_DIR/commands"

	echo ""
	echo "OpenCode checks"
	echo "---------------"
	ok "OpenCode config dir: $OC_BASE_DIR"

	[ -d "$OC_AGENTS_DIR" ] || fail "No existe el directorio de agentes: $OC_AGENTS_DIR"
	[ -d "$OC_COMMANDS_DIR" ] || fail "No existe el directorio de comandos: $OC_COMMANDS_DIR"

	expected_agents=(orchestrator debate breakdown specify plannify implement review design)
	expected_commands=(debate breakdown specify plannify implement review design)

	missing=0
	for name in "${expected_agents[@]}"; do
		file="$OC_AGENTS_DIR/$name.md"
		if [ ! -r "$file" ]; then
			warn "Agente faltante o no legible: $file"
			missing=$((missing + 1))
		fi
	done

	for name in "${expected_commands[@]}"; do
		file="$OC_COMMANDS_DIR/$name.md"
		if [ ! -r "$file" ]; then
			warn "Comando faltante o no legible: $file"
			missing=$((missing + 1))
		fi
	done

	if [ "$missing" -eq 0 ]; then
		ok "OpenCode: agentes y comandos esperados presentes y legibles."
	else
		fail "OpenCode incompleto: $missing archivo(s) faltantes/no legibles. Ejecutá: afergon-ai init --opencode"
	fi
fi

echo ""
echo "Verificación finalizada."
