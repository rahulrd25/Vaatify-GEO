from typing import Optional

# Prompt limits per plan. None = unlimited.
PLAN_PROMPT_LIMITS: dict[str, Optional[int]] = {
    "expired": 0,
    "trial": 150,
    "starter": 25,
    "pro": 150,
    "enterprise": None,
}

# Plans that can access Agent Copilot & AI citation suggestions
COPILOT_PLANS = {"pro", "enterprise"}

# Plans that get full reports (vs basic summary only)
FULL_REPORT_PLANS = {"pro", "enterprise"}


def get_prompt_limit(plan: str) -> Optional[int]:
    return PLAN_PROMPT_LIMITS.get(plan, 25)  # default to starter limit if unknown


def can_access_copilot(plan: str) -> bool:
    return plan in COPILOT_PLANS


def can_access_full_reports(plan: str) -> bool:
    return plan in FULL_REPORT_PLANS

