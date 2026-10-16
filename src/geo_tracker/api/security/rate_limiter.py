import time
from typing import Dict, Tuple
from fastapi import HTTPException, status

class InMemoryRateLimiter:
    """
    Sliding-window in-memory rate limiter to prevent Denial-of-Wallet and abuse.
    Tracks requests per client identifier (API key / IP / action).
    """
    def __init__(self):
        # Key: (client_id, action) -> list of timestamps
        self._history: Dict[Tuple[str, str], list] = {}

    def check_rate_limit(self, client_id: str, action: str, max_requests: int, window_seconds: int) -> None:
        now = time.time()
        key = (client_id, action)

        if key not in self._history:
            self._history[key] = []

        # Remove requests older than the rolling window
        self._history[key] = [t for t in self._history[key] if now - t < window_seconds]

        if len(self._history[key]) >= max_requests:
            retry_after = int(window_seconds - (now - self._history[key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for action '{action}'. Maximum {max_requests} requests per {window_seconds}s. Try again in {max_requests}s.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        self._history[key].append(now)

# Global rate limiter instance
rate_limiter = InMemoryRateLimiter()
