"""
Agent Copilot & Autonomous Recommendations Router.
Handles natural language GEO advisory chat, structured proposal generation, and optimization suggestions.
"""
import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.geo_tracker.api.security.api_key import verify_api_or_user_auth
from src.geo_tracker.api.security.rate_limiter import rate_limiter
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.repository import Repository
from src.geo_tracker.storage.models import AgentRecommendationModel, PromptModel, RunModel
from src.geo_tracker.agent.copilot_service import CopilotAgentService, AgentChatRequest
from src.geo_tracker.aggregation.citation_metrics import (
    calculate_overall_citation_rate,
    detect_citation_flips
)
from src.geo_tracker.api.utils.tenant import get_current_user_id, get_user_brand

router = APIRouter(prefix="/api/v1/agent", tags=["Agent Copilot"])

@router.get(
    "/recommendations",
    summary="List Strategic GEO Recommendations",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def list_recommendations(
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Returns AI-generated recommendations to close content gaps and increase citation likelihood."""
    query = session.query(AgentRecommendationModel).outerjoin(PromptModel, AgentRecommendationModel.prompt_id == PromptModel.id)
    if user_id:
        brand_profile_model = get_user_brand(session, user_id)
        brand_id = brand_profile_model.id if brand_profile_model else None

        # Filter out other users' prompt recommendations; allow general recs or tenant's own recs
        query = query.filter(
            (AgentRecommendationModel.prompt_id.is_(None)) |
            (PromptModel.user_id == user_id) |
            (PromptModel.brand_id == brand_id if brand_id else False)
        )

    recs = query.order_by(AgentRecommendationModel.created_at.desc()).all()
    if not recs:
        # Seed initial proactive recommendations if none exist
        default_recs = [
            AgentRecommendationModel(
                recommendation_type="citation_builder",
                title="Add Comparison Schema to Landing Page",
                suggestion_text="Perplexity frequently references structured tabular data. Adding a schema-marked comparison table can increase citation probability by 35%.",
                priority="high",
                status="pending",
                created_at=datetime.datetime.now(datetime.timezone.utc)
            ),
            AgentRecommendationModel(
                recommendation_type="content_gap",
                title="Publish 'Enterprise vs Open-Source' Benchmark",
                suggestion_text="Claude currently references competitors for open-source AI agent questions. An objective benchmark post would win this citation.",
                priority="medium",
                status="pending",
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
        ]
        session.add_all(default_recs)
        session.commit()
        recs = default_recs

    return [
        {
            "id": r.id,
            "prompt_id": r.prompt_id,
            "recommendation_type": r.recommendation_type,
            "title": r.title,
            "suggestion_text": r.suggestion_text,
            "priority": r.priority,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in recs
    ]

@router.post(
    "/chat",
    summary="Agent Copilot Chat & Structured Reasoning",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def agent_chat(
    request: dict,
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Executes conversational Copilot reasoning with prompt injection guardrails and rate limiting."""
    client_id = user_id or "copilot_user"
    rate_limiter.check_rate_limit(client_id=client_id, action="agent_chat", max_requests=30, window_seconds=60)

    # Fetch live context from database strictly for tenant
    brand_profile_model = get_user_brand(session, user_id)
    brand_name = brand_profile_model.name if brand_profile_model else "My Brand"
    brand_domain = brand_profile_model.domain if brand_profile_model else ""
    competitors = [
        {"name": c.name, "domain": c.domain}
        for c in (brand_profile_model.competitors if brand_profile_model else [])
        if c.is_active
    ]
    brand_profile = {
        "brand": {"name": brand_name, "domain": brand_domain},
        "competitors": competitors
    }

    if user_id:
        p_query = session.query(PromptModel).filter(PromptModel.active == True)
        if brand_profile_model:
            p_query = p_query.filter((PromptModel.brand_id == brand_profile_model.id) | (PromptModel.user_id == user_id))
        else:
            p_query = p_query.filter(PromptModel.user_id == user_id)
        active_prompts_models = p_query.all()
        active_prompts = [
            {"id": p.id, "prompt_text": p.prompt_text, "brand": p.brand}
            for p in active_prompts_models
        ]
        p_ids = [p["id"] for p in active_prompts]
        user_runs = session.query(RunModel).filter(RunModel.prompt_id.in_(p_ids)).all() if p_ids else []
    else:
        repo = Repository(session)
        active_prompts = [
            {"id": p.id, "prompt_text": p.prompt_text, "brand": p.brand}
            for p in repo.get_active_prompts()
        ]
        user_runs = repo.get_all_runs()

    metrics = {
        "overall_share_of_voice": round(calculate_overall_citation_rate(user_runs), 2),
        "total_evaluations": len(user_runs),
        "flips_count": len(detect_citation_flips(user_runs))
    }

    chat_req = AgentChatRequest.model_validate(request)
    service = CopilotAgentService()
    res = service.process_chat(
        request=chat_req,
        brand_profile=brand_profile,
        prompts=active_prompts,
        metrics=metrics
    )
    return res.model_dump()
