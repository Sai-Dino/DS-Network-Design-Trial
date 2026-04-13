#!/bin/bash
# ============================================
#  Flipkart Hyperlocal Distance Analyzer
#  Start the server
# ============================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Flipkart Hyperlocal Distance Analyzer${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: python3 not found. Please install Python 3.${NC}"
    exit 1
fi

# Install dependencies
echo "Checking dependencies..."
pip3 install flask pandas requests openpyxl --break-system-packages -q 2>/dev/null || \
pip3 install flask pandas requests openpyxl -q 2>/dev/null

# Check OSRM
echo ""
if curl -s "http://localhost:5000/route/v1/driving/77.5946,12.9716;77.6200,13.0000?overview=false" > /dev/null 2>&1; then
    echo -e "${GREEN}OSRM server is running on port 5000${NC}"
else
    echo -e "${RED}WARNING: OSRM server is NOT running on port 5000${NC}"
    echo "  Start it in another terminal:"
    echo "    cd ~/osrm-data && osrm-routed --algorithm mld india-latest.osrm --port 5000"
    echo ""
fi

# Start server
echo ""
echo -e "${GREEN}Starting Hyperlocal Distance Analyzer...${NC}"
cd "$(dirname "$0")"
python3 hyperlocal_server.py
