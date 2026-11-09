"""
SQLite WAL Database Schema & Initialization (TikTok Crawler v2.2)
Defines all 24 tables, indexes, and initialization PRAGMAs.
"""

from pathlib import Path
import sqlite3
from typing import Union

SQLITE_PRAGMAS = [
    "PRAGMA journal_mode = WAL;",
    "PRAGMA synchronous = FULL;",
    "PRAGMA foreign_keys = ON;",
    "PRAGMA busy_timeout = 5000;",
]

SQLITE_DDL_STATEMENTS = [
    # 1. Crawl Jobs
    """
    CREATE TABLE IF NOT EXISTS crawl_jobs (
        crawl_job_id TEXT PRIMARY KEY,
        external_job_id TEXT NULL UNIQUE,
        owner_id TEXT NOT NULL,
        requested_accounts INTEGER NOT NULL,
        source_type TEXT NOT NULL DEFAULT 'count',
        crawl_status TEXT NOT NULL DEFAULT 'admission_pending',
        sync_status TEXT NOT NULL DEFAULT 'not_started',
        priority_level INTEGER NOT NULL DEFAULT 5,
        allocated_accounts INTEGER NOT NULL DEFAULT 0,
        completed_accounts INTEGER NOT NULL DEFAULT 0,
        failed_accounts INTEGER NOT NULL DEFAULT 0,
        progress_version INTEGER NOT NULL DEFAULT 1,
        created_at_ms INTEGER NOT NULL,
        started_at_ms INTEGER NULL,
        finished_at_ms INTEGER NULL,
        cancelled_at_ms INTEGER NULL,
        updated_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(crawl_status, priority_level DESC, created_at_ms ASC);",
    "CREATE INDEX IF NOT EXISTS idx_crawl_jobs_owner ON crawl_jobs(owner_id, crawl_status);",

    # 2. Crawl Runs
    """
    CREATE TABLE IF NOT EXISTS crawl_runs (
        crawl_run_id TEXT PRIMARY KEY,
        crawl_job_id TEXT NOT NULL REFERENCES crawl_jobs(crawl_job_id) ON DELETE RESTRICT,
        run_sequence INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'running',
        created_at_ms INTEGER NOT NULL,
        completed_at_ms INTEGER NULL
    );
    """,

    # 3. Job Chunks
    """
    CREATE TABLE IF NOT EXISTS job_chunks (
        chunk_id TEXT PRIMARY KEY,
        crawl_run_id TEXT NOT NULL REFERENCES crawl_runs(crawl_run_id) ON DELETE RESTRICT,
        chunk_index INTEGER NOT NULL,
        total_targets INTEGER NOT NULL,
        pending_targets INTEGER NOT NULL DEFAULT 0,
        running_targets INTEGER NOT NULL DEFAULT 0,
        retryable_targets INTEGER NOT NULL DEFAULT 0,
        completed_targets INTEGER NOT NULL DEFAULT 0,
        terminal_failed_targets INTEGER NOT NULL DEFAULT 0,
        cancelled_targets INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        locked_by TEXT NULL,
        lease_token TEXT NULL,
        lease_epoch INTEGER NOT NULL DEFAULT 0,
        lease_expires_at_ms INTEGER NULL,
        heartbeat_at_ms INTEGER NULL,
        claim_count INTEGER NOT NULL DEFAULT 0,
        chunk_crash_count INTEGER NOT NULL DEFAULT 0,
        not_before_ms INTEGER NULL,
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_job_chunks_claim ON job_chunks(status, lease_expires_at_ms);",

    # 4. Crawl Targets
    """
    CREATE TABLE IF NOT EXISTS crawl_job_targets (
        target_id TEXT PRIMARY KEY,
        chunk_id TEXT NOT NULL REFERENCES job_chunks(chunk_id) ON DELETE RESTRICT,
        candidate_id TEXT NOT NULL,
        target_type TEXT NOT NULL DEFAULT 'new_candidate',
        sec_uid TEXT NULL,
        username TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        lease_epoch INTEGER NULL,
        target_attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error_code TEXT NULL,
        last_error_message TEXT NULL,
        started_at_ms INTEGER NULL,
        completed_at_ms INTEGER NULL,
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_targets_chunk ON crawl_job_targets(chunk_id, status);",

    # 5. Raw Account Results
    """
    CREATE TABLE IF NOT EXISTS crawl_account_results (
        result_id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL REFERENCES crawl_job_targets(target_id) ON DELETE RESTRICT,
        crawl_run_id TEXT NOT NULL REFERENCES crawl_runs(crawl_run_id) ON DELETE RESTRICT,
        sec_uid TEXT NULL,
        username TEXT NOT NULL,
        account_data_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'success',
        created_at_ms INTEGER NOT NULL
    );
    """,

    # 6. Raw Video Results
    """
    CREATE TABLE IF NOT EXISTS crawl_video_results (
        video_result_id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL REFERENCES crawl_job_targets(target_id) ON DELETE RESTRICT,
        crawl_run_id TEXT NOT NULL REFERENCES crawl_runs(crawl_run_id) ON DELETE RESTRICT,
        video_id TEXT NOT NULL,
        video_data_json TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_video_results_run ON crawl_video_results(crawl_run_id, video_id);",

    # 7. Bootstrap Seeds
    """
    CREATE TABLE IF NOT EXISTS bootstrap_seeds (
        seed_id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        sec_uid TEXT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        is_exhausted INTEGER NOT NULL DEFAULT 0,
        created_at_ms INTEGER NOT NULL
    );
    """,

    # 8. Candidate Pool
    """
    CREATE TABLE IF NOT EXISTS candidate_pool (
        candidate_id TEXT PRIMARY KEY,
        sec_uid TEXT NULL UNIQUE,
        identity_state TEXT NOT NULL CHECK (identity_state IN ('unresolved', 'verified')),
        allocation_class TEXT NOT NULL CHECK (allocation_class IN ('historical', 'fresh_discovery', 'bootstrap')),
        priority_score REAL NOT NULL DEFAULT 1.0,
        crawl_count INTEGER NOT NULL DEFAULT 0,
        last_crawled_at_ms INTEGER NULL,
        cooldown_until_ms INTEGER NULL,
        lifecycle_status TEXT NOT NULL DEFAULT 'valid',
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_candidate_allocation ON candidate_pool(allocation_class, cooldown_until_ms, priority_score DESC);",

    # 9. Candidate Aliases
    """
    CREATE TABLE IF NOT EXISTS candidate_aliases (
        alias_id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL REFERENCES candidate_pool(candidate_id) ON DELETE RESTRICT,
        username_normalized TEXT NOT NULL,
        first_seen_at_ms INTEGER NOT NULL,
        last_seen_at_ms INTEGER NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1))
    );
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_alias_current ON candidate_aliases(username_normalized) WHERE is_current = 1;",
    "CREATE INDEX IF NOT EXISTS idx_candidate_alias_candidate ON candidate_aliases(candidate_id, is_current);",

    # 10. Candidate Sources
    """
    CREATE TABLE IF NOT EXISTS candidate_sources (
        source_id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL REFERENCES candidate_pool(candidate_id) ON DELETE RESTRICT,
        source_type TEXT NOT NULL,
        source_reference TEXT NOT NULL,
        discovered_at_ms INTEGER NOT NULL,
        UNIQUE(candidate_id, source_type, source_reference)
    );
    """,

    # 11. Discovery Frontier
    """
    CREATE TABLE IF NOT EXISTS discovery_frontier (
        frontier_id TEXT PRIMARY KEY,
        username_normalized TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'validating', 'validated', 'invalid', 'retry_wait')),
        validation_attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at_ms INTEGER NULL,
        candidate_id TEXT NULL REFERENCES candidate_pool(candidate_id) ON DELETE RESTRICT,
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_frontier_unresolved_username ON discovery_frontier(username_normalized) WHERE candidate_id IS NULL;",
    "CREATE INDEX IF NOT EXISTS idx_frontier_status ON discovery_frontier(status, created_at_ms ASC);",

    # 12. Discovery Frontier Sources
    """
    CREATE TABLE IF NOT EXISTS discovery_frontier_sources (
        frontier_source_id TEXT PRIMARY KEY,
        frontier_id TEXT NOT NULL REFERENCES discovery_frontier(frontier_id) ON DELETE CASCADE,
        source_type TEXT NOT NULL,
        source_reference TEXT NOT NULL,
        discovered_at_ms INTEGER NOT NULL,
        UNIQUE(frontier_id, source_type, source_reference)
    );
    """,

    # 13. Candidate Assignments
    """
    CREATE TABLE IF NOT EXISTS candidate_assignments (
        assignment_id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL REFERENCES candidate_pool(candidate_id) ON DELETE RESTRICT,
        crawl_job_id TEXT NOT NULL REFERENCES crawl_jobs(crawl_job_id) ON DELETE RESTRICT,
        crawl_run_id TEXT NOT NULL REFERENCES crawl_runs(crawl_run_id) ON DELETE RESTRICT,
        target_type TEXT NOT NULL CHECK (target_type IN ('historical', 'new_candidate', 'bootstrap')),
        status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'released', 'cancelled')),
        assigned_at_ms INTEGER NOT NULL,
        released_at_ms INTEGER NULL
    );
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_active_assignment ON candidate_assignments(candidate_id) WHERE status = 'active';",

    # 14. Outbox Events
    """
    CREATE TABLE IF NOT EXISTS outbox_events (
        event_id TEXT PRIMARY KEY,
        logical_event_key TEXT NOT NULL,
        parent_event_id TEXT NULL,
        crawl_run_id TEXT NOT NULL REFERENCES crawl_runs(crawl_run_id) ON DELETE RESTRICT,
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        operation TEXT NOT NULL DEFAULT 'upsert',
        schema_version TEXT NOT NULL DEFAULT '1.0',
        entity_revision INTEGER NOT NULL DEFAULT 1,
        observed_at TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload_json TEXT NULL,
        delivery_state TEXT NOT NULL DEFAULT 'pending',
        active_batch_id TEXT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        first_eligible_at_ms INTEGER NOT NULL,
        next_attempt_at_ms INTEGER NULL,
        delivered_at_ms INTEGER NULL,
        dead_lettered_at_ms INTEGER NULL,
        created_at_ms INTEGER NOT NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_outbox_dispatch ON outbox_events(delivery_state, entity_type, first_eligible_at_ms ASC);",
    "CREATE INDEX IF NOT EXISTS idx_outbox_logical_key ON outbox_events(logical_event_key);",

    # 15. Outbox Batches
    """
    CREATE TABLE IF NOT EXISTS outbox_batches (
        batch_id TEXT PRIMARY KEY,
        parent_batch_id TEXT NULL REFERENCES outbox_batches(batch_id),
        crawl_run_id TEXT NOT NULL REFERENCES crawl_runs(crawl_run_id) ON DELETE RESTRICT,
        events_count INTEGER NOT NULL,
        payload_bytes INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'building',
        locked_by TEXT NULL,
        lease_token TEXT NULL,
        lease_epoch INTEGER NOT NULL DEFAULT 0,
        lease_expires_at_ms INTEGER NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        next_attempt_at_ms INTEGER NULL,
        created_at_ms INTEGER NOT NULL,
        delivered_at_ms INTEGER NULL
    );
    """,

    # 16. Outbox Batch Events (Immutable Membership)
    """
    CREATE TABLE IF NOT EXISTS outbox_batch_events (
        batch_id TEXT NOT NULL REFERENCES outbox_batches(batch_id) ON DELETE CASCADE,
        event_id TEXT NOT NULL REFERENCES outbox_events(event_id) ON DELETE RESTRICT,
        sequence_order INTEGER NOT NULL,
        PRIMARY KEY (batch_id, event_id)
    );
    """,
    """
    CREATE TRIGGER IF NOT EXISTS trg_prevent_batch_events_update
    BEFORE UPDATE ON outbox_batch_events
    BEGIN
        SELECT RAISE(ABORT, 'Cannot update immutable outbox_batch_events membership');
    END;
    """,
    """
    CREATE TRIGGER IF NOT EXISTS trg_prevent_batch_events_delete
    BEFORE DELETE ON outbox_batch_events
    FOR EACH ROW
    WHEN (SELECT status FROM outbox_batches WHERE batch_id = OLD.batch_id) != 'building'
    BEGIN
        SELECT RAISE(ABORT, 'Cannot delete members from outbox batch that is not in building state');
    END;
    """,

    # 17. Outbox Delivery Attempts
    """
    CREATE TABLE IF NOT EXISTS outbox_delivery_attempts (
        attempt_id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES outbox_batches(batch_id) ON DELETE CASCADE,
        attempt_number INTEGER NOT NULL,
        response_http_code INTEGER NULL,
        response_body TEXT NULL,
        error_message TEXT NULL,
        duration_ms INTEGER NULL,
        attempted_at_ms INTEGER NOT NULL,
        UNIQUE (batch_id, attempt_number)
    );
    """,

    # 18. Rate Limit State
    """
    CREATE TABLE IF NOT EXISTS rate_limit_state (
        singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
        global_next_grant_at_ms INTEGER NOT NULL,
        paused_until_ms INTEGER NULL,
        weighted_slot_index INTEGER NOT NULL DEFAULT 0,
        last_granted_source TEXT NULL,
        updated_at_ms INTEGER NOT NULL
    );
    """,

    # 19. Rate Limit Requests
    """
    CREATE TABLE IF NOT EXISTS rate_limit_requests (
        request_id TEXT PRIMARY KEY,
        source_class TEXT NOT NULL CHECK (source_class IN ('profile', 'discovery')),
        status TEXT NOT NULL CHECK (status IN ('queued', 'granted', 'cancelled', 'expired')),
        enqueued_at_ms INTEGER NOT NULL,
        granted_at_ms INTEGER NULL,
        permit_expires_at_ms INTEGER NULL
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_rate_requests_queue ON rate_limit_requests(status, source_class, enqueued_at_ms);",

    # 20. Rate Limit Source State
    """
    CREATE TABLE IF NOT EXISTS rate_limit_source_state (
        source_class TEXT PRIMARY KEY,
        paused_until_ms INTEGER NULL,
        consecutive_429 INTEGER NOT NULL DEFAULT 0,
        circuit_state TEXT NOT NULL DEFAULT 'closed',
        updated_at_ms INTEGER NOT NULL
    );
    """,

    # 21. Entity Observation Versions
    """
    CREATE TABLE IF NOT EXISTS entity_observation_versions (
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        last_revision INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(entity_type, entity_key)
    );
    """,

    # 22. Crawler Seed Sync State
    """
    CREATE TABLE IF NOT EXISTS crawler_seed_sync_state (
        source_name TEXT PRIMARY KEY,
        last_sequence INTEGER NOT NULL DEFAULT 0,
        updated_at_ms INTEGER NOT NULL
    );
    """,

    # 23. Privacy Suppression
    """
    CREATE TABLE IF NOT EXISTS privacy_suppression (
        suppression_id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        reason TEXT NULL,
        suppressed_at_ms INTEGER NOT NULL,
        UNIQUE(entity_type, entity_key)
    );
    """,

    # 24. Privacy Purge Jobs
    """
    CREATE TABLE IF NOT EXISTS privacy_purge_jobs (
        purge_job_id TEXT PRIMARY KEY,
        purge_request_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT NULL,
        created_at_ms INTEGER NOT NULL,
        completed_at_ms INTEGER NULL
    );
    """
]


