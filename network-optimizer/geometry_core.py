"""Point-in-polygon and GeoJSON helpers for Super core / island exclusions."""
import json
import logging

logger = logging.getLogger(__name__)


def point_in_ring(lon, lat, ring):
    """Ray casting; ring is list of [lon, lat] closing ring."""
    if len(ring) < 3:
        return False
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-15) + xi
        ):
            inside = not inside
        j = i
    return inside


def point_in_polygon(lon, lat, coords):
    """coords: GeoJSON Polygon coordinates — first ring exterior, holes optional."""
    if not coords:
        return False
    exterior = coords[0]
    if not point_in_ring(lon, lat, exterior):
        return False
    for hole in coords[1:]:
        if point_in_ring(lon, lat, hole):
            return False
    return True


def point_in_multipolygon(lon, lat, coordinates):
    """MultiPolygon coordinates: list of polygon coordinate arrays."""
    for poly in coordinates:
        if point_in_polygon(lon, lat, poly):
            return True
    return False


def _extract_polygons_from_geojson(obj):
    """Return list of polygon coordinate arrays (each polygon may have holes)."""
    polys = []
    if obj is None:
        return polys
    t = obj.get('type')
    if t == 'FeatureCollection':
        for feat in obj.get('features', []):
            polys.extend(_extract_polygons_from_geojson(feat))
        return polys
    if t == 'Feature':
        return _extract_polygons_from_geojson(obj.get('geometry'))
    if t == 'Polygon':
        return [obj.get('coordinates', [])]
    if t == 'MultiPolygon':
        return list(obj.get('coordinates', []))
    return polys


def parse_geojson_string(s):
    if not s or not str(s).strip():
        return None
    try:
        return json.loads(s)
    except json.JSONDecodeError as e:
        logger.warning(f"Invalid GeoJSON: {e}")
        return None


def polygons_from_geojson(obj):
    """Flatten GeoJSON to a list of Polygon coordinate arrays."""
    if obj is None:
        return []
    geoms = _extract_polygons_from_geojson(obj)
    out = []
    for g in geoms:
        if isinstance(g, list) and len(g) > 0:
            out.append(g)
    return out


def cell_needs_super_core_coverage(lat, lon, core_polys, exclude_polys):
    """True if cell center is inside core polygon(s) and not inside any exclusion polygon."""
    lon_pt, lat_pt = float(lon), float(lat)
    for poly_coords in exclude_polys:
        if poly_coords and point_in_polygon(lon_pt, lat_pt, poly_coords):
            return False
    if not core_polys:
        return False
    for poly_coords in core_polys:
        if poly_coords and point_in_polygon(lon_pt, lat_pt, poly_coords):
            return True
    return False
