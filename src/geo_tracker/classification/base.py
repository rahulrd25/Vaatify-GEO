from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CitationMatch(BaseModel):
    name: str
    domain: str
    url: str
    is_brand: bool

class ClassificationResult(BaseModel):
    brand_mentioned: bool
    brand_cited: bool
    citation_url: Optional[str] = None
    competitors_mentioned: List[str] = []
    competitors_cited: List[Dict[str, str]] = []  # list of {"name": ..., "url": ...}
    position_rank: Optional[int] = None
    snippet_text: Optional[str] = None
    prominence_score: float = 0.0

class BaseClassifier(ABC):
    @abstractmethod
    def classify(self, raw_text: str, citations: List[Dict[str, Any]], brand_config: Any, competitors_config: Any) -> ClassificationResult:
        """Classify mentions and citations in normalized response."""
        pass
