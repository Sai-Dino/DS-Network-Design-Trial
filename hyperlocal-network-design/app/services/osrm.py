"""
OSRM integration — connectivity checks and the core distance engine.

The ``calculate_distances`` function is decoupled from any storage
backend: it takes a DataFrame and mapping, returns results, and calls
``on_progress`` for live status updates.  This lets the same engine
run inside a thread (local dev) or a Celery worker (production).
"""

import logging
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Dict, List, Optional, Tuple

import pandas as pd
import requests

logger = logging.getLogger(__name__)


def test_osrm_connection(osrm_url: str) -> dict:
    """Return ``{ok: bool, message|error: str}``."""
    try:
        url = f"{osrm_url}/route/v1/driving/77.5946,12.9716;77.6000,12.9800?overview=false"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                dist = data["routes"][0]["distance"] if data.get("routes") else 0
                return {"ok": True, "message": f"OSRM reachable. Test route: {dist:.0f}m"}
        return {"ok": False, "error": f"OSRM returned status {resp.status_code}"}
    except requests.exceptions.ConnectionError:
        return {"ok": False, "error": f"Cannot connect to {osrm_url}. Is osrm-routed running?"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def calculate_distances(
    df: pd.DataFrame,
    mapping: Dict[str, str],
    osrm_url: str,
    on_progress: Optional[Callable[[int, int], None]] = None,
    on_checkpoint: Optional[Callable[[List[Dict], int], None]] = None,
    max_workers: int = 32,
    chunk_limit: int = 500,
    checkpoint_interval: int = 50,
) -> Tuple[List[Dict], int]:
    """
    Store-grouped Table API approach.

    For each store we send ONE request with the store as source-0 and all
    its orders as destinations.  OSRM returns a compact 1xN distance
    vector — zero wasted computation.

    Args:
        on_checkpoint: Called every ``checkpoint_interval`` completed API
            batches with ``(partial_results, processed_count)`` so the
            caller can persist progress to disk.
        checkpoint_interval: How many API batches between checkpoints.

    Returns ``(results_list, failed_count)``.
    Raises on fatal errors (OSRM unreachable, etc.).
    """
    check = test_osrm_connection(osrm_url)
    if not check["ok"]:
        raise ConnectionError(check["error"])

    rows = df.to_dict("records")
    total_rows = len(rows)
    store_col = mapping.get("store_id", "")
    slat_col = mapping.get("store_lat", "")
    slon_col = mapping.get("store_lon", "")
    olat_col = mapping.get("order_lat", "")
    olon_col = mapping.get("order_lon", "")

    store_groups: Dict[str, List[int]] = defaultdict(list)
    invalid_indices: List[int] = []
    for i, row in enumerate(rows):
        try:
            float(row.get(slat_col))
            float(row.get(slon_col))
            float(row.get(olat_col))
            float(row.get(olon_col))
            store_groups[str(row.get(store_col, "unknown"))].append(i)
        except (TypeError, ValueError):
            invalid_indices.append(i)

    tasks = []
    for _store_key, indices in store_groups.items():
        row0 = rows[indices[0]]
        store_coord = f"{float(row0[slon_col])},{float(row0[slat_col])}"
        for c in range(0, len(indices), chunk_limit):
            tasks.append((store_coord, indices[c : c + chunk_limit]))

    all_results = [None] * total_rows
    failed_count = [len(invalid_indices)]
    completed_count = [len(invalid_indices)]
    batches_done = [0]
    result_lock = threading.Lock()

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=max_workers,
        pool_maxsize=max_workers,
        max_retries=2,
    )
    session.mount("http://", adapter)

    logger.info(
        "OSRM calc: %d rows, %d stores, %d API requests (%d workers)",
        total_rows, len(store_groups), len(tasks), max_workers,
    )

    def _process_chunk(store_coord, chunk_indices):
        chunk_results: Dict[int, dict] = {}
        chunk_failed = 0

        order_coords, valid = [], []
        for idx in chunk_indices:
            row = rows[idx]
            try:
                olat = float(row.get(olat_col))
                olon = float(row.get(olon_col))
                order_coords.append(f"{olon},{olat}")
                valid.append(idx)
            except (TypeError, ValueError):
                chunk_failed += 1

        if not valid:
            return chunk_results, chunk_failed

        try:
            all_coords = store_coord + ";" + ";".join(order_coords)
            dests = ";".join(str(i) for i in range(1, len(valid) + 1))
            url = f"{osrm_url}/table/v1/driving/{all_coords}?sources=0&destinations={dests}&annotations=distance"

            data = session.get(url, timeout=60).json()

            if data.get("code") == "Ok" and data.get("distances"):
                dist_row = data["distances"][0]
                for j, idx in enumerate(valid):
                    dist_m = dist_row[j]
                    if dist_m is not None:
                        rr = rows[idx].copy()
                        rr["distance_m"] = dist_m
                        rr["distance_km"] = dist_m / 1000.0
                        if store_col:
                            rr["store_id"] = str(rr.get(store_col, ""))
                        oid_col = mapping.get("order_id", "")
                        if oid_col:
                            rr["order_id"] = str(rr.get(oid_col, ""))
                        chunk_results[idx] = rr
                    else:
                        chunk_failed += 1
            else:
                chunk_failed += len(valid)
        except Exception as exc:
            logger.debug("Store chunk failed (%d orders): %s", len(valid), exc)
            chunk_failed += len(valid)

        return chunk_results, chunk_failed

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_process_chunk, sc, ci): ci for sc, ci in tasks}
        for future in as_completed(futures):
            cr, cf = future.result()
            with result_lock:
                for idx, res in cr.items():
                    all_results[idx] = res
                failed_count[0] += cf
                completed_count[0] += len(cr) + cf
                batches_done[0] += 1
                if on_progress:
                    on_progress(completed_count[0], failed_count[0])
                if on_checkpoint and batches_done[0] % checkpoint_interval == 0:
                    partial = [r for r in all_results if r is not None]
                    on_checkpoint(partial, completed_count[0])

    final = [r for r in all_results if r is not None]
    logger.info("OSRM calc complete: %d ok, %d failed", len(final), failed_count[0])
    return final, failed_count[0]
