import os
import sys
import unittest


ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from bangalore_solver.config import BangaloreSolverConfig
from bangalore_solver.contracts import SolverSite
from bangalore_solver.semantics import (
    calculate_uncovered_demand_budget,
    summarize_selected_network,
)


class BangaloreSolverSemanticsTests(unittest.TestCase):
    def test_config_resolves_city_policy_for_store_band_and_mini_density(self):
        config = BangaloreSolverConfig(
            city="Testopolis",
            city_policy_overrides={
                "Testopolis": {
                    "min_total_physical_sites": 150,
                    "max_total_physical_sites": 200,
                    "mini_density_radius_km": 1.5,
                    "mini_density_min_orders_per_day": 400,
                    "mini_prefer_existing_physical_site_radius_km": 0.75,
                }
            },
        )

        policy = config.resolved_city_policy()

        self.assertEqual(policy["min_total_physical_sites"], 150)
        self.assertEqual(policy["max_total_physical_sites"], 200)
        self.assertEqual(policy["mini_density_radius_km"], 1.5)
        self.assertEqual(policy["mini_density_min_orders_per_day"], 400)
        self.assertEqual(policy["mini_prefer_existing_physical_site_radius_km"], 0.75)

    def test_config_resolves_extended_policy_surface(self):
        config = BangaloreSolverConfig(
            city="Testopolis",
            city_policy_overrides={
                "Testopolis": {
                    "target_total_physical_sites_exact": 200,
                    "avg_last_mile_cost_cap": 35.0,
                    "require_super_core_city_coverage": True,
                    "prefer_eligible_fixed_store_upgrades_to_super": True,
                    "super_core_city_fallback_min_demand_area_pct": 92.5,
                }
            },
        )

        policy = config.resolved_policy()

        self.assertEqual(policy.target_total_physical_sites_exact, 200)
        self.assertEqual(policy.avg_last_mile_cost_cap, 35.0)
        self.assertTrue(policy.require_super_core_city_coverage)
        self.assertTrue(policy.prefer_eligible_fixed_store_upgrades_to_super)
        self.assertEqual(policy.super_core_city_fallback_min_demand_area_pct, 92.5)
        self.assertIsNone(policy.effective_min_total_physical_sites)
        self.assertIsNone(policy.effective_max_total_physical_sites)

    def test_calculate_uncovered_demand_budget_matches_99_75_floor(self):
        config = BangaloreSolverConfig(hard_coverage_floor_pct=99.75)
        budget = calculate_uncovered_demand_budget(total_demand=2000.0, config=config)
        self.assertAlmostEqual(budget, 5.0)

    def test_summarize_selected_network_counts_reused_and_new_supers_truthfully(self):
        fixed_super = SolverSite(
            site_id="fixed-super",
            lat=12.9,
            lon=77.6,
            fixed=True,
            super_eligible_fixed=True,
            source="fixed_store",
        )
        new_super = SolverSite(
            site_id="new-super",
            lat=12.95,
            lon=77.65,
            fixed=False,
            source="gap_fill_seed",
        )
        fixed_standard = SolverSite(
            site_id="fixed-standard",
            lat=12.92,
            lon=77.62,
            fixed=True,
            source="fixed_store",
        )

        summary = summarize_selected_network(
            fixed_sites=[fixed_super, fixed_standard],
            selected_standard_site_ids={"new-super"},
            selected_super_site_ids={"fixed-super", "new-super"},
            candidate_index={
                "new-super": new_super,
            },
        )

        self.assertEqual(summary["fixed_standard_count"], 2)
        self.assertEqual(summary["new_standard_count"], 1)
        self.assertEqual(summary["upgraded_super_count"], 1)
        self.assertEqual(summary["new_super_count"], 1)
        self.assertEqual(summary["mini_count"], 0)
        self.assertEqual(summary["total_unique_physical_store_count"], 3)


if __name__ == "__main__":
    unittest.main()
