import httpx
import re
from typing import List, Optional
from src.geo_tracker.config import load_settings
from src.geo_tracker.connectors.base import BaseConnector, NormalizedResponse, Citation

class OpenAIAPIError(Exception):
    """Raised when OpenAI API request fails."""
    pass

class OpenAISearchConnector(BaseConnector):
    """
    Connector for OpenAI ChatGPT (GPT-4o / GPT-4o-mini) API.
    Normalizes responses and extracts inline web citations and references.
    """
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini", timeout: float = 30.0):
        settings = load_settings()
        self.api_key = api_key or getattr(settings, "openai_api_key", None) or "openai-dev-mock-key"
        self.model = model
        self.timeout = timeout
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def fetch(self, prompt_text: str) -> NormalizedResponse:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI assistant providing comprehensive, up-to-date information. When citing sources or products, include full web URLs whenever available."
                },
                {"role": "user", "content": prompt_text}
            ],
            "temperature": 0.2
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.api_url, headers=headers, json=payload)

                if response.status_code != 200:
                    raise OpenAIAPIError(
                        f"OpenAI API call failed with status code {response.status_code}: {response.text}"
                    )

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise OpenAIAPIError("OpenAI API response contains no choices.")

                raw_text = choices[0].get("message", {}).get("content", "")

                # Extract markdown citations and URLs from text response
                citations: List[Citation] = []
                # Matches markdown links [Title](https://...) or raw URLs https://...
                url_matches = re.findall(r'https?://[^\s\)\]<>"\']+', raw_text)
                seen_urls = set()
                for url in url_matches:
                    clean_url = url.rstrip('.,;')
                    if clean_url not in seen_urls:
                        seen_urls.add(clean_url)
                        citations.append(Citation(url=clean_url))

                return NormalizedResponse(
                    engine="chatgpt",
                    raw_response_text=raw_text,
                    citations=citations
                )

        except httpx.HTTPError as err:
            raise OpenAIAPIError(f"Network failure during OpenAI API request: {err}") from err
