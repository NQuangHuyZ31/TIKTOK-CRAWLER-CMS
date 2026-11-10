"""
Batch 3 Vertical Slice Runner (One Job End-to-End)
Executes a complete 10-account crawl job from target resolution, atomic chunk commit,
durable outbox event emission, through signed webhook delivery to Laravel.
"""

import asyncio
import json
import logging
from pathlib import Path
import sqlite3
import sys
import time
from typing import Dict, List, Optional

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from engine.schema import initialize_database
from workers.outbox_dispatcher import OutboxDispatcher
from schemas.canonical_event import CanonicalEventEnvelope, format_utc_microseconds

try:
    from core.config import LARAVEL_BASE_URL
except ImportError:
    try:
        from app.core.config import LARAVEL_BASE_URL
    except ImportError:
        LARAVEL_BASE_URL = "http://127.0.0.1:8000"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("VerticalSliceRunner")


def run_vertical_slice(
    db_path: Path | str,
    laravel_url: Optional[str] = None,
    account_count: int = 10,
    job_id: str = "job_v3_slice_01",
    owner_id: str = "admin_owner",
) -> Dict[str, any]:
    """
    Execute 1 Job (10 accounts) end-to-end:
    1. Initialize 24 SQLite tables.
    2. Seed 10 targets into crawl_job_targets.
    3. Worker atomic commit with lease fencing (Target completed + Result + Outbox).
    4. Dispatch Outbox Batch to Laravel Webhook.
    """
    target_laravel_url = (laravel_url or LARAVEL_BASE_URL).rstrip("/")
    logger.info(f"Starting Vertical Slice for Job '{job_id}' ({account_count} accounts) -> {target_laravel_url}...")
    db_file = Path(db_path)
    conn = initialize_database(db_file)
    now = int(time.time() * 1000)
    run_id = f"run_{job_id}_01"
    chunk_id = f"chunk_{job_id}_01"
    worker_id = "worker_slice_01"
    lease_token = "lease_tok_slice_01"
    lease_epoch = 1

    try:
        with conn:
            # 1. Create Job & Run
            conn.execute(
                """
                INSERT OR REPLACE INTO crawl_jobs (
                    crawl_job_id, owner_id, requested_accounts, source_type,
                    crawl_status, sync_status, priority_level, allocated_accounts,
                    created_at_ms, started_at_ms, updated_at_ms
                ) VALUES (?, ?, ?, 'count', 'running', 'syncing', 5, ?, ?, ?, ?);
                """,
                (job_id, owner_id, account_count, account_count, now, now, now),
            )
            conn.execute(
                """
                INSERT OR REPLACE INTO crawl_runs (
                    crawl_run_id, crawl_job_id, run_sequence, status, created_at_ms
                ) VALUES (?, ?, 1, 'running', ?);
                """,
                (run_id, job_id, now),
            )

            # 2. Create Chunk claimed by Worker
            conn.execute(
                """
                INSERT OR REPLACE INTO job_chunks (
                    chunk_id, crawl_run_id, chunk_index, total_targets,
                    pending_targets, running_targets, completed_targets,
                    status, locked_by, lease_token, lease_epoch, lease_expires_at_ms,
                    heartbeat_at_ms, claim_count, created_at_ms, updated_at_ms
                ) VALUES (?, ?, 0, ?, ?, ?, 0, 'running', ?, ?, ?, ? + 120000, ?, 1, ?, ?);
                """,
                (chunk_id, run_id, account_count, 0, account_count, worker_id, lease_token, lease_epoch, now, now, now, now),
            )

            # 3. Seed 10 Targets
            targets = []
            for i in range(1, account_count + 1):
                tid = f"target_{job_id}_{i:02d}"
                username = f"creator_slice_{i:02d}"
                sec_uid = f"MS4wLjABAAAA_slice_secuid_{i:02d}"
                conn.execute(
                    """
                    INSERT OR REPLACE INTO crawl_job_targets (
                        target_id, chunk_id, candidate_id, target_type, sec_uid,
                        username, status, lease_epoch, target_attempt_count,
                        started_at_ms, created_at_ms, updated_at_ms
                    ) VALUES (?, ?, ?, 'new_candidate', ?, ?, 'running', ?, 1, ?, ?, ?);
                    """,
                    (tid, chunk_id, f"cand_{i:02d}", sec_uid, username, lease_epoch, now, now, now),
                )
                targets.append((tid, username, sec_uid, i))

        logger.info(f"Seeded {len(targets)} targets into Chunk '{chunk_id}'. Now executing Worker atomic commit...")

        # 4. Worker processes each target and commits atomically with lease fencing
        for tid, username, sec_uid, idx in targets:
            _commit_target_atomic(
                conn=conn,
                chunk_id=chunk_id,
                target_id=tid,
                run_id=run_id,
                worker_id=worker_id,
                worker_epoch=lease_epoch,
                lease_token=lease_token,
                username=username,
                sec_uid=sec_uid,
                idx=idx,
            )

        logger.info("All targets committed with Outbox events. Updating Job & Chunk status...")
        with conn:
            conn.execute(
                "UPDATE job_chunks SET status = 'completed', running_targets = 0, completed_targets = ? WHERE chunk_id = ?;",
                (account_count, chunk_id),
            )
            conn.execute(
                "UPDATE crawl_jobs SET crawl_status = 'completed', completed_accounts = ? WHERE crawl_job_id = ?;",
                (account_count, job_id),
            )

    finally:
        conn.close()

    # 5. Dispatch pending Outbox Batches to Laravel Webhook
    logger.info("Triggering Outbox Dispatcher to send webhook to Laravel...")
    dispatcher = OutboxDispatcher(db_path=db_file, laravel_url=target_laravel_url)
    dispatch_results = asyncio.run(dispatcher.dispatch_pending_batches())

    logger.info(f"Dispatch complete. Batches dispatched: {len(dispatch_results)}.")
    return {
        "job_id": job_id,
        "accounts_processed": account_count,
        "dispatch_results": dispatch_results,
    }


