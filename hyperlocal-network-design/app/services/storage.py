"""
Persistent job storage backed by the database and filesystem.

Replaces the in-memory ``JOBS`` dictionary so that jobs survive server
restarts, work across Gunicorn workers, and are accessible from Celery.

Layout on disk::

    DATA_DIR/
      uploads/   {job_id}.parquet   -- original uploaded DataFrame
      results/   {job_id}.parquet   -- computed distance results
"""

import json
import logging
import os
import shutil
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import pandas as pd

from app.extensions import db
from app.models import Job
from app.services.stats import calculate_stats, calculate_store_stats

logger = logging.getLogger(__name__)

# Thread-safe LRU cache for results DataFrames (avoids re-reading Parquet
# from disk on every API call during a single dashboard page load).
_df_cache: Dict[str, "tuple[pd.DataFrame, float]"] = {}
_df_cache_lock = threading.Lock()
_DF_CACHE_TTL = 120  # seconds
_DF_CACHE_MAX = 4


def _evict_stale_cache():
    now = time.monotonic()
    stale = [k for k, (_, ts) in _df_cache.items() if now - ts > _DF_CACHE_TTL]
    for k in stale:
        del _df_cache[k]


def invalidate_results_cache(job_id: str):
    with _df_cache_lock:
        _df_cache.pop(job_id, None)


def _data_dir() -> str:
    from flask import current_app
    return os.path.abspath(current_app.config.get("DATA_DIR", "data"))


def _uploads_dir() -> str:
    d = os.path.join(_data_dir(), "uploads")
    os.makedirs(d, exist_ok=True)
    return d


def _results_dir() -> str:
    d = os.path.join(_data_dir(), "results")
    os.makedirs(d, exist_ok=True)
    return d


# ═══════════════════════════════════════════════════════════════════════
# Create
# ═══════════════════════════════════════════════════════════════════════


def create_job(
    job_id: str,
    filename: str,
    df: pd.DataFrame,
    mapping: Dict[str, str],
    has_distance: bool,
    user_id: Optional[int] = None,
) -> Job:
    """Persist a newly uploaded dataset (metadata in DB, data on disk)."""
    upload_path = os.path.join(_uploads_dir(), f"{job_id}.parquet")
    df.to_parquet(upload_path, index=False)

    store_count = int(df[mapping["store_id"]].nunique()) if mapping.get("store_id") else 0

    job = Job(
        id=job_id,
        user_id=user_id,
        filename=filename,
        total_rows=len(df),
        store_count=store_count,
        status="idle",
        mapping_json=json.dumps(mapping),
        has_distance_column=has_distance,
        upload_path=upload_path,
    )
    db.session.add(job)
    db.session.commit()
    logger.info("Job %s created (%d rows, %d stores) for user %s", job_id, len(df), store_count, user_id)
    return job


# ═══════════════════════════════════════════════════════════════════════
# Read helpers
# ═══════════════════════════════════════════════════════════════════════


def get_job(job_id: str) -> Optional[Job]:
    return db.session.get(Job, job_id)


def list_jobs(user_id: Optional[int] = None) -> List[Job]:
    q = Job.query
    if user_id is not None:
        q = q.filter_by(user_id=user_id)
    return q.order_by(Job.created_at.desc()).all()


def load_upload(job_id: str) -> Optional[pd.DataFrame]:
    job = get_job(job_id)
    if not job or not job.upload_path or not os.path.exists(job.upload_path):
        return None
    return pd.read_parquet(job.upload_path)


def load_results(job_id: str) -> List[Dict]:
    """Load the results Parquet and return as a list of dicts."""
    job = get_job(job_id)
    if not job or not job.results_path or not os.path.exists(job.results_path):
        return []
    df = pd.read_parquet(job.results_path)
    return df.to_dict("records")


def load_results_df(job_id: str) -> Optional[pd.DataFrame]:
    """Load results as a DataFrame, with a short-lived in-memory cache."""
    with _df_cache_lock:
        _evict_stale_cache()
        cached = _df_cache.get(job_id)
        if cached is not None:
            return cached[0]

    job = get_job(job_id)
    if not job or not job.results_path or not os.path.exists(job.results_path):
        return None
    df = pd.read_parquet(job.results_path)

    with _df_cache_lock:
        if len(_df_cache) >= _DF_CACHE_MAX:
            oldest_key = min(_df_cache, key=lambda k: _df_cache[k][1])
            del _df_cache[oldest_key]
        _df_cache[job_id] = (df, time.monotonic())
    return df


