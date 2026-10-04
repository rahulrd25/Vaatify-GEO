from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.geo_tracker.api.security.api_key import verify_api_key
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.repository import Repository
from src.geo_tracker.runner import run_pipeline
from src.geo_tracker.aggregation.citation_metrics import (
    calculate_overall_citation_rate,
    calculate_citation_rate_per_engine,
    calculate_citation_rate_per_prompt_and_engine,
    get_top_competitors_by_citation_frequency,
    detect_citation_flips
)

from src.geo_tracker.reporting.weekly_report import generate_weekly_report

router = APIRouter()

import uuid
import yaml
from pathlib import Path
from src.geo_tracker.config import load_competitors_config, CompetitorsFileConfig, BrandConfig, CompetitorConfig

# --- Request / Response Schemas ---
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

class ProfileUpdateRequest(BaseModel):
    brand: BrandConfig
    competitors: list[CompetitorConfig]

class RunPipelineRequest(BaseModel):
    mock_external_calls: bool = True

class ScheduleUpdateRequest(BaseModel):
    frequency: str = "weekly"  # "weekly", "daily", "off"
    day_of_week: int = 0  # 0 = Monday ... 6 = Sunday
    hour_utc: int = 9  # 0-23
    minute_utc: int = 0  # 0-59
    is_active: bool = True

class ScheduleResponse(BaseModel):
    id: str
    brand: str
    frequency: str
    day_of_week: int
    hour_utc: int
    minute_utc: int
    is_active: bool
    last_run_at: Optional[str] = None
    next_run_at: Optional[str] = None
    last_run_status: Optional[str] = None

# --- System Routes (Unprotected) ---
@router.get("/health", tags=["System"], summary="Health Check")
def health_check():
    """Unprotected health probe for readiness checks and load balancers."""
    return {"status": "ok", "service": "vaatify-geo-engine"}

# --- Vaatify GEO Routes (Protected via X-API-Key) ---
@router.get(
    "/api/v1/status",
    tags=["Vaatify GEO"],
    summary="Protected Status Check",
    dependencies=[Depends(verify_api_key)]
)
def tracker_status():
    return {
        "status": "active",
        "authenticated": True,
        "message": "Vaatify GEO Engine API is ready."
    }


@router.get(
    "/api/v1/profile",
    tags=["Brand Profile & Competitors"],
    summary="Get Active Brand Profile & Competitors",
    dependencies=[Depends(verify_api_key)]
)
def get_brand_profile(session: Session = Depends(get_db_session)):
    from src.geo_tracker.storage.models import BrandProfileModel
    from sqlalchemy import select
    brand_profile = session.scalar(select(BrandProfileModel))
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
    config = load_competitors_config()
    return config.model_dump()

@router.put(
    "/api/v1/profile",
    tags=["Brand Profile & Competitors"],
    summary="Update Brand Profile & Competitors",
    dependencies=[Depends(verify_api_key)]
)
def update_brand_profile(request: ProfileUpdateRequest, session: Session = Depends(get_db_session)):
    from src.geo_tracker.storage.models import BrandProfileModel, CompetitorModel
    from sqlalchemy import select

    # Update or insert into Supabase DB
    brand_profile = session.scalar(select(BrandProfileModel))
    if not brand_profile:
        brand_profile = BrandProfileModel(
            id=str(uuid.uuid4()),
            name=request.brand.name,
            domain=request.brand.domain,
        )
        session.add(brand_profile)
        session.flush()
    else:
        brand_profile.name = request.brand.name
        brand_profile.domain = request.brand.domain

    # Update competitors
    brand_profile.competitors.clear()
    for c in request.competitors:
        brand_profile.competitors.append(
            CompetitorModel(
                id=str(uuid.uuid4()),
                brand_id=brand_profile.id,
                name=c.name,
                domain=c.domain,
                is_active=True
            )
        )

    # Sync active prompts brand in DB
    repo = Repository(session)
    for p in repo.get_active_prompts():
        p.brand = request.brand.name
    session.commit()

    # Sync local yaml config
    config_path = Path("config/competitors.yaml")
    data = {
        "brand": request.brand.model_dump(),
        "competitors": [c.model_dump() for c in request.competitors]
    }
    with open(config_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False)

    return {"status": "updated", "profile": data}


