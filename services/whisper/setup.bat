@echo off
echo Setting up Whisper service...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv whisper-env

REM Activate virtual environment and install dependencies
echo Installing dependencies...
whisper-env\Scripts\pip install --upgrade pip
whisper-env\Scripts\pip install -r requirements.txt

echo Setup complete!
echo To start the service, run: pnpm dev:whisper
pause
