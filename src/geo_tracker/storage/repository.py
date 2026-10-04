from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from src.geo_tracker.storage.models import PromptModel, RunModel

class Repository:
    def __init__(self, session: Session):
        self.session = session

    def add_prompt(self, prompt_id: str, brand: str, prompt_text: str, active: bool = True) -> PromptModel:
        prompt = PromptModel(
            id=prompt_id,
            brand=brand,
            prompt_text=prompt_text,
            active=active,
            created_at=datetime.now(timezone.utc)
        )
        self.session.add(prompt)
        self.session.commit()
        self.session.refresh(prompt)
        return prompt

    def get_active_prompts(self) -> List[PromptModel]:
        return self.session.query(PromptModel).filter(PromptModel.active == True).all()

    def get_prompt_by_id(self, prompt_id: str) -> Optional[PromptModel]:
        return self.session.query(PromptModel).filter(PromptModel.id == prompt_id).first()

    def save_run(
        self,
        prompt_id: str,
        engine: str,
        raw_response_text: str,
        brand_mentioned: bool,
        brand_cited: bool,
        citation_url: Optional[str] = None,
        competitors_mentioned: Optional[List[str]] = None,
        competitors_cited: Optional[List[dict]] = None,
        run_timestamp: Optional[datetime] = None,
        collection_mode: str = "api",
        position_rank: Optional[int] = None,
        snippet_text: Optional[str] = None,
        prominence_score: Optional[float] = 0.0
    ) -> RunModel:
        run = RunModel(
            prompt_id=prompt_id,
            engine=engine,
            raw_response_text=raw_response_text,
            brand_mentioned=brand_mentioned,
            brand_cited=brand_cited,
            citation_url=citation_url,
            competitors_mentioned=competitors_mentioned or [],
            competitors_cited=competitors_cited or [],
            run_timestamp=run_timestamp or datetime.now(timezone.utc),
            collection_mode=collection_mode,
            position_rank=position_rank,
            snippet_text=snippet_text,
            prominence_score=prominence_score or 0.0
        )
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run

    def get_runs_for_prompt(
        self,
        prompt_id: str,
        since_date: Optional[datetime] = None
    ) -> List[RunModel]:
        query = self.session.query(RunModel).filter(RunModel.prompt_id == prompt_id)
        if since_date:
            query = query.filter(RunModel.run_timestamp >= since_date)
        return query.order_by(RunModel.run_timestamp.asc()).all()

    def get_all_runs(self, limit: int = 100) -> List[RunModel]:
        return self.session.query(RunModel).order_by(RunModel.run_timestamp.desc()).limit(limit).all()

