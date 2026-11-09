"""
Durable Outbox Dispatcher (TikTok Crawler v2.2)
Gathers pending outbox events into immutable batches, signs raw request bodies with HMAC-SHA256,
dispatches to Laravel Webhook endpoint, and handles Partial ACK responses, Dispatcher Lease Fencing,
HTTP 413 batch splitting, and DLQ parent-child dependency blocking/unblocking.
"""

import asyncio
from datetime import datetime, timezone
import hashlib
import hmac
import json
import logging
from pathlib import Path
import sqlite3
import time
from typing import Any, Dict, List, Optional
import httpx

try:
    from core.config import (
        LARAVEL_BASE_URL,
        CRAWLER_HMAC_SECRET,
        CRAWLER_KEY_ID,
        OUTBOX_BATCH_SIZE,
        OUTBOX_DISPATCH_TIMEOUT,
    )
except ImportError:
    try:
        from app.core.config import (
            LARAVEL_BASE_URL,
            CRAWLER_HMAC_SECRET,
            CRAWLER_KEY_ID,
            OUTBOX_BATCH_SIZE,
            OUTBOX_DISPATCH_TIMEOUT,
        )
    except ImportError:
        LARAVEL_BASE_URL = "http://127.0.0.1:8000"
        CRAWLER_HMAC_SECRET = "2703ac97eb897aacbf1235f5e608bf93d2ca7e0c2fe9d09a35e44f6ad6ab410c"
        CRAWLER_KEY_ID = "key_v1"
        OUTBOX_BATCH_SIZE = 25
        OUTBOX_DISPATCH_TIMEOUT = 5.0

logger = logging.getLogger(__name__)


class FencingException(Exception):
    """Raised when dispatcher loses its batch lease due to expiration or reclamation."""
    pass


