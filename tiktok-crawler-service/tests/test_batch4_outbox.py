"""
Batch 4 Unit & Integration Tests: Python Store & Outbox Hardening.
Tests mandatory architecture scenarios:
- T07: Partial ACK handling (ACK, retryable, rejected).
- T08: Network loss replay idempotency (Duplicate receipts).
- T09: Dispatcher crash & lease recovery (Stale sending reclaimed, fence check).
- T10: HTTP 413 Payload Too Large recursive batch splitting.
- T17: Dead-Letter Queue cascading (Parent dead-letter blocks child videos).
- T18: Parent replay unblocks child videos with refreshed eligibility window.
- Outbox batch membership immutability triggers.
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
TESTS_DIR = SERVICE_ROOT / "tests"
for p in (str(APP_DIR), str(TESTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from _async_compat import patch_windows_self_pipe_if_needed
patch_windows_self_pipe_if_needed()

from engine.schema import initialize_database
from engine.outbox_dispatcher import OutboxDispatcher


class TestBatch4Outbox(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_batch4.db"
        self.conn = initialize_database(self.db_path)
        self.now = int(time.time() * 1000)

        # Basic job & run setup
        self.conn.execute(
            """
            INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, created_at_ms, updated_at_ms)
            VALUES ('job_b4', 'admin', 10, ?, ?);
            """,
            (self.now, self.now),
        )
        self.conn.execute(
            """
            INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, created_at_ms)
            VALUES ('run_b4', 'job_b4', ?);
            """,
            (self.now,),
        )
        self.conn.commit()

        self.dispatcher = OutboxDispatcher(db_path=self.db_path)

    def tearDown(self):
        self.conn.close()
        self.tmp_dir.cleanup()

    def _insert_outbox_event(
        self,
        event_id: str,
        logical_key: str,
        entity_type: str = "account",
        parent_event_id: str = None,
        delivery_state: str = "pending",
        payload_json: str = "{\"data\":\"test\"}",
    ):
        self.conn.execute(
            """
            INSERT INTO outbox_events (
                event_id, logical_event_key, parent_event_id, crawl_run_id,
                entity_type, entity_key, operation, schema_version,
                entity_revision, observed_at, payload_hash, payload_json,
                delivery_state, first_eligible_at_ms, created_at_ms
            ) VALUES (?, ?, ?, 'run_b4', ?, 'key', 'upsert', '1.0', 1, '2026-11-05T00:00:00.000000Z',
                      'dummy_hash', ?, ?, ?, ?);
            """,
            (event_id, logical_key, parent_event_id, entity_type, payload_json, delivery_state, self.now, self.now),
        )
        self.conn.commit()

    def test_immutability_trigger_prevents_modifying_ready_batch_membership(self):
        """Verifies SQLite triggers prevent updating or deleting batch members once batch is 'ready'."""
        self._insert_outbox_event("evt_imm_1", "log_imm_1")
        batches = self.dispatcher.create_batches()
        self.assertEqual(len(batches), 1)
        batch_id = batches[0]

        # 1. Deleting a member from a 'ready' batch MUST fail via trigger
        with self.assertRaises(sqlite3.IntegrityError):
            self.conn.execute(
                "DELETE FROM outbox_batch_events WHERE batch_id = ? AND event_id = ?;",
                (batch_id, "evt_imm_1"),
            )
            self.conn.commit()

        # 2. Updating a member in outbox_batch_events MUST fail via trigger
        with self.assertRaises(sqlite3.IntegrityError):
            self.conn.execute(
                "UPDATE outbox_batch_events SET sequence_order = 99 WHERE batch_id = ?;",
                (batch_id,),
            )
            self.conn.commit()

    def test_t07_partial_ack_handling(self):
        """T07: Partial ACK transitions events to delivered, retry_wait, and dead_letter with cascading."""
        self._insert_outbox_event("evt_ack_1", "log_ack_1", entity_type="account")
        self._insert_outbox_event("evt_ack_2", "log_ack_2", entity_type="account")
        self._insert_outbox_event("evt_ack_3", "log_ack_3", entity_type="account")
        batches = self.dispatcher.create_batches()
        batch_id = batches[0]

        mock_partial_ack = {
            "status": "partially_delivered",
            "acknowledged_event_ids": ["evt_ack_1"],
            "retryable_event_ids": ["evt_ack_2"],
            "rejected_event_ids": ["evt_ack_3"],
            "errors": {
                "evt_ack_3": {"error_code": "INTEGRITY_CONFLICT", "error_message": "Hash conflict"}
            },
        }

        self.dispatcher._apply_partial_ack_response(batch_id, mock_partial_ack)

        # Verify states in outbox_events
        row1 = self.conn.execute("SELECT delivery_state, active_batch_id FROM outbox_events WHERE event_id = 'evt_ack_1';").fetchone()
        self.assertEqual(row1[0], "delivered")
        self.assertIsNone(row1[1])

        row2 = self.conn.execute("SELECT delivery_state, retry_count, active_batch_id FROM outbox_events WHERE event_id = 'evt_ack_2';").fetchone()
        self.assertEqual(row2[0], "retry_wait")
        self.assertEqual(row2[1], 1)
        self.assertIsNone(row2[2])

        row3 = self.conn.execute("SELECT delivery_state, active_batch_id FROM outbox_events WHERE event_id = 'evt_ack_3';").fetchone()
        self.assertEqual(row3[0], "dead_letter")
        self.assertIsNone(row3[1])

        # Verify batch status
        b_row = self.conn.execute("SELECT status, locked_by, lease_token FROM outbox_batches WHERE batch_id = ?;", (batch_id,)).fetchone()
        self.assertEqual(b_row[0], "partially_delivered")
        self.assertIsNone(b_row[1])
        self.assertIsNone(b_row[2])

    async def test_t08_replay_after_network_loss_is_idempotent(self):
        """T08: Network loss after server commit; replaying identical batch returns ACK with duplicate receipts."""
        self._insert_outbox_event("evt_rep_1", "log_rep_1")
        batches = self.dispatcher.create_batches()
        batch_id = batches[0]

        # 1. First attempt: simulates network failure / drop (no ACK recorded in dispatcher)
        fail_transport = httpx.MockTransport(lambda req: httpx.Response(500, text="Network timeout"))
        async with httpx.AsyncClient(transport=fail_transport) as client:
            res1 = await self.dispatcher.dispatch_batch(batch_id, client=client)
            self.assertFalse(res1["success"])

        # Batch attempt count incremented
        attempts = self.conn.execute("SELECT attempt_count FROM outbox_batches WHERE batch_id = ?;", (batch_id,)).fetchone()[0]
        self.assertEqual(attempts, 1)

        # 2. Second attempt (Replay): server returns 200 with acknowledged receipt
        ack_transport = httpx.MockTransport(lambda req: httpx.Response(200, json={
            "status": "delivered",
            "acknowledged_event_ids": ["evt_rep_1"],
            "retryable_event_ids": [],
            "rejected_event_ids": []
        }))
        async with httpx.AsyncClient(transport=ack_transport) as client:
            res2 = await self.dispatcher.dispatch_batch(batch_id, client=client)
            self.assertTrue(res2["success"])

        # Event and batch successfully marked delivered
        e_row = self.conn.execute("SELECT delivery_state, active_batch_id FROM outbox_events WHERE event_id = 'evt_rep_1';").fetchone()
        self.assertEqual(e_row[0], "delivered")
        self.assertIsNone(e_row[1])

        b_row = self.conn.execute("SELECT status, attempt_count FROM outbox_batches WHERE batch_id = ?;", (batch_id,)).fetchone()
        self.assertEqual(b_row[0], "delivered")
        self.assertEqual(b_row[1], 2)

    async def test_t09_dispatcher_lease_fencing_and_stale_reclamation(self):
        """T09: Claiming batch with lease fencing, expired lease recovery, and stale commit rejection."""
        self._insert_outbox_event("evt_fenc_1", "log_fenc_1")
        batches = self.dispatcher.create_batches()
        batch_id = batches[0]

        # 1. Dispatcher 1 claims the batch with a 100ms short lease
        claim1 = self.dispatcher.claim_next_batch(dispatcher_id="dispatcher_A", lease_duration_ms=100)
        self.assertIsNotNone(claim1)
        self.assertEqual(claim1["batch_id"], batch_id)
        self.assertEqual(claim1["lease_epoch"], 1)

        # Attempting to claim again immediately should return None (already claimed)
        claim_none = self.dispatcher.claim_next_batch(dispatcher_id="dispatcher_B")
        self.assertIsNone(claim_none)

        # 2. Wait for lease to expire
        time.sleep(0.15)

        # 3. Dispatcher 2 recovers and claims the stale batch
        claim2 = self.dispatcher.claim_next_batch(dispatcher_id="dispatcher_B", lease_duration_ms=15000)
        self.assertIsNotNone(claim2)
        self.assertEqual(claim2["batch_id"], batch_id)
        self.assertEqual(claim2["lease_epoch"], 2)

        # 4. Old Dispatcher 1 attempts to dispatch with expired lease -> MUST be aborted via fencing
        transport = httpx.MockTransport(lambda req: httpx.Response(200, json={"status": "delivered", "acknowledged_event_ids": ["evt_fenc_1"]}))
        async with httpx.AsyncClient(transport=transport) as client:
            res = await self.dispatcher.dispatch_batch(
                batch_id,
                client=client,
                lease_token=claim1["lease_token"],
                lease_epoch=claim1["lease_epoch"],
            )
            self.assertFalse(res["success"])
            self.assertEqual(res["status"], "lease_lost")

        # Verify batch is still held by Dispatcher B
        b_row = self.conn.execute("SELECT locked_by, lease_epoch FROM outbox_batches WHERE batch_id = ?;", (batch_id,)).fetchone()
        self.assertEqual(b_row[0], "dispatcher_B")
        self.assertEqual(b_row[1], 2)

    async def test_t10_http_413_payload_too_large_splitting(self):
        """T10: Batch receiving HTTP 413 is split into two child batches without losing events."""
        for i in range(1, 5):
            self._insert_outbox_event(f"evt_413_{i}", f"log_413_{i}")

        batches = self.dispatcher.create_batches()
        self.assertEqual(len(batches), 1)
        parent_batch_id = batches[0]

        # Dispatch with a mock 413 Payload Too Large response
        transport = httpx.MockTransport(lambda req: httpx.Response(413, text="Payload Too Large"))
        async with httpx.AsyncClient(transport=transport) as client:
            res = await self.dispatcher.dispatch_batch(parent_batch_id, client=client)
            self.assertEqual(res["status"], "split_superseded")
            self.assertEqual(len(res["sub_batches"]), 2)

        sub0 = res["sub_batches"][0]
        sub1 = res["sub_batches"][1]

        # Verify parent batch status
        p_row = self.conn.execute("SELECT status FROM outbox_batches WHERE batch_id = ?;", (parent_batch_id,)).fetchone()
        self.assertEqual(p_row[0], "split_superseded")

        # Verify sub-batches have 2 events each
        sub0_row = self.conn.execute("SELECT parent_batch_id, events_count, status FROM outbox_batches WHERE batch_id = ?;", (sub0,)).fetchone()
        self.assertEqual(sub0_row[0], parent_batch_id)
        self.assertEqual(sub0_row[1], 2)
        self.assertEqual(sub0_row[2], "ready")

        sub1_row = self.conn.execute("SELECT parent_batch_id, events_count, status FROM outbox_batches WHERE batch_id = ?;", (sub1,)).fetchone()
        self.assertEqual(sub1_row[0], parent_batch_id)
        self.assertEqual(sub1_row[1], 2)
        self.assertEqual(sub1_row[2], "ready")

        # Verify all 4 events now point to sub-batches
        events = self.conn.execute("SELECT event_id, active_batch_id, delivery_state FROM outbox_events WHERE event_id LIKE 'evt_413_%' ORDER BY event_id;").fetchall()
        self.assertEqual(len(events), 4)
        self.assertEqual([e[1] for e in events[:2]], [sub0, sub0])
        self.assertEqual([e[1] for e in events[2:]], [sub1, sub1])
        for e in events:
            self.assertEqual(e[2], "locked_in_batch")

    def test_t17_and_t18_parent_dead_letter_blocks_child_and_replay_unblocks(self):
        """
        T17: Parent account event dead_letter cascades to block child video events.
        T18: Parent replay unblocks child video events and refreshes first_eligible_at_ms.
        """
        parent_id = "evt_acc_parent_01"
        child1_id = "evt_vid_child_01"
        child2_id = "evt_vid_child_02"

        self._insert_outbox_event(parent_id, "log_acc_01", entity_type="account")
        self._insert_outbox_event(child1_id, "log_vid_01", entity_type="video", parent_event_id=parent_id)
        self._insert_outbox_event(child2_id, "log_vid_02", entity_type="video", parent_event_id=parent_id)

        # Batch creation
        batches = self.dispatcher.create_batches()
        batch_id = batches[0]

        # T17: Parent account is rejected -> dead_letter
        mock_ack_reject_parent = {
            "status": "partially_delivered",
            "acknowledged_event_ids": [],
            "retryable_event_ids": [],
            "rejected_event_ids": [parent_id],
            "errors": {
                parent_id: {"error_code": "PARSE_ERROR", "error_message": "Account invalid"}
            },
        }

        self.dispatcher._apply_partial_ack_response(batch_id, mock_ack_reject_parent)

        # Verify parent is dead_letter
        p_row = self.conn.execute("SELECT delivery_state FROM outbox_events WHERE event_id = ?;", (parent_id,)).fetchone()
        self.assertEqual(p_row[0], "dead_letter")

        # T17 Assertion: Both child videos MUST be blocked_by_parent_dead_letter
        c1_row = self.conn.execute("SELECT delivery_state, active_batch_id FROM outbox_events WHERE event_id = ?;", (child1_id,)).fetchone()
        self.assertEqual(c1_row[0], "blocked_by_parent_dead_letter")
        self.assertIsNone(c1_row[1])

        c2_row = self.conn.execute("SELECT delivery_state, active_batch_id FROM outbox_events WHERE event_id = ?;", (child2_id,)).fetchone()
        self.assertEqual(c2_row[0], "blocked_by_parent_dead_letter")
        self.assertIsNone(c2_row[1])

        # T18: Now parent account is re-crawled and resolved (simulated replay)
        unblocked_count = self.dispatcher.unblock_child_events(parent_event_id=parent_id)
        self.assertEqual(unblocked_count, 2)

        # T18 Assertion: Children must be returned to pending and eligibility refreshed
        now_check = int(time.time() * 1000)
        c1_after = self.conn.execute("SELECT delivery_state, first_eligible_at_ms, active_batch_id FROM outbox_events WHERE event_id = ?;", (child1_id,)).fetchone()
        self.assertEqual(c1_after[0], "pending")
        self.assertAlmostEqual(c1_after[1], now_check, delta=2000)
        self.assertIsNone(c1_after[2])

        c2_after = self.conn.execute("SELECT delivery_state, first_eligible_at_ms, active_batch_id FROM outbox_events WHERE event_id = ?;", (child2_id,)).fetchone()
        self.assertEqual(c2_after[0], "pending")
        self.assertAlmostEqual(c2_after[1], now_check, delta=2000)
        self.assertIsNone(c2_after[2])


if __name__ == "__main__":
    unittest.main()
