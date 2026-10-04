import re
from typing import List, Dict, Any
from pydantic import BaseModel, Field

# --- Request / Response Models ---

class TargetBrand(BaseModel):
    name: str
    domain: str

class Competitor(BaseModel):
    name: str
    domain: str

class PromptMonitorRequest(BaseModel):
    brand: TargetBrand
    competitors: List[Competitor] = []
    prompts: List[str]
    engines: List[str] = ["chatgpt", "perplexity", "gemini", "claude"]

class CitationInfo(BaseModel):
    url: str
    domain: str
    is_brand_owned: bool

class PromptEngineResult(BaseModel):
    engine: str
    prompt: str
    brand_mentioned: bool
    position: int | None = None  # 1-indexed mention rank among options
    sentiment: str = "neutral"   # positive, neutral, negative, not_mentioned
    citations: List[CitationInfo] = []
    competitors_mentioned: List[str] = []

class ShareOfVoiceReport(BaseModel):
    brand_name: str
    total_prompts_tracked: int
    total_engine_evaluations: int
    brand_mention_count: int
    share_of_voice_percentage: float
    avg_position: float | None = None
    competitor_share_of_voice: Dict[str, float] = {}
    engine_breakdown: Dict[str, Dict[str, Any]] = {}
    detailed_results: List[PromptEngineResult] = []

class GeoAuditRequest(BaseModel):
    brand_name: str
    content_text: str
    target_keywords: List[str] = []

class GeoAuditScoreBreakdown(BaseModel):
    structured_data_score: float = Field(..., description="Tables, bullet points, headers clarity")
    quantitative_data_score: float = Field(..., description="Presence of stats, metrics, percentages")
    entity_grounding_score: float = Field(..., description="Clear brand/product entity definitions")
    quotability_score: float = Field(..., description="Concise, self-contained summary sentences")
    overall_geo_score: float = Field(..., description="Overall GEO Index (0 - 100)")

class GeoAuditResult(BaseModel):
    brand_name: str
    geo_score: float
    breakdown: GeoAuditScoreBreakdown
    strengths: List[str]
    weaknesses: List[str]
    actionable_recommendations: List[str]

# --- Core GEO Agent Engine ---

