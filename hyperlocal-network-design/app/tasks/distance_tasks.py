"""
Celery tasks for distance calculation.

These run in a SEPARATE process from the web server.  All state is
read from and written to the database + filesystem — never the
web server's memory.
"""

import logging

from app.tasks.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def calculate_distances_task(self, job_id: str, osrm_url: str, max_workers: int = 32, chunk_limit: int = 500):
    """
    Celery-wrapped distance calculation.

    Reads the uploaded DataFrame from disk, calls the OSRM engine,
    writes results to disk, and updates the DB throughout.
    """
    from app import create_app
    app = create_app()

    with app.app_context():
        from app.services import storage
        from app.services.osrm import calculate_distances

        job = storage.get_job(job_id)
        if not job:
            logger.error("Celery task: job %s not found in DB", job_id)
            return {"status": "error", "error": "Job not found"}

        df = storage.load_upload(job_id)
        if df is None:
            storage.fail_job(job_id, "Upload data not found on disk")
            return {"status": "error", "error": "Upload not found"}

        mapping = storage.get_mapping(job_id)

        try:
            storage.update_progress(job_id, 0, 0, status="running")

            def _on_progress(processed, failed):
                storage.update_progress(job_id, processed, failed)
                self.update_state(state="PROGRESS", meta={"processed": processed, "failed": failed})

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
            return {"status": "complete", "job_id": job_id, "results": len(results)}

        except Exception as exc:
            logger.error("Celery task failed for job %s: %s", job_id, exc)
            storage.fail_job(job_id, str(exc))
            raise self.retry(exc=exc)
