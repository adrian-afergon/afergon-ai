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

# ── Helper: strip YAML frontmatter ────────────────────────────────────────────

function Get-ContentAfterFrontmatter {
    param([string]$Path)
    $lines = Get-Content $Path -Encoding UTF8
    $dashes = 0
    $result = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        if ($line -eq '---') { $dashes++; continue }
        if ($dashes -ge 2)   { $result.Add($line) }
    }
    return $result
}

Write-Host ""
Write-Host "afergon-ai update"
Write-Host "=================="
Write-Host "Package : $PACKAGE_ROOT"
Write-Host "Project : $TARGET_DIR"
Write-Host ""

# ── Pi ────────────────────────────────────────────────────────────────────────

$APPEND_SYSTEM = Join-Path $TARGET_DIR '.pi\APPEND_SYSTEM.md'
if (Test-Path $APPEND_SYSTEM) {
    $content = Get-ContentAfterFrontmatter (Join-Path $PACKAGE_ROOT 'prompts\afergon-ai.md')
    Set-Content -Path $APPEND_SYSTEM -Value $content -Encoding UTF8
    Write-Host "OK  Pi: updated .pi\APPEND_SYSTEM.md"
    $UPDATED++
} else {
    Write-Host "    Pi: not installed in this project (skipped)"
    $SKIPPED++
}

# ── Claude Code ───────────────────────────────────────────────────────────────

$CLAUDE_MD = Join-Path $TARGET_DIR 'CLAUDE.md'
if (Test-Path $CLAUDE_MD) {
    Copy-Item (Join-Path $PACKAGE_ROOT 'adapters\claude\CLAUDE.md') $CLAUDE_MD -Force
    Write-Host "OK  Claude: updated CLAUDE.md"
    $UPDATED++
} else {
    Write-Host "    Claude: not installed in this project (skipped)"
    $SKIPPED++
}

$CLAUDE_SKILLS = Join-Path $TARGET_DIR '.claude\skills'
if (Test-Path $CLAUDE_SKILLS) {
    Get-ChildItem (Join-Path $PACKAGE_ROOT 'skills') -Directory | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $CLAUDE_SKILLS $_.Name) -Recurse -Force
    }
    Write-Host "OK  Claude: updated .claude\skills\"
    $UPDATED++
}

# ── OpenCode ──────────────────────────────────────────────────────────────────

$OC_AGENTS_DIR   = Join-Path $HOME '.config\opencode\agents'
$OC_COMMANDS_DIR = Join-Path $HOME '.config\opencode\commands'
$ADAPTER_PATH    = Join-Path $PACKAGE_ROOT 'adapters\opencode'
$OC_MARKER       = Join-Path $OC_AGENTS_DIR 'orchestrator.md'

if (Test-Path $OC_MARKER) {
    Get-ChildItem (Join-Path $ADAPTER_PATH 'agents') -Filter '*.md' | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $OC_AGENTS_DIR $_.Name) -Force
    }
    Write-Host "OK  OpenCode: updated ~/.config/opencode/agents/"

    Get-ChildItem (Join-Path $ADAPTER_PATH 'commands') -Filter '*.md' | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $OC_COMMANDS_DIR $_.Name) -Force
    }
    Write-Host "OK  OpenCode: updated ~/.config/opencode/commands/"
    $UPDATED++
} else {
    Write-Host "    OpenCode: not installed globally (skipped)"
    $SKIPPED++
}

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Done. Updated: $UPDATED component(s), skipped: $SKIPPED."
if ($SKIPPED -gt 0) {
    Write-Host "Run 'afergon-ai init' to install skipped tools."
}
