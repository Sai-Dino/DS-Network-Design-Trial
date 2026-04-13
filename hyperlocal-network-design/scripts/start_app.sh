#!/bin/bash
# Start the Hyperlocal Network Design application

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PORT="${APP_PORT:-8080}"

cd "$PROJECT_DIR"

# Check if virtual environment exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "Starting Hyperlocal Network Design Tool on port $PORT..."
python3 server.py
