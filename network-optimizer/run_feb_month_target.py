#!/usr/bin/env python3
"""
Full-month demand (e.g. feb_2026_distance_input.csv): OSRM placement with **full tier coverage**
(every grid cell within at least one Mini / Standard / Super service radius) and a **target**
average proposed last-mile cost (default ₹42/order).

Uses ``search_tier_params_for_target`` (tier radii / min orders search) + final OSRM evaluate.
Long-running: expect tens of minutes on ~17k cells depending on OSRM.

Requires a running OSRM (``OSRM_URL``, default http://localhost:5000).

Environment (optional):
  FEB_CSV              Path to orders CSV (default: ../feb_2026_distance_input.csv)
  TARGET_AVG_COST      Default 42
  MAX_SEARCH_ITERATIONS Default 50 (clamped in server to 5–120)
  OSRM_WORKERS         Parallel OSRM HTTP threads (see server.py)
"""
import os
import sys
import time

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CSV = os.environ.get('FEB_CSV', os.path.join(ROOT, 'feb_2026_distance_input.csv'))

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
        return 1

    os.chdir(BASE)
    import server  # noqa: E402

    server.state.osrm_available = server.check_osrm()
    if not server.state.osrm_available:
        print('OSRM not reachable (set OSRM_URL / start osrm-routed).', file=sys.stderr)
        return 2

    target = float(os.environ.get('TARGET_AVG_COST', '42'))
    max_iters = int(os.environ.get('MAX_SEARCH_ITERATIONS', '50'))

    t_load = time.time()
    print(f'Loading {CSV} ...', flush=True)
    server.load_order_csv(CSV)
    gd = server.state.grid_data
    print(
        f'Grid: {len(gd)} cells, ~{server.state.orders_per_day} orders/day, '
        f'unique_dates={server.state.unique_dates}, load: {time.time() - t_load:.1f}s',
        flush=True,
    )

    params = server.normalize_placement_params(dict(DEFAULT_PARAMS))
    print(f'Target proposed avg cost: ₹{target}/order | require_full_tier_coverage=True', flush=True)
    print(f'MAX_SEARCH_ITERATIONS={max_iters}', flush=True)

    def cb(msg):
        print(f'  progress: {msg}', flush=True)

    t_search = time.time()
    best = server.search_tier_params_for_target(
        gd, [], params, target, max_iters, progress_cb=cb,
    )
    if best.get('params') is None:
        print('Target search did not return a layout.', file=sys.stderr)
        return 3

    print(f'Target search wall time: {time.time() - t_search:.1f}s', flush=True)
    print(
        f'Hubs (after search, before final eval): Mini={len(best["mini"])}, '
        f'Standard={len(best["std"])}, Super={len(best["super"])}',
        flush=True,
    )

    print('Final evaluation (OSRM)...', flush=True)
    t_eval = time.time()
    final_metrics = server.evaluate_network(
        gd, [], best['mini'], best['std'], best['super'], best['params'], progress_cb=cb,
    )
    print(f'Evaluate wall time: {time.time() - t_eval:.1f}s', flush=True)

    pac = final_metrics.get('proposed_avg_cost')
    gap = abs(float(pac) - target) if pac is not None else None
    tol = max(target * 0.02, 0.05)

    print('', flush=True)
    print('=== Result ===', flush=True)
    print(f'  coverage_complete (search trial): {best.get("coverage_complete", True)}', flush=True)
    print(f'  coverage_satellites_added: {best.get("coverage_satellites_added", 0)}', flush=True)
    print(f'  Mini={len(best["mini"])}, Standard={len(best["std"])}, Super={len(best["super"])}', flush=True)
    keys = (
        'current_avg_dist', 'proposed_avg_dist', 'current_avg_cost', 'proposed_avg_cost',
        'pct_cost_reduction', 'pct_order_weight_outside_tier_radii', 'total_grid_cells',
    )
    for k in keys:
        if k in final_metrics:
            print(f'  {k}: {final_metrics[k]}', flush=True)
    if gap is not None:
        print(f'  |proposed_avg_cost − target|: ₹{gap:.3f} (tolerance ±₹{tol:.2f} for 2%)', flush=True)
        print(f'  Within tolerance: {gap <= tol}', flush=True)

    print(f'TOTAL wall time: {time.time() - t_load:.1f}s', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
