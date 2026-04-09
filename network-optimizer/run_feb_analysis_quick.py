#!/usr/bin/env python3
"""Smoke test: same CSV + defaults as run_feb_analysis.py but grid capped to first N cells (fast)."""
import os
import sys
import time

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CSV = os.path.join(ROOT, 'feb_2026_distance_input.csv')
CELL_CAP = int(os.environ.get('FEB_ANALYSIS_CELL_CAP', '1200'))

DEFAULT_PARAMS = {
    'base_cost': 29,
    'variable_rate': 9,
    'mini_base_cost': 20,
    'mini_variable_rate': 6,
    'standard_base_cost': 29,
    'standard_variable_rate': 9,
    'super_base_cost': 29,
    'super_variable_rate': 9,
    'use_tiered_costs': True,
    'mini_ds_radius': 1.0,
    'mini_ds_min_orders_per_day': 300,
    'mini_ds_max_orders_per_day': 8000,
    'standard_ds_radius': 2.5,
    'standard_ds_min_orders_per_day': 500,
    'standard_ds_max_orders_per_day': 12000,
    'super_ds_radius': 4.0,
    'super_ds_min_orders_per_day': 1500,
    'super_ds_max_orders_per_day': 50000,
    'mini_coverage_fill': False,
    'require_full_tier_coverage': True,
}


def main():
    os.chdir(BASE)
    import server  # noqa: E402

    server.state.osrm_available = server.check_osrm()
    if not server.state.osrm_available:
        print('OSRM not reachable', file=sys.stderr)
        return 2

    server.load_order_csv(CSV)
    full = server.state.grid_data
    gd = full.iloc[:CELL_CAP].copy() if len(full) > CELL_CAP else full
    print(
        f'[quick] Using {len(gd)} of {len(full)} grid cells (FEB_ANALYSIS_CELL_CAP={CELL_CAP})',
        flush=True,
    )

    params = server.normalize_placement_params(DEFAULT_PARAMS)
    t0 = time.time()
    layout = server.place_overlapping_tier_hubs(gd, params, progress_cb=lambda m: print(' ', m, flush=True))
    print(f'Placement: {time.time() - t0:.1f}s', flush=True)
    mini, std, sup = layout['mini_ds'], layout['standard_ds'], layout['super_ds']
    print(f'Hubs: Mini={len(mini)}, Standard={len(std)}, Super={len(sup)}', flush=True)

    t1 = time.time()
    m = server.evaluate_network(gd, [], mini, std, sup, params, progress_cb=None)
    print(f'Evaluate: {time.time() - t1:.1f}s', flush=True)
    for k in ('proposed_avg_dist', 'proposed_avg_cost', 'current_avg_cost', 'pct_orders_within_mini_service_km'):
        print(f'  {k}: {m.get(k)}', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
