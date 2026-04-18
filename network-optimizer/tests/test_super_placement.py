import unittest

import numpy as np

from server import _select_super_blanket_candidates


class SuperPlacementTests(unittest.TestCase):
    def test_select_super_candidates_penalizes_standard_overlap(self):
        candidates = [
            {'id': 'center', 'edge_penalty': 0.0},
            {'id': 'tail', 'edge_penalty': 0.0},
        ]
        coverage_masks = [
            np.array([True, True, True, False, False], dtype=bool),
            np.array([False, False, False, True, True], dtype=bool),
        ]
        weights = np.array([100.0, 100.0, 100.0, 60.0, 60.0], dtype=np.float64)
        standard_served_mask = np.array([True, True, True, False, False], dtype=bool)

        selected = _select_super_blanket_candidates(
            candidates,
            coverage_masks,
            weights,
            standard_served_mask,
            max_sites=1,
            spacing_conflicts={},
            overlap_penalty_weight=0.35,
            standard_overlap_penalty_weight=0.85,
            edge_penalty_weight=0.0,
        )

        self.assertEqual([item['id'] for item in selected], ['tail'])

    def test_select_super_candidates_respects_spacing_conflicts(self):
        candidates = [
            {'id': 'cluster-a-1', 'edge_penalty': 0.0},
            {'id': 'cluster-a-2', 'edge_penalty': 0.0},
            {'id': 'cluster-b', 'edge_penalty': 0.0},
        ]
        coverage_masks = [
            np.array([True, True, True, False, False, False, False], dtype=bool),
            np.array([False, False, True, True, False, False, True], dtype=bool),
            np.array([False, False, False, False, True, True, False], dtype=bool),
        ]
        weights = np.array([100.0, 100.0, 100.0, 100.0, 80.0, 80.0, 100.0], dtype=np.float64)

        selected = _select_super_blanket_candidates(
            candidates,
            coverage_masks,
            weights,
            np.zeros(len(weights), dtype=bool),
            max_sites=2,
            spacing_conflicts={0: {1}, 1: {0}},
            overlap_penalty_weight=0.35,
            standard_overlap_penalty_weight=0.85,
            edge_penalty_weight=0.0,
        )

        self.assertEqual(len(selected), 2)
        self.assertEqual(selected[1]['id'], 'cluster-b')
        self.assertIn(selected[0]['id'], {'cluster-a-1', 'cluster-a-2'})

    def test_select_super_candidates_applies_edge_penalty(self):
        candidates = [
            {'id': 'edge', 'edge_penalty': 0.8},
            {'id': 'interior', 'edge_penalty': 0.1},
        ]
        coverage_masks = [
            np.array([True, True, False], dtype=bool),
            np.array([False, True, True], dtype=bool),
        ]
        weights = np.array([70.0, 70.0, 60.0], dtype=np.float64)

        selected = _select_super_blanket_candidates(
            candidates,
            coverage_masks,
            weights,
            np.zeros(len(weights), dtype=bool),
            max_sites=1,
            spacing_conflicts={},
            overlap_penalty_weight=0.35,
            standard_overlap_penalty_weight=0.85,
            edge_penalty_weight=20.0,
        )

        self.assertEqual([item['id'] for item in selected], ['interior'])

    def test_select_super_candidates_prefers_reused_standard_over_new_super_in_same_pocket(self):
        candidates = [
            {
                'id': 'reuse-standard',
                'edge_penalty': 0.0,
                'site_source': 'proposed_standard',
                'cross_tier_penalty': 0.0,
                'reuse_bonus': 120.0,
            },
            {
                'id': 'new-super-pocket',
                'edge_penalty': 0.0,
                'site_source': 'new_super',
                'cross_tier_penalty': 150.0,
                'reuse_bonus': 0.0,
            },
        ]
        coverage_masks = [
            np.array([True, True, True, False], dtype=bool),
            np.array([True, True, True, False], dtype=bool),
        ]
        weights = np.array([120.0, 120.0, 120.0, 20.0], dtype=np.float64)

        selected = _select_super_blanket_candidates(
            candidates,
            coverage_masks,
            weights,
            np.array([True, True, True, False], dtype=bool),
            max_sites=1,
            spacing_conflicts={},
            overlap_penalty_weight=0.35,
            standard_overlap_penalty_weight=0.2,
            edge_penalty_weight=0.0,
            cross_tier_penalty_weight=1.0,
            reuse_bonus_weight=1.0,
        )

        self.assertEqual([item['id'] for item in selected], ['reuse-standard'])


if __name__ == '__main__':
    unittest.main()
