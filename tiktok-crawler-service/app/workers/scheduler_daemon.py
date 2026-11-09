"""
Scheduler Daemon (TikTok Crawler v2.2)
Implements:
1. Active Job Admission Window (up to 20 active jobs, max 3 per owner fair share).
2. Chunk Claiming & Heartbeat with monotonically increasing lease_epoch.
3. Strict Lease Fencing on Target commit and Target claiming.
4. Atomic Target / Result / Outbox 9-step commit.
5. Atomic Stale-Running Recovery (Section 2.6 of v2.2 specification).
"""

import logging
from pathlib import Path
import sqlite3
import time
from typing import Any, Dict, List, Optional
import uuid

try:
    from engine.safeguards import DiskSafeguards
except ImportError:
    from app.engine.safeguards import DiskSafeguards

logger = logging.getLogger(__name__)

try:
    from core.config import (
        CRAWLER_MAX_ACTIVE_JOBS,
        CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER,
        CRAWLER_CHUNK_SIZE,
        CRAWLER_CHUNK_LEASE_MS,
        CRAWLER_MAX_CHUNK_CRASHES,
        CRAWLER_MAX_TARGET_ATTEMPTS,
    )
except ImportError:
    try:
        from app.core.config import (
            CRAWLER_MAX_ACTIVE_JOBS,
            CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER,
            CRAWLER_CHUNK_SIZE,
            CRAWLER_CHUNK_LEASE_MS,
            CRAWLER_MAX_CHUNK_CRASHES,
            CRAWLER_MAX_TARGET_ATTEMPTS,
        )
    except ImportError:
        CRAWLER_MAX_ACTIVE_JOBS = 20
        CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER = 3
        CRAWLER_CHUNK_SIZE = 25
        CRAWLER_CHUNK_LEASE_MS = 60000
        CRAWLER_MAX_CHUNK_CRASHES = 3
        CRAWLER_MAX_TARGET_ATTEMPTS = 3

MAX_ACTIVE_JOBS = CRAWLER_MAX_ACTIVE_JOBS
MAX_ACTIVE_JOBS_PER_OWNER = CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER
DEFAULT_CHUNK_SIZE = CRAWLER_CHUNK_SIZE
DEFAULT_LEASE_DURATION_MS = CRAWLER_CHUNK_LEASE_MS
DEFAULT_MAX_CHUNK_CRASHES = CRAWLER_MAX_CHUNK_CRASHES
DEFAULT_MAX_TARGET_ATTEMPTS = CRAWLER_MAX_TARGET_ATTEMPTS


class FencingException(Exception):
    """Raised when a worker attempts an operation on a chunk or target after losing its lease."""
    pass


