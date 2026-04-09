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
import io
import re
import json
import time
import math
import cgi
import logging
import tempfile
import threading
import random
import traceback
import urllib.request
import urllib.error
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
import pandas as pd
import openpyxl
import urllib3

from geometry_core import (
    parse_geojson_string,
    polygons_from_geojson,
    cell_needs_super_core_coverage,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIG
# ============================================================================
OSRM_BASE_URL = os.environ.get('OSRM_URL', 'http://localhost:5000')
SERVER_PORT = int(os.environ.get('OPTIMIZER_PORT', 5050))
MAX_UPLOAD_MB = 3000  # Support up to 3GB files
# Concurrent OSRM Table HTTP requests (I/O bound). Tune with OSRM_WORKERS=32 etc. Match or stay
# below your osrm-routed thread capacity so requests queue instead of timing out.
OSRM_WORKERS = max(1, int(os.environ.get('OSRM_WORKERS', '16')))
OSRM_BATCH_SIZE = int(os.environ.get('OSRM_BATCH_SIZE', '100'))  # coords per OSRM table call (OSRM default max ~100)
OSRM_TIMEOUT = 30

# ── Connection pool: reuse TCP connections across all OSRM calls ──────────
_osrm_pool = urllib3.PoolManager(
    num_pools=4,
    maxsize=OSRM_WORKERS + 4,        # one connection per concurrent worker + headroom
    retries=urllib3.Retry(total=3, backoff_factor=0.3),
    timeout=urllib3.Timeout(connect=5.0, read=float(OSRM_TIMEOUT)),
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        self.city_bounds = None
        self.total_orders = 0
        self.orders_per_day = 0
        self.unique_dates = 1
        self.osrm_available = False
        self.data_loaded = False
        self.load_progress = ''
        self.optimization_result = None
        self.optimization_running = False
        self.optimization_progress = ''
        self.local_load_result = None

state = AppState()

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
    for attempt in range(max_attempts):
        try:
            resp = _osrm_pool.request('GET', url)
            body = resp.data
            if not body or len(body) == 0:
                if attempt < max_attempts - 1:
                    import time as _t; _t.sleep(0.3 * (attempt + 1))
                    continue
                raise RuntimeError("OSRM returned empty response after retries (server overloaded?)")
            data = json.loads(body)
            if data.get('code') == 'Ok':
                dm = np.array(data['distances'], dtype=float)  # meters
                dm[dm == None] = np.inf
                return dm / 1000.0  # km
            msg = data.get('message', '')
            raise RuntimeError(f"OSRM table code={data.get('code')!r} {msg}")
        except RuntimeError:
            raise
        except (json.JSONDecodeError,) as e:
            if attempt < max_attempts - 1:
                import time as _t; _t.sleep(0.3 * (attempt + 1))
                continue
            raise RuntimeError(f"OSRM table request failed: {e}") from e
        except Exception as e:
            raise RuntimeError(f"OSRM table request failed: {e}") from e

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

    with ThreadPoolExecutor(max_workers=OSRM_WORKERS) as pool:
        futures = [pool.submit(run_batch, b) for b in batches]
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

    required = ['customer_lat', 'customer_lon', 'store_lat', 'store_lon']
    missing = [f for f in required if f not in mapping]
    if missing:
        raise ValueError(f"Could not auto-detect columns: {missing}. "
                        f"Available columns: {list(header_df.columns)}")

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

    # Drop rows with missing coordinates
    df = df.dropna(subset=['customer_lat', 'customer_lon', 'store_lat', 'store_lon'])
    state.total_orders = len(df)

    # Compute dates
    if 'date' in df.columns:
        state.unique_dates = max(df['date'].nunique(), 1)
    else:
        state.unique_dates = 90  # default 3 months
    state.orders_per_day = int(len(df) / state.unique_dates)

    state.load_progress = f"Aggregating {len(df):,} orders into grid cells..."

    # Grid aggregation (~200m resolution)
    df['cell_lat'] = (df['customer_lat'] * 500).round() / 500
    df['cell_lon'] = (df['customer_lon'] * 500).round() / 500

    grid = df.groupby(['cell_lat', 'cell_lon']).agg(
        order_count=('customer_lat', 'count'),
        avg_cust_lat=('customer_lat', 'mean'),
        avg_cust_lon=('customer_lon', 'mean'),
        avg_store_lat=('store_lat', 'mean'),
        avg_store_lon=('store_lon', 'mean'),
    ).reset_index()
    grid['orders_per_day'] = grid['order_count'] / state.unique_dates

    state.order_df = df
    state.grid_data = grid
    state.city_bounds = {
        'north': float(grid['avg_cust_lat'].max()),
        'south': float(grid['avg_cust_lat'].min()),
        'east': float(grid['avg_cust_lon'].max()),
        'west': float(grid['avg_cust_lon'].min()),
    }
    logger.info(f"Grid: {len(grid)} cells, {state.orders_per_day} orders/day")
    return mapping

def load_store_xlsx(filepath):
    """Load existing dark store locations from XLSX."""
    logger.info(f"Loading stores from {filepath}")
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active
    stores = []
    headers = [str(c.value).strip().lower() if c.value else '' for c in ws[1]]

    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[0] is None:
            continue
        hub_code = str(row[0])
        lat, lon = None, None
        polygon = None
        try:
            if len(row) > 2 and row[1] is not None and row[2] is not None:
                lat, lon = float(row[1]), float(row[2])
        except (ValueError, TypeError):
            pass
        if len(row) > 3:
            polygon = row[3]
        # Try WKT polygon if no direct lat/lon
        if (lat is None or lon is None) and polygon and isinstance(polygon, str) and 'POLYGON' in polygon:
            lat, lon = _parse_wkt_centroid(polygon)
        poly_coords = _parse_wkt_coords(polygon) if polygon and isinstance(polygon, str) else []
        if lat is not None and lon is not None:
            stores.append({
                'id': hub_code, 'lat': float(lat), 'lon': float(lon),
                'polygon_coords': poly_coords, 'orders_per_day': 0
            })

    # Match orders to stores
    if state.order_df is not None and 'store_id' in state.order_df.columns:
        counts = state.order_df['store_id'].value_counts()
        for s in stores:
            sid = s['id'].lower()
            matched = [k for k in counts.index if str(k).lower() == sid]
            if matched:
                s['orders_per_day'] = int(counts[matched[0]] / state.unique_dates)

    state.existing_stores = stores
    logger.info(f"Loaded {len(stores)} existing stores")
    return stores

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


def normalize_placement_params(params):
    """Copy params and coerce tier min orders so invalid values cannot disable min thresholds."""
    base = dict(params or {})
    base['mini_ds_min_orders_per_day'] = _safe_min_orders_per_day(
        base, 'mini_ds_min_orders_per_day', 300
    )
    base['standard_ds_min_orders_per_day'] = _safe_min_orders_per_day(
        base, 'standard_ds_min_orders_per_day', 500
    )
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
    return base


def find_mini_ds(grid_data, params):
    """Greedy clustering for Mini DS on the full grid; cluster orders must be in [min, max]."""
    mini_list = []
    remaining = grid_data.copy()
    min_density, max_density = _tier_min_max_orders(params, 'mini')
    radius = params.get('mini_ds_radius', 1.0)
    max_hubs = params.get('mini_ds_max', 200)

    remaining = remaining.sort_values('orders_per_day', ascending=False)
    for _ in range(max_hubs + 100):
        if len(remaining) == 0:
            break
        best_idx = remaining['orders_per_day'].idxmax()
        best = remaining.loc[best_idx]
        if best['orders_per_day'] < min_density * 0.1:
            break

        dists = osrm_one_to_many(
            float(best['cell_lat']), float(best['cell_lon']),
            remaining['cell_lat'].values, remaining['cell_lon'].values
        )
        mask = dists <= radius
        cluster = remaining[mask]
        cluster_orders = cluster['orders_per_day'].sum()

        if cluster_orders < min_density:
            remaining = remaining.drop(best_idx)
            continue
        if cluster_orders > max_density:
            remaining = remaining.drop(best_idx)
            continue

        w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / cluster_orders
        w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / cluster_orders

        mini_list.append({
            'lat': float(w_lat), 'lon': float(w_lon),
            'orders_per_day': float(cluster_orders),
            'radius_km': radius, 'type': 'mini',
            'cells': int(len(cluster)),
            'selection': '4k'
        })
        remaining = remaining[~mask]

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
    max_primary = int(params.get('mini_ds_max', 200))
    extra_cap = int(params.get('coverage_fill_max_extra', 500))
    hard_cap = max_primary + extra_cap

    mini_list = list(mini_list)
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)

    def _min_d_to_minis(mlist):
        if not mlist:
            return np.full(n, np.inf)
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
        dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
        ball = (dists <= radius) & uncovered
        co = float(wts[ball].sum())
        if co < 1e-9:
            lat, lon = float(seed_lat), float(seed_lon)
            co = float(wts[bi])
            ncells = 1
        else:
            lat = float((clat[ball] * wts[ball]).sum() / co)
            lon = float((clon[ball] * wts[ball]).sum() / co)
            ncells = int(ball.sum())

        if co < min_o or co > max_o:
            failed.add(bi)
            it += 1
            if len(failed) > min(n, 5000):
                logger.warning('Mini coverage fill: stopping after many invalid catchments.')
                break
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
        })
        d_new = osrm_min_distances_parallel(
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
    max_hubs = params.get('standard_ds_max', 200)

    std_list = []
    remaining = grid_data.sort_values('orders_per_day', ascending=False).copy()

    for _ in range(max_hubs + 100):
        if len(remaining) == 0:
            break

        best_idx = remaining['orders_per_day'].idxmax()
        best = remaining.loc[best_idx]
        if best['orders_per_day'] < min_orders * 0.1:
            break

        dists = osrm_one_to_many(
            float(best['cell_lat']), float(best['cell_lon']),
            remaining['cell_lat'].values, remaining['cell_lon'].values
        )
        mask = dists <= radius
        cluster = remaining[mask]
        if len(cluster) == 0:
            remaining = remaining.drop(best_idx)
            continue

        co = cluster['orders_per_day'].sum()
        if co < min_orders:
            remaining = remaining.drop(best_idx)
            continue
        if co > max_orders:
            remaining = remaining.drop(best_idx)
            continue

        w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / co
        w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / co
        std_list.append({
            'lat': float(w_lat), 'lon': float(w_lon),
            'orders_per_day': float(co),
            'radius_km': radius,
            'type': 'standard',
            'cells': int(len(cluster)),
            'selection': '15k'
        })

        remaining = remaining[~mask]
        if len(std_list) >= max_hubs:
            break

    return std_list, remaining


def find_super_ds(grid_data, params):
    """Super DS (~30k SKUs): greedy on full grid; cluster orders in [min, max]."""
    if len(grid_data) == 0:
        return [], grid_data

    min_orders, max_orders = _tier_min_max_orders(params, 'super')
    radius = params.get('super_ds_radius', 4.0)
    max_hubs = params.get('super_ds_max', 120)

    super_list = []
    remaining = grid_data.sort_values('orders_per_day', ascending=False).copy()

    for _ in range(max_hubs + 100):
        if len(remaining) == 0:
            break

        best_idx = remaining['orders_per_day'].idxmax()
        best = remaining.loc[best_idx]
        if best['orders_per_day'] < min_orders * 0.1:
            break

        dists = osrm_one_to_many(
            float(best['cell_lat']), float(best['cell_lon']),
            remaining['cell_lat'].values, remaining['cell_lon'].values
        )
        mask = dists <= radius
        cluster = remaining[mask]
        if len(cluster) == 0:
            remaining = remaining.drop(best_idx)
            continue

        co = cluster['orders_per_day'].sum()
        if co < min_orders:
            remaining = remaining.drop(best_idx)
            continue
        if co > max_orders:
            remaining = remaining.drop(best_idx)
            continue

        w_lat = (cluster['cell_lat'] * cluster['orders_per_day']).sum() / co
        w_lon = (cluster['cell_lon'] * cluster['orders_per_day']).sum() / co
        super_list.append({
            'lat': float(w_lat), 'lon': float(w_lon),
            'orders_per_day': float(co),
            'radius_km': radius,
            'type': 'super',
            'cells': int(len(cluster)),
            'selection': '30k'
        })

        remaining = remaining[~mask]
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
    max_hubs = int(params.get('super_ds_max', 120))
    super_list = list(super_ds)
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)

    def min_d_super():
        if not super_list:
            return np.full(n, np.inf)
        hl = np.array([h['lat'] for h in super_list], dtype=np.float64)
        ho = np.array([h['lon'] for h in super_list], dtype=np.float64)
        return osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)

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
        dists = osrm_one_to_many(seed_lat, seed_lon, clat, clon)
        ball = (dists <= radius) & need
        co = float(wts[ball].sum())
        if co < 1e-9:
            lat, lon = float(seed_lat), float(seed_lon)
            co = float(wts[bi])
            ncells = 1
        else:
            lat = float((clat[ball] * wts[ball]).sum() / co)
            lon = float((clon[ball] * wts[ball]).sum() / co)
            ncells = int(ball.sum())
        if co < min_o or co > max_o:
            failed.add(bi)
            it += 1
            if len(failed) > min(n, 5000):
                logger.warning('Super core fill: stopping after many invalid Super catchments.')
                break
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

    m_lo, m_hi = _tier_min_max_orders(params, 'mini')
    s_lo, s_hi = _tier_min_max_orders(params, 'standard')
    p_lo, p_hi = _tier_min_max_orders(params, 'super')

    max_m = int(params.get('mini_ds_max', 200))
    max_s = int(params.get('standard_ds_max', 200))
    max_p = int(params.get('super_ds_max', 120))

    def _min_d(hlist):
        if not hlist:
            return np.full(n, np.inf)
        hl = np.array([h['lat'] for h in hlist], dtype=np.float64)
        ho = np.array([h['lon'] for h in hlist], dtype=np.float64)
        return osrm_min_distances_parallel(clat, clon, hl, ho, progress_cb=None)

    # Incremental min-distances per tier — recomputing all hubs every iteration was the main cost.
    dm = _min_d(mini_ds)
    ds = _min_d(standard_ds)
    dp = _min_d(super_ds)

    def _cov_mask():
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

        # Prefer Super → Standard → Mini for strict [min,max] (larger balls meet min orders more often)
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
            if len(super_ds) < max_p:
                co, lat, lon, ncells, _ = ball_orders(rsup)
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


