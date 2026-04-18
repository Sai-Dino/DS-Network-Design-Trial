from __future__ import annotations

from dataclasses import asdict, dataclass, fields
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class CitySolverPolicy:
    min_total_physical_sites: Optional[int] = None
    max_total_physical_sites: Optional[int] = None
    target_total_physical_sites_exact: Optional[int] = None
    avg_last_mile_cost_cap: Optional[float] = None
    standard_min_orders_per_day: Optional[float] = None
    standard_min_boundary_clearance_km: Optional[float] = None
    standard_fixed_store_buffer_km: Optional[float] = None
    standard_soft_cluster_radius_km: Optional[float] = None
    standard_realism_cost_tolerance_pct: Optional[float] = None
    super_min_orders_per_day: Optional[float] = None
    mini_min_orders_per_day: Optional[float] = None
    mini_density_radius_km: Optional[float] = None
    mini_density_min_orders_per_day: Optional[float] = None
    mini_prefer_existing_physical_site_radius_km: Optional[float] = None
    require_super_core_city_coverage: Optional[bool] = None
    super_core_city_fallback_min_demand_area_pct: float = 90.0
    prefer_eligible_fixed_store_upgrades_to_super: Optional[bool] = None
    super_core_city_geojson: Optional[Any] = None
    super_core_exclude_geojson: Optional[Any] = None

    @classmethod
    def from_dict(cls, payload: Optional[Dict[str, Any]] = None) -> "CitySolverPolicy":
        allowed = {field.name for field in fields(cls)}
        filtered = {
            key: value
            for key, value in (payload or {}).items()
            if key in allowed
        }
        return cls(**filtered)

    @property
    def effective_min_total_physical_sites(self) -> Optional[int]:
        return None if self.min_total_physical_sites is None else int(self.min_total_physical_sites)

    @property
    def effective_max_total_physical_sites(self) -> Optional[int]:
        return None if self.max_total_physical_sites is None else int(self.max_total_physical_sites)

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["effective_min_total_physical_sites"] = self.effective_min_total_physical_sites
        payload["effective_max_total_physical_sites"] = self.effective_max_total_physical_sites
        return payload
