"""
Application factory.

Calling create_app() builds a fully-configured Flask application.
This pattern (called the "app factory") lets us create multiple app
instances with different configs — essential for testing and for
running the same code in dev vs production.
"""

import logging
import os

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

    # --- Logging ---------------------------------------------------------
    logging.basicConfig(
        level=getattr(logging, cfg.LOG_LEVEL, logging.INFO),
        format=cfg.LOG_FORMAT,
    )

    # --- Extensions ------------------------------------------------------
    from app.extensions import db, migrate

    db.init_app(app)
    migrate.init_app(app, db)

    # --- Blueprints ------------------------------------------------------
    from app.routes.api import api_bp
    from app.routes.health import health_bp

    app.register_blueprint(api_bp)
    app.register_blueprint(health_bp)

    # --- CORS ------------------------------------------------------------
    _register_cors(app, cfg)

    # --- Auth middleware --------------------------------------------------
    if cfg.AUTH_ENABLED:
        _register_auth(app, cfg)

    # --- Error handlers --------------------------------------------------
    _register_error_handlers(app)

    # --- Create tables ---------------------------------------------------
    with app.app_context():
        from app import models  # noqa: F401
        db.create_all()

    return app


# ── helpers ──────────────────────────────────────────────────────────────


def _register_cors(app, cfg):
    """Set CORS headers on every response."""

    @app.after_request
    def _cors(response):
        origin = cfg.CORS_ORIGINS
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
        return response


def _register_auth(app, cfg):
    """Optional simple token / basic-auth gate for all /api/* routes."""

    @app.before_request
    def _check_auth():
        from flask import request, jsonify

        if not request.path.startswith("/api"):
            return None
        if request.path.startswith("/api/health"):
            return None

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if cfg.AUTH_TOKEN and token == cfg.AUTH_TOKEN:
            return None

        import base64

        auth = request.authorization
        if auth and auth.username == cfg.AUTH_USERNAME and auth.password == cfg.AUTH_PASSWORD:
            return None

        return jsonify({"error": "Unauthorized"}), 401


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