def get_unique_store_ids(job_id: str) -> List[str]:
    """Return sorted unique store IDs without loading full results to dicts."""
    df = load_results_df(job_id)
    if df is None or "store_id" not in df.columns:
        return []
    return sorted(df["store_id"].dropna().astype(str).unique().tolist())


def get_mapping(job_id: str) -> Dict[str, str]:
    job = get_job(job_id)
    if not job or not job.mapping_json:
        return {}
    return json.loads(job.mapping_json)


def get_stats(job_id: str) -> Dict[str, Any]:
    job = get_job(job_id)
    if not job or not job.stats_json:
        return {}
    return json.loads(job.stats_json)


def get_stores(job_id: str) -> Dict[str, Dict]:
    job = get_job(job_id)
    if not job or not job.stores_json:
        return {}
    return json.loads(job.stores_json)


# ═══════════════════════════════════════════════════════════════════════
# Update
# ═══════════════════════════════════════════════════════════════════════


def update_progress(
    job_id: str,
    processed: int,
    failed: int,
    status: Optional[str] = None,
    error: Optional[str] = None,
):
    """Lightweight progress update (called from threads / Celery)."""
    try:
        job = get_job(job_id)
        if not job:
            return
        job.processed_rows = processed
        job.failed_rows = failed
        if status:
            job.status = status
        if error:
            job.error_message = error
        if status == "running" and not job.started_at:
            job.started_at = datetime.now(timezone.utc)
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.debug("update_progress rollback for job %s", job_id)


def complete_job(
    job_id: str,
    results: List[Dict],
    df: pd.DataFrame,
    mapping: Dict[str, str],
    failed_count: int,
):
    """Save results to disk, compute stats, and mark the job complete."""
    job = get_job(job_id)
    if not job:
        logger.error("complete_job: job %s not found", job_id)
        return

    results_path = os.path.join(_results_dir(), f"{job_id}.parquet")
    results_df = pd.DataFrame(results)
    results_df.to_parquet(results_path, index=False)

    stats = calculate_stats(results)
    stores = calculate_store_stats(results, df, mapping)

    job.results_path = results_path
    job.processed_rows = len(results) + failed_count
    job.failed_rows = failed_count
    job.stats_json = json.dumps(stats, default=str)
    job.stores_json = json.dumps(stores, default=str)
    job.status = "complete"
    job.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    logger.info("Job %s complete: %d results, %d failed", job_id, len(results), failed_count)


def fail_job(job_id: str, error_message: str):
    try:
        db.session.rollback()
        job = get_job(job_id)
        if not job:
            return
        job.status = "error"
        job.error_message = error_message
        db.session.commit()
    except Exception:
        db.session.rollback()
    logger.error("Job %s failed: %s", job_id, error_message)


# ═══════════════════════════════════════════════════════════════════════
# Delete
# ═══════════════════════════════════════════════════════════════════════


def delete_job(job_id: str) -> bool:
    job = get_job(job_id)
    if not job:
        return False

    for path in (job.upload_path, job.results_path):
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError as exc:
                logger.warning("Could not delete %s: %s", path, exc)

    db.session.delete(job)
    db.session.commit()
    logger.info("Job %s deleted", job_id)
    return True


# ═══════════════════════════════════════════════════════════════════════
# Checkpoint helpers (for resume-on-failure)
# ═══════════════════════════════════════════════════════════════════════


def save_checkpoint(job_id: str, partial_results: List[Dict], processed: int):
    """Save partial results so a failed calculation can be resumed."""
    checkpoint_path = os.path.join(_results_dir(), f"{job_id}.checkpoint.parquet")
    pd.DataFrame(partial_results).to_parquet(checkpoint_path, index=False)
    update_progress(job_id, processed, 0)
    logger.info("Job %s checkpoint at %d rows", job_id, processed)


def load_checkpoint(job_id: str) -> Optional[List[Dict]]:
    """Load partial results from a previous interrupted run."""
    checkpoint_path = os.path.join(_results_dir(), f"{job_id}.checkpoint.parquet")
    if not os.path.exists(checkpoint_path):
        return None
    df = pd.read_parquet(checkpoint_path)
    logger.info("Job %s resuming from checkpoint (%d rows)", job_id, len(df))
    return df.to_dict("records")


def clear_checkpoint(job_id: str):
    checkpoint_path = os.path.join(_results_dir(), f"{job_id}.checkpoint.parquet")
    if os.path.exists(checkpoint_path):
        os.remove(checkpoint_path)
