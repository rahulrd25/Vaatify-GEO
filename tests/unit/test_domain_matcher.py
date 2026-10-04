from src.geo_tracker.config import CompetitorsFileConfig, BrandConfig, CompetitorConfig
from src.geo_tracker.classification.domain_matcher import match_citations, extract_registered_domain

def test_extract_registered_domain():
    assert extract_registered_domain("https://www.useomnia.com/features") == "useomnia.com"
    assert extract_registered_domain("http://blog.proseo.io/article?id=12") == "blog.proseo.io"
    assert extract_registered_domain("peec.ai") == "peec.ai"

def test_domain_matcher():
    config = CompetitorsFileConfig(
        brand=BrandConfig(name="Omnia", domain="useomnia.com"),
        competitors=[
            CompetitorConfig(name="Proseo", domain="proseo.io"),
            CompetitorConfig(name="Peec", domain="peec.ai")
        ]
    )

    urls = [
        "https://www.useomnia.com/pricing",
        "https://app.proseo.io/login",
        "https://peec.ai/about",
        "https://unknownnews.com/tech-article"
    ]

    matches = match_citations(urls, config)
    assert len(matches) == 3

    # Brand match
    brand_match = next(m for m in matches if m.is_brand)
    assert brand_match.name == "Omnia"
    assert brand_match.url == "https://www.useomnia.com/pricing"

    # Competitor matches
    comp_names = [m.name for m in matches if not m.is_brand]
    assert "Proseo" in comp_names
    assert "Peec" in comp_names

    # Unknown domain url is not matched
    assert not any(m.url == "https://unknownnews.com/tech-article" for m in matches)
