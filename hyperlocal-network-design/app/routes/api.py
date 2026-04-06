"""
Core API routes.

Every endpoint that the frontend talks to lives here, registered
on the ``api_bp`` Blueprint.  The old monolithic server.py is now
split: route-level code here, business logic in app/services/*.
"""

import csv
import logging
import os
import threading
import uuid
from collections import defaultdict
from datetime import datetime
from io import BytesIO, StringIO
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from flask import Blueprint, current_app, jsonify, request, send_file

from app.services.osrm import background_distance_calculation, test_osrm_connection
from app.services.stats import calculate_stats, calculate_store_stats
from app.utils.columns import detect_distance_column, get_column_mapping
from app.utils.validation import allowed_file, safe_float, safe_int, validate_osrm_url

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)


# ════════════════════════════════════════════════════════════════════════
# In-memory job storage (kept for backward compat; DB-backed version
# is layered on top in models.py for persistence).
# ════════════════════════════════════════════════════════════════════════


class JobState:
    """Runtime state for a single distance-calculation job."""

    def __init__(self, job_id: str, filename: str, df: pd.DataFrame, mapping: Dict[str, str]):
        self.job_id = job_id
        self.filename = filename
        self.df = df
        self.mapping = mapping
        self.created_at = datetime.now()
        self.status = "idle"
        self.processed = 0
        self.total = len(df)
        self.failed = 0
        self.start_time = None
        self.error_message = None
        self.results: List[Dict] = []
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


JOBS: Dict[str, JobState] = {}
JOBS_LOCK = threading.Lock()


# ════════════════════════════════════════════════════════════════════════
# Frontend
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/", methods=["GET"])
def serve_frontend():
    search_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "static", "index.html"),
        os.path.join(os.path.dirname(__file__), "..", "..", "hyperlocal_app.html"),
    ]
    for path in search_paths:
        abspath = os.path.normpath(path)
        if os.path.exists(abspath):
            with open(abspath, "r") as fh:
                return fh.read()
    return "<h1>Frontend not found.</h1><p>Place <code>static/index.html</code> in the project root.</p>", 404


# ════════════════════════════════════════════════════════════════════════
# OSRM proxy
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/test-osrm", methods=["GET"])
def api_test_osrm():
    osrm_url = request.args.get("url", current_app.config["OSRM_DEFAULT_URL"]).rstrip("/")

    err = validate_osrm_url(osrm_url, current_app.config["OSRM_ALLOWED_HOSTS"])
    if err:
        return jsonify({"ok": False, "error": err}), 400

    result = test_osrm_connection(osrm_url)
    return jsonify(result), 200


