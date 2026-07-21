param(
  [switch]$opencode
)

$ErrorActionPreference = "Stop"

function Write-Ok([string]$message) { Write-Output "✅ $message" }
function Write-Warn([string]$message) { Write-Output "⚠️  $message" }
function Fail([string]$message) {
  Write-Output "❌ $message"
  exit 1
}

$command = Get-Command afergon-ai -ErrorAction SilentlyContinue
if (-not $command) { Fail "No se encontró 'afergon-ai' en PATH." }

$binPath = $command.Source
if (-not $binPath) { $binPath = $command.Path }
if (-not $binPath) { Fail "No se pudo resolver el launcher de 'afergon-ai'." }
Write-Ok "Bin encontrado: $binPath"

$cliPath = (Resolve-Path -LiteralPath $binPath).Path
Write-Ok "CLI real: $cliPath"

$packageRoot = Split-Path -Parent (Split-Path -Parent $cliPath)
Write-Ok "Package root: $packageRoot"

foreach ($requiredScript in @("scripts/init-project.ps1", "scripts/update.ps1")) {
  $requiredPath = Join-Path $packageRoot $requiredScript
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) { Fail "Falta: $requiredPath" }
}
Write-Ok "Scripts requeridos presentes."

$launcherContents = Get-Content -LiteralPath $cliPath -Raw
if ($launcherContents -match "dist\\scripts\\cli-dispatch\.js") {
  Write-Ok "Launcher con runtime JavaScript emitido detectado."
} else {
  Write-Warn "Launcher sin runtime JavaScript emitido. Recomendado: actualizar y ejecutar 'pnpm link --global' en el repo de afergon-ai."
}

if ($opencode) {
  $ocBaseDir = if ($env:XDG_CONFIG_HOME) { Join-Path $env:XDG_CONFIG_HOME "opencode" } else { Join-Path $HOME ".config/opencode" }
  $ocAgentsDir = Join-Path $ocBaseDir "agents"
  $ocCommandsDir = Join-Path $ocBaseDir "commands"

  Write-Output ""
  Write-Output "OpenCode checks"
  Write-Output "---------------"
  Write-Ok "OpenCode config dir: $ocBaseDir"

  if (-not (Test-Path -LiteralPath $ocAgentsDir -PathType Container)) { Fail "No existe el directorio de agentes: $ocAgentsDir" }
  if (-not (Test-Path -LiteralPath $ocCommandsDir -PathType Container)) { Fail "No existe el directorio de comandos: $ocCommandsDir" }

  $missing = 0
  foreach ($name in @("afergon-ai", "afg-debate", "afg-breakdown", "afg-specify", "afg-plannify", "afg-implement", "afg-review", "afg-design")) {
    $file = Join-Path $ocAgentsDir "$name.md"
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      Write-Warn "Agente faltante o no legible: $file"
      $missing += 1
    }
  }
  foreach ($name in @("afg-debate", "afg-breakdown", "afg-specify", "afg-plannify", "afg-implement", "afg-review", "afg-design")) {
    $file = Join-Path $ocCommandsDir "$name.md"
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      Write-Warn "Comando faltante o no legible: $file"
      $missing += 1
    }
  }

  if ($missing -eq 0) {
    Write-Ok "OpenCode: agentes y comandos esperados presentes y legibles."
  } else {
    Fail "OpenCode incompleto: $missing archivo(s) faltantes/no legibles. Ejecutá: afergon-ai init --opencode"
  }
}

Write-Output ""
Write-Output "Verificación finalizada."
