"""
Database Reset Utility for Vaatify GEO.
Clears all application data (runs, prompts, competitors, drift alerts, brand profiles)
from the primary Supabase PostgreSQL database.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(override=True)

from src.geo_tracker.storage.session import get_db_session
from src.geo_tracker.storage.models import (
    DriftAlertModel,
    RunModel,
    PromptModel,
    CompetitorModel,
    MonitoringScheduleModel,
    BrandProfileModel,
)

def reset_database():
    database_url = os.getenv("DATABASE_URL")
    print(f"Connecting to primary database: {database_url[:35]}...")
    
    session = next(get_db_session())
    try:
        # Delete in order of foreign key dependencies
        num_alerts = session.query(DriftAlertModel).delete()
        num_runs = session.query(RunModel).delete()
        num_prompts = session.query(PromptModel).delete()
        num_competitors = session.query(CompetitorModel).delete()
        num_schedules = session.query(MonitoringScheduleModel).delete()
        num_brands = session.query(BrandProfileModel).delete()
        
        session.commit()
        print(f"Successfully cleared database:")
        print(f"  - Deleted {num_alerts} drift alerts")
        print(f"  - Deleted {num_runs} evaluation runs")
        print(f"  - Deleted {num_prompts} prompts")
        print(f"  - Deleted {num_competitors} competitors")
        print(f"  - Deleted {num_schedules} monitoring schedules")
        print(f"  - Deleted {num_brands} brand profiles")
        print("Database is now completely clean and ready for fresh onboarding.")
    except Exception as e:
        session.rollback()
        print(f"Error resetting database: {e}", file=sys.stderr)
        raise
    finally:
        session.close()

if __name__ == "__main__":
    reset_database()
