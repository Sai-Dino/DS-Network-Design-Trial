from __future__ import annotations

import json
import re
from dataclasses import replace
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

from .config import REPO_ROOT, BangaloreSolverConfig
from .runner import run_bangalore_solver


def _anchor_overrides() -> Dict[str, Any]:
    return {
        "city_policy_overrides": {
            "Bangalore": {
                "min_total_physical_sites": 150,
                "max_total_physical_sites": 200,
                "mini_density_radius_km": 1.0,
                "mini_density_min_orders_per_day": 1212,
                "mini_prefer_existing_physical_site_radius_km": 1.0,
            }
        },
        "cluster_cell_size_km": 1.0,
        "candidate_spacing_km": 1.2,
        "demand_seed_candidate_limit": 240,
        "gap_fill_candidate_limit": 200,
    }


def _scenario(
    scenario_name: str,
    scenario_mode: str,
    overrides: Dict[str, Any],
    changed_policy_settings: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        "scenario_name": scenario_name,
        "scenario_mode": scenario_mode,
        "overrides": overrides,
        "changed_policy_settings": changed_policy_settings,
    }


def summarize_scenario_results(scenario_results: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for item in scenario_results:
        result = item.get("result", {})
        store_counts = result.get("store_counts", {})
        rows.append(
            {
                "scenario_name": item.get("scenario_name"),
                "scenario_mode": item.get("scenario_mode"),
                "changed_policy_settings": dict(item.get("changed_policy_settings", {})),
                "policy_settings": dict(item.get("policy_settings", {})),
                "hard_coverage_pct": result.get("hard_coverage_pct"),
                "avg_last_mile_cost": result.get("avg_last_mile_cost"),
                "fixed_standard_count": store_counts.get("fixed_standard_count"),
                "new_standard_count": store_counts.get("new_standard_count"),
                "upgraded_super_count": store_counts.get("upgraded_super_count"),
                "new_super_count": store_counts.get("new_super_count"),
                "mini_count": store_counts.get("mini_count"),
                "total_unique_physical_store_count": store_counts.get("total_unique_physical_store_count"),
                "feasible_status": item.get("status"),
                "commercially_comparable": bool(item.get("commercially_comparable")),
            }
        )
    return rows


def default_scenarios(mode: str = "all") -> List[Dict[str, Any]]:
    anchor = _anchor_overrides()
    exploratory = [
        _scenario("anchor_replay", "exploratory", dict(anchor), {}),
        _scenario("mini_radius_1_0", "exploratory", dict(anchor), {"mini_density_radius_km": 1.0}),
        _scenario(
            "mini_radius_1_25",
            "exploratory",
            {
                **dict(anchor),
                "city_policy_overrides": {
                    "Bangalore": {
                        "min_total_physical_sites": 150,
                        "max_total_physical_sites": 200,
                        "mini_density_radius_km": 1.25,
                        "mini_density_min_orders_per_day": 1212,
                        "mini_prefer_existing_physical_site_radius_km": 1.0,
                    }
                },
            },
            {"mini_density_radius_km": 1.25},
        ),
        _scenario(
            "mini_radius_1_5",
            "exploratory",
            {
                **dict(anchor),
                "city_policy_overrides": {
                    "Bangalore": {
                        "min_total_physical_sites": 150,
                        "max_total_physical_sites": 200,
                        "mini_density_radius_km": 1.5,
                        "mini_density_min_orders_per_day": 1212,
                        "mini_prefer_existing_physical_site_radius_km": 1.0,
                    }
                },
            },
            {"mini_density_radius_km": 1.5},
        ),
        _scenario("standard_radius_3_0", "exploratory", dict(anchor), {"standard_radius_km": 3.0}),
        _scenario(
            "standard_radius_3_5",
            "exploratory",
            {**dict(anchor), "standard_radius_km": 3.5},
            {"standard_radius_km": 3.5},
        ),
        _scenario("super_policy_off", "exploratory", dict(anchor), {"require_super_core_city_coverage": False}),
        _scenario(
            "super_policy_on_fallback",
            "exploratory",
            {**dict(anchor), "require_super_core_city_coverage": True},
            {
                "require_super_core_city_coverage": True,
                "super_core_policy_mode": "fallback_demand_area_90pct",
            },
        ),
        _scenario(
            "combined_exploratory_shift",
            "exploratory",
            {
                **dict(anchor),
                "standard_radius_km": 3.5,
                "require_super_core_city_coverage": True,
                "city_policy_overrides": {
                    "Bangalore": {
                        "min_total_physical_sites": 150,
                        "max_total_physical_sites": 200,
                        "mini_density_radius_km": 1.25,
                        "mini_density_min_orders_per_day": 1212,
                        "mini_prefer_existing_physical_site_radius_km": 1.0,
                    }
                },
            },
            {
                "standard_radius_km": 3.5,
                "mini_density_radius_km": 1.25,
                "require_super_core_city_coverage": True,
                "super_core_policy_mode": "fallback_demand_area_90pct",
            },
        ),
    ]
    constrained = [
        _scenario(
            "exact_total_physical_sites_200",
            "constrained",
            {**dict(anchor), "target_total_physical_sites_exact": 200},
            {"target_total_physical_sites_exact": 200},
        ),
        _scenario(
            "store_band_150_200",
            "constrained",
            dict(anchor),
            {"min_total_physical_sites": 150, "max_total_physical_sites": 200},
        ),
        _scenario(
            "avg_last_mile_cost_cap_35",
            "constrained",
            {**dict(anchor), "avg_last_mile_cost_cap": 35.0},
            {"avg_last_mile_cost_cap": 35.0},
        ),
        _scenario(
            "constrained_super_policy_off",
            "constrained",
            {**dict(anchor), "target_total_physical_sites_exact": 200},
            {
                "target_total_physical_sites_exact": 200,
                "require_super_core_city_coverage": False,
            },
        ),
        _scenario(
            "constrained_super_policy_on_fallback",
            "constrained",
            {
                **dict(anchor),
                "target_total_physical_sites_exact": 200,
                "require_super_core_city_coverage": True,
            },
            {
                "target_total_physical_sites_exact": 200,
                "require_super_core_city_coverage": True,
                "super_core_policy_mode": "fallback_demand_area_90pct",
            },
        ),
    ]
    if mode == "exploratory":
        return exploratory
    if mode == "constrained":
        return constrained
    return exploratory + constrained


def load_scenarios_from_file(path: Path) -> List[Dict[str, Any]]:
    payload = json.loads(Path(path).read_text())
    raw_scenarios = payload.get("scenarios", payload) if isinstance(payload, dict) else payload
    scenarios: List[Dict[str, Any]] = []
    for item in raw_scenarios:
        scenarios.append(
            {
                "scenario_name": str(item["scenario_name"]),
                "scenario_mode": str(item.get("scenario_mode", "exploratory")),
                "overrides": dict(item.get("overrides", {})),
                "changed_policy_settings": dict(item.get("changed_policy_settings", {})),
            }
        )
    return scenarios


def _commercially_comparable(result: Dict[str, Any], status: str) -> bool:
    if status != "feasible":
        return False
    store_counts = result.get("store_counts", {})
    total_sites = int(store_counts.get("total_unique_physical_store_count", 0) or 0)
    max_sites = result.get("policy_snapshot", {}).get("effective_max_total_physical_sites")
    if max_sites is not None and total_sites > int(max_sites):
        return False
    return float(result.get("hard_coverage_pct") or 0.0) >= float(result.get("hard_coverage_floor_pct") or 0.0)


def _scenario_status(result: Dict[str, Any]) -> str:
    status = str(result.get("status") or "")
    if status == "policy_blocked":
        return "blocked"
    if not bool(result.get("feasible")):
        return "infeasible"
    return "feasible"


def _render_markdown(rows: Sequence[Dict[str, Any]]) -> str:
    headers = [
        "scenario_mode",
        "scenario_name",
        "changed_policy_settings",
        "hard_coverage_pct",
        "avg_last_mile_cost",
        "fixed_standard_count",
        "new_standard_count",
        "upgraded_super_count",
        "new_super_count",
        "mini_count",
        "total_unique_physical_store_count",
        "feasible_status",
        "commercially_comparable",
    ]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    json.dumps(row["scenario_mode"]),
                    json.dumps(row["scenario_name"]),
                    json.dumps(row["changed_policy_settings"], sort_keys=True),
                    json.dumps(row["hard_coverage_pct"]),
                    json.dumps(row["avg_last_mile_cost"]),
                    json.dumps(row["fixed_standard_count"]),
                    json.dumps(row["new_standard_count"]),
                    json.dumps(row["upgraded_super_count"]),
                    json.dumps(row["new_super_count"]),
                    json.dumps(row["mini_count"]),
                    json.dumps(row["total_unique_physical_store_count"]),
                    json.dumps(row["feasible_status"]),
                    json.dumps(row["commercially_comparable"]),
                ]
            )
            + " |"
        )
    return "\n".join(lines) + "\n"


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "scenario"