@router.get(
    "/api/v1/prompts",
    response_model=List[PromptResponse],
    tags=["Prompt Management"],
    summary="List Tracked Prompts",
    dependencies=[Depends(verify_api_key)]
)
def list_prompts(session: Session = Depends(get_db_session)):
    repo = Repository(session)
    prompts = repo.get_active_prompts()
    return [
        PromptResponse(id=p.id, brand=p.brand, prompt_text=p.prompt_text, active=p.active)
        for p in prompts
    ]

@router.post(
    "/api/v1/prompts",
    response_model=PromptResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Prompt Management"],
    summary="Add New Tracked Prompt",
    dependencies=[Depends(verify_api_key)]
)
def add_prompt(request: CreatePromptRequest, session: Session = Depends(get_db_session)):
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
    "/api/v1/prompts/{prompt_id}",
    tags=["Prompt Management"],
    summary="Deactivate Tracked Prompt",
    dependencies=[Depends(verify_api_key)]
)
def delete_prompt(prompt_id: str, session: Session = Depends(get_db_session)):
    repo = Repository(session)
    prompt = repo.get_prompt_by_id(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"Prompt with ID '{prompt_id}' not found.")
    prompt.active = False
    session.commit()
    return {"status": "deactivated", "prompt_id": prompt_id}

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from datetime import datetime, timezone

pipeline_state = {
    "is_running": False,
    "last_run_at": None,
    "last_runs_count": 0,
    "mode": "hybrid",
    "error": None
}

def run_pipeline_task(mode: str = "hybrid"):
    global pipeline_state
    pipeline_state["is_running"] = True
    pipeline_state["mode"] = mode
    pipeline_state["error"] = None
    try:
        config = load_competitors_config()
        brand_name = config.brand.name or "Vaatify"
        runs = run_pipeline(mode=mode)
        pipeline_state["last_runs_count"] = len(runs)
        pipeline_state["last_run_at"] = datetime.now(timezone.utc).isoformat()
        generate_weekly_report(runs, output_file_path="weekly_report.md", brand_name=brand_name)
    except Exception as e:
        pipeline_state["error"] = str(e)
        import logging
        logging.getLogger("geo_tracker.api").error(f"Background pipeline task error: {e}", exc_info=True)
    finally:
        pipeline_state["is_running"] = False

@router.get(
    "/api/v1/pipeline/status",
    tags=["Pipeline Execution"],
    summary="Get Pipeline Execution Status",
    dependencies=[Depends(verify_api_key)]
)
def get_pipeline_status():
    """Returns current execution state of background pipeline tasks."""
    return pipeline_state

@router.post(
    "/api/v1/pipeline/run",
    tags=["Pipeline Execution"],
    summary="Trigger Pipeline Evaluation Run",
    dependencies=[Depends(verify_api_key)]
)
def trigger_pipeline_run(
    background_tasks: BackgroundTasks,
    mode: str = "hybrid",
    session: Session = Depends(get_db_session)
):
    """Executes the pipeline runner in background and updates metrics."""
    background_tasks.add_task(run_pipeline_task, mode=mode)
    return {
        "status": "started",
        "mode": mode,
        "message": "Evaluation pipeline started in background. Results will appear live as they complete."
    }

