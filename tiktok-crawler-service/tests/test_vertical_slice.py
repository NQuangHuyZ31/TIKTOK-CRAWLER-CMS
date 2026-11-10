"""
Unit tests for Vertical Slice Runner & Outbox Dispatcher (Batch 3).
Verifies atomic chunk target commit, lease fencing, outbox batching, and Partial ACK processing.
"""

from pathlib import Path
import sqlite3
import sys
import tempfile
import time
import unittest
import httpx

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from engine.schema import initialize_database
from workers.outbox_dispatcher import OutboxDispatcher
from engine.vertical_slice_runner import _commit_target_atomic
from schemas.canonical_event import CanonicalEventEnvelope


class TestVerticalSlice(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_slice.db"
        self.conn = initialize_database(self.db_path)
        self.now = int(time.time() * 1000)

        # Create basic Job, Run, and Chunk
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, created_at_ms, updated_at_ms)
                VALUES ('job_1', 'admin', 5, ?, ?);
                """,
                (self.now, self.now),
            )
            self.conn.execute(
                """
                INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, created_at_ms)
                VALUES ('run_1', 'job_1', ?);
                """,
                (self.now,),
            )
            self.conn.execute(
                """
                INSERT INTO job_chunks (
                    chunk_id, crawl_run_id, chunk_index, total_targets,
                    running_targets, status, locked_by, lease_token,
                    lease_epoch, lease_expires_at_ms, created_at_ms, updated_at_ms
                ) VALUES ('chunk_1', 'run_1', 0, 5, 5, 'running', 'worker_1', 'tok_abc', 1, ? + 100000, ?, ?);
                """,
                (self.now, self.now, self.now),
            )
            for i in range(1, 6):
                self.conn.execute(
                    """
                    INSERT INTO crawl_job_targets (
                        target_id, chunk_id, candidate_id, sec_uid, username,
                        status, lease_epoch, created_at_ms, updated_at_ms
                    ) VALUES (?, 'chunk_1', ?, ?, ?, 'running', 1, ?, ?);
                    """,
                    (f"tgt_{i}", f"cand_{i}", f"sec_{i}", f"user_{i}", self.now, self.now),
                )

    def tearDown(self):
        self.conn.close()
        self.tmp_dir.cleanup()

    def test_atomic_target_commit_emits_outbox_events(self):
        _commit_target_atomic(
            conn=self.conn,
            chunk_id="chunk_1",
            target_id="tgt_1",
            run_id="run_1",
            worker_id="worker_1",
            worker_epoch=1,
            lease_token="tok_abc",
            username="user_1",
            sec_uid="sec_1",
            idx=1,
        )

        # Verify target is completed
        tgt_status = self.conn.execute("SELECT status FROM crawl_job_targets WHERE target_id = 'tgt_1';").fetchone()[0]
        self.assertEqual(tgt_status, "completed")

        # Verify results were stored
        acc_res = self.conn.execute("SELECT username, status FROM crawl_account_results WHERE target_id = 'tgt_1';").fetchone()
        self.assertEqual(acc_res[0], "user_1")
        self.assertEqual(acc_res[1], "success")

        vid_res = self.conn.execute("SELECT video_id FROM crawl_video_results WHERE target_id = 'tgt_1';").fetchone()
        self.assertTrue(vid_res[0].startswith("7311111111111111"))

        # Verify Outbox events emitted (1 Account event + 1 Video event)
        outbox_rows = self.conn.execute("SELECT entity_type, delivery_state FROM outbox_events;").fetchall()
        self.assertEqual(len(outbox_rows), 2)
        types = {r[0] for r in outbox_rows}
        self.assertEqual(types, {"account", "video"})
        for r in outbox_rows:
            self.assertEqual(r[1], "pending")

    def test_atomic_commit_fails_and_rolls_back_if_worker_lost_lease(self):
        # Revoke lease by bumping epoch
        with self.conn:
            self.conn.execute("UPDATE job_chunks SET lease_epoch = 2 WHERE chunk_id = 'chunk_1';")

        with self.assertRaises(RuntimeError) as ctx:
            _commit_target_atomic(
                conn=self.conn,
                chunk_id="chunk_1",
                target_id="tgt_2",
                run_id="run_1",
                worker_id="worker_1",
                worker_epoch=1,  # Stale epoch
                lease_token="tok_abc",
                username="user_2",
                sec_uid="sec_2",
                idx=2,
            )
        self.assertIn("FencingException", str(ctx.exception))

        # Target must remain running, no results or outbox inserted
        status = self.conn.execute("SELECT status FROM crawl_job_targets WHERE target_id = 'tgt_2';").fetchone()[0]
        self.assertEqual(status, "running")
        acc_count = self.conn.execute("SELECT COUNT(*) FROM crawl_account_results WHERE target_id = 'tgt_2';").fetchone()[0]
        self.assertEqual(acc_count, 0)

    def test_outbox_dispatcher_batch_creation_and_partial_ack(self):
        # Commit 2 targets to generate 4 outbox events
        for i in [1, 2]:
            _commit_target_atomic(
                conn=self.conn,
                chunk_id="chunk_1",
                target_id=f"tgt_{i}",
                run_id="run_1",
                worker_id="worker_1",
                worker_epoch=1,
                lease_token="tok_abc",
                username=f"user_{i}",
                sec_uid=f"sec_{i}",
                idx=i,
            )

        dispatcher = OutboxDispatcher(db_path=self.db_path, batch_size=2)
        batch_ids = dispatcher.create_batches()
        self.assertEqual(len(batch_ids), 2)  # 4 events / 2 batch_size = 2 batches

        batch_1_id = batch_ids[0]
        payload = dispatcher.build_batch_payload(batch_1_id)
        self.assertEqual(payload["batch_id"], batch_1_id)
        self.assertEqual(len(payload["events"]), 2)

        # Test applying Partial ACK response
        event_1_id = payload["events"][0]["event_id"]
        event_2_id = payload["events"][1]["event_id"]

        ack_response = {
            "batch_id": batch_1_id,
            "status": "partially_delivered",
            "acknowledged_event_ids": [event_1_id],
            "retryable_event_ids": [event_2_id],
            "rejected_event_ids": [],
        }

        dispatcher._apply_partial_ack_response(batch_1_id, ack_response)

        # Verify event_1 marked delivered
        st1 = self.conn.execute("SELECT delivery_state, active_batch_id FROM outbox_events WHERE event_id = ?;", (event_1_id,)).fetchone()
        self.assertEqual(st1[0], "delivered")
        self.assertIsNone(st1[1])

        # Verify event_2 marked retry_wait
        st2 = self.conn.execute("SELECT delivery_state, active_batch_id, retry_count FROM outbox_events WHERE event_id = ?;", (event_2_id,)).fetchone()
        self.assertEqual(st2[0], "retry_wait")
        self.assertIsNone(st2[1])
        self.assertEqual(st2[2], 1)

        # Verify batch status
        b_status = self.conn.execute("SELECT status FROM outbox_batches WHERE batch_id = ?;", (batch_1_id,)).fetchone()[0]
        self.assertEqual(b_status, "partially_delivered")


if __name__ == "__main__":
    unittest.main()
