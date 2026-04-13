#!/usr/bin/env python3
"""
End-to-end test: Run the network optimizer on real data with real OSRM.
=====================================================================
Usage:
    cd /path/to/DS_Network_Design_Trial/network-optimizer
    python3 ../run_optimization_test.py

Prerequisites:
    - OSRM server running at http://localhost:5000 (India map)
    - daily_demand_aggregated.csv in parent directory
    - stores_with_polygons_all (1).csv in parent directory

This script:
  1. Loads demand data → grid cells
  2. Loads 151 store polygons and fixed live stores from the store status file
  3. Runs baseline evaluation (representative-day demand vs fixed live network)
  4. Runs the Bangalore multilayer reset planner (Standard / Mini / Super)
  5. Evaluates proposed network (OSRM)
  6. Prints full comparison report
  7. Saves results to JSON + CSV

NO Haversine fallbacks. Every distance = OSRM Table API road distance.
"""

import os
import sys
import json
import time
import logging

# Ensure we can import from network-optimizer/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OPTIMIZER_DIR = os.path.join(SCRIPT_DIR, 'network-optimizer')
sys.path.insert(0, OPTIMIZER_DIR)
os.chdir(OPTIMIZER_DIR)  # geometry_core imports need this

import numpy as np
import pandas as pd

# Import the optimizer engine
import server as opt

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger('run_test')

# ============================================================================
# FILE PATHS
# ============================================================================
ORDER_CSV = os.path.join(SCRIPT_DIR, 'daily_demand_aggregated.csv')
FALLBACK_ORDER_CSV = '/Users/thota/Downloads/daily_demand_aggregated.csv'
STORE_CSV = os.path.join(SCRIPT_DIR, 'stores_with_polygons_all (1).csv')
FALLBACK_STORE_CSV = '/Users/thota/Downloads/stores_with_polygons_all (1).csv'
OLD_FIXED_STORE_CSV = os.path.join(SCRIPT_DIR, 'Store details - 103 old stores.csv')
FALLBACK_OLD_FIXED_STORE_CSV = '/Users/thota/Downloads/DS-Network-Design-Trial-main/Store details - 103 old stores.csv'
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'optimization_results')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================================
# STEP 0: Verify OSRM
# ============================================================================
def verify_osrm():
    logger.info("=" * 70)
    logger.info("STEP 0: Verifying OSRM connectivity")
    logger.info("=" * 70)
    osrm_url = os.environ.get('OSRM_URL', 'http://localhost:5000')
    logger.info(f"OSRM URL: {osrm_url}")
    opt.OSRM_BASE_URL = osrm_url
    logger.info(f"OSRM_WORKERS:    {opt.OSRM_WORKERS}")
    logger.info(f"OSRM_BATCH_SIZE: {opt.OSRM_BATCH_SIZE}")

    if not opt.check_osrm():
        logger.error("OSRM is NOT available. Aborting. No fallbacks allowed.")
        logger.error(f"Make sure OSRM is running at {osrm_url}")
        sys.exit(1)

    opt.state.osrm_available = True
    logger.info("OSRM is UP and responding correctly.")

    # Smoke test: known Bangalore route
    try:
        dm = opt._osrm_table_batch(
            [(12.9716, 77.5946)],  # MG Road
            [(12.9352, 77.6245)]   # Koramangala
        )
        d_km = dm[0][0]
        logger.info(f"Smoke test: MG Road → Koramangala = {d_km:.2f} km (road)")
        if d_km < 1.0 or d_km > 20.0:
            logger.warning(f"Distance seems off ({d_km:.2f} km). Check OSRM data coverage.")
    except Exception as e:
        logger.error(f"OSRM smoke test failed: {e}")
        sys.exit(1)

    return True


# ============================================================================
# STEP 1: Load demand data
# ============================================================================
def load_demand():
    logger.info("=" * 70)
    logger.info("STEP 1: Loading demand data")
    logger.info("=" * 70)
    order_csv_path = ORDER_CSV if os.path.isfile(ORDER_CSV) else FALLBACK_ORDER_CSV
    logger.info(f"File: {order_csv_path}")

    if not os.path.isfile(order_csv_path):
        logger.error(f"Order CSV not found: {order_csv_path}")
        sys.exit(1)

    file_size_mb = os.path.getsize(order_csv_path) / (1024 * 1024)
    logger.info(f"File size: {file_size_mb:.1f} MB")

    t0 = time.time()
    mapping = opt.load_order_csv(order_csv_path)
    elapsed = time.time() - t0

    grid = opt.state.grid_data
    logger.info(f"Column mapping: {mapping}")
    logger.info(f"Total orders: {opt.state.total_orders:,}")
    logger.info(f"Demand input mode: {opt.state.demand_input_mode}")
    logger.info(f"Unique dates: {opt.state.unique_dates}")
    logger.info(f"Orders/day: {opt.state.orders_per_day:,}")
    logger.info(f"Grid cells: {len(grid):,}")
    logger.info(f"Load time: {elapsed:.1f}s")

    return grid