@router.get(
    "/api/v1/metrics/overview",
    tags=["Analytics & Metrics"],
    summary="Get Share of Voice & Citation Metrics",
    dependencies=[Depends(verify_api_key)]
)
def get_metrics_overview(session: Session = Depends(get_db_session)):
    from src.geo_tracker.storage.models import BrandProfileModel
    from sqlalchemy import select
    repo = Repository(session)
    prompts = repo.get_active_prompts()
    
    brand_profile = session.scalar(select(BrandProfileModel))
    brand_name = brand_profile.name if brand_profile else "Vaatify"
    
    runs = []
    for p in prompts:
        runs.extend(repo.get_runs_for_prompt(p.id))

    overall_sov = calculate_overall_citation_rate(runs)
    per_engine_rates = calculate_citation_rate_per_engine(runs)
    per_prompt_rates = calculate_citation_rate_per_prompt_and_engine(runs)
    competitor_ranking = get_top_competitors_by_citation_frequency(runs)
    flips = detect_citation_flips(runs)

    return {
        "brand_name": brand_name,
        "overall_share_of_voice": overall_sov,
        "total_evaluations": len(runs),
        "active_prompts_count": len(prompts),
        "flips_count": len(flips),

        "per_engine_rates": per_engine_rates,
        "per_prompt_rates": per_prompt_rates,
        "competitor_ranking": competitor_ranking,
        "flips": flips
    }

@router.get(
    "/api/v1/runs",
    tags=["Analytics & Metrics"],
    summary="Get Recent Search Evaluation Runs",
    dependencies=[Depends(verify_api_key)]
)
def get_runs(limit: int = 50, session: Session = Depends(get_db_session)):
    repo = Repository(session)
    runs = repo.get_all_runs(limit=limit)
    
    # Pre-map prompts for prompt_text lookup
    prompt_map = {p.id: p.prompt_text for p in repo.get_active_prompts()}
    
    result = []
    for r in runs:
        prompt_text = prompt_map.get(r.prompt_id, r.prompt.prompt_text if r.prompt else "")
        result.append({
            "id": r.id,
            "prompt_id": r.prompt_id,
            "prompt_text": prompt_text,
            "engine": r.engine,
            "brand_mentioned": r.brand_mentioned,
            "brand_cited": r.brand_cited,
            "citation_url": r.citation_url,
            "competitors_mentioned": r.competitors_mentioned or [],
            "competitors_cited": r.competitors_cited or [],
            "run_timestamp": r.run_timestamp.isoformat() if r.run_timestamp else None,
            "collection_mode": getattr(r, "collection_mode", "api"),
            "position_rank": getattr(r, "position_rank", None),
            "snippet_text": getattr(r, "snippet_text", None),
            "prominence_score": getattr(r, "prominence_score", 0.0)
        })
    return result


@router.get(
    "/api/v1/reports/weekly",
    tags=["Analytics & Metrics"],
    summary="Get Latest Markdown Weekly Report",
    dependencies=[Depends(verify_api_key)]
)
def get_weekly_report():
    try:
        with open("weekly_report.md", "r", encoding="utf-8") as f:
            content = f.read()
        return {"report_markdown": content}
    except FileNotFoundError:
        return {"report_markdown": "# Weekly Report Not Generated Yet\nRun pipeline to generate initial report."}

@router.get(
    "/api/v1/alerts",
    tags=["Citation Drift & Alerts"],
    summary="Get Stored Citation Drift Alerts",
    dependencies=[Depends(verify_api_key)]
)
def get_alerts(limit: int = 50, session: Session = Depends(get_db_session)):
    from src.geo_tracker.storage.models import DriftAlertModel
    from sqlalchemy import select, desc
    alerts = session.scalars(
        select(DriftAlertModel).order_by(desc(DriftAlertModel.triggered_at)).limit(limit)
    ).all()
    return [
        {
            "id": a.id,
            "prompt_id": a.prompt_id,
            "engine": a.engine,
            "alert_type": a.alert_type,
            "previous_status": a.previous_status,
            "new_status": a.new_status,
            "status": a.status,
            "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None
        }
        for a in alerts
    ]

