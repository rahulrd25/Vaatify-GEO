import pytest
from datetime import datetime, timezone
from src.geo_tracker.storage.models import RunModel
from src.geo_tracker.reporting.weekly_report import generate_weekly_report

@pytest.fixture
def sample_runs():
    now = datetime.now(timezone.utc)
    return [
        RunModel(
            id="r-1", prompt_id="p-1", engine="perplexity",
            run_timestamp=now, raw_response_text="...",
            brand_mentioned=True, brand_cited=True, citation_url="https://useomnia.com",
            competitors_mentioned=["Proseo"], competitors_cited=[{"name": "Proseo", "url": "https://proseo.io"}]
        ),
        RunModel(
            id="r-2", prompt_id="p-1", engine="claude",
            run_timestamp=now, raw_response_text="...",
            brand_mentioned=True, brand_cited=False, citation_url=None,
            competitors_mentioned=[], competitors_cited=[]
        )
    ]

def test_generate_weekly_report(sample_runs, tmp_path):
    report_file = tmp_path / "weekly_report.md"
    content = generate_weekly_report(sample_runs, output_file_path=report_file, brand_name="Omnia")

    assert "# Generative Engine Optimization (GEO) Weekly Report" in content
    assert "Target Brand**: Omnia" in content
    assert "Overall Brand Citation Rate**: `50.0%`" in content
    assert "Per-Prompt Citation Rates" in content
    assert "Top Competitors by Citation Frequency" in content
    assert "Proseo" in content
    assert report_file.exists()
