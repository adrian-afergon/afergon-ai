@echo off
setlocal DisableDelayedExpansion
set "PACKAGE_ROOT=%~dp0.."
set "RUNTIME_ENTRYPOINT=%PACKAGE_ROOT%\dist\scripts\cli-dispatch.js"
if not exist "%RUNTIME_ENTRYPOINT%" (
  >&2 echo afergon-ai has not been built yet.
  >&2 echo.
  >&2 echo From the afergon-ai package root, run:
  >&2 echo   pnpm build
  >&2 echo.
  >&2 echo Then run this command again.
  exit /b 1
)
node "%RUNTIME_ENTRYPOINT%" %*