class SchedulerDaemon:
    def __init__(
        self,
        db_path: Path | str,
        max_active_jobs: Optional[int] = None,
        max_active_per_owner: Optional[int] = None,
        default_chunk_size: Optional[int] = None,
        default_lease_duration_ms: Optional[int] = None,
        max_chunk_crashes: Optional[int] = None,
        max_target_attempts: Optional[int] = None,
        min_free_disk_gb: Optional[float] = None,
    ):
        self.db_path = Path(db_path)
        self.max_active_jobs = max_active_jobs if max_active_jobs is not None else MAX_ACTIVE_JOBS
        self.max_active_per_owner = max_active_per_owner if max_active_per_owner is not None else MAX_ACTIVE_JOBS_PER_OWNER
        self.default_chunk_size = default_chunk_size if default_chunk_size is not None else DEFAULT_CHUNK_SIZE
        self.default_lease_duration_ms = default_lease_duration_ms if default_lease_duration_ms is not None else DEFAULT_LEASE_DURATION_MS
        self.max_chunk_crashes = max_chunk_crashes if max_chunk_crashes is not None else DEFAULT_MAX_CHUNK_CRASHES
        self.max_target_attempts = max_target_attempts if max_target_attempts is not None else DEFAULT_MAX_TARGET_ATTEMPTS
        self.min_free_disk_gb = min_free_disk_gb

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @staticmethod
    def now_ms() -> int:
        return int(time.time() * 1000)

    # --------------------------------------------------------------------------
    # 1. Active Job Admission Window
    # --------------------------------------------------------------------------
    def admit_pending_jobs(
        self,
        max_active_jobs: Optional[int] = None,
        max_active_per_owner: Optional[int] = None,
        min_free_disk_gb: Optional[float] = None,
    ) -> List[str]:
        """
        Evaluate jobs in 'admission_pending' and admit them into active execution window
        if global capacity (<20) and owner quota (<3) permit.
        Pauses admission if available disk space is below safety threshold (T22).
        Returns list of newly admitted crawl_job_ids.
        """
        min_disk = min_free_disk_gb if min_free_disk_gb is not None else self.min_free_disk_gb
        if min_disk is not None and min_disk > 0:
            if DiskSafeguards.is_disk_space_low(self.db_path, min_free_gb=min_disk):
                logger.warning(
                    f"Disk space is below safety threshold ({min_disk}GB). "
                    f"Pausing job admission (T22 operational safeguard)."
                )
                return []

        limit_active_jobs = max_active_jobs if max_active_jobs is not None else self.max_active_jobs
        limit_active_per_owner = max_active_per_owner if max_active_per_owner is not None else self.max_active_per_owner

        admitted = []
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            now = self.now_ms()

            # Count total active jobs
            cursor.execute(
                """
                SELECT COUNT(*) FROM crawl_jobs
                WHERE crawl_status IN ('resolving_targets', 'waiting_for_candidates', 'running');
                """
            )
            global_active = cursor.fetchone()[0]

            # Count active jobs by owner
            cursor.execute(
                """
                SELECT owner_id, COUNT(*) FROM crawl_jobs
                WHERE crawl_status IN ('resolving_targets', 'waiting_for_candidates', 'running')
                GROUP BY owner_id;
                """
            )
            owner_active = {row[0]: row[1] for row in cursor.fetchall()}

            # Query candidate jobs waiting for admission
            cursor.execute(
                """
                SELECT crawl_job_id, owner_id
                FROM crawl_jobs
                WHERE crawl_status = 'admission_pending'
                ORDER BY priority_level DESC, created_at_ms ASC;
                """
            )
            pending_jobs = cursor.fetchall()

            for job_id, owner_id in pending_jobs:
                if global_active >= limit_active_jobs:
                    break

                current_owner_active = owner_active.get(owner_id, 0)
                if current_owner_active >= limit_active_per_owner:
                    continue  # Fair share: skip this owner, let other owners proceed

                # Admit job
                cursor.execute(
                    """
                    UPDATE crawl_jobs
                    SET crawl_status = 'running',
                        started_at_ms = ?,
                        updated_at_ms = ?
                    WHERE crawl_job_id = ? AND crawl_status = 'admission_pending';
                    """,
                    (now, now, job_id)
                )

                if cursor.rowcount == 1:
                    # Create initial crawl_run if not exists
                    run_id = f"run_{job_id}_{now}"
                    cursor.execute(
                        """
                        INSERT OR IGNORE INTO crawl_runs (
                            crawl_run_id, crawl_job_id, run_sequence, status, created_at_ms
                        ) VALUES (?, ?, 1, 'running', ?);
                        """,
                        (run_id, job_id, now)
                    )

                    admitted.append(job_id)
                    global_active += 1
                    owner_active[owner_id] = current_owner_active + 1

            cursor.execute("COMMIT;")
            return admitted
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 2. Chunk Creation
    # --------------------------------------------------------------------------
    def create_chunks_for_run(
        self,
        crawl_run_id: str,
        targets: List[Dict[str, Any]],
        chunk_size: Optional[int] = None,
    ) -> List[str]:
        """
        Split a list of target specifications into chunks of size `chunk_size`
        and store them in `job_chunks` and `crawl_job_targets` with 'ready' status.
        Returns list of created chunk_ids.
        """
        if not targets:
            return []

        actual_chunk_size = chunk_size if chunk_size is not None else self.default_chunk_size
        chunk_ids = []
        now = self.now_ms()

        # Slice into chunks
        slices = [targets[i:i + actual_chunk_size] for i in range(0, len(targets), actual_chunk_size)]

        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            for idx, target_slice in enumerate(slices):
                chunk_id = f"chk_{crawl_run_id}_{idx}_{uuid.uuid4().hex[:8]}"
                chunk_ids.append(chunk_id)
                slice_len = len(target_slice)

                cursor.execute(
                    """
                    INSERT INTO job_chunks (
                        chunk_id, crawl_run_id, chunk_index, total_targets,
                        pending_targets, running_targets, retryable_targets,
                        completed_targets, terminal_failed_targets, cancelled_targets,
                        status, locked_by, lease_token, lease_epoch, lease_expires_at_ms,
                        heartbeat_at_ms, claim_count, chunk_crash_count, not_before_ms,
                        created_at_ms, updated_at_ms
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, 0, 0,
                        0, 0, 0,
                        'ready', NULL, NULL, 0, NULL,
                        NULL, 0, 0, NULL,
                        ?, ?
                    );
                    """,
                    (chunk_id, crawl_run_id, idx, slice_len, slice_len, now, now)
                )

                for tgt in target_slice:
                    target_id = tgt.get("target_id") or f"tgt_{uuid.uuid4().hex[:16]}"
                    candidate_id = tgt["candidate_id"]
                    target_type = tgt.get("target_type", "new_candidate")
                    sec_uid = tgt.get("sec_uid")
                    username = tgt["username"]

                    cursor.execute(
                        """
                        INSERT INTO crawl_job_targets (
                            target_id, chunk_id, candidate_id, target_type, sec_uid,
                            username, status, lease_epoch, target_attempt_count,
                            last_error_code, last_error_message, started_at_ms,
                            completed_at_ms, created_at_ms, updated_at_ms
                        ) VALUES (
                            ?, ?, ?, ?, ?,
                            ?, 'pending', NULL, 0,
                            NULL, NULL, NULL,
                            NULL, ?, ?
                        );
                        """,
                        (target_id, chunk_id, candidate_id, target_type, sec_uid, username, now, now)
                    )

            cursor.execute("COMMIT;")
            return chunk_ids
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 3. Chunk Claiming & Heartbeat
    # --------------------------------------------------------------------------
    def claim_chunk(
        self,
        worker_id: str,
        lease_duration_ms: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Claim the next available chunk in 'ready' or 'retry_wait' status.
        Increments lease_epoch monotonically and generates a new lease_token.
        Returns chunk metadata dict if claimed, None if no chunk available.
        """
        actual_duration = lease_duration_ms if lease_duration_ms is not None else self.default_lease_duration_ms

        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            now = self.now_ms()

            cursor.execute(
                """
                SELECT chunk_id, crawl_run_id, chunk_index, total_targets, lease_epoch
                FROM job_chunks
                WHERE status IN ('ready', 'retry_wait')
                  AND (not_before_ms IS NULL OR not_before_ms <= ?)
                ORDER BY chunk_index ASC
                LIMIT 1;
                """,
                (now,)
            )
            row = cursor.fetchone()
            if not row:
                cursor.execute("COMMIT;")
                return None

            chunk_id, crawl_run_id, chunk_index, total_targets, current_epoch = row
            new_epoch = current_epoch + 1
            new_token = f"tok_{uuid.uuid4().hex}"
            lease_expires_at_ms = now + actual_duration

            cursor.execute(
                """
                UPDATE job_chunks
                SET status = 'running',
                    lease_epoch = ?,
                    lease_token = ?,
                    locked_by = ?,
                    lease_expires_at_ms = ?,
                    heartbeat_at_ms = ?,
                    claim_count = claim_count + 1,
                    updated_at_ms = ?
                WHERE chunk_id = ?
                  AND status IN ('ready', 'retry_wait')
                  AND (not_before_ms IS NULL OR not_before_ms <= ?);
                """,
                (
                    new_epoch,
                    new_token,
                    worker_id,
                    lease_expires_at_ms,
                    now,
                    now,
                    chunk_id,
                    now,
                )
            )

            if cursor.rowcount != 1:
                cursor.execute("ROLLBACK;")
                return None

            cursor.execute("COMMIT;")
            return {
                "chunk_id": chunk_id,
                "crawl_run_id": crawl_run_id,
                "chunk_index": chunk_index,
                "total_targets": total_targets,
                "lease_epoch": new_epoch,
                "lease_token": new_token,
                "locked_by": worker_id,
                "lease_expires_at_ms": lease_expires_at_ms,
            }
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    def heartbeat_chunk(
        self,
        chunk_id: str,
        worker_id: str,
        lease_token: str,
        lease_epoch: int,
        lease_duration_ms: Optional[int] = None,
    ) -> bool:
        """
        Renew chunk lease. Returns True if heartbeat succeeded; False if lease lost.
        """
        actual_duration = lease_duration_ms if lease_duration_ms is not None else self.default_lease_duration_ms
        conn = self._get_connection()
        try:
            with conn:
                now = self.now_ms()
                new_expiry = now + actual_duration
                cursor = conn.execute(
                    """
                    UPDATE job_chunks
                    SET heartbeat_at_ms = ?,
                        lease_expires_at_ms = ?,
                        updated_at_ms = ?
                    WHERE chunk_id = ?
                      AND status = 'running'
                      AND lease_epoch = ?
                      AND lease_token = ?
                      AND locked_by = ?
                      AND lease_expires_at_ms > ?;
                    """,
                    (now, new_expiry, now, chunk_id, lease_epoch, lease_token, worker_id, now)
                )
                return cursor.rowcount == 1
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 4. Target Claiming within Chunk
    # --------------------------------------------------------------------------
    def claim_next_target(
        self,
        chunk_id: str,
        worker_id: str,
        lease_token: str,
        lease_epoch: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Claim next pending or retryable target within the worker's owned chunk.
        Fenced by active chunk lease.
        Returns target dict or None if no more pending targets in chunk.
        Raises FencingException if worker has lost lease.
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            now = self.now_ms()

            # Fencing check on chunk
            cursor.execute(
                """
                SELECT 1 FROM job_chunks
                WHERE chunk_id = ?
                  AND status = 'running'
                  AND lease_epoch = ?
                  AND lease_token = ?
                  AND locked_by = ?
                  AND lease_expires_at_ms > ?;
                """,
                (chunk_id, lease_epoch, lease_token, worker_id, now)
            )
            if not cursor.fetchone():
                cursor.execute("ROLLBACK;")
                raise FencingException(f"Worker {worker_id} lease expired or invalid on chunk {chunk_id}")

            # Find next target
            cursor.execute(
                """
                SELECT target_id, candidate_id, target_type, sec_uid, username, target_attempt_count, status
                FROM crawl_job_targets
                WHERE chunk_id = ?
                  AND status IN ('pending', 'retryable_failed')
                ORDER BY created_at_ms ASC
                LIMIT 1;
                """,
                (chunk_id,)
            )
            target_row = cursor.fetchone()
            if not target_row:
                cursor.execute("COMMIT;")
                return None

            target_id, cand_id, tgt_type, sec_uid, uname, attempt_count, prev_status = target_row

            # Claim target with epoch
            cursor.execute(
                """
                UPDATE crawl_job_targets
                SET status = 'running',
                    lease_epoch = ?,
                    target_attempt_count = target_attempt_count + 1,
                    started_at_ms = ?,
                    updated_at_ms = ?
                WHERE target_id = ?
                  AND status = ?
                  AND chunk_id = ?
                  AND EXISTS (
                      SELECT 1 FROM job_chunks c
                      WHERE c.chunk_id = ?
                        AND c.status = 'running'
                        AND c.lease_epoch = ?
                        AND c.lease_token = ?
                        AND c.locked_by = ?
                        AND c.lease_expires_at_ms > ?
                  );
                """,
                (
                    lease_epoch,
                    now,
                    now,
                    target_id,
                    prev_status,
                    chunk_id,
                    chunk_id,
                    lease_epoch,
                    lease_token,
                    worker_id,
                    now,
                )
            )

            if cursor.rowcount != 1:
                cursor.execute("ROLLBACK;")
                raise FencingException("Target claim failed fencing check")

            # Update cached chunk counters
            if prev_status == "pending":
                counter_field = "pending_targets = MAX(0, pending_targets - 1)"
            else:
                counter_field = "retryable_targets = MAX(0, retryable_targets - 1)"

            cursor.execute(
                f"""
                UPDATE job_chunks
                SET {counter_field},
                    running_targets = running_targets + 1,
                    updated_at_ms = ?
                WHERE chunk_id = ?
                  AND status = 'running'
                  AND lease_epoch = ?
                  AND lease_token = ?
                  AND locked_by = ?
                  AND lease_expires_at_ms > ?;
                """,
                (now, chunk_id, lease_epoch, lease_token, worker_id, now)
            )

            cursor.execute("COMMIT;")
            return {
                "target_id": target_id,
                "candidate_id": cand_id,
                "target_type": tgt_type,
                "sec_uid": sec_uid,
                "username": uname,
                "target_attempt_count": attempt_count + 1,
                "lease_epoch": lease_epoch,
            }
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 5. Atomic Target Commit Helper (Standardized 9-step commit)
    # --------------------------------------------------------------------------
    def commit_target_success(
        self,
        chunk_id: str,
        worker_id: str,
        lease_token: str,
        lease_epoch: int,
        target_id: str,
        crawl_run_id: str,
        account_result: Optional[Dict[str, Any]],
        video_results: List[Dict[str, Any]],
        outbox_events: List[Dict[str, Any]],
    ) -> bool:
        """
        Execute atomic 9-step commit for a completed target:
        1. Fencing check on chunk lease.
        2. Mark target 'completed'.
        3. Insert account result (if present).
        4. Insert video results.
        5. Insert canonical outbox events.
        6. Decrement running_targets, increment completed_targets on chunk.
        7. If all targets completed in chunk, transition chunk to 'completed'.
        Rolls back entirely and raises FencingException if worker lease has expired.
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            now = self.now_ms()

            # Step 1: Fencing check at linearization point
            cursor.execute(
                """
                SELECT 1 FROM job_chunks
                WHERE chunk_id = ?
                  AND status = 'running'
                  AND lease_epoch = ?
                  AND lease_token = ?
                  AND locked_by = ?
                  AND lease_expires_at_ms > ?;
                """,
                (chunk_id, lease_epoch, lease_token, worker_id, now)
            )
            if not cursor.fetchone():
                cursor.execute("ROLLBACK;")
                raise FencingException(f"Worker {worker_id} lease expired before committing target {target_id}")

            # Step 2: Mark target completed
            cursor.execute(
                """
                UPDATE crawl_job_targets
                SET status = 'completed',
                    completed_at_ms = ?,
                    updated_at_ms = ?
                WHERE target_id = ?
                  AND chunk_id = ?
                  AND status = 'running'
                  AND lease_epoch = ?
                  AND EXISTS (
                      SELECT 1 FROM job_chunks c
                      WHERE c.chunk_id = ?
                        AND c.status = 'running'
                        AND c.lease_epoch = ?
                        AND c.lease_token = ?
                        AND c.locked_by = ?
                        AND c.lease_expires_at_ms > ?
                  );
                """,
                (
                    now,
                    now,
                    target_id,
                    chunk_id,
                    lease_epoch,
                    chunk_id,
                    lease_epoch,
                    lease_token,
                    worker_id,
                    now,
                )
            )
            if cursor.rowcount != 1:
                cursor.execute("ROLLBACK;")
                raise FencingException("Target commit failed fencing check (target not in running or epoch mismatch)")

            # Step 3: Insert account result
            if account_result:
                cursor.execute(
                    """
                    INSERT INTO crawl_account_results (
                        result_id, target_id, crawl_run_id, sec_uid, username,
                        account_data_json, status, created_at_ms
                    ) VALUES (?, ?, ?, ?, ?, ?, 'success', ?);
                    """,
                    (
                        account_result["result_id"],
                        target_id,
                        crawl_run_id,
                        account_result.get("sec_uid"),
                        account_result["username"],
                        account_result["account_data_json"],
                        now,
                    )
                )

            # Step 4: Insert video results
            for vr in video_results:
                cursor.execute(
                    """
                    INSERT INTO crawl_video_results (
                        video_result_id, target_id, crawl_run_id, video_id,
                        video_data_json, created_at_ms
                    ) VALUES (?, ?, ?, ?, ?, ?);
                    """,
                    (
                        vr["video_result_id"],
                        target_id,
                        crawl_run_id,
                        vr["video_id"],
                        vr["video_data_json"],
                        now,
                    )
                )

            # Step 5: Insert canonical outbox events
            for evt in outbox_events:
                cursor.execute(
                    """
                    INSERT INTO outbox_events (
                        event_id, logical_event_key, parent_event_id, crawl_run_id,
                        entity_type, entity_key, operation, schema_version,
                        entity_revision, observed_at, payload_hash, payload_json,
                        delivery_state, active_batch_id, retry_count, first_eligible_at_ms,
                        next_attempt_at_ms, delivered_at_ms, dead_lettered_at_ms, created_at_ms
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, NULL, 0, ?,
                        NULL, NULL, NULL, ?
                    );
                    """,
                    (
                        evt["event_id"],
                        evt["logical_event_key"],
                        evt.get("parent_event_id"),
                        crawl_run_id,
                        evt["entity_type"],
                        evt["entity_key"],
                        evt.get("operation", "upsert"),
                        evt.get("schema_version", "1.0"),
                        evt.get("entity_revision", 1),
                        evt["observed_at"],
                        evt["payload_hash"],
                        evt.get("payload_json"),
                        evt.get("delivery_state", "pending"),
                        evt.get("first_eligible_at_ms", now),
                        now,
                    )
                )

            # Step 6: Update cached chunk counters
            cursor.execute(
                """
                UPDATE job_chunks
                SET running_targets = MAX(0, running_targets - 1),
                    completed_targets = completed_targets + 1,
                    updated_at_ms = ?
                WHERE chunk_id = ?
                  AND status = 'running'
                  AND lease_epoch = ?
                  AND lease_token = ?
                  AND locked_by = ?
                  AND lease_expires_at_ms > ?;
                """,
                (now, chunk_id, lease_epoch, lease_token, worker_id, now)
            )
            if cursor.rowcount != 1:
                cursor.execute("ROLLBACK;")
                raise FencingException("Chunk counter update failed fencing check")

            # Step 7: Check if chunk is completed
            cursor.execute(
                """
                SELECT total_targets, completed_targets, terminal_failed_targets, cancelled_targets
                FROM job_chunks
                WHERE chunk_id = ?;
                """,
                (chunk_id,)
            )
            ch_row = cursor.fetchone()
            if ch_row:
                tot, comp, term, canc = ch_row
                if (comp + term + canc) >= tot:
                    cursor.execute(
                        """
                        UPDATE job_chunks
                        SET status = 'completed',
                            updated_at_ms = ?
                        WHERE chunk_id = ? AND status = 'running';
                        """,
                        (now, chunk_id)
                    )

            cursor.execute("COMMIT;")
            return True
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 6. Stale-Running Recovery (Section 2.6 of v2.2 specification)
    # --------------------------------------------------------------------------
    def recover_stale_chunks(
        self,
        max_chunk_crashes: Optional[int] = None,
        max_target_attempts: Optional[int] = None,
    ) -> int:
        """
        Perform atomic stale-running recovery per Section 2.6 of Architecture Specification v2.2.
        For every chunk in 'running' where lease_expires_at_ms <= now_ms:
          1. Atomically revoke expired chunk and increment lease_epoch, set status='recovering'.
          2. Reset dangling running targets for that old epoch to retryable_failed or terminal_failed.
             (Completed targets are NEVER reset).
          3. Evaluate chunk crash budget: set chunk to 'ready' or 'failed'.
          4. If chunk failed: mark remaining non-completed targets 'terminal_failed'.
          5. Reconcile counters from single source of truth (crawl_job_targets).
        Returns count of recovered chunks.
        """
        actual_max_crashes = max_chunk_crashes if max_chunk_crashes is not None else self.max_chunk_crashes
        actual_max_attempts = max_target_attempts if max_target_attempts is not None else self.max_target_attempts

        conn = self._get_connection()
        try:
            now = self.now_ms()

            # Find candidate expired chunks
            cursor = conn.execute(
                """
                SELECT chunk_id, lease_epoch
                FROM job_chunks
                WHERE status = 'running'
                  AND lease_expires_at_ms IS NOT NULL
                  AND lease_expires_at_ms <= ?;
                """,
                (now,)
            )
            expired_chunks = cursor.fetchall()
            if not expired_chunks:
                return 0

            recovered_count = 0

            for chunk_id, old_epoch in expired_chunks:
                tx_cursor = conn.cursor()
                try:
                    tx_cursor.execute("BEGIN IMMEDIATE;")
                    tx_now = self.now_ms()

                    # 1. Thu hoi chunk qua han va tang epoch
                    tx_cursor.execute(
                        """
                        UPDATE job_chunks
                        SET status = 'recovering',
                            lease_epoch = lease_epoch + 1,
                            lease_token = NULL,
                            locked_by = NULL,
                            lease_expires_at_ms = NULL,
                            chunk_crash_count = chunk_crash_count + 1,
                            updated_at_ms = ?
                        WHERE chunk_id = ?
                          AND status = 'running'
                          AND lease_epoch = ?
                          AND lease_expires_at_ms <= ?;
                        """,
                        (tx_now, chunk_id, old_epoch, tx_now)
                    )

                    if tx_cursor.rowcount != 1:
                        # Another worker or scheduler claimed/recovered it
                        tx_cursor.execute("ROLLBACK;")
                        continue

                    # 2. Chi reset cac target con do dang thuoc epoch bi thu hoi
                    tx_cursor.execute(
                        """
                        UPDATE crawl_job_targets
                        SET status = CASE
                                WHEN target_attempt_count >= ? THEN 'terminal_failed'
                                ELSE 'retryable_failed'
                            END,
                            lease_epoch = NULL,
                            last_error_code = 'WORKER_LEASE_EXPIRED',
                            updated_at_ms = ?
                        WHERE chunk_id = ?
                          AND lease_epoch = ?
                          AND status = 'running';
                        """,
                        (actual_max_attempts, tx_now, chunk_id, old_epoch)
                    )

                    # 3. Danh gia ngan sach crash cua chunk
                    tx_cursor.execute(
                        """
                        UPDATE job_chunks
                        SET status = CASE
                                WHEN chunk_crash_count < ? THEN 'ready'
                                ELSE 'failed'
                            END,
                            not_before_ms = CASE
                                WHEN chunk_crash_count < ? THEN ?
                                ELSE NULL
                            END,
                            updated_at_ms = ?
                        WHERE chunk_id = ?
                          AND status = 'recovering';
                        """,
                        (actual_max_crashes, actual_max_crashes, tx_now, tx_now, chunk_id)
                    )

                    # 4. Neu chunk vuot qua gioi han crash, danh dau cac target chua xong thanh terminal_failed
                    tx_cursor.execute(
                        """
                        UPDATE crawl_job_targets
                        SET status = 'terminal_failed',
                            last_error_code = 'MAX_CHUNK_CRASHES_EXCEEDED',
                            updated_at_ms = ?
                        WHERE chunk_id = ?
                          AND status IN ('pending', 'retryable_failed')
                          AND EXISTS (
                              SELECT 1 FROM job_chunks c
                              WHERE c.chunk_id = ? AND c.status = 'failed'
                          );
                        """,
                        (tx_now, chunk_id, chunk_id)
                    )

                    # 5. Tinh toan lai bo dem chinh xac tu nguon chan ly (crawl_job_targets)
                    tx_cursor.execute(
                        """
                        UPDATE job_chunks
                        SET pending_targets = (SELECT COUNT(*) FROM crawl_job_targets WHERE chunk_id = ? AND status = 'pending'),
                            running_targets = (SELECT COUNT(*) FROM crawl_job_targets WHERE chunk_id = ? AND status = 'running'),
                            retryable_targets = (SELECT COUNT(*) FROM crawl_job_targets WHERE chunk_id = ? AND status = 'retryable_failed'),
                            completed_targets = (SELECT COUNT(*) FROM crawl_job_targets WHERE chunk_id = ? AND status = 'completed'),
                            terminal_failed_targets = (SELECT COUNT(*) FROM crawl_job_targets WHERE chunk_id = ? AND status = 'terminal_failed'),
                            cancelled_targets = (SELECT COUNT(*) FROM crawl_job_targets WHERE chunk_id = ? AND status = 'cancelled'),
                            updated_at_ms = ?
                        WHERE chunk_id = ?;
                        """,
                        (chunk_id, chunk_id, chunk_id, chunk_id, chunk_id, chunk_id, tx_now, chunk_id)
                    )

                    tx_cursor.execute("COMMIT;")
                    recovered_count += 1
                    logger.info("Successfully recovered stale chunk %s (old_epoch=%d)", chunk_id, old_epoch)
                except Exception as ex:
                    try:
                        tx_cursor.execute("ROLLBACK;")
                    except Exception:
                        pass
                    logger.error("Failed to recover stale chunk %s: %s", chunk_id, ex)

            return recovered_count
        finally:
            conn.close()
