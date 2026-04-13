#!/bin/bash
# ============================================================
# OSRM Local Setup Script for India Map
# Run this in your VS Code / Cursor terminal:
#   chmod +x setup_osrm.sh && ./setup_osrm.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OSRM Local Setup - India Map          ${NC}"
echo -e "${GREEN}========================================${NC}"

# ─── Step 0: Check Docker ────────────────────────────────────
echo -e "\n${YELLOW}[1/6] Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    echo "After installing, restart your terminal and run this script again."
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    echo -e "${RED}Docker is not running!${NC}"
    echo "Please start Docker Desktop and run this script again."
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed and running${NC}"

# ─── Step 1: Pull OSRM image ────────────────────────────────
echo -e "\n${YELLOW}[2/6] Pulling OSRM Docker image...${NC}"
docker pull osrm/osrm-backend
echo -e "${GREEN}✓ OSRM image pulled${NC}"

# ─── Step 2: Create data directory & download map ────────────
OSRM_DIR="$HOME/osrm-data"
mkdir -p "$OSRM_DIR"
echo -e "\n${YELLOW}[3/6] Downloading India map (~500MB)...${NC}"
echo "    Saving to: $OSRM_DIR"

if [ -f "$OSRM_DIR/india-latest.osm.pbf" ]; then
    echo -e "${GREEN}✓ India map already downloaded, skipping${NC}"
else
    # Use curl (available on macOS) or wget
    if command -v curl &> /dev/null; then
        curl -L -o "$OSRM_DIR/india-latest.osm.pbf" \
            "https://download.geofabrik.de/asia/india-latest.osm.pbf"
    elif command -v wget &> /dev/null; then
        wget -O "$OSRM_DIR/india-latest.osm.pbf" \
            "https://download.geofabrik.de/asia/india-latest.osm.pbf"
    else
        echo -e "${RED}Neither curl nor wget found. Please install one.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ India map downloaded${NC}"
fi

# ─── Step 3: Extract ─────────────────────────────────────────
echo -e "\n${YELLOW}[4/6] Extracting road network (this takes 10-20 min)...${NC}"
if [ -f "$OSRM_DIR/india-latest.osrm" ]; then
    echo -e "${GREEN}✓ Already extracted, skipping${NC}"
else
    docker run -t -v "$OSRM_DIR:/data" osrm/osrm-backend \
        osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf
    echo -e "${GREEN}✓ Extraction complete${NC}"
fi

# ─── Step 4: Partition ────────────────────────────────────────
echo -e "\n${YELLOW}[5/6] Partitioning & customizing (5-10 min)...${NC}"
if [ -f "$OSRM_DIR/india-latest.osrm.partition" ]; then
    echo -e "${GREEN}✓ Already partitioned, skipping${NC}"
else
    docker run -t -v "$OSRM_DIR:/data" osrm/osrm-backend \
        osrm-partition /data/india-latest.osrm
    echo -e "${GREEN}✓ Partition complete${NC}"
fi

if [ -f "$OSRM_DIR/india-latest.osrm.cell_metrics" ]; then
    echo -e "${GREEN}✓ Already customized, skipping${NC}"
else
    docker run -t -v "$OSRM_DIR:/data" osrm/osrm-backend \
        osrm-customize /data/india-latest.osrm
    echo -e "${GREEN}✓ Customization complete${NC}"
fi

# ─── Step 5: Start the server ────────────────────────────────
echo -e "\n${YELLOW}[6/6] Starting OSRM server on port 5000...${NC}"

# Stop any existing OSRM container
docker rm -f osrm-india 2>/dev/null || true

docker run -t -d \
    --name osrm-india \
    -p 5000:5000 \
    -v "$OSRM_DIR:/data" \
    osrm/osrm-backend \
    osrm-routed --algorithm mld /data/india-latest.osrm

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..15}; do
    if curl -s http://localhost:5000/route/v1/driving/77.5946,12.9716;77.6200,13.0000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OSRM server is running!${NC}"
        break
    fi
    sleep 2
done

# ─── Verify with a test route ────────────────────────────────
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!                        ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Testing with a sample Bangalore route..."
RESULT=$(curl -s "http://localhost:5000/route/v1/driving/77.5946,12.9716;77.6200,13.0000")
echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('code') == 'Ok':
    d = data['routes'][0]['distance'] / 1000
    print(f'  Test route: {d:.1f} km  ✓ Working!')
else:
    print('  WARNING: Test route failed. Check the server.')
" 2>/dev/null || echo "  Server is running but couldn't parse test result."

echo ""
echo -e "Now run the distance calculator:"
echo -e "  ${YELLOW}pip install pandas requests tqdm${NC}"
echo -e "  ${YELLOW}python osrm_setup_and_run.py -i \"Copy of Distance calculator- Google maps Distance - Dis_Cal.csv\" -o orders_with_road_distance.csv${NC}"
echo ""
echo -e "To stop the server later:  ${YELLOW}docker stop osrm-india${NC}"
echo -e "To restart it:             ${YELLOW}docker start osrm-india${NC}"
