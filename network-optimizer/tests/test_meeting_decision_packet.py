import os
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

from server import (
    _build_meeting_decision_grade_result,
    _build_radius_override_recommendations,
    _complete_standard_branch_from_base,
    _evaluate_meeting_standard_branch,
    _finalize_bangalore_multilayer_result_from_core,
    _load_exact_scenario_checkpoint,
    _meeting_super_count_semantics,
    _pick_active_meeting_view_key,
    _prune_redundant_standard_sites,
    _rounded_site_key,
    _run_standard_cost_frontier_pass,
    _run_standard_rescue_pass,
    _save_latest_decision_packet,
    _snap_gap_fill_center_to_cached_member,
    _summarize_proposed_policy,
    find_standard_ds,
)


class MeetingDecisionPacketTests(unittest.TestCase):
    def test_pick_active_view_prefers_lower_cost_once_views_clear_business_floor(self):
        scenario_views = {
            'exception_first_standard_100': {
                'view_key': 'exception_first_standard_100',
                'proposed_hard_coverage_pct': 99.86,
                'proposed_avg_cost': 44.80,
                'total_physical_standard_count': 117,
                'rescue_standard_count': 8,
                'exception_override_count': 24,
                'branch_comparison_ready': True,
            },
            'rescue_first_standard_100_plus_mini': {
                'view_key': 'rescue_first_standard_100_plus_mini',
                'proposed_hard_coverage_pct': 99.74,
                'proposed_avg_cost': 41.95,
                'total_physical_standard_count': 118,
                'rescue_standard_count': 10,
                'exception_override_count': 22,
                'branch_comparison_ready': True,
                'mini_count': 14,
                'avg_cost_delta_vs_parent': 1.62,
            },
        }

        chosen = _pick_active_meeting_view_key(
            scenario_views,
            {'business_target_coverage_pct': 99.7},
        )

        self.assertEqual(chosen, 'rescue_first_standard_100_plus_mini')

    def test_save_latest_decision_packet_rejects_provisional_preview(self):
        preview_packet = {
            'fixed_store_mode': 'benchmark_103',
            'pipeline': {'phase': 'core_decision_packet'},
            'deferred_result': {'ready': False},
            'result_state': {
                'status': 'provisional_preview',
                'is_final': False,
            },
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = os.path.join(tmpdir, 'latest_bangalore_103_decision_packet.json')
            with patch('server.LATEST_DECISION_PACKET_JSON', out_path):
                saved_path = _save_latest_decision_packet(preview_packet)

            self.assertIsNone(saved_path)
            self.assertFalse(os.path.exists(out_path))

    def test_meeting_super_count_semantics_separates_overlay_support_from_true_super(self):
        counts = _meeting_super_count_semantics(
            total_physical_standard_count=111,
            mini_sites=[],
            super_sites=[
                {
                    'id': 'OVERLAY-REUSE-1',
                    'site_source': 'existing_standard',
                    'reused_on_standard_site': True,
                    'site_semantics': 'overlay_support',
                    'counts_as_true_super': False,
                },
                {
                    'id': 'TRUE-SUPER-1',
                    'site_source': 'new_super',
                    'site_semantics': 'true_super_physical',
                    'counts_as_true_super': True,
                },
            ],
        )

        self.assertEqual(counts['super_count'], 1)
        self.assertEqual(counts['overlay_super_count'], 1)
        self.assertEqual(counts['new_physical_super_count'], 1)
        self.assertEqual(counts['total_unique_physical_store_count'], 112)

    def test_load_exact_scenario_checkpoint_reuses_matching_fallback_checkpoint(self):
        payload = {
            '_checkpoint_version': 3,
            '_spacing_conflict_fingerprint': 'spacing-123',
            '_benchmark_fingerprint': 'benchmark-abc',
            'covered_mask': [True, False, True],
            'stage_solution_vector': [1.0, 0.0, 1.0],
            'coverage_pct': 99.7,
            'new_sites': [],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            expected_path = os.path.join(tmpdir, 'exact_strict_3km_99_7_expected.pkl')
            fallback_path = os.path.join(tmpdir, 'exact_strict_3km_99_7_fallback.pkl')
            with open(fallback_path, 'wb') as fh:
                import pickle

                pickle.dump(payload, fh, protocol=pickle.HIGHEST_PROTOCOL)

            params = {'benchmark_solver_checkpoint_version': 'v2'}
            with patch('server.OPTIMIZATION_RESULTS_DIR', tmpdir), patch(
                'server._exact_scenario_checkpoint_path',
                return_value=expected_path,
            ):
                loaded = _load_exact_scenario_checkpoint(
                    'strict_3km_99_7',
                    'graph-cache.pkl',
                    params,
                    spacing_fingerprint='spacing-123',
                    benchmark_fingerprint='benchmark-abc',
                )

            self.assertIsNotNone(loaded)
            self.assertEqual(loaded['coverage_pct'], 99.7)
            self.assertEqual(loaded['_checkpoint_source_path'], fallback_path)
            self.assertEqual(loaded['covered_mask'].dtype.kind, 'b')

    def test_load_exact_scenario_checkpoint_rejects_fallback_with_wrong_fingerprint(self):
        payload = {
            '_checkpoint_version': 3,
            '_spacing_conflict_fingerprint': 'wrong-spacing',
            '_benchmark_fingerprint': 'benchmark-abc',
            'covered_mask': [True],
            'stage_solution_vector': [1.0],
            'coverage_pct': 99.7,
            'new_sites': [],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            expected_path = os.path.join(tmpdir, 'exact_strict_3km_99_7_expected.pkl')
            fallback_path = os.path.join(tmpdir, 'exact_strict_3km_99_7_fallback.pkl')
            with open(fallback_path, 'wb') as fh:
                import pickle

                pickle.dump(payload, fh, protocol=pickle.HIGHEST_PROTOCOL)

            params = {'benchmark_solver_checkpoint_version': 'v2'}
            with patch('server.OPTIMIZATION_RESULTS_DIR', tmpdir), patch(
                'server._exact_scenario_checkpoint_path',
                return_value=expected_path,
            ):
                loaded = _load_exact_scenario_checkpoint(
                    'strict_3km_99_7',
                    'graph-cache.pkl',
                    params,
                    spacing_fingerprint='spacing-123',
                    benchmark_fingerprint='benchmark-abc',
                )

            self.assertIsNone(loaded)

    def test_build_decision_grade_result_does_not_promote_overlay_only_super_to_true_super(self):
        result = _build_meeting_decision_grade_result(
            'rescue_first_standard_100',
            {
                'fixed_standard_count': 103,
                'base_new_standard_count': 2,
                'gap_fill_standard_count': 1,
                'rescue_standard_count': 4,
                'total_physical_standard_count': 110,
                'super_count': 0,
                'overlay_super_count': 6,
                'reused_super_on_standard_count': 6,
                'super_ds': [
                    {'counts_as_true_super': False},
                    {'counts_as_true_super': False},
                ],
                'proposed_hard_coverage_pct': 99.7,
                'proposed_avg_cost': 40.0,
                'proposed_avg_dist': 1.2,
                'current_avg_cost': 45.0,
                'current_avg_dist': 2.0,
                'daily_savings': 100.0,
                'monthly_savings': 3000.0,
            },
            {},
            mini_count=0,
            super_count=None,
        )

        self.assertEqual(result['super_count'], 0)
        self.assertEqual(result['overlay_super_count'], 6)
        self.assertEqual(result['new_physical_super_count'], 0)

    def test_policy_hard_coverage_excludes_mini_when_disabled(self):
        summary = _summarize_proposed_policy(
            weights=np.array([100.0], dtype=np.float64),
            current_costs=np.array([50.0], dtype=np.float64),
            proposed_costs=np.array([20.0], dtype=np.float64),
            d_mini=np.array([0.5], dtype=np.float64),
            d_std=np.array([float('inf')], dtype=np.float64),
            d_std_exception=np.array([float('inf')], dtype=np.float64),
            d_sup=np.array([float('inf')], dtype=np.float64),
            mini_ds=[{'id': 'MINI-1'}],
            standard_ds=[],
            super_ds=[],
            params={
                'mini_ds_radius': 1.0,
                'standard_ds_radius': 3.0,
                'standard_exception_radius_km': 5.0,
                'super_ds_radius': 5.5,
                'mini_counts_as_hard_coverage': False,
            },
        )

        self.assertEqual(summary['proposed_hard_coverage_pct'], 0.0)
        self.assertEqual(summary['hard_covered_orders_per_day'], 0.0)

    def test_policy_hard_coverage_excludes_overlay_super_when_disabled(self):
        summary = _summarize_proposed_policy(
            weights=np.array([100.0], dtype=np.float64),
            current_costs=np.array([50.0], dtype=np.float64),
            proposed_costs=np.array([20.0], dtype=np.float64),
            d_mini=np.array([float('inf')], dtype=np.float64),
            d_std=np.array([float('inf')], dtype=np.float64),
            d_std_exception=np.array([float('inf')], dtype=np.float64),
            d_sup=np.array([2.0], dtype=np.float64),
            mini_ds=[],
            standard_ds=[],
            super_ds=[{'id': 'OVERLAY-SUPER-1', 'counts_as_true_super': False}],
            params={
                'mini_ds_radius': 1.0,
                'standard_ds_radius': 3.0,
                'standard_exception_radius_km': 5.0,
                'super_ds_radius': 5.5,
                'super_role': 'overlay_core_only',
                'overlay_super_counts_as_hard_coverage': False,
            },
        )

        self.assertEqual(summary['proposed_hard_coverage_pct'], 0.0)
        self.assertEqual(summary['hard_covered_orders_per_day'], 0.0)

    def test_complete_standard_branch_does_not_count_provisional_super_relief_as_hard_coverage(self):
        scope_grid = pd.DataFrame(
            {
                'orders_per_day': [100.0],
            }
        )
        base_plan = {
            'fixed_sites': [{'id': 'FIXED-1', 'lat': 12.0, 'lon': 77.0, 'fixed_open': True}],
            'new_sites': [],
            'covered_mask': np.array([False], dtype=bool),
            'min_distances_km': np.array([np.inf], dtype=np.float64),
            'provisional_fixed_super_relief_mask': np.array([True], dtype=bool),
            'provisional_fixed_super_sites': [
                {'id': 'OVERLAY-1', 'counts_as_true_super': False, 'site_semantics': 'overlay_support'}
            ],
        }
        params = {
            'meeting_fast_mode': False,
            'standard_ds_radius': 3.0,
            'standard_exception_radius_km': 3.0,
            'business_target_coverage_pct': 99.8,
            'standard_rescue_enable': False,
        }

        with patch(
            'server._actual_min_distances_to_standard_sites',
            return_value=np.array([np.inf], dtype=np.float64),
        ), patch(
            'server._prune_redundant_standard_sites',
            return_value=(
                list(base_plan['new_sites']),
                np.array(base_plan['covered_mask'], copy=True),
                {'removed_total': 0},
            ),
        ):
            branch_plan = _complete_standard_branch_from_base(
                scope_grid,
                base_plan,
                params,
                branch_type='rescue_first',
            )

        self.assertEqual(branch_plan['coverage_pct'], 0.0)
        self.assertEqual(branch_plan['uncovered_orders_per_day'], 100.0)
        self.assertFalse(branch_plan['covered_mask'][0])
        self.assertIsNone(branch_plan['min_physical_standard_count_for_100'])

    def test_branch_eval_reuses_cached_tier_scoring_outside_meeting_fast_mode(self):
        scope_grid = pd.DataFrame(
            {
                'orders_per_day': [100.0],
            }
        )
        branch_plan = {
            'all_sites': [{'id': 'STD-1', 'lat': 12.0, 'lon': 77.0}],
        }
        cached_result = {
            'combined_metrics': {'proposed_hard_coverage_pct': 99.8},
            'combined_debug': {'debug': True},
            'standard_only_metrics': {'proposed_avg_cost': 42.0},
            'mini_summary': {'site_count': 0},
        }
        eval_params = {
            '_precomputed_current_baseline': {
                'current_costs': np.array([10.0], dtype=np.float64),
                'current_avg_cost': 10.0,
                'current_avg_dist': 1.0,
                'current_policy': {},
            },
            '_cached_demand_candidate_context': object(),
            '_cached_fixed_site_context': object(),
            'reuse_tier_edge_cache': True,
        }
        params = {
            'meeting_fast_mode': False,
            'reuse_tier_edge_cache': True,
            'standard_ds_radius': 3.0,
            'standard_exception_radius_km': 5.0,
            'super_ds_radius': 5.5,
        }

        with patch(
            'server._meeting_branch_eval_from_cached_distances',
            return_value=cached_result,
        ) as cached_eval, patch(
            'server.evaluate_network',
            side_effect=AssertionError('full evaluate_network should not run when cached tier scoring is ready'),
        ):
            result = _evaluate_meeting_standard_branch(
                scope_grid,
                baseline_stores=[],
                branch_plan=branch_plan,
                mini_sites=[],
                eval_params=eval_params,
                params=params,
                progress_label='Branch eval',
            )

        self.assertIs(result, cached_result)
        cached_eval.assert_called_once()

    def test_standard_rescue_uses_sparse_cached_hits_without_full_mask_allocation(self):
        scope_grid = pd.DataFrame(
            {
                'cell_lat': [12.0, 12.1, 12.2],
                'cell_lon': [77.0, 77.1, 77.2],
                'avg_cust_lat': [12.0, 12.1, 12.2],
                'avg_cust_lon': [77.0, 77.1, 77.2],
                'orders_per_day': [50.0, 40.0, 10.0],
            }
        )
        cached_context = {
            'demand_count': 3,
            'coord_to_site_idx': {
                _rounded_site_key(12.0, 77.0): 0,
            },
            'candidate_sites': [{'lat': 12.0, 'lon': 77.0}],
            'graph_edge_lists': [],
            'site_to_demand_cache': {},
            'site_reverse_index': {
                'offsets': np.array([0, 3], dtype=np.int64),
                'demand_indices': np.array([0, 1, 2], dtype=np.int32),
                'distances': np.array([0.1, 0.2, 9.5], dtype=np.float32),
            },
        }
        params = {
            'standard_rescue_enable': True,
            'meeting_fast_mode': False,
            'standard_ds_radius': 3.0,
            'standard_total_hub_cap': 1,
            'standard_rescue_seed_top_k': 1,
            'standard_rescue_open_penalty_per_day': 0.0,
            'standard_base_cost': 29.0,
            'standard_variable_rate': 9.0,
        }

        with patch(
            'server._distance_mask_from_cached_seed',
            side_effect=AssertionError('full-grid cached mask allocation should not be used for rescue candidate ranking'),
        ), patch(
            'server._violates_same_tier_spacing',
            return_value=False,
        ):
            covered_mask, current_min_d, rescue_count, rescue_penalty_total = _run_standard_rescue_pass(
                scope_grid,
                covered_mask=np.zeros(3, dtype=bool),
                current_min_d=np.full(3, np.inf, dtype=np.float64),
                fixed_sites=[],
                new_sites=[],
                exception_sites=[],
                params=params,
                cached_context=cached_context,
            )

        np.testing.assert_array_equal(covered_mask, np.array([True, True, False], dtype=bool))
        np.testing.assert_allclose(current_min_d[:2], np.array([0.1, 0.2], dtype=np.float64))
        self.assertTrue(np.isinf(current_min_d[2]))
        self.assertEqual(rescue_count, 1)
        self.assertEqual(rescue_penalty_total, 0.0)

    def test_standard_frontier_uses_sparse_cached_hits_without_full_array_allocation(self):
        scope_grid = pd.DataFrame(
            {
                'cell_lat': [12.0, 12.1, 12.2],
                'cell_lon': [77.0, 77.1, 77.2],
                'avg_cust_lat': [12.0, 12.1, 12.2],
                'avg_cust_lon': [77.0, 77.1, 77.2],
                'orders_per_day': [50.0, 40.0, 10.0],
            }
        )
        cached_context = {
            'demand_count': 3,
            'coord_to_site_idx': {
                _rounded_site_key(12.0, 77.0): 0,
            },
            'candidate_sites': [{'lat': 12.0, 'lon': 77.0}],
            'graph_edge_lists': [],
            'site_to_demand_cache': {},
            'site_reverse_index': {
                'offsets': np.array([0, 3], dtype=np.int64),
                'demand_indices': np.array([0, 1, 2], dtype=np.int32),
                'distances': np.array([0.1, 0.2, 9.5], dtype=np.float32),
            },
        }
        params = {
            'standard_ds_radius': 3.0,
            'standard_rescue_open_penalty_per_day': 0.0,
            'standard_variable_rate': 9.0,
            'standard_cost_frontier_seed_top_k': 1,
            'standard_cost_frontier_min_daily_gain': 0.0,
        }

        with patch(
            'server._distance_mask_from_cached_seed',
            side_effect=AssertionError('full-grid cached mask allocation should not be used for frontier ranking'),
        ), patch(
            'server._distance_array_from_cached_seed',
            side_effect=AssertionError('full-grid cached distance allocation should not be used for frontier ranking'),
        ), patch(
            'server._violates_same_tier_spacing',
            return_value=False,
        ):
            updated_min_d, added_count, added_daily_gain = _run_standard_cost_frontier_pass(
                scope_grid,
                fixed_sites=[],
                new_sites=[],
                current_actual_min_d=np.array([5.0, 5.0, 5.0], dtype=np.float64),
                params=params,
                max_total_hubs=1,
                cached_context=cached_context,
            )

        np.testing.assert_allclose(updated_min_d, np.array([0.1, 0.2, 5.0], dtype=np.float64))
        self.assertEqual(added_count, 1)
        self.assertGreater(added_daily_gain, 0.0)

    def test_find_standard_ds_uses_sparse_cached_hits_without_full_mask_allocation(self):
        scope_grid = pd.DataFrame(
            {
                'cell_lat': [12.0, 12.1, 12.2],
                'cell_lon': [77.0, 77.1, 77.2],
                'orders_per_day': [50.0, 40.0, 10.0],
            }
        )
        cached_context = {
            'demand_count': 3,
            'coord_to_site_idx': {
                _rounded_site_key(12.0, 77.0): 0,
            },
            'candidate_sites': [{'lat': 12.0, 'lon': 77.0}],
            'graph_edge_lists': [],
            'site_to_demand_cache': {},
            'site_reverse_index': {
                'offsets': np.array([0, 3], dtype=np.int64),
                'demand_indices': np.array([0, 1, 2], dtype=np.int32),
                'distances': np.array([0.1, 0.2, 9.5], dtype=np.float32),
            },
        }
        params = {
            '_cached_demand_candidate_context': cached_context,
            'standard_ds_radius': 3.0,
            'standard_ds_min_orders_per_day': 10.0,
            'standard_ds_max_orders_per_day': 100.0,
            'standard_ds_max': 1,
        }

        with patch(
            'server._distance_mask_from_cached_seed',
            side_effect=AssertionError('full-grid cached mask allocation should not be used for base Standard clustering'),
        ), patch(
            'server._violates_same_tier_spacing',
            return_value=False,
        ):
            std_list, remaining = find_standard_ds(scope_grid, params)

        self.assertEqual(len(std_list), 1)
        self.assertEqual(std_list[0]['cells'], 2)
        self.assertAlmostEqual(std_list[0]['orders_per_day'], 90.0)
        self.assertEqual(len(remaining), 1)

    def test_radius_override_recommendations_use_sparse_cached_subset_hits(self):
        scope_grid = pd.DataFrame(
            {
                'cell_lat': [12.0, 12.1, 12.2],
                'cell_lon': [77.0, 77.1, 77.2],
            }
        )
        cached_context = {
            'demand_count': 3,
            'coord_to_site_idx': {
                _rounded_site_key(12.0, 77.0): 0,
            },
            'candidate_sites': [{'lat': 12.0, 'lon': 77.0}],
            'graph_edge_lists': [],
            'site_to_demand_cache': {},
            'site_reverse_index': {
                'offsets': np.array([0, 3], dtype=np.int64),
                'demand_indices': np.array([0, 1, 2], dtype=np.int32),
                'distances': np.array([0.1, 0.2, 9.5], dtype=np.float32),
            },
        }
        params = {
            '_cached_demand_candidate_context': cached_context,
            'radius_override_candidate_tiers': ['standard'],
            'meeting_fast_mode': False,
            'standard_base_cost': 29.0,
            'standard_variable_rate': 9.0,
            'standard_ds_radius': 3.0,
            'standard_override_max_radius_km': 4.0,
            'radius_override_step_km': 1.0,
        }

        with patch(
            'server._distance_array_from_cached_seed',
            side_effect=AssertionError('full-grid cached distance allocation should not be used for override scoring'),
        ):
            result = _build_radius_override_recommendations(
                scope_grid,
                weights=np.array([50.0, 40.0, 10.0], dtype=np.float64),
                proposed_costs=np.array([50.0, 50.0, 50.0], dtype=np.float64),
                served_mask=np.array([False, False, True], dtype=bool),
                params=params,
                mini_hubs=[],
                standard_hubs=[{'id': 'STD-1', 'lat': 12.0, 'lon': 77.0, 'radius_km': 3.0}],
                super_hubs=[],
            )

        self.assertEqual(len(result['recommendations']), 1)
        self.assertEqual(result['recommendations'][0]['hub_id'], 'STD-1')

    def test_gap_fill_center_snap_prefers_cache_backed_member(self):
        cached_context = {
            'coord_to_site_idx': {
                _rounded_site_key(12.0, 77.0): 0,
                _rounded_site_key(12.2, 77.2): 1,
            }
        }

        center_lat, center_lon = _snap_gap_fill_center_to_cached_member(
            cached_context,
            member_idx=np.array([0, 1, 2], dtype=np.int64),
            clat=np.array([12.0, 12.11, 12.2], dtype=np.float64),
            clon=np.array([77.0, 77.11, 77.2], dtype=np.float64),
            target_lat=12.11,
            target_lon=77.11,
            fallback_idx=0,
        )

        self.assertEqual((center_lat, center_lon), (12.2, 77.2))

    def test_prune_redundant_standard_sites_uses_cached_exception_masks(self):
        scope_grid = pd.DataFrame(
            {
                'cell_lat': [12.0, 12.1, 12.2],
                'cell_lon': [77.0, 77.1, 77.2],
                'avg_cust_lat': [12.0, 12.1, 12.2],
                'avg_cust_lon': [77.0, 77.1, 77.2],
                'orders_per_day': [40.0, 35.0, 25.0],
            }
        )
        new_context = {
            'demand_count': 3,
            'coord_to_site_idx': {
                _rounded_site_key(12.0, 77.0): 0,
            },
            'site_reverse_index': {
                'offsets': np.array([0, 3], dtype=np.int64),
                'demand_indices': np.array([0, 1, 2], dtype=np.int32),
                'distances': np.array([0.1, 0.2, 0.3], dtype=np.float32),
            },
        }
        fixed_context = {
            'demand_count': 3,
            'coord_to_site_idx': {
                _rounded_site_key(12.1, 77.1): 0,
            },
            'site_reverse_index': {
                'offsets': np.array([0, 3], dtype=np.int64),
                'demand_indices': np.array([0, 1, 2], dtype=np.int32),
                'distances': np.array([0.2, 0.1, 0.4], dtype=np.float32),
            },
        }

        with patch(
            'server.osrm_one_to_many',
            side_effect=AssertionError('prune should use cached site masks, not full-grid OSRM'),
        ):
            pruned_new_sites, final_covered, removed = _prune_redundant_standard_sites(
                scope_grid,
                fixed_sites=[{'id': 'FIXED-1', 'lat': 12.1, 'lon': 77.1, 'radius_km': 3.0, 'fixed_open': True}],
                new_sites=[{'id': 'NEW-1', 'lat': 12.0, 'lon': 77.0, 'radius_km': 3.0}],
                exception_sites=[{'id': 'FIXED-EXC-1', 'lat': 12.1, 'lon': 77.1, 'radius_km': 5.0, 'exception_standard': True}],
                params={
                    'standard_ds_radius': 3.0,
                    'standard_exception_radius_km': 5.0,
                    'business_target_coverage_pct': 99.75,
                },
                cached_context=new_context,
                fixed_context=fixed_context,
            )

        self.assertEqual(len(pruned_new_sites), 0)
        np.testing.assert_array_equal(final_covered, np.array([True, True, True], dtype=bool))
        self.assertEqual(removed['removed_total'], 1)

    def test_finalize_deferred_packet_populates_uncovered_analysis_layer(self):
        scope_grid = pd.DataFrame(
            {
                'cell_lat': [12.0],
                'cell_lon': [77.0],
                'avg_cust_lat': [12.0],
                'avg_cust_lon': [77.0],
                'orders_per_day': [100.0],
            }
        )
        branch_plan = {
            'all_sites': [{'id': 'FIXED-1', 'lat': 12.0, 'lon': 77.0, 'fixed_open': True}],
            'fixed_sites': [{'id': 'FIXED-1', 'lat': 12.0, 'lon': 77.0, 'fixed_open': True}],
            'new_sites': [],
            'covered_mask': np.array([False], dtype=bool),
            'min_distances_km': np.array([np.inf], dtype=np.float64),
            'actual_min_distances_km': np.array([np.inf], dtype=np.float64),
            'coverage_pct': 100.0,
            'uncovered_orders_per_day': 0.0,
            'infeasible_under_cap': False,
            'gap_fill_count': 0,
            'exception_sites': [],
            'exception_count': 0,
            'fixed_count': 1,
            'new_count': 0,
            'base_new_count': 0,
            'rescue_count': 0,
            'frontier_cost_refine_count': 0,
            'frontier_cost_refine_daily_gain': 0.0,
            'rescue_penalty_per_day_total': 0.0,
            'min_physical_standard_count_for_100': 1,
            'allowed_frontier_max_count': None,
            'within_compact_frontier': True,
            'branch_completion_mode': 'exact',
            'branch_stop_reason': '',
            'branch_budget_seconds': None,
            'branch_elapsed_seconds': 1.0,
            'branch_target_coverage_pct': 99.75,
            'branch_comparison_ready': True,
        }
        view = {
            'view_key': 'rescue_first_standard_100',
            'label': 'Rescue-first',
            'fixed_standard_count': 1,
            'base_new_standard_count': 0,
            'gap_fill_standard_count': 0,
            'rescue_standard_count': 0,
            'total_physical_standard_count': 1,
            'exception_override_count': 0,
            'mini_count': 0,
            'super_count': 0,
            'overlay_super_count': 0,
            'reused_super_on_standard_count': 0,
            'new_physical_super_count': 0,
            'total_unique_physical_store_count': 1,
            'proposed_hard_coverage_pct': 100.0,
            'proposed_avg_cost': 40.0,
            'proposed_avg_dist': 1.0,
            'current_avg_cost': 45.0,
            'current_avg_dist': 2.0,
            'daily_savings': 500.0,
            'monthly_savings': 15000.0,
            'metrics': {
                'current_avg_cost': 45.0,
                'current_avg_dist': 2.0,
                'current_policy_coverage_pct': 100.0,
                'proposed_avg_cost': 40.0,
                'proposed_avg_dist': 1.0,
                'proposed_hard_coverage_pct': 100.0,
                'proposed_hybrid_coverage_pct': 100.0,
            },
            'planning_layers': {
                'standard': {
                    'fixed_open_stores': [{'id': 'FIXED-1', 'lat': 12.0, 'lon': 77.0, 'fixed_open': True}],
                    'exception_hub_count': 0,
                }
            },
            'mini_overlay_summary': {'site_count': 0},
        }
        eval_payload = {
            'combined_metrics': dict(view['metrics']),
            'combined_debug': {
                'weights': np.array([100.0], dtype=np.float64),
                'current_costs': np.array([45.0], dtype=np.float64),
                'current_avg_cost': 45.0,
                'current_avg_dist': 2.0,
                'current_policy': {
                    'current_operational_coverage_pct': 100.0,
                    'current_policy_coverage_pct': 100.0,
                    'policy_breach_orders_per_day': 0.0,
                    'policy_breach_hubs': 0,
                },
                'hard_served_mask': np.array([False], dtype=bool),
                'exception_bucket_usage': {
                    'selected_mask': np.array([False], dtype=bool),
                    'hybrid_covered_orders_per_day': 0.0,
                },
                'd_mini': np.array([np.inf], dtype=np.float64),
                'd_std': np.array([np.inf], dtype=np.float64),
                'd_std_exception': np.array([np.inf], dtype=np.float64),
                'd_sup': np.array([np.inf], dtype=np.float64),
                'proposed_dists': np.array([np.nan], dtype=np.float64),
                'proposed_costs': np.array([45.0], dtype=np.float64),
            },
            'standard_only_metrics': dict(view['metrics']),
            'mini_summary': {
                'site_count': 0,
                'orders_shifted_from_standard_per_day': 0.0,
                'avg_cost_reduction_per_order': 0.0,
                'daily_cost_reduction': 0.0,
            },
        }
        core_ctx = {
            'params': {
                'meeting_fast_mode': False,
                'standard_ds_radius': 3.0,
                'standard_exception_radius_km': 5.0,
                'super_ds_radius': 5.5,
                'business_target_coverage_pct': 99.75,
                'mini_ds_radius': 1.0,
                'uncovered_pocket_radius_km': 3.0,
            },
            'in_scope_grid': scope_grid,
            'business_regions': [],
            'excluded_islands': [],
            'scope_summary': {'in_scope_orders_per_day': 100.0, 'out_of_scope_orders_per_day': 0.0},
            'scenario_views': {
                'rescue_first_standard_100': dict(view),
                'exception_first_standard_100': dict(view, view_key='exception_first_standard_100', label='Exception-first'),
            },
            'active_view_key': 'rescue_first_standard_100',
            'active_standard_only_key': 'rescue_first_standard_100',
            'strict_base_plan': dict(branch_plan),
            'rescue_first_plan': dict(branch_plan),
            'exception_first_plan': dict(branch_plan),
            'baseline_stores': [],
            'standard_eval_params': {},
            'candidate_universe_label': 'test-candidates',
            'active_branch_plan': dict(branch_plan),
            'active_view': dict(view),
        }

        with patch('server._plan_mini_overlay', return_value=[]), patch(
            'server._plan_super_blanket',
            return_value={'sites': [], 'site_count': 0, 'overlay_super_count': 0, 'blanket_coverage_pct': 0.0},
        ), patch(
            'server._evaluate_meeting_standard_branch',
            return_value=eval_payload,
        ), patch(
            'server._group_uncovered_pockets',
            return_value=[{'lat': 12.0, 'lon': 77.0, 'orders_per_day': 100.0, 'num_cells': 1, 'cell_indices': [0]}],
        ), patch(
            'server._build_service_gap_polygons',
            return_value=[{'id': 'gap-1'}],
        ), patch(
            'server._build_uncovered_analysis',
            return_value={'summary': {'pocket_count': 1}, 'recommendations': [], 'service_gap_polygons': [{'id': 'gap-1'}]},
        ):
            result = _finalize_bangalore_multilayer_result_from_core(core_ctx)

        self.assertIn('uncovered_analysis', result['analysis'])
        self.assertIn('uncovered_analysis', result['planning_layers'])
        self.assertEqual(result['analysis']['uncovered_analysis']['summary']['pocket_count'], 1)
        self.assertEqual(result['planning_layers']['uncovered_analysis']['summary']['pocket_count'], 1)
        self.assertEqual(result['deferred_layer_status']['uncovered_analysis'], 'computed')


if __name__ == '__main__':
    unittest.main()
