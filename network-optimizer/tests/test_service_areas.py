import unittest
import copy
from unittest.mock import patch

import numpy as np
import pandas as pd

from server import (
    state,
    _assign_service_area_tiers,
    _build_service_area_polygons_from_assignments,
    _service_area_payload_for_result,
)


class ServiceAreaTests(unittest.TestCase):
    def test_assign_service_area_tiers_respects_priority_order(self):
        result = _assign_service_area_tiers(
            4,
            {
                'mini': [
                    {
                        'site_id': 'MINI-1',
                        'radius_km': 1.5,
                        'distance_km': np.array([1.2, np.inf, np.inf, np.inf], dtype=np.float64),
                    },
                ],
                'standard': [
                    {
                        'site_id': 'STD-1',
                        'radius_km': 3.0,
                        'distance_km': np.array([0.9, 2.1, np.inf, np.inf], dtype=np.float64),
                    },
                ],
                'super': [
                    {
                        'site_id': 'SUPER-1',
                        'radius_km': 5.5,
                        'distance_km': np.array([2.5, 3.4, 4.2, np.inf], dtype=np.float64),
                    },
                ],
            },
        )

        self.assertEqual(result['assigned_tier'].tolist(), ['mini', 'standard', 'super', 'unserved'])
        self.assertEqual(result['assigned_site_id'].tolist(), ['MINI-1', 'STD-1', 'SUPER-1', None])

    def test_build_service_area_polygons_from_assignments_builds_tier_summaries(self):
        grid = pd.DataFrame(
            {
                'cell_lat': [12.000, 12.000, 12.002, 12.004],
                'cell_lon': [77.000, 77.002, 77.000, 77.006],
                'orders_per_day': [10.0, 20.0, 15.0, 8.0],
            }
        )
        assigned_tier = np.array(['standard', 'standard', 'standard', 'mini'], dtype=object)
        assigned_site_id = np.array(['STD-1', 'STD-1', 'STD-1', 'MINI-1'], dtype=object)

        payload = _build_service_area_polygons_from_assignments(grid, assigned_tier, assigned_site_id)

        self.assertEqual(payload['summary']['standard']['num_cells'], 3)
        self.assertEqual(payload['summary']['standard']['orders_per_day'], 45.0)
        self.assertEqual(payload['summary']['mini']['num_cells'], 1)
        self.assertEqual(payload['summary']['mini']['orders_per_day'], 8.0)
        self.assertEqual(len(payload['features']), 2)
        self.assertEqual(sorted(feature['tier'] for feature in payload['features']), ['mini', 'standard'])

    def test_build_service_area_polygons_batches_disconnected_components_by_tier(self):
        grid = pd.DataFrame(
            {
                'cell_lat': [12.000, 12.000, 12.010],
                'cell_lon': [77.000, 77.030, 77.010],
                'orders_per_day': [10.0, 20.0, 15.0],
            }
        )
        assigned_tier = np.array(['standard', 'standard', 'mini'], dtype=object)
        assigned_site_id = np.array(['STD-1', 'STD-2', 'MINI-1'], dtype=object)

        payload = _build_service_area_polygons_from_assignments(grid, assigned_tier, assigned_site_id)

        self.assertEqual(len(payload['features']), 2)
        standard_feature = next(feature for feature in payload['features'] if feature['tier'] == 'standard')
        self.assertEqual(standard_feature['num_cells'], 2)
        self.assertEqual(standard_feature['orders_per_day'], 30.0)
        self.assertEqual(standard_feature['site_ids'], ['STD-1', 'STD-2'])
        self.assertEqual(len(standard_feature['polygons']), 2)

    def test_service_area_payload_uses_site_distance_arrays_path(self):
        original_grid = state.grid_data
        state.grid_data = pd.DataFrame(
            {
                'cell_lat': [12.000, 12.002],
                'cell_lon': [77.000, 77.002],
                'avg_cust_lat': [12.000, 12.002],
                'avg_cust_lon': [77.000, 77.002],
                'orders_per_day': [12.0, 18.0],
            }
        )
        result_obj = {
            'params': {
                'mini_ds_radius': 1.5,
                'standard_ds_radius': 3.0,
                'super_ds_radius': 5.0,
                'exact_graph_max_radius_km': 6.0,
            },
            'existing_stores': [{'id': 'FIXED-1', 'lat': 12.000, 'lon': 77.000}],
            'standard_ds': [{'id': 'STD-1', 'lat': 12.000, 'lon': 77.000}],
            'mini_ds': [{'id': 'MINI-1', 'lat': 12.002, 'lon': 77.002}],
            'super_ds': [],
        }

        def fake_site_distances(scope_grid, sites, contexts, graph_max_radius, cache_label, progress_cb=None):
            self.assertEqual(len(scope_grid), 2)
            distances = {}
            for site in sites:
                site_id = site['id']
                if site_id == 'MINI-1':
                    distances[site_id] = np.array([np.inf, 0.4], dtype=np.float64)
                else:
                    distances[site_id] = np.array([0.5, 1.0], dtype=np.float64)
            return distances

        try:
            with patch('server._resolve_scope_grid_and_regions', return_value=(state.grid_data, None, None, None, {'in_scope_grid_cells': 2})), \
                 patch('server._get_all_demand_candidate_context', return_value=None), \
                 patch('server._get_fixed_site_context', return_value={'coord_to_site_idx': {}}), \
                 patch('server._service_area_site_distance_arrays', side_effect=fake_site_distances), \
                 patch('server._cached_min_distances_for_hubs', side_effect=AssertionError('legacy helper should not run')):
                payload = _service_area_payload_for_result(result_obj)
        finally:
            state.grid_data = original_grid

        self.assertTrue(payload['available'])
        self.assertEqual(payload['mode'], 'assigned_demand_cells')
        self.assertEqual(payload['summary']['mini']['num_cells'], 1)
        self.assertEqual(payload['summary']['standard']['num_cells'], 1)

    def test_service_area_payload_derives_assignments_without_cached_contexts(self):
        original_grid = state.grid_data
        state.grid_data = pd.DataFrame(
            {
                'cell_lat': [12.000, 12.002, 12.004],
                'cell_lon': [77.000, 77.002, 77.004],
                'avg_cust_lat': [12.000, 12.002, 12.004],
                'avg_cust_lon': [77.000, 77.002, 77.004],
                'orders_per_day': [12.0, 18.0, 25.0],
            }
        )
        result_obj = {
            'params': {
                'mini_ds_radius': 1.5,
                'standard_ds_radius': 3.0,
                'super_ds_radius': 5.0,
                'exact_graph_max_radius_km': 6.0,
                'reuse_tier_edge_cache': True,
            },
            'existing_stores': [{'id': 'FIXED-1', 'lat': 12.000, 'lon': 77.000}],
            'standard_ds': [{'id': 'STD-1', 'lat': 12.002, 'lon': 77.002}],
            'mini_ds': [{'id': 'MINI-1', 'lat': 12.004, 'lon': 77.004}],
            'super_ds': [],
        }
        def fake_site_distances(scope_grid, sites, contexts, graph_max_radius, cache_label, progress_cb=None):
            self.assertEqual(contexts, [])
            distances = {}
            for site in sites:
                if site['id'] == 'MINI-1':
                    distances['MINI-1'] = np.array([np.inf, np.inf, 0.4], dtype=np.float64)
                elif site['id'] == 'STD-1':
                    distances['STD-1'] = np.array([np.inf, 0.5, 1.1], dtype=np.float64)
                else:
                    distances['FIXED-1'] = np.array([0.3, 1.2, np.inf], dtype=np.float64)
            return distances

        try:
            with patch('server._resolve_scope_grid_and_regions', return_value=(state.grid_data, None, None, None, {'in_scope_grid_cells': 3})), \
                 patch('server._get_all_demand_candidate_context', return_value=None), \
                 patch('server._get_fixed_site_context', return_value=None), \
                 patch('server._service_area_site_distance_arrays', side_effect=fake_site_distances):
                payload = _service_area_payload_for_result(result_obj)
        finally:
            state.grid_data = original_grid

        self.assertTrue(payload['available'])
        self.assertEqual(payload['summary']['standard']['num_cells'], 2)
        self.assertEqual(payload['summary']['mini']['num_cells'], 1)

    def test_service_area_payload_returns_cached_payload_for_same_state(self):
        original_grid = state.grid_data
        original_cache = getattr(state, 'service_area_payload_cache', None)
        state.grid_data = pd.DataFrame(
            {
                'cell_lat': [12.000, 12.002],
                'cell_lon': [77.000, 77.002],
                'avg_cust_lat': [12.000, 12.002],
                'avg_cust_lon': [77.000, 77.002],
                'orders_per_day': [12.0, 18.0],
            }
        )
        state.service_area_payload_cache = {}
        result_obj = {
            'params': {
                'mini_ds_radius': 1.5,
                'standard_ds_radius': 3.0,
                'super_ds_radius': 5.0,
                'exact_graph_max_radius_km': 6.0,
            },
            'existing_stores': [{'id': 'FIXED-1', 'lat': 12.000, 'lon': 77.000}],
            'standard_ds': [],
            'mini_ds': [{'id': 'MINI-1', 'lat': 12.002, 'lon': 77.002}],
            'super_ds': [],
        }
        base_payload = {
            'available': True,
            'mode': 'assigned_demand_cells',
            'summary': {
                'mini': {'num_cells': 1, 'orders_per_day': 18.0, 'component_count': 1},
                'standard': {'num_cells': 1, 'orders_per_day': 12.0, 'component_count': 1},
                'super': {'num_cells': 0, 'orders_per_day': 0.0, 'component_count': 0},
            },
            'features': [],
        }

        try:
            with patch('server._resolve_scope_grid_and_regions', return_value=(state.grid_data, None, None, None, {'in_scope_grid_cells': 2})), \
                 patch('server._get_all_demand_candidate_context', return_value=None), \
                 patch('server._get_fixed_site_context', return_value={'coord_to_site_idx': {}}), \
                 patch('server._service_area_site_distance_arrays', return_value={}), \
                 patch('server._assign_service_area_tiers', return_value={'assigned_tier': np.array(['standard', 'mini'], dtype=object), 'assigned_site_id': np.array(['FIXED-1', 'MINI-1'], dtype=object)}), \
                 patch('server._build_service_area_polygons_from_assignments', return_value=copy.deepcopy(base_payload)) as builder_mock:
                first = _service_area_payload_for_result(result_obj)
                second = _service_area_payload_for_result(result_obj)
        finally:
            state.grid_data = original_grid
            state.service_area_payload_cache = original_cache

        self.assertEqual(builder_mock.call_count, 1)
        self.assertEqual(first['summary']['mini']['num_cells'], 1)
        self.assertEqual(second['summary']['standard']['num_cells'], 1)


if __name__ == '__main__':
    unittest.main()