class OutboxDispatcher:
    def __init__(
        self,
        db_path: Path | str,
        laravel_url: Optional[str] = None,
        hmac_secret: Optional[str] = None,
        key_id: Optional[str] = None,
        batch_size: Optional[int] = None,
        timeout: Optional[float] = None,
    ):
        self.db_path = Path(db_path)
        self.laravel_url = (laravel_url or LARAVEL_BASE_URL).rstrip("/")
        self.hmac_secret = hmac_secret or CRAWLER_HMAC_SECRET
        self.key_id = key_id or CRAWLER_KEY_ID
        self.batch_size = batch_size if batch_size is not None else OUTBOX_BATCH_SIZE
        self.timeout = timeout if timeout is not None else OUTBOX_DISPATCH_TIMEOUT

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @staticmethod
    def now_ms() -> int:
        return int(time.time() * 1000)

    def create_batches(self) -> List[str]:
        """
        Group eligible pending outbox events into immutable batches.
        Enforces single active membership via active_batch_id pointer.
        Uses 'building' status during creation to satisfy immutability triggers,
        then transitions batch to 'ready'.
        Returns list of newly created batch_ids.
        """
        created_batches = []
        conn = self._get_connection()
        try:
            with conn:
                # Find pending events with no active_batch_id
                cursor = conn.execute(
                    """
                    SELECT event_id, crawl_run_id, entity_type, payload_json
                    FROM outbox_events
                    WHERE delivery_state = 'pending'
                      AND active_batch_id IS NULL
                    ORDER BY first_eligible_at_ms ASC, created_at_ms ASC
                    LIMIT 200;
                    """
                )
                rows = cursor.fetchall()
                if not rows:
                    return created_batches

                # Group into chunks of batch_size
                for i in range(0, len(rows), self.batch_size):
                    chunk_rows = rows[i : i + self.batch_size]
                    batch_id = f"batch_{self.now_ms()}_{i // self.batch_size}"
                    crawl_run_id = chunk_rows[0][1]
                    now = self.now_ms()

                    # Calculate total bytes
                    payload_bytes = sum(len(r[3].encode("utf-8")) if r[3] else 0 for r in chunk_rows)

                    # 1. Insert Batch in 'building' status
                    conn.execute(
                        """
                        INSERT INTO outbox_batches (
                            batch_id, crawl_run_id, events_count, payload_bytes,
                            status, created_at_ms
                        ) VALUES (?, ?, ?, ?, 'building', ?);
                        """,
                        (batch_id, crawl_run_id, len(chunk_rows), payload_bytes, now),
                    )

                    # 2. Link immutable membership and update active_batch_id pointer
                    for seq, r in enumerate(chunk_rows, 1):
                        eid = r[0]
                        conn.execute(
                            """
                            INSERT INTO outbox_batch_events (batch_id, event_id, sequence_order)
                            VALUES (?, ?, ?);
                            """,
                            (batch_id, eid, seq),
                        )
                        conn.execute(
                            """
                            UPDATE outbox_events
                            SET active_batch_id = ?,
                                delivery_state = 'locked_in_batch'
                            WHERE event_id = ?;
                            """,
                            (batch_id, eid),
                        )

                    # 3. Transition Batch to 'ready'
                    conn.execute(
                        "UPDATE outbox_batches SET status = 'ready' WHERE batch_id = ?;",
                        (batch_id,),
                    )

                    created_batches.append(batch_id)
        finally:
            conn.close()

        return created_batches

    def claim_next_batch(
        self,
        dispatcher_id: str = "dispatcher_default",
        lease_duration_ms: int = 15000,
    ) -> Optional[Dict[str, Any]]:
        """
        Claim the oldest ready or stale batch using BEGIN IMMEDIATE and lease fencing (Test T09).
        Returns batch metadata with lease_token and lease_epoch, or None.
        """
        now = self.now_ms()
        conn = self._get_connection()
        try:
            with conn:
                row = conn.execute(
                    """
                    SELECT batch_id, lease_epoch, status
                    FROM outbox_batches
                    WHERE (status = 'ready' AND (next_attempt_at_ms IS NULL OR next_attempt_at_ms <= ?))
                       OR (status = 'sending' AND lease_expires_at_ms <= ?)
                    ORDER BY created_at_ms ASC
                    LIMIT 1;
                    """,
                    (now, now),
                ).fetchone()

                if not row:
                    return None

                batch_id = row[0]
                old_epoch = row[1]
                new_epoch = old_epoch + 1
                lease_token = f"tok_{dispatcher_id}_{now}"
                lease_expires = now + lease_duration_ms

                cur = conn.execute(
                    """
                    UPDATE outbox_batches
                    SET status = 'sending',
                        locked_by = ?,
                        lease_token = ?,
                        lease_epoch = ?,
                        lease_expires_at_ms = ?
                    WHERE batch_id = ?
                      AND (
                          (status = 'ready')
                          OR (status = 'sending' AND lease_expires_at_ms <= ?)
                      );
                    """,
                    (dispatcher_id, lease_token, new_epoch, lease_expires, batch_id, now),
                )
                if cur.rowcount != 1:
                    return None

                return {
                    "batch_id": batch_id,
                    "dispatcher_id": dispatcher_id,
                    "lease_token": lease_token,
                    "lease_epoch": new_epoch,
                    "lease_expires_at_ms": lease_expires,
                }
        finally:
            conn.close()

    def _verify_lease(self, batch_id: str, lease_token: str, lease_epoch: int) -> bool:
        """Verify that dispatcher currently owns the valid active lease."""
        now = self.now_ms()
        conn = self._get_connection()
        try:
            row = conn.execute(
                """
                SELECT 1 FROM outbox_batches
                WHERE batch_id = ?
                  AND status = 'sending'
                  AND lease_token = ?
                  AND lease_epoch = ?
                  AND lease_expires_at_ms > ?;
                """,
                (batch_id, lease_token, lease_epoch, now),
            ).fetchone()
            return row is not None
        finally:
            conn.close()

    def build_batch_payload(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """Construct the full webhook request payload for an immutable batch."""
        conn = self._get_connection()
        try:
            batch_row = conn.execute(
                "SELECT batch_id, crawl_run_id, events_count FROM outbox_batches WHERE batch_id = ?;",
                (batch_id,),
            ).fetchone()
            if not batch_row:
                return None

            events_cursor = conn.execute(
                """
                SELECT e.schema_version, e.event_id, e.logical_event_key, e.parent_event_id,
                       e.crawl_run_id, e.entity_type, e.entity_key, e.operation,
                       e.entity_revision, e.observed_at, e.payload_hash, e.payload_json
                FROM outbox_batch_events be
                JOIN outbox_events e ON be.event_id = e.event_id
                WHERE be.batch_id = ?
                ORDER BY be.sequence_order ASC;
                """,
                (batch_id,),
            )

            events_list = []
            for r in events_cursor.fetchall():
                payload_obj = json.loads(r[11]) if r[11] else {}
                events_list.append({
                    "schema_version": r[0],
                    "event_id": r[1],
                    "logical_event_key": r[2],
                    "parent_event_id": r[3],
                    "crawl_run_id": r[4],
                    "entity_type": r[5],
                    "entity_key": r[6],
                    "operation": r[7],
                    "entity_revision": r[8],
                    "observed_at": r[9],
                    "payload_hash": r[10],
                    "payload": payload_obj,
                })

            return {
                "batch_id": batch_row[0],
                "crawl_run_id": batch_row[1],
                "events_count": len(events_list),
                "events": events_list,
            }
        finally:
            conn.close()

    def generate_hmac_headers(self, raw_body: str, path: str = "/admin/api/public/crawler/webhook/batch") -> Dict[str, str]:
        """
        Generate HMAC-SHA256 headers adhering to v2.2 specification:
        Signature = HMAC-SHA256(secret, timestamp + '\n' + HTTP_METHOD + '\n' + canonical_path + '\n' + SHA256(raw_body))
        """
        timestamp = str(int(time.time()))
        body_hash = hashlib.sha256(raw_body.encode("utf-8")).hexdigest()
        canonical_path = "/" + path.lstrip("/")
        payload_to_sign = f"{timestamp}\nPOST\n{canonical_path}\n{body_hash}"

        signature = hmac.new(
            self.hmac_secret.encode("utf-8"),
            payload_to_sign.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Crawler-Key-Id": self.key_id,
            "X-Crawler-Timestamp": timestamp,
            "X-Crawler-Signature": signature,
        }

    async def dispatch_batch(
        self,
        batch_id: str,
        client: Optional[httpx.AsyncClient] = None,
        lease_token: Optional[str] = None,
        lease_epoch: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Send a single batch to Laravel, record attempt, and process Partial ACK response.
        Enforces lease fencing (T09) and handles HTTP 413 split (T10).
        """
        payload_dict = self.build_batch_payload(batch_id)
        if not payload_dict:
            return {"status": "error", "message": f"Batch {batch_id} not found."}

        raw_body = json.dumps(payload_dict, separators=(",", ":"), ensure_ascii=False)
        endpoint = f"{self.laravel_url}/admin/api/public/crawler/webhook/batch"
        headers = self.generate_hmac_headers(raw_body, path="/admin/api/public/crawler/webhook/batch")

        start_time = time.time()
        should_close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=self.timeout)
            should_close_client = True

        status_code = None
        resp_body = None
        error_msg = None
        success = False
        parsed_response = {}

        try:
            resp = await client.post(endpoint, content=raw_body, headers=headers)
            status_code = resp.status_code
            resp_body = resp.text
            duration_ms = int((time.time() - start_time) * 1000)

            if resp.status_code == 200:
                success = True
                parsed_response = resp.json()
            elif resp.status_code == 413:
                # HTTP 413: Payload Too Large (Test T10)
                error_msg = "HTTP 413 Payload Too Large"
            else:
                error_msg = f"HTTP {resp.status_code}: {resp.text[:200]}"
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
        finally:
            if should_close_client:
                await client.aclose()

        # Fencing check before mutating state: if a lease was provided, ensure it was not lost
        if lease_token is not None and lease_epoch is not None:
            if not self._verify_lease(batch_id, lease_token, lease_epoch):
                logger.warning(f"FencingException: Dispatcher lost lease on batch {batch_id}. Aborting result commit.")
                return {
                    "batch_id": batch_id,
                    "success": False,
                    "status": "lease_lost",
                    "error": "Dispatcher lease expired or was reclaimed",
                }

        # 1. Record delivery attempt
        self._record_delivery_attempt(batch_id, status_code, resp_body, error_msg, duration_ms)

        # 2. Handle HTTP 413 Batch Split
        if status_code == 413:
            new_sub_batches = self.handle_batch_payload_too_large(batch_id)
            return {
                "batch_id": batch_id,
                "success": False,
                "status": "split_superseded" if new_sub_batches else "dead_letter",
                "sub_batches": new_sub_batches,
                "status_code": 413,
            }

        # 3. Handle Success 200 Partial ACK
        if success and parsed_response:
            self._apply_partial_ack_response(batch_id, parsed_response)

        return {
            "batch_id": batch_id,
            "success": success,
            "status_code": status_code,
            "response": parsed_response or error_msg,
        }

    def handle_batch_payload_too_large(self, batch_id: str) -> List[str]:
        """
        Handles HTTP 413 Payload Too Large (Test T10):
        1. If batch has 1 event: mark event as dead_letter (PAYLOAD_EXCEEDS_MAX_SIZE),
           cascade block child events, update batch status to dead_letter.
        2. If batch has >1 events: mark batch as 'split_superseded', split events
           into two sub-batches, re-assign active_batch_id, insert sub-batch events.
        Returns list of new sub-batch IDs created (empty if single-event dead-lettered).
        """
        now = self.now_ms()
        conn = self._get_connection()
        try:
            with conn:
                cursor = conn.execute(
                    """
                    SELECT be.event_id, be.sequence_order, e.crawl_run_id, e.payload_json
                    FROM outbox_batch_events be
                    JOIN outbox_events e ON be.event_id = e.event_id
                    WHERE be.batch_id = ?
                    ORDER BY be.sequence_order ASC;
                    """,
                    (batch_id,),
                )
                rows = cursor.fetchall()
                if not rows:
                    return []

                crawl_run_id = rows[0][2]

                if len(rows) <= 1:
                    single_id = rows[0][0]
                    # Mark dead letter
                    conn.execute(
                        """
                        UPDATE outbox_events
                        SET delivery_state = 'dead_letter',
                            dead_lettered_at_ms = ?,
                            active_batch_id = NULL
                        WHERE event_id = ?;
                        """,
                        (now, single_id),
                    )
                    # Cascade to child events (T17)
                    self._apply_dead_letter_cascading(conn, [single_id], now)

                    conn.execute(
                        """
                        UPDATE outbox_batches
                        SET status = 'dead_letter',
                            locked_by = NULL,
                            lease_token = NULL
                        WHERE batch_id = ?;
                        """,
                        (batch_id,),
                    )
                    return []

                # Multiple events: Split into two sub-batches
                mid = len(rows) // 2
                sub_groups = [rows[:mid], rows[mid:]]
                new_sub_batch_ids = []

                # Mark parent batch as split_superseded
                conn.execute(
                    """
                    UPDATE outbox_batches
                    SET status = 'split_superseded',
                        locked_by = NULL,
                        lease_token = NULL
                    WHERE batch_id = ?;
                    """,
                    (batch_id,),
                )

                for idx, group in enumerate(sub_groups):
                    sub_id = f"{batch_id}_sub{idx}"
                    payload_bytes = sum(len(r[3].encode("utf-8")) if r[3] else 0 for r in group)

                    # 1. Create sub-batch in 'building'
                    conn.execute(
                        """
                        INSERT INTO outbox_batches (
                            batch_id, parent_batch_id, crawl_run_id, events_count,
                            payload_bytes, status, created_at_ms
                        ) VALUES (?, ?, ?, ?, ?, 'building', ?);
                        """,
                        (sub_id, batch_id, crawl_run_id, len(group), payload_bytes, now),
                    )

                    # 2. Add members and re-point active_batch_id
                    for seq, r in enumerate(group, 1):
                        eid = r[0]
                        conn.execute(
                            """
                            INSERT INTO outbox_batch_events (batch_id, event_id, sequence_order)
                            VALUES (?, ?, ?);
                            """,
                            (sub_id, eid, seq),
                        )
                        conn.execute(
                            """
                            UPDATE outbox_events
                            SET active_batch_id = ?,
                                delivery_state = 'locked_in_batch'
                            WHERE event_id = ?;
                            """,
                            (sub_id, eid),
                        )

                    # 3. Transition sub-batch to 'ready'
                    conn.execute(
                        "UPDATE outbox_batches SET status = 'ready' WHERE batch_id = ?;",
                        (sub_id,),
                    )
                    new_sub_batch_ids.append(sub_id)

                return new_sub_batch_ids
        finally:
            conn.close()

    def _record_delivery_attempt(
        self,
        batch_id: str,
        http_code: Optional[int],
        body: Optional[str],
        error_msg: Optional[str],
        duration_ms: int
    ):
        conn = self._get_connection()
        try:
            with conn:
                attempt_row = conn.execute(
                    "SELECT COALESCE(MAX(attempt_number), 0) + 1 FROM outbox_delivery_attempts WHERE batch_id = ?;",
                    (batch_id,),
                ).fetchone()
                attempt_num = attempt_row[0]
                attempt_id = f"att_{batch_id}_{attempt_num}"

                conn.execute(
                    """
                    INSERT INTO outbox_delivery_attempts (
                        attempt_id, batch_id, attempt_number, response_http_code,
                        response_body, error_message, duration_ms, attempted_at_ms
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        attempt_id,
                        batch_id,
                        attempt_num,
                        http_code,
                        (body[:1000] if body else None),
                        (error_msg[:500] if error_msg else None),
                        duration_ms,
                        self.now_ms(),
                    ),
                )
                conn.execute(
                    "UPDATE outbox_batches SET attempt_count = attempt_count + 1 WHERE batch_id = ?;",
                    (batch_id,),
                )
        finally:
            conn.close()

    def _apply_partial_ack_response(self, batch_id: str, ack_response: Dict[str, Any]):
        """
        Update outbox events and batch status based on Laravel Partial ACK response.
        Enforces dead letter cascading (Test T17).
        """
        ack_ids = set(ack_response.get("acknowledged_event_ids") or [])
        retry_ids = set(ack_response.get("retryable_event_ids") or [])
        reject_ids = set(ack_response.get("rejected_event_ids") or [])
        batch_status = ack_response.get("status") or "delivered"
        now = self.now_ms()

        conn = self._get_connection()
        try:
            with conn:
                # 1. Acknowledged events -> delivered
                for eid in ack_ids:
                    conn.execute(
                        """
                        UPDATE outbox_events
                        SET delivery_state = 'delivered',
                            delivered_at_ms = ?,
                            active_batch_id = NULL
                        WHERE event_id = ?;
                        """,
                        (now, eid),
                    )

                # 2. Retryable events -> retry_wait
                for eid in retry_ids:
                    conn.execute(
                        """
                        UPDATE outbox_events
                        SET delivery_state = 'retry_wait',
                            retry_count = retry_count + 1,
                            next_attempt_at_ms = ? + 5000,
                            active_batch_id = NULL
                        WHERE event_id = ?;
                        """,
                        (now, eid),
                    )

                # 3. Rejected events -> dead_letter + cascade (T17)
                for eid in reject_ids:
                    conn.execute(
                        """
                        UPDATE outbox_events
                        SET delivery_state = 'dead_letter',
                            dead_lettered_at_ms = ?,
                            active_batch_id = NULL
                        WHERE event_id = ?;
                        """,
                        (now, eid),
                    )

                if reject_ids:
                    self._apply_dead_letter_cascading(conn, list(reject_ids), now)

                # 4. Update batch status and release lease
                conn.execute(
                    """
                    UPDATE outbox_batches
                    SET status = ?,
                        locked_by = NULL,
                        lease_token = NULL,
                        delivered_at_ms = ?
                    WHERE batch_id = ?;
                    """,
                    (batch_status, now if batch_status == "delivered" else None, batch_id),
                )
        finally:
            conn.close()

    @staticmethod
    def _apply_dead_letter_cascading(conn: sqlite3.Connection, dead_letter_ids: List[str], now_ms: int):
        """
        When account events become dead_letter, cascade block all child events (videos)
        referencing parent_event_id. (Test T17).
        """
        for parent_id in dead_letter_ids:
            conn.execute(
                """
                UPDATE outbox_events
                SET delivery_state = 'blocked_by_parent_dead_letter',
                    active_batch_id = NULL
                WHERE parent_event_id = ?
                  AND delivery_state IN ('pending', 'retry_wait', 'locked_in_batch');
                """,
                (parent_id,),
            )

    def unblock_child_events(self, parent_event_id: str) -> int:
        """
        When parent account event is successfully replayed/delivered, unblock child events
        and refresh their first_eligible_at_ms to now so they don't prematurely expire. (Test T18).
        """
        now = self.now_ms()
        conn = self._get_connection()
        try:
            with conn:
                cur = conn.execute(
                    """
                    UPDATE outbox_events
                    SET delivery_state = 'pending',
                        first_eligible_at_ms = ?,
                        next_attempt_at_ms = NULL,
                        active_batch_id = NULL
                    WHERE parent_event_id = ?
                      AND delivery_state = 'blocked_by_parent_dead_letter';
                    """,
                    (now, parent_event_id),
                )
                return cur.rowcount
        finally:
            conn.close()

    async def dispatch_pending_batches(self, dispatcher_id: str = "dispatcher_01") -> List[Dict[str, Any]]:
        """Full pipeline: create batches from pending events, claim with lease, and dispatch."""
        self.create_batches()
        results = []
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while True:
                claim = self.claim_next_batch(dispatcher_id=dispatcher_id)
                if not claim:
                    break
                bid = claim["batch_id"]
                res = await self.dispatch_batch(
                    bid,
                    client=client,
                    lease_token=claim["lease_token"],
                    lease_epoch=claim["lease_epoch"],
                )
                results.append(res)
        return results
