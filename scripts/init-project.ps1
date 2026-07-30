# afergon-ai/scripts/init-project.ps1
# Initialize afergon-ai in any project.
# Prefer using the CLI: afergon-ai init [--opencode]

param(
    # Declare host switches explicitly so --pi is not abbreviated to PowerShell's
    # common -PipelineVariable parameter before the retirement check runs.
    [switch]$Pi,
    [switch]$All,
    [switch]$Claude,
    [switch]$Opencode,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Flags
)

$ErrorActionPreference = 'Stop'

$SCRIPT_DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path
$PACKAGE_ROOT = Split-Path -Parent $SCRIPT_DIR
$TARGET_DIR   = (Get-Location).Path
$PROJECT_NAME = Split-Path -Leaf $TARGET_DIR

$SETUP_OPENCODE = $false

if ($Pi) {
    Write-Error "Error: --pi is retired. Supported host: --opencode."
    exit 1
}
if ($All) {
    Write-Error "Error: --all is retired. Supported host: --opencode."
    exit 1
}
if ($Claude) {
    Write-Error "Error: --claude is retired. Supported host: --opencode."
    exit 1
}

foreach ($flag in $Flags) {
    if ($flag -eq '--pi') {
        Write-Error "Error: --pi is retired. Supported host: --opencode."
        exit 1
    }
    if ($flag -eq '--all') {
        Write-Error "Error: --all is retired. Supported host: --opencode."
        exit 1
    }
    if ($flag -eq '--claude') {
        Write-Error "Error: --claude is retired. Supported host: --opencode."
        exit 1
    }
}

if ($Opencode) {
    $SETUP_OPENCODE = $true
}

foreach ($flag in $Flags) {
    switch ($flag) {
        '--opencode' { $SETUP_OPENCODE = $true }
    }
}

# Default to OpenCode when no host flag is provided.
if (-not $SETUP_OPENCODE) {
    $SETUP_OPENCODE = $true
}

# ── Helper: confirm overwrite ──────────────────────────────────────────────────

function Confirm-Overwrite {
    param([string]$Path)
    if (Test-Path $Path) {
        $c = Read-Host "Warning: $Path already exists. Overwrite? [y/N]"
        return ($c -eq 'y' -or $c -eq 'Y')
    }
    return $true
}

Write-Host ""
Write-Host "afergon-ai -- project initialization"
Write-Host "======================================"
Write-Host "Project : $PROJECT_NAME"
Write-Host "Directory: $TARGET_DIR"
Write-Host ""

# ── Memory system ─────────────────────────────────────────────────────────────

Write-Host "Memory system"
Write-Host "-------------"
Write-Host "  1) Engram       -- persistent memory (recommended if installed)"
Write-Host "  2) Obsidian     -- Markdown vault (requires vault path)"
Write-Host "  3) memory.md    -- Simple append-only file at openspec/MEMORY.md"
Write-Host "  4) None         -- No memory"
Write-Host ""
$memChoice = Read-Host "Select [1-4, default 4]"
if (-not $memChoice) { $memChoice = '4' }

$MEMORY_SYSTEM   = 'none'
$OBSIDIAN_VAULT  = ''
$OBSIDIAN_FOLDER = ''

switch ($memChoice) {
    '1' { $MEMORY_SYSTEM = 'engram';    Write-Host "OK  Memory: Engram" }
    '2' {
        $MEMORY_SYSTEM   = 'obsidian'
        $OBSIDIAN_VAULT  = Read-Host "Vault path (e.g. C:\Users\you\Documents\Obsidian\MyVault)"
        $defaultFolder   = "Projects\$PROJECT_NAME"
        $OBSIDIAN_FOLDER = Read-Host "Folder inside vault [default: $defaultFolder]"
        if (-not $OBSIDIAN_FOLDER) { $OBSIDIAN_FOLDER = $defaultFolder }
        Write-Host "OK  Memory: Obsidian ($OBSIDIAN_VAULT \ $OBSIDIAN_FOLDER)"
    }
    '3' { $MEMORY_SYSTEM = 'memory-md'; Write-Host "OK  Memory: memory.md (openspec\MEMORY.md)" }
    default { $MEMORY_SYSTEM = 'none'; Write-Host "OK  Memory: none" }
}

