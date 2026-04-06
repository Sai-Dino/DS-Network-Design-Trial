#!/usr/bin/env python3
"""
Flipkart Hyperlocal Distance Analysis Server
A Flask-based backend for processing 3M+ row datasets with OSRM integration.
Handles all heavy computation and serves lightweight JSON to the browser.
"""

import os
import json
import uuid
import threading
import requests
import logging
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt
from collections import defaultdict
from typing import Dict, List, Tuple, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import StringIO, BytesIO
import csv

import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_file
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app configuration
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size


# ============================================================================
# GLOBAL STATE & UTILITIES
# ============================================================================

class JobState:
    """Represents the state of a distance calculation job."""
    def __init__(self, job_id: str, filename: str, df: pd.DataFrame, mapping: Dict[str, str]):
        self.job_id = job_id
        self.filename = filename
        self.df = df
        self.mapping = mapping
        self.created_at = datetime.now()
        self.status = "idle"  # idle, running, complete, error
        self.processed = 0
        self.total = len(df)
        self.failed = 0
        self.start_time = None
        self.error_message = None
        self.results = []  # List of {order_id, store_id, distance_km, ...}
        self.stats_cache = None
        self.stores_cache = None
        self.lock = threading.Lock()

    def to_dict(self):
        return {
            "id": self.job_id,
            "job_id": self.job_id,
            "filename": self.filename,
            "rows": self.total,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


# Global job storage
JOBS: Dict[str, JobState] = {}
JOBS_LOCK = threading.Lock()


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on earth (in kilometers).
    """
    try:
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    except (TypeError, ValueError):
        return None


def get_column_mapping(df: pd.DataFrame) -> Dict[str, str]:
    """
    Auto-detect column mapping from DataFrame.
    Returns mapping of {mapped_name: actual_column_name}
    """
    mapping = {}
    columns_lower = {col.lower(): col for col in df.columns}

    # Store latitude patterns
    for pattern in ['store_lat', 'lat_store', 'store latitude', 'lat store', 'origin_lat']:
        if pattern in columns_lower:
            mapping['store_lat'] = columns_lower[pattern]
            break

    # Store longitude patterns
    for pattern in ['store_lon', 'lon_store', 'store longitude', 'long store', 'origin_lon']:
        if pattern in columns_lower:
            mapping['store_lon'] = columns_lower[pattern]
            break

    # Order latitude patterns
    for pattern in ['order_lat', 'lat_order', 'order latitude', 'lat order', 'destination_lat']:
        if pattern in columns_lower:
            mapping['order_lat'] = columns_lower[pattern]
            break

    # Order longitude patterns
    for pattern in ['order_lon', 'lon_order', 'order longitude', 'long order', 'destination_lon']:
        if pattern in columns_lower:
            mapping['order_lon'] = columns_lower[pattern]
            break

    # Order ID patterns
    for pattern in ['order_id', 'order number', 'order id']:
        if pattern in columns_lower:
            mapping['order_id'] = columns_lower[pattern]
            break

    # Store ID patterns
    for pattern in ['store_id', 'hub_code', 'dark store', 'store_code']:
        if pattern in columns_lower:
            mapping['store_id'] = columns_lower[pattern]
            break

    # Date patterns
    for pattern in ['date', 'order_date', 'delivery_date', 'created_date']:
        if pattern in columns_lower:
            mapping['date'] = columns_lower[pattern]
            break

    return mapping


def calculate_stats(results: List[Dict]) -> Dict[str, Any]:
    """Calculate statistical summaries from distance results."""
    empty_stats = {
        'total': len(results) if results else 0,
        'total_orders': len(results) if results else 0,
        'successful': 0, 'successful_count': 0,
        'failed': len(results) if results else 0,
        'failed_count': len(results) if results else 0,
        'avg': 0, 'avg_distance': 0,
        'median': 0, 'median_distance': 0,
        'min': 0, 'min_distance': 0,
        'max': 0, 'max_distance': 0,
        'p25': 0, 'p75': 0, 'p90': 0, 'p95': 0,
        'percentiles': {},
        'histogram_bins': {},
        'range_bins': {},
    }

    if not results:
        return empty_stats

    distances = [r.get('distance_km') for r in results if r.get('distance_km') is not None and r.get('distance_km') == r.get('distance_km')]  # NaN check
    if not distances:
        return empty_stats

    distances = sorted(distances)
    n = len(distances)

    # Histogram: 1km bins up to 5km, then 5+ bucket
    dist_arr = np.array(distances)
    hist_bins = {
        '0-1 km': int(np.sum((dist_arr >= 0) & (dist_arr < 1))),
        '1-2 km': int(np.sum((dist_arr >= 1) & (dist_arr < 2))),
        '2-3 km': int(np.sum((dist_arr >= 2) & (dist_arr < 3))),
        '3-4 km': int(np.sum((dist_arr >= 3) & (dist_arr < 4))),
        '4-5 km': int(np.sum((dist_arr >= 4) & (dist_arr < 5))),
        '5+ km': int(np.sum(dist_arr >= 5)),
    }

    # Range distribution (same granularity)
    ranges = {
        '0-1 km': hist_bins['0-1 km'],
        '1-2 km': hist_bins['1-2 km'],
        '2-3 km': hist_bins['2-3 km'],
        '3-4 km': hist_bins['3-4 km'],
        '4-5 km': hist_bins['4-5 km'],
        '5+ km': hist_bins['5+ km'],
    }

    return {
        'total': len(results),
        'total_orders': len(results),
        'successful': len(distances),
        'successful_count': len(distances),
        'failed': len(results) - len(distances),
        'failed_count': len(results) - len(distances),
        'avg': round(float(np.mean(distances)), 3),
        'avg_distance': round(float(np.mean(distances)), 3),
        'median': round(float(np.median(distances)), 3),
        'median_distance': round(float(np.median(distances)), 3),
        'min': round(float(min(distances)), 3),
        'min_distance': round(float(min(distances)), 3),
        'max': round(float(max(distances)), 3),
        'max_distance': round(float(max(distances)), 3),
        'p25': round(float(np.percentile(distances, 25)), 3),
        'p75': round(float(np.percentile(distances, 75)), 3),
        'p90': round(float(np.percentile(distances, 90)), 3),
        'p95': round(float(np.percentile(distances, 95)), 3),
        'percentiles': {
            'min': round(float(min(distances)), 2),
            'p25': round(float(np.percentile(distances, 25)), 2),
            'median': round(float(np.median(distances)), 2),
            'p75': round(float(np.percentile(distances, 75)), 2),
            'p90': round(float(np.percentile(distances, 90)), 2),
            'p95': round(float(np.percentile(distances, 95)), 2),
            'max': round(float(max(distances)), 2),
        },
        'histogram_bins': hist_bins,
        'range_bins': ranges,
    }


def calculate_store_stats(results: List[Dict], df: pd.DataFrame, mapping: Dict[str, str]) -> Dict[str, Dict]:
    """Calculate per-store statistics."""
    stores = defaultdict(lambda: {
        'orders': 0,
        'distances': [],
        'lat': None,
        'lon': None,
    })

    # Aggregate by store
    for result in results:
        store_id = result.get('store_id')
        if store_id:
            stores[store_id]['orders'] += 1
            if result.get('distance_km') is not None:
                stores[store_id]['distances'].append(result['distance_km'])

    # Get store locations
    if mapping.get('store_id') and mapping.get('store_lat') and mapping.get('store_lon'):
        store_locs = df.drop_duplicates(subset=[mapping['store_id']])
        for _, row in store_locs.iterrows():
            store_id = row[mapping['store_id']]
            if store_id in stores:
                stores[store_id]['lat'] = row[mapping['store_lat']]
                stores[store_id]['lon'] = row[mapping['store_lon']]

    # Calculate stats per store
    store_stats = {}
    for store_id, data in stores.items():
        if data['distances']:
            dists = sorted(data['distances'])
            store_stats[store_id] = {
                'id': store_id,
                'store_id': store_id,
                'orders': data['orders'],
                'order_count': data['orders'],
                'avg_dist': round(float(np.mean(dists)), 3),
                'avg_distance': round(float(np.mean(dists)), 3),
                'median_dist': round(float(np.median(dists)), 3),
                'min_dist': round(float(min(dists)), 3),
                'max_dist': round(float(max(dists)), 3),
                'p90_dist': round(float(np.percentile(dists, 90)), 3),
                'lat': float(data['lat']) if data['lat'] is not None else None,
                'lon': float(data['lon']) if data['lon'] is not None else None,
            }
        else:
            store_stats[store_id] = {
                'id': store_id,
                'store_id': store_id,
                'orders': data['orders'],
                'order_count': data['orders'],
                'avg_dist': 0,
                'avg_distance': 0,
                'median_dist': 0,
                'min_dist': 0,
                'max_dist': 0,
                'p90_dist': 0,
                'lat': float(data['lat']) if data['lat'] is not None else None,
                'lon': float(data['lon']) if data['lon'] is not None else None,
            }

    return store_stats


# ============================================================================
# OSRM INTEGRATION
# ============================================================================

def batch_osrm_requests(
    rows: List[Dict],
    osrm_url: str,
    mapping: Dict[str, str],
    batch_size: int = 100,
    max_workers: int = 12,
) -> List[Dict]:
    """
    Make batched OSRM requests with multi-threading.
    """
    results = []
    failed_indices = []

    def fetch_batch(batch_indices: List[int]) -> Tuple[List[Dict], List[int]]:
        batch_results = []
        batch_failed = []

        try:
            # Prepare coordinates for OSRM
            coords = []
            valid_indices = []

            for idx in batch_indices:
                row = rows[idx]
                store_lat = row.get(mapping.get('store_lat'))
                store_lon = row.get(mapping.get('store_lon'))
                order_lat = row.get(mapping.get('order_lat'))
                order_lon = row.get(mapping.get('order_lon'))

                if all(x is not None for x in [store_lat, store_lon, order_lat, order_lon]):
                    try:
                        store_lat = float(store_lat)
                        store_lon = float(store_lon)
                        order_lat = float(order_lat)
                        order_lon = float(order_lon)

                        # OSRM format: lon,lat;lon,lat;...
                        coords.append(f"{store_lon},{store_lat}")
                        coords.append(f"{order_lon},{order_lat}")
                        valid_indices.append(idx)
                    except (TypeError, ValueError):
                        batch_failed.append(idx)
                else:
                    batch_failed.append(idx)

            if not valid_indices:
                return batch_results, batch_failed

            # Build the FULL URL manually — do NOT use requests params= dict
            # because urllib encodes semicolons to %3B which OSRM can't parse.
            coord_string = ";".join(coords)
            sources_str = ";".join(str(i) for i in range(0, len(coords), 2))
            destinations_str = ";".join(str(i) for i in range(1, len(coords), 2))
            full_url = (
                f"{osrm_url}/table/v1/driving/{coord_string}"
                f"?sources={sources_str}"
                f"&destinations={destinations_str}"
                f"&annotations=distance"
            )

            response = requests.get(full_url, timeout=30)
            response.raise_for_status()

            data = response.json()

            if data.get('code') == 'Ok' and 'distances' in data:
                distances = data['distances']
                for i, idx in enumerate(valid_indices):
                    row = rows[idx].copy()
                    row['distance_m'] = distances[i][i]  # Distance from source i to destination i
                    row['distance_km'] = row['distance_m'] / 1000.0
                    batch_results.append(row)
            else:
                batch_failed.extend(valid_indices)

        except Exception as e:
            logger.error(f"OSRM batch request failed: {e}")
            batch_failed.extend(batch_indices)

        return batch_results, batch_failed

    # Split into batches
    total_rows = len(rows)
    batches = []
    for i in range(0, total_rows, batch_size):
        batch_indices = list(range(i, min(i + batch_size, total_rows)))
        batches.append(batch_indices)

    # Execute batches in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(fetch_batch, batch): batch for batch in batches}

        for future in tqdm(as_completed(futures), total=len(futures), desc="OSRM Requests"):
            batch_results, batch_failed = future.result()
            results.extend(batch_results)
            failed_indices.extend(batch_failed)

    return results, failed_indices


def background_distance_calculation(job: JobState, osrm_url: str):
    """
    Background distance calculation using store-grouped Table API.
    Groups orders by store, then for each store sends one Table API request
    with the store as the single source and all its orders as destinations.
    This produces a 1xN vector per store — zero wasted computation.
    """
    try:
        # Test OSRM connectivity
        try:
            test_url = f"{osrm_url}/route/v1/driving/77.5946,12.9716;77.6000,12.9800?overview=false"
            test_resp = requests.get(test_url, timeout=5)
            if test_resp.status_code != 200:
                with job.lock:
                    job.status = "error"
                    job.error_message = f"OSRM server at {osrm_url} returned status {test_resp.status_code}. Is OSRM running?"
                return
        except requests.exceptions.ConnectionError:
            with job.lock:
                job.status = "error"
                job.error_message = f"Cannot connect to OSRM at {osrm_url}. Make sure OSRM is running (osrm-routed)."
            return
        except Exception as e:
            with job.lock:
                job.status = "error"
                job.error_message = f"OSRM connectivity test failed: {str(e)}"
            return

        logger.info(f"Job {job.job_id}: OSRM verified at {osrm_url}")

        with job.lock:
            job.status = "running"
            job.start_time = datetime.now()

        rows = job.df.to_dict('records')
        mapping = job.mapping
        total_rows = len(rows)
        store_col = mapping.get('store_id', '')
        slat_col = mapping.get('store_lat', '')
        slon_col = mapping.get('store_lon', '')
        olat_col = mapping.get('order_lat', '')
        olon_col = mapping.get('order_lon', '')

        # Group row indices by store
        store_groups = defaultdict(list)
        invalid_indices = []
        for i, row in enumerate(rows):
            try:
                float(row.get(slat_col))
                float(row.get(slon_col))
                float(row.get(olat_col))
                float(row.get(olon_col))
                store_key = str(row.get(store_col, 'unknown'))
                store_groups[store_key].append(i)
            except (TypeError, ValueError):
                invalid_indices.append(i)

        # For each store, chunk orders into batches of 500 (safe URL size for OSRM)
        chunk_limit = 500
        tasks = []
        for store_key, indices in store_groups.items():
            row0 = rows[indices[0]]
            store_coord = f"{float(row0[slon_col])},{float(row0[slat_col])}"
            for c in range(0, len(indices), chunk_limit):
                chunk_indices = indices[c:c + chunk_limit]
                tasks.append((store_coord, chunk_indices))

        max_workers = 32
        all_results = [None] * total_rows
        failed_count = [len(invalid_indices)]
        completed_count = [len(invalid_indices)]
        result_lock = threading.Lock()

        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=max_workers,
            pool_maxsize=max_workers,
            max_retries=2
        )
        session.mount('http://', adapter)

        logger.info(f"Job {job.job_id}: {total_rows} rows, {len(store_groups)} stores, {len(tasks)} Table API requests ({max_workers} workers)")

        def process_store_chunk(store_coord, chunk_indices):
            """1 request: store as source, N orders as destinations → 1xN distances."""
            chunk_results = {}
            chunk_failed = 0

            order_coords = []
            valid = []
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
                # coords[0] = store, coords[1..N] = orders
                all_coords = store_coord + ";" + ";".join(order_coords)
                dests = ";".join(str(i) for i in range(1, len(valid) + 1))
                url = f"{osrm_url}/table/v1/driving/{all_coords}?sources=0&destinations={dests}&annotations=distance"

                resp = session.get(url, timeout=60)
                data = resp.json()

                if data.get('code') == 'Ok' and data.get('distances'):
                    dist_row = data['distances'][0]  # 1xN: single source row
                    for j, idx in enumerate(valid):
                        dist_m = dist_row[j]
                        if dist_m is not None:
                            result_row = rows[idx].copy()
                            result_row['distance_m'] = dist_m
                            result_row['distance_km'] = dist_m / 1000.0
                            if store_col:
                                result_row['store_id'] = str(result_row.get(store_col, ''))
                            oid_col = mapping.get('order_id', '')
                            if oid_col:
                                result_row['order_id'] = str(result_row.get(oid_col, ''))
                            chunk_results[idx] = result_row
                        else:
                            chunk_failed += 1
                else:
                    chunk_failed += len(valid)
            except Exception as e:
                logger.debug(f"Store chunk failed ({len(valid)} orders): {e}")
                chunk_failed += len(valid)

            return chunk_results, chunk_failed

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(process_store_chunk, sc, ci): ci
                for sc, ci in tasks
            }

            for future in as_completed(futures):
                chunk_results, chunk_failed = future.result()
                batch_size = len(chunk_results) + chunk_failed

                with result_lock:
                    for idx, result in chunk_results.items():
                        all_results[idx] = result
                    failed_count[0] += chunk_failed
                    completed_count[0] += batch_size

                    with job.lock:
                        job.processed = completed_count[0]
                        job.failed = failed_count[0]

        final_results = [r for r in all_results if r is not None]

        with job.lock:
            job.results = final_results
            job.processed = total_rows
            job.failed = failed_count[0]
            job.status = "complete"
            job.stats_cache = calculate_stats(final_results)
            job.stores_cache = calculate_store_stats(final_results, job.df, job.mapping)

        logger.info(f"Job {job.job_id} completed: {len(final_results)} ok, {failed_count[0]} failed")

    except Exception as e:
        logger.error(f"Job {job.job_id} failed: {e}")
        with job.lock:
            job.status = "error"
            job.error_message = str(e)


# ============================================================================
# FLASK ROUTES
# ============================================================================

@app.before_request
def add_cors_headers():
    """Add CORS headers to all responses."""
    pass


@app.after_request
def after_request(response):
    """Add CORS headers to response."""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


@app.route('/', methods=['GET'])
def serve_frontend():
    """Serve the frontend HTML file."""
    # Look for frontend in multiple locations for flexibility
    search_paths = [
        os.path.join(os.path.dirname(__file__), 'static', 'index.html'),
        os.path.join(os.path.dirname(__file__), 'hyperlocal_app.html'),
    ]
    for frontend_path in search_paths:
        if os.path.exists(frontend_path):
            with open(frontend_path, 'r') as f:
                return f.read()
    return """
    <html>
    <head><title>Hyperlocal Server</title></head>
    <body>
        <h1>Flipkart Hyperlocal Distance Analysis Server</h1>
        <p>Frontend not found. Place <code>static/index.html</code> in the project directory.</p>
        <p><strong>API Ready at:</strong> http://localhost:8080/api/</p>
    </body>
    </html>
    """


@app.route('/api/test-osrm', methods=['GET'])
def test_osrm():
    """Test OSRM server connectivity (server-side to avoid CORS)."""
    osrm_url = request.args.get('url', 'http://localhost:5000').rstrip('/')
    try:
        test_url = f"{osrm_url}/route/v1/driving/77.5946,12.9716;77.6000,12.9800?overview=false"
        resp = requests.get(test_url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('code') == 'Ok':
                dist = data['routes'][0]['distance'] if data.get('routes') else 0
                return jsonify({'ok': True, 'message': f'OSRM reachable. Test route: {dist:.0f}m'}), 200
        return jsonify({'ok': False, 'error': f'OSRM returned status {resp.status_code}'}), 200
    except requests.exceptions.ConnectionError:
        return jsonify({'ok': False, 'error': f'Cannot connect to {osrm_url}. Is osrm-routed running?'}), 200
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 200


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and parsing."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Determine file type
        filename = file.filename
        logger.info(f"Upload started: {filename}")

        if filename.endswith('.csv'):
            # For large CSVs, read with low_memory=False for consistent dtypes
            df = pd.read_csv(file, low_memory=False)
        elif filename.endswith(('.xlsx', '.xls')):
            sheet = request.form.get('sheet', None)
            df = pd.read_excel(file, sheet_name=sheet)
        else:
            return jsonify({'error': 'File must be CSV or XLSX'}), 400

        logger.info(f"File parsed: {filename} with {len(df)} rows, {len(df.columns)} columns")

        # Auto-detect column mapping
        mapping = get_column_mapping(df)

        if not mapping:
            return jsonify({
                'error': 'Could not auto-detect columns. Ensure columns contain standard names.',
                'columns': list(df.columns)
            }), 400

        # Check if distances are pre-calculated (broad detection)
        dist_col = None
        dist_names = [
            'road_distance_km', 'road_distance', 'distance_km', 'distance',
            'road_dist', 'road_dist_km', 'osrm_distance', 'osrm_distance_km',
            'shortest_distance', 'shortest_road_distance', 'dist_km', 'dist',
        ]
        for c in df.columns:
            normalized = c.lower().replace(' ', '_').replace('(', '').replace(')', '')
            if normalized in dist_names:
                dist_col = c
                break
        has_distance = dist_col is not None

        # Create job
        job_id = str(uuid.uuid4())
        job = JobState(job_id, filename, df, mapping)

        # If pre-calculated, process in background thread for large files
        if has_distance:
            job.status = "running"
            job.start_time = datetime.now()
            logger.info(f"Job {job_id}: Pre-calculated distances found in column '{dist_col}', processing in background...")

        with JOBS_LOCK:
            JOBS[job_id] = job

        row_count = len(df)
        store_count = df[mapping.get('store_id', '')].nunique() if mapping.get('store_id') else 0

        if has_distance:
            # Process pre-calculated data in background thread
            def process_precalculated():
                try:
                    store_col = mapping.get('store_id', '')
                    order_col = mapping.get('order_id', '')

                    # Vectorized processing using numpy/pandas (much faster than iterating dicts)
                    logger.info(f"Job {job_id}: Starting vectorized processing of {len(df)} rows...")

                    # Extract distance column as numpy array for fast NaN detection
                    dist_values = pd.to_numeric(df[dist_col], errors='coerce')
                    valid_mask = dist_values.notna()
                    failed_count = int((~valid_mask).sum())

                    # Build results efficiently using chunks to avoid memory spike
                    chunk_size = 200000
                    all_results = []
                    total_rows = len(df)

                    for chunk_start in range(0, total_rows, chunk_size):
                        chunk_end = min(chunk_start + chunk_size, total_rows)
                        chunk_df = df.iloc[chunk_start:chunk_end]
                        chunk_dists = dist_values.iloc[chunk_start:chunk_end]

                        chunk_records = chunk_df.to_dict('records')
                        chunk_dist_list = chunk_dists.tolist()

                        for i, r in enumerate(chunk_records):
                            d = chunk_dist_list[i]
                            r['distance_km'] = float(d) if pd.notna(d) else None
                            if store_col and store_col in r:
                                r['store_id'] = str(r[store_col])
                            if order_col and order_col in r:
                                r['order_id'] = str(r[order_col])

                        all_results.extend(chunk_records)

                        with job.lock:
                            job.processed = chunk_end
                        logger.info(f"Job {job_id}: Processed {chunk_end}/{total_rows} rows")

                    with job.lock:
                        job.results = all_results
                        job.total = len(all_results)
                        job.processed = len(all_results)
                        job.failed = failed_count
                        job.stats_cache = calculate_stats(all_results)
                        job.stores_cache = calculate_store_stats(all_results, df, mapping)
                        job.status = "complete"
                    logger.info(f"Job {job_id}: Pre-calculated data loaded: {len(all_results)} rows, {failed_count} failed")
                except Exception as e:
                    logger.error(f"Job {job_id}: Pre-calculated processing error: {e}")
                    with job.lock:
                        job.status = "error"
                        job.error_message = str(e)

            thread = threading.Thread(target=process_precalculated, daemon=True)
            thread.start()

        logger.info(f"Job {job_id} created: {filename} with {row_count} rows")

        return jsonify({
            'job_id': job_id,
            'filename': filename,
            'rows': row_count,
            'row_count': row_count,
            'stores': store_count,
            'store_count': store_count,
            'columns': list(df.columns),
            'available_columns': list(df.columns),
            'detected_mapping': mapping,
            'has_distance_column': has_distance,
        }), 200

    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/calculate/<job_id>', methods=['POST'])
def calculate_distances(job_id):
    """Start distance calculation in background."""
    try:
        with JOBS_LOCK:
            job = JOBS.get(job_id)

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        if job.status == "running":
            return jsonify({'status': 'running'}), 200

        # Get OSRM URL from request or use default
        body = request.get_json() or {}
        osrm_url = body.get('osrm_url', 'http://localhost:5000').rstrip('/')

        # Optional: use provided mapping
        if 'mapping' in body:
            job.mapping = body['mapping']

        # Start background thread
        thread = threading.Thread(
            target=background_distance_calculation,
            args=(job, osrm_url),
            daemon=True
        )
        thread.start()

        logger.info(f"Started calculation for job {job_id}")

        return jsonify({'status': 'started'}), 202

    except Exception as e:
        logger.error(f"Calculation start error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/progress/<job_id>', methods=['GET'])
def get_progress(job_id):
    """Get job progress."""
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        ok = max(0, job.processed - job.failed)
        progress = {
            'status': job.status,
            'processed': job.processed,
            'total': job.total,
            'failed': job.failed,
            'failed_count': job.failed,
            'ok_count': ok,
        }

        if job.error_message:
            progress['error'] = job.error_message

        if job.start_time and job.status == "running":
            elapsed = (datetime.now() - job.start_time).total_seconds()
            if job.processed > 0:
                rate = job.processed / elapsed
                remaining = job.total - job.processed
                eta_seconds = remaining / rate if rate > 0 else None
                progress['rate'] = rate
                eta_str = f"{int(eta_seconds // 60)}m {int(eta_seconds % 60)}s" if eta_seconds else '--'
                progress['eta'] = eta_str
            else:
                progress['rate'] = 0
                progress['eta'] = '--'

    return jsonify(progress), 200


@app.route('/api/stats/<job_id>', methods=['GET'])
def get_stats(job_id):
    """Get pre-computed statistics."""
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete', 'status': job.status}), 400

        stats = dict(job.stats_cache or {})
        store_count = len(job.stores_cache) if job.stores_cache else 0
        stats['store_count'] = store_count
        stats['total_stores'] = store_count

        # CRITICAL FIX: Merge job-level totals into stats so that
        # even when all OSRM calculations fail, total_orders reflects
        # the actual row count (not just successful results count).
        stats['total'] = job.total
        stats['total_orders'] = job.total
        stats['failed'] = job.failed
        stats['failed_count'] = job.failed
        successful = job.total - job.failed
        stats['successful'] = successful
        stats['successful_count'] = successful

    return jsonify(stats), 200


@app.route('/api/network-analysis/<job_id>', methods=['GET'])
def get_network_analysis(job_id):
    """Get threshold-based network analysis for network design decisions."""
    threshold = float(request.args.get('threshold', 3.0))

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        results = job.results
        stores = job.stores_cache or {}

    # Compute threshold-based metrics
    all_distances = [r.get('distance_km') for r in results if r.get('distance_km') is not None and r.get('distance_km') == r.get('distance_km')]
    total = len(all_distances)
    within = sum(1 for d in all_distances if d <= threshold)
    beyond = total - within

    # Per-store breach analysis
    store_analysis = []
    for sid, s in stores.items():
        store_dists = [r.get('distance_km') for r in results
                       if str(r.get('store_id', '')) == sid
                       and r.get('distance_km') is not None
                       and r.get('distance_km') == r.get('distance_km')]
        if not store_dists:
            continue
        s_within = sum(1 for d in store_dists if d <= threshold)
        s_beyond = len(store_dists) - s_within
        breach_pct = round((s_beyond / len(store_dists)) * 100, 1) if store_dists else 0
        store_analysis.append({
            'store_id': sid,
            'total_orders': len(store_dists),
            'within_threshold': s_within,
            'beyond_threshold': s_beyond,
            'breach_pct': breach_pct,
            'avg_distance': round(float(np.mean(store_dists)), 2),
            'max_distance': round(float(max(store_dists)), 2),
            'p90_distance': round(float(np.percentile(store_dists, 90)), 2) if len(store_dists) >= 2 else round(float(max(store_dists)), 2),
            'lat': s.get('lat'),
            'lon': s.get('lon'),
        })

    # Sort by breach % descending
    store_analysis.sort(key=lambda x: x['breach_pct'], reverse=True)

    # Problem stores (any with breach > 0)
    problem_stores = [s for s in store_analysis if s['breach_pct'] > 0]
    critical_stores = [s for s in store_analysis if s['breach_pct'] > 20]

    # Distance bands relative to threshold
    bands = {
        f'0-{threshold}km': within,
        f'{threshold}-{threshold*2}km': sum(1 for d in all_distances if threshold < d <= threshold * 2),
        f'{threshold*2}km+': sum(1 for d in all_distances if d > threshold * 2),
    }

    # Network health score (0-100)
    coverage_pct = round((within / total) * 100, 1) if total > 0 else 0
    health_score = min(100, round(coverage_pct * 1.0))

    # Orders beyond threshold for gap mapping
    beyond_orders = []
    sample_count = 0
    for r in results:
        d = r.get('distance_km')
        if d is not None and d > threshold:
            mapping = job.mapping
            olat = r.get(mapping.get('order_lat', ''))
            olon = r.get(mapping.get('order_lon', ''))
            try:
                beyond_orders.append({
                    'lat': float(olat), 'lon': float(olon),
                    'distance': round(d, 2),
                    'store_id': str(r.get('store_id', '')),
                })
                sample_count += 1
                if sample_count >= 10000:  # Cap for performance
                    break
            except (TypeError, ValueError):
                continue

    return jsonify({
        'threshold': threshold,
        'total_orders': total,
        'within_threshold': within,
        'beyond_threshold': beyond,
        'coverage_pct': coverage_pct,
        'health_score': health_score,
        'bands': bands,
        'store_analysis': store_analysis,
        'problem_stores_count': len(problem_stores),
        'critical_stores_count': len(critical_stores),
        'beyond_orders': beyond_orders,
    }), 200


@app.route('/api/stores/<job_id>', methods=['GET'])
def get_stores(job_id):
    """Get per-store statistics."""
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete', 'status': job.status}), 400

        stores = list(job.stores_cache.values()) if job.stores_cache else []

    return jsonify(stores), 200


@app.route('/api/chart/daily/<job_id>', methods=['GET'])
def get_daily_chart(job_id):
    """Get daily aggregated data."""
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        # Try to extract date if available in original data
        results = job.results
        mapping = job.mapping

    # Group by date if order_date column exists
    daily_data = defaultdict(lambda: {'count': 0, 'distances': []})

    # Try to find a date column
    date_col = None
    for key in ['date', 'Date', 'DATE', 'order_date', 'Order_Date', 'delivery_date']:
        if key in mapping:
            date_col = mapping[key]
            break

    for result in results:
        # Try to extract date from result
        date_key = None
        if date_col and result.get(date_col):
            date_key = str(result[date_col])[:10]  # Get YYYY-MM-DD portion
        if not date_key:
            # Try common date field names directly
            for dk in ['Date', 'date', 'DATE', 'order_date', 'Order_Date']:
                if result.get(dk):
                    date_key = str(result[dk])[:10]
                    break
        if not date_key:
            date_key = "unknown"

        daily_data[date_key]['count'] += 1
        if result.get('distance_km') is not None:
            daily_data[date_key]['distances'].append(result['distance_km'])

    # Sort by date
    sorted_dates = sorted(daily_data.keys())
    labels = sorted_dates
    orders = [daily_data[d]['count'] for d in sorted_dates]
    avg_distances = [
        np.mean(daily_data[d]['distances']) if daily_data[d]['distances'] else 0
        for d in sorted_dates
    ]

    return jsonify({
        'labels': labels,
        'orders': orders,
        'avg_distances': avg_distances,
    }), 200


@app.route('/api/chart/store_avg/<job_id>', methods=['GET'])
def get_store_avg_chart(job_id):
    """Get top stores by average distance."""
    limit = int(request.args.get('limit', 30))

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        stores = job.stores_cache or {}

    # Sort by avg_dist
    sorted_stores = sorted(
        stores.values(),
        key=lambda x: x.get('avg_dist', 0),
        reverse=True
    )[:limit]

    labels = [str(s['id']) for s in sorted_stores]
    values = [s.get('avg_dist', 0) for s in sorted_stores]

    return jsonify({
        'labels': labels,
        'values': values,
    }), 200


@app.route('/api/chart/store_orders/<job_id>', methods=['GET'])
def get_store_orders_chart(job_id):
    """Get top stores by order count."""
    limit = int(request.args.get('limit', 30))

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        stores = job.stores_cache or {}

    # Sort by order count
    sorted_stores = sorted(
        stores.values(),
        key=lambda x: x.get('orders', 0),
        reverse=True
    )[:limit]

    labels = [str(s['id']) for s in sorted_stores]
    values = [s.get('orders', 0) for s in sorted_stores]

    return jsonify({
        'labels': labels,
        'values': values,
    }), 200


@app.route('/api/map/<job_id>', methods=['GET'])
def get_map_data(job_id):
    """Get sampled map data."""
    sample_size = int(request.args.get('sample', 5000))
    store_filter = request.args.get('store', None)

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        results = job.results
        stores = job.stores_cache or {}

    # Filter by store if provided
    if store_filter:
        results = [r for r in results if str(r.get('store_id')) == store_filter]

    # Sample results
    if len(results) > sample_size:
        results = np.random.choice(results, sample_size, replace=False).tolist()

    # Format map data
    map_stores = [
        {
            'id': str(s['id']),
            'store_id': str(s['id']),
            'lat': s.get('lat'),
            'lon': s.get('lon'),
            'orders': s.get('orders', 0),
            'order_count': s.get('orders', 0),
            'avg': s.get('avg_dist', 0),
            'avg_distance': s.get('avg_dist', 0),
        }
        for s in stores.values()
        if s.get('lat') is not None and s.get('lon') is not None
    ]

    total_orders = len(job.results)
    mapping = job.mapping

    def safe_float(val, default=0):
        """Convert to float, handling NaN and None."""
        try:
            v = float(val)
            return default if (v != v) else v  # NaN check: NaN != NaN
        except (TypeError, ValueError):
            return default

    map_orders = []
    for r in results:
        try:
            dist_val = safe_float(r.get('distance_km'), 0)
            map_orders.append({
                'slat': safe_float(r.get(mapping.get('store_lat', ''))),
                'slon': safe_float(r.get(mapping.get('store_lon', ''))),
                'order_lat': safe_float(r.get(mapping.get('order_lat', ''))),
                'order_lon': safe_float(r.get(mapping.get('order_lon', ''))),
                'olat': safe_float(r.get(mapping.get('order_lat', ''))),
                'olon': safe_float(r.get(mapping.get('order_lon', ''))),
                'road_distance': round(dist_val, 2),
                'dist': round(dist_val, 2),
                'store_id': str(r.get('store_id', r.get(mapping.get('store_id', ''), ''))),
                'store': str(r.get('store_id', r.get(mapping.get('store_id', ''), ''))),
                'order_id': str(r.get('order_id', r.get(mapping.get('order_id', ''), ''))),
            })
        except (ValueError, TypeError):
            continue

    return jsonify({
        'stores': map_stores,
        'orders': map_orders,
        'total_orders': total_orders,
    }), 200


@app.route('/api/table/<job_id>', methods=['GET'])
def get_table_data(job_id):
    """Get paginated and filtered table data."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 100))
    store_filter = request.args.get('store', None)
    min_dist = request.args.get('min_dist', None)
    max_dist = request.args.get('max_dist', None)
    search = request.args.get('search', None)
    sort = request.args.get('sort', 'distance')
    order = request.args.get('order', 'desc')

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        results = job.results.copy()

    # Apply filters
    if store_filter:
        results = [r for r in results if str(r.get('store_id')) == store_filter]

    if min_dist is not None:
        try:
            min_dist = float(min_dist)
            results = [r for r in results if r.get('distance_km', float('inf')) >= min_dist]
        except ValueError:
            pass

    if max_dist is not None:
        try:
            max_dist = float(max_dist)
            results = [r for r in results if r.get('distance_km', 0) <= max_dist]
        except ValueError:
            pass

    if search:
        search_str = str(search).lower()
        results = [
            r for r in results
            if search_str in str(r.get('order_id', '')).lower() or
               search_str in str(r.get('store_id', '')).lower()
        ]

    # Sort
    reverse = order.lower() == 'desc'
    if sort == 'distance':
        results = sorted(results, key=lambda x: x.get('distance_km', 0), reverse=reverse)
    elif sort == 'store':
        results = sorted(results, key=lambda x: x.get('store_id', ''), reverse=reverse)

    # Paginate
    total = len(results)
    pages = (total + per_page - 1) // per_page
    start = (page - 1) * per_page
    end = start + per_page
    page_data = results[start:end]

    # Clean data for JSON serialization
    cleaned_data = []
    mapping = job.mapping
    for r in page_data:
        slat = r.get(mapping.get('store_lat', ''), '')
        slon = r.get(mapping.get('store_lon', ''), '')
        olat = r.get(mapping.get('order_lat', ''), '')
        olon = r.get(mapping.get('order_lon', ''), '')
        dist = r.get('distance_km')

        cleaned_row = {
            'order_id': str(r.get('order_id', r.get(mapping.get('order_id', ''), ''))),
            'store_id': str(r.get('store_id', r.get(mapping.get('store_id', ''), ''))),
            'store_lat': slat,
            'store_lon': slon,
            'order_lat': olat,
            'order_lon': olon,
            'distance_km': round(dist, 3) if dist else None,
            'road_distance': round(dist, 3) if dist else None,
        }
        cleaned_data.append(cleaned_row)

    # Get unique store list for filter dropdown
    all_stores = sorted(set(str(r.get('store_id', '')) for r in job.results if r.get('store_id')))

    return jsonify({
        'data': cleaned_data,
        'rows': cleaned_data,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': pages,
        'stores': all_stores,
    }), 200


@app.route('/api/download/<job_id>', methods=['GET'])
def download_data(job_id):
    """Stream CSV download."""
    file_format = request.args.get('format', 'csv')
    store_filter = request.args.get('store', None)

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({'error': 'Job not complete'}), 400

        results = job.results.copy()

    # Filter by store if provided
    if store_filter:
        results = [r for r in results if str(r.get('store_id')) == store_filter]

    if file_format == 'csv':
        # Generate CSV
        output = StringIO()
        if results:
            writer = csv.DictWriter(output, fieldnames=results[0].keys())
            writer.writeheader()
            for row in results:
                try:
                    writer.writerow({k: v for k, v in row.items() if not isinstance(v, (dict, list))})
                except (TypeError, ValueError):
                    pass

        output.seek(0)
        binary_output = BytesIO(output.getvalue().encode('utf-8'))
        return send_file(
            binary_output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'hyperlocal_{job_id}.csv'
        )

    return jsonify({'error': 'Unsupported format'}), 400


@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List all jobs."""
    with JOBS_LOCK:
        jobs = [job.to_dict() for job in JOBS.values()]

    return jsonify(jobs), 200


@app.route('/api/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job."""
    with JOBS_LOCK:
        if job_id in JOBS:
            del JOBS[job_id]
            logger.info(f"Job {job_id} deleted")
            return jsonify({'status': 'deleted'}), 200

    return jsonify({'error': 'Job not found'}), 404


@app.route('/api/upload-precalculated/<job_id>', methods=['POST'])
def upload_precalculated(job_id):
    """Handle pre-calculated data upload."""
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify({'error': 'Job not found'}), 404

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        filename = file.filename

        # Read file
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'error': 'File must be CSV or XLSX'}), 400

        # Check for Road_Distance_km column
        if 'Road_Distance_km' not in df.columns:
            return jsonify({'error': 'File must contain Road_Distance_km column'}), 400

        # Convert to results format
        results = []
        for idx, row in df.iterrows():
            result = {
                'order_id': row.get('Order_ID', idx),
                'store_id': row.get('Store_ID', ''),
                'distance_km': row.get('Road_Distance_km', 0),
            }
            results.append(result)

        with job.lock:
            job.results = results
            job.processed = len(results)
            job.status = "complete"
            job.stats_cache = calculate_stats(results)
            job.stores_cache = calculate_store_stats(results, job.df, job.mapping)

        logger.info(f"Job {job_id} loaded pre-calculated data: {len(results)} rows")

        return jsonify({
            'status': 'loaded',
            'rows': len(results),
        }), 200

    except Exception as e:
        logger.error(f"Pre-calculated upload error: {e}")
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    logger.error(f"Server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# STARTUP
# ============================================================================

def print_startup_banner():
    """Print startup information."""
    import socket

    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = "127.0.0.1"

    banner = f"""
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║   FLIPKART HYPERLOCAL DISTANCE ANALYSIS SERVER                  ║
    ║                                                                  ║
    ║   Status: RUNNING                                               ║
    ║   Port: 8080                                                    ║
    ║                                                                  ║
    ║   Local Access:                                                 ║
    ║   • http://localhost:8080                                       ║
    ║   • http://127.0.0.1:8080                                       ║
    ║                                                                  ║
    ║   Network Access:                                               ║
    ║   • http://{local_ip}:8080                                      ║
    ║                                                                  ║
    ║   API Documentation:                                            ║
    ║   • POST   /api/upload              - Upload CSV/XLSX           ║
    ║   • POST   /api/calculate/<job_id>  - Start calculation         ║
    ║   • GET    /api/progress/<job_id>   - Get progress              ║
    ║   • GET    /api/stats/<job_id>      - Get statistics            ║
    ║   • GET    /api/jobs                - List all jobs             ║
    ║   • DELETE /api/jobs/<job_id>       - Delete job                ║
    ║                                                                  ║
    ║   Configuration:                                                ║
    ║   • Max file size: 500 MB                                       ║
    ║   • OSRM workers: 12                                            ║
    ║   • OSRM batch size: 100                                        ║
    ║   • Default OSRM URL: http://localhost:5000                     ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    """
    print(banner)


if __name__ == '__main__':
    print_startup_banner()

    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=8080,
        debug=False,
        threaded=True,
    )
