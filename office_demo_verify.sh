#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OSRM_DIR="${OSRM_DATA_DIR:-$ROOT_DIR/osrm-data}"
CACHE_DIR="$ROOT_DIR/network-optimizer/cache"
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

check "python3 available" command -v python3
check "repo-local cache directory present" test -d "$CACHE_DIR"
check "repo-local osrm-data directory present" test -d "$OSRM_DIR"
check "repo-local OSRM graph present" bash -c "find '$OSRM_DIR' -maxdepth 1 \\( -name '*.osrm' -o -name '*.osrm.partition' -o -name '*.osrm.mldgr' -o -name '*.osrm.hsgr' \\) | grep -q ."
check "either docker or native osrm-routed available" bash -c "command -v docker >/dev/null 2>&1 || command -v osrm-routed >/dev/null 2>&1"
check "required Python packages import" python3 -c "import pandas, numpy, openpyxl, scipy, urllib3"
check "server.py compiles" python3 -m py_compile "$ROOT_DIR/network-optimizer/server.py"

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo "Office demo preflight passed."
else
  echo "Office demo preflight failed with $FAILURES issue(s)."
  exit 1
fi
