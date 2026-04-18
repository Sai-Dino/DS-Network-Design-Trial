from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
import scipy.sparse as sp
from scipy.optimize import Bounds, LinearConstraint, milp

import server
from geometry_core import cell_needs_super_core_coverage, parse_geojson_string, polygons_from_geojson

from .config import BangaloreSolverConfig
from .contracts import SolverInputs, SolverSite, build_solver_result_contract
from .semantics import (
    build_reuse_and_upgrade_counts,
    calculate_uncovered_demand_budget,
    summarize_selected_network,
)


@dataclass(frozen=True)
class _DemandEdge:
    demand_index: int
    site_id: str
    tier: str
    distance_km: float
    open_var_kind: Optional[str]
    open_var_index: Optional[int]
    cost: float


@dataclass(frozen=True)
class _SuperCoverageTarget:
    active: bool
    mode: str
    target_cluster_indices: Tuple[int, ...]
    target_weights: Tuple[int, ...]
    required_weight: int
    total_target_weight: int
    required_pct: float
    measurement_basis: str
    geojson_supplied: bool


@dataclass(frozen=True)
class _StandardRealismCandidate:
    boundary_clearance_km: float
    nearest_fixed_store_distance_km: float
    boundary_shortfall_km: float
    fixed_store_shortfall_km: float
    incremental_value_orders_per_day: float


@dataclass(frozen=True)
class _StandardRealismContext:
    boundary_target_km: float
    fixed_store_buffer_km: float
    soft_cluster_radius_km: float
    weak_incremental_orders_per_day: float
    close_pair_penalty_weight: float
    candidate_metrics: Dict[str, _StandardRealismCandidate]
    soft_cluster_pairs: Tuple[Tuple[int, int, float], ...]


def _pair_distance_km(site_a: SolverSite, site_b: SolverSite) -> float:
    return server._haversine_km(site_a.lat, site_a.lon, site_b.lat, site_b.lon)


def _cluster_distance_km(cluster_a, cluster_b) -> float:
    return server._haversine_km(cluster_a.lat, cluster_a.lon, cluster_b.lat, cluster_b.lon)


def _standard_unit_cost(config: BangaloreSolverConfig, distance_km: float) -> float:
    return float(config.standard_base_cost) + float(config.standard_variable_rate) * float(distance_km)


def _super_unit_cost(config: BangaloreSolverConfig, distance_km: float) -> float:
    return float(config.effective_super_base_cost) + float(config.super_variable_rate) * float(distance_km)


def _mini_unit_cost(config: BangaloreSolverConfig, distance_km: float) -> float:
    return float(config.mini_base_cost) + float(config.mini_variable_rate) * float(distance_km)


def _distance_lookup_for_sites(
    inputs: SolverInputs,
    config: BangaloreSolverConfig,
    distance_lookup: Optional[Dict[Tuple[str, str], float]] = None,
) -> Dict[Tuple[str, str], float]:
    if distance_lookup is not None:
        return dict(distance_lookup)

    lookup: Dict[Tuple[str, str], float] = {}
    all_sites = list(inputs.fixed_sites) + list(inputs.candidate_sites)
    demand_lats = np.array([cluster.lat for cluster in inputs.demand_clusters], dtype=np.float64)
    demand_lons = np.array([cluster.lon for cluster in inputs.demand_clusters], dtype=np.float64)
    for site in all_sites:
        distances = server.osrm_one_to_many(site.lat, site.lon, demand_lats, demand_lons)
        for cluster, dist in zip(inputs.demand_clusters, distances):
            lookup[(site.site_id, cluster.cluster_id)] = float(dist)
    return lookup


def _build_spacing_blockers(inputs: SolverInputs, config: BangaloreSolverConfig) -> tuple[set[str], list[tuple[int, int]]]:
    blocked_candidate_ids: set[str] = set()
    conflicts: list[tuple[int, int]] = []
    candidate_sites = list(inputs.candidate_sites)
    for cand in candidate_sites:
        for fixed in inputs.fixed_sites:
            if _pair_distance_km(cand, fixed) < float(config.candidate_spacing_km):
                blocked_candidate_ids.add(cand.site_id)
                break
    for idx_a, site_a in enumerate(candidate_sites):
        for idx_b in range(idx_a + 1, len(candidate_sites)):
            site_b = candidate_sites[idx_b]
            if _pair_distance_km(site_a, site_b) < float(config.candidate_spacing_km):
                conflicts.append((idx_a, idx_b))
    return blocked_candidate_ids, conflicts


def _select_density_triggered_mini_sites(
    demand_clusters: Sequence,
    covered_demand_indices: Sequence[int],
    config: BangaloreSolverConfig,
) -> tuple[list[Dict[str, Any]], Dict[str, Any]]:
    density_radius_km = config.effective_mini_density_radius_km
    density_min_orders_per_day = config.effective_mini_density_min_orders_per_day
    summary: Dict[str, Any] = {
        "trigger_enabled": density_radius_km is not None and density_min_orders_per_day is not None,
        "density_radius_km": density_radius_km,
        "density_min_orders_per_day": density_min_orders_per_day,
        "qualifying_cluster_count": 0,
        "open_site_count": 0,
    }
    if density_radius_km is None or density_min_orders_per_day is None:
        return [], summary
    if density_radius_km <= 0 or density_min_orders_per_day <= 0:
        return [], summary

    qualifying: list[Dict[str, Any]] = []
    covered = list(covered_demand_indices)
    for demand_idx in covered:
        cluster = demand_clusters[demand_idx]
        local_orders = 0.0
        for other_idx in covered:
            other = demand_clusters[other_idx]
            if _cluster_distance_km(cluster, other) <= float(density_radius_km) + 1e-9:
                local_orders += float(other.orders_per_day)
        if local_orders + 1e-9 >= float(density_min_orders_per_day):
            qualifying.append(
                {
                    "demand_index": int(demand_idx),
                    "cluster_id": cluster.cluster_id,
                    "lat": float(cluster.lat),
                    "lon": float(cluster.lon),
                    "orders_per_day": float(cluster.orders_per_day),
                    "local_orders_per_day": round(float(local_orders), 4),
                }
            )

    qualifying.sort(
        key=lambda item: (
            -float(item["local_orders_per_day"]),
            float(item["lat"]),
            float(item["lon"]),
            str(item["cluster_id"]),
        )
    )
    summary["qualifying_cluster_count"] = len(qualifying)
    if not qualifying:
        return [], summary

    if len(qualifying) == 1:
        open_sites = [qualifying[0]]
        summary["open_site_count"] = 1
        return open_sites, summary

    n_qualifying = len(qualifying)
    coverage = np.zeros((n_qualifying, n_qualifying), dtype=np.float64)
    for row_idx, row in enumerate(qualifying):
        row_cluster = demand_clusters[row["demand_index"]]
        for col_idx, col in enumerate(qualifying):
            col_cluster = demand_clusters[col["demand_index"]]
            if _cluster_distance_km(row_cluster, col_cluster) <= float(density_radius_km) + 1e-9:
                coverage[row_idx, col_idx] = 1.0

    integrality = np.ones(n_qualifying, dtype=np.int8)
    bounds = Bounds(np.zeros(n_qualifying, dtype=np.float64), np.ones(n_qualifying, dtype=np.float64))
    coverage_constraint = LinearConstraint(
        sp.csr_matrix(coverage),
        np.ones(n_qualifying, dtype=np.float64),
        np.full(n_qualifying, np.inf, dtype=np.float64),
    )

    count_result = milp(
        c=np.ones(n_qualifying, dtype=np.float64),
        integrality=integrality,
        bounds=bounds,
        constraints=[coverage_constraint],
        options={"disp": False},
    )
    if count_result.status not in (0, 1) or count_result.x is None:
        raise RuntimeError(str(count_result.message))
    open_count = int(round(float(np.sum(count_result.x))))

    tie_break_constraint = LinearConstraint(
        np.ones((1, n_qualifying), dtype=np.float64),
        np.array([float(open_count)], dtype=np.float64),
        np.array([float(open_count)], dtype=np.float64),
    )
    tie_break_cost = np.arange(1, n_qualifying + 1, dtype=np.float64)
    rank_result = milp(
        c=tie_break_cost,
        integrality=integrality,
        bounds=bounds,
        constraints=[coverage_constraint, tie_break_constraint],
        options={"disp": False},
    )
    if rank_result.status not in (0, 1) or rank_result.x is None:
        raise RuntimeError(str(rank_result.message))

    open_sites = [
        qualifying[idx]
        for idx in range(n_qualifying)
        if float(rank_result.x[idx]) > 0.5
    ]
    summary["open_site_count"] = len(open_sites)
    return open_sites, summary


