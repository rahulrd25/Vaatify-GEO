from typing import List, Dict, Any
from collections import defaultdict
from src.geo_tracker.storage.models import RunModel

def calculate_citation_rate_per_prompt_and_engine(runs: List[RunModel]) -> Dict[str, Dict[str, float]]:
    """
    Calculates brand citation rate percentage grouped by prompt_id and engine.
    """
    counts: Dict[str, Dict[str, Dict[str, int]]] = defaultdict(lambda: defaultdict(lambda: {"total": 0, "cited": 0}))

    for run in runs:
        counts[run.prompt_id][run.engine]["total"] += 1
        if run.brand_cited:
            counts[run.prompt_id][run.engine]["cited"] += 1

    result: Dict[str, Dict[str, float]] = {}
    for prompt_id, engines in counts.items():
        result[prompt_id] = {}
        for engine, stats in engines.items():
            total = stats["total"]
            cited = stats["cited"]
            rate = round((cited / total) * 100, 2) if total > 0 else 0.0
            result[prompt_id][engine] = rate

    return result

def calculate_citation_rate_per_engine(runs: List[RunModel]) -> List[Dict[str, Any]]:
    """
    Calculates brand citation rate percentage grouped across each AI search engine.
    """
    if not runs:
        return []

    counts: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "cited": 0})
    for run in runs:
        counts[run.engine]["total"] += 1
        if run.brand_cited:
            counts[run.engine]["cited"] += 1

    engine_rates = []
    for engine, stats in counts.items():
        total = stats["total"]
        cited = stats["cited"]
        rate = round((cited / total) * 100, 2) if total > 0 else 0.0
        engine_rates.append({
            "engine": engine,
            "sov": rate,
            "total_runs": total,
            "cited_runs": cited
        })

    engine_rates.sort(key=lambda x: x["engine"])
    return engine_rates


def calculate_overall_citation_rate(runs: List[RunModel]) -> float:
    """
    Calculates overall brand citation rate percentage across all runs.
    """
    if not runs:
        return 0.0
    cited_count = sum(1 for r in runs if r.brand_cited)
    return round((cited_count / len(runs)) * 100, 2)

def get_top_competitors_by_citation_frequency(runs: List[RunModel]) -> List[Dict[str, Any]]:
    """
    Ranks top competitors by total citation count and citation rate across all runs.
    """
    if not runs:
        return []

    comp_counts: Dict[str, int] = defaultdict(int)
    total_runs = len(runs)

    for run in runs:
        # competitors_cited is list of dicts [{"name": "CompA", "url": "..."}]
        cited_comps = run.competitors_cited or []
        for comp in cited_comps:
            comp_name = comp.get("name") if isinstance(comp, dict) else str(comp)
            if comp_name:
                comp_counts[comp_name] += 1

    ranking: List[Dict[str, Any]] = []
    for comp_name, count in comp_counts.items():
        rate = round((count / total_runs) * 100, 2)
        ranking.append({
            "name": comp_name,
            "citation_count": count,
            "citation_rate": rate
        })

    ranking.sort(key=lambda x: x["citation_count"], reverse=True)
    return ranking

def detect_citation_flips(runs: List[RunModel]) -> List[Dict[str, Any]]:
    """
    Flags prompts where brand_cited status flipped (gained or lost citation)
    between consecutive runs on the same engine.
    """
    if not runs:
        return []

    # Group runs by (prompt_id, engine)
    grouped: Dict[tuple[str, str], List[RunModel]] = defaultdict(list)
    for run in runs:
        grouped[(run.prompt_id, run.engine)].append(run)

    flips: List[Dict[str, Any]] = []

    for (prompt_id, engine), run_list in grouped.items():
        # Sort chronologically
        sorted_runs = sorted(run_list, key=lambda r: r.run_timestamp)
        
        for i in range(1, len(sorted_runs)):
            prev_run = sorted_runs[i - 1]
            curr_run = sorted_runs[i]

            if prev_run.brand_cited != curr_run.brand_cited:
                flip_type = "gained_citation" if curr_run.brand_cited else "lost_citation"
                flips.append({
                    "prompt_id": prompt_id,
                    "engine": engine,
                    "previous_status": prev_run.brand_cited,
                    "new_status": curr_run.brand_cited,
                    "previous_timestamp": prev_run.run_timestamp,
                    "new_timestamp": curr_run.run_timestamp,
                    "flip_type": flip_type
                })

    return flips