def initialize_database(db_path: Union[str, Path]) -> sqlite3.Connection:
    """
    Initialize the SQLite database with WAL mode, foreign keys, incremental auto_vacuum,
    and all 24 schema tables and indexes.
    """
    path = Path(db_path)
    is_new = not path.exists()

    conn = sqlite3.connect(str(path), timeout=10.0)

    # 1. auto_vacuum MUST be executed before the first table creation on a new DB
    if is_new:
        conn.execute("PRAGMA auto_vacuum = INCREMENTAL;")

    # 2. Connection PRAGMAs
    for pragma in SQLITE_PRAGMAS:
        conn.execute(pragma)

    # 3. Create all tables & indexes
    with conn:
        for stmt in SQLITE_DDL_STATEMENTS:
            conn.execute(stmt)

        # Initialize rate_limit_state singleton row if not present
        conn.execute(
            """
            INSERT OR IGNORE INTO rate_limit_state (singleton_id, global_next_grant_at_ms, updated_at_ms)
            VALUES (1, 0, 0);
            """
        )

        # Initialize rate limit source states for profile and discovery
        conn.execute(
            """
            INSERT OR IGNORE INTO rate_limit_source_state (source_class, updated_at_ms)
            VALUES ('profile', 0), ('discovery', 0);
            """
        )

    return conn
