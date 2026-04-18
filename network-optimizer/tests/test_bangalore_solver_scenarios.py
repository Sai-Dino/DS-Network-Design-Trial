import os
import sys
import tempfile
import unittest
from pathlib import Path


ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from bangalore_solver.scenario_runner import (
    default_scenarios,
    load_scenarios_from_file,
    summarize_scenario_results,
)


class BangaloreSolverScenarioRunnerTests(unittest.TestCase):
    def test_summarize_scenario_results_emits_readable_rows(self):
        rows = summarize_scenario_results(
            [
                {
                    "scenario_name": "anchor_replay",
                    "scenario_mode": "exploratory",
                    "changed_policy_settings": {"mini_density_radius_km": 1.0},
                    "policy_settings": {"target_total_physical_sites_exact": 200},
                    "status": "feasible",
                    "commercially_comparable": True,
                    "result": {
                        "hard_coverage_pct": 99.75,
                        "avg_last_mile_cost": 37.8022,
                        "store_counts": {
                            "fixed_standard_count": 103,
                            "new_standard_count": 97,
                            "upgraded_super_count": 8,
                            "new_super_count": 40,
                            "mini_count": 19,
                            "total_unique_physical_store_count": 200,
                        },
                    },
                }
            ]
        )

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["scenario_name"], "anchor_replay")
        self.assertEqual(rows[0]["scenario_mode"], "exploratory")
        self.assertEqual(rows[0]["changed_policy_settings"], {"mini_density_radius_km": 1.0})
        self.assertEqual(rows[0]["feasible_status"], "feasible")
        self.assertEqual(rows[0]["total_unique_physical_store_count"], 200)
        self.assertTrue(rows[0]["commercially_comparable"])

    def test_default_scenarios_cover_required_exploratory_and_constrained_cases(self):
        scenarios = default_scenarios()
        scenario_names = {item["scenario_name"] for item in scenarios}
        exploratory_names = {
            item["scenario_name"]
            for item in scenarios
            if item["scenario_mode"] == "exploratory"
        }
        constrained_names = {
            item["scenario_name"]
            for item in scenarios
            if item["scenario_mode"] == "constrained"
        }

        self.assertTrue(
            {
                "anchor_replay",
                "mini_radius_1_0",
                "mini_radius_1_25",
                "mini_radius_1_5",
                "standard_radius_3_0",
                "standard_radius_3_5",
                "super_policy_off",
                "super_policy_on_fallback",
                "combined_exploratory_shift",
            }.issubset(exploratory_names)
        )
        self.assertTrue(
            {
                "exact_total_physical_sites_200",
                "store_band_150_200",
                "avg_last_mile_cost_cap_35",
                "constrained_super_policy_off",
                "constrained_super_policy_on_fallback",
            }.issubset(constrained_names)
        )
        self.assertEqual(len(scenario_names), len(scenarios))

    def test_load_scenarios_from_file_preserves_mode_and_overrides(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "scenarios.json"
            path.write_text(
                """
[
  {
    "scenario_name": "exploratory_case",
    "scenario_mode": "exploratory",
    "overrides": {
      "standard_radius_km": 3.5,
      "require_super_core_city_coverage": true
    }
  }
]
                """.strip()
            )

            scenarios = load_scenarios_from_file(path)

        self.assertEqual(len(scenarios), 1)
        self.assertEqual(scenarios[0]["scenario_name"], "exploratory_case")
        self.assertEqual(scenarios[0]["scenario_mode"], "exploratory")
        self.assertEqual(scenarios[0]["overrides"]["standard_radius_km"], 3.5)
        self.assertTrue(scenarios[0]["overrides"]["require_super_core_city_coverage"])


if __name__ == "__main__":
    unittest.main()
