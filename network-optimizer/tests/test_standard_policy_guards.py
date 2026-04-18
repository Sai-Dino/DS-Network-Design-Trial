import unittest

from server import (
    _business_region_edge_penalty,
    _meeting_super_count_semantics,
    _physical_store_count_summary,
    _violates_same_tier_spacing,
)


class StandardPolicyGuardTests(unittest.TestCase):
    def test_same_tier_spacing_uses_local_geodesic_rule(self):
        hubs = [{'id': 'EXISTING-1', 'lat': 12.8800, 'lon': 77.4400}]

        self.assertTrue(
            _violates_same_tier_spacing(12.8840, 77.4440, hubs, 3.0)
        )

    def test_business_region_edge_penalty_penalizes_boundary_hugging_more_than_interior(self):
        business_regions = [
            {
                'polygon_coords': [
                    [12.80, 77.50],
                    [12.80, 77.80],
                    [13.10, 77.80],
                    [13.10, 77.50],
                    [12.80, 77.50],
                ]
            }
        ]

        edge_penalty = _business_region_edge_penalty(12.805, 77.65, 3.0, business_regions)
        interior_penalty = _business_region_edge_penalty(12.95, 77.65, 3.0, business_regions)

        self.assertGreater(edge_penalty, interior_penalty)
        self.assertGreater(edge_penalty, 0.0)

    def test_physical_store_count_summary_dedupes_reused_super_on_standard_sites(self):
        counts = _physical_store_count_summary(
            fixed_standard_sites=[{'id': 'FIXED-1', 'lat': 12.90, 'lon': 77.60}],
            fixed_super_sites=[],
            mini_ds=[{'id': 'MINI-1', 'lat': 12.95, 'lon': 77.70, 'fixed_open': False}],
            standard_ds=[{'id': 'NEW-STD-1', 'lat': 12.96, 'lon': 77.71, 'fixed_open': False}],
            super_ds=[
                {'id': 'NEW-STD-1', 'lat': 12.96, 'lon': 77.71, 'fixed_open': False, 'site_source': 'proposed_standard'},
                {'id': 'SUPER-NEW-1', 'lat': 13.02, 'lon': 77.60, 'fixed_open': False, 'site_source': 'new_super'},
            ],
        )

        self.assertEqual(counts['new_super_count'], 1)
        self.assertEqual(counts['reused_super_on_standard_count'], 1)
        self.assertEqual(counts['total_physical_stores'], 4)

    def test_meeting_super_count_semantics_treats_promotions_as_reused(self):
        counts = _meeting_super_count_semantics(
            total_physical_standard_count=111,
            mini_sites=[],
            super_sites=[
                {'id': 'FIXED-SUPER-1', 'fixed_open': True, 'promoted_from_fixed': True},
                {'id': 'NEW-SUPER-1', 'site_source': 'new_super'},
            ],
        )

        self.assertEqual(counts['reused_super_on_standard_count'], 1)
        self.assertEqual(counts['new_physical_super_count'], 1)
        self.assertEqual(counts['total_unique_physical_store_count'], 112)


if __name__ == '__main__':
    unittest.main()
