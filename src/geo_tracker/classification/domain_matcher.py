from urllib.parse import urlparse
from typing import List, Dict, Any
from src.geo_tracker.config import CompetitorsFileConfig
from src.geo_tracker.classification.base import CitationMatch

def extract_registered_domain(url_str: str) -> str:
    """
    Extracts normalized host domain from a URL string, stripping protocols, subdomains (like www.), and ports.
    """
    if not url_str:
        return ""
    if not (url_str.startswith("http://") or url_str.startswith("https://")):
        url_str = "http://" + url_str
    try:
        netloc = urlparse(url_str).netloc.lower()
        if ":" in netloc:
            netloc = netloc.split(":")[0]
        # Remove leading www.
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""

def match_citations(
    citation_urls: List[str],
    competitors_config: CompetitorsFileConfig
) -> List[CitationMatch]:
    """
    Deterministic domain matching against known brand and competitor domains.
    No model cost, zero ambiguity.
    """
    matches: List[CitationMatch] = []
    
    brand_domain = extract_registered_domain(competitors_config.brand.domain)
    brand_name = competitors_config.brand.name

    competitor_map = {
        extract_registered_domain(c.domain): c.name
        for c in competitors_config.competitors
    }

    for url in citation_urls:
        extracted = extract_registered_domain(url)
        if not extracted:
            continue

        # Check brand match (exact match or subdomain of brand domain)
        if extracted == brand_domain or extracted.endswith("." + brand_domain):
            matches.append(CitationMatch(
                name=brand_name,
                domain=brand_domain,
                url=url,
                is_brand=True
            ))
            continue

        # Check competitor match
        matched_comp_name = None
        matched_comp_domain = None
        for comp_dom, comp_name in competitor_map.items():
            if extracted == comp_dom or extracted.endswith("." + comp_dom):
                matched_comp_name = comp_name
                matched_comp_domain = comp_dom
                break

        if matched_comp_name and matched_comp_domain:
            matches.append(CitationMatch(
                name=matched_comp_name,
                domain=matched_comp_domain,
                url=url,
                is_brand=False
            ))

    return matches
