from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from .policy import CitySolverPolicy

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class BangaloreSolverConfig:
    city: str = "Bangalore"
    fixed_store_mode: str = "benchmark_103"
    order_csv_path: Path = REPO_ROOT / "daily_demand_aggregated.csv"
    scope_csv_path: Path = REPO_ROOT / "Store details - 151 polygons with stores.csv"
    fixed_store_csv_path: Path = REPO_ROOT / "Store details - 103 old stores.csv"
    fixed_store_metadata_path: Path = REPO_ROOT / "benchmark_103_store_metadata.csv"
    output_path: Path = REPO_ROOT / "optimization_results" / "latest_bangalore_solver_v1.json"
    output_history_dir: Path = REPO_ROOT / "optimization_results"
    hard_coverage_floor_pct: float = 99.75
    standard_radius_km: float = 3.0
    super_radius_km: float = 5.5
    standard_min_orders_per_day: Optional[float] = None
    standard_min_boundary_clearance_km: Optional[float] = None
    standard_fixed_store_buffer_km: Optional[float] = None
    standard_soft_cluster_radius_km: Optional[float] = None
    standard_realism_cost_tolerance_pct: Optional[float] = None
    standard_weak_incremental_orders_per_day: float = 150.0
    standard_close_pair_penalty_weight: float = 1.0
    super_min_orders_per_day: Optional[float] = None
    mini_min_orders_per_day: Optional[float] = None
    standard_base_cost: float = 29.0
    standard_variable_rate: float = 9.0
    super_base_cost: float = 29.0
    super_fixed_penalty_per_order: float = 5.0
    super_variable_rate: float = 9.0
    fixed_super_min_sqft: float = 4000.0
    cluster_cell_size_km: float = 1.25
    candidate_spacing_km: float = 3.0
    demand_seed_candidate_limit: int = 60
    gap_fill_candidate_limit: int = 40
    min_total_physical_sites: Optional[int] = None
    max_total_new_sites: Optional[int] = None
    max_total_super_sites: Optional[int] = None
    max_total_physical_sites: Optional[int] = None
    target_total_physical_sites_exact: Optional[int] = None
    avg_last_mile_cost_cap: Optional[float] = None
    mini_density_radius_km: Optional[float] = None
    mini_density_min_orders_per_day: Optional[float] = None
    mini_prefer_existing_physical_site_radius_km: Optional[float] = None
    require_super_core_city_coverage: Optional[bool] = None
    super_core_city_fallback_min_demand_area_pct: Optional[float] = None
    prefer_eligible_fixed_store_upgrades_to_super: Optional[bool] = None
    super_core_city_geojson: Optional[Any] = None
    super_core_exclude_geojson: Optional[Any] = None
    mini_service_radius_km: float = 1.0
    mini_base_cost: float = 24.0
    mini_variable_rate: float = 6.0
    city_policy_overrides: Dict[str, Dict[str, Any]] = field(
        default_factory=lambda: {
            "Bangalore": {
                "standard_min_boundary_clearance_km": 0.5,
                "standard_fixed_store_buffer_km": 1.8,
                "standard_soft_cluster_radius_km": 2.0,
                "standard_realism_cost_tolerance_pct": 0.25,
                "mini_density_radius_km": 1.0,
                "mini_density_min_orders_per_day": 400.0,
            }
        }
    )
    distance_cache_path: Optional[Path] = None
    prototype_notes: tuple[str, ...] = field(
        default_factory=lambda: (
            "Mini opens only when the active city Mini density trigger is met in the solver lane.",
            "Demand is clustered deterministically onto a bounded Bangalore solver lattice before MILP execution.",
            "Super uses the honest office-profile assumption: 5.5 km full-competitor service with a +₹5/order penalty.",
        )
    )

    @property
    def effective_super_base_cost(self) -> float:
        return float(self.super_base_cost) + float(self.super_fixed_penalty_per_order)

    def resolved_city_policy(self) -> Dict[str, Any]:
        return CitySolverPolicy.from_dict(self.city_policy_overrides.get(self.city)).to_dict()

    def resolved_policy(self) -> CitySolverPolicy:
        city_policy = CitySolverPolicy.from_dict(self.city_policy_overrides.get(self.city))
        overrides = CitySolverPolicy(
            min_total_physical_sites=self.min_total_physical_sites,
            max_total_physical_sites=self.max_total_physical_sites,
            target_total_physical_sites_exact=self.target_total_physical_sites_exact,
            avg_last_mile_cost_cap=self.avg_last_mile_cost_cap,
            standard_min_orders_per_day=self.standard_min_orders_per_day,
            standard_min_boundary_clearance_km=self.standard_min_boundary_clearance_km,
            standard_fixed_store_buffer_km=self.standard_fixed_store_buffer_km,
            standard_soft_cluster_radius_km=self.standard_soft_cluster_radius_km,
            standard_realism_cost_tolerance_pct=self.standard_realism_cost_tolerance_pct,
            super_min_orders_per_day=self.super_min_orders_per_day,
            mini_min_orders_per_day=self.mini_min_orders_per_day,
            mini_density_radius_km=self.mini_density_radius_km,
            mini_density_min_orders_per_day=self.mini_density_min_orders_per_day,
            mini_prefer_existing_physical_site_radius_km=self.mini_prefer_existing_physical_site_radius_km,
            require_super_core_city_coverage=(
                None if self.require_super_core_city_coverage is None else bool(self.require_super_core_city_coverage)
            ),
            super_core_city_fallback_min_demand_area_pct=self.super_core_city_fallback_min_demand_area_pct,
            prefer_eligible_fixed_store_upgrades_to_super=(
                None
                if self.prefer_eligible_fixed_store_upgrades_to_super is None
                else bool(self.prefer_eligible_fixed_store_upgrades_to_super)
            ),
            super_core_city_geojson=self.super_core_city_geojson,
            super_core_exclude_geojson=self.super_core_exclude_geojson,
        )
        resolved = {}
        for key, value in city_policy.to_dict().items():
            if key.startswith("effective_"):
                continue
            resolved[key] = value
        for key, value in overrides.to_dict().items():
            if key.startswith("effective_"):
                continue
            if value is None:
                continue
            resolved[key] = value
        return CitySolverPolicy.from_dict(resolved)

    def _resolved_policy_value(self, attr_name: str, explicit_value: Any) -> Any:
        if explicit_value is not None:
            return explicit_value
        return getattr(self.resolved_policy(), attr_name)

    @property
    def effective_min_total_physical_sites(self) -> Optional[int]:
        return self.resolved_policy().effective_min_total_physical_sites

    @property
    def effective_max_total_physical_sites(self) -> Optional[int]:
        return self.resolved_policy().effective_max_total_physical_sites

    @property
    def effective_target_total_physical_sites_exact(self) -> Optional[int]:
        value = self._resolved_policy_value(
            "target_total_physical_sites_exact",
            self.target_total_physical_sites_exact,
        )
        return None if value is None else int(value)

    @property
    def effective_avg_last_mile_cost_cap(self) -> Optional[float]:
        value = self._resolved_policy_value("avg_last_mile_cost_cap", self.avg_last_mile_cost_cap)
        return None if value is None else float(value)

    @property
    def effective_standard_min_orders_per_day(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "standard_min_orders_per_day",
            self.standard_min_orders_per_day,
        )
        return None if value is None else float(value)

    @property
    def effective_standard_min_boundary_clearance_km(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "standard_min_boundary_clearance_km",
            self.standard_min_boundary_clearance_km,
        )
        return None if value is None else float(value)

    @property
    def effective_standard_fixed_store_buffer_km(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "standard_fixed_store_buffer_km",
            self.standard_fixed_store_buffer_km,
        )
        return None if value is None else float(value)

    @property
    def effective_standard_soft_cluster_radius_km(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "standard_soft_cluster_radius_km",
            self.standard_soft_cluster_radius_km,
        )
        return None if value is None else float(value)

    @property
    def effective_standard_realism_cost_tolerance_pct(self) -> float:
        value = self._resolved_policy_value(
            "standard_realism_cost_tolerance_pct",
            self.standard_realism_cost_tolerance_pct,
        )
        return max(0.0, float(0.0 if value is None else value))

    @property
    def effective_standard_weak_incremental_orders_per_day(self) -> float:
        return max(0.0, float(self.standard_weak_incremental_orders_per_day or 0.0))

    @property
    def effective_standard_close_pair_penalty_weight(self) -> float:
        return max(0.0, float(self.standard_close_pair_penalty_weight or 0.0))

    @property
    def effective_super_min_orders_per_day(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "super_min_orders_per_day",
            self.super_min_orders_per_day,
        )
        return None if value is None else float(value)

    @property
    def effective_mini_min_orders_per_day(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "mini_min_orders_per_day",
            self.mini_min_orders_per_day,
        )
        if value is None:
            value = self._resolved_policy_value(
                "mini_density_min_orders_per_day",
                self.mini_density_min_orders_per_day,
            )
        return None if value is None else float(value)

    @property
    def effective_mini_density_radius_km(self) -> Optional[float]:
        value = self._resolved_policy_value("mini_density_radius_km", self.mini_density_radius_km)
        return None if value is None else float(value)

    @property
    def effective_mini_density_min_orders_per_day(self) -> Optional[float]:
        return self.effective_mini_min_orders_per_day

    @property
    def effective_mini_prefer_existing_physical_site_radius_km(self) -> Optional[float]:
        value = self._resolved_policy_value(
            "mini_prefer_existing_physical_site_radius_km",
            self.mini_prefer_existing_physical_site_radius_km,
        )
        return None if value is None else float(value)

    @property
    def effective_require_super_core_city_coverage(self) -> bool:
        return bool(
            self._resolved_policy_value(
                "require_super_core_city_coverage",
                self.require_super_core_city_coverage,
            )
        )

    @property
    def effective_super_core_city_fallback_min_demand_area_pct(self) -> float:
        value = self._resolved_policy_value(
            "super_core_city_fallback_min_demand_area_pct",
            self.super_core_city_fallback_min_demand_area_pct,
        )
        return float(90.0 if value is None else value)

    @property
    def effective_prefer_eligible_fixed_store_upgrades_to_super(self) -> bool:
        return bool(
            self._resolved_policy_value(
                "prefer_eligible_fixed_store_upgrades_to_super",
                self.prefer_eligible_fixed_store_upgrades_to_super,
            )
        )

    @property
    def effective_super_core_city_geojson(self) -> Optional[Any]:
        return self._resolved_policy_value("super_core_city_geojson", self.super_core_city_geojson)

    @property
    def effective_super_core_exclude_geojson(self) -> Optional[Any]:
        return self._resolved_policy_value("super_core_exclude_geojson", self.super_core_exclude_geojson)

    @classmethod
    def from_overrides(cls, overrides: Optional[Dict[str, Any]] = None) -> "BangaloreSolverConfig":
        if not overrides:
            return cls()
        normalized: Dict[str, Any] = {}
        for key, value in overrides.items():
            if value is None:
                continue
            if key == "standard_service_radius_km":
                key = "standard_radius_km"
            elif key == "super_service_radius_km":
                key = "super_radius_km"
            if key.endswith("_path") or key.endswith("_dir"):
                normalized[key] = Path(value)
            else:
                normalized[key] = value
        return cls(**normalized)

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        for key, value in list(payload.items()):
            if isinstance(value, Path):
                payload[key] = str(value)
        payload["effective_super_base_cost"] = self.effective_super_base_cost
        payload["resolved_city_policy"] = self.resolved_city_policy()
        payload["resolved_policy"] = self.resolved_policy().to_dict()
        payload["effective_min_total_physical_sites"] = self.effective_min_total_physical_sites
        payload["effective_max_total_physical_sites"] = self.effective_max_total_physical_sites
        payload["effective_target_total_physical_sites_exact"] = self.effective_target_total_physical_sites_exact
        payload["effective_avg_last_mile_cost_cap"] = self.effective_avg_last_mile_cost_cap
        payload["effective_standard_min_orders_per_day"] = self.effective_standard_min_orders_per_day
        payload["effective_standard_min_boundary_clearance_km"] = self.effective_standard_min_boundary_clearance_km
        payload["effective_standard_fixed_store_buffer_km"] = self.effective_standard_fixed_store_buffer_km
        payload["effective_standard_soft_cluster_radius_km"] = self.effective_standard_soft_cluster_radius_km
        payload["effective_standard_realism_cost_tolerance_pct"] = self.effective_standard_realism_cost_tolerance_pct
        payload[
            "effective_standard_weak_incremental_orders_per_day"
        ] = self.effective_standard_weak_incremental_orders_per_day
        payload["effective_standard_close_pair_penalty_weight"] = self.effective_standard_close_pair_penalty_weight
        payload["effective_super_min_orders_per_day"] = self.effective_super_min_orders_per_day
        payload["effective_mini_min_orders_per_day"] = self.effective_mini_min_orders_per_day
        payload["effective_mini_density_radius_km"] = self.effective_mini_density_radius_km
        payload["effective_mini_density_min_orders_per_day"] = self.effective_mini_density_min_orders_per_day
        payload[
            "effective_mini_prefer_existing_physical_site_radius_km"
        ] = self.effective_mini_prefer_existing_physical_site_radius_km
        payload["effective_require_super_core_city_coverage"] = self.effective_require_super_core_city_coverage
        payload[
            "effective_super_core_city_fallback_min_demand_area_pct"
        ] = self.effective_super_core_city_fallback_min_demand_area_pct
        payload[
            "effective_prefer_eligible_fixed_store_upgrades_to_super"
        ] = self.effective_prefer_eligible_fixed_store_upgrades_to_super
        payload["effective_super_core_city_geojson"] = self.effective_super_core_city_geojson
        payload["effective_super_core_exclude_geojson"] = self.effective_super_core_exclude_geojson
        payload["prototype_notes"] = list(self.prototype_notes)
        return payload
