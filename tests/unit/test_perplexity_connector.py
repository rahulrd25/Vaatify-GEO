import pytest
from unittest.mock import MagicMock, patch
import httpx
from src.geo_tracker.connectors.perplexity import PerplexityConnector, PerplexityAPIError

@pytest.fixture
def connector(monkeypatch):
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test")
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost:5432/testdb")
    return PerplexityConnector()

def test_perplexity_fetch_success(connector):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Omnia is a top Generative Engine Optimization tool."
                }
            }
        ],
        "citations": [
            "https://useomnia.com/features",
            "https://techcrunch.com/omnia-review"
        ]
    }

    with patch("httpx.Client.post", return_value=mock_response):
        result = connector.fetch("What is Omnia?")

    assert result.engine == "perplexity"
    assert "Omnia is a top" in result.raw_response_text
    assert len(result.citations) == 2
    assert result.citations[0].url == "https://useomnia.com/features"
    assert result.citations[1].url == "https://techcrunch.com/omnia-review"

def test_perplexity_fetch_api_error(connector):
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"

    with patch("httpx.Client.post", return_value=mock_response):
        with pytest.raises(PerplexityAPIError) as exc_info:
            connector.fetch("What is Omnia?")

    assert "status code 500" in str(exc_info.value)

def test_perplexity_fetch_network_error(connector):
    with patch("httpx.Client.post", side_effect=httpx.ConnectError("Network unreachable")):
        with pytest.raises(PerplexityAPIError) as exc_info:
            connector.fetch("What is Omnia?")

    assert "Network failure" in str(exc_info.value)
