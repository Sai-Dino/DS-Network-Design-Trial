"""
Application factory.

Calling create_app() builds a fully-configured Flask application.
"""

import logging
import os
from datetime import timedelta

from flask import Flask

from app.config import get_config


def create_app(config_class=None):
    """Build and return a configured Flask app."""

    cfg = config_class or get_config()

    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "..", "static"),
    )
    app.config.from_object(cfg)

    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)

    # --- Logging ---------------------------------------------------------
    logging.basicConfig(
        level=getattr(logging, cfg.LOG_LEVEL, logging.INFO),
        format=cfg.LOG_FORMAT,
    )

    # --- Extensions ------------------------------------------------------
    from app.extensions import bcrypt, db, migrate

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    # --- Blueprints ------------------------------------------------------
    from app.routes.api import api_bp
    from app.routes.auth import auth_bp
    from app.routes.health import health_bp

    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)

    # --- CORS ------------------------------------------------------------
    _register_cors(app, cfg)

    # --- Session-based auth middleware -----------------------------------
    _register_session_auth(app)

    # --- Error handlers --------------------------------------------------
    _register_error_handlers(app)

    # --- Create tables + data directories --------------------------------
    with app.app_context():
        from app import models  # noqa: F401
        db.create_all()

        data_dir = os.path.abspath(cfg.DATA_DIR)
        os.makedirs(os.path.join(data_dir, "uploads"), exist_ok=True)
        os.makedirs(os.path.join(data_dir, "results"), exist_ok=True)

    return app


# ── helpers ──────────────────────────────────────────────────────────────

_PUBLIC_PREFIXES = (
    "/api/auth/",
    "/api/health",
    "/health",
    "/static",
)


def _register_session_auth(app):
    """Require a valid session for all /api/* routes except login and health."""

    @app.before_request
    def _check_session():
        from flask import request, session, jsonify

        path = request.path

        if path == "/":
            return None
        if any(path.startswith(p) for p in _PUBLIC_PREFIXES):
            return None
        if request.method == "OPTIONS":
            return None

        if not path.startswith("/api"):
            return None

        if not session.get("user_id"):
            return jsonify({"error": "Not logged in"}), 401


def _register_cors(app, cfg):
    """Set CORS headers on every response."""

    @app.after_request
    def _cors(response):
        origin = cfg.CORS_ORIGINS
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


def _register_error_handlers(app):
    from flask import jsonify

    @app.errorhandler(404)
    def _not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(413)
    def _too_large(e):
        return jsonify({"error": "File too large"}), 413

    @app.errorhandler(500)
    def _server_error(e):
        logging.getLogger(__name__).error("Unhandled error: %s", e)
        return jsonify({"error": "Internal server error"}), 500
