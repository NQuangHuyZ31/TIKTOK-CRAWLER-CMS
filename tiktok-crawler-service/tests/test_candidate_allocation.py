import asyncio
from pathlib import Path
import tempfile
import unittest

from tests._async_compat import patch_windows_self_pipe_if_needed
patch_windows_self_pipe_if_needed()

from app.api.routes import CrawlRequest, _resolve_targets
from app.engine.candidate_manager import CandidateManager
from app.engine.schema import initialize_database
from app.repositories.candidate_repo import CandidateRepository
from app.repositories.queue_store import QueueStore


class TestCandidateAllocationNoDuplication(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.db_path = Path(self.tmp_dir.name) / "test_queue.db"
        init_conn = initialize_database(self.db_path)
        init_conn.close()

        self.store = QueueStore(self.db_path)
        self.repo = CandidateRepository(self.db_path)
        self.manager = CandidateManager(self.db_path, repo=self.repo)

        # Seed 10 fresh discovery candidates and 10 historical candidates
        for i in range(1, 11):
            self.manager.upsert_candidate_identity(
                username=f"fresh_user_{i}",
                allocation_class="fresh_discovery",
                source_type="test",
                source_reference="seed",
            )
        for i in range(1, 11):
            res = self.manager.upsert_candidate_identity(
                username=f"hist_user_{i}",
                allocation_class="historical",
                source_type="test",
                source_reference="seed",
            )
            # Mark historical by bumping crawl count
            self.repo.mark_candidate_crawled(f"hist_user_{i}")

    def tearDown(self):
        if hasattr(self.store, "_conn") and self.store._conn:
            self.store._conn.close()
        self.tmp_dir.cleanup()

    def test_sample_balanced_splits_evenly_and_interleaved(self):
        # Request 10 accounts -> 5 historical, 5 fresh
        targets = self.repo.sample_targets_balanced(count=10)
        self.assertEqual(len(targets), 10)
        fresh_in_targets = [u for u in targets if u.startswith("fresh_user_")]
        hist_in_targets = [u for u in targets if u.startswith("hist_user_")]
        self.assertEqual(len(fresh_in_targets), 5)
        self.assertEqual(len(hist_in_targets), 5)

        # Verify 1:1 interleaving: alternating between hist and fresh
        for idx in range(len(targets)):
            if idx % 2 == 0:
                self.assertTrue(targets[idx].startswith("hist_user_"), f"Expected hist at index {idx}, got {targets[idx]}")
            else:
                self.assertTrue(targets[idx].startswith("fresh_user_"), f"Expected fresh at index {idx}, got {targets[idx]}")

    def test_job2_excludes_active_job1_targets(self):
        # Job 1 requests 8 accounts (4 fresh, 4 historical)
        req1 = CrawlRequest(job_id=101, source_type="count", total_accounts=8)
        targets1 = _resolve_targets(
            request=req1,
            dataset_loader=None,
            candidate_repo=self.repo,
            queue_store=self.store,
        )
        self.assertEqual(len(targets1), 8)

        # Simulate Job 1 saved to store in 'queued' status
        self.store.upsert_job_sync(
            job_id=101,
            source_type="count",
            targets=targets1,
        )

        active = self.store.get_active_job_targets_sync()
        self.assertEqual(len(active), 8)
        for t in targets1:
            self.assertIn(t.lower(), active)

        # Job 2 now requests 8 accounts (different job_id=102)
        req2 = CrawlRequest(job_id=102, source_type="count", total_accounts=8)
        targets2 = _resolve_targets(
            request=req2,
            dataset_loader=None,
            candidate_repo=self.repo,
            queue_store=self.store,
        )
        self.assertEqual(len(targets2), 8)

        # Check ZERO OVERLAP between Job 1 and Job 2 targets
        overlap = set(targets1).intersection(set(targets2))
        self.assertEqual(overlap, set(), f"Job 2 overlapped with Job 1 targets: {overlap}")

    def test_mark_candidate_crawled_promotes_to_historical(self):
        # Verify fresh_user_1 is initially in fresh_discovery with crawl_count = 0
        conn = self.repo._get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT p.crawl_count, p.last_crawled_at_ms, p.allocation_class
            FROM candidate_aliases a
            JOIN candidate_pool p ON a.candidate_id = p.candidate_id
            WHERE a.username_normalized = 'fresh_user_1';
            """
        )
        row = cur.fetchone()
        conn.close()
        self.assertEqual(row[0], 0)
        self.assertIsNone(row[1])
        self.assertEqual(row[2], "fresh_discovery")

        # Mark crawled
        self.repo.mark_candidate_crawled("fresh_user_1")

        conn = self.repo._get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT p.crawl_count, p.last_crawled_at_ms, p.allocation_class
            FROM candidate_aliases a
            JOIN candidate_pool p ON a.candidate_id = p.candidate_id
            WHERE a.username_normalized = 'fresh_user_1';
            """
        )
        row_after = cur.fetchone()
        conn.close()
        self.assertEqual(row_after[0], 1)
        self.assertIsNotNone(row_after[1])
        self.assertEqual(row_after[2], "historical")

    def test_batch_locking_and_release(self):
        # Sample 4 targets for job 201 (2 historical, 2 fresh interleaved)
        targets = self.repo.sample_targets_balanced(count=4)
        self.assertEqual(len(targets), 4)
        # Initially not locked in DB (Just-In-Time)
        self.assertEqual(self.repo.get_active_locked_count(), 0)

        # Worker leases/locks batch of 4 targets
        locked = self.repo.batch_lock_fresh_candidates(targets, job_id=201)
        # Only the 2 fresh candidates in the batch are locked
        self.assertEqual(len(locked), 2)
        self.assertEqual(self.repo.get_active_locked_count(), 2)

        # Job 202 requests fresh candidates; locked candidates cannot be chosen
        targets_job2 = self.repo.sample_targets_balanced(count=4)
        fresh_sampled = [u for u in targets if u.startswith("fresh_user_")]
        fresh_job2 = [u for u in targets_job2 if u.startswith("fresh_user_")]
        for u in fresh_sampled:
            self.assertNotIn(u, fresh_job2)

        # Complete crawl for the first fresh user of job 201
        first_fresh = fresh_sampled[0]
        self.repo.mark_candidate_crawled_and_released(first_fresh, job_id=201)
        self.assertEqual(self.repo.get_active_locked_count(), 1)

        # Release unfinished assignments for job 201 (e.g. cancelled/stopped)
        released = self.repo.release_unfinished_assignments(job_id=201)
        self.assertEqual(released, 1)
        self.assertEqual(self.repo.get_active_locked_count(), 0)


if __name__ == "__main__":
    unittest.main()
