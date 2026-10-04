import pytest
from unittest.mock import MagicMock, patch
import httpx
from src.geo_tracker.connectors.claude_search import ClaudeSearchConnector, ClaudeAPIError

@pytest.fixture
def connector(monkeypatch):
    monkeypatch.setenv("PERPLEXITY_API_KEY", "pplx-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test")
    monkeypatch.setenv("TYPESAFE_API_KEY", "ts-test")
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost:5432/testdb")
    return ClaudeSearchConnector()

def test_claude_fetch_success(connector):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "content": [
            {
                "type": "text",
                "text": "Omnia is a leading GEO software platform."
            },
            {
                "type": "tool_result",
                "content": [
                    {"url": "https://useomnia.com", "title": "Omnia Official"}
                ]
            }
        ]
    }

    with patch("httpx.Client.post", return_value=mock_response):
        result = connector.fetch("What is Omnia?")

    assert result.engine == "claude"
    assert "Omnia is a leading" in result.raw_response_text
    assert len(result.citations) == 1
    assert result.citations[0].url == "https://useomnia.com"

def test_claude_fetch_api_error(connector):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized API key"

    with patch("httpx.Client.post", return_value=mock_response):
        with pytest.raises(ClaudeAPIError) as exc_info:
            connector.fetch("What is Omnia?")

    assert "status code 401" in str(exc_info.value)
