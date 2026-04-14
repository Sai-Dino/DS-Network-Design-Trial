#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OSRM_DIR="${OSRM_DATA_DIR:-$ROOT_DIR/osrm-data}"
CACHE_DIR="$ROOT_DIR/network-optimizer/cache"
RUNTIME_BUNDLE_DIR="${OFFICE_RUNTIME_BUNDLE_DIR:-$ROOT_DIR/office-runtime-bundle/bangalore-benchmark-103}"
ACTIVE_RUNTIME_MANIFEST_PATH="${ACTIVE_RUNTIME_MANIFEST_PATH:-$ROOT_DIR/.office-runtime-active-manifest.json}"
BUNDLE_RUNTIME_MANIFEST_PATH="${BUNDLE_RUNTIME_MANIFEST_PATH:-$RUNTIME_BUNDLE_DIR/office-runtime-manifest.json}"
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

runtime_manifest_present() {
  test -f "$ACTIVE_RUNTIME_MANIFEST_PATH" || test -f "$BUNDLE_RUNTIME_MANIFEST_PATH"
}

active_runtime_manifest_path() {
  if test -f "$ACTIVE_RUNTIME_MANIFEST_PATH"; then
    printf '%s\n' "$ACTIVE_RUNTIME_MANIFEST_PATH"
  else
    printf '%s\n' "$BUNDLE_RUNTIME_MANIFEST_PATH"
  fi
}

runtime_manifest_valid() {
  local manifest_path
  manifest_path="$(active_runtime_manifest_path)"
  python3 - <<'PY' "$manifest_path" "$ROOT_DIR"
import json
import os
import subprocess
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
root = Path(sys.argv[2])
if not manifest_path.is_file():
    raise SystemExit(1)

payload = json.loads(manifest_path.read_text(encoding='utf-8'))
if payload.get('manifest_version') != 2:
    raise SystemExit(1)
if payload.get('profile') != 'bangalore-benchmark-103':
    raise SystemExit(1)
expected = payload.get('optimizer_profile') or payload.get('expected_settings') or {}
required = {
    'fixed_store_mode': 'benchmark_103',
    'standard_radius_km': 3.0,
    'super_radius_km': 5.5,
    'business_target_coverage_pct': 99.7,
    'exact_candidate_cap': 3000,
    'exact_graph_max_radius_km': 6.0,
    'fixed_super_min_sqft': 4500,
}
for key, value in required.items():
    if expected.get(key) != value:
        raise SystemExit(1)

allow_mismatch = False
if str(os.environ.get('OFFICE_RUNTIME_ALLOW_COMMIT_MISMATCH', '0')).strip().lower() in {'1', 'true', 'yes', 'y', 'on'}:
    allow_mismatch = True

if not allow_mismatch:
    try:
        current_commit = subprocess.check_output(
            ['git', '-C', str(root), 'rev-parse', '--short', 'HEAD'],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        current_commit = ''
    source_commit = str(payload.get('source_commit') or '').strip()
    if current_commit and source_commit and current_commit != source_commit:
        raise SystemExit(1)
PY
}

osrm_graph_consistent_if_present() {
  ! test -d "$OSRM_DIR" || osrm_ready
}

fixed_store_metadata_ready() {
  test -f "$ROOT_DIR/benchmark_103_store_metadata.csv" ||
  test -f "$ROOT_DIR/benchmark_103_store_sizes.csv" ||
  test -f "$ROOT_DIR/analysis/benchmark_103_store_metadata.csv" ||
  test -f "$ROOT_DIR/analysis/benchmark_103_store_sizes.csv"
}

check "python3 available" command -v python3
check "repo-local cache ready or restorable bundle present" cache_or_bundle_ready
check "repo-local osrm-data ready or restorable bundle present" osrm_or_bundle_ready
check "repo-local OSRM graph present when osrm-data exists" osrm_graph_consistent_if_present
check "runtime manifest present" runtime_manifest_present
check "runtime manifest matches Bangalore benchmark_103 office profile" runtime_manifest_valid
check "either docker or native osrm-routed available" bash -c "command -v docker >/dev/null 2>&1 || command -v osrm-routed >/dev/null 2>&1"
check "required Python packages import" python3 -c "import pandas, numpy, openpyxl, scipy, urllib3"
check "server.py compiles" env PYTHONPYCACHEPREFIX=/tmp/pycache python3 -m py_compile "$ROOT_DIR/network-optimizer/server.py"
check "daily demand file present" test -f "$ROOT_DIR/daily_demand_aggregated.csv"
check "103 fixed store file present" test -f "$ROOT_DIR/Store details - 103 old stores.csv"
check "151 store/polygon file present" test -f "$ROOT_DIR/Store details - 151 polygons with stores.csv"
check "benchmark_103 fixed-store Super metadata present" fixed_store_metadata_ready

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo "Office demo preflight passed."
else
  echo "Office demo preflight failed with $FAILURES issue(s)."
  exit 1
fi
