import httpx
from typing import List, Optional
from src.geo_tracker.config import load_settings
from src.geo_tracker.connectors.base import BaseConnector, NormalizedResponse, Citation

class PerplexityAPIError(Exception):
    """Raised when Perplexity Sonar API request fails."""
    pass

class PerplexityConnector(BaseConnector):
    """
    Connector for Perplexity Sonar API (https://api.perplexity.ai/chat/completions).
    Extracts raw response text and native citations.
    """
    def __init__(self, api_key: Optional[str] = None, timeout: float = 30.0):
        self.api_key = api_key or load_settings().perplexity_api_key
        self.timeout = timeout
        self.api_url = "https://api.perplexity.ai/chat/completions"

    def fetch(self, prompt_text: str) -> NormalizedResponse:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "sonar",
            "messages": [
                {"role": "user", "content": prompt_text}
            ]
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.api_url, headers=headers, json=payload)
                
                if response.status_code != 200:
                    raise PerplexityAPIError(
                        f"Perplexity API call failed with status code {response.status_code}: {response.text}"
                    )

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise PerplexityAPIError("Perplexity API response contains no choices.")

                raw_text = choices[0].get("message", {}).get("content", "")
                raw_citations = data.get("citations", [])

                citations_list: List[Citation] = [
                    Citation(url=url) for url in raw_citations if isinstance(url, str) and url.strip()
                ]

                return NormalizedResponse(
                    engine="perplexity",
                    raw_response_text=raw_text,
                    citations=citations_list
                )

        except httpx.HTTPError as err:
            raise PerplexityAPIError(f"Network failure during Perplexity API request: {err}") from err
