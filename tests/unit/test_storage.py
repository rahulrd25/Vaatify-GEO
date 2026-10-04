import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.geo_tracker.storage.models import Base
from src.geo_tracker.storage.repository import Repository

@pytest.fixture
def db_session():
    # Use SQLite in-memory database for isolated, high-speed testing
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_add_and_get_active_prompts(db_session):
    repo = Repository(db_session)
    
    # Add active prompt
    p1 = repo.add_prompt("p-1", "Omnia", "Best GEO platforms?", active=True)
    assert p1.id == "p-1"
    assert p1.brand == "Omnia"

    # Add inactive prompt
    repo.add_prompt("p-2", "Omnia", "Old inactive prompt", active=False)

    active_prompts = repo.get_active_prompts()
    assert len(active_prompts) == 1
    assert active_prompts[0].id == "p-1"

def test_save_and_get_runs_roundtrip(db_session):
    repo = Repository(db_session)
    repo.add_prompt("p-100", "Omnia", "Omnia vs Peec AI", active=True)

    timestamp = datetime.now(timezone.utc) - timedelta(hours=2)
    competitors_mentioned = ["Proseo", "Peec"]
    competitors_cited = [
        {"name": "Peec", "url": "https://peec.ai/pricing"}
    ]

    saved_run = repo.save_run(
        prompt_id="p-100",
        engine="perplexity",
        raw_response_text="Omnia is great for GEO. Peec is also widely cited.",
        brand_mentioned=True,
        brand_cited=True,
        citation_url="https://useomnia.com/features",
        competitors_mentioned=competitors_mentioned,
        competitors_cited=competitors_cited,
        run_timestamp=timestamp
    )

    assert saved_run.id is not None
    assert saved_run.prompt_id == "p-100"

    runs = repo.get_runs_for_prompt("p-100")
    assert len(runs) == 1
    run = runs[0]

    # Verify field values and JSON roundtrip
    assert run.engine == "perplexity"
    assert run.brand_mentioned is True
    assert run.brand_cited is True
    assert run.citation_url == "https://useomnia.com/features"
    assert run.competitors_mentioned == ["Proseo", "Peec"]
    assert run.competitors_cited == [{"name": "Peec", "url": "https://peec.ai/pricing"}]

def test_startup_migration_legacy_remapping(tmp_path):
    from src.geo_tracker.storage.migrations import run_startup_checks_and_migrations
    from src.geo_tracker.storage.models import PromptModel, RunModel

    db_path = f"sqlite:///{tmp_path}/test_migration.db"
    
    # 1. Run initial migrations to set up schema
    run_startup_checks_and_migrations(db_path)

    # 2. Insert a legacy p- prompt and child run
    engine = create_engine(db_path)
    TestingSession = sessionmaker(bind=engine)
    session = TestingSession()

    legacy_prompt = PromptModel(
        id="p-103",
        brand="Vaatify",
        prompt_text="Custom unique legacy query test",
        active=True
    )
    session.add(legacy_prompt)
    session.flush()

    legacy_run = RunModel(
        id="run_legacy_1",
        prompt_id="p-103",
        engine="perplexity",
        raw_response_text="Legacy test response",
        brand_mentioned=True,
        brand_cited=False
    )
    session.add(legacy_run)
    session.commit()
    session.close()

    # 3. Run startup migration again
    run_startup_checks_and_migrations(db_path)

    # 4. Verify p-103 was migrated to qry_ format and child run updated
    session = TestingSession()
    old_p = session.query(PromptModel).filter(PromptModel.id == "p-103").first()
    assert old_p is None

    migrated_p = session.query(PromptModel).filter(PromptModel.prompt_text == "Custom unique legacy query test").first()
    assert migrated_p is not None
    assert migrated_p.id.startswith("qry_")

    updated_run = session.query(RunModel).filter(RunModel.id == "run_legacy_1").first()
    assert updated_run is not None
    assert updated_run.prompt_id == migrated_p.id
    session.close()

