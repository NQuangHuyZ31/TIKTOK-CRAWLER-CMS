import asyncio
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sqlite3
import threading

from core.config import QUEUE_DB_PATH
from core.utils import normalize_username
from schemas.models import CrawlJobRecord


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class QueueStore:
    """
    SQLite WAL store for Python's local job queue and completed account checkpoints.
    Uses a single thread-safe connection protected by a threading.Lock, and exposes
    both synchronous methods and async wrappers via `asyncio.to_thread`.
    """

    def __init__(self, db_path: Path | str = QUEUE_DB_PATH):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(
            str(self.db_path),
            check_same_thread=False,
            timeout=10.0,
        )
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        with self._lock:
            cur = self._conn.cursor()
            cur.execute("PRAGMA journal_mode=WAL;")
            cur.execute("PRAGMA synchronous=NORMAL;")
            cur.execute("PRAGMA busy_timeout=5000;")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id        INTEGER PRIMARY KEY,
                    payload_json  TEXT NOT NULL,
                    status        TEXT NOT NULL,
                    worker_id     TEXT,
                    resume_count  INTEGER NOT NULL DEFAULT 0,
                    error_message TEXT,
                    queued_at     TEXT NOT NULL,
                    available_at  TEXT NOT NULL,
                    updated_at    TEXT NOT NULL
                );
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS done_accounts (
                    job_id   INTEGER NOT NULL,
                    username TEXT NOT NULL,
                    PRIMARY KEY (job_id, username)
                );
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_jobs_status_queued ON jobs(status, queued_at, job_id);"
            )
            self._conn.commit()

    def close(self) -> None:
        with self._lock:
            try:
                self._conn.close()
            except Exception:
                pass

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> CrawlJobRecord:
        payload = json.loads(row["payload_json"])
        return CrawlJobRecord(
            job_id=int(row["job_id"]),
            source_type=payload.get("source_type", "usernames"),
            crawl_mode=payload.get("crawl_mode", "account_with_videos"),
            max_videos_per_account=int(payload.get("max_videos_per_account", 20)),
            targets=payload.get("targets", []),
            status=row["status"],
            worker_id=row["worker_id"],
            resume_count=int(row["resume_count"] or 0),
            error_message=row["error_message"],
            queued_at=row["queued_at"],
            available_at=row["available_at"],
            updated_at=row["updated_at"],
            callback_url=payload.get("callback_url"),
            callback_token=payload.get("callback_token"),
        )

    def upsert_job_sync(
        self,
        job_id: int,
        source_type: str,
        targets: list[str],
        callback_url: str | None = None,
        callback_token: str | None = None,
        done_usernames: list[str] | set[str] | None = None,
        crawl_mode: str = "account_with_videos",
        max_videos_per_account: int = 20,
        reset_if_terminal: bool = True,
    ) -> tuple[CrawlJobRecord, bool]:
        """
        Insert a job into SQLite BEFORE enqueuing in memory.
        If `job_id` is already `queued` or `running`, returns `(existing_record, False)`
        to prevent duplicate enqueues.
        If `job_id` was previously `completed`, `failed`, or `cancelled` and `reset_if_terminal=True`
        (e.g., user clicked Retry), resets it to `queued` and returns `(updated_record, True)`.
        """
        now = _utc_now_iso()
        payload_json = json.dumps(
            {
                "source_type": source_type,
                "crawl_mode": crawl_mode,
                "max_videos_per_account": max_videos_per_account,
                "targets": list(targets),
                "callback_url": callback_url,
                "callback_token": callback_token,
            }
        )

        with self._lock:
            cur = self._conn.cursor()
            if done_usernames is not None:
                for uname in done_usernames:
                    clean = normalize_username(uname).lower()
                    if clean:
                        cur.execute(
                            "INSERT OR IGNORE INTO done_accounts(job_id, username) VALUES (?, ?)",
                            (job_id, clean),
                        )

            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            existing = cur.fetchone()

            if existing is not None:
                if existing["status"] in ("queued", "running"):
                    self._conn.commit()
                    return self._row_to_record(existing), False

                if reset_if_terminal:
                    if done_usernames is None:
                        cur.execute("DELETE FROM done_accounts WHERE job_id = ?", (job_id,))
                    else:
                        cur.execute("DELETE FROM done_accounts WHERE job_id = ?", (job_id,))
                        for uname in done_usernames:
                            clean = normalize_username(uname).lower()
                            if clean:
                                cur.execute(
                                    "INSERT OR IGNORE INTO done_accounts(job_id, username) VALUES (?, ?)",
                                    (job_id, clean),
                                )
                    cur.execute(
                        """
                        UPDATE jobs
                        SET payload_json = ?,
                            status = 'queued',
                            worker_id = NULL,
                            resume_count = 0,
                            error_message = NULL,
                            queued_at = ?,
                            available_at = ?,
                            updated_at = ?
                        WHERE job_id = ?
                        """,
                        (payload_json, now, now, now, job_id),
                    )
                    self._conn.commit()
                    cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
                    return self._row_to_record(cur.fetchone()), True

                self._conn.commit()
                return self._row_to_record(existing), False

            cur.execute(
                """
                INSERT INTO jobs(
                    job_id, payload_json, status, worker_id,
                    resume_count, error_message, queued_at, available_at, updated_at
                )
                VALUES (?, ?, 'queued', NULL, 0, NULL, ?, ?, ?)
                """,
                (job_id, payload_json, now, now, now),
            )
            self._conn.commit()
            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            return self._row_to_record(cur.fetchone()), True

    async def upsert_job(self, *args, **kwargs) -> tuple[CrawlJobRecord, bool]:
        return self.upsert_job_sync(*args, **kwargs)

    def get_job_sync(self, job_id: int) -> CrawlJobRecord | None:
        with self._lock:
            cur = self._conn.cursor()
            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            row = cur.fetchone()
            return self._row_to_record(row) if row else None

    async def get_job(self, job_id: int) -> CrawlJobRecord | None:
        return self.get_job_sync(job_id)

    def mark_running_sync(self, job_id: int, worker_id: str) -> CrawlJobRecord | None:
        now = _utc_now_iso()
        with self._lock:
            cur = self._conn.cursor()
            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            row = cur.fetchone()
            if not row or row["status"] == "cancelled":
                return None
            cur.execute(
                """
                UPDATE jobs
                SET status = 'running', worker_id = ?, updated_at = ?
                WHERE job_id = ? AND status != 'cancelled'
                """,
                (worker_id, now, job_id),
            )
            self._conn.commit()
            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            updated = cur.fetchone()
            return self._row_to_record(updated) if updated else None

    async def mark_running(self, job_id: int, worker_id: str) -> CrawlJobRecord | None:
        return self.mark_running_sync(job_id, worker_id)

    def mark_account_done_sync(self, job_id: int, username: str) -> None:
        clean = normalize_username(username).lower()
        if not clean:
            return
        now = _utc_now_iso()
        with self._lock:
            cur = self._conn.cursor()
            cur.execute(
                "INSERT OR IGNORE INTO done_accounts(job_id, username) VALUES (?, ?)",
                (job_id, clean),
            )
            cur.execute("UPDATE jobs SET updated_at = ? WHERE job_id = ?", (now, job_id))
            self._conn.commit()

    async def mark_account_done(self, job_id: int, username: str) -> None:
        self.mark_account_done_sync(job_id, username)

    def get_done_accounts_sync(self, job_id: int) -> set[str]:
        with self._lock:
            cur = self._conn.cursor()
            cur.execute("SELECT username FROM done_accounts WHERE job_id = ?", (job_id,))
            return {row["username"].lower() for row in cur.fetchall() if row["username"]}

    async def get_done_accounts(self, job_id: int) -> set[str]:
        return self.get_done_accounts_sync(job_id)

    def mark_finished_sync(
        self,
        job_id: int,
        status: str = "completed",
        error_message: str | None = None,
    ) -> CrawlJobRecord | None:
        now = _utc_now_iso()
        with self._lock:
            cur = self._conn.cursor()
            cur.execute(
                """
                UPDATE jobs
                SET status = ?, worker_id = NULL, error_message = ?, updated_at = ?
                WHERE job_id = ?
                """,
                (status, error_message, now, job_id),
            )
            self._conn.commit()
            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            row = cur.fetchone()
            return self._row_to_record(row) if row else None

    async def mark_finished(
        self,
        job_id: int,
        status: str = "completed",
        error_message: str | None = None,
    ) -> CrawlJobRecord | None:
        return self.mark_finished_sync(job_id, status, error_message)

    def requeue_job_sync(
        self,
        job_id: int,
        delay_seconds: float = 0.0,
        increment_resume: bool = True,
        error_message: str | None = None,
    ) -> CrawlJobRecord | None:
        now_dt = datetime.now(timezone.utc)
        now = now_dt.isoformat()
        available = (now_dt + timedelta(seconds=max(0.0, delay_seconds))).isoformat()
        inc = 1 if increment_resume else 0
        with self._lock:
            cur = self._conn.cursor()
            cur.execute(
                """
                UPDATE jobs
                SET status = 'queued',
                    worker_id = NULL,
                    resume_count = resume_count + ?,
                    error_message = COALESCE(?, error_message),
                    available_at = ?,
                    updated_at = ?
                WHERE job_id = ? AND status != 'cancelled'
                """,
                (inc, error_message, available, now, job_id),
            )
            self._conn.commit()
            cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            row = cur.fetchone()
            return self._row_to_record(row) if row else None

    async def requeue_job(
        self,
        job_id: int,
        delay_seconds: float = 0.0,
        increment_resume: bool = True,
        error_message: str | None = None,
    ) -> CrawlJobRecord | None:
        return self.requeue_job_sync(
            job_id,
            delay_seconds,
            increment_resume,
            error_message,
        )

    def cancel_job_sync(self, job_id: int) -> bool:
        now = _utc_now_iso()
        with self._lock:
            cur = self._conn.cursor()
            cur.execute(
                """
                UPDATE jobs
                SET status = 'cancelled', worker_id = NULL, updated_at = ?
                WHERE job_id = ? AND status IN ('queued', 'running')
                """,
                (now, job_id),
            )
            self._conn.commit()
            return cur.rowcount > 0

    async def cancel_job(self, job_id: int) -> bool:
        return self.cancel_job_sync(job_id)

    def delete_job_sync(self, job_id: int) -> bool:
        with self._lock:
            cur = self._conn.cursor()
            cur.execute("DELETE FROM done_accounts WHERE job_id = ?", (job_id,))
            cur.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
            self._conn.commit()
            return cur.rowcount > 0

    async def delete_job(self, job_id: int) -> bool:
        return self.delete_job_sync(job_id)

    def list_unfinished_for_recovery_sync(self) -> list[CrawlJobRecord]:
        """
        Return unfinished jobs ordered by Recovery Priority + FIFO:
        1. Jobs that were 'running' when service stopped (reset to 'queued' with resume_count + 1)
        2. Jobs that were 'queued'
        Within each group, ordered by (queued_at ASC, job_id ASC).
        """
        now = _utc_now_iso()
        with self._lock:
            cur = self._conn.cursor()
            cur.execute(
                """
                SELECT * FROM jobs
                WHERE status IN ('running', 'queued')
                ORDER BY
                    CASE WHEN status = 'running' THEN 0 ELSE 1 END ASC,
                    queued_at ASC,
                    job_id ASC
                """
            )
            rows = cur.fetchall()
            records: list[CrawlJobRecord] = []
            for row in rows:
                was_running = row["status"] == "running"
                job_id = int(row["job_id"])
                if was_running:
                    cur.execute(
                        """
                        UPDATE jobs
                        SET status = 'queued',
                            worker_id = NULL,
                            resume_count = resume_count + 1,
                            available_at = ?,
                            updated_at = ?
                        WHERE job_id = ?
                        """,
                        (now, now, job_id),
                    )
                    cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
                    row = cur.fetchone()
                records.append(self._row_to_record(row))
            self._conn.commit()
            return records

    async def list_unfinished_for_recovery(self) -> list[CrawlJobRecord]:
        return self.list_unfinished_for_recovery_sync()

    def cleanup_old_jobs_sync(self, older_than_days: int = 7) -> int:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=older_than_days)).isoformat()
        with self._lock:
            cur = self._conn.cursor()
            cur.execute(
                "SELECT job_id FROM jobs WHERE status IN ('completed', 'failed', 'cancelled') AND updated_at < ?",
                (cutoff,),
            )
            old_ids = [int(r["job_id"]) for r in cur.fetchall()]
            if not old_ids:
                return 0
            placeholders = ",".join("?" for _ in old_ids)
            cur.execute(f"DELETE FROM done_accounts WHERE job_id IN ({placeholders})", old_ids)
            cur.execute(f"DELETE FROM jobs WHERE job_id IN ({placeholders})", old_ids)
            self._conn.commit()
            return len(old_ids)

    async def cleanup_old_jobs(self, older_than_days: int = 7) -> int:
        return self.cleanup_old_jobs_sync(older_than_days)
