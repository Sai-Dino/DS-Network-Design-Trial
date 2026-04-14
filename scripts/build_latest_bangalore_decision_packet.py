#!/usr/bin/env python3
"""
Build optimization_results/latest_bangalore_103_decision_packet.json
from the real exact-benchmark artifacts in optimization_results/.

Source artifacts (must be real files, not LFS pointers):
    exact_benchmark_scenario_deck.json
    exact_benchmark_scenario_summary.csv
    exact_benchmark_recommended_standard_hubs.csv
    exact_benchmark_mini_overlay_sites.csv
    exact_standard_benchmark_readiness.json

The output is shaped to be loadable by server.py's _load_latest_decision_packet()
which requires only a non-empty dict.  The UI reads whatever keys are present.

All values come from the real benchmark artifacts.  Nothing is invented.

Usage:
    python3 scripts/build_latest_bangalore_decision_packet.py
    python3 scripts/build_latest_bangalore_decision_packet.py --check
"""

import argparse
import csv
import json
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
RESULTS_DIR = os.path.join(REPO_ROOT, 'optimization_results')
OUTPUT_PATH = os.path.join(RESULTS_DIR, 'latest_bangalore_103_decision_packet.json')


def is_lfs_pointer(path):
    if not os.path.isfile(path):
        return False
    with open(path, 'r', encoding='utf-8') as f:
        return f.readline().strip().startswith('version https://git-lfs.github.com/spec/v1')


def require_real(path, label):
    if not os.path.isfile(path):
        raise FileNotFoundError(f"{label} not found: {path}")
    if is_lfs_pointer(path):
        raise RuntimeError(f"{label} is an LFS pointer: {path}")


