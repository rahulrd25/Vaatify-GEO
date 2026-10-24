"""
User Onboarding & Brand Account Router.
Handles company domain detection from work emails, AI-assisted target query generation,
competitor matrix initialization, and brand account onboarding persistence.
"""
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.models import BrandProfileModel, CompetitorModel, PromptModel, MonitoringScheduleModel
from src.geo_tracker.api.utils.email_domain import extract_brand_from_email
from src.geo_tracker.api.utils.tenant import get_current_user_id
from src.geo_tracker.api.security.rate_limiter import rate_limiter
from src.geo_tracker.agent.copilot_service import CopilotAgentService
from src.geo_tracker.config import is_production

router = APIRouter(prefix="/api/v1/onboarding", tags=["User Onboarding & Brand Setup"])


class CompetitorInput(BaseModel):
    name: str = Field(..., min_length=1)
    domain: str = Field(..., min_length=3)


class SuggestQueriesRequest(BaseModel):
    brand_name: str = Field(..., min_length=1)
    brand_domain: str = Field(..., min_length=3)
    industry: Optional[str] = None


class CompleteOnboardingRequest(BaseModel):
    user_id: Optional[str] = None
    brand_name: str = Field(..., min_length=1)
    brand_domain: str = Field(..., min_length=3)
    industry: Optional[str] = None
    competitors: List[CompetitorInput] = Field(default_factory=list)
    prompts: List[str] = Field(default_factory=list)


@router.get(
    "/parse-email",
    summary="Parse Work Email for Company Domain & Brand Name"
)
def parse_work_email(email: str = Query(..., description="User's work email address")):
    """Extracts registered company domain and inferred brand name from work email."""
    return extract_brand_from_email(email)


@router.post(
    "/suggest-queries",
    summary="Agent Copilot: Generate Target Buyer Queries for Onboarding"
)
def suggest_onboarding_queries(request: SuggestQueriesRequest, req: Request):
    """
    Generates 5-6 high-intent buyer search queries tailored to the brand domain and industry.
    Combines Copilot Agent reasoning with tactical heuristic fallback.
    Protected with IP-level rate limiting to prevent Denial-of-Wallet resource exhaustion.
    """
    client_ip = req.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = req.client.host if req.client else "unknown"

    rate_limiter.check_rate_limit(
        client_id=client_ip,
        action="suggest_queries",
        max_requests=10,
        window_seconds=60
    )

    brand_name = request.brand_name.strip()
    brand_domain = request.brand_domain.strip().lower()
    industry = request.industry or "Software & Services"

    # Tactical heuristic templates based on brand & domain
    base_queries = [
        f"Best {industry.lower().split('/')[0].strip()} alternatives to competitors",
        f"Top rated solutions for {industry.lower().split('/')[0].strip()} in 2026",
        f"How to choose the best enterprise provider for {brand_name.lower()} services",
        f"Fastest and most reliable partners for {industry.lower().split('/')[0].strip()}",
        f"Who are the top market leaders in {industry.lower().split('/')[0].strip()}?",
        f"Objective comparison of top services like {brand_name}"
    ]

    # Attempt AI Copilot prompt generation if available
    try:
        service = CopilotAgentService()
        ai_resp = service.chat(
            message=f"Suggest 5 high commercial intent buyer search queries for brand '{brand_name}' ({brand_domain}) in {industry}. Focus on questions potential buyers ask Perplexity and ChatGPT.",
            brand_profile={"brand": {"name": brand_name, "domain": brand_domain}, "competitors": []},
            prompts=[],
            metrics={}
        )
        if ai_resp.proposals:
            extracted_prompts = [
                p.data.get("prompt_text")
                for p in ai_resp.proposals
                if p.type == "prompt" and p.data.get("prompt_text")
            ]
            if len(extracted_prompts) >= 3:
                return {"suggested_queries": extracted_prompts[:6]}
    except Exception:
        pass

    return {"suggested_queries": base_queries}


