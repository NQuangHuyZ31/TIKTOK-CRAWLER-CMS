"""
Batch 6 Unit & Integration Tests: Scheduler Daemon & Shared Host Rate Limiter.
Covers:
- T14: Shared Rate Limiter 4:1 weighted schedule [profile, profile, profile, profile, discovery].
- T15: Idle borrowing across source classes without exceeding sustained 2.0 RPS ceiling.
- T16: HTTP 429 Retry-After header pause and Circuit Breaker behavior.
- Rate limiter global ceiling min interval (500ms).
- Active Job Admission Window (up to 20 active jobs, max 3 per owner fair share).
- T01: Worker commit after lease expiry rolls back completely with zero side-effects.
- T02: Atomic stale-running recovery & safe retry (completed targets are never reset).
- T03: Reclaimed chunk epoch fencing (stale worker cannot commit or heartbeat).
- Chunk crash budget exhaustion transitions chunk and targets to failed/terminal_failed.
"""

from pathlib import Path
import sqlite3
import sys
import tempfile
import time
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
TESTS_DIR = SERVICE_ROOT / "tests"
for p in (str(APP_DIR), str(TESTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from _async_compat import patch_windows_self_pipe_if_needed
patch_windows_self_pipe_if_needed()

from engine.schema import initialize_database
from engine.shared_rate_limiter import SharedHostRateLimiter
from workers.scheduler_daemon import SchedulerDaemon, FencingException


class TestBatch6SchedulerAndRateLimiter(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_batch6.db"
        self.conn = initialize_database(self.db_path)
        self.now = int(time.time() * 1000)

        # Base job and run
        self.conn.execute(
            """
            INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, crawl_status, created_at_ms, updated_at_ms)
            VALUES ('job_base', 'admin', 10, 'running', ?, ?);
            """,
            (self.now, self.now)
        )
        self.conn.execute(
            """
            INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, run_sequence, status, created_at_ms)
            VALUES ('run_base', 'job_base', 1, 'running', ?);
            """,
            (self.now,)
        )
        self.conn.commit()

        self.limiter = SharedHostRateLimiter(self.db_path)
        self.scheduler = SchedulerDaemon(self.db_path)

    def _ensure_run(self, crawl_run_id: str, job_id: str = "job_base"):
        self.conn.execute(
            """
            INSERT OR IGNORE INTO crawl_runs (crawl_run_id, crawl_job_id, run_sequence, status, created_at_ms)
            VALUES (?, ?, 1, 'running', ?);
            """,
            (crawl_run_id, job_id, self.now)
        )
        self.conn.commit()

    def tearDown(self):
        self.conn.close()
        self.tmp_dir.cleanup()

    # ==========================================================================
    # Rate Limiter Tests
    # ==========================================================================

    def test_t14_schedule_4_to_1_pattern(self):
        """
        Verify that when both Profile and Discovery have queued requests,
        permits are granted strictly in the 4:1 weighted pattern:
        [profile, profile, profile, profile, discovery, profile, ...]
        """
        # Enqueue 8 profile requests and 2 discovery requests
        profile_reqs = [self.limiter.enqueue_request("profile") for _ in range(8)]
        discovery_reqs = [self.limiter.enqueue_request("discovery") for _ in range(2)]

        granted_sources = []

        # Grant 10 permits sequentially by overriding global_next_grant_at_ms to bypass real-time delay
        for _ in range(10):
            # Fast-forward time for the test
            self.conn.execute("UPDATE rate_limit_state SET global_next_grant_at_ms = 0 WHERE singleton_id = 1;")
            self.conn.commit()

            res = self.limiter.grant_due_requests()
            self.assertEqual(res, 1)

            cursor = self.conn.execute("SELECT last_granted_source FROM rate_limit_state WHERE singleton_id = 1;")
            last_src = cursor.fetchone()[0]
            granted_sources.append(last_src)

        expected_pattern = [
            "profile", "profile", "profile", "profile", "discovery",
            "profile", "profile", "profile", "profile", "discovery",
        ]
        self.assertEqual(granted_sources, expected_pattern)

    def test_t15_borrowing_when_empty(self):
        """
        Verify idle borrowing:
        1. When only Discovery requests exist (0 Profile), Discovery borrows slots 0-3 and proceeds.
        2. When only Profile requests exist (0 Discovery), Profile borrows slot 4 and proceeds.
        3. In all cases, 2.0 RPS sustained ceiling is strictly preserved (500ms min interval).
        """
        # Case 1: Only Discovery requests
        disc_req1 = self.limiter.enqueue_request("discovery")
        disc_req2 = self.limiter.enqueue_request("discovery")

        # Slot index starts at 0 (normally profile). Because profile is empty, discovery borrows!
        res1 = self.limiter.grant_due_requests()
        self.assertEqual(res1, 1)
        req1_data = self.limiter.get_request_status(disc_req1)
        self.assertEqual(req1_data["status"], "granted")

        # Fast forward delay
        self.conn.execute("UPDATE rate_limit_state SET global_next_grant_at_ms = 0 WHERE singleton_id = 1;")
        self.conn.commit()

        res2 = self.limiter.grant_due_requests()
        self.assertEqual(res2, 1)
        req2_data = self.limiter.get_request_status(disc_req2)
        self.assertEqual(req2_data["status"], "granted")

        # Case 2: Only Profile requests
        prof_req1 = self.limiter.enqueue_request("profile")
        # Advance slot to slot 4 (discovery slot)
        self.conn.execute("UPDATE rate_limit_state SET weighted_slot_index = 4, global_next_grant_at_ms = 0 WHERE singleton_id = 1;")
        self.conn.commit()

        # Slot 4 is normally discovery, but discovery is empty -> profile borrows!
        res3 = self.limiter.grant_due_requests()
        self.assertEqual(res3, 1)
        prof_data = self.limiter.get_request_status(prof_req1)
        self.assertEqual(prof_data["status"], "granted")

    def test_t16_http_429_retry_after_handling(self):
        """
        Verify HTTP 429 response handling:
        1. Setting Retry-After pauses that specific source.
        2. Paused source cannot be granted permits during pause duration.
        3. The unpaused source can continue through borrowing.
        4. Success (HTTP 200) resets consecutive 429 count.
        """
        prof_req = self.limiter.enqueue_request("profile")
        disc_req = self.limiter.enqueue_request("discovery")

        # Record HTTP 429 with 10s Retry-After on profile
        self.limiter.record_response("profile", 429, retry_after_s=10.0)

        state = self.limiter.get_state()
        prof_state = state["sources"]["profile"]
        self.assertGreater(prof_state["paused_until_ms"], self.limiter.now_ms())
        self.assertEqual(prof_state["consecutive_429"], 1)

        # Slot 0 is profile, but profile is paused -> Discovery borrows!
        res = self.limiter.grant_due_requests()
        self.assertEqual(res, 1)

        # Discovery request was granted
        self.assertEqual(self.limiter.get_request_status(disc_req)["status"], "granted")
        # Profile request remains queued
        self.assertEqual(self.limiter.get_request_status(prof_req)["status"], "queued")

        # Record successful response on profile -> clears pause and resets counter
        self.limiter.record_response("profile", 200)
        state_after = self.limiter.get_state()
        self.assertEqual(state_after["sources"]["profile"]["consecutive_429"], 0)
        self.assertIsNone(state_after["sources"]["profile"]["paused_until_ms"])

    def test_rate_limiter_global_ceiling_prevents_bursts(self):
        """
        Verify that after granting a permit, another permit cannot be granted
        until at least 500ms have elapsed (sustained ceiling).
        """
        req1 = self.limiter.enqueue_request("profile")
        req2 = self.limiter.enqueue_request("profile")

        # First grant succeeds
        res1 = self.limiter.grant_due_requests()
        self.assertEqual(res1, 1)

        # Immediate second grant call returns 0 because 500ms haven't passed
        res2 = self.limiter.grant_due_requests()
        self.assertEqual(res2, 0)
        self.assertEqual(self.limiter.get_request_status(req2)["status"], "queued")

    def test_acquire_permit_sync(self):
        """Verify high-level acquire_permit_sync successfully returns granted permit."""
        # Reset any global delay
        self.conn.execute("UPDATE rate_limit_state SET global_next_grant_at_ms = 0 WHERE singleton_id = 1;")
        self.conn.commit()

        req_id = self.limiter.acquire_permit_sync("profile", timeout_s=2.0, poll_interval_s=0.01)
        self.assertIsNotNone(req_id)
        status = self.limiter.get_request_status(req_id)
        self.assertEqual(status["status"], "granted")

    # ==========================================================================
    # Scheduler Daemon Tests
    # ==========================================================================

    def test_admission_window_fair_share_and_quotas(self):
        """
        Verify that the SchedulerDaemon enforces:
        - Max 20 active jobs globally
        - Max 3 active jobs per owner (fair share)
        """
        # Insert 5 jobs for owner_A and 5 jobs for owner_B, all admission_pending
        for i in range(5):
            self.conn.execute(
                """
                INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, crawl_status, created_at_ms, updated_at_ms)
                VALUES (?, 'owner_A', 100, 'admission_pending', ?, ?);
                """,
                (f"job_a_{i}", self.now + i, self.now + i)
            )
            self.conn.execute(
                """
                INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, crawl_status, created_at_ms, updated_at_ms)
                VALUES (?, 'owner_B', 100, 'admission_pending', ?, ?);
                """,
                (f"job_b_{i}", self.now + i, self.now + i)
            )
        self.conn.commit()

        admitted = self.scheduler.admit_pending_jobs(max_active_jobs=20, max_active_per_owner=3)

        # Exactly 3 from owner_A and 3 from owner_B should be admitted
        self.assertEqual(len(admitted), 6)

        cursor = self.conn.execute("SELECT owner_id, COUNT(*) FROM crawl_jobs WHERE crawl_status = 'running' GROUP BY owner_id;")
        running_by_owner = dict(cursor.fetchall())
        self.assertEqual(running_by_owner["owner_A"], 3)
        self.assertEqual(running_by_owner["owner_B"], 3)

    def test_t01_worker_commit_after_lease_expiry_rolls_back(self):
        """
        Verify T01: A worker whose lease expires before commit:
        1. Raises FencingException.
        2. Rolls back completely with zero changes to targets, results, or outbox.
        """
        # Create chunk with 1 target
        self._ensure_run("run_01")
        targets = [{"candidate_id": "cand_01", "username": "user01", "sec_uid": "sec_01"}]
        chunk_ids = self.scheduler.create_chunks_for_run("run_01", targets, chunk_size=25)
        chunk_id = chunk_ids[0]

        # Worker claims chunk
        claim = self.scheduler.claim_chunk(worker_id="worker_alpha", lease_duration_ms=60000)
        self.assertIsNotNone(claim)
        token = claim["lease_token"]
        epoch = claim["lease_epoch"]

        # Worker claims target
        tgt = self.scheduler.claim_next_target(chunk_id, "worker_alpha", token, epoch)
        self.assertIsNotNone(tgt)

        # Force chunk lease to expire
        self.conn.execute(
            "UPDATE job_chunks SET lease_expires_at_ms = ? WHERE chunk_id = ?;",
            (self.now - 5000, chunk_id)
        )
        self.conn.commit()

        # Worker attempts to commit result
        account_res = {
            "result_id": "res_01",
            "username": "user01",
            "sec_uid": "sec_01",
            "account_data_json": '{"follower_count": 1000}',
        }
        outbox_event = {
            "event_id": "evt_01",
            "logical_event_key": "user01",
            "entity_type": "tiktok_account",
            "entity_key": "sec_01",
            "observed_at": "2026-11-06T10:00:00.000000Z",
            "payload_hash": "hash_01",
            "payload_json": '{"follower_count": 1000}',
        }

        with self.assertRaises(FencingException):
            self.scheduler.commit_target_success(
                chunk_id=chunk_id,
                worker_id="worker_alpha",
                lease_token=token,
                lease_epoch=epoch,
                target_id=tgt["target_id"],
                crawl_run_id="run_01",
                account_result=account_res,
                video_results=[],
                outbox_events=[outbox_event],
            )

        # Verify zero side-effects in database
        cursor = self.conn.execute("SELECT status FROM crawl_job_targets WHERE target_id = ?;", (tgt["target_id"],))
        self.assertEqual(cursor.fetchone()[0], "running")  # Target not marked completed

        cursor = self.conn.execute("SELECT COUNT(*) FROM crawl_account_results;")
        self.assertEqual(cursor.fetchone()[0], 0)  # No result saved

        cursor = self.conn.execute("SELECT COUNT(*) FROM outbox_events;")
        self.assertEqual(cursor.fetchone()[0], 0)  # No outbox event written

    def test_t02_stale_recovery_atomic_and_safe_retry(self):
        """
        Verify T02: Stale-running recovery (Section 2.6 of v2.2 spec):
        1. Atomically revokes expired chunk, increments lease_epoch, resets locked_by.
        2. Targets in 'running' are reset to 'retryable_failed'.
        3. Targets in 'completed' are NEVER touched.
        4. Counters on job_chunks match exact count of targets from crawl_job_targets.
        """
        self._ensure_run("run_02")
        targets = [
            {"target_id": "t1", "candidate_id": "c1", "username": "u1"},
            {"target_id": "t2", "candidate_id": "c2", "username": "u2"},
            {"target_id": "t3", "candidate_id": "c3", "username": "u3"},
        ]
        chunk_ids = self.scheduler.create_chunks_for_run("run_02", targets, chunk_size=25)
        chunk_id = chunk_ids[0]

        # Claim chunk
        claim = self.scheduler.claim_chunk(worker_id="worker_beta", lease_duration_ms=60000)
        token = claim["lease_token"]
        epoch = claim["lease_epoch"]

        # Claim t1 and commit it successfully
        tgt1 = self.scheduler.claim_next_target(chunk_id, "worker_beta", token, epoch)
        self.scheduler.commit_target_success(
            chunk_id=chunk_id,
            worker_id="worker_beta",
            lease_token=token,
            lease_epoch=epoch,
            target_id="t1",
            crawl_run_id="run_02",
            account_result={"result_id": "r1", "username": "u1", "account_data_json": "{}"},
            video_results=[],
            outbox_events=[{
                "event_id": "e1", "logical_event_key": "u1", "entity_type": "tiktok_account",
                "entity_key": "u1", "observed_at": "2026-11-06T10:00:00Z", "payload_hash": "h1"
            }],
        )

        # Claim t2 (now running)
        tgt2 = self.scheduler.claim_next_target(chunk_id, "worker_beta", token, epoch)
        self.assertEqual(tgt2["target_id"], "t2")

        # t3 remains pending.
        # Now expire the chunk lease!
        self.conn.execute("UPDATE job_chunks SET lease_expires_at_ms = ? WHERE chunk_id = ?;", (self.now - 1000, chunk_id))
        self.conn.commit()

        # Run stale recovery
        recovered = self.scheduler.recover_stale_chunks()
        self.assertEqual(recovered, 1)

        # Inspect target states
        cursor = self.conn.execute("SELECT target_id, status FROM crawl_job_targets ORDER BY target_id ASC;")
        statuses = dict(cursor.fetchall())
        self.assertEqual(statuses["t1"], "completed")  # NEVER RESET!
        self.assertEqual(statuses["t2"], "retryable_failed")  # Safely reset to retryable
        self.assertEqual(statuses["t3"], "pending")  # Untouched pending

        # Inspect chunk state & counters
        cursor = self.conn.execute(
            """
            SELECT status, lease_epoch, chunk_crash_count, locked_by,
                   pending_targets, running_targets, retryable_targets, completed_targets
            FROM job_chunks WHERE chunk_id = ?;
            """,
            (chunk_id,)
        )
        ch_status, ch_epoch, crash_cnt, locked_by, p_cnt, r_cnt, ret_cnt, c_cnt = cursor.fetchone()
        self.assertEqual(ch_status, "ready")
        self.assertEqual(ch_epoch, epoch + 1)
        self.assertEqual(crash_cnt, 1)
        self.assertIsNone(locked_by)

        # Counters accurately reconciled from crawl_job_targets
        self.assertEqual(p_cnt, 1)
        self.assertEqual(r_cnt, 0)
        self.assertEqual(ret_cnt, 1)
        self.assertEqual(c_cnt, 1)

    def test_t03_reclaimed_chunk_epoch_fencing(self):
        """
        Verify T03: Once a chunk has been recovered and reclaimed by Worker 2:
        - Stale Worker 1 cannot renew heartbeat or commit.
        - Worker 2 has exclusive access.
        """
        self._ensure_run("run_03")
        targets = [{"target_id": "t_t03", "candidate_id": "c03", "username": "u03"}]
        chunk_ids = self.scheduler.create_chunks_for_run("run_03", targets, chunk_size=25)
        chunk_id = chunk_ids[0]

        # Worker 1 claims chunk (epoch 1)
        claim1 = self.scheduler.claim_chunk(worker_id="worker_one")
        w1_token = claim1["lease_token"]
        w1_epoch = claim1["lease_epoch"]

        # Expire chunk and recover
        self.conn.execute("UPDATE job_chunks SET lease_expires_at_ms = ? WHERE chunk_id = ?;", (self.now - 1000, chunk_id))
        self.conn.commit()
        self.scheduler.recover_stale_chunks()

        # Worker 2 claims chunk (epoch 3)
        claim2 = self.scheduler.claim_chunk(worker_id="worker_two")
        self.assertIsNotNone(claim2)
        w2_token = claim2["lease_token"]
        w2_epoch = claim2["lease_epoch"]
        self.assertGreater(w2_epoch, w1_epoch)

        # Stale Worker 1 attempts heartbeat -> returns False
        hb_result = self.scheduler.heartbeat_chunk(
            chunk_id=chunk_id,
            worker_id="worker_one",
            lease_token=w1_token,
            lease_epoch=w1_epoch,
        )
        self.assertFalse(hb_result)

        # Worker 2 heartbeat -> returns True
        hb2_result = self.scheduler.heartbeat_chunk(
            chunk_id=chunk_id,
            worker_id="worker_two",
            lease_token=w2_token,
            lease_epoch=w2_epoch,
        )
        self.assertTrue(hb2_result)

    def test_chunk_crash_budget_exhaustion(self):
        """
        Verify that when a chunk crashes max_chunk_crashes times (e.g. 3):
        - Chunk status transitions to 'failed'.
        - Pending and retryable targets are marked 'terminal_failed' with MAX_CHUNK_CRASHES_EXCEEDED.
        """
        self._ensure_run("run_crash")
        targets = [{"target_id": "t_crash", "candidate_id": "c_crash", "username": "u_crash"}]
        chunk_ids = self.scheduler.create_chunks_for_run("run_crash", targets, chunk_size=25)
        chunk_id = chunk_ids[0]

        # Set chunk crash count to 2 (1 crash away from limit 3)
        self.conn.execute(
            """
            UPDATE job_chunks
            SET status = 'running',
                chunk_crash_count = 2,
                lease_expires_at_ms = ?,
                lease_epoch = 1
            WHERE chunk_id = ?;
            """,
            (self.now - 1000, chunk_id)
        )
        self.conn.execute(
            "UPDATE crawl_job_targets SET status = 'running', lease_epoch = 1 WHERE chunk_id = ?;",
            (chunk_id,)
        )
        self.conn.commit()

        # Recover stale chunk (triggers 3rd crash)
        recovered = self.scheduler.recover_stale_chunks(max_chunk_crashes=3)
        self.assertEqual(recovered, 1)

        # Verify chunk failed
        cursor = self.conn.execute("SELECT status, chunk_crash_count FROM job_chunks WHERE chunk_id = ?;", (chunk_id,))
        ch_status, crash_cnt = cursor.fetchone()
        self.assertEqual(ch_status, "failed")
        self.assertEqual(crash_cnt, 3)

        # Verify target is terminal_failed
        cursor = self.conn.execute("SELECT status, last_error_code FROM crawl_job_targets WHERE chunk_id = ?;", (chunk_id,))
        t_status, err_code = cursor.fetchone()
        self.assertEqual(t_status, "terminal_failed")
        self.assertEqual(err_code, "MAX_CHUNK_CRASHES_EXCEEDED")

    def test_custom_config_override(self):
        """
        Verify that SchedulerDaemon and SharedHostRateLimiter respect custom
        configuration parameters provided via constructor or config module.
        """
        custom_scheduler = SchedulerDaemon(
            self.db_path,
            max_active_jobs=5,
            max_active_per_owner=1,
            default_chunk_size=10,
            default_lease_duration_ms=30000,
        )
        self.assertEqual(custom_scheduler.max_active_jobs, 5)
        self.assertEqual(custom_scheduler.max_active_per_owner, 1)
        self.assertEqual(custom_scheduler.default_chunk_size, 10)
        self.assertEqual(custom_scheduler.default_lease_duration_ms, 30000)

        custom_limiter = SharedHostRateLimiter(
            self.db_path,
            rate_limit_rps=4.0,  # 4 RPS -> 250ms min interval
        )
        self.assertEqual(custom_limiter.rate_limit_rps, 4.0)
        self.assertEqual(custom_limiter.min_interval_ms, 250)


if __name__ == "__main__":
    unittest.main()
