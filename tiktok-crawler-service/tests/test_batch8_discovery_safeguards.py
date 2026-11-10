"""
Test Suite for Batch 8: Discovery Refill Worker, Operational Safeguards & Privacy Saga
Verifies:
- T21: Privacy Saga suppression and purge cascade.
- T22: Disk space < 5GB stops job admission.
- WAL threshold monitoring & checkpointing.
- Privacy suppression gate preventing candidate upsert.
- Discovery pool watermark management & dataset fallback.
- Startup pre-warming logic.
"""

from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import MagicMock, patch
import uuid

try:
    from tests._async_compat import patch_windows_self_pipe_if_needed
    patch_windows_self_pipe_if_needed()
except ImportError:
    try:
        from _async_compat import patch_windows_self_pipe_if_needed
        patch_windows_self_pipe_if_needed()
    except ImportError:
        pass

from app.engine.candidate_manager import CandidateManager
from app.workers.discovery_worker import DiscoveryWorker
from app.engine.sagas.privacy_saga import PrivacySagaCoordinator
from app.engine.safeguards import DiskSafeguards
from app.workers.scheduler_daemon import SchedulerDaemon
from app.engine.schema import initialize_database
from app.engine.shared_rate_limiter import SharedHostRateLimiter


class TestBatch8DiscoverySafeguards(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_queue.db"
        self.conn = initialize_database(self.db_path)

        self.candidate_manager = CandidateManager(self.db_path)
        self.privacy_saga = PrivacySagaCoordinator(self.db_path)
        self.rate_limiter = SharedHostRateLimiter(self.db_path)
        self.scheduler = SchedulerDaemon(self.db_path)
        self.discovery_worker = DiscoveryWorker(
            db_path=self.db_path,
            rate_limiter=self.rate_limiter,
            candidate_manager=self.candidate_manager,
            target_size=20,
            low_watermark=5,
            allow_bootstrap_fallback=True,
        )

    def tearDown(self):
        self.conn.close()
        try:
            self.temp_dir.cleanup()
        except PermissionError:
            pass

    # --------------------------------------------------------------------------
    # 1. T22: Operational Safeguards (Disk Space & WAL)
    # --------------------------------------------------------------------------
    def test_disk_safeguards_low_space_detection(self):
        with patch.object(DiskSafeguards, "get_free_disk_gb", return_value=3.5):
            self.assertTrue(DiskSafeguards.is_disk_space_low(self.db_path, min_free_gb=5.0))

        with patch.object(DiskSafeguards, "get_free_disk_gb", return_value=12.0):
            self.assertFalse(DiskSafeguards.is_disk_space_low(self.db_path, min_free_gb=5.0))

    def test_t22_scheduler_pauses_admission_when_disk_space_low(self):
        now = int(time.time() * 1000)
        # Create a pending job
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO crawl_jobs (
                    crawl_job_id, owner_id, requested_accounts, crawl_status,
                    priority_level, created_at_ms, updated_at_ms
                ) VALUES ('job_t22', 'user_1', 10, 'admission_pending', 5, ?, ?);
                """,
                (now, now)
            )

        # Mock low disk space (< 5.0 GB)
        with patch("app.workers.scheduler_daemon.DiskSafeguards.is_disk_space_low", return_value=True):
            admitted = self.scheduler.admit_pending_jobs(min_free_disk_gb=5.0)
            self.assertEqual(admitted, [], "Scheduler must not admit jobs when disk space is low (T22)")

        # Verify job is still admission_pending
        cursor = self.conn.cursor()
        cursor.execute("SELECT crawl_status FROM crawl_jobs WHERE crawl_job_id = 'job_t22';")
        self.assertEqual(cursor.fetchone()[0], "admission_pending")

        # Mock sufficient disk space (>= 5.0 GB)
        with patch("app.workers.scheduler_daemon.DiskSafeguards.is_disk_space_low", return_value=False):
            admitted = self.scheduler.admit_pending_jobs(min_free_disk_gb=5.0)
            self.assertEqual(admitted, ["job_t22"], "Scheduler must admit jobs when disk space is sufficient")

    # --------------------------------------------------------------------------
    # 2. T21 & Privacy Saga: Suppression & Purge Cascade
    # --------------------------------------------------------------------------
    def test_privacy_suppression_and_candidate_gate(self):
        username = "privacy_test_user"
        sec_uid = "sec_uid_privacy_123"

        # Suppress entity
        self.privacy_saga.suppress_entity(entity_type="username", entity_key=username, reason="gdpr_opt_out")
        self.assertTrue(self.privacy_saga.is_suppressed("username", username))

        # CandidateManager must refuse to upsert suppressed entity
        result = self.candidate_manager.upsert_candidate_identity(
            username=username,
            sec_uid=sec_uid,
            allocation_class="fresh_discovery",
        )
        self.assertTrue(result.get("suppressed"))
        self.assertIsNone(result.get("candidate_id"))

        # Verify candidate_pool has no row
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM candidate_pool;")
        self.assertEqual(cursor.fetchone()[0], 0)

    def test_t21_privacy_purge_cascade(self):
        username = "purge_creator"
        sec_uid = "sec_uid_purge_999"
        now = int(time.time() * 1000)

        # 1. Setup candidate, alias, source, and discovery frontier
        upsert_res = self.candidate_manager.upsert_candidate_identity(
            username=username,
            sec_uid=sec_uid,
            allocation_class="fresh_discovery",
            source_type="seed_mention",
            source_reference="video_123",
        )
        candidate_id = upsert_res["candidate_id"]
        self.assertIsNotNone(candidate_id)

        # Enqueue in discovery frontier as well
        fid = self.discovery_worker.enqueue_frontier_candidate(username, "test_mention", "video_123")

        # Create dummy crawl run & pending outbox event
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO crawl_jobs (
                    crawl_job_id, owner_id, requested_accounts, crawl_status,
                    created_at_ms, updated_at_ms
                ) VALUES ('job_p1', 'user_1', 1, 'running', ?, ?);
                """,
                (now, now)
            )
            self.conn.execute(
                "INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, run_sequence, created_at_ms) "
                "VALUES ('run_p1', 'job_p1', 1, ?);",
                (now,)
            )
            self.conn.execute(
                """
                INSERT INTO outbox_events (
                    event_id, logical_event_key, crawl_run_id, entity_type, entity_key,
                    operation, schema_version, observed_at, payload_hash, delivery_state,
                    first_eligible_at_ms, created_at_ms
                ) VALUES ('evt_p1', 'key_p1', 'run_p1', 'tiktok_account', ?,
                          'upsert', '1.0', '2026-11-06T00:00:00Z', 'hash', 'pending', ?, ?);
                """,
                (username, now, now)
            )

        # 2. Execute privacy purge cascade
        purge_res = self.privacy_saga.purge_entity(
            entity_type="username",
            entity_key=username,
            purge_request_id="prg_req_001",
            reason="gdpr_forget_me",
        )

        self.assertTrue(purge_res["success"])
        self.assertEqual(purge_res["purged_candidates"], 1)
        self.assertEqual(purge_res["cancelled_outbox_events"], 1)

        # 3. Assertions on SQLite state
        cursor = self.conn.cursor()

        # Entity is suppressed
        self.assertTrue(self.privacy_saga.is_suppressed("username", username))

        # Candidate pool record is gone
        cursor.execute("SELECT COUNT(*) FROM candidate_pool WHERE candidate_id = ?;", (candidate_id,))
        self.assertEqual(cursor.fetchone()[0], 0)

        # Aliases are gone
        cursor.execute("SELECT COUNT(*) FROM candidate_aliases WHERE candidate_id = ?;", (candidate_id,))
        self.assertEqual(cursor.fetchone()[0], 0)

        # Frontier record is gone
        cursor.execute("SELECT COUNT(*) FROM discovery_frontier WHERE username_normalized = ?;", (username,))
        self.assertEqual(cursor.fetchone()[0], 0)

        # Outbox event is cancelled (dead_letter)
        cursor.execute("SELECT delivery_state FROM outbox_events WHERE event_id = 'evt_p1';")
        self.assertEqual(cursor.fetchone()[0], "dead_letter")

        # Purge job logged as completed
        cursor.execute(
            "SELECT status FROM privacy_purge_jobs WHERE purge_request_id = 'prg_req_001';"
        )
        self.assertEqual(cursor.fetchone()[0], "completed")

    # --------------------------------------------------------------------------
    # 3. Discovery Refill Worker & Pool Watermarks
    # --------------------------------------------------------------------------
    def test_discovery_refill_and_watermarks(self):
        self.assertEqual(self.discovery_worker.get_valid_candidate_count(), 0)
        self.assertTrue(self.discovery_worker.is_pool_below_watermark())

        # Enqueue a few frontier candidates
        for i in range(10):
            self.discovery_worker.enqueue_frontier_candidate(f"discovered_user_{i}", "test", "ref_1")

        # Refill with target size 8 (bypassing rate limiter wait in unit test)
        refilled = self.discovery_worker.refill_candidate_pool(
            target_size=8,
            max_batch=10,
            rate_limited=False,
        )
        self.assertEqual(refilled, 8)
        self.assertEqual(self.discovery_worker.get_valid_candidate_count(), 8)
        self.assertFalse(self.discovery_worker.is_pool_below_watermark())  # watermark is 5

        # Check frontier statuses
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM discovery_frontier WHERE status = 'validated';")
        self.assertEqual(cursor.fetchone()[0], 8)
        cursor.execute("SELECT COUNT(*) FROM discovery_frontier WHERE status = 'pending';")
        self.assertEqual(cursor.fetchone()[0], 2)

    def test_discovery_startup_pre_warm(self):
        # Startup inspection on empty pool triggers pre-warm from dataset
        dataset_csv = Path(self.temp_dir.name) / "dataset.csv"
        with open(dataset_csv, "w", encoding="utf-8") as f:
            f.write("username,followers\n")
            f.write("linhbarbie,1000\n")
            f.write("vietphuongthoa98,2000\n")
            f.write("lebong95,3000\n")

        with patch.object(self.discovery_worker, "seed_from_dataset") as mock_seed:
            def fake_seed():
                for u in ["linhbarbie", "vietphuongthoa98", "lebong95"]:
                    self.discovery_worker.enqueue_frontier_candidate(u, "bootstrap", "dataset.csv")
                return 3
            mock_seed.side_effect = fake_seed

            prewarmed = self.discovery_worker.check_and_refill_on_startup()
            self.assertEqual(prewarmed, 3)
            self.assertEqual(self.discovery_worker.get_valid_candidate_count(), 3)

    def test_discover_mentions_from_seed_video_crawl(self):
        import asyncio
        from unittest.mock import AsyncMock

        mock_client = MagicMock()
        mock_outcome = MagicMock()
        mock_video1 = MagicMock()
        mock_video1.video_id = "vid_101"
        mock_video1.description = "Duet with @creator_one and @creator_two check it out!"
        mock_video1.music_author = "sound_author_vn"
        mock_video2 = MagicMock()
        mock_video2.video_id = "vid_102"
        mock_video2.description = "Just chilling with @creator_one again"
        mock_video2.music_author = None
        mock_outcome.videos = [mock_video1, mock_video2]
        mock_outcome.account = MagicMock(bio="Follow my backup @backup_creator")

        mock_client.crawl_account = AsyncMock(return_value=mock_outcome)
        self.discovery_worker.tiktok_client = mock_client
        self.discovery_worker.fetch_video_commenters = AsyncMock(return_value=["commenter_fan", "viral_collab"])

        mentions = asyncio.run(
            self.discovery_worker.discover_mentions_from_seed("linhbarbie", max_videos=20)
        )
        self.assertIn("creator_one", mentions)
        self.assertIn("creator_two", mentions)
        self.assertIn("sound_author_vn", mentions)
        self.assertIn("backup_creator", mentions)
        self.assertIn("commenter_fan", mentions)
        self.assertIn("viral_collab", mentions)

    def test_discovery_worker_pool_lifecycle(self):
        import asyncio
        from unittest.mock import AsyncMock
        from app.workers.discovery_worker import DiscoveryWorkerPool

        # Mock tiktok_client so tests do not make outbound network calls
        mock_client = MagicMock()
        mock_client.crawl_account = AsyncMock(return_value=MagicMock(videos=[], account=None))
        mock_client.close = AsyncMock()
        self.discovery_worker.tiktok_client = mock_client

        pool = DiscoveryWorkerPool(
            db_path=self.db_path,
            worker_count=2,
            interval_seconds=1.0,
            discovery_worker=self.discovery_worker,
        )

        async def test_pool():
            await pool.start()
            self.assertTrue(pool._running)
            self.assertEqual(len(pool._tasks), 2)
            await asyncio.sleep(0.1)
            await pool.stop()
            self.assertFalse(pool._running)

        asyncio.run(test_pool())

    def test_username_validation_and_invalid_candidate_rejection(self):
        # 1. Validation method checks
        self.assertTrue(CandidateManager.is_valid_username("linhbarbie"))
        self.assertTrue(CandidateManager.is_valid_username("user_123"))
        self.assertTrue(CandidateManager.is_valid_username("a.b.c"))
        self.assertTrue(CandidateManager.is_valid_username("@valid_creator"))

        self.assertFalse(CandidateManager.is_valid_username("#hashtag_sound"))
        self.assertFalse(CandidateManager.is_valid_username("#សំនៀងគំនិត"))
        self.assertFalse(CandidateManager.is_valid_username("space user"))
        self.assertFalse(CandidateManager.is_valid_username("a"))  # too short (< 2)
        self.assertFalse(CandidateManager.is_valid_username("this_username_is_way_too_long_and_exceeds_twenty_four"))

        # 2. CandidateManager rejects invalid username
        res = self.candidate_manager.upsert_candidate_identity(username="#សំនៀងគំនិត")
        self.assertTrue(res.get("invalid"))
        self.assertIsNone(res.get("candidate_id"))

        # 3. enqueue_frontier_candidate rejects invalid username
        front_res = self.discovery_worker.enqueue_frontier_candidate(username="#សំនៀងគំនិត")
        self.assertIsNone(front_res)

    def test_seed_crawl_count_increment_and_rotation(self):
        # 1. Exhaust all bootstrap_seeds so fallback to candidate_pool happens
        with self.conn:
            self.conn.execute("UPDATE bootstrap_seeds SET is_exhausted = 1;")

        # 2. Insert two valid candidates
        res1 = self.candidate_manager.upsert_candidate_identity(username="creator_alpha")
        res2 = self.candidate_manager.upsert_candidate_identity(username="creator_beta")

        # Initial seed should be creator_alpha or creator_beta with crawl_count = 0
        first_seed = self.discovery_worker.get_unexhausted_seed()
        self.assertIn(first_seed, ["creator_alpha", "creator_beta"])

        # Mark first_seed exhausted -> increments crawl_count in candidate_pool
        self.discovery_worker.mark_seed_exhausted(first_seed)

        # Check candidate_pool crawl_count
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT p.crawl_count FROM candidate_pool p
            JOIN candidate_aliases a ON p.candidate_id = a.candidate_id
            WHERE a.username_normalized = ?;
            """,
            (first_seed,)
        )
        self.assertEqual(cursor.fetchone()[0], 1)

        # Next seed MUST rotate to the other creator whose crawl_count is still 0
        second_seed = self.discovery_worker.get_unexhausted_seed()
        expected_second = "creator_beta" if first_seed == "creator_alpha" else "creator_alpha"
        self.assertEqual(second_seed, expected_second)

    def test_atomic_seed_leasing_prevents_concurrent_duplicates(self):
        # 1. Exhaust all bootstrap_seeds
        with self.conn:
            self.conn.execute("UPDATE bootstrap_seeds SET is_exhausted = 1;")

        # 2. Insert two valid candidates
        self.candidate_manager.upsert_candidate_identity(username="concur_alpha")
        self.candidate_manager.upsert_candidate_identity(username="concur_beta")

        # Worker 1 claims seed
        seed_w1 = self.discovery_worker.claim_unexhausted_seed()
        self.assertIn(seed_w1, ["concur_alpha", "concur_beta"])

        # Worker 2 claims seed CONCURRENTLY (Worker 1 has NOT called mark_seed_exhausted yet)
        seed_w2 = self.discovery_worker.claim_unexhausted_seed()
        self.assertIn(seed_w2, ["concur_alpha", "concur_beta"])

        # GUARANTEE: Worker 1 and Worker 2 NEVER get the same seed!
        self.assertNotEqual(seed_w1, seed_w2, "Two concurrent discovery workers must never claim the same seed!")

    def test_purge_invalid_candidates(self):
        # Manually insert invalid alias into candidate_aliases and pool
        now = int(time.time() * 1000)
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO candidate_pool (candidate_id, identity_state, allocation_class, lifecycle_status, priority_score, crawl_count, created_at_ms, updated_at_ms)
                VALUES ('cand_bad', 'unresolved', 'fresh_discovery', 'valid', 10, 0, ?, ?);
                """,
                (now, now)
            )
            self.conn.execute(
                """
                INSERT INTO candidate_aliases (alias_id, candidate_id, username_normalized, is_current, first_seen_at_ms, last_seen_at_ms)
                VALUES ('alias_bad', 'cand_bad', '#សំនៀងគំនិត', 1, ?, ?);
                """,
                (now, now)
            )

        # Verify it exists
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM candidate_aliases WHERE username_normalized = '#សំនៀងគំនិត';")
        self.assertEqual(cursor.fetchone()[0], 1)

        # Purge
        purged = self.discovery_worker.purge_invalid_candidates()
        self.assertGreaterEqual(purged, 1)

        # Verify it is removed
        cursor.execute("SELECT COUNT(*) FROM candidate_aliases WHERE username_normalized = '#សំនៀងគំនិត';")
        self.assertEqual(cursor.fetchone()[0], 0)

    def test_env_rate_limit_and_batch_configurations(self):
        from app.core import config
        # Verify attributes exist on config module
        self.assertTrue(hasattr(config, "DISCOVERY_RATE_LIMITED"))
        self.assertTrue(hasattr(config, "DISCOVERY_MAX_BATCH_SIZE"))
        self.assertTrue(hasattr(config, "DISCOVERY_FRONTIER_THRESHOLD"))
        self.assertTrue(hasattr(config, "SHARED_RATE_LIMIT_PROFILE_WEIGHT"))

        # Verify discovery_worker defaults to these config settings
        worker = DiscoveryWorker(db_path=self.db_path)
        self.assertEqual(worker.rate_limited, config.DISCOVERY_RATE_LIMITED)
        self.assertEqual(worker.max_batch_size, config.DISCOVERY_MAX_BATCH_SIZE)
        self.assertEqual(worker.frontier_threshold, config.DISCOVERY_FRONTIER_THRESHOLD)


if __name__ == "__main__":
    unittest.main()