def _physical_site_catalog(
    fixed_sites: Sequence[SolverSite],
    candidate_index: Dict[str, SolverSite],
    selected_standard_site_ids: Sequence[str],
) -> list[SolverSite]:
    return list(fixed_sites) + [
        candidate_index[site_id]
        for site_id in selected_standard_site_ids
        if site_id in candidate_index
    ]


def _nearest_site_distance_km(site: SolverSite, other_sites: Sequence[SolverSite]) -> float:
    if not other_sites:
        return math.inf
    return min(_pair_distance_km(site, other) for other in other_sites)


def _is_weak_incremental_value(incremental_value_orders_per_day: float, weak_threshold_orders_per_day: float) -> bool:
    if weak_threshold_orders_per_day <= 0.0:
        return True
    return float(incremental_value_orders_per_day) + 1e-9 < float(weak_threshold_orders_per_day)


def _build_standard_realism_context(
    candidate_sites: Sequence[SolverSite],
    fixed_sites: Sequence[SolverSite],
    business_regions: Sequence[Dict[str, Any]],
    demand_clusters: Sequence,
    distance_by_site: Dict[Tuple[str, str], float],
    config: BangaloreSolverConfig,
) -> _StandardRealismContext:
    boundary_target_km = float(config.effective_standard_min_boundary_clearance_km or 0.0)
    fixed_store_buffer_km = float(config.effective_standard_fixed_store_buffer_km or 0.0)
    soft_cluster_radius_km = float(config.effective_standard_soft_cluster_radius_km or 0.0)
    weak_incremental_orders_per_day = float(config.effective_standard_weak_incremental_orders_per_day or 0.0)
    close_pair_penalty_weight = float(config.effective_standard_close_pair_penalty_weight or 0.0)
    candidate_metrics: Dict[str, _StandardRealismCandidate] = {}
    incremental_value_orders_by_site = {site.site_id: 0.0 for site in candidate_sites}

    for cluster in demand_clusters:
        fixed_covers_cluster = any(
            math.isfinite(float(distance_by_site.get((site.site_id, cluster.cluster_id), math.inf)))
            and float(distance_by_site.get((site.site_id, cluster.cluster_id), math.inf))
            <= float(config.standard_radius_km) + 1e-9
            for site in fixed_sites
        )
        if fixed_covers_cluster:
            continue
        for site in candidate_sites:
            distance_km = float(distance_by_site.get((site.site_id, cluster.cluster_id), math.inf))
            if math.isfinite(distance_km) and distance_km <= float(config.standard_radius_km) + 1e-9:
                incremental_value_orders_by_site[site.site_id] += float(cluster.orders_per_day)

    for site in candidate_sites:
        boundary_clearance_km = float(
            server._business_region_boundary_clearance_km(site.lat, site.lon, business_regions)
        ) if business_regions else math.inf
        nearest_fixed_store_distance_km = _nearest_site_distance_km(site, fixed_sites)
        candidate_metrics[site.site_id] = _StandardRealismCandidate(
            boundary_clearance_km=float(boundary_clearance_km),
            nearest_fixed_store_distance_km=float(nearest_fixed_store_distance_km),
            boundary_shortfall_km=max(0.0, boundary_target_km - float(boundary_clearance_km)),
            fixed_store_shortfall_km=max(0.0, fixed_store_buffer_km - float(nearest_fixed_store_distance_km)),
            incremental_value_orders_per_day=float(incremental_value_orders_by_site.get(site.site_id, 0.0)),
        )

    soft_cluster_pairs: List[Tuple[int, int, float]] = []
    if soft_cluster_radius_km > 0.0:
        for idx_a, site_a in enumerate(candidate_sites):
            for idx_b in range(idx_a + 1, len(candidate_sites)):
                site_b = candidate_sites[idx_b]
                distance_km = _pair_distance_km(site_a, site_b)
                if distance_km + 1e-9 < soft_cluster_radius_km:
                    soft_cluster_pairs.append(
                        (
                            idx_a,
                            idx_b,
                            max(0.0, float(soft_cluster_radius_km) - float(distance_km)),
                        )
                    )

    return _StandardRealismContext(
        boundary_target_km=boundary_target_km,
        fixed_store_buffer_km=fixed_store_buffer_km,
        soft_cluster_radius_km=soft_cluster_radius_km,
        weak_incremental_orders_per_day=weak_incremental_orders_per_day,
        close_pair_penalty_weight=close_pair_penalty_weight,
        candidate_metrics=candidate_metrics,
        soft_cluster_pairs=tuple(soft_cluster_pairs),
    )


def _nearest_physical_site_within_radius(
    lat: float,
    lon: float,
    physical_sites: Sequence[SolverSite],
    radius_km: float,
) -> Optional[SolverSite]:
    best_site: Optional[SolverSite] = None
    best_distance = math.inf
    for site in physical_sites:
        distance_km = server._haversine_km(float(lat), float(lon), float(site.lat), float(site.lon))
        if distance_km <= float(radius_km) + 1e-9 and distance_km < best_distance:
            best_site = site
            best_distance = distance_km
    return best_site


def _site_payload(site: SolverSite, *, label: str, fixed_open: Optional[bool] = None) -> Dict[str, Any]:
    return {
        "id": site.site_id,
        "site_id": site.site_id,
        "lat": float(site.lat),
        "lon": float(site.lon),
        "orders_per_day": float(site.orders_per_day),
        "source": site.source,
        "fixed_open": bool(site.fixed if fixed_open is None else fixed_open),
        "store_sqft": site.store_sqft,
        "super_eligible_fixed": bool(site.super_eligible_fixed),
        "polygon_coords": [list(point) for point in site.polygon_coords],
        "selection_label": label,
    }


def _build_proposed_site_mix_summary(store_counts: Dict[str, Any]) -> Dict[str, int]:
    return {
        "fixed_standard_remaining_open_count": int(store_counts.get("fixed_standard_count", 0) or 0),
        "net_new_standard_count": int(store_counts.get("new_standard_count", 0) or 0),
        "fixed_store_upgrades_to_super_count": int(store_counts.get("upgraded_super_count", 0) or 0),
        "net_new_super_count": int(store_counts.get("new_super_count", 0) or 0),
        "net_new_mini_count": int(store_counts.get("mini_count", 0) or 0),
        "total_unique_physical_store_count": int(store_counts.get("total_unique_physical_store_count", 0) or 0),
    }


