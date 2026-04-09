#!/usr/bin/env python3
"""One-off: load feb_2026_distance_input.csv and run overlapping placement + evaluate (UI defaults)."""
import os
import sys
import time

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CSV = os.path.join(ROOT, 'feb_2026_distance_input.csv')

# Match static/index.html collectOptimizationParams / server optimize defaults
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
    if not os.path.isfile(CSV):
        print(f'CSV not found: {CSV}', file=sys.stderr)
        sys.exit(1)

    os.chdir(BASE)
    import server  # noqa: E402

    server.state.osrm_available = server.check_osrm()
    if not server.state.osrm_available:
        print('OSRM not reachable (OSRM_URL / localhost:5000). Cannot run road placement.', file=sys.stderr)
        sys.exit(2)

    t0 = time.time()
    print(f'Loading {CSV} ...', flush=True)
    server.load_order_csv(CSV)
    gd = server.state.grid_data
    print(
        f'Grid: {len(gd)} cells, ~{server.state.orders_per_day} orders/day, '
        f'unique_dates={server.state.unique_dates}, load: {time.time() - t0:.1f}s',
        flush=True,
    )

    user_params = dict(DEFAULT_PARAMS)
    if os.environ.get('FEB_REQUIRE_FULL_COVERAGE', '').strip().lower() in ('0', 'false', 'no', 'off'):
        user_params['require_full_tier_coverage'] = False
        print(
            'Note: FEB_REQUIRE_FULL_COVERAGE disables full tier coverage pass (faster; may leave gaps outside radii).',
            flush=True,
        )
    params = server.normalize_placement_params(user_params)
    print('Params (normalized):', {k: params[k] for k in sorted(params) if k in DEFAULT_PARAMS or k == 'super_ds_min_orders_per_day'}, flush=True)

    def cb(msg):
        print(f'  progress: {msg}', flush=True)

    t1 = time.time()
    layout = server.place_overlapping_tier_hubs(gd, params, progress_cb=cb)
    print(f'Placement wall time: {time.time() - t1:.1f}s', flush=True)

    mini = layout['mini_ds']
    std = layout['standard_ds']
    sup = layout['super_ds']
    print(f'Hubs: Mini={len(mini)}, Standard={len(std)}, Super={len(sup)}', flush=True)

    t2 = time.time()
    metrics = server.evaluate_network(gd, [], mini, std, sup, params, progress_cb=cb)
    print(f'Evaluate wall time: {time.time() - t2:.1f}s', flush=True)

    keys = (
        'current_avg_dist', 'proposed_avg_dist', 'current_avg_cost', 'proposed_avg_cost',
        'pct_cost_reduction', 'pct_orders_within_mini_service_km', 'total_grid_cells',
    )
    print('Metrics:', flush=True)
    for k in keys:
        if k in metrics:
            print(f'  {k}: {metrics[k]}', flush=True)

    print(f'TOTAL wall time: {time.time() - t0:.1f}s', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
