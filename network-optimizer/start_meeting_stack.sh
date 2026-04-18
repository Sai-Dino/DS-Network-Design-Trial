#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
OSRM_URL="http://127.0.0.1:5001"
mkdir -p "$LOG_DIR"

check_port() {
  local port="$1"
  lsof -iTCP:"$port" -sTCP:LISTEN -n -P 2>/dev/null || true
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-20}"
  local delay_s="${3:-1}"
  local i
  for ((i=1; i<=attempts; i++)); do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay_s"
  done
  return 1
}

echo "Checking current listeners..."
echo "--- 5001 ---"
check_port 5001
echo "--- 5050 ---"
check_port 5050

if ! lsof -iTCP:5001 -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  echo "Starting OSRM on port 5001..."
  (
    cd "$SCRIPT_DIR"
    OSRM_PORT=5001 ./start_osrm.sh
  )
else
  echo "OSRM already listening on 5001."
fi

if ! lsof -iTCP:5050 -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  echo "Starting optimizer on port 5050..."
  (
    cd "$SCRIPT_DIR"
    nohup env OSRM_URL="$OSRM_URL" python3 -u server.py >"$LOG_DIR/server-5050.log" 2>&1 &
  )
  if ! wait_for_http "http://127.0.0.1:5050/api/status" 20 1; then
    echo "WARNING: optimizer did not answer on /api/status after startup. Check $LOG_DIR/server-5050.log"
  fi
else
  echo "Optimizer already listening on 5050."
fi

if wait_for_http "http://127.0.0.1:5050/api/status" 5 1; then
  result_status="$(curl -s http://127.0.0.1:5050/api/result | jq -r '.result_contract // empty' 2>/dev/null || true)"
  if [[ -z "$result_status" ]]; then
    echo "Restoring latest Bangalore 103 decision packet..."
    curl -s http://127.0.0.1:5050/api/load-latest-decision-packet | jq '.' || true
  fi
fi

echo
echo "Current status:"
check_port 5001
check_port 5050
curl -s http://127.0.0.1:5050/api/status | jq '{osrm_available,data_loaded,optimization_core_ready,optimization_deferred_ready,result_summary}' || true