def _commit_target_atomic(
    conn: sqlite3.Connection,
    chunk_id: str,
    target_id: str,
    run_id: str,
    worker_id: str,
    worker_epoch: int,
    lease_token: str,
    username: str,
    sec_uid: str,
    idx: int,
):
    """
    Executes the 9-step atomic BEGIN IMMEDIATE transaction for a single target,
    enforcing chunk ownership, target transition, result storage, and outbox event emission.
    """
    now = int(time.time() * 1000)
    observed_at = format_utc_microseconds()

    # Prepare Account & Video data in memory
    account_payload = {
        "username": username,
        "sec_uid": sec_uid,
        "nickname": f"Slice Creator {idx}",
        "follower_count": 50000 + idx * 1000,
        "following_count": 120,
        "heart_count": 1000000 + idx * 5000,
        "video_count": 25,
        "is_verified": True,
    }
    video_id = f"7311111111111111{idx:02d}"
    video_payload = {
        "video_id": video_id,
        "username": username,
        "play_count": 80000 + idx * 200,
        "digg_count": 4000 + idx * 50,
        "comment_count": 350,
        "share_count": 120,
        "caption": f"Vertical slice test video #{idx} by @{username}",
        "music_author": f"Slice Sound {idx}",
    }

    account_env = CanonicalEventEnvelope.create(
        crawl_run_id=run_id,
        entity_type="account",
        entity_key=username,
        payload=account_payload,
        observed_at=observed_at,
        entity_revision=1,
    )
    video_env = CanonicalEventEnvelope.create(
        crawl_run_id=run_id,
        entity_type="video",
        entity_key=video_id,
        payload=video_payload,
        observed_at=observed_at,
        entity_revision=1,
        parent_event_id=account_env.event_id,
    )

    with conn:
        # Step A: Fencing check
        row = conn.execute(
            """
            SELECT 1 FROM job_chunks
            WHERE chunk_id = ?
              AND status = 'running'
              AND lease_epoch = ?
              AND lease_token = ?
              AND locked_by = ?
              AND lease_expires_at_ms > ?;
            """,
            (chunk_id, worker_epoch, lease_token, worker_id, now),
        ).fetchone()
        if not row:
            raise RuntimeError(f"FencingException: Worker {worker_id} lost lease on chunk {chunk_id}")

        # Step B: Transition target status
        cur = conn.execute(
            """
            UPDATE crawl_job_targets
            SET status = 'completed',
                completed_at_ms = ?,
                updated_at_ms = ?
            WHERE target_id = ?
              AND chunk_id = ?
              AND status = 'running'
              AND lease_epoch = ?;
            """,
            (now, now, target_id, chunk_id, worker_epoch),
        )
        if cur.rowcount != 1:
            raise RuntimeError(f"TargetConflictException: target {target_id} could not be updated")

        # Step C: Persist Account & Video results
        conn.execute(
            """
            INSERT INTO crawl_account_results (
                result_id, target_id, crawl_run_id, sec_uid, username,
                account_data_json, status, created_at_ms
            ) VALUES (?, ?, ?, ?, ?, ?, 'success', ?);
            """,
            (f"res_acc_{target_id}", target_id, run_id, sec_uid, username, json.dumps(account_payload), now),
        )
        conn.execute(
            """
            INSERT INTO crawl_video_results (
                video_result_id, target_id, crawl_run_id, video_id,
                video_data_json, created_at_ms
            ) VALUES (?, ?, ?, ?, ?, ?);
            """,
            (f"res_vid_{target_id}", target_id, run_id, video_id, json.dumps(video_payload), now),
        )

        # Step D: Emit immutable Outbox Events
        for env in [account_env, video_env]:
            conn.execute(
                """
                INSERT INTO outbox_events (
                    event_id, logical_event_key, parent_event_id, crawl_run_id,
                    entity_type, entity_key, operation, schema_version,
                    entity_revision, observed_at, payload_hash, payload_json,
                    delivery_state, first_eligible_at_ms, created_at_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?);
                """,
                (
                    env.event_id,
                    env.logical_event_key,
                    env.parent_event_id,
                    env.crawl_run_id,
                    env.entity_type,
                    env.entity_key,
                    env.operation,
                    env.schema_version,
                    env.entity_revision,
                    env.observed_at,
                    env.payload_hash,
                    json.dumps(env.payload),
                    now,
                    now,
                ),
            )


if __name__ == "__main__":
    import tempfile

    with tempfile.TemporaryDirectory() as tmp_dir:
        test_db = Path(tmp_dir) / "vertical_slice.db"
        result = run_vertical_slice(db_path=test_db, account_count=10)
        print("\nVERTICAL SLICE RESULT:")
        print(json.dumps(result, indent=2))