def _build_downloadable_proposed_site_rows(
    *,
    selected_new_standard_sites: Sequence[Dict[str, Any]],
    fixed_super_upgrade_sites: Sequence[Dict[str, Any]],
    new_super_sites: Sequence[Dict[str, Any]],
    mini_sites: Sequence[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []

    def append_rows(
        sites: Sequence[Dict[str, Any]],
        *,
        site_type: str,
        tier: str,
        action: str,
    ) -> None:
        for site in sites:
            rows.append(
                {
                    "site_type": site_type,
                    "tier": tier,
                    "action": action,
                    "site_id": site.get("site_id") or site.get("id"),
                    "lat": site.get("lat"),
                    "lon": site.get("lon"),
                    "orders_per_day": site.get("orders_per_day"),
                    "radius_km": site.get("radius_km"),
                    "counts_as_unique_physical_site": bool(site.get("counts_as_unique_physical_site", True)),
                    "site_semantics": site.get("site_semantics"),
                }
            )

    append_rows(
        selected_new_standard_sites,
        site_type="net_new_standard",
        tier="Standard",
        action="Open net-new Standard site",
    )
    append_rows(
        fixed_super_upgrade_sites,
        site_type="fixed_store_upgrade_to_super",
        tier="Super",
        action="Upgrade fixed Standard site to Super",
    )
    append_rows(
        new_super_sites,
        site_type="net_new_super",
        tier="Super",
        action="Open net-new Super site",
    )
    append_rows(
        mini_sites,
        site_type="net_new_mini",
        tier="Mini",
        action="Open net-new Mini site",
    )
    return rows


def _policy_evaluation(
    *,
    blocked_reasons: Optional[Sequence[str]] = None,
    violations: Optional[Sequence[str]] = None,
    super_coverage: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    blocked = [str(item) for item in (blocked_reasons or []) if str(item).strip()]
    violated = [str(item) for item in (violations or []) if str(item).strip()]
    return {
        "blocked_reasons": blocked,
        "violations": violated,
        "super_coverage": dict(super_coverage or {}),
        "all_constraints_satisfied": not blocked and not violated,
    }


def _resolve_geojson_payload(value: Optional[Any]) -> Optional[Any]:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, Path):
        return json.loads(value.read_text())
    if isinstance(value, str):
        candidate_path = Path(value)
        if candidate_path.exists():
            return json.loads(candidate_path.read_text())
        return parse_geojson_string(value)
    return value


def _cluster_area_weight(cluster: Any) -> int:
    source_cell_ids = tuple(getattr(cluster, "source_cell_ids", ()) or ())
    if source_cell_ids:
        return max(1, int(len(source_cell_ids)))
    member_count = getattr(cluster, "member_count", 0)
    return max(1, int(member_count or 0))


def _build_super_coverage_target(
    demand_clusters: Sequence,
    config: BangaloreSolverConfig,
) -> tuple[_SuperCoverageTarget, Dict[str, Any]]:
    fallback_definition = (
        "Without authoritative core-city GeoJSON, this fallback measures the share of "
        "demand-bearing solver cells represented by the clustered model; it is not literal geographic area coverage."
    )
    geojson_definition = (
        "With authoritative core-city GeoJSON, the target set is the demand-bearing solver cells that fall inside the "
        "supplied geometry after exclusions."
    )
    if not config.effective_require_super_core_city_coverage:
        summary = {
            "active": False,
            "mode": "off",
            "target_cluster_count": 0,
            "target_member_count": 0,
            "required_member_count": 0,
            "required_solver_cell_pct": 0.0,
            "measurement_basis": "demand_bearing_solver_cell_count_proxy",
            "geojson_supplied": False,
            "definition": fallback_definition,
        }
        return (
            _SuperCoverageTarget(
                active=False,
                mode="off",
                target_cluster_indices=(),
                target_weights=(),
                required_weight=0,
                total_target_weight=0,
                required_pct=0.0,
                measurement_basis="demand_bearing_solver_cell_count_proxy",
                geojson_supplied=False,
            ),
            summary,
        )

    core_geojson = _resolve_geojson_payload(config.effective_super_core_city_geojson)
    exclude_geojson = _resolve_geojson_payload(config.effective_super_core_exclude_geojson)
    target_indices: List[int] = []
    mode = "fallback_demand_cells_proxy"
    required_pct = float(config.effective_super_core_city_fallback_min_demand_area_pct)
    if core_geojson:
        core_polys = polygons_from_geojson(core_geojson)
        exclude_polys = polygons_from_geojson(exclude_geojson)
        target_indices = [
            idx
            for idx, cluster in enumerate(demand_clusters)
            if cell_needs_super_core_coverage(
                float(cluster.lat),
                float(cluster.lon),
                core_polys,
                exclude_polys,
            )
        ]
        mode = "authoritative_geojson"
        required_pct = 100.0
    else:
        target_indices = list(range(len(demand_clusters)))

    target_weights = tuple(_cluster_area_weight(demand_clusters[idx]) for idx in target_indices)
    total_weight = int(sum(target_weights))
    required_weight = (
        total_weight
        if mode == "authoritative_geojson"
        else int(math.ceil((required_pct / 100.0) * total_weight - 1e-9))
    )
    summary = {
        "active": True,
        "mode": mode,
        "target_cluster_count": int(len(target_indices)),
        "target_member_count": int(total_weight),
        "required_member_count": int(required_weight),
        "required_solver_cell_pct": float(required_pct),
        "measurement_basis": "demand_bearing_solver_cell_count_proxy",
        "geojson_supplied": bool(core_geojson),
        "definition": geojson_definition if core_geojson else fallback_definition,
        "target_solver_cell_count": int(total_weight),
        "required_solver_cell_count": int(required_weight),
    }
    return (
        _SuperCoverageTarget(
            active=True,
            mode=mode,
            target_cluster_indices=tuple(target_indices),
            target_weights=target_weights,
            required_weight=int(required_weight),
            total_target_weight=int(total_weight),
            required_pct=float(required_pct),
            measurement_basis="demand_bearing_solver_cell_count_proxy",
            geojson_supplied=bool(core_geojson),
        ),
        summary,
    )


def _selected_standard_realism_diagnostics(
    *,
    selected_standard_site_ids: Sequence[str],
    candidate_sites: Sequence[SolverSite],
    candidate_index: Dict[str, SolverSite],
    realism_context: _StandardRealismContext,
) -> tuple[Dict[str, Any], Dict[str, Dict[str, Any]]]:
    selected_sites = [
        candidate_index[site_id]
        for site_id in selected_standard_site_ids
        if site_id in candidate_index
    ]
    soft_cluster_radius_km = float(realism_context.soft_cluster_radius_km or 0.0)
    boundary_target_km = float(realism_context.boundary_target_km or 0.0)
    fixed_store_buffer_km = float(realism_context.fixed_store_buffer_km or 0.0)
    weak_incremental_orders_per_day = float(realism_context.weak_incremental_orders_per_day or 0.0)
    close_pair_penalty_weight = float(realism_context.close_pair_penalty_weight or 0.0)

    selected_site_payloads: Dict[str, Dict[str, Any]] = {}
    clustered_pair_ids: List[Tuple[str, str]] = []
    clustered_site_ids: set[str] = set()
    near_fixed_site_ids: set[str] = set()
    boundary_hugging_site_ids: set[str] = set()
    weak_boundary_hugging_site_ids: set[str] = set()
    weak_near_fixed_site_ids: set[str] = set()
    strong_boundary_hugging_site_ids: set[str] = set()
    strong_near_fixed_site_ids: set[str] = set()

    for site in selected_sites:
        metrics = realism_context.candidate_metrics.get(site.site_id)
        if metrics is None:
            continue
        nearest_selected_standard_distance_km = math.inf
        nearby_selected_standard_ids: List[str] = []
        for other in selected_sites:
            if other.site_id == site.site_id:
                continue
            distance_km = _pair_distance_km(site, other)
            nearest_selected_standard_distance_km = min(nearest_selected_standard_distance_km, distance_km)
            if soft_cluster_radius_km > 0.0 and distance_km + 1e-9 < soft_cluster_radius_km:
                nearby_selected_standard_ids.append(other.site_id)
                clustered_site_ids.add(site.site_id)
                clustered_pair_ids.append(tuple(sorted((site.site_id, other.site_id))))

        weak_incremental_value = _is_weak_incremental_value(
            metrics.incremental_value_orders_per_day,
            weak_incremental_orders_per_day,
        )
        flags: List[str] = []
        is_boundary_hugging = boundary_target_km > 0.0 and metrics.boundary_clearance_km + 1e-9 < boundary_target_km
        if is_boundary_hugging:
            boundary_hugging_site_ids.add(site.site_id)
            if weak_incremental_value:
                weak_boundary_hugging_site_ids.add(site.site_id)
                flags.append("weak_boundary_clearance_below_target")
            else:
                strong_boundary_hugging_site_ids.add(site.site_id)
                flags.append("boundary_clearance_below_target_but_high_incremental_value")
        is_near_fixed = (
            fixed_store_buffer_km > 0.0
            and metrics.nearest_fixed_store_distance_km + 1e-9 < fixed_store_buffer_km
        )
        if is_near_fixed:
            near_fixed_site_ids.add(site.site_id)
            if weak_incremental_value:
                weak_near_fixed_site_ids.add(site.site_id)
                flags.append("weak_near_fixed_store_buffer")
            else:
                strong_near_fixed_site_ids.add(site.site_id)
                flags.append("near_fixed_store_buffer_but_high_incremental_value")
        if nearby_selected_standard_ids:
            flags.append("clustered_with_selected_standard")

        selected_site_payloads[site.site_id] = {
            "boundary_clearance_km": (
                None if not math.isfinite(metrics.boundary_clearance_km) else round(float(metrics.boundary_clearance_km), 4)
            ),
            "nearest_fixed_store_distance_km": (
                None
                if not math.isfinite(metrics.nearest_fixed_store_distance_km)
                else round(float(metrics.nearest_fixed_store_distance_km), 4)
            ),
            "nearest_selected_standard_distance_km": (
                None
                if not math.isfinite(nearest_selected_standard_distance_km)
                else round(float(nearest_selected_standard_distance_km), 4)
            ),
            "nearby_selected_standard_ids": sorted(set(nearby_selected_standard_ids)),
            "nearby_selected_standard_count": int(len(set(nearby_selected_standard_ids))),
            "incremental_value_orders_per_day": round(float(metrics.incremental_value_orders_per_day), 4),
            "weak_incremental_value_threshold_orders_per_day": round(float(weak_incremental_orders_per_day), 4),
            "is_weak_incremental_value": bool(weak_incremental_value),
            "realism_flags": flags,
        }

    unique_clustered_pairs = sorted(set(clustered_pair_ids))
    suspicious_site_ids = sorted(
        weak_boundary_hugging_site_ids
        | weak_near_fixed_site_ids
        | clustered_site_ids
    )
    diagnostics = {
        "selected_new_standard_count": int(len(selected_sites)),
        "boundary_clearance_target_km": round(float(boundary_target_km), 4),
        "fixed_store_buffer_target_km": round(float(fixed_store_buffer_km), 4),
        "soft_cluster_radius_km": round(float(soft_cluster_radius_km), 4),
        "incremental_value_metric": {
            "metric_key": "fixed_network_uncovered_demand_orders_per_day",
            "definition": (
                "For each candidate Standard site, sum solver-cluster orders/day that the site can cover within the "
                "Standard radius and that no fixed benchmark store can cover within the same Standard radius."
            ),
            "weak_threshold_orders_per_day": round(float(weak_incremental_orders_per_day), 4),
            "close_pair_penalty_weight": round(float(close_pair_penalty_weight), 4),
            "blunt_realism_mode": bool(weak_incremental_orders_per_day <= 0.0),
        },
        "boundary_hugging_standard_count": int(len(boundary_hugging_site_ids)),
        "near_fixed_store_standard_count": int(len(near_fixed_site_ids)),
        "weak_incremental_boundary_hugging_standard_count": int(len(weak_boundary_hugging_site_ids)),
        "weak_incremental_near_fixed_store_standard_count": int(len(weak_near_fixed_site_ids)),
        "strong_incremental_boundary_hugging_standard_count": int(len(strong_boundary_hugging_site_ids)),
        "strong_incremental_near_fixed_store_standard_count": int(len(strong_near_fixed_site_ids)),
        "clustered_standard_count": int(len(clustered_site_ids)),
        "clustered_standard_pair_count": int(len(unique_clustered_pairs)),
        "suspicious_standard_count": int(len(suspicious_site_ids)),
        "clustered_standard_pairs": [list(item) for item in unique_clustered_pairs],
        "boundary_hugging_standard_ids": sorted(boundary_hugging_site_ids),
        "near_fixed_store_standard_ids": sorted(near_fixed_site_ids),
        "weak_incremental_boundary_hugging_standard_ids": sorted(weak_boundary_hugging_site_ids),
        "weak_incremental_near_fixed_store_standard_ids": sorted(weak_near_fixed_site_ids),
        "suspicious_standard_ids": suspicious_site_ids,
    }
    return diagnostics, selected_site_payloads


def _apply_density_triggered_mini_stage(
    *,
    demand_clusters: Sequence,
    selected_edges_by_demand: Dict[int, _DemandEdge],
    fixed_sites: Sequence[SolverSite],
    candidate_index: Dict[str, SolverSite],
    selected_standard_site_ids: Sequence[str],
    config: BangaloreSolverConfig,
    base_total_cost_per_day: float,
) -> tuple[list[Dict[str, Any]], Dict[str, Any], float]:
    covered_demand_indices = sorted(selected_edges_by_demand.keys())
    mini_sites, mini_stage_summary = _select_density_triggered_mini_sites(
        demand_clusters,
        covered_demand_indices,
        config,
    )
    if not mini_sites:
        mini_stage_summary.update(
            {
                "served_orders_per_day": 0.0,
                "served_cluster_count": 0,
                "new_unique_mini_site_count": 0,
            }
        )
        return [], mini_stage_summary, float(base_total_cost_per_day)

    physical_sites = _physical_site_catalog(fixed_sites, candidate_index, selected_standard_site_ids)
    snap_radius_km = float(config.effective_mini_prefer_existing_physical_site_radius_km or 0.05)
    site_payload_by_key: Dict[str, Dict[str, Any]] = {}
    for item in mini_sites:
        nearest_physical_site = _nearest_physical_site_within_radius(
            item["lat"],
            item["lon"],
            physical_sites,
            radius_km=snap_radius_km,
        )
        if nearest_physical_site is None:
            site_key = f"cluster::{item['cluster_id']}"
            site_id = f"mini-density-{item['cluster_id']}"
            site_lat = float(item["lat"])
            site_lon = float(item["lon"])
            co_located_with_site_id = None
        else:
            site_key = f"physical::{nearest_physical_site.site_id}"
            site_id = f"mini-density-colocated-{nearest_physical_site.site_id}"
            site_lat = float(nearest_physical_site.lat)
            site_lon = float(nearest_physical_site.lon)
            co_located_with_site_id = nearest_physical_site.site_id

        payload = site_payload_by_key.get(site_key)
        if payload is None:
            payload = {
                "id": site_id,
                "site_id": site_id,
                "lat": site_lat,
                "lon": site_lon,
                "orders_per_day": 0.0,
                "gross_orders_per_day": 0.0,
                "radius_km": float(config.mini_service_radius_km),
                "density_radius_km": float(config.effective_mini_density_radius_km or 0.0),
                "trigger_cluster_id": item["cluster_id"],
                "trigger_cluster_ids": [],
                "trigger_cluster_count": 0,
                "trigger_orders_per_day": float(item["local_orders_per_day"]),
                "trigger_orders_per_day_total": 0.0,
                "served_cluster_ids": [],
                "served_cluster_count": 0,
                "co_located_with_site_id": co_located_with_site_id,
                "counts_as_unique_physical_site": co_located_with_site_id is None,
                "source": "density_triggered_solver_stage",
                "site_semantics": "mini_density_trigger",
            }
            site_payload_by_key[site_key] = payload
        payload["trigger_cluster_ids"].append(str(item["cluster_id"]))
        payload["trigger_cluster_count"] = len(payload["trigger_cluster_ids"])
        payload["trigger_orders_per_day"] = max(
            float(payload["trigger_orders_per_day"]),
            float(item["local_orders_per_day"]),
        )
        payload["trigger_orders_per_day_total"] += float(item["local_orders_per_day"])

    open_site_payloads = list(site_payload_by_key.values())

    total_cost_per_day = 0.0
    served_orders_per_day = 0.0
    served_cluster_count = 0
    for demand_idx, edge in selected_edges_by_demand.items():
        cluster = demand_clusters[demand_idx]
        base_unit_cost = (
            _super_unit_cost(config, edge.distance_km)
            if edge.tier == "super"
            else _standard_unit_cost(config, edge.distance_km)
        )
        chosen_unit_cost = float(base_unit_cost)
        chosen_site: Optional[Dict[str, Any]] = None
        for site in open_site_payloads:
            dist = server._haversine_km(float(site["lat"]), float(site["lon"]), float(cluster.lat), float(cluster.lon))
            if dist > float(config.mini_service_radius_km) + 1e-9:
                continue
            mini_unit_cost = _mini_unit_cost(config, dist)
            if mini_unit_cost + 1e-9 < chosen_unit_cost:
                chosen_unit_cost = float(mini_unit_cost)
                chosen_site = site
        total_cost_per_day += float(cluster.orders_per_day) * chosen_unit_cost
        if chosen_site is not None:
            chosen_site["orders_per_day"] += float(cluster.orders_per_day)
            chosen_site["gross_orders_per_day"] += float(cluster.orders_per_day)
            chosen_site["served_cluster_ids"].append(cluster.cluster_id)
            served_orders_per_day += float(cluster.orders_per_day)
            served_cluster_count += 1

    for site in open_site_payloads:
        site["trigger_cluster_ids"] = sorted(set(site["trigger_cluster_ids"]))
        site["trigger_cluster_count"] = len(site["trigger_cluster_ids"])
        site["served_cluster_ids"] = sorted(site["served_cluster_ids"])
        site["served_cluster_count"] = len(site["served_cluster_ids"])
        site["cells"] = int(site["served_cluster_count"])

    mini_stage_summary.update(
        {
            "served_orders_per_day": round(float(served_orders_per_day), 4),
            "served_cluster_count": int(served_cluster_count),
            "new_unique_mini_site_count": int(
                sum(1 for site in open_site_payloads if bool(site["counts_as_unique_physical_site"]))
            ),
        }
    )
    return open_site_payloads, mini_stage_summary, float(total_cost_per_day)


def solve_bangalore_solver_model(
    inputs: SolverInputs,
    config: BangaloreSolverConfig,
    *,
    distance_lookup: Optional[Dict[Tuple[str, str], float]] = None,
) -> Dict[str, object]:
    demand_clusters = list(inputs.demand_clusters)
    fixed_sites = list(inputs.fixed_sites)
    candidate_sites = list(inputs.candidate_sites)
    policy_snapshot = config.resolved_policy().to_dict()
    total_demand = float(sum(cluster.orders_per_day for cluster in demand_clusters))
    uncovered_budget = calculate_uncovered_demand_budget(total_demand, config)
    demand_weights = np.array([cluster.orders_per_day for cluster in demand_clusters], dtype=np.float64)
    super_coverage_target, super_coverage_summary = _build_super_coverage_target(demand_clusters, config)
    distance_by_site = _distance_lookup_for_sites(inputs, config, distance_lookup=distance_lookup)

    candidate_index = {site.site_id: site for site in candidate_sites}
    fixed_super_sites = [site for site in fixed_sites if bool(site.super_eligible_fixed)]
    fixed_super_index = {site.site_id: idx for idx, site in enumerate(fixed_super_sites)}
    candidate_var_index = {site.site_id: idx for idx, site in enumerate(candidate_sites)}
    candidate_standard_reachable_orders = {site.site_id: 0.0 for site in candidate_sites}
    standard_realism_context = _build_standard_realism_context(
        candidate_sites,
        fixed_sites,
        inputs.business_regions,
        demand_clusters,
        distance_by_site,
        config,
    )

    blocked_candidate_ids, conflicts = _build_spacing_blockers(inputs, config)

    edges: List[_DemandEdge] = []
    for demand_idx, cluster in enumerate(demand_clusters):
        for site in fixed_sites:
            dist = float(distance_by_site.get((site.site_id, cluster.cluster_id), math.inf))
            if math.isfinite(dist) and dist <= float(config.standard_radius_km) + 1e-9:
                edges.append(
                    _DemandEdge(
                        demand_index=demand_idx,
                        site_id=site.site_id,
                        tier="standard",
                        distance_km=dist,
                        open_var_kind=None,
                        open_var_index=None,
                        cost=float(cluster.orders_per_day) * (
                            float(config.standard_base_cost) + float(config.standard_variable_rate) * dist
                        ),
                    )
                )
            if site.site_id in fixed_super_index and math.isfinite(dist) and dist <= float(config.super_radius_km) + 1e-9:
                edges.append(
                    _DemandEdge(
                        demand_index=demand_idx,
                        site_id=site.site_id,
                        tier="super",
                        distance_km=dist,
                        open_var_kind="fixed_super",
                        open_var_index=fixed_super_index[site.site_id],
                        cost=float(cluster.orders_per_day) * (
                            float(config.effective_super_base_cost) + float(config.super_variable_rate) * dist
                        ),
                    )
                )
        for site in candidate_sites:
            dist = float(distance_by_site.get((site.site_id, cluster.cluster_id), math.inf))
            if math.isfinite(dist) and dist <= float(config.standard_radius_km) + 1e-9:
                candidate_standard_reachable_orders[site.site_id] += float(cluster.orders_per_day)
                edges.append(
                    _DemandEdge(
                        demand_index=demand_idx,
                        site_id=site.site_id,
                        tier="standard",
                        distance_km=dist,
                        open_var_kind="candidate_standard",
                        open_var_index=candidate_var_index[site.site_id],
                        cost=float(cluster.orders_per_day) * (
                            float(config.standard_base_cost) + float(config.standard_variable_rate) * dist
                        ),
                    )
                )
            if math.isfinite(dist) and dist <= float(config.super_radius_km) + 1e-9:
                edges.append(
                    _DemandEdge(
                        demand_index=demand_idx,
                        site_id=site.site_id,
                        tier="super",
                        distance_km=dist,
                        open_var_kind="candidate_super",
                        open_var_index=candidate_var_index[site.site_id],
                        cost=float(cluster.orders_per_day) * (
                            float(config.effective_super_base_cost) + float(config.super_variable_rate) * dist
                        ),
                    )
                )

    n_candidate = len(candidate_sites)
    n_fixed_super = len(fixed_super_sites)
    n_demand = len(demand_clusters)
    n_edges = len(edges)
    n_super_coverage = len(super_coverage_target.target_cluster_indices)
    n_soft_cluster_pairs = len(standard_realism_context.soft_cluster_pairs)

    y_std_offset = 0
    y_sup_offset = y_std_offset + n_candidate
    f_sup_offset = y_sup_offset + n_candidate
    u_offset = f_sup_offset + n_fixed_super
    x_offset = u_offset + n_demand
    z_supcov_offset = x_offset + n_edges
    p_stdpair_offset = z_supcov_offset + n_super_coverage
    n_vars = p_stdpair_offset + n_soft_cluster_pairs

    integrality = np.ones(n_vars, dtype=np.int8)
    lb = np.zeros(n_vars, dtype=np.float64)
    ub = np.ones(n_vars, dtype=np.float64)
    for site_id in blocked_candidate_ids:
        idx = candidate_var_index[site_id]
        ub[y_std_offset + idx] = 0.0
        ub[y_sup_offset + idx] = 0.0
    if config.effective_standard_min_orders_per_day is not None:
        min_standard_orders = float(config.effective_standard_min_orders_per_day)
        for idx, site in enumerate(candidate_sites):
            if float(candidate_standard_reachable_orders.get(site.site_id, 0.0)) + 1e-9 < min_standard_orders:
                ub[y_std_offset + idx] = 0.0
                ub[y_sup_offset + idx] = 0.0
    if config.effective_super_min_orders_per_day is not None:
        min_super_orders = float(config.effective_super_min_orders_per_day)
        for idx, site in enumerate(candidate_sites):
            if float(site.orders_per_day or 0.0) + 1e-9 < min_super_orders:
                ub[y_sup_offset + idx] = 0.0
        for idx, site in enumerate(fixed_super_sites):
            if float(site.orders_per_day or 0.0) + 1e-9 < min_super_orders:
                ub[f_sup_offset + idx] = 0.0

    rows: List[int] = []
    cols: List[int] = []
    data: List[float] = []
    lower: List[float] = []
    upper: List[float] = []
    row_index = 0

    edge_groups: Dict[int, List[int]] = {idx: [] for idx in range(n_demand)}
    for edge_idx, edge in enumerate(edges):
        edge_groups[edge.demand_index].append(edge_idx)

    for demand_idx in range(n_demand):
        for edge_idx in edge_groups[demand_idx]:
            rows.append(row_index)
            cols.append(x_offset + edge_idx)
            data.append(1.0)
        rows.append(row_index)
        cols.append(u_offset + demand_idx)
        data.append(1.0)
        lower.append(1.0)
        upper.append(1.0)
        row_index += 1

    for edge_idx, edge in enumerate(edges):
        if edge.open_var_kind is None:
            continue
        rows.extend([row_index, row_index])
        cols.append(x_offset + edge_idx)
        data.append(1.0)
        if edge.open_var_kind == "fixed_super":
            cols.append(f_sup_offset + int(edge.open_var_index))
        elif edge.open_var_kind == "candidate_standard":
            cols.append(y_std_offset + int(edge.open_var_index))
        else:
            cols.append(y_sup_offset + int(edge.open_var_index))
        data.append(-1.0)
        lower.append(-np.inf)
        upper.append(0.0)
        row_index += 1

    for candidate_idx in range(n_candidate):
        rows.extend([row_index, row_index])
        cols.extend([y_sup_offset + candidate_idx, y_std_offset + candidate_idx])
        data.extend([1.0, -1.0])
        lower.append(-np.inf)
        upper.append(0.0)
        row_index += 1

    for cand_a, cand_b in conflicts:
        rows.extend([row_index, row_index])
        cols.extend([y_std_offset + int(cand_a), y_std_offset + int(cand_b)])
        data.extend([1.0, 1.0])
        lower.append(-np.inf)
        upper.append(1.0)
        row_index += 1

    if config.max_total_new_sites is not None and n_candidate:
        for candidate_idx in range(n_candidate):
            rows.append(row_index)
            cols.append(y_std_offset + candidate_idx)
            data.append(1.0)
        lower.append(-np.inf)
        upper.append(float(config.max_total_new_sites))
        row_index += 1

    if config.max_total_super_sites is not None:
        for fixed_idx in range(n_fixed_super):
            rows.append(row_index)
            cols.append(f_sup_offset + fixed_idx)
            data.append(1.0)
        for candidate_idx in range(n_candidate):
            rows.append(row_index)
            cols.append(y_sup_offset + candidate_idx)
            data.append(1.0)
        lower.append(-np.inf)
        upper.append(float(config.max_total_super_sites))
        row_index += 1

    if config.effective_min_total_physical_sites is not None and n_candidate:
        for candidate_idx in range(n_candidate):
            rows.append(row_index)
            cols.append(y_std_offset + candidate_idx)
            data.append(1.0)
        lower.append(float(config.effective_min_total_physical_sites - len(fixed_sites)))
        upper.append(np.inf)
        row_index += 1

    if config.effective_max_total_physical_sites is not None and n_candidate:
        for candidate_idx in range(n_candidate):
            rows.append(row_index)
            cols.append(y_std_offset + candidate_idx)
            data.append(1.0)
        lower.append(-np.inf)
        upper.append(float(config.effective_max_total_physical_sites - len(fixed_sites)))
        row_index += 1

    for pair_idx, (cand_a, cand_b, _) in enumerate(standard_realism_context.soft_cluster_pairs):
        rows.extend([row_index, row_index, row_index])
        cols.extend([y_std_offset + int(cand_a), y_std_offset + int(cand_b), p_stdpair_offset + pair_idx])
        data.extend([1.0, 1.0, -1.0])
        lower.append(-np.inf)
        upper.append(1.0)
        row_index += 1

    if super_coverage_target.active and n_super_coverage:
        coverable_weight = 0
        uncovered_target_clusters: List[str] = []
        for target_idx, demand_idx in enumerate(super_coverage_target.target_cluster_indices):
            z_index = z_supcov_offset + target_idx
            has_cover = False
            rows.append(row_index)
            cols.append(z_index)
            data.append(1.0)
            for fixed_idx, site in enumerate(fixed_super_sites):
                dist = float(distance_by_site.get((site.site_id, demand_clusters[demand_idx].cluster_id), math.inf))
                if math.isfinite(dist) and dist <= float(config.super_radius_km) + 1e-9:
                    cols.append(f_sup_offset + fixed_idx)
                    rows.append(row_index)
                    data.append(-1.0)
                    has_cover = True
            for candidate_idx, site in enumerate(candidate_sites):
                dist = float(distance_by_site.get((site.site_id, demand_clusters[demand_idx].cluster_id), math.inf))
                if math.isfinite(dist) and dist <= float(config.super_radius_km) + 1e-9:
                    cols.append(y_sup_offset + candidate_idx)
                    rows.append(row_index)
                    data.append(-1.0)
                    has_cover = True
            lower.append(-np.inf)
            upper.append(0.0)
            row_index += 1
            if has_cover:
                coverable_weight += int(super_coverage_target.target_weights[target_idx])
            else:
                ub[z_index] = 0.0
                uncovered_target_clusters.append(demand_clusters[demand_idx].cluster_id)

        if coverable_weight + 1e-9 < float(super_coverage_target.required_weight):
            config_snapshot = config.to_dict()
            blocker = (
                "Super coverage policy is infeasible under the current candidate universe: "
                f"{coverable_weight}/{super_coverage_target.required_weight} demand-bearing solver cells are coverable."
            )
            if uncovered_target_clusters:
                blocker += " Uncoverable clusters: " + ", ".join(sorted(uncovered_target_clusters[:8]))
            return build_solver_result_contract(
                config_snapshot=config_snapshot,
                policy_snapshot=policy_snapshot,
                demand_summary=dict(inputs.demand_summary),
                candidate_summary=dict(inputs.candidate_summary),
                store_counts={
                    "fixed_standard_count": len(fixed_sites),
                    "new_standard_count": 0,
                    "upgraded_super_count": 0,
                    "new_super_count": 0,
                    "mini_count": 0,
                    "total_unique_physical_store_count": len(fixed_sites),
                },
                reuse_counts={
                    "fixed_standard_reused_count": len(fixed_sites),
                    "reused_super_on_standard_count": 0,
                },
                upgrade_counts={
                    "fixed_to_super_upgrades": 0,
                    "new_super_opens": 0,
                },
                status="policy_infeasible",
                feasible=False,
                hard_coverage_pct=0.0,
                hard_coverage_floor_pct=float(config.hard_coverage_floor_pct),
                total_last_mile_cost_per_day=0.0,
                avg_last_mile_cost=None,
                selected_standard_site_ids=[],
                selected_super_site_ids=[],
                assignment_summary={
                    "covered_cluster_count": 0,
                    "uncovered_cluster_count": len(demand_clusters),
                    "covered_demand_per_day": 0.0,
                    "uncovered_demand_per_day": total_demand,
                },
                policy_evaluation=_policy_evaluation(
                    violations=[blocker],
                    super_coverage={
                        **super_coverage_summary,
                        "coverable_member_count": int(coverable_weight),
                        "uncoverable_cluster_ids": uncovered_target_clusters,
                        "covered_cluster_count": 0,
                        "covered_member_count": 0,
                        "coverable_solver_cell_count": int(coverable_weight),
                        "covered_solver_cell_count": 0,
                        "achieved_solver_cell_pct": 0.0,
                        "satisfied": False,
                    },
                ),
                prototype_notes=list(config.prototype_notes),
                unmet_requirements=[blocker],
            )

        rows_for_threshold = np.full(n_super_coverage, row_index, dtype=np.int64)
        cols_for_threshold = np.arange(z_supcov_offset, z_supcov_offset + n_super_coverage, dtype=np.int64)
        data_for_threshold = np.asarray(super_coverage_target.target_weights, dtype=np.float64)
        rows.extend(rows_for_threshold.tolist())
        cols.extend(cols_for_threshold.tolist())
        data.extend(data_for_threshold.tolist())
        lower.append(float(super_coverage_target.required_weight))
        upper.append(np.inf)
        row_index += 1

    if n_demand:
        for demand_idx, weight in enumerate(demand_weights):
            rows.append(row_index)
            cols.append(u_offset + demand_idx)
            data.append(float(weight))
        lower.append(-np.inf)
        upper.append(float(uncovered_budget) + 1e-6)
        uncovered_budget_row = row_index
        row_index += 1
    else:
        uncovered_budget_row = -1

    constraint_matrix = sp.coo_matrix((data, (rows, cols)), shape=(row_index, n_vars)).tocsr()
    bounds = Bounds(lb, ub)
    base_constraints = [LinearConstraint(constraint_matrix, np.asarray(lower), np.asarray(upper))]

    def solve_with_objective(cost_vector: np.ndarray, extra_constraints: Iterable[LinearConstraint]) -> np.ndarray:
        result = milp(
            c=cost_vector,
            integrality=integrality,
            bounds=bounds,
            constraints=base_constraints + list(extra_constraints),
            options={"disp": False},
        )
        if result.status not in (0, 1) or result.x is None:
            raise RuntimeError(str(result.message))
        return np.asarray(result.x, dtype=np.float64)

    c_cost = np.zeros(n_vars, dtype=np.float64)
    for edge_idx, edge in enumerate(edges):
        c_cost[x_offset + edge_idx] = float(edge.cost)

    try:
        stage2 = solve_with_objective(c_cost, [])
    except Exception as exc:
        config_snapshot = config.to_dict()
        unmet = [f"Coverage floor infeasible under the current candidate universe or distance graph: {exc}"]
        return build_solver_result_contract(
            config_snapshot=config_snapshot,
            policy_snapshot=policy_snapshot,
            demand_summary=dict(inputs.demand_summary),
            candidate_summary=dict(inputs.candidate_summary),
            store_counts={
                "fixed_standard_count": len(fixed_sites),
                "new_standard_count": 0,
                "upgraded_super_count": 0,
                "new_super_count": 0,
                "mini_count": 0,
                "total_unique_physical_store_count": len(fixed_sites),
            },
            reuse_counts={
                "fixed_standard_reused_count": len(fixed_sites),
                "reused_super_on_standard_count": 0,
            },
            upgrade_counts={
                "fixed_to_super_upgrades": 0,
                "new_super_opens": 0,
            },
            status="blocked_infeasible",
            feasible=False,
            hard_coverage_pct=max(0.0, 100.0 * (1.0 - (uncovered_budget / max(total_demand, 1e-9)))),
            hard_coverage_floor_pct=float(config.hard_coverage_floor_pct),
            total_last_mile_cost_per_day=0.0,
            avg_last_mile_cost=None,
            selected_standard_site_ids=[],
            selected_super_site_ids=[],
            assignment_summary={
                "covered_cluster_count": 0,
                "uncovered_cluster_count": len(demand_clusters),
                "covered_demand_per_day": 0.0,
                "uncovered_demand_per_day": total_demand,
            },
            policy_evaluation=_policy_evaluation(violations=unmet),
            prototype_notes=list(config.prototype_notes),
            unmet_requirements=unmet,
        )

    cost_opt = float(np.dot(c_cost, stage2))
    realism_cost_tolerance_pct = float(config.effective_standard_realism_cost_tolerance_pct or 0.0)
    cost_upper_bound = float(cost_opt) + 1e-6
    if realism_cost_tolerance_pct > 0.0:
        cost_upper_bound = float(cost_opt) * (1.0 + (realism_cost_tolerance_pct / 100.0)) + 1e-6
    cost_constraint = LinearConstraint(c_cost.reshape(1, -1), -np.inf, cost_upper_bound)

    c_new = np.zeros(n_vars, dtype=np.float64)
    for candidate_idx in range(n_candidate):
        c_new[y_std_offset + candidate_idx] = 1.0
    stage3 = solve_with_objective(c_new, [cost_constraint])
    new_store_opt = float(np.sum(stage3[y_std_offset:y_std_offset + n_candidate]))
    new_constraint = LinearConstraint(c_new.reshape(1, -1), -np.inf, new_store_opt + 1e-6)

    extra_constraints = [cost_constraint, new_constraint]
    c_realism = np.zeros(n_vars, dtype=np.float64)
    weak_incremental_orders_per_day = float(standard_realism_context.weak_incremental_orders_per_day or 0.0)
    for candidate_idx, site in enumerate(candidate_sites):
        metrics = standard_realism_context.candidate_metrics.get(site.site_id)
        if metrics is None:
            continue
        weak_penalty_factor = 1.0
        if weak_incremental_orders_per_day > 0.0:
            weak_penalty_factor = max(
                0.0,
                float(weak_incremental_orders_per_day - metrics.incremental_value_orders_per_day)
                / float(weak_incremental_orders_per_day),
            )
        c_realism[y_std_offset + candidate_idx] = (
            float(metrics.boundary_shortfall_km) + float(metrics.fixed_store_shortfall_km)
        ) * float(weak_penalty_factor)
    close_pair_penalty_weight = float(standard_realism_context.close_pair_penalty_weight or 0.0)
    if close_pair_penalty_weight <= 0.0:
        close_pair_penalty_weight = 1.0
    for pair_idx, (_, _, shortfall_km) in enumerate(standard_realism_context.soft_cluster_pairs):
        c_realism[p_stdpair_offset + pair_idx] = float(close_pair_penalty_weight) * float(shortfall_km)
    if np.any(c_realism > 0.0):
        stage_realism = solve_with_objective(c_realism, extra_constraints)
        realism_opt = float(np.dot(c_realism, stage_realism))
        extra_constraints.append(
            LinearConstraint(c_realism.reshape(1, -1), -np.inf, realism_opt + 1e-6)
        )
    if config.effective_prefer_eligible_fixed_store_upgrades_to_super:
        c_new_super = np.zeros(n_vars, dtype=np.float64)
        for candidate_idx in range(n_candidate):
            c_new_super[y_sup_offset + candidate_idx] = 1.0
        stage4 = solve_with_objective(c_new_super, extra_constraints)
        new_super_opt = float(np.sum(stage4[y_sup_offset:y_sup_offset + n_candidate]))
        extra_constraints.append(
            LinearConstraint(c_new_super.reshape(1, -1), -np.inf, new_super_opt + 1e-6)
        )

    c_super = np.zeros(n_vars, dtype=np.float64)
    for candidate_idx in range(n_candidate):
        c_super[y_sup_offset + candidate_idx] = 1.0
    for fixed_idx in range(n_fixed_super):
        c_super[f_sup_offset + fixed_idx] = 1.0
    final_solution = solve_with_objective(c_super, extra_constraints)

    selected_standard_site_ids = sorted(
        [
            site.site_id
            for site_idx, site in enumerate(candidate_sites)
            if final_solution[y_std_offset + site_idx] > 0.5
        ]
    )
    selected_super_site_ids = sorted(
        [
            site.site_id
            for site_idx, site in enumerate(candidate_sites)
            if final_solution[y_sup_offset + site_idx] > 0.5
        ]
        + [
            site.site_id
            for fixed_idx, site in enumerate(fixed_super_sites)
            if final_solution[f_sup_offset + fixed_idx] > 0.5
        ]
    )

    uncovered_mask = final_solution[u_offset:u_offset + n_demand] > 0.5
    uncovered_demand = float(np.sum(demand_weights[uncovered_mask])) if n_demand else 0.0
    covered_demand = total_demand - uncovered_demand
    hard_coverage_pct = 100.0 * covered_demand / max(total_demand, 1e-9)

    selected_edges_by_demand: Dict[int, _DemandEdge] = {}
    for demand_idx in range(n_demand):
        for edge_idx in edge_groups[demand_idx]:
            if float(final_solution[x_offset + edge_idx]) > 0.5:
                selected_edges_by_demand[demand_idx] = edges[edge_idx]
                break

    store_counts = summarize_selected_network(
        fixed_sites=fixed_sites,
        selected_standard_site_ids=selected_standard_site_ids,
        selected_super_site_ids=selected_super_site_ids,
        candidate_index=candidate_index,
    )
    mini_sites, mini_stage_summary, final_total_cost_per_day = _apply_density_triggered_mini_stage(
        demand_clusters=demand_clusters,
        selected_edges_by_demand=selected_edges_by_demand,
        fixed_sites=fixed_sites,
        candidate_index=candidate_index,
        selected_standard_site_ids=selected_standard_site_ids,
        config=config,
        base_total_cost_per_day=cost_opt,
    )
    store_counts["mini_count"] = len(mini_sites)
    store_counts["total_unique_physical_store_count"] = (
        store_counts["fixed_standard_count"]
        + store_counts["new_standard_count"]
        + int(mini_stage_summary.get("new_unique_mini_site_count", 0))
    )
    reuse_counts, upgrade_counts = build_reuse_and_upgrade_counts(store_counts)

    assignment_summary = {
        "covered_cluster_count": int(np.sum(~uncovered_mask)),
        "uncovered_cluster_count": int(np.sum(uncovered_mask)),
        "covered_demand_per_day": round(covered_demand, 4),
        "uncovered_demand_per_day": round(uncovered_demand, 4),
        "edge_count": n_edges,
        "mini_served_demand_per_day": round(float(mini_stage_summary.get("served_orders_per_day", 0.0)), 4),
        "mini_served_cluster_count": int(mini_stage_summary.get("served_cluster_count", 0)),
    }
    unmet_requirements: List[str] = []
    if hard_coverage_pct + 1e-9 < float(config.hard_coverage_floor_pct):
        unmet_requirements.append("Solved network is below the hard coverage floor.")
    avg_last_mile_cost = None if covered_demand <= 0 else (final_total_cost_per_day / covered_demand)
    policy_violations: List[str] = []
    if (
        config.effective_target_total_physical_sites_exact is not None
        and store_counts["total_unique_physical_store_count"] != int(config.effective_target_total_physical_sites_exact)
    ):
        policy_violations.append(
            "target_total_physical_sites_exact not met: "
            f"{store_counts['total_unique_physical_store_count']} != {int(config.effective_target_total_physical_sites_exact)}"
        )
    if (
        config.effective_avg_last_mile_cost_cap is not None
        and avg_last_mile_cost is not None
        and avg_last_mile_cost > float(config.effective_avg_last_mile_cost_cap) + 1e-9
    ):
        policy_violations.append(
            "avg_last_mile_cost_cap exceeded: "
            f"{avg_last_mile_cost:.4f} > {float(config.effective_avg_last_mile_cost_cap):.4f}"
        )

    covered_super_cluster_count = 0
    covered_super_member_count = 0
    if super_coverage_target.active and n_super_coverage:
        for target_idx, weight in enumerate(super_coverage_target.target_weights):
            if float(final_solution[z_supcov_offset + target_idx]) > 0.5:
                covered_super_cluster_count += 1
                covered_super_member_count += int(weight)
    super_coverage_result = {
        **super_coverage_summary,
        "covered_cluster_count": int(covered_super_cluster_count),
        "covered_member_count": int(covered_super_member_count),
        "covered_solver_cell_count": int(covered_super_member_count),
        "achieved_solver_cell_pct": round(
            100.0 * float(covered_super_member_count) / max(float(super_coverage_target.total_target_weight), 1.0),
            4,
        )
        if super_coverage_target.active and super_coverage_target.total_target_weight > 0
        else 0.0,
        "satisfied": (
            not super_coverage_target.active
            or covered_super_member_count + 1e-9 >= float(super_coverage_target.required_weight)
        ),
    }
    standard_realism_diagnostics, selected_standard_site_payloads = _selected_standard_realism_diagnostics(
        selected_standard_site_ids=selected_standard_site_ids,
        candidate_sites=candidate_sites,
        candidate_index=candidate_index,
        realism_context=standard_realism_context,
    )

    result = build_solver_result_contract(
        config_snapshot=config.to_dict(),
        policy_snapshot=policy_snapshot,
        demand_summary=dict(inputs.demand_summary),
        candidate_summary=dict(inputs.candidate_summary),
        store_counts=store_counts,
        reuse_counts=reuse_counts,
        upgrade_counts=upgrade_counts,
        status="policy_infeasible" if policy_violations else "prototype_solved",
        feasible=not policy_violations,
        hard_coverage_pct=hard_coverage_pct,
        hard_coverage_floor_pct=float(config.hard_coverage_floor_pct),
        total_last_mile_cost_per_day=final_total_cost_per_day,
        avg_last_mile_cost=avg_last_mile_cost,
        selected_standard_site_ids=selected_standard_site_ids,
        selected_super_site_ids=selected_super_site_ids,
        assignment_summary=assignment_summary,
        policy_evaluation=_policy_evaluation(
            violations=policy_violations,
            super_coverage=super_coverage_result,
        ),
        prototype_notes=list(config.prototype_notes),
        unmet_requirements=unmet_requirements,
    )
    result["scope_summary"] = {
        "business_polygon_count": int(len(inputs.business_regions)),
        "excluded_island_count": int(len(inputs.excluded_islands)),
        "scope_source_path": str(config.scope_csv_path),
        "fixed_store_source_path": str(config.fixed_store_csv_path),
    }
    result["fixed_open_sites"] = [
        _site_payload(site, label="Fixed Standard Store", fixed_open=True)
        for site in sorted(fixed_sites, key=lambda item: item.site_id)
    ]
    selected_new_standard_sites = [
        {
            **_site_payload(candidate_index[site_id], label="Solver-selected New Standard", fixed_open=False),
            "radius_km": float(config.standard_radius_km),
            "site_semantics": "solver_selected_new_standard",
            "counts_as_unique_physical_site": True,
            **selected_standard_site_payloads.get(site_id, {}),
        }
        for site_id in selected_standard_site_ids
        if site_id in candidate_index
    ]
    selected_super_sites = [
        {
            **_site_payload(
                candidate_index[site_id] if site_id in candidate_index else next(site for site in fixed_sites if site.site_id == site_id),
                label="Solver-selected Super",
                fixed_open=site_id not in candidate_index,
            ),
            "radius_km": float(config.super_radius_km),
            "site_semantics": "fixed_super_upgrade" if site_id not in candidate_index else "solver_selected_new_super",
            "counts_as_true_super": True,
            "counts_as_unique_physical_site": bool(site_id in candidate_index),
        }
        for site_id in selected_super_site_ids
    ]
    fixed_super_upgrade_sites = [
        site
        for site in selected_super_sites
        if str(site.get("site_semantics") or "").strip().lower() == "fixed_super_upgrade"
    ]
    new_super_sites = [
        site
        for site in selected_super_sites
        if str(site.get("site_semantics") or "").strip().lower() == "solver_selected_new_super"
    ]
    result["selected_new_standard_sites"] = selected_new_standard_sites
    result["selected_super_sites"] = selected_super_sites
    result["fixed_super_upgrade_sites"] = fixed_super_upgrade_sites
    result["new_super_sites"] = new_super_sites
    result["mini_sites"] = mini_sites
    result["mini_stage_summary"] = mini_stage_summary
    result["selected_mini_site_ids"] = [site["site_id"] for site in mini_sites]
    result["selected_standard_site_ids"] = selected_standard_site_ids
    result["selected_super_site_ids"] = selected_super_site_ids
    result["realism_diagnostics"] = standard_realism_diagnostics
    result["proposed_site_mix_summary"] = _build_proposed_site_mix_summary(store_counts)
    result["downloadable_proposed_site_rows"] = _build_downloadable_proposed_site_rows(
        selected_new_standard_sites=selected_new_standard_sites,
        fixed_super_upgrade_sites=fixed_super_upgrade_sites,
        new_super_sites=new_super_sites,
        mini_sites=mini_sites,
    )
    result["feasible"] = not policy_violations
    return result
