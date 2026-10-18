"""
Automated Scheduled Monitoring Engine.
Provides background cron execution for multi-tenant GEO visibility evaluations.
Uses native asyncio loops with semaphore concurrency limiting and staggered tenant dispatch.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import select
from src.geo_tracker.storage.session import create_session_factory
from src.geo_tracker.storage.models import MonitoringScheduleModel
from src.geo_tracker.runner import run_pipeline

logger = logging.getLogger("geo_tracker.scheduler")
logging.basicConfig(level=logging.INFO)

def compute_next_run(
    frequency: str,
    day_of_week: int = 0,
    hour_utc: int = 9,
    minute_utc: int = 0,
    base_time: Optional[datetime] = None
) -> Optional[datetime]:
    """
    Computes the next scheduled UTC execution datetime for a given cadence.
    
    :param frequency: "daily", "weekly", or "off"
    :param day_of_week: 0 = Monday ... 6 = Sunday (used for weekly)
    :param hour_utc: 0..23
    :param minute_utc: 0..59
    :param base_time: Current reference time (defaults to now UTC)
    :return: Next datetime in UTC, or None if frequency is "off"
    """
    if frequency == "off":
        return None

    now = base_time or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    # Normalize candidate to today at scheduled hour:minute:00
    candidate = now.replace(hour=hour_utc, minute=minute_utc, second=0, microsecond=0)

    if frequency == "daily":
        if candidate <= now:
            candidate += timedelta(days=1)
        return candidate

    elif frequency == "weekly":
        # Calculate days until target day_of_week (0 = Monday)
        days_ahead = (day_of_week - now.weekday()) % 7
        if days_ahead == 0 and candidate <= now:
            days_ahead = 7
        candidate += timedelta(days=days_ahead)
        return candidate

    return None


class MonitoringScheduler:
    """
    Background worker that checks schedules periodically and executes
    evaluations with staggered concurrency protection.
    """
    def __init__(self, max_concurrent_workers: int = 3, check_interval_seconds: int = 60):
        self.max_concurrent_workers = max_concurrent_workers
        self.check_interval_seconds = check_interval_seconds
        self.semaphore = asyncio.Semaphore(max_concurrent_workers)
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """Starts the scheduler background task loop."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop(), name="geo_monitoring_scheduler")
        logger.info(f"✓ [Scheduler] Monitoring scheduler started (check interval: {self.check_interval_seconds}s, max workers: {self.max_concurrent_workers}).")

    async def stop(self):
        """Gracefully stops the scheduler loop."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("✓ [Scheduler] Monitoring scheduler stopped.")

    async def _loop(self):
        while self._running:
            try:
                await self._evaluate_due_schedules()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"⚠️ [Scheduler] Could not check schedules (retrying in {self.check_interval_seconds}s): {e}")

            try:
                await asyncio.sleep(self.check_interval_seconds)
            except asyncio.CancelledError:
                break

    async def _evaluate_due_schedules(self):
        now = datetime.now(timezone.utc)
        session_factory = create_session_factory()
        
        due_schedules = []
        with session_factory() as session:
            schedules = session.scalars(
                select(MonitoringScheduleModel).where(
                    MonitoringScheduleModel.is_active == True,
                    MonitoringScheduleModel.frequency != "off"
                )
            ).all()

            for sch in schedules:
                # If next_run_at is not computed, initialize it
                if sch.next_run_at is None:
                    sch.next_run_at = compute_next_run(
                        frequency=sch.frequency,
                        day_of_week=sch.day_of_week,
                        hour_utc=sch.hour_utc,
                        minute_utc=sch.minute_utc,
                        base_time=now
                    )
                    session.add(sch)
                
                # Check if schedule is due
                if sch.next_run_at and sch.next_run_at <= now:
                    due_schedules.append({
                        "id": sch.id,
                        "brand": sch.brand,
                        "frequency": sch.frequency,
                        "day_of_week": sch.day_of_week,
                        "hour_utc": sch.hour_utc,
                        "minute_utc": sch.minute_utc,
                    })
            session.commit()

        if not due_schedules:
            return

        logger.info(f"⚡ [Scheduler] Found {len(due_schedules)} due schedule(s) for automated evaluation.")

        # Dispatch due schedules with staggered task spawning
        tasks = []
        for idx, sch_info in enumerate(due_schedules):
            stagger_delay = idx * 15.0  # 15-second offset between brand runs
            tasks.append(asyncio.create_task(self._execute_scheduled_run(sch_info, stagger_delay)))

        # Wait for this batch to complete
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _execute_scheduled_run(self, sch_info: Dict[str, Any], initial_delay: float = 0.0):
        if initial_delay > 0:
            await asyncio.sleep(initial_delay)

        brand_name = sch_info["brand"]
        sch_id = sch_info["id"]

        async with self.semaphore:
            logger.info(f"⚡ [Scheduler] Executing scheduled evaluation for brand '{brand_name}'...")
            session_factory = create_session_factory()
            
            # Set status to running
            with session_factory() as session:
                sch = session.get(MonitoringScheduleModel, sch_id)
                if sch:
                    sch.last_run_status = "running"
                    session.commit()

            start_time = datetime.now(timezone.utc)
            run_status = "success"
            
            try:
                # Run the pipeline in an executor thread so it doesn't block the async event loop
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, lambda: run_pipeline(mock_external_calls=False))
                logger.info(f"✓ [Scheduler] Completed scheduled evaluation for brand '{brand_name}'.")
            except Exception as e:
                logger.error(f"❌ [Scheduler] Scheduled run failed for '{brand_name}': {e}")
                run_status = "failed"

            # Update schedule state & compute next run time
            with session_factory() as session:
                sch = session.get(MonitoringScheduleModel, sch_id)
                if sch:
                    sch.last_run_at = start_time
                    sch.last_run_status = run_status
                    sch.next_run_at = compute_next_run(
                        frequency=sch.frequency,
                        day_of_week=sch.day_of_week,
                        hour_utc=sch.hour_utc,
                        minute_utc=sch.minute_utc,
                        base_time=datetime.now(timezone.utc)
                    )
                    session.commit()

# Singleton Scheduler Instance
global_scheduler = MonitoringScheduler()
