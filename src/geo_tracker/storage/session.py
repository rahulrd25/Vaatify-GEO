import os
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

load_dotenv(override=True)

_ENGINES = {}
_SESSION_FACTORIES = {}

def get_db_engine(database_url: str | None = None):
    url = database_url or os.getenv("DATABASE_URL") or "sqlite:///geo_tracker_demo.db"
    
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
    
    # Ensure all tables exist on startup
    from src.geo_tracker.storage.models import Base
    try:
        Base.metadata.create_all(engine)
    except Exception:
        pass  # If tables already exist or under high concurrency

    _ENGINES[url] = engine
    return engine


def create_session_factory(database_url: str | None = None) -> sessionmaker:
    url = database_url or os.getenv("DATABASE_URL") or "sqlite:///geo_tracker_demo.db"
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    if url in _SESSION_FACTORIES:
        return _SESSION_FACTORIES[url]

    engine = get_db_engine(url)
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
