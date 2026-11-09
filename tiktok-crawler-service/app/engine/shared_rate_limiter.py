"""
Shared Host Rate Limiter (TikTok Crawler v2.2)
Implements a host-wide SQLite-backed request queue with a strict 2.0 RPS sustained ceiling
(min interval 500ms between grants), 4:1 weighted schedule [profile, profile, profile, profile, discovery],
slot borrowing when one source is idle, and circuit breaker / HTTP 429 Retry-After handling.
"""

import asyncio
import logging
from pathlib import Path
import random
import sqlite3
import time
from typing import Dict, Optional
import uuid

logger = logging.getLogger(__name__)

try:
    from core.config import CRAWLER_GLOBAL_RATE_LIMIT_RPS, SHARED_RATE_LIMIT_PROFILE_WEIGHT
except ImportError:
    try:
        from app.core.config import CRAWLER_GLOBAL_RATE_LIMIT_RPS, SHARED_RATE_LIMIT_PROFILE_WEIGHT
    except ImportError:
        CRAWLER_GLOBAL_RATE_LIMIT_RPS = 2.0
        SHARED_RATE_LIMIT_PROFILE_WEIGHT = 4

GLOBAL_RPS = CRAWLER_GLOBAL_RATE_LIMIT_RPS
MIN_INTERVAL_MS = int(1000 / GLOBAL_RPS) if GLOBAL_RPS > 0 else 500
PERMIT_TTL_MS = 2000   # 2 seconds permit validity
_prof_weight = max(1, SHARED_RATE_LIMIT_PROFILE_WEIGHT)
WEIGHTED_SCHEDULE = ["profile"] * _prof_weight + ["discovery"]


