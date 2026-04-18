from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple


@dataclass(frozen=True)
class DemandCluster:
    cluster_id: str
    lat: float
    lon: float
    orders_per_day: float
    member_count: int
    source_cell_ids: Tuple[str, ...] = ()


@dataclass(frozen=True)
class SolverSite:
    site_id: str
    lat: float
    lon: float
    fixed: bool = False
    source: str = "generated"
    store_sqft: Optional[float] = None
    super_eligible_fixed: bool = False
    orders_per_day: float = 0.0
    polygon_coords: Tuple[Tuple[float, float], ...] = ()


@dataclass(frozen=True)
class CandidateGenerationResult:
    sites: Sequence[SolverSite]
    summary: Dict[str, Any]


@dataclass(frozen=True)
class LoadedBangaloreData:
    demand_cells: Any
    in_scope_demand_cells: Any
    fixed_sites: Sequence[SolverSite]
    business_regions: Sequence[Dict[str, Any]]
    excluded_islands: Sequence[Dict[str, Any]]
    demand_summary: Dict[str, Any]


@dataclass(frozen=True)
class SolverInputs:
    demand_clusters: Sequence[DemandCluster]
    fixed_sites: Sequence[SolverSite]
    candidate_sites: Sequence[SolverSite]
    candidate_summary: Dict[str, Any]
    demand_summary: Dict[str, Any]
    business_regions: Sequence[Dict[str, Any]]
    excluded_islands: Sequence[Dict[str, Any]]


def build_solver_result_contract(
    *,
    config_snapshot: Dict[str, Any],
    policy_snapshot: Dict[str, Any],
    demand_summary: Dict[str, Any],
    candidate_summary: Dict[str, Any],
    store_counts: Dict[str, Any],
    reuse_counts: Dict[str, Any],
    upgrade_counts: Dict[str, Any],
    status: str,
    feasible: bool,
    hard_coverage_pct: float,
    hard_coverage_floor_pct: float,
    total_last_mile_cost_per_day: float,
    avg_last_mile_cost: Optional[float],
    selected_standard_site_ids: List[str],
    selected_super_site_ids: List[str],
    assignment_summary: Dict[str, Any],
    policy_evaluation: Dict[str, Any],
    prototype_notes: Sequence[str],
    unmet_requirements: Sequence[str],
) -> Dict[str, Any]:
    return {
        "result_contract": "bangalore_solver_v1",
        "solver_path": "bangalore_first_milp",
        "status": status,
        "feasible": bool(feasible),
        "city": "Bangalore",
        "fixed_store_mode": config_snapshot.get("fixed_store_mode"),
        "hard_coverage_pct": round(float(hard_coverage_pct), 4),
        "hard_coverage_floor_pct": round(float(hard_coverage_floor_pct), 4),
        "avg_last_mile_cost": None if avg_last_mile_cost is None else round(float(avg_last_mile_cost), 4),
        "total_last_mile_cost_per_day": round(float(total_last_mile_cost_per_day), 4),
        "store_counts": dict(store_counts),
        "reuse_counts": dict(reuse_counts),
        "upgrade_counts": dict(upgrade_counts),
        "candidate_summary": dict(candidate_summary),
        "demand_summary": dict(demand_summary),
        "config_snapshot": dict(config_snapshot),
        "policy_snapshot": dict(policy_snapshot),
        "selected_standard_site_ids": list(selected_standard_site_ids),
        "selected_super_site_ids": list(selected_super_site_ids),
        "assignment_summary": dict(assignment_summary),
        "policy_evaluation": dict(policy_evaluation),
        "prototype_notes": list(prototype_notes),
        "unmet_requirements": list(unmet_requirements),
    }
