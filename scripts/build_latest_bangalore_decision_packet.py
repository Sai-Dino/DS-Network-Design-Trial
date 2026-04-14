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

    # ---- Resolve params used for view labels (mirror server.py logic) ----
    standard_radius = sfloat(params.get('standard_ds_radius', 3.0), 3.0)
    exception_radius = sfloat(params.get('standard_exception_radius_km', 5.0), 5.0)
    near_full_pct = sfloat(params.get('benchmark_near_full_coverage_pct', 99.7), 99.7)
    strict_100 = scenario_by_name.get('strict_3km_100') or active_scenario
    mini_base_scenario_name = str(mini_overlay.get('base_scenario') or '')
    mini_base_scenario = scenario_by_name.get(mini_base_scenario_name) or strict_100

    # ==================================================================
    # Helper: build one exact_view (mirrors _build_exact_ui_view in server.py)
    # ==================================================================
    def _build_view(view_key, label, scenario, base_result=None, mini_ov=None):
        """Produce a view dict matching the server's _build_exact_ui_view shape."""
        base_result = base_result or {}
        mini_ov = mini_ov or {}
        is_mini = (view_key == 'mini_overlay')
        scenario_for_std = base_result if is_mini else scenario

        # standard_ds for this view: new_sites from scenario
        new_sites = list((scenario_for_std or {}).get('new_sites') or [])
        mini_sites = [dict(s) for s in ((mini_ov or {}).get('sites') or [])] if is_mini else []
        metrics_src = dict((mini_ov or {}).get('metrics') or {}) if is_mini else dict((scenario or {}).get('metrics') or {})
        all_sites = (scenario_for_std or {}).get('all_sites') or []
        exception_sites = [dict(s) for s in all_sites if s.get('exception_standard')]
        fixed_sites = (scenario_for_std or {}).get('fixed_sites') or []
        new_store_count = sint((scenario_for_std or {}).get('new_store_count'), len(new_sites))
        exc_hub_count = sint((scenario_for_std or {}).get('exception_hub_count'))
        total_std = len(fixed_sites) + new_store_count

        demand_serving = [s for s in new_sites if sfloat(s.get('orders_per_day')) > 1e-6]
        support_only = [s for s in new_sites if sfloat(s.get('orders_per_day')) <= 1e-6]

        std_only_cost = sfloat((base_result.get('metrics') or {}).get('proposed_avg_cost'))
        std_only_dist = sfloat((base_result.get('metrics') or {}).get('proposed_avg_dist'))
        mini_cost_v = sfloat((mini_ov.get('metrics') or {}).get('proposed_avg_cost'))
        mini_dist_v = sfloat((mini_ov.get('metrics') or {}).get('proposed_avg_dist'))

        planning_layers = {
            'standard': {
                'fixed_open_count': len(fixed_sites),
                'new_store_count': new_store_count,
                'total_standard_sites': total_std,
                'demand_serving_site_count': len(demand_serving),
                'support_only_site_count': len(support_only),
                'coverage_pct': sfloat((scenario_for_std or {}).get('coverage_pct')),
                'exception_hub_count': exc_hub_count,
                'exception_sites': exception_sites,
            },
            'mini': {
                'site_count': len(mini_sites),
                'orders_shifted_from_standard_per_day': (
                    sfloat(metrics_src.get('total_orders_per_day')) *
                    sfloat(metrics_src.get('pct_orders_within_mini_service_km')) / 100.0
                ) if is_mini else 0.0,
                'avg_cost_reduction_per_order': max(
                    0.0, std_only_cost - mini_cost_v
                ) if is_mini else 0.0,
            },
            'super': {},
            'comparison': {
                'standard_only': {
                    'avg_cost': std_only_cost if std_only_cost else None,
                    'avg_dist': std_only_dist if std_only_dist else None,
                },
                'standard_plus_mini': ({
                    'avg_cost': mini_cost_v if mini_cost_v else None,
                    'avg_dist': mini_dist_v if mini_dist_v else None,
                }) if mini_ov else {},
            },
        }
        analysis_view = {
            'recommendations': list((base_result or {}).get('analysis', {}).get('recommendations') or []),
            'service_gap_polygons': list((scenario_for_std or {}).get('gap_polygons') or []),
            'service_gap_source': str((scenario_for_std or {}).get('scenario_name') or ''),
        }
        return {
            'view_key': view_key,
            'label': label,
            'scenario_name': str((scenario_for_std or {}).get('scenario_name') or view_key),
            'mini_ds': mini_sites,
            'standard_ds': new_sites,
            'super_ds': [],
            'metrics': metrics_src,
            'planning_layers': planning_layers,
            'analysis': analysis_view,
            'pipeline': {
                'mode': 'exact_standard_benchmark',
                'selected_view': view_key,
                'base_scenario': mini_base_scenario_name if is_mini else None,
            },
            'pipeline_warnings': [],
        }

    # ==================================================================
    # Build exact_views and exact_summaries (mirrors _build_exact_benchmark_app_result)
    # ==================================================================
    view_specs = [
        ('strict_3km_100',
         f'Strict {standard_radius:.1f} km / 100%',
         scenario_by_name.get('strict_3km_100')),
        ('exceptions_up_to_5km_100',
         f'{standard_radius:.1f} km + Exceptions to {exception_radius:.1f} km / 100%',
         scenario_by_name.get('exceptions_up_to_5km_100')),
        ('strict_3km_99_7',
         f'Strict {standard_radius:.1f} km / {near_full_pct:.1f}%',
         scenario_by_name.get('strict_3km_99_7')),
    ]

    exact_views = {}
    exact_summaries = []
    scenario_order = []

    for view_key, label, scenario in view_specs:
        if not scenario:
            continue
        scenario_order.append(view_key)
        exact_views[view_key] = _build_view(
            view_key, label, scenario,
            base_result=strict_100, mini_ov=mini_overlay,
        )
        exact_summaries.append({
            'view_key': view_key,
            'label': label,
            'target_feasible': bool(scenario.get('target_feasible')),
            'coverage_pct': sfloat(scenario.get('coverage_pct')),
            'new_standard_stores': sint(scenario.get('new_store_count')),
            'exception_hubs': sint(scenario.get('exception_hub_count')),
            'proposed_avg_cost': sfloat((scenario.get('metrics') or {}).get('proposed_avg_cost')),
            'proposed_avg_dist': sfloat((scenario.get('metrics') or {}).get('proposed_avg_dist')),
        })

    # Mini overlay view (if present and not skipped)
    if mini_overlay and not mini_overlay.get('skipped'):
        mini_label = f"Mini Overlay on {mini_overlay.get('base_scenario', 'strict_3km_100')}"
        exact_views['mini_overlay'] = _build_view(
            'mini_overlay', mini_label, mini_base_scenario,
            base_result=mini_base_scenario, mini_ov=mini_overlay,
        )
        exact_summaries.append({
            'view_key': 'mini_overlay',
            'label': mini_label,
            'target_feasible': None,
            'coverage_pct': sfloat((mini_overlay.get('metrics') or {}).get('proposed_hard_coverage_pct')),
            'new_standard_stores': sint((mini_base_scenario or {}).get('new_store_count')),
            'exception_hubs': sint((mini_base_scenario or {}).get('exception_hub_count')),
            'mini_sites': sint(mini_overlay.get('site_count')),
            'proposed_avg_cost': sfloat((mini_overlay.get('metrics') or {}).get('proposed_avg_cost')),
            'proposed_avg_dist': sfloat((mini_overlay.get('metrics') or {}).get('proposed_avg_dist')),
        })
        scenario_order.append('mini_overlay')

    # ---- Selected view (spread onto root, matching server.py line 13035) ----
    selected_view_key = (recommended if recommended in exact_views
                         else ('mini_overlay' if 'mini_overlay' in exact_views
                               else next(iter(exact_views.keys()), '')))
    selected_view = exact_views.get(selected_view_key, {})

    # ---- Build backward-compat scenario_views (keyed by name) ----
    scenario_views = {}
    for s in scenarios:
        name = s['scenario_name']
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

    # ---- decision_grade_result (kept for backward compat) ----
    decision_grade_result = {
        'active_view_key': selected_view_key,
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

    # ==================================================================
    # Assemble packet — exact benchmark format (mirrors _build_exact_benchmark_app_result)
    # ==================================================================
    packet = {
        # ---- Core exact benchmark contract ----
        'success': True,
        'exact_benchmark': True,
        'exact_metadata': {
            'recommended_scenario': recommended,
            'selected_view': selected_view_key,
            'scenario_summaries': exact_summaries,
        },
        'exact_views': exact_views,

        # ---- Root-level fields the UI reads ----
        'existing_stores': existing_stores,
        'compute_time_s': sfloat(deck.get('timing', {}).get('total_seconds')),
        'params': params,
        'scope_summary': scope_summary,
        'candidate_pool_summary': deck.get('candidate_pool_summary') or {},

        # ---- Backward-compat fields ----
        'response_version': 2,
        'result_contract': 'exact_benchmark_derived',
        'fixed_store_mode': 'benchmark_103',
        'decision_grade_result': decision_grade_result,
        'scenario_views': scenario_views,
        'scenario_order': scenario_order,

        # ---- Analysis & readiness ----
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

        # ---- Provenance ----
        'pipeline': {
            'mode': 'exact_standard_benchmark',
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
            'selected_view': selected_view_key,
        },
        'saved_artifact': 'latest_bangalore_103_decision_packet',
        'saved_at_epoch_s': now_epoch,
    }

    # Spread selected view onto root (mirrors server.py line 13035: result.update(selected_view))
    packet.update(selected_view)

    packet = sanitize_for_json(packet)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    tmp = args.output + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(packet, f, indent=2, allow_nan=False)
    os.replace(tmp, args.output)

    sv = exact_views.get(selected_view_key, {})
    sv_pl = sv.get('planning_layers', {}).get('standard', {})
    print(f"\nWrote: {args.output} ({os.path.getsize(args.output)} bytes)")
    print(f"  exact_benchmark: True")
    print(f"  exact_views: {list(exact_views.keys())}")
    print(f"  selected_view: {selected_view_key}")
    print(f"  Recommended scenario: {recommended}")
    print(f"  exact_summaries: {len(exact_summaries)} entries")
    print(f"  Fixed stores: {sv_pl.get('fixed_open_count', '?')}")
    print(f"  New stores: {sv_pl.get('new_store_count', '?')}")
    print(f"  Coverage: {sv_pl.get('coverage_pct', 0):.1f}%")
    print(f"  Avg cost: ₹{sfloat(sv.get('metrics', {}).get('proposed_avg_cost')):.2f}/order")
    print(f"  pipeline_warnings (from spread): {packet.get('pipeline_warnings')}")


if __name__ == '__main__':
    main()