def evaluate_network(grid_data, existing_stores, mini_ds, standard_ds, super_ds, params, progress_cb=None):
    """Evaluate current vs proposed using OSRM road distances only (Table API)."""
    require_osrm()
    base_cost = params.get('base_cost', 29)
    var_rate = params.get('variable_rate', 9)
    weights = grid_data['orders_per_day'].values

    # Current network distances
    if progress_cb: progress_cb("Computing current network road distances...")
    cust_lats = grid_data['avg_cust_lat'].values
    cust_lons = grid_data['avg_cust_lon'].values
    store_lats = grid_data['avg_store_lat'].values
    store_lons = grid_data['avg_store_lon'].values

    current_dists = osrm_pairwise_distances_parallel(
        cust_lats, cust_lons, store_lats, store_lons,
        progress_cb=lambda d, t: progress_cb(f"Current distances: {d}/{t} batches") if progress_cb else None
    )

    current_costs = base_cost + var_rate * current_dists
    current_avg_dist = float(np.average(current_dists, weights=weights))
    current_avg_cost = float(np.average(current_costs, weights=weights))

    # Proposed network — tier-specific cost when use_tiered_costs
    if progress_cb: progress_cb("Computing proposed network road distances...")
    all_hubs = mini_ds + standard_ds + super_ds
    if len(all_hubs) == 0:
        all_hubs = [{'lat': s['lat'], 'lon': s['lon'], 'type': 'standard'} for s in existing_stores]

    mb = float(params.get('mini_base_cost', 20))
    mvar = float(params.get('mini_variable_rate', 6))
    sb = float(params.get('standard_base_cost', 29))
    svar = float(params.get('standard_variable_rate', 9))
    pbb = float(params.get('super_base_cost', 29))
    pvar = float(params.get('super_variable_rate', 9))
    rmini = float(params.get('mini_ds_radius', 1.0))
    rstd = float(params.get('standard_ds_radius', 2.5))
    rsup = float(params.get('super_ds_radius', 4.0))
    use_tiered = params.get('use_tiered_costs', True)
    has_proposed = bool(mini_ds or standard_ds or super_ds)

    n = len(cust_lats)

    def _min_dist_to_hubs(hubs):
        if not hubs:
            return np.full(n, np.inf)
        hl = np.array([h['lat'] for h in hubs], dtype=np.float64)
        ho = np.array([h['lon'] for h in hubs], dtype=np.float64)
        return osrm_min_distances_parallel(cust_lats, cust_lons, hl, ho, progress_cb=None)

    d_mini = _min_dist_to_hubs(mini_ds)
    d_std = _min_dist_to_hubs(standard_ds)
    d_sup = _min_dist_to_hubs(super_ds)

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
            if mini_ds and d_mini[i] <= rmini:
                proposed_dists[i] = d_mini[i]
                proposed_costs[i] = mb + mvar * d_mini[i]
            elif standard_ds and d_std[i] <= rstd:
                proposed_dists[i] = d_std[i]
                proposed_costs[i] = sb + svar * d_std[i]
            elif super_ds and d_sup[i] <= rsup:
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

    served = np.isfinite(proposed_dists)
    if np.any(served):
        proposed_avg_dist = float(np.average(proposed_dists[served], weights=weights[served]))
        proposed_mean_dist_unweighted = float(np.nanmean(proposed_dists))
    else:
        proposed_avg_dist = None
        proposed_mean_dist_unweighted = None
    proposed_avg_cost = float(np.average(proposed_costs, weights=weights))

    daily_savings = (current_avg_cost - proposed_avg_cost) * state.orders_per_day

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

    return {
        'current_avg_dist': round(current_avg_dist, 3),
        'proposed_avg_dist': None if proposed_avg_dist is None else round(proposed_avg_dist, 3),
        'proposed_mean_dist_unweighted': None if proposed_mean_dist_unweighted is None else round(proposed_mean_dist_unweighted, 3),
        'current_avg_cost': round(current_avg_cost, 2),
        'proposed_avg_cost': round(proposed_avg_cost, 2),
        'daily_savings': round(max(0, daily_savings), 0),
        'monthly_savings': round(max(0, daily_savings) * 30, 0),
        'total_orders_per_day': state.orders_per_day,
        'pct_cost_reduction': round((current_avg_cost - proposed_avg_cost) / max(current_avg_cost, 0.01) * 100, 1),
        'distance_source': dist_src,
        'distance_histogram': hist_map,
        'total_grid_cells': len(grid_data),
        'proposed_distances_proxy': False,
        'pct_orders_within_mini_service_km': pct_within_mini,
        'mini_service_radius_km': round(mr, 3),
        'pct_order_weight_outside_tier_radii': pct_order_weight_outside_tier_radii,
        'metrics_note': (
            'Proposed avg distance is over demand **within** Mini / Standard / Super service radii only '
            '(order-weighted). Demand outside those radii is treated as unserved by the proposed network; '
            'its cost stays at the current-network baseline in this model.'
        ),
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
        target_max_hubs       — int, max total hubs (Mini + Standard)
        target_last_mile_cost — float, max avg last-mile cost (₹)

    Primary goal: ALWAYS maximize order coverage.
    No satellite backfill — uncovered demand is reported honestly.

    Returns dict with placement, metrics, and uncovered_pockets.
    """
    require_osrm()
    params = normalize_placement_params(params)

    target_max_hubs = params.get('target_max_hubs')
    target_cost = params.get('target_last_mile_cost')

    if target_max_hubs is None and target_cost is None:
        raise ValueError("At least one constraint required: target_max_hubs or target_last_mile_cost")

    if target_max_hubs is not None:
        target_max_hubs = int(target_max_hubs)
    else:
        target_max_hubs = 9999  # effectively unlimited

    rmini = float(params.get('mini_ds_radius', 1.5))
    rstd = float(params.get('standard_ds_radius', 3.0))
    m_lo, m_hi = _tier_min_max_orders(params, 'mini')
    s_lo, s_hi = _tier_min_max_orders(params, 'standard')

    mb = float(params.get('mini_base_cost', 20))
    mvar = float(params.get('mini_variable_rate', 6))
    sb = float(params.get('standard_base_cost', 29))
    svar = float(params.get('standard_variable_rate', 9))
    base_cost = float(params.get('base_cost', 29))
    var_rate = float(params.get('variable_rate', 9))

    t_start = time.time()
    n_cells = len(grid_data) if grid_data is not None else 0
    logger.info("Constraint optimizer (unified greedy): %d grid cells, target_max_hubs=%s, target_cost=%s",
                n_cells, target_max_hubs, target_cost)

    # ── Working arrays ──────────────────────────────────────────────────────
    clat = grid_data['cell_lat'].values.astype(np.float64)
    clon = grid_data['cell_lon'].values.astype(np.float64)
    wts  = grid_data['orders_per_day'].values.astype(np.float64)
    n = len(clat)

    # Track which cells are already covered by a placed hub
    covered = np.zeros(n, dtype=bool)

    mini_ds = []
    standard_ds = []
    mini_max = int(params.get('mini_ds_max', 300))
    std_max  = int(params.get('standard_ds_max', 500))

    # Each tier maintains its own "remaining" grid (cells not yet consumed by
    # that tier's greedy).  Overlapping means a cell consumed by Mini can still
    # be consumed by Standard and vice-versa.
    mini_remaining = grid_data.sort_values('orders_per_day', ascending=False).copy()
    std_remaining  = grid_data.sort_values('orders_per_day', ascending=False).copy()

    mini_exhausted = False
    std_exhausted  = False
    consecutive_skips = {'mini': 0, 'standard': 0}
    MAX_SKIPS = 200

    if progress_cb:
        progress_cb("Unified greedy: placing hubs one at a time (best coverage first)...")

    # ── Unified greedy loop ─────────────────────────────────────────────────
    hub_count = 0
    iteration = 0
    max_iterations = (mini_max + std_max + MAX_SKIPS * 2) * 2

    while hub_count < target_max_hubs and iteration < max_iterations:
        iteration += 1

        if mini_exhausted and std_exhausted:
            logger.info("Both tiers exhausted — stopping.")
            break

        # ── Try to form one candidate hub from each tier ────────────────
        mini_candidate = None
        std_candidate  = None

        if not mini_exhausted and len(mini_ds) < mini_max and len(mini_remaining) > 0:
            mini_candidate = _try_greedy_hub(
                mini_remaining, clat, clon, wts, covered,
                rmini, m_lo, m_hi, 'mini', '4k'
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
                rstd, s_lo, s_hi, 'standard', '15k'
            )
            if std_candidate is None:
                best_idx = std_remaining['orders_per_day'].idxmax()
                std_remaining = std_remaining.drop(best_idx)
                consecutive_skips['standard'] += 1
                if consecutive_skips['standard'] >= MAX_SKIPS or len(std_remaining) == 0:
                    std_exhausted = True
                    logger.info("Standard tier exhausted (%d hubs placed).", len(standard_ds))

        if mini_candidate is None and std_candidate is None:
            continue  # both failed this round; skip counts already incremented

        # ── Pick the candidate that covers the most *uncovered* demand ──
        mini_new_cov = mini_candidate['new_coverage'] if mini_candidate else -1
        std_new_cov  = std_candidate['new_coverage']  if std_candidate  else -1

        if mini_new_cov >= std_new_cov and mini_candidate is not None:
            chosen = mini_candidate
            hub = chosen['hub']
            mini_ds.append(hub)
            mini_remaining = mini_remaining[~chosen['grid_mask']]
            consecutive_skips['mini'] = 0
        elif std_candidate is not None:
            chosen = std_candidate
            hub = chosen['hub']
            standard_ds.append(hub)
            std_remaining = std_remaining[~chosen['grid_mask']]
            consecutive_skips['standard'] = 0
        else:
            continue

        # Mark newly-covered cells
        covered[chosen['covered_cell_indices']] = True
        hub_count += 1

        if hub_count % 10 == 0 and progress_cb:
            pct = 100.0 * float(wts[covered].sum()) / max(float(wts.sum()), 1e-9)
            progress_cb(
                f"Hub {hub_count}/{target_max_hubs}: "
                f"{len(mini_ds)} Mini + {len(standard_ds)} Std, "
                f"coverage {pct:.1f}%"
            )

    logger.info("Unified greedy done: %d Mini + %d Standard = %d hubs",
                len(mini_ds), len(standard_ds), hub_count)

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

    # Proposed network distances
    d_mini_final = _min_d(mini_ds, "Mini") if mini_ds else np.full(n, np.inf)
    d_std_final  = _min_d(standard_ds, "Std") if standard_ds else np.full(n, np.inf)

    proposed_dists = np.full(n, np.nan)
    proposed_costs = np.zeros(n)

    for i in range(n):
        if mini_ds and d_mini_final[i] <= rmini + 1e-5:
            proposed_dists[i] = d_mini_final[i]
            proposed_costs[i] = mb + mvar * d_mini_final[i]
        elif standard_ds and d_std_final[i] <= rstd + 1e-5:
            proposed_dists[i] = d_std_final[i]
            proposed_costs[i] = sb + svar * d_std_final[i]
        else:
            proposed_dists[i] = np.nan
            proposed_costs[i] = current_costs[i]

    served_final    = np.isfinite(proposed_dists)
    uncovered_final = ~served_final

    # Cost constraint check
    proposed_avg_cost = float(np.average(proposed_costs, weights=wts))
    if target_cost is not None:
        if proposed_avg_cost > target_cost:
            logger.info("Cost constraint: proposed avg=₹%.2f > target=₹%.2f — more hubs needed to lower cost further",
                        proposed_avg_cost, target_cost)
        else:
            logger.info("Cost constraint met: proposed avg=₹%.2f <= target=₹%.2f", proposed_avg_cost, target_cost)

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

    uncovered_pockets = []
    if np.any(uncovered_final):
        uncovered_pockets = _group_uncovered_pockets(
            clat[uncovered_final], clon[uncovered_final], wts[uncovered_final],
            pocket_radius_km=3.0, progress_cb=progress_cb
        )

    total_elapsed = time.time() - t_start
    logger.info("Constraint optimizer complete: %.1fs, %d Mini + %d Std = %d hubs, %.1f%% coverage",
                total_elapsed, len(mini_ds), len(standard_ds),
                len(mini_ds) + len(standard_ds), final_coverage_pct)

    metrics = {
        'current_avg_dist': round(current_avg_dist, 3),
        'proposed_avg_dist': round(proposed_avg_dist, 3) if proposed_avg_dist is not None else None,
        'current_avg_cost': round(current_avg_cost, 2),
        'proposed_avg_cost': round(proposed_avg_cost, 2),
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
        },
    }

    return {
        'mini_ds': mini_ds,
        'standard_ds': standard_ds,
        'super_ds': [],
        'metrics': metrics,
        'uncovered_pockets': uncovered_pockets,
        'total_hubs': len(mini_ds) + len(standard_ds),
        'placement_time_seconds': round(total_elapsed, 1),
    }


def _try_greedy_hub(grid_remaining, all_clat, all_clon, all_wts, covered,
                    radius_km, min_orders, max_orders, tier_name, selection_label):
    """Try to form one greedy hub from the highest-demand cell in grid_remaining.

    Scores by *new coverage* = orders in the OSRM ball that are NOT yet in ``covered``.
    The cluster must have total orders (covered + uncovered) in [min_orders, max_orders],
    but the ranking uses only the *newly-covered* portion.

    Returns dict {hub, grid_mask, covered_cell_indices, new_coverage} or None.
    """
    if grid_remaining is None or len(grid_remaining) == 0:
        return None

    best_idx = grid_remaining['orders_per_day'].idxmax()
    best = grid_remaining.loc[best_idx]
    if best['orders_per_day'] < 1e-6:
        return None

    # OSRM distances from seed to all cells in this tier's remaining grid
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

    hub = {
        'lat': float(w_lat), 'lon': float(w_lon),
        'orders_per_day': float(cluster_orders),
        'radius_km': radius_km, 'type': tier_name,
        'cells': int(len(cluster)),
        'selection': selection_label,
    }

    # Now determine which cells in the FULL grid this hub would cover,
    # and how many of those are currently uncovered.
    dists_full = osrm_one_to_many(
        float(w_lat), float(w_lon), all_clat, all_clon
    )
    within_radius = dists_full <= radius_km + 1e-5
    newly_covered = within_radius & (~covered)
    new_coverage = float(all_wts[newly_covered].sum())
    covered_cell_indices = np.where(newly_covered)[0]

    return {
        'hub': hub,
        'grid_mask': grid_mask,
        'covered_cell_indices': covered_cell_indices,
        'new_coverage': new_coverage,
    }


def _group_uncovered_pockets(lats, lons, orders, pocket_radius_km=3.0, progress_cb=None):
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

        pockets.append({
            'lat': pocket_lat,
            'lon': pocket_lon,
            'orders_per_day': round(pocket_orders, 0),
            'num_cells': int(len(pocket_cells)),
        })

        assigned[pocket_cells] = True

        if len(pockets) % 10 == 0 and progress_cb:
            progress_cb(f"Uncovered pockets: {len(pockets)} groups, {int(assigned.sum())}/{n} cells assigned...")

    # Sort descending by orders
    pockets.sort(key=lambda p: p['orders_per_day'], reverse=True)
    logger.info("Uncovered demand: %d pockets, %.0f total orders/day",
                len(pockets), sum(p['orders_per_day'] for p in pockets))
    return pockets


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
            resp = {
                'data_loaded': state.data_loaded,
                'load_progress': state.load_progress,
                'total_orders': state.total_orders,
                'orders_per_day': state.orders_per_day,
                'num_stores': len(state.existing_stores),
                'num_grid_cells': len(state.grid_data) if state.grid_data is not None else 0,
                'osrm_available': state.osrm_available,
                'osrm_url': OSRM_BASE_URL,
                'optimization_running': state.optimization_running,
                'optimization_progress': state.optimization_progress,
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
                'city_bounds': state.city_bounds,
                'heatmap': heatmap,
                'orders_per_day': state.orders_per_day,
                'total_orders': state.total_orders,
                'osrm_available': state.osrm_available,
            })
        elif path == '/api/result':
            if state.optimization_result:
                self._json(state.optimization_result)
            else:
                self._json({'error': 'No optimization result'}, 404)
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
        elif path == '/api/optimize':
            self._handle_optimize()
        elif path == '/api/optimize-constrained':
            self._handle_optimize_constrained()
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
                        }
                        state.load_progress = "Orders loaded successfully"
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
                self._json({
                    'ok': True,
                    'filename': filename,
                    'num_stores': len(stores),
                    'stores': [{
                        'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                        'orders_per_day': s['orders_per_day'],
                        'polygon_coords': s.get('polygon_coords', [])
                    } for s in stores],
                })

        except Exception as e:
            logger.error(f"Local load error: {traceback.format_exc()}")
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
                self._json({
                    'ok': True,
                    'filename': filename,
                    'total_orders': state.total_orders,
                    'orders_per_day': state.orders_per_day,
                    'grid_cells': len(state.grid_data),
                    'column_mapping': mapping,
                    'unique_dates': state.unique_dates,
                })
            else:
                stores = load_store_xlsx(save_path)
                state.data_loaded = True  # Both files now loaded
                self._json({
                    'ok': True,
                    'filename': filename,
                    'num_stores': len(stores),
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

                # Existing stores with polygon data
                stores_json = [{
                    'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                    'orders_per_day': s['orders_per_day'],
                    'polygon_coords': s.get('polygon_coords', [])
                } for s in state.existing_stores]

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
        """Constraint-driven optimization: maximize coverage within hub count / cost limits."""
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
            params = json.loads(body) if body else {}
        except Exception:
            params = {}

        if params.get('target_max_hubs') is None and params.get('target_last_mile_cost') is None:
            self._json({'error': 'At least one constraint required: target_max_hubs or target_last_mile_cost'}, 400)
            return

        def run():
            try:
                state.optimization_running = True
                state.optimization_progress = "Constraint-driven optimization starting..."
                t0 = time.time()

                result = optimize_with_constraints(
                    state.grid_data, state.existing_stores, params,
                    progress_cb=lambda msg: setattr(state, 'optimization_progress', msg)
                )

                elapsed = time.time() - t0
                heatmap = generate_heatmap(state.grid_data)
                stores_json = [{
                    'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
                    'orders_per_day': s['orders_per_day'],
                    'polygon_coords': s.get('polygon_coords', [])
                } for s in state.existing_stores]

                state.optimization_result = {
                    'success': True,
                    'mini_ds': result['mini_ds'],
                    'standard_ds': result['standard_ds'],
                    'super_ds': result['super_ds'],
                    'metrics': result['metrics'],
                    'uncovered_pockets': result['uncovered_pockets'],
                    'heatmap': heatmap,
                    'existing_stores': stores_json,
                    'city_bounds': state.city_bounds,
                    'compute_time_s': round(elapsed, 1),
                    'params': params,
                    'pipeline': {
                        'total_hubs': result['total_hubs'],
                        'mode': 'constrained',
                    },
                }
                state.optimization_progress = "Complete"
            except Exception as e:
                logger.error(f"Constrained optimization error: {traceback.format_exc()}")
                state.optimization_result = {'success': False, 'error': str(e)}
                state.optimization_progress = f"Error: {e}"
            finally:
                state.optimization_running = False

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        self._json({'started': True, 'message': 'Constrained optimization started. Poll /api/status for progress.'})

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

        tolerance_pct = float(params.get('tolerance_pct', 2))
        tolerance_abs = max(target * tolerance_pct / 100.0, 0.05)
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
            'super_base_cost', 'super_variable_rate',
            'use_tiered_costs',
            'mini_ds_radius', 'mini_ds_min_orders_per_day', 'mini_ds_max_orders_per_day',
            'standard_ds_radius', 'standard_ds_min_orders_per_day', 'standard_ds_max_orders_per_day',
            'super_ds_radius', 'super_ds_min_orders_per_day', 'super_ds_max_orders_per_day',
            'mini_coverage_fill',
            'require_full_tier_coverage',
            'super_core_must_cover_geojson', 'super_exclude_geojson',
        )
        base_params = {k: params[k] for k in opt_keys if k in params}
        defaults = {
            'base_cost': 29, 'variable_rate': 9,
            'mini_base_cost': 20, 'mini_variable_rate': 6,
            'standard_base_cost': 29, 'standard_variable_rate': 9,
            'super_base_cost': 29, 'super_variable_rate': 9,
            'use_tiered_costs': True,
            'mini_ds_radius': 1.0, 'mini_ds_min_orders_per_day': 300,
            'mini_ds_max_orders_per_day': 8000,
            'standard_ds_radius': 2.5, 'standard_ds_min_orders_per_day': 500,
            'standard_ds_max_orders_per_day': 12000,
            'super_ds_radius': 4.0, 'super_ds_min_orders_per_day': 1500,
            'super_ds_max_orders_per_day': 50000,
            'mini_coverage_fill': False,
            'require_full_tier_coverage': True,
        }
        for k, v in defaults.items():
            base_params.setdefault(k, v)
        base_params = normalize_placement_params(base_params)

        def run():
            try:
                state.optimization_running = True
                t0 = time.time()
                target_meta = {
                    'target_avg_cost': target,
                    'tolerance_pct': tolerance_pct,
                    'tolerance_abs': round(tolerance_abs, 4),
                    'mode': mode,
                }
                mini_ds = []
                standard_ds = []
                super_ds = []
                final_metrics = None
                final_params = {}
                pipeline_extra = {}

                if mode == 'calibrate_base':
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

                state.optimization_result = {
                    'success': True,
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
                }
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
        body = json.dumps(obj, default=str).encode()
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

    server = HTTPServer(('0.0.0.0', SERVER_PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nShutting down.")
        server.shutdown()
