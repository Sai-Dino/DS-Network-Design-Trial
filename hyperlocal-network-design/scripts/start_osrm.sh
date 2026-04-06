#!/bin/bash
# Start the OSRM routing server

OSRM_DATA_DIR="${OSRM_DATA_DIR:-$HOME/osrm-data}"
OSRM_PORT="${OSRM_PORT:-5000}"

echo "Starting OSRM server on port $OSRM_PORT..."
cd "$OSRM_DATA_DIR" && osrm-routed --algorithm mld india-latest.osrm --port "$OSRM_PORT"
