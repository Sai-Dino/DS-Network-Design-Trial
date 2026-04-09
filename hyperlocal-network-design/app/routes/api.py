"""
Core API routes.

All state is persisted via ``app.services.storage`` (DB + Parquet files).
No in-memory job dictionary — every Gunicorn worker and Celery task
shares the same data through the database and filesystem.
"""

import logging
import os
import threading
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from flask import Blueprint, current_app, jsonify, request, send_file, session

from app.services import storage
from app.services.osrm import test_osrm_connection
from app.services.stats import calculate_stats, calculate_store_stats
from app.utils.columns import detect_distance_column, get_column_mapping
from app.utils.validation import allowed_file, safe_float, safe_int, validate_osrm_url

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)


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
        job = storage.create_job(job_id, filename, df, mapping, has_distance, user_id=session.get("user_id"))

        if has_distance:
            storage.update_progress(job_id, 0, 0, status="running")
            _process_precalculated_bg(job_id, df, dist_col, mapping)

        return jsonify({
            "job_id": job_id,
            "filename": filename,
            "rows": len(df),
            "row_count": len(df),
            "stores": job.store_count,
            "store_count": job.store_count,
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
def calculate_distances_route(job_id):
    try:
        job = storage.get_job(job_id)
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
            import json
            job.mapping_json = json.dumps(body["mapping"])
            from app.extensions import db
            db.session.commit()

        max_workers = current_app.config["OSRM_MAX_WORKERS"]
        chunk_limit = current_app.config["OSRM_CHUNK_LIMIT"]

        if _celery_available():
            from app.tasks.distance_tasks import calculate_distances_task
            calculate_distances_task.delay(job_id, osrm_url, max_workers, chunk_limit)
            logger.info("Job %s dispatched to Celery", job_id)
        else:
            _run_osrm_in_thread(job_id, osrm_url, max_workers, chunk_limit)

        return jsonify({"status": "started"}), 202

    except Exception as exc:
        logger.error("Calculation start error: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ════════════════════════════════════════════════════════════════════════
# Progress / Stats / Stores
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/progress/<job_id>", methods=["GET"])
def get_progress(job_id):
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    ok = max(0, job.processed_rows - job.failed_rows)
    progress: Dict[str, Any] = {
        "status": job.status,
        "processed": job.processed_rows,
        "total": job.total_rows,
        "failed": job.failed_rows,
        "failed_count": job.failed_rows,
        "ok_count": ok,
    }
    if job.error_message:
        progress["error"] = job.error_message
    if job.started_at and job.status == "running" and job.processed_rows > 0:
        now = datetime.now(timezone.utc)
        started = job.started_at.replace(tzinfo=timezone.utc) if job.started_at.tzinfo is None else job.started_at
        elapsed = (now - started).total_seconds()
        rate = job.processed_rows / elapsed if elapsed > 0 else 0
        remaining = job.total_rows - job.processed_rows
        eta = remaining / rate if rate > 0 else None
        progress["rate"] = rate
        progress["eta"] = f"{int(eta // 60)}m {int(eta % 60)}s" if eta else "--"
    elif job.status == "running":
        progress["rate"] = 0
        progress["eta"] = "--"

    return jsonify(progress), 200


@api_bp.route("/api/stats/<job_id>", methods=["GET"])
def get_stats(job_id):
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete", "status": job.status}), 400

    stats = storage.get_stats(job_id)
    stats["store_count"] = job.store_count
    stats["total_stores"] = job.store_count
    stats["total"] = job.total_rows
    stats["total_orders"] = job.total_rows
    stats["failed"] = job.failed_rows
    stats["failed_count"] = job.failed_rows
    stats["successful"] = job.total_rows - job.failed_rows
    stats["successful_count"] = job.total_rows - job.failed_rows
    return jsonify(stats), 200


@api_bp.route("/api/stores/<job_id>", methods=["GET"])
def get_stores(job_id):
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete", "status": job.status}), 400
    stores_dict = storage.get_stores(job_id)
    return jsonify(list(stores_dict.values())), 200


# ════════════════════════════════════════════════════════════════════════
# Network Analysis
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/network-analysis/<job_id>", methods=["GET"])
def get_network_analysis(job_id):
    threshold = safe_float(request.args.get("threshold", 3.0), 3.0)

    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400

    df = storage.load_results_df(job_id)
    if df is None or df.empty:
        return jsonify({"error": "No results data"}), 404

    stores = storage.get_stores(job_id)
    mapping = storage.get_mapping(job_id)

    dists = df["distance_km"].dropna()
    total = len(dists)
    within = int((dists <= threshold).sum())
    beyond = total - within

    band_mid = int(((dists > threshold) & (dists <= threshold * 2)).sum())
    bands = {
        f"0-{threshold}km": within,
        f"{threshold}-{threshold * 2}km": band_mid,
        f"{threshold * 2}km+": total - within - band_mid,
    }

    coverage_pct = round((within / total) * 100, 1) if total > 0 else 0
    health_score = min(100, round(coverage_pct))

    store_analysis = _build_store_analysis_df(df, stores, threshold)
    problem_stores_count = sum(1 for s in store_analysis if s["breach_pct"] > 0)
    critical_stores_count = sum(1 for s in store_analysis if s["breach_pct"] > 20)

    beyond_orders = _sample_beyond_orders_df(df, threshold, mapping, limit=10000)

    return jsonify({
        "threshold": threshold,
        "total_orders": total,
        "within_threshold": within,
        "beyond_threshold": beyond,
        "coverage_pct": coverage_pct,
        "health_score": health_score,
        "bands": bands,
        "store_analysis": store_analysis,
        "problem_stores_count": problem_stores_count,
        "critical_stores_count": critical_stores_count,
        "beyond_orders": beyond_orders,
    }), 200


# ════════════════════════════════════════════════════════════════════════
# Charts
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/chart/daily/<job_id>", methods=["GET"])
def get_daily_chart(job_id):
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400

    df = storage.load_results_df(job_id)
    if df is None or df.empty:
        return jsonify({"labels": [], "orders": [], "avg_distances": []}), 200

    mapping = storage.get_mapping(job_id)

    date_col = mapping.get("date")
    if not date_col or date_col not in df.columns:
        for k in ("Date", "date", "DATE", "order_date", "Order_Date"):
            if k in df.columns:
                date_col = k
                break

    if date_col and date_col in df.columns:
        df = df.copy()
        df["_date_key"] = df[date_col].astype(str).str[:10]
    else:
        return jsonify({"labels": ["all"], "orders": [len(df)],
                        "avg_distances": [round(float(df["distance_km"].mean()), 2) if "distance_km" in df.columns else 0]}), 200

    grp = df.groupby("_date_key", sort=True)
    labels = list(grp.groups.keys())
    orders = grp.size().tolist()
    avg_distances = grp["distance_km"].mean().fillna(0).round(2).tolist()

    return jsonify({
        "labels": labels,
        "orders": orders,
        "avg_distances": avg_distances,
    }), 200


@api_bp.route("/api/chart/store_avg/<job_id>", methods=["GET"])
def get_store_avg_chart(job_id):
    limit = safe_int(request.args.get("limit", 30), 30, minimum=1, maximum=200)
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400
    stores = storage.get_stores(job_id)

    top = sorted(stores.values(), key=lambda s: s.get("avg_dist", 0), reverse=True)[:limit]
    return jsonify({
        "labels": [str(s["id"]) for s in top],
        "values": [s.get("avg_dist", 0) for s in top],
    }), 200


@api_bp.route("/api/chart/store_orders/<job_id>", methods=["GET"])
def get_store_orders_chart(job_id):
    limit = safe_int(request.args.get("limit", 30), 30, minimum=1, maximum=200)
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400
    stores = storage.get_stores(job_id)

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
    threshold = safe_float(request.args.get("threshold", 3.0), 3.0)
    aggregate_limit = 200_000

    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400

    df = storage.load_results_df(job_id)
    if df is None or df.empty:
        return jsonify({"stores": [], "orders": [], "total_orders": 0}), 200

    stores = storage.get_stores(job_id)
    mapping = storage.get_mapping(job_id)

    if store_filter:
        df = df[df["store_id"].astype(str) == store_filter]

    if sample_size > 0 and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)

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

    slat_col = mapping.get("store_lat", "")
    slon_col = mapping.get("store_lon", "")
    olat_col = mapping.get("order_lat", "")
    olon_col = mapping.get("order_lon", "")

    out = pd.DataFrame()
    out["slat"] = pd.to_numeric(df.get(slat_col, pd.Series(dtype=float)), errors="coerce")
    out["slon"] = pd.to_numeric(df.get(slon_col, pd.Series(dtype=float)), errors="coerce")
    out["olat"] = pd.to_numeric(df.get(olat_col, pd.Series(dtype=float)), errors="coerce")
    out["olon"] = pd.to_numeric(df.get(olon_col, pd.Series(dtype=float)), errors="coerce")
    out["dist"] = df["distance_km"].fillna(0).round(2)
    out["store_id"] = df["store_id"].astype(str) if "store_id" in df.columns else ""
    out["order_id"] = df["order_id"].astype(str) if "order_id" in df.columns else ""
    out = out.dropna(subset=["olat", "olon"])

    total_in_view = int(len(out))
    within_total = int((out["dist"] <= threshold).sum())
    beyond_total = total_in_view - within_total

    if sample_size == 0 and total_in_view > aggregate_limit:
        precision = 2 if total_in_view > 1_000_000 else 3
        bucketed = out.copy()
        bucketed["lat_bucket"] = bucketed["olat"].round(precision)
        bucketed["lon_bucket"] = bucketed["olon"].round(precision)
        bucketed["within"] = (bucketed["dist"] <= threshold).astype(int)
        bucketed["beyond"] = (bucketed["dist"] > threshold).astype(int)

        grouped = bucketed.groupby(["lat_bucket", "lon_bucket"], sort=False).agg(
            total_count=("dist", "size"),
            within_count=("within", "sum"),
            beyond_count=("beyond", "sum"),
            avg_distance=("dist", "mean"),
            max_distance=("dist", "max"),
        ).reset_index()

        grouped["avg_distance"] = grouped["avg_distance"].round(2)
        grouped["max_distance"] = grouped["max_distance"].round(2)

        return jsonify({
            "stores": map_stores,
            "orders": [],
            "buckets": grouped.rename(columns={
                "lat_bucket": "lat",
                "lon_bucket": "lon",
            }).to_dict("records"),
            "render_mode": "aggregated",
            "total_orders": job.total_rows,
            "total_in_view": total_in_view,
            "within_total": within_total,
            "beyond_total": beyond_total,
            "bucket_precision": precision,
        }), 200

    if sample_size > 0 and total_in_view > sample_size:
        out = out.sample(n=sample_size, random_state=42)

    map_orders = out.rename(columns={
        "olat": "order_lat", "olon": "order_lon",
        "dist": "road_distance",
    }).to_dict("records")
    for o in map_orders:
        o["store"] = o["store_id"]
        o["dist"] = o["road_distance"]

    return jsonify({
        "stores": map_stores,
        "orders": map_orders,
        "buckets": [],
        "render_mode": "raw",
        "total_orders": job.total_rows,
        "total_in_view": total_in_view,
        "within_total": within_total,
        "beyond_total": beyond_total,
    }), 200


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

    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400

    df = storage.load_results_df(job_id)
    if df is None or df.empty:
        return jsonify({"data": [], "rows": [], "total": 0, "page": 1, "per_page": per_page, "pages": 0, "stores": []}), 200

    mapping = storage.get_mapping(job_id)

    if store_filter:
        df = df[df["store_id"].astype(str) == store_filter]
    if min_dist is not None:
        mn = safe_float(min_dist)
        df = df[df["distance_km"].fillna(float("inf")) >= mn]
    if max_dist is not None:
        mx = safe_float(max_dist)
        df = df[df["distance_km"].fillna(0) <= mx]
    if search:
        s = search.lower()
        mask = (
            df["order_id"].astype(str).str.lower().str.contains(s, na=False)
            | df["store_id"].astype(str).str.lower().str.contains(s, na=False)
        )
        df = df[mask]

    sort_col_map = {
        "distance": "distance_km", "road_distance": "distance_km",
        "store": "store_id", "store_id": "store_id", "order_id": "order_id",
        "store_lat": mapping.get("store_lat", ""), "store_lon": mapping.get("store_lon", ""),
        "order_lat": mapping.get("order_lat", ""), "order_lon": mapping.get("order_lon", ""),
    }
    col = sort_col_map.get(sort_field, "distance_km")
    if col and col in df.columns:
        ascending = order.lower() != "desc"
        df = df.sort_values(col, ascending=ascending, na_position="last")

    total = len(df)
    pages = (total + per_page - 1) // per_page
    start = (page - 1) * per_page
    page_df = df.iloc[start : start + per_page]

    slat_col = mapping.get("store_lat", "")
    slon_col = mapping.get("store_lon", "")
    olat_col = mapping.get("order_lat", "")
    olon_col = mapping.get("order_lon", "")

    cleaned = []
    for _, r in page_df.iterrows():
        d = r.get("distance_km")
        d_val = round(float(d), 3) if pd.notna(d) else None
        cleaned.append({
            "order_id": str(r.get("order_id", "")),
            "store_id": str(r.get("store_id", "")),
            "store_lat": r.get(slat_col, "") if slat_col else "",
            "store_lon": r.get(slon_col, "") if slon_col else "",
            "order_lat": r.get(olat_col, "") if olat_col else "",
            "order_lon": r.get(olon_col, "") if olon_col else "",
            "distance_km": d_val,
            "road_distance": d_val,
        })

    all_stores = storage.get_unique_store_ids(job_id)

    return jsonify({
        "data": cleaned, "rows": cleaned,
        "total": total, "page": page, "per_page": per_page, "pages": pages,
        "stores": all_stores,
    }), 200


@api_bp.route("/api/download/<job_id>", methods=["GET"])
def download_data(job_id):
    store_filter = request.args.get("store")

    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job.status != "complete":
        return jsonify({"error": "Job not complete"}), 400

    df = storage.load_results_df(job_id)
    if df is None or df.empty:
        return jsonify({"error": "No results data"}), 404

    if store_filter:
        df = df[df["store_id"].astype(str) == store_filter]

    output = BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return send_file(output, mimetype="text/csv", as_attachment=True, download_name=f"hyperlocal_{job_id}.csv")


# ════════════════════════════════════════════════════════════════════════
# Job management
# ════════════════════════════════════════════════════════════════════════


@api_bp.route("/api/jobs", methods=["GET"])
def list_jobs():
    jobs = storage.list_jobs(user_id=session.get("user_id"))
    return jsonify([j.to_dict() for j in jobs]), 200


@api_bp.route("/api/jobs/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    if storage.delete_job(job_id):
        return jsonify({"status": "deleted"}), 200
    return jsonify({"error": "Job not found"}), 404


@api_bp.route("/api/upload-precalculated/<job_id>", methods=["POST"])
def upload_precalculated(job_id):
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        file = request.files["file"]
        filename = file.filename or ""
        if not allowed_file(filename):
            return jsonify({"error": "File must be CSV or XLSX"}), 400

        df_upload = pd.read_csv(file) if filename.endswith(".csv") else pd.read_excel(file)
        if "Road_Distance_km" not in df_upload.columns:
            return jsonify({"error": "File must contain Road_Distance_km column"}), 400

        results = [
            {"order_id": row.get("Order_ID", idx), "store_id": row.get("Store_ID", ""), "distance_km": row.get("Road_Distance_km", 0)}
            for idx, row in df_upload.iterrows()
        ]

        orig_df = storage.load_upload(job_id) or df_upload
        mapping = storage.get_mapping(job_id)
        storage.complete_job(job_id, results, orig_df, mapping, 0)

        return jsonify({"status": "loaded", "rows": len(results)}), 200

    except Exception as exc:
        logger.error("Pre-calculated upload error: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ════════════════════════════════════════════════════════════════════════
# Private helpers
# ════════════════════════════════════════════════════════════════════════


def _celery_available() -> bool:
    """Check if Redis is reachable for Celery dispatch."""
    try:
        import redis
        url = current_app.config.get("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(url, socket_connect_timeout=1)
        r.ping()
        return True
    except Exception:
        return False


def _run_osrm_in_thread(job_id: str, osrm_url: str, max_workers: int, chunk_limit: int):
    """Fallback: run OSRM calculation in a daemon thread (local dev)."""
    from flask import current_app
    app = current_app._get_current_object()

    def _work():
        with app.app_context():
            try:
                from app.services.osrm import calculate_distances
                df = storage.load_upload(job_id)
                mapping = storage.get_mapping(job_id)
                if df is None:
                    storage.fail_job(job_id, "Upload data not found")
                    return

                storage.update_progress(job_id, 0, 0, status="running")

                def _on_progress(processed, failed):
                    storage.update_progress(job_id, processed, failed)

                def _on_checkpoint(partial_results, processed):
                    storage.save_checkpoint(job_id, partial_results, processed)

                results, failed = calculate_distances(
                    df, mapping, osrm_url,
                    on_progress=_on_progress,
                    on_checkpoint=_on_checkpoint,
                    max_workers=max_workers,
                    chunk_limit=chunk_limit,
                )
                storage.complete_job(job_id, results, df, mapping, failed)
                storage.clear_checkpoint(job_id)

            except Exception as exc:
                storage.fail_job(job_id, str(exc))

    if app.config.get("TESTING"):
        _work()
    else:
        threading.Thread(target=_work, daemon=True).start()
    logger.info("Job %s started in thread (no Redis)", job_id)


def _process_precalculated_bg(job_id: str, df: pd.DataFrame, dist_col: str, mapping: dict):
    """Process pre-calculated distance data in a background thread."""
    from flask import current_app
    app = current_app._get_current_object()

    def _work():
        with app.app_context():
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
                    storage.update_progress(job_id, end, failed_count, status="running")
                    logger.info("Job %s: processed %d/%d rows", job_id, end, len(df))

                storage.complete_job(job_id, all_results, df, mapping, failed_count)
                logger.info("Job %s: pre-calculated done (%d rows)", job_id, len(all_results))

            except Exception as exc:
                logger.error("Job %s pre-calculated error: %s", job_id, exc)
                storage.fail_job(job_id, str(exc))

    if app.config.get("TESTING"):
        _work()
    else:
        threading.Thread(target=_work, daemon=True).start()


def _build_store_analysis_df(df: pd.DataFrame, stores: Dict, threshold: float) -> List[Dict]:
    if "store_id" not in df.columns or "distance_km" not in df.columns:
        return []

    valid = df[df["distance_km"].notna()].copy()
    if valid.empty:
        return []

    valid["_sid"] = valid["store_id"].astype(str)
    grp = valid.groupby("_sid")["distance_km"]

    agg = grp.agg(["count", "mean", "max"])
    agg.columns = ["total_orders", "avg_distance", "max_distance"]
    agg["within"] = grp.apply(lambda x: (x <= threshold).sum())
    agg["beyond"] = agg["total_orders"] - agg["within"]
    agg["breach_pct"] = ((agg["beyond"] / agg["total_orders"]) * 100).round(1)
    agg["avg_distance"] = agg["avg_distance"].round(2)
    agg["max_distance"] = agg["max_distance"].round(2)
    agg["p90_distance"] = grp.quantile(0.9).round(2)

    analysis = []
    for sid, row in agg.iterrows():
        s = stores.get(str(sid), {})
        analysis.append({
            "store_id": str(sid),
            "total_orders": int(row["total_orders"]),
            "within_threshold": int(row["within"]),
            "beyond_threshold": int(row["beyond"]),
            "breach_pct": float(row["breach_pct"]),
            "avg_distance": float(row["avg_distance"]),
            "max_distance": float(row["max_distance"]),
            "p90_distance": float(row["p90_distance"]),
            "lat": s.get("lat"),
            "lon": s.get("lon"),
        })

    analysis.sort(key=lambda x: x["breach_pct"], reverse=True)
    return analysis


def _sample_beyond_orders_df(df: pd.DataFrame, threshold: float, mapping: Dict, limit: int = 10000) -> List[Dict]:
    if "distance_km" not in df.columns:
        return []

    beyond_df = df[df["distance_km"].notna() & (df["distance_km"] > threshold)]
    if beyond_df.empty:
        return []

    if len(beyond_df) > limit:
        beyond_df = beyond_df.head(limit)

    olat_col = mapping.get("order_lat", "")
    olon_col = mapping.get("order_lon", "")

    result = pd.DataFrame()
    result["lat"] = pd.to_numeric(beyond_df.get(olat_col, pd.Series(dtype=float)), errors="coerce")
    result["lon"] = pd.to_numeric(beyond_df.get(olon_col, pd.Series(dtype=float)), errors="coerce")
    result["distance"] = beyond_df["distance_km"].round(2)
    result["store_id"] = beyond_df["store_id"].astype(str) if "store_id" in beyond_df.columns else ""

    result = result.dropna(subset=["lat", "lon"])
    return result.to_dict("records")
