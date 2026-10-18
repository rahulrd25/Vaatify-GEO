import os
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

load_dotenv(override=True)

_ENGINES = {}
_SESSION_FACTORIES = {}

def get_db_engine(database_url: str | None = None):
    url = database_url or os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("CRITICAL: DATABASE_URL is not configured in environment.")
    
    # Normalize postgresql:// to postgresql+psycopg2:// for standard compatibility
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    if url in _ENGINES:
        return _ENGINES[url]

    connect_args = {}
    engine_kwargs = {
        "pool_pre_ping": True,
    }

    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        # Conservative pool settings for serverless Supabase connections
        engine_kwargs["pool_size"] = 3
        engine_kwargs["max_overflow"] = 2
        engine_kwargs["pool_recycle"] = 120
        engine_kwargs["pool_timeout"] = 10
    
    engine = create_engine(
        url,
        connect_args=connect_args,
        **engine_kwargs
    )
    
    _ENGINES[url] = engine
    return engine


def check_db_health(engine) -> bool:
    """Verifies that the database engine can establish a working connection."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

def create_session_factory(database_url: str | None = None) -> sessionmaker:
    url = database_url or os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("CRITICAL: DATABASE_URL is not configured in environment.")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    if url in _SESSION_FACTORIES:
        return _SESSION_FACTORIES[url]

    engine = get_db_engine(url)
    if not url.startswith("sqlite") and not check_db_health(engine):
        raise ConnectionError(f"Database connection failed health check for {url}.")

    factory = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)
    _SESSION_FACTORIES[url] = factory
    return factory

def get_db_session(database_url: str | None = None) -> Generator[Session, None, None]:
    """
    FastAPI dependency and context manager for database sessions.
    Automatically handles session closing and rollback on exceptions.
    """
    session_factory = create_session_factory(database_url)
    session = session_factory()

    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def run_alembic_migrations(config_file: str = "alembic.ini") -> None:
    """Executes all pending Alembic migrations up to head."""
    import logging
    from pathlib import Path
    from alembic.config import Config
    from alembic import command

    # Silence noisy internal Alembic plugin registry and dialect inspection logs
    logging.getLogger("alembic.runtime.plugins").setLevel(logging.WARNING)
    logging.getLogger("alembic.runtime.migration").setLevel(logging.WARNING)
    logging.getLogger("alembic").setLevel(logging.WARNING)

    logger = logging.getLogger("geo_tracker.storage")

    ini_path = Path(config_file)
    if not ini_path.is_absolute():
        project_root = Path(__file__).resolve().parent.parent.parent.parent
        possible_path = project_root / config_file
        if possible_path.exists():
            ini_path = possible_path

    logger.info("⚡ [Startup] Checking database schema with Alembic...")
    alembic_cfg = Config(str(ini_path))
    command.upgrade(alembic_cfg, "head")
    logger.info("✓ [Startup] Database schema verified up-to-date (head).")

