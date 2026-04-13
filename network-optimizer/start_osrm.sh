#!/usr/bin/env bash
# Start OSRM on localhost for the network-optimizer (Table API / route checks).
# Prerequisites: Docker Desktop running, and prepared data under OSRM_DATA_DIR
# (run ../setup_osrm.sh once from the repo root to download & build India tiles).
#
# Usage:
#   ./start_osrm.sh
#   OSRM_DATA_DIR=/path/to/osrm-data OSRM_PORT=5000 ./start_osrm.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

detect_osrm_dir() {
  if [[ -n "${OSRM_DATA_DIR:-}" && -d "${OSRM_DATA_DIR}" ]]; then
    printf '%s\n' "${OSRM_DATA_DIR}"
    return 0
  fi
  if [[ -d "$REPO_ROOT/osrm-data" ]]; then
    printf '%s\n' "$REPO_ROOT/osrm-data"
    return 0
  fi
  if [[ -d "$HOME/osrm-data" ]]; then
    printf '%s\n' "$HOME/osrm-data"
    return 0
  fi
  printf '%s\n' "$REPO_ROOT/osrm-data"
}

detect_osrm_file() {
  local dir="$1"
  if [[ -n "${OSRM_ROUTED_FILE:-}" ]]; then
    printf '%s\n' "${OSRM_ROUTED_FILE}"
    return 0
  fi
  local preferred
  for preferred in southern-zone-latest.osrm india-latest.osrm; do
    if [[ -f "$dir/$preferred" || -f "$dir/$preferred.partition" || -f "$dir/$preferred.mldgr" || -f "$dir/$preferred.hsgr" ]]; then
      printf '%s\n' "/data/$preferred"
      return 0
    fi
  done
  local first
  first="$(find "$dir" -maxdepth 1 -name '*.osrm' -print | head -n 1 || true)"
  if [[ -n "$first" ]]; then
    printf '%s\n' "/data/$(basename "$first")"
    return 0
  fi
  first="$(find "$dir" -maxdepth 1 \( -name '*.osrm.partition' -o -name '*.osrm.mldgr' -o -name '*.osrm.hsgr' \) -print | head -n 1 || true)"
  if [[ -n "$first" ]]; then
    local base
    base="$(basename "$first")"
    base="${base%.partition}"
    base="${base%.mldgr}"
    base="${base%.hsgr}"
    printf '%s\n' "/data/$base"
    return 0
  fi
  printf '%s\n' "/data/southern-zone-latest.osrm"
}

osrm_bundle_present() {
  local dir="$1"
  local base="$2"
  [[ -f "$dir/$base" || -f "$dir/$base.partition" || -f "$dir/$base.mldgr" || -f "$dir/$base.hsgr" ]]
}

OSRM_DIR="$(detect_osrm_dir)"
CONTAINER="${OSRM_CONTAINER_NAME:-osrm-india}"
PORT="${OSRM_PORT:-5000}"
IMAGE="${OSRM_IMAGE:-osrm/osrm-backend}"
OSRM_FILE="$(detect_osrm_file "$OSRM_DIR")"

start_native_osrm() {
  local native_file="${OSRM_FILE#/data/}"
  if ! command -v osrm-routed >/dev/null 2>&1; then
    return 1
  fi
  if pgrep -f "osrm-routed .*${native_file}.*--port ${PORT}" >/dev/null 2>&1; then
    echo "Native osrm-routed is already running on port ${PORT}."
    return 0
  fi
  echo "Starting native osrm-routed from $OSRM_DIR/$native_file ..."
  (
    cd "$OSRM_DIR"
    nohup osrm-routed --algorithm mld "$native_file" --port "$PORT" >"$REPO_ROOT/osrm-${PORT}.log" 2>&1 &
  )
  return 0
}

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found."
  if ! start_native_osrm; then
    echo "Install Docker Desktop or native osrm-routed, or clone a bundle that already includes the runtime."
    exit 1
  fi
else
  if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon is not running."
    if ! start_native_osrm; then
      echo "Open Docker Desktop and wait until it is ready, or install native osrm-routed."
      exit 1
    fi
  else

    if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
      echo "OSRM container '$CONTAINER' is already running."
    elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
      echo "Starting existing container '$CONTAINER'..."
      docker start "$CONTAINER"
    else
      if ! osrm_bundle_present "$OSRM_DIR" "${OSRM_FILE#/data/}"; then
        echo "No routed graph at: $OSRM_DIR/${OSRM_FILE#/data/}"
        echo "Expected repo-local bundle path: $REPO_ROOT/osrm-data"
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
  fi
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
