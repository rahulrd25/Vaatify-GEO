"""
Target Prompts & Queries Management Router.
Handles prompt creation, active queries listing, and deactivation.
"""
import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.geo_tracker.api.security.api_key import verify_api_or_user_auth
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.repository import Repository
from src.geo_tracker.storage.models import PromptModel
from src.geo_tracker.api.utils.tenant import get_current_user_id, get_user_brand

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
    dependencies=[Depends(verify_api_or_user_auth)]
)
def list_prompts(
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Lists active user-configured search prompts evaluated across AI engines for the tenant."""
    if user_id:
        brand = get_user_brand(session, user_id)
        query = session.query(PromptModel).filter(PromptModel.active == True)
        if brand:
            query = query.filter((PromptModel.brand_id == brand.id) | (PromptModel.user_id == user_id))
        else:
            query = query.filter(PromptModel.user_id == user_id)
        prompts = query.all()
        return [
            PromptResponse(id=p.id, brand=p.brand, prompt_text=p.prompt_text, active=p.active)
            for p in prompts
        ]

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
    dependencies=[Depends(verify_api_or_user_auth)]
)
def add_prompt(
    request: CreatePromptRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Adds a new query to the evaluation queue scoped to the tenant brand."""
    repo = Repository(session)
    brand = get_user_brand(session, user_id)
    brand_name = request.brand or (brand.name if brand else "My Brand")
    brand_id = brand.id if brand else None
    prompt_id = request.id or f"qry_{uuid.uuid4().hex[:12]}"

    existing = repo.get_prompt_by_id(prompt_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prompt with ID '{prompt_id}' already exists."
        )

    prompt = PromptModel(
        id=prompt_id,
        user_id=user_id,
        brand_id=brand_id,
        brand=brand_name,
        prompt_text=request.prompt_text,
        active=request.active
    )
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return PromptResponse(id=prompt.id, brand=prompt.brand, prompt_text=prompt.prompt_text, active=prompt.active)

@router.delete(
    "/{prompt_id}",
    summary="Deactivate Tracked Prompt",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def delete_prompt(
    prompt_id: str,
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Deactivates a tracked prompt without deleting historical run data."""
    repo = Repository(session)
    prompt = repo.get_prompt_by_id(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"Prompt with ID '{prompt_id}' not found.")
    
    if user_id:
        brand = get_user_brand(session, user_id)
        is_owner = (prompt.user_id == user_id) or (brand and prompt.brand_id == brand.id)
        if not is_owner:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to deactivate this prompt.")

    prompt.active = False
    session.commit()
    return {"status": "deactivated", "prompt_id": prompt_id}
