import os
import sys
import unittest
from unittest.mock import patch


ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import server


class SolverWorkbenchServerTests(unittest.TestCase):
    def test_build_solver_workbench_request_allows_exploratory_free_play(self):
        overrides, request = server._build_solver_workbench_request(
            {
                "solver_mode": "exploratory",
                "standard_service_radius_km": 3.5,
                "standard_min_orders_per_day": 300,
                "super_service_radius_km": 5.5,
                "super_min_orders_per_day": 300,
                "mini_service_radius_km": 1.25,
                "mini_min_orders_per_day": 1212,
            }
        )

        self.assertEqual(request["solver_mode"], "exploratory")
        self.assertEqual(request["constraint_summary"], "published Bangalore free-play envelope")
        self.assertIsNone(overrides["target_total_physical_sites_exact"])
        self.assertIsNone(overrides["avg_last_mile_cost_cap"])
        self.assertEqual(overrides["standard_radius_km"], 3.5)
        self.assertEqual(overrides["standard_min_orders_per_day"], 300.0)
        self.assertEqual(overrides["super_radius_km"], 5.5)
        self.assertEqual(overrides["super_min_orders_per_day"], 300.0)
        self.assertEqual(overrides["mini_service_radius_km"], 1.25)
        self.assertEqual(overrides["mini_min_orders_per_day"], 1212.0)
        self.assertEqual(overrides["mini_density_radius_km"], 1.25)
        self.assertEqual(request["standard_service_radius_km"], 3.5)
        self.assertEqual(request["super_service_radius_km"], 5.5)
        self.assertEqual(request["mini_min_orders_per_day"], 1212.0)

    def test_build_solver_workbench_request_supports_exact_total_constraint(self):
        overrides, request = server._build_solver_workbench_request(
            {
                "solver_mode": "constrained",
                "target_total_physical_sites_exact": 200,
                "require_super_core_city_coverage": True,
            }
        )

        self.assertEqual(request["solver_mode"], "constrained")
        self.assertEqual(request["constraint_summary"], "exact total 200")
        self.assertEqual(overrides["target_total_physical_sites_exact"], 200)
        self.assertTrue(overrides["require_super_core_city_coverage"])

    def test_build_solver_workbench_request_rejects_partial_store_band(self):
        with self.assertRaises(ValueError):
            server._build_solver_workbench_request(
                {
                    "solver_mode": "constrained",
                    "min_total_physical_sites": 150,
                }
            )

    def test_build_solver_workbench_request_rejects_legacy_only_controls(self):
        with self.assertRaises(ValueError):
            server._build_solver_workbench_request(
                {
                    "solver_mode": "exploratory",
                    "standard_ds_min_orders_per_day": 500,
                }
            )

    def test_build_solver_workbench_request_rejects_internal_mini_density_knobs(self):
        with self.assertRaises(ValueError):
            server._build_solver_workbench_request(
                {
                    "solver_mode": "exploratory",
                    "mini_density_radius_km": 1.0,
                }
            )

    def test_solver_workbench_base_overrides_prefers_saved_workbench_snapshot(self):
        workbench_snapshot = {
            "config_snapshot": {
                "standard_radius_km": 3.5,
                "super_min_orders_per_day": 375.0,
                "mini_min_orders_per_day": 1400.0,
            }
        }
        anchor_snapshot = {
            "config_snapshot": {
                "standard_radius_km": 3.0,
                "super_min_orders_per_day": 300.0,
                "mini_min_orders_per_day": 1212.0,
            }
        }

        with patch.object(server, "_load_latest_bangalore_solver_workbench_result", return_value=workbench_snapshot), patch.object(
            server, "_load_latest_bangalore_solver_result", return_value=anchor_snapshot
        ):
            overrides = server._solver_workbench_base_overrides()

        self.assertEqual(overrides["standard_radius_km"], 3.5)
        self.assertEqual(overrides["super_min_orders_per_day"], 375.0)
        self.assertEqual(overrides["mini_min_orders_per_day"], 1400.0)

    def test_solver_workbench_payload_reconstructs_request_from_saved_artifact(self):
        saved_payload = {
            "status": "prototype_solved",
            "feasible": True,
            "hard_coverage_pct": 99.75,
            "avg_last_mile_cost": 38.0123,
            "store_counts": {
                "fixed_standard_count": 103,
                "new_standard_count": 97,
                "upgraded_super_count": 13,
                "new_super_count": 2,
                "mini_count": 19,
                "total_unique_physical_store_count": 200,
            },
            "config_snapshot": {
                "standard_radius_km": 3.0,
                "super_radius_km": 5.5,
                "mini_service_radius_km": 1.0,
                "effective_standard_min_orders_per_day": None,
                "effective_super_min_orders_per_day": 375.0,
                "effective_mini_min_orders_per_day": 1212.0,
                "effective_target_total_physical_sites_exact": 200,
                "effective_min_total_physical_sites": 200,
                "effective_max_total_physical_sites": 200,
                "effective_avg_last_mile_cost_cap": None,
                "effective_require_super_core_city_coverage": False,
                "effective_prefer_eligible_fixed_store_upgrades_to_super": True,
            },
        }

        original_live_payload = server.state.solver_workbench_result
        server.state.solver_workbench_result = None
        try:
            with patch.object(server, "_load_latest_bangalore_solver_workbench_result", return_value=saved_payload):
                payload = server._solver_workbench_result_payload()
        finally:
            server.state.solver_workbench_result = original_live_payload

        request = payload.get("solver_workbench_request") or {}
        self.assertEqual(request.get("solver_mode"), "constrained")
        self.assertEqual(request.get("constraint_summary"), "exact total 200")
        self.assertEqual(request.get("super_min_orders_per_day"), 375.0)
        self.assertEqual(request.get("mini_min_orders_per_day"), 1212.0)
        self.assertEqual(payload["proposed_site_mix_summary"]["fixed_standard_remaining_open_count"], 103)
        self.assertEqual(payload["proposed_site_mix_summary"]["net_new_standard_count"], 97)
        self.assertEqual(payload["proposed_site_mix_summary"]["fixed_store_upgrades_to_super_count"], 13)
        self.assertEqual(payload["proposed_site_mix_summary"]["net_new_super_count"], 2)
        self.assertEqual(payload["proposed_site_mix_summary"]["net_new_mini_count"], 19)

    def test_solver_workbench_base_overrides_merges_new_bangalore_policy_defaults(self):
        workbench_snapshot = {
            "config_snapshot": {
                "city_policy_overrides": {
                    "Bangalore": {
                        "min_total_physical_sites": 150,
                        "max_total_physical_sites": 200,
                        "mini_density_radius_km": 1.0,
                        "mini_density_min_orders_per_day": 1212.0,
                    }
                }
            }
        }

        with patch.object(server, "_load_latest_bangalore_solver_workbench_result", return_value=workbench_snapshot):
            overrides = server._solver_workbench_base_overrides()

        bangalore_policy = overrides["city_policy_overrides"]["Bangalore"]
        self.assertIn("standard_min_boundary_clearance_km", bangalore_policy)
        self.assertIn("standard_fixed_store_buffer_km", bangalore_policy)
        self.assertIn("standard_soft_cluster_radius_km", bangalore_policy)

    def test_enrich_bangalore_solver_result_builds_downloadable_proposed_locations(self):
        payload = {
            "store_counts": {
                "fixed_standard_count": 103,
                "new_standard_count": 2,
                "upgraded_super_count": 1,
                "new_super_count": 1,
                "mini_count": 1,
                "total_unique_physical_store_count": 106,
            },
            "fixed_open_sites": [
                {"id": "fixed-1", "site_id": "fixed-1", "lat": 12.9, "lon": 77.6},
            ],
            "selected_new_standard_sites": [
                {"id": "std-1", "site_id": "std-1", "lat": 12.91, "lon": 77.61, "orders_per_day": 80.0},
                {"id": "std-2", "site_id": "std-2", "lat": 12.92, "lon": 77.62, "orders_per_day": 75.0},
            ],
            "selected_super_sites": [
                {"id": "fixed-2", "site_id": "fixed-2", "lat": 12.93, "lon": 77.63, "fixed_open": True},
                {"id": "sup-1", "site_id": "sup-1", "lat": 12.94, "lon": 77.64, "fixed_open": False},
            ],
            "mini_sites": [
                {"id": "mini-1", "site_id": "mini-1", "lat": 12.95, "lon": 77.65, "orders_per_day": 140.0},
            ],
            "config_snapshot": {},
        }

        enriched = server._enrich_bangalore_solver_result(payload)

        self.assertEqual(enriched["proposed_site_mix_summary"]["fixed_standard_remaining_open_count"], 103)
        self.assertEqual(len(enriched["downloadable_proposed_site_rows"]), 5)
        row_types = [row["site_type"] for row in enriched["downloadable_proposed_site_rows"]]
        self.assertEqual(
            row_types,
            ["net_new_standard", "net_new_standard", "fixed_store_upgrade_to_super", "net_new_super", "net_new_mini"],
        )
        self.assertEqual(enriched["downloadable_proposed_site_rows"][0]["tier"], "Standard")


if __name__ == "__main__":
    unittest.main()
