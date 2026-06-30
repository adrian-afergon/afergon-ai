@echo off
setlocal enabledelayedexpansion
set "PACKAGE_ROOT=%~dp0.."
node "%PACKAGE_ROOT%\scripts\cli-dispatch.mjs" %*
