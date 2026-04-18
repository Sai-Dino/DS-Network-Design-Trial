#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="${BASE_URL:-http://127.0.0.1:5050}"
ORDERS_FILE="${ORDERS_FILE:-$ROOT_DIR/daily_demand_aggregated.csv}"
STORES_FILE="${STORES_FILE:-$ROOT_DIR/Store details - 151 polygons with stores.csv}"

# Anchor to the historical benchmark family:
# - current demand
# - 151-polygon scope
# - old 103 exact fixed stores
# - hybrid coverage
# - rescue-first / exceptions-enabled live flow
FIXED_STORE_MODE="${FIXED_STORE_MODE:-benchmark_103}"
EXACT_GRAPH_MAX_RADIUS_KM="${EXACT_GRAPH_MAX_RADIUS_KM:-10.0}"
EXACT_CANDIDATE_CAP="${EXACT_CANDIDATE_CAP:-5000}"

# Current business-rule overrides layered on top of that family.
MINI_DS_RADIUS="${MINI_DS_RADIUS:-1.5}"
STANDARD_DS_RADIUS="${STANDARD_DS_RADIUS:-3.0}"
STANDARD_EXCEPTION_RADIUS_KM="${STANDARD_EXCEPTION_RADIUS_KM:-5.0}"
SUPER_DS_RADIUS="${SUPER_DS_RADIUS:-6.0}"
FIXED_SUPER_MIN_SQFT="${FIXED_SUPER_MIN_SQFT:-4000}"

# Stay close to the saved world-103 baseline first.
MEETING_FAST_TARGET_COVERAGE_PCT="${MEETING_FAST_TARGET_COVERAGE_PCT:-99.6}"
MEETING_CORE_PUBLISH_COVERAGE_PCT="${MEETING_CORE_PUBLISH_COVERAGE_PCT:-99.6}"
STANDARD_RESCUE_HANDOVER_COVERAGE_PCT="${STANDARD_RESCUE_HANDOVER_COVERAGE_PCT:-99.6}"
BUSINESS_TARGET_COVERAGE_PCT="${BUSINESS_TARGET_COVERAGE_PCT:-99.6}"
MEETING_FAST_MAX_STANDARD_GAP_FILL_SITES="${MEETING_FAST_MAX_STANDARD_GAP_FILL_SITES:-40}"
STANDARD_RESCUE_OPEN_PENALTY_PER_DAY="${STANDARD_RESCUE_OPEN_PENALTY_PER_DAY:-25000}"
STANDARD_RESCUE_SEED_TOP_K="${STANDARD_RESCUE_SEED_TOP_K:-8}"
EXCEPTION_FIRST_LIVE_RESCUE_SEED_TOP_K="${EXCEPTION_FIRST_LIVE_RESCUE_SEED_TOP_K:-6}"
MEETING_FAST_OVERRIDE_TOP_K="${MEETING_FAST_OVERRIDE_TOP_K:-80}"
EXCEPTION_FIRST_LIVE_OVERRIDE_TOP_K="${EXCEPTION_FIRST_LIVE_OVERRIDE_TOP_K:-32}"
EXCEPTION_FIRST_LIVE_MAX_SELECTED="${EXCEPTION_FIRST_LIVE_MAX_SELECTED:-32}"
EXCEPTION_FIRST_LIVE_MIN_COVERAGE_PCT="${EXCEPTION_FIRST_LIVE_MIN_COVERAGE_PCT:-99.7}"
EXCEPTION_FIRST_LIVE_MAX_EXTRA_PHYSICAL_SITES="${EXCEPTION_FIRST_LIVE_MAX_EXTRA_PHYSICAL_SITES:-6}"

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

echo "==> Starting old-103 benchmark-family run with updated Mini/Super rules"
curl -s "$BASE_URL/api/optimize-constrained" \
  -H 'Content-Type: application/json' \
  -d "{
    \"fixed_store_mode\":\"$FIXED_STORE_MODE\",
    \"meeting_fast_mode\":true,
    \"meeting_fast_publish_backbone_only\":false,
    \"coverage_mode\":\"hybrid\",
    \"super_role\":\"overlay_core_only\",
    \"super_tail_preference\":\"prefer_standard\",
    \"mini_ds_radius\":$MINI_DS_RADIUS,
    \"standard_ds_radius\":$STANDARD_DS_RADIUS,
    \"standard_exception_radius_km\":$STANDARD_EXCEPTION_RADIUS_KM,
    \"super_ds_radius\":$SUPER_DS_RADIUS,
    \"fixed_super_min_sqft\":$FIXED_SUPER_MIN_SQFT,
    \"exact_graph_max_radius_km\":$EXACT_GRAPH_MAX_RADIUS_KM,
    \"exact_candidate_cap\":$EXACT_CANDIDATE_CAP,
    \"business_target_coverage_pct\":$BUSINESS_TARGET_COVERAGE_PCT,
    \"meeting_core_publish_coverage_pct\":$MEETING_CORE_PUBLISH_COVERAGE_PCT,
    \"meeting_fast_target_coverage_pct\":$MEETING_FAST_TARGET_COVERAGE_PCT,
    \"standard_rescue_handover_coverage_pct\":$STANDARD_RESCUE_HANDOVER_COVERAGE_PCT,
    \"meeting_fast_max_standard_gap_fill_sites\":$MEETING_FAST_MAX_STANDARD_GAP_FILL_SITES,
    \"standard_rescue_open_penalty_per_day\":$STANDARD_RESCUE_OPEN_PENALTY_PER_DAY,
    \"standard_rescue_seed_top_k\":$STANDARD_RESCUE_SEED_TOP_K,
    \"exception_first_live_rescue_seed_top_k\":$EXCEPTION_FIRST_LIVE_RESCUE_SEED_TOP_K,
    \"meeting_fast_override_top_k\":$MEETING_FAST_OVERRIDE_TOP_K,
    \"exception_first_live_override_top_k\":$EXCEPTION_FIRST_LIVE_OVERRIDE_TOP_K,
    \"exception_first_live_max_selected\":$EXCEPTION_FIRST_LIVE_MAX_SELECTED,
    \"exception_first_live_min_coverage_pct\":$EXCEPTION_FIRST_LIVE_MIN_COVERAGE_PCT,
    \"exception_first_live_max_extra_physical_sites\":$EXCEPTION_FIRST_LIVE_MAX_EXTRA_PHYSICAL_SITES
  }"
echo

echo "==> Poll with:"
echo "curl -s $BASE_URL/api/status"
