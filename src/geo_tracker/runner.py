import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from src.geo_tracker.config import (
    load_settings,
    load_competitors_config,
    load_prompts_config,
    CompetitorsFileConfig
)
from src.geo_tracker.connectors.base import BaseConnector
from src.geo_tracker.connectors.perplexity import PerplexityConnector
from src.geo_tracker.connectors.claude_search import ClaudeSearchConnector
from src.geo_tracker.connectors.gemini_grounded import GeminiGroundedConnector
from src.geo_tracker.connectors.openai_search import OpenAISearchConnector
from src.geo_tracker.connectors.browser_collector import BrowserCollector
from src.geo_tracker.classification.base import BaseClassifier
from src.geo_tracker.classification.jev_classifier import JevClassifier
from src.geo_tracker.storage.session import create_session_factory
from src.geo_tracker.storage.repository import Repository
from src.geo_tracker.storage.models import RunModel

logger = logging.getLogger("geo_tracker.runner")

def run_pipeline(
    connectors: Optional[Dict[str, BaseConnector]] = None,
    classifier: Optional[BaseClassifier] = None,
    db_session: Optional[Session] = None,
    competitors_config: Optional[CompetitorsFileConfig] = None,
    mode: str = "hybrid"
) -> List[RunModel]:
    """
    Executes the end-to-end GEO Visibility Tracker pipeline:
    1. Loads active prompts from DB (auto-seeds from config/prompts.yaml if empty).
    2. Executes target connectors per prompt based on mode ('hybrid' | 'api' | 'browser').
    3. Runs Jev classifier per response.
    4. Saves run snapshots to database with loud error logging and fault tolerance.
    """
    own_session = False
    if db_session is None:
        session_factory = create_session_factory()
        session = session_factory()
        own_session = True
    else:
        session = db_session

    saved_runs: List[RunModel] = []

    try:
        repo = Repository(session)
        
        # 1. Fetch or auto-seed active prompts
        active_prompts = repo.get_active_prompts()
        if not active_prompts:
            logger.info("No active prompts found in database. Auto-seeding from config/prompts.yaml...")
            prompts_cfg = load_prompts_config("config/prompts.yaml")
            comp_cfg_seed = load_competitors_config("config/competitors.yaml")
            for item in prompts_cfg.prompts:
                if item.active:
                    repo.add_prompt(
                        prompt_id=item.id,
                        brand=comp_cfg_seed.brand.name,
                        prompt_text=item.text,
                        active=True
                    )
            active_prompts = repo.get_active_prompts()

        # 2. Load competitor configuration
        comp_config = competitors_config or load_competitors_config("config/competitors.yaml")

        # 3. Instantiate connectors based on collection mode
        if connectors:
            active_connectors = connectors
        elif mode == "browser":
            active_connectors = {
                "google_ai_overview": BrowserCollector()
            }
        elif mode == "api":
            active_connectors = {
                "chatgpt": OpenAISearchConnector(),
                "gemini": GeminiGroundedConnector(),
                "claude": ClaudeSearchConnector(),
                "perplexity": PerplexityConnector()
            }
        else:  # hybrid default
            active_connectors = {
                "chatgpt": OpenAISearchConnector(),
                "gemini": GeminiGroundedConnector(),
                "claude": ClaudeSearchConnector(),
                "perplexity": PerplexityConnector(),
                "google_ai_overview": BrowserCollector()
            }

        active_classifier: BaseClassifier = classifier or JevClassifier()

        # 4. Execute pipeline per prompt and engine
        for prompt in active_prompts:
            for engine_name, connector in active_connectors.items():
                api_key = getattr(connector, "api_key", None)
                if api_key and ("-dev-mock" in api_key or "your-" in api_key or api_key.startswith("pplx-dev") or api_key.startswith("sk-ant-dev")):
                    logger.info(f"Skipping engine [{engine_name}] (unconfigured mock key).")
                    continue

                try:
                    logger.info(f"Fetching response for prompt [{prompt.id}] via engine [{engine_name}]...")
                    normalized_resp = connector.fetch(prompt.prompt_text)

                    logger.info(f"Classifying response for prompt [{prompt.id}] via [{engine_name}]...")
                    classification = active_classifier.classify(
                        response=normalized_resp,
                        brand_config=comp_config.brand,
                        competitors_config=comp_config
                    )

                    run_record = repo.save_run(
                        prompt_id=prompt.id,
                        engine=engine_name,
                        raw_response_text=normalized_resp.raw_response_text,
                        brand_mentioned=classification.brand_mentioned,
                        brand_cited=classification.brand_cited,
                        citation_url=classification.citation_url,
                        competitors_mentioned=classification.competitors_mentioned,
                        competitors_cited=classification.competitors_cited,
                        collection_mode=getattr(normalized_resp, "collection_mode", "api"),
                        position_rank=classification.position_rank,
                        snippet_text=classification.snippet_text,
                        prominence_score=classification.prominence_score
                    )
                    saved_runs.append(run_record)
                    logger.info(f"Successfully saved run [{run_record.id}] for prompt [{prompt.id}] engine [{engine_name}].")

                except Exception as err:
                    err_str = str(err)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                        logger.warning(f"Engine [{engine_name}] quota exceeded or rate limited (429). Skipped gracefully.")
                    else:
                        logger.error(
                            f"Pipeline execution failed for prompt_id='{prompt.id}' on engine='{engine_name}': {err}"
                        )
                    continue

        return saved_runs

    finally:
        if own_session:
            session.close()
