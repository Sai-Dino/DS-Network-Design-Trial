"""
Application configuration.

Settings are loaded from environment variables (or a .env file).
Each class represents one environment — you pick which one to use
when starting the app.  The 'get_config()' helper reads the APP_ENV
variable so you never have to hardcode the choice.
"""

import os


class _Base:
    """Defaults shared by every environment."""

    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")

    # --- Flask -----------------------------------------------------------
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", 500)) * 1024 * 1024

    # --- Server ----------------------------------------------------------
    HOST = os.getenv("APP_HOST", "0.0.0.0")
    PORT = int(os.getenv("APP_PORT", 8080))

    # --- Database --------------------------------------------------------
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///hyperlocal.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Redis / Celery --------------------------------------------------
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    # --- OSRM ------------------------------------------------------------
    OSRM_DEFAULT_URL = os.getenv("OSRM_URL", "http://localhost:5000")
    OSRM_ALLOWED_HOSTS = [
        h.strip()
        for h in os.getenv("OSRM_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    ]
    OSRM_MAX_WORKERS = int(os.getenv("OSRM_MAX_WORKERS", 32))
    OSRM_CHUNK_LIMIT = int(os.getenv("OSRM_CHUNK_LIMIT", 500))

    # --- CORS ------------------------------------------------------------
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # --- Auth (optional) -------------------------------------------------
    AUTH_ENABLED = os.getenv("AUTH_ENABLED", "false").lower() == "true"
    AUTH_USERNAME = os.getenv("AUTH_USERNAME", "")
    AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "")
    AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")

    # --- Logging ---------------------------------------------------------
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv(
        "LOG_FORMAT",
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


class Development(_Base):
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class Production(_Base):
    DEBUG = False
    LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING")


class Testing(_Base):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    AUTH_ENABLED = False


_configs = {
    "development": Development,
    "production": Production,
    "testing": Testing,
}


def get_config():
    env = os.getenv("APP_ENV", "development").lower()
    return _configs.get(env, Development)
