"""Auto-detection of column names in uploaded datasets."""

from typing import Dict, Optional
import pandas as pd

_PATTERNS = {
    "store_lat": ["store_lat", "lat_store", "store latitude", "lat store", "origin_lat"],
    "store_lon": ["store_lon", "lon_store", "store longitude", "long store", "origin_lon"],
    "order_lat": ["order_lat", "lat_order", "order latitude", "lat order", "destination_lat"],
    "order_lon": ["order_lon", "lon_order", "order longitude", "long order", "destination_lon"],
    "order_id": ["order_id", "order number", "order id"],
    "store_id": ["store_id", "hub_code", "dark store", "store_code"],
    "date": ["date", "order_date", "delivery_date", "created_date"],
}

_DISTANCE_NAMES = {
    "road_distance_km", "road_distance", "distance_km", "distance",
    "road_dist", "road_dist_km", "osrm_distance", "osrm_distance_km",
    "shortest_distance", "shortest_road_distance", "dist_km", "dist",
}


def get_column_mapping(df: pd.DataFrame) -> Dict[str, str]:
    """Return ``{mapped_name: actual_column}`` by fuzzy-matching header names."""
    lower_map = {col.lower(): col for col in df.columns}
    mapping: Dict[str, str] = {}
    for key, candidates in _PATTERNS.items():
        for pat in candidates:
            if pat in lower_map:
                mapping[key] = lower_map[pat]
                break
    return mapping


def detect_distance_column(df: pd.DataFrame) -> Optional[str]:
    """Return the name of a pre-calculated distance column, if one exists."""
    for col in df.columns:
        normalised = col.lower().replace(" ", "_").replace("(", "").replace(")", "")
        if normalised in _DISTANCE_NAMES:
            return col
    return None
