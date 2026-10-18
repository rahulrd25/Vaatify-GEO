from typing import List, Dict, Any, Optional
from typesafe_sdk import TypeSafeClient, Noul
from src.geo_tracker.config import load_settings, CompetitorsFileConfig
from src.geo_tracker.connectors.base import NormalizedResponse
from src.geo_tracker.classification.base import BaseClassifier, ClassificationResult
from src.geo_tracker.classification.domain_matcher import match_citations

class JevClassifierError(Exception):
    """Raised when Jev TypeSafe classification API fails."""
    pass

class JevClassifier(BaseClassifier):
    """
    Jev System One Classifier using typesafe-sdk.
    Combines deterministic domain citation matching with atomic Jev Noul mention evaluation.
    """
    def __init__(self, api_key: Optional[str] = None, model: str = "jev-1.13.0"):
        self.api_key = api_key or load_settings().typesafe_api_key
        self.model = model

    def classify(
        self,
        response: NormalizedResponse,
        brand_config: Any,
        competitors_config: CompetitorsFileConfig
    ) -> ClassificationResult:
        # 1. Deterministic Domain Citation Matching (Zero Model Cost)
        citation_urls = [c.url for c in response.citations if c.url]
        citation_matches = match_citations(citation_urls, competitors_config)

        brand_citation = next((m for m in citation_matches if m.is_brand), None)
        brand_cited = brand_citation is not None
        citation_url = brand_citation.url if brand_citation else None

        competitors_cited = [
            {"name": m.name, "url": m.url}
            for m in citation_matches if not m.is_brand
        ]

        # 2. Jev Atomic Noul Mention Detection (Pinned Model Version)
        brand_name = competitors_config.brand.name
        questions: Dict[str, Noul] = {
            "is_brand_mentioned": Noul(
                instructions=f"Does this text mention {brand_name} by name?"
            )
        }

        comp_key_map: Dict[str, str] = {}
        for comp in competitors_config.competitors:
            key = f"is_{comp.name.lower().replace(' ', '_')}_mentioned"
            comp_key_map[key] = comp.name
            questions[key] = Noul(
                instructions=f"Does this text mention {comp.name} by name?"
            )

        try:
            with TypeSafeClient(api_key=self.api_key) as client:
                res = client.system_one(
                    state={"text": response.raw_response_text},
                    questions=questions,
                    model=self.model
                )

                brand_ans = res.answers.get("is_brand_mentioned")
                brand_mentioned = bool(getattr(brand_ans, 'result', False)) if brand_ans else False

                competitors_mentioned: List[str] = []
                for q_key, comp_name in comp_key_map.items():
                    comp_ans = res.answers.get(q_key)
                    if comp_ans and bool(getattr(comp_ans, 'result', False)):
                        competitors_mentioned.append(comp_name)

        except Exception as err:
            # Deterministic regex word-boundary fallback
            import re
            import logging
            logger = logging.getLogger("geo_tracker.classifier")
            logger.warning(f"TypeSafe API unavailable ({err}). Using deterministic keyword matching.")

            raw_text = response.raw_response_text or ""
            brand_mentioned = bool(re.search(rf"\b{re.escape(brand_name)}\b", raw_text, re.IGNORECASE))

            competitors_mentioned: List[str] = []
            for comp in competitors_config.competitors:
                if re.search(rf"\b{re.escape(comp.name)}\b", raw_text, re.IGNORECASE):
                    competitors_mentioned.append(comp.name)

        # 3. Position Ranking, Snippet Extraction & Prominence Scoring
        raw_text = response.raw_response_text or ""
        
        # Position rank calculation
        position_rank: Optional[int] = None
        if brand_citation:
            for idx, c in enumerate(response.citations, start=1):
                if c.url == brand_citation.url:
                    position_rank = idx
                    break
        elif brand_mentioned:
            # Rank based on text appearance order vs competitors
            brand_pos = raw_text.lower().find(brand_name.lower())
            if brand_pos != -1:
                earlier_comps = 0
                for c_name in competitors_mentioned:
                    c_pos = raw_text.lower().find(c_name.lower())
                    if c_pos != -1 and c_pos < brand_pos:
                        earlier_comps += 1
                position_rank = earlier_comps + 1

        # Snippet text extraction
        snippet_text: Optional[str] = None
        if brand_citation:
            for c in response.citations:
                if c.url == brand_citation.url and c.snippet:
                    snippet_text = c.snippet
                    break
        
        if not snippet_text and (brand_mentioned or brand_cited):
            target_kw = brand_name if brand_mentioned else (brand_citation.name if brand_citation else brand_name)
            idx = raw_text.lower().find(target_kw.lower())
            if idx != -1:
                start = max(0, idx - 60)
                end = min(len(raw_text), idx + 140)
                snippet_text = ("..." if start > 0 else "") + raw_text[start:end].strip() + ("..." if end < len(raw_text) else "")

        # Prominence score calculation (0 - 100)
        prominence_score = 0.0
        if brand_cited:
            if position_rank == 1:
                prominence_score = 100.0
            elif position_rank:
                prominence_score = max(50.0, 100.0 - (position_rank - 1) * 15.0)
            else:
                prominence_score = 75.0
        elif brand_mentioned:
            if position_rank == 1:
                prominence_score = 60.0
            else:
                prominence_score = 40.0

        return ClassificationResult(
            brand_mentioned=brand_mentioned,
            brand_cited=brand_cited,
            citation_url=citation_url,
            competitors_mentioned=competitors_mentioned,
            competitors_cited=competitors_cited,
            position_rank=position_rank,
            snippet_text=snippet_text,
            prominence_score=prominence_score
        )
