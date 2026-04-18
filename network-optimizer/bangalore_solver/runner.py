from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from .candidates import generate_candidate_sites
from .config import BangaloreSolverConfig
from .contracts import SolverInputs
from .data import cluster_demand_cells, load_bangalore_data
from .model import solve_bangalore_solver_model


def run_bangalore_solver(
    config: Optional[BangaloreSolverConfig] = None,
    *,
    distance_lookup: Optional[Dict[tuple[str, str], float]] = None,
) -> Dict[str, Any]:
    config = config or BangaloreSolverConfig()
    loaded = load_bangalore_data(config)
    demand_clusters = cluster_demand_cells(
        loaded.in_scope_demand_cells,
        cluster_cell_size_km=float(config.cluster_cell_size_km),
    )
    candidate_result = generate_candidate_sites(demand_clusters, loaded.fixed_sites, config)
    inputs = SolverInputs(
        demand_clusters=tuple(demand_clusters),
        fixed_sites=tuple(loaded.fixed_sites),
        candidate_sites=tuple(candidate_result.sites),
        candidate_summary=dict(candidate_result.summary),
        demand_summary={
            **dict(loaded.demand_summary),
            "cluster_count": len(demand_clusters),
        },
        business_regions=tuple(loaded.business_regions),
        excluded_islands=tuple(loaded.excluded_islands),
    )
    result = solve_bangalore_solver_model(inputs, config, distance_lookup=distance_lookup)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    output_path = Path(config.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    history_path = Path(config.output_history_dir) / f"bangalore_solver_v1_{timestamp}.json"
    for path in (output_path, history_path):
        path.write_text(json.dumps(result, indent=2, allow_nan=False))
    result["artifact_paths"] = {
        "latest": str(output_path),
        "timestamped": str(history_path),
    }
    output_path.write_text(json.dumps(result, indent=2, allow_nan=False))
    return result
