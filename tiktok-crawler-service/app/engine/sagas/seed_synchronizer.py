"""
Continuous Seed Synchronizer (TikTok Crawler v2.2)
Synchronizes seed account modifications from Laravel MySQL (crawler_seed_changes)
into Python SQLite (candidate_pool & candidate_aliases) using commit-ordered sequence
checkpointing (crawler_seed_sync_state) (T20).
"""

import asyncio
import logging
from pathlib import Path
import sqlite3
import time
from typing import Any, Dict, List, Optional
import httpx

try:
    from core.config import LARAVEL_BASE_URL, CRAWLER_TOKEN
except ImportError:
    try:
        from app.core.config import LARAVEL_BASE_URL, CRAWLER_TOKEN
    except ImportError:
        LARAVEL_BASE_URL = "http://127.0.0.1:8000"
        CRAWLER_TOKEN = "2703ac97eb897aacbf1235f5e608bf93d2ca7e0c2fe9d09a35e44f6ad6ab410c"

from engine.candidate_manager import CandidateManager

logger = logging.getLogger(__name__)


class SeedSynchronizer:
    SOURCE_NAME = "mysql_master"

    def __init__(
        self,
        db_path: Path | str,
        laravel_url: Optional[str] = None,
        crawler_token: Optional[str] = None,
    ):
        self.db_path = Path(db_path)
        self.laravel_url = (laravel_url or LARAVEL_BASE_URL).rstrip("/")
        self.crawler_token = crawler_token or CRAWLER_TOKEN
        self.candidate_manager = CandidateManager(self.db_path)

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @staticmethod
    def now_ms() -> int:
        return int(time.time() * 1000)

    def get_last_sequence(self) -> int:
        """Query currently checkpointed last_sequence for mysql_master."""
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                "SELECT last_sequence FROM crawler_seed_sync_state WHERE source_name = ?;",
                (self.SOURCE_NAME,)
            )
            row = cursor.fetchone()
            return row[0] if row else 0
        finally:
            conn.close()

    def process_change_batch(self, changes: List[Dict[str, Any]]) -> int:
        """
        Process a batch of seed changes into candidate_pool and update sequence checkpoint.
        Handles:
        - 'insert' / 'update': Upserts candidate in candidate_pool as 'historical' allocation class.
        - 'disable' / 'delete': Marks candidate lifecycle_status = 'tombstone' / 'disabled' and cancels active assignments.
        Updates crawler_seed_sync_state in a single atomic SQLite transaction (T20).
        Returns count of changes processed.
        """
        if not changes:
            return 0

        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            now = self.now_ms()

            cursor.execute(
                "SELECT last_sequence FROM crawler_seed_sync_state WHERE source_name = ?;",
                (self.SOURCE_NAME,)
            )
            r_seq = cursor.fetchone()
            highest_seq = r_seq[0] if r_seq else 0

            for item in changes:
                seq_id = int(item["sequence_id"])
                account_id = int(item["account_id"])
                operation = item.get("operation", "insert")
                payload = item.get("payload") or {}

                username = payload.get("username")
                sec_uid = payload.get("sec_uid")
                status = payload.get("status", "active")

                if operation in ("insert", "update"):
                    if username:
                        norm_user = CandidateManager.normalize_username(username)
                        cand_info = self.candidate_manager.upsert_candidate_identity(
                            username=norm_user,
                            sec_uid=sec_uid,
                            allocation_class="historical",
                            source_type="laravel_seed",
                            source_reference=str(account_id),
                            conn=conn,
                        )
                        # Restore lifecycle_status to 'valid' if previously tombstoned
                        if cand_info and cand_info.get("candidate_id"):
                            cursor.execute(
                                """
                                UPDATE candidate_pool
                                SET lifecycle_status = 'valid',
                                    updated_at_ms = ?
                                WHERE candidate_id = ?;
                                """,
                                (now, cand_info["candidate_id"])
                            )

                elif operation in ("disable", "delete"):
                    # Find candidate to tombstone
                    target_candidate_id = None
                    if sec_uid:
                        cursor.execute(
                            "SELECT candidate_id FROM candidate_pool WHERE sec_uid = ?;",
                            (sec_uid,)
                        )
                        r = cursor.fetchone()
                        if r:
                            target_candidate_id = r[0]

                    if not target_candidate_id and username:
                        norm_user = CandidateManager.normalize_username(username)
                        cursor.execute(
                            """
                            SELECT candidate_id FROM candidate_aliases
                            WHERE username_normalized = ? AND is_current = 1;
                            """,
                            (norm_user,)
                        )
                        r = cursor.fetchone()
                        if r:
                            target_candidate_id = r[0]

                    if target_candidate_id:
                        new_lifecycle = "tombstone" if operation == "delete" else "disabled"
                        cursor.execute(
                            """
                            UPDATE candidate_pool
                            SET lifecycle_status = ?,
                                updated_at_ms = ?
                            WHERE candidate_id = ?;
                            """,
                            (new_lifecycle, now, target_candidate_id)
                        )
                        # Cancel any active assignment for this candidate
                        cursor.execute(
                            """
                            UPDATE candidate_assignments
                            SET status = 'cancelled',
                                released_at_ms = ?
                            WHERE candidate_id = ? AND status = 'active';
                            """,
                            (now, target_candidate_id)
                        )
                        logger.info("Seed %s candidate %s marked as %s", operation, target_candidate_id, new_lifecycle)

                if seq_id > highest_seq:
                    highest_seq = seq_id

            # Save checkpoint
            cursor.execute(
                """
                INSERT INTO crawler_seed_sync_state (source_name, last_sequence, updated_at_ms)
                VALUES (?, ?, ?)
                ON CONFLICT(source_name) DO UPDATE SET
                    last_sequence = excluded.last_sequence,
                    updated_at_ms = excluded.updated_at_ms;
                """,
                (self.SOURCE_NAME, highest_seq, now)
            )

            cursor.execute("COMMIT;")
            return len(changes)
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    async def fetch_and_sync(
        self,
        client: Optional[httpx.AsyncClient] = None,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """
        Pull seed changes from Laravel CMS API and ingest them into SQLite.
        Returns sync report dict.
        """
        last_seq = self.get_last_sequence()
        url = f"{self.laravel_url}/admin/api/public/crawler/seeds/changes"
        params = {"since_sequence": last_seq, "limit": limit}
        headers = {"Authorization": f"Bearer {self.crawler_token}"}

        close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=10.0)
            close_client = True

        try:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

            res_data = data.get("data") or {}
            changes = res_data.get("changes") or []
            latest_seq = res_data.get("latest_sequence", last_seq)
            has_more = res_data.get("has_more", False)

            processed_count = self.process_change_batch(changes)
            new_last_seq = self.get_last_sequence()

            return {
                "synced_count": processed_count,
                "previous_sequence": last_seq,
                "current_sequence": new_last_seq,
                "latest_server_sequence": latest_seq,
                "has_more": has_more,
            }
        finally:
            if close_client:
                await client.aclose()
