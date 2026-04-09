#!/usr/bin/env python3
"""
End-to-end test: Run the network optimizer on real data with real OSRM.
=====================================================================
Usage:
    cd /path/to/DS_Network_Design_Trial/network-optimizer
    python3 ../run_optimization_test.py

Prerequisites:
    - OSRM server running at http://localhost:5000 (India map)
    - feb_2026_distance_input.csv in parent directory
    - store_to_points_matrix.csv in parent directory

This script:
  1. Loads demand data → grid cells
  2. Loads current 103 hubs from store_to_points_matrix.csv
  3. Runs baseline evaluation (current network, OSRM pairwise distances)
  4. Runs 3-tier optimized placement (Mini/Standard/Super, all OSRM)
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
ORDER_CSV = os.path.join(SCRIPT_DIR, 'feb_2026_distance_input.csv')
STORE_CSV = os.path.join(SCRIPT_DIR, 'store_to_points_matrix.csv')
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
    logger.info(f"File: {ORDER_CSV}")

    if not os.path.isfile(ORDER_CSV):
        logger.error(f"Order CSV not found: {ORDER_CSV}")
        sys.exit(1)

    file_size_mb = os.path.getsize(ORDER_CSV) / (1024 * 1024)
    logger.info(f"File size: {file_size_mb:.1f} MB")

    t0 = time.time()
    mapping = opt.load_order_csv(ORDER_CSV)
    elapsed = time.time() - t0

    grid = opt.state.grid_data
    logger.info(f"Column mapping: {mapping}")
    logger.info(f"Total orders: {opt.state.total_orders:,}")
    logger.info(f"Unique dates: {opt.state.unique_dates}")
    logger.info(f"Orders/day: {opt.state.orders_per_day:,}")
    logger.info(f"Grid cells: {len(grid):,}")
    logger.info(f"Load time: {elapsed:.1f}s")

    return grid


# ============================================================================
# STEP 2: Load current hub layout (103 stores from CSV)
# ============================================================================
def load_stores():
    logger.info("=" * 70)
    logger.info("STEP 2: Loading current hub layout")
    logger.info("=" * 70)
    logger.info(f"File: {STORE_CSV}")

    if not os.path.isfile(STORE_CSV):
        logger.error(f"Store CSV not found: {STORE_CSV}")
        sys.exit(1)

    # The store_to_points_matrix.csv has polygon edge points.
    # Extract unique stores with their centroid lat/lon.
    sf = pd.read_csv(STORE_CSV)
    sf.columns = sf.columns.str.strip()

    stores_df = sf[['store code', 'Store Latitude', 'Store Longitude']].drop_duplicates(
        subset=['store code']
    )
    stores_df['store code'] = stores_df['store code'].str.strip()

    stores = []
    for _, row in stores_df.iterrows():
        store_code = row['store code']
        lat = float(row['Store Latitude'])
        lon = float(row['Store Longitude'])

        # Get polygon edges for this store
        store_edges = sf[sf['store code'].str.strip() == store_code]
        poly_coords = [
            [float(r['Point Latitude']), float(r['Point Longitude'])]
            for _, r in store_edges.iterrows()
        ]

        stores.append({
            'id': store_code,
            'lat': lat,
            'lon': lon,
            'polygon_coords': poly_coords,
            'orders_per_day': 0
        })

    # Match orders to stores using Hub_Code from demand data
    if opt.state.order_df is not None and 'store_id' in opt.state.order_df.columns:
        counts = opt.state.order_df['store_id'].value_counts()
        matched_count = 0
        for s in stores:
            sid = s['id'].lower()
            matched = [k for k in counts.index if str(k).strip().lower() == sid]
            if matched:
                s['orders_per_day'] = int(counts[matched[0]] / opt.state.unique_dates)
                matched_count += 1
        logger.info(f"Matched {matched_count}/{len(stores)} stores to order data")
    else:
        logger.warning("No store_id column in order data — cannot match orders to stores")

    opt.state.existing_stores = stores
    logger.info(f"Loaded {len(stores)} existing stores")

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

    # ── MINI + STANDARD OVERLAPPING (no Super DS) ──────────────────
    # Both tiers placed on the FULL grid independently (overlapping).
    # Evaluation assigns each cell to Mini first (cheaper), falls back
    # to Standard.  Every order must be covered.
    #
    #   • Mini DS  — 1.5 km radius, min 300 orders/day, cycle (₹20+6d)
    #   • Standard — 3.0 km radius, min 300 orders/day, bike  (₹29+9d)
    #   • Super DS — DISABLED
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

        # Super DS — DISABLED (max=0)
        'super_base_cost': 29,
        'super_variable_rate': 9,
        'super_ds_radius': 4.0,
        'super_ds_min_orders_per_day': 999999,
        'super_ds_max_orders_per_day': 999999,
        'super_ds_max': 0,

        # Coverage — every order must be within Mini or Standard radius
        'require_full_tier_coverage': True,
        'mini_coverage_fill': False,
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
def run_constrained_optimization(grid_data, existing_stores, target_max_hubs=None, target_last_mile_cost=None):
    """Run the constraint-driven optimizer: maximize coverage within hub/cost limits."""
    logger.info("=" * 70)
    logger.info("STEP 5: Constraint-driven optimization (100% OSRM)")
    logger.info("=" * 70)

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

        # Standard DS (15k SKUs, bike delivery)
        'standard_base_cost': 29,
        'standard_variable_rate': 9,
        'standard_ds_radius': 3.0,
        'standard_ds_min_orders_per_day': 300,
        'standard_ds_max_orders_per_day': 15000,
        'standard_ds_max': 500,

        # Super DS — DISABLED
        'super_ds_min_orders_per_day': 999999,
        'super_ds_max_orders_per_day': 999999,
        'super_ds_max': 0,

        # Constraints
        'target_max_hubs': target_max_hubs,
        'target_last_mile_cost': target_last_mile_cost,
    }

    logger.info(f"Constraints: max_hubs={target_max_hubs}, target_cost={target_last_mile_cost}")
    logger.info(f"Parameters: {json.dumps({k: v for k, v in params.items()}, indent=2, default=str)}")

    def progress_cb(msg):
        logger.info(f"  [progress] {msg}")

    t0 = time.time()
    result = opt.optimize_with_constraints(grid_data, existing_stores, params, progress_cb=progress_cb)
    elapsed = time.time() - t0

    return result, params, elapsed


def print_constrained_results(result, params, existing_stores, elapsed):
    """Print and save results from constraint-driven optimization."""
    logger.info("=" * 70)
    logger.info("RESULTS: Constraint-Driven Optimization")
    logger.info("=" * 70)

    mini_ds = result['mini_ds']
    standard_ds = result['standard_ds']
    metrics = result['metrics']
    pockets = result['uncovered_pockets']
    total_hubs = result['total_hubs']

    print("\n" + "=" * 70)
    print("  CONSTRAINT-DRIVEN OPTIMIZATION RESULTS (100% OSRM)")
    print("=" * 70)

    print(f"\n--- CONSTRAINTS ---")
    c = metrics.get('constraints_used', {})
    if c.get('target_max_hubs') is not None:
        print(f"  Target max hubs:        {c['target_max_hubs']}")
    else:
        print(f"  Target max hubs:        (no constraint)")
    if c.get('target_last_mile_cost') is not None:
        print(f"  Target last-mile cost:  ₹{c['target_last_mile_cost']:.2f}")
    else:
        print(f"  Target last-mile cost:  (no constraint)")

    print(f"\n--- NETWORK SIZE ---")
    print(f"  Current hubs:           {len(existing_stores)}")
    print(f"  Proposed hubs:          {total_hubs}")
    print(f"    Mini DS (4k):           {len(mini_ds)}")
    print(f"    Standard (15k):         {len(standard_ds)}")

    print(f"\n--- COVERAGE ---")
    print(f"  Coverage:               {metrics['coverage_pct']:.2f}%")
    print(f"  Covered orders/day:     {metrics['covered_orders_per_day']:,.0f}")
    print(f"  Uncovered orders/day:   {metrics['uncovered_orders_per_day']:,.0f}")

    print(f"\n--- COST COMPARISON ---")
    print(f"  Current avg cost/order: ₹{metrics['current_avg_cost']:.2f}")
    print(f"  Proposed avg cost/order:₹{metrics['proposed_avg_cost']:.2f}")
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

    print(f"\n--- PERFORMANCE ---")
    print(f"  Total time:     {elapsed:.1f}s")
    print(f"  Distance source: {metrics.get('distance_source', 'N/A')}")
    print("=" * 70)

    # --- Save results ---
    results_json = {
        'metrics': metrics,
        'params': {k: v for k, v in params.items() if not isinstance(v, (bytes,))},
        'placement': {
            'mini_count': len(mini_ds),
            'standard_count': len(standard_ds),
            'total': total_hubs,
        },
        'current_network': {
            'hub_count': len(existing_stores),
        },
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
    for tier_name, hub_list in [('mini', mini_ds), ('standard', standard_ds)]:
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


# ============================================================================
# MAIN
# ============================================================================
def main():
    print("\n" + "=" * 70)
    print("  DS Network Design Trial — Constraint-Driven Optimization")
    print("  100% OSRM Road Distances — ZERO Fallbacks")
    print("=" * 70 + "\n")

    total_start = time.time()

    # Step 0
    verify_osrm()

    # Step 1
    grid_data = load_demand()

    # Step 2
    existing_stores = load_stores()

    # ── Constraint-driven optimization ──────────────────────────────
    # Set AT LEAST ONE constraint:
    #   target_max_hubs       — max total hubs (Mini + Standard)
    #   target_last_mile_cost — max avg ₹ per order
    #
    # Primary goal: ALWAYS maximize order coverage within constraints.
    # Uncovered demand reported as 3km pockets (not force-filled).
    # ────────────────────────────────────────────────────────────────
    TARGET_MAX_HUBS = 200          # Set to None to disable this constraint
    TARGET_LAST_MILE_COST = None   # Set to e.g. 42.0 to target ₹42/order; None = no constraint

    print(f"\n  Constraints:")
    print(f"    Max hubs:            {TARGET_MAX_HUBS if TARGET_MAX_HUBS else '(no constraint)'}")
    print(f"    Target cost/order:   {'₹' + str(TARGET_LAST_MILE_COST) if TARGET_LAST_MILE_COST else '(no constraint)'}")
    print()

    result, params, elapsed = run_constrained_optimization(
        grid_data, existing_stores,
        target_max_hubs=TARGET_MAX_HUBS,
        target_last_mile_cost=TARGET_LAST_MILE_COST,
    )

    results = print_constrained_results(result, params, existing_stores, elapsed)

    total_time = time.time() - total_start
    print(f"\nTotal execution time: {total_time:.1f}s")
    print(f"Results saved to: {OUTPUT_DIR}/")
    print("  - constrained_optimization_results.json  (full metrics + pockets)")
    print("  - constrained_proposed_hubs.csv           (optimized hub locations)")
    print("  - uncovered_pockets.csv                   (demand pockets not covered)")
    print("  - current_hubs.csv                        (current hub locations)")

    return results


if __name__ == '__main__':
    main()