@router.get(
    "/status",
    summary="Check User Onboarding & Active Brand Account Status"
)
def get_onboarding_status(
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Checks if the user has an initialized brand account and completed onboarding."""
    if not user_id:
        return {
            "onboarding_completed": False,
            "brand": None
        }

    brand_profile = session.scalar(
        select(BrandProfileModel).where(BrandProfileModel.user_id == user_id)
    )
    
    if not brand_profile:
        return {
            "onboarding_completed": False,
            "brand": None
        }

    return {
        "onboarding_completed": brand_profile.onboarding_completed,
        "brand": {
            "id": brand_profile.id,
            "name": brand_profile.name,
            "domain": brand_profile.domain,
            "industry": brand_profile.industry,
            "user_id": brand_profile.user_id
        }
    }


@router.post(
    "/complete",
    summary="Complete Onboarding & Initialize Brand Account"
)
def complete_onboarding(
    request: CompleteOnboardingRequest,
    current_user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """
    Saves brand profile, competitors, and target buyer queries strictly for the user account.
    Marks onboarding as completed.
    """
    if is_production() and not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to complete onboarding in production."
        )

    if current_user_id and request.user_id and request.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot complete onboarding for another user."
        )

    target_user_id = current_user_id or request.user_id
    if not target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required to complete onboarding."
        )

    # 1. Find or create brand profile strictly for this user
    brand_profile = session.scalar(
        select(BrandProfileModel).where(BrandProfileModel.user_id == target_user_id)
    )

    if not brand_profile:
        brand_profile = BrandProfileModel(
            id=f"brand_{uuid.uuid4().hex[:12]}",
            user_id=target_user_id,
            name=request.brand_name.strip(),
            domain=request.brand_domain.strip().lower(),
            industry=request.industry,
            onboarding_completed=True,
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        session.add(brand_profile)
        session.flush()
    else:
        brand_profile.name = request.brand_name.strip()
        brand_profile.domain = request.brand_domain.strip().lower()
        brand_profile.industry = request.industry or brand_profile.industry
        brand_profile.onboarding_completed = True

    # 2. Sync competitors for this brand
    session.query(CompetitorModel).filter(CompetitorModel.brand_id == brand_profile.id).delete()
    for comp in request.competitors:
        if comp.name.strip() and comp.domain.strip():
            session.add(
                CompetitorModel(
                    id=f"comp_{uuid.uuid4().hex[:12]}",
                    brand_id=brand_profile.id,
                    name=comp.name.strip(),
                    domain=comp.domain.strip().lower(),
                    is_active=True,
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
            )

    # 3. Add target buyer prompts strictly linked to this brand & user
    if request.prompts:
        session.query(PromptModel).filter(PromptModel.brand_id == brand_profile.id).delete()
        for p_text in request.prompts:
            clean_text = p_text.strip()
            if clean_text:
                session.add(
                    PromptModel(
                        id=f"qry_{uuid.uuid4().hex[:12]}",
                        user_id=target_user_id,
                        brand_id=brand_profile.id,
                        brand=brand_profile.name,
                        prompt_text=clean_text,
                        active=True,
                        created_at=datetime.datetime.now(datetime.timezone.utc)
                    )
                )

    # 4. Ensure monitoring schedule exists for this brand & user
    schedule = session.scalar(
        select(MonitoringScheduleModel).where(
            (MonitoringScheduleModel.user_id == target_user_id) | (MonitoringScheduleModel.brand_id == brand_profile.id)
        )
    )
    if not schedule:
        session.add(
            MonitoringScheduleModel(
                id=f"sch_{uuid.uuid4().hex[:12]}",
                user_id=target_user_id,
                brand_id=brand_profile.id,
                brand=brand_profile.name,
                frequency="weekly",
                day_of_week=0,
                hour_utc=9,
                minute_utc=0,
                is_active=True,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
        )

    session.commit()

    return {
        "status": "completed",
        "brand": {
            "id": brand_profile.id,
            "name": brand_profile.name,
            "domain": brand_profile.domain,
            "industry": brand_profile.industry,
            "user_id": brand_profile.user_id,
            "onboarding_completed": True
        }
    }
