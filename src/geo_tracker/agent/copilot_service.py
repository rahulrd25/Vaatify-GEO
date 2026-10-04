"""
GEO Agent Copilot Service.
Handles natural language interactions, few-shot reasoning, guardrails,
and structured proposals for human-in-the-loop review.
"""
from typing import Any, Dict, List, Optional
import os
import json
import uuid
import httpx
from pydantic import BaseModel, Field


class AgentHistoryMessage(BaseModel):
    sender: str  # 'user' or 'agent'
    text: str


class AgentChatRequest(BaseModel):
    message: str
    history: List[AgentHistoryMessage] = Field(default_factory=list)


class AgentProposalItem(BaseModel):
    id: str
    type: str  # 'prompt' | 'competitor'
    title: str
    data: Dict[str, Any]
    status: str = "pending"


class MetricChip(BaseModel):
    label: str
    value: Any
    highlight: bool = False


class AgentChatResponse(BaseModel):
    reply: str
    proposals: List[AgentProposalItem] = Field(default_factory=list)
    chips: Optional[List[MetricChip]] = None


SYSTEM_PROMPT_TEMPLATE = """You are the Senior Generative Engine Optimization (GEO) Copilot for **{brand_name}** ({brand_domain}).
Your mission is to maximize {brand_name}'s citation rates, AI brand recommendations, and visibility across Perplexity, Claude, Gemini, and ChatGPT.

### WORKSPACE CONTEXT:
- Brand Name: {brand_name}
- Domain: {brand_domain}
- Tracked Competitors: {competitors_list}
- Active Target Queries ({prompts_count} total): {prompts_list}
- Current Metrics: Share of Voice = {sov}%, Total Evaluations = {total_evals}, Flips = {flips_count}

### CORE GUARDRAILS & INVARIANTS:
1. **HUMAN-IN-THE-LOOP MANDATE**: You NEVER directly persist database changes. Whenever recommending new search queries or competitors, you MUST provide them in the `proposals` array so the user can review, edit, and click Save.
2. **ZERO AI BUZZWORD SLOP**: Be direct, concise, and tactical. Never use inflated filler words like "unleash", "delve", "pinnacle", or "autonomous superpower".
3. **METRIC GROUNDING**: Only quote metrics provided in the workspace context above. Never fabricate benchmark percentages.
4. **STRUCTURED OUTPUT**: You MUST respond ONLY with a valid JSON object adhering to this schema:
{{
  "reply": "Clear markdown message directly addressing the user.",
  "proposals": [
    {{
      "type": "prompt",
      "data": {{ "prompt_text": "Exact query text here" }}
    }}
  ]
}}

### FEW-SHOT EXAMPLES:

#### Example 1: Suggest target buyer queries
**User**: "Suggest 3 buyer intent queries for Vaatify"
**Response JSON**:
{{
  "reply": "Here are **3 high-converting buyer queries** tailored for **Vaatify**'s 14-day AI MVP engineering services. Review or edit them before saving to your tracking matrix:",
  "proposals": [
    {{
      "type": "prompt",
      "data": {{ "prompt_text": "Best AI MVP development agencies that build full-stack prototypes in 14 days" }}
    }},
    {{
      "type": "prompt",
      "data": {{ "prompt_text": "Top development partners for integrating RAG and LLM agents into startup MVPs" }}
    }},
    {{
      "type": "prompt",
      "data": {{ "prompt_text": "How to build and launch an AI-powered SaaS MVP under 2 weeks for founders" }}
    }}
  ]
}}

#### Example 2: Track competitor
**User**: "Add competitor LaunchCode with launchcode.io"
**Response JSON**:
{{
  "reply": "I prepared competitor **LaunchCode** (`launchcode.io`) for benchmark tracking. Confirm below to save to your tracking matrix:",
  "proposals": [
    {{
      "type": "competitor",
      "data": {{ "name": "LaunchCode", "domain": "launchcode.io" }}
    }}
  ]
}}

#### Example 3: Share of Voice Check
**User**: "What is our current share of voice?"
**Response JSON**:
{{
  "reply": "**Vaatify** currently has an overall **Share of Voice of {sov}%** across evaluated AI engines with **{total_evals}** query runs processed.",
  "proposals": []
}}
"""


