#!/usr/bin/env python3
"""Run a small Super what-if scenario sweep on the February Bangalore data."""

import json
import os
import shutil
import sys
import time

import pandas as pd


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(REPO_ROOT, "optimization_results")
sys.path.insert(0, REPO_ROOT)

import run_optimization_test as rot


SCENARIOS = [
    {
        "name": "super_penalty20_radius7",
        "label": "Super +Rs20/order, radius 7 km",
        "super_base_cost": 49,
        "super_ds_radius": 7.0,
    },
    {
        "name": "super_penalty25_radius8",
        "label": "Super +Rs25/order, radius 8 km",
        "super_base_cost": 54,
        "super_ds_radius": 8.0,
    },
    {
        "name": "super_penalty10_radius10",
        "label": "Super +Rs10/order, radius 10 km",
        "super_base_cost": 39,
        "super_ds_radius": 10.0,
    },
]


BASE_OVERRIDES = {
    "coverage_mode": "hybrid",
    "mini_density_radius_km": 1.0,
    "mini_density_min_orders_per_day": 400,
    "super_role": "backbone_tail",
    "super_tail_preference": "prefer_standard",
    "super_infra_penalty_per_day": 0,
    "radius_override_candidate_tiers": ["standard", "super"],
    "radius_override_step_km": 0.2,
    "standard_override_max_radius_km": 4.0,
    "super_override_max_radius_km": 5.0,
    "exception_max_pct": 0.25,
    "exception_max_extra_distance_km": 1.0,
    "uncovered_pocket_radius_km": 3.0,
    "low_density_policy": "flag_exclude",
    "low_density_radius_km": 5.0,
    "low_density_min_orders_per_day": 300,
}


def snapshot_outputs(scenario_name):
    base_names = {
        "json": "constrained_optimization_results.json",
        "proposed_hubs": "constrained_proposed_hubs.csv",
        "uncovered_pockets": "uncovered_pockets.csv",
        "current_hubs": "current_hubs.csv",
    }
    written = {}
    for key, base_file in base_names.items():
        src = os.path.join(OUTPUT_DIR, base_file)
        if not os.path.exists(src):
            continue
        dst_name = f"{scenario_name}_{base_file}"
        dst = os.path.join(OUTPUT_DIR, dst_name)
        shutil.copy2(src, dst)
        written[key] = dst
    return written


def main():
    os.chdir(REPO_ROOT)
    total_start = time.time()

    rot.verify_osrm()
    grid_data = rot.load_demand()
    existing_stores = rot.load_stores()

    scenario_rows = []

    for scenario in SCENARIOS:
        print("\n" + "=" * 78)
        print(f"Running scenario: {scenario['label']}")
        print("=" * 78)
        run_start = time.time()

        overrides = dict(BASE_OVERRIDES)
        overrides["super_base_cost"] = scenario["super_base_cost"]
        overrides["super_ds_radius"] = scenario["super_ds_radius"]

        result, params, elapsed, search_payload = rot.run_constrained_optimization(
            grid_data,
            existing_stores,
            target_max_hubs=None,
            target_last_mile_cost=None,
            target_coverage_pct=100.0,
            search_max_hubs_cap=300,
            param_overrides=overrides,
        )

        rot.print_constrained_results(
            result,
            params,
            existing_stores,
            elapsed,
            search_payload=search_payload,
        )

        scenario_files = snapshot_outputs(scenario["name"])
        metrics = result["metrics"]
        placement = result.get("placement") or {}
        analysis = result.get("analysis") or {}
        sr = analysis.get("super_rationalization_summary") or {}
        scenario_rows.append(
            {
                "scenario": scenario["name"],
                "label": scenario["label"],
                "super_base_cost": scenario["super_base_cost"],
                "super_radius_km": scenario["super_ds_radius"],
                "total_hubs": result.get("total_hubs"),
                "mini_count": len(result.get("mini_ds") or []),
                "standard_count": len(result.get("standard_ds") or []),
                "super_count": len(result.get("super_ds") or []),
                "current_operational_coverage_pct": metrics.get("current_operational_coverage_pct"),
                "current_policy_coverage_pct": metrics.get("current_policy_coverage_pct"),
                "proposed_hard_coverage_pct": metrics.get("proposed_hard_coverage_pct"),
                "proposed_hybrid_coverage_pct": metrics.get("proposed_hybrid_coverage_pct"),
                "addressable_hard_coverage_pct": metrics.get("addressable_hard_coverage_pct"),
                "addressable_hybrid_coverage_pct": metrics.get("addressable_hybrid_coverage_pct"),
                "uncovered_orders_per_day": metrics.get("uncovered_orders_per_day"),
                "excluded_low_density_orders_per_day": metrics.get("excluded_low_density_orders_per_day"),
                "proposed_avg_cost": metrics.get("proposed_avg_cost"),
                "avg_modeled_cost_per_order": metrics.get("avg_modeled_cost_per_order"),
                "monthly_savings": metrics.get("monthly_savings"),
                "super_after_rationalization": sr.get("super_count_after"),
                "super_status_counts": json.dumps(sr.get("status_counts") or {}, sort_keys=True),
                "runtime_seconds": round(time.time() - run_start, 1),
                "json_path": scenario_files.get("json", ""),
                "proposed_hubs_path": scenario_files.get("proposed_hubs", ""),
            }
        )

    summary_df = pd.DataFrame(scenario_rows)
    summary_csv = os.path.join(OUTPUT_DIR, "super_scenario_sweep_summary.csv")
    summary_json = os.path.join(OUTPUT_DIR, "super_scenario_sweep_summary.json")
    summary_df.to_csv(summary_csv, index=False)
    with open(summary_json, "w") as fh:
        json.dump(scenario_rows, fh, indent=2)

    print("\n" + "=" * 78)
    print("Scenario sweep complete")
    print("=" * 78)
    print(summary_df.to_string(index=False))
    print(f"\nSummary CSV: {summary_csv}")
    print(f"Summary JSON: {summary_json}")
    print(f"Total runtime: {time.time() - total_start:.1f}s")


if __name__ == "__main__":
    main()