# ============================================================================
# STEP 2: Load store polygons + fixed live Standard sites
# ============================================================================
def load_stores():
    logger.info("=" * 70)
    logger.info("STEP 2: Loading store polygons and live/fixed sites")
    logger.info("=" * 70)
    store_csv_path = STORE_CSV if os.path.isfile(STORE_CSV) else FALLBACK_STORE_CSV
    logger.info(f"Preferred file: {store_csv_path}")

    if not os.path.isfile(store_csv_path):
        logger.error(f"Store file not found: {store_csv_path}")
        sys.exit(1)

    stores = opt.load_store_xlsx(store_csv_path)
    fixed_store_mode = os.environ.get('FIXED_STORE_SOURCE_MODE', 'old_103_exact')
    if fixed_store_mode == 'old_103_exact':
        old_fixed_path = OLD_FIXED_STORE_CSV if os.path.isfile(OLD_FIXED_STORE_CSV) else FALLBACK_OLD_FIXED_STORE_CSV
        if not os.path.isfile(old_fixed_path):
            logger.error(f"Old fixed-store file not found: {old_fixed_path}")
            sys.exit(1)
        logger.info(f"Applying fixed-store override from old 103-store file: {old_fixed_path}")
        stores = opt.override_fixed_store_locations(old_fixed_path, source_mode='old_103_exact_locations')
    elif fixed_store_mode in {'store_scope_file', '151_live'}:
        logger.info("Using fixed live stores directly from the 151 polygon scope file.")
    else:
        logger.warning(f"Unknown FIXED_STORE_SOURCE_MODE={fixed_store_mode!r}; falling back to 151 scope-file live stores.")

    logger.info(f"Live store detection: {opt.state.live_store_detection_mode}")
    logger.info(f"Fixed store source: {opt.state.fixed_store_source_mode}")
    logger.info(f"Loaded {len(stores)} fixed live stores")
    logger.info(f"Loaded {len(opt.state.business_regions)} business polygons")
    logger.info(f"Loaded {len(opt.state.excluded_islands)} excluded island polygons")

    # Print top 10 stores by orders
    top_stores = sorted(stores, key=lambda s: s['orders_per_day'], reverse=True)[:10]
    logger.info("Top 10 stores by orders/day:")
    for s in top_stores:
        logger.info(f"  {s['id']}: {s['orders_per_day']:,} orders/day, ({s['lat']:.4f}, {s['lon']:.4f})")

    total_store_orders = sum(s['orders_per_day'] for s in stores)
    logger.info(f"Total orders/day across all stores: {total_store_orders:,}")

    return stores


# ============================================================================
# STEP 3: Run optimization (placement + evaluation)
# ============================================================================
def run_optimization(grid_data, existing_stores):
    logger.info("=" * 70)
    logger.info("STEP 3: Running 3-tier optimization (100% OSRM)")
    logger.info("=" * 70)

    # ── MINI + STANDARD CUSTOMER COVERAGE + SUPER OVERLAY ──────────
    # Customer orders must be covered by Mini / Standard only.
    # Super is an overlay tier for core-city coverage and is not used
    # for normal order assignment in overlay-core mode.
    #
    #   • Mini DS  — 1.5 km radius, min 300 orders/day, cycle (₹20+6d)
    #   • Standard — 3.0 km radius, min 300 orders/day, bike  (₹29+9d)
    #   • Super DS — 10.0 km overlay, core-city coverage only
    # ──────────────────────────────────────────────────────────────────
    params = {
        # Cost model
        'base_cost': 29,
        'variable_rate': 9,
        'use_tiered_costs': True,

        # Mini DS (4k SKUs, cycle delivery)
        'mini_base_cost': 20,
        'mini_variable_rate': 6,
        'mini_ds_radius': 1.5,
        'mini_ds_min_orders_per_day': 300,
        'mini_ds_max_orders_per_day': 10000,
        'mini_ds_max': 300,
        'mini_density_radius_km': 1.0,
        'mini_density_min_orders_per_day': 400,

        # Standard DS (15k SKUs, bike delivery)
        'standard_base_cost': 29,
        'standard_variable_rate': 9,
        'standard_ds_radius': 3.0,
        'standard_ds_min_orders_per_day': 300,
        'standard_ds_max_orders_per_day': 15000,
        # max raised to 500: previous run hit cap=300 during coverage fill,
        # forcing 118 tiny Mini satellites. Standard's 3km radius covers
        # 4x the area of Mini's 1.5km, so fewer hubs needed in outer metro.
        'standard_ds_max': 500,

        # Super DS — overlay only (not normal customer-serving tier)
        'super_base_cost': 29,
        'super_variable_rate': 9,
        'super_fixed_penalty_per_order': 5,
        'super_ds_radius': 10.0,
        'super_ds_min_orders_per_day': 0,
        'super_ds_max_orders_per_day': 999999,
        'super_ds_max': 300,
        'super_role': 'overlay_core_only',

        # Coverage — every order must be within Mini or Standard radius
        'require_full_tier_coverage': True,
        'mini_coverage_fill': False,
        'radius_override_candidate_tiers': ['standard'],
    }

    # --- PLACEMENT ---
    logger.info("Starting 3-tier overlapping placement (all OSRM)...")
    logger.info(f"Parameters: {json.dumps({k: v for k, v in params.items() if not k.startswith('super_core')}, indent=2)}")

    def progress_cb(msg):
        logger.info(f"  [progress] {msg}")

    t0 = time.time()
    layout = opt.place_overlapping_tier_hubs(grid_data, params, progress_cb=progress_cb)
    placement_time = time.time() - t0

    mini_ds = layout['mini_ds']
    standard_ds = layout['standard_ds']
    super_ds = layout['super_ds']

    logger.info(f"Placement complete in {placement_time:.1f}s")
    logger.info(f"  Mini DS:     {len(mini_ds)} hubs")
    logger.info(f"  Standard DS: {len(standard_ds)} hubs")
    logger.info(f"  Super DS:    {len(super_ds)} hubs")
    logger.info(f"  Total proposed: {len(mini_ds) + len(standard_ds) + len(super_ds)} hubs")
    logger.info(f"  Coverage complete: {layout.get('coverage_complete', 'N/A')}")
    logger.info(f"  Coverage satellites added: {layout.get('coverage_satellites_added', 0)}")

    # --- EVALUATION ---
    logger.info("")
    logger.info("Evaluating current vs proposed network (all OSRM)...")
    t0 = time.time()
    metrics = opt.evaluate_network(
        grid_data, existing_stores, mini_ds, standard_ds, super_ds, params,
        progress_cb=progress_cb
    )
    eval_time = time.time() - t0
    logger.info(f"Evaluation complete in {eval_time:.1f}s")

    return layout, params, metrics, placement_time, eval_time


