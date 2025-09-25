@echo off

@REM unncomment the below 2 lines if you want to remove cache on run
@REM echo 🔄 Cleaning stale turbod.pid files...
@REM del "%LOCALAPPDATA%\Temp\turbod\*\turbod.pid" 2>nul

echo Starting all servers in separate tabs...

REM Store current working directory
set "WD=%cd%"

REM Launch 4 separate tabs from this directory
start wt ^
    --title "Backend" cmd /k "cd /d %WD% && pnpm --filter @poll-automation/backend dev" ^
    ; new-tab --title "Frontend" cmd /k "cd /d %WD% && pnpm --filter automatic-poll-system dev" ^
    ; new-tab --title "Whisper" cmd /k "cd /d %WD% && pnpm --filter @poll-automation/whisper dev" ^
    ; new-tab --title "LLM" cmd /k "cd /d %WD% && pnpm --filter pollgen-llm dev"

echo ✅ All servers launched from %WD%
