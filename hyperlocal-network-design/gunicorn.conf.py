"""
Gunicorn configuration for production deployment.

Gunicorn is a production-grade WSGI server — unlike Flask's built-in
server, it can handle real traffic safely with multiple worker processes.

Usage:
    gunicorn -c gunicorn.conf.py 'app:create_app()'
"""

import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('APP_PORT', '8080')}"

# One worker per CPU core — each handles requests independently
workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))

# Each worker can handle multiple threads
threads = int(os.getenv("GUNICORN_THREADS", 4))

# Timeout for slow requests (large file uploads)
timeout = int(os.getenv("GUNICORN_TIMEOUT", 300))

# Graceful restart — finish current requests before dying
graceful_timeout = 30

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()

# Preload to share memory across workers
preload_app = True
