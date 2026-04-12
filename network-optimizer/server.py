#!/usr/bin/env python3
"""
Flipkart 3-Tier Dark Store Network Optimizer v2
================================================
- File upload via UI (CSV for orders, XLSX for stores)
- Parallel OSRM Table API calls via ThreadPoolExecutor

Three tiers on the **full grid** (overlapping placement): each tier has its own radius and min/max orders/day. Standard/Super may share coordinates.
- Mini DS — ~4k SKUs, UHD clusters; cost e.g. cycle (20+6×d), configurable
- Standard DS — ~15k SKUs; bike cost (29+9×d)
- Super DS — ~30k SKUs; optional GeoJSON **core** must-cover (islands excluded)

Proposed last-mile cost uses **tier-specific** base + rate for the assigned tier per order.

**All** road distances (placement radii, coverage checks, metrics) use the OSRM Table API only — no straight-line fallbacks.

- Cost function: Cost = base_cost + variable_rate * distance (current network); tiered bases for proposed
- Existing network overlay & comparison

Usage:
    python3 server.py
    Open: http://localhost:5050
"""

import os
import copy
import io
import re
import json
import time
import math
import cgi
import pickle
import hashlib
import logging
import tempfile
import threading
import random
import shutil
import traceback
import urllib.request
import urllib.error
import mimetypes
from collections import defaultdict
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
import pandas as pd
import openpyxl
import urllib3
import scipy.sparse as sp
from scipy.optimize import Bounds, LinearConstraint, milp
from scipy.spatial import cKDTree
try:
    import highspy
except Exception:
    highspy = None

from geometry_core import (
    parse_geojson_string,
    polygons_from_geojson,
    cell_needs_super_core_coverage,
    point_in_polygon,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIG
# ============================================================================
def _resolve_default_osrm_url():
    env_url = (os.environ.get('OSRM_URL') or '').strip()
    if env_url:
        return env_url
    candidates = (
        'http://127.0.0.1:5001',
        'http://localhost:5001',
        'http://127.0.0.1:5000',
        'http://localhost:5000',
    )
    for candidate in candidates:
        try:
            with urllib.request.urlopen(
                f"{candidate}/route/v1/driving/77.5946,12.9716;77.6,12.97?overview=false",
                timeout=0.5,
            ) as resp:
                if getattr(resp, 'status', 200) < 500:
                    return candidate
        except Exception:
            continue
    return 'http://localhost:5000'


OSRM_BASE_URL = _resolve_default_osrm_url()
SERVER_PORT = int(os.environ.get('OPTIMIZER_PORT', 5050))
MAX_UPLOAD_MB = 3000  # Support up to 3GB files
# Concurrent OSRM Table HTTP requests (I/O bound). Tune with OSRM_WORKERS=32 etc. Match or stay
# below your osrm-routed thread capacity so requests queue instead of timing out.
OSRM_WORKERS = max(1, int(os.environ.get('OSRM_WORKERS', '16')))
OSRM_BATCH_SIZE = int(os.environ.get('OSRM_BATCH_SIZE', '100'))  # coords per OSRM table call (OSRM default max ~100)
OSRM_TIMEOUT = 30
EXACT_GRAPH_BATCH_PARALLELISM = max(
    1,
    int(os.environ.get('EXACT_GRAPH_BATCH_PARALLELISM', str(max(1, min(4, OSRM_WORKERS // 2 or 1))))),
)

# ── Connection pool: reuse TCP connections across all OSRM calls ──────────
_osrm_pool = urllib3.PoolManager(
    num_pools=8,
    maxsize=max(32, OSRM_WORKERS * 4),        # absorb bursty table fans without discarding hot connections
    retries=urllib3.Retry(total=3, backoff_factor=0.3),
    timeout=urllib3.Timeout(connect=5.0, read=float(OSRM_TIMEOUT)),
)
_osrm_executor = ThreadPoolExecutor(max_workers=OSRM_WORKERS)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.dirname(BASE_DIR)
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
GRAPH_CACHE_DIR = os.path.join(BASE_DIR, 'cache')
os.makedirs(GRAPH_CACHE_DIR, exist_ok=True)
OPTIMIZATION_RESULTS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'optimization_results')
os.makedirs(OPTIMIZATION_RESULTS_DIR, exist_ok=True)
OLD_FIXED_STORE_OVERRIDE_CSV = os.path.join(WORKSPACE_DIR, 'Store details - 103 old stores.csv')


def _json_safe_value(value):
    if isinstance(value, dict):
        return {k: _json_safe_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe_value(v) for v in value]
    if isinstance(value, np.generic):
        return _json_safe_value(value.item())
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    return value

# ============================================================================
# APPLICATION STATE
# ============================================================================
class AppState:
    def __init__(self):
        self.reset()

    def reset(self):
        self.order_df = None
        self.grid_data = None
        self.existing_stores = []
        self.store_regions = []
        self.business_regions = []
        self.excluded_islands = []
        self.in_scope_grid = None
        self.out_of_scope_grid = None
        self.scope_summary = None
        self.city_bounds = None
        self.total_orders = 0
        self.orders_per_day = 0
        self.unique_dates = 1
        self.demand_input_mode = 'unknown'
        self.live_store_detection_mode = 'unknown'
        self.fixed_store_source_mode = 'unknown'
        self.osrm_available = False
        self.data_loaded = False
        self.load_progress = ''
        self.optimization_result = None
        self.optimization_running = False
        self.optimization_deferred_running = False
        self.optimization_progress = ''
        self.optimization_run_id = None
        self.optimization_run_seq = 0
        self.local_load_result = None
        self.exact_benchmark_cache = {}
        self.site_edge_context_cache = {}
        self.fixed_store_override_cache = {}
        self.radius_override_recommendation_cache = {}
        self.meeting_prewarm_running = False
        self.meeting_prewarm_core_ready = False
        self.meeting_prewarm_ready = False
        self.meeting_prewarm_progress = ''
        self.meeting_prewarm_error = ''
        self.meeting_prewarm_started_at = None
        self.meeting_prewarm_completed_at = None

state = AppState()


def _next_optimization_run_id():
    state.optimization_run_seq = int(getattr(state, 'optimization_run_seq', 0) or 0) + 1
    return f"run-{state.optimization_run_seq}-{int(time.time() * 1000)}"


def _norm_header(value):
    return re.sub(r'[^a-z0-9]+', '', str(value or '').strip().lower())


def _find_col(columns, candidates):
    norm_map = {_norm_header(c): c for c in columns}
    for cand in candidates:
        hit = norm_map.get(_norm_header(cand))
        if hit is not None:
            return hit
    return None


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    text = str(value).strip().lower()
    return text in {'1', 'true', 't', 'yes', 'y', 'open', 'existing', 'fixed', 'live', 'active'}


def _rows_to_polygon_coords(group, lat_col, lon_col, edge_col=None):
    if not lat_col or not lon_col:
        return []
    coords = []
    for _, row in group.iterrows():
        if edge_col:
            edge_value = str(row.get(edge_col, '')).strip().lower()
            if edge_value in {'centroid', 'center', 'centre'}:
                continue
        try:
            lat = float(row[lat_col])
            lon = float(row[lon_col])
        except (TypeError, ValueError):
            continue
        coords.append([lat, lon])
    if len(coords) >= 3 and coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def _polygon_centroid(poly_coords):
    if not poly_coords:
        return None, None
    pts = poly_coords[:-1] if len(poly_coords) > 2 and poly_coords[0] == poly_coords[-1] else poly_coords
    if not pts:
        return None, None
    lat = sum(float(p[0]) for p in pts) / len(pts)
    lon = sum(float(p[1]) for p in pts) / len(pts)
    return lat, lon


def _load_store_dataframe(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext in {'.xlsx', '.xls'}:
        return pd.read_excel(filepath)
    if ext in {'.csv', '.txt'}:
        return pd.read_csv(filepath)
    raise ValueError(f"Unsupported store file type: {ext}")


def _region_type_marks_excluded(value):
    text = str(value or '').strip().lower()
    return any(token in text for token in ('island', 'exclude', 'excluded', 'outofscope', 'out_of_scope'))


def _parse_polygon_like(value):
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return _normalize_polygon_coords(value)
    text = str(value).strip()
    if not text:
        return []
    if 'POLYGON' in text.upper():
        return _parse_wkt_coords(text)
    try:
        gj = json.loads(text)
    except Exception:
        return []
    polys = polygons_from_geojson(gj)
    if not polys:
        return []
    return _normalize_polygon_coords(polys[0])


def _normalize_polygon_coords(coords):
    if not coords:
        return []
    first = coords[0]
    if isinstance(first, (list, tuple)) and first and isinstance(first[0], (list, tuple)):
        ring = first
        out = []
        for pt in ring:
            if len(pt) < 2:
                continue
            try:
                out.append([float(pt[1]), float(pt[0])])
            except (TypeError, ValueError):
                continue
        if len(out) >= 3 and out[0] != out[-1]:
            out.append(out[0])
        return out
    out = []
    for pt in coords:
        if not isinstance(pt, (list, tuple)) or len(pt) < 2:
            continue
        try:
            out.append([float(pt[0]), float(pt[1])])
        except (TypeError, ValueError):
            continue
    if len(out) >= 3 and out[0] != out[-1]:
        out.append(out[0])
    return out


def _point_in_simple_polygon(lat, lon, polygon_coords):
    ring = _normalize_polygon_coords(polygon_coords)
    if len(ring) < 3:
        return False
    inside = False
    x = float(lon)
    y = float(lat)
    j = len(ring) - 1
    for i in range(len(ring)):
        yi = float(ring[i][0])
        xi = float(ring[i][1])
        yj = float(ring[j][0])
        xj = float(ring[j][1])
        intersects = ((yi > y) != (yj > y)) and (
            x < (xj - xi) * (y - yi) / ((yj - yi) + 1e-15) + xi
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def _latlon_to_xy_km(lats, lons, ref_lat=None):
    lat_arr = np.asarray(lats, dtype=np.float64)
    lon_arr = np.asarray(lons, dtype=np.float64)
    if ref_lat is None:
        ref_lat = float(np.mean(lat_arr)) if lat_arr.size else 0.0
    lat_km = lat_arr * 110.574
    lon_km = lon_arr * (111.320 * math.cos(math.radians(ref_lat)))
    return np.column_stack([lat_km, lon_km])


def _xy_km_to_latlon(x_km, y_km, ref_lat):
    lat = float(x_km) / 110.574
    lon_scale = 111.320 * math.cos(math.radians(ref_lat))
    lon = float(y_km) / max(lon_scale, 1e-9)
    return lat, lon


def _haversine_km(lat1, lon1, lat2, lon2):
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    dphi = phi2 - phi1
    dlambda = math.radians(float(lon2) - float(lon1))
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    return 2.0 * 6371.0 * math.asin(math.sqrt(max(0.0, a)))


def _prepare_polygon_tests(regions):
    prepared = []
    for region in (regions or []):
        poly = _normalize_polygon_coords(region.get('polygon_coords', []))
        if len(poly) < 3:
            continue
        body = poly[:-1] if len(poly) > 2 and poly[0] == poly[-1] else poly
        lats = [float(pt[0]) for pt in body]
        lons = [float(pt[1]) for pt in body]
        prepared.append({
            'polygon': poly,
            'min_lat': min(lats),
            'max_lat': max(lats),
            'min_lon': min(lons),
            'max_lon': max(lons),
        })
    return prepared


def _point_in_prepared_polygons(lat, lon, prepared_polygons):
    flat_lat = float(lat)
    flat_lon = float(lon)
    for item in prepared_polygons:
        if flat_lat < item['min_lat'] or flat_lat > item['max_lat'] or flat_lon < item['min_lon'] or flat_lon > item['max_lon']:
            continue
        if _point_in_simple_polygon(flat_lat, flat_lon, item['polygon']):
            return True
    return False


def _refresh_scope_grid():
    if state.grid_data is None:
        state.in_scope_grid = None
        state.out_of_scope_grid = None
        state.scope_summary = None
        return

    grid = state.grid_data.copy()
    prepared_business = _prepare_polygon_tests(state.business_regions)
    if not prepared_business:
        in_scope_mask = np.ones(len(grid), dtype=bool)
    else:
        lats = grid['avg_cust_lat'].values.astype(np.float64)
        lons = grid['avg_cust_lon'].values.astype(np.float64)
        mask_list = []
        for lat, lon in zip(lats, lons):
            inside_business = _point_in_prepared_polygons(lat, lon, prepared_business)
            mask_list.append(bool(inside_business))
        in_scope_mask = np.array(mask_list, dtype=bool)

    grid['in_scope'] = in_scope_mask
    state.in_scope_grid = grid[in_scope_mask].copy().reset_index(drop=True)
    state.out_of_scope_grid = grid[~in_scope_mask].copy().reset_index(drop=True)
    state.scope_summary = {
        'in_scope_grid_cells': int(in_scope_mask.sum()),
        'out_of_scope_grid_cells': int((~in_scope_mask).sum()),
        'in_scope_orders_per_day': round(float(state.in_scope_grid['orders_per_day'].sum()) if len(state.in_scope_grid) else 0.0, 2),
        'out_of_scope_orders_per_day': round(float(state.out_of_scope_grid['orders_per_day'].sum()) if len(state.out_of_scope_grid) else 0.0, 2),
        'business_polygon_count': len(state.business_regions),
        'excluded_island_count': len(state.excluded_islands),
        'demand_input_mode': state.demand_input_mode,
        'live_store_detection_mode': state.live_store_detection_mode,
        'fixed_store_source_mode': state.fixed_store_source_mode,
    }

# ============================================================================
# OSRM INTEGRATION — PARALLEL (all road distances use OSRM only; no straight-line fallbacks)
# ============================================================================
def check_osrm():
    try:
        url = f"{OSRM_BASE_URL}/route/v1/driving/77.5946,12.9716;77.6,12.97"
        resp = _osrm_pool.request('GET', url)
        data = json.loads(resp.data)
        return data.get('code') == 'Ok'
    except Exception:
        return False


def check_osrm_table_fast(timeout_s=3.0):
    """Cheap fail-fast probe for the OSRM Table API used by meeting mode."""
    try:
        probe_pool = urllib3.PoolManager(
            retries=False,
            timeout=urllib3.Timeout(connect=min(2.0, float(timeout_s)), read=float(timeout_s)),
        )
        url = (
            f"{OSRM_BASE_URL}/table/v1/driving/"
            "77.5946,12.9716;77.6000,12.9700"
            "?sources=0&destinations=1&annotations=distance"
        )
        resp = probe_pool.request('GET', url)
        data = json.loads(resp.data)
        return data.get('code') == 'Ok'
    except Exception:
        return False


def require_osrm():
    """All last-mile and placement road distances require a working OSRM Table API."""
    if not state.osrm_available:
        raise RuntimeError(
            "OSRM is required for road distances. Start an OSRM server and set OSRM_URL "
            "(default http://localhost:5000), then verify GET /api/check-osrm."
        )


def _osrm_table_batch(src_batch, dst_batch):
    """Single OSRM Table API call; returns distance matrix in km. Raises on failure.

    Uses urllib3 connection pool (_osrm_pool) for persistent TCP connections —
    eliminates per-request TCP handshake overhead (the dominant cost when
    thousands of table calls are issued during greedy placement).
    """
    n_s = len(src_batch)
    n_d = len(dst_batch)
    if n_s == 0 or n_d == 0:
        return np.empty((n_s, n_d), dtype=np.float64)
    coords = []
    for lat, lon in src_batch:
        coords.append(f"{lon},{lat}")
    for lat, lon in dst_batch:
        coords.append(f"{lon},{lat}")
    coords_str = ";".join(coords)
    src_idx = ";".join(str(i) for i in range(n_s))
    dst_idx = ";".join(str(i) for i in range(n_s, n_s + n_d))
    url = (f"{OSRM_BASE_URL}/table/v1/driving/{coords_str}"
           f"?sources={src_idx}&destinations={dst_idx}&annotations=distance")
    max_attempts = 3
    last_error = None
    for attempt in range(max_attempts):
        try:
            resp = _osrm_pool.request('GET', url)
            body = resp.data
            if not body or len(body) == 0:
                raise RuntimeError("OSRM returned empty response")
            data = json.loads(body)
            if data.get('code') == 'Ok':
                dm = np.array(data['distances'], dtype=float)  # meters
                dm[dm == None] = np.inf
                return dm / 1000.0  # km
            msg = data.get('message', '')
            raise RuntimeError(f"OSRM table code={data.get('code')!r} {msg}")
        except Exception as e:
            last_error = e
            if attempt < max_attempts - 1:
                import time as _t; _t.sleep(0.3 * (attempt + 1))
                continue

    # Large table calls can occasionally trip transport disconnects even when
    # OSRM is otherwise healthy. Split and retry instead of failing the whole run.
    if n_d > 1 and (n_d >= n_s or n_s == 1):
        mid = n_d // 2
        left = _osrm_table_batch(src_batch, dst_batch[:mid])
        right = _osrm_table_batch(src_batch, dst_batch[mid:])
        return np.concatenate([left, right], axis=1)
    if n_s > 1:
        mid = n_s // 2
        top = _osrm_table_batch(src_batch[:mid], dst_batch)
        bottom = _osrm_table_batch(src_batch[mid:], dst_batch)
        return np.concatenate([top, bottom], axis=0)

    raise RuntimeError(f"OSRM table request failed: {last_error}") from last_error


def _iter_osrm_table_batch_results(src, demand_lats, demand_lons, demand_union, batch_size=None, parallelism=None):
    batch_size = max(1, int(batch_size or OSRM_BATCH_SIZE or 1))
    parallelism = max(1, int(parallelism or EXACT_GRAPH_BATCH_PARALLELISM or 1))
    jobs = []
    for dst_start in range(0, len(demand_union), batch_size):
        dst_indices = np.asarray(demand_union[dst_start:dst_start + batch_size], dtype=np.int64)
        dst = list(zip(demand_lats[dst_indices], demand_lons[dst_indices]))
        jobs.append((dst_indices, dst))

    if parallelism <= 1 or len(jobs) <= 1:
        for dst_indices, dst in jobs:
            yield dst_indices, _osrm_table_batch(src, dst)
        return

    for start in range(0, len(jobs), parallelism):
        chunk = jobs[start:start + parallelism]
        futures = [
            (dst_indices, _osrm_executor.submit(_osrm_table_batch, src, dst))
            for dst_indices, dst in chunk
        ]
        for dst_indices, fut in futures:
            yield dst_indices, fut.result()


def osrm_min_distances_parallel(point_lats, point_lons, hub_lats, hub_lons, progress_cb=None):
    """
    For each point, find minimum road distance to any hub.
    Uses parallel OSRM table API calls.
    Returns np.array of shape (n_points,) in km.
    """
    n_points = len(point_lats)
    n_hubs = len(hub_lats)
    if n_points == 0 or n_hubs == 0:
        return np.full(n_points, np.inf)

    min_dists = np.full(n_points, np.inf)
    BS = OSRM_BATCH_SIZE

    # Build list of (pt_start, pt_end, hub_start, hub_end) tasks
    tasks = []
    for pt_s in range(0, n_points, BS):
        pt_e = min(pt_s + BS, n_points)
        for hub_s in range(0, n_hubs, BS):
            hub_e = min(hub_s + BS, n_hubs)
            tasks.append((pt_s, pt_e, hub_s, hub_e))

    total_tasks = len(tasks)
    completed = [0]

    def run_task(task):
        pt_s, pt_e, hub_s, hub_e = task
        src = list(zip(point_lats[pt_s:pt_e], point_lons[pt_s:pt_e]))
        dst = list(zip(hub_lats[hub_s:hub_e], hub_lons[hub_s:hub_e]))
        dm = _osrm_table_batch(src, dst)
        completed[0] += 1
        if progress_cb and completed[0] % max(1, total_tasks // 20) == 0:
            progress_cb(completed[0], total_tasks)
        return task, dm

    with ThreadPoolExecutor(max_workers=OSRM_WORKERS) as pool:
        futures = {pool.submit(run_task, t): t for t in tasks}
        for future in as_completed(futures):
            (pt_s, pt_e, hub_s, hub_e), dm = future.result()
            batch_min = dm.min(axis=1)  # min over hubs for each point
            mask = batch_min < min_dists[pt_s:pt_e]
            min_dists[pt_s:pt_e] = np.where(mask, batch_min, min_dists[pt_s:pt_e])

    return min_dists


def osrm_min_distances_and_argmin(point_lats, point_lons, hub_lats, hub_lons, progress_cb=None):
    """Per point: minimum road distance to any hub and index of a nearest hub (ties: smallest index)."""
    n_points = len(point_lats)
    n_hubs = len(hub_lats)
    if n_points == 0 or n_hubs == 0:
        return np.full(n_points, np.inf), np.full(n_points, -1, dtype=np.int64)

    min_dists = np.full(n_points, np.inf)
    argmin = np.full(n_points, -1, dtype=np.int64)
    BS = OSRM_BATCH_SIZE

    tasks = []
    for pt_s in range(0, n_points, BS):
        pt_e = min(pt_s + BS, n_points)
        for hub_s in range(0, n_hubs, BS):
            hub_e = min(hub_s + BS, n_hubs)
            tasks.append((pt_s, pt_e, hub_s, hub_e))

    total_tasks = len(tasks)
    completed = [0]

    def run_task(task):
        pt_s, pt_e, hub_s, hub_e = task
        src = list(zip(point_lats[pt_s:pt_e], point_lons[pt_s:pt_e]))
        dst = list(zip(hub_lats[hub_s:hub_e], hub_lons[hub_s:hub_e]))
        dm = _osrm_table_batch(src, dst)
        completed[0] += 1
        if progress_cb and completed[0] % max(1, total_tasks // 20) == 0:
            progress_cb(completed[0], total_tasks)
        return task, dm

    with ThreadPoolExecutor(max_workers=OSRM_WORKERS) as pool:
        futures = {pool.submit(run_task, t): t for t in tasks}
        for future in as_completed(futures):
            (pt_s, pt_e, hub_s, hub_e), dm = future.result()
            for local_i in range(dm.shape[0]):
                gi = pt_s + local_i
                for local_j in range(dm.shape[1]):
                    gj = hub_s + local_j
                    d = dm[local_i, local_j]
                    if d < min_dists[gi]:
                        min_dists[gi] = d
                        argmin[gi] = gj

    return min_dists, argmin


def osrm_one_to_many(src_lat, src_lon, dst_lats, dst_lons):
    """Road distances (km) from one point to many destinations via OSRM Table API.

    Batches run in parallel (same as ``osrm_min_distances_parallel``) — greedy placement
    used to issue hundreds of sequential table calls per hub; this is the main speed lever
    alongside ``OSRM_WORKERS`` and OSRM server threads.
    """
    dst_lats = np.asarray(dst_lats, dtype=np.float64).ravel()
    dst_lons = np.asarray(dst_lons, dtype=np.float64).ravel()
    n = len(dst_lats)
    if n == 0:
        return np.array([], dtype=np.float64)
    out = np.full(n, np.inf)
    BS = OSRM_BATCH_SIZE
    src_pt = (float(src_lat), float(src_lon))
    batches = [(s, min(s + BS, n)) for s in range(0, n, BS)]

    def run_batch(se):
        s, e = se
        dst = list(zip(dst_lats[s:e], dst_lons[s:e]))
        dm = _osrm_table_batch([src_pt], dst)
        return s, e, np.asarray(dm[0, :], dtype=np.float64)

    if len(batches) == 1:
        s, e, row = run_batch(batches[0])
        out[s:e] = row
        return out

    futures = [_osrm_executor.submit(run_batch, b) for b in batches]
    for fut in as_completed(futures):
        s, e, row = fut.result()
        out[s:e] = row
    return out


def osrm_pairwise_distances_parallel(cust_lats, cust_lons, store_lats, store_lons, progress_cb=None):
    """
    Compute road distance from each customer to their assigned store (1:1 pairs).
    Groups by unique stores for efficiency.
    """
    n = len(cust_lats)
    road_dists = np.zeros(n)
    BS = OSRM_BATCH_SIZE

    # Group points by their assigned store
    store_keys = {}
    for i in range(n):
        key = (round(float(store_lats[i]), 6), round(float(store_lons[i]), 6))
        store_keys.setdefault(key, []).append(i)

    tasks = []
    for skey, indices in store_keys.items():
        for batch_start in range(0, len(indices), BS):
            batch_indices = indices[batch_start:batch_start + BS]
            tasks.append((skey, batch_indices))

    total = len(tasks)
    done = [0]

    def run_task(task):
        skey, indices = task
        slat, slon = skey
        src = [(float(cust_lats[i]), float(cust_lons[i])) for i in indices]
        dst = [(slat, slon)]
        dm = _osrm_table_batch(src, dst)
        results = {}
        for j, idx in enumerate(indices):
            results[idx] = dm[j][0]
        done[0] += 1
        if progress_cb and done[0] % max(1, total // 20) == 0:
            progress_cb(done[0], total)
        return results

    with ThreadPoolExecutor(max_workers=OSRM_WORKERS) as pool:
        futures = [pool.submit(run_task, t) for t in tasks]
        for f in as_completed(futures):
            for idx, dist in f.result().items():
                road_dists[idx] = dist

    return road_dists

# ============================================================================
# DATA LOADING
# ============================================================================
def detect_columns(df):
    """Auto-detect column mapping from CSV headers."""
    cols = {c: c.strip().lower().replace(' ', '_').replace('-', '_') for c in df.columns}
    mapping = {}
    patterns = {
        'customer_lat': ['customer_latitude', 'customer_lat', 'cust_lat', 'order_lat', 'dest_lat', 'delivery_lat'],
        'customer_lon': ['customer_longitude', 'customer_lon', 'cust_lon', 'order_lon', 'dest_lon', 'delivery_lon'],
        'store_lat': ['dark_store_latitude', 'darkstore_latitude', 'store_lat', 'hub_lat', 'origin_lat', 'dark_store_lat'],
        'store_lon': ['darkstore_longitude', 'dark_store_longitude', 'store_lon', 'hub_lon', 'origin_lon', 'darkstore_lon', 'dark_store_lon'],
        'store_id': ['dark_store_id', 'darkstore_id', 'store_id', 'hub_code', 'hub_id', 'ds_id'],
        'date': ['date', 'order_date', 'created_at', 'delivery_date'],
        'orders_per_day': ['orders_per_day', 'ordersday', 'avg_orders_per_day', 'representative_orders_per_day', 'demand_per_day'],
        'order_count': ['order_count', 'orders', 'demand', 'count', 'daily_orders'],
    }
    for field, candidates in patterns.items():
        for orig_col, norm_col in cols.items():
            if norm_col in candidates:
                mapping[field] = orig_col
                break
    return mapping

def load_order_csv(filepath):
    """Load order CSV, aggregate into grid cells. Handles large files efficiently."""
    logger.info(f"Loading orders from {filepath}")
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    logger.info(f"File size: {file_size_mb:.1f} MB")

    state.load_progress = "Reading CSV headers..."

    # First, read just the header to detect columns
    header_df = pd.read_csv(filepath, nrows=5)
    mapping = detect_columns(header_df)
    logger.info(f"Column mapping: {mapping}")

    required = ['customer_lat', 'customer_lon']
    missing = [f for f in required if f not in mapping]
    if missing:
        raise ValueError(f"Could not auto-detect columns: {missing}. "
                        f"Available columns: {list(header_df.columns)}")
    aggregated_input = any(k in mapping for k in ('orders_per_day', 'order_count'))
    if not aggregated_input:
        missing_store = [f for f in ('store_lat', 'store_lon') if f not in mapping]
        if missing_store:
            raise ValueError(
                f"Could not auto-detect columns: {missing_store}. "
                "Raw order inputs need current store coordinates for baseline comparison."
            )

    # Only read the columns we actually need (huge memory savings for wide CSVs)
    needed_original_cols = set()
    for key, orig_col in mapping.items():
        needed_original_cols.add(orig_col)
    # Also grab store_id if present
    if 'store_id' in mapping:
        needed_original_cols.add(mapping['store_id'])
    elif 'Dark store_id' in header_df.columns:
        needed_original_cols.add('Dark store_id')
    elif 'store_id' in header_df.columns:
        needed_original_cols.add('store_id')

    use_cols = list(needed_original_cols)
    logger.info(f"Reading only {len(use_cols)} of {len(header_df.columns)} columns to save memory")

    state.load_progress = f"Reading CSV ({file_size_mb:.0f} MB, {len(use_cols)} columns)..."

    # For very large files (>500MB), read in chunks
    if file_size_mb > 500:
        state.load_progress = f"Reading large CSV in chunks ({file_size_mb:.0f} MB)..."
        chunks = []
        chunk_size = 500_000
        total_rows = 0
        for i, chunk in enumerate(pd.read_csv(filepath, usecols=use_cols, chunksize=chunk_size)):
            chunks.append(chunk)
            total_rows += len(chunk)
            if i % 5 == 0:
                state.load_progress = f"Reading CSV... {total_rows:,} rows loaded"
                logger.info(f"  chunk {i}: {total_rows:,} rows")
        df = pd.concat(chunks, ignore_index=True)
        del chunks  # free memory
    else:
        df = pd.read_csv(filepath, usecols=use_cols)

    logger.info(f"Raw CSV: {len(df)} rows, {len(df.columns)} columns")

    # Rename for consistency
    rename_map = {mapping[k]: k for k in mapping}
    df = df.rename(columns=rename_map)

    # Drop rows with missing customer coordinates
    df = df.dropna(subset=['customer_lat', 'customer_lon'])
    state.load_progress = f"Normalizing {len(df):,} representative-demand rows..."

    if aggregated_input:
        state.demand_input_mode = 'representative_aggregated'
        if 'orders_per_day' not in df.columns:
            df['orders_per_day'] = pd.to_numeric(df['order_count'], errors='coerce')
        else:
            df['orders_per_day'] = pd.to_numeric(df['orders_per_day'], errors='coerce')
        df = df.dropna(subset=['orders_per_day'])
        df = df[df['orders_per_day'] > 0]
        if 'order_count' not in df.columns:
            df['order_count'] = df['orders_per_day']
        for col in ('store_lat', 'store_lon'):
            if col not in df.columns:
                df[col] = np.nan
        state.unique_dates = 1
        state.total_orders = int(round(float(df['orders_per_day'].sum()), 0))
        state.orders_per_day = int(round(float(df['orders_per_day'].sum()), 0))

        df['cell_lat'] = pd.to_numeric(df['customer_lat'], errors='coerce').round(3)
        df['cell_lon'] = pd.to_numeric(df['customer_lon'], errors='coerce').round(3)
        agg_spec = {
            'order_count': ('order_count', 'sum'),
            'orders_per_day': ('orders_per_day', 'sum'),
            'avg_cust_lat': ('customer_lat', 'mean'),
            'avg_cust_lon': ('customer_lon', 'mean'),
            'avg_store_lat': ('store_lat', 'mean'),
            'avg_store_lon': ('store_lon', 'mean'),
        }
        if 'store_id' in df.columns:
            agg_spec['primary_store_id'] = ('store_id', lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0])
        grid = df.groupby(['cell_lat', 'cell_lon']).agg(**agg_spec).reset_index()
    else:
        state.demand_input_mode = 'representative_raw_orders' if ('date' not in df.columns or df['date'].nunique() <= 1) else 'historical_multi_day'
        df = df.dropna(subset=['store_lat', 'store_lon'])
        state.total_orders = len(df)

        if 'date' in df.columns:
            state.unique_dates = max(df['date'].nunique(), 1)
        else:
            state.unique_dates = 1
        state.orders_per_day = int(len(df) / state.unique_dates)

        state.load_progress = f"Aggregating {len(df):,} orders into grid cells..."

        # Grid aggregation (~200m resolution)
        df['cell_lat'] = (df['customer_lat'] * 500).round() / 500
        df['cell_lon'] = (df['customer_lon'] * 500).round() / 500

        agg_spec = {
            'order_count': ('customer_lat', 'count'),
            'avg_cust_lat': ('customer_lat', 'mean'),
            'avg_cust_lon': ('customer_lon', 'mean'),
            'avg_store_lat': ('store_lat', 'mean'),
            'avg_store_lon': ('store_lon', 'mean'),
        }
        if 'store_id' in df.columns:
            agg_spec['primary_store_id'] = ('store_id', lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0])
        grid = df.groupby(['cell_lat', 'cell_lon']).agg(**agg_spec).reset_index()
        grid['orders_per_day'] = grid['order_count'] / state.unique_dates

    state.order_df = df
    state.grid_data = grid
    state.city_bounds = {
        'north': float(grid['avg_cust_lat'].max()),
        'south': float(grid['avg_cust_lat'].min()),
        'east': float(grid['avg_cust_lon'].max()),
        'west': float(grid['avg_cust_lon'].min()),
    }
    state.data_loaded = bool(state.existing_stores)
    _refresh_scope_grid()
    logger.info(
        "Grid: %d cells, %d orders/day, demand_input_mode=%s",
        len(grid), state.orders_per_day, state.demand_input_mode
    )
    return mapping

def load_store_xlsx(filepath):
    """Load store/polygon file from CSV or XLSX.

    Supports:
      - legacy matrix: store code + store lat/lon + point lat/lon
      - richer site plans with existing/fixed flags and region types
      - WKT / GeoJSON polygon columns
    """
    logger.info(f"Loading stores from {filepath}")
    df = _load_store_dataframe(filepath)
    df.columns = [str(c).strip() for c in df.columns]
    columns = list(df.columns)

    store_id_col = _find_col(columns, ['store code', 'hub_code', 'store_id', 'site_id', 'id', 'name'])
    store_lat_col = _find_col(columns, ['store latitude', 'store_latitude', 'store_lat', 'latitude', 'lat'])
    store_lon_col = _find_col(columns, ['store longitude', 'store_longitude', 'store_lon', 'longitude', 'lon'])
    point_lat_col = _find_col(columns, ['point latitude', 'point_latitude', 'point_lat', 'polygon_lat', 'vertex_lat'])
    point_lon_col = _find_col(columns, ['point longitude', 'point_longitude', 'point_lon', 'polygon_lon', 'vertex_lon'])
    edge_col = _find_col(columns, ['polygon_edge', 'edge', 'vertex_type', 'point_type'])
    polygon_col = _find_col(columns, ['polygon', 'wkt', 'geometry', 'geojson'])
    existing_col = _find_col(columns, ['fixed_open', 'is_existing', 'existing', 'existing_store', 'current_store', 'is_live', 'live', 'is_open', 'store_live', 'store_status', 'status'])
    region_type_col = _find_col(columns, ['region_type', 'polygon_type', 'scope_type', 'type', 'zone_type'])
    excluded_col = _find_col(columns, ['is_excluded', 'excluded', 'exclude', 'is_island', 'out_of_scope'])

    if store_id_col is None and polygon_col is None:
        raise ValueError(f"Could not identify store/polygon id column. Columns: {columns}")

    group_col = store_id_col or polygon_col
    groups = df.groupby(group_col, dropna=True, sort=False)

    order_store_ids = set()
    if state.order_df is not None and 'store_id' in state.order_df.columns:
        order_store_ids = {str(v).strip().lower() for v in state.order_df['store_id'].dropna().unique()}
    explicit_live_flag_present = existing_col is not None

    store_regions = []
    business_regions = []
    excluded_islands = []
    existing_stores = []

    for group_id, group in groups:
        row0 = group.iloc[0]
        poly_coords = _rows_to_polygon_coords(group, point_lat_col, point_lon_col, edge_col=edge_col)
        if not poly_coords and polygon_col:
            poly_coords = _parse_polygon_like(row0.get(polygon_col))
        lat = None
        lon = None
        if store_lat_col and store_lon_col:
            try:
                lat = float(row0[store_lat_col])
                lon = float(row0[store_lon_col])
            except (TypeError, ValueError):
                lat = None
                lon = None
        if (lat is None or lon is None) and poly_coords:
            lat, lon = _polygon_centroid(poly_coords)
        if lat is None or lon is None:
            continue

        region_type = row0.get(region_type_col) if region_type_col else None
        explicit_excluded = _as_bool(row0.get(excluded_col)) if excluded_col else False
        is_excluded = _region_type_marks_excluded(region_type) or explicit_excluded
        raw_id = str(group_id).strip()
        fixed_open = _as_bool(row0.get(existing_col)) if existing_col else False
        if not fixed_open and not explicit_live_flag_present and raw_id.lower() in order_store_ids:
            fixed_open = True

        region = {
            'id': raw_id,
            'lat': float(lat),
            'lon': float(lon),
            'polygon_coords': _normalize_polygon_coords(poly_coords),
            'fixed_open': bool(fixed_open),
            'region_type': str(region_type).strip() if region_type is not None else '',
            'excluded': bool(is_excluded),
            'orders_per_day': 0,
        }
        store_regions.append(region)
        if region['polygon_coords']:
            business_regions.append(region)
            if is_excluded:
                excluded_islands.append(region)
        if region['fixed_open']:
            existing_stores.append({
                'id': region['id'],
                'lat': region['lat'],
                'lon': region['lon'],
                'polygon_coords': region['polygon_coords'],
                'orders_per_day': 0,
                'fixed_open': True,
            })

    if not business_regions:
        business_regions = [r for r in store_regions if r.get('polygon_coords')]

    # Match orders to fixed stores from explicit store ids when available.
    matched_any_store_orders = False
    if state.order_df is not None and 'store_id' in state.order_df.columns:
        counts = state.order_df['store_id'].value_counts()
        for s in existing_stores:
            sid = s['id'].lower()
            matched = [k for k in counts.index if str(k).strip().lower() == sid]
            if matched:
                s['orders_per_day'] = int(counts[matched[0]] / state.unique_dates)
                matched_any_store_orders = True
    if existing_stores and not matched_any_store_orders:
        existing_stores = _estimate_site_orders_from_nearest_grid(existing_stores)

    state.store_regions = store_regions
    state.business_regions = business_regions
    state.excluded_islands = excluded_islands
    state.existing_stores = existing_stores
    state.data_loaded = state.order_df is not None
    state.live_store_detection_mode = 'explicit_flag' if explicit_live_flag_present else 'inferred_from_store_id'
    state.fixed_store_source_mode = 'store_scope_file'
    _refresh_scope_grid()
    logger.info(
        "Loaded %d fixed existing stores, %d total site/polygon regions, %d business polygons, %d excluded islands, live_store_detection=%s",
        len(existing_stores), len(store_regions), len(business_regions), len(excluded_islands), state.live_store_detection_mode
    )
    return existing_stores


def override_fixed_store_locations(filepath, source_mode='fixed_store_override_file'):
    """Replace the fixed existing-store layer while preserving scope polygons from the current store master."""
    override_sites = _load_fixed_store_override_sites(filepath, source_mode=source_mode)
    state.existing_stores = override_sites
    state.fixed_store_source_mode = source_mode
    _refresh_scope_grid()
    logger.info("Fixed-store override applied: %d fixed stores from %s", len(override_sites), source_mode)
    return override_sites


def _ensure_exact_benchmark_fixed_store_override():
    filepath = OLD_FIXED_STORE_OVERRIDE_CSV
    if not os.path.isfile(filepath):
        raise FileNotFoundError(
            f"Exact Bangalore benchmark requires the 103 fixed-store override file, but it was not found: {filepath}"
        )
    if state.fixed_store_source_mode != 'old_103_exact_locations' or len(state.existing_stores) != 103:
        override_fixed_store_locations(filepath, source_mode='old_103_exact_locations')
    return filepath


def _estimate_site_orders_from_nearest_grid(sites):
    sites_out = [dict(site) for site in (sites or [])]
    if not sites_out or state.grid_data is None or len(state.grid_data) == 0:
        return sites_out
    try:
        demand_lats = state.grid_data['avg_cust_lat'].values.astype(np.float64)
        demand_lons = state.grid_data['avg_cust_lon'].values.astype(np.float64)
        site_lats = np.array([float(s['lat']) for s in sites_out], dtype=np.float64)
        site_lons = np.array([float(s['lon']) for s in sites_out], dtype=np.float64)
        ref_lat = float(np.mean(np.concatenate([demand_lats, site_lats]))) if len(demand_lats) and len(site_lats) else 0.0
        demand_xy = _latlon_to_xy_km(demand_lats, demand_lons, ref_lat=ref_lat)
        site_xy = _latlon_to_xy_km(site_lats, site_lons, ref_lat=ref_lat)
        nearest_idx = cKDTree(site_xy).query(demand_xy, k=1)[1]
        order_weights = state.grid_data['orders_per_day'].values.astype(np.float64)
        for idx, site_idx in enumerate(nearest_idx):
            sites_out[int(site_idx)]['orders_per_day'] = float(sites_out[int(site_idx)].get('orders_per_day', 0) or 0) + float(order_weights[idx])
    except Exception as exc:
        logger.warning("Could not estimate nearest-grid orders/day for sites: %s", exc)
    return sites_out

def _parse_wkt_centroid(wkt):
    try:
        m = re.search(r'POLYGON\s*\(\((.*?)\)\)', wkt)
        if not m: return None, None
        coords = []
        for pair in m.group(1).split(','):
            parts = pair.strip().split()
            if len(parts) == 2:
                coords.append((float(parts[1]), float(parts[0])))
        if not coords: return None, None
        return sum(c[0] for c in coords)/len(coords), sum(c[1] for c in coords)/len(coords)
    except:
        return None, None

def _parse_wkt_coords(wkt):
    try:
        m = re.search(r'POLYGON\s*\(\((.*?)\)\)', wkt)
        if not m: return []
        coords = []
        for pair in m.group(1).split(','):
            parts = pair.strip().split()
            if len(parts) == 2:
                coords.append([float(parts[1]), float(parts[0])])
        return coords
    except:
        return []

# ============================================================================
# OPTIMIZATION ENGINE
# ============================================================================
def _safe_positive_float(params, key, default):
    """Parse a tier order bound; None / NaN / non-numeric → default. Does not treat 0 as missing."""
    v = params.get(key, default)
    if v is None:
        return float(default)
    try:
        x = float(v)
    except (TypeError, ValueError):
        return float(default)
    if not math.isfinite(x):
        return float(default)
    return x


def _safe_min_orders_per_day(params, key, default):
    """Minimum orders/day must be strictly positive. 0 or negative (often from bad JSON/UI) would
    disable the lower bound in greedy placement and allow 0–1 order 'Mini' hubs."""
    x = _safe_positive_float(params, key, default)
    if x <= 0:
        return float(default)
    return x


def _safe_optional_count(params, key):
    """Optional non-negative integer count. Blank / invalid / negative => None."""
    raw = params.get(key)
    if raw in (None, ''):
        return None
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return None
    if value < 0:
        return None
    return value


def _tier_min_max_orders(params, tier):
    """Return (min_orders, max_orders) per tier; max is floored to >= min."""
    if tier == 'mini':
        lo = _safe_min_orders_per_day(params, 'mini_ds_min_orders_per_day', 300)
        hi = _safe_positive_float(params, 'mini_ds_max_orders_per_day', 8000)
    elif tier == 'standard':
        lo = _safe_min_orders_per_day(params, 'standard_ds_min_orders_per_day', 500)
        hi = _safe_positive_float(params, 'standard_ds_max_orders_per_day', 12000)
    else:
        raw = params.get('super_ds_min_orders_per_day')
        std_lo = _safe_min_orders_per_day(params, 'standard_ds_min_orders_per_day', 500)
        if raw is None:
            lo = float(params.get('super_ds_min_standards', 3)) * std_lo
        else:
            try:
                lo = float(raw)
            except (TypeError, ValueError):
                lo = float(params.get('super_ds_min_standards', 3)) * std_lo
            if not math.isfinite(lo) or lo <= 0:
                lo = float(params.get('super_ds_min_standards', 3)) * std_lo
        hi = _safe_positive_float(params, 'super_ds_max_orders_per_day', 50000)
    if hi < lo:
        hi = lo
    return lo, hi


def _drop_hubs_outside_order_band(hubs, lo, hi, tier_label):
    """Remove hubs whose stored demand is outside [lo, hi]; log if anything dropped."""
    if not hubs:
        return hubs
    kept, bad = [], []
    for h in hubs:
        if h.get('coverage_satellite'):
            kept.append(h)
            continue
        o = float(h.get('orders_per_day', 0))
        if o + 1e-9 < lo or o > hi + 1e-9:
            bad.append((h.get('lat'), h.get('lon'), o))
        else:
            kept.append(h)
    if bad:
        logger.warning(
            '%s: dropped %s hub(s) outside [%.1f, %.1f] orders/day (examples: %s)',
            tier_label, len(bad), lo, hi, bad[:5],
        )
    return kept


def _sanitize_placed_hubs(mini_ds, standard_ds, super_ds, params):
    """Last line of defense: never return hubs that violate tier min/max orders."""
    m_lo, m_hi = _tier_min_max_orders(params, 'mini')
    s_lo, s_hi = _tier_min_max_orders(params, 'standard')
    p_lo, p_hi = _tier_min_max_orders(params, 'super')
    mini_ds = _drop_hubs_outside_order_band(mini_ds, m_lo, m_hi, 'Mini')
    standard_ds = _drop_hubs_outside_order_band(standard_ds, s_lo, s_hi, 'Standard')
    super_ds = _drop_hubs_outside_order_band(super_ds, p_lo, p_hi, 'Super')
    return mini_ds, standard_ds, super_ds


def _tier_service_radius(params, tier):
    if tier == 'mini':
        return float(params.get('mini_ds_radius', 1.0) or 1.0)
    if tier == 'standard':
        return float(params.get('standard_ds_radius', 3.0) or 3.0)
    if tier == 'super':
        return float(params.get('super_ds_radius', params.get('super_radius_km', 7.0)) or params.get('super_radius_km', 7.0) or 7.0)
    raise ValueError(f"Unknown tier: {tier}")


def _tier_spacing_radius(params, tier):
    legacy_key = f'{tier}_min_store_spacing_km'
    if tier == 'standard':
        legacy_key = 'standard_min_store_spacing_km'
    elif tier == 'super':
        legacy_key = 'super_min_store_spacing_km'
    elif tier == 'mini':
        legacy_key = 'mini_min_store_spacing_km'
    raw = params.get(legacy_key)
    if raw not in (None, ''):
        try:
            value = float(raw)
            if math.isfinite(value) and value >= 0:
                return value
        except (TypeError, ValueError):
            pass
    return _tier_service_radius(params, tier)


def _violates_same_tier_spacing(lat, lon, hubs, spacing_km):
    if spacing_km <= 0 or not hubs:
        return False
    hub_lats = np.array([float(h['lat']) for h in hubs], dtype=np.float64)
    hub_lons = np.array([float(h['lon']) for h in hubs], dtype=np.float64)
    ref_lat = float(np.mean(np.concatenate([hub_lats, np.array([float(lat)], dtype=np.float64)])))
    hub_xy = _latlon_to_xy_km(hub_lats, hub_lons, ref_lat=ref_lat)
    cand_xy = _latlon_to_xy_km(np.array([float(lat)]), np.array([float(lon)]), ref_lat=ref_lat)[0]
    euclid = np.sqrt(np.sum((hub_xy - cand_xy) ** 2, axis=1))
    nearby_idx = np.flatnonzero(euclid <= float(spacing_km) + 0.2)
    if len(nearby_idx) == 0:
        return False
    src = [(float(lat), float(lon))]
    dst = [(float(hub_lats[i]), float(hub_lons[i])) for i in nearby_idx]
    try:
        forward = _osrm_table_batch(src, dst)[0]
        reverse = _osrm_table_batch(dst, src)[:, 0]
        pairwise = np.minimum(forward, reverse)
        return bool(np.any(np.isfinite(pairwise) & (pairwise <= float(spacing_km) + 1e-6)))
    except Exception as exc:
        logger.warning("Spacing check fallback to geometric distance due to OSRM error: %s", exc)
        return bool(np.any(euclid[nearby_idx] <= float(spacing_km) + 1e-6))


def normalize_placement_params(params):
    """Copy params and coerce tier min orders so invalid values cannot disable min thresholds."""
    base = dict(params or {})
    base['mini_ds_min_orders_per_day'] = _safe_min_orders_per_day(
        base, 'mini_ds_min_orders_per_day', 300
    )
    try:
        base['mini_ds_radius'] = max(0.0, float(base.get('mini_ds_radius', 1.0) or 1.0))
    except (TypeError, ValueError):
        base['mini_ds_radius'] = 1.0
    base['standard_ds_min_orders_per_day'] = _safe_min_orders_per_day(
        base, 'standard_ds_min_orders_per_day', 500
    )
    try:
        base['standard_ds_radius'] = max(0.0, float(base.get('standard_ds_radius', 3.0) or 3.0))
    except (TypeError, ValueError):
        base['standard_ds_radius'] = 3.0
    std_lo = base['standard_ds_min_orders_per_day']
    raw_sup = base.get('super_ds_min_orders_per_day')
    fallback = float(base.get('super_ds_min_standards', 3)) * std_lo
    try:
        if raw_sup is None:
            base['super_ds_min_orders_per_day'] = fallback
        else:
            sv = float(raw_sup)
            if not math.isfinite(sv) or sv <= 0:
                base['super_ds_min_orders_per_day'] = fallback
            else:
                base['super_ds_min_orders_per_day'] = sv
    except (TypeError, ValueError):
        base['super_ds_min_orders_per_day'] = fallback
    if 'require_full_tier_coverage' not in base:
        base['require_full_tier_coverage'] = True
    else:
        base['require_full_tier_coverage'] = bool(base['require_full_tier_coverage'])
    base['coverage_mode'] = str(base.get('coverage_mode') or 'hybrid').strip().lower()
    if base['coverage_mode'] not in {'hard', 'hybrid', 'operational_compare'}:
        base['coverage_mode'] = 'hybrid'
    if base.get('exception_max_orders_per_day') in ('', None):
        base['exception_max_orders_per_day'] = None
    else:
        try:
            xov = float(base.get('exception_max_orders_per_day'))
            base['exception_max_orders_per_day'] = xov if math.isfinite(xov) and xov >= 0 else None
        except (TypeError, ValueError):
            base['exception_max_orders_per_day'] = None
    try:
        x_pct = float(base.get('exception_max_pct', 0.25) or 0.25)
    except (TypeError, ValueError):
        x_pct = 0.25
    base['exception_max_pct'] = max(0.0, x_pct)
    try:
        x_extra = float(base.get('exception_max_extra_distance_km', 1.0) or 1.0)
    except (TypeError, ValueError):
        x_extra = 1.0
    base['exception_max_extra_distance_km'] = max(0.0, x_extra)
    base['super_role'] = str(base.get('super_role') or 'overlay_core_only').strip().lower()
    if base['super_role'] not in {'backbone_tail', 'full_competitor', 'tail_only', 'overlay_core_only'}:
        base['super_role'] = 'overlay_core_only'
    try:
        mini_density_radius = float(base.get('mini_density_radius_km', 1.0) or 1.0)
    except (TypeError, ValueError):
        mini_density_radius = 1.0
    base['mini_density_radius_km'] = max(0.1, mini_density_radius)
    base['mini_density_min_orders_per_day'] = _safe_min_orders_per_day(
        base, 'mini_density_min_orders_per_day', 400
    )
    default_override_candidates = ['standard'] if _super_overlay_only(base) else ['standard', 'super']
    raw_candidates = base.get('radius_override_candidate_tiers', default_override_candidates)
    if isinstance(raw_candidates, str):
        cand = [x.strip().lower() for x in raw_candidates.split(',') if x.strip()]
    elif isinstance(raw_candidates, (list, tuple, set)):
        cand = [str(x).strip().lower() for x in raw_candidates if str(x).strip()]
    else:
        cand = list(default_override_candidates)
    cand = [x for x in cand if x in {'mini', 'standard', 'super'}]
    if _super_overlay_only(base):
        cand = [x for x in cand if x != 'super']
    base['radius_override_candidate_tiers'] = cand or list(default_override_candidates)
    try:
        override_step = float(base.get('radius_override_step_km', 0.2) or 0.2)
    except (TypeError, ValueError):
        override_step = 0.2
    base['radius_override_step_km'] = max(0.1, override_step)
    try:
        std_override = float(base.get('standard_override_max_radius_km', 4.0) or 4.0)
    except (TypeError, ValueError):
        std_override = 4.0
    base['standard_override_max_radius_km'] = max(float(base.get('standard_ds_radius', 3.0) or 3.0), std_override)
    try:
        std_exc_radius = float(base.get('standard_exception_radius_km', 5.0) or 5.0)
    except (TypeError, ValueError):
        std_exc_radius = 5.0
    base['standard_exception_radius_km'] = max(float(base.get('standard_ds_radius', 3.0) or 3.0), std_exc_radius)
    if base.get('standard_exception_max_hubs') in ('', None):
        base['standard_exception_max_hubs'] = None
    else:
        try:
            exc_max = int(float(base.get('standard_exception_max_hubs')))
            base['standard_exception_max_hubs'] = max(0, exc_max)
        except (TypeError, ValueError):
            base['standard_exception_max_hubs'] = None
    try:
        std_exc_step = float(base.get('standard_exception_step_km', 0.5) or 0.5)
    except (TypeError, ValueError):
        std_exc_step = 0.5
    base['standard_exception_step_km'] = max(0.1, std_exc_step)
    try:
        sup_override = float(base.get('super_override_max_radius_km', 5.0) or 5.0)
    except (TypeError, ValueError):
        sup_override = 5.0
    base['super_override_max_radius_km'] = max(float(base.get('super_ds_radius', 4.0) or 4.0), sup_override)
    try:
        base['super_ds_radius'] = max(0.0, float(base.get('super_ds_radius', 4.0) or 4.0))
    except (TypeError, ValueError):
        base['super_ds_radius'] = 4.0
    try:
        graph_max_radius = float(base.get('exact_graph_max_radius_km', 10.0) or 10.0)
    except (TypeError, ValueError):
        graph_max_radius = 10.0
    base['exact_graph_max_radius_km'] = max(
        10.0,
        graph_max_radius,
        float(base['mini_ds_radius']),
        float(base['standard_exception_radius_km']),
        float(base['super_ds_radius']),
    )
    base['reuse_tier_edge_cache'] = bool(base.get('reuse_tier_edge_cache', True))
    base['meeting_fast_mode'] = bool(base.get('meeting_fast_mode', True))
    if base['meeting_fast_mode']:
        base['meeting_fast_defer_super'] = bool(base.get('meeting_fast_defer_super', True))
        raw_candidate_cap = base.get('exact_candidate_cap', '__missing__')
        allow_full_candidate_pool = bool(base.get('allow_full_exact_candidate_pool', False))
        if raw_candidate_cap is None and allow_full_candidate_pool:
            base['exact_candidate_cap'] = None
        else:
            try:
                candidate_cap = int(float(base.get('exact_candidate_cap', 5000) or 5000))
            except (TypeError, ValueError):
                candidate_cap = 5000
            base['exact_candidate_cap'] = max(500, candidate_cap)
        try:
            top_k = int(float(base.get('meeting_fast_override_top_k', 80) or 80))
        except (TypeError, ValueError):
            top_k = 80
        base['meeting_fast_override_top_k'] = max(10, top_k)
        base['meeting_fast_override_single_step'] = bool(base.get('meeting_fast_override_single_step', True))
        base['meeting_fast_skip_second_exception_pass'] = bool(base.get('meeting_fast_skip_second_exception_pass', True))
        try:
            target_pct = float(base.get('meeting_fast_target_coverage_pct', base.get('benchmark_near_full_coverage_pct', 99.7)) or 99.7)
        except (TypeError, ValueError):
            target_pct = 99.7
        base['meeting_fast_target_coverage_pct'] = min(100.0, max(90.0, target_pct))
        try:
            core_publish_pct = float(
                base.get(
                    'meeting_core_publish_coverage_pct',
                    base.get('meeting_fast_publish_coverage_pct', min(99.8, float(base['meeting_fast_target_coverage_pct']))),
                ) or 99.8
            )
        except (TypeError, ValueError):
            core_publish_pct = min(99.8, float(base['meeting_fast_target_coverage_pct']))
        base['meeting_core_publish_coverage_pct'] = min(100.0, max(95.0, core_publish_pct))
        try:
            gap_fill_cap = int(float(base.get('meeting_fast_max_standard_gap_fill_sites', 40) or 40))
        except (TypeError, ValueError):
            gap_fill_cap = 40
        base['meeting_fast_max_standard_gap_fill_sites'] = max(0, gap_fill_cap)
        base['meeting_fast_allow_standard_gap_satellites'] = bool(base.get('meeting_fast_allow_standard_gap_satellites', False))
        base['standard_rescue_enable'] = bool(base.get('standard_rescue_enable', True))
        raw_standard_total_hub_cap = base.get('standard_total_hub_cap', '__missing__')
        if raw_standard_total_hub_cap == '__missing__':
            base['standard_total_hub_cap'] = None
        elif raw_standard_total_hub_cap in ('', None):
            base['standard_total_hub_cap'] = None
        else:
            try:
                base['standard_total_hub_cap'] = max(0, int(float(raw_standard_total_hub_cap)))
            except (TypeError, ValueError):
                base['standard_total_hub_cap'] = None
        try:
            rescue_spacing = float(base.get('standard_rescue_spacing_km', 0.0) or 0.0)
        except (TypeError, ValueError):
            rescue_spacing = 0.0
        base['standard_rescue_spacing_km'] = max(0.0, rescue_spacing)
        try:
            rescue_penalty = float(base.get('standard_rescue_open_penalty_per_day', 25000.0) or 0.0)
        except (TypeError, ValueError):
            rescue_penalty = 25000.0
        base['standard_rescue_open_penalty_per_day'] = max(0.0, rescue_penalty)
        try:
            rescue_top_k = int(float(base.get('standard_rescue_seed_top_k', 8) or 8))
        except (TypeError, ValueError):
            rescue_top_k = 8
        base['standard_rescue_seed_top_k'] = max(1, rescue_top_k)
        try:
            rescue_handover_pct = float(
                base.get(
                    'standard_rescue_handover_coverage_pct',
                    min(99.4, float(base.get('meeting_fast_target_coverage_pct', 100.0) or 100.0)),
                ) or 99.4
            )
        except (TypeError, ValueError):
            rescue_handover_pct = 99.4
        base['standard_rescue_handover_coverage_pct'] = min(
            float(base['meeting_fast_target_coverage_pct']),
            max(90.0, rescue_handover_pct),
        )
        if base.get('meeting_fast_override_max_selected') in ('', None):
            base['meeting_fast_override_max_selected'] = None
        else:
            try:
                base['meeting_fast_override_max_selected'] = max(1, int(float(base.get('meeting_fast_override_max_selected'))))
            except (TypeError, ValueError):
                base['meeting_fast_override_max_selected'] = None
        try:
            override_target_pct = float(
                base.get(
                    'meeting_fast_override_target_coverage_pct',
                    base.get('meeting_core_publish_coverage_pct', base['meeting_fast_target_coverage_pct']),
                ) or base['meeting_fast_target_coverage_pct']
            )
        except (TypeError, ValueError):
            override_target_pct = float(base.get('meeting_core_publish_coverage_pct', base['meeting_fast_target_coverage_pct']))
        base['meeting_fast_override_target_coverage_pct'] = min(100.0, max(95.0, override_target_pct))
        try:
            exception_first_budget = float(
                base.get(
                    'exception_first_live_budget_seconds',
                    min(
                        150.0,
                        max(45.0, 0.25 * float(base.get('meeting_target_seconds', 600) or 600)),
                    ),
                ) or 0.0
            )
        except (TypeError, ValueError):
            exception_first_budget = 90.0
        base['exception_first_live_budget_seconds'] = max(15.0, exception_first_budget)
        try:
            exception_first_live_coverage = float(
                base.get(
                    'exception_first_live_min_coverage_pct',
                    min(99.7, float(base.get('meeting_fast_target_coverage_pct', 100.0) or 100.0)),
                ) or 99.7
            )
        except (TypeError, ValueError):
            exception_first_live_coverage = 99.7
        base['exception_first_live_min_coverage_pct'] = min(
            float(base['meeting_fast_target_coverage_pct']),
            max(95.0, exception_first_live_coverage),
        )
        try:
            exception_first_gap = float(base.get('exception_first_live_max_coverage_gap_pct', 0.15) or 0.15)
        except (TypeError, ValueError):
            exception_first_gap = 0.15
        base['exception_first_live_max_coverage_gap_pct'] = max(0.0, exception_first_gap)
        try:
            exception_first_extra_sites = int(float(base.get('exception_first_live_max_extra_physical_sites', 6) or 6))
        except (TypeError, ValueError):
            exception_first_extra_sites = 6
        base['exception_first_live_max_extra_physical_sites'] = max(0, exception_first_extra_sites)
        try:
            exception_first_override_top_k = int(float(base.get('exception_first_live_override_top_k', 32) or 32))
        except (TypeError, ValueError):
            exception_first_override_top_k = 32
        base['exception_first_live_override_top_k'] = max(8, exception_first_override_top_k)
        try:
            exception_first_override_max_selected = int(float(base.get('exception_first_live_max_selected', 32) or 32))
        except (TypeError, ValueError):
            exception_first_override_max_selected = 32
        base['exception_first_live_max_selected'] = max(4, exception_first_override_max_selected)
        try:
            exception_first_rescue_seed_top_k = int(float(base.get('exception_first_live_rescue_seed_top_k', 6) or 6))
        except (TypeError, ValueError):
            exception_first_rescue_seed_top_k = 6
        base['exception_first_live_rescue_seed_top_k'] = max(1, exception_first_rescue_seed_top_k)
    else:
        if base.get('exact_candidate_cap') in ('', None):
            base['exact_candidate_cap'] = None
        else:
            try:
                base['exact_candidate_cap'] = max(50, int(float(base.get('exact_candidate_cap'))))
            except (TypeError, ValueError):
                base['exact_candidate_cap'] = None
        base['meeting_fast_override_top_k'] = int(float(base.get('meeting_fast_override_top_k', 0) or 0))
        base['meeting_fast_override_single_step'] = bool(base.get('meeting_fast_override_single_step', False))
        base['meeting_fast_skip_second_exception_pass'] = bool(base.get('meeting_fast_skip_second_exception_pass', False))
        base['standard_rescue_enable'] = bool(base.get('standard_rescue_enable', False))
        if base.get('standard_total_hub_cap') in ('', None):
            base['standard_total_hub_cap'] = None
        else:
            try:
                base['standard_total_hub_cap'] = max(0, int(float(base.get('standard_total_hub_cap'))))
            except (TypeError, ValueError):
                base['standard_total_hub_cap'] = None
        try:
            rescue_spacing = float(base.get('standard_rescue_spacing_km', 0.0) or 0.0)
        except (TypeError, ValueError):
            rescue_spacing = 0.0
        base['standard_rescue_spacing_km'] = max(0.0, rescue_spacing)
        try:
            rescue_penalty = float(base.get('standard_rescue_open_penalty_per_day', 25000.0) or 0.0)
        except (TypeError, ValueError):
            rescue_penalty = 25000.0
        base['standard_rescue_open_penalty_per_day'] = max(0.0, rescue_penalty)
        try:
            rescue_top_k = int(float(base.get('standard_rescue_seed_top_k', 8) or 8))
        except (TypeError, ValueError):
            rescue_top_k = 8
        base['standard_rescue_seed_top_k'] = max(1, rescue_top_k)
        try:
            rescue_handover_pct = float(base.get('standard_rescue_handover_coverage_pct', 100.0) or 100.0)
        except (TypeError, ValueError):
            rescue_handover_pct = 100.0
        base['standard_rescue_handover_coverage_pct'] = min(
            float(base['meeting_fast_target_coverage_pct']),
            max(90.0, rescue_handover_pct),
        )
        if base.get('meeting_fast_override_max_selected') in ('', None):
            base['meeting_fast_override_max_selected'] = None
        else:
            try:
                base['meeting_fast_override_max_selected'] = max(1, int(float(base.get('meeting_fast_override_max_selected'))))
            except (TypeError, ValueError):
                base['meeting_fast_override_max_selected'] = None
        try:
            exception_first_budget = float(base.get('exception_first_live_budget_seconds', 90.0) or 0.0)
        except (TypeError, ValueError):
            exception_first_budget = 90.0
        base['exception_first_live_budget_seconds'] = max(15.0, exception_first_budget)
        try:
            exception_first_live_coverage = float(base.get('exception_first_live_min_coverage_pct', 99.7) or 99.7)
        except (TypeError, ValueError):
            exception_first_live_coverage = 99.7
        base['exception_first_live_min_coverage_pct'] = min(
            float(base['meeting_fast_target_coverage_pct']),
            max(95.0, exception_first_live_coverage),
        )
        try:
            exception_first_gap = float(base.get('exception_first_live_max_coverage_gap_pct', 0.15) or 0.15)
        except (TypeError, ValueError):
            exception_first_gap = 0.15
        base['exception_first_live_max_coverage_gap_pct'] = max(0.0, exception_first_gap)
        try:
            exception_first_extra_sites = int(float(base.get('exception_first_live_max_extra_physical_sites', 6) or 6))
        except (TypeError, ValueError):
            exception_first_extra_sites = 6
        base['exception_first_live_max_extra_physical_sites'] = max(0, exception_first_extra_sites)
        try:
            exception_first_override_top_k = int(float(base.get('exception_first_live_override_top_k', 32) or 32))
        except (TypeError, ValueError):
            exception_first_override_top_k = 32
        base['exception_first_live_override_top_k'] = max(8, exception_first_override_top_k)
        try:
            exception_first_override_max_selected = int(float(base.get('exception_first_live_max_selected', 32) or 32))
        except (TypeError, ValueError):
            exception_first_override_max_selected = 32
        base['exception_first_live_max_selected'] = max(4, exception_first_override_max_selected)
        try:
            exception_first_rescue_seed_top_k = int(float(base.get('exception_first_live_rescue_seed_top_k', 6) or 6))
        except (TypeError, ValueError):
            exception_first_rescue_seed_top_k = 6
        base['exception_first_live_rescue_seed_top_k'] = max(1, exception_first_rescue_seed_top_k)
    try:
        super_stride = int(float(base.get('super_geometry_demand_stride', 6 if base['meeting_fast_mode'] else 1) or (6 if base['meeting_fast_mode'] else 1)))
    except (TypeError, ValueError):
        super_stride = 6 if base['meeting_fast_mode'] else 1
    base['super_geometry_demand_stride'] = max(1, super_stride)
    try:
        super_top_k = int(float(base.get('super_geometry_top_k_demand', 1500 if base['meeting_fast_mode'] else 0) or (1500 if base['meeting_fast_mode'] else 0)))
    except (TypeError, ValueError):
        super_top_k = 1500 if base['meeting_fast_mode'] else 0
    base['super_geometry_top_k_demand'] = max(0, super_top_k)
    # Service radius is the same-tier spacing radius by default.
    base['mini_min_store_spacing_km'] = float(base['mini_ds_radius'])
    base['standard_min_store_spacing_km'] = float(base['standard_ds_radius'])
    base['super_min_store_spacing_km'] = float(base['super_ds_radius'])
    try:
        super_penalty = float(base.get('super_infra_penalty_per_day', 0) or 0)
    except (TypeError, ValueError):
        super_penalty = 0.0
    base['super_infra_penalty_per_day'] = max(0.0, super_penalty)
    try:
        super_fixed_penalty = float(base.get('super_fixed_penalty_per_order', 5) or 0)
    except (TypeError, ValueError):
        super_fixed_penalty = 5.0
    base['super_fixed_penalty_per_order'] = max(0.0, super_fixed_penalty)
    base['super_tail_preference'] = str(base.get('super_tail_preference') or 'prefer_standard').strip().lower()
    if base['super_tail_preference'] not in {'prefer_standard', 'cost_best', 'super_last_resort'}:
        base['super_tail_preference'] = 'prefer_standard'
    base['low_density_policy'] = str(base.get('low_density_policy') or 'flag_exclude').strip().lower()
    if base['low_density_policy'] not in {'flag_exclude', 'flag_only', 'always_serve'}:
        base['low_density_policy'] = 'flag_exclude'
    try:
        low_density_radius = float(base.get('low_density_radius_km', 5.0) or 5.0)
    except (TypeError, ValueError):
        low_density_radius = 5.0
    base['low_density_radius_km'] = max(0.1, low_density_radius)
    base['low_density_min_orders_per_day'] = _safe_min_orders_per_day(
        base, 'low_density_min_orders_per_day', 300
    )

    target_counts = {
        'mini': _safe_optional_count(base, 'mini_ds_target_count'),
        'standard': _safe_optional_count(base, 'standard_ds_target_count'),
        'super': _safe_optional_count(base, 'super_ds_target_count'),
    }
    for tier, count in target_counts.items():
        if count is not None:
            base[f'{tier}_ds_target_count'] = count
            base[f'{tier}_ds_max'] = count

    base['enforce_exact_tier_counts'] = any(v is not None for v in target_counts.values())
    if base['enforce_exact_tier_counts'] and base.get('target_max_hubs') is None:
        known_counts = [v for v in target_counts.values() if v is not None]
        if known_counts:
            base['target_max_hubs'] = int(sum(known_counts))
    if base.get('meeting_fast_mode'):
        fixed_store_mode = _effective_fixed_store_mode(base)
        if fixed_store_mode == 'clean_slate':
            base['strict_standard_base_target_coverage_pct'] = max(
                float(base.get('strict_standard_base_target_coverage_pct', 85.0) or 85.0),
                85.0,
            )
            base['strict_standard_base_gap_fill_cap'] = max(
                int(float(base.get('strict_standard_base_gap_fill_cap', 8) or 8)),
                8,
            )
            base['standard_rescue_seed_top_k'] = min(
                int(base.get('standard_rescue_seed_top_k', 8) or 8),
                5,
            )
            try:
                clean_handover = float(base.get('standard_rescue_handover_coverage_pct', 96.0) or 96.0)
            except (TypeError, ValueError):
                clean_handover = 96.0
            base['standard_rescue_handover_coverage_pct'] = min(
                float(base['meeting_fast_target_coverage_pct']),
                max(95.0, clean_handover),
            )
            try:
                exception_site_top_k = int(float(base.get('meeting_fast_exception_candidate_site_top_k', 48) or 48))
            except (TypeError, ValueError):
                exception_site_top_k = 48
            base['meeting_fast_exception_candidate_site_top_k'] = max(16, min(48, exception_site_top_k))
            try:
                clean_override_top_k = int(float(base.get('meeting_fast_override_top_k', 48) or 48))
            except (TypeError, ValueError):
                clean_override_top_k = 48
            base['meeting_fast_override_top_k'] = max(16, min(48, clean_override_top_k))
            current_max_selected = base.get('meeting_fast_override_max_selected')
            if current_max_selected in ('', None):
                base['meeting_fast_override_max_selected'] = 48
            else:
                try:
                    base['meeting_fast_override_max_selected'] = max(8, min(48, int(float(current_max_selected))))
                except (TypeError, ValueError):
                    base['meeting_fast_override_max_selected'] = 48
        else:
            if base.get('meeting_fast_exception_candidate_site_top_k') not in ('', None):
                try:
                    base['meeting_fast_exception_candidate_site_top_k'] = max(
                        16,
                        int(float(base.get('meeting_fast_exception_candidate_site_top_k'))),
                    )
                except (TypeError, ValueError):
                    base['meeting_fast_exception_candidate_site_top_k'] = None
    return base


def _effective_super_base_cost(params):
    return float(params.get('super_base_cost', 29) or 29) + float(params.get('super_fixed_penalty_per_order', 5) or 0)


def _super_overlay_only(params):
    return str((params or {}).get('super_role') or '').strip().lower() == 'overlay_core_only'


def _weighted_orders_in_radius(center_lat, center_lon, all_clat, all_clon, all_wts, radius_km):
    if len(all_clat) == 0:
        return 0.0, np.zeros(0, dtype=bool)
    dists = osrm_one_to_many(float(center_lat), float(center_lon), all_clat, all_clon)
    mask = dists <= float(radius_km) + 1e-5
    return float(all_wts[mask].sum()), mask


def _mini_density_gate(center_lat, center_lon, all_clat, all_clon, all_wts, params):
    density_radius = float(params.get('mini_density_radius_km', 1.0))
    density_min_orders = float(params.get('mini_density_min_orders_per_day', 400))
    density_orders, _ = _weighted_orders_in_radius(
        center_lat, center_lon, all_clat, all_clon, all_wts, density_radius
    )
    return {
        'eligible': density_orders + 1e-9 >= density_min_orders,
        'density_orders_per_day': round(density_orders, 2),
        'density_radius_km': round(density_radius, 2),
        'density_min_orders_per_day': round(density_min_orders, 2),
    }


def _current_policy_radius_km(params):
    return float(params.get('standard_ds_radius', 3.0) or 3.0)


def _compute_exception_bucket(weights, hard_served_mask, min_extra_distance_km, params):
    total_orders = float(np.sum(weights))
    hard_covered_orders = float(np.sum(weights[hard_served_mask]))
    hard_uncovered_mask = ~hard_served_mask
    hard_uncovered_orders = float(np.sum(weights[hard_uncovered_mask]))
    mode = str(params.get('coverage_mode') or 'hybrid').lower()
    max_pct = float(params.get('exception_max_pct', 0.25) or 0.25)
    max_extra = float(params.get('exception_max_extra_distance_km', 1.0) or 1.0)
    pct_cap_orders = total_orders * max(0.0, max_pct) / 100.0
    abs_cap = params.get('exception_max_orders_per_day')
    abs_cap = float(abs_cap) if abs_cap is not None else float('inf')
    allowed_orders = min(abs_cap, pct_cap_orders)

    eligible_mask = hard_uncovered_mask & np.isfinite(min_extra_distance_km) & (min_extra_distance_km <= max_extra + 1e-5)
    eligible_orders = float(np.sum(weights[eligible_mask]))
    used_mask = np.zeros(len(weights), dtype=bool)
    used_orders = 0.0
    if mode == 'hybrid' and allowed_orders > 0 and eligible_orders > 0:
        idx = np.where(eligible_mask)[0]
        idx = idx[np.argsort(min_extra_distance_km[idx])]
        running = 0.0
        chosen = []
        for i in idx:
            w = float(weights[i])
            if running + w <= allowed_orders + 1e-9:
                chosen.append(i)
                running += w
            else:
                break
        if chosen:
            used_mask[np.array(chosen, dtype=np.int64)] = True
            used_orders = running

    hybrid_covered_orders = hard_covered_orders + used_orders
    return {
        'mode': mode,
        'max_orders_per_day': None if not math.isfinite(abs_cap) else round(abs_cap, 2),
        'max_pct': round(max_pct, 3),
        'max_extra_distance_km': round(max_extra, 3),
        'allowed_orders_per_day': round(allowed_orders if math.isfinite(allowed_orders) else pct_cap_orders, 2),
        'eligible_orders_per_day': round(eligible_orders, 2),
        'used_orders_per_day': round(used_orders, 2),
        'remaining_hard_uncovered_orders_per_day': round(hard_uncovered_orders, 2),
        'remaining_after_hybrid_orders_per_day': round(max(0.0, hard_uncovered_orders - used_orders), 2),
        'feasible': hard_uncovered_orders <= used_orders + 1e-9,
        'selected_mask': used_mask,
        'hybrid_covered_orders_per_day': round(hybrid_covered_orders, 2),
    }


def _modeled_cost_summary(weights, proposed_costs, params, super_hub_count):
    total_orders = float(np.sum(weights))
    delivery_cost_per_day = float(np.sum(proposed_costs * weights))
    super_penalty_per_day = float(params.get('super_infra_penalty_per_day', 0) or 0) * float(super_hub_count)
    total_modeled_cost_per_day = delivery_cost_per_day + super_penalty_per_day
    avg_modeled_cost_per_order = total_modeled_cost_per_day / max(total_orders, 1e-9)
    return {
        'delivery_cost_per_day': delivery_cost_per_day,
        'super_penalty_cost_per_day': super_penalty_per_day,
        'total_modeled_cost_per_day': total_modeled_cost_per_day,
        'avg_modeled_cost_per_order': avg_modeled_cost_per_order,
    }


def _build_current_policy_breach_summary(grid_data, current_dists, weights, params):
    radius_km = _current_policy_radius_km(params)
    breach_mask = np.isfinite(current_dists) & (current_dists > radius_km + 1e-5)
    breach_orders = float(np.sum(weights[breach_mask]))
    total_orders = float(np.sum(weights))
    coverage_pct = 100.0 if total_orders <= 0 else 100.0 * (1.0 - breach_orders / max(total_orders, 1e-9))

    refs = None
    if 'primary_store_id' in grid_data.columns:
        refs = grid_data['primary_store_id'].fillna('unknown').astype(str).values
    else:
        refs = np.array([
            f"{float(a):.5f},{float(b):.5f}"
            for a, b in zip(grid_data['avg_store_lat'].values, grid_data['avg_store_lon'].values)
        ], dtype=object)

    grouped = {}
    for i in np.where(breach_mask)[0]:
        key = refs[i]
        item = grouped.setdefault(key, {
            'hub_id': key,
            'lat': float(grid_data['avg_store_lat'].iloc[i]),
            'lon': float(grid_data['avg_store_lon'].iloc[i]),
            'breach_orders_per_day': 0.0,
            'max_distance_km': 0.0,
            'max_extra_distance_km': 0.0,
        })
        item['breach_orders_per_day'] += float(weights[i])
        item['max_distance_km'] = max(item['max_distance_km'], float(current_dists[i]))
        item['max_extra_distance_km'] = max(item['max_extra_distance_km'], float(current_dists[i] - radius_km))

    hubs = sorted(grouped.values(), key=lambda x: (-x['breach_orders_per_day'], -x['max_extra_distance_km']))
    for item in hubs:
        item['breach_orders_per_day'] = round(item['breach_orders_per_day'], 2)
        item['max_distance_km'] = round(item['max_distance_km'], 3)
        item['max_extra_distance_km'] = round(item['max_extra_distance_km'], 3)

    return {
        'current_operational_coverage_pct': 100.0 if total_orders > 0 else 0.0,
        'current_policy_coverage_pct': round(coverage_pct, 2),
        'policy_breach_orders_per_day': round(breach_orders, 2),
        'policy_breach_radius_km': round(radius_km, 2),
        'policy_breach_hubs': hubs[:25],
    }


def _requested_tier_counts(params):
    return {
        'mini': _safe_optional_count(params, 'mini_ds_target_count'),
        'standard': _safe_optional_count(params, 'standard_ds_target_count'),
        'super': _safe_optional_count(params, 'super_ds_target_count'),
    }


def _build_exact_count_warnings(params, mini_ds, standard_ds, super_ds):
    requested = _requested_tier_counts(params)
    actual = {
        'mini': len(mini_ds),
        'standard': len(standard_ds),
        'super': len(super_ds),
    }
    labels = {'mini': 'Mini', 'standard': 'Standard', 'super': 'Super'}
    warnings = []
    for tier in ('mini', 'standard', 'super'):
        req = requested[tier]
        if req is None:
            continue
        got = actual[tier]
        if got < req:
            lo, hi = _tier_min_max_orders(params, tier)
            radius = params.get(f'{tier}_ds_radius')
            warnings.append(
                f"Requested exactly {req} {labels[tier]} hub(s) but only {got} met the current "
                f"radius/order-band constraints (radius {radius} km, {int(lo)}-{int(hi)} orders/day)."
            )
    return warnings, requested, actual


def _ensure_grid_idx(df):
    if df is None:
        return df
    if '_grid_idx' in df.columns:
        return df.copy()
    out = df.copy().reset_index(drop=False)
    out = out.rename(columns={'index': '_grid_idx'})
    return out


def _context_positions_for_grid(context, grid_df):
    if context is None or grid_df is None:
        return None
    df = _ensure_grid_idx(grid_df)
    mapping = context.get('grid_idx_to_context_idx') or {}
    if mapping:
        grid_idx = df['_grid_idx'].values.astype(np.int64)
        positions = np.empty(len(grid_idx), dtype=np.int64)
        for i, raw_idx in enumerate(grid_idx):
            pos = mapping.get(int(raw_idx))
            if pos is None:
                return None
            positions[i] = int(pos)
        return positions
    demand_count = int(context.get('demand_count', len(df)) or len(df))
    if len(df) == demand_count:
        return np.arange(len(df), dtype=np.int64)
    return None


def _mask_for_grid_from_cached_seed(context, seed_lat, seed_lon, grid_df, radius_km):
    full_mask = _distance_mask_from_cached_seed(context, seed_lat, seed_lon, None, radius_km)
    if full_mask is None:
        return None
    positions = _context_positions_for_grid(context, grid_df)
    if positions is None:
        return None
    return full_mask[positions]


def find_mini_ds(grid_data, params):
    """Greedy clustering for Mini DS on the full grid; cluster orders must be in [min, max]."""
    mini_list = []
    remaining = _ensure_grid_idx(grid_data)
    min_density, max_density = _tier_min_max_orders(params, 'mini')
    radius = params.get('mini_ds_radius', 1.0)
    spacing_km = _tier_spacing_radius(params, 'mini')
    max_hubs = params.get('mini_ds_max', 200)
    meeting_fast_mode = bool((params or {}).get('meeting_fast_mode', False))
    try:
        meeting_seed_top_k = int(float((params or {}).get('meeting_fast_mini_seed_top_k', 6000 if meeting_fast_mode else 0) or 0))
    except (TypeError, ValueError):
        meeting_seed_top_k = 6000 if meeting_fast_mode else 0
    all_clat = grid_data['cell_lat'].values.astype(np.float64)
    all_clon = grid_data['cell_lon'].values.astype(np.float64)
    all_wts = grid_data['orders_per_day'].values.astype(np.float64)
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    if cached_context is None and bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius) or radius) >= float(radius) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None

    remaining = remaining.sort_values('orders_per_day', ascending=False).reset_index(drop=True)
    if meeting_seed_top_k > 0 and len(remaining) > meeting_seed_top_k:
        remaining = remaining.iloc[:meeting_seed_top_k].reset_index(drop=True)
    for _ in range(max_hubs + 100):
        if len(remaining) == 0:
            break
        best_idx = remaining['orders_per_day'].idxmax()
        best = remaining.loc[best_idx]
        if best['orders_per_day'] < min_density * 0.1:
            break

        mask = None
        if cached_context is not None:
            mask = _mask_for_grid_from_cached_seed(
                cached_context,
                float(best['cell_lat']),
                float(best['cell_lon']),
                remaining,
                radius,
            )
        if mask is None:
            dists = osrm_one_to_many(
                float(best['cell_lat']), float(best['cell_lon']),
                remaining['cell_lat'].values, remaining['cell_lon'].values
            )
            mask = dists <= radius
        cluster = remaining[mask]
        cluster_orders = cluster['orders_per_day'].sum()

        if cluster_orders < min_density:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue
        if cluster_orders > max_density:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue

        w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / cluster_orders
        w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / cluster_orders
        if cached_context is not None and len(cluster) > 0:
            cluster_lats = cluster['cell_lat'].values.astype(np.float64)
            cluster_lons = cluster['cell_lon'].values.astype(np.float64)
            snap_pos = int(np.argmin((cluster_lats - float(w_lat)) ** 2 + (cluster_lons - float(w_lon)) ** 2))
            w_lat = float(cluster_lats[snap_pos])
            w_lon = float(cluster_lons[snap_pos])
        density_gate = _mini_density_gate(w_lat, w_lon, all_clat, all_clon, all_wts, params)
        if not density_gate['eligible']:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue
        if _violates_same_tier_spacing(float(w_lat), float(w_lon), mini_list, spacing_km):
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue

        mini_list.append({
            'lat': float(w_lat), 'lon': float(w_lon),
            'orders_per_day': float(cluster_orders),
            'radius_km': radius, 'type': 'mini',
            'cells': int(len(cluster)),
            'selection': '4k',
            'density_orders_per_day': density_gate['density_orders_per_day'],
            'density_radius_km': density_gate['density_radius_km'],
            'density_min_orders_per_day': density_gate['density_min_orders_per_day'],
        })
        remaining = remaining[~mask].reset_index(drop=True)

        if len(mini_list) >= max_hubs:
            break

    return mini_list, remaining


def fill_mini_coverage_gaps(grid_data, mini_list, params):
    """Optional spatial fill: add Minis only if catchment orders are within [mini min, mini max].

    Caller must set ``mini_coverage_fill`` true. Rejects seeds that cannot satisfy order bounds.
    """
    if grid_data is None or len(grid_data) == 0:
        return mini_list

    min_o, max_o = _tier_min_max_orders(params, 'mini')
    radius = float(params.get('mini_ds_radius', 1.0))
    spacing_km = _tier_spacing_radius(params, 'mini')
    max_primary = int(params.get('mini_ds_max', 200))
    extra_cap = int(params.get('coverage_fill_max_extra', 500))
    hard_cap = max_primary + extra_cap

    mini_list = list(mini_list)
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    fixed_context = (params or {}).get('_cached_fixed_site_context')
    if cached_context is None and bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius) or radius) >= float(radius) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None

    def _min_d_to_minis(mlist):
        if not mlist:
            return np.full(n, np.inf)
        cached = _cached_min_distances_for_hubs(grid_data, mlist, params, radius, 'mini_fill')
        if cached is not None:
            return cached
        hl = np.array([h['lat'] for h in mlist], dtype=np.float64)
        ho = np.array([h['lon'] for h in mlist], dtype=np.float64)
        return osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)

    min_d = _min_d_to_minis(mini_list)

    added = 0
    it = 0
    failed = set()
    while it < n + 200 and len(mini_list) < hard_cap:
        uncovered = min_d > radius + 1e-5
        if not np.any(uncovered):
            break
        uw = np.where(uncovered, wts, -np.inf)
        for fi in failed:
            uw[fi] = -np.inf
        bi = int(np.argmax(uw))
        if not np.isfinite(uw[bi]) or uw[bi] < 0:
            break
        seed_lat, seed_lon = clat[bi], clon[bi]
        ball = None
        if cached_context is not None:
            ball = _distance_mask_from_cached_seed(cached_context, seed_lat, seed_lon, n, radius)
        if ball is None:
            dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
            ball = dists <= radius
        ball = ball & uncovered
        co = float(wts[ball].sum())
        if co < 1e-9:
            lat, lon = float(seed_lat), float(seed_lon)
            co = float(wts[bi])
            ncells = 1
        else:
            lat = float((clat[ball] * wts[ball]).sum() / co)
            lon = float((clon[ball] * wts[ball]).sum() / co)
            ncells = int(ball.sum())
        if cached_context is not None and np.any(ball):
            ball_idx = np.where(ball)[0]
            snap_pos = int(np.argmin((clat[ball_idx] - lat) ** 2 + (clon[ball_idx] - lon) ** 2))
            lat = float(clat[ball_idx][snap_pos])
            lon = float(clon[ball_idx][snap_pos])

        if co < min_o or co > max_o:
            failed.add(bi)
            it += 1
            if len(failed) > min(n, 5000):
                logger.warning('Mini coverage fill: stopping after many invalid catchments.')
                break
            continue
        density_gate = _mini_density_gate(lat, lon, clat, clon, wts, params)
        if not density_gate['eligible']:
            failed.add(bi)
            it += 1
            continue
        if _violates_same_tier_spacing(lat, lon, mini_list, spacing_km):
            failed.add(bi)
            it += 1
            continue

        failed.clear()
        mini_list.append({
            'lat': lat, 'lon': lon,
            'orders_per_day': co,
            'radius_km': radius,
            'type': 'mini',
            'cells': ncells,
            'selection': '4k',
            'coverage_fill': True,
            'density_orders_per_day': density_gate['density_orders_per_day'],
            'density_radius_km': density_gate['density_radius_km'],
            'density_min_orders_per_day': density_gate['density_min_orders_per_day'],
        })
        cached_new = _cached_min_distances_for_hubs(
            grid_data,
            [{'lat': lat, 'lon': lon}],
            params,
            radius,
            'mini_fill_incremental',
        )
        d_new = cached_new if cached_new is not None else osrm_min_distances_parallel(
            clat, clon, np.array([lat]), np.array([lon]), progress_cb=None
        )
        min_d = np.minimum(min_d, d_new)
        added += 1
        it += 1

    if added:
        logger.info(f"Coverage fill: added {added} Mini DS hub(s) (cap {hard_cap}).")
    return mini_list


def grid_after_mini_service(grid_data, mini_ds, radius_km):
    """Grid rows whose cell center is farther than radius_km (road, OSRM) from every Mini hub."""
    if grid_data is None or len(grid_data) == 0:
        return grid_data
    if not mini_ds:
        return grid_data.copy()
    clat = grid_data['cell_lat'].values
    clon = grid_data['cell_lon'].values
    cached = _cached_min_distances_for_hubs(grid_data, mini_ds, {'exact_graph_max_radius_km': radius_km, 'reuse_tier_edge_cache': True}, radius_km, 'mini_grid_after')
    if cached is not None:
        min_d = cached
    else:
        hl = np.array([h['lat'] for h in mini_ds], dtype=np.float64)
        ho = np.array([h['lon'] for h in mini_ds], dtype=np.float64)
        min_d = osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)
    mask = min_d > float(radius_km) + 1e-5
    return grid_data[mask].copy()


def weighted_kmeans(points, weights, k, max_iters=30):
    """Weighted K-means with K-means++ init."""
    if k <= 0 or len(points) == 0:
        return np.array([]), np.array([])
    k = min(k, len(points))
    rng = np.random.default_rng(42)
    centroids = np.zeros((k, 2))
    centroids[0] = points[rng.choice(len(points), p=weights/weights.sum())]
    for c in range(1, k):
        d = np.min([np.sum((points - centroids[j])**2, axis=1) for j in range(c)], axis=0)
        probs = d * weights
        probs /= probs.sum()
        centroids[c] = points[rng.choice(len(points), p=probs)]
    for _ in range(max_iters):
        d = np.sqrt(((points[:, None, :] - centroids[None, :, :])**2).sum(axis=2))
        assign = np.argmin(d, axis=1)
        new_c = np.zeros_like(centroids)
        for j in range(k):
            m = assign == j
            if m.sum() > 0:
                w = weights[m]
                new_c[j] = (points[m] * w[:, None]).sum(axis=0) / w.sum()
            else:
                new_c[j] = centroids[j]
        if np.allclose(centroids, new_c, atol=1e-6):
            break
        centroids = new_c
    return centroids, assign

def find_standard_ds(grid_data, params):
    """Standard DS (~15k SKUs): greedy on full grid; cluster orders in [min, max]."""
    if len(grid_data) == 0:
        return [], grid_data

    min_orders, max_orders = _tier_min_max_orders(params, 'standard')
    radius = params.get('standard_ds_radius', 2.5)
    spacing_km = _tier_spacing_radius(params, 'standard')
    max_hubs = params.get('standard_ds_max', 200)
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    spacing_reference_hubs = list((params or {}).get('_existing_standard_spacing_hubs') or [])
    if cached_context is None and bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius) or radius) >= float(radius) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None

    std_list = []
    remaining = _ensure_grid_idx(grid_data).sort_values('orders_per_day', ascending=False).reset_index(drop=True).copy()

    for _ in range(max_hubs + 100):
        if len(remaining) == 0:
            break

        best_idx = remaining['orders_per_day'].idxmax()
        best = remaining.loc[best_idx]
        if best['orders_per_day'] < min_orders * 0.1:
            break

        mask = None
        if cached_context is not None:
            mask = _mask_for_grid_from_cached_seed(
                cached_context,
                float(best['cell_lat']),
                float(best['cell_lon']),
                remaining,
                radius,
            )
        if mask is None:
            dists = osrm_one_to_many(
                float(best['cell_lat']), float(best['cell_lon']),
                remaining['cell_lat'].values, remaining['cell_lon'].values
            )
            mask = dists <= radius
        cluster = remaining[mask]
        if len(cluster) == 0:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue

        co = cluster['orders_per_day'].sum()
        if co < min_orders:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue
        if co > max_orders:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue

        w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / co
        w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / co
        if cached_context is not None and len(cluster) > 0:
            cluster_lats = cluster['cell_lat'].values.astype(np.float64)
            cluster_lons = cluster['cell_lon'].values.astype(np.float64)
            snap_pos = int(np.argmin((cluster_lats - float(w_lat)) ** 2 + (cluster_lons - float(w_lon)) ** 2))
            w_lat = float(cluster_lats[snap_pos])
            w_lon = float(cluster_lons[snap_pos])
        if _violates_same_tier_spacing(float(w_lat), float(w_lon), spacing_reference_hubs + std_list, spacing_km):
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue
        std_list.append({
            'lat': float(w_lat), 'lon': float(w_lon),
            'orders_per_day': float(co),
            'radius_km': radius,
            'type': 'standard',
            'cells': int(len(cluster)),
            'selection': '15k'
        })

        remaining = remaining[~mask].reset_index(drop=True)
        if len(std_list) >= max_hubs:
            break

    return std_list, remaining


def find_super_ds(grid_data, params):
    """Super DS (~30k SKUs): greedy on full grid; cluster orders in [min, max]."""
    if len(grid_data) == 0:
        return [], grid_data
    if str(params.get('super_role') or 'backbone_tail').lower() in {'backbone_tail', 'overlay_core_only'}:
        return [], grid_data.copy()

    min_orders, max_orders = _tier_min_max_orders(params, 'super')
    radius = params.get('super_ds_radius', 4.0)
    spacing_km = _tier_spacing_radius(params, 'super')
    max_hubs = params.get('super_ds_max', 120)
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    if cached_context is None and bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius) or radius) >= float(radius) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None

    super_list = []
    remaining = _ensure_grid_idx(grid_data).sort_values('orders_per_day', ascending=False).reset_index(drop=True).copy()

    for _ in range(max_hubs + 100):
        if len(remaining) == 0:
            break

        best_idx = remaining['orders_per_day'].idxmax()
        best = remaining.loc[best_idx]
        if best['orders_per_day'] < min_orders * 0.1:
            break

        mask = None
        if cached_context is not None:
            mask = _mask_for_grid_from_cached_seed(
                cached_context,
                float(best['cell_lat']),
                float(best['cell_lon']),
                remaining,
                radius,
            )
        if mask is None:
            dists = osrm_one_to_many(
                float(best['cell_lat']), float(best['cell_lon']),
                remaining['cell_lat'].values, remaining['cell_lon'].values
            )
            mask = dists <= radius
        cluster = remaining[mask]
        if len(cluster) == 0:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue

        co = cluster['orders_per_day'].sum()
        if co < min_orders:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue
        if co > max_orders:
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue

        w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / co
        w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / co
        if cached_context is not None and len(cluster) > 0:
            cluster_lats = cluster['cell_lat'].values.astype(np.float64)
            cluster_lons = cluster['cell_lon'].values.astype(np.float64)
            snap_pos = int(np.argmin((cluster_lats - float(w_lat)) ** 2 + (cluster_lons - float(w_lon)) ** 2))
            w_lat = float(cluster_lats[snap_pos])
            w_lon = float(cluster_lons[snap_pos])
        if _violates_same_tier_spacing(float(w_lat), float(w_lon), super_list, spacing_km):
            remaining = remaining.drop(best_idx).reset_index(drop=True)
            continue
        super_list.append({
            'lat': float(w_lat), 'lon': float(w_lon),
            'orders_per_day': float(co),
            'radius_km': radius,
            'type': 'super',
            'cells': int(len(cluster)),
            'selection': '30k'
        })

        remaining = remaining[~mask].reset_index(drop=True)
        if len(super_list) >= max_hubs:
            break

    return super_list, remaining


def fill_super_core_coverage(grid_data, super_ds, params, progress_cb=None):
    """Ensure Super service radius covers every grid cell in **core** GeoJSON, excluding **island** polygons."""
    core_gj = parse_geojson_string(params.get('super_core_must_cover_geojson') or '')
    excl_gj = parse_geojson_string(params.get('super_exclude_geojson') or '')
    if not core_gj:
        return super_ds
    core_polys = polygons_from_geojson(core_gj)
    exclude_polys = polygons_from_geojson(excl_gj) if excl_gj else []
    if not core_polys:
        return super_ds

    radius = float(params.get('super_ds_radius', 4.0))
    spacing_km = _tier_spacing_radius(params, 'super')
    max_hubs = int(params.get('super_ds_max', 120))
    super_list = list(super_ds)
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    if cached_context is None and bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius) or radius) >= float(radius) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None

    def min_d_super():
        if not super_list:
            return np.full(n, np.inf)
        cached = _cached_min_distances_for_hubs(grid_data, super_list, params, radius, 'super_core_fill')
        if cached is not None:
            return cached
        hl = np.array([h['lat'] for h in super_list], dtype=np.float64)
        ho = np.array([h['lon'] for h in super_list], dtype=np.float64)
        return osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)

    overlay_super = _super_overlay_only(params)
    min_o, max_o = _tier_min_max_orders(params, 'super')
    added = 0
    failed = set()
    it = 0
    while it < n + 100:
        if len(super_list) >= max_hubs:
            break
        md = min_d_super()
        need = np.zeros(n, dtype=bool)
        for i in range(n):
            if not cell_needs_super_core_coverage(clat[i], clon[i], core_polys, exclude_polys):
                continue
            if md[i] > radius + 1e-5:
                need[i] = True
        if not np.any(need):
            break
        uw = np.where(need, wts, -np.inf)
        for fi in failed:
            uw[fi] = -np.inf
        bi = int(np.argmax(uw))
        if not np.isfinite(uw[bi]) or uw[bi] < 0:
            break
        seed_lat, seed_lon = clat[bi], clon[bi]
        ball = None
        if cached_context is not None:
            ball = _distance_mask_from_cached_seed(cached_context, seed_lat, seed_lon, n, radius)
        if ball is None:
            dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
            ball = dists <= radius
        ball = ball & need
        co = float(wts[ball].sum())
        if co < 1e-9:
            lat, lon = float(seed_lat), float(seed_lon)
            co = float(wts[bi])
            ncells = 1
        else:
            lat = float((clat[ball] * wts[ball]).sum() / co)
            lon = float((clon[ball] * wts[ball]).sum() / co)
            ncells = int(ball.sum())
        if cached_context is not None and np.any(ball):
            ball_idx = np.where(ball)[0]
            snap_pos = int(np.argmin((clat[ball_idx] - lat) ** 2 + (clon[ball_idx] - lon) ** 2))
            lat = float(clat[ball_idx][snap_pos])
            lon = float(clon[ball_idx][snap_pos])
        if (not overlay_super) and (co < min_o or co > max_o):
            failed.add(bi)
            it += 1
            if len(failed) > min(n, 5000):
                logger.warning('Super core fill: stopping after many invalid Super catchments.')
                break
            continue
        if _violates_same_tier_spacing(lat, lon, super_list, spacing_km):
            failed.add(bi)
            it += 1
            continue
        failed.clear()
        super_list.append({
            'lat': lat, 'lon': lon,
            'orders_per_day': co,
            'radius_km': radius,
            'type': 'super',
            'cells': ncells,
            'selection': '30k',
            'core_coverage_fill': True,
            'overlay_core_only': overlay_super,
        })
        added += 1
        it += 1
        if progress_cb:
            progress_cb(f"Super core coverage: added satellite {added}...")
    if added:
        logger.info(f"Super core coverage fill: added {added} Super hub(s).")
    return super_list


def ensure_full_network_coverage(grid_data, mini_ds, standard_ds, super_ds, params, progress_cb=None):
    """Add Mini / Standard / Super hubs (OSRM only) until every grid cell lies within at least one
    tier's road-distance service radius. Primary tries [min,max] cluster orders; if impossible,
    adds ``coverage_satellite`` hubs (still excluded from strict min/max in sanitize).

    Respects ``mini_ds_max``, ``standard_ds_max``, ``super_ds_max`` caps; if caps prevent full
    coverage, stops and logs an error.
    """
    if grid_data is None or len(grid_data) == 0:
        return list(mini_ds), list(standard_ds), list(super_ds), {'coverage_satellites': 0, 'coverage_complete': True}

    mini_ds = list(mini_ds)
    standard_ds = list(standard_ds)
    super_ds = list(super_ds)

    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)

    rmini = float(params.get('mini_ds_radius', 1.0))
    rstd = float(params.get('standard_ds_radius', 2.5))
    rsup = float(params.get('super_ds_radius', 4.0))
    spmini = _tier_spacing_radius(params, 'mini')
    spstd = _tier_spacing_radius(params, 'standard')
    spsup = _tier_spacing_radius(params, 'super')

    m_lo, m_hi = _tier_min_max_orders(params, 'mini')
    s_lo, s_hi = _tier_min_max_orders(params, 'standard')
    p_lo, p_hi = _tier_min_max_orders(params, 'super')

    max_m = int(params.get('mini_ds_max', 200))
    max_s = int(params.get('standard_ds_max', 200))
    max_p = int(params.get('super_ds_max', 120))

    def _min_d(hlist):
        if not hlist:
            return np.full(n, np.inf)
        radius_hint = max(rmini, rstd, rsup)
        cached = _cached_min_distances_for_hubs(grid_data, hlist, params, radius_hint, f"coverage_{hlist[0].get('type', 'tier')}")
        if cached is not None:
            return cached
        hl = np.array([h['lat'] for h in hlist], dtype=np.float64)
        ho = np.array([h['lon'] for h in hlist], dtype=np.float64)
        return osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)

    cached_context = None
    radius_hint = max(rmini, rstd, rsup)
    if bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius_hint) or radius_hint) >= float(radius_hint) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None

    # Incremental min-distances per tier — recomputing all hubs every iteration was the main cost.
    dm = _min_d(mini_ds)
    ds = _min_d(standard_ds)
    dp = _min_d(super_ds)

    overlay_super = _super_overlay_only(params)

    def _cov_mask():
        if overlay_super:
            return (dm <= rmini + 1e-5) | (ds <= rstd + 1e-5)
        return (dm <= rmini + 1e-5) | (ds <= rstd + 1e-5) | (dp <= rsup + 1e-5)

    coverage_satellites = 0
    failed = set()
    max_iters = n + 400

    for it in range(max_iters):
        cov = _cov_mask()
        if np.all(cov):
            return mini_ds, standard_ds, super_ds, {'coverage_satellites': coverage_satellites, 'coverage_complete': True}

        uncovered = ~cov
        uw = np.where(uncovered, wts, -np.inf)
        for fi in failed:
            uw[fi] = -np.inf
        bi = int(np.argmax(uw))
        if not np.isfinite(uw[bi]) or uw[bi] < 0:
            logger.error('Full coverage: no valid uncovered seed (failed set exhausted).')
            return mini_ds, standard_ds, super_ds, {'coverage_satellites': coverage_satellites, 'coverage_complete': False}

        seed_lat, seed_lon = float(clat[bi]), float(clon[bi])
        if cached_context is not None:
            cached_ball_mask = _distance_mask_from_cached_seed(cached_context, seed_lat, seed_lon, n, radius_hint)
            if cached_ball_mask is not None:
                cached_dists = np.full(n, np.inf, dtype=np.float64)
                site_idx = cached_context['coord_to_site_idx'].get(_rounded_site_key(seed_lat, seed_lon))
                if site_idx is not None:
                    for demand_idx, dist in _site_demand_pairs_from_context(cached_context, site_idx) or ():
                        cached_dists[int(demand_idx)] = float(dist)
                    dists = cached_dists
                else:
                    dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
            else:
                dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
        else:
            dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)

        def ball_orders(radius_km):
            """Demand in OSRM ball; hub placed **at seed** so the seed cell is always served."""
            ball = dists <= float(radius_km) + 1e-5
            co = float(wts[ball].sum())
            if co < 1e-12:
                co = float(wts[bi])
                ncells = 1
            else:
                ncells = int(ball.sum())
            return co, seed_lat, seed_lon, ncells, ball

        placed = False

        super_role = str(params.get('super_role') or 'overlay_core_only').lower()
        if super_role in {'backbone_tail', 'overlay_core_only'}:
            trials = [
                ('standard', rstd, s_lo, s_hi, standard_ds, max_s, '15k'),
                ('mini', rmini, m_lo, m_hi, mini_ds, max_m, '4k'),
            ]
        else:
            trials = [
                ('super', rsup, p_lo, p_hi, super_ds, max_p, '30k'),
                ('standard', rstd, s_lo, s_hi, standard_ds, max_s, '15k'),
                ('mini', rmini, m_lo, m_hi, mini_ds, max_m, '4k'),
            ]
        for tier_name, rad, lo, hi, hlist, cap, sel in trials:
            if len(hlist) >= cap:
                continue
            co, lat, lon, ncells, _ = ball_orders(rad)
            if lo <= co <= hi:
                spacing_km = spmini if tier_name == 'mini' else spstd if tier_name == 'standard' else spsup
                if _violates_same_tier_spacing(lat, lon, hlist, spacing_km):
                    continue
                hub = {
                    'lat': lat, 'lon': lon,
                    'orders_per_day': co,
                    'radius_km': rad,
                    'type': tier_name,
                    'cells': ncells,
                    'selection': sel,
                }
                if tier_name == 'super':
                    super_ds.append(hub)
                    dp = np.minimum(dp, dists)
                elif tier_name == 'standard':
                    standard_ds.append(hub)
                    ds = np.minimum(ds, dists)
                else:
                    mini_ds.append(hub)
                    dm = np.minimum(dm, dists)
                placed = True
                failed.clear()
                if progress_cb:
                    progress_cb(f"Full coverage: added {tier_name} DS (strict band)…")
                logger.info(
                    'Full coverage: +1 %s DS (strict), %d uncovered cells remaining approx.',
                    tier_name,
                    int(np.sum(~_cov_mask())),
                )
                break

        if not placed:
            # Relax: add Super at seed ball so this cell is covered (largest radius)
            if super_role == 'backbone_tail' and len(standard_ds) < max_s:
                co, lat, lon, ncells, _ = ball_orders(rstd)
                if _violates_same_tier_spacing(lat, lon, standard_ds, spstd):
                    failed.add(bi)
                    continue
                standard_ds.append({
                    'lat': lat, 'lon': lon,
                    'orders_per_day': max(co, float(wts[bi])),
                    'radius_km': rstd,
                    'type': 'standard',
                    'cells': max(ncells, 1),
                    'selection': '15k',
                    'coverage_satellite': True,
                })
                ds = np.minimum(ds, dists)
                coverage_satellites += 1
                failed.clear()
                placed = True
                if progress_cb:
                    progress_cb("Full coverage: added Standard satellite (relax min)…")
            elif super_role not in {'backbone_tail', 'overlay_core_only'} and len(super_ds) < max_p:
                co, lat, lon, ncells, _ = ball_orders(rsup)
                if _violates_same_tier_spacing(lat, lon, super_ds, spsup):
                    failed.add(bi)
                    continue
                super_ds.append({
                    'lat': lat, 'lon': lon,
                    'orders_per_day': max(co, float(wts[bi])),
                    'radius_km': rsup,
                    'type': 'super',
                    'cells': max(ncells, 1),
                    'selection': '30k',
                    'coverage_satellite': True,
                })
                dp = np.minimum(dp, dists)
                coverage_satellites += 1
                failed.clear()
                placed = True
                logger.warning(
                    'Full coverage: added Super coverage_satellite (orders=%.1f) below strict Super min — required to cover gap.',
                    max(co, float(wts[bi])),
                )
                if progress_cb:
                    progress_cb(f"Full coverage: added Super satellite (relax min)…")
            elif len(standard_ds) < max_s:
                co, lat, lon, ncells, _ = ball_orders(rstd)
                if _violates_same_tier_spacing(lat, lon, standard_ds, spstd):
                    failed.add(bi)
                    continue
                standard_ds.append({
                    'lat': lat, 'lon': lon,
                    'orders_per_day': max(co, float(wts[bi])),
                    'radius_km': rstd,
                    'type': 'standard',
                    'cells': max(ncells, 1),
                    'selection': '15k',
                    'coverage_satellite': True,
                })
                ds = np.minimum(ds, dists)
                coverage_satellites += 1
                failed.clear()
                placed = True
                if progress_cb:
                    progress_cb("Full coverage: added Standard satellite (relax min)…")
            elif len(mini_ds) < max_m:
                co, lat, lon, ncells, _ = ball_orders(rmini)
                if _violates_same_tier_spacing(lat, lon, mini_ds, spmini):
                    failed.add(bi)
                    continue
                mini_ds.append({
                    'lat': lat, 'lon': lon,
                    'orders_per_day': max(co, float(wts[bi])),
                    'radius_km': rmini,
                    'type': 'mini',
                    'cells': max(ncells, 1),
                    'selection': '4k',
                    'coverage_satellite': True,
                })
                dm = np.minimum(dm, dists)
                coverage_satellites += 1
                failed.clear()
                placed = True
                if progress_cb:
                    progress_cb("Full coverage: added Mini satellite (relax min)…")
            else:
                logger.error(
                    'Full coverage: tier caps reached (mini=%d/%d std=%d/%d super=%d/%d) but grid still uncovered.',
                    len(mini_ds), max_m, len(standard_ds), max_s, len(super_ds), max_p,
                )
                return mini_ds, standard_ds, super_ds, {'coverage_satellites': coverage_satellites, 'coverage_complete': False}

        if not placed:
            failed.add(bi)
            if len(failed) > min(n, 8000):
                logger.error('Full coverage: too many failed seeds; aborting.')
                return mini_ds, standard_ds, super_ds, {'coverage_satellites': coverage_satellites, 'coverage_complete': False}

    logger.error('Full coverage: iteration cap reached.')
    return mini_ds, standard_ds, super_ds, {'coverage_satellites': coverage_satellites, 'coverage_complete': False}


def place_overlapping_tier_hubs(grid_data, params, progress_cb=None):
    """Place Mini, Standard, Super each on the full grid; optional Mini coverage fill; Super core GeoJSON."""
    require_osrm()
    params = normalize_placement_params(params)
    n_cells = len(grid_data) if grid_data is not None else 0
    t_all = time.time()

    if progress_cb:
        progress_cb(
            f"Placing Mini DS (OSRM): {n_cells:,} grid cells — this tier scans the full grid…"
        )
    t0 = time.time()
    mini_ds, remaining_after_mini_greedy = find_mini_ds(grid_data, params)
    logger.info(
        "Placement Mini: %d hubs, %d cells in grid, %.1fs",
        len(mini_ds), n_cells, time.time() - t0,
    )

    n0 = len(mini_ds)
    coverage_minis_added = 0
    if params.get('mini_coverage_fill', False):
        if progress_cb:
            progress_cb("Mini coverage fill (OSRM, optional)…")
        t0 = time.time()
        mini_ds = fill_mini_coverage_gaps(grid_data, mini_ds, params)
        coverage_minis_added = len(mini_ds) - n0
        logger.info("Mini coverage fill: +%d hubs in %.1fs", coverage_minis_added, time.time() - t0)

    if progress_cb:
        progress_cb(
            f"Placing Standard DS (OSRM): {n_cells:,} grid cells — full grid again (overlapping tiers)…"
        )
    t0 = time.time()
    standard_ds, _ = find_standard_ds(grid_data, params)
    logger.info(
        "Placement Standard: %d hubs, %.1fs",
        len(standard_ds), time.time() - t0,
    )

    if progress_cb:
        progress_cb(
            f"Placing Super DS (OSRM): {n_cells:,} grid cells — full grid again…"
        )
    t0 = time.time()
    super_ds, _ = find_super_ds(grid_data, params)
    logger.info("Placement Super: %d hubs, %.1fs", len(super_ds), time.time() - t0)

    t0 = time.time()
    super_ds = fill_super_core_coverage(grid_data, super_ds, params, progress_cb=progress_cb)
    _dt_core = time.time() - t0
    if _dt_core > 0.5:
        logger.info("Super core GeoJSON fill: %.1fs", _dt_core)

    cov_meta = {'coverage_satellites': 0, 'coverage_complete': True}
    if params.get('require_full_tier_coverage', True):
        if progress_cb:
            progress_cb("Ensuring every cell is within Mini, Standard, or Super service radius (OSRM)…")
        t0 = time.time()
        mini_ds, standard_ds, super_ds, cov_meta = ensure_full_network_coverage(
            grid_data, mini_ds, standard_ds, super_ds, params, progress_cb=progress_cb
        )
        logger.info(
            "Full tier coverage: complete=%s satellites=%d in %.1fs",
            cov_meta.get('coverage_complete'),
            cov_meta.get('coverage_satellites', 0),
            time.time() - t0,
        )

    mini_ds, standard_ds, super_ds = _sanitize_placed_hubs(mini_ds, standard_ds, super_ds, params)
    logger.info(
        "Placement total (overlapping, OSRM): %.1fs for %s cells",
        time.time() - t_all,
        f"{n_cells:,}" if n_cells else "0",
    )
    return {
        'mini_ds': mini_ds,
        'standard_ds': standard_ds,
        'super_ds': super_ds,
        'remaining_after_mini_greedy': remaining_after_mini_greedy,
        'coverage_minis_added': coverage_minis_added,
        'placement_mode': 'overlapping',
        'coverage_complete': bool(cov_meta.get('coverage_complete', True)),
        'coverage_satellites_added': int(cov_meta.get('coverage_satellites', 0)),
    }


def place_exclusive_tier_hubs(grid_data, params, progress_cb=None):
    """Backward-compatible alias for ``place_overlapping_tier_hubs``."""
    return place_overlapping_tier_hubs(grid_data, params, progress_cb=progress_cb)


def _order_weight_pct_within_mini_service(grid_data, mini_ds, radius_km):
    """Share of order weight whose grid cell is within radius_km road distance (OSRM) of a Mini DS."""
    if grid_data is None or len(grid_data) == 0 or not mini_ds:
        return 0.0
    clat = grid_data['cell_lat'].values
    clon = grid_data['cell_lon'].values
    w = grid_data['orders_per_day'].values
    hl = np.array([h['lat'] for h in mini_ds], dtype=np.float64)
    ho = np.array([h['lon'] for h in mini_ds], dtype=np.float64)
    min_d = osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)
    covered = min_d <= float(radius_km) + 1e-5
    return round(100.0 * float(w[covered].sum() / max(w.sum(), 1e-9)), 2)


def _summarize_proposed_policy(weights, current_costs, proposed_costs, d_mini, d_std, d_std_exception, d_sup,
                               mini_ds, standard_ds, super_ds, params):
    rmini = float(params.get('mini_ds_radius', 1.0))
    rstd = float(params.get('standard_ds_radius', 2.5))
    rstd_exception = float(params.get('standard_exception_radius_km', 5.0) or 5.0)
    rsup = float(params.get('super_ds_radius', 4.0))
    overlay_super = _super_overlay_only(params)
    served_mini = np.isfinite(d_mini) & (d_mini <= rmini + 1e-5) if mini_ds else np.zeros(len(weights), dtype=bool)
    served_std_base = (~served_mini) & np.isfinite(d_std) & (d_std <= rstd + 1e-5) if standard_ds else np.zeros(len(weights), dtype=bool)
    served_std_exception = (
        (~served_mini) & (~served_std_base) & np.isfinite(d_std_exception) & (d_std_exception <= rstd_exception + 1e-5)
        if standard_ds else np.zeros(len(weights), dtype=bool)
    )
    served_std = served_std_base | served_std_exception
    served_sup = (
        (~served_mini) & (~served_std) & np.isfinite(d_sup) & (d_sup <= rsup + 1e-5)
        if super_ds and not overlay_super else np.zeros(len(weights), dtype=bool)
    )
    hard_served = served_mini | served_std | served_sup

    extra_candidates = []
    if mini_ds:
        extra_candidates.append(np.where(np.isfinite(d_mini), np.maximum(0.0, d_mini - rmini), np.inf))
    if standard_ds:
        extra_candidates.append(np.where(np.isfinite(d_std), np.maximum(0.0, d_std - rstd), np.inf))
        extra_candidates.append(np.where(np.isfinite(d_std_exception), np.maximum(0.0, d_std_exception - rstd_exception), np.inf))
    if super_ds and not overlay_super:
        extra_candidates.append(np.where(np.isfinite(d_sup), np.maximum(0.0, d_sup - rsup), np.inf))
    if extra_candidates:
        min_extra = np.min(np.vstack(extra_candidates), axis=0)
    else:
        min_extra = np.full(len(weights), np.inf)

    exception_bucket = _compute_exception_bucket(weights, hard_served, min_extra, params)
    total_orders = float(np.sum(weights))
    hard_covered_orders = float(np.sum(weights[hard_served]))
    hard_pct = 100.0 * hard_covered_orders / max(total_orders, 1e-9)
    hybrid_pct = 100.0 * float(exception_bucket['hybrid_covered_orders_per_day']) / max(total_orders, 1e-9)
    return {
        'hard_served_mask': hard_served,
        'hard_covered_orders_per_day': round(hard_covered_orders, 2),
        'hard_uncovered_orders_per_day': round(float(np.sum(weights[~hard_served])), 2),
        'proposed_hard_coverage_pct': round(hard_pct, 2),
        'proposed_hybrid_coverage_pct': round(hybrid_pct, 2),
        'exception_bucket_usage': exception_bucket,
        'min_extra_distance_km': min_extra,
    }


def evaluate_network(grid_data, existing_stores, mini_ds, standard_ds, super_ds, params, progress_cb=None, return_debug=False):
    """Evaluate current vs proposed using OSRM road distances only (Table API)."""
    require_osrm()
    params = normalize_placement_params(params)
    base_cost = params.get('base_cost', 29)
    var_rate = params.get('variable_rate', 9)
    weights = grid_data['orders_per_day'].values
    total_orders_per_day = float(np.sum(weights))

    cust_lats = grid_data['avg_cust_lat'].values
    cust_lons = grid_data['avg_cust_lon'].values
    precomputed_current = params.get('_precomputed_current_baseline') if isinstance(params, dict) else None
    if precomputed_current:
        current_dists = precomputed_current['current_dists']
        current_costs = precomputed_current['current_costs']
        current_avg_dist = float(precomputed_current['current_avg_dist'])
        current_avg_cost = float(precomputed_current['current_avg_cost'])
        current_policy = precomputed_current['current_policy']
    else:
        # Current network distances
        if progress_cb: progress_cb("Computing current network road distances...")
        store_lats = grid_data['avg_store_lat'].values if 'avg_store_lat' in grid_data.columns else np.full(len(grid_data), np.nan)
        store_lons = grid_data['avg_store_lon'].values if 'avg_store_lon' in grid_data.columns else np.full(len(grid_data), np.nan)
        has_assigned_current_stores = np.isfinite(store_lats).all() and np.isfinite(store_lons).all()

        if has_assigned_current_stores:
            current_dists = osrm_pairwise_distances_parallel(
                cust_lats, cust_lons, store_lats, store_lons,
                progress_cb=lambda d, t: progress_cb(f"Current distances: {d}/{t} batches") if progress_cb else None
            )
        elif existing_stores:
            if progress_cb:
                progress_cb("Current baseline: representative-day demand has no assigned store columns, using nearest fixed live Standard store...")
            current_dists = osrm_min_distances_parallel(
                cust_lats, cust_lons,
                np.array([float(s['lat']) for s in existing_stores], dtype=np.float64),
                np.array([float(s['lon']) for s in existing_stores], dtype=np.float64),
                progress_cb=lambda done, total: progress_cb(f"Current baseline nearest-store: {done}/{total} batches") if progress_cb else None
            )
        else:
            raise ValueError("Cannot evaluate current network: no assigned store coordinates in demand file and no fixed live stores loaded.")

        current_costs = base_cost + var_rate * current_dists
        current_avg_dist = float(np.average(current_dists, weights=weights))
        current_avg_cost = float(np.average(current_costs, weights=weights))
        current_policy = _build_current_policy_breach_summary(grid_data, current_dists, weights, params)

    # Proposed network — tier-specific cost when use_tiered_costs
    if progress_cb: progress_cb("Computing proposed network road distances...")
    all_hubs = mini_ds + standard_ds + super_ds
    if len(all_hubs) == 0:
        all_hubs = [{'lat': s['lat'], 'lon': s['lon'], 'type': 'standard'} for s in existing_stores]

    mb = float(params.get('mini_base_cost', 20))
    mvar = float(params.get('mini_variable_rate', 6))
    sb = float(params.get('standard_base_cost', 29))
    svar = float(params.get('standard_variable_rate', 9))
    pbb = _effective_super_base_cost(params)
    pvar = float(params.get('super_variable_rate', 9))
    rmini = float(params.get('mini_ds_radius', 1.0))
    rstd = float(params.get('standard_ds_radius', 2.5))
    rsup = float(params.get('super_ds_radius', 4.0))
    overlay_super = _super_overlay_only(params)
    use_tiered = params.get('use_tiered_costs', True)
    has_proposed = bool(mini_ds or standard_ds or super_ds)

    n = len(cust_lats)

    tier_cache_enabled = bool(params.get('reuse_tier_edge_cache', True))
    tier_graph_max_radius = float(params.get(
        'exact_graph_max_radius_km',
        max(
            float(params.get('mini_ds_radius', 1.0) or 1.0),
            float(params.get('standard_exception_radius_km', params.get('standard_ds_radius', 2.5)) or params.get('standard_ds_radius', 2.5)),
            float(params.get('super_ds_radius', 4.0) or 4.0),
        ),
    ) or 0.0)

    def _min_dist_to_hubs(hubs, radius_km=None, cache_label='tier'):
        if not hubs:
            return np.full(n, np.inf)
        cached_dists = _cached_min_distances_for_hubs(
            grid_data,
            hubs,
            params,
            radius_km,
            cache_label,
            progress_cb=None,
        )
        if cached_dists is not None:
            return cached_dists
        if tier_cache_enabled and tier_graph_max_radius >= float(radius_km or 0.0) - 1e-5:
            cache_path = _exact_named_site_graph_cache_path(grid_data, hubs, tier_graph_max_radius, cache_label)
            site_graph = _load_or_build_exact_site_edge_graph(
                grid_data,
                hubs,
                tier_graph_max_radius,
                cache_path,
                f'{cache_label} tier sites',
                progress_cb=None,
            )
            return _min_dist_from_site_edge_graph(site_graph, n, radius_limit_km=radius_km)
        hl = np.array([h['lat'] for h in hubs], dtype=np.float64)
        ho = np.array([h['lon'] for h in hubs], dtype=np.float64)
        return osrm_min_distances_parallel(cust_lats, cust_lons, hl, ho, progress_cb=None)

    exception_standard_hubs = [h for h in standard_ds if bool(h.get('exception_standard')) or float(h.get('radius_km', rstd)) > rstd + 1e-5]
    base_standard_hubs = [h for h in standard_ds if h not in exception_standard_hubs]

    d_mini = _min_dist_to_hubs(mini_ds, radius_km=rmini, cache_label='mini')
    d_std = _min_dist_to_hubs(base_standard_hubs, radius_km=rstd, cache_label='standard_base')
    d_std_exception = _min_dist_to_hubs(
        exception_standard_hubs,
        radius_km=float(params.get('standard_exception_radius_km', 5.0) or 5.0),
        cache_label='standard_exception',
    )
    d_sup = _min_dist_to_hubs(super_ds, radius_km=rsup, cache_label='super')

    # Nearest-hub matrix: only when tier radii do not fully define service (no proposed hubs yet
    # uses existing stores; or non-tiered mode). Skip when tiered + proposed hubs — big OSRM saving;
    # cells outside all tier radii are unserved (not "long" deliveries to nearest hub).
    need_nearest_matrix = (not (use_tiered and has_proposed)) and len(all_hubs) > 0
    if need_nearest_matrix:
        hub_lats = np.array([h['lat'] for h in all_hubs], dtype=np.float64)
        hub_lons = np.array([h['lon'] for h in all_hubs], dtype=np.float64)
        d_all, nearest_hub_idx = osrm_min_distances_and_argmin(
            cust_lats, cust_lons, hub_lats, hub_lons,
            progress_cb=lambda d, t: progress_cb(f"Proposed nearest-hub: {d}/{t} batches") if progress_cb else None
        )
    else:
        d_all, nearest_hub_idx = None, None

    proposed_costs = np.zeros(n)
    proposed_dists = np.full(n, np.nan)

    if len(all_hubs) == 0:
        proposed_dists[:] = np.nan
        proposed_costs[:] = current_costs
    elif use_tiered and len(all_hubs) > 0:
        for i in range(n):
            std_eligible_base = base_standard_hubs and d_std[i] <= rstd
            std_eligible_exception = exception_standard_hubs and d_std_exception[i] <= float(params.get('standard_exception_radius_km', 5.0) or 5.0)
            if mini_ds and d_mini[i] <= rmini:
                proposed_dists[i] = d_mini[i]
                proposed_costs[i] = mb + mvar * d_mini[i]
            elif standard_ds and (std_eligible_base or std_eligible_exception):
                chosen_std_dist = min(
                    d_std[i] if std_eligible_base else np.inf,
                    d_std_exception[i] if std_eligible_exception else np.inf,
                )
                proposed_dists[i] = chosen_std_dist
                proposed_costs[i] = sb + svar * chosen_std_dist
            elif super_ds and (not overlay_super) and d_sup[i] <= rsup:
                proposed_dists[i] = d_sup[i]
                proposed_costs[i] = pbb + pvar * d_sup[i]
            elif has_proposed:
                # Outside Mini / Standard / Super service radii — not served by proposed network
                proposed_dists[i] = np.nan
                proposed_costs[i] = current_costs[i]
            else:
                proposed_dists[i] = d_all[i]
                ji = int(nearest_hub_idx[i])
                if ji < 0 or ji >= len(all_hubs):
                    best_type = 'standard'
                else:
                    best_type = all_hubs[ji].get('type', 'standard')
                if best_type == 'mini':
                    proposed_costs[i] = mb + mvar * d_all[i]
                elif best_type == 'standard':
                    proposed_costs[i] = sb + svar * d_all[i]
                else:
                    proposed_costs[i] = pbb + pvar * d_all[i]
    else:
        proposed_dists = d_all
        proposed_costs = base_cost + var_rate * d_all

    proposed_policy = _summarize_proposed_policy(
        weights, current_costs, proposed_costs,
        d_mini, d_std, d_std_exception, d_sup,
        mini_ds, standard_ds, super_ds, params,
    )
    served = proposed_policy['hard_served_mask']
    hybrid_mask = served | proposed_policy['exception_bucket_usage'].get('selected_mask', np.zeros(n, dtype=bool))
    modeled_cost = _modeled_cost_summary(weights, proposed_costs, params, len(super_ds))
    addressable = _addressable_coverage_metrics(
        weights, served, hybrid_mask,
        {'excluded_orders_per_day': 0.0, 'excluded_zone_count': 0},
        dict(params or {}, low_density_policy='always_serve'),
    )
    if np.any(served):
        proposed_avg_dist = float(np.average(proposed_dists[served], weights=weights[served]))
        proposed_mean_dist_unweighted = float(np.nanmean(proposed_dists))
    else:
        proposed_avg_dist = None
        proposed_mean_dist_unweighted = None
    proposed_avg_cost = float(np.average(proposed_costs, weights=weights))

    daily_savings = (current_avg_cost - proposed_avg_cost) * total_orders_per_day

    wsum = float(np.sum(weights))
    pct_order_weight_outside_tier_radii = round(
        float(100.0 * np.sum(weights[~served]) / max(wsum, 1e-9)) if has_proposed else 0.0,
        2,
    )

    # Distance distribution for proposed (within radii only; unserved separate)
    bins = [0, 1, 2, 3, 4, 5, np.inf]
    labels = ['0-1km', '1-2km', '2-3km', '3-4km', '4-5km', '5+km']
    hist_counts = []
    for i in range(len(bins) - 1):
        mask = served & (proposed_dists >= bins[i]) & (proposed_dists < bins[i + 1])
        hist_counts.append(float(weights[mask].sum()))
    hist_map = {labels[i]: hist_counts[i] for i in range(len(labels))}
    if has_proposed and np.any(~served):
        hist_map['Outside tier radii (unserved)'] = float(np.sum(weights[~served]))

    dist_src = 'OSRM road distance (Table API)'

    mr = float(params.get('mini_ds_radius', 1.0))
    pct_within_mini = _order_weight_pct_within_mini_service(grid_data, mini_ds, mr)

    result = {
        'current_avg_dist': round(current_avg_dist, 3),
        'proposed_avg_dist': None if proposed_avg_dist is None else round(proposed_avg_dist, 3),
        'proposed_mean_dist_unweighted': None if proposed_mean_dist_unweighted is None else round(proposed_mean_dist_unweighted, 3),
        'current_avg_cost': round(current_avg_cost, 2),
        'proposed_avg_cost': round(proposed_avg_cost, 2),
        'avg_modeled_cost_per_order': round(modeled_cost['avg_modeled_cost_per_order'], 2),
        'super_penalty_cost_per_day': round(modeled_cost['super_penalty_cost_per_day'], 2),
        'exception_standard_hub_count': len(exception_standard_hubs),
        'current_operational_coverage_pct': current_policy['current_operational_coverage_pct'],
        'current_policy_coverage_pct': current_policy['current_policy_coverage_pct'],
        'proposed_hard_coverage_pct': proposed_policy['proposed_hard_coverage_pct'],
        'proposed_hybrid_coverage_pct': proposed_policy['proposed_hybrid_coverage_pct'],
        'full_hard_coverage_pct': addressable['full_hard_coverage_pct'],
        'full_hybrid_coverage_pct': addressable['full_hybrid_coverage_pct'],
        'addressable_hard_coverage_pct': addressable['addressable_hard_coverage_pct'],
        'addressable_hybrid_coverage_pct': addressable['addressable_hybrid_coverage_pct'],
        'policy_breach_orders_per_day': current_policy['policy_breach_orders_per_day'],
        'policy_breach_hubs': current_policy['policy_breach_hubs'],
        'exception_bucket_usage': {
            k: v for k, v in proposed_policy['exception_bucket_usage'].items() if k != 'selected_mask'
        },
        'daily_savings': round(max(0, daily_savings), 0),
        'monthly_savings': round(max(0, daily_savings) * 30, 0),
        'total_orders_per_day': round(total_orders_per_day, 2),
        'pct_cost_reduction': round((current_avg_cost - proposed_avg_cost) / max(current_avg_cost, 0.01) * 100, 1),
        'distance_source': dist_src,
        'distance_histogram': hist_map,
        'total_grid_cells': len(grid_data),
        'proposed_distances_proxy': False,
        'pct_orders_within_mini_service_km': pct_within_mini,
        'mini_service_radius_km': round(mr, 3),
        'pct_order_weight_outside_tier_radii': pct_order_weight_outside_tier_radii,
        'metrics_note': (
            'Current operational coverage is historical assignment coverage. Policy coverage uses your tier radius rules. '
            'Proposed hard coverage counts only demand within tier radii; proposed hybrid coverage can additionally use '
            'the configured explicit over-radius exception bucket.'
        ),
    }
    if return_debug:
        result['_debug'] = {
            'weights': weights,
            'current_costs': current_costs,
            'current_avg_cost': current_avg_cost,
            'current_avg_dist': current_avg_dist,
            'current_policy': current_policy,
            'd_mini': d_mini,
            'd_std': d_std,
            'd_std_exception': d_std_exception,
            'd_sup': d_sup,
            'rmini': rmini,
            'rstd': rstd,
            'rstd_exception': float(params.get('standard_exception_radius_km', 5.0) or 5.0),
            'rsup': rsup,
            'exception_standard_hub_count': len(exception_standard_hubs),
            'has_mini': bool(mini_ds),
            'has_standard': bool(standard_ds),
            'has_super': bool(super_ds),
        }
    return result


def _build_standard_only_metrics_from_combined_debug(debug, params):
    if not debug:
        raise ValueError("Combined evaluation debug payload is required to derive Standard-only metrics.")

    weights = np.asarray(debug['weights'], dtype=np.float64)
    current_costs = np.asarray(debug['current_costs'], dtype=np.float64)
    current_avg_cost = float(debug['current_avg_cost'])
    current_avg_dist = float(debug['current_avg_dist'])
    current_policy = debug['current_policy']
    d_std = np.asarray(debug['d_std'], dtype=np.float64)
    d_std_exception = np.asarray(debug['d_std_exception'], dtype=np.float64)
    rstd = float(debug['rstd'])
    rstd_exception = float(debug['rstd_exception'])
    total_orders_per_day = float(np.sum(weights))

    std_eligible_base = np.isfinite(d_std) & (d_std <= rstd + 1e-5)
    std_eligible_exception = np.isfinite(d_std_exception) & (d_std_exception <= rstd_exception + 1e-5)
    chosen_std_dist = np.minimum(
        np.where(std_eligible_base, d_std, np.inf),
        np.where(std_eligible_exception, d_std_exception, np.inf),
    )
    served = np.isfinite(chosen_std_dist)

    proposed_dists = np.full(len(weights), np.nan)
    proposed_dists[served] = chosen_std_dist[served]

    sb = float(params.get('standard_base_cost', 29) or 29)
    svar = float(params.get('standard_variable_rate', 9) or 9)
    proposed_costs = np.array(current_costs, copy=True)
    proposed_costs[served] = sb + svar * chosen_std_dist[served]

    extra_candidates = [
        np.where(np.isfinite(d_std), np.maximum(0.0, d_std - rstd), np.inf),
        np.where(np.isfinite(d_std_exception), np.maximum(0.0, d_std_exception - rstd_exception), np.inf),
    ]
    min_extra = np.min(np.vstack(extra_candidates), axis=0)
    exception_bucket = _compute_exception_bucket(weights, served, min_extra, params)
    hybrid_mask = served | exception_bucket.get('selected_mask', np.zeros(len(weights), dtype=bool))
    modeled_cost = _modeled_cost_summary(weights, proposed_costs, params, 0)
    addressable = _addressable_coverage_metrics(
        weights,
        served,
        hybrid_mask,
        {'excluded_orders_per_day': 0.0, 'excluded_zone_count': 0},
        dict(params or {}, low_density_policy='always_serve'),
    )

    if np.any(served):
        proposed_avg_dist = float(np.average(proposed_dists[served], weights=weights[served]))
        proposed_mean_dist_unweighted = float(np.nanmean(proposed_dists))
    else:
        proposed_avg_dist = None
        proposed_mean_dist_unweighted = None
    proposed_avg_cost = float(np.average(proposed_costs, weights=weights))
    daily_savings = (current_avg_cost - proposed_avg_cost) * total_orders_per_day

    bins = [0, 1, 2, 3, 4, 5, np.inf]
    labels = ['0-1km', '1-2km', '2-3km', '3-4km', '4-5km', '5+km']
    hist_counts = []
    for i in range(len(bins) - 1):
        mask = served & (proposed_dists >= bins[i]) & (proposed_dists < bins[i + 1])
        hist_counts.append(float(weights[mask].sum()))
    hist_map = {labels[i]: hist_counts[i] for i in range(len(labels))}
    if np.any(~served):
        hist_map['Outside tier radii (unserved)'] = float(np.sum(weights[~served]))

    return {
        'current_avg_dist': round(current_avg_dist, 3),
        'proposed_avg_dist': None if proposed_avg_dist is None else round(proposed_avg_dist, 3),
        'proposed_mean_dist_unweighted': None if proposed_mean_dist_unweighted is None else round(proposed_mean_dist_unweighted, 3),
        'current_avg_cost': round(current_avg_cost, 2),
        'proposed_avg_cost': round(proposed_avg_cost, 2),
        'avg_modeled_cost_per_order': round(modeled_cost['avg_modeled_cost_per_order'], 2),
        'super_penalty_cost_per_day': 0.0,
        'exception_standard_hub_count': int(debug.get('exception_standard_hub_count', 0) or 0),
        'current_operational_coverage_pct': current_policy['current_operational_coverage_pct'],
        'current_policy_coverage_pct': current_policy['current_policy_coverage_pct'],
        'proposed_hard_coverage_pct': round(100.0 * float(np.sum(weights[served])) / max(total_orders_per_day, 1e-9), 2),
        'proposed_hybrid_coverage_pct': round(100.0 * float(exception_bucket.get('hybrid_covered_orders_per_day', 0.0)) / max(total_orders_per_day, 1e-9), 2),
        'full_hard_coverage_pct': addressable['full_hard_coverage_pct'],
        'full_hybrid_coverage_pct': addressable['full_hybrid_coverage_pct'],
        'addressable_hard_coverage_pct': addressable['addressable_hard_coverage_pct'],
        'addressable_hybrid_coverage_pct': addressable['addressable_hybrid_coverage_pct'],
        'policy_breach_orders_per_day': current_policy['policy_breach_orders_per_day'],
        'policy_breach_hubs': current_policy['policy_breach_hubs'],
        'exception_bucket_usage': {
            k: v for k, v in exception_bucket.items() if k != 'selected_mask'
        },
        'daily_savings': round(max(0, daily_savings), 0),
        'monthly_savings': round(max(0, daily_savings) * 30, 0),
        'total_orders_per_day': round(total_orders_per_day, 2),
        'pct_cost_reduction': round((current_avg_cost - proposed_avg_cost) / max(current_avg_cost, 0.01) * 100, 1),
        'distance_source': 'OSRM road distance (Table API) [derived Standard-only comparison from cached combined evaluation]',
        'distance_histogram': hist_map,
        'total_grid_cells': len(weights),
        'proposed_distances_proxy': False,
        'pct_orders_within_mini_service_km': 0.0,
        'mini_service_radius_km': round(float(params.get('mini_ds_radius', 1.0) or 1.0), 3),
        'pct_order_weight_outside_tier_radii': round(float(np.sum(weights[~served])) / max(total_orders_per_day, 1e-9) * 100.0, 2),
        'metrics_note': (
            'Current operational coverage is historical assignment coverage. '
            'Standard-only comparison is derived from the cached combined evaluation to avoid a second full network pass.'
        ),
    }


def _summarize_mini_overlay_from_combined_debug(debug, standard_only_metrics, combined_metrics, mini_site_count):
    if not debug or mini_site_count <= 0:
        return {
            'site_count': 0,
            'orders_shifted_from_standard_per_day': 0.0,
            'avg_cost_reduction_per_order': 0.0,
            'daily_cost_reduction': 0.0,
        }

    weights = np.asarray(debug['weights'], dtype=np.float64)
    d_mini = np.asarray(debug['d_mini'], dtype=np.float64)
    d_std = np.asarray(debug['d_std'], dtype=np.float64)
    d_std_exception = np.asarray(debug['d_std_exception'], dtype=np.float64)
    rmini = float(debug['rmini'])
    rstd = float(debug['rstd'])
    rstd_exception = float(debug['rstd_exception'])

    mini_served = np.isfinite(d_mini) & (d_mini <= rmini + 1e-5)
    std_served = (
        (np.isfinite(d_std) & (d_std <= rstd + 1e-5)) |
        (np.isfinite(d_std_exception) & (d_std_exception <= rstd_exception + 1e-5))
    )
    shifted = mini_served & std_served
    shifted_orders = float(np.sum(weights[shifted]))
    avg_delta = float(standard_only_metrics['proposed_avg_cost'] - combined_metrics['proposed_avg_cost'])
    return {
        'site_count': int(mini_site_count),
        'orders_shifted_from_standard_per_day': round(shifted_orders, 2),
        'avg_cost_reduction_per_order': round(avg_delta, 2),
        'daily_cost_reduction': round(avg_delta * float(np.sum(weights)), 2),
    }

def generate_heatmap(grid_data, max_points=8000):
    if grid_data is None or len(grid_data) == 0:
        return []
    df = grid_data
    if len(df) > max_points:
        df = df.nlargest(max_points, 'orders_per_day')
    mx = df['orders_per_day'].max()
    mn = df['orders_per_day'].min()
    rng = max(mx - mn, 1)
    return [[float(r['avg_cust_lat']), float(r['avg_cust_lon']),
             float((r['orders_per_day'] - mn) / rng)]
            for _, r in df.iterrows()]

# ============================================================================
# TARGET LAST-MILE COST (avg proposed cost)
# ============================================================================
TARGET_SEARCH_PARAM_SPECS = [
    ('mini_ds_radius', 0.5, 2.0, 0.1),
    ('mini_ds_min_orders_per_day', 300, 2000, 25),
    ('standard_ds_radius', 1.5, 4.0, 0.1),
    ('standard_ds_min_orders_per_day', 200, 1500, 50),
    ('super_ds_radius', 2.5, 6.0, 0.5),
    ('super_ds_min_orders_per_day', 500, 5000, 100),
]
TARGET_SPECS_BY_KEY = {row[0]: row[1:] for row in TARGET_SEARCH_PARAM_SPECS}


def _snap_to_spec(key, value):
    lo, hi, st = TARGET_SPECS_BY_KEY[key]
    v = max(lo, min(hi, float(value)))
    if st >= 1:
        return int(round(v / st) * int(st))
    n = int(round((v - lo) / st))
    return round(lo + n * st, 10)


def _snap_all_tier_params(p):
    out = dict(p)
    for key, lo, hi, st in TARGET_SEARCH_PARAM_SPECS:
        if key in out:
            out[key] = _snap_to_spec(key, out[key])
        else:
            out[key] = _snap_to_spec(key, (lo + hi) / 2)
    return out


def _random_tier_params(rng):
    p = {}
    for key, lo, hi, st in TARGET_SEARCH_PARAM_SPECS:
        if st >= 1:
            k0 = int(round(lo / st))
            k1 = int(round(hi / st))
            p[key] = rng.randint(k0, k1) * int(st)
        else:
            nsteps = int(round((hi - lo) / st))
            p[key] = round(lo + rng.randint(0, nsteps) * st, 10)
    return p


def _merge_base_tier_params(base_params, tier_overrides):
    out = dict(base_params)
    out.update(tier_overrides)
    for k in ('base_cost', 'variable_rate'):
        if k in base_params:
            out[k] = base_params[k]
    return out


def search_tier_params_for_target(grid_data, existing_stores, base_params, target_cost, max_iters, progress_cb):
    """Random + local coordinate search using OSRM for evaluation (slower but road-accurate)."""
    rng = random.Random(42)
    best = {'score': float('inf'), 'params': None, 'mini': None, 'std': None, 'super': None, 'metrics': None,
            'coverage_minis_added': 0}

    def consider(p):
        layout = place_overlapping_tier_hubs(grid_data, p, progress_cb=None)
        mini_ds = layout['mini_ds']
        standard_ds = layout['standard_ds']
        super_ds = layout['super_ds']
        remaining = layout['remaining_after_mini_greedy']
        cov_added = layout['coverage_minis_added']
        m = evaluate_network(
            grid_data, existing_stores, mini_ds, standard_ds, super_ds, p,
            progress_cb=None,
        )
        score = abs(m['proposed_avg_cost'] - target_cost)
        if score < best['score']:
            best.update(
                score=score, params=dict(p), mini=mini_ds, std=standard_ds, super=super_ds, metrics=m,
                coverage_minis_added=cov_added, remaining=remaining,
                coverage_complete=layout.get('coverage_complete', True),
                coverage_satellites_added=layout.get('coverage_satellites_added', 0),
            )

    consider(_snap_all_tier_params(base_params))
    for i in range(max(0, max_iters - 1)):
        if progress_cb:
            progress_cb(f"Target search (fast): {i + 2}/{max_iters}...")
        p = _merge_base_tier_params(base_params, _random_tier_params(rng))
        consider(p)

    if best['params'] is None:
        return best

    cur_p = dict(best['params'])
    cur_score = best['score']
    for _round in range(3):
        improved = False
        for key, lo, hi, st in TARGET_SEARCH_PARAM_SPECS:
            for delta in (-st, st):
                trial = dict(cur_p)
                trial[key] = _snap_to_spec(key, trial.get(key, lo) + delta)
                layout = place_overlapping_tier_hubs(grid_data, trial, progress_cb=None)
                mini_ds = layout['mini_ds']
                standard_ds = layout['standard_ds']
                super_ds = layout['super_ds']
                remaining = layout['remaining_after_mini_greedy']
                cov_added = layout['coverage_minis_added']
                m = evaluate_network(
                    grid_data, existing_stores, mini_ds, standard_ds, super_ds, trial,
                    progress_cb=None,
                )
                sc = abs(m['proposed_avg_cost'] - target_cost)
                if sc < cur_score - 1e-6:
                    cur_score = sc
                    cur_p = trial
                    best.update(
                        score=sc, params=trial, mini=mini_ds, std=standard_ds, super=super_ds, metrics=m,
                        coverage_minis_added=cov_added, remaining=remaining,
                        coverage_complete=layout.get('coverage_complete', True),
                        coverage_satellites_added=layout.get('coverage_satellites_added', 0),
                    )
                    improved = True
        if not improved:
            break
    return best


def _simulate_fixed_tier_network(weights, current_costs, d_mini, d_std, d_sup, params,
                                 mini_hubs, standard_hubs, super_hubs,
                                 mini_radius=None, standard_radius=None, super_radius=None):
    """Re-score the already-placed network under alternate service radii.

    This is intentionally *fixed placement* analysis: hub locations do not move.
    It is useful for quick scenario diagnostics after a full optimization run.
    """
    rmini = float(params.get('mini_ds_radius', 1.5) if mini_radius is None else mini_radius)
    rstd = float(params.get('standard_ds_radius', 3.0) if standard_radius is None else standard_radius)
    rsup = float(params.get('super_ds_radius', 4.0) if super_radius is None else super_radius)

    mb = float(params.get('mini_base_cost', 20))
    mvar = float(params.get('mini_variable_rate', 6))
    sb = float(params.get('standard_base_cost', 29))
    svar = float(params.get('standard_variable_rate', 9))
    pbb = _effective_super_base_cost(params)
    pvar = float(params.get('super_variable_rate', 9))
    overlay_super = _super_overlay_only(params)

    proposed_dists = np.full(len(weights), np.nan)
    proposed_costs = np.array(current_costs, copy=True)

    served_mini = np.zeros(len(weights), dtype=bool)
    served_std = np.zeros(len(weights), dtype=bool)
    served_sup = np.zeros(len(weights), dtype=bool)

    if mini_hubs:
        served_mini = np.isfinite(d_mini) & (d_mini <= rmini + 1e-5)
        proposed_dists[served_mini] = d_mini[served_mini]
        proposed_costs[served_mini] = mb + mvar * d_mini[served_mini]

    if standard_hubs:
        served_std = (~served_mini) & np.isfinite(d_std) & (d_std <= rstd + 1e-5)
        proposed_dists[served_std] = d_std[served_std]
        proposed_costs[served_std] = sb + svar * d_std[served_std]

    if super_hubs and not overlay_super:
        served_sup = (~served_mini) & (~served_std) & np.isfinite(d_sup) & (d_sup <= rsup + 1e-5)
        proposed_dists[served_sup] = d_sup[served_sup]
        proposed_costs[served_sup] = pbb + pvar * d_sup[served_sup]

    served = np.isfinite(proposed_dists)
    total_orders = float(np.sum(weights))
    covered_orders = float(np.sum(weights[served]))
    uncovered_orders = float(np.sum(weights[~served]))
    coverage_pct = 100.0 * covered_orders / max(total_orders, 1e-9)
    proposed_avg_cost = float(np.average(proposed_costs, weights=weights))
    proposed_avg_dist = None
    if np.any(served):
        proposed_avg_dist = float(np.average(proposed_dists[served], weights=weights[served]))

    return {
        'mini_radius_km': round(rmini, 2),
        'standard_radius_km': round(rstd, 2),
        'super_radius_km': round(rsup, 2),
        'coverage_pct': round(coverage_pct, 2),
        'covered_orders_per_day': round(covered_orders, 0),
        'uncovered_orders_per_day': round(uncovered_orders, 0),
        'proposed_avg_cost': round(proposed_avg_cost, 2),
        'proposed_avg_dist': None if proposed_avg_dist is None else round(proposed_avg_dist, 3),
    }


def _radius_override_recommendation_cache_path(cache_hash):
    return os.path.join(GRAPH_CACHE_DIR, f"radius_override_recs_{cache_hash}.pkl")


def _build_radius_override_recommendations(grid_data, weights, proposed_costs, served_mask, params,
                                           mini_hubs, standard_hubs, super_hubs, progress_cb=None):
    candidate_tiers = set(params.get('radius_override_candidate_tiers', ['standard', 'super']))
    if _super_overlay_only(params):
        candidate_tiers.discard('super')
    uncovered_idx = np.where(~served_mask)[0]
    if len(uncovered_idx) == 0:
        return {
            'recommendations': [],
            'summary': {
                'override_count': 0,
                'remaining_uncovered_orders_per_day': 0.0,
                'hybrid_target_satisfied': True,
                'hard_target_satisfied': True,
            },
        }

    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    total_orders = float(np.sum(weights))
    uncovered_weights = weights[uncovered_idx]
    uncovered_lats = clat[uncovered_idx]
    uncovered_lons = clon[uncovered_idx]
    base_remaining_orders = float(np.sum(uncovered_weights))
    allowed_exception_orders = _compute_exception_bucket(
        weights, served_mask, np.full(len(weights), np.inf), params
    )['allowed_orders_per_day']
    preference_mode = str(params.get('super_tail_preference') or 'prefer_standard').lower()
    meeting_fast_mode = bool(params.get('meeting_fast_mode', True))
    single_step_mode = bool(params.get('meeting_fast_override_single_step', meeting_fast_mode))
    top_k = int(params.get('meeting_fast_override_top_k', 0) or 0) if meeting_fast_mode else 0
    override_target_coverage_pct = None
    if meeting_fast_mode:
        try:
            override_target_coverage_pct = float(
                params.get(
                    'meeting_fast_override_target_coverage_pct',
                    params.get('meeting_core_publish_coverage_pct', params.get('meeting_fast_target_coverage_pct', 100.0)),
                ) or 0.0
            )
        except (TypeError, ValueError):
            override_target_coverage_pct = None
        if override_target_coverage_pct is not None:
            override_target_coverage_pct = min(100.0, max(95.0, override_target_coverage_pct))
    max_selected = params.get('meeting_fast_override_max_selected')
    if max_selected in ('', None):
        max_selected = None
    else:
        max_selected = max(1, int(max_selected))
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    fixed_context = (params or {}).get('_cached_fixed_site_context')

    tier_specs = []
    if 'mini' in candidate_tiers:
        tier_specs.extend([('mini', i, hub) for i, hub in enumerate(mini_hubs, start=1)])
    if 'standard' in candidate_tiers:
        tier_specs.extend([('standard', i, hub) for i, hub in enumerate(standard_hubs, start=1)])
    if 'super' in candidate_tiers:
        tier_specs.extend([('super', i, hub) for i, hub in enumerate(super_hubs, start=1)])

    tier_costs = {
        'mini': (float(params.get('mini_base_cost', 20)), float(params.get('mini_variable_rate', 6)),
                 float(params.get('mini_ds_radius', 1.5)), float(params.get('mini_ds_radius', 1.5))),
        'standard': (float(params.get('standard_base_cost', 29)), float(params.get('standard_variable_rate', 9)),
                     float(params.get('standard_ds_radius', 3.0)), float(params.get('standard_override_max_radius_km', 4.0))),
        'super': (_effective_super_base_cost(params), float(params.get('super_variable_rate', 9)),
                  float(params.get('super_ds_radius', 4.0)), float(params.get('super_override_max_radius_km', 5.0))),
    }
    step = float(params.get('radius_override_step_km', 0.2) or 0.2)
    cache_key = None
    cache_hash = None
    if meeting_fast_mode:
        h = hashlib.sha1()
        h.update(str(sorted(candidate_tiers)).encode('utf-8'))
        h.update(f"{step:.4f}|{bool(single_step_mode)}|{top_k}|{max_selected}".encode('utf-8'))
        h.update(
            f"{_effective_fixed_store_source_mode(params)}|"
            f"{float(params.get('standard_ds_radius', 0.0) or 0.0):.3f}|"
            f"{float(params.get('standard_exception_radius_km', 0.0) or 0.0):.3f}|"
            f"{float(params.get('meeting_fast_target_coverage_pct', 99.7) or 99.7):.3f}".encode('utf-8')
        )
        h.update(np.asarray(uncovered_idx, dtype=np.int32).tobytes())
        for tier_name, idx, hub in tier_specs:
            h.update(
                f"{tier_name}|{idx}|{hub.get('id') or ''}|{float(hub.get('lat', 0.0)):.5f}|"
                f"{float(hub.get('lon', 0.0)):.5f}|{float(hub.get('radius_km', 0.0) or 0.0):.4f}".encode('utf-8')
            )
        cache_hash = h.hexdigest()
        cache_key = ('radius_override_recs', cache_hash)
        cached_result = state.radius_override_recommendation_cache.get(cache_key)
        if cached_result is not None:
            return copy.deepcopy(cached_result)
        cache_path = _radius_override_recommendation_cache_path(cache_hash)
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'rb') as f:
                    cached_result = pickle.load(f)
                state.radius_override_recommendation_cache[cache_key] = copy.deepcopy(cached_result)
                return copy.deepcopy(cached_result)
            except Exception:
                pass

    actions = []
    for tier_name, idx, hub in tier_specs:
        base_cost, var_rate, default_radius, max_radius = tier_costs[tier_name]
        current_radius = float(hub.get('radius_km', default_radius) or default_radius)
        max_radius = max(current_radius, max_radius)
        if max_radius <= current_radius + 1e-5:
            continue
        dists_full = _distance_array_from_cached_contexts(
            [cached_context, fixed_context],
            float(hub['lat']),
            float(hub['lon']),
            len(grid_data),
        )
        if dists_full is None:
            dists = osrm_one_to_many(float(hub['lat']), float(hub['lon']), uncovered_lats, uncovered_lons)
        else:
            dists = dists_full[uncovered_idx]
        if single_step_mode:
            candidate_radii = [round(max_radius, 3)]
        else:
            n_steps = max(1, int(round((max_radius - current_radius) / step)))
            candidate_radii = [
                min(max_radius, round(current_radius + step_i * step, 3))
                for step_i in range(1, n_steps + 1)
            ]
        for new_radius in candidate_radii:
            rescue_mask = np.isfinite(dists) & (dists <= new_radius + 1e-5)
            if not np.any(rescue_mask):
                continue
            new_costs = base_cost + var_rate * dists[rescue_mask]
            base_costs = proposed_costs[uncovered_idx][rescue_mask]
            delta_total = float(np.sum((new_costs - base_costs) * uncovered_weights[rescue_mask]))
            rescued_orders = float(np.sum(uncovered_weights[rescue_mask]))
            actions.append({
                'hub_uid': f'{tier_name}-{idx}',
                'hub_id': hub.get('id') or f'{tier_name.upper()}-{idx}',
                'tier': tier_name,
                'hub_lat': float(hub['lat']),
                'hub_lon': float(hub['lon']),
                'old_radius_km': round(current_radius, 3),
                'new_radius_km': round(new_radius, 3),
                'rescue_mask': rescue_mask,
                'distance_subset': dists,
                'avg_cost_delta_per_order': delta_total / max(total_orders, 1e-9),
                'daily_cost_delta': delta_total,
                'rescued_orders_per_day_initial': rescued_orders,
            })

    if meeting_fast_mode and top_k > 0 and len(actions) > top_k:
        actions.sort(
            key=lambda action: (
                float(action.get('rescued_orders_per_day_initial', 0.0) or 0.0),
                -float(action.get('daily_cost_delta', 0.0) or 0.0),
                -float(action.get('new_radius_km', 0.0) or 0.0),
                1 if action.get('tier') == 'standard' else (0 if action.get('tier') == 'mini' else -1),
            ),
            reverse=True,
        )
        actions = actions[:top_k]

    remaining = np.ones(len(uncovered_idx), dtype=bool)
    selected = []
    used_hubs = set()
    while np.any(remaining):
        if override_target_coverage_pct is not None:
            current_coverage_pct = 100.0 * (1.0 - float(np.sum(uncovered_weights[remaining])) / max(total_orders, 1e-9))
            if current_coverage_pct >= override_target_coverage_pct - 1e-9:
                break
        if max_selected is not None and len(selected) >= max_selected:
            break
        remaining_orders = float(np.sum(uncovered_weights[remaining]))
        if remaining_orders <= 1e-9:
            break
        best = None
        available_actions = []
        for action in actions:
            if action['hub_uid'] in used_hubs:
                continue
            rescue_now = remaining & action['rescue_mask']
            rescued_orders = float(np.sum(uncovered_weights[rescue_now]))
            if rescued_orders <= 0:
                continue
            available_actions.append((action, rescue_now, rescued_orders))
        if not available_actions:
            break
        if preference_mode == 'prefer_standard':
            preferred = [item for item in available_actions if item[0]['tier'] in {'mini', 'standard'}]
            if preferred:
                available_actions = preferred
        elif preference_mode == 'super_last_resort':
            preferred = [item for item in available_actions if item[0]['tier'] != 'super']
            if preferred:
                available_actions = preferred
        for action, rescue_now, rescued_orders in available_actions:
            daily_cost_delta = float(np.sum(
                ((
                    tier_costs[action['tier']][0] + tier_costs[action['tier']][1] * action['distance_subset'][rescue_now]
                ) - proposed_costs[uncovered_idx][rescue_now]) * uncovered_weights[rescue_now]
            ))
            candidate = (
                rescued_orders,
                -daily_cost_delta,
                -action['new_radius_km'],
                1 if action['tier'] == 'standard' else (0 if action['tier'] == 'mini' else -1),
                action,
                rescue_now,
            )
            if best is None or candidate[:4] > best[:4]:
                best = candidate
        if best is None:
            break
        action = best[4]
        rescue_now = best[5]
        rescued_orders = float(np.sum(uncovered_weights[rescue_now]))
        daily_cost_delta = float(np.sum(
            ((
                tier_costs[action['tier']][0] + tier_costs[action['tier']][1] * action['distance_subset'][rescue_now]
            ) - proposed_costs[uncovered_idx][rescue_now]) * uncovered_weights[rescue_now]
        ))
        remaining[rescue_now] = False
        used_hubs.add(action['hub_uid'])
        selected.append({
            'hub_id': action['hub_id'],
            'tier': action['tier'],
            'hub_lat': action['hub_lat'],
            'hub_lon': action['hub_lon'],
            'old_radius_km': action['old_radius_km'],
            'new_radius_km': action['new_radius_km'],
            'rescued_orders_per_day': round(rescued_orders, 2),
            'avg_cost_delta_per_order': round(daily_cost_delta / max(total_orders, 1e-9), 4),
            'daily_cost_delta': round(daily_cost_delta, 2),
            'remaining_uncovered_orders_per_day': round(float(np.sum(uncovered_weights[remaining])), 2),
        })
        if progress_cb and len(selected) % 5 == 0:
            progress_cb(f"Radius overrides: selected {len(selected)} hub override(s)...")

    remaining_uncovered = float(np.sum(uncovered_weights[remaining]))
    count_by_tier = {}
    for item in selected:
        count_by_tier[item['tier']] = count_by_tier.get(item['tier'], 0) + 1
    result = {
        'recommendations': selected,
        'summary': {
            'override_count': len(selected),
            'remaining_uncovered_orders_per_day': round(remaining_uncovered, 2),
            'base_uncovered_orders_per_day': round(base_remaining_orders, 2),
            'hybrid_target_satisfied': remaining_uncovered <= allowed_exception_orders + 1e-9,
            'hard_target_satisfied': remaining_uncovered <= 1e-9,
            'override_count_by_tier': count_by_tier,
        },
    }
    if cache_key is not None:
        state.radius_override_recommendation_cache[cache_key] = copy.deepcopy(result)
        if cache_hash is not None:
            try:
                with open(_radius_override_recommendation_cache_path(cache_hash), 'wb') as f:
                    pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
            except Exception:
                pass
    return result


def _build_low_density_zones(uncovered_pockets, params, weights_sum):
    pockets = list(uncovered_pockets or [])
    radius_km = float(params.get('low_density_radius_km', 5.0) or 5.0)
    threshold = float(params.get('low_density_min_orders_per_day', 300) or 300)
    policy = str(params.get('low_density_policy') or 'flag_exclude').lower()
    zones = []
    if not pockets:
        return {
            'zones': [],
            'excluded_orders_per_day': 0.0,
            'excluded_zone_count': 0,
            'radius_km': round(radius_km, 2),
            'threshold_orders_per_day': round(threshold, 2),
            'policy': policy,
            'weights_sum': float(weights_sum),
        }
    plats = np.array([float(p.get('lat', 0) or 0) for p in pockets], dtype=np.float64)
    plons = np.array([float(p.get('lon', 0) or 0) for p in pockets], dtype=np.float64)
    porders = np.array([float(p.get('orders_per_day', 0) or 0) for p in pockets], dtype=np.float64)
    remaining = np.ones(len(pockets), dtype=bool)
    order_rank = np.argsort(-porders)
    for idx in order_rank:
        if not remaining[idx]:
            continue
        dists = osrm_one_to_many(float(plats[idx]), float(plons[idx]), plats[remaining], plons[remaining])
        member_pos = np.where(remaining)[0][np.isfinite(dists) & (dists <= radius_km + 1e-5)]
        if len(member_pos) == 0:
            member_pos = np.array([idx], dtype=np.int64)
        orders = float(np.sum(porders[member_pos]))
        lat = float(np.average(plats[member_pos], weights=porders[member_pos])) if orders > 0 else float(plats[idx])
        lon = float(np.average(plons[member_pos], weights=porders[member_pos])) if orders > 0 else float(plons[idx])
        zone = {
            'lat': round(lat, 4),
            'lon': round(lon, 4),
            'radius_km': round(radius_km, 2),
            'orders_per_day': round(orders, 2),
            'threshold_orders_per_day': round(threshold, 2),
            'status': 'not_worth_serving' if orders + 1e-9 < threshold else 'serveable_tail',
            'policy': policy,
            'num_pockets': int(len(member_pos)),
            'num_cells': int(sum(int((pockets[j].get('num_cells', 0) or 0)) for j in member_pos)),
            'nearest_feasible_rescue': 'Standard override or extra Standard hub' if orders + 1e-9 >= threshold else 'No viable 5 km demand cluster',
        }
        zones.append(zone)
        remaining[member_pos] = False
    excluded_orders = float(sum(z['orders_per_day'] for z in zones if z['status'] == 'not_worth_serving'))
    return {
        'zones': zones,
        'excluded_orders_per_day': round(excluded_orders, 2),
        'excluded_zone_count': int(sum(1 for z in zones if z['status'] == 'not_worth_serving')),
        'radius_km': round(radius_km, 2),
        'threshold_orders_per_day': round(threshold, 2),
        'policy': policy,
        'weights_sum': float(weights_sum),
    }


def _convex_hull_lon_lat(points):
    pts = sorted(set((float(lon), float(lat)) for lat, lon in points))
    if len(pts) <= 1:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def _polygon_from_cell_points(points):
    if not points:
        return []
    if len(points) == 1:
        lat, lon = points[0]
        d = 0.002
        return [
            [round(lat - d, 6), round(lon - d, 6)],
            [round(lat - d, 6), round(lon + d, 6)],
            [round(lat + d, 6), round(lon + d, 6)],
            [round(lat + d, 6), round(lon - d, 6)],
            [round(lat - d, 6), round(lon - d, 6)],
        ]
    hull = _convex_hull_lon_lat(points)
    if len(hull) < 3:
        lats = [lat for lat, _ in points]
        lons = [lon for _, lon in points]
        dlat = max((max(lats) - min(lats)) * 0.3, 0.0015)
        dlon = max((max(lons) - min(lons)) * 0.3, 0.0015)
        lat = float(np.mean(lats))
        lon = float(np.mean(lons))
        return [
            [round(lat - dlat, 6), round(lon - dlon, 6)],
            [round(lat - dlat, 6), round(lon + dlon, 6)],
            [round(lat + dlat, 6), round(lon + dlon, 6)],
            [round(lat + dlat, 6), round(lon - dlon, 6)],
            [round(lat - dlat, 6), round(lon - dlon, 6)],
        ]
    coords = [[round(lat, 6), round(lon, 6)] for lon, lat in hull]
    coords.append(coords[0])
    return coords


def _build_service_gap_polygons(uncovered_pockets, grid_data, stage_label='base'):
    polygons = []
    if not uncovered_pockets:
        return polygons
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    for i, pocket in enumerate(uncovered_pockets, start=1):
        idx = [int(x) for x in pocket.get('cell_indices', [])]
        if idx:
            points = [(float(clat[j]), float(clon[j])) for j in idx]
        else:
            points = [(float(pocket.get('lat', 0) or 0), float(pocket.get('lon', 0) or 0))]
        polygon = _polygon_from_cell_points(points)
        if not polygon:
            continue
        polygons.append({
            'gap_id': f'gap-{stage_label}-{i}',
            'stage': stage_label,
            'lat': round(float(pocket.get('lat', 0) or 0), 5),
            'lon': round(float(pocket.get('lon', 0) or 0), 5),
            'orders_per_day': round(float(pocket.get('orders_per_day', 0) or 0), 2),
            'num_cells': int(pocket.get('num_cells', 0) or 0),
            'polygon': polygon,
        })
    return polygons


def _tier_cost_params(params, tier_name):
    if tier_name == 'mini':
        return (
            float(params.get('mini_base_cost', 20)),
            float(params.get('mini_variable_rate', 6)),
        )
    if tier_name == 'standard':
        return (
            float(params.get('standard_base_cost', 29)),
            float(params.get('standard_variable_rate', 9)),
        )
    return (
        _effective_super_base_cost(params),
        float(params.get('super_variable_rate', 9)),
    )


def _build_applied_override_scenario(grid_data, weights, proposed_costs, proposed_dists,
                                     served_mask, params, override_recs, progress_cb=None):
    recs = list((override_recs or {}).get('recommendations') or [])
    if not recs:
        return {
            'override_count_applied': 0,
            'override_count_by_tier': {},
            'coverage_pct': round(100.0 * float(np.sum(weights[served_mask])) / max(float(np.sum(weights)), 1e-9), 2),
            'remaining_uncovered_orders_per_day': round(float(np.sum(weights[~served_mask])), 2),
            'reaches_hard_coverage': bool(np.sum(weights[~served_mask]) <= 1e-9),
            'service_gap_polygons': [],
            'remaining_uncovered_pockets': [],
            'source': 'base_network',
        }

    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    revised_costs = np.array(proposed_costs, copy=True)
    revised_dists = np.array(proposed_dists, copy=True)
    revised_served = np.array(served_mask, copy=True)
    applied = []
    count_by_tier = {'mini': 0, 'standard': 0, 'super': 0}

    for rec in recs:
        remaining_idx = np.where(~revised_served)[0]
        if len(remaining_idx) == 0:
            break
        dists = osrm_one_to_many(
            float(rec['hub_lat']), float(rec['hub_lon']),
            clat[remaining_idx], clon[remaining_idx]
        )
        rescue_mask = np.isfinite(dists) & (dists <= float(rec['new_radius_km']) + 1e-5)
        if not np.any(rescue_mask):
            continue
        rescue_idx = remaining_idx[rescue_mask]
        base_cost, var_rate = _tier_cost_params(params, str(rec['tier']).lower())
        revised_costs[rescue_idx] = base_cost + var_rate * dists[rescue_mask]
        revised_dists[rescue_idx] = dists[rescue_mask]
        revised_served[rescue_idx] = True
        rescued_orders = float(np.sum(weights[rescue_idx]))
        tier_name = str(rec['tier']).lower()
        count_by_tier[tier_name] = count_by_tier.get(tier_name, 0) + 1
        applied.append({
            'hub_id': rec['hub_id'],
            'tier': tier_name,
            'old_radius_km': rec['old_radius_km'],
            'new_radius_km': rec['new_radius_km'],
            'rescued_orders_per_day': round(rescued_orders, 2),
            'remaining_uncovered_orders_per_day': round(float(np.sum(weights[~revised_served])), 2),
        })
        if progress_cb and len(applied) % 5 == 0:
            progress_cb(f"Applied {len(applied)} targeted override(s)...")

    remaining_mask = ~revised_served
    remaining_pockets = []
    if np.any(remaining_mask):
        remaining_idx = np.where(remaining_mask)[0]
        remaining_pockets = _group_uncovered_pockets(
            clat[remaining_mask], clon[remaining_mask], weights[remaining_mask],
            pocket_radius_km=float(params.get('uncovered_pocket_radius_km', 3.0) or 3.0),
            include_cell_indices=True,
        )
        for pocket in remaining_pockets:
            local_idx = [int(x) for x in pocket.get('cell_indices', [])]
            pocket['cell_indices'] = [int(remaining_idx[j]) for j in local_idx if 0 <= int(j) < len(remaining_idx)]
    gap_polygons = _build_service_gap_polygons(remaining_pockets, grid_data, stage_label='after_overrides')
    coverage_pct = 100.0 * float(np.sum(weights[revised_served])) / max(float(np.sum(weights)), 1e-9)
    avg_cost = float(np.average(revised_costs, weights=weights))
    avg_dist = None
    if np.any(revised_served):
        avg_dist = float(np.average(revised_dists[revised_served], weights=weights[revised_served]))
    return {
        'source': 'targeted_radius_overrides',
        'override_count_applied': len(applied),
        'override_count_by_tier': {k: v for k, v in count_by_tier.items() if v},
        'overrides_applied': applied,
        'coverage_pct': round(coverage_pct, 2),
        'proposed_avg_cost': round(avg_cost, 2),
        'proposed_avg_dist': None if avg_dist is None else round(avg_dist, 3),
        'remaining_uncovered_orders_per_day': round(float(np.sum(weights[remaining_mask])), 2),
        'remaining_gap_count': len(remaining_pockets),
        'reaches_hard_coverage': bool(np.sum(weights[remaining_mask]) <= 1e-9),
        'remaining_uncovered_pockets': [
            {k: v for k, v in pocket.items() if k != 'cell_indices'} for pocket in remaining_pockets
        ],
        'service_gap_polygons': gap_polygons,
    }


def _addressable_coverage_metrics(weights, hard_served_mask, hybrid_mask, low_density_summary, params):
    total_orders = float(np.sum(weights))
    policy = str(params.get('low_density_policy') or 'flag_exclude').lower()
    excluded_orders = float(low_density_summary.get('excluded_orders_per_day', 0) or 0)
    if policy == 'flag_exclude':
        addressable_total = max(total_orders - excluded_orders, 1e-9)
    else:
        addressable_total = max(total_orders, 1e-9)
        excluded_orders = 0.0 if policy == 'always_serve' else excluded_orders
    hard_covered = float(np.sum(weights[hard_served_mask]))
    hybrid_covered = float(np.sum(weights[hybrid_mask]))
    addressable_hard = min(hard_covered, addressable_total)
    addressable_hybrid = min(hybrid_covered, addressable_total)
    return {
        'excluded_low_density_orders_per_day': round(excluded_orders, 2),
        'excluded_low_density_zone_count': int(low_density_summary.get('excluded_zone_count', 0) or 0),
        'full_hard_coverage_pct': round(100.0 * hard_covered / max(total_orders, 1e-9), 2),
        'full_hybrid_coverage_pct': round(100.0 * hybrid_covered / max(total_orders, 1e-9), 2),
        'addressable_hard_coverage_pct': round(100.0 * addressable_hard / max(addressable_total, 1e-9), 2),
        'addressable_hybrid_coverage_pct': round(100.0 * addressable_hybrid / max(addressable_total, 1e-9), 2),
        'addressable_orders_per_day': round(addressable_total, 2),
    }


def _summarize_super_rationalization(weights, d_mini, d_std, d_sup, mini_ds, standard_ds, super_ds, params):
    if not super_ds:
        return {
            'super_count_before': 0,
            'super_count_after': 0,
            'status_counts': {},
            'hubs': [],
            'reduced_super_count': 0,
        }
    rmini = float(params.get('mini_ds_radius', 1.5) or 1.5)
    rstd = float(params.get('standard_ds_radius', 3.0) or 3.0)
    rsup = float(params.get('super_ds_radius', 4.0) or 4.0)
    min_standard = float(params.get('standard_ds_min_orders_per_day', 0) or 0)
    served_by_mini = np.isfinite(d_mini) & (d_mini <= rmini + 1e-5) if mini_ds is not None else np.zeros(len(weights), dtype=bool)
    served_by_std = (~served_by_mini) & np.isfinite(d_std) & (d_std <= rstd + 1e-5) if standard_ds is not None else np.zeros(len(weights), dtype=bool)
    served_by_super = (~served_by_mini) & (~served_by_std) & np.isfinite(d_sup) & (d_sup <= rsup + 1e-5)
    super_served_orders = float(np.sum(weights[served_by_super]))
    hubs = []
    kept = 0
    replaced = 0
    core_required_any = bool(params.get('super_core_must_cover_geojson'))
    avg_super_served = super_served_orders / max(len(super_ds), 1)
    for i, hub in enumerate(super_ds, start=1):
        cluster_orders = float(hub.get('orders_per_day', 0) or 0)
        if hub.get('core_coverage_fill'):
            status = 'mandatory_core'
        elif core_required_any and cluster_orders >= max(min_standard * 2.0, avg_super_served):
            status = 'mandatory_core'
        elif cluster_orders < min_standard and standard_ds:
            status = 'replaced_by_standard'
        elif cluster_orders < max(min_standard * 1.5, 450):
            status = 'tail_required'
        else:
            status = 'kept_due_to_cost'
        if status == 'replaced_by_standard':
            replaced += 1
        else:
            kept += 1
        hubs.append({
            'hub_id': hub.get('id') or f"SUPER-{i}",
            'lat': round(float(hub['lat']), 5),
            'lon': round(float(hub['lon']), 5),
            'orders_per_day': round(cluster_orders, 2),
            'status': status,
            'replacement': 'standard' if status == 'replaced_by_standard' else None,
        })
    status_counts = {}
    for item in hubs:
        status_counts[item['status']] = status_counts.get(item['status'], 0) + 1
    return {
        'super_count_before': len(super_ds),
        'super_count_after': kept,
        'reduced_super_count': replaced,
        'status_counts': status_counts,
        'hubs': hubs,
    }


def _build_uncovered_analysis(uncovered_pockets, params, grid_data, weights, current_costs, proposed_costs, proposed_dists,
                              hard_served_mask, exception_bucket_usage,
                              d_mini, d_std, d_sup, mini_ds, standard_ds, super_ds):
    mini_min = float(params.get('mini_ds_min_orders_per_day', 0) or 0)
    standard_min = float(params.get('standard_ds_min_orders_per_day', 0) or 0)
    super_min = float(params.get('super_ds_min_orders_per_day', 0) or 0)

    pockets = list(uncovered_pockets or [])
    if not pockets:
        return {
            'summary': {
                'pocket_count': 0,
                'largest_pocket_orders_per_day': 0,
                'median_pocket_orders_per_day': 0,
                'pockets_at_or_above_mini_min_orders': 0,
            },
            'recommendations': [
                "All demand is covered under the current tier radii and hub placements."
            ],
            'fixed_radius_scenarios': [],
            'radius_override_recommendations': {'recommendations': [], 'summary': {'override_count': 0}},
            'service_gap_polygons': [],
        }

    pocket_orders = np.array([float(p.get('orders_per_day', 0) or 0) for p in pockets], dtype=np.float64)
    largest_pocket = float(np.max(pocket_orders)) if len(pocket_orders) else 0.0
    median_pocket = float(np.median(pocket_orders)) if len(pocket_orders) else 0.0

    def _sum_lt(limit):
        mask = pocket_orders < limit
        return int(mask.sum()), float(pocket_orders[mask].sum())

    bands = {}
    for limit in (10, 25, 50, 100, 200, 300):
        cnt, orders = _sum_lt(limit)
        bands[f'lt_{limit}'] = {'pockets': cnt, 'orders_per_day': round(orders, 0)}

    pockets_ge_mini = int(np.sum(pocket_orders >= mini_min))
    orders_ge_mini = float(np.sum(pocket_orders[pocket_orders >= mini_min]))

    threshold_opportunities = []
    for threshold in (250, 200, 150, 100, 50):
        eligible = pocket_orders >= threshold
        threshold_opportunities.append({
            'min_orders_per_day': threshold,
            'eligible_pockets': int(np.sum(eligible)),
            'eligible_orders_per_day': round(float(np.sum(pocket_orders[eligible])), 0),
        })

    summary = {
        'pocket_count': len(pockets),
        'largest_pocket_orders_per_day': round(largest_pocket, 0),
        'median_pocket_orders_per_day': round(median_pocket, 1),
        'pockets_at_or_above_mini_min_orders': pockets_ge_mini,
        'orders_in_pockets_at_or_above_mini_min_orders': round(orders_ge_mini, 0),
        'mini_min_orders_per_day': round(mini_min, 0),
        'standard_min_orders_per_day': round(standard_min, 0),
        'super_min_orders_per_day': round(super_min, 0),
        'bands': bands,
        'threshold_opportunities': threshold_opportunities,
    }

    rmini = float(params.get('mini_ds_radius', 1.5))
    rstd = float(params.get('standard_ds_radius', 3.0))
    rsup = float(params.get('super_ds_radius', 4.0))
    ref_mini_radius = min(5.0, round(max(rmini, 1.8), 2))
    ref_standard_radius = min(5.0, round(max(rstd, 5.0), 2))
    ref_super_radius = min(5.0, round(max(rsup, 5.0), 2))

    scenario_specs = []

    if mini_ds:
        for r in sorted(set(round(v, 2) for v in (rmini + 0.3, rmini + 0.5, 1.8, 2.0) if v > rmini)):
            if r <= 5.0:
                scenario_specs.append({
                    'label': f'Increase Mini radius to {r:.1f} km',
                    'mini_radius': r,
                    'standard_radius': rstd,
                    'super_radius': rsup,
                })

    if standard_ds:
        for r in sorted(set(round(v, 2) for v in (rstd + 0.5, rstd + 1.0, 4.0, 5.0) if v > rstd)):
            if r <= 5.0:
                scenario_specs.append({
                    'label': f'Increase Standard radius to {r:.1f} km',
                    'mini_radius': rmini,
                    'standard_radius': r,
                    'super_radius': rsup,
                })

    if mini_ds and standard_ds:
        combo_m = min(5.0, round(max(rmini + 0.3, 1.8), 2))
        combo_s = min(5.0, round(max(rstd + 1.0, 5.0), 2))
        scenario_specs.append({
            'label': f'Mini {combo_m:.1f} km + Standard {combo_s:.1f} km',
            'mini_radius': combo_m,
            'standard_radius': combo_s,
            'super_radius': rsup,
        })

    seen_labels = set()
    fixed_scenarios = []
    for spec in scenario_specs:
        if spec['label'] in seen_labels:
            continue
        seen_labels.add(spec['label'])
        sim = _simulate_fixed_tier_network(
            weights, current_costs, d_mini, d_std, d_sup, params,
            mini_ds, standard_ds, super_ds,
            mini_radius=spec['mini_radius'],
            standard_radius=spec['standard_radius'],
            super_radius=spec['super_radius'],
        )
        sim['label'] = spec['label']
        fixed_scenarios.append(sim)

    fixed_scenarios.sort(key=lambda s: (-s['coverage_pct'], s['proposed_avg_cost'], s['uncovered_orders_per_day']))
    fixed_scenarios = fixed_scenarios[:6]

    class_counts = {
        'threshold_limited': {'pockets': 0, 'orders_per_day': 0.0},
        'radius_limited': {'pockets': 0, 'orders_per_day': 0.0},
        'threshold_and_radius_limited': {'pockets': 0, 'orders_per_day': 0.0},
        'needs_more_hubs_or_super': {'pockets': 0, 'orders_per_day': 0.0},
    }
    classified_pockets = []
    ref_mini_cover = np.isfinite(d_mini) & (d_mini <= ref_mini_radius + 1e-5) if mini_ds else np.zeros(len(weights), dtype=bool)
    ref_std_cover = np.isfinite(d_std) & (d_std <= ref_standard_radius + 1e-5) if standard_ds else np.zeros(len(weights), dtype=bool)
    ref_sup_cover = (
        np.isfinite(d_sup) & (d_sup <= ref_super_radius + 1e-5)
        if super_ds and not _super_overlay_only(params)
        else np.zeros(len(weights), dtype=bool)
    )

    tier_thresholds = []
    for enabled, tier_name, tier_min, tier_max in (
        (bool(mini_ds), 'mini', mini_min, float(params.get('mini_ds_max_orders_per_day', 0) or 0)),
        (bool(standard_ds), 'standard', standard_min, float(params.get('standard_ds_max_orders_per_day', 0) or 0)),
        (bool(super_ds) and not _super_overlay_only(params), 'super', super_min, float(params.get('super_ds_max_orders_per_day', 0) or 0)),
    ):
        if enabled:
            tier_thresholds.append({
                'tier': tier_name,
                'min_orders_per_day': tier_min,
                'max_orders_per_day': tier_max,
            })

    def _eligible_tiers_for_orders(orders_per_day):
        eligible = []
        for tier in tier_thresholds:
            lower = tier['min_orders_per_day']
            upper = tier['max_orders_per_day']
            if orders_per_day >= lower and (upper <= 0 or orders_per_day <= upper):
                eligible.append(tier['tier'])
        return eligible

    for pocket in pockets:
        idx = np.array(pocket.get('cell_indices', []), dtype=np.int64)
        pocket_order = float(pocket.get('orders_per_day', 0) or 0)
        eligible_tiers = _eligible_tiers_for_orders(pocket_order)
        threshold_limited = len(eligible_tiers) == 0
        recoverable_orders = 0.0
        recoverable_share = 0.0
        if len(idx):
            rec_mask = ref_mini_cover[idx] | ref_std_cover[idx] | ref_sup_cover[idx]
            cell_weights = weights[idx]
            recoverable_orders = float(np.sum(cell_weights[rec_mask]))
            recoverable_share = recoverable_orders / max(float(np.sum(cell_weights)), 1e-9)
        radius_helpful = recoverable_share >= 0.5

        if threshold_limited and radius_helpful:
            label = 'threshold_and_radius_limited'
        elif threshold_limited:
            label = 'threshold_limited'
        elif radius_helpful:
            label = 'radius_limited'
        else:
            label = 'needs_more_hubs_or_super'

        class_counts[label]['pockets'] += 1
        class_counts[label]['orders_per_day'] += pocket_order
        classified_pockets.append({
            'lat': pocket.get('lat'),
            'lon': pocket.get('lon'),
            'orders_per_day': pocket_order,
            'num_cells': pocket.get('num_cells'),
            'classification': label,
            'eligible_tiers_under_current_thresholds': eligible_tiers,
            'radius_recoverable_share': round(100.0 * recoverable_share, 1),
        })

    for val in class_counts.values():
        val['orders_per_day'] = round(val['orders_per_day'], 0)

    override_recs = _build_radius_override_recommendations(
        grid_data, weights, proposed_costs, hard_served_mask, params,
        mini_ds, standard_ds, super_ds
    )
    base_service_gap_polygons = _build_service_gap_polygons(pockets, grid_data, stage_label='base')
    applied_override = _build_applied_override_scenario(
        grid_data, weights, proposed_costs, proposed_dists, hard_served_mask, params, override_recs
    )
    low_density = _build_low_density_zones(pockets, params, float(np.sum(weights)))

    recommendations = []
    if pockets_ge_mini == 0:
        recommendations.append(
            f"None of the uncovered pockets reaches the current Mini minimum of {mini_min:.0f} orders/day; "
            f"the largest uncovered pocket is only {largest_pocket:.0f}/day."
        )
    for opp in threshold_opportunities[:3]:
        if opp['eligible_pockets'] > 0:
            recommendations.append(
                f"If the effective minimum were {opp['min_orders_per_day']:.0f} orders/day, "
                f"{opp['eligible_pockets']} uncovered pockets totaling {opp['eligible_orders_per_day']:.0f} orders/day "
                f"would become threshold-eligible."
            )
            break
    small_50 = bands['lt_50']
    if small_50['pockets'] > 0:
        recommendations.append(
            f"{small_50['pockets']} uncovered pockets are below 50 orders/day and together account for "
            f"{small_50['orders_per_day']:.0f} orders/day."
        )
    small_100 = bands['lt_100']
    recommendations.append(
        f"{small_100['pockets']} of {len(pockets)} uncovered pockets are below 100 orders/day."
    )

    if fixed_scenarios:
        best = fixed_scenarios[0]
        recommendations.append(
            f"With the current 200 hub locations held fixed, the best nearby radius scenario tested was "
            f"'{best['label']}', which reaches {best['coverage_pct']:.2f}% coverage at ₹{best['proposed_avg_cost']:.2f}/order."
        )
        if best['coverage_pct'] < 100.0:
            recommendations.append(
                "So radius expansion alone does not fully close the gap here; to get to 100% coverage you will likely "
                "need either lower minimum-orders thresholds for small pockets, more hubs, or active Super coverage."
            )
        else:
            recommendations.append(
                "This means 100% coverage is achievable from the same placed hubs by widening service radii, with the "
                "tradeoff reflected in the higher weighted average last-mile cost."
            )
    ta = class_counts['threshold_and_radius_limited']
    rl = class_counts['radius_limited']
    tl = class_counts['threshold_limited']
    mh = class_counts['needs_more_hubs_or_super']
    if ta['pockets'] > 0:
        recommendations.append(
            f"{ta['pockets']} pockets ({ta['orders_per_day']:.0f} orders/day) are both threshold-limited and radius-limited "
            f"under the current rules."
        )
    if rl['pockets'] > 0:
        recommendations.append(
            f"{rl['pockets']} pockets ({rl['orders_per_day']:.0f} orders/day) look primarily radius-limited under the reference "
            f"wider-radius scenario."
        )
    if tl['pockets'] > 0:
        recommendations.append(
            f"{tl['pockets']} pockets ({tl['orders_per_day']:.0f} orders/day) remain below the current Mini threshold and are "
            "not rescued by the tested radius expansion."
        )
    if mh['pockets'] > 0:
        recommendations.append(
            f"{mh['pockets']} pockets ({mh['orders_per_day']:.0f} orders/day) likely need extra hubs, lower thresholds, "
            "or active Super placement rather than radius tuning alone."
        )
    o_sum = override_recs.get('summary', {})
    if o_sum.get('override_count', 0) > 0:
        recommendations.append(
            f"Per-hub radius overrides can rescue the remaining demand more precisely: {o_sum['override_count']} "
            f"candidate override(s) reduce uncovered demand from {o_sum.get('base_uncovered_orders_per_day', 0):.0f}/day "
            f"to {o_sum.get('remaining_uncovered_orders_per_day', 0):.0f}/day."
        )
    if applied_override.get('override_count_applied', 0) > 0:
        by_tier = applied_override.get('override_count_by_tier', {})
        tier_bits = []
        if by_tier.get('standard'):
            tier_bits.append(f"{by_tier['standard']} Standard")
        if by_tier.get('mini'):
            tier_bits.append(f"{by_tier['mini']} Mini")
        if by_tier.get('super'):
            tier_bits.append(f"{by_tier['super']} Super")
        tier_text = ', '.join(tier_bits) if tier_bits else f"{applied_override['override_count_applied']} hubs"
        recommendations.append(
            f"If you apply the targeted override set ({tier_text}), hard coverage moves to "
            f"{applied_override.get('coverage_pct', 0):.2f}% with "
            f"{applied_override.get('remaining_uncovered_orders_per_day', 0):.0f}/day still outside policy."
        )
        if applied_override.get('reaches_hard_coverage'):
            recommendations.append(
                "So the remaining service gaps can be closed by extending specific nearby hubs, without needing blanket radius inflation."
            )
    if low_density.get('excluded_zone_count', 0) > 0:
        recommendations.append(
            f"{low_density['excluded_zone_count']} tail zone(s) still stay below "
            f"{low_density['threshold_orders_per_day']:.0f} orders/day even inside a "
            f"{low_density['radius_km']:.1f} km radius, so they are flagged as not worth serving."
        )
    if low_density.get('policy') == 'flag_exclude':
        recommendations.append(
            f"Under low-density policy '{low_density['policy']}', those zones are excluded from the addressable coverage denominator, "
            "while full-demand coverage is still reported separately."
        )
    if str(params.get('coverage_mode') or 'hybrid').lower() == 'hybrid' and exception_bucket_usage.get('allowed_orders_per_day') is not None:
        recommendations.append(
            f"Hybrid mode allows up to {exception_bucket_usage.get('allowed_orders_per_day', 0):.0f} orders/day in the "
            f"explicit over-radius bucket with max extra distance {exception_bucket_usage.get('max_extra_distance_km', 0):.1f} km."
        )

    return {
        'summary': summary,
        'classification_counts': class_counts,
        'classified_pockets': classified_pockets,
        'reference_radii_for_classification': {
            'mini_radius_km': ref_mini_radius,
            'standard_radius_km': ref_standard_radius,
            'super_radius_km': ref_super_radius,
        },
        'fixed_radius_scenarios': fixed_scenarios,
        'radius_override_recommendations': override_recs,
        'applied_override_scenario': applied_override,
        'base_service_gap_polygons': base_service_gap_polygons,
        'service_gap_polygons': applied_override.get('service_gap_polygons') or base_service_gap_polygons,
        'service_gap_source': applied_override.get('source', 'base_network') if applied_override.get('service_gap_polygons') else 'base_network',
        'low_density_zones': low_density['zones'],
        'excluded_low_density_orders_per_day': low_density['excluded_orders_per_day'],
        'excluded_low_density_zone_count': low_density['excluded_zone_count'],
        'low_density_zone_radius_km': low_density['radius_km'],
        'low_density_min_orders_per_day': low_density['threshold_orders_per_day'],
        'low_density_policy': low_density['policy'],
        'hybrid_result': {
            'coverage_pct': round(
                100.0 * float(exception_bucket_usage.get('hybrid_covered_orders_per_day', 0.0)) / max(float(np.sum(weights)), 1e-9),
                2,
            ),
            'feasible': bool(exception_bucket_usage.get('feasible')),
            'remaining_orders_per_day': exception_bucket_usage.get('remaining_after_hybrid_orders_per_day'),
        },
        'recommendations': recommendations,
    }


def recalculate_metrics_for_uniform_base_shift(metrics, delta):
    """Recompute avg costs when all base payouts shift by the same delta (same distances)."""
    cc = float(metrics['current_avg_cost']) + delta
    pc = float(metrics['proposed_avg_cost']) + delta
    daily_savings = (cc - pc) * state.orders_per_day
    return {
        'current_avg_cost': round(cc, 2),
        'proposed_avg_cost': round(pc, 2),
        'daily_savings': round(max(0, daily_savings), 0),
        'monthly_savings': round(max(0, daily_savings) * 30, 0),
        'pct_cost_reduction': round((cc - pc) / max(cc, 0.01) * 100, 1),
    }

# ============================================================================
# CONSTRAINT-DRIVEN OPTIMIZER — maximize coverage within hub count / cost limits
# ============================================================================

def optimize_with_constraints(grid_data, existing_stores, params, progress_cb=None):
    """Constraint-driven optimizer: maximize order coverage within hub-count and/or cost limits.

    **Unified greedy**: places one hub at a time (best Mini or Standard candidate),
    always picking the option that covers the most *currently-uncovered* demand.
    Stops when the hub-count constraint is hit.  No post-hoc trimming — every hub
    placed is the highest-value hub at that moment, so no high-demand pocket
    (like 481 orders/day Koramangala) can be orphaned by a later trim.

    Constraints (at least one required, passed in params):
        target_max_hubs       — int, max total hubs (Mini + Standard + Super)
        target_last_mile_cost — float, max avg last-mile cost (₹)

    Primary goal: ALWAYS maximize order coverage.
    No satellite backfill — uncovered demand is reported honestly.

    Returns dict with placement, metrics, and uncovered_pockets.
    """
    require_osrm()
    params = normalize_placement_params(params)
    requested_counts = _requested_tier_counts(params)

    target_max_hubs = params.get('target_max_hubs')
    target_cost = params.get('target_last_mile_cost')

    if target_max_hubs is None and target_cost is None:
        target_max_hubs = int(params.get('default_planner_max_hubs', 200) or 200)

    if target_max_hubs is not None:
        target_max_hubs = int(target_max_hubs)
    else:
        target_max_hubs = 9999  # effectively unlimited

    requested_total = sum(v for v in requested_counts.values() if v is not None)
    if requested_total and target_max_hubs != 9999 and requested_total > target_max_hubs:
        raise ValueError(
            f"Requested exact tier counts total {requested_total} exceeds target_max_hubs={target_max_hubs}"
        )

    rmini = float(params.get('mini_ds_radius', 1.5))
    rstd = float(params.get('standard_ds_radius', 3.0))
    rsup = float(params.get('super_ds_radius', 4.0))
    m_lo, m_hi = _tier_min_max_orders(params, 'mini')
    s_lo, s_hi = _tier_min_max_orders(params, 'standard')
    p_lo, p_hi = _tier_min_max_orders(params, 'super')

    mb = float(params.get('mini_base_cost', 20))
    mvar = float(params.get('mini_variable_rate', 6))
    sb = float(params.get('standard_base_cost', 29))
    svar = float(params.get('standard_variable_rate', 9))
    pbb = _effective_super_base_cost(params)
    pvar = float(params.get('super_variable_rate', 9))
    base_cost = float(params.get('base_cost', 29))
    var_rate = float(params.get('variable_rate', 9))
    overlay_super = _super_overlay_only(params)

    t_start = time.time()
    n_cells = len(grid_data) if grid_data is not None else 0
    logger.info(
        "Constraint optimizer (unified greedy): %d grid cells, target_max_hubs=%s, "
        "target_cost=%s, requested_counts=%s",
        n_cells, target_max_hubs, target_cost, requested_counts,
    )

    # ── Working arrays ──────────────────────────────────────────────────────
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts  = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)

    # Track which cells are already covered by a placed hub
    covered = np.zeros(n, dtype=bool)

    mini_ds = []
    standard_ds = []
    super_ds = []
    mini_max = int(params.get('mini_ds_max', 300))
    std_max  = int(params.get('standard_ds_max', 500))
    super_max = int(params.get('super_ds_max', 120))

    # Each tier maintains its own "remaining" grid (cells not yet consumed by
    # that tier's greedy).  Overlapping means a cell consumed by Mini can still
    # be consumed by Standard and vice-versa.
    mini_remaining = grid_data.sort_values('orders_per_day', ascending=False).copy()
    std_remaining  = grid_data.sort_values('orders_per_day', ascending=False).copy()
    super_remaining = grid_data.sort_values('orders_per_day', ascending=False).copy()

    mini_exhausted = False
    std_exhausted  = False
    super_exhausted = False
    consecutive_skips = {'mini': 0, 'standard': 0, 'super': 0}
    MAX_SKIPS = 200

    track_coverage_trace = bool(params.get('collect_coverage_trace'))
    coverage_trace = []

    if progress_cb:
        progress_cb("Unified greedy: placing Mini / Standard / Super hubs one at a time (best coverage first)...")
    super_role = str(params.get('super_role') or 'backbone_tail').lower()

    # ── Unified greedy loop ─────────────────────────────────────────────────
    hub_count = 0
    iteration = 0
    max_iterations = (mini_max + std_max + super_max + MAX_SKIPS * 3) * 2

    while hub_count < target_max_hubs and iteration < max_iterations:
        iteration += 1

        all_requested_counts_met = (
            (requested_counts['mini'] is None or len(mini_ds) >= requested_counts['mini']) and
            (requested_counts['standard'] is None or len(standard_ds) >= requested_counts['standard']) and
            (requested_counts['super'] is None or len(super_ds) >= requested_counts['super'])
        )
        if all_requested_counts_met and requested_total:
            logger.info("All requested exact tier counts satisfied — stopping.")
            break

        if mini_exhausted and std_exhausted and super_exhausted:
            logger.info("All tiers exhausted — stopping.")
            break

        # ── Try to form one candidate hub from each tier ────────────────
        mini_candidate = None
        std_candidate  = None
        super_candidate = None

        if not mini_exhausted and len(mini_ds) < mini_max and len(mini_remaining) > 0:
            mini_candidate = _try_greedy_hub(
                mini_remaining, clat, clon, wts, covered,
                rmini, m_lo, m_hi, 'mini', '4k', params=params
            )
            if mini_candidate is None:
                # Drop top cell and retry next iteration
                best_idx = mini_remaining['orders_per_day'].idxmax()
                mini_remaining = mini_remaining.drop(best_idx)
                consecutive_skips['mini'] += 1
                if consecutive_skips['mini'] >= MAX_SKIPS or len(mini_remaining) == 0:
                    mini_exhausted = True
                    logger.info("Mini tier exhausted (%d hubs placed).", len(mini_ds))

        if not std_exhausted and len(standard_ds) < std_max and len(std_remaining) > 0:
            std_candidate = _try_greedy_hub(
                std_remaining, clat, clon, wts, covered,
                rstd, s_lo, s_hi, 'standard', '15k', params=params
            )
            if std_candidate is None:
                best_idx = std_remaining['orders_per_day'].idxmax()
                std_remaining = std_remaining.drop(best_idx)
                consecutive_skips['standard'] += 1
                if consecutive_skips['standard'] >= MAX_SKIPS or len(std_remaining) == 0:
                    std_exhausted = True
                    logger.info("Standard tier exhausted (%d hubs placed).", len(standard_ds))

        if not super_exhausted and len(super_ds) < super_max and len(super_remaining) > 0:
            super_candidate = _try_greedy_hub(
                super_remaining, clat, clon, wts, covered,
                rsup, p_lo, p_hi, 'super', '30k', params=params
            )
            if super_candidate is None:
                best_idx = super_remaining['orders_per_day'].idxmax()
                super_remaining = super_remaining.drop(best_idx)
                consecutive_skips['super'] += 1
                if consecutive_skips['super'] >= MAX_SKIPS or len(super_remaining) == 0:
                    super_exhausted = True
                    logger.info("Super tier exhausted (%d hubs placed).", len(super_ds))

        if mini_candidate is None and std_candidate is None and super_candidate is None:
            continue  # both failed this round; skip counts already incremented

        if super_role in {'backbone_tail', 'overlay_core_only'} and (mini_candidate is not None or std_candidate is not None):
            super_candidate = None
        elif super_role == 'tail_only':
            super_candidate = None
        elif super_role == 'overlay_core_only':
            super_candidate = None

        # ── Pick the candidate that covers the most *uncovered* demand ──
        ordered_candidates = [
            ('mini', mini_candidate),
            ('standard', std_candidate),
            ('super', super_candidate),
        ]
        viable_candidates = [(tier, cand) for tier, cand in ordered_candidates if cand is not None]
        if not viable_candidates:
            continue
        preference_mode = str(params.get('super_tail_preference') or 'prefer_standard').lower()
        def _candidate_key(item):
            tier, cand = item
            pref = 0
            if preference_mode == 'prefer_standard':
                pref = 3 if tier == 'standard' else (2 if tier == 'mini' else 0)
            elif preference_mode == 'super_last_resort':
                pref = 2 if tier in {'mini', 'standard'} else -1
            coverage = float(cand.get('new_coverage', 0.0) or 0.0)
            modeled_cost = float(cand.get('modeled_daily_cost', 0.0) or 0.0)
            efficiency = coverage / max(modeled_cost, 1e-9)
            return (coverage, pref, efficiency, -modeled_cost)
        chosen_tier, chosen = max(viable_candidates, key=_candidate_key)
        hub = chosen['hub']

        if chosen_tier == 'mini':
            mini_ds.append(hub)
            mini_remaining = mini_remaining[~chosen['grid_mask']]
            consecutive_skips['mini'] = 0
        elif chosen_tier == 'standard':
            standard_ds.append(hub)
            std_remaining = std_remaining[~chosen['grid_mask']]
            consecutive_skips['standard'] = 0
        else:
            super_ds.append(hub)
            super_remaining = super_remaining[~chosen['grid_mask']]
            consecutive_skips['super'] = 0

        # Mark newly-covered cells
        covered[chosen['covered_cell_indices']] = True
        hub_count += 1
        if track_coverage_trace:
            covered_orders = float(wts[covered].sum())
            coverage_trace.append({
                'hub_cap': hub_count,
                'mini_count': len(mini_ds),
                'standard_count': len(standard_ds),
                'super_count': len(super_ds),
                'coverage_pct': round(100.0 * covered_orders / max(float(wts.sum()), 1e-9), 2),
                'covered_orders_per_day': round(covered_orders, 0),
                'uncovered_orders_per_day': round(float(wts.sum()) - covered_orders, 0),
            })

        if hub_count % 10 == 0 and progress_cb:
            pct = 100.0 * float(wts[covered].sum()) / max(float(wts.sum()), 1e-9)
            progress_cb(
                f"Hub {hub_count}/{target_max_hubs}: "
                f"{len(mini_ds)} Mini + {len(standard_ds)} Std + {len(super_ds)} Super, "
                f"coverage {pct:.1f}%"
            )

    if params.get('super_core_must_cover_geojson'):
        if progress_cb:
            progress_cb("Applying Super core coverage requirement...")
        before_super = len(super_ds)
        super_ds = fill_super_core_coverage(grid_data, super_ds, params, progress_cb=progress_cb)
        added_super = len(super_ds) - before_super
        if added_super > 0:
            logger.info("Constraint optimizer: added %d Super hub(s) for core coverage.", added_super)
            if track_coverage_trace:
                covered_after_fill = float(wts[covered].sum())
                coverage_trace.append({
                    'hub_cap': len(mini_ds) + len(standard_ds) + len(super_ds),
                    'mini_count': len(mini_ds),
                    'standard_count': len(standard_ds),
                    'super_count': len(super_ds),
                    'coverage_pct': round(100.0 * covered_after_fill / max(float(wts.sum()), 1e-9), 2),
                    'covered_orders_per_day': round(covered_after_fill, 0),
                    'uncovered_orders_per_day': round(float(wts.sum()) - covered_after_fill, 0),
                    'note': 'after_super_core_fill',
                })

    coverage_fill_meta = {'coverage_satellites': 0, 'coverage_complete': True}
    if params.get('require_full_tier_coverage', True):
        if progress_cb:
            if overlay_super:
                progress_cb("Filling remaining customer gaps with Mini / Standard only...")
            else:
                progress_cb("Filling remaining customer gaps with serving tiers...")
        fill_params = dict(params)
        fill_params['mini_ds_max'] = min(int(fill_params.get('mini_ds_max', 300) or 300), target_max_hubs)
        fill_params['standard_ds_max'] = min(int(fill_params.get('standard_ds_max', 500) or 500), target_max_hubs)
        fill_params['super_ds_max'] = min(int(fill_params.get('super_ds_max', 120) or 120), target_max_hubs)
        remaining_capacity = max(0, target_max_hubs - (len(mini_ds) + len(standard_ds) + len(super_ds)))
        if remaining_capacity > 0:
            if overlay_super:
                fill_params['super_ds_max'] = len(super_ds)
            before_counts = (len(mini_ds), len(standard_ds), len(super_ds))
            mini_ds, standard_ds, super_ds, coverage_fill_meta = ensure_full_network_coverage(
                grid_data, mini_ds, standard_ds, super_ds, fill_params, progress_cb=progress_cb
            )
            added_counts = (
                len(mini_ds) - before_counts[0],
                len(standard_ds) - before_counts[1],
                len(super_ds) - before_counts[2],
            )
            if any(x > 0 for x in added_counts):
                logger.info(
                    "Constraint optimizer coverage fill: +%d Mini, +%d Standard, +%d Super; complete=%s",
                    added_counts[0], added_counts[1], added_counts[2],
                    coverage_fill_meta.get('coverage_complete', True),
                )
        else:
            coverage_fill_meta = {'coverage_satellites': 0, 'coverage_complete': False}

    hub_count = len(mini_ds) + len(standard_ds) + len(super_ds)
    logger.info(
        "Unified greedy done: %d Mini + %d Standard + %d Super = %d hubs",
        len(mini_ds), len(standard_ds), len(super_ds), hub_count,
    )

    # ── Compute final metrics (current vs proposed) ─────────────────────────
    if progress_cb:
        progress_cb("Computing final metrics with OSRM...")

    def _min_d(hubs, label=""):
        if not hubs:
            return np.full(n, np.inf)
        hl = np.array([h['lat'] for h in hubs], dtype=np.float64)
        ho = np.array([h['lon'] for h in hubs], dtype=np.float64)
        return osrm_min_distances_parallel(clat, clon, hl, ho,
                    progress_cb=lambda d, t: progress_cb(f"{label} dist: {d}/{t}") if progress_cb else None)

    # Current network distances
    cust_lats  = grid_data['avg_cust_lat'].values
    cust_lons  = grid_data['avg_cust_lon'].values
    store_lats = grid_data['avg_store_lat'].values
    store_lons = grid_data['avg_store_lon'].values

    current_dists = osrm_pairwise_distances_parallel(
        cust_lats, cust_lons, store_lats, store_lons,
        progress_cb=lambda d, t: progress_cb(f"Current dist: {d}/{t}") if progress_cb else None
    )
    current_costs = base_cost + var_rate * current_dists
    current_avg_dist = float(np.average(current_dists, weights=wts))
    current_avg_cost = float(np.average(current_costs, weights=wts))
    current_policy = _build_current_policy_breach_summary(grid_data, current_dists, wts, params)

    # Proposed network distances
    d_mini_final = _min_d(mini_ds, "Mini") if mini_ds else np.full(n, np.inf)
    d_std_final  = _min_d(standard_ds, "Std") if standard_ds else np.full(n, np.inf)
    d_sup_final  = _min_d(super_ds, "Super") if super_ds else np.full(n, np.inf)

    proposed_dists = np.full(n, np.nan)
    proposed_costs = np.zeros(n)

    for i in range(n):
        if mini_ds and d_mini_final[i] <= rmini + 1e-5:
            proposed_dists[i] = d_mini_final[i]
            proposed_costs[i] = mb + mvar * d_mini_final[i]
        elif standard_ds and d_std_final[i] <= rstd + 1e-5:
            proposed_dists[i] = d_std_final[i]
            proposed_costs[i] = sb + svar * d_std_final[i]
        elif super_ds and (not overlay_super) and d_sup_final[i] <= rsup + 1e-5:
            proposed_dists[i] = d_sup_final[i]
            proposed_costs[i] = pbb + pvar * d_sup_final[i]
        else:
            proposed_dists[i] = np.nan
            proposed_costs[i] = current_costs[i]

    proposed_policy = _summarize_proposed_policy(
        wts, current_costs, proposed_costs,
        d_mini_final, d_std_final, d_sup_final,
        mini_ds, standard_ds, super_ds, params,
    )
    served_final = proposed_policy['hard_served_mask']
    uncovered_final = ~served_final
    hybrid_mask = served_final | proposed_policy['exception_bucket_usage'].get('selected_mask', np.zeros(n, dtype=bool))
    modeled_cost = _modeled_cost_summary(wts, proposed_costs, params, len(super_ds))
    super_rationalization_summary = _summarize_super_rationalization(
        wts, d_mini_final, d_std_final, d_sup_final, mini_ds, standard_ds, super_ds, params
    )

    # Cost constraint check
    proposed_avg_cost = float(np.average(proposed_costs, weights=wts))
    modeled_avg_cost = float(modeled_cost['avg_modeled_cost_per_order'])
    if target_cost is not None:
        if modeled_avg_cost > target_cost:
            logger.info("Cost constraint: modeled avg=₹%.2f > target=₹%.2f — more hubs or fewer expensive Super hubs needed",
                        modeled_avg_cost, target_cost)
        else:
            logger.info("Cost constraint met: modeled avg=₹%.2f <= target=₹%.2f", modeled_avg_cost, target_cost)

    # Final coverage stats
    total_orders_day = float(wts.sum())
    final_covered_orders   = float(wts[served_final].sum())
    final_uncovered_orders = float(wts[uncovered_final].sum())
    final_coverage_pct     = 100.0 * final_covered_orders / max(total_orders_day, 1e-9)

    proposed_avg_dist = None
    if np.any(served_final):
        proposed_avg_dist = float(np.average(proposed_dists[served_final], weights=wts[served_final]))

    daily_savings = (current_avg_cost - proposed_avg_cost) * state.orders_per_day

    # Distance distribution
    bins = [0, 1, 2, 3, 4, 5, np.inf]
    labels = ['0-1km', '1-2km', '2-3km', '3-4km', '4-5km', '5+km']
    hist_map = {}
    for i_b in range(len(bins) - 1):
        m = served_final & (proposed_dists >= bins[i_b]) & (proposed_dists < bins[i_b + 1])
        hist_map[labels[i_b]] = float(wts[m].sum())
    if np.any(uncovered_final):
        hist_map['Uncovered (current network)'] = float(wts[uncovered_final].sum())

    # ── Uncovered demand pockets (3km grouping) ─────────────────────────────
    if progress_cb:
        progress_cb("Grouping uncovered demand into 3km pockets...")

    uncovered_pocket_radius_km = float(params.get('uncovered_pocket_radius_km', 3.0) or 3.0)
    uncovered_pockets = []
    if np.any(uncovered_final):
        uncovered_idx = np.where(uncovered_final)[0]
        uncovered_pockets = _group_uncovered_pockets(
            clat[uncovered_final], clon[uncovered_final], wts[uncovered_final],
            pocket_radius_km=uncovered_pocket_radius_km, progress_cb=progress_cb,
            include_cell_indices=True,
        )
        for pocket in uncovered_pockets:
            local_idx = [int(x) for x in pocket.get('cell_indices', [])]
            pocket['cell_indices'] = [int(uncovered_idx[j]) for j in local_idx if 0 <= int(j) < len(uncovered_idx)]

    total_elapsed = time.time() - t_start
    logger.info(
        "Constraint optimizer complete: %.1fs, %d Mini + %d Std + %d Super = %d hubs, %.1f%% coverage",
        total_elapsed, len(mini_ds), len(standard_ds), len(super_ds),
        len(mini_ds) + len(standard_ds) + len(super_ds), final_coverage_pct
    )

    analysis = _build_uncovered_analysis(
        uncovered_pockets, params, grid_data, wts, current_costs, proposed_costs, proposed_dists,
        served_final, proposed_policy['exception_bucket_usage'],
        d_mini_final, d_std_final, d_sup_final,
        mini_ds, standard_ds, super_ds,
    )
    analysis['uncovered_pocket_radius_km'] = round(uncovered_pocket_radius_km, 2)
    analysis['super_rationalization_summary'] = super_rationalization_summary
    rationalized_penalty = float(params.get('super_infra_penalty_per_day', 0) or 0) * float(super_rationalization_summary.get('super_count_after', len(super_ds)))
    analysis['super_rationalized_scenario'] = {
        'super_hubs_before': len(super_ds),
        'super_hubs_after': int(super_rationalization_summary.get('super_count_after', len(super_ds))),
        'reduced_super_count': int(super_rationalization_summary.get('reduced_super_count', 0)),
        'modeled_avg_cost_per_order_after_penalty_only': round(
            (modeled_cost['delivery_cost_per_day'] + rationalized_penalty) / max(float(np.sum(wts)), 1e-9), 2
        ),
        'note': 'Penalty-only rationalized scenario; coverage and delivery routing stay unchanged until replacements are explicitly applied.',
    }
    addressable = _addressable_coverage_metrics(
        wts, served_final, hybrid_mask,
        {
            'excluded_orders_per_day': analysis.get('excluded_low_density_orders_per_day', 0),
            'excluded_zone_count': analysis.get('excluded_low_density_zone_count', 0),
        },
        params,
    )

    metrics = {
        'current_avg_dist': round(current_avg_dist, 3),
        'proposed_avg_dist': round(proposed_avg_dist, 3) if proposed_avg_dist is not None else None,
        'current_avg_cost': round(current_avg_cost, 2),
        'proposed_avg_cost': round(proposed_avg_cost, 2),
        'avg_modeled_cost_per_order': round(modeled_avg_cost, 2),
        'delivery_cost_per_day': round(modeled_cost['delivery_cost_per_day'], 2),
        'super_penalty_cost_per_day': round(modeled_cost['super_penalty_cost_per_day'], 2),
        'total_modeled_cost_per_day': round(modeled_cost['total_modeled_cost_per_day'], 2),
        'current_operational_coverage_pct': current_policy['current_operational_coverage_pct'],
        'current_policy_coverage_pct': current_policy['current_policy_coverage_pct'],
        'proposed_hard_coverage_pct': proposed_policy['proposed_hard_coverage_pct'],
        'proposed_hybrid_coverage_pct': proposed_policy['proposed_hybrid_coverage_pct'],
        'full_hard_coverage_pct': addressable['full_hard_coverage_pct'],
        'full_hybrid_coverage_pct': addressable['full_hybrid_coverage_pct'],
        'addressable_hard_coverage_pct': addressable['addressable_hard_coverage_pct'],
        'addressable_hybrid_coverage_pct': addressable['addressable_hybrid_coverage_pct'],
        'excluded_low_density_orders_per_day': addressable['excluded_low_density_orders_per_day'],
        'excluded_low_density_zone_count': addressable['excluded_low_density_zone_count'],
        'addressable_orders_per_day': addressable['addressable_orders_per_day'],
        'policy_breach_orders_per_day': current_policy['policy_breach_orders_per_day'],
        'policy_breach_hubs': current_policy['policy_breach_hubs'],
        'exception_bucket_usage': {
            k: v for k, v in proposed_policy['exception_bucket_usage'].items() if k != 'selected_mask'
        },
        'daily_savings': round(max(0, daily_savings), 0),
        'monthly_savings': round(max(0, daily_savings) * 30, 0),
        'total_orders_per_day': state.orders_per_day,
        'pct_cost_reduction': round((current_avg_cost - proposed_avg_cost) / max(current_avg_cost, 0.01) * 100, 1),
        'coverage_pct': round(final_coverage_pct, 2),
        'covered_orders_per_day': round(final_covered_orders, 0),
        'uncovered_orders_per_day': round(final_uncovered_orders, 0),
        'distance_source': 'OSRM road distance (Table API)',
        'distance_histogram': hist_map,
        'total_grid_cells': n,
        'constraints_used': {
            'target_max_hubs': target_max_hubs if target_max_hubs != 9999 else None,
            'target_last_mile_cost': params.get('target_last_mile_cost'),
            'mini_ds_target_count': requested_counts['mini'],
            'standard_ds_target_count': requested_counts['standard'],
            'super_ds_target_count': requested_counts['super'],
            'uncovered_pocket_radius_km': round(uncovered_pocket_radius_km, 2),
            'coverage_mode': params.get('coverage_mode'),
            'super_role': params.get('super_role'),
            'super_tail_preference': params.get('super_tail_preference'),
            'super_fixed_penalty_per_order': params.get('super_fixed_penalty_per_order'),
            'super_infra_penalty_per_day': params.get('super_infra_penalty_per_day'),
            'mini_density_radius_km': params.get('mini_density_radius_km'),
            'mini_density_min_orders_per_day': params.get('mini_density_min_orders_per_day'),
            'low_density_policy': params.get('low_density_policy'),
            'low_density_radius_km': params.get('low_density_radius_km'),
            'low_density_min_orders_per_day': params.get('low_density_min_orders_per_day'),
        },
    }

    public_uncovered_pockets = [
        {k: v for k, v in pocket.items() if k != 'cell_indices'}
        for pocket in uncovered_pockets
    ]

    return {
        'mini_ds': mini_ds,
        'standard_ds': standard_ds,
        'super_ds': super_ds,
        'metrics': metrics,
        'analysis': analysis,
        'coverage_trace': coverage_trace,
        'uncovered_pockets': public_uncovered_pockets,
        'total_hubs': len(mini_ds) + len(standard_ds) + len(super_ds),
        'placement_time_seconds': round(total_elapsed, 1),
        'coverage_complete': bool(coverage_fill_meta.get('coverage_complete', True)),
        'coverage_satellites_added': int(coverage_fill_meta.get('coverage_satellites', 0)),
    }


def search_min_hubs_for_coverage(grid_data, existing_stores, params, target_coverage_pct,
                                 progress_cb=None):
    """Search for the smallest hub cap that reaches the requested coverage target.

    This intentionally reuses optimize_with_constraints so the search follows the
    same greedy placement logic and OSRM evaluation as the normal constrained run.
    """
    if target_coverage_pct is None:
        raise ValueError("target_coverage_pct is required")
    target_coverage_pct = float(target_coverage_pct)
    if target_coverage_pct <= 0 or target_coverage_pct > 100:
        raise ValueError("target_coverage_pct must be in (0, 100]")

    base = dict(params or {})
    base.pop('target_coverage_pct', None)
    search_cap = int(base.pop('search_max_hubs_cap', 400) or 400)
    requested_total = sum(v for v in _requested_tier_counts(base).values() if v is not None)
    lower = max(1, requested_total)
    upper = max(lower, search_cap)

    if progress_cb:
        progress_cb(
            f"Coverage search: running one high-cap greedy pass up to {upper} hubs for target "
            f"{target_coverage_pct:.2f}%..."
        )
    high_cap_params = dict(base)
    high_cap_params['target_max_hubs'] = upper
    high_cap_params['collect_coverage_trace'] = True
    high_cap_result = optimize_with_constraints(
        grid_data, existing_stores, high_cap_params, progress_cb=progress_cb
    )
    searched = list(high_cap_result.get('coverage_trace') or [])
    searched = [entry for entry in searched if entry.get('hub_cap', 0) >= lower]

    hit_entry = next(
        (entry for entry in searched if float(entry.get('coverage_pct', 0.0)) >= target_coverage_pct - 1e-9),
        None
    )
    if hit_entry is None:
        return {
            'found': False,
            'target_coverage_pct': round(target_coverage_pct, 2),
            'searched_hub_caps': searched,
            'search_max_hubs_cap': upper,
            'result': high_cap_result,
        }

    hit_cap = int(hit_entry['hub_cap'])
    if hit_cap == upper:
        best_result = high_cap_result
    else:
        if progress_cb:
            progress_cb(f"Coverage search: rerunning exact winning hub cap {hit_cap}...")
        exact_params = dict(base)
        exact_params['target_max_hubs'] = hit_cap
        best_result = optimize_with_constraints(
            grid_data, existing_stores, exact_params, progress_cb=progress_cb
        )

    return {
        'found': True,
        'target_coverage_pct': round(target_coverage_pct, 2),
        'best_hub_cap': hit_cap,
        'result': best_result,
        'searched_hub_caps': searched,
        'search_max_hubs_cap': upper,
    }


def _try_greedy_hub(grid_remaining, all_clat, all_clon, all_wts, covered,
                    radius_km, min_orders, max_orders, tier_name, selection_label, params=None):
    """Try to form one greedy hub from the highest-demand cell in grid_remaining.

    Scores by *new coverage* = orders in the OSRM ball that are NOT yet in ``covered``.
    The cluster must have total orders (covered + uncovered) in [min_orders, max_orders],
    but the ranking uses only the *newly-covered* portion.

    Returns dict {hub, grid_mask, covered_cell_indices, new_coverage} or None.
    """
    if grid_remaining is None or len(grid_remaining) == 0:
        return None
    grid_remaining = _ensure_grid_idx(grid_remaining).reset_index(drop=True)

    best_idx = grid_remaining['orders_per_day'].idxmax()
    best = grid_remaining.loc[best_idx]
    if best['orders_per_day'] < 1e-6:
        return None

    cached_context = (params or {}).get('_cached_demand_candidate_context')
    fixed_context = (params or {}).get('_cached_fixed_site_context')
    grid_mask = None
    if cached_context is not None:
        grid_mask = _mask_for_grid_from_cached_seed(
            cached_context,
            float(best['cell_lat']),
            float(best['cell_lon']),
            grid_remaining,
            radius_km,
        )
    if grid_mask is None:
        dists_remaining = osrm_one_to_many(
            float(best['cell_lat']), float(best['cell_lon']),
            grid_remaining['cell_lat'].values, grid_remaining['cell_lon'].values
        )
        grid_mask = dists_remaining <= radius_km
    cluster = grid_remaining[grid_mask]
    cluster_orders = cluster['orders_per_day'].sum()

    if cluster_orders < min_orders or cluster_orders > max_orders:
        return None

    # Weighted centroid
    w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / cluster_orders
    w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / cluster_orders

    snap_lat = float(w_lat)
    snap_lon = float(w_lon)
    dists_full = None
    if cached_context is not None and len(cluster) > 0:
        cluster_lats = cluster['cell_lat'].values.astype(np.float64)
        cluster_lons = cluster['cell_lon'].values.astype(np.float64)
        snap_pos = int(np.argmin((cluster_lats - float(w_lat)) ** 2 + (cluster_lons - float(w_lon)) ** 2))
        snap_lat = float(cluster_lats[snap_pos])
        snap_lon = float(cluster_lons[snap_pos])
        dists_full = _distance_array_from_cached_seed(cached_context, snap_lat, snap_lon, len(all_clat))

    hub = {
        'lat': snap_lat, 'lon': snap_lon,
        'orders_per_day': float(cluster_orders),
        'radius_km': radius_km, 'type': tier_name,
        'cells': int(len(cluster)),
        'selection': selection_label,
    }

    # Now determine which cells in the FULL grid this hub would cover,
    # and how many of those are currently uncovered.
    if dists_full is None:
        dists_full = osrm_one_to_many(
            float(snap_lat), float(snap_lon), all_clat, all_clon
        )
    if tier_name == 'mini':
        density_gate = _mini_density_gate(snap_lat, snap_lon, all_clat, all_clon, all_wts, params or {})
        if not density_gate['eligible']:
            return None
        hub['density_orders_per_day'] = density_gate['density_orders_per_day']
        hub['density_radius_km'] = density_gate['density_radius_km']
        hub['density_min_orders_per_day'] = density_gate['density_min_orders_per_day']
    within_radius = dists_full <= radius_km + 1e-5
    newly_covered = within_radius & (~covered)
    new_coverage = float(all_wts[newly_covered].sum())
    covered_cell_indices = np.where(newly_covered)[0]
    if tier_name == 'mini':
        base_cost = float((params or {}).get('mini_base_cost', 20))
        variable_rate = float((params or {}).get('mini_variable_rate', 6))
        infra_penalty = 0.0
    elif tier_name == 'standard':
        base_cost = float((params or {}).get('standard_base_cost', 29))
        variable_rate = float((params or {}).get('standard_variable_rate', 9))
        infra_penalty = 0.0
    else:
        base_cost = _effective_super_base_cost(params or {})
        variable_rate = float((params or {}).get('super_variable_rate', 9))
        infra_penalty = float((params or {}).get('super_infra_penalty_per_day', 0) or 0)
    modeled_daily_cost = float(np.sum((base_cost + variable_rate * dists_full[newly_covered]) * all_wts[newly_covered])) + infra_penalty

    return {
        'hub': hub,
        'grid_mask': grid_mask,
        'covered_cell_indices': covered_cell_indices,
        'new_coverage': new_coverage,
        'modeled_daily_cost': modeled_daily_cost,
    }


def _group_uncovered_pockets(lats, lons, orders, pocket_radius_km=3.0, progress_cb=None,
                             include_cell_indices=False):
    """Group uncovered grid cells into ~3km pockets using greedy clustering.

    Returns list of dicts: {lat, lon, orders_per_day, num_cells}
    sorted descending by orders_per_day.
    """
    n = len(lats)
    if n == 0:
        return []

    lats = np.asarray(lats, dtype=np.float64)
    lons = np.asarray(lons, dtype=np.float64)
    orders = np.asarray(orders, dtype=np.float64)

    assigned = np.zeros(n, dtype=bool)
    pockets = []

    # Sort by demand descending
    order_idx = np.argsort(-orders)

    for seed_pos in range(n):
        seed_i = order_idx[seed_pos]
        if assigned[seed_i]:
            continue

        # Find all unassigned cells within pocket_radius_km of seed
        unassigned_mask = ~assigned
        unassigned_indices = np.where(unassigned_mask)[0]

        if len(unassigned_indices) == 0:
            break

        # Use OSRM to get road distances from seed to all unassigned cells
        dists = osrm_one_to_many(
            float(lats[seed_i]), float(lons[seed_i]),
            lats[unassigned_indices], lons[unassigned_indices]
        )

        within = dists <= pocket_radius_km
        pocket_cells = unassigned_indices[within]

        if len(pocket_cells) == 0:
            # At minimum, the seed itself
            pocket_cells = np.array([seed_i])

        pocket_orders = float(orders[pocket_cells].sum())
        pocket_lat = float((lats[pocket_cells] * orders[pocket_cells]).sum() / max(pocket_orders, 1e-9))
        pocket_lon = float((lons[pocket_cells] * orders[pocket_cells]).sum() / max(pocket_orders, 1e-9))

        pocket = {
            'lat': pocket_lat,
            'lon': pocket_lon,
            'orders_per_day': round(pocket_orders, 0),
            'num_cells': int(len(pocket_cells)),
        }
        if include_cell_indices:
            pocket['cell_indices'] = pocket_cells.tolist()
        pockets.append(pocket)

        assigned[pocket_cells] = True

        if len(pockets) % 10 == 0 and progress_cb:
            progress_cb(f"Uncovered pockets: {len(pockets)} groups, {int(assigned.sum())}/{n} cells assigned...")

    # Sort descending by orders
    pockets.sort(key=lambda p: p['orders_per_day'], reverse=True)
    logger.info("Uncovered demand: %d pockets, %.0f total orders/day",
                len(pockets), sum(p['orders_per_day'] for p in pockets))
    return pockets


def _regions_from_geojson_text(text, prefix):
    gj = parse_geojson_string(text or '')
    if not gj:
        return []
    regions = []
    for i, poly in enumerate(polygons_from_geojson(gj), start=1):
        coords = _normalize_polygon_coords(poly)
        if not coords:
            continue
        lat, lon = _polygon_centroid(coords)
        regions.append({
            'id': f'{prefix}-{i}',
            'lat': float(lat) if lat is not None else None,
            'lon': float(lon) if lon is not None else None,
            'polygon_coords': coords,
        })
    return regions


def _scope_mask_for_grid(grid, business_regions, excluded_regions):
    if grid is None or len(grid) == 0:
        return np.zeros(0, dtype=bool)
    prepared_business = _prepare_polygon_tests(business_regions)
    if not prepared_business:
        return np.ones(len(grid), dtype=bool)
    lats = grid['avg_cust_lat'].values.astype(np.float64)
    lons = grid['avg_cust_lon'].values.astype(np.float64)
    mask = np.zeros(len(grid), dtype=bool)
    for i, (lat, lon) in enumerate(zip(lats, lons)):
        inside_business = _point_in_prepared_polygons(lat, lon, prepared_business)
        if not inside_business:
            continue
        mask[i] = inside_business
    return mask


def _resolve_scope_grid_and_regions(params):
    business_override = _regions_from_geojson_text(
        params.get('business_polygons_geojson') or params.get('super_core_must_cover_geojson'),
        'business'
    )
    excluded_override = _regions_from_geojson_text(
        params.get('excluded_islands_geojson') or params.get('super_exclude_geojson'),
        'excluded'
    )
    business_regions = business_override or state.business_regions
    excluded_regions = excluded_override or state.excluded_islands

    if state.grid_data is None:
        return None, None, business_regions, excluded_regions, None

    if not business_override and not excluded_override and state.in_scope_grid is not None:
        in_scope = state.in_scope_grid.copy().reset_index(drop=True)
        out_scope = state.out_of_scope_grid.copy().reset_index(drop=True) if state.out_of_scope_grid is not None else state.grid_data.iloc[0:0].copy().reset_index(drop=True)
        summary = dict(state.scope_summary or {})
        summary['fixed_store_source_mode'] = _effective_fixed_store_source_mode(params)
        return in_scope, out_scope, business_regions, excluded_regions, summary

    mask = _scope_mask_for_grid(state.grid_data, business_regions, excluded_regions)
    in_scope = state.grid_data[mask].copy().reset_index(drop=True)
    out_scope = state.grid_data[~mask].copy().reset_index(drop=True)
    summary = {
        'in_scope_grid_cells': int(mask.sum()),
        'out_of_scope_grid_cells': int((~mask).sum()),
        'in_scope_orders_per_day': round(float(in_scope['orders_per_day'].sum()) if len(in_scope) else 0.0, 2),
        'out_of_scope_orders_per_day': round(float(out_scope['orders_per_day'].sum()) if len(out_scope) else 0.0, 2),
        'business_polygon_count': len(business_regions or []),
        'excluded_island_count': len(excluded_regions or []),
        'demand_input_mode': state.demand_input_mode,
        'live_store_detection_mode': state.live_store_detection_mode,
        'fixed_store_source_mode': _effective_fixed_store_source_mode(params),
    }
    return in_scope, out_scope, business_regions, excluded_regions, summary


def _min_dist_to_hubs_for_grid(grid_data, hubs, progress_cb=None):
    n = len(grid_data) if grid_data is not None else 0
    if n == 0:
        return np.zeros(0, dtype=np.float64)
    if not hubs:
        return np.full(n, np.inf, dtype=np.float64)
    cust_lats = grid_data['avg_cust_lat'].values.astype(np.float64)
    cust_lons = grid_data['avg_cust_lon'].values.astype(np.float64)
    hub_lats = np.array([float(h['lat']) for h in hubs], dtype=np.float64)
    hub_lons = np.array([float(h['lon']) for h in hubs], dtype=np.float64)
    return osrm_min_distances_parallel(cust_lats, cust_lons, hub_lats, hub_lons, progress_cb=progress_cb)


def _effective_fixed_store_mode(params):
    world = _coerce_fixed_store_world((params or {}).get('fixed_store_world'))
    if world is not None:
        mapped = _fixed_store_world_to_mode(world)
        if mapped is not None:
            return mapped
    raw_mode = str(params.get('fixed_store_mode') or '').strip().lower()
    mode_world = _coerce_fixed_store_world(raw_mode)
    if mode_world is not None:
        mapped = _fixed_store_world_to_mode(mode_world)
        if mapped is not None:
            return mapped
    if raw_mode in {'benchmark_103', 'benchmark', 'old_103_exact_locations'}:
        return 'benchmark_103'
    if raw_mode in {'uploaded_current', 'uploaded', 'current'}:
        return 'uploaded_current'
    if raw_mode in {'clean_slate', 'clean', 'none', 'no_fixed'}:
        return 'clean_slate'
    if params.get('fixed_store_override_path'):
        return 'override_file'
    if state.fixed_store_source_mode == 'old_103_exact_locations' and len(state.existing_stores) == 103:
        return 'benchmark_103'
    return 'uploaded_current'


def _effective_fixed_store_source_mode(params):
    mode = _effective_fixed_store_mode(params)
    if mode == 'benchmark_103':
        return 'old_103_exact_locations'
    if mode == 'clean_slate':
        return 'clean_slate'
    if mode == 'override_file':
        return str(params.get('fixed_store_override_source_mode') or 'fixed_store_override_file')
    return str(state.fixed_store_source_mode or 'store_scope_file')


def _coerce_fixed_store_world(value):
    if value in (None, ''):
        return None
    raw = str(value).strip().lower()
    if raw in {'0', 'clean_slate', 'clean', 'none', 'no_fixed'}:
        return 0
    if raw in {'103', 'benchmark_103', 'benchmark', 'old_103_exact_locations'}:
        return 103
    if raw in {'144', 'uploaded_current', 'uploaded', 'current', 'store_scope', 'store_scope_file'}:
        return 144
    try:
        parsed = int(float(raw))
    except (TypeError, ValueError):
        return None
    return parsed if parsed in {0, 103, 144} else None


def _fixed_store_world_to_mode(world):
    if world == 0:
        return 'clean_slate'
    if world == 103:
        return 'benchmark_103'
    if world == 144:
        return 'uploaded_current'
    return None


def _effective_fixed_store_world(params):
    world = _coerce_fixed_store_world((params or {}).get('fixed_store_world'))
    if world is not None:
        return world
    mode = _effective_fixed_store_mode(params)
    if mode == 'clean_slate':
        return 0
    if mode == 'benchmark_103':
        return 103
    if mode == 'uploaded_current':
        return 144
    return 144 if (state.existing_stores or []) else 0


def _meeting_context_fields(params):
    return {
        'fixed_store_world': _effective_fixed_store_world(params),
        'fixed_store_mode': _effective_fixed_store_mode(params),
        'fixed_store_source_mode': _effective_fixed_store_source_mode(params),
        'standard_ds_radius': float(params.get('standard_ds_radius', 3.0) or 3.0),
        'standard_exception_radius_km': float(params.get('standard_exception_radius_km', 5.0) or 5.0),
        'meeting_fast_mode': bool(params.get('meeting_fast_mode', True)),
    }


def _normalize_target_mode(params):
    raw = str((params or {}).get('target_mode') or '').strip().lower()
    if raw in {'avg_cost', 'avg_last_mile_cost', 'avg_last_mile', 'last_mile_cost', 'cost'}:
        return 'avg_last_mile_cost'
    if raw in {'physical_standard_count', 'standard_count', 'total_physical_standard_stores', 'total_physical_standard_count', 'physical_count'}:
        return 'physical_standard_count'
    if any((params or {}).get(k) is not None for k in ('target_total_physical_standard_stores', 'target_standard_count', 'standard_ds_target_count')):
        return 'physical_standard_count'
    return 'avg_last_mile_cost'


def _load_fixed_store_override_sites(filepath, source_mode='fixed_store_override_file'):
    logger.info("Loading fixed-store override sites from %s", filepath)
    grid_sig = None
    if state.grid_data is not None and len(state.grid_data) > 0:
        grid_sig = (
            int(len(state.grid_data)),
            round(float(state.grid_data['orders_per_day'].sum()), 2),
            round(float(state.grid_data['avg_cust_lat'].min()), 5),
            round(float(state.grid_data['avg_cust_lat'].max()), 5),
            round(float(state.grid_data['avg_cust_lon'].min()), 5),
            round(float(state.grid_data['avg_cust_lon'].max()), 5),
        )
    cache_key = (os.path.abspath(filepath), str(source_mode or ''), grid_sig)
    cached_sites = state.fixed_store_override_cache.get(cache_key)
    if cached_sites is not None:
        return copy.deepcopy(cached_sites)
    df = _load_store_dataframe(filepath)
    df.columns = [str(c).strip() for c in df.columns]
    columns = list(df.columns)

    store_id_col = _find_col(columns, ['site_id', 'site id', 'store code', 'hub_code', 'store_id', 'id', 'name'])
    store_lat_col = _find_col(columns, ['store latitude', 'store_latitude', 'store_lat', 'latitude', 'lat'])
    store_lon_col = _find_col(columns, ['store longitude', 'store_longitude', 'store_lon', 'longitude', 'lon'])
    point_lat_col = _find_col(columns, ['point latitude', 'point_latitude', 'point_lat', 'polygon_lat', 'vertex_lat'])
    point_lon_col = _find_col(columns, ['point longitude', 'point_longitude', 'point_lon', 'polygon_lon', 'vertex_lon'])
    edge_col = _find_col(columns, ['polygon_edge', 'edge', 'vertex_type', 'point_type'])

    if store_id_col is None or store_lat_col is None or store_lon_col is None:
        raise ValueError(
            f"Could not identify fixed-store override columns in {filepath}. Columns: {columns}"
        )

    groups = df.groupby(store_id_col, dropna=True, sort=False)
    override_sites = []
    for _, group in groups:
        row0 = group.iloc[0]
        raw_id = str(row0.get(store_id_col) or '').strip()
        if not raw_id:
            continue
        try:
            lat = float(row0[store_lat_col])
            lon = float(row0[store_lon_col])
        except (TypeError, ValueError):
            continue
        poly_coords = _rows_to_polygon_coords(group, point_lat_col, point_lon_col, edge_col=edge_col)
        override_sites.append({
            'id': raw_id,
            'lat': lat,
            'lon': lon,
            'polygon_coords': _normalize_polygon_coords(poly_coords),
            'orders_per_day': 0,
            'fixed_open': True,
            'source_mode': source_mode,
        })

    if not override_sites:
        raise ValueError(f"No fixed-store rows found in override file: {filepath}")

    if state.grid_data is not None and len(state.grid_data) > 0:
        try:
            demand_lats = state.grid_data['avg_cust_lat'].values.astype(np.float64)
            demand_lons = state.grid_data['avg_cust_lon'].values.astype(np.float64)
            store_lats = np.array([float(s['lat']) for s in override_sites], dtype=np.float64)
            store_lons = np.array([float(s['lon']) for s in override_sites], dtype=np.float64)
            ref_lat = float(np.mean(np.concatenate([demand_lats[: min(len(demand_lats), 5000)], store_lats]))) if len(store_lats) else 0.0
            demand_xy = _latlon_to_xy_km(demand_lats, demand_lons, ref_lat=ref_lat)
            store_xy = _latlon_to_xy_km(store_lats, store_lons, ref_lat=ref_lat)
            _, nearest_idx = cKDTree(store_xy).query(demand_xy, k=1)
            order_weights = state.grid_data['orders_per_day'].values.astype(np.float64)
            for idx, site_idx in enumerate(nearest_idx):
                override_sites[int(site_idx)]['orders_per_day'] += float(order_weights[idx])
        except Exception as exc:
            logger.warning("Could not estimate override fixed-store orders/day: %s", exc)
    state.fixed_store_override_cache[cache_key] = copy.deepcopy(override_sites)
    return override_sites


def _build_fixed_standard_sites(params):
    radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    fixed_store_mode = _effective_fixed_store_mode(params)
    if fixed_store_mode == 'clean_slate':
        source_sites = []
    elif fixed_store_mode == 'benchmark_103':
        if not os.path.isfile(OLD_FIXED_STORE_OVERRIDE_CSV):
            raise FileNotFoundError(
                f"Exact Bangalore benchmark requires the 103 fixed-store override file, but it was not found: {OLD_FIXED_STORE_OVERRIDE_CSV}"
            )
        if state.fixed_store_source_mode == 'old_103_exact_locations' and len(state.existing_stores) == 103:
            source_sites = list(state.existing_stores)
        else:
            source_sites = _load_fixed_store_override_sites(
                OLD_FIXED_STORE_OVERRIDE_CSV,
                source_mode='old_103_exact_locations',
            )
    elif fixed_store_mode == 'override_file':
        override_path = str(params.get('fixed_store_override_path') or '').strip()
        if not override_path:
            raise ValueError("Fixed-store override mode requires a fixed_store_override_path.")
        source_sites = _load_fixed_store_override_sites(
            override_path,
            source_mode=str(params.get('fixed_store_override_source_mode') or 'fixed_store_override_file'),
        )
    else:
        source_sites = list(state.existing_stores)

    fixed_sites = []
    for i, store in enumerate(source_sites, start=1):
        fixed_sites.append({
            'id': store.get('id') or f'FIXED-STD-{i}',
            'lat': float(store['lat']),
            'lon': float(store['lon']),
            'orders_per_day': float(store.get('orders_per_day', 0) or 0),
            'radius_km': radius,
            'type': 'standard',
            'selection': 'fixed_existing',
            'fixed_open': True,
            'polygon_coords': store.get('polygon_coords', []),
        })
    return fixed_sites


def _apply_standard_exception_overrides(scope_grid, covered_mask, standard_sites, params, remaining_slots=None, progress_cb=None):
    base_radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    exception_radius = float(params.get('standard_exception_radius_km', 5.0) or 5.0)
    if exception_radius <= base_radius + 1e-5 or not standard_sites or scope_grid is None or len(scope_grid) == 0:
        return [], np.array(covered_mask, copy=True)

    max_hubs = params.get('standard_exception_max_hubs')
    if remaining_slots is None:
        if max_hubs is None:
            remaining_slots = len(standard_sites)
        else:
            remaining_slots = max(0, int(max_hubs))
    if remaining_slots <= 0:
        return [], np.array(covered_mask, copy=True)

    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    approx_proposed_costs = np.full(
        len(weights),
        float(params.get('standard_base_cost', 29)) + float(params.get('standard_variable_rate', 9)) * base_radius,
        dtype=np.float64,
    )
    override_params = dict(params)
    override_params['radius_override_candidate_tiers'] = ['standard']
    override_params['standard_override_max_radius_km'] = exception_radius
    override_params['radius_override_step_km'] = float(params.get('standard_exception_step_km', 0.5) or 0.5)
    candidate_standard_sites = list(standard_sites or [])
    site_top_k = params.get('meeting_fast_exception_candidate_site_top_k')
    if bool(params.get('meeting_fast_mode', True)) and site_top_k not in ('', None):
        try:
            site_top_k = max(1, int(float(site_top_k)))
        except (TypeError, ValueError):
            site_top_k = None
        if site_top_k is not None and len(candidate_standard_sites) > site_top_k:
            def _exception_site_rank(site):
                return (
                    float(site.get('marginal_covered_orders_per_day', 0.0) or 0.0),
                    float(site.get('rescued_orders_per_day', 0.0) or 0.0),
                    float(site.get('orders_per_day', 0.0) or 0.0),
                    1.0 if bool(site.get('rescue_gap_fill') or site.get('coverage_satellite')) else 0.0,
                )
            candidate_standard_sites = sorted(
                candidate_standard_sites,
                key=_exception_site_rank,
                reverse=True,
            )[:site_top_k]
            if progress_cb:
                progress_cb(
                    f"Exception Standard search: shortlisted {len(candidate_standard_sites)} of "
                    f"{len(standard_sites)} Standard sites for override scoring."
                )

    recs = _build_radius_override_recommendations(
        scope_grid,
        weights,
        approx_proposed_costs,
        np.array(covered_mask, copy=True),
        override_params,
        [],
        candidate_standard_sites,
        [],
        progress_cb=(lambda msg: progress_cb(f"Exception Standard search: {msg}") if progress_cb else None),
    )
    selected = list((recs or {}).get('recommendations') or [])[:remaining_slots]
    if not selected:
        return [], np.array(covered_mask, copy=True)

    site_by_id = {str(site.get('id')): site for site in standard_sites}
    clat = scope_grid['avg_cust_lat'].values.astype(np.float64)
    clon = scope_grid['avg_cust_lon'].values.astype(np.float64)
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    fixed_context = (params or {}).get('_cached_fixed_site_context')
    revised_covered = np.array(covered_mask, copy=True)
    exception_sites = []
    for rank, rec in enumerate(selected, start=1):
        site = site_by_id.get(str(rec.get('hub_id')))
        if site is None:
            continue
        site['exception_standard'] = True
        site['base_radius_km'] = base_radius
        site['radius_km'] = float(rec.get('new_radius_km', exception_radius) or exception_radius)
        site['exception_rank'] = rank
        site['rescued_orders_per_day'] = float(rec.get('rescued_orders_per_day', 0) or 0)
        cached_dists = _distance_array_from_cached_contexts(
            [cached_context, fixed_context],
            float(site['lat']),
            float(site['lon']),
            len(scope_grid),
        )
        dists = cached_dists if cached_dists is not None else osrm_one_to_many(float(site['lat']), float(site['lon']), clat, clon)
        revised_covered |= np.isfinite(dists) & (dists <= float(site['radius_km']) + 1e-5)
        exception_sites.append(site)
    return exception_sites, revised_covered


def _run_standard_rescue_pass(
    scope_grid,
    covered_mask,
    current_min_d,
    fixed_sites,
    new_sites,
    exception_sites,
    params,
    cached_context=None,
    progress_cb=None,
    stop_predicate=None,
    stop_meta=None,
    milestone_cb=None,
):
    if scope_grid is None or len(scope_grid) == 0:
        return covered_mask, current_min_d, 0, 0.0
    if not bool(params.get('standard_rescue_enable', False)):
        return covered_mask, current_min_d, 0, 0.0
    total_hub_cap = params.get('standard_total_hub_cap')
    if total_hub_cap in ('', 0, '0'):
        return covered_mask, current_min_d, 0, 0.0
    if total_hub_cap not in (None,):
        try:
            total_hub_cap = int(total_hub_cap)
        except (TypeError, ValueError):
            return covered_mask, current_min_d, 0, 0.0
        if total_hub_cap <= 0:
            return covered_mask, current_min_d, 0, 0.0

    radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    rescue_spacing_km = float(params.get('standard_rescue_spacing_km', 0.0) or 0.0)
    rescue_penalty_per_day = float(params.get('standard_rescue_open_penalty_per_day', 0.0) or 0.0)
    rescue_seed_top_k = max(1, int(float(params.get('standard_rescue_seed_top_k', 8) or 8)))
    base_cost = float(params.get('standard_base_cost', 29) or 29)
    var_rate = float(params.get('standard_variable_rate', 9) or 9)
    clat = scope_grid['cell_lat'].values.astype(np.float64)
    clon = scope_grid['cell_lon'].values.astype(np.float64)
    wts = scope_grid['orders_per_day'].values.astype(np.float64)
    blocked_idx = np.zeros(len(scope_grid), dtype=bool)
    rescue_count = 0
    rescue_penalty_total = 0.0
    meeting_fast_mode = bool(params.get('meeting_fast_mode', False))
    stop_meta = stop_meta if isinstance(stop_meta, dict) else None
    try:
        meeting_target_coverage_pct = float(
            params.get('meeting_fast_target_coverage_pct', params.get('benchmark_near_full_coverage_pct', 99.7)) or 99.7
        )
    except (TypeError, ValueError):
        meeting_target_coverage_pct = 99.7

    while np.any(~covered_mask):
        if meeting_fast_mode:
            coverage_pct = 100.0 * float(np.sum(wts[covered_mask])) / max(float(np.sum(wts)), 1e-9)
            if coverage_pct >= meeting_target_coverage_pct - 1e-9:
                if progress_cb:
                    progress_cb(
                        f"Standard rescue stopped at bounded meeting target "
                        f"({coverage_pct:.2f}% >= {meeting_target_coverage_pct:.2f}%)."
                    )
                break
        if callable(stop_predicate):
            coverage_pct = 100.0 * float(np.sum(wts[covered_mask])) / max(float(np.sum(wts)), 1e-9)
            stop_reason = stop_predicate(
                coverage_pct=coverage_pct,
                rescue_count=rescue_count,
                fixed_sites=fixed_sites,
                new_sites=new_sites,
                exception_sites=exception_sites,
            )
            if stop_reason:
                if stop_meta is not None:
                    stop_meta['stop_reason'] = str(stop_reason)
                    stop_meta['coverage_pct'] = round(float(coverage_pct), 2)
                if progress_cb:
                    progress_cb(f"Standard rescue stopped at {stop_reason}.")
                break
        current_total_hubs = len(fixed_sites) + len(new_sites)
        if total_hub_cap is not None and current_total_hubs >= total_hub_cap:
            if progress_cb:
                progress_cb(
                    f"Standard rescue stopped at total hub cap ({current_total_hubs}/{total_hub_cap})."
                )
            break
        uncovered_idx = np.where((~covered_mask) & (~blocked_idx))[0]
        if len(uncovered_idx) == 0:
            break
        if len(uncovered_idx) > rescue_seed_top_k:
            ranked_local = np.argsort(wts[uncovered_idx])[::-1][:rescue_seed_top_k]
            seed_candidates = uncovered_idx[ranked_local]
        else:
            seed_candidates = uncovered_idx

        best_candidate = None
        for seed_idx in seed_candidates:
            seed_lat = float(clat[seed_idx])
            seed_lon = float(clon[seed_idx])
            full_seed_mask = _distance_mask_from_cached_seed(cached_context, seed_lat, seed_lon, len(scope_grid), radius) if cached_context is not None else None
            if full_seed_mask is None:
                d_seed = osrm_one_to_many(seed_lat, seed_lon, clat[uncovered_idx], clon[uncovered_idx])
                local_mask = np.isfinite(d_seed) & (d_seed <= radius + 1e-5)
                member_idx = uncovered_idx[local_mask]
            else:
                member_idx = uncovered_idx[full_seed_mask[uncovered_idx]]
            if len(member_idx) == 0:
                member_idx = np.array([seed_idx], dtype=np.int64)

            center_lat = float(np.average(clat[member_idx], weights=wts[member_idx]))
            center_lon = float(np.average(clon[member_idx], weights=wts[member_idx]))
            snap_pos = int(np.argmin((clat[member_idx] - center_lat) ** 2 + (clon[member_idx] - center_lon) ** 2))
            center_lat = float(clat[member_idx][snap_pos])
            center_lon = float(clon[member_idx][snap_pos])
            cached_full = _distance_array_from_cached_seed(cached_context, center_lat, center_lon, len(scope_grid)) if cached_context is not None else None
            d_full = cached_full if cached_full is not None else osrm_one_to_many(
                center_lat, center_lon, scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values
            )
            cover_mask = np.isfinite(d_full) & (d_full <= radius + 1e-5)
            if _violates_same_tier_spacing(center_lat, center_lon, fixed_sites + new_sites, rescue_spacing_km):
                alt_cached = _distance_array_from_cached_seed(cached_context, seed_lat, seed_lon, len(scope_grid)) if cached_context is not None else None
                alt_full = alt_cached if alt_cached is not None else osrm_one_to_many(
                    seed_lat, seed_lon, scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values
                )
                alt_cover_mask = np.isfinite(alt_full) & (alt_full <= radius + 1e-5)
                if _violates_same_tier_spacing(seed_lat, seed_lon, fixed_sites + new_sites, rescue_spacing_km):
                    blocked_idx[member_idx] = True
                    continue
                center_lat = seed_lat
                center_lon = seed_lon
                d_full = alt_full
                cover_mask = alt_cover_mask

            marginal_mask = cover_mask & (~covered_mask)
            marginal_new_orders = float(np.sum(wts[marginal_mask]))
            if marginal_new_orders <= 1e-6:
                blocked_idx[member_idx] = True
                continue
            catchment_orders = float(np.sum(wts[cover_mask]))
            modeled_cost = float(np.sum((base_cost + var_rate * d_full[marginal_mask]) * wts[marginal_mask])) + rescue_penalty_per_day
            candidate = (
                marginal_new_orders,
                -modeled_cost,
                -catchment_orders,
                {
                    'seed_member_idx': member_idx,
                    'lat': center_lat,
                    'lon': center_lon,
                    'd_full': d_full,
                    'cover_mask': cover_mask,
                    'catchment_orders': catchment_orders,
                    'marginal_new_orders': marginal_new_orders,
                    'modeled_cost': modeled_cost,
                }
            )
            if best_candidate is None or candidate[:3] > best_candidate[:3]:
                best_candidate = candidate

        if best_candidate is None:
            break

        chosen = best_candidate[3]
        hub = {
            'id': f'NEW-STD-{len(new_sites) + 1}',
            'lat': chosen['lat'],
            'lon': chosen['lon'],
            'orders_per_day': chosen['catchment_orders'],
            'radius_km': radius,
            'type': 'standard',
            'cells': int(np.sum(chosen['cover_mask'])),
            'selection': '15k-rescue',
            'coverage_satellite': True,
            'gap_fill': True,
            'rescue_gap_fill': True,
            'fixed_open': False,
            'planning_order': len(new_sites) + 1,
            'marginal_covered_orders_per_day': round(chosen['marginal_new_orders'], 2),
            'marginal_modeled_daily_cost': round(chosen['modeled_cost'], 2),
            'rescue_spacing_km': rescue_spacing_km,
            'rescue_penalty_per_day': rescue_penalty_per_day,
        }
        new_sites.append(hub)
        current_min_d = np.minimum(current_min_d, chosen['d_full'])
        covered_mask |= np.isfinite(chosen['d_full']) & (chosen['d_full'] <= radius + 1e-5)
        rescue_count += 1
        rescue_penalty_total += rescue_penalty_per_day
        coverage_pct = 100.0 * float(np.sum(wts[covered_mask])) / max(float(np.sum(wts)), 1e-9)
        if progress_cb:
            progress_cb(
                f"Standard rescue: added {rescue_count} spacing-relaxed Standard site(s); "
                f"coverage now {coverage_pct:.2f}%."
            )
        if callable(milestone_cb):
            milestone_cb(
                coverage_pct=coverage_pct,
                covered_mask=np.array(covered_mask, copy=True),
                current_min_d=np.array(current_min_d, copy=True),
                rescue_count=rescue_count,
                rescue_penalty_total=rescue_penalty_total,
            )

    return covered_mask, current_min_d, rescue_count, rescue_penalty_total


def _copy_site_records(sites):
    return [dict(site) for site in (sites or [])]


def _strict_standard_base_params(params):
    strict_params = dict(params or {})
    try:
        strict_base_target = float(
            strict_params.get(
                'strict_standard_base_target_coverage_pct',
                min(95.0, float(strict_params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0)),
            ) or 95.0
        )
    except (TypeError, ValueError):
        strict_base_target = 95.0
    strict_params['meeting_fast_target_coverage_pct'] = min(100.0, max(90.0, strict_base_target))
    try:
        strict_gap_fill_cap = int(float(strict_params.get('strict_standard_base_gap_fill_cap', 10) or 10))
    except (TypeError, ValueError):
        strict_gap_fill_cap = 10
    strict_params['meeting_fast_max_standard_gap_fill_sites'] = max(10, strict_gap_fill_cap)
    strict_params['meeting_fast_allow_standard_gap_satellites'] = False
    strict_params['meeting_fast_skip_second_exception_pass'] = True
    strict_params['standard_exception_max_hubs'] = 0
    strict_params['standard_rescue_enable'] = False
    strict_params['standard_total_hub_cap'] = None
    return strict_params


def _exception_first_live_config(params, incumbent_plan=None):
    params = dict(params or {})
    try:
        meeting_target = float(params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0)
    except (TypeError, ValueError):
        meeting_target = 100.0
    try:
        budget_seconds = float(params.get('exception_first_live_budget_seconds', 90.0) or 90.0)
    except (TypeError, ValueError):
        budget_seconds = 90.0
    try:
        min_coverage_pct = float(
            params.get(
                'exception_first_live_min_coverage_pct',
                min(99.7, meeting_target),
            ) or 99.7
        )
    except (TypeError, ValueError):
        min_coverage_pct = min(99.7, meeting_target)
    try:
        max_coverage_gap_pct = float(params.get('exception_first_live_max_coverage_gap_pct', 0.15) or 0.15)
    except (TypeError, ValueError):
        max_coverage_gap_pct = 0.15
    if incumbent_plan:
        try:
            incumbent_coverage = float(incumbent_plan.get('coverage_pct', min_coverage_pct) or min_coverage_pct)
        except (TypeError, ValueError):
            incumbent_coverage = min_coverage_pct
        min_coverage_pct = max(min_coverage_pct, incumbent_coverage - max_coverage_gap_pct)
    try:
        override_top_k = int(float(params.get('exception_first_live_override_top_k', 32) or 32))
    except (TypeError, ValueError):
        override_top_k = 32
    try:
        max_selected = int(float(params.get('exception_first_live_max_selected', 32) or 32))
    except (TypeError, ValueError):
        max_selected = 32
    try:
        rescue_seed_top_k = int(float(params.get('exception_first_live_rescue_seed_top_k', 6) or 6))
    except (TypeError, ValueError):
        rescue_seed_top_k = 6
    try:
        max_extra_sites = int(float(params.get('exception_first_live_max_extra_physical_sites', 6) or 6))
    except (TypeError, ValueError):
        max_extra_sites = 6
    return {
        'budget_seconds': max(15.0, budget_seconds),
        'min_coverage_pct': min(meeting_target, max(95.0, min_coverage_pct)),
        'max_coverage_gap_pct': max(0.0, max_coverage_gap_pct),
        'override_top_k': max(8, override_top_k),
        'max_selected': max(4, max_selected),
        'rescue_seed_top_k': max(1, rescue_seed_top_k),
        'max_extra_sites': max(0, max_extra_sites),
    }


def _standard_candidate_universe_label(params, mode='open_grid'):
    if mode == 'polygon_centroid':
        return 'polygon_centroid_candidates'
    cap = params.get('exact_candidate_cap')
    if cap in (None, '', 0, '0', 'all', 'ALL'):
        return 'open_grid_all_in_scope_cells'
    return 'open_grid_cached_candidate_cells'


def _compact_standard_frontier_limit(min_physical_standard_count):
    if min_physical_standard_count in (None, 0):
        return None
    count = int(min_physical_standard_count)
    return count + max(10, int(math.ceil(0.05 * count)))


def _actual_min_distances_to_standard_sites(scope_grid, fixed_sites, new_sites, params, cached_context=None, fixed_context=None):
    demand_count = len(scope_grid)
    if demand_count == 0:
        return np.empty(0, dtype=np.float64)

    dists = np.full(demand_count, np.inf, dtype=np.float64)
    contexts = []
    if fixed_context is not None:
        contexts.append(('fixed', fixed_context, fixed_sites))
    if cached_context is not None:
        contexts.append(('new', cached_context, new_sites))
        if fixed_context is None and fixed_sites:
            contexts.append(('fixed_fallback', cached_context, fixed_sites))

    for _label, context, hubs in contexts:
        if not hubs:
            continue
        cached_min = _min_distances_from_cached_hubs(context, hubs, demand_count, radius_km=None)
        if cached_min is not None:
            dists = np.minimum(dists, cached_min)

    if np.any(~np.isfinite(dists)):
        all_sites = list(fixed_sites or []) + list(new_sites or [])
        if all_sites:
            fallback = _min_dist_to_hubs_for_grid(scope_grid, all_sites, progress_cb=None)
            dists = np.minimum(dists, fallback)
    return dists


def _run_standard_cost_frontier_pass(scope_grid, fixed_sites, new_sites, current_actual_min_d, params,
                                     max_total_hubs=None, cached_context=None, progress_cb=None):
    if scope_grid is None or len(scope_grid) == 0:
        return current_actual_min_d, 0, 0.0
    if max_total_hubs is None:
        return current_actual_min_d, 0, 0.0

    radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    rescue_spacing_km = float(params.get('standard_rescue_spacing_km', 0.0) or 0.0)
    rescue_penalty_per_day = float(params.get('standard_rescue_open_penalty_per_day', 0.0) or 0.0)
    refinement_top_k = max(3, int(float(params.get('standard_cost_frontier_seed_top_k', 12) or 12)))
    min_daily_gain = float(params.get('standard_cost_frontier_min_daily_gain', 0.0) or 0.0)
    var_rate = float(params.get('standard_variable_rate', 9) or 9)
    clat = scope_grid['cell_lat'].values.astype(np.float64)
    clon = scope_grid['cell_lon'].values.astype(np.float64)
    wts = scope_grid['orders_per_day'].values.astype(np.float64)
    actual_min_d = np.array(current_actual_min_d, copy=True)
    added_count = 0
    added_daily_gain = 0.0
    blocked_idx = np.zeros(len(scope_grid), dtype=bool)

    while len(fixed_sites) + len(new_sites) < int(max_total_hubs):
        weighted_priority = np.where(
            blocked_idx,
            -np.inf,
            np.where(np.isfinite(actual_min_d), actual_min_d * wts, wts * float(radius)),
        )
        if not np.isfinite(weighted_priority).any():
            break
        seed_candidates = np.argsort(weighted_priority)[::-1]
        seed_candidates = seed_candidates[np.isfinite(weighted_priority[seed_candidates])]
        seed_candidates = seed_candidates[:refinement_top_k]
        if len(seed_candidates) == 0:
            break

        best = None
        for seed_idx in seed_candidates:
            seed_lat = float(clat[seed_idx])
            seed_lon = float(clon[seed_idx])
            full_seed_mask = (
                _distance_mask_from_cached_seed(cached_context, seed_lat, seed_lon, len(scope_grid), radius)
                if cached_context is not None else None
            )
            if full_seed_mask is None:
                d_seed = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
                member_idx = np.flatnonzero(np.isfinite(d_seed) & (d_seed <= radius + 1e-5))
            else:
                member_idx = np.flatnonzero(full_seed_mask)
            if len(member_idx) == 0:
                member_idx = np.array([seed_idx], dtype=np.int64)

            center_lat = float(np.average(clat[member_idx], weights=wts[member_idx]))
            center_lon = float(np.average(clon[member_idx], weights=wts[member_idx]))
            snap_pos = int(np.argmin((clat[member_idx] - center_lat) ** 2 + (clon[member_idx] - center_lon) ** 2))
            center_lat = float(clat[member_idx][snap_pos])
            center_lon = float(clon[member_idx][snap_pos])
            cached_full = (
                _distance_array_from_cached_seed(cached_context, center_lat, center_lon, len(scope_grid))
                if cached_context is not None else None
            )
            d_full = cached_full if cached_full is not None else osrm_one_to_many(
                center_lat, center_lon, scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values
            )
            cover_mask = np.isfinite(d_full) & (d_full <= radius + 1e-5)
            if _violates_same_tier_spacing(center_lat, center_lon, fixed_sites + new_sites, rescue_spacing_km):
                blocked_idx[int(seed_idx)] = True
                continue

            improve_mask = cover_mask & np.isfinite(actual_min_d) & (d_full + 1e-5 < actual_min_d)
            if not np.any(improve_mask):
                blocked_idx[int(seed_idx)] = True
                continue

            daily_cost_gain = float(np.sum((actual_min_d[improve_mask] - d_full[improve_mask]) * wts[improve_mask] * var_rate))
            net_gain = daily_cost_gain - rescue_penalty_per_day
            if net_gain <= min_daily_gain:
                blocked_idx[int(seed_idx)] = True
                continue

            candidate = (
                net_gain,
                daily_cost_gain,
                float(np.sum(wts[improve_mask])),
                {
                    'lat': center_lat,
                    'lon': center_lon,
                    'd_full': d_full,
                    'cover_mask': cover_mask,
                    'improve_mask': improve_mask,
                    'daily_cost_gain': daily_cost_gain,
                    'net_gain': net_gain,
                }
            )
            if best is None or candidate[:3] > best[:3]:
                best = candidate

        if best is None:
            break

        chosen = best[3]
        hub = {
            'id': f'NEW-STD-{len(new_sites) + 1}',
            'lat': chosen['lat'],
            'lon': chosen['lon'],
            'orders_per_day': float(np.sum(wts[chosen['cover_mask']])),
            'radius_km': radius,
            'type': 'standard',
            'cells': int(np.sum(chosen['cover_mask'])),
            'selection': '15k-frontier-cost',
            'coverage_satellite': True,
            'gap_fill': False,
            'rescue_gap_fill': True,
            'cost_frontier_refine': True,
            'fixed_open': False,
            'planning_order': len(new_sites) + 1,
            'marginal_covered_orders_per_day': round(float(np.sum(wts[chosen['improve_mask']])), 2),
            'marginal_modeled_daily_cost': round(chosen['net_gain'], 2),
            'rescue_spacing_km': rescue_spacing_km,
            'rescue_penalty_per_day': rescue_penalty_per_day,
            'daily_cost_reduction_estimate': round(chosen['daily_cost_gain'], 2),
        }
        new_sites.append(hub)
        actual_min_d = np.minimum(actual_min_d, chosen['d_full'])
        added_count += 1
        added_daily_gain += chosen['daily_cost_gain']
        if progress_cb:
            progress_cb(
                f"Standard frontier refinement: added {added_count} cost-improving site(s); "
                f"estimated daily cost gain ₹{added_daily_gain:,.0f}."
            )

    return actual_min_d, added_count, added_daily_gain


def _complete_standard_branch_from_base(scope_grid, base_plan, params, branch_type, progress_cb=None, incumbent_plan=None, live_publish_cb=None):
    fixed_sites = _copy_site_records(base_plan.get('fixed_sites'))
    new_sites = _copy_site_records(base_plan.get('new_sites'))
    covered = np.array(base_plan.get('covered_mask', np.zeros(len(scope_grid), dtype=bool)), copy=True)
    current_min_d = np.array(base_plan.get('min_distances_km', np.full(len(scope_grid), np.inf, dtype=np.float64)), copy=True)
    cached_context = base_plan.get('cached_demand_candidate_context')
    fixed_context = base_plan.get('cached_fixed_site_context')
    base_new_count = len(new_sites)
    exception_sites = []
    rescue_count = 0
    rescue_penalty_total = 0.0
    gap_fill_count = int(base_plan.get('gap_fill_count', 0) or 0)
    exception_limit = params.get('standard_exception_max_hubs')
    branch_started_at = time.time()
    branch_completion_mode = 'exact'
    branch_stop_reason = ''
    branch_budget_seconds = None
    branch_target_coverage_pct = float(params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0)
    branch_comparison_ready = True
    incumbent_coverage_pct = None
    incumbent_physical_count = None
    wts = scope_grid['orders_per_day'].values.astype(np.float64)
    if incumbent_plan:
        try:
            incumbent_coverage_pct = float(incumbent_plan.get('coverage_pct', 0.0) or 0.0)
        except (TypeError, ValueError):
            incumbent_coverage_pct = None
        incumbent_physical_count = len(incumbent_plan.get('all_sites') or [])

    def _partial_branch_plan(covered_snapshot, current_min_d_snapshot, rescue_count_snapshot, rescue_penalty_total_snapshot,
                             completion_mode='live_partial', stop_reason=''):
        covered_snapshot = np.array(covered_snapshot, copy=True)
        current_min_d_snapshot = np.array(current_min_d_snapshot, copy=True)
        weights = scope_grid['orders_per_day'].values.astype(np.float64)
        uncovered_orders = float(np.sum(weights[~covered_snapshot]))
        coverage_pct = 100.0 * float(np.sum(weights[covered_snapshot])) / max(float(np.sum(weights)), 1e-9)
        fixed_sites_snapshot = _copy_site_records(fixed_sites)
        new_sites_snapshot = _copy_site_records(new_sites)
        exception_sites_snapshot = _copy_site_records(exception_sites)
        all_sites_snapshot = fixed_sites_snapshot + new_sites_snapshot
        physical_count_at_100 = len(all_sites_snapshot) if not np.any(~covered_snapshot) else None
        frontier_max = _compact_standard_frontier_limit(physical_count_at_100)
        return {
            'branch_type': branch_type,
            'fixed_sites': fixed_sites_snapshot,
            'new_sites': new_sites_snapshot,
            'all_sites': all_sites_snapshot,
            'cached_demand_candidate_context': cached_context,
            'cached_fixed_site_context': fixed_context,
            'covered_mask': covered_snapshot,
            'min_distances_km': current_min_d_snapshot,
            'actual_min_distances_km': current_min_d_snapshot,
            'coverage_pct': round(coverage_pct, 2),
            'uncovered_orders_per_day': round(uncovered_orders, 2),
            'infeasible_under_cap': bool(np.any(~covered_snapshot)),
            'gap_fill_count': gap_fill_count,
            'exception_sites': exception_sites_snapshot,
            'exception_count': len(exception_sites_snapshot),
            'fixed_count': len(fixed_sites_snapshot),
            'new_count': len(new_sites_snapshot),
            'base_new_count': base_new_count,
            'rescue_count': int(rescue_count_snapshot or 0),
            'frontier_cost_refine_count': 0,
            'frontier_cost_refine_daily_gain': 0.0,
            'rescue_penalty_per_day_total': round(float(rescue_penalty_total_snapshot or 0.0), 2),
            'max_new_standard_stores': base_plan.get('max_new_standard_stores'),
            'exact_total_standard_stores': base_plan.get('exact_total_standard_stores'),
            'min_physical_standard_count_for_100': physical_count_at_100,
            'allowed_frontier_max_count': frontier_max,
            'within_compact_frontier': (
                True if frontier_max is None else (len(all_sites_snapshot) <= frontier_max)
            ),
            'branch_completion_mode': completion_mode,
            'branch_stop_reason': stop_reason,
            'branch_budget_seconds': (round(branch_budget_seconds, 1) if branch_budget_seconds is not None else None),
            'branch_elapsed_seconds': round(time.time() - branch_started_at, 1),
            'branch_target_coverage_pct': round(float(branch_target_coverage_pct), 2),
            'branch_comparison_ready': False,
        }

    def _apply_exception(progress_label):
        nonlocal covered, exception_sites
        if not np.any(~covered):
            return
        branch_exception_sites, covered_after = _apply_standard_exception_overrides(
            scope_grid,
            covered,
            fixed_sites + new_sites,
            params,
            remaining_slots=exception_limit,
            progress_cb=(lambda msg: progress_cb(f"{progress_label}: {msg}") if progress_cb else None),
        )
        exception_sites = list(branch_exception_sites or [])
        covered = covered_after

    def _run_rescue(progress_label, stop_predicate=None, stop_meta=None, milestone_cb=None):
        nonlocal covered, current_min_d, rescue_count, rescue_penalty_total
        if not np.any(~covered):
            return
        covered_after, current_after, rescue_added, rescue_penalty = _run_standard_rescue_pass(
            scope_grid,
            covered,
            current_min_d,
            fixed_sites,
            new_sites,
            exception_sites,
            params,
            cached_context=cached_context,
            progress_cb=(lambda msg: progress_cb(f"{progress_label}: {msg}") if progress_cb else None),
            stop_predicate=stop_predicate,
            stop_meta=stop_meta,
            milestone_cb=milestone_cb,
        )
        covered = covered_after
        current_min_d = current_after
        rescue_count += int(rescue_added or 0)
        rescue_penalty_total += float(rescue_penalty or 0.0)

    if branch_type == 'rescue_first':
        try:
            live_publish_threshold_pct = float(
                params.get('meeting_core_publish_coverage_pct', params.get('meeting_fast_publish_coverage_pct', 99.0)) or 99.0
            )
        except (TypeError, ValueError):
            live_publish_threshold_pct = 99.0
        live_publish_threshold_pct = min(
            float(params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0),
            max(90.0, live_publish_threshold_pct),
        )
        live_publish_state = {'published': False}

        def _rescue_milestone_cb(coverage_pct, covered_mask, current_min_d, rescue_count, rescue_penalty_total):
            if live_publish_state['published'] or not callable(live_publish_cb):
                return
            if coverage_pct + 1e-9 < live_publish_threshold_pct:
                return
            live_publish_state['published'] = True
            live_publish_cb(
                _partial_branch_plan(
                    covered_mask,
                    current_min_d,
                    rescue_count,
                    rescue_penalty_total,
                    completion_mode='live_partial',
                    stop_reason=f"Published once rescue-first crossed {live_publish_threshold_pct:.2f}% coverage.",
                )
            )

        rescue_first_params = dict(params or {})
        try:
            rescue_handover_pct = float(
                rescue_first_params.get(
                    'standard_rescue_handover_coverage_pct',
                    rescue_first_params.get('meeting_fast_target_coverage_pct', 100.0),
                ) or 100.0
            )
        except (TypeError, ValueError):
            rescue_handover_pct = float(rescue_first_params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0)
        rescue_first_params['meeting_fast_target_coverage_pct'] = min(
            float(params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0),
            rescue_handover_pct,
        )

        original_params = params
        params = rescue_first_params
        _run_rescue("Rescue-first completion", milestone_cb=_rescue_milestone_cb)
        params = original_params
        _apply_exception("Rescue-first completion")
        if not live_publish_state['published'] and callable(live_publish_cb):
            coverage_after_exception = 100.0 * float(np.sum(wts[covered])) / max(float(np.sum(wts)), 1e-9)
            if coverage_after_exception >= live_publish_threshold_pct - 1e-9:
                live_publish_state['published'] = True
                live_publish_cb(
                    _partial_branch_plan(
                        covered,
                        current_min_d,
                        rescue_count,
                        rescue_penalty_total,
                        completion_mode='live_partial',
                        stop_reason=(
                            f"Published once rescue-first reached {coverage_after_exception:.2f}% "
                            "coverage after Exception overrides."
                        ),
                    )
                )
    else:
        exception_cfg = _exception_first_live_config(params, incumbent_plan=incumbent_plan)
        branch_budget_seconds = float(exception_cfg['budget_seconds'])
        branch_target_coverage_pct = float(exception_cfg['min_coverage_pct'])
        exception_first_params = dict(params or {})
        try:
            current_top_k = int(float(exception_first_params.get('meeting_fast_override_top_k', exception_cfg['override_top_k']) or exception_cfg['override_top_k']))
        except (TypeError, ValueError):
            current_top_k = int(exception_cfg['override_top_k'])
        exception_first_params['meeting_fast_override_top_k'] = min(current_top_k, int(exception_cfg['override_top_k']))
        current_max_selected = exception_first_params.get('meeting_fast_override_max_selected')
        if current_max_selected in ('', None):
            exception_first_params['meeting_fast_override_max_selected'] = int(exception_cfg['max_selected'])
        else:
            try:
                exception_first_params['meeting_fast_override_max_selected'] = min(
                    int(float(current_max_selected)),
                    int(exception_cfg['max_selected']),
                )
            except (TypeError, ValueError):
                exception_first_params['meeting_fast_override_max_selected'] = int(exception_cfg['max_selected'])
        try:
            current_rescue_seed_top_k = int(float(exception_first_params.get('standard_rescue_seed_top_k', exception_cfg['rescue_seed_top_k']) or exception_cfg['rescue_seed_top_k']))
        except (TypeError, ValueError):
            current_rescue_seed_top_k = int(exception_cfg['rescue_seed_top_k'])
        exception_first_params['standard_rescue_seed_top_k'] = min(current_rescue_seed_top_k, int(exception_cfg['rescue_seed_top_k']))
        exception_first_params['meeting_fast_target_coverage_pct'] = min(
            float(params.get('meeting_fast_target_coverage_pct', 100.0) or 100.0),
            float(exception_cfg['min_coverage_pct']),
        )

        params = exception_first_params
        _apply_exception("Exception-first completion")
        elapsed_after_exception = time.time() - branch_started_at
        if elapsed_after_exception >= branch_budget_seconds:
            branch_completion_mode = 'bounded_live'
            branch_stop_reason = (
                f"branch budget exhausted after exception search "
                f"({elapsed_after_exception:.1f}s/{branch_budget_seconds:.1f}s)"
            )
            branch_comparison_ready = False
        else:
            stop_meta = {}

            def _exception_stop_predicate(coverage_pct, rescue_count, fixed_sites, new_sites, exception_sites):
                elapsed = time.time() - branch_started_at
                if elapsed >= branch_budget_seconds:
                    return f"branch budget ({elapsed:.1f}s/{branch_budget_seconds:.1f}s)"
                if incumbent_coverage_pct is not None and incumbent_physical_count is not None:
                    current_total_sites = len(fixed_sites) + len(new_sites)
                    coverage_floor = max(
                        float(exception_cfg['min_coverage_pct']),
                        float(incumbent_coverage_pct) - float(exception_cfg['max_coverage_gap_pct']),
                    )
                    if (
                        coverage_pct >= coverage_floor - 1e-9 and
                        current_total_sites >= incumbent_physical_count + int(exception_cfg['max_extra_sites'])
                    ):
                        return (
                            "dominance guard against rescue-first "
                            f"(coverage {coverage_pct:.2f}% within {float(exception_cfg['max_coverage_gap_pct']):.2f} pts, "
                            f"{current_total_sites} physical Standards)"
                        )
                return None

            _run_rescue(
                "Exception-first completion",
                stop_predicate=_exception_stop_predicate,
                stop_meta=stop_meta,
            )
            if stop_meta.get('stop_reason'):
                branch_completion_mode = 'bounded_live'
                branch_stop_reason = str(stop_meta.get('stop_reason') or '')

    actual_min_d = _actual_min_distances_to_standard_sites(
        scope_grid,
        fixed_sites,
        new_sites,
        params,
        cached_context=cached_context,
        fixed_context=fixed_context,
    )
    wts = scope_grid['orders_per_day'].values.astype(np.float64)
    uncovered_orders = float(np.sum(wts[~covered]))
    coverage_pct = 100.0 * float(np.sum(wts[covered])) / max(float(np.sum(wts)), 1e-9)
    physical_count_at_100 = len(fixed_sites) + len(new_sites) if not np.any(~covered) else None
    frontier_max = _compact_standard_frontier_limit(physical_count_at_100)
    frontier_added = 0
    frontier_daily_gain = 0.0
    allow_frontier_refine = True
    if branch_type == 'exception_first' and branch_budget_seconds is not None:
        if (time.time() - branch_started_at) >= branch_budget_seconds:
            allow_frontier_refine = False
            if not branch_stop_reason:
                branch_completion_mode = 'bounded_live'
                branch_stop_reason = (
                    f"branch budget reached before frontier refinement "
                    f"({time.time() - branch_started_at:.1f}s/{branch_budget_seconds:.1f}s)"
                )
    if allow_frontier_refine and physical_count_at_100 is not None and frontier_max is not None and len(fixed_sites) + len(new_sites) < frontier_max:
        actual_min_d, frontier_added, frontier_daily_gain = _run_standard_cost_frontier_pass(
            scope_grid,
            fixed_sites,
            new_sites,
            actual_min_d,
            params,
            max_total_hubs=frontier_max,
            cached_context=cached_context,
            progress_cb=(lambda msg: progress_cb(f"{'Rescue-first' if branch_type == 'rescue_first' else 'Exception-first'} frontier: {msg}") if progress_cb else None),
        )
        rescue_count += int(frontier_added or 0)
        rescue_penalty_total += float(params.get('standard_rescue_open_penalty_per_day', 0.0) or 0.0) * int(frontier_added or 0)

    all_sites = fixed_sites + new_sites
    final_covered = covered if frontier_added <= 0 else (actual_min_d <= float(params.get('standard_ds_radius', 3.0) or 3.0) + 1e-5) | covered
    final_uncovered_orders = float(np.sum(wts[~final_covered]))
    final_coverage_pct = 100.0 * float(np.sum(wts[final_covered])) / max(float(np.sum(wts)), 1e-9)
    branch_elapsed_seconds = time.time() - branch_started_at
    if branch_type == 'exception_first':
        if branch_stop_reason:
            branch_completion_mode = 'bounded_live'
        branch_comparison_ready = bool(final_coverage_pct >= branch_target_coverage_pct - 1e-9)
    return {
        'branch_type': branch_type,
        'fixed_sites': fixed_sites,
        'new_sites': new_sites,
        'all_sites': all_sites,
        'cached_demand_candidate_context': cached_context,
        'cached_fixed_site_context': fixed_context,
        'covered_mask': final_covered,
        'min_distances_km': current_min_d,
        'actual_min_distances_km': actual_min_d,
        'coverage_pct': round(final_coverage_pct, 2),
        'uncovered_orders_per_day': round(final_uncovered_orders, 2),
        'infeasible_under_cap': bool(np.any(~final_covered)),
        'gap_fill_count': gap_fill_count,
        'exception_sites': exception_sites,
        'exception_count': len(exception_sites),
        'fixed_count': len(fixed_sites),
        'new_count': len(new_sites),
        'base_new_count': base_new_count,
        'rescue_count': rescue_count,
        'frontier_cost_refine_count': int(frontier_added or 0),
        'frontier_cost_refine_daily_gain': round(frontier_daily_gain, 2),
        'rescue_penalty_per_day_total': round(rescue_penalty_total, 2),
        'max_new_standard_stores': base_plan.get('max_new_standard_stores'),
        'exact_total_standard_stores': base_plan.get('exact_total_standard_stores'),
        'min_physical_standard_count_for_100': physical_count_at_100,
        'allowed_frontier_max_count': frontier_max,
        'within_compact_frontier': (
            True if frontier_max is None else (len(fixed_sites) + len(new_sites) <= frontier_max)
        ),
        'branch_completion_mode': branch_completion_mode,
        'branch_stop_reason': branch_stop_reason,
        'branch_budget_seconds': (round(branch_budget_seconds, 1) if branch_budget_seconds is not None else None),
        'branch_elapsed_seconds': round(branch_elapsed_seconds, 1),
        'branch_target_coverage_pct': round(float(branch_target_coverage_pct), 2),
        'branch_comparison_ready': branch_comparison_ready,
    }


def _plan_standard_network(scope_grid, params, progress_cb=None):
    radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    spacing_km = _tier_spacing_radius(params, 'standard')
    min_orders, max_orders = _tier_min_max_orders(params, 'standard')
    fixed_sites = _build_fixed_standard_sites(params)
    fixed_count = len(fixed_sites)
    exact_total = _safe_optional_count(params, 'exact_total_standard_stores')
    if exact_total is None:
        exact_total = _safe_optional_count(params, 'standard_ds_target_count')
    max_new = _safe_optional_count(params, 'max_new_standard_stores')
    if max_new is None:
        max_new = int(params.get('standard_ds_max', 500) or 500)
    if exact_total is not None:
        if exact_total < fixed_count:
            raise ValueError(
                f"Exact total Standard stores {exact_total} is below fixed existing count {fixed_count}"
            )
        max_new = min(max_new, exact_total - fixed_count)

    clat = scope_grid['cell_lat'].values.astype(np.float64)
    clon = scope_grid['cell_lon'].values.astype(np.float64)
    wts = scope_grid['orders_per_day'].values.astype(np.float64)
    cached_context = None
    if bool(params.get('reuse_tier_edge_cache', True)) and float(params.get('exact_graph_max_radius_km', radius) or radius) >= float(radius) - 1e-5:
        try:
            cached_context = _get_all_demand_candidate_context(
                scope_grid,
                params,
                progress_cb=(lambda msg: progress_cb(f"Standard cache prep: {msg}") if progress_cb else None),
            )
        except Exception:
            cached_context = None
    planner_params = dict(params or {})
    planner_params['_existing_standard_spacing_hubs'] = list(fixed_sites)
    meeting_fast_mode = bool(planner_params.get('meeting_fast_mode', False))
    try:
        meeting_target_coverage_pct = float(
            planner_params.get('meeting_fast_target_coverage_pct', planner_params.get('benchmark_near_full_coverage_pct', 99.7)) or 99.7
        )
    except (TypeError, ValueError):
        meeting_target_coverage_pct = 99.7
    meeting_target_coverage_pct = min(100.0, max(90.0, meeting_target_coverage_pct))
    try:
        meeting_gap_fill_cap = int(float(planner_params.get('meeting_fast_max_standard_gap_fill_sites', 40) or 40))
    except (TypeError, ValueError):
        meeting_gap_fill_cap = 40
    meeting_gap_fill_cap = max(0, meeting_gap_fill_cap)
    allow_gap_satellites = bool(planner_params.get('meeting_fast_allow_standard_gap_satellites', False))
    if cached_context is not None:
        planner_params['_cached_demand_candidate_context'] = cached_context
    fixed_context = None
    if fixed_sites and bool(planner_params.get('reuse_tier_edge_cache', True)):
        try:
            fixed_context = _get_fixed_site_context(
                scope_grid,
                fixed_sites,
                planner_params,
                progress_cb=(lambda msg: progress_cb(f"Standard fixed-base cache: {msg}") if progress_cb else None),
            )
        except Exception:
            fixed_context = None
    if fixed_context is not None:
        planner_params['_cached_fixed_site_context'] = fixed_context

    covered = np.zeros(len(scope_grid), dtype=bool)
    current_min_d = np.full(len(scope_grid), np.inf, dtype=np.float64)
    if fixed_sites:
        graph_max_radius = float(params.get('exact_graph_max_radius_km', radius) or radius)
        fixed_overlay_cache_path = _exact_fixed_overlay_graph_cache_path(scope_grid, fixed_sites, params, allow_exceptions=True)
        current_min_d = None
        if os.path.exists(fixed_overlay_cache_path):
            fixed_overlay_graph = _load_or_build_exact_site_edge_graph(
                scope_grid,
                fixed_sites,
                graph_max_radius,
                fixed_overlay_cache_path,
                'standard fixed overlay',
                progress_cb=(lambda msg: progress_cb(f"Standard fixed-base cache: {msg}") if progress_cb else None),
            )
            current_min_d = _min_dist_from_site_edge_graph(
                fixed_overlay_graph,
                len(scope_grid),
                radius_limit_km=radius,
            )
        if current_min_d is None:
            fixed_cache_label = f"standard_fixed_{_effective_fixed_store_mode(params)}"
            current_min_d = _cached_min_distances_for_hubs(
                scope_grid,
                fixed_sites,
                params,
                radius,
                fixed_cache_label,
                progress_cb=(lambda msg: progress_cb(f"Standard fixed-base cache: {msg}") if progress_cb else None),
            )
        if current_min_d is None:
            current_min_d = _min_dist_to_hubs_for_grid(
                scope_grid,
                fixed_sites,
                progress_cb=(lambda done, total: progress_cb(f"Standard base distances to fixed live stores: {done}/{total} batches") if progress_cb else None),
            )
        covered = current_min_d <= radius + 1e-5

    new_sites = []
    exception_sites = []
    remaining = scope_grid[~covered].sort_values('orders_per_day', ascending=False).copy()
    if meeting_fast_mode and len(remaining) > 0:
        seeded_sites, _ = find_standard_ds(remaining, planner_params)
        for seeded in seeded_sites[:max_new]:
            hub = dict(seeded)
            hub.update({
                'id': f'NEW-STD-{len(new_sites) + 1}',
                'planning_order': len(new_sites) + 1,
                'fixed_open': False,
                'marginal_covered_orders_per_day': round(float(hub.get('orders_per_day', 0.0) or 0.0), 2),
                'marginal_modeled_daily_cost': 0.0,
            })
            new_sites.append(hub)
        if new_sites:
            d_new = _cached_min_distances_for_hubs(
                scope_grid,
                new_sites,
                planner_params,
                radius,
                'standard_fast_plan',
                progress_cb=(lambda msg: progress_cb(f"Standard fast coverage: {msg}") if progress_cb else None),
            )
            if d_new is None:
                for hub in new_sites:
                    current_min_d = np.minimum(
                        current_min_d,
                        osrm_one_to_many(float(hub['lat']), float(hub['lon']), scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values)
                    )
            else:
                current_min_d = np.minimum(current_min_d, d_new)
            covered = current_min_d <= radius + 1e-5
            remaining = scope_grid[~covered].sort_values('orders_per_day', ascending=False).copy()
        if progress_cb and new_sites:
            progress_cb(
                f"Standard base network: {fixed_count} fixed + {len(new_sites)} new, "
                f"coverage {100.0 * float(np.sum(wts[covered])) / max(float(np.sum(wts)), 1e-9):.2f}%"
            )
    else:
        skips = 0
        while np.any(~covered) and len(new_sites) < max_new and len(remaining) > 0:
            candidate = _try_greedy_hub(
                remaining, clat, clon, wts, covered,
                radius, min_orders, max_orders, 'standard', '15k', params=planner_params
            )
            if candidate is None:
                best_idx = remaining['orders_per_day'].idxmax()
                remaining = remaining.drop(best_idx)
                skips += 1
                if skips >= 200:
                    break
                continue

            skips = 0
            hub = dict(candidate['hub'])
            hub.update({
                'id': f'NEW-STD-{len(new_sites) + 1}',
                'planning_order': len(new_sites) + 1,
                'fixed_open': False,
                'marginal_covered_orders_per_day': round(float(candidate.get('new_coverage', 0.0) or 0.0), 2),
                'marginal_modeled_daily_cost': round(float(candidate.get('modeled_daily_cost', 0.0) or 0.0), 2),
            })
            new_sites.append(hub)
            cached_new = _distance_array_from_cached_seed(cached_context, float(hub['lat']), float(hub['lon']), len(scope_grid)) if cached_context is not None else None
            d_new = cached_new if cached_new is not None else osrm_one_to_many(
                float(hub['lat']), float(hub['lon']), scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values
            )
            current_min_d = np.minimum(current_min_d, d_new)
            covered = current_min_d <= radius + 1e-5
            remaining = scope_grid[~covered].sort_values('orders_per_day', ascending=False).copy()
            if progress_cb and len(new_sites) % 5 == 0:
                progress_cb(
                    f"Standard base network: {fixed_count} fixed + {len(new_sites)} new, "
                    f"coverage {100.0 * float(np.sum(wts[covered])) / max(float(np.sum(wts)), 1e-9):.2f}%"
                )

    exception_sites, covered = _apply_standard_exception_overrides(
        scope_grid,
        covered,
        fixed_sites + new_sites,
        planner_params,
        remaining_slots=params.get('standard_exception_max_hubs'),
        progress_cb=progress_cb,
    )

    gap_fill_count = 0
    blocked_gap_idx = np.zeros(len(scope_grid), dtype=bool)
    while np.any(~covered) and len(new_sites) < max_new:
        if meeting_fast_mode:
            coverage_pct = 100.0 * float(np.sum(wts[covered])) / max(float(np.sum(wts)), 1e-9)
            if coverage_pct >= meeting_target_coverage_pct - 1e-9:
                if progress_cb:
                    progress_cb(
                        f"Standard gap fill stopped at bounded meeting target "
                        f"({coverage_pct:.2f}% >= {meeting_target_coverage_pct:.2f}%)."
                    )
                break
            if gap_fill_count >= meeting_gap_fill_cap:
                if progress_cb:
                    progress_cb(
                        f"Standard gap fill stopped at meeting cap "
                        f"({gap_fill_count} additional Standard sites)."
                    )
                break
        uncovered_idx = np.where((~covered) & (~blocked_gap_idx))[0]
        if len(uncovered_idx) == 0:
            break
        seed_idx = int(uncovered_idx[np.argmax(wts[uncovered_idx])])
        seed_lat = float(clat[seed_idx])
        seed_lon = float(clon[seed_idx])
        full_seed_mask = _distance_mask_from_cached_seed(cached_context, seed_lat, seed_lon, len(scope_grid), radius) if cached_context is not None else None
        if full_seed_mask is None:
            d_seed = osrm_one_to_many(seed_lat, seed_lon, clat[uncovered_idx], clon[uncovered_idx])
            local_mask = np.isfinite(d_seed) & (d_seed <= radius + 1e-5)
            member_idx = uncovered_idx[local_mask]
        else:
            member_idx = uncovered_idx[full_seed_mask[uncovered_idx]]
        if len(member_idx) == 0:
            member_idx = np.array([seed_idx], dtype=np.int64)
        member_orders = float(np.sum(wts[member_idx]))
        center_lat = float(np.average(clat[member_idx], weights=wts[member_idx]))
        center_lon = float(np.average(clon[member_idx], weights=wts[member_idx]))
        if cached_context is not None and len(member_idx) > 0:
            snap_pos = int(np.argmin((clat[member_idx] - center_lat) ** 2 + (clon[member_idx] - center_lon) ** 2))
            center_lat = float(clat[member_idx][snap_pos])
            center_lon = float(clon[member_idx][snap_pos])
        cached_full = _distance_array_from_cached_seed(cached_context, center_lat, center_lon, len(scope_grid)) if cached_context is not None else None
        d_full = cached_full if cached_full is not None else osrm_one_to_many(
            center_lat, center_lon, scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values
        )
        cover_mask = np.isfinite(d_full) & (d_full <= radius + 1e-5)
        catchment_orders = float(np.sum(wts[cover_mask]))
        coverage_satellite = not (min_orders <= catchment_orders <= max_orders)
        if _violates_same_tier_spacing(center_lat, center_lon, fixed_sites + new_sites, spacing_km):
            alt_cached = _distance_array_from_cached_seed(cached_context, seed_lat, seed_lon, len(scope_grid)) if cached_context is not None else None
            alt_full = alt_cached if alt_cached is not None else osrm_one_to_many(
                seed_lat, seed_lon, scope_grid['avg_cust_lat'].values, scope_grid['avg_cust_lon'].values
            )
            alt_cover_mask = np.isfinite(alt_full) & (alt_full <= radius + 1e-5)
            if _violates_same_tier_spacing(seed_lat, seed_lon, fixed_sites + new_sites, spacing_km):
                blocked_gap_idx[member_idx] = True
                continue
            center_lat = seed_lat
            center_lon = seed_lon
            d_full = alt_full
            cover_mask = alt_cover_mask
            catchment_orders = float(np.sum(wts[cover_mask]))
            coverage_satellite = not (min_orders <= catchment_orders <= max_orders)
        marginal_new_orders = float(np.sum(wts[cover_mask & ~covered]))
        if marginal_new_orders <= 1e-6:
            blocked_gap_idx[member_idx] = True
            continue
        if meeting_fast_mode and coverage_satellite and not allow_gap_satellites:
            blocked_gap_idx[member_idx] = True
            continue
        hub = {
            'id': f'NEW-STD-{len(new_sites) + 1}',
            'lat': center_lat,
            'lon': center_lon,
            'orders_per_day': catchment_orders,
            'radius_km': radius,
            'type': 'standard',
            'cells': int(np.sum(cover_mask)),
            'selection': '15k-gapfill',
            'coverage_satellite': coverage_satellite,
            'gap_fill': True,
            'fixed_open': False,
            'planning_order': len(new_sites) + 1,
            'marginal_covered_orders_per_day': round(marginal_new_orders, 2),
            'marginal_modeled_daily_cost': round(float(np.sum(
                (float(params.get('standard_base_cost', 29)) + float(params.get('standard_variable_rate', 9)) * d_full[cover_mask & ~covered])
                * wts[cover_mask & ~covered]
            )), 2),
        }
        new_sites.append(hub)
        current_min_d = np.minimum(current_min_d, d_full)
        covered |= np.isfinite(d_full) & (d_full <= radius + 1e-5)
        gap_fill_count += 1
        if progress_cb and gap_fill_count % 5 == 0:
            progress_cb(f"Standard gap fill: added {gap_fill_count} additional Standard site(s)...")

    run_second_exception_pass = not bool(planner_params.get('meeting_fast_skip_second_exception_pass', False))
    if run_second_exception_pass:
        remaining_exception_slots = params.get('standard_exception_max_hubs')
        if remaining_exception_slots is not None:
            remaining_exception_slots = max(0, int(remaining_exception_slots) - len(exception_sites))
        extra_exception_sites, covered = _apply_standard_exception_overrides(
            scope_grid,
            covered,
            fixed_sites + new_sites,
            planner_params,
            remaining_slots=remaining_exception_slots,
            progress_cb=progress_cb,
        )
        seen_exception_ids = {str(site.get('id')) for site in exception_sites}
        for site in extra_exception_sites:
            if str(site.get('id')) not in seen_exception_ids:
                exception_sites.append(site)
                seen_exception_ids.add(str(site.get('id')))

    covered, current_min_d, rescue_count, rescue_penalty_total = _run_standard_rescue_pass(
        scope_grid,
        covered,
        current_min_d,
        fixed_sites,
        new_sites,
        exception_sites,
        planner_params,
        cached_context=cached_context,
        progress_cb=progress_cb,
    )
    all_sites = fixed_sites + new_sites
    uncovered_orders = float(np.sum(wts[~covered]))
    coverage_pct = 100.0 * float(np.sum(wts[covered])) / max(float(np.sum(wts)), 1e-9)
    return {
        'fixed_sites': fixed_sites,
        'new_sites': new_sites,
        'all_sites': all_sites,
        'cached_demand_candidate_context': cached_context,
        'cached_fixed_site_context': fixed_context,
        'covered_mask': covered,
        'min_distances_km': current_min_d,
        'coverage_pct': round(coverage_pct, 2),
        'uncovered_orders_per_day': round(uncovered_orders, 2),
        'infeasible_under_cap': bool(np.any(~covered)),
        'gap_fill_count': gap_fill_count,
        'exception_sites': exception_sites,
        'exception_count': len(exception_sites),
        'fixed_count': fixed_count,
        'new_count': len(new_sites),
        'rescue_count': rescue_count,
        'rescue_penalty_per_day_total': round(rescue_penalty_total, 2),
        'max_new_standard_stores': max_new,
        'exact_total_standard_stores': exact_total,
    }


def _plan_mini_overlay(scope_grid, params, progress_cb=None):
    mini_params = dict(params or {})
    mini_params.setdefault('mini_base_cost', 21)
    mini_params.setdefault('mini_variable_rate', 9)
    if progress_cb:
        progress_cb("Mini overlay: scanning dense in-scope clusters...")
    mini_sites, _ = find_mini_ds(scope_grid, mini_params)
    for i, hub in enumerate(mini_sites, start=1):
        hub.setdefault('id', f'MINI-{i}')
        hub['overlay_layer'] = True
    return mini_sites


def _meeting_branch_eval_from_cached_distances(scope_grid, branch_plan, mini_sites, eval_params, params):
    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    total_orders_per_day = float(np.sum(weights))
    n = len(scope_grid)
    current_baseline = (eval_params or {}).get('_precomputed_current_baseline') if isinstance(eval_params, dict) else None
    if not current_baseline:
        raise ValueError("Meeting fast branch evaluation requires a precomputed current baseline cache.")

    current_costs = np.asarray(current_baseline['current_costs'], dtype=np.float64)
    current_avg_cost = float(current_baseline['current_avg_cost'])
    current_avg_dist = float(current_baseline['current_avg_dist'])
    current_policy = current_baseline['current_policy']

    mini_sites = list(mini_sites or [])
    standard_sites = list(branch_plan.get('all_sites') or [])
    exception_sites = list(branch_plan.get('exception_sites') or [])
    exception_site_ids = {str(site.get('id')) for site in exception_sites if site.get('id') is not None}
    base_standard_hubs = [
        site for site in standard_sites
        if str(site.get('id')) not in exception_site_ids
    ]

    rmini = float(params.get('mini_ds_radius', 1.0) or 1.0)
    rstd = float(params.get('standard_ds_radius', 3.0) or 3.0)
    rstd_exception = float(params.get('standard_exception_radius_km', rstd) or rstd)
    mb = float(params.get('mini_base_cost', 20) or 20)
    mvar = float(params.get('mini_variable_rate', 6) or 6)
    sb = float(params.get('standard_base_cost', 29) or 29)
    svar = float(params.get('standard_variable_rate', 9) or 9)

    d_mini = _cached_min_distances_for_hubs(
        scope_grid,
        mini_sites,
        eval_params,
        rmini,
        'mini',
        progress_cb=None,
    ) if mini_sites else np.full(n, np.inf, dtype=np.float64)
    d_std = _cached_min_distances_for_hubs(
        scope_grid,
        base_standard_hubs,
        eval_params,
        rstd,
        'standard_base',
        progress_cb=None,
    ) if base_standard_hubs else np.full(n, np.inf, dtype=np.float64)
    d_std_exception = _cached_min_distances_for_hubs(
        scope_grid,
        exception_sites,
        eval_params,
        rstd_exception,
        'standard_exception',
        progress_cb=None,
    ) if exception_sites else np.full(n, np.inf, dtype=np.float64)

    def _score_network(include_mini):
        proposed_dists = np.full(n, np.nan, dtype=np.float64)
        proposed_costs = np.array(current_costs, copy=True)

        served_mini = np.zeros(n, dtype=bool)
        if include_mini and mini_sites:
            served_mini = np.isfinite(d_mini) & (d_mini <= rmini + 1e-5)
            proposed_dists[served_mini] = d_mini[served_mini]
            proposed_costs[served_mini] = mb + mvar * d_mini[served_mini]

        std_eligible_base = np.isfinite(d_std) & (d_std <= rstd + 1e-5)
        std_eligible_exception = np.isfinite(d_std_exception) & (d_std_exception <= rstd_exception + 1e-5)
        chosen_std_dist = np.minimum(
            np.where(std_eligible_base, d_std, np.inf),
            np.where(std_eligible_exception, d_std_exception, np.inf),
        )
        served_std = (~served_mini) & np.isfinite(chosen_std_dist)
        proposed_dists[served_std] = chosen_std_dist[served_std]
        proposed_costs[served_std] = sb + svar * chosen_std_dist[served_std]

        proposed_policy = _summarize_proposed_policy(
            weights,
            current_costs,
            proposed_costs,
            d_mini if include_mini else np.full(n, np.inf, dtype=np.float64),
            d_std,
            d_std_exception,
            np.full(n, np.inf, dtype=np.float64),
            mini_sites if include_mini else [],
            standard_sites,
            [],
            params,
        )
        served = proposed_policy['hard_served_mask']
        hybrid_mask = served | proposed_policy['exception_bucket_usage'].get('selected_mask', np.zeros(n, dtype=bool))
        modeled_cost = _modeled_cost_summary(weights, proposed_costs, params, 0)
        addressable = _addressable_coverage_metrics(
            weights,
            served,
            hybrid_mask,
            {'excluded_orders_per_day': 0.0, 'excluded_zone_count': 0},
            dict(params or {}, low_density_policy='always_serve'),
        )
        proposed_avg_dist = None
        proposed_mean_dist_unweighted = None
        if np.any(served):
            proposed_avg_dist = float(np.average(proposed_dists[served], weights=weights[served]))
            proposed_mean_dist_unweighted = float(np.nanmean(proposed_dists))
        proposed_avg_cost = float(np.average(proposed_costs, weights=weights))
        daily_savings = (current_avg_cost - proposed_avg_cost) * total_orders_per_day
        pct_order_weight_outside_tier_radii = round(
            float(100.0 * np.sum(weights[~served]) / max(total_orders_per_day, 1e-9)),
            2,
        )
        result = {
            'current_avg_dist': round(current_avg_dist, 3),
            'proposed_avg_dist': None if proposed_avg_dist is None else round(proposed_avg_dist, 3),
            'proposed_mean_dist_unweighted': None if proposed_mean_dist_unweighted is None else round(proposed_mean_dist_unweighted, 3),
            'current_avg_cost': round(current_avg_cost, 2),
            'proposed_avg_cost': round(proposed_avg_cost, 2),
            'avg_modeled_cost_per_order': round(modeled_cost['avg_modeled_cost_per_order'], 2),
            'super_penalty_cost_per_day': 0.0,
            'exception_standard_hub_count': len(exception_sites),
            'current_operational_coverage_pct': current_policy['current_operational_coverage_pct'],
            'current_policy_coverage_pct': current_policy['current_policy_coverage_pct'],
            'proposed_hard_coverage_pct': proposed_policy['proposed_hard_coverage_pct'],
            'proposed_hybrid_coverage_pct': proposed_policy['proposed_hybrid_coverage_pct'],
            'full_hard_coverage_pct': addressable['full_hard_coverage_pct'],
            'full_hybrid_coverage_pct': addressable['full_hybrid_coverage_pct'],
            'addressable_hard_coverage_pct': addressable['addressable_hard_coverage_pct'],
            'addressable_hybrid_coverage_pct': addressable['addressable_hybrid_coverage_pct'],
            'policy_breach_orders_per_day': current_policy['policy_breach_orders_per_day'],
            'policy_breach_hubs': current_policy['policy_breach_hubs'],
            'exception_bucket_usage': {
                k: v for k, v in proposed_policy['exception_bucket_usage'].items() if k != 'selected_mask'
            },
            'daily_savings': round(max(0, daily_savings), 0),
            'monthly_savings': round(max(0, daily_savings) * 30, 0),
            'total_orders_per_day': round(total_orders_per_day, 2),
            'pct_cost_reduction': round((current_avg_cost - proposed_avg_cost) / max(current_avg_cost, 0.01) * 100, 1),
            'distance_source': 'OSRM road distance via cached tier edge graph',
            'distance_histogram': {},
            'total_grid_cells': len(scope_grid),
            'proposed_distances_proxy': False,
            'pct_orders_within_mini_service_km': (
                round(100.0 * float(np.sum(weights[served_mini])) / max(total_orders_per_day, 1e-9), 2)
                if include_mini and mini_sites else 0.0
            ),
            'mini_service_radius_km': round(rmini, 3),
            'pct_order_weight_outside_tier_radii': pct_order_weight_outside_tier_radii,
            'metrics_note': (
                'Current baseline is cached once. Proposed meeting-mode metrics are scored directly from '
                'cached tier distance arrays for Mini / Standard / Exception, without a second full network pass.'
            ),
        }
        return result, {
            'served_mini': served_mini,
            'served_std': served_std,
            'proposed_dists': proposed_dists,
            'proposed_costs': proposed_costs,
        }

    standard_only_metrics, standard_debug = _score_network(include_mini=False)
    combined_metrics, combined_debug = _score_network(include_mini=True)
    shifted_mask = combined_debug['served_mini'] & standard_debug['served_std']
    avg_delta = float(standard_only_metrics['proposed_avg_cost'] - combined_metrics['proposed_avg_cost'])
    mini_summary = {
        'site_count': int(len(mini_sites)),
        'orders_shifted_from_standard_per_day': round(float(np.sum(weights[shifted_mask])), 2),
        'avg_cost_reduction_per_order': round(avg_delta, 2),
        'daily_cost_reduction': round(avg_delta * total_orders_per_day, 2),
    }
    return {
        'combined_metrics': combined_metrics,
        'combined_debug': combined_debug,
        'standard_only_metrics': standard_only_metrics,
        'mini_summary': mini_summary,
    }


def _evaluate_meeting_standard_branch(scope_grid, baseline_stores, branch_plan, mini_sites, eval_params, params, progress_label, progress_cb=None):
    if bool((params or {}).get('meeting_fast_mode', True)):
        return _meeting_branch_eval_from_cached_distances(
            scope_grid,
            branch_plan,
            mini_sites,
            eval_params,
            params,
        )
    combined_eval = evaluate_network(
        scope_grid,
        baseline_stores,
        list(mini_sites or []),
        list(branch_plan.get('all_sites') or []),
        [],
        eval_params,
        progress_cb=(lambda msg: progress_cb(f"{progress_label}: {msg}") if progress_cb else None),
        return_debug=True,
    )
    combined_debug = combined_eval.pop('_debug', None)
    standard_only_metrics = _build_standard_only_metrics_from_combined_debug(combined_debug, params)
    mini_summary = _summarize_mini_overlay_from_combined_debug(
        combined_debug,
        standard_only_metrics,
        combined_eval,
        len(mini_sites or []),
    )
    mini_summary['site_count'] = int(len(mini_sites or []))
    return {
        'combined_metrics': combined_eval,
        'combined_debug': combined_debug,
        'standard_only_metrics': standard_only_metrics,
        'mini_summary': mini_summary,
    }


def _build_meeting_scenario_view(view_key, label, branch_plan, metrics, params, mini_sites=None,
                                 mini_summary=None, candidate_universe_label=None, spacing_mode_label='strict'):
    mini_sites = list(mini_sites or [])
    mini_summary = dict(mini_summary or {})
    branch_type = branch_plan.get('branch_type', 'strict_base')
    fixed_sites = _copy_site_records(branch_plan.get('fixed_sites'))
    new_sites = _copy_site_records(branch_plan.get('new_sites'))
    exception_sites = _copy_site_records(branch_plan.get('exception_sites'))
    standard_sites = list(branch_plan.get('all_sites') or [])
    candidate_universe_label = candidate_universe_label or _standard_candidate_universe_label(params)
    fixed_count = int(branch_plan.get('fixed_count', 0) or 0)
    base_new_count = int(branch_plan.get('base_new_count', branch_plan.get('new_count', 0)) or 0)
    rescue_count = int(branch_plan.get('rescue_count', 0) or 0)
    gap_fill_sites = []
    rescue_sites = []
    frontier_refine_sites = []
    annotated_new_sites = []
    base_new_sites = []
    for site in new_sites:
        role = 'base_new'
        if bool(site.get('cost_frontier_refine')):
            role = 'frontier_refine_spacing_relaxed'
            frontier_refine_sites.append(dict(site))
        elif bool(site.get('rescue_gap_fill')):
            role = 'rescue_spacing_relaxed'
            rescue_sites.append(dict(site))
        elif bool(site.get('gap_fill')):
            role = 'gap_fill'
            gap_fill_sites.append(dict(site))
        else:
            base_new_sites.append(dict(site))
        annotated_site = dict(site)
        annotated_site['standard_role'] = role
        annotated_site['is_standard_base_new'] = role == 'base_new'
        annotated_site['is_standard_gap_fill'] = role == 'gap_fill'
        annotated_site['is_standard_rescue'] = role == 'rescue_spacing_relaxed'
        annotated_site['is_standard_spacing_relaxed'] = role in {'rescue_spacing_relaxed', 'frontier_refine_spacing_relaxed'}
        annotated_site['is_standard_frontier_refine'] = role == 'frontier_refine_spacing_relaxed'
        annotated_new_sites.append(annotated_site)
    annotated_exception_sites = []
    for site in exception_sites:
        annotated_site = dict(site)
        annotated_site['standard_role'] = 'exception_override'
        annotated_site['is_exception_override'] = True
        annotated_exception_sites.append(annotated_site)
    spacing_relaxed_sites = []
    seen_spacing_relaxed = set()
    for site in rescue_sites + frontier_refine_sites:
        key = str(site.get('id') or f"{site.get('lat')},{site.get('lon')}")
        if key in seen_spacing_relaxed:
            continue
        seen_spacing_relaxed.add(key)
        spacing_relaxed_sites.append(dict(site))
    total_physical = len(standard_sites)
    view_metrics = dict(metrics or {})
    return {
        'view_key': view_key,
        'label': label,
        'branch_type': branch_type,
        'branch_completion_mode': branch_plan.get('branch_completion_mode', 'exact'),
        'branch_stop_reason': branch_plan.get('branch_stop_reason', ''),
        'branch_budget_seconds': branch_plan.get('branch_budget_seconds'),
        'branch_elapsed_seconds': branch_plan.get('branch_elapsed_seconds'),
        'branch_target_coverage_pct': branch_plan.get('branch_target_coverage_pct'),
        'branch_comparison_ready': bool(branch_plan.get('branch_comparison_ready', True)),
        'mini_enabled': bool(mini_sites),
        'candidate_universe_label': candidate_universe_label,
        'spacing_mode_label': spacing_mode_label,
        'fixed_standard_count': fixed_count,
        'base_new_standard_count': base_new_count,
        'rescue_standard_count': rescue_count,
        'gap_fill_standard_count': int(branch_plan.get('gap_fill_count', len(gap_fill_sites)) or len(gap_fill_sites)),
        'spacing_relaxed_standard_count': int(len(spacing_relaxed_sites)),
        'total_physical_standard_count': total_physical,
        'exception_override_count': int(branch_plan.get('exception_count', 0) or 0),
        'mini_count': int(len(mini_sites)),
        'proposed_hard_coverage_pct': float(view_metrics.get('proposed_hard_coverage_pct', 0.0) or 0.0),
        'proposed_avg_cost': float(view_metrics.get('proposed_avg_cost', 0.0) or 0.0),
        'proposed_avg_dist': float(view_metrics.get('proposed_avg_dist', 0.0) or 0.0) if view_metrics.get('proposed_avg_dist') is not None else None,
        'current_avg_cost': float(view_metrics.get('current_avg_cost', 0.0) or 0.0),
        'current_avg_dist': float(view_metrics.get('current_avg_dist', 0.0) or 0.0),
        'daily_savings': float(view_metrics.get('daily_savings', 0.0) or 0.0),
        'monthly_savings': float(view_metrics.get('monthly_savings', 0.0) or 0.0),
        'uncovered_orders_per_day': float(branch_plan.get('uncovered_orders_per_day', 0.0) or 0.0),
        'min_physical_standard_count_for_100': branch_plan.get('min_physical_standard_count_for_100'),
        'allowed_frontier_max_count': branch_plan.get('allowed_frontier_max_count'),
        'within_compact_frontier': bool(branch_plan.get('within_compact_frontier', False)),
        'mini_overlay_summary': mini_summary,
        'frontier_cost_refine_count': int(branch_plan.get('frontier_cost_refine_count', 0) or 0),
        'frontier_cost_refine_daily_gain': float(branch_plan.get('frontier_cost_refine_daily_gain', 0.0) or 0.0),
        'fixed_store_world': _effective_fixed_store_world(params),
        'fixed_store_mode': _effective_fixed_store_mode(params),
        'standard_ds_radius': float(params.get('standard_ds_radius', 3.0) or 3.0),
        'mini_ds': _copy_site_records(mini_sites),
        'standard_ds': _copy_site_records(new_sites),
        'super_ds': [],
        'metrics': view_metrics,
        'planning_layers': {
            'standard': {
                'fixed_open_stores': _copy_site_records(fixed_sites),
                'fixed_open_count': fixed_count,
                'proposed_new_stores': _copy_site_records(annotated_new_sites),
                'new_standard_sites': _copy_site_records(annotated_new_sites),
                'base_new_standard_sites': _copy_site_records(base_new_sites),
                'gap_fill_standard_sites': _copy_site_records(gap_fill_sites),
                'rescue_standard_sites': _copy_site_records(rescue_sites),
                'spacing_relaxed_standard_sites': _copy_site_records(spacing_relaxed_sites),
                'exception_override_sites': _copy_site_records(annotated_exception_sites),
                'new_store_count': int(branch_plan.get('new_count', 0) or 0),
                'base_new_store_count': base_new_count,
                'rescue_store_count': rescue_count,
                'gap_fill_store_count': int(branch_plan.get('gap_fill_count', len(gap_fill_sites)) or len(gap_fill_sites)),
                'spacing_relaxed_store_count': int(len(spacing_relaxed_sites)),
                'exception_sites': _copy_site_records(annotated_exception_sites),
                'exception_hub_count': int(branch_plan.get('exception_count', 0) or 0),
                'total_standard_sites': total_physical,
                'fixed_store_world': _effective_fixed_store_world(params),
                'fixed_store_mode': _effective_fixed_store_mode(params),
                'standard_ds_radius': float(params.get('standard_ds_radius', 3.0) or 3.0),
                'coverage_pct': float(branch_plan.get('coverage_pct', 0.0) or 0.0),
                'uncovered_orders_per_day': float(branch_plan.get('uncovered_orders_per_day', 0.0) or 0.0),
                'infeasible_under_cap': bool(branch_plan.get('infeasible_under_cap', False)),
                'gap_fill_count': int(branch_plan.get('gap_fill_count', 0) or 0),
                'rescue_penalty_per_day_total': float(branch_plan.get('rescue_penalty_per_day_total', 0.0) or 0.0),
                'min_physical_standard_count_for_100': branch_plan.get('min_physical_standard_count_for_100'),
                'allowed_frontier_max_count': branch_plan.get('allowed_frontier_max_count'),
                'within_compact_frontier': bool(branch_plan.get('within_compact_frontier', False)),
                'frontier_cost_refine_count': int(branch_plan.get('frontier_cost_refine_count', 0) or 0),
                'branch_completion_mode': branch_plan.get('branch_completion_mode', 'exact'),
                'branch_stop_reason': branch_plan.get('branch_stop_reason', ''),
                'branch_comparison_ready': bool(branch_plan.get('branch_comparison_ready', True)),
            },
            'mini': {
                **mini_summary,
                'site_count': int(len(mini_sites)),
            },
        },
    }


def _pick_active_meeting_view_key(scenario_views):
    preferred = [
        'rescue_first_standard_100_plus_mini',
        'exception_first_standard_100_plus_mini',
        'rescue_first_standard_100',
        'exception_first_standard_100',
        'strict_standard_base',
    ]
    candidates = [scenario_views[k] for k in preferred if k in scenario_views]
    if not candidates:
        return None

    def _score(view):
        comparison_ready = 1 if bool(view.get('branch_comparison_ready', True)) else 0
        coverage = float(view.get('proposed_hard_coverage_pct', 0.0) or 0.0)
        avg_cost = float(view.get('proposed_avg_cost', np.inf) or np.inf)
        total_sites = int(view.get('total_physical_standard_count', 0) or 0)
        rescue_count = int(view.get('rescue_standard_count', 0) or 0)
        exception_count = int(view.get('exception_override_count', 0) or 0)
        frontier_ok = 1 if bool(view.get('within_compact_frontier', False)) else 0
        return (comparison_ready, coverage, frontier_ok, -avg_cost, -total_sites, -rescue_count, -exception_count)

    best = max(candidates, key=_score)
    return best.get('view_key')


def _meeting_scenario_summaries(scenario_order, scenario_views, active_view_key):
    summaries = []
    for view_key in scenario_order:
        view = scenario_views.get(view_key)
        if not view:
            continue
        summaries.append({
            'view_key': view_key,
            'label': view.get('label', view_key),
            'coverage_pct': round(float(view.get('proposed_hard_coverage_pct', 0.0) or 0.0), 2),
            'proposed_avg_cost': round(float(view.get('proposed_avg_cost', 0.0) or 0.0), 2),
            'proposed_avg_dist': (
                None if view.get('proposed_avg_dist') is None
                else round(float(view.get('proposed_avg_dist') or 0.0), 3)
            ),
            'total_physical_standard_count': int(view.get('total_physical_standard_count', 0) or 0),
            'rescue_standard_count': int(view.get('rescue_standard_count', 0) or 0),
            'exception_override_count': int(view.get('exception_override_count', 0) or 0),
            'mini_count': int(view.get('mini_count', 0) or 0),
            'within_compact_frontier': bool(view.get('within_compact_frontier', False)),
            'branch_completion_mode': view.get('branch_completion_mode', 'exact'),
            'branch_comparison_ready': bool(view.get('branch_comparison_ready', True)),
            'branch_stop_reason': view.get('branch_stop_reason', ''),
            'selected': view_key == active_view_key,
        })
    return summaries


def _build_exact_standard_candidate_pool(scope_grid, fixed_sites, params, progress_cb=None):
    base_radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    cache_enabled = bool(params.get('exact_candidate_pool_cache_enabled', True))
    cache_path = _exact_candidate_pool_cache_path(scope_grid, fixed_sites, params)
    candidate_cap = params.get('exact_candidate_cap')
    use_all_candidates = candidate_cap in (None, '', 0, '0', 'all', 'ALL')
    if cache_enabled and os.path.exists(cache_path):
        if progress_cb:
            progress_cb(f"Exact Standard: loading cached candidate pool {os.path.basename(cache_path)}")
        with open(cache_path, 'rb') as f:
            cached = pickle.load(f)
        if use_all_candidates:
            refreshed = dict(cached)
            fixed_base_dists = np.asarray(refreshed.get('fixed_base_dists', np.empty(0, dtype=np.float64)), dtype=np.float64)
            candidate_sites = []
            for site in refreshed.get('sites', []):
                site_obj = dict(site)
                site_obj['radius_km'] = base_radius
                candidate_sites.append(site_obj)
            refreshed['sites'] = candidate_sites
            summary = dict(refreshed.get('summary') or {})
            if fixed_base_dists.size == len(scope_grid):
                summary['all_uncovered_candidate_cells'] = int(np.sum(fixed_base_dists > base_radius + 1e-5))
            refreshed['summary'] = summary
            return refreshed
        return cached
    if use_all_candidates:
        candidate_cap = None
    else:
        candidate_cap = max(50, int(candidate_cap))
    min_spacing_km = float(params.get('exact_candidate_min_spacing_km', 0.6) or 0.6)

    if use_all_candidates:
        fixed_base_dists = np.full(len(scope_grid), np.nan, dtype=np.float64)
        uncovered_mask = np.zeros(len(scope_grid), dtype=bool)
        candidate_positions = np.arange(len(scope_grid), dtype=np.int64)
        candidate_df = scope_grid.copy().reset_index(drop=True)
    else:
        fixed_base_dists = _min_dist_to_hubs_for_grid(
            scope_grid,
            fixed_sites,
            progress_cb=(lambda done, total: progress_cb(f"Exact Standard: fixed-base distance prep {done}/{total} batches") if progress_cb else None),
        ) if fixed_sites else np.full(len(scope_grid), np.inf, dtype=np.float64)
        uncovered_mask = fixed_base_dists > base_radius + 1e-5
        candidate_positions = np.flatnonzero(uncovered_mask)
        candidate_df = scope_grid.iloc[candidate_positions].copy().reset_index(drop=True)
    if len(candidate_df) == 0:
        return {
            'sites': [],
            'fixed_base_dists': fixed_base_dists,
            'summary': {
                'candidate_pool_mode': 'empty_after_fixed_coverage',
                'candidate_cap': candidate_cap,
                'candidate_spacing_km': min_spacing_km,
                'all_uncovered_candidate_cells': 0,
                'selected_candidate_cells': 0,
            },
        }

    candidate_df['fixed_base_distance_km'] = fixed_base_dists[candidate_positions]
    sort_cols = ['orders_per_day']
    sort_ascending = [False]
    if not use_all_candidates:
        sort_cols.append('fixed_base_distance_km')
        sort_ascending.append(False)
    candidate_df = candidate_df.sort_values(
        sort_cols,
        ascending=sort_ascending,
    ).reset_index(drop=True)

    raw_sites = [{
        'lat': float(row['avg_cust_lat']),
        'lon': float(row['avg_cust_lon']),
        'cell_lat': float(row['cell_lat']),
        'cell_lon': float(row['cell_lon']),
        'orders_per_day': float(row['orders_per_day']),
    } for _, row in candidate_df.iterrows()]

    if use_all_candidates or len(raw_sites) <= candidate_cap:
        selected = raw_sites
        pool_mode = 'all_in_scope_demand_cells' if use_all_candidates else 'all_uncovered_demand_cells'
    else:
        selected = []
        selected_xy = []
        ref_lat = float(np.mean([site['lat'] for site in raw_sites])) if raw_sites else 0.0
        for site in raw_sites:
            site_xy = _latlon_to_xy_km([site['lat']], [site['lon']], ref_lat=ref_lat)[0]
            if selected_xy:
                min_sq = min(
                    (site_xy[0] - prev[0]) ** 2 + (site_xy[1] - prev[1]) ** 2
                    for prev in selected_xy
                )
                if min_sq < min_spacing_km ** 2:
                    continue
            selected.append(site)
            selected_xy.append(site_xy)
            if len(selected) >= candidate_cap:
                break
        if len(selected) < candidate_cap:
            seen = {(round(s['lat'], 6), round(s['lon'], 6)) for s in selected}
            for site in raw_sites:
                key = (round(site['lat'], 6), round(site['lon'], 6))
                if key in seen:
                    continue
                selected.append(site)
                seen.add(key)
                if len(selected) >= candidate_cap:
                    break
        pool_mode = 'top_uncovered_cells_with_spacing'

    candidate_sites = []
    for idx, site in enumerate(selected, start=1):
        candidate_sites.append({
            'id': f'EXACT-STD-CAND-{idx}',
            'lat': site['lat'],
            'lon': site['lon'],
            'cell_lat': site['cell_lat'],
            'cell_lon': site['cell_lon'],
            'orders_per_day': site['orders_per_day'],
            'radius_km': base_radius,
            'type': 'standard',
            'selection': 'exact_candidate_pool',
            'fixed_open': False,
        })

    result = {
        'sites': candidate_sites,
        'fixed_base_dists': fixed_base_dists,
        'summary': {
            'candidate_pool_mode': pool_mode,
            'candidate_cap': candidate_cap if candidate_cap is not None else 'all',
            'candidate_spacing_km': min_spacing_km,
            'all_uncovered_candidate_cells': None if use_all_candidates else int(np.sum(uncovered_mask)),
            'all_in_scope_candidate_cells': int(len(scope_grid)),
            'selected_candidate_cells': int(len(candidate_sites)),
        },
    }
    if cache_enabled:
        with open(cache_path, 'wb') as f:
            pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
    return result


def _exact_candidate_pool_cache_path(scope_grid, fixed_sites, params, legacy_mode_sensitive=False):
    base_radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    candidate_cap = params.get('exact_candidate_cap')
    min_spacing_km = float(params.get('exact_candidate_min_spacing_km', 0.6) or 0.6)
    use_all_candidates = candidate_cap in (None, '', 0, '0', 'all', 'ALL')
    h = hashlib.sha1()
    if use_all_candidates:
        h.update(f"all|{min_spacing_km:.4f}".encode('utf-8'))
    else:
        if fixed_sites or legacy_mode_sensitive:
            h.update(_effective_fixed_store_source_mode(params).encode('utf-8'))
        else:
            h.update(b'shared_empty_fixed')
        h.update(f"{base_radius:.4f}|{candidate_cap}|{min_spacing_km:.4f}".encode('utf-8'))
    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    if not use_all_candidates:
        fixed_arr = np.array([[float(site['lat']), float(site['lon'])] for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty((0, 2), dtype=np.float64)
        h.update(np.round(fixed_arr, 5).tobytes())
    name = f"exact_std_candidates_{h.hexdigest()}.pkl"
    return os.path.join(GRAPH_CACHE_DIR, name)


def _exact_baseline_cache_path(scope_grid, existing_stores, params):
    base_cost = float(params.get('base_cost', 29) or 29)
    var_rate = float(params.get('variable_rate', 9) or 9)
    h = hashlib.sha1()
    h.update(_effective_fixed_store_source_mode(params).encode('utf-8'))
    h.update(f"{base_cost:.4f}|{var_rate:.4f}".encode('utf-8'))
    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    has_explicit_store_assignment = (
        'avg_store_lat' in scope_grid.columns and
        'avg_store_lon' in scope_grid.columns and
        np.any(np.isfinite(scope_grid['avg_store_lat'].values.astype(np.float64))) and
        np.any(np.isfinite(scope_grid['avg_store_lon'].values.astype(np.float64)))
    )
    h.update(str(bool(has_explicit_store_assignment)).encode('utf-8'))
    if has_explicit_store_assignment:
        store_assignment = scope_grid[['avg_store_lat', 'avg_store_lon']].copy()
        h.update(np.round(store_assignment.values.astype(np.float64), 5).tobytes())
    store_arr = np.array([[float(site['lat']), float(site['lon'])] for site in existing_stores], dtype=np.float64) if existing_stores else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(store_arr, 5).tobytes())
    return os.path.join(GRAPH_CACHE_DIR, f"exact_std_baseline_{h.hexdigest()}.pkl")


def _exact_spacing_conflict_fingerprint(spacing_conflicts):
    if not spacing_conflicts:
        return 'none'
    cached = spacing_conflicts.get('fingerprint')
    if cached:
        return str(cached)
    h = hashlib.sha1()
    h.update(str(spacing_conflicts.get('distance_rule', 'unknown')).encode('utf-8'))
    h.update(f"{float(spacing_conflicts.get('spacing_km', 0.0) or 0.0):.4f}".encode('utf-8'))
    blocked_candidate_mask = np.asarray(
        spacing_conflicts.get('blocked_candidate_mask', np.zeros(0, dtype=bool)),
        dtype=bool,
    )
    candidate_conflict_pairs = np.asarray(
        spacing_conflicts.get('candidate_conflict_pairs', np.empty((0, 2), dtype=np.int32)),
        dtype=np.int32,
    )
    h.update(blocked_candidate_mask.astype(np.uint8).tobytes())
    h.update(candidate_conflict_pairs.astype(np.int32).tobytes())
    return h.hexdigest()


def _exact_scenario_checkpoint_path(graph_cache_path, scenario_name, params, spacing_fingerprint='none'):
    h = hashlib.sha1()
    h.update(os.path.basename(graph_cache_path).encode('utf-8'))
    h.update(str(scenario_name).encode('utf-8'))
    h.update(str(params.get('benchmark_solver_checkpoint_version', 'v2')).encode('utf-8'))
    h.update(f"{float(params.get('standard_base_cost', 29) or 29):.4f}|{float(params.get('standard_variable_rate', 9) or 9):.4f}".encode('utf-8'))
    h.update(f"{float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0)):.4f}".encode('utf-8'))
    h.update(str(params.get('exact_enable_tiebreak_milps', 'auto')).encode('utf-8'))
    h.update(str(spacing_fingerprint).encode('utf-8'))
    name = f"exact_{scenario_name}_{h.hexdigest()}.pkl"
    return os.path.join(OPTIMIZATION_RESULTS_DIR, name)


def _prepared_exact_benchmark_key(candidate_pool_cache_path, graph_cache_path, params, spacing_fingerprint='none'):
    return (
        os.path.basename(candidate_pool_cache_path),
        os.path.basename(graph_cache_path),
        float(params.get('base_cost', 29) or 29),
        float(params.get('variable_rate', 9) or 9),
        float(params.get('standard_base_cost', 29) or 29),
        float(params.get('standard_variable_rate', 9) or 9),
        float(params.get('standard_ds_radius', 3.0) or 3.0),
        float(params.get('standard_exception_radius_km', 5.0) or 5.0),
        float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0)),
        str(params.get('exact_enable_tiebreak_milps', 'auto')),
        str(spacing_fingerprint),
    )


def _exact_legacy_scenario_checkpoint_path(graph_cache_path, scenario_name, params, spacing_fingerprint='none'):
    h = hashlib.sha1()
    h.update(os.path.basename(graph_cache_path).encode('utf-8'))
    h.update(str(scenario_name).encode('utf-8'))
    h.update(str(params.get('benchmark_solver_checkpoint_version', 'v2')).encode('utf-8'))
    h.update(f"{float(params.get('standard_base_cost', 29) or 29):.4f}|{float(params.get('standard_variable_rate', 9) or 9):.4f}".encode('utf-8'))
    h.update(f"{float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0)):.4f}".encode('utf-8'))
    h.update(str(params.get('exact_enable_tiebreak_milps', 'auto')).encode('utf-8'))
    h.update(str(spacing_fingerprint).encode('utf-8'))
    name = f"exact_{scenario_name}_{h.hexdigest()}.json"
    return os.path.join(OPTIMIZATION_RESULTS_DIR, name)


def _exact_prepared_model_cache_path(graph_cache_path, params, allow_exceptions, spacing_fingerprint='none'):
    h = hashlib.sha1()
    h.update(os.path.basename(graph_cache_path).encode('utf-8'))
    h.update(str(bool(allow_exceptions)).encode('utf-8'))
    h.update(f"{float(params.get('standard_base_cost', 29) or 29):.4f}|{float(params.get('standard_variable_rate', 9) or 9):.4f}".encode('utf-8'))
    h.update(f"{float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0)):.4f}".encode('utf-8'))
    h.update(str(params.get('exact_enable_tiebreak_milps', 'auto')).encode('utf-8'))
    h.update(str(spacing_fingerprint).encode('utf-8'))
    name = f"exact_prepared_model_{h.hexdigest()}.pkl"
    return os.path.join(GRAPH_CACHE_DIR, name)


def _exact_benchmark_fingerprint(scope_grid, fixed_sites, params):
    h = hashlib.sha1()
    h.update(_effective_fixed_store_source_mode(params).encode('utf-8'))
    h.update(f"{float(params.get('standard_ds_radius', 3.0) or 3.0):.4f}".encode('utf-8'))
    h.update(f"{float(params.get('standard_exception_radius_km', 5.0) or 5.0):.4f}".encode('utf-8'))
    h.update(f"{float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0)):.4f}".encode('utf-8'))
    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    fixed_arr = np.array([[float(site['lat']), float(site['lon'])] for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(fixed_arr, 5).tobytes())
    return h.hexdigest()


def _exact_graph_max_radius_km(params, allow_exceptions=True):
    base_radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    exception_radius = float(params.get('standard_exception_radius_km', 5.0) or 5.0)
    explicit = params.get('exact_graph_max_radius_km')
    graph_max_radius = exception_radius if allow_exceptions else base_radius
    if explicit not in (None, ''):
        graph_max_radius = max(graph_max_radius, float(explicit))
    return float(max(graph_max_radius, base_radius, exception_radius if allow_exceptions else 0.0))


def _exact_graph_cache_path(scope_grid, fixed_sites, candidate_sites, params, allow_exceptions, legacy_mode_sensitive=False):
    graph_max_radius = _exact_graph_max_radius_km(params, allow_exceptions=allow_exceptions)
    h = hashlib.sha1()
    h.update(f"{graph_max_radius:.4f}".encode('utf-8'))
    if fixed_sites or legacy_mode_sensitive:
        h.update(_effective_fixed_store_source_mode(params).encode('utf-8'))
    else:
        h.update(b'shared_empty_fixed')

    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    rounded = np.round(demand_frame.values.astype(np.float64), 5)
    h.update(rounded.tobytes())

    fixed_arr = np.array([[float(site['lat']), float(site['lon'])] for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty((0, 2), dtype=np.float64)
    cand_arr = np.array([[float(site['lat']), float(site['lon'])] for site in candidate_sites], dtype=np.float64) if candidate_sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(fixed_arr, 5).tobytes())
    h.update(np.round(cand_arr, 5).tobytes())

    name = f"exact_std_graph_superset_{h.hexdigest()}.pkl"
    return os.path.join(GRAPH_CACHE_DIR, name)


def _exact_candidate_graph_cache_path(scope_grid, candidate_sites, params, allow_exceptions):
    graph_max_radius = _exact_graph_max_radius_km(params, allow_exceptions=allow_exceptions)
    h = hashlib.sha1()
    h.update(f"{graph_max_radius:.4f}".encode('utf-8'))
    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    cand_arr = np.array([[float(site['lat']), float(site['lon'])] for site in candidate_sites], dtype=np.float64) if candidate_sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(cand_arr, 5).tobytes())
    return os.path.join(GRAPH_CACHE_DIR, f"exact_std_candidate_graph_{h.hexdigest()}.pkl")


def _exact_fixed_overlay_graph_cache_path(scope_grid, fixed_sites, params, allow_exceptions):
    graph_max_radius = _exact_graph_max_radius_km(params, allow_exceptions=allow_exceptions)
    h = hashlib.sha1()
    h.update(f"{graph_max_radius:.4f}".encode('utf-8'))
    h.update(_effective_fixed_store_source_mode(params).encode('utf-8'))
    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    fixed_arr = np.array([[float(site['lat']), float(site['lon'])] for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(fixed_arr, 5).tobytes())
    return os.path.join(GRAPH_CACHE_DIR, f"exact_std_fixed_overlay_{h.hexdigest()}.pkl")


def _exact_named_site_graph_cache_path(scope_grid, sites, graph_max_radius, cache_label):
    h = hashlib.sha1()
    h.update(str(cache_label).encode('utf-8'))
    h.update(f"{float(graph_max_radius):.4f}".encode('utf-8'))
    demand_frame = scope_grid[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    site_arr = np.array([[float(site['lat']), float(site['lon'])] for site in sites], dtype=np.float64) if sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(site_arr, 5).tobytes())
    return os.path.join(GRAPH_CACHE_DIR, f"tier_site_graph_{h.hexdigest()}.pkl")


def _exact_graph_partial_cache_path(cache_path):
    return f"{cache_path}.partial"


def _exact_graph_status_path(cache_path):
    return f"{cache_path}.status.json"


def _compose_exact_superset_graph(fixed_graph, candidate_graph, graph_max_radius):
    return {
        'version': 3,
        'graph_max_radius_km': float(graph_max_radius),
        'distance_rule': 'store_to_customer_osrm_km',
        'fixed_edges': list((fixed_graph or {}).get('fixed_edges', [])),
        'candidate_edges': list((candidate_graph or {}).get('candidate_edges', [])),
    }


def _write_exact_superset_component_cache(cache_path, payload):
    with open(cache_path, 'wb') as f:
        pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)


def _derive_subset_site_edge_graph(full_sites, full_graph, subset_sites, graph_max_radius):
    if not subset_sites:
        return {
            'version': 1,
            'graph_max_radius_km': float(graph_max_radius),
            'distance_rule': 'store_to_customer_osrm_km',
            'fixed_edges': [],
        }
    coord_to_full_idx = {}
    for idx, site in enumerate(full_sites or ()):
        coord_to_full_idx[_rounded_site_key(site.get('cell_lat', site['lat']), site.get('cell_lon', site['lon']))] = int(idx)
    subset_to_full = []
    for site in subset_sites:
        full_idx = coord_to_full_idx.get(_rounded_site_key(site.get('cell_lat', site['lat']), site.get('cell_lon', site['lon'])))
        if full_idx is None:
            return None
        subset_to_full.append(int(full_idx))

    full_to_subset = {int(full_idx): int(subset_idx) for subset_idx, full_idx in enumerate(subset_to_full)}
    subset_edges = []
    for demand_edges in list((full_graph or {}).get('fixed_edges', [])):
        filtered = []
        for full_idx, dist in demand_edges:
            subset_idx = full_to_subset.get(int(full_idx))
            if subset_idx is not None:
                filtered.append((int(subset_idx), float(dist)))
        subset_edges.append(filtered)
    return {
        'version': 1,
        'graph_max_radius_km': float(graph_max_radius),
        'distance_rule': (full_graph or {}).get('distance_rule', 'store_to_customer_osrm_km'),
        'fixed_edges': subset_edges,
    }


def _demand_row_identity_key(row):
    return (
        round(float(row.get('cell_lat', row.get('avg_cust_lat'))), 6),
        round(float(row.get('cell_lon', row.get('avg_cust_lon'))), 6),
        round(float(row.get('avg_cust_lat', row.get('lat', row.get('cell_lat')))), 6),
        round(float(row.get('avg_cust_lon', row.get('lon', row.get('cell_lon')))), 6),
        round(float(row.get('orders_per_day', 0.0) or 0.0), 6),
    )


def _candidate_site_identity_key(site):
    return (
        round(float(site.get('cell_lat', site.get('lat'))), 6),
        round(float(site.get('cell_lon', site.get('lon'))), 6),
        round(float(site.get('lat', site.get('avg_cust_lat', site.get('cell_lat')))), 6),
        round(float(site.get('lon', site.get('avg_cust_lon', site.get('cell_lon')))), 6),
        round(float(site.get('orders_per_day', 0.0) or 0.0), 6),
    )


def _build_full_superset_row_index(full_sites, full_graph):
    row_index_by_key = {}
    candidate_edges = list((full_graph or {}).get('candidate_edges', []))
    for row_idx, edges in enumerate(candidate_edges):
        zero_keys = []
        for site_idx, dist in edges:
            try:
                if abs(float(dist)) > 1e-9:
                    continue
                site_idx = int(site_idx)
                if site_idx < 0 or site_idx >= len(full_sites):
                    continue
                zero_keys.append(_candidate_site_identity_key(full_sites[site_idx]))
            except Exception:
                continue
        for key in set(zero_keys):
            row_index_by_key.setdefault(key, int(row_idx))
    return row_index_by_key


def _derive_demand_and_site_subset_graph(scope_grid, full_sites, full_graph, subset_sites, graph_max_radius):
    if scope_grid is None or len(scope_grid) == 0:
        return {
            'version': 1,
            'graph_max_radius_km': float(graph_max_radius),
            'distance_rule': (full_graph or {}).get('distance_rule', 'store_to_customer_osrm_km'),
            'fixed_edges': [],
        }

    row_index_by_key = _build_full_superset_row_index(full_sites or (), full_graph or {})
    if not row_index_by_key:
        return None

    full_site_idx_by_key = {}
    for idx, site in enumerate(full_sites or ()):
        full_site_idx_by_key.setdefault(_candidate_site_identity_key(site), int(idx))

    subset_to_full = []
    for site in subset_sites or ():
        full_idx = full_site_idx_by_key.get(_candidate_site_identity_key(site))
        if full_idx is None:
            return None
        subset_to_full.append(int(full_idx))
    full_to_subset = {int(full_idx): int(subset_idx) for subset_idx, full_idx in enumerate(subset_to_full)}

    full_candidate_edges = list((full_graph or {}).get('candidate_edges', []))
    subset_edges = []
    for _, row in scope_grid.iterrows():
        demand_idx = row_index_by_key.get(_demand_row_identity_key(row))
        if demand_idx is None or demand_idx < 0 or demand_idx >= len(full_candidate_edges):
            return None
        filtered = []
        for full_idx, dist in full_candidate_edges[demand_idx]:
            subset_idx = full_to_subset.get(int(full_idx))
            if subset_idx is not None:
                filtered.append((int(subset_idx), float(dist)))
        subset_edges.append(filtered)

    return {
        'version': 1,
        'graph_max_radius_km': float(graph_max_radius),
        'distance_rule': (full_graph or {}).get('distance_rule', 'store_to_customer_osrm_km'),
        'fixed_edges': subset_edges,
    }


def _try_derive_candidate_graph_from_completed_superset(scope_grid, candidate_sites, params, graph_max_radius, progress_cb=None):
    if scope_grid is None or len(scope_grid) == 0 or not candidate_sites:
        return None, None, None

    candidate_count_floor = max(len(scope_grid), len(candidate_sites))
    status_paths = []
    for name in os.listdir(GRAPH_CACHE_DIR):
        if name.startswith('exact_std_graph_superset_') and name.endswith('.status.json'):
            status_paths.append(os.path.join(GRAPH_CACHE_DIR, name))
    status_paths.sort()

    completed_graphs = []
    for status_path in status_paths:
        try:
            status_payload = json.load(open(status_path))
        except Exception:
            continue
        if str(status_payload.get('state', '')).lower() != 'complete':
            continue
        if abs(float(status_payload.get('graph_max_radius_km', graph_max_radius) or graph_max_radius) - float(graph_max_radius)) > 1e-6:
            continue
        candidate_total = int(status_payload.get('candidate_sites_total', 0) or 0)
        graph_path = str(status_payload.get('cache_path') or '').strip()
        if candidate_total < candidate_count_floor or not graph_path or not os.path.exists(graph_path):
            continue
        completed_graphs.append((candidate_total, graph_path))
    completed_graphs.sort(key=lambda item: item[0])
    if not completed_graphs:
        return None, None, None

    pool_paths = []
    for name in os.listdir(GRAPH_CACHE_DIR):
        if name.startswith('exact_std_candidates_') and name.endswith('.pkl'):
            pool_paths.append(os.path.join(GRAPH_CACHE_DIR, name))
    pool_paths.sort()

    for pool_path in pool_paths:
        try:
            with open(pool_path, 'rb') as f:
                pool_payload = pickle.load(f)
            full_sites = list((pool_payload or {}).get('sites', []))
        except Exception:
            continue
        if len(full_sites) < candidate_count_floor:
            continue
        matching_graphs = [graph_path for total, graph_path in completed_graphs if total == len(full_sites)]
        if not matching_graphs:
            continue
        for graph_path in matching_graphs:
            try:
                with open(graph_path, 'rb') as f:
                    full_graph = pickle.load(f)
                derived = _derive_demand_and_site_subset_graph(
                    scope_grid,
                    full_sites,
                    full_graph,
                    candidate_sites,
                    graph_max_radius,
                )
            except Exception:
                derived = None
            if derived is None:
                continue
            if progress_cb:
                progress_cb(
                    f"Exact Standard: deriving candidate graph from cached full superset {os.path.basename(graph_path)}"
                )
            return derived, pool_path, graph_path
    return None, None, None


def _load_or_build_exact_site_edge_graph(scope_grid, sites, graph_max_radius, cache_path, status_label, progress_cb=None):
    if os.path.exists(cache_path):
        with open(cache_path, 'rb') as f:
            cached = pickle.load(f)
        if isinstance(cached, dict) and 'fixed_edges' in cached:
            return cached

    partial_cache_path = _exact_graph_partial_cache_path(cache_path)
    status_path = _exact_graph_status_path(cache_path)
    demand_lats = scope_grid['avg_cust_lat'].values.astype(np.float64)
    demand_lons = scope_grid['avg_cust_lon'].values.astype(np.float64)
    ref_lat = float(np.mean(demand_lats)) if len(demand_lats) else 0.0
    demand_xy = _latlon_to_xy_km(demand_lats, demand_lons, ref_lat=ref_lat)
    demand_tree = cKDTree(demand_xy)
    site_edges = [[] for _ in range(len(scope_grid))]
    total_sites = len(sites)
    if total_sites == 0:
        payload = {
            'version': 1,
            'graph_max_radius_km': float(graph_max_radius),
            'distance_rule': 'store_to_customer_osrm_km',
            'fixed_edges': site_edges,
        }
        _write_exact_superset_component_cache(cache_path, payload)
        return payload

    processed_sites = 0
    if os.path.exists(partial_cache_path):
        try:
            with open(partial_cache_path, 'rb') as f:
                partial = pickle.load(f)
            if partial.get('version') == 1:
                partial_graph = partial.get('graph') or {}
                partial_edges = partial_graph.get('fixed_edges')
                if isinstance(partial_edges, list) and len(partial_edges) == len(site_edges):
                    site_edges = partial_edges
                    processed_sites = min(int(partial.get('processed_sites', 0) or 0), total_sites)
                    if progress_cb:
                        progress_cb(f"Exact Standard: resuming partial graph {os.path.basename(partial_cache_path)}")
        except Exception:
            processed_sites = 0
            site_edges = [[] for _ in range(len(scope_grid))]
            if progress_cb:
                progress_cb("Exact Standard: partial graph checkpoint unreadable, rebuilding from scratch")

    site_lats = np.array([float(site['lat']) for site in sites], dtype=np.float64)
    site_lons = np.array([float(site['lon']) for site in sites], dtype=np.float64)
    site_xy = _latlon_to_xy_km(site_lats, site_lons, ref_lat=ref_lat)
    nearby_lists = demand_tree.query_ball_point(site_xy, graph_max_radius + 0.05)
    site_block_size = max(1, int(OSRM_BATCH_SIZE or 1))
    ordered_site_indices = np.lexsort((site_xy[:, 1], site_xy[:, 0]))
    progress_every = 100 if total_sites > 1000 else 10
    checkpoint_sites = max(site_block_size, 200)

    def write_status(state_label):
        payload = {
            'cache_path': cache_path,
            'partial_cache_path': partial_cache_path,
            'state': state_label,
            'updated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'processed_sites': int(processed_sites),
            'total_sites': int(total_sites),
            'graph_max_radius_km': float(graph_max_radius),
        }
        with open(status_path, 'w') as f:
            json.dump(payload, f, indent=2)

    def save_partial():
        payload = {
            'version': 1,
            'graph': {
                'version': 1,
                'graph_max_radius_km': float(graph_max_radius),
                'distance_rule': 'store_to_customer_osrm_km',
                'fixed_edges': site_edges,
            },
            'processed_sites': int(processed_sites),
        }
        with open(partial_cache_path, 'wb') as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)
        write_status('partial')

    write_status('starting')

    for block_start in range(processed_sites, total_sites, site_block_size):
        block_indices = ordered_site_indices[block_start:block_start + site_block_size]
        demand_union = sorted({int(idx) for site_idx in block_indices for idx in nearby_lists[int(site_idx)]})
        if not demand_union:
            processed_sites = min(block_start + len(block_indices), total_sites)
            continue
        src = [(float(site_lats[int(site_idx)]), float(site_lons[int(site_idx)])) for site_idx in block_indices]
        for dst_indices, dm in _iter_osrm_table_batch_results(
            src,
            demand_lats,
            demand_lons,
            demand_union,
            batch_size=OSRM_BATCH_SIZE,
            parallelism=EXACT_GRAPH_BATCH_PARALLELISM,
        ):
            for local_site_pos, site_idx in enumerate(block_indices):
                row = dm[local_site_pos]
                for local_dst_pos, demand_idx in enumerate(dst_indices):
                    dist = float(row[local_dst_pos])
                    if not math.isfinite(dist):
                        continue
                    if dist <= graph_max_radius + 1e-5:
                        site_edges[int(demand_idx)].append((int(site_idx), dist))
        processed = min(block_start + len(block_indices), total_sites)
        processed_sites = processed
        if processed % checkpoint_sites == 0:
            save_partial()
        if progress_cb and processed % progress_every == 0:
            progress_cb(f"Exact Standard: {status_label} coverage graph {processed}/{total_sites}")

    payload = {
        'version': 1,
        'graph_max_radius_km': float(graph_max_radius),
        'distance_rule': 'store_to_customer_osrm_km',
        'fixed_edges': site_edges,
    }
    _write_exact_superset_component_cache(cache_path, payload)
    if os.path.exists(partial_cache_path):
        os.remove(partial_cache_path)
    write_status('complete')
    return payload


def _min_dist_from_site_edge_graph(site_graph, demand_count, radius_limit_km=None):
    edge_lists = list((site_graph or {}).get('fixed_edges', []))
    result = np.full(int(demand_count), np.inf, dtype=np.float64)
    if not edge_lists:
        return result
    if radius_limit_km in (None, ''):
        radius_limit = np.inf
    else:
        radius_limit = float(radius_limit_km) + 1e-5
    for demand_idx in range(min(len(edge_lists), int(demand_count))):
        best = np.inf
        for _site_idx, dist in edge_lists[demand_idx]:
            dist = float(dist)
            if dist <= radius_limit and dist < best:
                best = dist
        result[demand_idx] = best
    return result


def _rounded_site_key(lat, lon):
    return (round(float(lat), 6), round(float(lon), 6))


def _copy_first_existing_cache(source_paths, dest_path):
    for source_path in source_paths:
        if not source_path or source_path == dest_path or not os.path.exists(source_path):
            continue
        try:
            shutil.copy2(source_path, dest_path)
            return source_path
        except Exception:
            continue
    return None


def _candidate_pool_cache_alias_paths(scope_grid, fixed_sites, params):
    current_path = _exact_candidate_pool_cache_path(scope_grid, fixed_sites, params)
    paths = [current_path]
    if fixed_sites:
        return paths
    for fixed_mode in ('benchmark_103', 'uploaded_current', 'clean_slate'):
        alt_params = dict(params or {})
        alt_params['fixed_store_mode'] = fixed_mode
        paths.append(
            _exact_candidate_pool_cache_path(
                scope_grid,
                fixed_sites,
                alt_params,
                legacy_mode_sensitive=True,
            )
        )
    deduped = []
    seen = set()
    for path in paths:
        if path in seen:
            continue
        seen.add(path)
        deduped.append(path)
    return deduped


def _candidate_graph_superset_alias_paths(scope_grid, candidate_sites, params):
    paths = []
    base_params = dict(params or {})
    paths.append(
        _exact_graph_cache_path(
            scope_grid,
            [],
            candidate_sites,
            base_params,
            allow_exceptions=True,
        )
    )
    for fixed_mode in ('benchmark_103', 'uploaded_current', 'clean_slate'):
        alt_params = dict(base_params)
        alt_params['fixed_store_mode'] = fixed_mode
        paths.append(
            _exact_graph_cache_path(
                scope_grid,
                [],
                candidate_sites,
                alt_params,
                allow_exceptions=True,
                legacy_mode_sensitive=True,
            )
        )
        try:
            alt_fixed_sites = _build_fixed_standard_sites(alt_params)
        except Exception:
            continue
        paths.append(
            _exact_graph_cache_path(
                scope_grid,
                alt_fixed_sites,
                candidate_sites,
                alt_params,
                allow_exceptions=True,
            )
        )
    deduped = []
    seen = set()
    for path in paths:
        if path in seen:
            continue
        seen.add(path)
        deduped.append(path)
    return deduped


def _site_edge_context_from_graph(sites, site_graph, demand_count, raw_grid_idx=None):
    edge_lists = list((site_graph or {}).get('fixed_edges', []))
    context = {
        'graph_max_radius_km': float((site_graph or {}).get('graph_max_radius_km', 0.0) or 0.0),
        'demand_count': int(demand_count),
        'candidate_sites': list(sites),
        'candidate_graph': site_graph,
        'graph_edge_lists': edge_lists,
        'site_to_demand_cache': {},
        'coord_to_site_idx': {
            _rounded_site_key(site.get('cell_lat', site['lat']), site.get('cell_lon', site['lon'])): int(idx)
            for idx, site in enumerate(sites)
        },
    }
    if raw_grid_idx is not None:
        context['grid_idx_to_context_idx'] = {
            int(raw_idx): int(pos)
            for pos, raw_idx in enumerate(np.asarray(raw_grid_idx, dtype=np.int64))
        }
    return context


def _site_demand_pairs_from_context(context, site_idx):
    if context is None:
        return None
    cache = context.setdefault('site_to_demand_cache', {})
    site_idx = int(site_idx)
    cached = cache.get(site_idx)
    if cached is not None:
        return cached
    edge_lists = context.get('graph_edge_lists')
    if edge_lists is None:
        edge_lists = list(((context.get('candidate_graph') or {}).get('fixed_edges', [])))
        context['graph_edge_lists'] = edge_lists
    pairs = []
    for demand_idx, demand_edges in enumerate(edge_lists or ()):
        for demand_site_idx, dist in demand_edges:
            if int(demand_site_idx) == site_idx:
                pairs.append((int(demand_idx), float(dist)))
    cache[site_idx] = pairs
    return pairs


def _get_all_demand_candidate_context(grid_data, params, progress_cb=None):
    candidate_cap = params.get('exact_candidate_cap')
    graph_max_radius = float(params.get(
        'exact_graph_max_radius_km',
        max(
            float(params.get('mini_ds_radius', 1.0) or 1.0),
            float(params.get('standard_exception_radius_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0)),
            float(params.get('super_ds_radius', 4.0) or 4.0),
        ),
    ) or 0.0)
    demand_frame = grid_data[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h = hashlib.sha1()
    h.update(f"{graph_max_radius:.4f}".encode('utf-8'))
    h.update(str(candidate_cap if candidate_cap not in ('', None) else 'all').encode('utf-8'))
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    cache_key = ('all_demand_candidate_context', h.hexdigest())
    cached = state.site_edge_context_cache.get(cache_key)
    if cached is not None:
        return cached

    ctx_params = dict(params or {})
    if candidate_cap in ('', None):
        ctx_params['exact_candidate_cap'] = None
    else:
        try:
            ctx_params['exact_candidate_cap'] = max(50, int(float(candidate_cap)))
        except (TypeError, ValueError):
            ctx_params['exact_candidate_cap'] = None
    ctx_params['exact_graph_max_radius_km'] = graph_max_radius
    candidate_pool_cache_paths = _candidate_pool_cache_alias_paths(grid_data, [], ctx_params)
    candidate_pool_cache_path = candidate_pool_cache_paths[0]
    if not os.path.exists(candidate_pool_cache_path):
        reused_pool = _copy_first_existing_cache(candidate_pool_cache_paths[1:], candidate_pool_cache_path)
        if reused_pool and progress_cb:
            progress_cb(
                f"Exact Standard: reusing cached candidate pool {os.path.basename(reused_pool)}"
            )
    candidate_pool = _build_exact_standard_candidate_pool(grid_data, [], ctx_params, progress_cb=progress_cb)
    candidate_sites = candidate_pool.get('sites', [])
    candidate_cache_path = _exact_candidate_graph_cache_path(grid_data, candidate_sites, ctx_params, allow_exceptions=True)
    if not os.path.exists(candidate_cache_path) and ctx_params.get('exact_candidate_cap') not in (None, '', 0, '0', 'all', 'ALL'):
        full_ctx_params = dict(ctx_params)
        full_ctx_params['exact_candidate_cap'] = None
        full_pool = _build_exact_standard_candidate_pool(grid_data, [], full_ctx_params, progress_cb=None)
        full_sites = full_pool.get('sites', [])
        full_cache_path = _exact_candidate_graph_cache_path(grid_data, full_sites, full_ctx_params, allow_exceptions=True)
        if os.path.exists(full_cache_path):
            if progress_cb:
                progress_cb(
                    f"Exact Standard: deriving capped candidate graph from {os.path.basename(full_cache_path)}"
                )
            with open(full_cache_path, 'rb') as f:
                full_graph = pickle.load(f)
            subset_graph = _derive_subset_site_edge_graph(full_sites, full_graph, candidate_sites, graph_max_radius)
            if subset_graph is not None:
                _write_exact_superset_component_cache(candidate_cache_path, subset_graph)
    if not os.path.exists(candidate_cache_path):
        for superset_path in _candidate_graph_superset_alias_paths(grid_data, candidate_sites, ctx_params):
            if not superset_path or not os.path.exists(superset_path):
                continue
            try:
                with open(superset_path, 'rb') as f:
                    superset_graph = pickle.load(f)
                candidate_edges = list((superset_graph or {}).get('candidate_edges', []))
                if not candidate_edges:
                    continue
                _write_exact_superset_component_cache(candidate_cache_path, {
                    'version': 1,
                    'graph_max_radius_km': float((superset_graph or {}).get('graph_max_radius_km', graph_max_radius) or graph_max_radius),
                    'distance_rule': str((superset_graph or {}).get('distance_rule', 'store_to_customer_osrm_km')),
                    'fixed_edges': candidate_edges,
                })
                if progress_cb:
                    progress_cb(
                        f"Exact Standard: reusing cached candidate graph from {os.path.basename(superset_path)}"
                    )
                break
            except Exception:
                continue
    if not os.path.exists(candidate_cache_path):
        derived_graph, derived_pool_path, derived_superset_path = _try_derive_candidate_graph_from_completed_superset(
            grid_data,
            candidate_sites,
            ctx_params,
            graph_max_radius,
            progress_cb=progress_cb,
        )
        if derived_graph is not None:
            _write_exact_superset_component_cache(candidate_cache_path, derived_graph)
            if progress_cb and derived_superset_path:
                progress_cb(
                    f"Exact Standard: cached candidate graph derived from {os.path.basename(derived_superset_path)}"
                )
    if progress_cb and os.path.exists(candidate_cache_path):
        progress_cb(f"Exact Standard: loading cached candidate graph {os.path.basename(candidate_cache_path)}")
    candidate_graph = _load_or_build_exact_site_edge_graph(
        grid_data,
        candidate_sites,
        graph_max_radius,
        candidate_cache_path,
        'all-demand candidate sites',
        progress_cb=progress_cb,
    )
    if progress_cb:
        progress_cb("Exact Standard: indexing cached candidate graph for fast slider reuse...")
    context = _site_edge_context_from_graph(
        candidate_sites,
        candidate_graph,
        len(grid_data),
        raw_grid_idx=_ensure_grid_idx(grid_data)['_grid_idx'].values.astype(np.int64),
    )
    state.site_edge_context_cache[cache_key] = context
    return context


def _get_fixed_site_context(grid_data, fixed_sites, params, progress_cb=None):
    graph_max_radius = float(params.get('exact_graph_max_radius_km', 10.0) or 10.0)
    fixed_mode = _effective_fixed_store_source_mode(params)
    h = hashlib.sha1()
    h.update(f"{graph_max_radius:.4f}".encode('utf-8'))
    h.update(fixed_mode.encode('utf-8'))
    demand_frame = grid_data[['avg_cust_lat', 'avg_cust_lon', 'orders_per_day']].copy()
    h.update(np.round(demand_frame.values.astype(np.float64), 5).tobytes())
    fixed_arr = np.array([[float(site['lat']), float(site['lon'])] for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(fixed_arr, 5).tobytes())
    cache_key = ('fixed_site_edge_context', h.hexdigest())
    cached = state.site_edge_context_cache.get(cache_key)
    if cached is not None:
        return cached

    overlay_path = _exact_fixed_overlay_graph_cache_path(
        grid_data,
        fixed_sites,
        params,
        allow_exceptions=True,
    )
    site_graph = _load_or_build_exact_site_edge_graph(
        grid_data,
        fixed_sites,
        graph_max_radius,
        overlay_path,
        f'{fixed_mode} fixed overlay',
        progress_cb=progress_cb,
    )
    context = _site_edge_context_from_graph(
        fixed_sites,
        site_graph,
        len(grid_data),
        raw_grid_idx=_ensure_grid_idx(grid_data)['_grid_idx'].values.astype(np.int64),
    )
    state.site_edge_context_cache[cache_key] = context
    return context


def _distance_mask_from_cached_seed(context, seed_lat, seed_lon, demand_count, radius_km):
    coord_to_site_idx = context.get('coord_to_site_idx', {})
    site_idx = coord_to_site_idx.get(_rounded_site_key(seed_lat, seed_lon))
    if site_idx is None:
        return None
    site_pairs = _site_demand_pairs_from_context(context, site_idx)
    if site_pairs is None:
        return None
    effective_count = int(context.get('demand_count', demand_count if demand_count is not None else 0) or 0)
    mask = np.zeros(effective_count, dtype=bool)
    radius_limit = float(radius_km) + 1e-5
    for demand_idx, dist in site_pairs:
        if int(demand_idx) < effective_count and float(dist) <= radius_limit:
            mask[int(demand_idx)] = True
    return mask


def _distance_array_from_cached_seed(context, seed_lat, seed_lon, demand_count):
    coord_to_site_idx = context.get('coord_to_site_idx', {})
    site_idx = coord_to_site_idx.get(_rounded_site_key(seed_lat, seed_lon))
    if site_idx is None:
        return None
    site_pairs = _site_demand_pairs_from_context(context, site_idx)
    if site_pairs is None:
        return None
    effective_count = int(context.get('demand_count', demand_count if demand_count is not None else 0) or 0)
    dists = np.full(effective_count, np.inf, dtype=np.float64)
    for demand_idx, dist in site_pairs:
        if int(demand_idx) < effective_count:
            dists[int(demand_idx)] = float(dist)
    return dists


def _distance_array_from_cached_contexts(contexts, seed_lat, seed_lon, demand_count):
    for context in contexts or ():
        if context is None:
            continue
        dists = _distance_array_from_cached_seed(context, seed_lat, seed_lon, demand_count)
        if dists is not None:
            return dists
    return None


def _min_distances_from_cached_hubs(context, hubs, demand_count, radius_km=None):
    if not hubs:
        return np.full(int(demand_count), np.inf, dtype=np.float64)
    coord_to_site_idx = context.get('coord_to_site_idx', {})
    radius_limit = np.inf if radius_km in (None, '') else float(radius_km) + 1e-5
    dists = np.full(int(demand_count), np.inf, dtype=np.float64)
    for hub in hubs:
        site_idx = coord_to_site_idx.get(_rounded_site_key(hub['lat'], hub['lon']))
        if site_idx is None:
            return None
        site_pairs = _site_demand_pairs_from_context(context, site_idx)
        if site_pairs is None:
            return None
        for demand_idx, dist in site_pairs:
            dist = float(dist)
            if dist <= radius_limit and dist < dists[int(demand_idx)]:
                dists[int(demand_idx)] = dist
    return dists


def _min_distances_from_cached_hub_contexts(contexts, hubs, demand_count, radius_km=None):
    if not hubs:
        return np.full(int(demand_count), np.inf, dtype=np.float64), []
    context_list = [ctx for ctx in (contexts or []) if ctx is not None]
    if not context_list:
        return None, list(hubs)
    radius_limit = np.inf if radius_km in (None, '') else float(radius_km) + 1e-5
    dists = np.full(int(demand_count), np.inf, dtype=np.float64)
    missing = []
    for hub in hubs:
        found = False
        for context in context_list:
            coord_to_site_idx = context.get('coord_to_site_idx', {})
            site_idx = coord_to_site_idx.get(_rounded_site_key(hub['lat'], hub['lon']))
            if site_idx is None:
                continue
            site_pairs = _site_demand_pairs_from_context(context, site_idx)
            if site_pairs is None:
                continue
            for demand_idx, dist in site_pairs:
                dist = float(dist)
                if dist <= radius_limit and dist < dists[int(demand_idx)]:
                    dists[int(demand_idx)] = dist
            found = True
            break
        if not found:
            missing.append(hub)
    return dists, missing


def _cached_min_distances_for_hubs(grid_data, hubs, params, radius_km, cache_label, progress_cb=None):
    if not hubs:
        return np.full(len(grid_data), np.inf)
    if not bool(params.get('reuse_tier_edge_cache', True)):
        return None
    graph_max_radius = float(params.get('exact_graph_max_radius_km', radius_km) or radius_km)
    if graph_max_radius < float(radius_km) - 1e-5:
        return None
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    fixed_context = (params or {}).get('_cached_fixed_site_context')
    if cached_context is None:
        try:
            cached_context = _get_all_demand_candidate_context(grid_data, params, progress_cb=None)
        except Exception:
            cached_context = None
    cached_dists, missing_hubs = _min_distances_from_cached_hub_contexts(
        [cached_context, fixed_context],
        hubs,
        len(grid_data),
        radius_km=radius_km,
    )
    if cached_dists is not None and not missing_hubs:
        return cached_dists
    if not missing_hubs:
        return cached_dists
    cache_path = _exact_named_site_graph_cache_path(grid_data, missing_hubs, graph_max_radius, cache_label)
    site_graph = _load_or_build_exact_site_edge_graph(
        grid_data,
        missing_hubs,
        graph_max_radius,
        cache_path,
        f'{cache_label} tier sites',
        progress_cb=(lambda msg: progress_cb(msg) if progress_cb else None),
    )
    missing_dists = _min_dist_from_site_edge_graph(site_graph, len(grid_data), radius_limit_km=radius_km)
    if cached_dists is None:
        return missing_dists
    return np.minimum(cached_dists, missing_dists)


def _meeting_prewarm_default_params():
    return normalize_placement_params({
        'meeting_fast_mode': True,
        'fixed_store_mode': 'benchmark_103',
        'mini_ds_radius': 1.0,
        'standard_ds_radius': 3.0,
        'standard_exception_radius_km': 5.0,
        'super_ds_radius': 7.0,
        'exact_graph_max_radius_km': 10.0,
        'exact_candidate_cap': 5000,
        'mini_ds_min_orders_per_day': 400,
        'mini_density_min_orders_per_day': 400,
        'reuse_tier_edge_cache': True,
    })


def _auto_prewarm_meeting_enabled():
    return str(os.environ.get('AUTO_PREWARM_MEETING_ASSETS', '0')).strip().lower() not in {'0', 'false', 'no'}


def _start_meeting_prewarm_async(force=False):
    if state.grid_data is None or state.store_regions is None:
        return False
    if state.meeting_prewarm_running:
        return False
    if state.meeting_prewarm_ready and not force:
        return False

    def run():
        state.meeting_prewarm_running = True
        state.meeting_prewarm_core_ready = False
        state.meeting_prewarm_ready = False
        state.meeting_prewarm_error = ''
        state.meeting_prewarm_started_at = time.time()
        state.meeting_prewarm_progress = 'Meeting cache prewarm: resolving in-scope demand...'
        try:
            params = _meeting_prewarm_default_params()
            in_scope_grid, _out_scope_grid, _business_regions, _excluded_islands, _scope_summary = _resolve_scope_grid_and_regions(params)
            if in_scope_grid is None or len(in_scope_grid) == 0:
                raise ValueError('No in-scope demand available for meeting cache prewarm')

            state.meeting_prewarm_progress = 'Meeting cache prewarm: priming fixed-store worlds...'
            for fixed_mode in ('clean_slate', 'benchmark_103', 'uploaded_current'):
                mode_params = dict(params)
                mode_params['fixed_store_mode'] = fixed_mode
                _build_fixed_standard_sites(mode_params)

            cached_context = _get_all_demand_candidate_context(
                in_scope_grid,
                params,
                progress_cb=lambda msg: setattr(state, 'meeting_prewarm_progress', f'Meeting cache prewarm: {msg}'),
            )
            candidate_count = len((cached_context or {}).get('candidate_sites') or [])
            state.meeting_prewarm_progress = (
                f'Meeting cache prewarm: demand-candidate cache ready ({candidate_count} candidate sites).'
            )

            for fixed_mode in ('clean_slate', 'benchmark_103', 'uploaded_current'):
                mode_params = dict(params)
                mode_params['fixed_store_mode'] = fixed_mode
                fixed_sites = _build_fixed_standard_sites(mode_params)
                overlay_path = _exact_fixed_overlay_graph_cache_path(
                    in_scope_grid,
                    fixed_sites,
                    mode_params,
                    allow_exceptions=True,
                )
                state.meeting_prewarm_progress = (
                    f'Meeting cache prewarm: {fixed_mode} fixed overlay ({len(fixed_sites)} stores)...'
                )
                _load_or_build_exact_site_edge_graph(
                    in_scope_grid,
                    fixed_sites,
                    float(mode_params.get('exact_graph_max_radius_km', 10.0) or 10.0),
                    overlay_path,
                    f'{fixed_mode} fixed overlay',
                    progress_cb=lambda msg, fixed_mode=fixed_mode: setattr(
                        state,
                        'meeting_prewarm_progress',
                        f'Meeting cache prewarm: {fixed_mode}: {msg}',
                    ),
                )
                if fixed_mode == 'benchmark_103':
                    state.meeting_prewarm_core_ready = True
                    state.meeting_prewarm_progress = (
                        'Meeting cache core ready (benchmark_103 + clean_slate). '
                        'Warming uploaded_current overlay...'
                    )

            state.meeting_prewarm_ready = True
            state.meeting_prewarm_completed_at = time.time()
            state.meeting_prewarm_progress = 'Meeting cache prewarm complete.'
        except Exception as exc:
            logger.error("Meeting prewarm failed: %s", traceback.format_exc())
            state.meeting_prewarm_error = str(exc)
            state.meeting_prewarm_progress = f'Meeting cache prewarm error: {exc}'
        finally:
            state.meeting_prewarm_running = False

    threading.Thread(target=run, daemon=True).start()
    return True


def _wait_for_meeting_prewarm_core(progress_cb=None, timeout_s=120.0):
    if state.grid_data is None or state.store_regions is None:
        return False
    try:
        timeout_s = max(0.0, float(timeout_s or 0.0))
    except (TypeError, ValueError):
        timeout_s = 0.0
    if state.meeting_prewarm_core_ready or state.meeting_prewarm_ready:
        return True
    _start_meeting_prewarm_async(force=False)
    if timeout_s <= 0:
        return bool(state.meeting_prewarm_core_ready or state.meeting_prewarm_ready)
    started = time.time()
    last_progress = None
    while time.time() - started < timeout_s:
        if state.meeting_prewarm_core_ready or state.meeting_prewarm_ready:
            return True
        if state.meeting_prewarm_error and not state.meeting_prewarm_running:
            return False
        current_progress = state.meeting_prewarm_progress or 'warming shared meeting cache...'
        if progress_cb and current_progress != last_progress:
            progress_cb(f"Waiting for meeting cache core: {current_progress}")
            last_progress = current_progress
        time.sleep(0.5)
    return bool(state.meeting_prewarm_core_ready or state.meeting_prewarm_ready)


def _exact_spacing_conflict_cache_path(fixed_sites, candidate_sites, params):
    spacing_km = float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0))
    h = hashlib.sha1()
    h.update(_effective_fixed_store_source_mode(params).encode('utf-8'))
    h.update(f"{spacing_km:.4f}".encode('utf-8'))
    fixed_arr = np.array([[float(site['lat']), float(site['lon'])] for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty((0, 2), dtype=np.float64)
    cand_arr = np.array([[float(site['lat']), float(site['lon'])] for site in candidate_sites], dtype=np.float64) if candidate_sites else np.empty((0, 2), dtype=np.float64)
    h.update(np.round(fixed_arr, 5).tobytes())
    h.update(np.round(cand_arr, 5).tobytes())
    return os.path.join(GRAPH_CACHE_DIR, f"exact_std_spacing_conflicts_{h.hexdigest()}.pkl")


def _exact_spacing_conflict_partial_cache_path(cache_path):
    return f"{cache_path}.partial"


def _exact_spacing_conflict_status_path(cache_path):
    return f"{cache_path}.status.json"


def _build_exact_standard_spacing_conflicts(fixed_sites, candidate_sites, params, progress_cb=None):
    spacing_km = float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0))
    if spacing_km <= 0:
        return {
            'spacing_km': 0.0,
            'blocked_candidate_mask': np.zeros(len(candidate_sites), dtype=bool),
            'blocked_candidate_count': 0,
            'candidate_conflict_pairs': np.empty((0, 2), dtype=np.int32),
            'candidate_conflict_count': 0,
        }

    cache_enabled = bool(params.get('exact_spacing_conflict_cache_enabled', True))
    cache_path = _exact_spacing_conflict_cache_path(fixed_sites, candidate_sites, params)
    partial_cache_path = _exact_spacing_conflict_partial_cache_path(cache_path)
    status_path = _exact_spacing_conflict_status_path(cache_path)
    if cache_enabled and os.path.exists(cache_path):
        if progress_cb:
            progress_cb(f"Exact Standard: loading cached spacing conflicts {os.path.basename(cache_path)}")
        with open(cache_path, 'rb') as f:
            return pickle.load(f)

    site_block_size = max(1, int(params.get('exact_spacing_site_block_size', OSRM_BATCH_SIZE) or OSRM_BATCH_SIZE))
    max_table_coords = max(2, int(params.get('exact_spacing_table_coord_limit', 100) or 100))
    candidate_count = len(candidate_sites)
    fixed_count = len(fixed_sites)
    candidate_lats = np.array([float(site['lat']) for site in candidate_sites], dtype=np.float64) if candidate_sites else np.empty(0, dtype=np.float64)
    candidate_lons = np.array([float(site['lon']) for site in candidate_sites], dtype=np.float64) if candidate_sites else np.empty(0, dtype=np.float64)
    fixed_lats = np.array([float(site['lat']) for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty(0, dtype=np.float64)
    fixed_lons = np.array([float(site['lon']) for site in fixed_sites], dtype=np.float64) if fixed_sites else np.empty(0, dtype=np.float64)
    ref_lat = float(np.mean(np.concatenate([fixed_lats, candidate_lats]))) if (fixed_count + candidate_count) else 0.0
    candidate_xy = _latlon_to_xy_km(candidate_lats, candidate_lons, ref_lat=ref_lat) if candidate_count else np.empty((0, 2), dtype=np.float64)
    fixed_xy = _latlon_to_xy_km(fixed_lats, fixed_lons, ref_lat=ref_lat) if fixed_count else np.empty((0, 2), dtype=np.float64)
    radius_query = spacing_km + 0.05
    blocked_candidate_mask = np.zeros(candidate_count, dtype=bool)
    candidate_conflict_pairs = []
    checkpoint_every = max(1, int(params.get('exact_spacing_checkpoint_every_blocks', 10) or 10))
    progress_state = {
        'fixed_candidates_processed': 0,
        'candidate_pairs_processed': 0,
    }

    if cache_enabled and os.path.exists(partial_cache_path):
        try:
            with open(partial_cache_path, 'rb') as f:
                partial = pickle.load(f)
            if partial.get('version') == 2:
                blocked_candidate_mask = np.asarray(partial.get('blocked_candidate_mask', blocked_candidate_mask), dtype=bool)
                candidate_conflict_pairs = [tuple(map(int, pair)) for pair in partial.get('candidate_conflict_pairs', [])]
                saved_progress = partial.get('progress_state') or {}
                progress_state.update({k: int(v) for k, v in saved_progress.items() if k in progress_state})
                if progress_cb:
                    progress_cb(f"Exact Standard: resuming partial spacing conflicts {os.path.basename(partial_cache_path)}")
        except Exception:
            if progress_cb:
                progress_cb("Exact Standard: spacing-conflict checkpoint unreadable, rebuilding from scratch")

    def write_status(state_label):
        if not cache_enabled:
            return
        payload = {
            'cache_path': cache_path,
            'partial_cache_path': partial_cache_path,
            'state': state_label,
            'updated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'spacing_km': float(spacing_km),
            'distance_rule': 'symmetric_any_direction_min_osrm_km',
            'fixed_candidates_processed': int(progress_state['fixed_candidates_processed']),
            'candidate_pairs_processed': int(progress_state['candidate_pairs_processed']),
            'candidate_site_total': int(candidate_count),
            'blocked_candidate_count': int(np.sum(blocked_candidate_mask)),
            'candidate_conflict_count': int(len(candidate_conflict_pairs)),
        }
        with open(status_path, 'w') as f:
            json.dump(payload, f, indent=2)

    def save_partial():
        if not cache_enabled:
            return
        payload = {
            'version': 2,
            'blocked_candidate_mask': blocked_candidate_mask.astype(bool),
            'candidate_conflict_pairs': list(candidate_conflict_pairs),
            'progress_state': dict(progress_state),
        }
        with open(partial_cache_path, 'wb') as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)
        write_status('partial')

    if fixed_count and candidate_count:
        fixed_tree = cKDTree(fixed_xy)
        near_fixed = fixed_tree.query_ball_point(candidate_xy, radius_query)
        ordered_candidate_idx = np.lexsort((candidate_xy[:, 1], candidate_xy[:, 0]))
        progress_every = max(site_block_size, 500)
        start_fixed = min(progress_state['fixed_candidates_processed'], candidate_count)
        for start in range(start_fixed, candidate_count, site_block_size):
            block_idx = ordered_candidate_idx[start:start + site_block_size]
            fixed_union = sorted({int(fi) for ci in block_idx for fi in near_fixed[int(ci)]})
            if not fixed_union:
                progress_state['fixed_candidates_processed'] = min(start + len(block_idx), candidate_count)
                continue
            src = [(float(candidate_lats[int(ci)]), float(candidate_lons[int(ci)])) for ci in block_idx]
            max_dst = max(1, max_table_coords - len(src))
            dm_forward_parts = []
            dm_reverse_parts = []
            for dst_start in range(0, len(fixed_union), max_dst):
                fixed_slice = fixed_union[dst_start:dst_start + max_dst]
                dst = [(float(fixed_lats[fi]), float(fixed_lons[fi])) for fi in fixed_slice]
                dm_forward_parts.append(_osrm_table_batch(src, dst))
                dm_reverse_parts.append(_osrm_table_batch(dst, src).T)
            dm_forward = np.concatenate(dm_forward_parts, axis=1) if dm_forward_parts else np.empty((len(src), 0), dtype=np.float64)
            dm_reverse = np.concatenate(dm_reverse_parts, axis=1) if dm_reverse_parts else np.empty((len(src), 0), dtype=np.float64)
            for local_i, cand_idx in enumerate(block_idx):
                row = np.minimum(dm_forward[local_i], dm_reverse[local_i])
                if np.any(np.isfinite(row) & (row <= spacing_km + 1e-6)):
                    blocked_candidate_mask[int(cand_idx)] = True
            progress_state['fixed_candidates_processed'] = min(start + len(block_idx), candidate_count)
            if progress_state['fixed_candidates_processed'] % max(site_block_size, checkpoint_every * site_block_size) == 0:
                save_partial()
            if progress_cb and (start + len(block_idx)) % progress_every == 0:
                progress_cb(f"Exact Standard: spacing conflicts vs fixed stores {min(start + len(block_idx), candidate_count)}/{candidate_count}")

    if candidate_count:
        active_candidate_idx = np.flatnonzero(~blocked_candidate_mask).astype(np.int32)
        active_candidate_count = int(len(active_candidate_idx))
        if active_candidate_count == 0:
            progress_state['candidate_pairs_processed'] = 0
        else:
            active_xy = candidate_xy[active_candidate_idx]
            cand_tree = cKDTree(active_xy)
            near_cand = cand_tree.query_ball_point(active_xy, radius_query)
            ordered_active_pos = np.lexsort((active_xy[:, 1], active_xy[:, 0]))
            progress_every = max(site_block_size, 500)
            prior_processed = min(progress_state['candidate_pairs_processed'], active_candidate_count)
            start_pairs = prior_processed
            for start in range(start_pairs, active_candidate_count, site_block_size):
                block_pos = ordered_active_pos[start:start + site_block_size]
                block_idx = active_candidate_idx[block_pos]
                pair_targets = {}
                target_union = set()
                for local_pos, cand_idx in zip(block_pos, block_idx):
                    neigh = []
                    for other_local_pos in near_cand[int(local_pos)]:
                        other_idx = int(active_candidate_idx[int(other_local_pos)])
                        if other_idx > int(cand_idx):
                            neigh.append(other_idx)
                    if not neigh:
                        continue
                    pair_targets[int(cand_idx)] = neigh
                    target_union.update(neigh)
                if not target_union:
                    progress_state['candidate_pairs_processed'] = min(start + len(block_idx), active_candidate_count)
                    continue
                target_list = sorted(target_union)
                src = [(float(candidate_lats[int(ci)]), float(candidate_lons[int(ci)])) for ci in block_idx]
                max_dst = max(1, max_table_coords - len(src))
                dm_forward_parts = []
                dm_reverse_parts = []
                target_offsets = []
                for dst_start in range(0, len(target_list), max_dst):
                    target_slice = target_list[dst_start:dst_start + max_dst]
                    dst = [(float(candidate_lats[ci]), float(candidate_lons[ci])) for ci in target_slice]
                    dm_forward_parts.append(_osrm_table_batch(src, dst))
                    dm_reverse_parts.append(_osrm_table_batch(dst, src).T)
                    target_offsets.extend(target_slice)
                dm_forward = np.concatenate(dm_forward_parts, axis=1) if dm_forward_parts else np.empty((len(src), 0), dtype=np.float64)
                dm_reverse = np.concatenate(dm_reverse_parts, axis=1) if dm_reverse_parts else np.empty((len(src), 0), dtype=np.float64)
                target_pos = {cand_idx: pos for pos, cand_idx in enumerate(target_offsets)}
                for local_i, cand_idx in enumerate(block_idx):
                    for other_idx in pair_targets.get(int(cand_idx), []):
                        dist = float(min(dm_forward[local_i, target_pos[other_idx]], dm_reverse[local_i, target_pos[other_idx]]))
                        if math.isfinite(dist) and dist <= spacing_km + 1e-6:
                            candidate_conflict_pairs.append((int(cand_idx), int(other_idx)))
                progress_state['candidate_pairs_processed'] = min(start + len(block_idx), active_candidate_count)
                if progress_state['candidate_pairs_processed'] % max(site_block_size, checkpoint_every * site_block_size) == 0:
                    save_partial()
                if progress_cb and (start + len(block_idx)) % progress_every == 0:
                    progress_cb(
                        f"Exact Standard: spacing conflicts between active candidates "
                        f"{min(start + len(block_idx), active_candidate_count)}/{active_candidate_count}"
                    )

    result = {
        'spacing_km': float(spacing_km),
        'distance_rule': 'symmetric_any_direction_min_osrm_km',
        'blocked_candidate_mask': blocked_candidate_mask,
        'blocked_candidate_count': int(np.sum(blocked_candidate_mask)),
        'candidate_conflict_pairs': np.asarray(candidate_conflict_pairs, dtype=np.int32),
        'candidate_conflict_count': int(len(candidate_conflict_pairs)),
    }
    result['fingerprint'] = _exact_spacing_conflict_fingerprint(result)
    if cache_enabled:
        with open(cache_path, 'wb') as f:
            pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
        if os.path.exists(partial_cache_path):
            os.remove(partial_cache_path)
        write_status('complete')
    return result


def _scan_fixed_store_spacing_warnings(fixed_sites, params):
    spacing_km = float(params.get('standard_min_store_spacing_km', params.get('standard_ds_radius', 3.0)) or params.get('standard_ds_radius', 3.0))
    fixed_count = len(fixed_sites)
    if fixed_count < 2 or spacing_km <= 0:
        return []
    fixed_lats = np.array([float(site['lat']) for site in fixed_sites], dtype=np.float64)
    fixed_lons = np.array([float(site['lon']) for site in fixed_sites], dtype=np.float64)
    max_table_coords = max(2, int(params.get('exact_spacing_table_coord_limit', 100) or 100))
    ref_lat = float(np.mean(fixed_lats)) if fixed_count else 0.0
    fixed_xy = _latlon_to_xy_km(fixed_lats, fixed_lons, ref_lat=ref_lat)
    fixed_tree = cKDTree(fixed_xy)
    near_fixed = fixed_tree.query_ball_point(fixed_xy, spacing_km + 0.05)
    warnings = []
    for i in range(fixed_count):
        neighbors = [j for j in near_fixed[i] if int(j) > i]
        if not neighbors:
            continue
        src = [(float(fixed_lats[i]), float(fixed_lons[i]))]
        max_dst = max(1, max_table_coords - len(src))
        for dst_start in range(0, len(neighbors), max_dst):
            neighbor_slice = neighbors[dst_start:dst_start + max_dst]
            dst = [(float(fixed_lats[j]), float(fixed_lons[j])) for j in neighbor_slice]
            dm_forward = _osrm_table_batch(src, dst)[0]
            dm_reverse = _osrm_table_batch(dst, src)[:, 0]
            for pos, j in enumerate(neighbor_slice):
                dist = float(min(dm_forward[pos], dm_reverse[pos]))
                if math.isfinite(dist) and dist <= spacing_km + 1e-6:
                    warnings.append({
                        'site_a': fixed_sites[i].get('id'),
                        'site_b': fixed_sites[int(j)].get('id'),
                        'road_distance_km': round(dist, 4),
                    })
    return warnings


def _threshold_exact_standard_superset_graph(superset_graph, params, allow_exceptions=False):
    base_radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    exception_radius = float(params.get('standard_exception_radius_km', 5.0) or 5.0)
    fixed_edges = superset_graph.get('fixed_edges', [])
    candidate_edges = superset_graph.get('candidate_edges', [])

    fixed_base = [[] for _ in range(len(fixed_edges))]
    fixed_extra = [[] for _ in range(len(fixed_edges))]
    cand_base = [[] for _ in range(len(candidate_edges))]
    cand_extra = [[] for _ in range(len(candidate_edges))]

    for demand_idx, demand_edges in enumerate(fixed_edges):
        base_list = fixed_base[demand_idx]
        extra_list = fixed_extra[demand_idx]
        for site_idx, dist in demand_edges:
            dist = float(dist)
            if dist <= base_radius + 1e-5:
                base_list.append((int(site_idx), dist))
            elif allow_exceptions and dist <= exception_radius + 1e-5:
                extra_list.append((int(site_idx), dist))

    for demand_idx, demand_edges in enumerate(candidate_edges):
        base_list = cand_base[demand_idx]
        extra_list = cand_extra[demand_idx]
        for site_idx, dist in demand_edges:
            dist = float(dist)
            if dist <= base_radius + 1e-5:
                base_list.append((int(site_idx), dist))
            elif allow_exceptions and dist <= exception_radius + 1e-5:
                extra_list.append((int(site_idx), dist))

    return {
        'fixed_base': fixed_base,
        'fixed_extra': fixed_extra,
        'cand_base': cand_base,
        'cand_extra': cand_extra,
        'graph_max_radius_km': float(superset_graph.get('graph_max_radius_km', exception_radius)),
        'distance_rule': str(superset_graph.get('distance_rule', 'store_to_customer_osrm_km')),
        'threshold_base_radius_km': float(base_radius),
        'threshold_exception_radius_km': float(exception_radius),
    }


def _load_or_build_exact_standard_superset_graph(scope_grid, fixed_sites, candidate_sites, params, progress_cb=None):
    graph_max_radius = _exact_graph_max_radius_km(params, allow_exceptions=True)
    cache_enabled = bool(params.get('exact_graph_cache_enabled', True))
    cache_path = _exact_graph_cache_path(scope_grid, fixed_sites, candidate_sites, params, allow_exceptions=True)
    candidate_cache_path = _exact_candidate_graph_cache_path(scope_grid, candidate_sites, params, allow_exceptions=True)
    fixed_overlay_cache_path = _exact_fixed_overlay_graph_cache_path(scope_grid, fixed_sites, params, allow_exceptions=True)
    partial_cache_path = _exact_graph_partial_cache_path(cache_path)
    status_path = _exact_graph_status_path(cache_path)
    if cache_enabled and os.path.exists(cache_path):
        if progress_cb:
            progress_cb(f"Exact Standard: loading cached graph {os.path.basename(cache_path)}")
        with open(cache_path, 'rb') as f:
            cached = pickle.load(f)
        if isinstance(cached, dict) and 'fixed_edges' in cached and 'candidate_edges' in cached:
            if cache_enabled and not os.path.exists(candidate_cache_path):
                _write_exact_superset_component_cache(candidate_cache_path, {
                    'version': 1,
                    'graph_max_radius_km': float(cached.get('graph_max_radius_km', graph_max_radius)),
                    'distance_rule': str(cached.get('distance_rule', 'store_to_customer_osrm_km')),
                    'fixed_edges': list(cached.get('candidate_edges', [])),
                })
            if cache_enabled and not os.path.exists(fixed_overlay_cache_path):
                _write_exact_superset_component_cache(fixed_overlay_cache_path, {
                    'version': 1,
                    'graph_max_radius_km': float(cached.get('graph_max_radius_km', graph_max_radius)),
                    'distance_rule': str(cached.get('distance_rule', 'store_to_customer_osrm_km')),
                    'fixed_edges': list(cached.get('fixed_edges', [])),
                })
            return cached
        if isinstance(cached, dict) and 'fixed_base' in cached and 'cand_base' in cached:
            converted = {
                'version': 1,
                'graph_max_radius_km': float(graph_max_radius),
                'distance_rule': 'store_to_customer_osrm_km',
                'fixed_edges': [
                    sorted(
                        [(int(site_idx), float(dist)) for site_idx, dist in list(base_edges) + list(extra_edges)],
                        key=lambda item: item[1],
                    )
                    for base_edges, extra_edges in zip(cached.get('fixed_base', []), cached.get('fixed_extra', []))
                ],
                'candidate_edges': [
                    sorted(
                        [(int(site_idx), float(dist)) for site_idx, dist in list(base_edges) + list(extra_edges)],
                        key=lambda item: item[1],
                    )
                    for base_edges, extra_edges in zip(cached.get('cand_base', []), cached.get('cand_extra', []))
                ],
            }
            if cache_enabled and not os.path.exists(candidate_cache_path):
                _write_exact_superset_component_cache(candidate_cache_path, {
                    'version': 1,
                    'graph_max_radius_km': float(graph_max_radius),
                    'distance_rule': 'store_to_customer_osrm_km',
                    'fixed_edges': list(converted.get('candidate_edges', [])),
                })
            if cache_enabled and not os.path.exists(fixed_overlay_cache_path):
                _write_exact_superset_component_cache(fixed_overlay_cache_path, {
                    'version': 1,
                    'graph_max_radius_km': float(graph_max_radius),
                    'distance_rule': 'store_to_customer_osrm_km',
                    'fixed_edges': list(converted.get('fixed_edges', [])),
                })
            return converted
        return cached

    if cache_enabled and os.path.exists(candidate_cache_path):
        if progress_cb:
            progress_cb(f"Exact Standard: loading reusable candidate superset graph {os.path.basename(candidate_cache_path)}")
        with open(candidate_cache_path, 'rb') as f:
            candidate_graph = pickle.load(f)
        fixed_graph = _load_or_build_exact_site_edge_graph(
            scope_grid,
            fixed_sites,
            graph_max_radius,
            fixed_overlay_cache_path,
            'fixed overlay sites',
            progress_cb=progress_cb,
        )
        superset_graph = _compose_exact_superset_graph(fixed_graph, {'candidate_edges': candidate_graph.get('fixed_edges', [])}, graph_max_radius)
        if cache_enabled:
            with open(cache_path, 'wb') as f:
                pickle.dump(superset_graph, f, protocol=pickle.HIGHEST_PROTOCOL)
            write_status_payload = {
                'cache_path': cache_path,
                'partial_cache_path': partial_cache_path,
                'state': 'complete',
                'updated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'fixed_sites_processed': int(len(fixed_sites)),
                'fixed_sites_total': int(len(fixed_sites)),
                'candidate_sites_processed': int(len(candidate_sites)),
                'candidate_sites_total': int(len(candidate_sites)),
                'graph_max_radius_km': float(graph_max_radius),
                'base_radius_km': float(params.get('standard_ds_radius', 3.0) or 3.0),
                'exception_radius_km': float(params.get('standard_exception_radius_km', 5.0) or 5.0),
            }
            with open(status_path, 'w') as f:
                json.dump(write_status_payload, f, indent=2)
        return superset_graph

    demand_lats = scope_grid['avg_cust_lat'].values.astype(np.float64)
    demand_lons = scope_grid['avg_cust_lon'].values.astype(np.float64)
    ref_lat = float(np.mean(demand_lats)) if len(demand_lats) else 0.0
    demand_xy = _latlon_to_xy_km(demand_lats, demand_lons, ref_lat=ref_lat)
    demand_tree = cKDTree(demand_xy)

    fixed_edges = [[] for _ in range(len(scope_grid))]
    candidate_edges = [[] for _ in range(len(scope_grid))]
    checkpoint_every = max(1, int(params.get('exact_graph_checkpoint_every_blocks', 10) or 10))
    progress_state = {'fixed sites': 0, 'candidate sites': 0}

    if cache_enabled and os.path.exists(partial_cache_path):
        try:
            with open(partial_cache_path, 'rb') as f:
                partial = pickle.load(f)
            if partial.get('version') == 2:
                graph_payload = partial.get('graph') or {}
                fixed_edges = graph_payload.get('fixed_edges', fixed_edges)
                candidate_edges = graph_payload.get('candidate_edges', candidate_edges)
                saved_progress = partial.get('progress_state') or {}
                progress_state.update({k: int(v) for k, v in saved_progress.items() if k in progress_state})
                if progress_cb:
                    progress_cb(f"Exact Standard: resuming partial graph {os.path.basename(partial_cache_path)}")
        except Exception:
            if progress_cb:
                progress_cb("Exact Standard: partial graph checkpoint unreadable, rebuilding from scratch")

    def write_status(state_label):
        if not cache_enabled:
            return
        payload = {
            'cache_path': cache_path,
            'partial_cache_path': partial_cache_path,
            'state': state_label,
            'updated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'fixed_sites_processed': int(progress_state.get('fixed sites', 0)),
            'fixed_sites_total': int(len(fixed_sites)),
            'candidate_sites_processed': int(progress_state.get('candidate sites', 0)),
            'candidate_sites_total': int(len(candidate_sites)),
            'graph_max_radius_km': float(graph_max_radius),
            'base_radius_km': float(params.get('standard_ds_radius', 3.0) or 3.0),
            'exception_radius_km': float(params.get('standard_exception_radius_km', 5.0) or 5.0),
        }
        with open(status_path, 'w') as f:
            json.dump(payload, f, indent=2)

    def save_partial():
        if not cache_enabled:
            return
        payload = {
            'version': 2,
            'graph': {
                'version': 2,
                'graph_max_radius_km': float(graph_max_radius),
                'distance_rule': 'store_to_customer_osrm_km',
                'fixed_edges': fixed_edges,
                'candidate_edges': candidate_edges,
            },
            'progress_state': dict(progress_state),
        }
        with open(partial_cache_path, 'wb') as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)
        write_status('partial')

    write_status('starting')

    def process_sites(sites, target, label):
        total_sites = len(sites)
        if total_sites == 0:
            return
        progress_every = 100 if total_sites > 1000 else 10
        site_lats = np.array([float(site['lat']) for site in sites], dtype=np.float64)
        site_lons = np.array([float(site['lon']) for site in sites], dtype=np.float64)
        site_xy = _latlon_to_xy_km(site_lats, site_lons, ref_lat=ref_lat)
        nearby_lists = demand_tree.query_ball_point(site_xy, graph_max_radius + 0.05)

        site_block_size = max(1, int(params.get('exact_graph_site_block_size', OSRM_BATCH_SIZE) or OSRM_BATCH_SIZE))
        ordered_site_indices = np.lexsort((site_xy[:, 1], site_xy[:, 0]))
        start_processed = min(progress_state.get(label, 0), total_sites)

        for block_start in range(start_processed, total_sites, site_block_size):
            block_indices = ordered_site_indices[block_start:block_start + site_block_size]
            demand_union = sorted({int(idx) for site_idx in block_indices for idx in nearby_lists[int(site_idx)]})
            if not demand_union:
                progress_state[label] = min(block_start + len(block_indices), total_sites)
                continue
            src = [(float(site_lats[int(site_idx)]), float(site_lons[int(site_idx)])) for site_idx in block_indices]
            for dst_indices, dm in _iter_osrm_table_batch_results(
                src,
                demand_lats,
                demand_lons,
                demand_union,
                batch_size=OSRM_BATCH_SIZE,
                parallelism=EXACT_GRAPH_BATCH_PARALLELISM,
            ):
                for local_site_pos, site_idx in enumerate(block_indices):
                    row = dm[local_site_pos]
                    for local_dst_pos, demand_idx in enumerate(dst_indices):
                        dist = float(row[local_dst_pos])
                        if not math.isfinite(dist):
                            continue
                        if dist <= graph_max_radius + 1e-5:
                            target[int(demand_idx)].append((int(site_idx), dist))
            processed = min(block_start + len(block_indices), total_sites)
            progress_state[label] = processed
            if processed % max(site_block_size, checkpoint_every * site_block_size) == 0:
                save_partial()
            if progress_cb and processed % progress_every == 0:
                progress_cb(f"Exact Standard: {label} coverage graph {processed}/{total_sites}")

    process_sites(fixed_sites, fixed_edges, 'fixed sites')
    process_sites(candidate_sites, candidate_edges, 'candidate sites')
    superset_graph = {
        'version': 2,
        'graph_max_radius_km': float(graph_max_radius),
        'distance_rule': 'store_to_customer_osrm_km',
        'fixed_edges': fixed_edges,
        'candidate_edges': candidate_edges,
    }
    if cache_enabled:
        with open(cache_path, 'wb') as f:
            pickle.dump(superset_graph, f, protocol=pickle.HIGHEST_PROTOCOL)
        if not os.path.exists(candidate_cache_path):
            _write_exact_superset_component_cache(candidate_cache_path, {
                'version': 1,
                'graph_max_radius_km': float(graph_max_radius),
                'distance_rule': 'store_to_customer_osrm_km',
                'fixed_edges': list(candidate_edges),
            })
        if not os.path.exists(fixed_overlay_cache_path):
            _write_exact_superset_component_cache(fixed_overlay_cache_path, {
                'version': 1,
                'graph_max_radius_km': float(graph_max_radius),
                'distance_rule': 'store_to_customer_osrm_km',
                'fixed_edges': list(fixed_edges),
            })
        if os.path.exists(partial_cache_path):
            os.remove(partial_cache_path)
        write_status('complete')
        if progress_cb:
            progress_cb(f"Exact Standard: cached graph saved to {os.path.basename(cache_path)}")
    return superset_graph


def _build_exact_standard_coverage_sets(scope_grid, fixed_sites, candidate_sites, params, allow_exceptions=False, progress_cb=None):
    superset_graph = _load_or_build_exact_standard_superset_graph(
        scope_grid,
        fixed_sites,
        candidate_sites,
        params,
        progress_cb=progress_cb,
    )
    return _threshold_exact_standard_superset_graph(
        superset_graph,
        params,
        allow_exceptions=allow_exceptions,
    )


def _reduce_exact_candidates_by_spacing_conflicts(candidate_sites, coverage_sets, spacing_conflicts):
    if not candidate_sites or not spacing_conflicts:
        return candidate_sites, coverage_sets, spacing_conflicts

    blocked_candidate_mask = np.asarray(
        spacing_conflicts.get('blocked_candidate_mask', np.zeros(len(candidate_sites), dtype=bool)),
        dtype=bool,
    )
    if len(blocked_candidate_mask) != len(candidate_sites):
        blocked_candidate_mask = np.zeros(len(candidate_sites), dtype=bool)

    candidate_has_edges = np.zeros(len(candidate_sites), dtype=bool)
    for demand_edges in coverage_sets.get('cand_base', []):
        for cand_idx, _dist in demand_edges:
            candidate_has_edges[int(cand_idx)] = True
    for demand_edges in coverage_sets.get('cand_extra', []):
        for cand_idx, _dist in demand_edges:
            candidate_has_edges[int(cand_idx)] = True

    removable_mask = blocked_candidate_mask | (~candidate_has_edges)
    if not np.any(removable_mask):
        return candidate_sites, coverage_sets, spacing_conflicts

    active_idx = np.flatnonzero(~removable_mask).astype(np.int32)
    old_to_new = np.full(len(candidate_sites), -1, dtype=np.int32)
    old_to_new[active_idx] = np.arange(len(active_idx), dtype=np.int32)

    reduced_candidate_sites = [candidate_sites[int(idx)] for idx in active_idx]

    def remap_candidate_edges(edge_lists):
        remapped = []
        for demand_edges in edge_lists:
            new_edges = []
            for cand_idx, dist in demand_edges:
                mapped = int(old_to_new[int(cand_idx)])
                if mapped >= 0:
                    new_edges.append((mapped, dist))
            remapped.append(new_edges)
        return remapped

    reduced_coverage_sets = {
        'fixed_base': coverage_sets['fixed_base'],
        'fixed_extra': coverage_sets['fixed_extra'],
        'cand_base': remap_candidate_edges(coverage_sets['cand_base']),
        'cand_extra': remap_candidate_edges(coverage_sets['cand_extra']),
    }

    old_pairs = np.asarray(
        spacing_conflicts.get('candidate_conflict_pairs', np.empty((0, 2), dtype=np.int32)),
        dtype=np.int32,
    )
    remapped_pairs = []
    for cand_i, cand_j in old_pairs:
        new_i = int(old_to_new[int(cand_i)])
        new_j = int(old_to_new[int(cand_j)])
        if new_i >= 0 and new_j >= 0:
            remapped_pairs.append((new_i, new_j))

    reduced_spacing_conflicts = {
        'spacing_km': spacing_conflicts.get('spacing_km'),
        'distance_rule': spacing_conflicts.get('distance_rule', 'unknown'),
        'blocked_candidate_mask': np.zeros(len(reduced_candidate_sites), dtype=bool),
        'blocked_candidate_count': 0,
        'candidate_conflict_pairs': np.asarray(remapped_pairs, dtype=np.int32),
        'candidate_conflict_count': int(len(remapped_pairs)),
        'removed_blocked_candidate_count': int(np.sum(blocked_candidate_mask)),
        'removed_zero_edge_candidate_count': int(np.sum(~candidate_has_edges)),
        'source_spacing_fingerprint': spacing_conflicts.get('fingerprint'),
    }
    reduced_spacing_conflicts['fingerprint'] = _exact_spacing_conflict_fingerprint(reduced_spacing_conflicts)
    return reduced_candidate_sites, reduced_coverage_sets, reduced_spacing_conflicts


def _build_exact_stage2_components(coverage_sets, candidate_count, fixed_count, allow_exception_vars, spacing_conflicts=None):
    candidate_conflict_pairs = np.asarray(
        (spacing_conflicts or {}).get('candidate_conflict_pairs', np.empty((0, 2), dtype=np.int32)),
        dtype=np.int32,
    )

    decision_node_count = int(candidate_count) + (int(fixed_count) if allow_exception_vars else 0)
    if decision_node_count <= 0:
        return {
            'component_count': 0,
            'components': [],
            'fixed_only_demand_indices': list(range(len(coverage_sets.get('fixed_base', [])))),
        }

    parent = np.arange(decision_node_count, dtype=np.int32)
    rank = np.zeros(decision_node_count, dtype=np.int8)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = int(parent[x])
        return x

    def union(a, b):
        ra = find(int(a))
        rb = find(int(b))
        if ra == rb:
            return
        if rank[ra] < rank[rb]:
            parent[ra] = rb
        elif rank[ra] > rank[rb]:
            parent[rb] = ra
        else:
            parent[rb] = ra
            rank[ra] = np.int8(rank[ra] + 1)

    active_nodes = set()
    demand_roots = {}
    fixed_only_demand_indices = []

    for cand_i, cand_j in candidate_conflict_pairs:
        node_i = int(cand_i)
        node_j = int(cand_j)
        active_nodes.add(node_i)
        active_nodes.add(node_j)
        union(node_i, node_j)

    for demand_idx in range(len(coverage_sets['fixed_base'])):
        demand_nodes = []
        seen_candidates = set()
        for cand_idx, _dist in coverage_sets['cand_base'][demand_idx]:
            cand_idx = int(cand_idx)
            if cand_idx not in seen_candidates:
                demand_nodes.append(cand_idx)
                seen_candidates.add(cand_idx)
        for cand_idx, _dist in coverage_sets['cand_extra'][demand_idx]:
            cand_idx = int(cand_idx)
            if cand_idx not in seen_candidates:
                demand_nodes.append(cand_idx)
                seen_candidates.add(cand_idx)
        if allow_exception_vars:
            seen_fixed = set()
            for fixed_idx, _dist in coverage_sets['fixed_extra'][demand_idx]:
                fixed_idx = int(fixed_idx)
                if fixed_idx not in seen_fixed:
                    demand_nodes.append(candidate_count + fixed_idx)
                    seen_fixed.add(fixed_idx)
        if not demand_nodes:
            fixed_only_demand_indices.append(int(demand_idx))
            continue
        anchor = int(demand_nodes[0])
        active_nodes.update(int(node) for node in demand_nodes)
        for node in demand_nodes[1:]:
            union(anchor, int(node))
        demand_roots[int(demand_idx)] = find(anchor)

    component_candidates = defaultdict(list)
    component_fixed = defaultdict(list)
    for node in sorted(active_nodes):
        root = find(int(node))
        if node < candidate_count:
            component_candidates[root].append(int(node))
        else:
            component_fixed[root].append(int(node - candidate_count))

    component_demands = defaultdict(list)
    for demand_idx, root in demand_roots.items():
        component_demands[int(root)].append(int(demand_idx))

    components = []
    for root in sorted(component_demands.keys()):
        cand_indices = component_candidates.get(root, [])
        fixed_indices = component_fixed.get(root, [])
        demand_indices = component_demands.get(root, [])
        if not demand_indices:
            continue
        components.append({
            'root': int(root),
            'candidate_indices': cand_indices,
            'fixed_exception_indices': fixed_indices,
            'demand_indices': demand_indices,
        })

    return {
        'component_count': len(components),
        'components': components,
        'fixed_only_demand_indices': fixed_only_demand_indices,
    }


def _solve_exact_stage2_by_components(scope_grid, fixed_sites, candidate_sites, coverage_sets, params,
                                      allow_exceptions, prepared_model, scenario_name, progress_cb=None):
    decomposition = prepared_model.get('stage2_component_decomposition')
    if decomposition is None:
        decomposition = _build_exact_stage2_components(
            coverage_sets,
            prepared_model['candidate_count'],
            prepared_model['fixed_count'],
            bool(prepared_model['allow_exception_vars']),
            spacing_conflicts={
                'candidate_conflict_pairs': prepared_model.get('candidate_conflict_pairs', np.empty((0, 2), dtype=np.int32)),
            },
        )
        prepared_model['stage2_component_decomposition'] = decomposition

    components = decomposition.get('components', [])
    fixed_only_demands = decomposition.get('fixed_only_demand_indices', [])
    if len(components) <= 1:
        return None

    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    total_orders = float(np.sum(weights))
    candidate_count = int(prepared_model['candidate_count'])
    fixed_count = int(prepared_model['fixed_count'])
    allow_exception_vars = bool(prepared_model['allow_exception_vars'])
    x_offset = int(prepared_model['x_offset'])
    ef_offset = int(prepared_model['ef_offset'])
    ef_count = int(prepared_model['ef_count'])
    en_offset = int(prepared_model['en_offset'])
    en_count = int(prepared_model['en_count'])
    u_offset = int(prepared_model['u_offset'])
    u_count = int(prepared_model['u_count'])
    n_vars = int(prepared_model['n_vars'])

    final_solution = np.zeros(n_vars, dtype=np.float64)
    cost_opt = 0.0
    standard_base_cost = float(params.get('standard_base_cost', 29) or 29)
    standard_var_rate = float(params.get('standard_variable_rate', 9) or 9)

    for demand_idx in fixed_only_demands:
        fixed_edges = coverage_sets['fixed_base'][int(demand_idx)]
        if not fixed_edges:
            raise RuntimeError(
                f"Exact Standard [{scenario_name}] component solve found uncovered fixed-only demand {demand_idx}."
            )
        best_dist = min(float(dist) for _fixed_idx, dist in fixed_edges)
        cost_opt += weights[int(demand_idx)] * (standard_base_cost + standard_var_rate * best_dist)

    conflict_pairs = np.asarray(prepared_model.get('candidate_conflict_pairs', np.empty((0, 2), dtype=np.int32)), dtype=np.int32)

    for comp_idx, component in enumerate(components, start=1):
        demand_indices = [int(x) for x in component['demand_indices']]
        cand_indices = [int(x) for x in component['candidate_indices']]
        fixed_indices = [int(x) for x in component['fixed_exception_indices']]
        local_c_count = len(cand_indices)
        local_f_count = len(fixed_indices) if allow_exception_vars else 0
        if not demand_indices:
            continue

        cand_map = {cand_idx: local_idx for local_idx, cand_idx in enumerate(cand_indices)}
        fixed_map = {fixed_idx: local_idx for local_idx, fixed_idx in enumerate(fixed_indices)}

        lx_offset = 0
        lef_offset = lx_offset + local_c_count
        len_offset = lef_offset + local_f_count
        len_count = local_c_count if allow_exception_vars else 0
        lz_offset = len_offset + len_count

        edge_cost = []
        edge_requires_var = []
        edge_demand_local = []
        candidate_base_edge_lists = [[] for _ in range(local_c_count)]
        candidate_extra_edge_lists = [[] for _ in range(local_c_count)] if allow_exception_vars else []
        fixed_extra_edge_lists = [[] for _ in range(local_f_count)] if allow_exception_vars else []

        for local_demand_idx, demand_idx in enumerate(demand_indices):
            for _fixed_idx, dist in coverage_sets['fixed_base'][demand_idx]:
                edge_idx = len(edge_cost)
                edge_demand_local.append(local_demand_idx)
                edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
                edge_requires_var.append(-1)
            if allow_exception_vars:
                for fixed_idx, dist in coverage_sets['fixed_extra'][demand_idx]:
                    fixed_idx = int(fixed_idx)
                    if fixed_idx in fixed_map:
                        local_fixed_idx = fixed_map[fixed_idx]
                        edge_idx = len(edge_cost)
                        edge_demand_local.append(local_demand_idx)
                        edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
                        edge_requires_var.append(lef_offset + local_fixed_idx)
                        fixed_extra_edge_lists[local_fixed_idx].append(edge_idx)
            for cand_idx, dist in coverage_sets['cand_base'][demand_idx]:
                cand_idx = int(cand_idx)
                if cand_idx in cand_map:
                    local_cand_idx = cand_map[cand_idx]
                    edge_idx = len(edge_cost)
                    edge_demand_local.append(local_demand_idx)
                    edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
                    edge_requires_var.append(lx_offset + local_cand_idx)
                    candidate_base_edge_lists[local_cand_idx].append(edge_idx)
            if allow_exception_vars:
                for cand_idx, dist in coverage_sets['cand_extra'][demand_idx]:
                    cand_idx = int(cand_idx)
                    if cand_idx in cand_map:
                        local_cand_idx = cand_map[cand_idx]
                        edge_idx = len(edge_cost)
                        edge_demand_local.append(local_demand_idx)
                        edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
                        edge_requires_var.append(len_offset + local_cand_idx)
                        candidate_extra_edge_lists[local_cand_idx].append(edge_idx)

        edge_demand_local = np.asarray(edge_demand_local, dtype=np.int32)
        edge_cost = np.asarray(edge_cost, dtype=np.float64)
        edge_requires_var = np.asarray(edge_requires_var, dtype=np.int64)
        edge_count = int(len(edge_demand_local))
        local_var_count = lz_offset + edge_count

        rows = []
        cols = []
        data = []
        lower = []
        upper = []
        row_idx = 0

        if edge_count:
            edge_counts_by_demand = np.bincount(edge_demand_local, minlength=len(demand_indices))
            edge_offsets = np.zeros(len(demand_indices) + 1, dtype=np.int64)
            edge_offsets[1:] = np.cumsum(edge_counts_by_demand)
        else:
            edge_offsets = np.zeros(len(demand_indices) + 1, dtype=np.int64)

        for local_demand_idx in range(len(demand_indices)):
            start = int(edge_offsets[local_demand_idx])
            end = int(edge_offsets[local_demand_idx + 1])
            if end <= start:
                raise RuntimeError(
                    f"Exact Standard [{scenario_name}] component solve found infeasible demand {demand_indices[local_demand_idx]}."
                )
            edge_range = np.arange(start, end, dtype=np.int64)
            rows.extend([row_idx] * len(edge_range))
            cols.extend((lz_offset + edge_range).tolist())
            data.extend([1.0] * len(edge_range))
            lower.append(1.0)
            upper.append(1.0)
            row_idx += 1

        for edge_idx, open_var in enumerate(edge_requires_var):
            if open_var < 0:
                continue
            rows.extend([row_idx, row_idx])
            cols.extend([lz_offset + edge_idx, int(open_var)])
            data.extend([1.0, -1.0])
            lower.append(-np.inf)
            upper.append(0.0)
            row_idx += 1

        for local_cand_idx in range(local_c_count):
            used_edges = list(candidate_base_edge_lists[local_cand_idx])
            if allow_exception_vars:
                used_edges.extend(candidate_extra_edge_lists[local_cand_idx])
            if not used_edges:
                continue
            rows.append(row_idx)
            cols.append(lx_offset + local_cand_idx)
            data.append(1.0)
            for edge_idx in used_edges:
                rows.append(row_idx)
                cols.append(lz_offset + int(edge_idx))
                data.append(-1.0)
            lower.append(-np.inf)
            upper.append(0.0)
            row_idx += 1

        if allow_exception_vars:
            for local_cand_idx in range(local_c_count):
                rows.extend([row_idx, row_idx])
                cols.extend([len_offset + local_cand_idx, lx_offset + local_cand_idx])
                data.extend([1.0, -1.0])
                lower.append(-np.inf)
                upper.append(0.0)
                row_idx += 1

            for local_fixed_idx in range(local_f_count):
                used_edges = fixed_extra_edge_lists[local_fixed_idx]
                if not used_edges:
                    continue
                rows.append(row_idx)
                cols.append(lef_offset + local_fixed_idx)
                data.append(1.0)
                for edge_idx in used_edges:
                    rows.append(row_idx)
                    cols.append(lz_offset + int(edge_idx))
                    data.append(-1.0)
                lower.append(-np.inf)
                upper.append(0.0)
                row_idx += 1

            for local_cand_idx in range(local_c_count):
                used_edges = candidate_extra_edge_lists[local_cand_idx]
                if not used_edges:
                    continue
                rows.append(row_idx)
                cols.append(len_offset + local_cand_idx)
                data.append(1.0)
                for edge_idx in used_edges:
                    rows.append(row_idx)
                    cols.append(lz_offset + int(edge_idx))
                    data.append(-1.0)
                lower.append(-np.inf)
                upper.append(0.0)
                row_idx += 1

        if local_c_count:
            for cand_i, cand_j in conflict_pairs:
                cand_i = int(cand_i)
                cand_j = int(cand_j)
                if cand_i in cand_map and cand_j in cand_map:
                    rows.extend([row_idx, row_idx])
                    cols.extend([lx_offset + cand_map[cand_i], lx_offset + cand_map[cand_j]])
                    data.extend([1.0, 1.0])
                    lower.append(-np.inf)
                    upper.append(1.0)
                    row_idx += 1

        local_A = sp.coo_matrix((data, (rows, cols)), shape=(row_idx, local_var_count)).tocsr()
        local_lower = np.asarray(lower, dtype=np.float64)
        local_upper = np.asarray(upper, dtype=np.float64)
        local_integrality = np.zeros(local_var_count, dtype=np.int8)
        if local_c_count:
            local_integrality[lx_offset:lx_offset + local_c_count] = 1
        if local_f_count:
            local_integrality[lef_offset:lef_offset + local_f_count] = 1
        if len_count:
            local_integrality[len_offset:len_offset + len_count] = 1
        local_lb = np.zeros(local_var_count, dtype=np.float64)
        local_ub = np.ones(local_var_count, dtype=np.float64)
        local_c = np.zeros(local_var_count, dtype=np.float64)
        if edge_count:
            local_c[lz_offset:lz_offset + edge_count] = edge_cost

        if progress_cb:
            progress_cb(
                f"Exact Standard [{scenario_name}]: component stage 2 {comp_idx}/{len(components)} "
                f"({len(demand_indices)} demand, {local_c_count} cand, {local_f_count} fixed-exception)"
            )
        res = milp(
            c=local_c,
            integrality=local_integrality,
            bounds=Bounds(local_lb, local_ub),
            constraints=[LinearConstraint(local_A, local_lower, local_upper)],
            options={'disp': False},
        )
        if res.status not in (0, 1) or res.x is None:
            raise RuntimeError(
                f"Exact Standard component MILP failed in {scenario_name}: "
                f"component={comp_idx}, status={res.status}, message={res.message}"
            )

        cost_opt += float(np.dot(local_c, res.x))
        for cand_idx, local_idx in cand_map.items():
            final_solution[x_offset + cand_idx] = res.x[lx_offset + local_idx]
            if allow_exception_vars:
                final_solution[en_offset + cand_idx] = res.x[len_offset + local_idx]
        if allow_exception_vars:
            for fixed_idx, local_idx in fixed_map.items():
                final_solution[ef_offset + fixed_idx] = res.x[lef_offset + local_idx]

    final_solution[u_offset:u_offset + u_count] = 0.0
    coverage_pct = 100.0 if total_orders > 0 else 0.0
    return {
        'solution': final_solution,
        'cost_opt': float(cost_opt),
        'coverage_pct': float(coverage_pct),
        'covered_mask': np.ones(u_count, dtype=bool),
        'component_count': int(len(components)),
        'fixed_only_demand_count': int(len(fixed_only_demands)),
    }


def _build_prepared_exact_scenario_model(scope_grid, fixed_sites, candidate_sites, coverage_sets, params, allow_exceptions, spacing_conflicts=None):
    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    demand_count = len(scope_grid)
    candidate_count = len(candidate_sites)
    fixed_count = len(fixed_sites)
    allow_exception_vars = bool(
        allow_exceptions
        and float(params.get('standard_exception_radius_km', 5.0) or 5.0)
        > float(params.get('standard_ds_radius', 3.0) or 3.0) + 1e-5
    )

    x_offset = 0
    x_count = candidate_count
    ef_offset = x_offset + x_count
    ef_count = fixed_count if allow_exception_vars else 0
    en_offset = ef_offset + ef_count
    en_count = candidate_count if allow_exception_vars else 0
    u_offset = en_offset + en_count
    u_count = demand_count
    n_stage1_vars = u_offset + u_count

    rows = []
    cols = []
    data = []
    lower = []
    upper = []
    row_idx = 0

    fixed_base_const = np.zeros(demand_count, dtype=np.float64)
    for i in range(demand_count):
        if coverage_sets['fixed_base'][i]:
            fixed_base_const[i] = 1.0

    for i in range(demand_count):
        rhs = max(0.0, 1.0 - fixed_base_const[i])
        rows.append(row_idx)
        cols.append(u_offset + i)
        data.append(1.0)
        for cand_idx, _dist in coverage_sets['cand_base'][i]:
            rows.append(row_idx)
            cols.append(x_offset + cand_idx)
            data.append(1.0)
        if allow_exception_vars:
            for fixed_idx, _dist in coverage_sets['fixed_extra'][i]:
                rows.append(row_idx)
                cols.append(ef_offset + fixed_idx)
                data.append(1.0)
            for cand_idx, _dist in coverage_sets['cand_extra'][i]:
                rows.append(row_idx)
                cols.append(en_offset + cand_idx)
                data.append(1.0)
        lower.append(rhs)
        upper.append(np.inf)
        row_idx += 1

    if allow_exception_vars:
        for cand_idx in range(candidate_count):
            rows.extend([row_idx, row_idx])
            cols.extend([en_offset + cand_idx, x_offset + cand_idx])
            data.extend([1.0, -1.0])
            lower.append(-np.inf)
            upper.append(0.0)
            row_idx += 1

    blocked_candidate_mask = np.zeros(candidate_count, dtype=bool)
    candidate_conflict_pairs = np.empty((0, 2), dtype=np.int32)
    if spacing_conflicts:
        blocked_candidate_mask = np.asarray(
            spacing_conflicts.get('blocked_candidate_mask', np.zeros(candidate_count, dtype=bool)),
            dtype=bool,
        )
        candidate_conflict_pairs = np.asarray(
            spacing_conflicts.get('candidate_conflict_pairs', np.empty((0, 2), dtype=np.int32)),
            dtype=np.int32,
        )

    for cand_idx in np.flatnonzero(blocked_candidate_mask):
        rows.append(row_idx)
        cols.append(x_offset + int(cand_idx))
        data.append(1.0)
        lower.append(-np.inf)
        upper.append(0.0)
        row_idx += 1

    for cand_i, cand_j in candidate_conflict_pairs:
        rows.extend([row_idx, row_idx])
        cols.extend([x_offset + int(cand_i), x_offset + int(cand_j)])
        data.extend([1.0, 1.0])
        lower.append(-np.inf)
        upper.append(1.0)
        row_idx += 1

    stage1_A = sp.coo_matrix((data, (rows, cols)), shape=(row_idx, n_stage1_vars)).tocsr()
    stage1_lower = np.asarray(lower, dtype=np.float64)
    stage1_upper = np.asarray(upper, dtype=np.float64)
    stage1_integrality = np.zeros(n_stage1_vars, dtype=np.int8)
    if x_count:
        stage1_integrality[x_offset:x_offset + x_count] = 1
    if ef_count:
        stage1_integrality[ef_offset:ef_offset + ef_count] = 1
    if en_count:
        stage1_integrality[en_offset:en_offset + en_count] = 1
    stage1_lb = np.zeros(n_stage1_vars, dtype=np.float64)
    stage1_ub = np.ones(n_stage1_vars, dtype=np.float64)

    edge_demand_idx = []
    edge_cost = []
    edge_distance_km = []
    edge_requires_var = []
    edge_site_kind = []
    edge_site_idx = []
    candidate_base_edge_lists = [[] for _ in range(candidate_count)]
    candidate_extra_edge_lists = [[] for _ in range(candidate_count)] if allow_exception_vars else []
    fixed_extra_edge_lists = [[] for _ in range(fixed_count)] if allow_exception_vars else []
    standard_base_cost = float(params.get('standard_base_cost', 29) or 29)
    standard_var_rate = float(params.get('standard_variable_rate', 9) or 9)
    for demand_idx in range(demand_count):
        for _fixed_idx, dist in coverage_sets['fixed_base'][demand_idx]:
            edge_idx = len(edge_cost)
            edge_demand_idx.append(demand_idx)
            edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
            edge_distance_km.append(float(dist))
            edge_requires_var.append(-1)
            edge_site_kind.append(0)
            edge_site_idx.append(int(_fixed_idx))
        if allow_exception_vars:
            for fixed_idx, dist in coverage_sets['fixed_extra'][demand_idx]:
                edge_idx = len(edge_cost)
                edge_demand_idx.append(demand_idx)
                edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
                edge_distance_km.append(float(dist))
                edge_requires_var.append(ef_offset + fixed_idx)
                edge_site_kind.append(0)
                edge_site_idx.append(int(fixed_idx))
                fixed_extra_edge_lists[int(fixed_idx)].append(edge_idx)
        for cand_idx, dist in coverage_sets['cand_base'][demand_idx]:
            edge_idx = len(edge_cost)
            edge_demand_idx.append(demand_idx)
            edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
            edge_distance_km.append(float(dist))
            edge_requires_var.append(x_offset + cand_idx)
            edge_site_kind.append(1)
            edge_site_idx.append(int(cand_idx))
            candidate_base_edge_lists[int(cand_idx)].append(edge_idx)
        if allow_exception_vars:
            for cand_idx, dist in coverage_sets['cand_extra'][demand_idx]:
                edge_idx = len(edge_cost)
                edge_demand_idx.append(demand_idx)
                edge_cost.append(weights[demand_idx] * (standard_base_cost + standard_var_rate * float(dist)))
                edge_distance_km.append(float(dist))
                edge_requires_var.append(en_offset + cand_idx)
                edge_site_kind.append(1)
                edge_site_idx.append(int(cand_idx))
                candidate_extra_edge_lists[int(cand_idx)].append(edge_idx)

    edge_demand_idx = np.asarray(edge_demand_idx, dtype=np.int32)
    edge_cost = np.asarray(edge_cost, dtype=np.float64)
    edge_distance_km = np.asarray(edge_distance_km, dtype=np.float64)
    edge_requires_var = np.asarray(edge_requires_var, dtype=np.int64)
    edge_site_kind = np.asarray(edge_site_kind, dtype=np.int8)
    edge_site_idx = np.asarray(edge_site_idx, dtype=np.int32)
    edge_count = int(len(edge_demand_idx))
    z_offset = n_stage1_vars
    n_vars = z_offset + edge_count

    rows2 = []
    cols2 = []
    data2 = []
    lower2 = []
    upper2 = []
    row2 = 0

    if edge_count:
        edge_counts_by_demand = np.bincount(edge_demand_idx, minlength=demand_count)
        edge_offsets = np.zeros(demand_count + 1, dtype=np.int64)
        edge_offsets[1:] = np.cumsum(edge_counts_by_demand)
    else:
        edge_offsets = np.zeros(demand_count + 1, dtype=np.int64)

    for demand_idx in range(demand_count):
        start = int(edge_offsets[demand_idx])
        end = int(edge_offsets[demand_idx + 1])
        if end > start:
            edge_range = np.arange(start, end, dtype=np.int64)
            rows2.extend([row2] * len(edge_range))
            cols2.extend((z_offset + edge_range).tolist())
            data2.extend([1.0] * len(edge_range))
        rows2.append(row2)
        cols2.append(u_offset + demand_idx)
        data2.append(1.0)
        lower2.append(1.0)
        upper2.append(1.0)
        row2 += 1

    active_edge_idx = np.flatnonzero(edge_requires_var >= 0)
    for edge_idx in active_edge_idx:
        open_var = int(edge_requires_var[edge_idx])
        rows2.extend([row2, row2])
        cols2.extend([z_offset + int(edge_idx), open_var])
        data2.extend([1.0, -1.0])
        lower2.append(-np.inf)
        upper2.append(0.0)
        row2 += 1

    for cand_idx in range(candidate_count):
        used_edges = list(candidate_base_edge_lists[cand_idx])
        if allow_exception_vars:
            used_edges.extend(candidate_extra_edge_lists[cand_idx])
        if not used_edges:
            continue
        rows2.append(row2)
        cols2.append(x_offset + cand_idx)
        data2.append(1.0)
        for edge_idx in used_edges:
            rows2.append(row2)
            cols2.append(z_offset + int(edge_idx))
            data2.append(-1.0)
        lower2.append(-np.inf)
        upper2.append(0.0)
        row2 += 1

    if allow_exception_vars:
        for cand_idx in range(candidate_count):
            rows2.extend([row2, row2])
            cols2.extend([en_offset + cand_idx, x_offset + cand_idx])
            data2.extend([1.0, -1.0])
            lower2.append(-np.inf)
            upper2.append(0.0)
            row2 += 1

        for fixed_idx in range(fixed_count):
            used_edges = fixed_extra_edge_lists[fixed_idx]
            if not used_edges:
                continue
            rows2.append(row2)
            cols2.append(ef_offset + fixed_idx)
            data2.append(1.0)
            for edge_idx in used_edges:
                rows2.append(row2)
                cols2.append(z_offset + int(edge_idx))
                data2.append(-1.0)
            lower2.append(-np.inf)
            upper2.append(0.0)
            row2 += 1

        for cand_idx in range(candidate_count):
            used_edges = candidate_extra_edge_lists[cand_idx]
            if not used_edges:
                continue
            rows2.append(row2)
            cols2.append(en_offset + cand_idx)
            data2.append(1.0)
            for edge_idx in used_edges:
                rows2.append(row2)
                cols2.append(z_offset + int(edge_idx))
                data2.append(-1.0)
            lower2.append(-np.inf)
            upper2.append(0.0)
            row2 += 1

    for cand_idx in np.flatnonzero(blocked_candidate_mask):
        rows2.append(row2)
        cols2.append(x_offset + int(cand_idx))
        data2.append(1.0)
        lower2.append(-np.inf)
        upper2.append(0.0)
        row2 += 1

    for cand_i, cand_j in candidate_conflict_pairs:
        rows2.extend([row2, row2])
        cols2.extend([x_offset + int(cand_i), x_offset + int(cand_j)])
        data2.extend([1.0, 1.0])
        lower2.append(-np.inf)
        upper2.append(1.0)
        row2 += 1

    uncovered_weight_row = row2
    for demand_idx, wt in enumerate(weights):
        rows2.append(row2)
        cols2.append(u_offset + demand_idx)
        data2.append(float(wt))
    lower2.append(-np.inf)
    upper2.append(0.0)
    row2 += 1

    stage2_A = sp.coo_matrix((data2, (rows2, cols2)), shape=(row2, n_vars)).tocsr()
    stage2_lower = np.asarray(lower2, dtype=np.float64)
    stage2_upper_template = np.asarray(upper2, dtype=np.float64)

    cost_integrality = np.zeros(n_vars, dtype=np.int8)
    if x_count:
        cost_integrality[x_offset:x_offset + x_count] = 1
    if ef_count:
        cost_integrality[ef_offset:ef_offset + ef_count] = 1
    if en_count:
        cost_integrality[en_offset:en_offset + en_count] = 1
    cost_integrality[u_offset:u_offset + u_count] = 1
    cost_lb = np.zeros(n_vars, dtype=np.float64)
    cost_ub = np.ones(n_vars, dtype=np.float64)

    c2 = np.zeros(n_vars, dtype=np.float64)
    if edge_count:
        c2[z_offset:z_offset + edge_count] = edge_cost

    cost_row = sp.csr_matrix(
        (edge_cost, ([0] * edge_count, np.arange(z_offset, z_offset + edge_count))),
        shape=(1, n_vars),
    ) if edge_count else sp.csr_matrix((1, n_vars))
    new_row = sp.csr_matrix(
        (np.ones(x_count, dtype=np.float64), ([0] * x_count, np.arange(x_offset, x_offset + x_count))),
        shape=(1, n_vars),
    ) if x_count else sp.csr_matrix((1, n_vars))

    return {
        'allow_exceptions': bool(allow_exceptions),
        'allow_exception_vars': allow_exception_vars,
        'candidate_count': candidate_count,
        'fixed_count': fixed_count,
        'demand_count': demand_count,
        'x_offset': x_offset,
        'x_count': x_count,
        'ef_offset': ef_offset,
        'ef_count': ef_count,
        'en_offset': en_offset,
        'en_count': en_count,
        'u_offset': u_offset,
        'u_count': u_count,
        'z_offset': z_offset,
        'n_vars': n_vars,
        'edge_count': edge_count,
        'stage1_A': stage1_A,
        'stage1_lower': stage1_lower,
        'stage1_upper': stage1_upper,
        'stage1_integrality': stage1_integrality,
        'stage1_lb': stage1_lb,
        'stage1_ub': stage1_ub,
        'stage2_A': stage2_A,
        'stage2_lower': stage2_lower,
        'stage2_upper_template': stage2_upper_template,
        'uncovered_weight_row': uncovered_weight_row,
        'cost_integrality': cost_integrality,
        'cost_lb': cost_lb,
        'cost_ub': cost_ub,
        'c2': c2,
        'cost_row': cost_row,
        'new_row': new_row,
        'blocked_candidate_count': int(np.sum(blocked_candidate_mask)),
        'candidate_conflict_count': int(len(candidate_conflict_pairs)),
        'candidate_conflict_pairs': candidate_conflict_pairs,
        'edge_demand_idx': edge_demand_idx,
        'edge_distance_km': edge_distance_km,
        'edge_site_kind': edge_site_kind,
        'edge_site_idx': edge_site_idx,
    }


def _get_or_build_highs_stage2_solver(prepared_model, params):
    if highspy is None:
        return None
    cached = prepared_model.get('_highs_stage2_solver')
    if cached is not None:
        return cached

    stage2_A_csc = prepared_model['stage2_A'].tocsc()
    lp = highspy.HighsLp()
    lp.num_col_ = int(prepared_model['n_vars'])
    lp.num_row_ = int(prepared_model['stage2_A'].shape[0])
    lp.col_cost_ = np.asarray(prepared_model['c2'], dtype=np.float64)
    lp.col_lower_ = np.asarray(prepared_model['cost_lb'], dtype=np.float64)
    lp.col_upper_ = np.asarray(prepared_model['cost_ub'], dtype=np.float64)
    lp.row_lower_ = np.asarray(prepared_model['stage2_lower'], dtype=np.float64)
    lp.row_upper_ = np.asarray(prepared_model['stage2_upper_template'], dtype=np.float64)
    lp.integrality_ = [
        highspy.HighsVarType.kInteger if int(v) else highspy.HighsVarType.kContinuous
        for v in np.asarray(prepared_model['cost_integrality'], dtype=np.int8)
    ]
    lp.a_matrix_.format_ = highspy.MatrixFormat.kColwise
    lp.a_matrix_.num_col_ = int(stage2_A_csc.shape[1])
    lp.a_matrix_.num_row_ = int(stage2_A_csc.shape[0])
    lp.a_matrix_.start_ = np.asarray(stage2_A_csc.indptr, dtype=np.int32)
    lp.a_matrix_.index_ = np.asarray(stage2_A_csc.indices, dtype=np.int32)
    lp.a_matrix_.value_ = np.asarray(stage2_A_csc.data, dtype=np.float64)

    solver = highspy.Highs()
    solver.setOptionValue('output_flag', False)
    solver.setOptionValue('log_to_console', False)
    solver.setOptionValue('mip_rel_gap', 0.0)
    solver.setOptionValue('mip_abs_gap', 0.0)
    threads = int(params.get('exact_highs_threads', max(1, os.cpu_count() or 1)) or max(1, os.cpu_count() or 1))
    solver.setOptionValue('threads', threads)
    status = solver.passModel(lp)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Failed to build native HiGHS model: status={status}")
    cost_row_csr = prepared_model['cost_row'].tocsr()
    cost_row_indices = np.asarray(cost_row_csr.indices, dtype=np.int32)
    cost_row_values = np.asarray(cost_row_csr.data, dtype=np.float64)
    status = solver.addRow(-np.inf, np.inf, len(cost_row_indices), cost_row_indices, cost_row_values)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Failed to add HiGHS cost tie-break row: status={status}")
    cost_row_idx = solver.getNumRow() - 1
    new_row_csr = prepared_model['new_row'].tocsr()
    new_row_indices = np.asarray(new_row_csr.indices, dtype=np.int32)
    new_row_values = np.asarray(new_row_csr.data, dtype=np.float64)
    status = solver.addRow(-np.inf, np.inf, len(new_row_indices), new_row_indices, new_row_values)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Failed to add HiGHS new-store tie-break row: status={status}")
    new_row_idx = solver.getNumRow() - 1
    prepared_model['_highs_stage2_solver'] = solver
    prepared_model['_highs_stage2_row_lower'] = np.asarray(lp.row_lower_, dtype=np.float64)
    prepared_model['_highs_stage2_row_upper_template'] = np.asarray(lp.row_upper_, dtype=np.float64)
    prepared_model['_highs_stage2_cost_template'] = np.asarray(lp.col_cost_, dtype=np.float64)
    prepared_model['_highs_cost_row_idx'] = int(cost_row_idx)
    prepared_model['_highs_new_row_idx'] = int(new_row_idx)
    return solver


def _set_highs_cost_vector(solver, cost_vec):
    col_idx = np.arange(len(cost_vec), dtype=np.int32)
    status = solver.changeColsCost(len(col_idx), col_idx, np.asarray(cost_vec, dtype=np.float64))
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Failed to set HiGHS objective coefficients: status={status}")


def _set_highs_solution_start(solver, solution_vec):
    if solution_vec is None:
        return
    indices = np.arange(len(solution_vec), dtype=np.int32)
    values = np.asarray(solution_vec, dtype=np.float64)
    status = solver.setSolution(len(indices), indices, values)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Failed to set HiGHS warm start: status={status}")


def _solve_exact_standard_stage1_highs(prepared_model, params, weights, scenario_name, progress_cb=None, warm_solution=None):
    solver = _get_or_build_highs_stage2_solver(prepared_model, params)
    if solver is None:
        return None
    row_lower = prepared_model['_highs_stage2_row_lower']
    row_upper = prepared_model['_highs_stage2_row_upper_template'].copy()
    row_upper[int(prepared_model['uncovered_weight_row'])] = np.inf
    row_idx = np.arange(len(row_upper), dtype=np.int32)
    status = solver.changeRowsBounds(len(row_idx), row_idx, row_lower, row_upper)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] failed to set HiGHS stage-1 row bounds: status={status}")
    extra_rows = np.asarray([prepared_model['_highs_cost_row_idx'], prepared_model['_highs_new_row_idx']], dtype=np.int32)
    extra_lower = np.asarray([-np.inf, -np.inf], dtype=np.float64)
    extra_upper = np.asarray([np.inf, np.inf], dtype=np.float64)
    status = solver.changeRowsBounds(len(extra_rows), extra_rows, extra_lower, extra_upper)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] failed to clear HiGHS tie-break bounds at stage 1: status={status}")
    c1 = np.zeros(int(prepared_model['n_vars']), dtype=np.float64)
    u_offset = int(prepared_model['u_offset'])
    u_count = int(prepared_model['u_count'])
    c1[u_offset:u_offset + u_count] = np.asarray(weights, dtype=np.float64)
    _set_highs_cost_vector(solver, c1)
    _set_highs_solution_start(solver, warm_solution)
    if progress_cb:
        progress_cb(f"Exact Standard [{scenario_name}]: solving stage 1 (native HiGHS)...")
    run_status = solver.run()
    if run_status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] HiGHS stage-1 run failed: status={run_status}")
    model_status = solver.getModelStatus()
    if model_status != highspy.HighsModelStatus.kOptimal:
        status_str = solver.modelStatusToString(model_status)
        raise RuntimeError(f"Exact Standard [{scenario_name}] HiGHS stage-1 did not reach optimality: {status_str}")
    solution = np.asarray(solver.getSolution().col_value, dtype=np.float64)
    uncovered_opt = float(np.dot(weights, solution[u_offset:u_offset + u_count]))
    return {
        'solution': solution,
        'uncovered_opt': uncovered_opt,
        'model_status': solver.modelStatusToString(model_status),
    }


def _solve_exact_standard_stage2_highs(prepared_model, params, uncovered_bound, scenario_name, progress_cb=None, warm_solution=None):
    solver = _get_or_build_highs_stage2_solver(prepared_model, params)
    if solver is None:
        return None
    row_lower = prepared_model['_highs_stage2_row_lower']
    row_upper = prepared_model['_highs_stage2_row_upper_template'].copy()
    row_upper[int(prepared_model['uncovered_weight_row'])] = float(uncovered_bound) + 1e-6
    row_idx = np.arange(len(row_upper), dtype=np.int32)
    status = solver.changeRowsBounds(len(row_idx), row_idx, row_lower, row_upper)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] failed to set HiGHS row bounds: status={status}")
    extra_rows = np.asarray([prepared_model['_highs_cost_row_idx'], prepared_model['_highs_new_row_idx']], dtype=np.int32)
    extra_lower = np.asarray([-np.inf, -np.inf], dtype=np.float64)
    extra_upper = np.asarray([np.inf, np.inf], dtype=np.float64)
    status = solver.changeRowsBounds(len(extra_rows), extra_rows, extra_lower, extra_upper)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] failed to clear HiGHS tie-break bounds at stage 2: status={status}")
    _set_highs_cost_vector(solver, prepared_model['_highs_stage2_cost_template'])
    _set_highs_solution_start(solver, warm_solution)
    if progress_cb:
        progress_cb(f"Exact Standard [{scenario_name}]: solving stage 2 (native HiGHS)...")
    run_status = solver.run()
    if run_status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] HiGHS run failed: status={run_status}")
    model_status = solver.getModelStatus()
    if model_status != highspy.HighsModelStatus.kOptimal:
        status_str = solver.modelStatusToString(model_status)
        raise RuntimeError(f"Exact Standard [{scenario_name}] HiGHS did not reach optimality: {status_str}")
    solution = np.asarray(solver.getSolution().col_value, dtype=np.float64)
    cost_opt = float(solver.getObjectiveValue())
    return {
        'solution': solution,
        'cost_opt': cost_opt,
        'model_status': solver.modelStatusToString(model_status),
    }


def _solve_exact_standard_tiebreak_highs(prepared_model, params, scenario_name, stage_label, objective_vec,
                                         uncovered_bound, cost_bound=None, new_store_bound=None,
                                         warm_solution=None, progress_cb=None):
    solver = _get_or_build_highs_stage2_solver(prepared_model, params)
    if solver is None:
        return None
    row_lower = prepared_model['_highs_stage2_row_lower']
    row_upper = prepared_model['_highs_stage2_row_upper_template'].copy()
    row_upper[int(prepared_model['uncovered_weight_row'])] = float(uncovered_bound) + 1e-6
    row_idx = np.arange(len(row_upper), dtype=np.int32)
    status = solver.changeRowsBounds(len(row_idx), row_idx, row_lower, row_upper)
    if status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] failed to reset HiGHS base bounds for {stage_label}: status={status}")

    extra_rows = []
    extra_lowers = []
    extra_uppers = []
    if cost_bound is not None:
        extra_rows.append(int(prepared_model['_highs_cost_row_idx']))
        extra_lowers.append(-np.inf)
        extra_uppers.append(float(cost_bound))
    if new_store_bound is not None:
        extra_rows.append(int(prepared_model['_highs_new_row_idx']))
        extra_lowers.append(-np.inf)
        extra_uppers.append(float(new_store_bound))
    if extra_rows:
        status = solver.changeRowsBounds(
            len(extra_rows),
            np.asarray(extra_rows, dtype=np.int32),
            np.asarray(extra_lowers, dtype=np.float64),
            np.asarray(extra_uppers, dtype=np.float64),
        )
        if status != highspy.HighsStatus.kOk:
            raise RuntimeError(f"Exact Standard [{scenario_name}] failed to set HiGHS tie-break bounds for {stage_label}: status={status}")

    _set_highs_cost_vector(solver, objective_vec)
    _set_highs_solution_start(solver, warm_solution)
    if progress_cb:
        progress_cb(f"Exact Standard [{scenario_name}]: solving {stage_label} (native HiGHS)...")
    run_status = solver.run()
    if run_status != highspy.HighsStatus.kOk:
        raise RuntimeError(f"Exact Standard [{scenario_name}] HiGHS run failed at {stage_label}: status={run_status}")
    model_status = solver.getModelStatus()
    if model_status != highspy.HighsModelStatus.kOptimal:
        status_str = solver.modelStatusToString(model_status)
        raise RuntimeError(f"Exact Standard [{scenario_name}] HiGHS did not reach optimality at {stage_label}: {status_str}")
    solution = np.asarray(solver.getSolution().col_value, dtype=np.float64)
    return {
        'solution': solution,
        'model_status': solver.modelStatusToString(model_status),
    }


def _load_or_build_prepared_exact_scenario_model(scope_grid, fixed_sites, candidate_sites, coverage_sets, params, allow_exceptions, spacing_conflicts=None, progress_cb=None, benchmark_fingerprint=None):
    graph_cache_path = _exact_graph_cache_path(scope_grid, fixed_sites, candidate_sites, params, allow_exceptions=True)
    spacing_fingerprint = _exact_spacing_conflict_fingerprint(spacing_conflicts)
    cache_path = _exact_prepared_model_cache_path(graph_cache_path, params, allow_exceptions, spacing_fingerprint=spacing_fingerprint)
    if os.path.exists(cache_path):
        if progress_cb:
            progress_cb(f"Exact Standard: loading prepared solver model {os.path.basename(cache_path)}")
        with open(cache_path, 'rb') as f:
            payload = pickle.load(f)
        if (
            payload.get('_prepared_model_version') == 2 and
            payload.get('_spacing_conflict_fingerprint') == spacing_fingerprint and
            (benchmark_fingerprint is None or payload.get('_benchmark_fingerprint') == benchmark_fingerprint)
        ):
            return payload
        if progress_cb:
            progress_cb("Exact Standard: prepared solver model cache fingerprint mismatch, rebuilding...")
    if progress_cb:
        mode = 'exception' if allow_exceptions else 'strict'
        progress_cb(f"Exact Standard: preparing {mode} solver model cache...")
    prepared = _build_prepared_exact_scenario_model(scope_grid, fixed_sites, candidate_sites, coverage_sets, params, allow_exceptions, spacing_conflicts=spacing_conflicts)
    prepared['_prepared_model_version'] = 2
    prepared['_spacing_conflict_fingerprint'] = spacing_fingerprint
    prepared['_benchmark_fingerprint'] = benchmark_fingerprint
    with open(cache_path, 'wb') as f:
        pickle.dump(prepared, f, protocol=pickle.HIGHEST_PROTOCOL)
    return prepared


def _annotate_exact_solution_site_usage(prepared_model, final_solution, weights, fixed_sites, candidate_sites):
    edge_count = int(prepared_model.get('edge_count', 0) or 0)
    z_offset = int(prepared_model.get('z_offset', 0) or 0)
    if edge_count <= 0:
        return [dict(site) for site in fixed_sites], [dict(site) for site in candidate_sites]

    edge_usage = np.asarray(final_solution[z_offset:z_offset + edge_count], dtype=np.float64)
    edge_demand_idx = np.asarray(prepared_model.get('edge_demand_idx', np.empty(0, dtype=np.int32)), dtype=np.int32)
    edge_distance_km = np.asarray(prepared_model.get('edge_distance_km', np.empty(0, dtype=np.float64)), dtype=np.float64)
    edge_site_kind = np.asarray(prepared_model.get('edge_site_kind', np.empty(0, dtype=np.int8)), dtype=np.int8)
    edge_site_idx = np.asarray(prepared_model.get('edge_site_idx', np.empty(0, dtype=np.int32)), dtype=np.int32)
    if not (
        len(edge_usage) == len(edge_demand_idx) == len(edge_distance_km) == len(edge_site_kind) == len(edge_site_idx)
    ):
        return [dict(site) for site in fixed_sites], [dict(site) for site in candidate_sites]

    fixed_out = [dict(site) for site in fixed_sites]
    cand_out = [dict(site) for site in candidate_sites]
    fixed_orders = np.zeros(len(fixed_out), dtype=np.float64)
    cand_orders = np.zeros(len(cand_out), dtype=np.float64)
    fixed_cells = np.zeros(len(fixed_out), dtype=np.int32)
    cand_cells = np.zeros(len(cand_out), dtype=np.int32)
    fixed_dist = np.zeros(len(fixed_out), dtype=np.float64)
    cand_dist = np.zeros(len(cand_out), dtype=np.float64)

    active_mask = edge_usage > 1e-8
    for edge_idx in np.flatnonzero(active_mask):
        usage = float(edge_usage[int(edge_idx)])
        demand_idx = int(edge_demand_idx[int(edge_idx)])
        site_kind = int(edge_site_kind[int(edge_idx)])
        site_idx = int(edge_site_idx[int(edge_idx)])
        assigned_orders = float(weights[demand_idx]) * usage
        assigned_dist = float(edge_distance_km[int(edge_idx)]) * assigned_orders
        if site_kind == 0 and 0 <= site_idx < len(fixed_out):
            fixed_orders[site_idx] += assigned_orders
            fixed_cells[site_idx] += 1
            fixed_dist[site_idx] += assigned_dist
        elif site_kind == 1 and 0 <= site_idx < len(cand_out):
            cand_orders[site_idx] += assigned_orders
            cand_cells[site_idx] += 1
            cand_dist[site_idx] += assigned_dist

    for site_idx, site in enumerate(fixed_out):
        site['orders_per_day'] = round(float(fixed_orders[site_idx]), 2)
        site['cells'] = int(fixed_cells[site_idx])
        site['avg_assigned_distance_km'] = round(
            float(fixed_dist[site_idx] / fixed_orders[site_idx]), 4
        ) if fixed_orders[site_idx] > 1e-8 else None
    for site_idx, site in enumerate(cand_out):
        site['orders_per_day'] = round(float(cand_orders[site_idx]), 2)
        site['cells'] = int(cand_cells[site_idx])
        site['avg_assigned_distance_km'] = round(
            float(cand_dist[site_idx] / cand_orders[site_idx]), 4
        ) if cand_orders[site_idx] > 1e-8 else None
    return fixed_out, cand_out


def _solve_exact_standard_scenario(scope_grid, fixed_sites, candidate_sites, coverage_sets, params,
                                   scenario_name, target_coverage_pct=100.0, allow_exceptions=False,
                                   progress_cb=None, prepared_model=None, initial_warm_solution=None):
    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    total_orders = float(np.sum(weights))
    if total_orders <= 0:
        raise ValueError("Exact Standard solver requires positive in-scope demand.")
    demand_count = len(scope_grid)
    if prepared_model is None:
        prepared_model = _build_prepared_exact_scenario_model(
            scope_grid, fixed_sites, candidate_sites, coverage_sets, params, allow_exceptions
        )

    candidate_count = int(prepared_model['candidate_count'])
    fixed_count = int(prepared_model['fixed_count'])
    allow_exception_vars = bool(prepared_model['allow_exception_vars'])
    x_offset = int(prepared_model['x_offset'])
    x_count = int(prepared_model['x_count'])
    ef_offset = int(prepared_model['ef_offset'])
    ef_count = int(prepared_model['ef_count'])
    en_offset = int(prepared_model['en_offset'])
    en_count = int(prepared_model['en_count'])
    u_offset = int(prepared_model['u_offset'])
    u_count = int(prepared_model['u_count'])
    z_offset = int(prepared_model['z_offset'])
    n_vars = int(prepared_model['n_vars'])
    edge_count = int(prepared_model['edge_count'])

    stage1_constraints = [
        LinearConstraint(
            prepared_model['stage1_A'],
            prepared_model['stage1_lower'],
            prepared_model['stage1_upper'],
        )
    ]
    stage1_integrality = prepared_model['stage1_integrality']
    stage1_bounds = Bounds(prepared_model['stage1_lb'], prepared_model['stage1_ub'])

    target_uncovered = total_orders * max(0.0, 1.0 - float(target_coverage_pct) / 100.0)
    tol = 1e-6

    def solve_stage(c_vec, extra_constraints, stage_label):
        if progress_cb:
            progress_cb(f"Exact Standard [{scenario_name}]: solving {stage_label}...")
        res = milp(
            c=np.asarray(c_vec, dtype=np.float64),
            integrality=stage1_integrality,
            bounds=stage1_bounds,
            constraints=stage1_constraints + list(extra_constraints),
            options={'disp': False},
        )
        if res.status not in (0, 1) or res.x is None:
            raise RuntimeError(f"Exact Standard MILP failed at {stage_label}: status={res.status}, message={res.message}")
        return res

    c1 = np.zeros(u_offset + u_count, dtype=np.float64)
    c1[u_offset:u_offset + u_count] = weights
    stage1_highs_result = None
    stage1_backend = 'scipy'
    solver_backend = str(params.get('exact_solver_backend', 'auto') or 'auto').strip().lower()
    prefer_highs = solver_backend in ('auto', 'highs', 'native_highs')
    if prefer_highs and highspy is not None:
        try:
            stage1_highs_result = _solve_exact_standard_stage1_highs(
                prepared_model,
                params,
                weights,
                scenario_name,
                progress_cb=progress_cb,
                warm_solution=initial_warm_solution,
            )
            stage1 = type('StageResult', (), {'x': stage1_highs_result['solution']})()
            uncovered_opt = float(stage1_highs_result['uncovered_opt'])
            stage1_backend = 'highspy'
        except Exception as e:
            if progress_cb:
                progress_cb(f"Exact Standard [{scenario_name}]: native HiGHS stage-1 fallback to SciPy ({e})")
    if stage1_highs_result is None:
        stage1 = solve_stage(c1, [], 'stage 1 (maximize coverage)')
        uncovered_opt = float(np.dot(weights, stage1.x[u_offset:u_offset + u_count]))
        stage1_backend = 'scipy'
    target_feasible = uncovered_opt <= target_uncovered + 1e-4
    if target_feasible:
        uncovered_bound = target_uncovered if target_coverage_pct < 100.0 else 0.0
    else:
        uncovered_bound = uncovered_opt

    stage2_upper = prepared_model['stage2_upper_template'].copy()
    stage2_upper[int(prepared_model['uncovered_weight_row'])] = uncovered_bound + tol
    stage2_constraints_base = [
        LinearConstraint(
            prepared_model['stage2_A'],
            prepared_model['stage2_lower'],
            stage2_upper,
        )
    ]
    cost_integrality = prepared_model['cost_integrality']
    cost_bounds = Bounds(prepared_model['cost_lb'], prepared_model['cost_ub'])

    def solve_cost_stage(c_vec, extra_constraints, stage_label):
        if progress_cb:
            progress_cb(f"Exact Standard [{scenario_name}]: solving {stage_label}...")
        res = milp(
            c=np.asarray(c_vec, dtype=np.float64),
            integrality=cost_integrality,
            bounds=cost_bounds,
            constraints=stage2_constraints_base + list(extra_constraints),
            options={'disp': False},
        )
        if res.status not in (0, 1) or res.x is None:
            raise RuntimeError(f"Exact Standard MILP failed at {stage_label}: status={res.status}, message={res.message}")
        return res

    c2 = prepared_model['c2']
    stage2_component_meta = None
    stage2_backend = 'scipy'
    if prefer_highs and highspy is not None:
        try:
            highs_result = _solve_exact_standard_stage2_highs(
                prepared_model,
                params,
                uncovered_bound,
                scenario_name,
                progress_cb=progress_cb,
                warm_solution=stage1.x,
            )
            stage2 = type('StageResult', (), {'x': highs_result['solution']})()
            cost_opt = float(highs_result['cost_opt'])
            stage2_backend = 'highspy'
        except Exception as e:
            if progress_cb:
                progress_cb(f"Exact Standard [{scenario_name}]: native HiGHS fallback to alternate exact solve ({e})")
    if stage2_backend != 'highspy':
        use_component_stage2 = bool(
            params.get('exact_component_decomposition_enabled', True)
            and uncovered_bound <= tol
            and candidate_count > 0
        )
        if use_component_stage2:
            stage2_component_meta = _solve_exact_stage2_by_components(
                scope_grid,
                fixed_sites,
                candidate_sites,
                coverage_sets,
                params,
                allow_exceptions,
                prepared_model,
                scenario_name,
                progress_cb=progress_cb,
            )
        if stage2_component_meta is not None:
            stage2_solution = stage2_component_meta['solution']
            cost_opt = float(stage2_component_meta['cost_opt'])
            stage2 = type('StageResult', (), {'x': stage2_solution})()
            stage2_backend = 'component_exact'
        else:
            stage2 = solve_cost_stage(c2, [], 'stage 2 (minimize last-mile cost)')
            cost_opt = float(np.dot(c2, stage2.x))
            stage2_backend = 'scipy'
    tiebreak_mode = params.get('exact_enable_tiebreak_milps', 'auto')
    tiebreak_edge_limit = int(params.get('exact_tiebreak_edge_limit', 2_000_000) or 2_000_000)
    run_tiebreaks = bool(tiebreak_mode is True or str(tiebreak_mode).lower() in ('1', 'true', 'yes', 'on'))
    if str(tiebreak_mode).lower() == 'auto':
        run_tiebreaks = edge_count <= tiebreak_edge_limit

    final_solution = stage2.x
    new_store_opt = float(np.sum(stage2.x[x_offset:x_offset + x_count])) if x_count else 0.0
    exception_opt = float(
        (np.sum(stage2.x[ef_offset:ef_offset + ef_count]) if ef_count else 0.0)
        + (np.sum(stage2.x[en_offset:en_offset + en_count]) if en_count else 0.0)
    )
    stage3_status = 'skipped'
    stage4_status = 'skipped'
    stage3_backend = 'none'
    stage4_backend = 'none'

    if run_tiebreaks:
        cost_bound = cost_opt + max(1e-6, abs(cost_opt) * 1e-8)

        c3 = np.zeros(n_vars, dtype=np.float64)
        if x_count:
            c3[x_offset:x_offset + x_count] = 1.0
        if stage2_backend == 'highspy':
            stage3_result = _solve_exact_standard_tiebreak_highs(
                prepared_model,
                params,
                scenario_name,
                'stage 3 (minimize new stores)',
                c3,
                uncovered_bound,
                cost_bound=cost_bound,
                warm_solution=final_solution,
                progress_cb=progress_cb,
            )
            stage3 = type('StageResult', (), {'x': stage3_result['solution']})()
            stage3_backend = 'highspy'
        else:
            extra_stage3 = [LinearConstraint(prepared_model['cost_row'], -np.inf, cost_bound)]
            stage3 = solve_cost_stage(c3, extra_stage3, 'stage 3 (minimize new stores)')
            stage3_backend = 'scipy'
        final_solution = stage3.x
        new_store_opt = float(np.sum(stage3.x[x_offset:x_offset + x_count])) if x_count else 0.0
        stage3_status = 'solved'

        c4 = np.zeros(n_vars, dtype=np.float64)
        if ef_count:
            c4[ef_offset:ef_offset + ef_count] = 1.0
        if en_count:
            c4[en_offset:en_offset + en_count] = 1.0
        if stage2_backend == 'highspy':
            stage4_result = _solve_exact_standard_tiebreak_highs(
                prepared_model,
                params,
                scenario_name,
                'stage 4 (minimize exception hubs)',
                c4,
                uncovered_bound,
                cost_bound=cost_bound,
                new_store_bound=new_store_opt + tol,
                warm_solution=final_solution,
                progress_cb=progress_cb,
            )
            stage4 = type('StageResult', (), {'x': stage4_result['solution']})()
            stage4_backend = 'highspy'
        else:
            extra_stage4 = [LinearConstraint(prepared_model['cost_row'], -np.inf, cost_bound)]
            extra_stage4.append(LinearConstraint(prepared_model['new_row'], -np.inf, new_store_opt + tol))
            stage4 = solve_cost_stage(c4, extra_stage4, 'stage 4 (minimize exception hubs)')
            stage4_backend = 'scipy'
        final_solution = stage4.x
        exception_opt = float(
            (np.sum(stage4.x[ef_offset:ef_offset + ef_count]) if ef_count else 0.0)
            + (np.sum(stage4.x[en_offset:en_offset + en_count]) if en_count else 0.0)
        )
        stage4_status = 'solved'

    annotated_fixed_sites, annotated_candidate_sites = _annotate_exact_solution_site_usage(
        prepared_model,
        final_solution,
        weights,
        fixed_sites,
        candidate_sites,
    )

    chosen_new = []
    for cand_idx, site in enumerate(annotated_candidate_sites):
        if final_solution[x_offset + cand_idx] <= 0.5:
            continue
        site_obj = dict(site)
        site_obj.update({
            'radius_km': float(params.get('standard_ds_radius', 3.0) or 3.0),
            'planning_order': len(chosen_new) + 1,
            'selection': 'exact_milp_candidate',
        })
        if allow_exception_vars and final_solution[en_offset + cand_idx] > 0.5:
            site_obj['exception_standard'] = True
            site_obj['base_radius_km'] = float(params.get('standard_ds_radius', 3.0) or 3.0)
            site_obj['radius_km'] = float(params.get('standard_exception_radius_km', 5.0) or 5.0)
        chosen_new.append(site_obj)

    fixed_sites_out = [dict(site) for site in annotated_fixed_sites]
    if allow_exception_vars:
        for fixed_idx, site in enumerate(fixed_sites_out):
            if final_solution[ef_offset + fixed_idx] > 0.5:
                site['exception_standard'] = True
                site['base_radius_km'] = float(params.get('standard_ds_radius', 3.0) or 3.0)
                site['radius_km'] = float(params.get('standard_exception_radius_km', 5.0) or 5.0)

    uncovered_mask = final_solution[u_offset:u_offset + u_count] > 1e-5
    covered_mask = ~uncovered_mask
    coverage_pct = 100.0 * float(np.sum(weights[covered_mask])) / max(total_orders, 1e-9)

    return {
        'scenario_name': scenario_name,
        'target_coverage_pct': float(target_coverage_pct),
        'allow_exceptions': bool(allow_exceptions),
        'target_feasible': bool(target_feasible),
        'fixed_sites': fixed_sites_out,
        'new_sites': chosen_new,
        'all_sites': fixed_sites_out + chosen_new,
        'covered_mask': covered_mask,
        'stage_solution_vector': np.asarray(final_solution, dtype=np.float64),
        'coverage_pct': round(coverage_pct, 2),
        'uncovered_orders_per_day': round(float(np.sum(weights[uncovered_mask])), 2),
        'new_store_count': int(round(new_store_opt)),
        'exception_hub_count': int(round(exception_opt)),
        'optimized_last_mile_cost_per_day': round(cost_opt, 4),
        'solver_summary': {
            'objective_order': [
                'maximize_coverage',
                'minimize_last_mile_cost',
                'minimize_new_standard_stores',
                'minimize_exception_standard_hubs',
            ],
            'stage_1_uncovered_orders_per_day': round(uncovered_opt, 4),
            'stage_1_backend': stage1_backend,
            'stage_2_optimized_last_mile_cost_per_day': round(cost_opt, 4),
            'stage_3_new_store_count': int(round(new_store_opt)),
            'stage_4_exception_hub_count': int(round(exception_opt)),
            'tiebreak_milps_mode': str(tiebreak_mode),
            'tiebreak_edge_limit': int(tiebreak_edge_limit),
            'stage_3_status': stage3_status,
            'stage_4_status': stage4_status,
            'stage_3_backend': stage3_backend,
            'stage_4_backend': stage4_backend,
            'exact_within_candidate_pool': True,
            'assignment_model': 'sparse_continuous_flow_over_feasible_edges',
            'stage_2_backend': stage2_backend,
            'stage_2_component_decomposition_used': bool(stage2_component_meta is not None),
            'stage_2_component_count': int((stage2_component_meta or {}).get('component_count', 0)),
        },
    }


def _local_refinement_search_points(site, local_grid, service_radius_km, params):
    refine_step_km = float(params.get('exact_refinement_step_km', 0.2) or 0.2)
    search_radius_km = float(params.get('exact_refinement_search_radius_km', 0.6) or 0.6)
    site_lat = float(site['lat'])
    site_lon = float(site['lon'])
    points = [(site_lat, site_lon)]
    if local_grid is None or len(local_grid) == 0:
        return points

    weights = local_grid['orders_per_day'].values.astype(np.float64)
    lats = local_grid['avg_cust_lat'].values.astype(np.float64)
    lons = local_grid['avg_cust_lon'].values.astype(np.float64)
    total_w = float(np.sum(weights))
    if total_w > 0:
        centroid_lat = float(np.average(lats, weights=weights))
        centroid_lon = float(np.average(lons, weights=weights))
        points.append((centroid_lat, centroid_lon))

    top_local = local_grid.nlargest(min(3, len(local_grid)), 'orders_per_day')
    for _, row in top_local.iterrows():
        points.append((float(row['avg_cust_lat']), float(row['avg_cust_lon'])))

    ref_lat = float(np.mean([site_lat] + [p[0] for p in points]))
    center_lat = points[1][0] if len(points) > 1 else site_lat
    center_lon = points[1][1] if len(points) > 1 else site_lon
    center_xy = _latlon_to_xy_km([center_lat], [center_lon], ref_lat=ref_lat)[0]
    for dx in (-search_radius_km, 0.0, search_radius_km):
        for dy in (-search_radius_km, 0.0, search_radius_km):
            if dx == 0.0 and dy == 0.0:
                continue
            if abs(dx) > search_radius_km + 1e-9 or abs(dy) > search_radius_km + 1e-9:
                continue
            lat, lon = _xy_km_to_latlon(center_xy[0] + dx, center_xy[1] + dy, ref_lat=ref_lat)
            points.append((float(lat), float(lon)))

    dedup = []
    seen = set()
    for lat, lon in points:
        key = (round(lat, 6), round(lon, 6))
        if key in seen:
            continue
        seen.add(key)
        dedup.append((lat, lon))
    return dedup


def _evaluate_local_refinement_candidate(site_lat, site_lon, local_grid, params):
    if local_grid is None or len(local_grid) == 0:
        return None
    weights = local_grid['orders_per_day'].values.astype(np.float64)
    demand_lats = local_grid['avg_cust_lat'].values.astype(np.float64)
    demand_lons = local_grid['avg_cust_lon'].values.astype(np.float64)
    dists = osrm_one_to_many(site_lat, site_lon, demand_lats, demand_lons)
    base_cost = float(params.get('standard_base_cost', 29) or 29)
    var_rate = float(params.get('standard_variable_rate', 9) or 9)
    service_radius_km = float(params.get('standard_ds_radius', 3.0) or 3.0)
    cover_mask = np.isfinite(dists) & (dists <= service_radius_km + 1e-6)
    covered_orders = float(np.sum(weights[cover_mask]))
    cost_per_day = float(np.sum(weights[cover_mask] * (base_cost + var_rate * dists[cover_mask])))
    return {
        'lat': float(site_lat),
        'lon': float(site_lon),
        'covered_orders_per_day': round(covered_orders, 4),
        'local_cost_per_day': round(cost_per_day, 4),
        'mean_distance_km': round(float(np.average(dists[cover_mask], weights=weights[cover_mask])) if np.any(cover_mask) else np.inf, 4),
    }


def _refine_standard_sites_locally(scope_grid, scenario, params, progress_cb=None):
    new_sites = list(scenario.get('new_sites') or [])
    if not new_sites:
        return {
            'enabled': True,
            'site_count': 0,
            'improved_site_count': 0,
            'recommendations': [],
        }

    refine_radius_km = float(params.get('exact_refinement_local_demand_radius_km', 1.5) or 1.5)
    site_lats = scope_grid['avg_cust_lat'].values.astype(np.float64)
    site_lons = scope_grid['avg_cust_lon'].values.astype(np.float64)
    site_weights = scope_grid['orders_per_day'].values.astype(np.float64)
    recommendations = []
    improved = 0

    for idx, site in enumerate(new_sites, start=1):
        ref_lat = float(site['lat'])
        ref_lon = float(site['lon'])
        xy = _latlon_to_xy_km(site_lats, site_lons, ref_lat=ref_lat)
        site_xy = _latlon_to_xy_km([ref_lat], [ref_lon], ref_lat=ref_lat)[0]
        local_mask = ((xy[:, 0] - site_xy[0]) ** 2 + (xy[:, 1] - site_xy[1]) ** 2) <= refine_radius_km ** 2
        local_grid = scope_grid.loc[local_mask].copy()
        if len(local_grid) == 0:
            continue

        baseline = _evaluate_local_refinement_candidate(ref_lat, ref_lon, local_grid, params)
        if baseline is None:
            continue

        search_points = _local_refinement_search_points(site, local_grid, float(site.get('radius_km', params.get('standard_ds_radius', 3.0))), params)
        best = baseline
        for cand_lat, cand_lon in search_points:
            candidate = _evaluate_local_refinement_candidate(cand_lat, cand_lon, local_grid, params)
            if candidate is None:
                continue
            if candidate['covered_orders_per_day'] + 1e-6 < baseline['covered_orders_per_day']:
                continue
            if candidate['local_cost_per_day'] + 1e-6 < best['local_cost_per_day']:
                best = candidate

        moved = abs(best['lat'] - ref_lat) > 1e-6 or abs(best['lon'] - ref_lon) > 1e-6
        if moved and best['local_cost_per_day'] + 1e-6 < baseline['local_cost_per_day']:
            improved += 1
        recommendations.append({
            'site_id': site.get('id'),
            'planning_order': site.get('planning_order'),
            'original_lat': round(ref_lat, 6),
            'original_lon': round(ref_lon, 6),
            'refined_lat': round(best['lat'], 6),
            'refined_lon': round(best['lon'], 6),
            'moved': bool(moved),
            'local_refinement_applied': bool(moved and best['local_cost_per_day'] + 1e-6 < baseline['local_cost_per_day']),
            'local_covered_orders_before': baseline['covered_orders_per_day'],
            'local_covered_orders_after': best['covered_orders_per_day'],
            'local_cost_per_day_before': baseline['local_cost_per_day'],
            'local_cost_per_day_after': best['local_cost_per_day'],
            'local_cost_delta_per_day': round(best['local_cost_per_day'] - baseline['local_cost_per_day'], 4),
            'local_mean_distance_before_km': baseline['mean_distance_km'],
            'local_mean_distance_after_km': best['mean_distance_km'],
        })
        if progress_cb and idx % 10 == 0:
            progress_cb(f"Exact Standard [{scenario.get('scenario_name', 'unknown')}]: local refinement {idx}/{len(new_sites)} new sites")

    return {
        'enabled': True,
        'site_count': len(new_sites),
        'improved_site_count': improved,
        'recommendations': recommendations,
    }


def build_exact_standard_graph_cache(params, progress_cb=None):
    require_osrm()
    params = normalize_placement_params(params)
    in_scope_grid, out_scope_grid, business_regions, excluded_islands, scope_summary = _resolve_scope_grid_and_regions(params)
    if in_scope_grid is None or len(in_scope_grid) == 0:
        raise ValueError("No in-scope demand found. Load order data and business polygons first.")

    fixed_sites = _build_fixed_standard_sites(params)
    if progress_cb:
        progress_cb("Exact Standard graph build: building candidate pool from in-scope demand cells...")
    candidate_pool = _build_exact_standard_candidate_pool(in_scope_grid, fixed_sites, params, progress_cb=progress_cb)
    candidate_sites = candidate_pool['sites']
    cache_path = _exact_graph_cache_path(in_scope_grid, fixed_sites, candidate_sites, params, allow_exceptions=True)

    started_at = time.time()
    superset_graph = _load_or_build_exact_standard_superset_graph(
        in_scope_grid,
        fixed_sites,
        candidate_sites,
        params,
        progress_cb=progress_cb,
    )
    elapsed = time.time() - started_at
    edge_count = sum(len(x) for x in superset_graph.get('fixed_edges', [])) + sum(len(x) for x in superset_graph.get('candidate_edges', []))
    return {
        'mode': 'exact_standard_graph_build',
        'cache_path': cache_path,
        'cache_exists': os.path.exists(cache_path),
        'graph_max_radius_km': float(superset_graph.get('graph_max_radius_km', _exact_graph_max_radius_km(params, allow_exceptions=True))),
        'candidate_pool_summary': candidate_pool['summary'],
        'scope_summary': scope_summary,
        'fixed_store_count': len(fixed_sites),
        'candidate_site_count': len(candidate_sites),
        'total_feasible_edges': int(edge_count),
        'build_seconds': round(elapsed, 2),
    }


def exact_standard_benchmark_readiness_report(params, progress_cb=None):
    require_osrm()
    params = normalize_placement_params(params)
    in_scope_grid, _out_scope_grid, _business_regions, _excluded_islands, scope_summary = _resolve_scope_grid_and_regions(params)
    if in_scope_grid is None or len(in_scope_grid) == 0:
        raise ValueError("No in-scope demand found. Load order data and business polygons first.")

    fixed_sites = _build_fixed_standard_sites(params)
    fingerprint = _exact_benchmark_fingerprint(in_scope_grid, fixed_sites, params)
    candidate_pool = _build_exact_standard_candidate_pool(in_scope_grid, fixed_sites, params, progress_cb=progress_cb)
    candidate_sites = candidate_pool['sites']
    graph_cache_path = _exact_graph_cache_path(
        in_scope_grid,
        fixed_sites,
        candidate_sites,
        params,
        allow_exceptions=True,
    )
    spacing_cache_path = _exact_spacing_conflict_cache_path(fixed_sites, candidate_sites, params)
    spacing_conflicts = _build_exact_standard_spacing_conflicts(
        fixed_sites,
        candidate_sites,
        params,
        progress_cb=progress_cb,
    )
    spacing_fingerprint = _exact_spacing_conflict_fingerprint(spacing_conflicts)
    fixed_fixed_warnings = _scan_fixed_store_spacing_warnings(fixed_sites, params)
    scenario_names = [
        'strict_3km_100',
        'strict_3km_99_7',
        'exceptions_up_to_5km_100',
    ]
    scenario_checkpoints = {}
    for name in scenario_names:
        path = _exact_scenario_checkpoint_path(graph_cache_path, name, params, spacing_fingerprint=spacing_fingerprint)
        scenario_checkpoints[name] = {
            'path': path,
            'exists': bool(os.path.exists(path)),
        }
    graph_cache_exists = bool(os.path.exists(graph_cache_path))
    spacing_cache_exists = bool(os.path.exists(spacing_cache_path))
    ready_to_run = bool(graph_cache_exists and spacing_cache_exists and spacing_fingerprint not in (None, '', 'none'))

    return {
        'mode': 'exact_standard_benchmark_readiness',
        'benchmark_fingerprint': fingerprint,
        'scope_summary': scope_summary,
        'fixed_store_count': len(fixed_sites),
        'candidate_pool_summary': candidate_pool['summary'],
        'graph_cache': {
            'path': graph_cache_path,
            'exists': bool(os.path.exists(graph_cache_path)),
            'graph_max_radius_km': float(_exact_graph_max_radius_km(params, allow_exceptions=True)),
        },
        'spacing_conflicts': {
            'path': spacing_cache_path,
            'exists': spacing_cache_exists,
            'spacing_km': spacing_conflicts.get('spacing_km'),
            'distance_rule': spacing_conflicts.get('distance_rule', 'unknown'),
            'fingerprint': spacing_fingerprint,
            'blocked_candidate_count': int(spacing_conflicts.get('blocked_candidate_count', 0)),
            'candidate_conflict_count': int(spacing_conflicts.get('candidate_conflict_count', 0)),
        },
        'fixed_fixed_spacing_warnings': {
            'count': len(fixed_fixed_warnings),
            'examples': fixed_fixed_warnings[:10],
            'policy_note': 'Fixed-fixed spacing violations are legacy exceptions from the frozen 103-store network. The 3 km rule applies only to new-vs-fixed and new-vs-new Standard placements.',
        },
        'scenario_checkpoints': scenario_checkpoints,
        'ready_to_run': ready_to_run,
    }


def _compute_current_baseline_cache(grid_data, existing_stores, params, progress_cb=None):
    cache_enabled = bool(params.get('exact_current_baseline_cache_enabled', True))
    cache_path = _exact_baseline_cache_path(grid_data, existing_stores, params)
    if cache_enabled and os.path.exists(cache_path):
        if progress_cb:
            progress_cb(f"Exact Standard benchmark: loading cached current baseline {os.path.basename(cache_path)}")
        with open(cache_path, 'rb') as f:
            return pickle.load(f)
    base_cost = params.get('base_cost', 29)
    var_rate = params.get('variable_rate', 9)
    weights = grid_data['orders_per_day'].values
    cust_lats = grid_data['avg_cust_lat'].values
    cust_lons = grid_data['avg_cust_lon'].values
    store_lats = grid_data['avg_store_lat'].values if 'avg_store_lat' in grid_data.columns else np.full(len(grid_data), np.nan)
    store_lons = grid_data['avg_store_lon'].values if 'avg_store_lon' in grid_data.columns else np.full(len(grid_data), np.nan)
    has_assigned_current_stores = np.isfinite(store_lats).all() and np.isfinite(store_lons).all()

    if progress_cb:
        progress_cb("Exact Standard benchmark: precomputing current baseline once...")
    if has_assigned_current_stores:
        current_dists = osrm_pairwise_distances_parallel(
            cust_lats, cust_lons, store_lats, store_lons,
            progress_cb=lambda d, t: progress_cb(f"Current baseline cache: {d}/{t} batches") if progress_cb else None
        )
    elif existing_stores:
        current_dists = osrm_min_distances_parallel(
            cust_lats, cust_lons,
            np.array([float(s['lat']) for s in existing_stores], dtype=np.float64),
            np.array([float(s['lon']) for s in existing_stores], dtype=np.float64),
            progress_cb=lambda done, total: progress_cb(f"Current baseline cache: {done}/{total} batches") if progress_cb else None
        )
    else:
        raise ValueError("Cannot compute current baseline cache: no assigned current stores and no fixed stores loaded.")

    current_costs = base_cost + var_rate * current_dists
    current_avg_dist = float(np.average(current_dists, weights=weights))
    current_avg_cost = float(np.average(current_costs, weights=weights))
    current_policy = _build_current_policy_breach_summary(grid_data, current_dists, weights, params)
    result = {
        'current_dists': current_dists,
        'current_costs': current_costs,
        'current_avg_dist': current_avg_dist,
        'current_avg_cost': current_avg_cost,
        'current_policy': current_policy,
    }
    if cache_enabled:
        with open(cache_path, 'wb') as f:
            pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
    return result


def _write_exact_scenario_checkpoint(name, payload, graph_cache_path, params, spacing_fingerprint='none', benchmark_fingerprint=None):
    checkpoint_path = _exact_scenario_checkpoint_path(graph_cache_path, name, params, spacing_fingerprint=spacing_fingerprint)
    serializable = dict(payload)
    serializable['_checkpoint_version'] = 3
    serializable['_spacing_conflict_fingerprint'] = spacing_fingerprint
    serializable['_benchmark_fingerprint'] = benchmark_fingerprint
    if isinstance(serializable.get('covered_mask'), np.ndarray):
        serializable['covered_mask'] = serializable['covered_mask'].astype(bool)
    with open(checkpoint_path, 'wb') as f:
        pickle.dump(serializable, f, protocol=pickle.HIGHEST_PROTOCOL)
    return checkpoint_path


def _load_exact_scenario_checkpoint(name, graph_cache_path, params, spacing_fingerprint='none', benchmark_fingerprint=None):
    checkpoint_path = _exact_scenario_checkpoint_path(graph_cache_path, name, params, spacing_fingerprint=spacing_fingerprint)
    if not os.path.exists(checkpoint_path):
        legacy_path = _exact_legacy_scenario_checkpoint_path(graph_cache_path, name, params, spacing_fingerprint=spacing_fingerprint)
        if not os.path.exists(legacy_path):
            return None
        with open(legacy_path, 'r') as f:
            payload = json.load(f)
        if payload.get('_checkpoint_version') != 2:
            return None
        if 'covered_mask' in payload:
            payload['covered_mask'] = np.asarray(payload['covered_mask'], dtype=bool)
        return payload
    with open(checkpoint_path, 'rb') as f:
        payload = pickle.load(f)
    if payload.get('_checkpoint_version') != 3:
        return None
    if payload.get('_spacing_conflict_fingerprint') != spacing_fingerprint:
        return None
    if benchmark_fingerprint is not None and payload.get('_benchmark_fingerprint') != benchmark_fingerprint:
        return None
    if 'covered_mask' in payload and not isinstance(payload['covered_mask'], np.ndarray):
        payload['covered_mask'] = np.asarray(payload['covered_mask'], dtype=bool)
    if 'stage_solution_vector' in payload and not isinstance(payload['stage_solution_vector'], np.ndarray):
        payload['stage_solution_vector'] = np.asarray(payload['stage_solution_vector'], dtype=np.float64)
    return payload


def _summarize_exact_standard_scenario_metrics(scope_grid, scenario, current_baseline, params):
    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    total_orders = float(np.sum(weights))
    covered_mask = np.asarray(scenario['covered_mask'], dtype=bool)
    uncovered_mask = ~covered_mask
    current_costs = np.asarray(current_baseline['current_costs'], dtype=np.float64)
    current_avg_cost = float(current_baseline['current_avg_cost'])
    current_avg_dist = float(current_baseline['current_avg_dist'])
    current_policy = current_baseline['current_policy']

    base_cost = float(params.get('standard_base_cost', 29) or 29)
    var_rate = float(params.get('standard_variable_rate', 9) or 9)
    optimized_cost_served = float((scenario.get('solver_summary') or {}).get('stage_2_optimized_last_mile_cost_per_day', 0.0) or 0.0)
    uncovered_fallback_cost = float(np.sum(weights[uncovered_mask] * current_costs[uncovered_mask])) if np.any(uncovered_mask) else 0.0
    modeled_total_cost = optimized_cost_served + uncovered_fallback_cost
    proposed_avg_cost = modeled_total_cost / max(total_orders, 1e-9)

    served_orders = float(np.sum(weights[covered_mask]))
    if served_orders > 0:
        served_distance_sum = (optimized_cost_served - base_cost * served_orders) / max(var_rate, 1e-9)
        proposed_avg_dist = served_distance_sum / max(served_orders, 1e-9)
    else:
        proposed_avg_dist = None

    daily_savings = (current_avg_cost - proposed_avg_cost) * total_orders
    return {
        'current_avg_dist': round(current_avg_dist, 3),
        'proposed_avg_dist': None if proposed_avg_dist is None else round(float(proposed_avg_dist), 3),
        'proposed_mean_dist_unweighted': None,
        'current_avg_cost': round(current_avg_cost, 2),
        'proposed_avg_cost': round(float(proposed_avg_cost), 2),
        'avg_modeled_cost_per_order': round(float(proposed_avg_cost), 2),
        'super_penalty_cost_per_day': 0.0,
        'exception_standard_hub_count': int(scenario.get('exception_hub_count', 0) or 0),
        'current_operational_coverage_pct': current_policy['current_operational_coverage_pct'],
        'current_policy_coverage_pct': current_policy['current_policy_coverage_pct'],
        'proposed_hard_coverage_pct': round(float(scenario.get('coverage_pct', 0.0) or 0.0), 2),
        'proposed_hybrid_coverage_pct': round(float(scenario.get('coverage_pct', 0.0) or 0.0), 2),
        'full_hard_coverage_pct': round(float(scenario.get('coverage_pct', 0.0) or 0.0), 2),
        'full_hybrid_coverage_pct': round(float(scenario.get('coverage_pct', 0.0) or 0.0), 2),
        'addressable_hard_coverage_pct': round(float(scenario.get('coverage_pct', 0.0) or 0.0), 2),
        'addressable_hybrid_coverage_pct': round(float(scenario.get('coverage_pct', 0.0) or 0.0), 2),
        'policy_breach_orders_per_day': current_policy['policy_breach_orders_per_day'],
        'policy_breach_hubs': current_policy['policy_breach_hubs'],
        'exception_bucket_usage': {'selected_orders_per_day': 0.0, 'selected_pct': 0.0},
        'daily_savings': round(max(0, daily_savings), 0),
        'monthly_savings': round(max(0, daily_savings) * 30, 0),
        'total_orders_per_day': round(total_orders, 2),
        'pct_cost_reduction': round((current_avg_cost - proposed_avg_cost) / max(current_avg_cost, 0.01) * 100, 1),
        'distance_source': 'Exact Standard solver cost objective + cached current baseline',
        'distance_histogram': {},
        'total_grid_cells': len(scope_grid),
        'proposed_distances_proxy': False,
        'pct_orders_within_mini_service_km': 0.0,
        'mini_service_radius_km': round(float(params.get('mini_ds_radius', 1.0) or 1.0), 3),
        'pct_order_weight_outside_tier_radii': round(float(np.sum(weights[uncovered_mask])) / max(total_orders, 1e-9) * 100.0, 2),
        'metrics_note': (
            'Current baseline is cached once using nearest fixed 103 stores by OSRM. '
            'Proposed Standard-only metrics are derived directly from the exact scenario solver; '
            'uncovered demand, if any, is costed at current baseline for whole-network comparability.'
        ),
    }


def optimize_exact_standard_scenario_deck(params, progress_cb=None):
    require_osrm()
    params = normalize_placement_params(params)
    in_scope_grid, out_scope_grid, business_regions, excluded_islands, scope_summary = _resolve_scope_grid_and_regions(params)
    if in_scope_grid is None or len(in_scope_grid) == 0:
        raise ValueError("No in-scope demand found. Load order data and business polygons first.")

    fixed_sites = _build_fixed_standard_sites(params)
    benchmark_fingerprint = _exact_benchmark_fingerprint(in_scope_grid, fixed_sites, params)
    candidate_pool_cache_path = _exact_candidate_pool_cache_path(in_scope_grid, fixed_sites, params)

    prepared = None
    graph_cache_path = None
    if os.path.exists(candidate_pool_cache_path):
        try:
            with open(candidate_pool_cache_path, 'rb') as f:
                cached_candidate_pool = pickle.load(f)
            graph_cache_path = _exact_graph_cache_path(
                in_scope_grid,
                fixed_sites,
                cached_candidate_pool['sites'],
                params,
                allow_exceptions=True,
            )
            spacing_cache_path = _exact_spacing_conflict_cache_path(fixed_sites, cached_candidate_pool['sites'], params)
            spacing_fingerprint = 'none'
            if os.path.exists(spacing_cache_path):
                with open(spacing_cache_path, 'rb') as sf:
                    spacing_cached = pickle.load(sf)
                spacing_fingerprint = _exact_spacing_conflict_fingerprint(spacing_cached)
            prepared_key = _prepared_exact_benchmark_key(candidate_pool_cache_path, graph_cache_path, params, spacing_fingerprint=spacing_fingerprint)
            prepared = state.exact_benchmark_cache.get(prepared_key)
        except Exception:
            prepared = None

    if prepared is None:
        if progress_cb:
            progress_cb("Exact Standard benchmark: building candidate pool from in-scope demand cells...")
        candidate_pool = _build_exact_standard_candidate_pool(in_scope_grid, fixed_sites, params, progress_cb=progress_cb)
        candidate_sites = candidate_pool['sites']
        graph_cache_path = _exact_graph_cache_path(
            in_scope_grid,
            fixed_sites,
            candidate_sites,
            params,
            allow_exceptions=True,
        )

        if progress_cb:
            progress_cb(
                f"Exact Standard benchmark: building reusable {round(_exact_graph_max_radius_km(params, allow_exceptions=True), 2)} km superset coverage graph..."
            )
        expanded_sets = _build_exact_standard_coverage_sets(
            in_scope_grid,
            fixed_sites,
            candidate_sites,
            params,
            allow_exceptions=True,
            progress_cb=progress_cb,
        )
        prepared_key = _prepared_exact_benchmark_key(candidate_pool_cache_path, graph_cache_path, params)
        prepared = {
            'fixed_sites': fixed_sites,
            'candidate_pool': candidate_pool,
            'candidate_sites': candidate_sites,
            'expanded_sets': expanded_sets,
            'graph_cache_path': graph_cache_path,
            'benchmark_fingerprint': benchmark_fingerprint,
            'spacing_conflicts': _build_exact_standard_spacing_conflicts(
                fixed_sites,
                candidate_sites,
                params,
                progress_cb=progress_cb,
            ),
            'prepared_models': {},
        }
        prepared_key = _prepared_exact_benchmark_key(
            candidate_pool_cache_path,
            graph_cache_path,
            params,
            spacing_fingerprint=_exact_spacing_conflict_fingerprint(prepared['spacing_conflicts']),
        )
        state.exact_benchmark_cache[prepared_key] = prepared
    else:
        if progress_cb:
            progress_cb("Exact Standard benchmark: reusing prepared exact benchmark state from memory...")

    fixed_sites = prepared['fixed_sites']
    candidate_pool = prepared['candidate_pool']
    candidate_sites = prepared['candidate_sites']
    expanded_sets = prepared['expanded_sets']
    graph_cache_path = prepared['graph_cache_path']
    spacing_conflicts = prepared.get('spacing_conflicts')
    if spacing_conflicts is None:
        spacing_conflicts = _build_exact_standard_spacing_conflicts(
            fixed_sites,
            candidate_sites,
            params,
            progress_cb=progress_cb,
        )
        prepared['spacing_conflicts'] = spacing_conflicts
    reduced_candidate_sites = prepared.get('reduced_candidate_sites')
    reduced_expanded_sets = prepared.get('reduced_expanded_sets')
    reduced_spacing_conflicts = prepared.get('reduced_spacing_conflicts')
    if reduced_candidate_sites is None or reduced_expanded_sets is None or reduced_spacing_conflicts is None:
        reduced_candidate_sites, reduced_expanded_sets, reduced_spacing_conflicts = _reduce_exact_candidates_by_spacing_conflicts(
            candidate_sites,
            expanded_sets,
            spacing_conflicts,
        )
        prepared['reduced_candidate_sites'] = reduced_candidate_sites
        prepared['reduced_expanded_sets'] = reduced_expanded_sets
        prepared['reduced_spacing_conflicts'] = reduced_spacing_conflicts
    candidate_sites = reduced_candidate_sites
    expanded_sets = reduced_expanded_sets
    spacing_conflicts = reduced_spacing_conflicts
    spacing_fingerprint = _exact_spacing_conflict_fingerprint(spacing_conflicts)
    prepared_models = prepared.setdefault('prepared_models', {})

    if False not in prepared_models:
        prepared_models[False] = _load_or_build_prepared_exact_scenario_model(
            in_scope_grid,
            fixed_sites,
            candidate_sites,
            expanded_sets,
            params,
            allow_exceptions=False,
            spacing_conflicts=spacing_conflicts,
            progress_cb=progress_cb,
            benchmark_fingerprint=benchmark_fingerprint,
        )
    if True not in prepared_models:
        prepared_models[True] = _load_or_build_prepared_exact_scenario_model(
            in_scope_grid,
            fixed_sites,
            candidate_sites,
            expanded_sets,
            params,
            allow_exceptions=True,
            spacing_conflicts=spacing_conflicts,
            progress_cb=progress_cb,
            benchmark_fingerprint=benchmark_fingerprint,
        )

    def _solve_or_load_checkpoint(scenario_name, target_coverage_pct, allow_exceptions, warm_solution=None):
        checkpoint = _load_exact_scenario_checkpoint(
            scenario_name,
            graph_cache_path,
            params,
            spacing_fingerprint=spacing_fingerprint,
            benchmark_fingerprint=benchmark_fingerprint,
        )
        if checkpoint is not None:
            if progress_cb:
                progress_cb(f"Exact Standard [{scenario_name}]: loading solved checkpoint...")
            if 'covered_mask' in checkpoint:
                checkpoint['covered_mask'] = np.asarray(checkpoint['covered_mask'], dtype=bool)
            return checkpoint
        solved = _solve_exact_standard_scenario(
            in_scope_grid,
            fixed_sites,
            candidate_sites,
            expanded_sets,
            params,
            scenario_name=scenario_name,
            target_coverage_pct=target_coverage_pct,
            allow_exceptions=allow_exceptions,
            progress_cb=progress_cb,
            prepared_model=prepared_models[bool(allow_exceptions)],
            initial_warm_solution=warm_solution,
        )
        _write_exact_scenario_checkpoint(
            scenario_name,
            solved,
            graph_cache_path,
            params,
            spacing_fingerprint=spacing_fingerprint,
            benchmark_fingerprint=benchmark_fingerprint,
        )
        return solved

    strict_100 = _solve_or_load_checkpoint('strict_3km_100', 100.0, False)
    include_near_full = bool(params.get('exact_include_near_full_scenario', True))
    strict_997 = None
    if include_near_full:
        strict_997 = _solve_or_load_checkpoint(
            'strict_3km_99_7',
            float(params.get('benchmark_near_full_coverage_pct', 99.7) or 99.7),
            False,
            warm_solution=np.asarray(strict_100.get('stage_solution_vector'), dtype=np.float64)
            if strict_100.get('stage_solution_vector') is not None else None,
        )
    exception_100 = _solve_or_load_checkpoint('exceptions_up_to_5km_100', 100.0, True)

    eval_params = dict(params)
    eval_params['super_role'] = 'overlay_core_only'
    skip_mini_overlay = bool(params.get('exact_skip_mini_overlay', False))
    skip_recommended_diagnostics = bool(params.get('exact_skip_recommended_diagnostics', False))
    current_baseline = _compute_current_baseline_cache(
        in_scope_grid,
        state.existing_stores,
        eval_params,
        progress_cb=progress_cb,
    )
    eval_params['_precomputed_current_baseline'] = current_baseline
    scenarios = []
    for scenario in (strict_100, exception_100, strict_997):
        if scenario is None:
            continue
        metrics = _summarize_exact_standard_scenario_metrics(
            in_scope_grid,
            scenario,
            current_baseline,
            eval_params,
        )
        scenario['metrics'] = metrics
        scenario['gap_polygons'] = []
        scenario['local_refinement'] = {
            'enabled': False,
            'site_count': int(len(scenario.get('new_sites') or [])),
            'improved_site_count': 0,
            'recommendations': [],
            'deferred': True,
        }
        scenarios.append(scenario)

    preferred_base = exception_100 if exception_100['target_feasible'] else strict_100
    mini_sites = []
    mini_metrics = {}
    if not skip_mini_overlay:
        if progress_cb:
            progress_cb("Exact Standard benchmark: placing Mini overlay on top of preferred Standard scenario...")
        mini_sites = _plan_mini_overlay(in_scope_grid, params, progress_cb=progress_cb)
        mini_metrics = evaluate_network(
            in_scope_grid,
            state.existing_stores,
            mini_sites,
            preferred_base['all_sites'],
            [],
            eval_params,
            progress_cb=(lambda msg: progress_cb(f"Mini overlay evaluation: {msg}") if progress_cb else None),
        )

    def scenario_rank(scenario):
        exact_cost = float((scenario.get('solver_summary') or {}).get('stage_2_optimized_last_mile_cost_per_day', np.inf))
        return (
            0 if scenario.get('target_feasible') else 1,
            -float(scenario.get('target_coverage_pct', 0.0) or 0.0),
            exact_cost,
            float(scenario.get('new_store_count', np.inf) or np.inf),
            float(scenario.get('exception_hub_count', np.inf) or np.inf),
        )

    for scenario in scenarios:
        covered_mask = np.asarray(scenario.get('covered_mask'), dtype=bool)
        if covered_mask.size and np.any(~covered_mask):
            scenario['gap_polygons'] = _build_service_gap_polygons(
                _group_uncovered_pockets(
                    in_scope_grid['cell_lat'].values.astype(np.float64)[~covered_mask],
                    in_scope_grid['cell_lon'].values.astype(np.float64)[~covered_mask],
                    in_scope_grid['orders_per_day'].values.astype(np.float64)[~covered_mask],
                    pocket_radius_km=float(params.get('uncovered_pocket_radius_km', 3.0) or 3.0),
                    progress_cb=None,
                ),
                in_scope_grid,
                stage_label=str(scenario.get('scenario_name') or 'exact_standard'),
            )
        else:
            scenario['gap_polygons'] = []

    recommended = min(scenarios, key=scenario_rank)['scenario_name'] if scenarios else None
    recommended_scenario = next((s for s in scenarios if s.get('scenario_name') == recommended), None)
    if recommended_scenario is not None and not skip_recommended_diagnostics:
        recommended_scenario['local_refinement'] = _refine_standard_sites_locally(
            in_scope_grid,
            recommended_scenario,
            params,
            progress_cb=progress_cb,
        )
    elif recommended_scenario is not None:
        recommended_scenario['gap_polygons'] = []
        recommended_scenario['local_refinement'] = {
            'enabled': False,
            'site_count': int(len(recommended_scenario.get('new_sites') or [])),
            'improved_site_count': 0,
            'recommendations': [],
            'deferred': True,
        }

    return {
        'mode': 'exact_standard_benchmark',
        'scope_summary': scope_summary,
        'candidate_pool_summary': candidate_pool['summary'],
        'scenarios': scenarios,
        'mini_overlay': {
            'base_scenario': preferred_base['scenario_name'],
            'site_count': len(mini_sites),
            'sites': mini_sites,
            'metrics': mini_metrics,
            'skipped': bool(skip_mini_overlay),
        },
        'recommended_scenario': recommended,
        'analysis': {
            'recommendations': [
                "Scenario deck is solved exactly for coverage target, last-mile cost, new-store count, and exception-hub count within the finite candidate set.",
                "Last-mile cost is optimized through a sparse assignment-flow model over feasible OSRM edges.",
                "Each chosen new Standard hub also gets a local nearby-coordinate refinement pass so the recommendation can improve from a demand-cell anchor to a better in-between point when the local road-cost surface allows it.",
                f"Candidate pool mode: {candidate_pool['summary']['candidate_pool_mode']} with {candidate_pool['summary']['selected_candidate_cells']} candidate demand cells.",
                f"Fixed store benchmark source: {scope_summary.get('fixed_store_source_mode', 'unknown')}.",
            ],
        },
        'business_regions': business_regions,
        'excluded_islands': excluded_islands,
    }


def _apply_exact_local_refinement(new_sites, local_refinement):
    sites = [dict(site) for site in (new_sites or [])]
    recs = (local_refinement or {}).get('recommendations') or []
    if not recs:
        return sites
    rec_by_id = {}
    for rec in recs:
        site_id = str(rec.get('site_id') or '')
        if site_id:
            rec_by_id[site_id] = rec
    for site in sites:
        rec = rec_by_id.get(str(site.get('id') or ''))
        if not rec:
            continue
        site['original_lat'] = float(site.get('lat', 0.0))
        site['original_lon'] = float(site.get('lon', 0.0))
        site['lat'] = float(rec.get('refined_lat', site['original_lat']))
        site['lon'] = float(rec.get('refined_lon', site['original_lon']))
        site['local_refinement_applied'] = bool(rec.get('local_refinement_applied', False))
        site['local_refinement_moved'] = bool(rec.get('moved', False))
    return sites


def _build_exact_ui_view(view_key, label, scenario, params, scope_summary, base_result=None, mini_overlay=None):
    base_result = base_result or {}
    mini_overlay = mini_overlay or {}
    base_scenario_name = str((mini_overlay or {}).get('base_scenario') or '')
    is_mini_overlay = view_key == 'mini_overlay'
    scenario_for_standard = base_result if is_mini_overlay else scenario
    standard_sites = _apply_exact_local_refinement(
        (scenario_for_standard or {}).get('new_sites') or [],
        (scenario_for_standard or {}).get('local_refinement') or {},
    )
    mini_sites = [dict(site) for site in ((mini_overlay or {}).get('sites') or [])] if is_mini_overlay else []
    metrics = dict((mini_overlay or {}).get('metrics') or {}) if is_mini_overlay else dict((scenario or {}).get('metrics') or {})
    all_sites = (scenario_for_standard or {}).get('all_sites') or []
    exception_sites = [dict(site) for site in all_sites if site.get('exception_standard')]
    fixed_sites = (scenario_for_standard or {}).get('fixed_sites') or []
    new_store_count = int((scenario_for_standard or {}).get('new_store_count') or len(standard_sites))
    exception_hub_count = int((scenario_for_standard or {}).get('exception_hub_count') or 0)
    total_standard_sites = int(len(fixed_sites) + new_store_count)
    demand_serving_sites = [site for site in standard_sites if float(site.get('orders_per_day', 0.0) or 0.0) > 1e-6]
    support_only_sites = [site for site in standard_sites if float(site.get('orders_per_day', 0.0) or 0.0) <= 1e-6]
    standard_only_cost = dict((base_result or {}).get('metrics') or {}).get('proposed_avg_cost')
    standard_only_dist = dict((base_result or {}).get('metrics') or {}).get('proposed_avg_dist')
    mini_cost = dict((mini_overlay or {}).get('metrics') or {}).get('proposed_avg_cost')
    mini_dist = dict((mini_overlay or {}).get('metrics') or {}).get('proposed_avg_dist')
    notes = [
        f"Exact view: {label}.",
        f"Fixed store benchmark source: {scope_summary.get('fixed_store_source_mode', 'unknown')}.",
        f"Standard spacing rule: no new Standard within {float(params.get('standard_min_store_spacing_km', 3.0) or 3.0):.1f} km road distance of fixed/new Standard.",
    ]
    if is_mini_overlay:
        notes.append(f"Mini overlay is evaluated on top of {base_scenario_name}.")
    else:
        notes.append(
            f"Target feasible: {'Yes' if (scenario or {}).get('target_feasible') else 'No'} at "
            f"{float((scenario or {}).get('target_coverage_pct', 0.0) or 0.0):.2f}% target coverage."
        )
    local_ref = (scenario_for_standard or {}).get('local_refinement') or {}
    planning_layers = {
        'standard': {
            'fixed_open_count': int(len(fixed_sites)),
            'new_store_count': new_store_count,
            'total_standard_sites': total_standard_sites,
            'demand_serving_site_count': int(len(demand_serving_sites)),
            'support_only_site_count': int(len(support_only_sites)),
            'coverage_pct': float((scenario_for_standard or {}).get('coverage_pct', 0.0) or 0.0),
            'exception_hub_count': exception_hub_count,
            'exception_sites': exception_sites,
        },
        'mini': {
            'site_count': int(len(mini_sites)),
            'orders_shifted_from_standard_per_day': (
                float(metrics.get('total_orders_per_day', 0.0) or 0.0) *
                float(metrics.get('pct_orders_within_mini_service_km', 0.0) or 0.0) / 100.0
            ) if is_mini_overlay else 0.0,
            'avg_cost_reduction_per_order': max(
                0.0,
                float(standard_only_cost or 0.0) - float(mini_cost or 0.0)
            ) if is_mini_overlay else 0.0,
        },
        'super': {},
        'comparison': {
            'standard_only': {
                'avg_cost': float(standard_only_cost) if standard_only_cost is not None else None,
                'avg_dist': float(standard_only_dist) if standard_only_dist is not None else None,
            },
            'standard_plus_mini': {
                'avg_cost': float(mini_cost) if mini_cost is not None else None,
                'avg_dist': float(mini_dist) if mini_dist is not None else None,
            } if mini_overlay else {},
        },
    }
    analysis = {
        'recommendations': notes + list((base_result or {}).get('analysis', {}).get('recommendations') or []),
        'service_gap_polygons': list((scenario_for_standard or {}).get('gap_polygons') or []),
        'service_gap_source': str((scenario_for_standard or {}).get('scenario_name') or ''),
    }
    if local_ref:
        analysis['local_refinement'] = local_ref
    return {
        'view_key': view_key,
        'label': label,
        'scenario_name': str((scenario_for_standard or {}).get('scenario_name') or view_key),
        'mini_ds': mini_sites,
        'standard_ds': standard_sites,
        'super_ds': [],
        'metrics': metrics,
        'planning_layers': planning_layers,
        'analysis': analysis,
        'pipeline': {
            'mode': 'exact_standard_benchmark',
            'selected_view': view_key,
            'base_scenario': base_scenario_name if is_mini_overlay else None,
        },
        'pipeline_warnings': [],
    }


def _build_exact_benchmark_app_result(deck, params, elapsed, heatmap, stores_json):
    scenarios = deck.get('scenarios') or []
    scenario_by_name = {str(s.get('scenario_name')): s for s in scenarios}
    recommended_name = str(deck.get('recommended_scenario') or '')
    recommended_scenario = scenario_by_name.get(recommended_name) or (scenarios[0] if scenarios else {})
    strict_100 = scenario_by_name.get('strict_3km_100') or recommended_scenario
    mini_overlay = deck.get('mini_overlay') or {}
    mini_base_scenario_name = str(mini_overlay.get('base_scenario') or '')
    mini_base_scenario = scenario_by_name.get(mini_base_scenario_name) or strict_100
    scope_summary = deck.get('scope_summary') or {}
    standard_radius = float(params.get('standard_ds_radius', 3.0) or 3.0)
    exception_radius = float(params.get('standard_exception_radius_km', 5.0) or 5.0)
    near_full_pct = float(params.get('benchmark_near_full_coverage_pct', 99.7) or 99.7)

    view_specs = [
        ('strict_3km_100', f'Strict {standard_radius:.1f} km / 100%', scenario_by_name.get('strict_3km_100')),
        ('exceptions_up_to_5km_100', f'{standard_radius:.1f} km + Exceptions to {exception_radius:.1f} km / 100%', scenario_by_name.get('exceptions_up_to_5km_100')),
        ('strict_3km_99_7', f'Strict {standard_radius:.1f} km / {near_full_pct:.1f}%', scenario_by_name.get('strict_3km_99_7')),
    ]
    exact_views = {}
    exact_summaries = []
    for view_key, label, scenario in view_specs:
        if not scenario:
            continue
        exact_views[view_key] = _build_exact_ui_view(
            view_key, label, scenario, params, scope_summary,
            base_result=strict_100, mini_overlay=mini_overlay
        )
        exact_summaries.append({
            'view_key': view_key,
            'label': label,
            'target_feasible': bool(scenario.get('target_feasible')),
            'coverage_pct': float(scenario.get('coverage_pct', 0.0) or 0.0),
            'new_standard_stores': int(scenario.get('new_store_count', 0) or 0),
            'exception_hubs': int(scenario.get('exception_hub_count', 0) or 0),
            'proposed_avg_cost': float(((scenario.get('metrics') or {}).get('proposed_avg_cost', 0.0)) or 0.0),
            'proposed_avg_dist': float(((scenario.get('metrics') or {}).get('proposed_avg_dist', 0.0)) or 0.0),
        })

    if mini_overlay and not mini_overlay.get('skipped'):
        exact_views['mini_overlay'] = _build_exact_ui_view(
            'mini_overlay',
            f"Mini Overlay on {mini_overlay.get('base_scenario', 'strict_3km_100')}",
            mini_base_scenario,
            params,
            scope_summary,
            base_result=mini_base_scenario,
            mini_overlay=mini_overlay,
        )
        exact_summaries.append({
            'view_key': 'mini_overlay',
            'label': f"Mini Overlay on {mini_overlay.get('base_scenario', 'strict_3km_100')}",
            'target_feasible': None,
            'coverage_pct': float(((mini_overlay.get('metrics') or {}).get('proposed_hard_coverage_pct', 0.0)) or 0.0),
            'new_standard_stores': int((mini_base_scenario or {}).get('new_store_count', 0) or 0),
            'exception_hubs': int((mini_base_scenario or {}).get('exception_hub_count', 0) or 0),
            'mini_sites': int(mini_overlay.get('site_count', 0) or 0),
            'proposed_avg_cost': float(((mini_overlay.get('metrics') or {}).get('proposed_avg_cost', 0.0)) or 0.0),
            'proposed_avg_dist': float(((mini_overlay.get('metrics') or {}).get('proposed_avg_dist', 0.0)) or 0.0),
        })

    selected_view_key = recommended_name if recommended_name in exact_views else ('mini_overlay' if 'mini_overlay' in exact_views else next(iter(exact_views.keys()), ''))
    selected_view = exact_views.get(selected_view_key, {})
    result = {
        'success': True,
        'exact_benchmark': True,
        'exact_metadata': {
            'recommended_scenario': recommended_name,
            'selected_view': selected_view_key,
            'scenario_summaries': exact_summaries,
        },
        'exact_views': exact_views,
        'heatmap': heatmap,
        'existing_stores': stores_json,
        'city_bounds': state.city_bounds,
        'compute_time_s': round(elapsed, 1),
        'params': params,
        'scope_summary': scope_summary,
        'business_regions': deck.get('business_regions', state.business_regions),
        'excluded_islands': deck.get('excluded_islands', state.excluded_islands),
        'candidate_pool_summary': deck.get('candidate_pool_summary', {}),
        **_meeting_context_fields(params),
    }
    result.update(selected_view)
    return result


def _load_latest_exact_benchmark_app_result():
    deck_path = os.path.join(OPTIMIZATION_RESULTS_DIR, 'exact_benchmark_scenario_deck.json')
    if not os.path.exists(deck_path):
        raise FileNotFoundError(deck_path)
    if state.grid_data is None:
        raise ValueError('Load Bangalore orders before restoring the exact benchmark result.')
    with open(deck_path, 'r', encoding='utf-8') as f:
        deck = json.load(f)
    params = dict(deck.get('params') or {})
    if str(params.get('exact_app_result_schema_version') or '').strip().lower() != 'v2':
        raise ValueError(
            'Latest exact benchmark artifact predates the current app schema. '
            'Run the exact benchmark again from the app to refresh it.'
        )
    params.setdefault('fixed_store_mode', 'benchmark_103')
    scope_summary = deck.get('scope_summary') or state.scope_summary or {}
    in_scope_grid = state.in_scope_grid if state.in_scope_grid is not None else state.grid_data
    scenarios = deck.get('scenarios') or []
    for scenario in scenarios:
        covered_mask = np.asarray(scenario.get('covered_mask'), dtype=bool)
        if not covered_mask.size:
            continue
        if scenario.get('gap_polygons'):
            continue
        if not np.any(~covered_mask):
            scenario['gap_polygons'] = []
            continue
        scenario['gap_polygons'] = _build_service_gap_polygons(
            _group_uncovered_pockets(
                in_scope_grid['cell_lat'].values.astype(np.float64)[~covered_mask],
                in_scope_grid['cell_lon'].values.astype(np.float64)[~covered_mask],
                in_scope_grid['orders_per_day'].values.astype(np.float64)[~covered_mask],
                pocket_radius_km=float(params.get('uncovered_pocket_radius_km', 3.0) or 3.0),
                progress_cb=None,
            ),
            in_scope_grid,
            stage_label=str(scenario.get('scenario_name') or 'exact_standard'),
        )
    heatmap = generate_heatmap(state.grid_data)
    active_fixed_sites = _build_fixed_standard_sites(params)
    stores_json = [{
        'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
        'orders_per_day': s['orders_per_day'],
        'polygon_coords': s.get('polygon_coords', [])
    } for s in active_fixed_sites]
    result = _build_exact_benchmark_app_result(deck, params, 0.0, heatmap, stores_json)
    result['compute_time_s'] = float(deck.get('compute_time_s', 0.0) or 0.0)
    return result


def _sample_super_geometry(scope_grid, business_regions, excluded_regions, params=None):
    points = []
    seen = set()
    excluded_polys = _prepare_polygon_tests(excluded_regions)
    params = params or {}
    meeting_fast_mode = bool(params.get('meeting_fast_mode', True))
    demand_stride = int(params.get('super_geometry_demand_stride', 6 if meeting_fast_mode else 1) or 1)
    top_k = int(params.get('super_geometry_top_k_demand', 1500 if meeting_fast_mode else 0) or 0)

    def is_excluded(lat, lon):
        return _point_in_prepared_polygons(lat, lon, excluded_polys)

    def add_point(lat, lon, weight, source):
        if is_excluded(lat, lon):
            return None
        key = (round(float(lat), 4), round(float(lon), 4), source)
        if key in seen:
            return None
        seen.add(key)
        point = {
            'lat': float(lat),
            'lon': float(lon),
            'weight': float(weight),
            'source': source,
        }
        points.append(point)
        return point

    if scope_grid is not None and len(scope_grid) > 0:
        if top_k > 0:
            for demand_idx, row in scope_grid.nlargest(min(top_k, len(scope_grid)), 'orders_per_day').iterrows():
                point = add_point(row['avg_cust_lat'], row['avg_cust_lon'], row['orders_per_day'], 'demand_top')
                if point is not None:
                    point['demand_idx'] = int(demand_idx)
        step = max(1, demand_stride)
        for demand_idx, row in scope_grid.iloc[::step].iterrows():
            point = add_point(row['avg_cust_lat'], row['avg_cust_lon'], row['orders_per_day'], 'demand')
            if point is not None:
                point['demand_idx'] = int(demand_idx)

    # In fast meeting mode we keep the Super layer demand-sampled on purpose.
    # This makes the layer responsive enough for live scenario work, but it is
    # also why the UI must label it as sample-validated rather than exact.
    if meeting_fast_mode:
        return points

    for region in (business_regions or []):
        if region.get('excluded'):
            continue
        ring = _normalize_polygon_coords(region.get('polygon_coords', []))
        if not ring:
            continue
        ring_body = ring[:-1] if len(ring) > 2 and ring[0] == ring[-1] else ring
        step = max(1, len(ring_body) // 12)
        for lat, lon in ring_body[::step]:
            add_point(lat, lon, 1.0, 'boundary')
        c_lat, c_lon = _polygon_centroid(ring_body)
        if c_lat is not None and c_lon is not None:
            add_point(c_lat, c_lon, 1.0, 'centroid')

    return points


def _plan_super_blanket(scope_grid, business_regions, excluded_regions, standard_sites, params, progress_cb=None):
    radius = float(params.get('super_radius_km', params.get('super_ds_radius', 7.0)) or 7.0)
    max_sites = _safe_optional_count(params, 'super_ds_target_count')
    if max_sites is None:
        max_sites = int(params.get('super_ds_max', 200) or 200)
    meeting_fast_mode = bool(params.get('meeting_fast_mode', True))

    sample_points = _sample_super_geometry(scope_grid, business_regions, excluded_regions, params=params)
    if not sample_points:
        return {
            'sites': [],
            'blanket_coverage_pct': 100.0,
            'reused_existing_standard_count': 0,
            'reused_new_standard_count': 0,
            'new_super_site_count': 0,
            'sample_point_count': 0,
            'uncovered_sample_points': 0,
        }

    lats = np.array([p['lat'] for p in sample_points], dtype=np.float64)
    lons = np.array([p['lon'] for p in sample_points], dtype=np.float64)
    weights = np.array([p['weight'] for p in sample_points], dtype=np.float64)
    sample_demand_idx = np.array(
        [int(p['demand_idx']) for p in sample_points if p.get('demand_idx') is not None],
        dtype=np.int64
    ) if sample_points and all(p.get('demand_idx') is not None for p in sample_points) else None
    covered = np.zeros(len(sample_points), dtype=bool)
    sites = []
    used_keys = set()
    reused_existing = 0
    reused_new = 0
    cached_context = (params or {}).get('_cached_demand_candidate_context')
    if cached_context is None and meeting_fast_mode:
        try:
            cached_context = _get_all_demand_candidate_context(scope_grid, params, progress_cb=None)
        except Exception:
            cached_context = None

    def _cached_super_cover_array(lat, lon):
        if cached_context is None or sample_demand_idx is None:
            return None
        d_all = _distance_array_from_cached_seed(cached_context, lat, lon, len(scope_grid))
        if d_all is None:
            return None
        return d_all[sample_demand_idx]

    candidate_sites = []
    for site in standard_sites:
        candidate_sites.append({
            'id': site.get('id'),
            'lat': float(site['lat']),
            'lon': float(site['lon']),
            'site_source': 'existing_standard' if site.get('fixed_open') else 'proposed_standard',
        })

    while np.any(~covered) and candidate_sites and len(sites) < max_sites:
        best = None
        uncovered_idx = np.where(~covered)[0]
        for cand in candidate_sites:
            key = (round(cand['lat'], 5), round(cand['lon'], 5))
            if key in used_keys:
                continue
            d_cached = _cached_super_cover_array(cand['lat'], cand['lon'])
            if d_cached is not None:
                mask_local = np.isfinite(d_cached[uncovered_idx]) & (d_cached[uncovered_idx] <= radius + 1e-5)
            else:
                dists = osrm_one_to_many(cand['lat'], cand['lon'], lats[uncovered_idx], lons[uncovered_idx])
                mask_local = np.isfinite(dists) & (dists <= radius + 1e-5)
            cover_weight = float(np.sum(weights[uncovered_idx][mask_local]))
            if cover_weight <= 0:
                continue
            candidate = (cover_weight, cand, uncovered_idx, mask_local)
            if best is None or candidate[0] > best[0]:
                best = candidate
        if best is None:
            break
        _, cand, uncovered_idx, mask_local = best
        global_idx = uncovered_idx[mask_local]
        covered[global_idx] = True
        used_keys.add((round(cand['lat'], 5), round(cand['lon'], 5)))
        sites.append({
            'id': cand['id'] or f"SUPER-{len(sites) + 1}",
            'lat': cand['lat'],
            'lon': cand['lon'],
            'radius_km': radius,
            'type': 'super',
            'site_source': cand['site_source'],
            'orders_per_day': round(float(np.sum(weights[global_idx])), 2),
        })
        if cand['site_source'] == 'existing_standard':
            reused_existing += 1
        else:
            reused_new += 1
        if progress_cb and len(sites) % 5 == 0:
            progress_cb(f"Super blanket: re-used {len(sites)} Standard site(s) so far...")

    new_super_count = 0
    while np.any(~covered) and len(sites) < max_sites:
        uncovered_idx = np.where(~covered)[0]
        seed_idx = int(uncovered_idx[np.argmax(weights[uncovered_idx])])
        d_seed_full = _cached_super_cover_array(float(lats[seed_idx]), float(lons[seed_idx]))
        if d_seed_full is not None:
            member_local = np.isfinite(d_seed_full[uncovered_idx]) & (d_seed_full[uncovered_idx] <= radius + 1e-5)
        else:
            d_seed = osrm_one_to_many(float(lats[seed_idx]), float(lons[seed_idx]), lats[uncovered_idx], lons[uncovered_idx])
            member_local = np.isfinite(d_seed) & (d_seed <= radius + 1e-5)
        member_idx = uncovered_idx[member_local]
        if len(member_idx) == 0:
            member_idx = np.array([seed_idx], dtype=np.int64)
        center_lat = float(np.average(lats[member_idx], weights=weights[member_idx]))
        center_lon = float(np.average(lons[member_idx], weights=weights[member_idx]))
        if cached_context is not None and sample_demand_idx is not None and len(member_idx) > 0:
            local_lats = lats[member_idx]
            local_lons = lons[member_idx]
            deltas = (local_lats - center_lat) ** 2 + (local_lons - center_lon) ** 2
            snap_idx = int(member_idx[int(np.argmin(deltas))])
            center_lat = float(lats[snap_idx])
            center_lon = float(lons[snap_idx])
        d_full = _cached_super_cover_array(center_lat, center_lon)
        if d_full is None:
            d_full = osrm_one_to_many(center_lat, center_lon, lats, lons)
        cover_mask = np.isfinite(d_full) & (d_full <= radius + 1e-5)
        covered |= cover_mask
        new_super_count += 1
        sites.append({
            'id': f'SUPER-{len(sites) + 1}',
            'lat': center_lat,
            'lon': center_lon,
            'radius_km': radius,
            'type': 'super',
            'site_source': 'new_super',
            'orders_per_day': round(float(np.sum(weights[cover_mask])), 2),
        })
        if progress_cb and new_super_count % 5 == 0:
            progress_cb(f"Super blanket: added {new_super_count} new blanket site(s)...")

    blanket_pct = 100.0 * float(np.sum(weights[covered])) / max(float(np.sum(weights)), 1e-9)
    return {
        'sites': sites,
        'blanket_coverage_pct': round(blanket_pct, 2),
        'reused_existing_standard_count': reused_existing,
        'reused_new_standard_count': reused_new,
        'new_super_site_count': new_super_count,
        'sample_point_count': len(sample_points),
        'uncovered_sample_points': int(np.sum(~covered)),
    }


def _build_meeting_quality_summary(params, standard_plan, mini_summary, super_plan):
    fixed_mode = _effective_fixed_store_source_mode(params)
    coverage_pct = float(standard_plan.get('coverage_pct', 0.0) or 0.0)
    decision_grade_layers = ['Standard', 'Exception Standard', 'Mini']
    verification_pending_layers = []
    notes = []
    overall_label = 'Decision-grade'
    if coverage_pct < 99.0:
        overall_label = 'Review carefully'
        notes.append(
            f"Standard hard coverage is only {coverage_pct:.2f}% under the current settings, so this should be treated as exploratory."
        )
    else:
        notes.append(
            f"Standard/Exception decisions are aligned to the active {fixed_mode} fixed-store world and the current service-radius policy."
        )
    if int(standard_plan.get('rescue_count', 0) or 0) > 0:
        notes.append(
            f"{int(standard_plan.get('rescue_count', 0) or 0)} rescue Standard site(s) were added with relaxed spacing to close tail demand after the core Standard plan."
        )
    if int(super_plan.get('site_count', 0) or 0) > 0 or int(super_plan.get('sample_point_count', 0) or 0) > 0:
        verification_pending_layers.append('Super blanket')
        notes.append(
            "Super blanket is fast sampled geometry in meeting mode. Use it as directional coverage guidance, not exact blanket proof."
        )
    if int(mini_summary.get('site_count', 0) or 0) == 0:
        notes.append("No Mini sites qualified under the current Mini radius and min-orders gate.")
    return {
        'mode': 'meeting_fast_bounded',
        'overall_label': overall_label,
        'fixed_store_world': fixed_mode,
        'decision_grade_layers': decision_grade_layers,
        'verification_pending_layers': verification_pending_layers,
        'notes': notes,
    }


def _build_meeting_insights(params, standard_plan, mini_summary, super_plan, standard_only_metrics, combined_metrics):
    insights = []
    coverage_pct = float(standard_plan.get('coverage_pct', 0.0) or 0.0)
    if coverage_pct >= 99.99:
        insights.append(
            "100% strict coverage is essentially being hit in the modeled network, so the next conversation should be cost and store-count tradeoffs rather than feasibility."
        )
    elif coverage_pct >= 99.7:
        insights.append(
            "Coverage is already near-full. If leadership wants fewer stores, test whether 99.7% is an acceptable operating target before widening the footprint."
        )
    else:
        insights.append(
            "Coverage is below the near-full band. The next levers are larger Standard/Exception radii, more exception hubs, or lower min-order thresholds."
        )
    if int(standard_plan.get('rescue_count', 0) or 0) > 0:
        insights.append(
            f"The last-mile tail is now being closed with {int(standard_plan.get('rescue_count', 0) or 0)} rescue Standard site(s). If leadership wants fewer total hubs, first test a slightly larger Exception radius before widening the core Standard grid."
        )
    if int(standard_plan.get('exception_count', 0) or 0) > 0:
        insights.append(
            f"Exception Standard hubs are already doing meaningful tail cleanup. Before adding many more Standard stores, test whether a slightly wider exception radius closes the same pockets more cheaply."
        )
    if float(mini_summary.get('avg_cost_reduction_per_order', 0.0) or 0.0) > 0.1:
        insights.append(
            f"Mini is a real cost lever here: it reduces average last-mile cost by about ₹{float(mini_summary.get('avg_cost_reduction_per_order', 0.0) or 0.0):.2f}/order versus Standard-only."
        )
    if float(combined_metrics.get('proposed_avg_cost', 0.0) or 0.0) >= float(standard_only_metrics.get('proposed_avg_cost', 0.0) or 0.0) - 1e-6:
        insights.append(
            "Mini is not buying much on the current settings. If cost matters more than density purity, test a slightly lower Mini min-orders threshold."
        )
    if int(super_plan.get('new_super_site_count', 0) or 0) > 0:
        insights.append(
            "Super should be used to explain the city blanket and long-tail support story, not to override the decision-grade Standard/Exception opening logic."
        )
    return insights[:5]


def _summarize_mini_overlay(scope_grid, mini_sites, standard_sites, standard_only_metrics, combined_metrics, params):
    if scope_grid is None or len(scope_grid) == 0 or not mini_sites:
        return {
            'site_count': 0,
            'orders_shifted_from_standard_per_day': 0.0,
            'avg_cost_reduction_per_order': 0.0,
            'daily_cost_reduction': 0.0,
        }
    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    d_mini = _min_dist_to_hubs_for_grid(scope_grid, mini_sites)
    d_std = _min_dist_to_hubs_for_grid(scope_grid, standard_sites)
    rmini = float(params.get('mini_ds_radius', 1.0) or 1.0)
    rstd = float(params.get('standard_ds_radius', 3.0) or 3.0)
    shifted = np.isfinite(d_mini) & (d_mini <= rmini + 1e-5) & np.isfinite(d_std) & (d_std <= rstd + 1e-5)
    shifted_orders = float(np.sum(weights[shifted]))
    avg_delta = float(standard_only_metrics['proposed_avg_cost'] - combined_metrics['proposed_avg_cost'])
    return {
        'site_count': len(mini_sites),
        'orders_shifted_from_standard_per_day': round(shifted_orders, 2),
        'avg_cost_reduction_per_order': round(avg_delta, 2),
        'daily_cost_reduction': round(avg_delta * float(np.sum(weights)), 2),
    }


def _summarize_super_blanket_order_cost(scope_grid, super_sites, params):
    if scope_grid is None or len(scope_grid) == 0 or not super_sites:
        return {
            'avg_cost_if_served_by_super': None,
            'avg_dist_if_served_by_super': None,
            'order_coverage_pct_if_super_serves': 0.0,
        }
    weights = scope_grid['orders_per_day'].values.astype(np.float64)
    d_sup = _min_dist_to_hubs_for_grid(scope_grid, super_sites)
    radius = float(params.get('super_radius_km', params.get('super_ds_radius', 7.0)) or 7.0)
    served = np.isfinite(d_sup) & (d_sup <= radius + 1e-5)
    if not np.any(served):
        return {
            'avg_cost_if_served_by_super': None,
            'avg_dist_if_served_by_super': None,
            'order_coverage_pct_if_super_serves': 0.0,
        }
    base = _effective_super_base_cost(params)
    rate = float(params.get('super_variable_rate', 9) or 9)
    costs = base + rate * d_sup[served]
    return {
        'avg_cost_if_served_by_super': round(float(np.average(costs, weights=weights[served])), 2),
        'avg_dist_if_served_by_super': round(float(np.average(d_sup[served], weights=weights[served])), 3),
        'order_coverage_pct_if_super_serves': round(100.0 * float(np.sum(weights[served])) / max(float(np.sum(weights)), 1e-9), 2),
    }


def _prepare_bangalore_multilayer_core_context(params, progress_cb=None, publish_cb=None):
    require_osrm()
    params = normalize_placement_params(params)
    in_scope_grid, out_scope_grid, business_regions, excluded_islands, scope_summary = _resolve_scope_grid_and_regions(params)
    if in_scope_grid is None or len(in_scope_grid) == 0:
        raise ValueError("No in-scope demand found. Load order data and business polygons first.")

    if progress_cb:
        progress_cb("Bangalore planner reset: building strict Standard base network...")
    strict_base_params = _strict_standard_base_params(params)
    strict_base_plan = _plan_standard_network(in_scope_grid, strict_base_params, progress_cb=progress_cb)
    active_fixed_stores = list(strict_base_plan.get('fixed_sites') or [])

    standard_eval_params = dict(params)
    standard_eval_params['super_role'] = 'overlay_core_only'
    if strict_base_plan.get('cached_demand_candidate_context') is not None:
        standard_eval_params['_cached_demand_candidate_context'] = strict_base_plan.get('cached_demand_candidate_context')
    if strict_base_plan.get('cached_fixed_site_context') is not None:
        standard_eval_params['_cached_fixed_site_context'] = strict_base_plan.get('cached_fixed_site_context')
    baseline_stores = active_fixed_stores if active_fixed_stores else list(state.existing_stores or [])
    standard_eval_params['_precomputed_current_baseline'] = _compute_current_baseline_cache(
        in_scope_grid,
        baseline_stores,
        standard_eval_params,
        progress_cb=(lambda msg: progress_cb(f"Current baseline cache: {msg}") if progress_cb else None),
    )

    candidate_universe_label = _standard_candidate_universe_label(params)
    zero_mini_summary = {
        'site_count': 0,
        'orders_shifted_from_standard_per_day': 0.0,
        'avg_cost_reduction_per_order': 0.0,
        'daily_cost_reduction': 0.0,
    }
    strict_base_eval = None
    rescue_eval = None
    exception_eval = None
    rescue_first_plan = None
    exception_first_plan = None
    scenario_views = {}
    scenario_order = []

    def _core_context_for_views(current_views, current_order, active_key, active_standard_key, active_plan, active_eval_bundle):
        return {
            'params': params,
            'in_scope_grid': in_scope_grid,
            'out_scope_grid': out_scope_grid,
            'business_regions': business_regions,
            'excluded_islands': excluded_islands,
            'scope_summary': scope_summary,
            'strict_base_plan': strict_base_plan,
            'rescue_first_plan': rescue_first_plan,
            'exception_first_plan': exception_first_plan,
            'active_branch_plan': active_plan,
            'active_fixed_stores': active_fixed_stores,
            'baseline_stores': baseline_stores,
            'standard_eval_params': standard_eval_params,
            'mini_sites': [],
            'strict_base_eval': strict_base_eval,
            'rescue_eval': rescue_eval,
            'exception_eval': exception_eval,
            'active_eval_bundle': active_eval_bundle,
            'scenario_views': dict(current_views),
            'scenario_order': list(current_order),
            'scenario_summaries': _meeting_scenario_summaries(current_order, current_views, active_key),
            'active_view_key': active_key,
            'active_standard_only_key': active_standard_key,
            'active_view': dict(current_views.get(active_key) or {}),
            'candidate_universe_label': candidate_universe_label,
        }

    def _publish_rescue_first_live(partial_plan):
        nonlocal rescue_first_plan, rescue_eval
        rescue_first_plan = partial_plan
        if progress_cb:
            progress_cb(
                f"Bangalore planner reset: publishing rescue-first live packet at "
                f"{float(partial_plan.get('coverage_pct', 0.0) or 0.0):.2f}% coverage..."
            )
        rescue_eval = _evaluate_meeting_standard_branch(
            in_scope_grid,
            baseline_stores,
            rescue_first_plan,
            [],
            standard_eval_params,
            params,
            progress_label='Rescue-first live evaluation',
            progress_cb=progress_cb,
        )
        live_views = {
            'rescue_first_standard_100': _build_meeting_scenario_view(
                'rescue_first_standard_100',
                'Rescue-Standard-First',
                rescue_first_plan,
                rescue_eval['standard_only_metrics'],
                params,
                mini_sites=[],
                mini_summary=zero_mini_summary,
                candidate_universe_label=candidate_universe_label,
                spacing_mode_label='rescue_relaxed' if int(rescue_first_plan.get('rescue_count', 0) or 0) > 0 else 'strict',
            )
        }
        if publish_cb:
            publish_cb(
                _core_context_for_views(
                    live_views,
                    ['rescue_first_standard_100'],
                    'rescue_first_standard_100',
                    'rescue_first_standard_100',
                    rescue_first_plan,
                    rescue_eval,
                )
            )

    if progress_cb:
        progress_cb("Bangalore planner reset: completing rescue-first Standard branch...")
    rescue_first_plan = _complete_standard_branch_from_base(
        in_scope_grid,
        strict_base_plan,
        params,
        branch_type='rescue_first',
        progress_cb=progress_cb,
        live_publish_cb=_publish_rescue_first_live,
    )

    if progress_cb:
        progress_cb("Bangalore planner reset: evaluating rescue-first Standard branch...")
    rescue_eval = _evaluate_meeting_standard_branch(
        in_scope_grid,
        baseline_stores,
        rescue_first_plan,
        [],
        standard_eval_params,
        params,
        progress_label='Rescue-first Standard evaluation',
        progress_cb=progress_cb,
    )

    scenario_views['rescue_first_standard_100'] = _build_meeting_scenario_view(
        'rescue_first_standard_100',
        'Rescue-Standard-First',
        rescue_first_plan,
        rescue_eval['standard_only_metrics'],
        params,
        mini_sites=[],
        mini_summary=zero_mini_summary,
        candidate_universe_label=candidate_universe_label,
        spacing_mode_label='rescue_relaxed' if int(rescue_first_plan.get('rescue_count', 0) or 0) > 0 else 'strict',
    )
    scenario_order = ['rescue_first_standard_100']
    if publish_cb:
        publish_cb(
            _core_context_for_views(
                scenario_views,
                scenario_order,
                'rescue_first_standard_100',
                'rescue_first_standard_100',
                rescue_first_plan,
                rescue_eval,
            )
        )

    if progress_cb:
        progress_cb("Bangalore planner reset: completing exception-first Standard branch...")
    exception_first_plan = _complete_standard_branch_from_base(
        in_scope_grid,
        strict_base_plan,
        params,
        branch_type='exception_first',
        progress_cb=progress_cb,
        incumbent_plan=rescue_first_plan,
    )

    if progress_cb:
        progress_cb("Bangalore planner reset: evaluating exception-first Standard branch...")
    exception_eval = _evaluate_meeting_standard_branch(
        in_scope_grid,
        baseline_stores,
        exception_first_plan,
        [],
        standard_eval_params,
        params,
        progress_label='Exception-first Standard evaluation',
        progress_cb=progress_cb,
    )

    if progress_cb:
        progress_cb("Bangalore planner reset: evaluating strict Standard base...")
    strict_base_eval = _evaluate_meeting_standard_branch(
        in_scope_grid,
        baseline_stores,
        strict_base_plan,
        [],
        standard_eval_params,
        params,
        progress_label='Strict Standard base evaluation',
        progress_cb=progress_cb,
    )
    scenario_views['strict_standard_base'] = _build_meeting_scenario_view(
        'strict_standard_base',
        'Strict Standard Base',
        strict_base_plan,
        strict_base_eval['combined_metrics'],
        params,
        mini_sites=[],
        mini_summary=zero_mini_summary,
        candidate_universe_label=candidate_universe_label,
        spacing_mode_label='strict',
    )
    scenario_views['exception_first_standard_100'] = _build_meeting_scenario_view(
        'exception_first_standard_100',
        'Exception-First',
        exception_first_plan,
        exception_eval['standard_only_metrics'],
        params,
        mini_sites=[],
        mini_summary=zero_mini_summary,
        candidate_universe_label=candidate_universe_label,
        spacing_mode_label='rescue_relaxed' if int(exception_first_plan.get('rescue_count', 0) or 0) > 0 else 'strict',
    )
    scenario_order = [
        'strict_standard_base',
        'rescue_first_standard_100',
        'exception_first_standard_100',
    ]

    active_view_key = _pick_active_meeting_view_key(scenario_views) or 'rescue_first_standard_100'
    active_view = dict(scenario_views.get(active_view_key) or scenario_views['rescue_first_standard_100'])
    if active_view_key.startswith('exception_first'):
        active_branch_plan = exception_first_plan
        active_eval_bundle = exception_eval
        active_standard_only_key = 'exception_first_standard_100'
    elif active_view_key.startswith('rescue_first'):
        active_branch_plan = rescue_first_plan
        active_eval_bundle = rescue_eval
        active_standard_only_key = 'rescue_first_standard_100'
    else:
        active_branch_plan = strict_base_plan
        active_eval_bundle = strict_base_eval
        active_standard_only_key = 'strict_standard_base'

    return {
        'params': params,
        'in_scope_grid': in_scope_grid,
        'out_scope_grid': out_scope_grid,
        'business_regions': business_regions,
        'excluded_islands': excluded_islands,
        'scope_summary': scope_summary,
        'strict_base_plan': strict_base_plan,
        'rescue_first_plan': rescue_first_plan,
        'exception_first_plan': exception_first_plan,
        'active_branch_plan': active_branch_plan,
        'active_fixed_stores': active_fixed_stores,
        'baseline_stores': baseline_stores,
        'standard_eval_params': standard_eval_params,
        'mini_sites': [],
        'strict_base_eval': strict_base_eval,
        'rescue_eval': rescue_eval,
        'exception_eval': exception_eval,
        'active_eval_bundle': active_eval_bundle,
        'scenario_views': scenario_views,
        'scenario_order': scenario_order,
        'scenario_summaries': _meeting_scenario_summaries(scenario_order, scenario_views, active_view_key),
        'active_view_key': active_view_key,
        'active_standard_only_key': active_standard_only_key,
        'active_view': active_view,
        'candidate_universe_label': candidate_universe_label,
    }


def _build_meeting_core_quality_summary(params, scenario_views, active_view_key, defer_super):
    active_view = dict((scenario_views or {}).get(active_view_key) or {})
    coverage_pct = float(active_view.get('proposed_hard_coverage_pct', 0.0) or 0.0)
    fixed_mode = _effective_fixed_store_source_mode(params)
    overall_label = 'Decision-grade' if coverage_pct >= 99.0 else 'Review carefully'
    decision_layers = []
    if 'strict_standard_base' in (scenario_views or {}):
        decision_layers.append('Strict Standard Base')
    if 'rescue_first_standard_100' in (scenario_views or {}):
        decision_layers.append('Rescue-first 100%')
    if 'exception_first_standard_100' in (scenario_views or {}):
        decision_layers.append('Exception-first 100%')
    notes = [
        f"Decision-grade layer is aligned to the active {fixed_mode} fixed-store world and current service-radius policy."
    ]
    rescue_view = (scenario_views or {}).get('rescue_first_standard_100')
    exception_view = (scenario_views or {}).get('exception_first_standard_100')
    if rescue_view and exception_view:
        notes.append(
            "Two peer 100%-coverage Standard strategies are available in the current decision packet: rescue-first and exception-first."
        )
        if not bool(exception_view.get('branch_comparison_ready', True)):
            stop_reason = str(exception_view.get('branch_stop_reason') or '').strip()
            notes.append(
                "Exception-first is currently a bounded live comparison branch, not the blocking proof path."
                + (f" Stop reason: {stop_reason}." if stop_reason else "")
            )
    if int(active_view.get('exception_override_count', 0) or 0) > 0:
        notes.append(
            f"{int(active_view.get('exception_override_count', 0) or 0)} Exception Standard override(s) are active in the currently mapped branch."
        )
    if int(active_view.get('rescue_standard_count', 0) or 0) > 0:
        notes.append(
            f"{int(active_view.get('rescue_standard_count', 0) or 0)} rescue Standard site(s) are active in the currently mapped branch."
        )
    notes.append("Mini overlay is deferred from the first decision packet so the Standard answer lands faster.")
    if defer_super:
        notes.append("Super blanket is deferred from the decision packet in meeting-fast mode.")
    return {
        'mode': 'meeting_fast_core',
        'overall_label': overall_label,
        'fixed_store_world': fixed_mode,
        'decision_grade_layers': decision_layers,
        'verification_pending_layers': ['Mini overlay', 'Uncovered pockets / refinement'] + (['Super blanket'] if defer_super else []),
        'notes': notes,
    }


def _build_bangalore_multilayer_core_result(core_ctx, elapsed_s):
    params = core_ctx['params']
    active_view = dict(core_ctx['active_view'])
    scenario_views = dict(core_ctx['scenario_views'])
    scenario_order = list(core_ctx['scenario_order'])
    active_view_key = core_ctx['active_view_key']
    active_standard_only_key = core_ctx['active_standard_only_key']
    active_standard_only_view = dict(scenario_views.get(active_standard_only_key) or {})
    scope_summary = core_ctx['scope_summary']
    defer_super = bool(params.get('meeting_fast_mode', True)) and bool(params.get('meeting_fast_defer_super', True))
    active_fixed_stores = list(core_ctx.get('active_fixed_stores') or [])
    stores_json = [{
        'id': s['id'],
        'lat': s['lat'],
        'lon': s['lon'],
        'orders_per_day': s['orders_per_day'],
        'polygon_coords': s.get('polygon_coords', []),
    } for s in active_fixed_stores]
    decision_grade_result = {
        'active_view_key': active_view_key,
        'fixed_standard_count': int(active_view.get('fixed_standard_count', 0) or 0),
        'new_standard_count': int(active_view.get('base_new_standard_count', 0) or 0) + int(active_view.get('rescue_standard_count', 0) or 0),
        'base_new_standard_count': int(active_view.get('base_new_standard_count', 0) or 0),
        'rescue_standard_count': int(active_view.get('rescue_standard_count', 0) or 0),
        'gap_fill_standard_count': int(active_view.get('gap_fill_standard_count', 0) or 0),
        'spacing_relaxed_standard_count': int(active_view.get('spacing_relaxed_standard_count', 0) or 0),
        'total_physical_standard_count': int(active_view.get('total_physical_standard_count', 0) or 0),
        'exception_hub_count': int(active_view.get('exception_override_count', 0) or 0),
        'mini_count': 0,
        'proposed_hard_coverage_pct': float(active_view.get('proposed_hard_coverage_pct', 0.0) or 0.0),
        'proposed_avg_cost': float(active_view.get('proposed_avg_cost', 0.0) or 0.0),
        'proposed_avg_dist': float(active_view.get('proposed_avg_dist', 0.0) or 0.0) if active_view.get('proposed_avg_dist') is not None else None,
        'current_avg_cost': float(active_view.get('current_avg_cost', 0.0) or 0.0),
        'current_avg_dist': float(active_view.get('current_avg_dist', 0.0) or 0.0),
        'daily_savings': float(active_view.get('daily_savings', 0.0) or 0.0),
        'monthly_savings': float(active_view.get('monthly_savings', 0.0) or 0.0),
        **_meeting_context_fields(params),
    }
    layer_status = {
        'standard': 'computed',
        'exception_standard': 'computed' if int(active_view.get('exception_override_count', 0) or 0) > 0 else 'not_needed',
        'mini': 'deferred',
        'standard_only_comparison': 'computed',
        'branch_comparison': 'computed' if 'exception_first_standard_100' in scenario_views else 'deferred',
        'uncovered_analysis': 'deferred',
        'super': 'deferred' if defer_super else 'pending',
    }
    comparison_layers = {
        'current_network': {
            'avg_cost': active_view.get('current_avg_cost'),
            'avg_dist': active_view.get('current_avg_dist'),
            'policy_coverage_pct': active_view.get('metrics', {}).get('current_policy_coverage_pct'),
        },
        'standard_only': {
            'avg_cost': active_standard_only_view.get('proposed_avg_cost'),
            'avg_dist': active_standard_only_view.get('proposed_avg_dist'),
            'hard_coverage_pct': active_standard_only_view.get('proposed_hard_coverage_pct'),
        },
        'standard_plus_mini': {'deferred': True},
        'meeting_views': core_ctx.get('scenario_summaries', []),
    }
    planning_layers = {
        **dict(active_view.get('planning_layers') or {}),
        'mini': {
            'site_count': 0,
            'deferred': True,
        },
        'super': {
            'sites': [],
            'site_count': 0,
            'deferred': defer_super,
        },
        'comparison': comparison_layers,
    }
    rescue_summary = scenario_views.get('rescue_first_standard_100')
    exception_summary = scenario_views.get('exception_first_standard_100')
    core_recommendations = []
    if rescue_summary:
        rescue_prefix = "Rescue-first live path" if rescue_summary.get('branch_completion_mode') != 'exact' else "Rescue-first 100% path"
        core_recommendations.append(
            f"{rescue_prefix}: {int(rescue_summary.get('total_physical_standard_count', 0) or 0)} physical Standard sites "
            f"with {int(rescue_summary.get('exception_override_count', 0) or 0)} Exception override(s) at ₹{float(rescue_summary.get('proposed_avg_cost', 0.0) or 0.0):.2f}/order."
        )
    if exception_summary:
        exception_prefix = "Exception-first bounded live path" if not bool(exception_summary.get('branch_comparison_ready', True)) else "Exception-first 100% path"
        core_recommendations.append(
            f"{exception_prefix}: {int(exception_summary.get('total_physical_standard_count', 0) or 0)} physical Standard sites "
            f"with {int(exception_summary.get('exception_override_count', 0) or 0)} Exception override(s) at ₹{float(exception_summary.get('proposed_avg_cost', 0.0) or 0.0):.2f}/order."
        )
    if active_view_key in scenario_views:
        core_recommendations.append(
            f"Map and hub table currently follow {active_view.get('label', active_view_key)} because it is the stronger meeting-mode choice inside the compact frontier."
        )
    return {
        'success': True,
        'response_version': 2,
        'result_contract': 'decision_plus_deferred',
        'decision_grade_result': decision_grade_result,
        'deferred_result': {
            'ready': False,
            'pending_layers': [layer for layer, status in layer_status.items() if status == 'deferred' or status == 'pending'],
        },
        'layer_status': layer_status,
        'budget': {
            'target_seconds': int(float(params.get('meeting_target_seconds', 600) or 600)),
            'elapsed_seconds': round(float(elapsed_s), 1),
            'core_ready': True,
            'deferred_ready': False,
        },
        'cache_provenance': {
            'meeting_fast_mode': bool(params.get('meeting_fast_mode', True)),
            'meeting_prewarm_ready': bool(state.meeting_prewarm_ready),
            'reuse_tier_edge_cache': bool(params.get('reuse_tier_edge_cache', True)),
            **_meeting_context_fields(params),
        },
        **_meeting_context_fields(params),
        'mini_ds': [],
        'standard_ds': list(active_view.get('standard_ds') or []),
        'super_ds': [],
        'metrics': dict(active_view.get('metrics') or {}),
        'analysis': {
            'service_gap_polygons': [],
            'service_gap_source': 'deferred',
            'recommendations': core_recommendations,
            'meeting_insights': [],
            'scope_summary': scope_summary,
            'standard_gap_summary': None,
            'deferred': True,
        },
        'planning_layers': planning_layers,
        'scenario_views': scenario_views,
        'scenario_order': scenario_order,
        'scenario_summaries': core_ctx.get('scenario_summaries', []),
        'scope_summary': scope_summary,
        'business_regions': core_ctx.get('business_regions', state.business_regions),
        'excluded_islands': core_ctx.get('excluded_islands', state.excluded_islands),
        'uncovered_pockets': [],
        'existing_stores': stores_json,
        'city_bounds': state.city_bounds,
        'compute_time_s': round(float(elapsed_s), 1),
        'params': params,
        'pipeline': {
            'mode': 'bangalore_multilayer_reset',
            'meeting_mode': bool(params.get('meeting_fast_mode', True)),
            'phase': 'core_decision_packet',
            'active_view_key': active_view_key,
            'fixed_standard_count': int(active_view.get('fixed_standard_count', 0) or 0),
            'new_standard_count': int(active_view.get('base_new_standard_count', 0) or 0) + int(active_view.get('rescue_standard_count', 0) or 0),
            'mini_count': 0,
            'super_count': 0,
        },
        'quality_summary': _build_meeting_core_quality_summary(params, scenario_views, active_view_key, defer_super),
        'pipeline_warnings': (
            ['Deferred enrichment still pending: Mini overlay, uncovered-gap analysis, and optional Super blanket.']
            + (
                ['Super blanket is deferred in meeting-fast mode.']
                if defer_super else
                ['Super blanket remains pending in meeting mode.']
            )
        ),
        **scenario_views,
    }


def _finalize_bangalore_multilayer_result_from_core(core_ctx, progress_cb=None):
    params = core_ctx['params']
    in_scope_grid = core_ctx['in_scope_grid']
    business_regions = core_ctx['business_regions']
    excluded_islands = core_ctx['excluded_islands']
    scope_summary = core_ctx['scope_summary']
    scenario_views = dict(core_ctx['scenario_views'])
    active_view_key = core_ctx['active_view_key']
    active_standard_only_key = core_ctx['active_standard_only_key']
    strict_base_plan = core_ctx['strict_base_plan']
    rescue_first_plan = core_ctx['rescue_first_plan']
    exception_first_plan = core_ctx['exception_first_plan']
    baseline_stores = core_ctx['baseline_stores']
    standard_eval_params = dict(core_ctx['standard_eval_params'])
    candidate_universe_label = core_ctx.get('candidate_universe_label') or _standard_candidate_universe_label(params)

    if progress_cb:
        progress_cb("Mini overlay: scanning dense in-scope clusters...")
    mini_sites = _plan_mini_overlay(in_scope_grid, params, progress_cb=progress_cb)

    if progress_cb:
        progress_cb("Bangalore planner reset: evaluating rescue-first Standard + Mini...")
    rescue_mini_eval = _evaluate_meeting_standard_branch(
        in_scope_grid,
        baseline_stores,
        rescue_first_plan,
        mini_sites,
        standard_eval_params,
        params,
        progress_label='Rescue-first Standard+Mini evaluation',
        progress_cb=progress_cb,
    )
    if progress_cb:
        progress_cb("Bangalore planner reset: evaluating exception-first Standard + Mini...")
    exception_mini_eval = _evaluate_meeting_standard_branch(
        in_scope_grid,
        baseline_stores,
        exception_first_plan,
        mini_sites,
        standard_eval_params,
        params,
        progress_label='Exception-first Standard+Mini evaluation',
        progress_cb=progress_cb,
    )

    scenario_views['rescue_first_standard_100_plus_mini'] = _build_meeting_scenario_view(
        'rescue_first_standard_100_plus_mini',
        'Rescue-Standard-First + Mini',
        rescue_first_plan,
        rescue_mini_eval['combined_metrics'],
        params,
        mini_sites=mini_sites,
        mini_summary=rescue_mini_eval['mini_summary'],
        candidate_universe_label=candidate_universe_label,
        spacing_mode_label='rescue_relaxed' if int(rescue_first_plan.get('rescue_count', 0) or 0) > 0 else 'strict',
    )
    scenario_views['exception_first_standard_100_plus_mini'] = _build_meeting_scenario_view(
        'exception_first_standard_100_plus_mini',
        'Exception-First + Mini',
        exception_first_plan,
        exception_mini_eval['combined_metrics'],
        params,
        mini_sites=mini_sites,
        mini_summary=exception_mini_eval['mini_summary'],
        candidate_universe_label=candidate_universe_label,
        spacing_mode_label='rescue_relaxed' if int(exception_first_plan.get('rescue_count', 0) or 0) > 0 else 'strict',
    )
    for view_key, parent_key in (
        ('rescue_first_standard_100_plus_mini', 'rescue_first_standard_100'),
        ('exception_first_standard_100_plus_mini', 'exception_first_standard_100'),
    ):
        mini_view = scenario_views[view_key]
        parent_view = scenario_views[parent_key]
        mini_view['avg_cost_delta_vs_parent'] = round(
            float(parent_view.get('proposed_avg_cost', 0.0) or 0.0) - float(mini_view.get('proposed_avg_cost', 0.0) or 0.0),
            2,
        )
        if mini_view.get('proposed_avg_dist') is not None and parent_view.get('proposed_avg_dist') is not None:
            mini_view['avg_dist_delta_vs_parent'] = round(
                float(parent_view.get('proposed_avg_dist', 0.0) or 0.0) - float(mini_view.get('proposed_avg_dist', 0.0) or 0.0),
                3,
            )
        else:
            mini_view['avg_dist_delta_vs_parent'] = None
        mini_view['orders_shifted_from_standard_per_day'] = float(
            ((mini_view.get('mini_overlay_summary') or {}).get('orders_shifted_from_standard_per_day', 0.0) or 0.0)
        )
    scenario_order = [
        'strict_standard_base',
        'rescue_first_standard_100',
        'exception_first_standard_100',
        'rescue_first_standard_100_plus_mini',
        'exception_first_standard_100_plus_mini',
    ]
    active_view = dict(scenario_views.get(active_view_key) or {})
    active_standard_only_view = dict(scenario_views.get(active_standard_only_key) or {})
    active_mini_view_key = f"{active_view_key}_plus_mini" if f"{active_view_key}_plus_mini" in scenario_views else None
    active_mini_view = dict(scenario_views.get(active_mini_view_key) or {})
    standard_plan = core_ctx['active_branch_plan']
    standard_sites = list(standard_plan.get('all_sites') or [])
    combined_metrics = dict(active_mini_view.get('metrics') or active_view.get('metrics') or {})
    standard_only_metrics = dict(active_standard_only_view.get('metrics') or {})

    defer_super = bool(params.get('meeting_fast_mode', True)) and bool(params.get('meeting_fast_defer_super', True))
    if defer_super:
        if progress_cb:
            progress_cb("Meeting fast mode: Super blanket remains deferred during enrichment.")
        super_plan = {
            'sites': [],
            'site_count': 0,
            'blanket_coverage_pct': 0.0,
            'new_super_site_count': 0,
            'reused_standard_site_count': 0,
            'sample_point_count': 0,
            'deferred': True,
        }
        super_sites = []
        super_cost_summary = {
            'avg_cost_if_served_by_super': None,
            'avg_dist_if_served_by_super': None,
            'order_coverage_pct_if_super_serves': 0.0,
        }
    else:
        if progress_cb:
            progress_cb("Bangalore planner reset: building separate Super blanket layer...")
        super_plan = _plan_super_blanket(
            in_scope_grid, business_regions, excluded_islands, standard_sites, params, progress_cb=progress_cb
        )
        super_sites = super_plan['sites']
        super_cost_summary = _summarize_super_blanket_order_cost(in_scope_grid, super_sites, params)
    mini_summary = dict(active_mini_view.get('mini_overlay_summary') or {})
    mini_summary['site_count'] = len(mini_sites)
    super_plan['site_count'] = len(super_sites)

    uncovered_mask = ~standard_plan['covered_mask']
    uncovered_pockets = []
    gap_polygons = []
    if np.any(uncovered_mask):
        clat = in_scope_grid['cell_lat'].values.astype(np.float64)
        clon = in_scope_grid['cell_lon'].values.astype(np.float64)
        weights = in_scope_grid['orders_per_day'].values.astype(np.float64)
        uncovered_pockets = _group_uncovered_pockets(
            clat[uncovered_mask], clon[uncovered_mask], weights[uncovered_mask],
            pocket_radius_km=float(params.get('uncovered_pocket_radius_km', 3.0) or 3.0),
            include_cell_indices=True,
            progress_cb=progress_cb,
        )
        remaining_idx = np.where(uncovered_mask)[0]
        for pocket in uncovered_pockets:
            local_idx = [int(x) for x in pocket.get('cell_indices', [])]
            pocket['cell_indices'] = [int(remaining_idx[j]) for j in local_idx if 0 <= int(j) < len(remaining_idx)]
        gap_polygons = _build_service_gap_polygons(uncovered_pockets, in_scope_grid, stage_label='standard_base')

    metrics = dict(combined_metrics)
    metrics.update({
        'standard_only_proposed_avg_cost': standard_only_metrics.get('proposed_avg_cost'),
        'standard_only_proposed_avg_dist': standard_only_metrics.get('proposed_avg_dist'),
        'standard_only_hard_coverage_pct': standard_only_metrics.get('proposed_hard_coverage_pct'),
        'standard_only_hybrid_coverage_pct': standard_only_metrics.get('proposed_hybrid_coverage_pct'),
        'in_scope_orders_per_day': scope_summary['in_scope_orders_per_day'],
        'out_of_scope_orders_per_day': scope_summary['out_of_scope_orders_per_day'],
        'scope_mode': 'standard_all_business_polygons_super_excludes_islands',
    })

    recommendations = []
    rescue_summary = scenario_views.get('rescue_first_standard_100')
    exception_summary = scenario_views.get('exception_first_standard_100')
    rescue_mini_summary = scenario_views.get('rescue_first_standard_100_plus_mini')
    exception_mini_summary = scenario_views.get('exception_first_standard_100_plus_mini')
    if rescue_summary:
        recommendations.append(
            f"Rescue-first 100% path: {int(rescue_summary.get('total_physical_standard_count', 0) or 0)} physical Standard sites, "
            f"{int(rescue_summary.get('rescue_standard_count', 0) or 0)} rescue Standard site(s), "
            f"{int(rescue_summary.get('exception_override_count', 0) or 0)} Exception override(s), "
            f"₹{float(rescue_summary.get('proposed_avg_cost', 0.0) or 0.0):.2f}/order."
        )
    if exception_summary:
        recommendations.append(
            f"Exception-first 100% path: {int(exception_summary.get('total_physical_standard_count', 0) or 0)} physical Standard sites, "
            f"{int(exception_summary.get('rescue_standard_count', 0) or 0)} rescue Standard site(s), "
            f"{int(exception_summary.get('exception_override_count', 0) or 0)} Exception override(s), "
            f"₹{float(exception_summary.get('proposed_avg_cost', 0.0) or 0.0):.2f}/order."
        )
    if rescue_mini_summary and float(rescue_mini_summary.get('avg_cost_delta_vs_parent', 0.0) or 0.0) > 0:
        recommendations.append(
            f"Mini on rescue-first improves avg last-mile cost by about ₹{float(rescue_mini_summary.get('avg_cost_delta_vs_parent', 0.0) or 0.0):.2f}/order."
        )
    if exception_mini_summary and float(exception_mini_summary.get('avg_cost_delta_vs_parent', 0.0) or 0.0) > 0:
        recommendations.append(
            f"Mini on exception-first improves avg last-mile cost by about ₹{float(exception_mini_summary.get('avg_cost_delta_vs_parent', 0.0) or 0.0):.2f}/order."
        )
    if standard_plan['infeasible_under_cap']:
        recommendations.append(
            f"Active mapped branch still leaves {standard_plan['uncovered_orders_per_day']:.0f} in-scope orders/day uncovered "
            f"under the current Standard radius/spacing settings."
        )
    else:
        recommendations.append(
            f"Active mapped branch is {active_view.get('label', active_view_key)} at {standard_plan['coverage_pct']:.2f}% hard coverage "
            f"using {standard_plan['fixed_count']} fixed + {standard_plan['new_count']} new physical Standard stores."
        )
    if standard_plan.get('exception_count', 0):
        recommendations.append(
            f"{standard_plan['exception_count']} Exception Standard hub(s) are stretched beyond {float(params.get('standard_ds_radius', 3.0) or 3.0):.1f} km "
            f"up to {float(params.get('standard_exception_radius_km', 5.0) or 5.0):.1f} km to close the last coverage gaps."
        )
    if standard_plan.get('rescue_count', 0):
        recommendations.append(
            f"{standard_plan['rescue_count']} rescue Standard site(s) were added after the core optimization with relaxed spacing and a modeled penalty of ₹{float(params.get('standard_rescue_open_penalty_per_day', 0.0) or 0.0):.0f}/site/day to push toward full coverage without reopening the whole network design."
        )
    if mini_summary['site_count'] > 0:
        recommendations.append(
            f"Mini overlay shifts {mini_summary['orders_shifted_from_standard_per_day']:.0f} orders/day into dense local service, "
            f"reducing average cost by about ₹{mini_summary['avg_cost_reduction_per_order']:.2f}/order."
        )
    if defer_super:
        recommendations.append(
            "Super blanket was deferred in meeting-fast mode so the decision-grade Standard/Exception/Mini answer could land first."
        )
    else:
        recommendations.append(
            f"Super blanket uses {len(super_sites)} sites to cover {super_plan['blanket_coverage_pct']:.2f}% of the in-scope geometry sample."
        )
    if bool(params.get('meeting_fast_mode', True)) and not defer_super:
        recommendations.append(
            "Super blanket is running in fast sampled-geometry mode for meeting use. Treat Super coverage as sample-validated and keep Standard/Exception decisions as the primary decision-grade layer."
        )
    if excluded_islands:
        recommendations.append(
            f"Standard hard coverage includes {len(excluded_islands)} island polygon(s); the separate Super blanket excludes those islands."
        )
    meeting_quality = _build_meeting_quality_summary(params, standard_plan, mini_summary, super_plan)
    meeting_insights = _build_meeting_insights(
        params,
        standard_plan,
        mini_summary,
        super_plan,
        standard_only_metrics,
        combined_metrics,
    )

    planning_layers = {
        **dict(active_view.get('planning_layers') or {}),
        'mini': {
            **mini_summary,
            'site_count': len(mini_sites),
            'sites': _copy_site_records(mini_sites),
        },
        'super': {
            'sites': super_sites,
            **super_plan,
            **super_cost_summary,
        },
        'comparison': {
            'current_network': {
                'avg_cost': combined_metrics['current_avg_cost'],
                'avg_dist': combined_metrics['current_avg_dist'],
                'policy_coverage_pct': combined_metrics['current_policy_coverage_pct'],
            },
            'standard_only': {
                'avg_cost': standard_only_metrics['proposed_avg_cost'],
                'avg_dist': standard_only_metrics['proposed_avg_dist'],
                'hard_coverage_pct': standard_only_metrics['proposed_hard_coverage_pct'],
            },
            'standard_plus_mini': {
                'avg_cost': combined_metrics['proposed_avg_cost'],
                'avg_dist': combined_metrics['proposed_avg_dist'],
                'hard_coverage_pct': combined_metrics['proposed_hard_coverage_pct'],
            },
            'meeting_views': _meeting_scenario_summaries(scenario_order, scenario_views, active_view_key),
            'super_blanket': {
                'site_count': len(super_sites),
                'blanket_coverage_pct': super_plan['blanket_coverage_pct'],
                'deferred': bool(super_plan.get('deferred', False)),
                **super_cost_summary,
            },
        },
    }

    return {
        'mini_ds': mini_sites,
        'standard_ds': standard_plan['new_sites'],
        'super_ds': super_sites,
        'metrics': metrics,
        'analysis': {
            'service_gap_polygons': gap_polygons,
            'service_gap_source': 'standard_base_network',
            'recommendations': recommendations,
            'meeting_insights': meeting_insights,
            'scenario_summaries': _meeting_scenario_summaries(scenario_order, scenario_views, active_view_key),
            'scope_summary': scope_summary,
            'uncovered_pocket_radius_km': float(params.get('uncovered_pocket_radius_km', 3.0) or 3.0),
            'standard_gap_summary': {
                'gap_count': len(uncovered_pockets),
                'largest_gap_orders_per_day': max([float(p.get('orders_per_day', 0) or 0) for p in uncovered_pockets] or [0.0]),
            },
        },
        'planning_layers': planning_layers,
        'scenario_views': scenario_views,
        'scenario_order': scenario_order,
        'scope_summary': scope_summary,
        'business_regions': business_regions,
        'excluded_islands': excluded_islands,
        **_meeting_context_fields(params),
        'uncovered_pockets': [{k: v for k, v in pocket.items() if k != 'cell_indices'} for pocket in uncovered_pockets],
        'pipeline': {
            'mode': 'bangalore_multilayer_reset',
            'meeting_mode': bool(params.get('meeting_fast_mode', True)),
            'active_view_key': active_view_key,
            'fixed_standard_count': standard_plan['fixed_count'],
            'new_standard_count': standard_plan['new_count'],
            'mini_count': len(mini_sites),
            'super_count': len(super_sites),
        },
        'quality_summary': meeting_quality,
        'pipeline_warnings': (
            (
                ['Super blanket was deferred in fast meeting mode so the Standard/Exception/Mini answer could return first.']
                if defer_super
                else ['Super blanket is sample-validated in fast meeting mode; exact polygon blanket verification pending.']
            )
            if bool(params.get('meeting_fast_mode', True))
            else []
        ),
        **scenario_views,
    }


def optimize_bangalore_multilayer_plan(params, progress_cb=None):
    core_ctx = _prepare_bangalore_multilayer_core_context(params, progress_cb=progress_cb)
    return _finalize_bangalore_multilayer_result_from_core(core_ctx, progress_cb=progress_cb)


# ============================================================================
# HTTP SERVER
# ============================================================================
class Handler(SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/' or path == '/index.html':
            self._serve_file('static/index.html', 'text/html')
        elif path.startswith('/static/'):
            rel_path = path.lstrip('/')
            content_type, _ = mimetypes.guess_type(rel_path)
            self._serve_file(rel_path, content_type or 'application/octet-stream')
        elif path == '/api/status':
            current_result = state.optimization_result if isinstance(state.optimization_result, dict) else {}
            budget = current_result.get('budget', {}) if isinstance(current_result, dict) else {}
            pipeline = current_result.get('pipeline', {}) if isinstance(current_result, dict) else {}
            resp = {
                'data_loaded': state.data_loaded,
                'load_progress': state.load_progress,
                'total_orders': state.total_orders,
                'orders_per_day': state.orders_per_day,
                'num_stores': len(state.existing_stores),
                'num_grid_cells': len(state.grid_data) if state.grid_data is not None else 0,
                'scope_summary': state.scope_summary,
                'demand_input_mode': state.demand_input_mode,
                'live_store_detection_mode': state.live_store_detection_mode,
                'osrm_available': state.osrm_available,
                'osrm_url': OSRM_BASE_URL,
                'optimization_running': state.optimization_running,
                'optimization_deferred_running': state.optimization_deferred_running,
                'optimization_progress': state.optimization_progress,
                'optimization_run_id': state.optimization_run_id,
                'optimization_core_ready': bool(budget.get('core_ready', False)),
                'optimization_deferred_ready': bool(budget.get('deferred_ready', False)),
                'optimization_phase': pipeline.get('phase'),
                'meeting_prewarm_running': state.meeting_prewarm_running,
                'meeting_prewarm_core_ready': state.meeting_prewarm_core_ready,
                'meeting_prewarm_ready': state.meeting_prewarm_ready,
                'meeting_prewarm_progress': state.meeting_prewarm_progress,
                'meeting_prewarm_error': state.meeting_prewarm_error,
            }
            if state.local_load_result is not None:
                resp['local_load_result'] = state.local_load_result
            self._json(resp)
        elif path == '/api/data':
            if not state.data_loaded:
                self._json({'error': 'No data loaded yet'}, 400)
                return
            heatmap = generate_heatmap(state.grid_data)
            stores = [{
                'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                'orders_per_day': s['orders_per_day'],
                'polygon_coords': s.get('polygon_coords', [])
            } for s in state.existing_stores]
            self._json({
                'existing_stores': stores,
                'business_regions': state.business_regions,
                'excluded_islands': state.excluded_islands,
                'scope_summary': state.scope_summary,
                'city_bounds': state.city_bounds,
                'heatmap': heatmap,
                'orders_per_day': state.orders_per_day,
                'total_orders': state.total_orders,
                'osrm_available': state.osrm_available,
            })
        elif path == '/api/bootstrap-state':
            current_result = state.optimization_result if isinstance(state.optimization_result, dict) else {}
            budget = current_result.get('budget', {}) if isinstance(current_result, dict) else {}
            pipeline = current_result.get('pipeline', {}) if isinstance(current_result, dict) else {}
            resp = {
                'data_loaded': state.data_loaded,
                'load_progress': state.load_progress,
                'total_orders': state.total_orders,
                'orders_per_day': state.orders_per_day,
                'num_stores': len(state.existing_stores),
                'num_grid_cells': len(state.grid_data) if state.grid_data is not None else 0,
                'scope_summary': state.scope_summary,
                'demand_input_mode': state.demand_input_mode,
                'live_store_detection_mode': state.live_store_detection_mode,
                'fixed_store_source_mode': state.fixed_store_source_mode,
                'osrm_available': state.osrm_available,
                'osrm_url': OSRM_BASE_URL,
                'optimization_running': state.optimization_running,
                'optimization_deferred_running': state.optimization_deferred_running,
                'optimization_progress': state.optimization_progress,
                'optimization_run_id': state.optimization_run_id,
                'optimization_core_ready': bool(budget.get('core_ready', False)),
                'optimization_deferred_ready': bool(budget.get('deferred_ready', False)),
                'optimization_phase': pipeline.get('phase'),
                'meeting_prewarm_running': state.meeting_prewarm_running,
                'meeting_prewarm_core_ready': state.meeting_prewarm_core_ready,
                'meeting_prewarm_ready': state.meeting_prewarm_ready,
                'meeting_prewarm_progress': state.meeting_prewarm_progress,
                'meeting_prewarm_error': state.meeting_prewarm_error,
            }
            if state.local_load_result is not None:
                resp['local_load_result'] = state.local_load_result
            if state.data_loaded:
                resp['existing_stores'] = [{
                    'id': s['id'],
                    'lat': s['lat'],
                    'lon': s['lon'],
                    'orders_per_day': s.get('orders_per_day', 0),
                    'cells': s.get('cells'),
                    'avg_assigned_distance_km': s.get('avg_assigned_distance_km'),
                    'polygon_coords': s.get('polygon_coords', []),
                } for s in state.existing_stores]
                resp['business_regions'] = state.business_regions
                resp['excluded_islands'] = state.excluded_islands
                resp['city_bounds'] = state.city_bounds
            self._json(resp)
        elif path == '/api/result':
            if state.optimization_result:
                self._json(state.optimization_result)
            else:
                self._json({'error': 'No optimization result'}, 404)
        elif path == '/api/load-latest-exact-benchmark':
            try:
                state.optimization_result = _load_latest_exact_benchmark_app_result()
                self._json({
                    'ok': True,
                    'loaded': True,
                    'selected_view': ((state.optimization_result or {}).get('exact_metadata') or {}).get('selected_view'),
                })
            except Exception as e:
                self._json({'ok': False, 'error': str(e)}, 400)
        elif path == '/api/check-osrm':
            avail = check_osrm()
            state.osrm_available = avail
            self._json({'osrm_available': avail, 'osrm_url': OSRM_BASE_URL})
        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/upload-orders':
            self._handle_upload('orders')
        elif path == '/api/upload-stores':
            self._handle_upload('stores')
        elif path == '/api/load-local-orders':
            self._handle_load_local('orders')
        elif path == '/api/load-local-stores':
            self._handle_load_local('stores')
        elif path == '/api/fixed-store-preview':
            self._handle_fixed_store_preview()
        elif path == '/api/prewarm-meeting-assets':
            self._handle_prewarm_meeting_assets()
        elif path == '/api/optimize':
            self._handle_optimize()
        elif path == '/api/optimize-constrained':
            self._handle_optimize_constrained()
        elif path == '/api/optimize-exact-benchmark':
            self._handle_optimize_exact_benchmark()
        elif path == '/api/optimize-target':
            self._handle_optimize_target()
        elif path == '/api/reset':
            state.reset()
            self._json({'ok': True})
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _handle_load_local(self, upload_type):
        """Load a file directly from a local file path (no upload needed)."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            params = json.loads(body) if body else {}
            filepath = params.get('filepath', '').strip()

            if not filepath:
                self._json({'error': 'No filepath provided'}, 400)
                return

            # Strip surrounding quotes (users often paste paths with quotes)
            filepath = filepath.strip("'\"")

            # Expand ~ and resolve path
            filepath = os.path.expanduser(filepath)
            filepath = os.path.abspath(filepath)

            if not os.path.isfile(filepath):
                self._json({'error': f'File not found: {filepath}'}, 404)
                return

            file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
            filename = os.path.basename(filepath)
            logger.info(f"Loading local {upload_type}: {filepath} ({file_size_mb:.1f} MB)")

            state.osrm_available = check_osrm()

            if upload_type == 'orders':
                # Load directly from disk path — no copy needed
                state.load_progress = f"Loading {filename} ({file_size_mb:.0f} MB)..."

                def do_load():
                    try:
                        mapping = load_order_csv(filepath)
                        state.local_load_result = {
                            'ok': True,
                            'filename': filename,
                            'total_orders': state.total_orders,
                            'orders_per_day': state.orders_per_day,
                            'grid_cells': len(state.grid_data),
                            'column_mapping': mapping,
                            'unique_dates': state.unique_dates,
                            'demand_input_mode': state.demand_input_mode,
                            'scope_summary': state.scope_summary,
                        }
                        state.load_progress = "Orders loaded successfully"
                        if state.store_regions and _auto_prewarm_meeting_enabled():
                            _start_meeting_prewarm_async(force=False)
                    except Exception as e:
                        logger.error(f"Local load error: {traceback.format_exc()}")
                        state.local_load_result = {'error': str(e)}
                        state.load_progress = f"Error: {e}"

                # Run in background for large files
                if file_size_mb > 100:
                    state.local_load_result = None
                    thread = threading.Thread(target=do_load, daemon=True)
                    thread.start()
                    self._json({
                        'ok': True,
                        'async': True,
                        'message': f'Loading {filename} ({file_size_mb:.0f} MB) in background. Poll /api/status for progress.',
                    })
                else:
                    do_load()
                    if state.local_load_result and 'error' in state.local_load_result:
                        self._json(state.local_load_result, 500)
                    else:
                        self._json(state.local_load_result)
            else:
                stores = load_store_xlsx(filepath)
                state.data_loaded = True
                if state.grid_data is not None and _auto_prewarm_meeting_enabled():
                    _start_meeting_prewarm_async(force=False)
                self._json({
                    'ok': True,
                    'filename': filename,
                    'num_stores': len(stores),
                    'total_site_regions': len(state.store_regions),
                    'live_store_detection_mode': state.live_store_detection_mode,
                    'scope_summary': state.scope_summary,
                    'business_polygon_count': len(state.business_regions),
                    'excluded_island_count': len(state.excluded_islands),
                    'stores': [{
                        'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                        'orders_per_day': s['orders_per_day'],
                        'polygon_coords': s.get('polygon_coords', [])
                    } for s in stores],
                })

        except Exception as e:
            logger.error(f"Local load error: {traceback.format_exc()}")
            self._json({'error': str(e)}, 500)

    def _handle_fixed_store_preview(self):
        try:
            if state.grid_data is None or state.store_regions is None:
                self._json({'error': 'Load orders and stores first'}, 400)
                return
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            params = json.loads(body) if body else {}
            preview_sites = _build_fixed_standard_sites(params)
            self._json({
                'ok': True,
                'fixed_store_world': _effective_fixed_store_world(params),
                'fixed_store_mode': _effective_fixed_store_mode(params),
                'fixed_store_source_mode': _effective_fixed_store_source_mode(params),
                'num_stores': len(preview_sites),
                'existing_stores': [{
                    'id': s['id'],
                    'lat': s['lat'],
                    'lon': s['lon'],
                    'orders_per_day': s.get('orders_per_day', 0),
                    'polygon_coords': s.get('polygon_coords', []),
                } for s in preview_sites],
                'business_regions': state.business_regions,
                'excluded_islands': state.excluded_islands,
            })
        except Exception as e:
            logger.error(f"Fixed-store preview error: {traceback.format_exc()}")
            self._json({'error': str(e)}, 500)

    def _handle_prewarm_meeting_assets(self):
        try:
            if state.grid_data is None or state.store_regions is None:
                self._json({'error': 'Load orders and stores first'}, 400)
                return
            started = _start_meeting_prewarm_async(force=False)
            self._json({
                'ok': True,
                'started': bool(started),
                'meeting_prewarm_running': state.meeting_prewarm_running,
                'meeting_prewarm_core_ready': state.meeting_prewarm_core_ready,
                'meeting_prewarm_ready': state.meeting_prewarm_ready,
                'meeting_prewarm_progress': state.meeting_prewarm_progress,
                'meeting_prewarm_error': state.meeting_prewarm_error,
            })
        except Exception as e:
            logger.error(f"Meeting prewarm error: {traceback.format_exc()}")
            self._json({'error': str(e)}, 500)

    def _handle_upload(self, upload_type):
        """Handle multipart file upload — streams to disk for large files."""
        try:
            content_type = self.headers.get('Content-Type', '')
            content_length = int(self.headers.get('Content-Length', 0))

            # Determine save path
            if 'multipart/form-data' in content_type:
                # For multipart, we still need to parse to get filename
                # But stream to a temp file first to avoid holding in memory
                boundary = content_type.split('boundary=')[1].strip()

                if content_length > 200 * 1024 * 1024:  # >200MB: stream to temp file
                    logger.info(f"Large upload ({content_length/1048576:.0f} MB), streaming to disk...")
                    state.load_progress = f"Receiving file ({content_length/1048576:.0f} MB)..."
                    tmp_path = os.path.join(UPLOAD_DIR, f'{upload_type}_tmp')
                    bytes_read = 0
                    chunk_size = 8 * 1024 * 1024  # 8MB chunks
                    with open(tmp_path, 'wb') as f:
                        while bytes_read < content_length:
                            to_read = min(chunk_size, content_length - bytes_read)
                            data = self.rfile.read(to_read)
                            if not data:
                                break
                            f.write(data)
                            bytes_read += len(data)
                            pct = int(bytes_read / content_length * 100)
                            state.load_progress = f"Receiving file... {pct}% ({bytes_read/1048576:.0f} MB)"

                    # Parse from disk
                    with open(tmp_path, 'rb') as f:
                        body = f.read()
                    filename, file_data = self._parse_multipart(body, boundary)
                    del body  # free
                    os.remove(tmp_path)
                else:
                    body = self.rfile.read(content_length)
                    filename, file_data = self._parse_multipart(body, boundary)
            else:
                file_data = self.rfile.read(content_length)
                filename = self.headers.get('X-Filename', f'upload.{"csv" if upload_type == "orders" else "xlsx"}')

            if not file_data:
                self._json({'error': 'No file data received'}, 400)
                return

            # Save to disk
            ext = os.path.splitext(filename)[1].lower()
            save_path = os.path.join(UPLOAD_DIR, f'{upload_type}{ext}')
            with open(save_path, 'wb') as f:
                f.write(file_data)

            logger.info(f"Uploaded {upload_type}: {filename} ({len(file_data)} bytes)")

            # Check OSRM
            state.osrm_available = check_osrm()

            if upload_type == 'orders':
                mapping = load_order_csv(save_path)
                if state.store_regions and _auto_prewarm_meeting_enabled():
                    _start_meeting_prewarm_async(force=False)
                self._json({
                    'ok': True,
                    'filename': filename,
                    'total_orders': state.total_orders,
                    'orders_per_day': state.orders_per_day,
                    'grid_cells': len(state.grid_data),
                    'column_mapping': mapping,
                    'unique_dates': state.unique_dates,
                    'demand_input_mode': state.demand_input_mode,
                    'scope_summary': state.scope_summary,
                })
            else:
                stores = load_store_xlsx(save_path)
                state.data_loaded = True  # Both files now loaded
                if state.grid_data is not None and _auto_prewarm_meeting_enabled():
                    _start_meeting_prewarm_async(force=False)
                self._json({
                    'ok': True,
                    'filename': filename,
                    'num_stores': len(stores),
                    'total_site_regions': len(state.store_regions),
                    'live_store_detection_mode': state.live_store_detection_mode,
                    'scope_summary': state.scope_summary,
                    'business_polygon_count': len(state.business_regions),
                    'excluded_island_count': len(state.excluded_islands),
                    'stores': [{
                        'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                        'orders_per_day': s['orders_per_day'],
                        'polygon_coords': s.get('polygon_coords', [])
                    } for s in stores],
                })

        except Exception as e:
            logger.error(f"Upload error: {traceback.format_exc()}")
            self._json({'error': str(e)}, 500)

    def _parse_multipart(self, body, boundary):
        """Parse multipart form data, return (filename, file_bytes)."""
        boundary_bytes = boundary.encode()
        parts = body.split(b'--' + boundary_bytes)
        for part in parts:
            if b'Content-Disposition' not in part:
                continue
            # Extract headers and content
            header_end = part.find(b'\r\n\r\n')
            if header_end < 0:
                continue
            headers_raw = part[:header_end].decode('utf-8', errors='replace')
            content = part[header_end + 4:]
            # Remove trailing \r\n
            if content.endswith(b'\r\n'):
                content = content[:-2]

            # Extract filename
            fn_match = re.search(r'filename="([^"]+)"', headers_raw)
            if fn_match:
                return fn_match.group(1), content
        return 'upload', body

    def _handle_optimize(self):
        """Run the 3-tier optimization."""
        if state.grid_data is None:
            self._json({'error': 'No order data loaded. Upload orders CSV first.'}, 400)
            return
        if state.optimization_running:
            self._json({'error': 'Optimization already running'}, 409)
            return
        state.osrm_available = check_osrm()
        if not state.osrm_available:
            self._json({
                'error': (
                    'OSRM is required for all road distances. Start an OSRM server, set OSRM_URL '
                    '(default http://localhost:5000), then verify GET /api/check-osrm.'
                ),
            }, 503)
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            params = json.loads(body) if body else {}
        except:
            params = {}

        # Run optimization in background
        def run():
            try:
                state.optimization_running = True
                t0 = time.time()
                nonlocal params
                params = normalize_placement_params(params)

                state.optimization_progress = "Placing Mini, Standard, Super (overlapping, full grid)..."
                layout = place_overlapping_tier_hubs(
                    state.grid_data, params,
                    progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                )
                mini_ds = layout['mini_ds']
                standard_ds = layout['standard_ds']
                super_ds = layout['super_ds']
                remaining = layout['remaining_after_mini_greedy']
                coverage_minis_added = layout['coverage_minis_added']
                logger.info(
                    f"Found {len(mini_ds)} Mini, {len(standard_ds)} Standard, {len(super_ds)} Super "
                    f"({coverage_minis_added} Mini coverage fill) in {time.time()-t0:.1f}s"
                )

                state.optimization_progress = "Evaluating network performance via OSRM..."
                metrics = evaluate_network(
                    state.grid_data, state.existing_stores,
                    mini_ds, standard_ds, super_ds, params,
                    progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                )

                elapsed = time.time() - t0
                logger.info(f"Optimization complete in {elapsed:.1f}s")

                # Heatmap data
                heatmap = generate_heatmap(state.grid_data)

                pipeline_warnings = []
                mmini = int(params.get('mini_ds_min_orders_per_day', 300))
                if mmini < 300:
                    pipeline_warnings.append(
                        'Mini min orders/day is below 300; spec often uses ≥300 for UHD Mini thresholds.'
                    )
                n_prop = len(mini_ds) + len(standard_ds) + len(super_ds)
                if n_prop == 0:
                    pipeline_warnings.append(
                        'No proposed hubs were placed (0 Mini + 0 Standard + 0 Super). '
                        'Greedy placement only adds a hub when some OSRM-radius cluster has total demand '
                        'in your min–max band for that tier. If every cell is too sparse, or min orders/day '
                        'is too high vs cluster sums, or max is too low, or radius is too small, all tiers '
                        'can end empty. Try lowering min orders, raising max, or widening service radius.'
                    )
                if layout.get('coverage_complete') is False:
                    pipeline_warnings.append(
                        'Full tier coverage could not be completed (hub count caps or iteration limit). '
                        'Some demand may remain outside all service radii; raise max hubs per tier or widen radii.'
                    )
                count_warnings, requested_counts, actual_counts = _build_exact_count_warnings(
                    params, mini_ds, standard_ds, super_ds
                )
                pipeline_warnings.extend(count_warnings)

                # Existing stores with polygon data
                active_fixed_stores = list(state.existing_stores or [])
                stores_json = [{
                    'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                    'orders_per_day': s['orders_per_day'],
                    'polygon_coords': s.get('polygon_coords', [])
                } for s in active_fixed_stores]

                state.optimization_result = {
                    'success': True,
                    'mini_ds': mini_ds,
                    'standard_ds': standard_ds,
                    'super_ds': super_ds,
                    'metrics': metrics,
                    'heatmap': heatmap,
                    'existing_stores': stores_json,
                    'city_bounds': state.city_bounds,
                    'compute_time_s': round(elapsed, 1),
                    'params': params,
                    'pipeline': {
                        'coverage_minis_added': coverage_minis_added,
                        'remaining_grid_cells_after_mini_greedy': len(remaining),
                        'placement_mode': layout.get('placement_mode', 'overlapping'),
                        'coverage_complete': layout.get('coverage_complete', True),
                        'coverage_satellites_added': layout.get('coverage_satellites_added', 0),
                        'requested_counts': requested_counts,
                        'actual_counts': actual_counts,
                    },
                    'pipeline_warnings': pipeline_warnings,
                }
                state.optimization_progress = "Complete"
            except Exception as e:
                logger.error(f"Optimization error: {traceback.format_exc()}")
                state.optimization_result = {'success': False, 'error': str(e)}
                state.optimization_progress = f"Error: {e}"
            finally:
                state.optimization_running = False

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        self._json({'started': True, 'message': 'Optimization started. Poll /api/status for progress.'})

    def _handle_optimize_constrained(self):
        """Bangalore multilayer planner reset."""
        if state.grid_data is None:
            self._json({'error': 'No order data loaded. Upload orders CSV first.'}, 400)
            return
        if state.optimization_running:
            self._json({'error': 'Optimization already running'}, 409)
            return
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            params = json.loads(body) if body else {}
        except Exception:
            params = {}

        state.osrm_available = check_osrm()
        if not state.osrm_available:
            self._json({
                'error': 'OSRM is required. Start OSRM server, set OSRM_URL, then verify /api/check-osrm.',
            }, 503)
            return
        if bool((params or {}).get('meeting_fast_mode', True)) and not check_osrm_table_fast(timeout_s=3.0):
            self._json({
                'error': 'OSRM Table API health check failed. Meeting-mode run aborted early instead of risking a long failure tail.',
            }, 503)
            return

        run_id = _next_optimization_run_id()
        state.optimization_run_id = run_id
        state.optimization_running = True
        state.optimization_deferred_running = False
        state.optimization_progress = "Bangalore multilayer planner starting..."
        state.optimization_result = None

        def _is_latest_run():
            return state.optimization_run_id == run_id

        def _annotate_run(result_obj, phase=None):
            if not isinstance(result_obj, dict):
                return result_obj
            annotated = dict(result_obj)
            pipeline = dict(annotated.get('pipeline') or {})
            if phase is not None:
                pipeline['phase'] = phase
            pipeline['run_id'] = run_id
            annotated['pipeline'] = pipeline
            annotated['run_id'] = run_id
            return annotated

        def run():
            core_published = False
            try:
                t0 = time.time()
                normalized_params = normalize_placement_params(params)
                def progress_setter(msg):
                    if _is_latest_run():
                        state.optimization_progress = msg

                if bool(normalized_params.get('meeting_fast_mode', True)):
                    try:
                        cold_wait_s = float(normalized_params.get('meeting_cold_start_wait_seconds', 120.0) or 0.0)
                    except (TypeError, ValueError):
                        cold_wait_s = 120.0
                    _wait_for_meeting_prewarm_core(progress_cb=progress_setter, timeout_s=cold_wait_s)

                def release_core_handoff(core_result_obj, progress_message=None):
                    nonlocal core_published
                    if not _is_latest_run():
                        return
                    state.optimization_result = core_result_obj
                    if progress_message:
                        state.optimization_progress = progress_message
                    state.optimization_running = False
                    state.optimization_deferred_running = True
                    core_published = True

                def publish_partial(partial_core_ctx):
                    if not _is_latest_run():
                        return
                    partial_result = _annotate_run(
                        _build_bangalore_multilayer_core_result(partial_core_ctx, time.time() - t0),
                        phase='core_decision_packet',
                    )
                    release_core_handoff(
                        partial_result,
                        progress_message=(
                            "Core decision packet ready; branch comparison and deferred enrichment "
                            "continuing in background..."
                        ),
                    )

                core_ctx = _prepare_bangalore_multilayer_core_context(
                    normalized_params,
                    progress_cb=progress_setter,
                    publish_cb=publish_partial,
                )
                core_elapsed = time.time() - t0
                core_result = _annotate_run(
                    _build_bangalore_multilayer_core_result(core_ctx, core_elapsed),
                    phase='core_decision_packet',
                )
                if not _is_latest_run():
                    return
                release_core_handoff(
                    core_result,
                    progress_message="Core decision packet ready; deferred enrichment running in background...",
                )

                def finalize_deferred():
                    try:
                        defer_grace_s = max(0.0, float(normalized_params.get('meeting_deferred_grace_s', 2.0) or 2.0))
                    except (TypeError, ValueError):
                        defer_grace_s = 2.0
                    if defer_grace_s > 0:
                        time.sleep(defer_grace_s)
                    if not _is_latest_run():
                        logger.info("Skipping deferred enrichment for superseded run %s", run_id)
                        return
                    try:
                        result = _finalize_bangalore_multilayer_result_from_core(
                            core_ctx,
                            progress_cb=progress_setter,
                        )

                        elapsed = time.time() - t0
                        heatmap = generate_heatmap(state.grid_data)
                        active_fixed_stores = list((result.get('planning_layers', {}).get('standard', {}) or {}).get('fixed_open_stores', []))
                        stores_json = [{
                            'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                            'orders_per_day': s['orders_per_day'],
                            'polygon_coords': s.get('polygon_coords', [])
                        } for s in active_fixed_stores]

                        full_result = _annotate_run({
                            'success': True,
                            'response_version': 2,
                            'result_contract': 'decision_plus_deferred',
                            'decision_grade_result': core_result.get('decision_grade_result', {}),
                            'deferred_result': {
                                'ready': True,
                                'completed_layers': ['standard_only_comparison', 'branch_comparison', 'uncovered_analysis'] + (
                                    ['super'] if not bool((result.get('planning_layers', {}).get('super', {}) or {}).get('deferred', False)) else []
                                ),
                            },
                            'layer_status': {
                                'standard': 'computed',
                                'exception_standard': 'computed' if int(((result.get('planning_layers', {}).get('standard', {}) or {}).get('exception_hub_count', 0) or 0) > 0) else 'not_needed',
                                'mini': 'computed',
                                'standard_only_comparison': 'computed',
                                'branch_comparison': 'computed',
                                'uncovered_analysis': 'computed',
                                'super': 'deferred' if bool((result.get('planning_layers', {}).get('super', {}) or {}).get('deferred', False)) else 'computed',
                            },
                            'budget': {
                                'target_seconds': int(float(normalized_params.get('meeting_target_seconds', 600) or 600)),
                                'elapsed_seconds': round(elapsed, 1),
                                'core_ready': True,
                                'deferred_ready': True,
                            },
                            'fixed_store_world': result.get('fixed_store_world', _effective_fixed_store_world(normalized_params)),
                            'fixed_store_mode': result.get('fixed_store_mode', _effective_fixed_store_mode(normalized_params)),
                            'fixed_store_source_mode': result.get('fixed_store_source_mode', _effective_fixed_store_source_mode(normalized_params)),
                            'standard_ds_radius': result.get('standard_ds_radius', float(normalized_params.get('standard_ds_radius', 3.0) or 3.0)),
                            'standard_exception_radius_km': result.get('standard_exception_radius_km', float(normalized_params.get('standard_exception_radius_km', 5.0) or 5.0)),
                            'cache_provenance': core_result.get('cache_provenance', {}),
                            'mini_ds': result['mini_ds'],
                            'standard_ds': result['standard_ds'],
                            'super_ds': result['super_ds'],
                            'metrics': result['metrics'],
                            'analysis': result.get('analysis', {}),
                            'planning_layers': result.get('planning_layers', {}),
                            'scenario_views': result.get('scenario_views', core_result.get('scenario_views', {})),
                            'scenario_order': result.get('scenario_order', core_result.get('scenario_order', [])),
                            'scenario_summaries': result.get('analysis', {}).get('scenario_summaries', core_result.get('scenario_summaries', [])),
                            'scope_summary': result.get('scope_summary', state.scope_summary),
                            'business_regions': result.get('business_regions', state.business_regions),
                            'excluded_islands': result.get('excluded_islands', state.excluded_islands),
                            'uncovered_pockets': result['uncovered_pockets'],
                            'heatmap': heatmap,
                            'existing_stores': stores_json,
                            'city_bounds': state.city_bounds,
                            'compute_time_s': round(elapsed, 1),
                            'params': normalized_params,
                            'pipeline': dict(result.get('pipeline', {'mode': 'bangalore_multilayer_reset'}), phase='complete'),
                            'quality_summary': result.get('quality_summary', {}),
                            'pipeline_warnings': result.get('pipeline_warnings', []),
                            **result.get('scenario_views', {}),
                        }, phase='complete')
                        if not _is_latest_run():
                            logger.info("Discarding deferred publish for superseded run %s", run_id)
                            return
                        state.optimization_result = full_result
                        state.optimization_progress = "Complete"
                    except Exception as deferred_error:
                        logger.error(f"Deferred constrained enrichment error: {traceback.format_exc()}")
                        if not _is_latest_run():
                            return
                        current_result = state.optimization_result if isinstance(state.optimization_result, dict) else {}
                        if current_result.get('success') and current_result.get('run_id') == run_id:
                            current_result = copy.deepcopy(current_result)
                            current_result['deferred_result'] = {
                                'ready': False,
                                'error': str(deferred_error),
                                'pending_layers': [layer for layer, status in (current_result.get('layer_status') or {}).items() if status in {'deferred', 'pending'}],
                            }
                            current_result['pipeline_warnings'] = list(current_result.get('pipeline_warnings') or []) + [
                                f"Deferred enrichment failed: {deferred_error}"
                            ]
                            state.optimization_result = _annotate_run(current_result, phase='core_decision_packet')
                        else:
                            state.optimization_result = _annotate_run({'success': False, 'error': str(deferred_error)}, phase='error')
                        state.optimization_progress = f"Deferred enrichment error: {deferred_error}"
                    finally:
                        if _is_latest_run():
                            state.optimization_deferred_running = False

                threading.Thread(target=finalize_deferred, daemon=True).start()
            except Exception as e:
                logger.error(f"Constrained optimization error: {traceback.format_exc()}")
                if _is_latest_run():
                    current_result = state.optimization_result if isinstance(state.optimization_result, dict) else {}
                    if core_published and current_result.get('success') and current_result.get('run_id') == run_id:
                        current_result = copy.deepcopy(current_result)
                        current_result['deferred_result'] = {
                            'ready': False,
                            'error': str(e),
                            'pending_layers': [layer for layer, status in (current_result.get('layer_status') or {}).items() if status in {'deferred', 'pending'}],
                        }
                        current_result['pipeline_warnings'] = list(current_result.get('pipeline_warnings') or []) + [
                            f"Background continuation failed after the core packet landed: {e}"
                        ]
                        state.optimization_result = _annotate_run(current_result, phase='core_decision_packet')
                    else:
                        state.optimization_result = _annotate_run({'success': False, 'error': str(e)}, phase='error')
                    state.optimization_progress = f"Error: {e}"
            finally:
                if _is_latest_run() and not core_published:
                    state.optimization_running = False
                    state.optimization_deferred_running = False

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        self._json({'started': True, 'run_id': run_id, 'message': 'Bangalore multilayer planner started. Poll /api/status for progress.'})

    def _handle_optimize_exact_benchmark(self):
        """Run the exact Bangalore benchmark deck used by the terminal workflow."""
        if state.grid_data is None:
            self._json({'error': 'No order data loaded. Upload orders CSV first.'}, 400)
            return
        if state.optimization_running:
            self._json({'error': 'Optimization already running'}, 409)
            return
        state.osrm_available = check_osrm()
        if not state.osrm_available:
            self._json({
                'error': 'OSRM is required. Start OSRM server, set OSRM_URL, then verify /api/check-osrm.',
            }, 503)
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            ui_params = json.loads(body) if body else {}
        except Exception:
            ui_params = {}

        def run():
            try:
                state.optimization_running = True
                state.optimization_progress = "Exact Bangalore benchmark starting..."
                t0 = time.time()

                params = {
                    'base_cost': float(ui_params.get('base_cost', 29) or 29),
                    'variable_rate': float(ui_params.get('variable_rate', 9) or 9),
                    'mini_base_cost': float(ui_params.get('mini_base_cost', 21) or 21),
                    'mini_variable_rate': float(ui_params.get('mini_variable_rate', 9) or 9),
                    'mini_ds_radius': float(ui_params.get('mini_ds_radius', 1.0) or 1.0),
                    'mini_density_radius_km': float(ui_params.get('mini_density_radius_km', 1.0) or 1.0),
                    'mini_density_min_orders_per_day': float(ui_params.get('mini_density_min_orders_per_day', 400) or 400),
                    'mini_ds_min_orders_per_day': float(ui_params.get('mini_ds_min_orders_per_day', 400) or 400),
                    'standard_base_cost': float(ui_params.get('standard_base_cost', 29) or 29),
                    'standard_variable_rate': float(ui_params.get('standard_variable_rate', 9) or 9),
                    'standard_ds_radius': float(ui_params.get('standard_ds_radius', 3.0) or 3.0),
                    'standard_exception_radius_km': float(ui_params.get('standard_exception_radius_km', 5.0) or 5.0),
                    'exact_graph_max_radius_km': float(ui_params.get('exact_graph_max_radius_km', 10.0) or 10.0),
                    'standard_exception_step_km': float(ui_params.get('standard_exception_step_km', 0.5) or 0.5),
                    'standard_min_store_spacing_km': float(ui_params.get('standard_ds_radius', 3.0) or 3.0),
                    'benchmark_near_full_coverage_pct': float(ui_params.get('benchmark_near_full_coverage_pct', 99.7) or 99.7),
                    'uncovered_pocket_radius_km': float(ui_params.get('uncovered_pocket_radius_km', 3.0) or 3.0),
                    'exact_solver_backend': 'highs',
                    'exact_enable_tiebreak_milps': True,
                    'exact_include_near_full_scenario': False,
                    'exact_candidate_cap': None,
                    'allow_full_exact_candidate_pool': True,
                    'exact_candidate_min_spacing_km': 0.6,
                    'exact_graph_cache_enabled': True,
                    'exact_graph_site_block_size': 100,
                    'super_role': 'overlay_core_only',
                    'fixed_store_world': 103,
                    'fixed_store_mode': 'benchmark_103',
                    'exact_app_result_schema_version': 'v2',
                }
                fixed_store_world = _coerce_fixed_store_world(ui_params.get('fixed_store_world'))
                if fixed_store_world is None:
                    fixed_store_world = _coerce_fixed_store_world(ui_params.get('fixed_store_mode'))
                if fixed_store_world is None:
                    fixed_store_world = 103
                params['fixed_store_world'] = fixed_store_world
                params['fixed_store_mode'] = str(
                    ui_params.get('fixed_store_mode')
                    or _fixed_store_world_to_mode(fixed_store_world)
                    or 'benchmark_103'
                )
                if ui_params.get('fixed_store_override_path'):
                    params['fixed_store_override_path'] = str(ui_params.get('fixed_store_override_path')).strip()
                if ui_params.get('fixed_store_override_source_mode'):
                    params['fixed_store_override_source_mode'] = str(ui_params.get('fixed_store_override_source_mode')).strip()
                if ui_params.get('exact_skip_mini_overlay') not in (None, ''):
                    params['exact_skip_mini_overlay'] = bool(ui_params.get('exact_skip_mini_overlay'))
                if ui_params.get('exact_skip_recommended_diagnostics') not in (None, ''):
                    params['exact_skip_recommended_diagnostics'] = bool(ui_params.get('exact_skip_recommended_diagnostics'))
                if ui_params.get('standard_exception_max_hubs') not in (None, ''):
                    params['standard_exception_max_hubs'] = int(ui_params.get('standard_exception_max_hubs'))
                if ui_params.get('super_core_must_cover_geojson'):
                    params['super_core_must_cover_geojson'] = ui_params.get('super_core_must_cover_geojson')
                if ui_params.get('super_exclude_geojson'):
                    params['super_exclude_geojson'] = ui_params.get('super_exclude_geojson')

                deck = optimize_exact_standard_scenario_deck(
                    params,
                    progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                )
                elapsed = time.time() - t0
                heatmap = generate_heatmap(state.grid_data)
                active_fixed_sites = _build_fixed_standard_sites(params)
                stores_json = [{
                    'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                    'orders_per_day': s['orders_per_day'],
                    'polygon_coords': s.get('polygon_coords', [])
                } for s in active_fixed_sites]
                state.optimization_result = _build_exact_benchmark_app_result(
                    deck, params, elapsed, heatmap, stores_json
                )
                state.optimization_progress = "Complete"
            except Exception as e:
                logger.error(f"Exact benchmark error: {traceback.format_exc()}")
                state.optimization_result = {'success': False, 'error': str(e)}
                state.optimization_progress = f"Error: {e}"
            finally:
                state.optimization_running = False

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        self._json({'started': True, 'message': 'Exact Bangalore benchmark started. Poll /api/status for progress.'})

    def _handle_optimize_target(self):
        """Target proposed average last-mile cost: calibrate base payout or search tier parameters."""
        if state.grid_data is None:
            self._json({'error': 'No order data loaded. Upload orders CSV first.'}, 400)
            return
        if state.optimization_running:
            self._json({'error': 'Optimization already running'}, 409)
            return
        state.osrm_available = check_osrm()
        if not state.osrm_available:
            self._json({
                'error': (
                    'OSRM is required for all road distances. Start an OSRM server, set OSRM_URL, '
                    'then verify GET /api/check-osrm.'
                ),
            }, 503)
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            params = json.loads(body) if body else {}
        except Exception:
            params = {}

        target_mode = _normalize_target_mode(params)
        if target_mode == 'physical_standard_count':
            raw_target = (
                params.get('target_total_physical_standard_stores')
                if params.get('target_total_physical_standard_stores') is not None else
                params.get('target_standard_count')
                if params.get('target_standard_count') is not None else
                params.get('standard_ds_target_count')
            )
            if raw_target is None:
                self._json({'error': 'target_total_physical_standard_stores is required for count mode'}, 400)
                return
            try:
                target = int(round(float(raw_target)))
            except (TypeError, ValueError):
                self._json({'error': 'target_total_physical_standard_stores must be a number'}, 400)
                return
            if target <= 0:
                self._json({'error': 'target_total_physical_standard_stores must be positive'}, 400)
                return
            target_avg_cost = None
        else:
            target = params.get('target_avg_cost')
            if target is None:
                self._json({'error': 'target_avg_cost is required'}, 400)
                return
            try:
                target = float(target)
            except (TypeError, ValueError):
                self._json({'error': 'target_avg_cost must be a number'}, 400)
                return
            if target <= 0:
                self._json({'error': 'target_avg_cost must be positive'}, 400)
                return
            target_avg_cost = target

        tolerance_pct = float(params.get('tolerance_pct', 2))
        tolerance_abs = max(float(target) * tolerance_pct / 100.0, 0.05)
        mode = (params.get('mode') or 'search_tiers').strip().lower()
        if mode not in ('calibrate_base', 'search_tiers'):
            self._json({'error': 'mode must be calibrate_base or search_tiers'}, 400)
            return

        base_min = float(params.get('base_cost_min', 20))
        base_max = float(params.get('base_cost_max', 50))
        max_search_iters = int(params.get('max_search_iterations', 50))
        max_search_iters = max(5, min(120, max_search_iters))

        opt_keys = (
            'base_cost', 'variable_rate',
            'mini_base_cost', 'mini_variable_rate',
            'standard_base_cost', 'standard_variable_rate',
            'super_base_cost', 'super_variable_rate', 'super_fixed_penalty_per_order',
            'use_tiered_costs',
            'fixed_store_world', 'fixed_store_mode',
            'fixed_store_override_path', 'fixed_store_override_source_mode',
            'mini_ds_radius', 'mini_ds_min_orders_per_day', 'mini_ds_max_orders_per_day',
            'standard_ds_radius', 'standard_ds_min_orders_per_day', 'standard_ds_max_orders_per_day',
            'super_ds_radius', 'super_ds_min_orders_per_day', 'super_ds_max_orders_per_day',
            'mini_ds_target_count', 'standard_ds_target_count', 'super_ds_target_count',
            'mini_coverage_fill',
            'require_full_tier_coverage',
            'super_core_must_cover_geojson', 'super_exclude_geojson',
        )
        base_params = {k: params[k] for k in opt_keys if k in params}
        defaults = {
            'base_cost': 29, 'variable_rate': 9,
            'mini_base_cost': 20, 'mini_variable_rate': 6,
            'standard_base_cost': 29, 'standard_variable_rate': 9,
            'super_base_cost': 29, 'super_variable_rate': 9, 'super_fixed_penalty_per_order': 5,
            'use_tiered_costs': True,
            'mini_ds_radius': 1.0, 'mini_ds_min_orders_per_day': 300,
            'mini_ds_max_orders_per_day': 8000,
            'standard_ds_radius': 2.5, 'standard_ds_min_orders_per_day': 500,
            'standard_ds_max_orders_per_day': 12000,
            'super_ds_radius': 10.0, 'super_ds_min_orders_per_day': 0,
            'super_ds_max_orders_per_day': 50000,
            'mini_coverage_fill': False,
            'require_full_tier_coverage': True,
            'super_role': 'overlay_core_only',
        }
        for k, v in defaults.items():
            base_params.setdefault(k, v)
        base_params = normalize_placement_params(base_params)

        def run():
            try:
                state.optimization_running = True
                t0 = time.time()
                target_meta = {
                    'target_mode': target_mode,
                    'target_avg_cost': target_avg_cost,
                    'target_total_physical_standard_stores': int(target) if target_mode == 'physical_standard_count' else None,
                    'tolerance_pct': tolerance_pct,
                    'tolerance_abs': round(tolerance_abs, 4),
                    'mode': mode,
                    'fixed_store_world': _effective_fixed_store_world(base_params),
                    'fixed_store_mode': _effective_fixed_store_mode(base_params),
                    'fixed_store_source_mode': _effective_fixed_store_source_mode(base_params),
                    'standard_ds_radius': float(base_params.get('standard_ds_radius', 3.0) or 3.0),
                }
                mini_ds = []
                standard_ds = []
                super_ds = []
                final_metrics = None
                final_params = {}
                pipeline_extra = {}

                if target_mode == 'physical_standard_count':
                    state.optimization_progress = "Target count: placing Standard-only network..."
                    count_params = dict(base_params)
                    count_params['mini_ds_target_count'] = 0
                    count_params['mini_ds_max'] = 0
                    count_params['mini_ds_min_orders_per_day'] = 10**18
                    count_params['super_ds_target_count'] = 0
                    count_params['super_ds_max'] = 0
                    count_params['super_ds_min_orders_per_day'] = 10**18
                    count_params['standard_ds_target_count'] = int(target)
                    count_params['standard_ds_max'] = int(target)
                    count_params['target_max_hubs'] = int(target)
                    count_params = normalize_placement_params(count_params)
                    layout_cb = place_overlapping_tier_hubs(
                        state.grid_data, count_params,
                        progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                    )
                    mini_ds = layout_cb['mini_ds']
                    standard_ds = layout_cb['standard_ds']
                    super_ds = layout_cb['super_ds']
                    remaining = layout_cb['remaining_after_mini_greedy']
                    coverage_minis_added_cb = layout_cb['coverage_minis_added']
                    state.optimization_progress = "Target count: evaluating Standard-only result via OSRM..."
                    final_metrics = evaluate_network(
                        state.grid_data, state.existing_stores,
                        mini_ds, standard_ds, super_ds, count_params,
                        progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                    )
                    target_meta['feasible'] = len(standard_ds) == int(target)
                    target_meta['actual_total_physical_standard_stores'] = len(standard_ds)
                    target_meta['gap_to_target'] = int(target) - len(standard_ds)
                    target_meta['message'] = (
                        f"Standard-only placement returned {len(standard_ds)} physical Standard stores "
                        f"against target {int(target)}."
                    )
                    pipeline_extra = {
                        'coverage_minis_added': coverage_minis_added_cb,
                        'remaining_grid_cells_after_mini_greedy': len(remaining),
                        'placement_mode': layout_cb.get('placement_mode', 'overlapping'),
                        'coverage_complete': layout_cb.get('coverage_complete', True),
                        'coverage_satellites_added': layout_cb.get('coverage_satellites_added', 0),
                        'target_mode': target_mode,
                    }
                    final_params = count_params
                elif mode == 'calibrate_base':
                    state.optimization_progress = "Calibrate base: placing hubs..."
                    layout_cb = place_overlapping_tier_hubs(
                        state.grid_data, base_params,
                        progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                    )
                    mini_ds = layout_cb['mini_ds']
                    standard_ds = layout_cb['standard_ds']
                    super_ds = layout_cb['super_ds']
                    remaining = layout_cb['remaining_after_mini_greedy']
                    coverage_minis_added_cb = layout_cb['coverage_minis_added']
                    state.optimization_progress = "Calibrate base: evaluating via OSRM..."
                    metrics = evaluate_network(
                        state.grid_data, state.existing_stores,
                        mini_ds, standard_ds, super_ds, base_params,
                        progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                    )
                    mb = float(base_params.get('mini_base_cost', 20))
                    sb = float(base_params.get('standard_base_cost', 29))
                    pbb = float(base_params.get('super_base_cost', 29))
                    bc = float(base_params.get('base_cost', 29))
                    delta_raw = target - float(metrics['proposed_avg_cost'])
                    max_delta = min(base_max - mb, base_max - sb, base_max - pbb, base_max - bc)
                    min_delta = max(base_min - mb, base_min - sb, base_min - pbb, base_min - bc)
                    clamped_delta = max(min_delta, min(max_delta, delta_raw))
                    feasible = abs(float(metrics['proposed_avg_cost']) + clamped_delta - target) <= tolerance_abs
                    final_params = dict(base_params)
                    final_params['mini_base_cost'] = round(mb + clamped_delta, 2)
                    final_params['standard_base_cost'] = round(sb + clamped_delta, 2)
                    final_params['super_base_cost'] = round(pbb + clamped_delta, 2)
                    final_params['base_cost'] = round(bc + clamped_delta, 2)
                    final_metrics = dict(metrics)
                    final_metrics.update(recalculate_metrics_for_uniform_base_shift(metrics, clamped_delta))
                    target_meta['calibrated_base_delta'] = round(clamped_delta, 2)
                    target_meta['base_delta_unclamped'] = round(delta_raw, 2)
                    target_meta['feasible'] = feasible
                    target_meta['message'] = (
                        f"Uniform base shift Δ₹{clamped_delta:.2f} on all tier bases so proposed avg cost ≈ target ₹{target:.2f} "
                        f"(₹{final_metrics['proposed_avg_cost']:.2f} proposed)."
                        if feasible
                        else (
                            f"Target not fully reachable within per-base range [₹{base_min:.0f}, ₹{base_max:.0f}]; "
                            f"using Δ₹{clamped_delta:.2f} (proposed avg cost ₹{final_metrics['proposed_avg_cost']:.2f})."
                        )
                    )
                    pipeline_extra = {
                        'coverage_minis_added': coverage_minis_added_cb,
                        'remaining_grid_cells_after_mini_greedy': len(remaining),
                        'placement_mode': layout_cb.get('placement_mode', 'overlapping'),
                        'coverage_complete': layout_cb.get('coverage_complete', True),
                        'coverage_satellites_added': layout_cb.get('coverage_satellites_added', 0),
                        'target_mode': target_mode,
                    }
                else:
                    state.optimization_progress = "Target search: exploring tier parameters (fast)..."
                    best = search_tier_params_for_target(
                        state.grid_data, state.existing_stores, base_params,
                        target, max_search_iters,
                        progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                    )
                    if best.get('params') is None:
                        state.optimization_result = {'success': False, 'error': 'Target search failed'}
                        state.optimization_progress = 'Error'
                        return
                    state.optimization_progress = "Target search: final evaluation with OSRM..."
                    final_params = best['params']
                    mini_ds = best['mini']
                    standard_ds = best['std']
                    super_ds = best['super']
                    metrics_fast = best['metrics']
                    final_metrics = evaluate_network(
                        state.grid_data, state.existing_stores,
                        mini_ds, standard_ds, super_ds, final_params,
                        progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                    )
                    err_osrm = abs(final_metrics['proposed_avg_cost'] - target)
                    target_meta['fast_search_proposed_cost'] = metrics_fast['proposed_avg_cost']
                    target_meta['feasible'] = err_osrm <= tolerance_abs
                    target_meta['gap_to_target'] = round(err_osrm, 3)
                    target_meta['actual_total_physical_standard_stores'] = len(standard_ds)
                    target_meta['message'] = (
                        f"Tier search finished. OSRM proposed avg cost ₹{final_metrics['proposed_avg_cost']:.2f} "
                        f"(target ₹{target:.2f}, tolerance ±₹{tolerance_abs:.2f})."
                    )
                    rem = best.get('remaining')
                    pipeline_extra = {
                        'coverage_minis_added': int(best.get('coverage_minis_added', 0)),
                        'remaining_grid_cells_after_mini_greedy': len(rem) if rem is not None else 0,
                        'placement_mode': 'overlapping',
                        'coverage_complete': best.get('coverage_complete', True),
                        'coverage_satellites_added': int(best.get('coverage_satellites_added', 0)),
                        'target_mode': target_mode,
                    }

                elapsed = time.time() - t0
                heatmap = generate_heatmap(state.grid_data)
                stores_json = [{
                    'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                    'orders_per_day': s['orders_per_day'],
                    'polygon_coords': s.get('polygon_coords', [])
                } for s in state.existing_stores]

                pipeline_warnings = []
                mmini = int(final_params.get('mini_ds_min_orders_per_day', 300))
                if mmini < 300:
                    pipeline_warnings.append(
                        'Mini min orders/day is below 300; spec often uses ≥300 for UHD Mini thresholds.'
                    )
                count_warnings, requested_counts, actual_counts = _build_exact_count_warnings(
                    final_params, mini_ds, standard_ds, super_ds
                )
                pipeline_warnings.extend(count_warnings)
                fixed_standard_sites = _build_fixed_standard_sites(final_params)
                new_standard_sites = _copy_site_records(standard_ds)
                for site in new_standard_sites:
                    site['standard_role'] = str(site.get('standard_role') or 'new')
                    site['is_standard_rescue'] = bool(
                        site.get('rescue_gap_fill') or site.get('rescue_standard') or site.get('rescue_spacing_relaxed')
                    )
                    site['is_standard_spacing_relaxed'] = bool(
                        site.get('spacing_relaxed') or site.get('rescue_spacing_relaxed') or site.get('relaxed_spacing')
                    )
                    site['is_standard_exception_override'] = bool(
                        site.get('exception_override') or site.get('exception_hub') or site.get('exception_standard_hub')
                    )
                rescue_standard_sites = [s for s in new_standard_sites if bool(s.get('is_standard_rescue'))]
                spacing_relaxed_standard_sites = [s for s in new_standard_sites if bool(s.get('is_standard_spacing_relaxed'))]
                exception_override_sites = [s for s in new_standard_sites if bool(s.get('is_standard_exception_override'))]
                gap_fill_standard_sites = [s for s in new_standard_sites if bool(s.get('gap_fill') or s.get('coverage_fill'))]

                state.optimization_result = {
                    'success': True,
                    'target_mode': target_mode,
                    'mini_ds': mini_ds,
                    'standard_ds': standard_ds,
                    'super_ds': super_ds,
                    'metrics': final_metrics,
                    'heatmap': heatmap,
                    'existing_stores': stores_json,
                    'city_bounds': state.city_bounds,
                    'compute_time_s': round(elapsed, 1),
                    'params': final_params,
                    'target_search': target_meta,
                    'pipeline': pipeline_extra,
                    'pipeline_warnings': pipeline_warnings,
                    'fixed_store_world': _effective_fixed_store_world(final_params),
                    'fixed_store_mode': _effective_fixed_store_mode(final_params),
                    'fixed_store_source_mode': _effective_fixed_store_source_mode(final_params),
                    'standard_ds_radius': float(final_params.get('standard_ds_radius', 3.0) or 3.0),
                    'fixed_standard_count': len(fixed_standard_sites),
                    'new_standard_count': len(new_standard_sites),
                    'rescue_standard_count': len(rescue_standard_sites),
                    'gap_fill_standard_count': len(gap_fill_standard_sites),
                    'spacing_relaxed_standard_count': len(spacing_relaxed_standard_sites),
                    'exception_override_count': len(exception_override_sites),
                    'fixed_standard_sites': fixed_standard_sites,
                    'new_standard_sites': new_standard_sites,
                    'rescue_standard_sites': rescue_standard_sites,
                    'spacing_relaxed_standard_sites': spacing_relaxed_standard_sites,
                    'exception_override_sites': exception_override_sites,
                }
                state.optimization_result['pipeline']['requested_counts'] = requested_counts
                state.optimization_result['pipeline']['actual_counts'] = actual_counts
                state.optimization_result['target_search']['requested_total_physical_standard_stores'] = (
                    int(target) if target_mode == 'physical_standard_count' else None
                )
                state.optimization_result['target_search']['actual_total_physical_standard_stores'] = (
                    len(standard_ds) if target_mode == 'physical_standard_count' else None
                )
                state.optimization_progress = 'Complete'
                logger.info(f"Target optimization ({mode}) complete in {elapsed:.1f}s")
            except Exception as e:
                logger.error(f"Target optimization error: {traceback.format_exc()}")
                state.optimization_result = {'success': False, 'error': str(e)}
                state.optimization_progress = f'Error: {e}'
            finally:
                state.optimization_running = False

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        self._json({'started': True, 'message': 'Target optimization started. Poll /api/status for progress.'})

    def _serve_file(self, rel_path, content_type):
        try:
            fpath = os.path.join(BASE_DIR, rel_path)
            with open(fpath, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self._cors_headers()
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self.send_error(404)

    def _json(self, obj, status=200):
        body = json.dumps(_json_safe_value(obj), default=str, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Filename')

    def log_message(self, fmt, *args):
        # Only log non-polling requests
        msg = fmt % args
        if '/api/status' not in msg and '/api/result' not in msg:
            logger.info(msg)

if __name__ == '__main__':
    logger.info(f"Checking OSRM at {OSRM_BASE_URL}...")
    state.osrm_available = check_osrm()
    if state.osrm_available:
        logger.info("OSRM is available!")
    else:
        logger.warning(
            f"OSRM not reachable at {OSRM_BASE_URL}. Optimization and metrics require OSRM; start the service before running."
        )

    logger.info(f"Starting server at http://localhost:{SERVER_PORT}")
    logger.info("Open your browser to get started.\n")

    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(('0.0.0.0', SERVER_PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nShutting down.")
        server.shutdown()
