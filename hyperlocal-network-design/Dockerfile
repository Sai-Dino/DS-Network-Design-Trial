# ============================================================
# Multi-stage Dockerfile for the Hyperlocal Distance Analyzer.
#
# Multi-stage means we build in one image (with compilers etc.)
# and then copy only what we need into a slim final image.
# This keeps the container small and secure.
# ============================================================

# ── Stage 1: build dependencies ──────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# System libs needed to compile some Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: production image ────────────────────────────────
FROM python:3.11-slim

# libpq is needed at runtime for PostgreSQL connectivity
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app

# Copy application code
COPY . .

# Don't run as root (security best practice)
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Default port
EXPOSE 8080

# Health check — Docker/K8s will restart the container if this fails
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Production: use Gunicorn (multi-worker, production-grade server)
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:create_app()"]
