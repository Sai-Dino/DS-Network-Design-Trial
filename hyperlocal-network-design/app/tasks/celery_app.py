"""
Celery application instance.

Celery is a distributed task queue — think of it as a conveyor belt.
The web server puts "work orders" on the belt, and separate worker
processes pick them up and do the heavy lifting.

Start a worker:
    celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
"""

import os

from celery import Celery

celery = Celery(
    "hyperlocal",
    broker=os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
    backend=os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=3600,
    task_time_limit=7200,
    task_default_retry_delay=60,
    task_max_retries=3,
)

celery.autodiscover_tasks(["app.tasks"])
