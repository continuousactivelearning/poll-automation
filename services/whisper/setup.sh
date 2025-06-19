#!/bin/bash

echo "Setting up Whisper service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv whisper-env

# Activate virtual environment and install dependencies
echo "Installing dependencies..."
source whisper-env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Setup complete!"
echo "To start the service, run: pnpm dev:whisper"
