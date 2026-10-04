import pytest
from datetime import datetime, timezone, timedelta
from src.geo_tracker.storage.models import RunModel
from src.geo_tracker.aggregation.citation_metrics import (
    calculate_citation_rate_per_prompt_and_engine,
    calculate_citation_rate_per_engine,
    calculate_overall_citation_rate,
    get_top_competitors_by_citation_frequency,
    detect_citation_flips
)


@pytest.fixture
def multi_week_runs():
    base_time = datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc)
    
    # Week 1 Runs
    r1 = RunModel(
        id="r-1", prompt_id="p-1", engine="perplexity",
        run_timestamp=base_time, raw_response_text="...",
        brand_mentioned=True, brand_cited=False, citation_url=None,
        competitors_mentioned=["Proseo"], competitors_cited=[{"name": "Proseo", "url": "https://proseo.io"}]
    )
    r2 = RunModel(
        id="r-2", prompt_id="p-1", engine="claude",
        run_timestamp=base_time, raw_response_text="...",
        brand_mentioned=True, brand_cited=True, citation_url="https://useomnia.com",
        competitors_mentioned=["Peec"], competitors_cited=[]
    )

    # Week 2 Runs (p-1 on perplexity FLIPS from False -> True)
    week2_time = base_time + timedelta(days=7)
    r3 = RunModel(
        id="r-3", prompt_id="p-1", engine="perplexity",
        run_timestamp=week2_time, raw_response_text="...",
        brand_mentioned=True, brand_cited=True, citation_url="https://useomnia.com/features",
        competitors_mentioned=["Proseo"], competitors_cited=[{"name": "Proseo", "url": "https://proseo.io"}]
    )
    # (p-1 on claude FLIPS from True -> False)
    r4 = RunModel(
        id="r-4", prompt_id="p-1", engine="claude",
        run_timestamp=week2_time, raw_response_text="...",
        brand_mentioned=False, brand_cited=False, citation_url=None,
        competitors_mentioned=["Proseo"], competitors_cited=[{"name": "Proseo", "url": "https://proseo.io"}]
    )

    return [r1, r2, r3, r4]

def test_calculate_citation_rate_per_prompt_and_engine(multi_week_runs):
    rates = calculate_citation_rate_per_prompt_and_engine(multi_week_runs)
    assert "p-1" in rates
    assert rates["p-1"]["perplexity"] == 50.0  # 1 cited out of 2
    assert rates["p-1"]["claude"] == 50.0      # 1 cited out of 2

def test_calculate_citation_rate_per_engine(multi_week_runs):
    rates = calculate_citation_rate_per_engine(multi_week_runs)
    assert len(rates) == 2
    perplexity = next(r for r in rates if r["engine"] == "perplexity")
    assert perplexity["sov"] == 50.0
    assert perplexity["total_runs"] == 2
    assert perplexity["cited_runs"] == 1

def test_calculate_overall_citation_rate(multi_week_runs):
    overall = calculate_overall_citation_rate(multi_week_runs)
    assert overall == 50.0  # 2 cited out of 4 total runs


def test_get_top_competitors_by_citation_frequency(multi_week_runs):
    top_comps = get_top_competitors_by_citation_frequency(multi_week_runs)
    assert len(top_comps) == 1
    assert top_comps[0]["name"] == "Proseo"
    assert top_comps[0]["citation_count"] == 3
    assert top_comps[0]["citation_rate"] == 75.0  # 3 citations out of 4 runs

def test_detect_citation_flips(multi_week_runs):
    flips = detect_citation_flips(multi_week_runs)
    assert len(flips) == 2

    perplexity_flip = next(f for f in flips if f["engine"] == "perplexity")
    assert perplexity_flip["prompt_id"] == "p-1"
    assert perplexity_flip["flip_type"] == "gained_citation"
    assert perplexity_flip["previous_status"] is False
    assert perplexity_flip["new_status"] is True

    claude_flip = next(f for f in flips if f["engine"] == "claude")
    assert claude_flip["prompt_id"] == "p-1"
    assert claude_flip["flip_type"] == "lost_citation"
    assert claude_flip["previous_status"] is True
    assert claude_flip["new_status"] is False
