"""
Automated Scheduled Monitoring Router.
Manages automated evaluation frequencies (weekly, daily, manual) and immediate audit dispatch.
"""
import uuid
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.geo_tracker.api.security.api_key import verify_api_key
from src.geo_tracker.api.security.rate_limiter import rate_limiter
from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.models import MonitoringScheduleModel, BrandProfileModel
from src.geo_tracker.scheduler.engine import compute_next_run

router = APIRouter(prefix="/api/v1/schedule", tags=["Automated Monitoring"])

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

@router.get(
    "",
    response_model=ScheduleResponse,
    summary="Get Active Monitoring Schedule",
    dependencies=[Depends(verify_api_key)]
)
def get_monitoring_schedule(session: Session = Depends(get_db_session)):
    """Fetches the active background audit frequency, next scheduled run, and previous status."""
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
    "",
    response_model=ScheduleResponse,
    summary="Update Monitoring Schedule Cadence",
    dependencies=[Depends(verify_api_key)]
)
def update_monitoring_schedule(
    request: ScheduleUpdateRequest,
    session: Session = Depends(get_db_session)
):
    """Updates background audit cadence (Weekly / Daily / Off) and recomputes the next UTC runtime."""
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
    "/trigger",
    summary="Manually Trigger Scheduled Evaluation Immediately",
    dependencies=[Depends(verify_api_key)]
)
async def trigger_schedule_evaluation(api_key: str = Depends(verify_api_key)):
    """Triggers an immediate background evaluation run via the scheduler queue with rate limiting."""
    rate_limiter.check_rate_limit(client_id=api_key, action="schedule_trigger", max_requests=5, window_seconds=900)

    from src.geo_tracker.scheduler.engine import global_scheduler
    from src.geo_tracker.storage.session import create_session_factory

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

    import asyncio
    asyncio.create_task(global_scheduler._execute_scheduled_run(sch_info, initial_delay=0.0))

    return {
        "status": "triggered",
        "message": f"Automated evaluation dispatched for brand '{brand_name}'."
    }