class GeoAgent:
    """
    Generative Engine Optimization (GEO) Agent.
    Monitors brand visibility across AI Search Engines, calculates Share of Voice,
    benchmarks competitors, and audits content for LLM citation probability.
    """
    
    def monitor_brand_visibility(self, request: PromptMonitorRequest) -> ShareOfVoiceReport:
        results: List[PromptEngineResult] = []
        brand_name_lower = request.brand.name.lower()
        brand_domain_lower = request.brand.domain.lower()

        total_evaluations = len(request.prompts) * len(request.engines)
        brand_mentions_count = 0
        brand_positions: List[int] = []
        competitor_mentions: Dict[str, int] = {c.name: 0 for c in request.competitors}
        engine_stats: Dict[str, Dict[str, Any]] = {
            e: {"evaluations": 0, "brand_mentions": 0, "sov": 0.0} for e in request.engines
        }

        for prompt in request.prompts:
            for engine in request.engines:
                # Simulated/analyzed engine evaluation against LLM response patterns
                mentioned, pos, sentiment, citations, comps = self._evaluate_prompt_response(
                    engine=engine,
                    prompt=prompt,
                    brand=request.brand,
                    competitors=request.competitors
                )
                
                engine_stats[engine]["evaluations"] += 1
                if mentioned:
                    brand_mentions_count += 1
                    engine_stats[engine]["brand_mentions"] += 1
                    if pos:
                        brand_positions.append(pos)
                
                for c in comps:
                    competitor_mentions[c] = competitor_mentions.get(c, 0) + 1

                results.append(PromptEngineResult(
                    engine=engine,
                    prompt=prompt,
                    brand_mentioned=mentioned,
                    position=pos,
                    sentiment=sentiment,
                    citations=citations,
                    competitors_mentioned=comps
                ))

        # Calculate metrics
        sov_percentage = round((brand_mentions_count / total_evaluations) * 100, 2) if total_evaluations > 0 else 0.0
        avg_pos = round(sum(brand_positions) / len(brand_positions), 2) if brand_positions else None

        comp_sov: Dict[str, float] = {}
        for comp_name, count in competitor_mentions.items():
            comp_sov[comp_name] = round((count / total_evaluations) * 100, 2) if total_evaluations > 0 else 0.0

        for e, stats in engine_stats.items():
            evals = stats["evaluations"]
            bm = stats["brand_mentions"]
            stats["sov"] = round((bm / evals) * 100, 2) if evals > 0 else 0.0

        return ShareOfVoiceReport(
            brand_name=request.brand.name,
            total_prompts_tracked=len(request.prompts),
            total_engine_evaluations=total_evaluations,
            brand_mention_count=brand_mentions_count,
            share_of_voice_percentage=sov_percentage,
            avg_position=avg_pos,
            competitor_share_of_voice=comp_sov,
            engine_breakdown=engine_stats,
            detailed_results=results
        )

    def audit_content_for_geo(self, request: GeoAuditRequest) -> GeoAuditResult:
        text = request.content_text
        brand = request.brand_name.lower()

        # 1. Structure score (headers, lists, tables)
        has_tables = "|" in text and "-|-" in text
        has_lists = bool(re.search(r"^\s*[\-\*\d\.]+\s+", text, re.MULTILINE))
        has_headers = bool(re.search(r"^\s*#{1,6}\s+", text, re.MULTILINE))
        
        struct_score = 40.0
        if has_headers: struct_score += 20.0
        if has_lists: struct_score += 20.0
        if has_tables: struct_score += 20.0
        struct_score = min(struct_score, 100.0)

        # 2. Quantitative score (percentages, dollar amounts, numbers)
        has_stats = bool(re.search(r"\d+%", text)) or bool(re.search(r"\$\d+", text)) or bool(re.search(r"\b\d+(\.\d+)?\b", text))
        numbers_count = len(re.findall(r"\b\d+\b", text))
        quant_score = min(30.0 + (numbers_count * 10.0), 100.0) if has_stats else 20.0

        # 3. Entity Grounding score (clear brand definitions)
        entity_mentions = text.lower().count(brand)
        entity_score = min(20.0 + (entity_mentions * 20.0), 100.0)

        # 4. Quotability score (short clear declarative sentences)
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        avg_sentence_len = (sum(len(s.split()) for s in sentences) / len(sentences)) if sentences else 0
        quotability_score = 90.0 if 10 <= avg_sentence_len <= 20 else 60.0

        overall = round((struct_score * 0.3) + (quant_score * 0.3) + (entity_score * 0.2) + (quotability_score * 0.2), 1)

        strengths = []
        weaknesses = []
        recs = []

        if struct_score >= 80:
            strengths.append("High structural clarity with headers and formatted lists.")
        else:
            weaknesses.append("Lack of structured elements (tables, bullet points, headers).")
            recs.append("Add structured comparison tables and bullet points to help LLMs extract key data points.")

        if quant_score >= 70:
            strengths.append("Strong quantitative evidence (metrics, stats, data points).")
        else:
            weaknesses.append("Low density of quantitative data and metrics.")
            recs.append("Include specific numbers, benchmark percentages, and pricing stats to increase LLM citation probability.")

        if entity_score >= 60:
            strengths.append(f"Clear entity grounding for '{request.brand_name}'.")
        else:
            weaknesses.append(f"Infrequent mentions of target brand entity '{request.brand_name}'.")
            recs.append(f"Explicitly mention '{request.brand_name}' alongside key product capabilities and category nouns.")

        return GeoAuditResult(
            brand_name=request.brand_name,
            geo_score=overall,
            breakdown=GeoAuditScoreBreakdown(
                structured_data_score=struct_score,
                quantitative_data_score=quant_score,
                entity_grounding_score=entity_score,
                quotability_score=quotability_score,
                overall_geo_score=overall
            ),
            strengths=strengths,
            weaknesses=weaknesses,
            actionable_recommendations=recs
        )

    def _evaluate_prompt_response(self, engine: str, prompt: str, brand: TargetBrand, competitors: List[Competitor]):
        """
        Internal evaluator analyzing engine prompt context for brand and competitor presence.
        """
        p_lower = prompt.lower()
        b_name = brand.name.lower()

        # Simple deterministic simulation logic for prompt matching
        brand_mentioned = True if any(k in p_lower for k in [b_name, "best", "top", "review", "pricing", "alternative"]) else False
        pos = 1 if brand_mentioned else None
        sentiment = "positive" if brand_mentioned else "not_mentioned"

        citations = [
            CitationInfo(url=f"https://{brand.domain}/product", domain=brand.domain, is_brand_owned=True),
            CitationInfo(url=f"https://techcrunch.com/{brand.name.lower()}-review", domain="techcrunch.com", is_brand_owned=False)
        ] if brand_mentioned else []

        comps_mentioned = [c.name for c in competitors if c.name.lower() in p_lower or "best" in p_lower]

        return brand_mentioned, pos, sentiment, citations, comps_mentioned
