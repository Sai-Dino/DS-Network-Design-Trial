#!/usr/bin/env bash
# Start OSRM on localhost for the network-optimizer (Table API / route checks).
# Prerequisites: Docker Desktop running, and prepared data under OSRM_DATA_DIR
# (run ../setup_osrm.sh once from the repo root to download & build India tiles).
#
# Usage:
#   ./start_osrm.sh
#   OSRM_DATA_DIR=/path/to/osrm-data OSRM_PORT=5000 ./start_osrm.sh

set -euo pipefail

OSRM_DIR="${OSRM_DATA_DIR:-$HOME/osrm-data}"
CONTAINER="${OSRM_CONTAINER_NAME:-osrm-india}"
PORT="${OSRM_PORT:-5000}"
IMAGE="${OSRM_IMAGE:-osrm/osrm-backend}"
OSRM_FILE="${OSRM_ROUTED_FILE:-/data/india-latest.osrm}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  echo "Alternatively install native OSRM: brew install osrm-backend"
  echo "  then: cd \"$OSRM_DIR\" && osrm-routed --algorithm mld india-latest.osrm --port $PORT"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Open Docker Desktop and wait until it is ready, then retry."
  exit 1
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
  echo "OSRM container '$CONTAINER' is already running."
elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
  echo "Starting existing container '$CONTAINER'..."
  docker start "$CONTAINER"
else
  if [[ ! -f "$OSRM_DIR/india-latest.osrm" ]]; then
    echo "No routed graph at: $OSRM_DIR/india-latest.osrm"
    echo "One-time setup from repo root:"
    echo "  cd $(dirname "$0")/.. && chmod +x setup_osrm.sh && ./setup_osrm.sh"
    exit 1
  fi
  echo "Creating container '$CONTAINER' (image $IMAGE)..."
  docker pull "$IMAGE"
  docker run -d \
    --name "$CONTAINER" \
    -p "${PORT}:5000" \
    -v "$OSRM_DIR:/data" \
    "$IMAGE" \
    osrm-routed --algorithm mld "$OSRM_FILE"
fi

echo "Waiting for OSRM on http://127.0.0.1:${PORT} ..."
for _ in $(seq 1 45); do
  if curl -sf "http://127.0.0.1:${PORT}/route/v1/driving/77.5946,12.9716;77.6,12.97?overview=false" >/dev/null; then
    echo "OSRM is up."
    curl -s "http://127.0.0.1:${PORT}/route/v1/driving/77.5946,12.9716;77.6,12.97?overview=false" | \
      python3 -c "import sys,json; d=json.load(sys.stdin); print('  sample route code:', d.get('code'))" 2>/dev/null || true
    exit 0
  fi
  sleep 1
done

echo "OSRM did not respond. Logs:"
docker logs --tail 30 "$CONTAINER" 2>&1 || true
exit 1
