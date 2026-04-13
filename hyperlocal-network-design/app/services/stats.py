"""
Statistical computations over distance results.

Separated from the routes so we can call them from background tasks,
tests, or any other context without needing Flask request context.
"""

from collections import defaultdict
from typing import Any, Dict, List

import numpy as np
import pandas as pd


def calculate_stats(results: List[Dict]) -> Dict[str, Any]:
    """Aggregate statistics from a list of distance result dicts."""
    empty = _empty_stats(len(results) if results else 0)
    if not results:
        return empty

    distances = [
        r["distance_km"]
        for r in results
        if r.get("distance_km") is not None and r["distance_km"] == r["distance_km"]
    ]
    if not distances:
        return empty

    distances.sort()
    arr = np.array(distances)

    hist_bins = {
        "0-1 km": int(np.sum((arr >= 0) & (arr < 1))),
        "1-2 km": int(np.sum((arr >= 1) & (arr < 2))),
        "2-3 km": int(np.sum((arr >= 2) & (arr < 3))),
        "3-4 km": int(np.sum((arr >= 3) & (arr < 4))),
        "4-5 km": int(np.sum((arr >= 4) & (arr < 5))),
        "5+ km": int(np.sum(arr >= 5)),
    }

    return {
        "total": len(results),
        "total_orders": len(results),
        "successful": len(distances),
        "successful_count": len(distances),
        "failed": len(results) - len(distances),
        "failed_count": len(results) - len(distances),
        "avg": round(float(np.mean(arr)), 3),
        "avg_distance": round(float(np.mean(arr)), 3),
        "median": round(float(np.median(arr)), 3),
        "median_distance": round(float(np.median(arr)), 3),
        "min": round(float(arr.min()), 3),
        "min_distance": round(float(arr.min()), 3),
        "max": round(float(arr.max()), 3),
        "max_distance": round(float(arr.max()), 3),
        "p25": round(float(np.percentile(arr, 25)), 3),
        "p75": round(float(np.percentile(arr, 75)), 3),
        "p90": round(float(np.percentile(arr, 90)), 3),
        "p95": round(float(np.percentile(arr, 95)), 3),
        "percentiles": {
            "min": round(float(arr.min()), 2),
            "p25": round(float(np.percentile(arr, 25)), 2),
            "median": round(float(np.median(arr)), 2),
            "p75": round(float(np.percentile(arr, 75)), 2),
            "p90": round(float(np.percentile(arr, 90)), 2),
            "p95": round(float(np.percentile(arr, 95)), 2),
            "max": round(float(arr.max()), 2),
        },
        "histogram_bins": hist_bins,
        "range_bins": dict(hist_bins),
    }


def calculate_store_stats(
    results: List[Dict],
    df: pd.DataFrame,
    mapping: Dict[str, str],
) -> Dict[str, Dict]:
    """Per-store aggregated metrics."""
    stores: Dict[str, Dict] = defaultdict(lambda: {"orders": 0, "distances": [], "lat": None, "lon": None})

    for r in results:
        sid = r.get("store_id")
        if sid:
            stores[sid]["orders"] += 1
            d = r.get("distance_km")
            if d is not None:
                stores[sid]["distances"].append(d)

    if mapping.get("store_id") and mapping.get("store_lat") and mapping.get("store_lon"):
        locs = df.drop_duplicates(subset=[mapping["store_id"]])
        for _, row in locs.iterrows():
            sid = row[mapping["store_id"]]
            if sid in stores:
                stores[sid]["lat"] = row[mapping["store_lat"]]
                stores[sid]["lon"] = row[mapping["store_lon"]]

    out: Dict[str, Dict] = {}
    for sid, data in stores.items():
        dists = sorted(data["distances"]) if data["distances"] else []
        base = {
            "id": sid,
            "store_id": sid,
            "orders": data["orders"],
            "order_count": data["orders"],
            "lat": float(data["lat"]) if data["lat"] is not None else None,
            "lon": float(data["lon"]) if data["lon"] is not None else None,
        }
        if dists:
            arr = np.array(dists)
            base.update({
                "avg_dist": round(float(np.mean(arr)), 3),
                "avg_distance": round(float(np.mean(arr)), 3),
                "median_dist": round(float(np.median(arr)), 3),
                "min_dist": round(float(arr.min()), 3),
                "max_dist": round(float(arr.max()), 3),
                "p90_dist": round(float(np.percentile(arr, 90)), 3),
            })
        else:
            base.update({k: 0 for k in ("avg_dist", "avg_distance", "median_dist", "min_dist", "max_dist", "p90_dist")})
        out[sid] = base

    return out


# ── private ──────────────────────────────────────────────────────────────

def _empty_stats(total: int) -> Dict[str, Any]:
    return {
        "total": total, "total_orders": total,
        "successful": 0, "successful_count": 0,
        "failed": total, "failed_count": total,
        "avg": 0, "avg_distance": 0,
        "median": 0, "median_distance": 0,
        "min": 0, "min_distance": 0,
        "max": 0, "max_distance": 0,
        "p25": 0, "p75": 0, "p90": 0, "p95": 0,
        "percentiles": {},
        "histogram_bins": {},
        "range_bins": {},
    }
