#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="${BASE_URL:-http://127.0.0.1:5050}"
ORDERS_FILE="${ORDERS_FILE:-$ROOT_DIR/daily_demand_aggregated.csv}"
STORES_FILE="${STORES_FILE:-$ROOT_DIR/Store details - 151 polygons with stores.csv}"
FIXED_STORE_MODE="${FIXED_STORE_MODE:-benchmark_103}"
EXACT_GRAPH_MAX_RADIUS_KM="${EXACT_GRAPH_MAX_RADIUS_KM:-10.0}"
EXACT_CANDIDATE_CAP="${EXACT_CANDIDATE_CAP:-1200}"
EXACT_MODEL_CANDIDATE_CAP="${EXACT_MODEL_CANDIDATE_CAP:-600}"
MINI_DS_RADIUS="${MINI_DS_RADIUS:-1.0}"
STANDARD_DS_RADIUS="${STANDARD_DS_RADIUS:-3.0}"
STANDARD_EXCEPTION_RADIUS_KM="${STANDARD_EXCEPTION_RADIUS_KM:-5.0}"
SUPER_DS_RADIUS="${SUPER_DS_RADIUS:-5.5}"
BENCHMARK_NEAR_FULL_COVERAGE_PCT="${BENCHMARK_NEAR_FULL_COVERAGE_PCT:-99.7}"

echo "==> Loading orders from: $ORDERS_FILE"
curl -s "$BASE_URL/api/load-local-orders" \
  -H 'Content-Type: application/json' \
  -d "{\"filepath\":\"$ORDERS_FILE\"}"
echo

echo "==> Loading stores from: $STORES_FILE"
curl -s "$BASE_URL/api/load-local-stores" \
  -H 'Content-Type: application/json' \
  -d "{\"filepath\":\"$STORES_FILE\"}"
echo

echo "==> Starting demo_fast exact benchmark"
curl -s "$BASE_URL/api/optimize-exact-benchmark" \
  -H 'Content-Type: application/json' \
  -d "{
    \"exact_benchmark_profile\":\"demo_fast\",
    \"fixed_store_mode\":\"$FIXED_STORE_MODE\",
    \"exact_graph_max_radius_km\":$EXACT_GRAPH_MAX_RADIUS_KM,
    \"exact_candidate_cap\":$EXACT_CANDIDATE_CAP,
    \"exact_model_candidate_cap\":$EXACT_MODEL_CANDIDATE_CAP,
    \"mini_ds_radius\":$MINI_DS_RADIUS,
    \"standard_ds_radius\":$STANDARD_DS_RADIUS,
    \"standard_exception_radius_km\":$STANDARD_EXCEPTION_RADIUS_KM,
    \"super_ds_radius\":$SUPER_DS_RADIUS,
    \"benchmark_near_full_coverage_pct\":$BENCHMARK_NEAR_FULL_COVERAGE_PCT
  }"
echo

echo "==> Poll with:"
echo "curl -s $BASE_URL/api/status"
