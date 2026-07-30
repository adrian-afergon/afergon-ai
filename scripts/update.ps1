# afergon-ai/scripts/update.ps1
# Re-copy afergon-ai components to all detected tool installations.
# Run this after pulling updates from the afergon-ai repo.
#
# Usage: afergon-ai update

$ErrorActionPreference = 'Stop'

$SCRIPT_DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path
$PACKAGE_ROOT = Split-Path -Parent $SCRIPT_DIR
$TARGET_DIR   = (Get-Location).Path

$UPDATED = 0
$SKIPPED = 0

Write-Host ""
Write-Host "afergon-ai update"
Write-Host "=================="
Write-Host "Package : $PACKAGE_ROOT"
Write-Host "Project : $TARGET_DIR"
Write-Host ""

# ── OpenCode ──────────────────────────────────────────────────────────────────

$OC_BASE_DIR      = if ($env:XDG_CONFIG_HOME) { Join-Path $env:XDG_CONFIG_HOME 'opencode' } else { Join-Path $HOME '.config\opencode' }
$OC_AGENTS_DIR    = Join-Path $OC_BASE_DIR 'agents'
$OC_COMMANDS_DIR  = Join-Path $OC_BASE_DIR 'commands'
$ADAPTER_PATH     = Join-Path $PACKAGE_ROOT 'adapters\opencode'
$OC_MARKER        = Join-Path $OC_AGENTS_DIR 'afergon-ai.md'
$OC_LEGACY_MARKER = Join-Path $OC_AGENTS_DIR 'orchestrator.md'

if ((Test-Path $OC_MARKER) -or (Test-Path $OC_LEGACY_MARKER)) {
    Get-ChildItem (Join-Path $ADAPTER_PATH 'agents') -Filter '*.md' | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $OC_AGENTS_DIR $_.Name) -Force
    }
    Write-Host "OK  OpenCode: updated $OC_BASE_DIR\agents\"

    Get-ChildItem (Join-Path $ADAPTER_PATH 'commands') -Filter '*.md' | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $OC_COMMANDS_DIR $_.Name) -Force
    }
    Write-Host "OK  OpenCode: updated $OC_BASE_DIR\commands\"
    $UPDATED++
} else {
    Write-Host "    OpenCode: afergon-ai agents are not installed in $OC_BASE_DIR (skipped)"
    $SKIPPED++
}

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Done. Updated: $UPDATED component(s), skipped: $SKIPPED."
if ($SKIPPED -gt 0) {
    Write-Host "Run 'afergon-ai init' to install skipped tools."
}
