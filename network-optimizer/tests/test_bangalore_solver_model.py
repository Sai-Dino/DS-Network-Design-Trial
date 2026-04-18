import os
import sys
import unittest


ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from bangalore_solver.config import BangaloreSolverConfig
from bangalore_solver.contracts import DemandCluster, SolverInputs, SolverSite
from bangalore_solver.model import solve_bangalore_solver_model


class BangaloreSolverModelTests(unittest.TestCase):
    def test_model_honors_min_total_physical_sites(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=0.0,
            min_total_physical_sites=2,
        )
        inputs = SolverInputs(
            demand_clusters=[],
            fixed_sites=[],
            candidate_sites=[
                SolverSite("cand-a", 12.93, 77.63, fixed=False, source="demand_seed"),
                SolverSite("cand-b", 12.96, 77.66, fixed=False, source="gap_fill_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 1}, "total_candidates": 2},
            demand_summary={"cluster_count": 0, "total_demand": 0.0},
            business_regions=[],
            excluded_islands=[],
        )

        result = solve_bangalore_solver_model(inputs, config, distance_lookup={})

        self.assertTrue(result["feasible"])
        self.assertEqual(result["store_counts"]["new_standard_count"], 2)
        self.assertEqual(len(result["selected_standard_site_ids"]), 2)

    def test_model_honors_exact_total_physical_sites(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            target_total_physical_sites_exact=2,
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("tail", 12.9600, 77.6600, 100.0, 1),
            ],
            fixed_sites=[
                SolverSite("fixed-a", 12.93, 77.63, fixed=True, source="fixed_store"),
            ],
            candidate_sites=[
                SolverSite("cand-a", 12.96, 77.66, fixed=False, source="demand_seed"),
                SolverSite("cand-b", 12.99, 77.69, fixed=False, source="gap_fill_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 1}, "total_candidates": 2},
            demand_summary={"cluster_count": 1, "total_demand": 100.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-a", "tail"): 5.0,
            ("cand-a", "tail"): 1.0,
            ("cand-b", "tail"): 2.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["store_counts"]["total_unique_physical_store_count"], 2)
        self.assertEqual(result["store_counts"]["new_standard_count"], 1)

    def test_model_flags_infeasible_when_exact_total_physical_sites_is_missed(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=0.0,
            target_total_physical_sites_exact=2,
        )
        inputs = SolverInputs(
            demand_clusters=[],
            fixed_sites=[
                SolverSite("fixed-a", 12.93, 77.63, fixed=True, source="fixed_store"),
            ],
            candidate_sites=[
                SolverSite("cand-a", 12.96, 77.66, fixed=False, source="demand_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1}, "total_candidates": 1},
            demand_summary={"cluster_count": 0, "total_demand": 0.0},
            business_regions=[],
            excluded_islands=[],
        )

        result = solve_bangalore_solver_model(inputs, config, distance_lookup={})

        self.assertFalse(result["feasible"])
        self.assertEqual(result["status"], "policy_infeasible")
        self.assertIn("target_total_physical_sites_exact", result["policy_evaluation"]["violations"][0])

    def test_model_upgrades_fixed_super_when_tail_cluster_requires_it(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
        )
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            super_eligible_fixed=True,
            source="fixed_store",
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("tail", 12.9400, 77.6000, 40.0, 1),
            ],
            fixed_sites=[fixed_site],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 1, "total_demand": 40.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "tail"): 5.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["store_counts"]["upgraded_super_count"], 1)
        self.assertEqual(result["store_counts"]["new_standard_count"], 0)
        self.assertEqual(result["assignment_summary"]["uncovered_cluster_count"], 0)

    def test_model_blocks_sparse_fixed_super_upgrade_when_super_min_orders_is_not_met(self):
        base_kwargs = {
            "hard_coverage_floor_pct": 100.0,
            "standard_radius_km": 3.0,
            "super_radius_km": 5.5,
        }
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            super_eligible_fixed=True,
            source="fixed_store",
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("tail", 12.9400, 77.6000, 40.0, 1),
            ],
            fixed_sites=[fixed_site],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 1, "total_demand": 40.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "tail"): 5.0,
        }

        baseline = solve_bangalore_solver_model(
            inputs,
            BangaloreSolverConfig(**base_kwargs),
            distance_lookup=distance_lookup,
        )
        guarded = solve_bangalore_solver_model(
            inputs,
            BangaloreSolverConfig(**base_kwargs, super_min_orders_per_day=50.0),
            distance_lookup=distance_lookup,
        )

        self.assertTrue(baseline["feasible"])
        self.assertEqual(baseline["selected_super_site_ids"], ["fixed-1"])
        self.assertFalse(guarded["feasible"])
        self.assertEqual(guarded["store_counts"]["upgraded_super_count"], 0)

    def test_model_uses_store_tiebreak_when_costs_match(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
        )
        candidate_a = SolverSite("cand-a", 12.93, 77.63, fixed=False, source="demand_seed")
        candidate_b = SolverSite("cand-b", 12.96, 77.66, fixed=False, source="gap_fill_seed")
        inputs = SolverInputs(
            demand_clusters=[DemandCluster("tail", 12.94, 77.64, 50.0, 1)],
            fixed_sites=[],
            candidate_sites=[candidate_a, candidate_b],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 1}, "total_candidates": 2},
            demand_summary={"cluster_count": 1, "total_demand": 50.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("cand-a", "tail"): 2.0,
            ("cand-b", "tail"): 2.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["store_counts"]["new_standard_count"], 1)
        self.assertEqual(result["selected_standard_site_ids"], ["cand-a"])

    def test_model_blocks_sparse_new_standard_when_standard_min_orders_is_not_met(self):
        base_kwargs = {
            "hard_coverage_floor_pct": 100.0,
            "standard_radius_km": 3.0,
            "super_radius_km": 5.5,
        }
        candidate_site = SolverSite("cand-a", 12.9400, 77.6400, fixed=False, source="demand_seed")
        inputs = SolverInputs(
            demand_clusters=[DemandCluster("tail", 12.9400, 77.6400, 80.0, 1)],
            fixed_sites=[],
            candidate_sites=[candidate_site],
            candidate_summary={"selected_by_source": {"demand_seed": 1}, "total_candidates": 1},
            demand_summary={"cluster_count": 1, "total_demand": 80.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("cand-a", "tail"): 0.1,
        }

        baseline = solve_bangalore_solver_model(
            inputs,
            BangaloreSolverConfig(**base_kwargs),
            distance_lookup=distance_lookup,
        )
        guarded = solve_bangalore_solver_model(
            inputs,
            BangaloreSolverConfig(**base_kwargs, standard_min_orders_per_day=100.0),
            distance_lookup=distance_lookup,
        )

        self.assertTrue(baseline["feasible"])
        self.assertEqual(baseline["selected_standard_site_ids"], ["cand-a"])
        self.assertFalse(guarded["feasible"])
        self.assertEqual(guarded["store_counts"]["new_standard_count"], 0)

    def test_model_prefers_standard_candidate_with_more_boundary_clearance_when_costs_tie(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            standard_min_boundary_clearance_km=0.5,
        )
        inputs = SolverInputs(
            demand_clusters=[DemandCluster("tail", 12.9200, 77.6200, 100.0, 1)],
            fixed_sites=[],
            candidate_sites=[
                SolverSite("cand-edge", 12.9008, 77.6200, fixed=False, source="demand_seed"),
                SolverSite("cand-safe", 12.9200, 77.6200, fixed=False, source="gap_fill_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 1}, "total_candidates": 2},
            demand_summary={"cluster_count": 1, "total_demand": 100.0},
            business_regions=[
                {
                    "id": "poly-1",
                    "polygon_coords": [
                        [12.9000, 77.6000],
                        [12.9400, 77.6000],
                        [12.9400, 77.6400],
                        [12.9000, 77.6400],
                        [12.9000, 77.6000],
                    ],
                }
            ],
            excluded_islands=[],
        )
        distance_lookup = {
            ("cand-edge", "tail"): 1.0,
            ("cand-safe", "tail"): 1.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["selected_standard_site_ids"], ["cand-safe"])
        self.assertEqual(result["realism_diagnostics"]["boundary_hugging_standard_count"], 0)

    def test_model_prefers_standard_candidate_farther_from_fixed_store_when_costs_tie(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            candidate_spacing_km=1.0,
            standard_fixed_store_buffer_km=2.0,
        )
        inputs = SolverInputs(
            demand_clusters=[DemandCluster("tail", 12.9300, 77.6000, 120.0, 1)],
            fixed_sites=[
                SolverSite("fixed-1", 12.9000, 77.6000, fixed=True, source="fixed_store"),
            ],
            candidate_sites=[
                SolverSite("cand-near", 12.9120, 77.6000, fixed=False, source="demand_seed"),
                SolverSite("cand-far", 12.9200, 77.6000, fixed=False, source="gap_fill_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 1}, "total_candidates": 2},
            demand_summary={"cluster_count": 1, "total_demand": 120.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "tail"): 5.0,
            ("cand-near", "tail"): 1.0,
            ("cand-far", "tail"): 1.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["selected_standard_site_ids"], ["cand-far"])
        self.assertEqual(result["realism_diagnostics"]["near_fixed_store_standard_count"], 0)

    def test_model_allows_high_incremental_near_fixed_candidate_when_weak_threshold_is_not_triggered(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            candidate_spacing_km=1.0,
            standard_fixed_store_buffer_km=2.0,
            standard_weak_incremental_orders_per_day=50.0,
        )
        inputs = SolverInputs(
            demand_clusters=[DemandCluster("tail", 12.9300, 77.6000, 120.0, 1)],
            fixed_sites=[
                SolverSite("fixed-1", 12.9000, 77.6000, fixed=True, source="fixed_store"),
            ],
            candidate_sites=[
                SolverSite("cand-near", 12.9120, 77.6000, fixed=False, source="demand_seed"),
                SolverSite("cand-far", 12.9200, 77.6000, fixed=False, source="gap_fill_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 1}, "total_candidates": 2},
            demand_summary={"cluster_count": 1, "total_demand": 120.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "tail"): 5.0,
            ("cand-near", "tail"): 1.0,
            ("cand-far", "tail"): 1.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["selected_standard_site_ids"], ["cand-near"])
        self.assertEqual(
            result["realism_diagnostics"]["weak_incremental_near_fixed_store_standard_count"],
            0,
        )
        self.assertEqual(result["realism_diagnostics"]["suspicious_standard_count"], 0)

    def test_model_reports_incremental_value_metric_for_boundary_sites(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            standard_min_boundary_clearance_km=0.5,
            standard_weak_incremental_orders_per_day=50.0,
        )
        inputs = SolverInputs(
            demand_clusters=[DemandCluster("tail", 12.9012, 77.6200, 120.0, 1)],
            fixed_sites=[],
            candidate_sites=[
                SolverSite("cand-edge", 12.9008, 77.6200, fixed=False, source="demand_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1}, "total_candidates": 1},
            demand_summary={"cluster_count": 1, "total_demand": 120.0},
            business_regions=[
                {
                    "id": "poly-1",
                    "polygon_coords": [
                        [12.9000, 77.6000],
                        [12.9400, 77.6000],
                        [12.9400, 77.6400],
                        [12.9000, 77.6400],
                        [12.9000, 77.6000],
                    ],
                }
            ],
            excluded_islands=[],
        )
        distance_lookup = {
            ("cand-edge", "tail"): 0.1,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        diagnostics = result["realism_diagnostics"]
        self.assertEqual(diagnostics["boundary_hugging_standard_count"], 1)
        self.assertEqual(diagnostics["weak_incremental_boundary_hugging_standard_count"], 0)
        self.assertEqual(diagnostics["suspicious_standard_count"], 0)
        self.assertEqual(
            diagnostics["incremental_value_metric"]["metric_key"],
            "fixed_network_uncovered_demand_orders_per_day",
        )
        self.assertEqual(
            diagnostics["incremental_value_metric"]["weak_threshold_orders_per_day"],
            50.0,
        )
        site = result["selected_new_standard_sites"][0]
        self.assertEqual(site["incremental_value_orders_per_day"], 120.0)
        self.assertFalse(site["is_weak_incremental_value"])

    def test_model_declusters_new_standards_when_min_site_policy_forces_multiple_opens(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=0.0,
            min_total_physical_sites=2,
            candidate_spacing_km=0.5,
            standard_soft_cluster_radius_km=2.0,
        )
        inputs = SolverInputs(
            demand_clusters=[],
            fixed_sites=[],
            candidate_sites=[
                SolverSite("cand-a", 12.9000, 77.6000, fixed=False, source="demand_seed"),
                SolverSite("cand-b", 12.9060, 77.6000, fixed=False, source="gap_fill_seed"),
                SolverSite("cand-c", 12.9400, 77.6000, fixed=False, source="gap_fill_seed"),
            ],
            candidate_summary={"selected_by_source": {"demand_seed": 1, "gap_fill_seed": 2}, "total_candidates": 3},
            demand_summary={"cluster_count": 0, "total_demand": 0.0},
            business_regions=[],
            excluded_islands=[],
        )

        result = solve_bangalore_solver_model(inputs, config, distance_lookup={})

        self.assertTrue(result["feasible"])
        self.assertEqual(result["selected_standard_site_ids"], ["cand-a", "cand-c"])
        self.assertEqual(result["realism_diagnostics"]["clustered_standard_pair_count"], 0)

    def test_model_adds_density_triggered_mini_when_threshold_is_met(self):
        base_kwargs = {
            "hard_coverage_floor_pct": 100.0,
            "standard_radius_km": 3.0,
            "super_radius_km": 5.5,
            "mini_service_radius_km": 1.0,
            "mini_base_cost": 20.0,
            "mini_variable_rate": 5.0,
        }
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            source="fixed_store",
        )
        dense_clusters = [
            DemandCluster("dense-a", 12.9200, 77.6000, 260.0, 1),
            DemandCluster("dense-b", 12.9204, 77.6000, 250.0, 1),
        ]
        inputs = SolverInputs(
            demand_clusters=dense_clusters,
            fixed_sites=[fixed_site],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 2, "total_demand": 510.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "dense-a"): 2.2,
            ("fixed-1", "dense-b"): 2.24,
        }

        baseline = solve_bangalore_solver_model(
            inputs,
            BangaloreSolverConfig(
                **base_kwargs,
                city_policy_overrides={},
                mini_density_radius_km=None,
                mini_density_min_orders_per_day=None,
            ),
            distance_lookup=distance_lookup,
        )
        triggered = solve_bangalore_solver_model(
            inputs,
            BangaloreSolverConfig(
                **base_kwargs,
                mini_density_radius_km=1.0,
                mini_density_min_orders_per_day=400,
            ),
            distance_lookup=distance_lookup,
        )

        self.assertEqual(baseline["store_counts"]["mini_count"], 0)
        self.assertGreaterEqual(triggered["store_counts"]["mini_count"], 1)
        self.assertLess(triggered["avg_last_mile_cost"], baseline["avg_last_mile_cost"])
        self.assertEqual(triggered["hard_coverage_pct"], baseline["hard_coverage_pct"])

    def test_model_can_snap_density_triggered_mini_to_existing_physical_site(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            mini_service_radius_km=1.0,
            mini_base_cost=20.0,
            mini_variable_rate=5.0,
            mini_density_radius_km=1.0,
            mini_density_min_orders_per_day=400,
            mini_prefer_existing_physical_site_radius_km=1.0,
        )
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            source="fixed_store",
        )
        dense_clusters = [
            DemandCluster("dense-a", 12.9070, 77.6000, 260.0, 1),
            DemandCluster("dense-b", 12.9072, 77.6000, 250.0, 1),
        ]
        inputs = SolverInputs(
            demand_clusters=dense_clusters,
            fixed_sites=[fixed_site],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 2, "total_demand": 510.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "dense-a"): 0.8,
            ("fixed-1", "dense-b"): 0.82,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertEqual(result["store_counts"]["mini_count"], 1)
        self.assertEqual(result["mini_stage_summary"]["new_unique_mini_site_count"], 0)
        self.assertFalse(result["mini_sites"][0]["counts_as_unique_physical_site"])
        self.assertEqual(result["mini_sites"][0]["co_located_with_site_id"], "fixed-1")

    def test_model_dedupes_multiple_density_triggers_that_snap_to_same_physical_site(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            mini_service_radius_km=1.0,
            mini_base_cost=20.0,
            mini_variable_rate=5.0,
            mini_density_radius_km=0.5,
            mini_density_min_orders_per_day=400,
            mini_prefer_existing_physical_site_radius_km=1.0,
        )
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            source="fixed_store",
        )
        demand_clusters = [
            DemandCluster("dense-east", 12.9070, 77.6000, 450.0, 1),
            DemandCluster("dense-west", 12.8930, 77.6000, 430.0, 1),
        ]
        inputs = SolverInputs(
            demand_clusters=demand_clusters,
            fixed_sites=[fixed_site],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 2, "total_demand": 880.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "dense-east"): 0.8,
            ("fixed-1", "dense-west"): 0.8,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertEqual(result["store_counts"]["mini_count"], 1)
        self.assertEqual(result["mini_stage_summary"]["new_unique_mini_site_count"], 0)
        self.assertEqual(result["mini_sites"][0]["co_located_with_site_id"], "fixed-1")
        self.assertEqual(result["mini_sites"][0]["served_cluster_count"], 2)

    def test_model_flags_infeasible_when_avg_last_mile_cost_cap_is_missed(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            avg_last_mile_cost_cap=30.0,
        )
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            source="fixed_store",
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("near", 12.9200, 77.6000, 100.0, 1),
            ],
            fixed_sites=[fixed_site],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 1, "total_demand": 100.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "near"): 2.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertFalse(result["feasible"])
        self.assertEqual(result["status"], "policy_infeasible")
        self.assertIn("avg_last_mile_cost_cap", result["policy_evaluation"]["violations"][0])

    def test_model_prefers_fixed_super_upgrade_before_new_super_when_enabled(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=100.0,
            standard_radius_km=3.0,
            super_radius_km=5.5,
            prefer_eligible_fixed_store_upgrades_to_super=True,
        )
        fixed_site = SolverSite(
            site_id="fixed-1",
            lat=12.9000,
            lon=77.6000,
            fixed=True,
            super_eligible_fixed=True,
            source="fixed_store",
        )
        candidate_site = SolverSite(
            site_id="cand-1",
            lat=12.9000,
            lon=77.6000,
            fixed=False,
            source="demand_seed",
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("tail", 12.9400, 77.6000, 100.0, 1),
            ],
            fixed_sites=[fixed_site],
            candidate_sites=[candidate_site],
            candidate_summary={"selected_by_source": {"demand_seed": 1}, "total_candidates": 1},
            demand_summary={"cluster_count": 1, "total_demand": 100.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "tail"): 5.0,
            ("cand-1", "tail"): 5.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["store_counts"]["upgraded_super_count"], 1)
        self.assertEqual(result["store_counts"]["new_super_count"], 0)
        self.assertEqual(result["selected_super_site_ids"], ["fixed-1"])

    def test_model_uses_demand_area_fallback_for_super_core_city_policy_without_geojson(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=0.0,
            require_super_core_city_coverage=True,
            super_core_city_fallback_min_demand_area_pct=90.0,
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("cluster-a", 12.9000, 77.6000, 50.0, 4),
                DemandCluster("cluster-b", 12.9100, 77.6000, 50.0, 3),
                DemandCluster("cluster-c", 12.9200, 77.6000, 50.0, 2),
                DemandCluster("cluster-d", 12.9700, 77.6000, 50.0, 1),
            ],
            fixed_sites=[
                SolverSite(
                    "fixed-1",
                    12.8800,
                    77.6000,
                    fixed=True,
                    source="fixed_store",
                    super_eligible_fixed=True,
                )
            ],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 4, "total_demand": 200.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "cluster-a"): 2.5,
            ("fixed-1", "cluster-b"): 3.5,
            ("fixed-1", "cluster-c"): 4.5,
            ("fixed-1", "cluster-d"): 6.0,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(result["status"], "prototype_solved")
        self.assertEqual(result["selected_super_site_ids"], ["fixed-1"])
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["mode"],
            "fallback_demand_cells_proxy",
        )
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["target_member_count"],
            10,
        )
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["covered_member_count"],
            9,
        )
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["measurement_basis"],
            "demand_bearing_solver_cell_count_proxy",
        )
        self.assertIn(
            "not literal geographic area",
            result["policy_evaluation"]["super_coverage"]["definition"],
        )

    def test_model_prioritizes_authoritative_geojson_over_demand_area_fallback(self):
        config = BangaloreSolverConfig(
            hard_coverage_floor_pct=0.0,
            require_super_core_city_coverage=True,
            super_core_city_fallback_min_demand_area_pct=90.0,
            super_core_city_geojson={
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [77.595, 12.895],
                                    [77.605, 12.895],
                                    [77.605, 12.905],
                                    [77.595, 12.905],
                                    [77.595, 12.895],
                                ]
                            ],
                        },
                    }
                ],
            },
        )
        inputs = SolverInputs(
            demand_clusters=[
                DemandCluster("inside-core", 12.9000, 77.6000, 50.0, 1),
                DemandCluster("outside-core-a", 12.9300, 77.6000, 50.0, 4),
                DemandCluster("outside-core-b", 12.9700, 77.6000, 50.0, 5),
            ],
            fixed_sites=[
                SolverSite(
                    "fixed-1",
                    12.8800,
                    77.6000,
                    fixed=True,
                    source="fixed_store",
                    super_eligible_fixed=True,
                )
            ],
            candidate_sites=[],
            candidate_summary={"selected_by_source": {}, "total_candidates": 0},
            demand_summary={"cluster_count": 3, "total_demand": 150.0},
            business_regions=[],
            excluded_islands=[],
        )
        distance_lookup = {
            ("fixed-1", "inside-core"): 2.5,
            ("fixed-1", "outside-core-a"): 6.0,
            ("fixed-1", "outside-core-b"): 6.5,
        }

        result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)

        self.assertTrue(result["feasible"])
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["mode"],
            "authoritative_geojson",
        )
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["target_cluster_count"],
            1,
        )
        self.assertEqual(
            result["policy_evaluation"]["super_coverage"]["covered_cluster_count"],
            1,
        )


if __name__ == "__main__":
    unittest.main()
