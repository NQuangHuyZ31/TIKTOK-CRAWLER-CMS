import asyncio
import logging
import random
import time

from core.config import (
    CIRCUIT_BREAKER_COOLDOWN,
    CIRCUIT_BREAKER_THRESHOLD,
    RATE_LIMIT_PER_SEC,
    REQUEST_DELAY_MAX,
    REQUEST_DELAY_MIN,
)

logger = logging.getLogger(__name__)


class RateLimiter:
    """Global token-interval rate limiter shared across all fixed workers."""

    def __init__(
        self,
        rate_per_sec: float = RATE_LIMIT_PER_SEC,
        delay_min: float = REQUEST_DELAY_MIN,
        delay_max: float = REQUEST_DELAY_MAX,
    ):
        self.min_interval = (1.0 / rate_per_sec) if rate_per_sec > 0 else 0.0
        self.delay_min = max(0.0, delay_min)
        self.delay_max = max(self.delay_min, delay_max)
        self._lock = asyncio.Lock()
        self._next_allowed_time = 0.0

    async def wait_turn(self) -> None:
        if self.min_interval <= 0 and self.delay_max <= 0:
            return
        async with self._lock:
            now = time.monotonic()
            jitter = (
                random.uniform(self.delay_min, self.delay_max)
                if self.delay_max > 0
                else 0.0
            )
            scheduled_time = max(now, self._next_allowed_time) + self.min_interval + jitter
            self._next_allowed_time = scheduled_time
            total_wait = max(0.0, scheduled_time - now)
        if total_wait > 0:
            await asyncio.sleep(total_wait)


class CircuitBreaker:
    """
    Global circuit breaker that pauses all workers for `cooldown_seconds`
    when `threshold` consecutive 429 or CHALLENGE responses occur.
    """

    def __init__(
        self,
        threshold: int = CIRCUIT_BREAKER_THRESHOLD,
        cooldown_seconds: float = CIRCUIT_BREAKER_COOLDOWN,
    ):
        self.threshold = max(1, threshold)
        self.cooldown_seconds = max(0.0, cooldown_seconds)
        self._consecutive_blocks = 0
        self._open_until = 0.0
        self._lock = asyncio.Lock()

    @property
    def is_open(self) -> bool:
        return time.monotonic() < self._open_until

    @property
    def cooldown_remaining(self) -> float:
        return max(0.0, self._open_until - time.monotonic())

    def status_dict(self) -> dict:
        remaining = round(self.cooldown_remaining, 1)
        return {
            "state": "open" if remaining > 0 else "closed",
            "consecutive_blocks": self._consecutive_blocks,
            "threshold": self.threshold,
            "cooldown_remaining_seconds": remaining,
        }

    async def wait_if_open(self) -> None:
        while True:
            remaining = self.cooldown_remaining
            if remaining <= 0:
                return
            logger.warning(
                "Circuit breaker is OPEN; pausing worker for %.1fs before resuming...",
                remaining,
            )
            await asyncio.sleep(remaining)

    async def record_success(self) -> None:
        async with self._lock:
            self._consecutive_blocks = 0

    async def record_block(self, reason: str) -> bool:
        """Record a 429 or CHALLENGE block. Returns True if the breaker just tripped open."""
        async with self._lock:
            self._consecutive_blocks += 1
            if self._consecutive_blocks >= self.threshold:
                self._open_until = time.monotonic() + self.cooldown_seconds
                self._consecutive_blocks = 0
                logger.error(
                    "Circuit breaker TRIPPED after %d consecutive blocks (%s). "
                    "Pausing all workers for %.0fs.",
                    self.threshold,
                    reason,
                    self.cooldown_seconds,
                )
                return True
            return False
