import time
from typing import Dict, Tuple, List
from fastapi import HTTPException, status

class InMemoryRateLimiter:
    """
    Sliding-window in-memory rate limiter to prevent Denial-of-Wallet and abuse.
    Tracks requests per client identifier (API key / IP / action).
    Includes automatic key pruning to prevent memory exhaustion (DoS).
    """
    MAX_TRACKED_KEYS = 10000

    def __init__(self):
        # Key: (client_id, action) -> list of timestamps
        self._history: Dict[Tuple[str, str], List[float]] = {}
        self._last_cleanup = time.time()

    def _prune_expired_keys(self, now: float) -> None:
        """Prunes keys that have no recent timestamps to bound memory usage."""
        expired_keys = [
            k for k, timestamps in self._history.items()
            if not timestamps or (now - timestamps[-1] > 3600)
        ]
        for k in expired_keys:
            self._history.pop(k, None)

    def check_rate_limit(self, client_id: str, action: str, max_requests: int, window_seconds: int) -> None:
        now = time.time()

        # Periodically prune stale keys (every 60 seconds or if size exceeds threshold)
        if (now - self._last_cleanup > 60) or (len(self._history) > self.MAX_TRACKED_KEYS):
            self._prune_expired_keys(now)
            self._last_cleanup = now

        key = (client_id, action)
        if key not in self._history:
            if len(self._history) >= self.MAX_TRACKED_KEYS:
                oldest_key = next(iter(self._history))
                self._history.pop(oldest_key, None)
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