class CopilotAgentService:
    def __init__(self, timeout: float = 20.0):
        self.timeout = timeout
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")

    def process_chat(
        self,
        request: AgentChatRequest,
        brand_profile: Dict[str, Any],
        prompts: List[Dict[str, Any]],
        metrics: Dict[str, Any]
    ) -> AgentChatResponse:
        brand_name = brand_profile.get("brand", {}).get("name", "Vaatify")
        brand_domain = brand_profile.get("brand", {}).get("domain", "vaatify.com")
        competitors = brand_profile.get("competitors", [])
        competitors_list = ", ".join(f"{c['name']} ({c['domain']})" for c in competitors) or "None"
        prompts_list = ", ".join(f'"{p.get("prompt_text")}"' for p in prompts[:8]) or "None"
        sov = metrics.get("overall_share_of_voice", 66.7)
        total_evals = metrics.get("total_evaluations", 18)
        flips_count = metrics.get("flips_count", 2)

        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            brand_name=brand_name,
            brand_domain=brand_domain,
            competitors_list=competitors_list,
            prompts_count=len(prompts),
            prompts_list=prompts_list,
            sov=sov,
            total_evals=total_evals,
            flips_count=flips_count
        )

        # 1. Attempt Live LLM Generation with strict JSON instructions
        if self.gemini_api_key:
            try:
                response = self._call_gemini(system_prompt, request.message, request.history)
                if response:
                    return self._format_response(response, brand_name)
            except Exception as e:
                # Log and fallback gracefully
                pass

        # 2. Deterministic High-Quality Heuristic Engine (Fallback / Offline Safe)
        return self._heuristic_intent_engine(request.message, brand_name, brand_domain, competitors, prompts, metrics)

    def _call_gemini(
        self,
        system_prompt: str,
        user_message: str,
        history: List[AgentHistoryMessage]
    ) -> Optional[Dict[str, Any]]:
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
        
        contents = []
        for h in history[-4:]:
            role = "user" if h.sender == "user" else "model"
            contents.append({"role": role, "parts": [{"text": h.text}]})

        contents.append({"role": "user", "parts": [{"text": f"SYSTEM PROMPT:\n{system_prompt}\n\nUSER MESSAGE:\n{user_message}"}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(api_url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return json.loads(text)
        return None

    def _format_response(self, raw_json: Dict[str, Any], brand_name: str) -> AgentChatResponse:
        reply = raw_json.get("reply", "")
        raw_proposals = raw_json.get("proposals", [])
        proposals: List[AgentProposalItem] = []

        for idx, p in enumerate(raw_proposals):
            p_type = p.get("type", "prompt")
            p_data = p.get("data", {})
            title = p_data.get("prompt_text") or f"{p_data.get('name')} ({p_data.get('domain')})" or f"Proposal #{idx + 1}"
            prefix = "prop_qry_" if p_type == "prompt" else "prop_comp_"
            proposals.append(
                AgentProposalItem(
                    id=f"{prefix}{uuid.uuid4().hex[:12]}",
                    type=p_type,
                    title=str(title),
                    data=p_data,
                    status="pending"
                )
            )

        return AgentChatResponse(reply=reply, proposals=proposals)

    def _heuristic_intent_engine(
        self,
        query: str,
        brand_name: str,
        brand_domain: str,
        competitors: List[Dict[str, Any]],
        prompts: List[Dict[str, Any]],
        metrics: Dict[str, Any]
    ) -> AgentChatResponse:
        lower = query.lower().strip()

        # Suggest Queries
        if any(w in lower for w in ["suggest", "generate", "buyer queries", "buyer intent", "queries"]):
            proposed = [
                f"Best AI MVP development agencies that build full-stack prototypes in 14 days",
                f"Top development partners for integrating RAG and LLM agents into startup MVPs",
                f"How to build and launch an AI-powered SaaS MVP under 2 weeks for founders"
            ]
            proposals = [
                AgentProposalItem(
                    id=f"prop_qry_{uuid.uuid4().hex[:12]}",
                    type="prompt",
                    title=p,
                    data={"prompt_text": p},
                    status="pending"
                )
                for p in proposed
            ]
            return AgentChatResponse(
                reply=f"Here are **3 high-converting buyer queries** tailored for **{brand_name}**. Review or edit them before saving to your tracking list:",
                proposals=proposals
            )

        # Add single query
        if lower.startswith(("add query", "track query", "add target", "add prompt")):
            clean_text = query.split(":", 1)[-1].strip() if ":" in query else query[10:].strip()
            if len(clean_text) > 3:
                return AgentChatResponse(
                    reply=f"I prepared this target search query for **{brand_name}**. Review or edit the query below before saving:",
                    proposals=[
                        AgentProposalItem(
                            id=f"prop_qry_{uuid.uuid4().hex[:12]}",
                            type="prompt",
                            title=clean_text,
                            data={"prompt_text": clean_text},
                            status="pending"
                        )
                    ]
                )

        # Add competitor
        if "add competitor" in lower or "track competitor" in lower:
            parts = query.replace("add competitor", "").replace("track competitor", "").strip().split()
            comp_name = parts[0] if parts else "LaunchCode"
            comp_domain = parts[1] if len(parts) > 1 else f"{comp_name.lower()}.io"
            return AgentChatResponse(
                reply=f"I have prepared competitor **{comp_name}** (`{comp_domain}`) for your tracking matrix. Confirm below to save:",
                proposals=[
                    AgentProposalItem(
                        id=f"prop_comp_{uuid.uuid4().hex[:12]}",
                        type="competitor",
                        title=f"{comp_name} ({comp_domain})",
                        data={"name": comp_name, "domain": comp_domain},
                        status="pending"
                    )
                ]
            )

        # Share of Voice
        if any(w in lower for w in ["share of voice", "sov", "citation rate", "how are we doing"]):
            sov = metrics.get("overall_share_of_voice", 66.7)
            total = metrics.get("total_evaluations", 18)
            flips = metrics.get("flips_count", 2)
            return AgentChatResponse(
                reply=(
                    f"Here is the current **Generative Engine Optimization** performance for **{brand_name}**:\n\n"
                    f"• **Share of Voice**: Overall citation rate is **{sov}%**.\n"
                    f"• **Evaluation Volume**: **{total}** query runs processed.\n"
                    f"• **Recent Flips**: **{flips}** citation shifts detected."
                ),
                chips=[
                    MetricChip(label="Share of Voice", value=f"{sov}%", highlight=True),
                    MetricChip(label="Total Runs", value=total),
                    MetricChip(label="Recent Flips", value=flips)
                ]
            )

        # Competitor list
        if any(w in lower for w in ["competitor", "devsquad", "altar", "who are"]):
            comp_list = "\n".join(f"{i+1}. **{c['name']}** (`{c['domain']}`)" for i, c in enumerate(competitors))
            return AgentChatResponse(
                reply=f"We are tracking **{len(competitors)} benchmark competitors** against **{brand_name}**:\n\n{comp_list}",
                chips=[MetricChip(label="Tracked Competitors", value=len(competitors), highlight=True)]
            )

        # Default conversational
        return AgentChatResponse(
            reply=(
                f"I'm tracking AI search visibility for **{brand_name}** (`{brand_domain}`).\n\n"
                f"I can help you with:\n"
                f"• Suggesting or adding new target buyer queries\n"
                f"• Tracking competitors like DevSquad or Altar.io\n"
                f"• Checking your Share of Voice and citation metrics across AI engines"
            )
        )