@router.get(
    "/api/v1/recommendations",
    tags=["Agent Recommendations"],
    summary="Get Agent GEO Action Recommendations",
    dependencies=[Depends(verify_api_key)]
)
def get_recommendations(session: Session = Depends(get_db_session)):
    from src.geo_tracker.storage.models import AgentRecommendationModel
    from sqlalchemy import select, desc
    recs = session.scalars(
        select(AgentRecommendationModel).order_by(desc(AgentRecommendationModel.created_at))
    ).all()
    if not recs:
        # Generate default starter recommendations
        import datetime
        default_recs = [
            AgentRecommendationModel(
                id=str(uuid.uuid4()),
                prompt_id="p-002",
                recommendation_type="content_gap",
                title="Publish Head-to-Head Comparison Page for Omnia vs Vaatify",
                suggestion_text="Claude currently references useomnia.com over vaatify.com for brand citation comparison queries. Creating a dedicated /vs/omnia landing page with clear feature comparison tables will capture direct entity citations.",
                priority="high",
                status="pending",
                created_at=datetime.datetime.now(datetime.timezone.utc)
            ),
            AgentRecommendationModel(
                id=str(uuid.uuid4()),
                prompt_id="p-001",
                recommendation_type="schema_markup",
                title="Add SoftwareApplication JSON-LD Schema to Resource Hub",
                suggestion_text="Perplexity uses structured schema to extract vendor capabilities. Embedding SoftwareApplication & FAQPage schema on vaatify.com/resources will increase citation confidence from 66% to 95%.",
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
    "/api/v1/agent/chat",
    tags=["Agent Copilot"],
    summary="Agent Copilot Chat & Structured Reasoning",
    dependencies=[Depends(verify_api_key)]
)
def agent_chat(
    request: dict,
    session: Session = Depends(get_db_session)
):
    from src.geo_tracker.agent.copilot_service import CopilotAgentService, AgentChatRequest
    from src.geo_tracker.storage.models import BrandProfileModel

    # Fetch live context from database
    brand_profile_model = session.query(BrandProfileModel).first()
    brand_name = brand_profile_model.name if brand_profile_model else "Vaatify"
    brand_domain = brand_profile_model.domain if brand_profile_model else "vaatify.com"
    competitors = [
        {"name": c.name, "domain": c.domain}
        for c in (brand_profile_model.competitors if brand_profile_model else [])
        if c.is_active
    ]
    brand_profile = {
        "brand": {"name": brand_name, "domain": brand_domain},
        "competitors": competitors
    }

    repo = Repository(session)
    active_prompts = [
        {"id": p.id, "prompt_text": p.prompt_text, "brand": p.brand}
        for p in repo.get_active_prompts()
    ]

    all_runs = repo.get_all_runs()
    metrics = {
        "overall_share_of_voice": round(calculate_overall_citation_rate(all_runs), 2),
        "total_evaluations": len(all_runs),
        "flips_count": len(detect_citation_flips(all_runs))
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


# --- Automated Monitoring Schedule Routes ---
@router.get(
    "/api/v1/schedule",
    tags=["Automated Monitoring"],
    summary="Get Active Monitoring Schedule",
    dependencies=[Depends(verify_api_key)],
    response_model=ScheduleResponse
)
def get_monitoring_schedule(session: Session = Depends(get_db_session)):
    from src.geo_tracker.storage.models import MonitoringScheduleModel, BrandProfileModel
    from src.geo_tracker.scheduler.engine import compute_next_run
    from datetime import datetime, timezone
    from sqlalchemy import select

    brand_profile = session.scalar(select(BrandProfileModel))
    brand_name = brand_profile.name if brand_profile else "Vaatify"

    schedule = session.scalar(
        select(MonitoringScheduleModel).where(MonitoringScheduleModel.brand == brand_name)
    )

    if not schedule:
        schedule = MonitoringScheduleModel(
            id=f"sch_{uuid.uuid4().hex[:12]}",
            brand=brand_name,
            frequency="weekly",
            day_of_week=0,
            hour_utc=9,
            minute_utc=0,
            is_active=True,
            next_run_at=compute_next_run("weekly", 0, 9, 0, datetime.now(timezone.utc))
        )
        session.add(schedule)
        session.commit()
        session.refresh(schedule)

    return ScheduleResponse(
        id=schedule.id,
        brand=schedule.brand,
        frequency=schedule.frequency,
        day_of_week=schedule.day_of_week,
        hour_utc=schedule.hour_utc,
        minute_utc=schedule.minute_utc,
        is_active=schedule.is_active,
        last_run_at=schedule.last_run_at.isoformat() if schedule.last_run_at else None,
        next_run_at=schedule.next_run_at.isoformat() if schedule.next_run_at else None,
        last_run_status=schedule.last_run_status
    )


@router.put(
    "/api/v1/schedule",
    tags=["Automated Monitoring"],
    summary="Update Monitoring Schedule Cadence",
    dependencies=[Depends(verify_api_key)],
    response_model=ScheduleResponse
)
def update_monitoring_schedule(
    request: ScheduleUpdateRequest,
    session: Session = Depends(get_db_session)
):
    from src.geo_tracker.storage.models import MonitoringScheduleModel, BrandProfileModel
    from src.geo_tracker.scheduler.engine import compute_next_run
    from datetime import datetime, timezone
    from sqlalchemy import select

    brand_profile = session.scalar(select(BrandProfileModel))
    brand_name = brand_profile.name if brand_profile else "Vaatify"

    schedule = session.scalar(
        select(MonitoringScheduleModel).where(MonitoringScheduleModel.brand == brand_name)
    )

    now = datetime.now(timezone.utc)
    next_run = compute_next_run(
        frequency=request.frequency,
        day_of_week=request.day_of_week,
        hour_utc=request.hour_utc,
        minute_utc=request.minute_utc,
        base_time=now
    )

    if not schedule:
        schedule = MonitoringScheduleModel(
            id=f"sch_{uuid.uuid4().hex[:12]}",
            brand=brand_name,
            frequency=request.frequency,
            day_of_week=request.day_of_week,
            hour_utc=request.hour_utc,
            minute_utc=request.minute_utc,
            is_active=request.is_active,
            next_run_at=next_run
        )
        session.add(schedule)
    else:
        schedule.frequency = request.frequency
        schedule.day_of_week = request.day_of_week
        schedule.hour_utc = request.hour_utc
        schedule.minute_utc = request.minute_utc
        schedule.is_active = request.is_active
        schedule.next_run_at = next_run

    session.commit()
    session.refresh(schedule)

    return ScheduleResponse(
        id=schedule.id,
        brand=schedule.brand,
        frequency=schedule.frequency,
        day_of_week=schedule.day_of_week,
        hour_utc=schedule.hour_utc,
        minute_utc=schedule.minute_utc,
        is_active=schedule.is_active,
        last_run_at=schedule.last_run_at.isoformat() if schedule.last_run_at else None,
        next_run_at=schedule.next_run_at.isoformat() if schedule.next_run_at else None,
        last_run_status=schedule.last_run_status
    )


@router.post(
    "/api/v1/schedule/trigger",
    tags=["Automated Monitoring"],
    summary="Manually Trigger Scheduled Evaluation Immediately",
    dependencies=[Depends(verify_api_key)]
)
async def trigger_schedule_evaluation():
    from src.geo_tracker.scheduler.engine import global_scheduler
    from src.geo_tracker.storage.models import MonitoringScheduleModel, BrandProfileModel
    from src.geo_tracker.storage.session import create_session_factory
    from sqlalchemy import select

    session_factory = create_session_factory()
    with session_factory() as session:
        brand_profile = session.scalar(select(BrandProfileModel))
        brand_name = brand_profile.name if brand_profile else "Vaatify"
        schedule = session.scalar(
            select(MonitoringScheduleModel).where(MonitoringScheduleModel.brand == brand_name)
        )
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not configured for brand.")

        sch_info = {
            "id": schedule.id,
            "brand": schedule.brand,
            "frequency": schedule.frequency,
            "day_of_week": schedule.day_of_week,
            "hour_utc": schedule.hour_utc,
            "minute_utc": schedule.minute_utc,
        }

    # Execute asynchronously via scheduler worker
    import asyncio
    asyncio.create_task(global_scheduler._execute_scheduled_run(sch_info, initial_delay=0.0))

    return {
        "status": "triggered",
        "message": f"Automated evaluation dispatched for brand '{brand_name}'."
    }



