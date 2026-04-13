#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Flipkart 3-Tier Network Optimizer"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not installed"
    exit 1
fi

echo "Python version:"
python3 --version
echo ""

# Install dependencies (if not already installed)
echo "Checking dependencies..."
python3 -c "import pandas, numpy, openpyxl, scipy, urllib3" 2>/dev/null || {
    echo "Installing dependencies..."
    pip install -r "$SCRIPT_DIR/requirements.txt"
}

echo ""
echo "=========================================="
echo "Starting server..."
echo "=========================================="
echo ""
OSRM_CHECK_URL="${OSRM_URL:-http://127.0.0.1:5001}"
if ! curl -sf "${OSRM_CHECK_URL}/route/v1/driving/77.5946,12.9716;77.6,12.97?overview=false" >/dev/null 2>&1; then
  OSRM_CHECK_URL="http://127.0.0.1:5000"
fi
if ! curl -sf "${OSRM_CHECK_URL}/route/v1/driving/77.5946,12.9716;77.6,12.97?overview=false" >/dev/null 2>&1; then
  echo "WARNING: OSRM is not responding on http://localhost:5001 or http://localhost:5000"
  echo "  Start it first:  ./start_osrm.sh"
  echo "  (First-time data setup from repo root: ./setup_osrm.sh)"
  echo ""
fi
echo "OSRM expected at: ${OSRM_CHECK_URL}"
echo ""
echo "The optimizer will be available at:"
echo "  http://localhost:5050"
echo ""
echo "Data loading takes ~20-60s (10.7M orders)"
echo "Check http://localhost:5050/api/status for progress"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$SCRIPT_DIR"
python3 server.py