# ============================================================================
# STEP 4: Print and save results
# ============================================================================
def print_results(layout, params, metrics, existing_stores, placement_time, eval_time):
    logger.info("=" * 70)
    logger.info("RESULTS: Baseline vs Optimized Network")
    logger.info("=" * 70)

    mini_ds = layout['mini_ds']
    standard_ds = layout['standard_ds']
    super_ds = layout['super_ds']
    total_proposed = len(mini_ds) + len(standard_ds) + len(super_ds)

    print("\n" + "=" * 70)
    print("  NETWORK OPTIMIZATION RESULTS (100% OSRM Road Distances)")
    print("=" * 70)

    print(f"\n--- NETWORK SIZE ---")
    print(f"  Current hubs:    {len(existing_stores)}")
    print(f"  Proposed hubs:   {total_proposed}")
    print(f"    Mini DS (4k):    {len(mini_ds)}")
    print(f"    Standard (15k):  {len(standard_ds)}")
    print(f"    Super (30k):     {len(super_ds)}")

    print(f"\n--- COST COMPARISON ---")
    print(f"  Current avg cost/order:   ₹{metrics['current_avg_cost']:.2f}")
    print(f"  Proposed avg cost/order:  ₹{metrics['proposed_avg_cost']:.2f}")
    print(f"  Cost reduction:           {metrics['pct_cost_reduction']:.1f}%")

    print(f"\n--- DISTANCE COMPARISON ---")
    print(f"  Current avg distance:     {metrics['current_avg_dist']:.3f} km")
    if metrics['proposed_avg_dist'] is not None:
        print(f"  Proposed avg distance:    {metrics['proposed_avg_dist']:.3f} km (served orders only)")
    if metrics.get('proposed_mean_dist_unweighted') is not None:
        print(f"  Proposed mean (unwtd):    {metrics['proposed_mean_dist_unweighted']:.3f} km")

    print(f"\n--- SAVINGS ---")
    print(f"  Orders/day:               {metrics['total_orders_per_day']:,}")
    print(f"  Daily savings:            ₹{metrics['daily_savings']:,.0f}")
    print(f"  Monthly savings:          ₹{metrics['monthly_savings']:,.0f}")

    print(f"\n--- COVERAGE ---")
    print(f"  Coverage complete:        {layout.get('coverage_complete', 'N/A')}")
    print(f"  Coverage satellites:      {layout.get('coverage_satellites_added', 0)}")
    print(f"  Orders within Mini radius: {metrics.get('pct_orders_within_mini_service_km', 'N/A')}%")
    print(f"  Orders outside all radii: {metrics.get('pct_order_weight_outside_tier_radii', 'N/A')}%")

    print(f"\n--- DISTANCE DISTRIBUTION (Proposed, served orders) ---")
    hist = metrics.get('distance_histogram', {})
    for bucket, count in hist.items():
        bar = '█' * int(count / max(max(hist.values(), default=1), 1) * 40)
        print(f"  {bucket:>30s}: {count:>10,.0f} orders/day  {bar}")

    print(f"\n--- PERFORMANCE ---")
    print(f"  Placement time:  {placement_time:.1f}s")
    print(f"  Evaluation time: {eval_time:.1f}s")
    print(f"  Distance source: {metrics.get('distance_source', 'N/A')}")

    print(f"\n--- TIER PARAMETERS USED ---")
    tier_keys = ['mini_ds_radius', 'mini_base_cost', 'mini_variable_rate',
                 'mini_ds_min_orders_per_day', 'mini_ds_max_orders_per_day',
                 'standard_ds_radius', 'standard_base_cost', 'standard_variable_rate',
                 'standard_ds_min_orders_per_day', 'standard_ds_max_orders_per_day',
                 'super_ds_radius', 'super_base_cost', 'super_variable_rate',
                 'super_ds_min_orders_per_day', 'super_ds_max_orders_per_day']
    for k in tier_keys:
        print(f"  {k}: {params.get(k, 'N/A')}")

    print(f"\n{metrics.get('metrics_note', '')}")
    print("=" * 70)

    # --- Save detailed results ---

    # 1. Full metrics JSON
    results_json = {
        'metrics': metrics,
        'params': {k: v for k, v in params.items() if not isinstance(v, (bytes,))},
        'placement': {
            'mini_count': len(mini_ds),
            'standard_count': len(standard_ds),
            'super_count': len(super_ds),
            'total': total_proposed,
            'coverage_complete': layout.get('coverage_complete'),
            'coverage_satellites': layout.get('coverage_satellites_added', 0),
        },
        'current_network': {
            'hub_count': len(existing_stores),
        },
        'timing': {
            'placement_seconds': round(placement_time, 1),
            'evaluation_seconds': round(eval_time, 1),
        }
    }

    json_path = os.path.join(OUTPUT_DIR, 'optimization_results.json')
    with open(json_path, 'w') as f:
        json.dump(results_json, f, indent=2, default=str)
    logger.info(f"Saved metrics: {json_path}")

    # 2. Proposed hub locations CSV
    rows = []
    for tier_name, hub_list in [('mini', mini_ds), ('standard', standard_ds), ('super', super_ds)]:
        for i, h in enumerate(hub_list):
            rows.append({
                'tier': tier_name,
                'hub_index': i + 1,
                'lat': h['lat'],
                'lon': h['lon'],
                'orders_per_day': h.get('orders_per_day', 0),
                'radius_km': h.get('radius_km', ''),
                'cells': h.get('cells', ''),
                'selection': h.get('selection', ''),
                'coverage_satellite': h.get('coverage_satellite', False),
            })

    hubs_df = pd.DataFrame(rows)
    hubs_csv_path = os.path.join(OUTPUT_DIR, 'proposed_hubs.csv')
    hubs_df.to_csv(hubs_csv_path, index=False)
    logger.info(f"Saved proposed hubs: {hubs_csv_path}")

    # 3. Current hub locations CSV (for comparison)
    current_rows = [{'hub_id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                     'orders_per_day': s['orders_per_day']}
                    for s in existing_stores]
    current_df = pd.DataFrame(current_rows)
    current_csv_path = os.path.join(OUTPUT_DIR, 'current_hubs.csv')
    current_df.to_csv(current_csv_path, index=False)
    logger.info(f"Saved current hubs: {current_csv_path}")

    return results_json


# ============================================================================
# STEP 5: Constraint-driven optimization (NEW)
# ============================================================================
def run_constrained_optimization(
    grid_data,
    existing_stores,
    target_max_hubs=None,
    target_last_mile_cost=None,
    target_coverage_pct=None,
    search_max_hubs_cap=None,
    param_overrides=None,
):
    """Run the Bangalore multilayer reset planner."""
    logger.info("=" * 70)
    logger.info("STEP 5: Constraint-driven optimization (100% OSRM)")
    logger.info("=" * 70)

    params = {
        # Cost model
        'base_cost': 29,
        'variable_rate': 9,
        'use_tiered_costs': True,

        # Mini DS (4k SKUs, cycle delivery)
        'mini_base_cost': 21,
        'mini_variable_rate': 9,
        'mini_ds_radius': 1.0,
        'mini_ds_min_orders_per_day': 400,
        'mini_ds_max_orders_per_day': 10000,
        'mini_ds_max': 300,
        'mini_density_radius_km': 1.0,
        'mini_density_min_orders_per_day': 400,

        # Standard DS (15k SKUs, bike delivery)
        'standard_base_cost': 29,
        'standard_variable_rate': 9,
        'standard_ds_radius': 3.0,
        'standard_ds_min_orders_per_day': 300,
        'standard_ds_max_orders_per_day': 15000,
        'standard_ds_max': 500,
        'standard_exception_radius_km': 5.0,
        'standard_exception_step_km': 0.5,
        'standard_exception_max_hubs': None,

        # Super DS
        'super_base_cost': 29,
        'super_variable_rate': 9,
        'super_fixed_penalty_per_order': 5,
        'super_ds_radius': 7.0,
        'super_radius_km': 7.0,
        'super_ds_min_orders_per_day': 0,
        'super_ds_max_orders_per_day': 50000,
        'super_ds_max': 300,
        'super_role': 'overlay_core_only',
        'super_infra_penalty_per_day': 0,
    }
    if param_overrides:
        params.update(param_overrides)

    logger.info(
        "Constraints: max_hubs=%s, target_cost=%s, target_coverage_pct=%s, search_max_hubs_cap=%s",
        target_max_hubs, target_last_mile_cost, target_coverage_pct, search_max_hubs_cap
    )
    logger.info(f"Parameters: {json.dumps({k: v for k, v in params.items()}, indent=2, default=str)}")

    def progress_cb(msg):
        logger.info(f"  [progress] {msg}")

    t0 = time.time()
    search_payload = None
    result = opt.optimize_bangalore_multilayer_plan(params, progress_cb=progress_cb)
    elapsed = time.time() - t0

    return result, params, elapsed, search_payload


def print_constrained_results(result, params, existing_stores, elapsed, search_payload=None):
    """Print and save results from constraint-driven optimization."""
    logger.info("=" * 70)
    logger.info("RESULTS: Constraint-Driven Optimization")
    logger.info("=" * 70)

    mini_ds = result['mini_ds']
    standard_ds = result['standard_ds']
    super_ds = result.get('super_ds', [])
    metrics = result['metrics']
    analysis = result.get('analysis', {})
    pockets = result['uncovered_pockets']
    planning_layers = result.get('planning_layers', {})
    total_standard = planning_layers.get('standard', {}).get('total_standard_sites', len(existing_stores) + len(standard_ds))
    total_hubs = len(mini_ds) + len(standard_ds) + len(super_ds)

    print("\n" + "=" * 70)
    print("  BANGALORE MULTI-LAYER RESET RESULTS (100% OSRM)")
    print("=" * 70)

    print(f"\n--- NETWORK SIZE ---")
    print(f"  Fixed existing Standard: {len(existing_stores)}")
    print(f"  New Standard stores:     {len(standard_ds)}")
    print(f"  Exception Standard hubs: {planning_layers.get('standard', {}).get('exception_hub_count', 0)}")
    print(f"  Total Standard network:  {total_standard}")
    print(f"  Mini overlay sites:      {len(mini_ds)}")
    print(f"  Super blanket sites:     {len(super_ds)}")

    print(f"\n--- COVERAGE ---")
    print(f"  Current operational:    {metrics.get('current_operational_coverage_pct', 0):.2f}%")
    print(f"  Current policy:         {metrics.get('current_policy_coverage_pct', 0):.2f}%")
    print(f"  Proposed hard:          {metrics.get('proposed_hard_coverage_pct', metrics['coverage_pct']):.2f}%")
    print(f"  Proposed hybrid:        {metrics.get('proposed_hybrid_coverage_pct', 0):.2f}%")
    print(f"  In-scope orders/day:    {metrics.get('in_scope_orders_per_day', metrics.get('total_orders_per_day', 0)):,.0f}")
    print(f"  Out-of-scope orders/day:{metrics.get('out_of_scope_orders_per_day', 0):,.0f}")
    print(f"  Current policy breach:  {metrics.get('policy_breach_orders_per_day', 0):,.0f}/day")

    print(f"\n--- COST COMPARISON ---")
    print(f"  Current avg cost/order: ₹{metrics['current_avg_cost']:.2f}")
    print(f"  Proposed avg cost/order:₹{metrics['proposed_avg_cost']:.2f}")
    print(f"  Standard-only avg cost: ₹{metrics.get('standard_only_proposed_avg_cost', 0):.2f}")
    print(f"  Cost reduction:         {metrics['pct_cost_reduction']:.1f}%")

    print(f"\n--- DISTANCE COMPARISON ---")
    print(f"  Current avg distance:   {metrics['current_avg_dist']:.3f} km")
    if metrics['proposed_avg_dist'] is not None:
        print(f"  Proposed avg distance:  {metrics['proposed_avg_dist']:.3f} km (served orders only)")

    print(f"\n--- SAVINGS ---")
    print(f"  Orders/day:             {metrics['total_orders_per_day']:,}")
    print(f"  Daily savings:          ₹{metrics['daily_savings']:,.0f}")
    print(f"  Monthly savings:        ₹{metrics['monthly_savings']:,.0f}")

    print(f"\n--- DISTANCE DISTRIBUTION ---")
    hist = metrics.get('distance_histogram', {})
    max_val = max(hist.values(), default=1)
    for bucket, count in hist.items():
        bar = '█' * int(count / max(max_val, 1) * 40)
        print(f"  {bucket:>35s}: {count:>10,.0f} orders/day  {bar}")

    # Uncovered pockets
    if pockets:
        print(f"\n--- UNCOVERED DEMAND POCKETS ({len(pockets)} groups) ---")
        print(f"  {'#':>3s}  {'Lat':>10s}  {'Lon':>10s}  {'Orders/day':>12s}  {'Cells':>6s}")
        print(f"  {'─'*3}  {'─'*10}  {'─'*10}  {'─'*12}  {'─'*6}")
        for i, p in enumerate(pockets[:30]):  # show top 30
            print(f"  {i+1:>3d}  {p['lat']:>10.4f}  {p['lon']:>10.4f}  {p['orders_per_day']:>12,.0f}  {p['num_cells']:>6d}")
        if len(pockets) > 30:
            remaining_orders = sum(p['orders_per_day'] for p in pockets[30:])
            print(f"  ... and {len(pockets) - 30} more pockets ({remaining_orders:,.0f} orders/day)")
        total_pocket_orders = sum(p['orders_per_day'] for p in pockets)
        print(f"\n  Total uncovered: {total_pocket_orders:,.0f} orders/day across {len(pockets)} pockets")
    else:
        print(f"\n--- ALL DEMAND COVERED! No uncovered pockets. ---")

    if analysis.get('recommendations'):
        print(f"\n--- PLANNER NOTES ---")
        for line in analysis['recommendations']:
            print(f"  - {line}")
    if metrics.get('policy_breach_hubs'):
        print(f"\n--- CURRENT POLICY BREACH HUBS ---")
        for hub in metrics['policy_breach_hubs'][:10]:
            print(
                f"  - {hub['hub_id']}: {hub['breach_orders_per_day']:,.0f}/day beyond policy, "
                f"max {hub['max_distance_km']:.2f} km ({hub['max_extra_distance_km']:+.2f} km over)"
            )

    if planning_layers.get('mini'):
        print(f"\n--- MINI OVERLAY ---")
        print(f"  Mini sites:             {planning_layers['mini'].get('site_count', 0)}")
        print(f"  Orders shifted/day:     {planning_layers['mini'].get('orders_shifted_from_standard_per_day', 0):,.0f}")
        print(f"  Cost reduction/order:   ₹{planning_layers['mini'].get('avg_cost_reduction_per_order', 0):.2f}")
    if planning_layers.get('super'):
        print(f"\n--- SUPER BLANKET ---")
        print(f"  Blanket coverage:       {planning_layers['super'].get('blanket_coverage_pct', 0):.2f}%")
        print(f"  Reused fixed Standard:  {planning_layers['super'].get('reused_existing_standard_count', 0)}")
        print(f"  Reused new Standard:    {planning_layers['super'].get('reused_new_standard_count', 0)}")
        print(f"  New Super sites:        {planning_layers['super'].get('new_super_site_count', 0)}")

    print(f"\n--- PERFORMANCE ---")
    print(f"  Total time:     {elapsed:.1f}s")
    print(f"  Distance source: {metrics.get('distance_source', 'N/A')}")
    print("=" * 70)

    # --- Save results ---
    results_json = {
        'metrics': metrics,
        'analysis': analysis,
        'planning_layers': planning_layers,
        'coverage_search': search_payload,
        'params': {k: v for k, v in params.items() if not isinstance(v, (bytes,))},
        'placement': {
            'mini_count': len(mini_ds),
            'standard_count': len(standard_ds),
            'super_count': len(super_ds),
            'total': total_hubs,
        },
        'current_network': {
            'hub_count': len(existing_stores),
        },
        'scope_summary': result.get('scope_summary'),
        'uncovered_pockets': pockets,
        'timing': {
            'total_seconds': round(elapsed, 1),
        },
    }

    json_path = os.path.join(OUTPUT_DIR, 'constrained_optimization_results.json')
    with open(json_path, 'w') as f:
        json.dump(results_json, f, indent=2, default=str)
    logger.info(f"Saved metrics: {json_path}")

    # Proposed hub locations CSV
    rows = []
    for tier_name, hub_list in [('mini', mini_ds), ('standard', standard_ds), ('super', super_ds)]:
        for i, h in enumerate(hub_list):
            rows.append({
                'tier': tier_name,
                'hub_index': i + 1,
                'lat': h['lat'],
                'lon': h['lon'],
                'orders_per_day': h.get('orders_per_day', 0),
                'radius_km': h.get('radius_km', ''),
                'cells': h.get('cells', ''),
            })
    hubs_df = pd.DataFrame(rows)
    hubs_csv_path = os.path.join(OUTPUT_DIR, 'constrained_proposed_hubs.csv')
    hubs_df.to_csv(hubs_csv_path, index=False)
    logger.info(f"Saved proposed hubs: {hubs_csv_path}")

    # Uncovered pockets CSV
    if pockets:
        pockets_df = pd.DataFrame(pockets)
        pockets_csv_path = os.path.join(OUTPUT_DIR, 'uncovered_pockets.csv')
        pockets_df.to_csv(pockets_csv_path, index=False)
        logger.info(f"Saved uncovered pockets: {pockets_csv_path}")

    # Current hubs CSV
    current_rows = [{'hub_id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                     'orders_per_day': s['orders_per_day']}
                    for s in existing_stores]
    current_df = pd.DataFrame(current_rows)
    current_csv_path = os.path.join(OUTPUT_DIR, 'current_hubs.csv')
    current_df.to_csv(current_csv_path, index=False)
    logger.info(f"Saved current hubs: {current_csv_path}")

    return results_json


def run_exact_benchmark_deck(grid_data, existing_stores, param_overrides=None):
    logger.info("=" * 70)
    logger.info("STEP 5: Exact Standard Benchmark Scenario Deck")
    logger.info("=" * 70)

    params = {
        'mini_base_cost': 21,
        'mini_variable_rate': 9,
        'mini_ds_radius': 1.0,
        'mini_density_radius_km': 1.0,
        'mini_density_min_orders_per_day': 400,
        'mini_ds_min_orders_per_day': 400,
        'standard_base_cost': 29,
        'standard_variable_rate': 9,
        'standard_ds_radius': 3.0,
        'standard_exception_radius_km': 5.0,
        'exact_graph_max_radius_km': 10.0,
        'benchmark_near_full_coverage_pct': 99.7,
        'uncovered_pocket_radius_km': 3.0,
        'exact_solver_backend': 'highs',
        'exact_candidate_cap': None,
        'exact_candidate_min_spacing_km': 0.6,
        'exact_graph_cache_enabled': True,
        'exact_graph_site_block_size': 100,
    }
    if param_overrides:
        params.update(param_overrides)
    if str(os.environ.get('EXACT_SKIP_MINI_OVERLAY', '0')).strip().lower() in ('1', 'true', 'yes'):
        params['exact_skip_mini_overlay'] = True
    if str(os.environ.get('EXACT_SKIP_RECOMMENDED_DIAGNOSTICS', '0')).strip().lower() in ('1', 'true', 'yes'):
        params['exact_skip_recommended_diagnostics'] = True

    logger.info(f"Parameters: {json.dumps(params, indent=2, default=str)}")

    def progress_cb(msg):
        logger.info(f"  [progress] {msg}")

    t0 = time.time()
    result = opt.optimize_exact_standard_scenario_deck(params, progress_cb=progress_cb)
    elapsed = time.time() - t0
    return result, params, elapsed


def run_exact_graph_build(param_overrides=None):
    logger.info("=" * 70)
    logger.info("STEP 5: Exact Standard Graph Build")
    logger.info("=" * 70)

    params = {
        'standard_ds_radius': 3.0,
        'standard_exception_radius_km': 5.0,
        'exact_graph_max_radius_km': 10.0,
        'exact_candidate_cap': None,
        'exact_candidate_min_spacing_km': 0.6,
        'exact_graph_cache_enabled': True,
        'exact_graph_site_block_size': 100,
        'exact_graph_checkpoint_every_blocks': 5,
    }
    if param_overrides:
        params.update(param_overrides)

    logger.info(f"Graph build parameters: {json.dumps(params, indent=2, default=str)}")

    def progress_cb(msg):
        logger.info(f"  [progress] {msg}")

    t0 = time.time()
    result = opt.build_exact_standard_graph_cache(params, progress_cb=progress_cb)
    elapsed = time.time() - t0
    result['timing'] = {'total_seconds': round(elapsed, 1)}
    return result, params, elapsed


def run_exact_benchmark_readiness(param_overrides=None):
    logger.info("=" * 70)
    logger.info("STEP 5: Exact Standard Benchmark Readiness")
    logger.info("=" * 70)

    params = {
        'mini_base_cost': 21,
        'mini_variable_rate': 9,
        'mini_ds_radius': 1.0,
        'mini_density_radius_km': 1.0,
        'mini_density_min_orders_per_day': 400,
        'mini_ds_min_orders_per_day': 400,
        'standard_base_cost': 29,
        'standard_variable_rate': 9,
        'standard_ds_radius': 3.0,
        'standard_exception_radius_km': 5.0,
        'exact_graph_max_radius_km': 10.0,
        'standard_min_store_spacing_km': 3.0,
        'benchmark_near_full_coverage_pct': 99.7,
        'exact_solver_backend': 'highs',
        'exact_enable_tiebreak_milps': False,
        'exact_candidate_cap': None,
        'exact_candidate_min_spacing_km': 0.6,
        'exact_graph_cache_enabled': True,
    }
    if param_overrides:
        params.update(param_overrides)

    logger.info(f"Readiness parameters: {json.dumps(params, indent=2, default=str)}")

    def progress_cb(msg):
        logger.info(f"  [progress] {msg}")

    t0 = time.time()
    result = opt.exact_standard_benchmark_readiness_report(params, progress_cb=progress_cb)
    elapsed = time.time() - t0
    result['timing'] = {'total_seconds': round(elapsed, 1)}
    return result, params, elapsed


def print_exact_benchmark_deck(result, params, existing_stores, elapsed):
    logger.info("=" * 70)
    logger.info("RESULTS: Exact Standard Benchmark Scenario Deck")
    logger.info("=" * 70)

    scope_summary = result.get('scope_summary') or {}
    candidate_summary = result.get('candidate_pool_summary') or {}
    scenarios = result.get('scenarios') or []
    mini_overlay = result.get('mini_overlay') or {}

    print("\n" + "=" * 70)
    print("  EXACT STANDARD BENCHMARK SCENARIO DECK")
    print("=" * 70)
    print(f"\nBenchmark fixed stores:   {len(existing_stores)}")
    print(f"In-scope orders/day:      {scope_summary.get('in_scope_orders_per_day', 0):,.0f}")
    print(f"Business polygons:        {scope_summary.get('business_polygon_count', 0)}")
    print(f"Candidate pool mode:      {candidate_summary.get('candidate_pool_mode', 'unknown')}")
    print(f"Candidate demand cells:   {candidate_summary.get('selected_candidate_cells', 0):,} / {candidate_summary.get('all_uncovered_candidate_cells', 0):,}")

    for scenario in scenarios:
        metrics = scenario.get('metrics') or {}
        print(f"\n--- {scenario['scenario_name']} ---")
        print(f"  Target feasible:        {'Yes' if scenario.get('target_feasible') else 'No'}")
        print(f"  Coverage:               {scenario.get('coverage_pct', 0):.2f}%")
        print(f"  Uncovered orders/day:   {scenario.get('uncovered_orders_per_day', 0):,.0f}")
        print(f"  New Standard stores:    {scenario.get('new_store_count', 0)}")
        print(f"  Exception hubs:         {scenario.get('exception_hub_count', 0)}")
        print(f"  Proposed avg cost:      ₹{metrics.get('proposed_avg_cost', 0):.2f}")
        print(f"  Proposed avg distance:  {metrics.get('proposed_avg_dist', 0):.3f} km")

    if mini_overlay:
        metrics = mini_overlay.get('metrics') or {}
        print(f"\n--- Mini overlay on {mini_overlay.get('base_scenario', 'n/a')} ---")
        if mini_overlay.get('skipped'):
            print("  Status:                 Skipped for fast Standard-only deck generation")
        else:
            print(f"  Mini sites:             {mini_overlay.get('site_count', 0)}")
            print(f"  Proposed avg cost:      ₹{metrics.get('proposed_avg_cost', 0):.2f}")
            print(f"  Proposed avg distance:  {metrics.get('proposed_avg_dist', 0):.3f} km")

    print(f"\nRecommended scenario:     {result.get('recommended_scenario', 'n/a')}")
    print(f"Total time:               {elapsed:.1f}s")
    print("=" * 70)

    results_json = {
        'mode': result.get('mode'),
        'params': params,
        'recommended_scenario': result.get('recommended_scenario'),
        'scope_summary': scope_summary,
        'candidate_pool_summary': candidate_summary,
        'analysis': result.get('analysis', {}),
        'scenarios': scenarios,
        'mini_overlay': mini_overlay,
        'timing': {'total_seconds': round(elapsed, 1)},
    }

    json_path = os.path.join(OUTPUT_DIR, 'exact_benchmark_scenario_deck.json')
    with open(json_path, 'w') as f:
        json.dump(results_json, f, indent=2, default=str)
    logger.info(f"Saved exact scenario deck: {json_path}")

    rows = []
    for scenario in scenarios:
        rows.append({
            'scenario_name': scenario['scenario_name'],
            'target_feasible': scenario.get('target_feasible'),
            'coverage_pct': scenario.get('coverage_pct'),
            'uncovered_orders_per_day': scenario.get('uncovered_orders_per_day'),
            'new_standard_stores': scenario.get('new_store_count'),
            'exception_hubs': scenario.get('exception_hub_count'),
            'proposed_avg_cost': (scenario.get('metrics') or {}).get('proposed_avg_cost'),
            'proposed_avg_dist': (scenario.get('metrics') or {}).get('proposed_avg_dist'),
        })
    summary_df = pd.DataFrame(rows)
    summary_csv_path = os.path.join(OUTPUT_DIR, 'exact_benchmark_scenario_summary.csv')
    summary_df.to_csv(summary_csv_path, index=False)
    logger.info(f"Saved exact scenario summary: {summary_csv_path}")

    rec_name = result.get('recommended_scenario')
    rec = next((s for s in scenarios if s.get('scenario_name') == rec_name), None)
    if rec is not None:
        hub_rows = []
        for hub in rec.get('all_sites', []):
            hub_rows.append({
                'scenario_name': rec_name,
                'hub_id': hub.get('id'),
                'lat': hub.get('lat'),
                'lon': hub.get('lon'),
                'fixed_open': hub.get('fixed_open', False),
                'exception_standard': hub.get('exception_standard', False),
                'radius_km': hub.get('radius_km'),
                'selection': hub.get('selection', ''),
            })
        pd.DataFrame(hub_rows).to_csv(
            os.path.join(OUTPUT_DIR, 'exact_benchmark_recommended_standard_hubs.csv'),
            index=False,
        )

    return results_json


def print_exact_graph_build(result, params, elapsed):
    print("\n" + "=" * 70)
    print("  EXACT STANDARD GRAPH BUILD")
    print("=" * 70)
    print(f"\nBenchmark fixed stores:   {result.get('fixed_store_count', 0)}")
    print(f"In-scope orders/day:      {(result.get('scope_summary') or {}).get('in_scope_orders_per_day', 0):,.0f}")
    print(f"Candidate pool mode:      {(result.get('candidate_pool_summary') or {}).get('candidate_pool_mode', 'unknown')}")
    print(f"Candidate demand cells:   {(result.get('candidate_pool_summary') or {}).get('selected_candidate_cells', 0):,}")
    print(f"Feasible edges cached:    {result.get('total_feasible_edges', 0):,}")
    print(f"Cache file:               {result.get('cache_path', '')}")
    print(f"Build time:               {elapsed:.1f}s")
    print("=" * 70)

    json_path = os.path.join(OUTPUT_DIR, 'exact_standard_graph_build.json')
    with open(json_path, 'w') as f:
        json.dump({'params': params, 'result': result}, f, indent=2, default=str)
    logger.info(f"Saved exact graph build summary: {json_path}")
    return result


def print_exact_benchmark_readiness(result, params, elapsed):
    print("\n" + "=" * 70)
    print("  EXACT STANDARD BENCHMARK READINESS")
    print("=" * 70)
    print(f"\nBenchmark fingerprint:    {result.get('benchmark_fingerprint', '')}")
    print(f"Fixed stores:             {result.get('fixed_store_count', 0)}")
    print(f"In-scope orders/day:      {(result.get('scope_summary') or {}).get('in_scope_orders_per_day', 0):,.0f}")
    print(f"Candidate demand cells:   {(result.get('candidate_pool_summary') or {}).get('selected_candidate_cells', 0):,}")
    print(f"Graph cache exists:       {'Yes' if (result.get('graph_cache') or {}).get('exists') else 'No'}")
    print(f"Spacing cache exists:     {'Yes' if (result.get('spacing_conflicts') or {}).get('exists') else 'No'}")
    print(f"Blocked candidates:       {(result.get('spacing_conflicts') or {}).get('blocked_candidate_count', 0):,}")
    print(f"Candidate conflicts:      {(result.get('spacing_conflicts') or {}).get('candidate_conflict_count', 0):,}")
    print(f"Fixed-fixed warnings:     {(result.get('fixed_fixed_spacing_warnings') or {}).get('count', 0):,}")
    print(f"Ready to run:             {'Yes' if result.get('ready_to_run') else 'No'}")
    print(f"Check time:               {elapsed:.1f}s")
    print("=" * 70)

    json_path = os.path.join(OUTPUT_DIR, 'exact_standard_benchmark_readiness.json')
    with open(json_path, 'w') as f:
        json.dump({'params': params, 'result': result}, f, indent=2, default=str)
    logger.info(f"Saved exact benchmark readiness: {json_path}")
    return result


# ============================================================================
# MAIN
# ============================================================================
def main():
    print("\n" + "=" * 70)
    print("  DS Network Design Trial — Bangalore Multi-Layer Planner Reset")
    print("  100% OSRM Road Distances — ZERO Fallbacks")
    print("=" * 70 + "\n")

    total_start = time.time()

    # Step 0
    verify_osrm()

    # Step 1
    grid_data = load_demand()

    # Step 2
    existing_stores = load_stores()

    PARAM_OVERRIDES = {
        'mini_density_radius_km': 1.0,
        'mini_density_min_orders_per_day': 400,
        'standard_ds_radius': 3.0,
        'standard_exception_radius_km': 5.0,
        'standard_min_store_spacing_km': 3.0,
        'benchmark_near_full_coverage_pct': 99.7,
        'exact_solver_backend': 'highs',
        'exact_enable_tiebreak_milps': False,
        'exact_candidate_cap': None,
        'exact_candidate_min_spacing_km': 0.6,
        'exact_graph_cache_enabled': True,
        'exact_graph_site_block_size': 100,
        'exact_graph_checkpoint_every_blocks': 5,
    }

    graph_only = str(os.environ.get('EXACT_GRAPH_ONLY', '0')).strip().lower() in ('1', 'true', 'yes')
    readiness_only = str(os.environ.get('EXACT_READINESS_ONLY', '0')).strip().lower() in ('1', 'true', 'yes')

    if readiness_only:
        print("\n  Exact readiness mode:")
        print("    Validating benchmark fingerprint, graph cache, and spacing conflicts")
        print("    No optimizer run will be launched")
        print()

        result, params, elapsed = run_exact_benchmark_readiness(
            param_overrides=PARAM_OVERRIDES,
        )
        results = print_exact_benchmark_readiness(result, params, elapsed)
    elif graph_only:
        print("\n  Exact graph build mode:")
        print("    Building reusable 10 km Standard superset feasibility graph only")
        print("    Scenarios will be solved from cache in a later run")
        print()

        result, params, elapsed = run_exact_graph_build(
            param_overrides=PARAM_OVERRIDES,
        )
        results = print_exact_graph_build(result, params, elapsed)
    else:
        print("\n  Exact benchmark deck:")
        print("    Scenario 1: strict 3 km / 100% target")
        print("    Scenario 2: 3 km + exception hubs up to 5 km / 100% target")
        print("    Scenario 3: strict 3 km / 99.7% target")
        print("    Scenario 4: Mini overlay on top of the preferred Standard scenario")
        print()

        result, params, elapsed = run_exact_benchmark_deck(
            grid_data,
            existing_stores,
            param_overrides=PARAM_OVERRIDES,
        )

        results = print_exact_benchmark_deck(result, params, existing_stores, elapsed)

    total_time = time.time() - total_start
    print(f"\nTotal execution time: {total_time:.1f}s")
    print(f"Results saved to: {OUTPUT_DIR}/")
    if readiness_only:
        print("  - exact_standard_benchmark_readiness.json")
    elif graph_only:
        print("  - exact_standard_graph_build.json         (graph build summary)")
    else:
        print("  - exact_benchmark_scenario_deck.json      (full scenario deck)")
        print("  - exact_benchmark_scenario_summary.csv    (manager summary table)")
        print("  - exact_benchmark_recommended_standard_hubs.csv")

    return results


if __name__ == '__main__':
    main()
