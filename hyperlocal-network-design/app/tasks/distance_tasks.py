"""
Celery tasks for distance calculation.

These run in a SEPARATE process from the web server.  When you call
``calculate_distances_task.delay(job_id, osrm_url)``, Celery puts a
message on Redis.  A worker process picks it up and runs the function.

Benefits over plain threads:
  - Survives web server restarts
  - Automatic retry on failure
  - Scales horizontally (run more workers on more machines)
  - Visibility: you can monitor task status via Celery Flower
"""

import logging

from app.tasks.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def calculate_distances_task(self, job_id: str, osrm_url: str, max_workers: int = 32, chunk_limit: int = 500):
    """
    Celery-wrapped distance calculation.

    ``bind=True`` gives us ``self`` so we can report progress and retry.
    ``max_retries=3`` means if the OSRM server is temporarily down,
    Celery will wait 60 seconds and try again, up to 3 times.
    """
    from app.routes.api import JOBS, JOBS_LOCK
    from app.services.osrm import background_distance_calculation

    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        logger.error("Celery task: job %s not found in memory", job_id)
        return {"status": "error", "error": "Job not found"}

    try:
        background_distance_calculation(job, osrm_url, max_workers, chunk_limit)
        return {"status": "complete", "job_id": job_id}
    except Exception as exc:
        logger.error("Celery task failed for job %s: %s", job_id, exc)
        raise self.retry(exc=exc)
