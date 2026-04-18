from __future__ import annotations

from collections import Counter
from typing import List, Sequence

from .config import BangaloreSolverConfig
from .contracts import CandidateGenerationResult, DemandCluster, SolverSite


def _approx_distance_km(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    lat_scale = 110.574
    lon_scale = 111.320
    dx = (float(lat_a) - float(lat_b)) * lat_scale
    dy = (float(lon_a) - float(lon_b)) * lon_scale
    return (dx * dx + dy * dy) ** 0.5


def _nearest_distance_km(cluster: DemandCluster, sites: Sequence[SolverSite]) -> float:
    if not sites:
        return float("inf")
    return min(
        _approx_distance_km(cluster.lat, cluster.lon, site.lat, site.lon)
        for site in sites
    )


def generate_candidate_sites(
    demand_clusters: Sequence[DemandCluster],
    fixed_sites: Sequence[SolverSite],
    config: BangaloreSolverConfig,
) -> CandidateGenerationResult:
    selected: List[SolverSite] = []
    selected_coords: List[SolverSite] = list(fixed_sites)
    selected_by_source: Counter[str] = Counter()

    ordered_clusters = sorted(
        demand_clusters,
        key=lambda item: (-float(item.orders_per_day), float(item.lat), float(item.lon), item.cluster_id),
    )

    def can_place(cluster: DemandCluster) -> bool:
        return _nearest_distance_km(cluster, selected_coords) >= float(config.candidate_spacing_km)

    for cluster in ordered_clusters:
        if selected_by_source["demand_seed"] >= int(config.demand_seed_candidate_limit):
            break
        if not can_place(cluster):
            continue
        site = SolverSite(
            site_id=f"cand-demand-{cluster.cluster_id}",
            lat=float(cluster.lat),
            lon=float(cluster.lon),
            fixed=False,
            source="demand_seed",
            orders_per_day=float(cluster.orders_per_day),
        )
        selected.append(site)
        selected_coords.append(site)
        selected_by_source[site.source] += 1

    gap_fill_candidates = sorted(
        demand_clusters,
        key=lambda item: (
            -_nearest_distance_km(item, selected_coords),
            -float(item.orders_per_day),
            float(item.lat),
            float(item.lon),
            item.cluster_id,
        ),
    )
    for cluster in gap_fill_candidates:
        if selected_by_source["gap_fill_seed"] >= int(config.gap_fill_candidate_limit):
            break
        if any(site.site_id.endswith(cluster.cluster_id) for site in selected):
            continue
        if not can_place(cluster):
            continue
        site = SolverSite(
            site_id=f"cand-gap-{cluster.cluster_id}",
            lat=float(cluster.lat),
            lon=float(cluster.lon),
            fixed=False,
            source="gap_fill_seed",
            orders_per_day=float(cluster.orders_per_day),
        )
        selected.append(site)
        selected_coords.append(site)
        selected_by_source[site.source] += 1

    summary = {
        "total_candidates": len(selected),
        "selected_by_source": dict(selected_by_source),
        "candidate_spacing_km": float(config.candidate_spacing_km),
    }
    return CandidateGenerationResult(sites=tuple(selected), summary=summary)
