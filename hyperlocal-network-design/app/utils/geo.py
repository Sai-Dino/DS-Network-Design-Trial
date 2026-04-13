"""Geographic utility functions."""

from math import radians, cos, sin, asin, sqrt
from typing import Optional


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> Optional[float]:
    """
    Great-circle distance between two points on Earth, in **kilometres**.

    Uses the Haversine formula — accurate for any two points on the globe,
    though it assumes a perfect sphere (error < 0.3 %).
    """
    try:
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        return 6371 * 2 * asin(sqrt(a))
    except (TypeError, ValueError):
        return None
