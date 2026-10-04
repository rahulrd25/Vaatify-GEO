import httpx
from typing import List, Optional
from src.geo_tracker.config import load_settings
from src.geo_tracker.connectors.base import BaseConnector, NormalizedResponse, Citation

class ClaudeAPIError(Exception):
    """Raised when Anthropic Claude Search API request fails."""
    pass

class ClaudeSearchConnector(BaseConnector):
    """
    Connector for Anthropic Claude API with Web Search tool enabled.
    Extracts text response and web search citations.
    """
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-haiku-20241022", timeout: float = 30.0):
        self.api_key = api_key or load_settings().anthropic_api_key
        self.model = model
        self.timeout = timeout
        self.api_url = "https://api.anthropic.com/v1/messages"

    def fetch(self, prompt_text: str) -> NormalizedResponse:
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "tools": [
                {
                    "name": "web_search",
                    "description": "Perform web search to ground response with real-time sources."
                }
            ],
            "messages": [
                {"role": "user", "content": prompt_text}
            ]
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.api_url, headers=headers, json=payload)
                
                if response.status_code != 200:
                    raise ClaudeAPIError(
                        f"Claude API call failed with status code {response.status_code}: {response.text}"
                    )

                data = response.json()
                content_blocks = data.get("content", [])
                
                text_parts: List[str] = []
                citations: List[Citation] = []

                for block in content_blocks:
                    if block.get("type") == "text":
                        text_parts.append(block.get("text", ""))
                    elif block.get("type") == "tool_use" and block.get("name") == "web_search":
                        # Process tool search inputs/results if present
                        pass
                    elif block.get("type") == "tool_result":
                        # Extract search citations from tool_result block
                        results = block.get("content", [])
                        if isinstance(results, list):
                            for res in results:
                                if isinstance(res, dict) and "url" in res:
                                    citations.append(Citation(url=res["url"], title=res.get("title")))

                # Also check top-level annotations or metadata for citations
                for block in content_blocks:
                    for citation in block.get("citations", []):
                        if isinstance(citation, dict) and "url" in citation:
                            citations.append(Citation(url=citation["url"], title=citation.get("title")))

                raw_text = "\n".join(text_parts)

                return NormalizedResponse(
                    engine="claude",
                    raw_response_text=raw_text,
                    citations=citations
                )

        except httpx.HTTPError as err:
            raise ClaudeAPIError(f"Network failure during Claude API request: {err}") from err
