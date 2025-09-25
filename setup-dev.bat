@echo off
setlocal enabledelayedexpansion

echo.
set /p USE_GPU=Are you using GPU for Whisper service? (Y/N): 

set "USE_GPU=!USE_GPU:~0,1!"
set "USE_GPU=!USE_GPU:Y=y!"
set "USE_GPU=!USE_GPU:N=n!"
set "USE_GPU=!USE_GPU:y=y!"
set "USE_GPU=!USE_GPU:n=n!"

echo Killing stale python processes...
taskkill /f /im python.exe >nul 2>&1 && echo ✓ Python processes cleaned.

echo Cleaning stale turbopack PIDs...
del "%LOCALAPPDATA%\Temp\turbod\*\turbod.pid" 2>nul && echo ✓ Turbopack PIDs removed.

echo Creating .env files...

> apps\backend\.env (
    echo PORT=3000
    echo WHISPER_SERVICE_URL=ws://localhost:8000
    echo LLM_FORWARD_URL=ws://localhost:5001/ws/transcripts
    echo MONGO_URI="mongodb://localhost:27017/"
)
echo ✓ apps\backend\.env created.

> apps\frontend\.env (
    echo VITE_BACKEND_WS_URL=ws://localhost:3000
    echo VITE_PORT=5173
    echo VITE_BACKEND_API_URL=http://localhost:3000
    echo VITE_CHUNK_INTERVAL=30000
)
echo ✓ apps\frontend\.env created.

> services\whisper\.env (
    echo CHUNK_DURATION=30
    echo MODEL=medium
    echo SILENCE_THRESHOLD=960000
)
echo ✓ services\whisper\.env created.

> services\pollgen-llm\.env (
    echo BACKEND_SETTINGS_API=http://localhost:5001/settings
    echo GEMINI_API_KEY=""
    echo MONGO_URI="mongodb://localhost:27017"
    echo USER_HOME=C:/Users/aayus/
)
echo ✓ services\pollgen-llm\.env created.

echo Setting up whisper-env...
cd services\whisper

if not exist whisper-env (
    python -m venv whisper-env && echo ✓ whisper-env created.
)

call whisper-env\Scripts\activate

if not exist ".installed.flag" (
    echo Installing Whisper dependencies...
    python -m pip install --upgrade pip
    if /i "!USE_GPU!"=="y" (
        pip install -r requirements.gpu.txt --extra-index-url https://download.pytorch.org/whl/cu121 && echo gpu > .installed.flag && echo ✓ GPU requirements installed.
    ) else (
        pip install -r requirements.txt && echo cpu > .installed.flag && echo ✓ CPU requirements installed.
    )
) else (
    echo ✓ Whisper requirements already installed.
)

cd ../..

echo Setting up pollgenenv...
cd services\pollgen-llm

if not exist pollgenenv (
    python -m venv pollgenenv && echo ✓ pollgenenv created.
)

call pollgenenv\Scripts\activate

if not exist ".installed.flag" (
    echo Installing PollGen dependencies...
    python -m pip install --upgrade pip
    pip install -r requirements.txt && echo done > .installed.flag && echo ✓ PollGen dependencies installed.
) else (
    echo ✓ PollGen LLM requirements already installed.
)

cd ../..

echo Installing frontend/backend dependencies...
pnpm install && echo ✓ Dependencies installed.

echo Launching development environment...
pnpm dev