def load_json(path, label):
    require_real(path, label)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_csv_rows(path, label):
    require_real(path, label)
    with open(path, newline='', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def sfloat(v, d=0.0):
    import math
    try:
        f = float(v)
        return d if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return d


def sint(v, d=0):
    try: return int(float(v))
    except (TypeError, ValueError): return d


def sanitize_for_json(obj):
    """Recursively replace NaN/Inf with None so json.dump(allow_nan=False) works."""
    import math
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    return obj


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='Verify artifacts only')
    parser.add_argument('--output', default=OUTPUT_PATH)
    args = parser.parse_args()

    files = {
        'deck':      (os.path.join(RESULTS_DIR, 'exact_benchmark_scenario_deck.json'), 'Scenario deck'),
        'summary':   (os.path.join(RESULTS_DIR, 'exact_benchmark_scenario_summary.csv'), 'Scenario summary'),
        'hubs':      (os.path.join(RESULTS_DIR, 'exact_benchmark_recommended_standard_hubs.csv'), 'Recommended hubs'),
        'mini':      (os.path.join(RESULTS_DIR, 'exact_benchmark_mini_overlay_sites.csv'), 'Mini overlay'),
        'readiness': (os.path.join(RESULTS_DIR, 'exact_standard_benchmark_readiness.json'), 'Readiness'),
    }

    all_ok = True
    for key, (path, label) in files.items():
        if not os.path.isfile(path):
            print(f"  MISSING: {label}"); all_ok = False
        elif is_lfs_pointer(path):
            print(f"  LFS POINTER: {label}"); all_ok = False
        else:
            print(f"  OK: {label} ({os.path.getsize(path)} bytes)")

    if not all_ok:
        print("\nCannot build: source artifacts missing or are LFS pointers.")
        sys.exit(1)
    if args.check:
        print("\nAll artifacts available.")
        return

    # ---- Load real data ----
    deck       = load_json(*files['deck'])
    summary    = load_csv_rows(*files['summary'])
    hub_rows   = load_csv_rows(*files['hubs'])
    mini_rows  = load_csv_rows(*files['mini'])
    readiness  = load_json(*files['readiness'])

    params = dict(deck.get('params') or {})
    params['fixed_store_mode'] = 'benchmark_103'

    scenarios = deck.get('scenarios') or []
    scenario_by_name = {s['scenario_name']: s for s in scenarios}
    recommended = str(deck.get('recommended_scenario') or '')
    active_scenario = scenario_by_name.get(recommended) or (scenarios[0] if scenarios else {})
    active_metrics = active_scenario.get('metrics') or {}
    scope_summary = deck.get('scope_summary') or {}
    mini_overlay = deck.get('mini_overlay') or {}

    # ---- Build scenario_views dict (keyed by name) ----
    scenario_views = {}
    scenario_order = []
    for s in scenarios:
        name = s['scenario_name']
        scenario_order.append(name)
        m = s.get('metrics') or {}
        scenario_views[name] = {
            'scenario_name': name,
            'coverage_pct': sfloat(s.get('coverage_pct')),
            'new_store_count': sint(s.get('new_store_count')),
            'exception_hub_count': sint(s.get('exception_hub_count')),
            'proposed_avg_cost': sfloat(m.get('proposed_avg_cost')),
            'proposed_avg_dist': sfloat(m.get('proposed_avg_dist')),
            'current_avg_cost': sfloat(m.get('current_avg_cost')),
            'current_avg_dist': sfloat(m.get('current_avg_dist')),
            'daily_savings': sfloat(m.get('daily_savings')),
            'addressable_hard_coverage_pct': sfloat(m.get('addressable_hard_coverage_pct')),
            'target_feasible': bool(s.get('target_feasible')),
            'fixed_sites_count': len(s.get('fixed_sites') or []),
            'new_sites_count': len(s.get('new_sites') or []),
        }

    # ---- Build scenario_summaries from CSV ----
    scenario_summaries = []
    for row in summary:
        scenario_summaries.append({
            'scenario_name': row.get('scenario_name', ''),
            'target_feasible': row.get('target_feasible', ''),
            'coverage_pct': sfloat(row.get('coverage_pct')),
            'uncovered_orders_per_day': sfloat(row.get('uncovered_orders_per_day')),
            'new_standard_stores': sint(row.get('new_standard_stores')),
            'exception_hubs': sint(row.get('exception_hubs')),
            'proposed_avg_cost': sfloat(row.get('proposed_avg_cost')),
            'proposed_avg_dist': sfloat(row.get('proposed_avg_dist')),
        })

    # ---- Build standard_ds from hubs CSV (recommended scenario) ----
    standard_ds = []
    for row in hub_rows:
        if row.get('scenario_name') == recommended:
            standard_ds.append({
                'id': row.get('hub_id', ''),
                'lat': sfloat(row.get('lat')),
                'lon': sfloat(row.get('lon')),
                'fixed_open': row.get('fixed_open', '').strip().lower() == 'true',
                'exception_standard': row.get('exception_standard', '').strip().lower() == 'true',
                'radius_km': sfloat(row.get('radius_km')),
                'selection': row.get('selection', ''),
            })

    # ---- Build mini_ds from mini overlay CSV ----
    mini_ds = []
    for row in mini_rows:
        mini_ds.append({
            'lat': sfloat(row.get('lat')),
            'lon': sfloat(row.get('lon')),
            'orders_per_day': sfloat(row.get('orders_per_day')),
            'radius_km': sfloat(row.get('radius_km')),
            'type': row.get('type', ''),
        })

    # ---- Build existing_stores from fixed_sites in active scenario ----
    existing_stores = []
    for s in (active_scenario.get('fixed_sites') or []):
        existing_stores.append({
            'id': s.get('id', ''),
            'lat': sfloat(s.get('lat')),
            'lon': sfloat(s.get('lon')),
            'orders_per_day': sfloat(s.get('orders_per_day')),
            'polygon_coords': s.get('polygon_coords', []),
        })

    # ---- decision_grade_result from real metrics ----
    decision_grade_result = {
        'active_view_key': recommended,
        'fixed_store_mode': 'benchmark_103',
        'fixed_standard_count': len(active_scenario.get('fixed_sites') or []),
        'new_standard_count': sint(active_scenario.get('new_store_count')),
        'total_physical_standard_count': len(active_scenario.get('all_sites') or []),
        'exception_hub_count': sint(active_scenario.get('exception_hub_count')),
        'proposed_hard_coverage_pct': sfloat(active_scenario.get('coverage_pct')),
        'proposed_avg_cost': sfloat(active_metrics.get('proposed_avg_cost')),
        'proposed_avg_dist': sfloat(active_metrics.get('proposed_avg_dist')),
        'current_avg_cost': sfloat(active_metrics.get('current_avg_cost')),
        'current_avg_dist': sfloat(active_metrics.get('current_avg_dist')),
        'daily_savings': sfloat(active_metrics.get('daily_savings')),
        'monthly_savings': sfloat(active_metrics.get('daily_savings')) * 30,
    }

    now_epoch = round(time.time(), 3)

    packet = {
        'success': True,
        'response_version': 2,
        'result_contract': 'benchmark_derived_canonical',
        'fixed_store_mode': 'benchmark_103',
        'decision_grade_result': decision_grade_result,
        'standard_ds': standard_ds,
        'mini_ds': mini_ds,
        'super_ds': [],
        'metrics': dict(active_metrics),
        'scenario_views': scenario_views,
        'scenario_order': scenario_order,
        'scenario_summaries': scenario_summaries,
        'scope_summary': scope_summary,
        'existing_stores': existing_stores,
        'analysis': {
            'recommendations': (deck.get('analysis') or {}).get('recommendations', []),
            'readiness': readiness,
        },
        'mini_overlay_summary': {
            'base_scenario': mini_overlay.get('base_scenario'),
            'site_count': mini_overlay.get('site_count'),
            'skipped': mini_overlay.get('skipped'),
            'metrics': mini_overlay.get('metrics'),
        },
        'candidate_pool_summary': deck.get('candidate_pool_summary') or {},
        'compute_time_s': sfloat(deck.get('timing', {}).get('total_seconds')),
        'params': params,
        'pipeline': {
            'mode': 'benchmark_derived',
            'phase': 'core_decision_packet',
            'saved_artifact': 'latest_bangalore_103_decision_packet',
            'saved_at_epoch_s': now_epoch,
            'source_artifacts': [
                'optimization_results/exact_benchmark_scenario_deck.json',
                'optimization_results/exact_benchmark_scenario_summary.csv',
                'optimization_results/exact_benchmark_recommended_standard_hubs.csv',
                'optimization_results/exact_benchmark_mini_overlay_sites.csv',
                'optimization_results/exact_standard_benchmark_readiness.json',
            ],
            'transform_script': 'scripts/build_latest_bangalore_decision_packet.py',
            'recommended_scenario': recommended,
        },
        'saved_artifact': 'latest_bangalore_103_decision_packet',
        'saved_at_epoch_s': now_epoch,
    }

    packet = sanitize_for_json(packet)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    tmp = args.output + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(packet, f, indent=2, allow_nan=False)
    os.replace(tmp, args.output)

    print(f"\nWrote: {args.output} ({os.path.getsize(args.output)} bytes)")
    print(f"  Recommended scenario: {recommended}")
    print(f"  Standard hubs: {len(standard_ds)}")
    print(f"  Mini overlay sites: {len(mini_ds)}")
    print(f"  Fixed stores: {decision_grade_result['fixed_standard_count']}")
    print(f"  New stores: {decision_grade_result['new_standard_count']}")
    print(f"  Coverage: {decision_grade_result['proposed_hard_coverage_pct']:.1f}%")
    print(f"  Avg cost: ₹{decision_grade_result['proposed_avg_cost']:.2f}/order")
    print(f"  Daily savings: ₹{decision_grade_result['daily_savings']:.2f}")


if __name__ == '__main__':
    main()
