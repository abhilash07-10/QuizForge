import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration. All secrets come from environment variables."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

    # --- Database -----------------------------------------------------
    # Neon (or any PostgreSQL) connection string, e.g.:
    # postgresql://user:password@host/dbname?sslmode=require
    _raw_db_url = os.environ.get("DATABASE_URL", "")

    # SQLAlchemy needs the "postgresql://" scheme (some providers hand out
    # "postgres://", which SQLAlchemy 1.4+/2.x rejects).
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = _raw_db_url or "sqlite:///" + os.path.join(basedir, "dev.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }

    # --- Auth ------------------------------------------------------------
    JWT_SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # --- CORS --------------------------------------------------------
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5500")

    # --- Misc ----------------------------------------------------------
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")

    # Basic rate limiting for auth endpoints (requests per window)
    AUTH_RATE_LIMIT = "10 per minute"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
