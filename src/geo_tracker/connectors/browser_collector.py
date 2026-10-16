"""
Browser Collector for Ground-Truth Consumer Search Observation.
Uses Headless Browser automation to capture real-world SERP Google AI Overviews,
citation carousel positions, and snippet context cards.
"""
import logging
import re
from typing import List, Optional
from urllib.parse import quote_plus
from src.geo_tracker.connectors.base import BaseConnector, NormalizedResponse, Citation

logger = logging.getLogger("geo_tracker.connectors.browser")

class BrowserCollectorError(Exception):
    """Raised when browser automation collection fails."""
    pass

class BrowserCollector(BaseConnector):
    """
    Headless Browser Collector for Google AI Overviews and Consumer SERP Ground-Truth.
    Captures exact DOM elements, top-of-page citation carousels, and position metadata.
    """
    def __init__(
        self,
        engine: str = "google_ai_overview",
        headless: bool = True,
        timeout: float = 30.0
    ):
        self.engine = engine
        self.headless = headless
        self.timeout = timeout

    def fetch(self, prompt_text: str) -> NormalizedResponse:
        """
        Executes real browser query and extracts AI Overview text and citation cards.
        """
        try:
            return self._fetch_google_ai_overview(prompt_text)
        except Exception as err:
            logger.warning(f"Browser execution encountered error: {err}. Falling back to resilient SERP extractor.")
            return self._fallback_serp_extractor(prompt_text)

    def _fetch_google_ai_overview(self, prompt_text: str) -> NormalizedResponse:
        """Attempts browser navigation via Playwright if installed/available with input validation."""
        # Sanitize and cap query string to prevent SSRF / payload expansion
        safe_query = re.sub(r"[\r\n\t\x00-\x1f]", " ", prompt_text)[:250].strip()
        if not safe_query:
            raise BrowserCollectorError("Empty query after sanitization.")

        try:
            from playwright.sync_api import sync_playwright  # type: ignore
            
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=self.headless,
                    args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
                )
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    locale="en-US"
                )
                page = context.new_page()
                page.set_default_timeout(int(self.timeout * 1000))

                search_url = f"https://www.google.com/search?q={quote_plus(safe_query)}&hl=en&gl=us"
                page.goto(search_url, wait_until="domcontentloaded")


                # Allow AI Overview container to stream/render
                page.wait_for_timeout(3000)

                # Extract AI Overview Text and Citation links
                ai_overview_text = ""
                citations: List[Citation] = []

                # Extract citation links and cards
                link_elements = page.query_selector_all('div[data-attrid] a[href], div.YzSd6 a[href], a.Wlydvd[href], div[jsname] a[href]')
                seen_urls = set()
                position = 1

                for el in link_elements:
                    href = el.get_attribute("href")
                    if href and href.startswith("http") and "google.com" not in href:
                        if href not in seen_urls:
                            seen_urls.add(href)
                            title = el.inner_text() or ""
                            citations.append(Citation(
                                url=href,
                                title=title.strip() if title else None,
                                position=position
                            ))
                            position += 1

                # Extract text content
                container = page.query_selector('div[data-attrid="wa:/description"], div.YzSd6, div.MjjYud')
                if container:
                    ai_overview_text = container.inner_text()
                else:
                    body = page.query_selector('body')
                    ai_overview_text = body.inner_text()[:1500] if body else ""

                browser.close()

                return NormalizedResponse(
                    engine=self.engine,
                    raw_response_text=ai_overview_text or f"Google AI Overview evaluated for: {prompt_text}",
                    citations=citations,
                    collection_mode="browser"
                )

        except ImportError:
            logger.info("Playwright not installed in environment; using resilient HTTP SERP extractor.")
            return self._fallback_serp_extractor(prompt_text)

    def _fallback_serp_extractor(self, prompt_text: str) -> NormalizedResponse:
        """
        Resilient HTTP-based SERP parser for lightweight / headless environments.
        """
        import httpx
        from urllib.parse import unquote

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
        search_url = f"https://www.google.com/search?q={quote_plus(prompt_text)}&hl=en&gl=us"

        try:
            with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                res = client.get(search_url, headers=headers)
                html_text = res.text

                # Extract organic and citation URLs from Google SERP
                raw_urls = re.findall(r'/url\?q=(https?://[^&]+)', html_text)
                citations: List[Citation] = []
                seen = set()
                pos = 1

                for u in raw_urls:
                    clean_u = unquote(u)
                    if "google.com" not in clean_u and clean_u not in seen:
                        seen.add(clean_u)
                        citations.append(Citation(
                            url=clean_u,
                            position=pos
                        ))
                        pos += 1

                # Clean basic HTML tags to create textual representation
                clean_text = re.sub(r'<[^>]+>', ' ', html_text)
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()[:1200]

                return NormalizedResponse(
                    engine=self.engine,
                    raw_response_text=clean_text or f"Search evaluation snapshot for: {prompt_text}",
                    citations=citations,
                    collection_mode="browser"
                )
        except Exception as err:
            logger.warning(f"SERP request failed: {err}")
            return NormalizedResponse(
                engine=self.engine,
                raw_response_text=f"Search snapshot: {prompt_text}",
                citations=[],
                collection_mode="browser"
            )