class SharedHostRateLimiter:
    """
    Host-wide SQLite-backed rate limiter for Profile and Discovery crawlers.
    Strictly guarantees that aggregate request rate never exceeds sustained RPS ceiling.
    """

    def __init__(
        self,
        db_path: Path | str,
        rate_limit_rps: Optional[float] = None,
        permit_ttl_ms: Optional[int] = None,
    ):
        self.db_path = Path(db_path)
        self.rate_limit_rps = rate_limit_rps if rate_limit_rps is not None else GLOBAL_RPS
        self.min_interval_ms = int(1000 / self.rate_limit_rps) if self.rate_limit_rps > 0 else MIN_INTERVAL_MS
        self.permit_ttl_ms = permit_ttl_ms if permit_ttl_ms is not None else PERMIT_TTL_MS
        self._ensure_tables_and_state()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @staticmethod
    def now_ms() -> int:
        return int(time.time() * 1000)

    def _ensure_tables_and_state(self) -> None:
        """Initialize singleton state rows if not already present."""
        conn = self._get_connection()
        try:
            with conn:
                now = self.now_ms()
                conn.execute(
                    """
                    INSERT OR IGNORE INTO rate_limit_state (
                        singleton_id, global_next_grant_at_ms, paused_until_ms,
                        weighted_slot_index, last_granted_source, updated_at_ms
                    ) VALUES (1, 0, NULL, 0, NULL, ?);
                    """,
                    (now,)
                )
                conn.execute(
                    """
                    INSERT OR IGNORE INTO rate_limit_source_state (
                        source_class, paused_until_ms, consecutive_429, circuit_state, updated_at_ms
                    ) VALUES ('profile', NULL, 0, 'closed', ?);
                    """,
                    (now,)
                )
                conn.execute(
                    """
                    INSERT OR IGNORE INTO rate_limit_source_state (
                        source_class, paused_until_ms, consecutive_429, circuit_state, updated_at_ms
                    ) VALUES ('discovery', NULL, 0, 'closed', ?);
                    """,
                    (now,)
                )
        finally:
            conn.close()

    def enqueue_request(self, source_class: str) -> str:
        """
        Enqueue a rate limit permit request for the given source_class ('profile' or 'discovery').
        Returns request_id.
        """
        if source_class not in ("profile", "discovery"):
            raise ValueError(f"Invalid source_class: {source_class}. Must be 'profile' or 'discovery'.")

        request_id = f"rl_{uuid.uuid4().hex[:16]}"
        now = self.now_ms()

        conn = self._get_connection()
        try:
            with conn:
                conn.execute(
                    """
                    INSERT INTO rate_limit_requests (
                        request_id, source_class, status, enqueued_at_ms, granted_at_ms, permit_expires_at_ms
                    ) VALUES (?, ?, 'queued', ?, NULL, NULL);
                    """,
                    (request_id, source_class, now)
                )
            return request_id
        finally:
            conn.close()

    def grant_due_requests(self) -> int:
        """
        Evaluate queued requests and grant next permit if due under 2.0 RPS global ceiling.
        Applies 4:1 schedule with idle borrowing.
        Returns 1 if a request was granted, 0 otherwise.
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            now = self.now_ms()

            # 1. Expire stale granted permits
            cursor.execute(
                """
                UPDATE rate_limit_requests
                SET status = 'expired'
                WHERE status = 'granted'
                  AND permit_expires_at_ms IS NOT NULL
                  AND permit_expires_at_ms < ?;
                """,
                (now,)
            )

            # 2. Check global state
            cursor.execute(
                """
                SELECT global_next_grant_at_ms, paused_until_ms, weighted_slot_index
                FROM rate_limit_state
                WHERE singleton_id = 1;
                """
            )
            state_row = cursor.fetchone()
            if not state_row:
                cursor.execute("ROLLBACK;")
                return 0

            global_next_grant_at_ms, global_paused_until_ms, weighted_slot_index = state_row

            # Check global pause
            if global_paused_until_ms and global_paused_until_ms > now:
                cursor.execute("COMMIT;")
                return 0

            # Check global rate limit minimum interval
            if global_next_grant_at_ms > now:
                cursor.execute("COMMIT;")
                return 0

            # 3. Read source states
            cursor.execute(
                "SELECT source_class, paused_until_ms, circuit_state FROM rate_limit_source_state;"
            )
            source_states = {row[0]: {"paused_until_ms": row[1], "circuit_state": row[2]} for row in cursor.fetchall()}

            def is_source_available(src: str) -> bool:
                info = source_states.get(src, {})
                paused = info.get("paused_until_ms")
                circuit = info.get("circuit_state", "closed")
                if circuit == "open":
                    return False
                if paused and paused > now:
                    return False
                return True

            # 4. Schedule source selection (4:1 pattern with borrowing)
            preferred_source = WEIGHTED_SCHEDULE[weighted_slot_index % len(WEIGHTED_SCHEDULE)]
            alternate_source = "discovery" if preferred_source == "profile" else "profile"

            chosen_request = None
            chosen_source = None

            # Check preferred source first if available
            if is_source_available(preferred_source):
                cursor.execute(
                    """
                    SELECT request_id FROM rate_limit_requests
                    WHERE source_class = ? AND status = 'queued'
                    ORDER BY enqueued_at_ms ASC
                    LIMIT 1;
                    """,
                    (preferred_source,)
                )
                row = cursor.fetchone()
                if row:
                    chosen_request = row[0]
                    chosen_source = preferred_source

            # If preferred source has no queued requests or is paused, try borrowing from alternate source
            if not chosen_request and is_source_available(alternate_source):
                cursor.execute(
                    """
                    SELECT request_id FROM rate_limit_requests
                    WHERE source_class = ? AND status = 'queued'
                    ORDER BY enqueued_at_ms ASC
                    LIMIT 1;
                    """,
                    (alternate_source,)
                )
                row = cursor.fetchone()
                if row:
                    chosen_request = row[0]
                    chosen_source = alternate_source

            if not chosen_request:
                # No requests to grant right now
                cursor.execute("COMMIT;")
                return 0

            # 5. Grant permit to chosen request
            permit_expires_at_ms = now + self.permit_ttl_ms
            cursor.execute(
                """
                UPDATE rate_limit_requests
                SET status = 'granted',
                    granted_at_ms = ?,
                    permit_expires_at_ms = ?
                WHERE request_id = ?;
                """,
                (now, permit_expires_at_ms, chosen_request)
            )

            # 6. Advance rate limit state
            # Next grant is strictly now + min_interval_ms (sustained ceiling)
            new_next_grant_at_ms = max(now, global_next_grant_at_ms) + self.min_interval_ms
            new_slot_index = (weighted_slot_index + 1) % len(WEIGHTED_SCHEDULE)

            cursor.execute(
                """
                UPDATE rate_limit_state
                SET global_next_grant_at_ms = ?,
                    weighted_slot_index = ?,
                    last_granted_source = ?,
                    updated_at_ms = ?
                WHERE singleton_id = 1;
                """,
                (new_next_grant_at_ms, new_slot_index, chosen_source, now)
            )

            cursor.execute("COMMIT;")
            return 1
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    def get_request_status(self, request_id: str) -> Optional[Dict]:
        """Query current status of a rate limit request."""
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                """
                SELECT request_id, source_class, status, enqueued_at_ms, granted_at_ms, permit_expires_at_ms
                FROM rate_limit_requests
                WHERE request_id = ?;
                """,
                (request_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "request_id": row[0],
                "source_class": row[1],
                "status": row[2],
                "enqueued_at_ms": row[3],
                "granted_at_ms": row[4],
                "permit_expires_at_ms": row[5],
            }
        finally:
            conn.close()

    def acquire_permit_sync(
        self,
        source_class: str,
        timeout_s: float = 30.0,
        poll_interval_s: float = 0.05,
    ) -> str:
        """
        Synchronous helper to enqueue and wait for a permit to be granted.
        Returns request_id once granted.
        Raises TimeoutError or RuntimeError if expired/cancelled.
        """
        request_id = self.enqueue_request(source_class)
        deadline = time.time() + timeout_s

        while time.time() < deadline:
            self.grant_due_requests()
            req = self.get_request_status(request_id)
            if not req:
                raise RuntimeError(f"Rate limit request {request_id} disappeared")

            if req["status"] == "granted":
                now = self.now_ms()
                if req["permit_expires_at_ms"] and req["permit_expires_at_ms"] <= now:
                    raise RuntimeError(f"Rate limit permit {request_id} expired before acquisition")
                return request_id
            elif req["status"] == "expired":
                raise RuntimeError(f"Rate limit request {request_id} expired")
            elif req["status"] == "cancelled":
                raise RuntimeError(f"Rate limit request {request_id} was cancelled")

            time.sleep(poll_interval_s)

        raise TimeoutError(f"Timed out waiting for rate limit permit ({timeout_s}s) for {source_class}")

    async def acquire_permit(
        self,
        source_class: str,
        timeout_s: float = 30.0,
        poll_interval_s: float = 0.05,
    ) -> str:
        """
        Asynchronous helper to enqueue and wait for a permit to be granted.
        Returns request_id once granted.
        """
        request_id = self.enqueue_request(source_class)
        deadline = time.time() + timeout_s

        while time.time() < deadline:
            self.grant_due_requests()
            req = self.get_request_status(request_id)
            if not req:
                raise RuntimeError(f"Rate limit request {request_id} disappeared")

            if req["status"] == "granted":
                now = self.now_ms()
                if req["permit_expires_at_ms"] and req["permit_expires_at_ms"] <= now:
                    raise RuntimeError(f"Rate limit permit {request_id} expired before acquisition")
                return request_id
            elif req["status"] == "expired":
                raise RuntimeError(f"Rate limit request {request_id} expired")
            elif req["status"] == "cancelled":
                raise RuntimeError(f"Rate limit request {request_id} was cancelled")

            await asyncio.sleep(poll_interval_s)

        raise TimeoutError(f"Timed out waiting for rate limit permit ({timeout_s}s) for {source_class}")

    def record_response(
        self,
        source_class: str,
        status_code: int,
        retry_after_s: Optional[float] = None,
    ) -> None:
        """
        Record HTTP response status for circuit breaker and rate limit adjustments.
        - HTTP 429: pauses source according to Retry-After or exponential backoff with full jitter.
        - HTTP 403: opens circuit breaker, pauses for 60s.
        - HTTP 2xx: resets consecutive_429 and restores closed circuit state.
        """
        conn = self._get_connection()
        try:
            with conn:
                now = self.now_ms()
                cursor = conn.execute(
                    """
                    SELECT consecutive_429, circuit_state
                    FROM rate_limit_source_state
                    WHERE source_class = ?;
                    """,
                    (source_class,)
                )
                row = cursor.fetchone()
                current_consecutive = row[0] if row else 0

                if status_code == 429:
                    new_consecutive = current_consecutive + 1
                    if retry_after_s is not None and retry_after_s > 0:
                        pause_ms = int(retry_after_s * 1000)
                    else:
                        # Full jitter exponential backoff: base 2s * 1.5^(attempt) + random jitter
                        base_s = min(30.0, 2.0 * (1.5 ** min(new_consecutive - 1, 6)))
                        jitter = random.uniform(0.5, 1.5)
                        pause_ms = int(base_s * jitter * 1000)

                    paused_until_ms = now + pause_ms
                    conn.execute(
                        """
                        UPDATE rate_limit_source_state
                        SET consecutive_429 = ?,
                            paused_until_ms = ?,
                            updated_at_ms = ?
                        WHERE source_class = ?;
                        """,
                        (new_consecutive, paused_until_ms, now, source_class)
                    )
                    logger.warning(
                        "Rate limiter received 429 on %s: paused until %s (+%d ms, consecutive=%d)",
                        source_class, paused_until_ms, pause_ms, new_consecutive
                    )

                elif status_code == 403:
                    # Antibot / Captcha block -> Open circuit breaker
                    paused_until_ms = now + 60000  # 60s quarantine
                    conn.execute(
                        """
                        UPDATE rate_limit_source_state
                        SET circuit_state = 'open',
                            paused_until_ms = ?,
                            updated_at_ms = ?
                        WHERE source_class = ?;
                        """,
                        (paused_until_ms, now, source_class)
                    )
                    logger.error("Rate limiter received 403 on %s: circuit opened for 60s", source_class)

                elif 200 <= status_code < 300:
                    # Successful response resets consecutive 429
                    conn.execute(
                        """
                        UPDATE rate_limit_source_state
                        SET consecutive_429 = 0,
                            circuit_state = 'closed',
                            paused_until_ms = NULL,
                            updated_at_ms = ?
                        WHERE source_class = ?;
                        """,
                        (now, source_class)
                    )
        finally:
            conn.close()

    def get_state(self) -> Dict:
        """Query complete snapshot of rate limiter state."""
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                """
                SELECT global_next_grant_at_ms, paused_until_ms, weighted_slot_index, last_granted_source, updated_at_ms
                FROM rate_limit_state
                WHERE singleton_id = 1;
                """
            )
            state_row = cursor.fetchone()

            cursor = conn.execute(
                "SELECT source_class, paused_until_ms, consecutive_429, circuit_state, updated_at_ms FROM rate_limit_source_state;"
            )
            sources = {
                row[0]: {
                    "paused_until_ms": row[1],
                    "consecutive_429": row[2],
                    "circuit_state": row[3],
                    "updated_at_ms": row[4],
                }
                for row in cursor.fetchall()
            }

            cursor = conn.execute(
                "SELECT status, source_class, COUNT(*) FROM rate_limit_requests GROUP BY status, source_class;"
            )
            requests_summary = {}
            for row in cursor.fetchall():
                key = f"{row[0]}:{row[1]}"
                requests_summary[key] = row[2]

            return {
                "global_next_grant_at_ms": state_row[0] if state_row else 0,
                "paused_until_ms": state_row[1] if state_row else None,
                "weighted_slot_index": state_row[2] if state_row else 0,
                "last_granted_source": state_row[3] if state_row else None,
                "sources": sources,
                "requests_summary": requests_summary,
            }
        finally:
            conn.close()
