#!/bin/bash
# ============================================================================
# OSRM Setup Script for Hyperlocal Network Design Tool
# Downloads India map data and sets up OSRM for road distance calculation
# ============================================================================

set -e

OSRM_DATA_DIR="${OSRM_DATA_DIR:-$HOME/osrm-data}"
OSRM_PORT="${OSRM_PORT:-5000}"
MAP_URL="https://download.geofabrik.de/asia/india-latest.osm.pbf"

echo "============================================"
echo "  OSRM Setup for Hyperlocal Network Design"
echo "============================================"
echo ""
echo "Data directory: $OSRM_DATA_DIR"
echo ""

# Check if osrm tools are installed
if ! command -v osrm-extract &> /dev/null; then
    echo "OSRM tools not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install osrm-backend
    else
        echo "ERROR: Neither OSRM nor Homebrew found."
        echo "Install OSRM via: brew install osrm-backend"
        echo "Or use Docker: docker pull osrm/osrm-backend"
        exit 1
    fi
fi

mkdir -p "$OSRM_DATA_DIR"
cd "$OSRM_DATA_DIR"

# Download map data if not present
if [ ! -f "india-latest.osm.pbf" ]; then
    echo "Downloading India map data (~500MB)..."
    curl -L -o india-latest.osm.pbf "$MAP_URL"
    echo "Download complete."
else
    echo "Map data already exists, skipping download."
fi

# Extract
if [ ! -f "india-latest.osrm" ]; then
    echo "Extracting map data (this takes several minutes)..."
    osrm-extract -p /opt/homebrew/share/osrm/profiles/car.lua india-latest.osm.pbf
    echo "Extraction complete."
else
    echo "Extracted data exists, skipping."
fi

# Partition
if [ ! -f "india-latest.osrm.partition" ]; then
    echo "Partitioning..."
    osrm-partition india-latest.osrm
    echo "Partition complete."
else
    echo "Partition data exists, skipping."
fi

# Customize
if [ ! -f "india-latest.osrm.cell_metrics" ]; then
    echo "Customizing..."
    osrm-customize india-latest.osrm
    echo "Customization complete."
else
    echo "Customized data exists, skipping."
fi

echo ""
echo "============================================"
echo "  OSRM Setup Complete!"
echo "============================================"
echo ""
echo "To start the OSRM server, run:"
echo "  cd $OSRM_DATA_DIR && osrm-routed --algorithm mld india-latest.osrm --port $OSRM_PORT"
echo ""
echo "Or use the start script:"
echo "  ./scripts/start_osrm.sh"
echo ""
