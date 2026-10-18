"""
Central Router Registry for Vaatify GEO Engine.
Aggregates modular domain routers:
- System probes (/health, /api/v1/status)
- Brand Profile & Competitors (/api/v1/profile)
- Target Prompts & Queries (/api/v1/prompts)
- Pipeline Execution & Background Tasks (/api/v1/pipeline)
- Analytics & Share of Voice (/api/v1/metrics, /api/v1/runs, /api/v1/alerts)
- Agent Copilot (/api/v1/agent)
- Automated Monitoring Schedule (/api/v1/schedule)
"""
from fastapi import APIRouter, Depends
from src.geo_tracker.api.security.api_key import verify_api_key

from src.geo_tracker.api.routers.profile import router as profile_router
from src.geo_tracker.api.routers.prompts import router as prompts_router
from src.geo_tracker.api.routers.pipeline import router as pipeline_router
from src.geo_tracker.api.routers.metrics import router as metrics_router
from src.geo_tracker.api.routers.copilot import router as copilot_router
from src.geo_tracker.api.routers.schedule import router as schedule_router
from src.geo_tracker.api.routers.onboarding import router as onboarding_router

router = APIRouter()

# --- System Routes (Readiness & Health) ---
@router.get("/health", tags=["System"], summary="Health Check")
def health_check():
    """Unprotected health probe for load balancers and container readiness checks."""
    return {"status": "ok", "service": "vaatify-geo-engine"}

@router.get(
    "/api/v1/status",
    tags=["Vaatify GEO"],
    summary="Protected Status Check",
    dependencies=[Depends(verify_api_key)]
)
def tracker_status():
    """Protected status check verifying API credentials."""
    return {
        "status": "active",
        "authenticated": True,
        "message": "Vaatify GEO Engine API is ready."
    }

# --- Include Domain Sub-Routers ---
router.include_router(onboarding_router)
router.include_router(profile_router)
router.include_router(prompts_router)
router.include_router(pipeline_router)
router.include_router(metrics_router)
router.include_router(copilot_router)
router.include_router(schedule_router)
