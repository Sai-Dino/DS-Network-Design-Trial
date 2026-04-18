from __future__ import annotations

from typing import Dict, Iterable, Mapping, Sequence

from .config import BangaloreSolverConfig
from .contracts import SolverSite


def calculate_uncovered_demand_budget(total_demand: float, config: BangaloreSolverConfig) -> float:
    total_demand = max(0.0, float(total_demand))
    return total_demand * max(0.0, 1.0 - (float(config.hard_coverage_floor_pct) / 100.0))


def summarize_selected_network(
    *,
    fixed_sites: Sequence[SolverSite],
    selected_standard_site_ids: Iterable[str],
    selected_super_site_ids: Iterable[str],
    candidate_index: Mapping[str, SolverSite],
) -> Dict[str, int]:
    selected_standard = set(selected_standard_site_ids)
    selected_super = set(selected_super_site_ids)
    fixed_ids = {site.site_id for site in fixed_sites}

    fixed_standard_count = len(fixed_sites)
    new_standard_count = sum(1 for site_id in selected_standard if site_id not in fixed_ids)
    upgraded_super_count = sum(1 for site_id in selected_super if site_id in fixed_ids)
    new_super_count = sum(1 for site_id in selected_super if site_id not in fixed_ids)
    total_unique_physical_store_count = fixed_standard_count + new_standard_count

    return {
        "fixed_standard_count": int(fixed_standard_count),
        "new_standard_count": int(new_standard_count),
        "upgraded_super_count": int(upgraded_super_count),
        "new_super_count": int(new_super_count),
        "mini_count": 0,
        "total_unique_physical_store_count": int(total_unique_physical_store_count),
    }


def build_reuse_and_upgrade_counts(store_counts: Mapping[str, int]) -> tuple[Dict[str, int], Dict[str, int]]:
    reuse_counts = {
        "fixed_standard_reused_count": int(store_counts.get("fixed_standard_count", 0)),
        "reused_super_on_standard_count": int(store_counts.get("upgraded_super_count", 0)),
    }
    upgrade_counts = {
        "fixed_to_super_upgrades": int(store_counts.get("upgraded_super_count", 0)),
        "new_super_opens": int(store_counts.get("new_super_count", 0)),
    }
    return reuse_counts, upgrade_counts
