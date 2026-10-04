"""
Migration script to standardize all database IDs to type-prefixed identifiers (qry_, run_, comp_, alt_, brand_).
"""
import os
import uuid
from dotenv import load_dotenv
from sqlalchemy import text
from src.geo_tracker.storage.session import create_session_factory
from src.geo_tracker.storage.models import (
    Base, BrandProfileModel, CompetitorModel, PromptModel, RunModel, DriftAlertModel, AgentRecommendationModel
)
from src.geo_tracker.config import load_competitors_config, load_prompts_config

load_dotenv(override=True)

def migrate_and_reseed():
    session_factory = create_session_factory()
    session = session_factory()

    try:
        print("Migrating and standardizing database records...")
        
        # 1. Ensure schema is present
        Base.metadata.create_all(session.bind)

        # 2. Update brand profile
        comp_cfg = load_competitors_config()
        brand_profile = session.query(BrandProfileModel).first()
        if not brand_profile:
            brand_profile = BrandProfileModel(
                id=f"brand_{uuid.uuid4().hex[:12]}",
                name=comp_cfg.brand.name,
                domain=comp_cfg.brand.domain,
            )
            session.add(brand_profile)
            session.flush()
        else:
            brand_profile.name = comp_cfg.brand.name
            brand_profile.domain = comp_cfg.brand.domain

        # 3. Synchronize competitors
        session.query(CompetitorModel).delete()
        for comp in comp_cfg.competitors:
            session.add(
                CompetitorModel(
                    id=f"comp_{uuid.uuid4().hex[:12]}",
                    brand_id=brand_profile.id,
                    name=comp.name,
                    domain=comp.domain,
                    is_active=True
                )
            )

        # 4. Standardize prompts
        prompts_cfg = load_prompts_config()
        existing_prompts = session.query(PromptModel).all()
        existing_map = {p.id: p for p in existing_prompts}

        for p_cfg in prompts_cfg.prompts:
            if p_cfg.id not in existing_map:
                # Add new standardized prompt
                session.add(
                    PromptModel(
                        id=p_cfg.id,
                        brand=comp_cfg.brand.name,
                        prompt_text=p_cfg.text,
                        active=p_cfg.active
                    )
                )

        # 5. Clean legacy p- records if they duplicate standard seed
        legacy_prompts = session.query(PromptModel).filter(PromptModel.id.like("p-%")).all()
        for lp in legacy_prompts:
            # Map legacy prompt runs to standardized prompt
            matching_std = session.query(PromptModel).filter(
                PromptModel.prompt_text == lp.prompt_text,
                PromptModel.id != lp.id
            ).first()
            if matching_std:
                session.query(RunModel).filter(RunModel.prompt_id == lp.id).update({"prompt_id": matching_std.id})
                session.query(DriftAlertModel).filter(DriftAlertModel.prompt_id == lp.id).update({"prompt_id": matching_std.id})
                session.delete(lp)
            else:
                # Rename legacy id to qry_
                new_id = f"qry_{uuid.uuid4().hex[:12]}"
                session.query(RunModel).filter(RunModel.prompt_id == lp.id).update({"prompt_id": new_id})
                session.query(DriftAlertModel).filter(DriftAlertModel.prompt_id == lp.id).update({"prompt_id": new_id})
                lp.id = new_id

        session.commit()
        print("✓ Migration complete: all records updated to standard type-prefixed IDs.")
    except Exception as e:
        session.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate_and_reseed()
