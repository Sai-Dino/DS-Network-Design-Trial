import os
import sys
import unittest


ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from bangalore_solver.candidates import generate_candidate_sites
from bangalore_solver.config import BangaloreSolverConfig
from bangalore_solver.contracts import DemandCluster, SolverSite


class BangaloreSolverCandidateTests(unittest.TestCase):
    def test_generate_candidate_sites_is_deterministic_and_capped(self):
        config = BangaloreSolverConfig(
            demand_seed_candidate_limit=3,
            gap_fill_candidate_limit=2,
            candidate_spacing_km=2.0,
        )
        fixed_sites = [
            SolverSite(
                site_id="fixed-1",
                lat=12.9000,
                lon=77.6000,
                fixed=True,
                source="fixed_store",
            )
        ]
        demand_clusters = [
            DemandCluster("c-1", 12.9300, 77.6300, 900.0, 5),
            DemandCluster("c-2", 12.9600, 77.6600, 850.0, 4),
            DemandCluster("c-3", 12.9900, 77.6900, 800.0, 4),
            DemandCluster("c-4", 13.0200, 77.7200, 700.0, 3),
            DemandCluster("c-5", 13.0500, 77.7500, 650.0, 3),
            DemandCluster("c-6", 13.0800, 77.7800, 600.0, 3),
        ]

        result_a = generate_candidate_sites(demand_clusters, fixed_sites, config)
        result_b = generate_candidate_sites(demand_clusters, fixed_sites, config)

        self.assertEqual(
            [site.site_id for site in result_a.sites],
            [site.site_id for site in result_b.sites],
        )
        self.assertLessEqual(len(result_a.sites), 5)
        self.assertEqual(result_a.summary["selected_by_source"]["demand_seed"], 3)
        self.assertEqual(result_a.summary["selected_by_source"]["gap_fill_seed"], 2)
        self.assertTrue(all(site.source in {"demand_seed", "gap_fill_seed"} for site in result_a.sites))


if __name__ == "__main__":
    unittest.main()
