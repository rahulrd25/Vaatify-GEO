from pathlib import Path
from typing import List, Union
from src.geo_tracker.storage.models import RunModel
from src.geo_tracker.aggregation.citation_metrics import (
    calculate_overall_citation_rate,
    calculate_citation_rate_per_prompt_and_engine,
    get_top_competitors_by_citation_frequency,
    detect_citation_flips
)

def generate_weekly_report(
    runs: List[RunModel],
    output_file_path: Union[str, Path] = "weekly_report.md",
    brand_name: str = "Target Brand"
) -> str:
    """
    Generates a comprehensive Markdown weekly report from run history data
    and writes it to output_file_path.
    """
    overall_rate = calculate_overall_citation_rate(runs)
    per_prompt_rates = calculate_citation_rate_per_prompt_and_engine(runs)
    top_competitors = get_top_competitors_by_citation_frequency(runs)
    flips = detect_citation_flips(runs)

    lines = [
        f"# Generative Engine Optimization (GEO) Weekly Report",
        f"**Target Brand**: {brand_name}",
        f"**Generated**: {runs[0].run_timestamp.strftime('%Y-%m-%d %H:%M:%S UTC') if runs else 'N/A'}",
        "",
        "## Executive Summary",
        f"- **Overall Brand Citation Rate**: `{overall_rate}%`",
        f"- **Total Search Engine Evaluations**: `{len(runs)}`",
        f"- **Citation Flips Detected**: `{len(flips)}`",
        "",
        "## Per-Prompt Citation Rates",
        "| Prompt ID | Search Engine | Citation Rate (%) |",
        "|---|---|---|",
    ]

    if not per_prompt_rates:
        lines.append("| N/A | N/A | N/A |")
    else:
        for prompt_id, engine_map in per_prompt_rates.items():
            for engine, rate in engine_map.items():
                lines.append(f"| `{prompt_id}` | `{engine}` | `{rate}%` |")

    lines.extend([
        "",
        "## Top Competitors by Citation Frequency",
        "| Competitor | Total Citations | Citation Rate (%) |",
        "|---|---|---|",
    ])

    if not top_competitors:
        lines.append("| None | 0 | 0% |")
    else:
        for comp in top_competitors:
            lines.append(f"| **{comp['name']}** | {comp['citation_count']} | {comp['citation_rate']}% |")

    lines.extend([
        "",
        "## Citation Flips & Drift Alerts",
    ])

    if not flips:
        lines.append("No citation status flips detected in this evaluation window.")
    else:
        for f in flips:
            icon = "🟢 GAINED" if f["flip_type"] == "gained_citation" else "🔴 LOST"
            lines.append(
                f"- **{icon}**: Prompt `{f['prompt_id']}` on `{f['engine']}` flipped from `{f['previous_status']}` to `{f['new_status']}`."
            )

    report_content = "\n".join(lines) + "\n"

    path = Path(output_file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        file.write(report_content)

    return report_content
