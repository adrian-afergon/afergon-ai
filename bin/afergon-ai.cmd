@echo off
setlocal enabledelayedexpansion
set "PACKAGE_ROOT=%~dp0.."
set "CMD=%~1"

if /i "%CMD%"=="init" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PACKAGE_ROOT%\scripts\init-project.ps1" %2 %3 %4 %5
) else if /i "%CMD%"=="update" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PACKAGE_ROOT%\scripts\update.ps1"
) else (
    echo.
    echo afergon-ai -- development harness CLI
    echo.
    echo Usage:
    echo   afergon-ai init [--pi] [--claude] [--opencode] [--all]
    echo   afergon-ai update
    echo.
    echo Commands:
    echo   init     Initialize afergon-ai in the current project
    echo   update   Re-apply latest afergon-ai files to all installed tools
    echo.
)
