"""
Privacy Saga Coordinator (TikTok Crawler v2.2)
Implements:
1. Immediate suppression of entities (account sec_uid / username).
2. Purge cascade: candidate_pool, aliases, sources, discovery_frontier, outbox_events.
3. Audit recording in privacy_purge_jobs.
4. Downstream suppression gate (prevent suppressed entities from being admitted or crawled).
"""

import logging
from pathlib import Path
import sqlite3
import time
from typing import Any, Dict, List, Optional
import uuid

logger = logging.getLogger(__name__)


class PrivacySagaCoordinator:
    def __init__(self, db_path: Path | str):
        self.db_path = Path(db_path)

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @staticmethod
    def now_ms() -> int:
        return int(time.time() * 1000)

    def suppress_entity(
        self,
        entity_type: str,
        entity_key: str,
        reason: Optional[str] = None,
        conn: Optional[sqlite3.Connection] = None,
    ) -> bool:
        """
        Record entity in privacy_suppression. Idempotent.
        """
        key_normalized = entity_key.strip().lower() if entity_type in ("username", "account") else entity_key.strip()
        suppression_id = f"supp_{uuid.uuid4().hex[:16]}"
        now = self.now_ms()

        should_close = False
        if conn is None:
            conn = self._get_connection()
            should_close = True

        try:
            with conn:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO privacy_suppression (
                        suppression_id, entity_type, entity_key, reason, suppressed_at_ms
                    ) VALUES (?, ?, ?, ?, ?);
                    """,
                    (suppression_id, entity_type, key_normalized, reason or "privacy_request", now)
                )
            return True
        finally:
            if should_close:
                conn.close()

    def is_suppressed(
        self,
        entity_type: str,
        entity_key: str,
        conn: Optional[sqlite3.Connection] = None,
    ) -> bool:
        """
        Check if entity is suppressed under either canonical key or username.
        """
        key_normalized = entity_key.strip().lower() if entity_type in ("username", "account") else entity_key.strip()

        should_close = False
        if conn is None:
            conn = self._get_connection()
            should_close = True

        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 1 FROM privacy_suppression
                WHERE entity_type = ? AND entity_key = ?;
                """,
                (entity_type, key_normalized)
            )
            return cursor.fetchone() is not None
        finally:
            if should_close:
                conn.close()

    def purge_entity(
        self,
        entity_type: str,
        entity_key: str,
        purge_request_id: str,
        reason: Optional[str] = "gdpr_purge",
    ) -> Dict[str, Any]:
        """
        Execute full privacy purge cascade:
        1. Record in privacy_suppression
        2. Identify candidate_ids (by sec_uid or normalized username alias)
        3. Delete candidate_sources & candidate_aliases
        4. Cancel active assignments & delete candidate_assignments
        5. Delete candidate_pool records
        6. Delete/cancel from discovery_frontier & discovery_frontier_sources
        7. Cancel/dead-letter undelivered outbox_events matching entity_key
        8. Record in privacy_purge_jobs as completed
        """
        key_normalized = entity_key.strip().lower() if entity_type in ("username", "account") else entity_key.strip()
        now = self.now_ms()
        purge_job_id = f"purge_{uuid.uuid4().hex[:16]}"

        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            # 1. Record suppression
            suppression_id = f"supp_{uuid.uuid4().hex[:16]}"
            cursor.execute(
                """
                INSERT OR IGNORE INTO privacy_suppression (
                    suppression_id, entity_type, entity_key, reason, suppressed_at_ms
                ) VALUES (?, ?, ?, ?, ?);
                """,
                (suppression_id, entity_type, key_normalized, reason, now)
            )

            # 2. Find candidate IDs
            candidate_ids = set()
            if entity_type in ("sec_uid", "account"):
                cursor.execute(
                    "SELECT candidate_id FROM candidate_pool WHERE sec_uid = ?;",
                    (key_normalized,)
                )
                for row in cursor.fetchall():
                    candidate_ids.add(row[0])

            # Also check aliases
            cursor.execute(
                "SELECT candidate_id FROM candidate_aliases WHERE username_normalized = ?;",
                (key_normalized,)
            )
            for row in cursor.fetchall():
                candidate_ids.add(row[0])

            purged_candidates = len(candidate_ids)
            purged_aliases = 0
            purged_sources = 0
            purged_assignments = 0

            # 3. Purge related candidate records
            for cid in candidate_ids:
                # Cancel assignments first
                cursor.execute(
                    """
                    UPDATE candidate_assignments
                    SET status = 'cancelled', released_at_ms = ?
                    WHERE candidate_id = ? AND status = 'active';
                    """,
                    (now, cid)
                )

                # Delete assignments
                cursor.execute("DELETE FROM candidate_assignments WHERE candidate_id = ?;", (cid,))
                purged_assignments += cursor.rowcount

                # Delete sources
                cursor.execute("DELETE FROM candidate_sources WHERE candidate_id = ?;", (cid,))
                purged_sources += cursor.rowcount

                # Delete aliases
                cursor.execute("DELETE FROM candidate_aliases WHERE candidate_id = ?;", (cid,))
                purged_aliases += cursor.rowcount

                # Delete from candidate_pool
                cursor.execute("DELETE FROM candidate_pool WHERE candidate_id = ?;", (cid,))

            # 4. Purge from discovery_frontier
            cursor.execute(
                """
                SELECT frontier_id FROM discovery_frontier
                WHERE username_normalized = ?;
                """,
                (key_normalized,)
            )
            frontier_rows = cursor.fetchall()
            for f_row in frontier_rows:
                f_id = f_row[0]
                cursor.execute("DELETE FROM discovery_frontier_sources WHERE frontier_id = ?;", (f_id,))
                cursor.execute("DELETE FROM discovery_frontier WHERE frontier_id = ?;", (f_id,))

            # 5. Cancel undelivered outbox events for this entity
            cursor.execute(
                """
                UPDATE outbox_events
                SET delivery_state = 'dead_letter',
                    dead_lettered_at_ms = ?
                WHERE entity_key = ?
                  AND delivery_state IN ('pending', 'leased');
                """,
                (now, key_normalized)
            )
            cancelled_events = cursor.rowcount

            # 6. Record audit in privacy_purge_jobs
            cursor.execute(
                """
                INSERT INTO privacy_purge_jobs (
                    purge_job_id, purge_request_id, entity_type, entity_key,
                    status, error_message, created_at_ms, completed_at_ms
                ) VALUES (?, ?, ?, ?, 'completed', NULL, ?, ?);
                """,
                (purge_job_id, purge_request_id, entity_type, key_normalized, now, now)
            )

            conn.commit()

            return {
                "success": True,
                "purge_job_id": purge_job_id,
                "purge_request_id": purge_request_id,
                "entity_type": entity_type,
                "entity_key": key_normalized,
                "purged_candidates": purged_candidates,
                "purged_aliases": purged_aliases,
                "purged_sources": purged_sources,
                "purged_assignments": purged_assignments,
                "cancelled_outbox_events": cancelled_events,
            }
        except Exception as e:
            conn.rollback()
            logger.error(f"Error purging entity {entity_key}: {e}")
            try:
                # Record failure in privacy_purge_jobs
                with conn:
                    conn.execute(
                        """
                        INSERT INTO privacy_purge_jobs (
                            purge_job_id, purge_request_id, entity_type, entity_key,
                            status, error_message, created_at_ms, completed_at_ms
                        ) VALUES (?, ?, ?, ?, 'failed', ?, ?, NULL);
                        """,
                        (purge_job_id, purge_request_id, entity_type, key_normalized, str(e), now)
                    )
            except Exception:
                pass
            raise
        finally:
            conn.close()
