"""
Analytics, Share of Voice & Citation Metrics Router.
Calculates real-time Share of Voice (SoV), engine performance, competitor benchmarks, and citation logs.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.geo_tracker.api.security.api_key import verify_api_key
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.repository import Repository
from src.geo_tracker.storage.models import BrandProfileModel, PromptModel, RunModel, DriftAlertModel
from src.geo_tracker.config import load_competitors_config
from src.geo_tracker.aggregation.citation_metrics import (
    calculate_overall_citation_rate,
    calculate_citation_rate_per_engine,
    calculate_citation_rate_per_prompt_and_engine,
    get_top_competitors_by_citation_frequency,
    detect_citation_flips
)

router = APIRouter(prefix="/api/v1", tags=["Analytics & Metrics"])

@router.get(
    "/metrics/overview",
    summary="Get Share of Voice & Citation Metrics",
    dependencies=[Depends(verify_api_key)]
)
def get_metrics_overview(session: Session = Depends(get_db_session)):
    """Computes comprehensive GEO metrics including overall SoV, per-engine breakdown, and competitor rankings."""
    try:
        repo = Repository(session)
        runs = repo.get_all_runs()
        active_prompts = repo.get_active_prompts()
        brand_profile = session.scalar(select(BrandProfileModel))
        brand_name = brand_profile.name if brand_profile else "Vaatify"
    except Exception:
        # Fallback gracefully to SQLite demo database
        try:
            from src.geo_tracker.storage.session import create_session_factory
            fallback_factory = create_session_factory("sqlite:///geo_tracker_demo.db")
            with fallback_factory() as fallback_session:
                fb_repo = Repository(fallback_session)
                runs = fb_repo.get_all_runs()
                active_prompts = fb_repo.get_active_prompts()
                fb_profile = fallback_session.scalar(select(BrandProfileModel))
                brand_name = fb_profile.name if fb_profile else "Vaatify"
        except Exception:
            runs = []
            active_prompts = []
            brand_name = "Vaatify"

    if not runs:
        return {
            "brand_name": brand_name,
            "overall_share_of_voice": 0.0,
            "total_evaluations": 0,
            "active_prompts_count": len(active_prompts),
            "flips_count": 0,
            "per_engine_rates": [],
            "per_prompt_rates": {},
            "competitor_ranking": [],
            "flips": []
        }

    overall_sov = calculate_overall_citation_rate(runs)
    per_engine = calculate_citation_rate_per_engine(runs)
    per_prompt = calculate_citation_rate_per_prompt_and_engine(runs)
    top_competitors = get_top_competitors_by_citation_frequency(runs)
    flips = detect_citation_flips(runs)

    # per_engine already returns List[Dict[str, Any]] matching frontend EngineRateItem
    engine_rates_formatted = per_engine

    # top_competitors already returns List[Dict[str, Any]] with name, citation_count, citation_rate
    competitors_formatted = top_competitors



    return {
        "brand_name": brand_name,
        "overall_share_of_voice": round(overall_sov, 2),
        "total_evaluations": len(runs),
        "active_prompts_count": len(active_prompts),
        "flips_count": len(flips),
        "per_engine_rates": engine_rates_formatted,
        "per_prompt_rates": per_prompt,
        "competitor_ranking": competitors_formatted,
        "flips": flips
    }

@router.get(
    "/runs",
    summary="List Citation Runs with Pagination & Engine Filters",
    dependencies=[Depends(verify_api_key)]
)
def list_runs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    engine: Optional[str] = None,
    session: Session = Depends(get_db_session)
):
    """Returns granular individual citation evaluation logs across AI search engines."""
    query = session.query(RunModel, PromptModel).join(PromptModel, RunModel.prompt_id == PromptModel.id)
    if engine:
        query = query.filter(RunModel.engine == engine)
    query = query.order_by(RunModel.run_timestamp.desc()).offset(offset).limit(limit)

    results = []
    for r, p in query.all():
        results.append({
            "id": r.id,
            "prompt_id": r.prompt_id,
            "prompt_text": p.prompt_text,
            "engine": r.engine,
            "brand_mentioned": r.brand_mentioned,
            "brand_cited": r.brand_cited,
            "citation_url": r.citation_url,
            "competitors_mentioned": r.competitors_mentioned or [],
            "competitors_cited": r.competitors_cited or [],
            "run_timestamp": r.run_timestamp.isoformat() if r.run_timestamp else None,
            "collection_mode": getattr(r, "collection_mode", "api") or "api",
            "position_rank": getattr(r, "position_rank", None),
            "snippet_text": getattr(r, "snippet_text", None),
            "prominence_score": getattr(r, "prominence_score", 0.0) or 0.0
        })
    return results

@router.get(
    "/alerts",
    summary="List Drift Alerts",
    dependencies=[Depends(verify_api_key)]
)
def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    session: Session = Depends(get_db_session)
):
    """Retrieves all citation drift alerts (gained or lost citations against competitors)."""
    query = session.query(DriftAlertModel, PromptModel).join(PromptModel, DriftAlertModel.prompt_id == PromptModel.id)
    if status_filter:
        query = query.filter(DriftAlertModel.status == status_filter)
    query = query.order_by(DriftAlertModel.triggered_at.desc())

    alerts = []
    for a, p in query.all():
        alerts.append({
            "id": a.id,
            "prompt_id": a.prompt_id,
            "prompt_text": p.prompt_text,
            "engine": a.engine,
            "alert_type": a.alert_type,
            "previous_status": a.previous_status,
            "new_status": a.new_status,
            "status": a.status,
            "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None
        })
    return alerts
