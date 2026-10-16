"""
Database startup checks and automated migration runner.
Executes on FastAPI application startup to guarantee schema integrity and connection health.
"""
import logging
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.geo_tracker.storage.session import get_db_engine, create_session_factory
from src.geo_tracker.storage.models import (
    Base, BrandProfileModel, CompetitorModel, PromptModel, RunModel, DriftAlertModel, MonitoringScheduleModel
)
from src.geo_tracker.config import load_competitors_config, load_prompts_config

logger = logging.getLogger("geo_tracker.migrations")
logging.basicConfig(level=logging.INFO)

def check_db_connection(engine) -> bool:
    """Verifies that the database engine can establish a working connection."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return True

def run_startup_checks_and_migrations(database_url: str | None = None) -> None:
    """
    Executes startup database health checks and schema migrations.
    Idempotent and safe to run on every server startup.
    """
    engine = get_db_engine(database_url)
    session_factory = create_session_factory(database_url)
    
    logger.info("⚡ [Startup] Checking database connectivity...")
    try:
        check_db_connection(engine)
        logger.info("✓ [Startup] Database connection verified.")
    except Exception as e:
        logger.warning(f"⚠️ [Startup] Primary database connection failed ({e}). Attempting fallback to local SQLite database so server can start.")
        fallback_url = "sqlite:///geo_tracker_demo.db"
        engine = get_db_engine(fallback_url)
        session_factory = create_session_factory(fallback_url)
        try:
            check_db_connection(engine)
            logger.info("✓ [Startup] Connected to fallback local SQLite database.")
        except Exception as fallback_err:
            logger.error(f"❌ [Startup] Fallback connection failed: {fallback_err}")
            raise


    logger.info("⚡ [Startup] Running schema migrations & checks...")
    try:
        # 1. Ensure all tables exist
        Base.metadata.create_all(engine)

        # 1b. Non-destructive column additions for existing tables
        with engine.connect() as conn:
            if "postgresql" in str(engine.url):
                conn.execute(text("ALTER TABLE runs ADD COLUMN IF NOT EXISTS collection_mode VARCHAR(20) DEFAULT 'api'"))
                conn.execute(text("ALTER TABLE runs ADD COLUMN IF NOT EXISTS position_rank INTEGER"))
                conn.execute(text("ALTER TABLE runs ADD COLUMN IF NOT EXISTS snippet_text TEXT"))
                conn.execute(text("ALTER TABLE runs ADD COLUMN IF NOT EXISTS prominence_score FLOAT DEFAULT 0.0"))
                conn.commit()
            elif "sqlite" in str(engine.url):
                for col_sql in [
                    "ALTER TABLE runs ADD COLUMN collection_mode VARCHAR(20) DEFAULT 'api'",
                    "ALTER TABLE runs ADD COLUMN position_rank INTEGER",
                    "ALTER TABLE runs ADD COLUMN snippet_text TEXT",
                    "ALTER TABLE runs ADD COLUMN prominence_score FLOAT DEFAULT 0.0"
                ]:
                    try:
                        conn.execute(text(col_sql))
                        conn.commit()
                    except Exception:
                        pass

        session: Session = session_factory()
        try:
            # 2. Check and initialize Brand Profile if missing
            comp_cfg = load_competitors_config()
            brand_profile = session.query(BrandProfileModel).first()
            if not brand_profile:
                brand_profile = BrandProfileModel(
                    id=f"brand_{uuid.uuid4().hex[:12]}",
                    name=comp_cfg.brand.name,
                    domain=comp_cfg.brand.domain,
                )
                session.add(brand_profile)
                session.flush()
                logger.info(f"✓ [Startup] Initialized brand profile for '{comp_cfg.brand.name}'.")

            # 3. Check and sync competitors if empty
            if session.query(CompetitorModel).count() == 0:
                for comp in comp_cfg.competitors:
                    session.add(
                        CompetitorModel(
                            id=f"comp_{uuid.uuid4().hex[:12]}",
                            brand_id=brand_profile.id,
                            name=comp.name,
                            domain=comp.domain,
                            is_active=True,
                        )
                    )
                logger.info(f"✓ [Startup] Seeded {len(comp_cfg.competitors)} default competitors.")

            # 4. Check and sync default prompts if empty
            if session.query(PromptModel).count() == 0:
                prompts_cfg = load_prompts_config()
                for p_cfg in prompts_cfg.prompts:
                    session.add(
                        PromptModel(
                            id=p_cfg.id,
                            brand=comp_cfg.brand.name,
                            prompt_text=p_cfg.text,
                            active=p_cfg.active,
                        )
                    )
                logger.info(f"✓ [Startup] Seeded {len(prompts_cfg.prompts)} standardized queries.")

            # 5. Migrate any remaining legacy 'p-' identifiers to standardized 'qry_'
            legacy_prompts = session.query(PromptModel).filter(PromptModel.id.like("p-%")).all()
            if legacy_prompts:
                migrated_count = 0
                for lp in legacy_prompts:
                    matching_std = session.query(PromptModel).filter(
                        PromptModel.prompt_text == lp.prompt_text,
                        PromptModel.id != lp.id
                    ).first()
                    if matching_std:
                        session.query(RunModel).filter(RunModel.prompt_id == lp.id).update({"prompt_id": matching_std.id})
                        session.query(DriftAlertModel).filter(DriftAlertModel.prompt_id == lp.id).update({"prompt_id": matching_std.id})
                        session.delete(lp)
                    else:
                        new_id = f"qry_{uuid.uuid4().hex[:12]}"
                        # 1. Insert new prompt row first so FK constraint is satisfied
                        new_prompt = PromptModel(
                            id=new_id,
                            brand=lp.brand,
                            prompt_text=lp.prompt_text,
                            created_at=lp.created_at,
                            active=lp.active
                        )
                        session.add(new_prompt)
                        session.flush()

                        # 2. Re-point child runs and drift alerts to new prompt ID
                        session.query(RunModel).filter(RunModel.prompt_id == lp.id).update({"prompt_id": new_id})
                        session.query(DriftAlertModel).filter(DriftAlertModel.prompt_id == lp.id).update({"prompt_id": new_id})
                        session.flush()

                        # 3. Delete old legacy prompt record
                        session.delete(lp)
                        session.flush()
                    migrated_count += 1
                logger.info(f"✓ [Startup] Migrated {migrated_count} legacy prompt IDs to standard format.")

            # 6. Check and seed default automated monitoring schedule if missing
            active_brand = comp_cfg.brand.name
            schedule = session.query(MonitoringScheduleModel).filter(MonitoringScheduleModel.brand == active_brand).first()
            if not schedule:
                session.add(
                    MonitoringScheduleModel(
                        id=f"sch_{uuid.uuid4().hex[:12]}",
                        brand=active_brand,
                        frequency="weekly",
                        day_of_week=0,  # Monday
                        hour_utc=9,
                        minute_utc=0,
                        is_active=True,
                    )
                )
                logger.info(f"✓ [Startup] Seeded default weekly schedule for brand '{active_brand}'.")

            session.commit()
            logger.info("✓ [Startup] Database checks and migrations completed successfully.")
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    except Exception as e:
        logger.error(f"❌ [Startup] Migration error: {e}")
        raise
