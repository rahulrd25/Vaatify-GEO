import pytest
from unittest.mock import MagicMock, patch
import httpx
from src.geo_tracker.connectors.openai_search import OpenAISearchConnector, OpenAIAPIError

@pytest.fixture
def connector(monkeypatch):
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-test-key")
    return OpenAISearchConnector()

def test_openai_fetch_success(connector):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "For top CRM software, [Acme](https://acme.com) is a leading SaaS platform. You can also explore https://salesforce.com for alternatives."
                }
            }
        ]
    }

    with patch("httpx.Client.post", return_value=mock_response):
        result = connector.fetch("Best CRM software for SaaS teams?")

    assert result.engine == "chatgpt"
    assert "Acme" in result.raw_response_text
    assert len(result.citations) == 2
    assert "https://acme.com" in [c.url for c in result.citations]
    assert "https://salesforce.com" in [c.url for c in result.citations]

def test_openai_fetch_api_error(connector):
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.text = "Rate limit exceeded"

    with patch("httpx.Client.post", return_value=mock_response):
        with pytest.raises(OpenAIAPIError) as exc_info:
            connector.fetch("Best AI MVP development agencies?")

    assert "status code 429" in str(exc_info.value)

def test_openai_fetch_network_error(connector):
    with patch("httpx.Client.post", side_effect=httpx.ConnectError("Network timeout")):
        with pytest.raises(OpenAIAPIError) as exc_info:
            connector.fetch("Best AI MVP development agencies?")

    assert "Network failure" in str(exc_info.value)
