import pytest
from unittest.mock import MagicMock, patch
from src.geo_tracker.connectors.gemini_grounded import GeminiGroundedConnector, GeminiAPIError

@pytest.fixture
def connector(monkeypatch):
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test")
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost:5432/testdb")
    return GeminiGroundedConnector()

def test_gemini_fetch_success(connector):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Omnia monitors AI search mentions."}]
                },
                "groundingMetadata": {
                    "groundingChunks": [
                        {
                            "web": {
                                "uri": "https://useomnia.com/features",
                                "title": "Omnia Features"
                            }
                        }
                    ]
                }
            }
        ]
    }

    with patch("httpx.Client.post", return_value=mock_response):
        result = connector.fetch("Tell me about Omnia")

    assert result.engine == "gemini"
    assert "Omnia monitors" in result.raw_response_text
    assert len(result.citations) == 1
    assert result.citations[0].url == "https://useomnia.com/features"

def test_gemini_fetch_api_error(connector):
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.text = "Bad Request"

    with patch("httpx.Client.post", return_value=mock_response):
        with pytest.raises(GeminiAPIError) as exc_info:
            connector.fetch("Tell me about Omnia")

    assert "status code 400" in str(exc_info.value)
