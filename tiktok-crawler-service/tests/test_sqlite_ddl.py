"""
Unit tests for SQLite WAL Schema & Initialization (Batch 2 DDL Source of Truth).
Verifies all 24 tables, indexes, and PRAGMAs.
"""

from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from engine.schema import initialize_database

EXPECTED_TABLES = {
    "crawl_jobs",
    "crawl_runs",
    "job_chunks",
    "crawl_job_targets",
    "crawl_account_results",
    "crawl_video_results",
    "bootstrap_seeds",
    "candidate_pool",
    "candidate_aliases",
    "candidate_sources",
    "discovery_frontier",
    "discovery_frontier_sources",
    "candidate_assignments",
    "outbox_events",
    "outbox_batches",
    "outbox_batch_events",
    "outbox_delivery_attempts",
    "rate_limit_state",
    "rate_limit_requests",
    "rate_limit_source_state",
    "entity_observation_versions",
    "crawler_seed_sync_state",
    "privacy_suppression",
    "privacy_purge_jobs",
}


class TestSqliteDdl(unittest.TestCase):

    def test_initializes_all_24_tables(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = Path(tmp_dir) / "test_queue.db"
            conn = initialize_database(db_path)
            try:
                # 1. Verify PRAGMAs
                wal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
                self.assertEqual(wal_mode.upper(), "WAL")

                fk_enabled = conn.execute("PRAGMA foreign_keys;").fetchone()[0]
                self.assertEqual(fk_enabled, 1)

                auto_vac = conn.execute("PRAGMA auto_vacuum;").fetchone()[0]
                # 2 = INCREMENTAL in SQLite
                self.assertEqual(auto_vac, 2)

                # 2. Verify all 24 tables exist
                rows = conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
                ).fetchall()
                existing_tables = {r[0] for r in rows}

                missing = EXPECTED_TABLES - existing_tables
                self.assertEqual(len(missing), 0, f"Missing tables: {missing}")
                self.assertEqual(len(existing_tables), 24)

                # 3. Verify rate_limit_state singleton row
                rl_row = conn.execute("SELECT singleton_id, global_next_grant_at_ms FROM rate_limit_state;").fetchone()
                self.assertIsNotNone(rl_row)
                self.assertEqual(rl_row[0], 1)

                # 4. Verify rate_limit_source_state has profile and discovery
                sources = conn.execute("SELECT source_class FROM rate_limit_source_state ORDER BY source_class;").fetchall()
                self.assertEqual([s[0] for s in sources], ["discovery", "profile"])

                # 5. Verify unique active candidate assignment partial index
                conn.execute(
                    """
                    INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, created_at_ms, updated_at_ms)
                    VALUES ('job_1', 'user_1', 10, 1000, 1000);
                    """
                )
                conn.execute(
                    """
                    INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, created_at_ms)
                    VALUES ('run_1', 'job_1', 1000);
                    """
                )
                conn.execute(
                    """
                    INSERT INTO candidate_pool (candidate_id, identity_state, allocation_class, created_at_ms, updated_at_ms)
                    VALUES ('cand_1', 'unresolved', 'fresh_discovery', 1000, 1000);
                    """
                )
                conn.execute(
                    """
                    INSERT INTO candidate_aliases (alias_id, candidate_id, username_normalized, first_seen_at_ms, last_seen_at_ms, is_current)
                    VALUES ('alias_1', 'cand_1', 'user_alpha', 1000, 1000, 1);
                    """
                )
                conn.execute(
                    """
                    INSERT INTO candidate_assignments (assignment_id, candidate_id, crawl_job_id, crawl_run_id, target_type, status, assigned_at_ms)
                    VALUES ('assign_1', 'cand_1', 'job_1', 'run_1', 'new_candidate', 'active', 1000);
                    """
                )
                conn.commit()

                # Second active assignment for the same candidate MUST fail due to partial unique index
                with self.assertRaises(sqlite3.IntegrityError):
                    conn.execute(
                        """
                        INSERT INTO candidate_assignments (assignment_id, candidate_id, crawl_job_id, crawl_run_id, target_type, status, assigned_at_ms)
                        VALUES ('assign_2', 'cand_1', 'job_1', 'run_1', 'new_candidate', 'active', 1001);
                        """
                    )
            finally:
                conn.close()


if __name__ == "__main__":
    unittest.main()
