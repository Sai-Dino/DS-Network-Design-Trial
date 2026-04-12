#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export OSRM_DATA_DIR="${OSRM_DATA_DIR:-$ROOT_DIR/osrm-data}"
export OSRM_PORT="${OSRM_PORT:-5001}"
export OPTIMIZER_PORT="${OPTIMIZER_PORT:-5050}"
export OSRM_URL="${OSRM_URL:-http://127.0.0.1:${OSRM_PORT}}"

echo "Repo root: $ROOT_DIR"
echo "OSRM data dir: $OSRM_DATA_DIR"
echo "OSRM URL: $OSRM_URL"
echo "Optimizer URL: http://127.0.0.1:${OPTIMIZER_PORT}"
echo ""

"$ROOT_DIR/network-optimizer/start_osrm.sh"
exec "$ROOT_DIR/network-optimizer/start.sh"
