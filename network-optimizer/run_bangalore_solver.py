#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json

from bangalore_solver.config import BangaloreSolverConfig
from bangalore_solver.runner import run_bangalore_solver


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Bangalore solver v1 prototype.")
    parser.add_argument("--cluster-cell-size-km", type=float, default=None)
    parser.add_argument("--demand-seed-candidate-limit", type=int, default=None)
    parser.add_argument("--gap-fill-candidate-limit", type=int, default=None)
    parser.add_argument("--candidate-spacing-km", type=float, default=None)
    parser.add_argument("--standard-radius-km", type=float, default=None)
    parser.add_argument("--super-radius-km", type=float, default=None)
    parser.add_argument("--min-total-physical-sites", type=int, default=None)
    parser.add_argument("--max-total-physical-sites", type=int, default=None)
    parser.add_argument("--target-total-physical-sites-exact", type=int, default=None)
    parser.add_argument("--avg-last-mile-cost-cap", type=float, default=None)
    parser.add_argument("--mini-density-radius-km", type=float, default=None)
    parser.add_argument("--mini-density-min-orders-per-day", type=float, default=None)
    parser.add_argument("--mini-prefer-existing-physical-site-radius-km", type=float, default=None)
    parser.add_argument("--mini-service-radius-km", type=float, default=None)
    parser.add_argument("--require-super-core-city-coverage", action="store_true")
    parser.add_argument("--super-core-city-fallback-min-demand-area-pct", type=float, default=None)
    parser.add_argument("--prefer-eligible-fixed-store-upgrades-to-super", action="store_true")
    parser.add_argument("--super-core-city-geojson-path", type=str, default=None)
    parser.add_argument("--super-core-exclude-geojson-path", type=str, default=None)
    parser.add_argument("--city-policy-json", type=str, default=None)
    parser.add_argument("--disable-mini-density-trigger", action="store_true")
    args = parser.parse_args()

    overrides = {
        "cluster_cell_size_km": args.cluster_cell_size_km,
        "demand_seed_candidate_limit": args.demand_seed_candidate_limit,
        "gap_fill_candidate_limit": args.gap_fill_candidate_limit,
        "candidate_spacing_km": args.candidate_spacing_km,
        "standard_radius_km": args.standard_radius_km,
        "super_radius_km": args.super_radius_km,
        "min_total_physical_sites": args.min_total_physical_sites,
        "max_total_physical_sites": args.max_total_physical_sites,
        "target_total_physical_sites_exact": args.target_total_physical_sites_exact,
        "avg_last_mile_cost_cap": args.avg_last_mile_cost_cap,
        "mini_density_radius_km": args.mini_density_radius_km,
        "mini_density_min_orders_per_day": args.mini_density_min_orders_per_day,
        "mini_prefer_existing_physical_site_radius_km": args.mini_prefer_existing_physical_site_radius_km,
        "mini_service_radius_km": args.mini_service_radius_km,
        "require_super_core_city_coverage": args.require_super_core_city_coverage,
        "super_core_city_fallback_min_demand_area_pct": args.super_core_city_fallback_min_demand_area_pct,
        "prefer_eligible_fixed_store_upgrades_to_super": args.prefer_eligible_fixed_store_upgrades_to_super,
        "super_core_city_geojson": args.super_core_city_geojson_path,
        "super_core_exclude_geojson": args.super_core_exclude_geojson_path,
    }
    if args.city_policy_json:
        overrides["city_policy_overrides"] = json.loads(args.city_policy_json)
    if args.disable_mini_density_trigger:
        overrides["mini_density_radius_km"] = 0.0
        overrides["mini_density_min_orders_per_day"] = 0.0
    config = BangaloreSolverConfig.from_overrides(overrides)
    result = run_bangalore_solver(config)
    print(json.dumps(result, indent=2, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
