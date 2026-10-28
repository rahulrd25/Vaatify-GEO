"""
Pipeline Execution Router.
Handles manual evaluation triggers, background pipeline execution, and progress status tracking.
"""
import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from src.geo_tracker.api.security.api_key import verify_api_or_user_auth
from src.geo_tracker.api.security.rate_limiter import rate_limiter
from src.geo_tracker.storage.session import get_db_session, create_session_factory
from src.geo_tracker.runner import run_pipeline
from src.geo_tracker.reporting.weekly_report import generate_weekly_report
from src.geo_tracker.api.utils.tenant import get_current_user_id, get_user_brand

logger = logging.getLogger("geo_tracker.pipeline")
router = APIRouter(prefix="/api/v1/pipeline", tags=["Pipeline Execution"])

pipeline_state = {
    "is_running": False,
    "last_run_at": None,
    "last_runs_count": 0,
    "mode": "hybrid",
    "error": None
}

def run_pipeline_task(mode: str = "hybrid", user_id: Optional[str] = None):
    """Background task executing the evaluation runner across configured AI engines."""
    global pipeline_state
    pipeline_state["is_running"] = True
    pipeline_state["mode"] = mode
    pipeline_state["error"] = None
    try:
        brand_name = "My Brand"
        session_factory = create_session_factory()
        with session_factory() as s:
            brand_profile = get_user_brand(s, user_id)
            if brand_profile:
                brand_name = brand_profile.name

        runs = run_pipeline(mode=mode, user_id=user_id)
        pipeline_state["last_runs_count"] = len(runs)
        pipeline_state["last_run_at"] = datetime.now(timezone.utc).isoformat()
        if runs:
            generate_weekly_report(runs, output_file_path=f"weekly_report_{user_id or 'default'}.md", brand_name=brand_name)
    except Exception as e:
        pipeline_state["error"] = str(e)
        logger.error(f"Background pipeline run failed: {e}", exc_info=True)
    finally:
        pipeline_state["is_running"] = False

@router.get(
    "/status",
    summary="Get Pipeline Execution Status",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def get_pipeline_status():
    """Returns the current execution state, timestamp, and results of background pipeline runs."""
    return pipeline_state

@router.post(
    "/run",
    summary="Trigger Pipeline Evaluation Run",
    dependencies=[Depends(verify_api_or_user_auth)]
)
def trigger_pipeline_run(
    background_tasks: BackgroundTasks,
    mode: str = "hybrid",
    user_id: Optional[str] = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Triggers an evaluation pipeline in the background with sliding-window rate limiting."""
    client_id = user_id or "pipeline_runner"
    rate_limiter.check_rate_limit(client_id=client_id, action="pipeline_run", max_requests=5, window_seconds=900)

    background_tasks.add_task(run_pipeline_task, mode=mode, user_id=user_id)
    return {
        "status": "started",
        "mode": mode,
        "message": "Evaluation pipeline started in background. Results will appear live as they complete."
    }
