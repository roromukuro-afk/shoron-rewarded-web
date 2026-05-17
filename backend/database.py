"""Database configuration - supports SQLite (local) and PostgreSQL (production)."""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "screener.db")

# DATABASE_URL: 環境変数で本番DBに切り替え
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

# Render等で postgres:// が来た場合に postgresql:// に置換 (SQLAlchemy 2.x要件)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Engine options
engine_kwargs = {"future": True}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import (
        Stock, DailyPrice, Indicator, Material,
        ScreeningResult, ExclusionList, AARRecord,
        AppSetting, ScreeningJob,
    )
    Base.metadata.create_all(bind=engine)


def get_db_info() -> dict:
    backend = "postgresql" if DATABASE_URL.startswith("postgresql") else "sqlite"
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        connected = True
        error = None
    except Exception as e:
        connected = False
        error = str(e)[:200]
    return {
        "backend": backend,
        "connected": connected,
        "error": error,
        "url_masked": _mask_url(DATABASE_URL),
    }


def _mask_url(url: str) -> str:
    """パスワードをマスクする"""
    import re
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", url)