def run_bangalore_solver_scenarios(
    *,
    base_config: Optional[BangaloreSolverConfig] = None,
    scenarios: Optional[Sequence[Dict[str, Any]]] = None,
    output_dir: Optional[Path] = None,
    mode: str = "all",
) -> Dict[str, Any]:
    base_config = base_config or BangaloreSolverConfig()
    scenario_defs = list(scenarios or default_scenarios(mode))
    output_dir = output_dir or (REPO_ROOT / "optimization_results" / "policy_scenarios")
    output_dir.mkdir(parents=True, exist_ok=True)
    scenario_output_dir = output_dir / "scenario_runs"
    scenario_output_dir.mkdir(parents=True, exist_ok=True)

    scenario_results: List[Dict[str, Any]] = []
    for scenario in scenario_defs:
        scenario_name = str(scenario["scenario_name"])
        overrides = dict(scenario.get("overrides", {}))
        slug = _slugify(scenario_name)
        scenario_config = replace(
            base_config,
            output_path=scenario_output_dir / f"{slug}.json",
            output_history_dir=scenario_output_dir,
        )
        config = replace(scenario_config, **overrides)
        result = run_bangalore_solver(config)
        scenario_results.append(
            {
                "scenario_name": scenario_name,
                "scenario_mode": str(scenario.get("scenario_mode", "exploratory")),
                "changed_policy_settings": dict(scenario.get("changed_policy_settings", {})),
                "policy_settings": dict(config.resolved_policy().to_dict()),
                "status": _scenario_status(result),
                "commercially_comparable": _commercially_comparable(result, _scenario_status(result)),
                "result": result,
                "artifact_path": str(config.output_path),
            }
        )

    rows = summarize_scenario_results(scenario_results)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    json_path = output_dir / "latest_bangalore_solver_policy_scenarios.json"
    timestamped_json_path = output_dir / f"bangalore_solver_policy_scenarios_{timestamp}.json"
    markdown_path = output_dir / "latest_bangalore_solver_policy_scenarios.md"
    payload = {
        "scenario_results": scenario_results,
        "summary_rows": rows,
        "artifact_paths": {
            "latest_json": str(json_path),
            "timestamped_json": str(timestamped_json_path),
            "latest_markdown": str(markdown_path),
        },
    }
    json_text = json.dumps(payload, indent=2, allow_nan=False)
    markdown_text = _render_markdown(rows)
    json_path.write_text(json_text)
    timestamped_json_path.write_text(json_text)
    markdown_path.write_text(markdown_text)
    return payload
