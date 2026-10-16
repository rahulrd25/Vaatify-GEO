"""
Target Prompts & Queries Management Router.
Handles prompt creation, active queries listing, and deactivation.
"""
import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.geo_tracker.api.security.api_key import verify_api_key
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.repository import Repository
from src.geo_tracker.config import load_competitors_config

router = APIRouter(prefix="/api/v1/prompts", tags=["Prompt Management"])

class CreatePromptRequest(BaseModel):
    id: Optional[str] = None
    brand: Optional[str] = None
    prompt_text: str
    active: bool = True

class PromptResponse(BaseModel):
    id: str
    brand: str
    prompt_text: str
    active: bool

@router.get(
    "",
    response_model=List[PromptResponse],
    summary="List Tracked Prompts",
    dependencies=[Depends(verify_api_key)]
)
def list_prompts(session: Session = Depends(get_db_session)):
    """Lists all active user-configured search prompts evaluated across AI engines."""
    repo = Repository(session)
    prompts = repo.get_active_prompts()
    return [
        PromptResponse(id=p.id, brand=p.brand, prompt_text=p.prompt_text, active=p.active)
        for p in prompts
    ]

@router.post(
    "",
    response_model=PromptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add New Tracked Prompt",
    dependencies=[Depends(verify_api_key)]
)
def add_prompt(request: CreatePromptRequest, session: Session = Depends(get_db_session)):
    """Adds a new query to the evaluation queue."""
    repo = Repository(session)
    brand_config = load_competitors_config()
    brand_name = request.brand or brand_config.brand.name or "Vaatify"
    prompt_id = request.id or f"qry_{uuid.uuid4().hex[:12]}"

    existing = repo.get_prompt_by_id(prompt_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prompt with ID '{prompt_id}' already exists."
        )
    created = repo.add_prompt(
        prompt_id=prompt_id,
        brand=brand_name,
        prompt_text=request.prompt_text,
        active=request.active
    )
    return PromptResponse(id=created.id, brand=created.brand, prompt_text=created.prompt_text, active=created.active)

@router.delete(
    "/{prompt_id}",
    summary="Deactivate Tracked Prompt",
    dependencies=[Depends(verify_api_key)]
)
def delete_prompt(prompt_id: str, session: Session = Depends(get_db_session)):
    """Deactivates a tracked prompt without deleting historical run data."""
    repo = Repository(session)
    prompt = repo.get_prompt_by_id(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"Prompt with ID '{prompt_id}' not found.")
    prompt.active = False
    session.commit()
    return {"status": "deactivated", "prompt_id": prompt_id}
