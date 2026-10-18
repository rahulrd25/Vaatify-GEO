import pytest
from unittest.mock import MagicMock, patch
from src.geo_tracker.connectors.browser_collector import BrowserCollector

@pytest.fixture
def browser_collector():
    return BrowserCollector(engine="google_ai_overview", headless=True)

def test_browser_collector_fallback_serp(browser_collector):
    mock_html = """
    <html>
      <body>
        <div class="MjjYud">
          AI Overview: For scaling customer success, Acme provides top CRM automation.
        </div>
        <a href="/url?q=https://acme.com/pricing&sa=U">Acme Pricing</a>
        <a href="/url?q=https://hubspot.com/services&sa=U">HubSpot Services</a>
      </body>
    </html>
    """
    mock_resp = MagicMock()
    mock_resp.text = mock_html
    mock_resp.status_code = 200

    with patch("httpx.Client.get", return_value=mock_resp):
        result = browser_collector._fallback_serp_extractor("Best CRM software for SaaS")

    assert result.engine == "google_ai_overview"
    assert result.collection_mode == "browser"
    assert len(result.citations) >= 2
    assert "https://acme.com/pricing" in [c.url for c in result.citations]
    assert result.citations[0].position == 1

def test_browser_collector_playwright_extraction(browser_collector):
    mock_element = MagicMock()
    mock_element.get_attribute.return_value = "https://acme.com"
    mock_element.inner_text.return_value = "Acme SaaS CRM"

    mock_container = MagicMock()
    mock_container.inner_text.return_value = "Google AI Overview: Top SaaS CRM platforms include Acme and HubSpot."

    mock_page = MagicMock()
    mock_page.query_selector_all.return_value = [mock_element]
    mock_page.query_selector.return_value = mock_container

    mock_context = MagicMock()
    mock_context.new_page.return_value = mock_page

    mock_browser = MagicMock()
    mock_browser.new_context.return_value = mock_context

    mock_playwright = MagicMock()
    mock_playwright.chromium.launch.return_value = mock_browser

    mock_sync_api = MagicMock()
    mock_sync_api.sync_playwright.return_value.__enter__.return_value = mock_playwright

    with patch.dict("sys.modules", {"playwright": MagicMock(), "playwright.sync_api": mock_sync_api}):
        result = browser_collector._fetch_google_ai_overview("Best CRM software for SaaS")

    assert result.engine == "google_ai_overview"
    assert result.collection_mode == "browser"
    assert len(result.citations) == 1
    assert result.citations[0].url == "https://acme.com"
    assert result.citations[0].position == 1
    assert "Acme" in result.raw_response_text