# ── Write openspec/config.yaml ────────────────────────────────────────────────

$OPENSPEC_DIR = Join-Path $TARGET_DIR 'openspec'
$CONFIG_FILE  = Join-Path $OPENSPEC_DIR 'config.yaml'
New-Item -ItemType Directory -Force -Path $OPENSPEC_DIR | Out-Null

if (Confirm-Overwrite $CONFIG_FILE) {
    $config = @"
# afergon-ai project configuration

project:
  name: $PROJECT_NAME

memory:
  system: $MEMORY_SYSTEM
"@
    if ($MEMORY_SYSTEM -eq 'obsidian') {
        $config += "`n  vault: $OBSIDIAN_VAULT`n  folder: $OBSIDIAN_FOLDER"
    }
    if ($MEMORY_SYSTEM -eq 'memory-md') {
        $config += "`n  path: openspec/MEMORY.md"
    }
    Set-Content -Path $CONFIG_FILE -Value $config -Encoding UTF8
    Write-Host "OK  Created $CONFIG_FILE"
}

# ── OpenCode ──────────────────────────────────────────────────────────────────

if ($SETUP_OPENCODE) {
    Write-Host ""
    Write-Host "OpenCode setup"
    Write-Host "--------------"
    $ADAPTER_PATH    = Join-Path $PACKAGE_ROOT 'adapters\opencode'
    $OC_BASE_DIR     = if ($env:XDG_CONFIG_HOME) { Join-Path $env:XDG_CONFIG_HOME 'opencode' } else { Join-Path $HOME '.config\opencode' }
    $OC_AGENTS_DIR   = Join-Path $OC_BASE_DIR 'agents'
    $OC_COMMANDS_DIR = Join-Path $OC_BASE_DIR 'commands'

    New-Item -ItemType Directory -Force -Path $OC_AGENTS_DIR   | Out-Null
    New-Item -ItemType Directory -Force -Path $OC_COMMANDS_DIR | Out-Null

    # Agents
    Get-ChildItem (Join-Path $ADAPTER_PATH 'agents') -Filter '*.md' | ForEach-Object {
        $dest = Join-Path $OC_AGENTS_DIR $_.Name
        if (Confirm-Overwrite $dest) {
            Copy-Item $_.FullName $dest -Force
            Write-Host "OK  agents\$($_.Name)"
        }
    }

    # Commands
    Get-ChildItem (Join-Path $ADAPTER_PATH 'commands') -Filter '*.md' | ForEach-Object {
        $dest = Join-Path $OC_COMMANDS_DIR $_.Name
        if (Confirm-Overwrite $dest) {
            Copy-Item $_.FullName $dest -Force
            Write-Host "OK  commands\$($_.Name)"
        }
    }

    # Project opencode.json
    $ocJson = Join-Path $TARGET_DIR 'opencode.json'
    if (-not (Test-Path $ocJson)) {
        Copy-Item (Join-Path $ADAPTER_PATH 'opencode.json') $ocJson
        Write-Host "OK  Created opencode.json"
    } else {
        Write-Host "Note: opencode.json already exists -- not overwritten."
    }
}

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "======================================"
Write-Host "afergon-ai initialized"
Write-Host ""
if ($SETUP_OPENCODE) { Write-Host "  OpenCode  -> $OC_BASE_DIR\agents\ + commands/" }
Write-Host ""
Write-Host "Available skills (all tools):"
Write-Host "  debate * breakdown * specify * plannify * implement * design * review * detect-skills"
Write-Host ""
Write-Host "Artifact store: openspec\"
Write-Host "Memory system : $MEMORY_SYSTEM"
