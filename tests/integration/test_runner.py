import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.geo_tracker.config import CompetitorsFileConfig, BrandConfig, CompetitorConfig
from src.geo_tracker.connectors.base import BaseConnector, NormalizedResponse, Citation
from src.geo_tracker.classification.base import BaseClassifier, ClassificationResult
from src.geo_tracker.storage.models import Base, RunModel, PromptModel
from src.geo_tracker.runner import run_pipeline

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    session.add(PromptModel(id="qry_test_001", brand="Omnia", prompt_text="What are top GEO tools?", active=True))
    session.commit()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def comp_config():
    return CompetitorsFileConfig(
        brand=BrandConfig(name="Omnia", domain="useomnia.com"),
        competitors=[
            CompetitorConfig(name="Proseo", domain="proseo.io")
        ]
    )

def test_runner_full_pipeline_success(db_session, comp_config):
    # Mock Connectors
    mock_perplexity = MagicMock(spec=BaseConnector)
    mock_perplexity.fetch.return_value = NormalizedResponse(
        engine="perplexity",
        raw_response_text="Omnia is a top GEO platform.",
        citations=[Citation(url="https://useomnia.com/features")]
    )

    mock_claude = MagicMock(spec=BaseConnector)
    mock_claude.fetch.return_value = NormalizedResponse(
        engine="claude",
        raw_response_text="Omnia and Proseo provide visibility tracking.",
        citations=[Citation(url="https://proseo.io")]
    )

    connectors = {
        "perplexity": mock_perplexity,
        "claude": mock_claude
    }

    # Mock Classifier
    mock_classifier = MagicMock(spec=BaseClassifier)
    mock_classifier.classify.return_value = ClassificationResult(
        brand_mentioned=True,
        brand_cited=True,
        citation_url="https://useomnia.com/features",
        competitors_mentioned=["Proseo"],
        competitors_cited=[]
    )

    runs = run_pipeline(
        connectors=connectors,
        classifier=mock_classifier,
        db_session=db_session,
        competitors_config=comp_config
    )

    prompts_count = db_session.query(PromptModel).count()
    expected_runs = prompts_count * 2
    assert len(runs) == expected_runs

    db_runs = db_session.query(RunModel).all()
    assert len(db_runs) == expected_runs
    assert any(r.engine == "perplexity" for r in db_runs)
    assert any(r.engine == "claude" for r in db_runs)

def test_runner_connector_fault_tolerance(db_session, comp_config):
    # Mock Perplexity (succeeds)
    mock_perplexity = MagicMock(spec=BaseConnector)
    mock_perplexity.fetch.return_value = NormalizedResponse(
        engine="perplexity",
        raw_response_text="Omnia response",
        citations=[]
    )

    # Mock Claude (fails loudly)
    mock_claude = MagicMock(spec=BaseConnector)
    mock_claude.fetch.side_effect = RuntimeError("Claude API standard timeout")

    connectors = {
        "perplexity": mock_perplexity,
        "claude": mock_claude
    }

    mock_classifier = MagicMock(spec=BaseClassifier)
    mock_classifier.classify.return_value = ClassificationResult(
        brand_mentioned=True,
        brand_cited=False,
        citation_url=None,
        competitors_mentioned=[],
        competitors_cited=[]
    )

    runs = run_pipeline(
        connectors=connectors,
        classifier=mock_classifier,
        db_session=db_session,
        competitors_config=comp_config
    )

    prompts_count = db_session.query(PromptModel).count()
    assert len(runs) == prompts_count
    assert all(r.engine == "perplexity" for r in runs)
