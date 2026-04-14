#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OSRM_DIR="${OSRM_DATA_DIR:-$ROOT_DIR/osrm-data}"
CACHE_DIR="$ROOT_DIR/network-optimizer/cache"
RUNTIME_BUNDLE_DIR="${OFFICE_RUNTIME_BUNDLE_DIR:-$ROOT_DIR/office-runtime-bundle/bangalore-benchmark-103}"
FAILURES=0

check() {
  local label="$1"
  shift
  if "$@"; then
    printf '[PASS] %s\n' "$label"
  else
    printf '[FAIL] %s\n' "$label"
    FAILURES=$((FAILURES + 1))
  fi
}

cache_ready() {
  test -d "$CACHE_DIR" && find "$CACHE_DIR" -maxdepth 1 -type f | grep -q .
}

osrm_ready() {
  test -d "$OSRM_DIR" && find "$OSRM_DIR" -maxdepth 1 \( -name '*.osrm' -o -name '*.osrm.partition' -o -name '*.osrm.mldgr' -o -name '*.osrm.hsgr' \) | grep -q .
}

bundle_ready() {
  local bundle_root="$RUNTIME_BUNDLE_DIR"
  local cache_root="$bundle_root/network-optimizer/cache"
  local osrm_root="$bundle_root/osrm-data"
  if test -d "$cache_root" && find "$cache_root" -maxdepth 1 -type f | grep -q . &&
     test -d "$osrm_root" && find "$osrm_root" -maxdepth 1 \( -name '*.osrm' -o -name '*.osrm.partition' -o -name '*.osrm.mldgr' -o -name '*.osrm.hsgr' \) | grep -q .; then
    return 0
  fi
  test -f "$bundle_root/network-optimizer-cache.tar.gz" &&
  test -f "$bundle_root/osrm-data.tar.gz"
}

cache_or_bundle_ready() {
  cache_ready || bundle_ready
}

osrm_or_bundle_ready() {
  osrm_ready || bundle_ready
}

osrm_graph_consistent_if_present() {
  ! test -d "$OSRM_DIR" || osrm_ready
}

check "python3 available" command -v python3
check "repo-local cache ready or restorable bundle present" cache_or_bundle_ready
check "repo-local osrm-data ready or restorable bundle present" osrm_or_bundle_ready
check "repo-local OSRM graph present when osrm-data exists" osrm_graph_consistent_if_present
check "either docker or native osrm-routed available" bash -c "command -v docker >/dev/null 2>&1 || command -v osrm-routed >/dev/null 2>&1"
check "required Python packages import" python3 -c "import pandas, numpy, openpyxl, scipy, urllib3"
check "server.py compiles" env PYTHONPYCACHEPREFIX=/tmp/pycache python3 -m py_compile "$ROOT_DIR/network-optimizer/server.py"
check "daily demand file present" test -f "$ROOT_DIR/daily_demand_aggregated.csv"
check "103 fixed store file present" test -f "$ROOT_DIR/Store details - 103 old stores.csv"
check "151 store/polygon file present" test -f "$ROOT_DIR/Store details - 151 polygons with stores.csv"

if ! test -f "$ROOT_DIR/benchmark_103_store_metadata.csv" &&
   ! test -f "$ROOT_DIR/benchmark_103_store_sizes.csv" &&
   ! test -f "$ROOT_DIR/analysis/benchmark_103_store_metadata.csv" &&
   ! test -f "$ROOT_DIR/analysis/benchmark_103_store_sizes.csv"; then
  echo "[WARN] benchmark_103 store size metadata not found."
  echo "       Fixed-store Super eligibility (>4500 sq ft) will stay inactive until you add it."
fi

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo "Office demo preflight passed."
else
  echo "Office demo preflight failed with $FAILURES issue(s)."
  exit 1
fi
