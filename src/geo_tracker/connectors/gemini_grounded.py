import httpx
from typing import List, Optional
from src.geo_tracker.config import load_settings
from src.geo_tracker.connectors.base import BaseConnector, NormalizedResponse, Citation

class GeminiAPIError(Exception):
    """Raised when Google Gemini Grounded Search API request fails."""
    pass

class GeminiGroundedConnector(BaseConnector):
    """
    Connector for Google Gemini API with Google Search Grounding.
    Parses response text and grounding metadata citations.
    """
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-3.8-flash", timeout: float = 30.0):
        self.api_key = api_key or load_settings().gemini_api_key
        self.model = model
        self.timeout = timeout
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    def fetch(self, prompt_text: str) -> NormalizedResponse:
        headers = {
            "Content-Type": "application/json"
        }
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt_text}]
                }
            ],
            "tools": [
                {
                    "google_search": {}
                }
            ]
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.api_url, headers=headers, json=payload)
                
                if response.status_code != 200:
                    raise GeminiAPIError(
                        f"Gemini API call failed with status code {response.status_code}: {response.text}"
                    )

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    raise GeminiAPIError("Gemini API response contains no candidates.")

                candidate = candidates[0]
                content = candidate.get("content", {})
                parts = content.get("parts", [])
                raw_text = "".join(part.get("text", "") for part in parts)

                # Extract grounding metadata citations
                citations: List[Citation] = []
                grounding_metadata = candidate.get("groundingMetadata", {})
                grounding_chunks = grounding_metadata.get("groundingChunks", [])

                for chunk in grounding_chunks:
                    web = chunk.get("web", {})
                    uri = web.get("uri")
                    title = web.get("title")
                    if uri:
                        citations.append(Citation(url=uri, title=title))

                return NormalizedResponse(
                    engine="gemini",
                    raw_response_text=raw_text,
                    citations=citations
                )

        except httpx.HTTPError as err:
            raise GeminiAPIError(f"Network failure during Gemini API request: {err}") from err
