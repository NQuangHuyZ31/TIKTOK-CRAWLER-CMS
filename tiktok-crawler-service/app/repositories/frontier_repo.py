"""
Frontier Repository (SQLite WAL)
Encapsulates all raw SQL queries and transactions for:
- discovery_frontier
- discovery_frontier_sources
"""

import logging
from pathlib import Path
import sqlite3
from typing import List, Optional, Tuple
import uuid

try:
    from repositories.base import BaseRepository
except ImportError:
    from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class FrontierRepository(BaseRepository):
    def __init__(self, db_path: Path | str):
        super().__init__(db_path)

    def enqueue_candidate(
        self,
        norm_user: str,
        source_type: str = "mention",
        source_reference: str = "discovery",
        conn: Optional[sqlite3.Connection] = None,
    ) -> Optional[str]:
        """
        Add a discovered username to discovery_frontier and its source attribution.
        Deduplicates against candidate_aliases and discovery_frontier.
        Returns frontier_id if inserted, None otherwise.
        """
        now = self.now_ms()
        frontier_id = f"front_{uuid.uuid4().hex[:16]}"
        source_id = f"fsrc_{uuid.uuid4().hex[:16]}"

        owns_conn = conn is None
        if owns_conn:
            conn = self._get_connection()

        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT 1 FROM candidate_aliases WHERE username_normalized = ? AND is_current = 1
                    UNION
                    SELECT 1 FROM discovery_frontier WHERE username_normalized = ?;
                    """,
                    (norm_user, norm_user)
                )
                if cursor.fetchone() is not None:
                    return None

                conn.execute(
                    """
                    INSERT OR IGNORE INTO discovery_frontier (
                        frontier_id, username_normalized, status,
                        validation_attempts, created_at_ms, updated_at_ms
                    ) VALUES (?, ?, 'pending', 0, ?, ?);
                    """,
                    (frontier_id, norm_user, now, now)
                )

                cursor.execute(
                    "SELECT frontier_id FROM discovery_frontier WHERE username_normalized = ?;",
                    (norm_user,)
                )
                actual_fid = cursor.fetchone()[0]

                conn.execute(
                    """
                    INSERT OR IGNORE INTO discovery_frontier_sources (
                        frontier_source_id, frontier_id, source_type,
                        source_reference, discovered_at_ms
                    ) VALUES (?, ?, ?, ?, ?);
                    """,
                    (source_id, actual_fid, source_type, source_reference, now)
                )

                return actual_fid
        finally:
            if owns_conn:
                conn.close()

    def get_pending_candidates(self, limit: int) -> List[Tuple[str, str]]:
        """Retrieve pending candidates ordered by discovery timestamp."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT frontier_id, username_normalized
                FROM discovery_frontier
                WHERE status = 'pending'
                ORDER BY created_at_ms ASC
                LIMIT ?;
                """,
                (limit,)
            )
            return cursor.fetchall()
        finally:
            conn.close()

    def get_pending_count(self) -> int:
        """Count pending candidates in discovery frontier."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM discovery_frontier WHERE status = 'pending';"
            )
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def mark_status(
        self,
        frontier_id: str,
        status: str,
        candidate_id: Optional[str] = None,
        now_ms: Optional[int] = None,
        conn: Optional[sqlite3.Connection] = None,
    ) -> None:
        """Update frontier record status ('validated' or 'invalid') and candidate_id."""
        now = now_ms or self.now_ms()
        owns_conn = conn is None
        if owns_conn:
            conn = self._get_connection()

        try:
            with conn:
                if candidate_id:
                    conn.execute(
                        """
                        UPDATE discovery_frontier
                        SET status = ?, candidate_id = ?, updated_at_ms = ?
                        WHERE frontier_id = ?;
                        """,
                        (status, candidate_id, now, frontier_id)
                    )
                else:
                    conn.execute(
                        """
                        UPDATE discovery_frontier
                        SET status = ?, updated_at_ms = ?
                        WHERE frontier_id = ?;
                        """,
                        (status, now, frontier_id)
                    )
        finally:
            if owns_conn:
                conn.close()

    def add_bootstrap_seed(self, username: str, conn: Optional[sqlite3.Connection] = None) -> None:
        """Add a seed to bootstrap_seeds table."""
        now = self.now_ms()
        seed_id = f"seed_{uuid.uuid4().hex[:16]}"
        owns_conn = conn is None
        if owns_conn:
            conn = self._get_connection()

        try:
            with conn:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO bootstrap_seeds (
                        seed_id, username, priority, is_exhausted, created_at_ms
                    ) VALUES (?, ?, 10, 0, ?);
                    """,
                    (seed_id, username, now)
                )
        finally:
            if owns_conn:
                conn.close()
