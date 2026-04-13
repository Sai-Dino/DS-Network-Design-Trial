"""
Health-check endpoints.

Load balancers and orchestrators (Kubernetes, ECS, etc.) ping these
to decide whether the app is alive and ready to serve traffic.
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)

_STARTED_AT = datetime.now(timezone.utc)


@health_bp.route("/api/health", methods=["GET"])
@health_bp.route("/health", methods=["GET"])
def health():
    """
    Liveness probe — confirms the process is running.
    Returns 200 as long as the Python process can respond.
    """
    from app.extensions import db

    db_ok = True
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception:
        db_ok = False

    return jsonify({
        "status": "healthy" if db_ok else "degraded",
        "uptime_seconds": (datetime.now(timezone.utc) - _STARTED_AT).total_seconds(),
        "database": "ok" if db_ok else "unreachable",
    }), 200 if db_ok else 503