# ════════════════════════════════════════════════════════════════════════
# Upload
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/upload", methods=["POST"])
def upload_file():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename or not allowed_file(file.filename):
            return jsonify({"error": "File must be CSV, XLSX, or XLS"}), 400

        filename = file.filename
        logger.info("Upload started: %s", filename)

        if filename.endswith(".csv"):
            df = pd.read_csv(file, low_memory=False)
        else:
            sheet = request.form.get("sheet", None)
            df = pd.read_excel(file, sheet_name=sheet)

        logger.info("Parsed %s: %d rows, %d cols", filename, len(df), len(df.columns))

        mapping = get_column_mapping(df)
        if not mapping:
            return jsonify({
                "error": "Could not auto-detect columns.",
                "columns": list(df.columns),
            }), 400

        dist_col = detect_distance_column(df)
        has_distance = dist_col is not None

        job_id = str(uuid.uuid4())
        job = JobState(job_id, filename, df, mapping)

        if has_distance:
            job.status = "running"
            job.start_time = datetime.now()
            logger.info("Job %s: pre-calculated distances in '%s'", job_id, dist_col)

        with JOBS_LOCK:
            JOBS[job_id] = job

        store_count = df[mapping["store_id"]].nunique() if mapping.get("store_id") else 0

        if has_distance:
            _process_precalculated_bg(job, df, dist_col, mapping)

        return jsonify({
            "job_id": job_id,
            "filename": filename,
            "rows": len(df),
            "row_count": len(df),
            "stores": store_count,
            "store_count": store_count,
            "columns": list(df.columns),
            "available_columns": list(df.columns),
            "detected_mapping": mapping,
            "has_distance_column": has_distance,
        }), 200

    except Exception as exc:
        logger.error("Upload error: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ════════════════════════════════════════════════════════════════════════
# Calculate
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/calculate/<job_id>", methods=["POST"])
def calculate_distances(job_id):
    try:
        with JOBS_LOCK:
            job = JOBS.get(job_id)
        if not job:
            return jsonify({"error": "Job not found"}), 404
        if job.status == "running":
            return jsonify({"status": "running"}), 200

        body = request.get_json(silent=True) or {}
        osrm_url = body.get("osrm_url", current_app.config["OSRM_DEFAULT_URL"]).rstrip("/")

        err = validate_osrm_url(osrm_url, current_app.config["OSRM_ALLOWED_HOSTS"])
        if err:
            return jsonify({"error": err}), 400

        if "mapping" in body:
            job.mapping = body["mapping"]

        max_workers = current_app.config["OSRM_MAX_WORKERS"]
        chunk_limit = current_app.config["OSRM_CHUNK_LIMIT"]

        thread = threading.Thread(
            target=background_distance_calculation,
            args=(job, osrm_url, max_workers, chunk_limit),
            daemon=True,
        )
        thread.start()
        logger.info("Started calculation for job %s", job_id)

        return jsonify({"status": "started"}), 202

    except Exception as exc:
        logger.error("Calculation start error: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ════════════════════════════════════════════════════════════════════════
# Progress / Stats / Stores
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/progress/<job_id>", methods=["GET"])
def get_progress(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    with job.lock:
        ok = max(0, job.processed - job.failed)
        progress: Dict[str, Any] = {
            "status": job.status,
            "processed": job.processed,
            "total": job.total,
            "failed": job.failed,
            "failed_count": job.failed,
            "ok_count": ok,
        }
        if job.error_message:
            progress["error"] = job.error_message
        if job.start_time and job.status == "running" and job.processed > 0:
            elapsed = (datetime.now() - job.start_time).total_seconds()
            rate = job.processed / elapsed
            remaining = job.total - job.processed
            eta = remaining / rate if rate > 0 else None
            progress["rate"] = rate
            progress["eta"] = f"{int(eta // 60)}m {int(eta % 60)}s" if eta else "--"
        elif job.status == "running":
            progress["rate"] = 0
            progress["eta"] = "--"

    return jsonify(progress), 200


@api_bp.route("/api/stats/<job_id>", methods=["GET"])
def get_stats(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete", "status": job.status}), 400
        stats = dict(job.stats_cache or {})
        store_count = len(job.stores_cache) if job.stores_cache else 0
        stats["store_count"] = store_count
        stats["total_stores"] = store_count
        stats["total"] = job.total
        stats["total_orders"] = job.total
        stats["failed"] = job.failed
        stats["failed_count"] = job.failed
        stats["successful"] = job.total - job.failed
        stats["successful_count"] = job.total - job.failed

    return jsonify(stats), 200


@api_bp.route("/api/stores/<job_id>", methods=["GET"])
def get_stores(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete", "status": job.status}), 400
        stores = list(job.stores_cache.values()) if job.stores_cache else []
    return jsonify(stores), 200


# ════════════════════════════════════════════════════════════════════════
# Network Analysis
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/network-analysis/<job_id>", methods=["GET"])
def get_network_analysis(job_id):
    threshold = safe_float(request.args.get("threshold", 3.0), 3.0)

    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        results = job.results
        stores = job.stores_cache or {}

    all_dists = [
        r["distance_km"] for r in results
        if r.get("distance_km") is not None and r["distance_km"] == r["distance_km"]
    ]
    total = len(all_dists)
    within = sum(1 for d in all_dists if d <= threshold)
    beyond = total - within

    store_analysis = _build_store_analysis(results, stores, threshold)
    store_analysis.sort(key=lambda x: x["breach_pct"], reverse=True)

    problem_stores = [s for s in store_analysis if s["breach_pct"] > 0]
    critical_stores = [s for s in store_analysis if s["breach_pct"] > 20]

    bands = {
        f"0-{threshold}km": within,
        f"{threshold}-{threshold * 2}km": sum(1 for d in all_dists if threshold < d <= threshold * 2),
        f"{threshold * 2}km+": sum(1 for d in all_dists if d > threshold * 2),
    }

    coverage_pct = round((within / total) * 100, 1) if total > 0 else 0
    health_score = min(100, round(coverage_pct))

    beyond_orders = _sample_beyond_orders(results, threshold, job.mapping, limit=10000)

    return jsonify({
        "threshold": threshold,
        "total_orders": total,
        "within_threshold": within,
        "beyond_threshold": beyond,
        "coverage_pct": coverage_pct,
        "health_score": health_score,
        "bands": bands,
        "store_analysis": store_analysis,
        "problem_stores_count": len(problem_stores),
        "critical_stores_count": len(critical_stores),
        "beyond_orders": beyond_orders,
    }), 200


# ════════════════════════════════════════════════════════════════════════
# Charts
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/chart/daily/<job_id>", methods=["GET"])
def get_daily_chart(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        results = job.results
        mapping = job.mapping

    daily: Dict[str, Dict] = defaultdict(lambda: {"count": 0, "distances": []})
    date_col = mapping.get("date")

    for r in results:
        dk = None
        if date_col and r.get(date_col):
            dk = str(r[date_col])[:10]
        if not dk:
            for k in ("Date", "date", "DATE", "order_date", "Order_Date"):
                if r.get(k):
                    dk = str(r[k])[:10]
                    break
        dk = dk or "unknown"
        daily[dk]["count"] += 1
        if r.get("distance_km") is not None:
            daily[dk]["distances"].append(r["distance_km"])

    sorted_dates = sorted(daily)
    return jsonify({
        "labels": sorted_dates,
        "orders": [daily[d]["count"] for d in sorted_dates],
        "avg_distances": [
            float(np.mean(daily[d]["distances"])) if daily[d]["distances"] else 0
            for d in sorted_dates
        ],
    }), 200


@api_bp.route("/api/chart/store_avg/<job_id>", methods=["GET"])
def get_store_avg_chart(job_id):
    limit = safe_int(request.args.get("limit", 30), 30, minimum=1, maximum=200)
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        stores = job.stores_cache or {}

    top = sorted(stores.values(), key=lambda s: s.get("avg_dist", 0), reverse=True)[:limit]
    return jsonify({
        "labels": [str(s["id"]) for s in top],
        "values": [s.get("avg_dist", 0) for s in top],
    }), 200


@api_bp.route("/api/chart/store_orders/<job_id>", methods=["GET"])
def get_store_orders_chart(job_id):
    limit = safe_int(request.args.get("limit", 30), 30, minimum=1, maximum=200)
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        stores = job.stores_cache or {}

    top = sorted(stores.values(), key=lambda s: s.get("orders", 0), reverse=True)[:limit]
    return jsonify({
        "labels": [str(s["id"]) for s in top],
        "values": [s.get("orders", 0) for s in top],
    }), 200


# ════════════════════════════════════════════════════════════════════════
# Map / Table / Download
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/map/<job_id>", methods=["GET"])
def get_map_data(job_id):
    sample_size = safe_int(request.args.get("sample", 0), 0, minimum=0, maximum=500000)
    store_filter = request.args.get("store")

    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        results = job.results
        stores = job.stores_cache or {}

    if store_filter:
        results = [r for r in results if str(r.get("store_id")) == store_filter]

    if sample_size > 0 and len(results) > sample_size:
        results = np.random.choice(results, sample_size, replace=False).tolist()

    mapping = job.mapping
    map_stores = [
        {
            "id": str(s["id"]), "store_id": str(s["id"]),
            "lat": s.get("lat"), "lon": s.get("lon"),
            "orders": s.get("orders", 0), "order_count": s.get("orders", 0),
            "avg": s.get("avg_dist", 0), "avg_distance": s.get("avg_dist", 0),
        }
        for s in stores.values()
        if s.get("lat") is not None and s.get("lon") is not None
    ]

    map_orders = []
    for r in results:
        try:
            d = safe_float(r.get("distance_km"), 0)
            map_orders.append({
                "slat": safe_float(r.get(mapping.get("store_lat", ""))),
                "slon": safe_float(r.get(mapping.get("store_lon", ""))),
                "order_lat": safe_float(r.get(mapping.get("order_lat", ""))),
                "order_lon": safe_float(r.get(mapping.get("order_lon", ""))),
                "olat": safe_float(r.get(mapping.get("order_lat", ""))),
                "olon": safe_float(r.get(mapping.get("order_lon", ""))),
                "road_distance": round(d, 2), "dist": round(d, 2),
                "store_id": str(r.get("store_id", r.get(mapping.get("store_id", ""), ""))),
                "store": str(r.get("store_id", r.get(mapping.get("store_id", ""), ""))),
                "order_id": str(r.get("order_id", r.get(mapping.get("order_id", ""), ""))),
            })
        except (ValueError, TypeError):
            continue

    return jsonify({"stores": map_stores, "orders": map_orders, "total_orders": len(job.results)}), 200


@api_bp.route("/api/table/<job_id>", methods=["GET"])
def get_table_data(job_id):
    page = safe_int(request.args.get("page", 1), 1, minimum=1)
    per_page = safe_int(request.args.get("per_page", 100), 100, minimum=1, maximum=1000)
    store_filter = request.args.get("store")
    min_dist = request.args.get("min_dist")
    max_dist = request.args.get("max_dist")
    search = request.args.get("search")
    sort_field = request.args.get("sort", "distance")
    order = request.args.get("order", "desc")

    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        results = list(job.results)

    if store_filter:
        results = [r for r in results if str(r.get("store_id")) == store_filter]
    if min_dist is not None:
        mn = safe_float(min_dist)
        results = [r for r in results if r.get("distance_km", float("inf")) >= mn]
    if max_dist is not None:
        mx = safe_float(max_dist)
        results = [r for r in results if r.get("distance_km", 0) <= mx]
    if search:
        s = search.lower()
        results = [
            r for r in results
            if s in str(r.get("order_id", "")).lower() or s in str(r.get("store_id", "")).lower()
        ]

    rev = order.lower() == "desc"
    sort_keys = {
        "distance": lambda x: x.get("distance_km", 0) or 0,
        "road_distance": lambda x: x.get("distance_km", 0) or 0,
        "store": lambda x: str(x.get("store_id", "")),
        "store_id": lambda x: str(x.get("store_id", "")),
        "order_id": lambda x: str(x.get("order_id", "")),
        "store_lat": lambda x: float(x.get(mapping.get("store_lat", ""), 0) or 0),
        "store_lon": lambda x: float(x.get(mapping.get("store_lon", ""), 0) or 0),
        "order_lat": lambda x: float(x.get(mapping.get("order_lat", ""), 0) or 0),
        "order_lon": lambda x: float(x.get(mapping.get("order_lon", ""), 0) or 0),
    }
    key_fn = sort_keys.get(sort_field)
    if key_fn:
        results.sort(key=key_fn, reverse=rev)

    total = len(results)
    pages = (total + per_page - 1) // per_page
    start = (page - 1) * per_page
    page_data = results[start : start + per_page]

    mapping = job.mapping
    cleaned = []
    for r in page_data:
        d = r.get("distance_km")
        cleaned.append({
            "order_id": str(r.get("order_id", r.get(mapping.get("order_id", ""), ""))),
            "store_id": str(r.get("store_id", r.get(mapping.get("store_id", ""), ""))),
            "store_lat": r.get(mapping.get("store_lat", ""), ""),
            "store_lon": r.get(mapping.get("store_lon", ""), ""),
            "order_lat": r.get(mapping.get("order_lat", ""), ""),
            "order_lon": r.get(mapping.get("order_lon", ""), ""),
            "distance_km": round(d, 3) if d else None,
            "road_distance": round(d, 3) if d else None,
        })

    all_stores = sorted({str(r.get("store_id", "")) for r in job.results if r.get("store_id")})

    return jsonify({
        "data": cleaned, "rows": cleaned,
        "total": total, "page": page, "per_page": per_page, "pages": pages,
        "stores": all_stores,
    }), 200


@api_bp.route("/api/download/<job_id>", methods=["GET"])
def download_data(job_id):
    store_filter = request.args.get("store")

    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    with job.lock:
        if job.status != "complete":
            return jsonify({"error": "Job not complete"}), 400
        results = list(job.results)

    if store_filter:
        results = [r for r in results if str(r.get("store_id")) == store_filter]

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
    binary = BytesIO(output.getvalue().encode("utf-8"))
    return send_file(binary, mimetype="text/csv", as_attachment=True, download_name=f"hyperlocal_{job_id}.csv")


# ════════════════════════════════════════════════════════════════════════
# Job management
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/jobs", methods=["GET"])
def list_jobs():
    with JOBS_LOCK:
        return jsonify([j.to_dict() for j in JOBS.values()]), 200


@api_bp.route("/api/jobs/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    with JOBS_LOCK:
        if job_id in JOBS:
            del JOBS[job_id]
            logger.info("Job %s deleted", job_id)
            return jsonify({"status": "deleted"}), 200
    return jsonify({"error": "Job not found"}), 404


@api_bp.route("/api/upload-precalculated/<job_id>", methods=["POST"])
def upload_precalculated(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        file = request.files["file"]
        filename = file.filename or ""
        if not allowed_file(filename):
            return jsonify({"error": "File must be CSV or XLSX"}), 400

        df = pd.read_csv(file) if filename.endswith(".csv") else pd.read_excel(file)
        if "Road_Distance_km" not in df.columns:
            return jsonify({"error": "File must contain Road_Distance_km column"}), 400

        results = [
            {"order_id": row.get("Order_ID", idx), "store_id": row.get("Store_ID", ""), "distance_km": row.get("Road_Distance_km", 0)}
            for idx, row in df.iterrows()
        ]

        with job.lock:
            job.results = results
            job.processed = len(results)
            job.status = "complete"
            job.stats_cache = calculate_stats(results)
            job.stores_cache = calculate_store_stats(results, job.df, job.mapping)

        return jsonify({"status": "loaded", "rows": len(results)}), 200

    except Exception as exc:
        logger.error("Pre-calculated upload error: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ════════════════════════════════════════════════════════════════════════
# Private helpers
# ════════════════════════════════════════════════════════════════════════


def _process_precalculated_bg(job: JobState, df: pd.DataFrame, dist_col: str, mapping: dict):
    """Process pre-calculated distance data in a background thread."""

    def _work():
        try:
            store_col = mapping.get("store_id", "")
            order_col = mapping.get("order_id", "")
            dist_values = pd.to_numeric(df[dist_col], errors="coerce")
            failed_count = int((~dist_values.notna()).sum())

            chunk_size = 200_000
            all_results: List[dict] = []

            for start in range(0, len(df), chunk_size):
                end = min(start + chunk_size, len(df))
                chunk = df.iloc[start:end].to_dict("records")
                dists = dist_values.iloc[start:end].tolist()

                for i, r in enumerate(chunk):
                    d = dists[i]
                    r["distance_km"] = float(d) if pd.notna(d) else None
                    if store_col and store_col in r:
                        r["store_id"] = str(r[store_col])
                    if order_col and order_col in r:
                        r["order_id"] = str(r[order_col])

                all_results.extend(chunk)
                with job.lock:
                    job.processed = end
                logger.info("Job %s: processed %d/%d rows", job.job_id, end, len(df))

            with job.lock:
                job.results = all_results
                job.total = len(all_results)
                job.processed = len(all_results)
                job.failed = failed_count
                job.stats_cache = calculate_stats(all_results)
                job.stores_cache = calculate_store_stats(all_results, df, mapping)
                job.status = "complete"
            logger.info("Job %s: pre-calculated done (%d rows)", job.job_id, len(all_results))

        except Exception as exc:
            logger.error("Job %s pre-calculated error: %s", job.job_id, exc)
            with job.lock:
                job.status = "error"
                job.error_message = str(exc)

    threading.Thread(target=_work, daemon=True).start()


def _build_store_analysis(results, stores, threshold):
    analysis = []
    for sid, s in stores.items():
        dists = [
            r["distance_km"] for r in results
            if str(r.get("store_id", "")) == sid
            and r.get("distance_km") is not None
            and r["distance_km"] == r["distance_km"]
        ]
        if not dists:
            continue
        w = sum(1 for d in dists if d <= threshold)
        b = len(dists) - w
        analysis.append({
            "store_id": sid,
            "total_orders": len(dists),
            "within_threshold": w,
            "beyond_threshold": b,
            "breach_pct": round((b / len(dists)) * 100, 1),
            "avg_distance": round(float(np.mean(dists)), 2),
            "max_distance": round(float(max(dists)), 2),
            "p90_distance": round(float(np.percentile(dists, 90)), 2) if len(dists) >= 2 else round(float(max(dists)), 2),
            "lat": s.get("lat"),
            "lon": s.get("lon"),
        })
    return analysis


def _sample_beyond_orders(results, threshold, mapping, limit=10000):
    beyond = []
    for r in results:
        d = r.get("distance_km")
        if d is not None and d > threshold:
            olat = r.get(mapping.get("order_lat", ""))
            olon = r.get(mapping.get("order_lon", ""))
            try:
                beyond.append({
                    "lat": float(olat), "lon": float(olon),
                    "distance": round(d, 2),
                    "store_id": str(r.get("store_id", "")),
                })
                if len(beyond) >= limit:
                    break
            except (TypeError, ValueError):
                continue
    return beyond
