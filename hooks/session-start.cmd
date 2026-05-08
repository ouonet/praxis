@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "HOOK=%SCRIPT_DIR%session-start.sh"
where bash >nul 2>nul
if %ERRORLEVEL%==0 (
  bash "%HOOK%"
) else (
  where wsl >nul 2>nul && wsl bash "%HOOK%" || (
    echo {"additionalContext":"Praxis: bash not found; install Git Bash or WSL."}
    exit /b 0
  )
)
