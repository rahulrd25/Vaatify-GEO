from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel

class Citation(BaseModel):
    url: str
    title: Optional[str] = None
    snippet: Optional[str] = None
    position: Optional[int] = None

class NormalizedResponse(BaseModel):
    engine: str
    raw_response_text: str
    citations: List[Citation] = []
    collection_mode: str = "api"

class BaseConnector(ABC):
    @abstractmethod
    def fetch(self, prompt_text: str) -> NormalizedResponse:
        """
        Fetches response from search engine API and normalizes it to a common schema.
        """
        pass
