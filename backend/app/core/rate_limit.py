"""In-memory sliding-window rate limiter (OWASP API4: unrestricted resource consumption)."""

import threading
import time
from collections import defaultdict, deque

from fastapi import Request, status

from app.core.errors import AppError


class SlidingWindowLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()
            if len(hits) >= self.max_requests:
                raise AppError(
                    detail="Too many requests. Please wait a moment and try again.",
                    code="RATE_LIMITED",
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            hits.append(now)


auth_limiter = SlidingWindowLimiter(max_requests=10, window_seconds=60)
chat_limiter = SlidingWindowLimiter(max_requests=20, window_seconds=60)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def limit_auth(request: Request) -> None:
    """Throttle login/signup per client IP to slow down credential stuffing."""
    auth_limiter.check(f"auth:{client_ip(request)}")

