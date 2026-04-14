#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export OSRM_DATA_DIR="${OSRM_DATA_DIR:-$ROOT_DIR/osrm-data}"
export OSRM_PORT="${OSRM_PORT:-5001}"
export OPTIMIZER_PORT="${OPTIMIZER_PORT:-5050}"
export OSRM_URL="${OSRM_URL:-http://127.0.0.1:${OSRM_PORT}}"
export OFFICE_RUNTIME_BUNDLE_DIR="${OFFICE_RUNTIME_BUNDLE_DIR:-$ROOT_DIR/office-runtime-bundle/bangalore-benchmark-103}"
export PYTHONPYCACHEPREFIX="${PYTHONPYCACHEPREFIX:-/tmp/pycache}"

runtime_ready() {
  local osrm_dir="$1"
  local cache_dir="$2"
  [[ -d "$cache_dir" ]] && [[ -n "$(find "$cache_dir" -maxdepth 1 -type f -print -quit 2>/dev/null)" ]] &&
  [[ -d "$osrm_dir" ]] && [[ -n "$(find "$osrm_dir" -maxdepth 1 \( -name '*.osrm' -o -name '*.osrm.partition' -o -name '*.osrm.mldgr' -o -name '*.osrm.hsgr' \) -print -quit 2>/dev/null)" ]]
}

if ! runtime_ready "$OSRM_DATA_DIR" "$ROOT_DIR/network-optimizer/cache"; then
  if [[ -x "$ROOT_DIR/restore_office_demo_runtime.sh" ]] && [[ -d "$OFFICE_RUNTIME_BUNDLE_DIR" ]]; then
    echo "Repo-local runtime assets missing. Restoring from:"
    echo "  $OFFICE_RUNTIME_BUNDLE_DIR"
    "$ROOT_DIR/restore_office_demo_runtime.sh"
  fi
fi

if ! runtime_ready "$OSRM_DATA_DIR" "$ROOT_DIR/network-optimizer/cache"; then
  echo "ERROR: office runtime assets are not ready."
  echo "  Expected repo-local cache + OSRM data, or a restorable bundle at:"
  echo "    $OFFICE_RUNTIME_BUNDLE_DIR"
  echo "  Run ./office_demo_verify.sh for details."
  exit 1
fi

echo "Repo root: $ROOT_DIR"
echo "OSRM data dir: $OSRM_DATA_DIR"
echo "OSRM URL: $OSRM_URL"
echo "Optimizer URL: http://127.0.0.1:${OPTIMIZER_PORT}"
echo ""

"$ROOT_DIR/network-optimizer/start_osrm.sh"
exec "$ROOT_DIR/network-optimizer/start.sh"
