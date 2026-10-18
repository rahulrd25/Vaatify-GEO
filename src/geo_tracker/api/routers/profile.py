"""
Brand Profile & Competitor Matrix Router.
Handles active brand profile querying, domain target configuration, and competitor benchmark syncing.
"""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.geo_tracker.api.security.api_key import verify_api_key
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.models import BrandProfileModel, CompetitorModel, PromptModel
from src.geo_tracker.config import BrandConfig, CompetitorConfig
from src.geo_tracker.api.utils.tenant import get_current_user_id, get_user_brand
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/profile", tags=["Brand Profile & Competitors"])

class ProfileUpdateRequest(BaseModel):
    brand: BrandConfig
    competitors: list[CompetitorConfig]

@router.get(
    "",
    summary="Get Active Brand Profile & Competitors",
    dependencies=[Depends(verify_api_key)]
)
def get_brand_profile(
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Fetches the active primary brand identity and all benchmarked competitor domains for the tenant."""
    brand_profile = get_user_brand(session, user_id)
    if brand_profile:
        return {
            "brand": {
                "name": brand_profile.name,
                "domain": brand_profile.domain,
            },
            "competitors": [
                {"name": c.name, "domain": c.domain}
                for c in brand_profile.competitors
                if c.is_active
            ]
        }
    return {
        "brand": {
            "name": "",
            "domain": "",
        },
        "competitors": []
    }

@router.put(
    "",
    summary="Update Brand Profile & Competitors",
    dependencies=[Depends(verify_api_key)]
)
def update_brand_profile(
    request: ProfileUpdateRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Updates target brand name, domain, and competitor matrix in database for this tenant."""
    brand_profile = get_user_brand(session, user_id)
    if not brand_profile:
        brand_profile = BrandProfileModel(
            user_id=user_id,
            name=request.brand.name,
            domain=request.brand.domain,
            onboarding_completed=True
        )
        session.add(brand_profile)
        session.flush()
    else:
        brand_profile.name = request.brand.name
        brand_profile.domain = request.brand.domain

    # Update Competitors (replace active set for this brand)
    session.query(CompetitorModel).filter(CompetitorModel.brand_id == brand_profile.id).delete()
    for comp in request.competitors:
        session.add(
            CompetitorModel(
                brand_id=brand_profile.id,
                name=comp.name,
                domain=comp.domain,
                is_active=True,
            )
        )

    # Sync prompts brand name for this brand
    for p in session.query(PromptModel).filter(PromptModel.brand_id == brand_profile.id):
        p.brand = request.brand.name
    session.commit()

    data = {
        "brand": request.brand.model_dump(),
        "competitors": [c.model_dump() for c in request.competitors]
    }
    return {"status": "updated", "profile": data}
