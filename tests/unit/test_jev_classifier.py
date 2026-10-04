import pytest
from unittest.mock import MagicMock, patch
from typesafe_sdk import NoulAnswer
from src.geo_tracker.config import CompetitorsFileConfig, BrandConfig, CompetitorConfig
from src.geo_tracker.connectors.base import NormalizedResponse, Citation
from src.geo_tracker.classification.jev_classifier import JevClassifier, JevClassifierError

@pytest.fixture
def classifier(monkeypatch):
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test-key")
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost:5432/testdb")
    return JevClassifier()

@pytest.fixture
def comp_config():
    return CompetitorsFileConfig(
        brand=BrandConfig(name="Omnia", domain="useomnia.com"),
        competitors=[
            CompetitorConfig(name="Proseo", domain="proseo.io"),
            CompetitorConfig(name="Peec", domain="peec.ai")
        ]
    )

def test_jev_classify_success(classifier, comp_config):
    response = NormalizedResponse(
        engine="perplexity",
        raw_response_text="Omnia is an AI search visibility tracker. Proseo is an alternative.",
        citations=[
            Citation(url="https://useomnia.com/features"),
            Citation(url="https://proseo.io/features")
        ]
    )

    mock_client_instance = MagicMock()
    mock_system_one_res = MagicMock()
    
    # Simulate Jev Noul answers
    ans_brand = MagicMock(result=True)
    ans_proseo = MagicMock(result=True)
    ans_peec = MagicMock(result=False)

    mock_system_one_res.answers = {
        "is_brand_mentioned": ans_brand,
        "is_proseo_mentioned": ans_proseo,
        "is_peec_mentioned": ans_peec
    }
    mock_client_instance.system_one.return_value = mock_system_one_res

    with patch("src.geo_tracker.classification.jev_classifier.TypeSafeClient") as MockClientClass:
        MockClientClass.return_value.__enter__.return_value = mock_client_instance
        res = classifier.classify(response, comp_config.brand, comp_config)

        # Verify pinned model argument passed to system_one
        mock_client_instance.system_one.assert_called_once()
        assert mock_client_instance.system_one.call_args.kwargs.get("model") == "jev-1.13.0"

    # Verify classification output
    assert res.brand_mentioned is True
    assert res.brand_cited is True
    assert res.citation_url == "https://useomnia.com/features"
    assert "Proseo" in res.competitors_mentioned
    assert "Peec" not in res.competitors_mentioned
    assert len(res.competitors_cited) == 1
    assert res.competitors_cited[0]["name"] == "Proseo"

def test_jev_classify_fallback_on_api_failure(classifier, comp_config):
    response = NormalizedResponse(
        engine="perplexity",
        raw_response_text="Omnia is great. Proseo is an alternative.",
        citations=[]
    )

    mock_client_instance = MagicMock()
    mock_client_instance.system_one.side_effect = RuntimeError("TypeSafe API Unreachable")

    with patch("src.geo_tracker.classification.jev_classifier.TypeSafeClient") as MockClientClass:
        MockClientClass.return_value.__enter__.return_value = mock_client_instance
        res = classifier.classify(response, comp_config.brand, comp_config)

    # Fallback to deterministic regex matching should successfully classify Omnia and Proseo
    assert res.brand_mentioned is True
    assert "Proseo" in res.competitors_mentioned
    assert "Peec" not in res.competitors_mentioned
